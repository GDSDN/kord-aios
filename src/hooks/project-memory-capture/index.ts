import type { PluginInput } from "@opencode-ai/plugin"
import type { ProjectMemoryClass } from "../../features/project-memory/types"
import {
  distillAndPersistProjectMemoryEvent,
  hasHighSignalCandidates,
  sanitizeCaptureEvent,
  type ProjectMemoryCaptureEvent,
  type ProjectMemoryCaptureSource,
} from "../../features/project-memory/distill"
import { readSessionMessages } from "../../tools/session-manager/storage"

const DEFAULT_WORKSPACE_ID = "workspace-default"
const DEFAULT_BRANCH = "main"

const EVENT_SOURCE_MAP: Record<string, ProjectMemoryCaptureSource> = {
  "session.stop": "session-stop",
  "session.recovery": "session-recovery",
  "session.recovered": "session-recovery",
  "checkpoint.created": "checkpoint",
  "checkpoint.completed": "checkpoint",
  "build.completed": "build",
  "story.completed": "story",
  "story.state.changed": "story",
}

export interface ProjectMemoryCaptureHookOptions {
  enabled?: boolean
  workspaceId?: string
  branch?: string
  capture?: Partial<Record<ProjectMemoryClass, boolean>>
}

interface EventEnvelope {
  event: {
    type: string
    properties?: unknown
  }
}

interface CompactionInput {
  sessionID: string
  summary?: unknown
  workspace_id?: string
  workspaceId?: string
  branch?: string
  [key: string]: unknown
}

