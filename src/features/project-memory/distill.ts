import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { getProjectMemoryStorageLayout, initializeProjectMemoryStorage } from "./storage"
import type {
  ConstraintMemoryRecord,
  DecisionMemoryRecord,
  EntityMemoryRecord,
  GotchaMemoryRecord,
  PreferenceMemoryRecord,
  ProjectMemoryClass,
  ProjectMemoryRecord,
  ThreadMemoryRecord,
} from "./types"

const PROJECT_MEMORY_CLASSES: ProjectMemoryClass[] = [
  "decision",
  "constraint",
  "preference",
  "thread",
  "artifact",
  "entity",
  "gotcha",
]

const SECRET_TOKEN_PATTERNS: RegExp[] = [
  /\bsk-(?:live|test|proj)-[A-Za-z0-9_-]{10,}\b/gi,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/gi,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{30,}\b/g,
  /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/gi,
]

const SECRET_KEY_VALUE_PATTERN =
  /\b(api[_-]?key|token|secret|password|passwd|authorization)\b\s*[:=]\s*["']?([^\s"',;]+)/gi

const MAX_SUMMARY_LENGTH = 320
const MAX_ITEMS_PER_CLASS = 12

export type ProjectMemoryCaptureSource =
  | "compaction"
  | "session-stop"
  | "session-recovery"
  | "checkpoint"
  | "build"
  | "story"

export interface ProjectMemoryDecisionCandidate {
  summary: string
  rationale?: string
  tags?: string[]
}

export interface ProjectMemoryGotchaCandidate {
  symptom: string
  resolution?: string
}

export interface ProjectMemoryEntityCandidate {
  name: string
  type?: string
}

export interface ProjectMemoryCaptureEvent {
  source: ProjectMemoryCaptureSource
  session_id?: string
  captured_at?: string
  summary?: string
  decisions?: Array<ProjectMemoryDecisionCandidate | string>
  constraints?: string[]
  preferences?: string[]
  remaining_tasks?: string[]
  artifacts?: string[]
  entities?: Array<ProjectMemoryEntityCandidate | string>
  gotchas?: Array<ProjectMemoryGotchaCandidate | string>
  supporting_paths?: string[]
  raw_transcript?: string
}

export interface ProjectMemoryDistillOptions {
  workspaceId: string
  branch: string
  capture?: Partial<Record<ProjectMemoryClass, boolean>>
  now?: string
}

export interface DistilledMemoryProvenance {
  source: ProjectMemoryCaptureSource
  session_id?: string
  captured_at: string
  supporting_paths: string[]
}

export interface DistilledMemoryScope {
  workspace_id: string
  branch: string
  scope: "workspace" | "project"
}

export interface DistilledMemoryItem {
  record: ProjectMemoryRecord
  provenance: DistilledMemoryProvenance
  confidence: number
  freshness: number
  scope: DistilledMemoryScope
}

export interface ProjectMemoryDistillationResult {
  items: DistilledMemoryItem[]
  rejected: string[]
}

export interface ProjectMemoryPersistenceResult extends ProjectMemoryDistillationResult {
  inserted: number
  skipped: number
}

interface StoredMemoryFile {
  schema: string
  data: Record<string, unknown>
  updated_at?: string
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeKey(value: string): string {
  return normalizeSpace(value).toLowerCase()
}

function ensureIsoDate(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback
  return parsed.toISOString()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isCaptureEnabled(
  className: ProjectMemoryClass,
  capture: ProjectMemoryDistillOptions["capture"],
): boolean {
  if (!capture) return true
  const configured = capture[className]
  return configured !== false
}

function toTags(values: string[] | undefined): string[] {
  if (!values) return []
  return values
    .map((tag) => normalizeSpace(tag))
    .filter((tag) => tag.length > 0)
    .slice(0, 10)
}

function normalizePathList(values: string[] | undefined): string[] {
  if (!values) return []
  return [...new Set(
    values
      .map((value) => normalizeSpace(value))
      .filter((value) => value.length > 0),
  )]
}

function toSummary(value: string): string {
  const scrubbed = scrubSecretLikeContent(value)
  return normalizeSpace(scrubbed).slice(0, MAX_SUMMARY_LENGTH)
}

function createStableId(parts: string[]): string {
  const hash = createHash("sha1").update(parts.join("|")).digest("hex")
  return `mem_${hash.slice(0, 12)}`
}

function confidenceForSource(source: ProjectMemoryCaptureSource): number {
  if (source === "compaction") return 0.92
  if (source === "checkpoint") return 0.88
  if (source === "build") return 0.86
  if (source === "story") return 0.86
  if (source === "session-recovery") return 0.82
  return 0.8
}

function freshnessFromCapturedAt(capturedAt: string, nowIso: string): number {
  const capturedMs = new Date(capturedAt).getTime()
  const nowMs = new Date(nowIso).getTime()

  if (!Number.isFinite(capturedMs) || !Number.isFinite(nowMs)) {
    return 0.5
  }

  const diffHours = Math.max(0, (nowMs - capturedMs) / (1000 * 60 * 60))
  return clamp(1 - diffHours / 168, 0.1, 1)
}

function extractSectionBullets(summary: string, sectionTitle: string): string[] {
  const escapedSection = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const sectionRegex = new RegExp(
    `##\\s*\\d+\\.\\s*${escapedSection}[\\s\\S]*?(?=\\n##\\s*\\d+\\.|$)`,
    "i",
  )
  const sectionMatch = summary.match(sectionRegex)

  if (!sectionMatch) {
    return []
  }

  return sectionMatch[0]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => normalizeSpace(line.replace(/^-+\s*/, "")))
    .filter((line) => line.length > 0)
}

function normalizeDecisionCandidates(event: ProjectMemoryCaptureEvent): ProjectMemoryDecisionCandidate[] {
  const direct = (event.decisions ?? []).map((entry) => {
    if (typeof entry === "string") {
      return { summary: entry }
    }

    return {
      summary: entry.summary,
      rationale: entry.rationale,
      tags: entry.tags,
    }
  })

  return direct.filter((entry) => normalizeSpace(entry.summary).length > 0)
}

function normalizeGotchaCandidates(event: ProjectMemoryCaptureEvent): ProjectMemoryGotchaCandidate[] {
  const direct = (event.gotchas ?? []).map((entry) => {
    if (typeof entry === "string") {
      return { symptom: entry }
    }

    return {
      symptom: entry.symptom,
      resolution: entry.resolution,
    }
  })

  return direct.filter((entry) => normalizeSpace(entry.symptom).length > 0)
}

function normalizeEntityCandidates(event: ProjectMemoryCaptureEvent): ProjectMemoryEntityCandidate[] {
  const direct = (event.entities ?? []).map((entry) => {
    if (typeof entry === "string") {
      return { name: entry }
    }

    return {
      name: entry.name,
      type: entry.type,
    }
  })

  return direct.filter((entry) => normalizeSpace(entry.name).length > 0)
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const deduped: string[] = []

  for (const value of values) {
    const key = normalizeKey(value)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    deduped.push(value)
  }

  return deduped
}

function parseCandidatesFromSummary(event: ProjectMemoryCaptureEvent): {
  constraints: string[]
  remainingTasks: string[]
} {
  if (!event.summary || normalizeSpace(event.summary).length === 0) {
    return {
      constraints: [],
      remainingTasks: [],
    }
  }

  const constraints = extractSectionBullets(event.summary, "MUST NOT Do")
  const remainingTasks = extractSectionBullets(event.summary, "Remaining Tasks")

  return {
    constraints,
    remainingTasks,
  }
}

function duplicateKeyForRecord(record: Record<string, unknown>): string {
  const className = typeof record.class === "string" ? record.class : "unknown"
  const summary = typeof record.summary === "string" ? normalizeKey(record.summary) : ""

  if (className === "decision") {
    const rationale = typeof record.rationale === "string" ? normalizeKey(record.rationale) : ""
    return `${className}|${summary}|${rationale}`
  }

  if (className === "constraint") {
    const constraint = typeof record.constraint === "string" ? normalizeKey(record.constraint) : ""
    return `${className}|${constraint || summary}`
  }

  if (className === "preference") {
    const preference = typeof record.preference === "string" ? normalizeKey(record.preference) : ""
    return `${className}|${preference || summary}`
  }

  if (className === "thread") {
    const threadId = typeof record.thread_id === "string" ? normalizeKey(record.thread_id) : ""
    return `${className}|${threadId || summary}`
  }

  if (className === "artifact") {
    const artifactPath = typeof record.artifact_path === "string" ? normalizeKey(record.artifact_path) : ""
    return `${className}|${artifactPath || summary}`
  }

  if (className === "entity") {
    const entityName = typeof record.entity_name === "string" ? normalizeKey(record.entity_name) : ""
    return `${className}|${entityName || summary}`
  }

  if (className === "gotcha") {
    const symptom = typeof record.symptom === "string" ? normalizeKey(record.symptom) : ""
    return `${className}|${symptom || summary}`
  }

  return `${className}|${summary}`
}

export function scrubSecretLikeContent(value: string): string {
  let scrubbed = value

  scrubbed = scrubbed.replace(
    SECRET_KEY_VALUE_PATTERN,
    (full, key) => `${key}=[REDACTED_SECRET]${full.includes(":") ? "" : ""}`,
  )

  for (const pattern of SECRET_TOKEN_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, "[REDACTED_SECRET]")
  }

  return scrubbed
}

function createBaseRecord(
  className: ProjectMemoryClass,
  summary: string,
  options: ProjectMemoryDistillOptions,
  capturedAt: string,
  sessionId: string | undefined,
): {
  id: string
  class: ProjectMemoryClass
  summary: string
  created_at: string
  updated_at: string
  workspace_id: string
  branch: string
  source_session_id?: string
} {
  const id = createStableId([
    className,
    options.workspaceId,
    options.branch,
    summary,
    sessionId ?? "",
  ])

  return {
    id,
    class: className,
    summary,
    created_at: capturedAt,
    updated_at: capturedAt,
    workspace_id: options.workspaceId,
    branch: options.branch,
    ...(sessionId ? { source_session_id: sessionId } : {}),
  }
}

function pushBounded<T>(target: T[], values: T[], maxItems: number): T[] {
  const next = [...target, ...values]
  return next.slice(0, maxItems)
}

export function distillProjectMemoryEvent(
  event: ProjectMemoryCaptureEvent,
  options: ProjectMemoryDistillOptions,
): ProjectMemoryDistillationResult {
  const nowIso = ensureIsoDate(options.now, new Date().toISOString())
  const capturedAt = ensureIsoDate(event.captured_at, nowIso)
  const confidence = confidenceForSource(event.source)
  const freshness = freshnessFromCapturedAt(capturedAt, nowIso)
  const supportingPaths = normalizePathList(event.supporting_paths)
  const parsedSummaryCandidates = parseCandidatesFromSummary(event)
  const maxItemsPerClass = MAX_ITEMS_PER_CLASS

  const constraints = dedupeStrings(
    pushBounded(
      [],
      [
        ...(event.constraints ?? []),
        ...parsedSummaryCandidates.constraints,
      ].map((entry) => toSummary(entry)),
      maxItemsPerClass,
    ),
  )

  const remainingTasks = dedupeStrings(
    pushBounded(
      [],
      [
        ...(event.remaining_tasks ?? []),
        ...parsedSummaryCandidates.remainingTasks,
      ].map((entry) => toSummary(entry)),
      maxItemsPerClass,
    ),
  )

  const preferences = dedupeStrings(
    (event.preferences ?? []).map((entry) => toSummary(entry)).slice(0, maxItemsPerClass),
  )

  const artifacts = dedupeStrings(
    [
      ...(event.artifacts ?? []),
      ...supportingPaths,
    ]
      .map((entry) => toSummary(entry))
      .slice(0, maxItemsPerClass),
  )

  const decisions = normalizeDecisionCandidates(event)
  const gotchas = normalizeGotchaCandidates(event)
  const entities = normalizeEntityCandidates(event)

  const items: DistilledMemoryItem[] = []
  const rejected: string[] = []

  const baseEnvelope = {
    provenance: {
      source: event.source,
      session_id: event.session_id,
      captured_at: capturedAt,
      supporting_paths: supportingPaths,
    } satisfies DistilledMemoryProvenance,
    confidence,
    freshness,
    scope: {
      workspace_id: options.workspaceId,
      branch: options.branch,
      scope: "workspace",
    } satisfies DistilledMemoryScope,
  }

  if (isCaptureEnabled("decision", options.capture)) {
    for (const decisionCandidate of decisions.slice(0, maxItemsPerClass)) {
      const summary = toSummary(decisionCandidate.summary)
      if (summary.length === 0) {
        rejected.push("decision:empty-summary")
        continue
      }

      const rationale = toSummary(
        decisionCandidate.rationale
          ?? decisionCandidate.summary,
      )

      const base = createBaseRecord(
        "decision",
        summary,
        options,
        capturedAt,
        event.session_id,
      )

      const record: DecisionMemoryRecord = {
        ...base,
        class: "decision",
        summary,
        rationale,
        tags: toTags(decisionCandidate.tags),
      }

      items.push({
        record,
        ...baseEnvelope,
      })
    }
  }

  if (isCaptureEnabled("constraint", options.capture)) {
    for (const constraintValue of constraints) {
      const base = createBaseRecord(
        "constraint",
        constraintValue,
        options,
        capturedAt,
        event.session_id,
      )

      const record: ConstraintMemoryRecord = {
        ...base,
        class: "constraint",
        summary: constraintValue,
        constraint: constraintValue,
        scope: "project",
      }

      items.push({
        record,
        ...baseEnvelope,
      })
    }
  }

  if (isCaptureEnabled("preference", options.capture)) {
    for (const preferenceValue of preferences) {
      const base = createBaseRecord(
        "preference",
        preferenceValue,
        options,
        capturedAt,
        event.session_id,
      )

      const record: PreferenceMemoryRecord = {
        ...base,
        class: "preference",
        summary: preferenceValue,
        preference: preferenceValue,
        weight: confidence,
      }

      items.push({
        record,
        ...baseEnvelope,
      })
    }
  }

  if (isCaptureEnabled("thread", options.capture)) {
    for (const task of remainingTasks) {
      const threadId = createStableId([
        "thread",
        options.workspaceId,
        options.branch,
        task,
      ])

      const base = createBaseRecord(
        "thread",
        task,
        options,
        capturedAt,
        event.session_id,
      )

      const record: ThreadMemoryRecord = {
        ...base,
        class: "thread",
        summary: task,
        thread_id: threadId,
        status: "open",
      }

      items.push({
        record,
        ...baseEnvelope,
      })
    }
  }

  if (isCaptureEnabled("artifact", options.capture)) {
    for (const artifactPath of artifacts) {
      const base = createBaseRecord(
        "artifact",
        artifactPath,
        options,
        capturedAt,
        event.session_id,
      )

      items.push({
        record: {
          ...base,
          class: "artifact",
          summary: artifactPath,
          artifact_path: artifactPath,
          artifact_kind: artifactPath.endsWith(".md") ? "doc" : "code",
        },
        ...baseEnvelope,
      })
    }
  }

  if (isCaptureEnabled("entity", options.capture)) {
    for (const entityCandidate of entities.slice(0, maxItemsPerClass)) {
      const entityName = toSummary(entityCandidate.name)
      if (!entityName) {
        rejected.push("entity:empty-name")
        continue
      }

      const base = createBaseRecord(
        "entity",
        entityName,
        options,
        capturedAt,
        event.session_id,
      )

      const record: EntityMemoryRecord = {
        ...base,
        class: "entity",
        summary: entityName,
        entity_name: entityName,
        entity_type: entityCandidate.type ? toSummary(entityCandidate.type) : undefined,
      }

      items.push({
        record,
        ...baseEnvelope,
      })
    }
  }

  if (isCaptureEnabled("gotcha", options.capture)) {
    for (const gotchaCandidate of gotchas.slice(0, maxItemsPerClass)) {
      const symptom = toSummary(gotchaCandidate.symptom)
      if (!symptom) {
        rejected.push("gotcha:empty-symptom")
        continue
      }

      const base = createBaseRecord(
        "gotcha",
        symptom,
        options,
        capturedAt,
        event.session_id,
      )

      const record: GotchaMemoryRecord = {
        ...base,
        class: "gotcha",
        summary: symptom,
        symptom,
        resolution: gotchaCandidate.resolution
          ? toSummary(gotchaCandidate.resolution)
          : undefined,
      }

      items.push({
        record,
        ...baseEnvelope,
      })
    }
  }

  return {
    items: suppressDuplicateMemoryItems(items),
    rejected,
  }
}

export function suppressDuplicateMemoryItems(items: DistilledMemoryItem[]): DistilledMemoryItem[] {
  const unique: DistilledMemoryItem[] = []
  const seen = new Set<string>()

  for (const item of items) {
    const key = duplicateKeyForRecord(item.record as unknown as Record<string, unknown>)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    unique.push(item)
  }

  return unique
}

function readMemoryFile(filePath: string): StoredMemoryFile {
  const raw = readFileSync(filePath, "utf8")
  const parsed = JSON.parse(raw) as StoredMemoryFile
  if (!parsed || typeof parsed !== "object" || typeof parsed.data !== "object" || parsed.data === null) {
    throw new Error(`Invalid project memory file format: ${filePath}`)
  }
  return parsed
}

function writeMemoryFile(filePath: string, payload: StoredMemoryFile): void {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
}

function collectExistingDuplicateKeys(timelineData: Record<string, unknown>): Set<string> {
  const keys = new Set<string>()
  const events = asArray(timelineData.events)

  for (const event of events) {
    const eventRecord = asRecord(event)
    const record = asRecord(eventRecord.record)
    const className = record.class

    if (typeof className !== "string" || !PROJECT_MEMORY_CLASSES.includes(className as ProjectMemoryClass)) {
      continue
    }

    keys.add(duplicateKeyForRecord(record))
  }

  return keys
}

function updateDecisionIndex(
  decisionIndex: StoredMemoryFile,
  item: DistilledMemoryItem,
): void {
  if (item.record.class !== "decision") {
    return
  }

  const data = decisionIndex.data
  const byId = asRecord(data.decisions_by_id)
  const byTag = asRecord(data.decisions_by_tag)

  byId[item.record.id] = {
    ...item.record,
    provenance: item.provenance,
    confidence: item.confidence,
    freshness: item.freshness,
    scope: item.scope,
  }

  const tags = Array.isArray(item.record.tags) ? item.record.tags : []
  for (const tag of tags) {
    const existing = asArray(byTag[tag]).filter((value): value is string => typeof value === "string")
    if (!existing.includes(item.record.id)) {
      byTag[tag] = [...existing, item.record.id]
    }
  }

  data.decisions_by_id = byId
  data.decisions_by_tag = byTag
}

function updateEntityIndex(entityIndex: StoredMemoryFile, item: DistilledMemoryItem): void {
  if (item.record.class !== "entity") {
    return
  }

  const data = entityIndex.data
  const byName = asRecord(data.entities_by_name)
  const byType = asRecord(data.entities_by_type)
  const entityName = item.record.entity_name

  byName[entityName] = {
    ...item.record,
    provenance: item.provenance,
    confidence: item.confidence,
    freshness: item.freshness,
    scope: item.scope,
  }

  if (item.record.entity_type) {
    const existingByType = asArray(byType[item.record.entity_type]).filter(
      (value): value is string => typeof value === "string",
    )
    if (!existingByType.includes(entityName)) {
      byType[item.record.entity_type] = [...existingByType, entityName]
    }
  }

  data.entities_by_name = byName
  data.entities_by_type = byType
}

function updateGotchas(gotchasFile: StoredMemoryFile, item: DistilledMemoryItem): void {
  if (item.record.class !== "gotcha") {
    return
  }

  const data = gotchasFile.data
  const gotchas = asArray(data.gotchas)
  const key = duplicateKeyForRecord(item.record as unknown as Record<string, unknown>)
  const hasDuplicate = gotchas.some((entry) => {
    const record = asRecord(entry)
    return duplicateKeyForRecord(record) === key
  })

  if (!hasDuplicate) {
    data.gotchas = [
      ...gotchas,
      {
        ...item.record,
        provenance: item.provenance,
        confidence: item.confidence,
        freshness: item.freshness,
        scope: item.scope,
      },
    ]
  }
}

function updateOpenThreads(openThreadsFile: StoredMemoryFile, item: DistilledMemoryItem): void {
  const threadRecord = item.record
  if (threadRecord.class !== "thread") {
    return
  }

  const data = openThreadsFile.data
  const existing = asArray(data.threads)
  const withoutCurrent = existing.filter((entry) => {
    const record = asRecord(entry)
    return record.thread_id !== threadRecord.thread_id
  })

  data.threads = [
    ...withoutCurrent,
    {
      ...threadRecord,
      provenance: item.provenance,
      confidence: item.confidence,
      freshness: item.freshness,
      scope: item.scope,
    },
  ]
}

function updateActiveContext(activeContextFile: StoredMemoryFile, item: DistilledMemoryItem): void {
  const data = activeContextFile.data
  data.last_class = item.record.class
  if (item.record.class === "thread") {
    data.active_context = item.record.summary
  }
}

function updateTimeline(timelineFile: StoredMemoryFile, item: DistilledMemoryItem): void {
  const data = timelineFile.data
  const events = asArray(data.events)

  data.events = [
    ...events,
    {
      record: item.record,
      provenance: item.provenance,
      confidence: item.confidence,
      freshness: item.freshness,
      scope: item.scope,
    },
  ]
}

export function distillAndPersistProjectMemoryEvent(
  projectRoot: string,
  event: ProjectMemoryCaptureEvent,
  options: ProjectMemoryDistillOptions,
): ProjectMemoryPersistenceResult {
  const distillation = distillProjectMemoryEvent(event, options)

  if (distillation.items.length === 0) {
    return {
      ...distillation,
      inserted: 0,
      skipped: 0,
    }
  }

  const layout = initializeProjectMemoryStorage(projectRoot, {
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

  const decisionIndex = readMemoryFile(decisionIndexPath)
  const entityIndex = readMemoryFile(entityIndexPath)
  const gotchasFile = readMemoryFile(gotchasPath)
  const openThreadsFile = readMemoryFile(openThreadsPath)
  const activeContextFile = readMemoryFile(activeContextPath)
  const timelineFile = readMemoryFile(timelinePath)

  const existingKeys = collectExistingDuplicateKeys(timelineFile.data)
  const itemsToInsert: DistilledMemoryItem[] = []

  for (const item of distillation.items) {
    const key = duplicateKeyForRecord(item.record as unknown as Record<string, unknown>)
    if (existingKeys.has(key)) {
      continue
    }
    existingKeys.add(key)
    itemsToInsert.push(item)
  }

  for (const item of itemsToInsert) {
    updateDecisionIndex(decisionIndex, item)
    updateEntityIndex(entityIndex, item)
    updateGotchas(gotchasFile, item)
    updateOpenThreads(openThreadsFile, item)
    updateActiveContext(activeContextFile, item)
    updateTimeline(timelineFile, item)
  }

  const updatedAt = new Date().toISOString()
  decisionIndex.updated_at = updatedAt
  entityIndex.updated_at = updatedAt
  gotchasFile.updated_at = updatedAt
  openThreadsFile.updated_at = updatedAt
  activeContextFile.updated_at = updatedAt
  timelineFile.updated_at = updatedAt

  writeMemoryFile(decisionIndexPath, decisionIndex)
  writeMemoryFile(entityIndexPath, entityIndex)
  writeMemoryFile(gotchasPath, gotchasFile)
  writeMemoryFile(openThreadsPath, openThreadsFile)
  writeMemoryFile(activeContextPath, activeContextFile)
  writeMemoryFile(timelinePath, timelineFile)

  return {
    items: itemsToInsert,
    rejected: distillation.rejected,
    inserted: itemsToInsert.length,
    skipped: distillation.items.length - itemsToInsert.length,
  }
}

export function hasHighSignalCandidates(event: ProjectMemoryCaptureEvent): boolean {
  return (
    (event.decisions?.length ?? 0) > 0
    || (event.constraints?.length ?? 0) > 0
    || (event.preferences?.length ?? 0) > 0
    || (event.remaining_tasks?.length ?? 0) > 0
    || (event.artifacts?.length ?? 0) > 0
    || (event.entities?.length ?? 0) > 0
    || (event.gotchas?.length ?? 0) > 0
    || normalizeSpace(event.summary ?? "").length > 0
  )
}

export function sanitizeCaptureEvent(
  event: ProjectMemoryCaptureEvent,
): ProjectMemoryCaptureEvent {
  const sanitized: ProjectMemoryCaptureEvent = {
    ...event,
    summary: event.summary ? scrubSecretLikeContent(event.summary) : undefined,
    decisions: event.decisions?.map((entry) => {
      if (typeof entry === "string") {
        return scrubSecretLikeContent(entry)
      }

      return {
        ...entry,
        summary: scrubSecretLikeContent(entry.summary),
        rationale: entry.rationale ? scrubSecretLikeContent(entry.rationale) : undefined,
      }
    }),
    constraints: event.constraints?.map((entry) => scrubSecretLikeContent(entry)),
    preferences: event.preferences?.map((entry) => scrubSecretLikeContent(entry)),
    remaining_tasks: event.remaining_tasks?.map((entry) => scrubSecretLikeContent(entry)),
    artifacts: event.artifacts?.map((entry) => scrubSecretLikeContent(entry)),
    entities: event.entities?.map((entry) => {
      if (typeof entry === "string") {
        return scrubSecretLikeContent(entry)
      }

      return {
        ...entry,
        name: scrubSecretLikeContent(entry.name),
        type: entry.type ? scrubSecretLikeContent(entry.type) : undefined,
      }
    }),
    gotchas: event.gotchas?.map((entry) => {
      if (typeof entry === "string") {
        return scrubSecretLikeContent(entry)
      }

      return {
        ...entry,
        symptom: scrubSecretLikeContent(entry.symptom),
        resolution: entry.resolution
          ? scrubSecretLikeContent(entry.resolution)
          : undefined,
      }
    }),
  }

  if (sanitized.raw_transcript) {
    delete sanitized.raw_transcript
  }

  return sanitized
}

export function loadExistingProjectMemoryRecords(
  projectRoot: string,
  workspaceId: string,
  branch: string,
): ProjectMemoryRecord[] {
  const layout = getProjectMemoryStorageLayout(projectRoot, { workspaceId, branch })
  const timelineFile = layout.files.find((file) => file.key === "timeline")

  if (!timelineFile) {
    return []
  }

  try {
    const raw = readFileSync(timelineFile.path, "utf8")
    const parsed = JSON.parse(raw) as StoredMemoryFile
    const events = asArray(parsed?.data?.events)
    const records: ProjectMemoryRecord[] = []

    for (const entry of events) {
      const eventRecord = asRecord(entry)
      const record = asRecord(eventRecord.record)
      const className = record.class
      const summary = record.summary

      if (
        typeof className === "string"
        && PROJECT_MEMORY_CLASSES.includes(className as ProjectMemoryClass)
        && typeof summary === "string"
      ) {
        records.push(record as unknown as ProjectMemoryRecord)
      }
    }

    return records
  }
  catch {
    return []
  }
}
