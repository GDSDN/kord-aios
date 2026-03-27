import { readFileSync, writeFileSync } from "node:fs"
import { initializeProjectMemoryStorage } from "./storage"
import type { ProjectMemoryClass, ProjectMemoryRecord } from "./types"

const PROJECT_MEMORY_CLASSES: ProjectMemoryClass[] = [
  "decision",
  "constraint",
  "preference",
  "thread",
  "artifact",
  "entity",
  "gotcha",
]

interface ProjectMemoryControlScope {
  projectRoot: string
  workspaceId: string
  branch: string
  now?: string
}

export interface ProjectMemorySearchOptions extends ProjectMemoryControlScope {
  query?: string
  limit?: number
  classes?: ProjectMemoryClass[]
}

export interface ProjectMemorySearchResult {
  items: ProjectMemoryRecord[]
  total: number
}

export interface ProjectMemoryForgetOptions extends ProjectMemoryControlScope {
  ids: string[]
  reason?: string
}

export interface ProjectMemoryForgetResult {
  forgotten: string[]
  not_found: string[]
  removed_events: number
  tombstones_added: number
}

export interface ProjectMemoryRebuildOptions extends ProjectMemoryControlScope {
  pruneOlderThanDays?: number
  maxRecords?: number
}

export interface ProjectMemoryRebuildResult {
  kept_ids: string[]
  pruned_ids: string[]
  forgotten_blocked_ids: string[]
  total_scoped_records: number
}

interface StoredMemoryFile {
  schema: string
  key: string
  durability: string
  workspace_id: string
  branch: string
  created_at: string
  updated_at: string
  provenance: Record<string, unknown>
  data: Record<string, unknown>
}

interface Scope {
  workspaceId: string
  branch: string
}

interface TimelineScopedRecordEvent {
  index: number
  event: unknown
  record: ProjectMemoryRecord
}

interface TimelineOperatorEvent {
  operation: "forget" | "prune"
  memory_id: string
  workspace_id: string
  branch: string
  at: string
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const items = value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry))

  return items.length > 0 ? items : undefined
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeKey(value: string): string {
  return normalizeSpace(value).toLowerCase()
}

function parseIsoDate(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed.toISOString()
}

function compareByUpdatedAtDesc(a: ProjectMemoryRecord, b: ProjectMemoryRecord): number {
  const aMs = new Date(a.updated_at).getTime()
  const bMs = new Date(b.updated_at).getTime()

  if (aMs !== bMs) {
    return bMs - aMs
  }

  return a.id.localeCompare(b.id)
}

function shouldReplaceByRecency(nextRecord: ProjectMemoryRecord, currentRecord: ProjectMemoryRecord): boolean {
  const nextMs = new Date(nextRecord.updated_at).getTime()
  const currentMs = new Date(currentRecord.updated_at).getTime()

  if (nextMs !== currentMs) {
    return nextMs > currentMs
  }

  return normalizeKey(nextRecord.summary) >= normalizeKey(currentRecord.summary)
}

function isKnownMemoryClass(value: string): value is ProjectMemoryClass {
  return PROJECT_MEMORY_CLASSES.includes(value as ProjectMemoryClass)
}