interface CompactionOutput {
  context: string[]
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function normalizeDecisionArray(value: unknown): Array<{ summary: string; rationale?: string; tags?: string[] }> {
  if (!Array.isArray(value)) {
    return []
  }

  const decisions: Array<{ summary: string; rationale?: string; tags?: string[] }> = []

  for (const entry of value) {
    if (typeof entry === "string") {
      const summary = entry.trim()
      if (summary.length > 0) {
        decisions.push({ summary })
      }
      continue
    }

    const objectEntry = asRecord(entry)
    const summary = asString(objectEntry.summary)
    if (!summary) {
      continue
    }

    decisions.push({
      summary,
      rationale: asString(objectEntry.rationale),
      tags: asStringArray(objectEntry.tags),
    })
  }

  return decisions
}

function normalizeGotchas(value: unknown): Array<{ symptom: string; resolution?: string }> {
  if (!Array.isArray(value)) {
    return []
  }

  const gotchas: Array<{ symptom: string; resolution?: string }> = []

  for (const entry of value) {
    if (typeof entry === "string") {
      const symptom = entry.trim()
      if (symptom.length > 0) {
        gotchas.push({ symptom })
      }
      continue
    }

    const objectEntry = asRecord(entry)
    const symptom = asString(objectEntry.symptom)
    if (!symptom) {
      continue
    }

    gotchas.push({
      symptom,
      resolution: asString(objectEntry.resolution),
    })
  }

  return gotchas
}

function normalizeEntities(value: unknown): Array<{ name: string; type?: string }> {
  if (!Array.isArray(value)) {
    return []
  }

  const entities: Array<{ name: string; type?: string }> = []

  for (const entry of value) {
    if (typeof entry === "string") {
      const name = entry.trim()
      if (name.length > 0) {
        entities.push({ name })
      }
      continue
    }

    const objectEntry = asRecord(entry)
    const name = asString(objectEntry.name)
    if (!name) {
      continue
    }

    entities.push({
      name,
      type: asString(objectEntry.type),
    })
  }

  return entities
}

function normalizeCapturePayload(payload: unknown): Partial<ProjectMemoryCaptureEvent> {
  if (typeof payload === "string") {
    return { summary: payload }
  }

  const source = asRecord(payload)
  return {
    summary: asString(source.summary) ?? asString(source.summary_text),
    decisions: normalizeDecisionArray(source.decisions),
    constraints: asStringArray(source.constraints),
    preferences: asStringArray(source.preferences),
    remaining_tasks:
      asStringArray(source.remaining_tasks).length > 0
        ? asStringArray(source.remaining_tasks)
        : asStringArray(source.tasks_remaining),
    artifacts: asStringArray(source.artifacts),
    entities: normalizeEntities(source.entities),
    gotchas: normalizeGotchas(source.gotchas),
    supporting_paths:
      asStringArray(source.supporting_paths).length > 0
        ? asStringArray(source.supporting_paths)
        : asStringArray(source.files),
    raw_transcript: asString(source.raw_transcript),
    captured_at: asString(source.captured_at),
  }
}

function resolveBoundarySource(eventType: string): ProjectMemoryCaptureSource | null {
  if (EVENT_SOURCE_MAP[eventType]) {
    return EVENT_SOURCE_MAP[eventType]
  }

  if (eventType.includes("checkpoint")) {
    return "checkpoint"
  }

  if (eventType.includes("build")) {
    return "build"
  }

  if (eventType.includes("story")) {
    return "story"
  }

  return null
}

async function summarizeSessionFromHistory(sessionID: string): Promise<string | undefined> {
  const messages = await readSessionMessages(sessionID)
  if (messages.length === 0) {
    return undefined
  }

  const assistantTexts: string[] = []
  for (const message of messages) {
    if (message.role !== "assistant") {
      continue
    }

    for (const part of message.parts) {
      if (!part || typeof part !== "object") {
        continue
      }

      const typedPart = part as { type?: string; text?: string }
      if (typedPart.type === "text" && typeof typedPart.text === "string") {
        const text = typedPart.text.trim()
        if (text.length > 0) {
          assistantTexts.push(text)
        }
      }
    }
  }

  if (assistantTexts.length === 0) {
    return undefined
  }

  return assistantTexts.slice(-3).join("\n\n").slice(0, 2500)
}

export function createProjectMemoryCaptureHook(
  ctx: PluginInput,
  options: ProjectMemoryCaptureHookOptions = {},
) {
  const isEnabled = options.enabled ?? true

  const captureAtBoundary = async (
    source: ProjectMemoryCaptureSource,
    sessionID: string | undefined,
    payload: Partial<ProjectMemoryCaptureEvent>,
    workspaceIdOverride?: string,
    branchOverride?: string,
  ): Promise<void> => {
    if (!isEnabled) {
      return
    }

    const workspaceId = workspaceIdOverride ?? options.workspaceId ?? DEFAULT_WORKSPACE_ID
    const branch = branchOverride ?? options.branch ?? DEFAULT_BRANCH

    const candidate: ProjectMemoryCaptureEvent = {
      source,
      session_id: sessionID,
      captured_at: payload.captured_at ?? new Date().toISOString(),
      summary: payload.summary,
      decisions: payload.decisions,
      constraints: payload.constraints,
      preferences: payload.preferences,
      remaining_tasks: payload.remaining_tasks,
      artifacts: payload.artifacts,
      entities: payload.entities,
      gotchas: payload.gotchas,
      supporting_paths: payload.supporting_paths,
      raw_transcript: payload.raw_transcript,
    }

    if (!hasHighSignalCandidates(candidate) && sessionID) {
      const historySummary = await summarizeSessionFromHistory(sessionID)
      if (historySummary) {
        candidate.summary = historySummary
      }
    }

    const sanitized = sanitizeCaptureEvent(candidate)
    if (!hasHighSignalCandidates(sanitized)) {
      return
    }

    distillAndPersistProjectMemoryEvent(ctx.directory, sanitized, {
      workspaceId,
      branch,
      capture: options.capture,
    })
  }

  const event = async ({ event }: EventEnvelope): Promise<void> => {
    const source = resolveBoundarySource(event.type)
    if (!source) {
      return
    }

    const properties = asRecord(event.properties)
    const info = asRecord(properties.info)
    const payload = normalizeCapturePayload(
      properties.summary
      ?? properties.memory
      ?? properties.capture
      ?? properties.compaction
      ?? properties.payload,
    )

    await captureAtBoundary(
      source,
      asString(info.id) ?? asString(properties.sessionID),
      payload,
      asString(properties.workspace_id) ?? asString(properties.workspaceId),
      asString(properties.branch) ?? asString(info.branch),
    )
  }

  const compacting = async (
    input: CompactionInput,
    _output: CompactionOutput,
  ): Promise<void> => {
    const payload = normalizeCapturePayload(input.summary ?? input.payload ?? input)

    await captureAtBoundary(
      "compaction",
      input.sessionID,
      payload,
      asString(input.workspace_id) ?? asString(input.workspaceId),
      asString(input.branch),
    )
  }

  return {
    event,
    "experimental.session.compacting": compacting,
  }
}
