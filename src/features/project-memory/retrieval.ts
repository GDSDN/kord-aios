import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { Database } from "bun:sqlite"
import type { ProjectMemoryBudgets } from "../../config/schema"
import { readSessionMessages } from "../../tools/session-manager/storage"
import type { SessionMessage } from "../../tools/session-manager/types"
import { getProjectMemoryStorageLayout } from "./storage"
import type { ProjectMemoryClass, ProjectMemoryRecord } from "./types"

const DEFAULT_MAX_ITEMS = 24
const DEFAULT_MAX_TOKENS = 2048
const DEFAULT_MIN_FRESHNESS = 0.05
const MAX_SESSION_EVIDENCE_ITEMS = 4
const MAX_SESSION_SNIPPET_CHARS = 200

type RetrievalSource = "durable" | "local-fts" | "session-fallback"

export interface RetrievedMemoryItem {
  id: string
  class: ProjectMemoryClass | "session-evidence"
  summary: string
  source: RetrievalSource
  score: number
  freshness: number
  tokens: number
  workspace_id: string
  branch: string
  updated_at: string
  record?: ProjectMemoryRecord
  session_evidence?: {
    session_id: string
    message_id: string
    role: "assistant" | "user"
  }
}

export interface ProjectMemoryRetrievalOptions {
  projectRoot: string
  workspaceId: string
  branch: string
  query: string
  activeThreadId?: string
  sessionId?: string
  now?: string
  maxItems?: number
  maxTokens?: number
  minimumFreshness?: number
  budgets?: Partial<ProjectMemoryBudgets>
  sessionReader?: (sessionID: string) => Promise<SessionMessage[]>
}

export interface ProjectMemoryRetrievalResult {
  items: RetrievedMemoryItem[]
  totals: {
    considered: number
    truncated: number
    tokens: number
    item_budget: number
    token_budget: number
  }
  index_path: string
}

interface TimelineEventRecord {
  record?: unknown
}

interface TimelineFilePayload {
  data?: {
    events?: unknown
  }
}

interface ActiveContextFilePayload {
  data?: {
    active_context?: unknown
  }
}

interface BranchMetadataFilePayload {
  data?: {
    durable_cursor?: unknown
  }
}

interface DurableCandidate {
  item: RetrievedMemoryItem
  activeThread: boolean
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeKey(value: string): string {
  return normalizeSpace(value).toLowerCase()
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
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

function computeFreshness(iso: string, nowIso: string): number {
  const updatedMs = new Date(iso).getTime()
  const nowMs = new Date(nowIso).getTime()

  if (!Number.isFinite(updatedMs) || !Number.isFinite(nowMs)) {
    return 0.5
  }

  const ageDays = Math.max(0, (nowMs - updatedMs) / (1000 * 60 * 60 * 24))
  const horizonDays = 180
  const freshness = 1 - ageDays / horizonDays
  return Math.min(1, Math.max(0, freshness))
}

function getClassPriority(className: ProjectMemoryClass | "session-evidence", activeThread: boolean): number {
  if (className === "session-evidence") {
    return 300
  }

  if (className === "thread" && activeThread) {
    return 1000
  }

  if (className === "constraint") {
    return 850
  }

  if (className === "preference") {
    return 840
  }

  if (className === "decision") {
    return 700
  }

  if (className === "gotcha") {
    return 690
  }

  if (className === "artifact") {
    return 500
  }

  if (className === "entity") {
    return 480
  }

  if (className === "thread") {
    return 460
  }

  return 400
}

function isProjectMemoryClass(value: string): value is ProjectMemoryClass {
  return (
    value === "decision"
    || value === "constraint"
    || value === "preference"
    || value === "thread"
    || value === "artifact"
    || value === "entity"
    || value === "gotcha"
  )
}

function isProjectMemoryRecord(value: unknown): value is ProjectMemoryRecord {
  const record = asRecord(value)
  const className = asString(record.class)

  return Boolean(
    asString(record.id)
    && className
    && isProjectMemoryClass(className)
    && asString(record.summary)
    && asString(record.workspace_id)
    && asString(record.branch),
  )
}

function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const raw = readFileSync(filePath, "utf8")
    return JSON.parse(raw) as T
  }
  catch {
    return null
  }
}

function isActiveThreadRecord(
  record: ProjectMemoryRecord,
  activeThreadId: string | undefined,
  activeContext: string | undefined,
): boolean {
  if (record.class !== "thread") {
    return false
  }

  if (activeThreadId) {
    return record.thread_id === activeThreadId || record.id === activeThreadId
  }

  if (activeContext) {
    return normalizeKey(record.summary) === normalizeKey(activeContext)
  }

  return false
}