function toScopedRecord(event: unknown, scope: Scope, nowIso: string): ProjectMemoryRecord | null {
  const eventRecord = asRecord(event)
  const rawRecord = asRecord(eventRecord.record)
  const id = asString(rawRecord.id)
  const className = asString(rawRecord.class)
  const summary = asString(rawRecord.summary)
  const workspaceId = asString(rawRecord.workspace_id)
  const branch = asString(rawRecord.branch)

  if (!id || !className || !summary || !workspaceId || !branch) {
    return null
  }

  if (!isKnownMemoryClass(className)) {
    return null
  }

  if (workspaceId !== scope.workspaceId || branch !== scope.branch) {
    return null
  }

  const baseRecord = {
    id,
    class: className,
    summary,
    created_at: parseIsoDate(asString(rawRecord.created_at), nowIso),
    updated_at: parseIsoDate(asString(rawRecord.updated_at), nowIso),
    workspace_id: workspaceId,
    branch,
    source_session_id: asString(rawRecord.source_session_id),
    tags: asStringArray(rawRecord.tags),
  }

  if (className === "decision") {
    return {
      ...baseRecord,
      class: "decision",
      rationale: asString(rawRecord.rationale) ?? summary,
      alternatives: asStringArray(rawRecord.alternatives),
    }
  }

  if (className === "constraint") {
    const scopeValue = asString(rawRecord.scope)
    const normalizedScope = scopeValue === "project" || scopeValue === "workspace" || scopeValue === "branch"
      ? scopeValue
      : undefined

    return {
      ...baseRecord,
      class: "constraint",
      constraint: asString(rawRecord.constraint) ?? summary,
      scope: normalizedScope,
    }
  }

  if (className === "preference") {
    const rawWeight = rawRecord.weight
    const weight = typeof rawWeight === "number" && Number.isFinite(rawWeight) ? rawWeight : undefined

    return {
      ...baseRecord,
      class: "preference",
      preference: asString(rawRecord.preference) ?? summary,
      weight,
    }
  }

  if (className === "thread") {
    const status = asString(rawRecord.status)
    const normalizedStatus = status === "open" || status === "closed" || status === "deferred"
      ? status
      : undefined

    return {
      ...baseRecord,
      class: "thread",
      thread_id: asString(rawRecord.thread_id) ?? id,
      status: normalizedStatus,
    }
  }

  if (className === "artifact") {
    const kind = asString(rawRecord.artifact_kind)
    const artifactKind = kind === "code" || kind === "doc" || kind === "plan" || kind === "test"
      ? kind
      : undefined

    return {
      ...baseRecord,
      class: "artifact",
      artifact_path: asString(rawRecord.artifact_path) ?? summary,
      artifact_kind: artifactKind,
    }
  }

  if (className === "entity") {
    return {
      ...baseRecord,
      class: "entity",
      entity_name: asString(rawRecord.entity_name) ?? summary,
      entity_type: asString(rawRecord.entity_type),
    }
  }

  return {
    ...baseRecord,
    class: "gotcha",
    symptom: asString(rawRecord.symptom) ?? summary,
    resolution: asString(rawRecord.resolution),
  }
}

function toForgetOperation(event: unknown, scope: Scope): TimelineOperatorEvent | null {
  const entry = asRecord(event)
  if (entry.operation !== "forget") {
    return null
  }

  const memoryId = asString(entry.memory_id)
  const workspaceId = asString(entry.workspace_id)
  const branch = asString(entry.branch)
  const at = asString(entry.at)

  if (!memoryId || !workspaceId || !branch || !at) {
    return null
  }

  if (workspaceId !== scope.workspaceId || branch !== scope.branch) {
    return null
  }

  return {
    operation: "forget",
    memory_id: memoryId,
    workspace_id: workspaceId,
    branch,
    at,
  }
}

function tokenizeQuery(query: string): string[] {
  return Array.from(new Set(
    (query.match(/[A-Za-z0-9._/-]+/g) ?? [])
      .map((token) => normalizeKey(token))
      .filter((token) => token.length > 1),
  ))
}

function recordSearchText(record: ProjectMemoryRecord): string {
  const values: string[] = [record.class, record.summary]

  if (record.class === "decision") {
    values.push(record.rationale)
  }

  if (record.class === "constraint") {
    values.push(record.constraint)
  }

  if (record.class === "preference") {
    values.push(record.preference)
  }

  if (record.class === "thread") {
    values.push(record.thread_id)
  }

  if (record.class === "artifact") {
    values.push(record.artifact_path)
  }

  if (record.class === "entity") {
    values.push(record.entity_name)
    if (record.entity_type) {
      values.push(record.entity_type)
    }
  }

  if (record.class === "gotcha") {
    values.push(record.symptom)
    if (record.resolution) {
      values.push(record.resolution)
    }
  }

  if (Array.isArray(record.tags)) {
    values.push(...record.tags)
  }

  return normalizeKey(values.join(" "))
}

function getRequiredPaths(options: ProjectMemoryControlScope): {
  decisionIndexPath: string
  entityIndexPath: string
  gotchasPath: string
  openThreadsPath: string
  activeContextPath: string
  timelinePath: string
} {
  const layout = initializeProjectMemoryStorage(options.projectRoot, {
    workspaceId: options.workspaceId,
    branch: options.branch,
  })

  const filesByKey = new Map(layout.files.map((file) => [file.key, file.path]))
  const decisionIndexPath = filesByKey.get("decision-index")
  const entityIndexPath = filesByKey.get("entity-index")
  const gotchasPath = filesByKey.get("gotchas")
  const openThreadsPath = filesByKey.get("open-threads")
  const activeContextPath = filesByKey.get("active-context")
  const timelinePath = filesByKey.get("timeline")

  if (
    !decisionIndexPath
    || !entityIndexPath
    || !gotchasPath
    || !openThreadsPath
    || !activeContextPath
    || !timelinePath
  ) {
    throw new Error("Project memory layout is missing required durable files")
  }

  return {
    decisionIndexPath,
    entityIndexPath,
    gotchasPath,
    openThreadsPath,
    activeContextPath,
    timelinePath,
  }
}

function readStoredFile(filePath: string): StoredMemoryFile {
  const raw = readFileSync(filePath, "utf8")
  const parsed = JSON.parse(raw)
  const payload = asRecord(parsed)

  const data = asRecord(payload.data)
  return {
    schema: asString(payload.schema) ?? "kord.project-memory.file.v1",
    key: asString(payload.key) ?? "unknown",
    durability: asString(payload.durability) ?? "durable",
    workspace_id: asString(payload.workspace_id) ?? "workspace-default",
    branch: asString(payload.branch) ?? "main",
    created_at: asString(payload.created_at) ?? new Date().toISOString(),
    updated_at: asString(payload.updated_at) ?? new Date().toISOString(),
    provenance: asRecord(payload.provenance),
    data,
  }
}

function writeStoredFile(filePath: string, payload: StoredMemoryFile): void {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
}

function getScope(options: ProjectMemoryControlScope): Scope {
  return {
    workspaceId: options.workspaceId,
    branch: options.branch,
  }
}

function getNowIso(options: ProjectMemoryControlScope): string {
  return parseIsoDate(options.now, new Date().toISOString())
}

function collectForgottenIds(events: unknown[], scope: Scope): Set<string> {
  const ids = new Set<string>()

  for (const event of events) {
    const forgetEvent = toForgetOperation(event, scope)
    if (forgetEvent) {
      ids.add(forgetEvent.memory_id)
    }
  }

  return ids
}

function collectScopedRecordEvents(events: unknown[], scope: Scope, nowIso: string): TimelineScopedRecordEvent[] {
  const collected: TimelineScopedRecordEvent[] = []

  events.forEach((event, index) => {
    const record = toScopedRecord(event, scope, nowIso)
    if (!record) {
      return
    }

    collected.push({
      index,
      event,
      record,
    })
  })

  return collected
}

function isScopedRecordEvent(event: unknown, scope: Scope, nowIso: string): boolean {
  return Boolean(toScopedRecord(event, scope, nowIso))
}