function toFtsQuery(query: string): string | null {
  const tokens = Array.from(new Set(
    (query.match(/[A-Za-z0-9._/-]+/g) ?? [])
      .map((token) => normalizeKey(token))
      .filter((token) => token.length > 1),
  ))

  if (tokens.length === 0) {
    return null
  }

  return tokens
    .map((token) => `"${token.replace(/"/g, "")}"`)
    .join(" OR ")
}

function getRecordTextSegments(record: ProjectMemoryRecord): {
  rationale: string
  artifactPath: string
  tags: string
} {
  const rationale = record.class === "decision"
    ? normalizeSpace(record.rationale)
    : ""

  const artifactPath = record.class === "artifact"
    ? normalizeSpace(record.artifact_path)
    : ""

  const tags = Array.isArray(record.tags)
    ? record.tags.map((tag) => normalizeSpace(tag)).filter((tag) => tag.length > 0).join(" ")
    : ""

  return {
    rationale,
    artifactPath,
    tags,
  }
}

function queryLocalFts(
  indexPath: string,
  records: ProjectMemoryRecord[],
  query: string,
): Map<string, number> {
  const indexDir = join(indexPath, "..")
  mkdirSync(indexDir, { recursive: true })

  const db = new Database(indexPath)

  try {
    db.exec("PRAGMA journal_mode = WAL;")
    db.exec(`
      CREATE TABLE IF NOT EXISTS memory_records (
        record_id TEXT PRIMARY KEY,
        class TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        branch TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        summary TEXT NOT NULL,
        payload TEXT NOT NULL
      );
    `)

    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
        record_id UNINDEXED,
        summary,
        rationale,
        artifact_path,
        tags,
        tokenize='unicode61'
      );
    `)

    db.exec("DELETE FROM memory_records;")
    db.exec("DELETE FROM memory_fts;")

    const insertRecord = db.prepare(`
      INSERT INTO memory_records (
        record_id,
        class,
        workspace_id,
        branch,
        updated_at,
        summary,
        payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?);
    `)

    const insertFts = db.prepare(`
      INSERT INTO memory_fts (
        record_id,
        summary,
        rationale,
        artifact_path,
        tags
      ) VALUES (?, ?, ?, ?, ?);
    `)

    for (const record of records) {
      const text = getRecordTextSegments(record)
      insertRecord.run(
        record.id,
        record.class,
        record.workspace_id,
        record.branch,
        record.updated_at,
        record.summary,
        JSON.stringify(record),
      )
      insertFts.run(
        record.id,
        record.summary,
        text.rationale,
        text.artifactPath,
        text.tags,
      )
    }

    const ftsQuery = toFtsQuery(query)
    if (!ftsQuery) {
      return new Map()
    }

    const rows = db
      .query("SELECT record_id, bm25(memory_fts) AS rank FROM memory_fts WHERE memory_fts MATCH ? ORDER BY rank LIMIT 200")
      .all(ftsQuery) as Array<{ record_id: string, rank: number }>

    const scoreByRecord = new Map<string, number>()

    for (const row of rows) {
      const rank = Number.isFinite(row.rank) ? row.rank : 1
      const normalizedRank = Math.max(0, rank)
      const boost = 120 / (1 + normalizedRank)
      scoreByRecord.set(row.record_id, boost)
    }

    return scoreByRecord
  }
  catch {
    return new Map()
  }
  finally {
    db.close()
  }
}

function getActiveContextSummary(activeContextPath: string): string | undefined {
  const payload = readJson<ActiveContextFilePayload>(activeContextPath)
  return asString(payload?.data?.active_context)
}

function getBranchCursorSessionId(branchMetadataPath: string): string | undefined {
  const payload = readJson<BranchMetadataFilePayload>(branchMetadataPath)
  return asString(payload?.data?.durable_cursor)
}

function resolveBudgets(options: ProjectMemoryRetrievalOptions): {
  itemBudget: number
  tokenBudget: number
} {
  const maxItemsFromConfig = options.budgets?.durable_records ?? Number.MAX_SAFE_INTEGER
  const derivedTokenBudget = Math.max(
    64,
    Math.floor((options.budgets?.local_cache_bytes ?? 25_000_000) / 4),
  )

  const itemBudget = Math.max(
    1,
    Math.min(options.maxItems ?? DEFAULT_MAX_ITEMS, maxItemsFromConfig),
  )

  const tokenBudget = Math.max(
    1,
    Math.min(options.maxTokens ?? DEFAULT_MAX_TOKENS, derivedTokenBudget),
  )

  return {
    itemBudget,
    tokenBudget,
  }
}

function scoreCandidate(
  className: ProjectMemoryClass | "session-evidence",
  activeThread: boolean,
  freshness: number,
  ftsBoost: number,
): number {
  const classPriority = getClassPriority(className, activeThread)
  return classPriority + (freshness * 100) + ftsBoost
}

function collectDurableCandidates(
  options: ProjectMemoryRetrievalOptions,
  nowIso: string,
  minimumFreshness: number,
): {
  candidates: DurableCandidate[]
  indexPath: string
  branchMetadataPath: string | null
} {
  const layout = getProjectMemoryStorageLayout(options.projectRoot, {
    workspaceId: options.workspaceId,
    branch: options.branch,
  })

  const timelineDescriptor = layout.files.find((file) => file.key === "timeline")
  const activeContextDescriptor = layout.files.find((file) => file.key === "active-context")
  const branchMetadataDescriptor = layout.files.find((file) => file.key === "branch-metadata")
  const activeContextSummary = activeContextDescriptor
    ? getActiveContextSummary(activeContextDescriptor.path)
    : undefined

  if (!timelineDescriptor) {
    return {
      candidates: [],
      indexPath: join(layout.localRoot, "search-index.db"),
      branchMetadataPath: branchMetadataDescriptor?.path ?? null,
    }
  }

  const timeline = readJson<TimelineFilePayload>(timelineDescriptor.path)
  const events = Array.isArray(timeline?.data?.events)
    ? timeline?.data?.events as unknown[]
    : []

  const candidates: DurableCandidate[] = []

  for (const event of events) {
    const eventRecord = asRecord(event) as TimelineEventRecord
    const maybeRecord = eventRecord.record

    if (!isProjectMemoryRecord(maybeRecord)) {
      continue
    }

    if (maybeRecord.workspace_id !== options.workspaceId || maybeRecord.branch !== options.branch) {
      continue
    }

    const updatedAt = parseIsoDate(maybeRecord.updated_at, nowIso)
    const freshness = computeFreshness(updatedAt, nowIso)
    if (freshness < minimumFreshness) {
      continue
    }

    const activeThread = isActiveThreadRecord(
      maybeRecord,
      options.activeThreadId,
      activeContextSummary,
    )

    const tokens = estimateTokens(maybeRecord.summary)

    candidates.push({
      activeThread,
      item: {
        id: maybeRecord.id,
        class: maybeRecord.class,
        summary: maybeRecord.summary,
        source: "durable",
        score: scoreCandidate(maybeRecord.class, activeThread, freshness, 0),
        freshness,
        tokens,
        workspace_id: maybeRecord.workspace_id,
        branch: maybeRecord.branch,
        updated_at: updatedAt,
        record: maybeRecord,
      },
    })
  }

  return {
    candidates,
    indexPath: join(layout.localRoot, "search-index.db"),
    branchMetadataPath: branchMetadataDescriptor?.path ?? null,
  }
}

function rankCandidates(items: RetrievedMemoryItem[]): RetrievedMemoryItem[] {
  return [...items].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score
    }

    const aMs = new Date(a.updated_at).getTime()
    const bMs = new Date(b.updated_at).getTime()
    if (aMs !== bMs) {
      return bMs - aMs
    }

    return a.id.localeCompare(b.id)
  })
}

function applyBudgets(
  items: RetrievedMemoryItem[],
  itemBudget: number,
  tokenBudget: number,
): {
  selected: RetrievedMemoryItem[]
  tokens: number
  truncated: number
} {
  const selected: RetrievedMemoryItem[] = []
  let tokenTotal = 0

  for (const item of items) {
    if (selected.length >= itemBudget) {
      break
    }

    if (item.tokens > tokenBudget) {
      continue
    }

    if (tokenTotal + item.tokens > tokenBudget) {
      continue
    }

    selected.push(item)
    tokenTotal += item.tokens
  }

  return {
    selected,
    tokens: tokenTotal,
    truncated: Math.max(0, items.length - selected.length),
  }
}

function selectSessionIds(
  explicitSessionId: string | undefined,
  branchCursorSessionId: string | undefined,
  durableRecords: ProjectMemoryRecord[],
): string[] {
  const ids: string[] = []
  const add = (value: string | undefined) => {
    if (!value) return
    if (!ids.includes(value)) {
      ids.push(value)
    }
  }

  add(explicitSessionId)
  add(branchCursorSessionId)

  const fromDurable = durableRecords
    .map((record) => record.source_session_id)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)

  for (const id of fromDurable) {
    add(id)
    if (ids.length >= 4) {
      break
    }
  }

  return ids
}

async function collectSessionEvidence(
  options: ProjectMemoryRetrievalOptions,
  nowIso: string,
  sessionIds: string[],
): Promise<RetrievedMemoryItem[]> {
  if (sessionIds.length === 0) {
    return []
  }

  const readSession = options.sessionReader ?? readSessionMessages
  const queryTokens = Array.from(new Set(
    (options.query.match(/[A-Za-z0-9._/-]+/g) ?? [])
      .map((token) => normalizeKey(token))
      .filter((token) => token.length > 1),
  ))

  const evidence: RetrievedMemoryItem[] = []

  for (const sessionID of sessionIds) {
    const messages = await readSession(sessionID)

    for (const message of messages) {
      if (message.role !== "assistant") {
        continue
      }

      for (const part of message.parts) {
        if (part.type !== "text" || typeof part.text !== "string") {
          continue
        }

        const summary = normalizeSpace(part.text).slice(0, MAX_SESSION_SNIPPET_CHARS)
        if (summary.length === 0) {
          continue
        }

        if (queryTokens.length > 0) {
          const normalizedSummary = normalizeKey(summary)
          const hasMatch = queryTokens.some((token) => normalizedSummary.includes(token))
          if (!hasMatch) {
            continue
          }
        }

        const createdIso = parseIsoDate(
          typeof message.time?.created === "number"
            ? new Date(message.time.created).toISOString()
            : undefined,
          nowIso,
        )
        const freshness = computeFreshness(createdIso, nowIso)
        const tokens = estimateTokens(summary)

        evidence.push({
          id: `session-${sessionID}-${message.id}-${part.id}`,
          class: "session-evidence",
          summary,
          source: "session-fallback",
          score: scoreCandidate("session-evidence", false, freshness, 0),
          freshness,
          tokens,
          workspace_id: options.workspaceId,
          branch: options.branch,
          updated_at: createdIso,
          session_evidence: {
            session_id: sessionID,
            message_id: message.id,
            role: message.role,
          },
        })

        if (evidence.length >= MAX_SESSION_EVIDENCE_ITEMS) {
          return evidence
        }
      }
    }
  }

  return evidence
}

export async function retrieveProjectMemory(
  options: ProjectMemoryRetrievalOptions,
): Promise<ProjectMemoryRetrievalResult> {
  const nowIso = parseIsoDate(options.now, new Date().toISOString())
  const minimumFreshness = options.minimumFreshness ?? DEFAULT_MIN_FRESHNESS
  const { itemBudget, tokenBudget } = resolveBudgets(options)

  const {
    candidates,
    indexPath,
    branchMetadataPath,
  } = collectDurableCandidates(options, nowIso, minimumFreshness)

  const records = candidates
    .map((candidate) => candidate.item.record)
    .filter((record): record is ProjectMemoryRecord => Boolean(record))

  const ftsScores = queryLocalFts(indexPath, records, options.query)

  const durableItems = candidates.map((candidate) => {
    const ftsBoost = ftsScores.get(candidate.item.id) ?? 0
    const source: RetrievalSource = ftsBoost > 0 ? "local-fts" : "durable"
    return {
      ...candidate.item,
      source,
      score: scoreCandidate(candidate.item.class, candidate.activeThread, candidate.item.freshness, ftsBoost),
    }
  })

  const branchCursorSessionId = branchMetadataPath
    ? getBranchCursorSessionId(branchMetadataPath)
    : undefined
  const sessionIds = selectSessionIds(options.sessionId, branchCursorSessionId, records)

  const includeSessionFallback = durableItems.length < itemBudget
  const sessionItems = includeSessionFallback
    ? await collectSessionEvidence(options, nowIso, sessionIds)
    : []

  const ranked = rankCandidates([...durableItems, ...sessionItems])
  const budgeted = applyBudgets(ranked, itemBudget, tokenBudget)

  return {
    items: budgeted.selected,
    totals: {
      considered: ranked.length,
      truncated: budgeted.truncated,
      tokens: budgeted.tokens,
      item_budget: itemBudget,
      token_budget: tokenBudget,
    },
    index_path: indexPath,
  }
}