function buildOperatorEvent(
  operation: "forget" | "prune",
  memoryId: string,
  scope: Scope,
  at: string,
  reason?: string,
): Record<string, unknown> {
  return {
    operation,
    memory_id: memoryId,
    workspace_id: scope.workspaceId,
    branch: scope.branch,
    at,
    reason,
    provenance: {
      source: "project-memory-controls",
      workspace_scope: "workspace",
      workspace_id: scope.workspaceId,
      branch: scope.branch,
      action: operation,
      captured_at: at,
    },
  }
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function computePruneCutoffMs(nowIso: string, pruneOlderThanDays: number | undefined): number | null {
  if (!pruneOlderThanDays || pruneOlderThanDays <= 0) {
    return null
  }

  const nowMs = new Date(nowIso).getTime()
  if (!Number.isFinite(nowMs)) {
    return null
  }

  return nowMs - (pruneOlderThanDays * 24 * 60 * 60 * 1000)
}

function rebuildIndexes(
  decisionIndexFile: StoredMemoryFile,
  entityIndexFile: StoredMemoryFile,
  gotchasFile: StoredMemoryFile,
  openThreadsFile: StoredMemoryFile,
  activeContextFile: StoredMemoryFile,
  records: ProjectMemoryRecord[],
  scope: Scope,
): void {
  const decisionsById: Record<string, unknown> = {}
  const decisionsByTag: Record<string, string[]> = {}
  const entitiesByName: Record<string, unknown> = {}
  const entitiesByType: Record<string, string[]> = {}
  const gotchaEntries: Record<string, unknown>[] = []

  const latestThreadById = new Map<string, Extract<ProjectMemoryRecord, { class: "thread" }>>()

  for (const record of records) {
    if (record.class === "decision") {
      decisionsById[record.id] = record
      const tags = Array.isArray(record.tags) ? record.tags : []
      for (const tag of tags) {
        const normalized = tag.trim()
        if (normalized.length === 0) {
          continue
        }
        const existing = decisionsByTag[normalized] ?? []
        if (!existing.includes(record.id)) {
          decisionsByTag[normalized] = [...existing, record.id]
        }
      }
    }

    if (record.class === "entity") {
      entitiesByName[record.entity_name] = record
      if (record.entity_type) {
        const existing = entitiesByType[record.entity_type] ?? []
        if (!existing.includes(record.entity_name)) {
          entitiesByType[record.entity_type] = [...existing, record.entity_name]
        }
      }
    }

    if (record.class === "gotcha") {
      gotchaEntries.push({
        ...record,
        provenance: {
          source: "project-memory-controls",
          action: "rebuild",
        },
      })
    }

    if (record.class === "thread") {
      const existing = latestThreadById.get(record.thread_id)
      if (!existing || shouldReplaceByRecency(record, existing)) {
        latestThreadById.set(record.thread_id, record)
      }
    }
  }

  const sortedRecords = [...records].sort(compareByUpdatedAtDesc)
  const latestRecord = sortedRecords[0]

  const threads = [...latestThreadById.values()].sort(compareByUpdatedAtDesc)
  const latestThread = threads[0]

  decisionIndexFile.workspace_id = scope.workspaceId
  decisionIndexFile.branch = scope.branch
  decisionIndexFile.data = {
    decisions_by_id: decisionsById,
    decisions_by_tag: decisionsByTag,
  }

  entityIndexFile.workspace_id = scope.workspaceId
  entityIndexFile.branch = scope.branch
  entityIndexFile.data = {
    entities_by_name: entitiesByName,
    entities_by_type: entitiesByType,
  }

  gotchasFile.workspace_id = scope.workspaceId
  gotchasFile.branch = scope.branch
  gotchasFile.data = {
    gotchas: gotchaEntries,
  }

  openThreadsFile.workspace_id = scope.workspaceId
  openThreadsFile.branch = scope.branch
  openThreadsFile.data = {
    threads,
  }

  activeContextFile.workspace_id = scope.workspaceId
  activeContextFile.branch = scope.branch
  activeContextFile.data = {
    active_context: latestThread?.summary ?? null,
    last_class: latestRecord?.class ?? null,
  }
}

export async function memory_search(options: ProjectMemorySearchOptions): Promise<ProjectMemorySearchResult> {
  const scope = getScope(options)
  const nowIso = getNowIso(options)
  const { timelinePath } = getRequiredPaths(options)
  const timelineFile = readStoredFile(timelinePath)
  const timelineEvents = asArray(timelineFile.data.events)

  const forgottenIds = collectForgottenIds(timelineEvents, scope)
  const scopedRecordEvents = collectScopedRecordEvents(timelineEvents, scope, nowIso)

  const deduped = new Map<string, ProjectMemoryRecord>()
  for (const entry of scopedRecordEvents) {
    if (forgottenIds.has(entry.record.id)) {
      continue
    }

    const existing = deduped.get(entry.record.id)
    if (!existing || shouldReplaceByRecency(entry.record, existing)) {
      deduped.set(entry.record.id, entry.record)
    }
  }

  const classFilter = options.classes ? new Set(options.classes) : null
  const query = options.query?.trim() ?? ""
  const queryTokens = tokenizeQuery(query)

  let records = [...deduped.values()]
  if (classFilter) {
    records = records.filter((record) => classFilter.has(record.class))
  }

  if (queryTokens.length > 0) {
    records = records.filter((record) => {
      const text = recordSearchText(record)
      return queryTokens.every((token) => text.includes(token))
    })
  }

  records.sort(compareByUpdatedAtDesc)

  const resultLimit = Math.max(1, Math.min(options.limit ?? 20, 200))
  return {
    items: records.slice(0, resultLimit),
    total: records.length,
  }
}

export async function memory_forget(options: ProjectMemoryForgetOptions): Promise<ProjectMemoryForgetResult> {
  const normalizedIds = uniqueSorted(
    options.ids
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  )

  if (normalizedIds.length === 0) {
    return {
      forgotten: [],
      not_found: [],
      removed_events: 0,
      tombstones_added: 0,
    }
  }

  const scope = getScope(options)
  const nowIso = getNowIso(options)
  const { timelinePath } = getRequiredPaths(options)
  const timelineFile = readStoredFile(timelinePath)
  const timelineEvents = asArray(timelineFile.data.events)

  const forgottenIds = collectForgottenIds(timelineEvents, scope)
  const activeScopedRecords = new Map<string, ProjectMemoryRecord>()
  for (const entry of collectScopedRecordEvents(timelineEvents, scope, nowIso)) {
    if (forgottenIds.has(entry.record.id)) {
      continue
    }

    const existing = activeScopedRecords.get(entry.record.id)
    if (!existing || shouldReplaceByRecency(entry.record, existing)) {
      activeScopedRecords.set(entry.record.id, entry.record)
    }
  }

  const foundIds: string[] = []
  const notFoundIds: string[] = []

  for (const id of normalizedIds) {
    if (activeScopedRecords.has(id)) {
      foundIds.push(id)
    }
    else {
      notFoundIds.push(id)
    }
  }

  if (foundIds.length === 0) {
    return {
      forgotten: [],
      not_found: notFoundIds,
      removed_events: 0,
      tombstones_added: 0,
    }
  }

  const foundSet = new Set(foundIds)
  let removedEvents = 0

  const filteredEvents = timelineEvents.filter((event) => {
    const scopedRecord = toScopedRecord(event, scope, nowIso)
    if (!scopedRecord) {
      return true
    }

    if (!foundSet.has(scopedRecord.id)) {
      return true
    }

    removedEvents += 1
    return false
  })

  const tombstones = foundIds.map((id) => buildOperatorEvent("forget", id, scope, nowIso, options.reason))
  timelineFile.data.events = [...filteredEvents, ...tombstones]
  timelineFile.workspace_id = scope.workspaceId
  timelineFile.branch = scope.branch
  timelineFile.updated_at = nowIso
  writeStoredFile(timelinePath, timelineFile)

  await memory_rebuild({
    projectRoot: options.projectRoot,
    workspaceId: options.workspaceId,
    branch: options.branch,
    now: nowIso,
  })

  return {
    forgotten: foundIds,
    not_found: notFoundIds,
    removed_events: removedEvents,
    tombstones_added: tombstones.length,
  }
}

export async function memory_rebuild(options: ProjectMemoryRebuildOptions): Promise<ProjectMemoryRebuildResult> {
  const scope = getScope(options)
  const nowIso = getNowIso(options)
  const {
    decisionIndexPath,
    entityIndexPath,
    gotchasPath,
    openThreadsPath,
    activeContextPath,
    timelinePath,
  } = getRequiredPaths(options)

  const timelineFile = readStoredFile(timelinePath)
  const timelineEvents = asArray(timelineFile.data.events)
  const forgottenIds = collectForgottenIds(timelineEvents, scope)
  const scopedRecordEvents = collectScopedRecordEvents(timelineEvents, scope, nowIso)

  const deduped = new Map<string, TimelineScopedRecordEvent>()
  for (const entry of scopedRecordEvents) {
    const existing = deduped.get(entry.record.id)
    if (!existing || shouldReplaceByRecency(entry.record, existing.record)) {
      deduped.set(entry.record.id, entry)
    }
  }

  const cutoffMs = computePruneCutoffMs(nowIso, options.pruneOlderThanDays)
  const maxRecords = options.maxRecords && options.maxRecords > 0 ? options.maxRecords : null

  const selectedEvents = [...deduped.values()]
  const forgottenBlockedIds: string[] = []
  const prunedIds: string[] = []
  const keptCandidates: TimelineScopedRecordEvent[] = []

  for (const entry of selectedEvents) {
    if (forgottenIds.has(entry.record.id)) {
      forgottenBlockedIds.push(entry.record.id)
      continue
    }

    if (cutoffMs !== null) {
      const updatedMs = new Date(entry.record.updated_at).getTime()
      if (Number.isFinite(updatedMs) && updatedMs < cutoffMs) {
        prunedIds.push(entry.record.id)
        continue
      }
    }

    keptCandidates.push(entry)
  }

  keptCandidates.sort((a, b) => compareByUpdatedAtDesc(a.record, b.record))

  let keptEvents = keptCandidates
  if (maxRecords !== null && keptCandidates.length > maxRecords) {
    const removed = keptCandidates.slice(maxRecords)
    prunedIds.push(...removed.map((entry) => entry.record.id))
    keptEvents = keptCandidates.slice(0, maxRecords)
  }

  const keptEventIndexes = new Set(keptEvents.map((entry) => entry.index))
  const keptRecordIds = keptEvents.map((entry) => entry.record.id)
  const prunedIdSet = new Set(prunedIds)

  const filteredTimelineEvents = timelineEvents.filter((event) => {
    const scopedRecord = toScopedRecord(event, scope, nowIso)
    if (!scopedRecord) {
      return true
    }

    const matchingEvent = scopedRecordEvents.find((entry) => entry.event === event)
    return Boolean(matchingEvent && keptEventIndexes.has(matchingEvent.index))
  })

  const pruneEvents = uniqueSorted(prunedIds)
    .filter((id) => !forgottenIds.has(id))
    .map((id) => buildOperatorEvent("prune", id, scope, nowIso, "stale-memory-prune"))

  timelineFile.data.events = [...filteredTimelineEvents, ...pruneEvents]
  timelineFile.workspace_id = scope.workspaceId
  timelineFile.branch = scope.branch
  timelineFile.updated_at = nowIso

  const decisionIndexFile = readStoredFile(decisionIndexPath)
  const entityIndexFile = readStoredFile(entityIndexPath)
  const gotchasFile = readStoredFile(gotchasPath)
  const openThreadsFile = readStoredFile(openThreadsPath)
  const activeContextFile = readStoredFile(activeContextPath)

  const keptRecords = keptEvents.map((entry) => entry.record)
  rebuildIndexes(
    decisionIndexFile,
    entityIndexFile,
    gotchasFile,
    openThreadsFile,
    activeContextFile,
    keptRecords,
    scope,
  )

  decisionIndexFile.updated_at = nowIso
  entityIndexFile.updated_at = nowIso
  gotchasFile.updated_at = nowIso
  openThreadsFile.updated_at = nowIso
  activeContextFile.updated_at = nowIso

  writeStoredFile(timelinePath, timelineFile)
  writeStoredFile(decisionIndexPath, decisionIndexFile)
  writeStoredFile(entityIndexPath, entityIndexFile)
  writeStoredFile(gotchasPath, gotchasFile)
  writeStoredFile(openThreadsPath, openThreadsFile)
  writeStoredFile(activeContextPath, activeContextFile)

  return {
    kept_ids: uniqueSorted(keptRecordIds),
    pruned_ids: uniqueSorted([...prunedIdSet]),
    forgotten_blocked_ids: uniqueSorted(forgottenBlockedIds),
    total_scoped_records: selectedEvents.length,
  }
}
