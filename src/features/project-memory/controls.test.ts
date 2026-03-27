import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memory_forget, memory_rebuild, memory_search } from "./controls"
import { initializeProjectMemoryStorage } from "./storage"

const TEST_DIRS = new Set<string>()

interface TimelineRecordSeed {
  id: string
  class: "decision" | "constraint" | "preference" | "thread" | "artifact" | "entity" | "gotcha"
  summary: string
  created_at: string
  updated_at: string
  workspace_id: string
  branch: string
  rationale?: string
  constraint?: string
  preference?: string
  thread_id?: string
  artifact_path?: string
  entity_name?: string
  symptom?: string
  tags?: string[]
}

interface TimelineOperatorSeed {
  operation: "forget" | "prune"
  memory_id: string
  workspace_id: string
  branch: string
  at: string
  provenance?: Record<string, unknown>
}

type TimelineSeedEvent =
  | {
    record: TimelineRecordSeed
    provenance?: Record<string, unknown>
    confidence?: number
    freshness?: number
    scope?: Record<string, unknown>
  }
  | TimelineOperatorSeed

describe("project-memory controls", () => {
  afterEach(() => {
    for (const testDir of TEST_DIRS) {
      if (existsSync(testDir)) {
        try {
          rmSync(testDir, { recursive: true, force: true })
        }
        catch (error) {
          const code = typeof error === "object" && error !== null && "code" in error
            ? String((error as { code?: unknown }).code)
            : ""
          if (code !== "EBUSY" && code !== "ENOENT") {
            throw error
          }
        }
      }
    }
    TEST_DIRS.clear()
  })

  test("memory_search returns only workspace-scoped matches and handles empty result sets", async () => {
    //#given
    const testDir = createTestDir("search-scope")
    initializeProjectMemoryStorage(testDir, {
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })

    seedTimeline(testDir, [
      createRecordEvent({
        id: "dec-1",
        class: "decision",
        summary: "Use retrieval ranking for workspace controls",
        created_at: "2026-03-26T10:00:00.000Z",
        updated_at: "2026-03-26T10:00:00.000Z",
        workspace_id: "workspace-a",
        branch: "feature/project-memory",
        rationale: "Matches search query",
      }),
      createRecordEvent({
        id: "dec-foreign-workspace",
        class: "decision",
        summary: "Use retrieval ranking for workspace controls",
        created_at: "2026-03-26T10:01:00.000Z",
        updated_at: "2026-03-26T10:01:00.000Z",
        workspace_id: "workspace-b",
        branch: "feature/project-memory",
        rationale: "Wrong workspace",
      }),
      createRecordEvent({
        id: "dec-foreign-branch",
        class: "decision",
        summary: "Use retrieval ranking for workspace controls",
        created_at: "2026-03-26T10:02:00.000Z",
        updated_at: "2026-03-26T10:02:00.000Z",
        workspace_id: "workspace-a",
        branch: "main",
        rationale: "Wrong branch",
      }),
    ])

    //#when
    const scoped = await memory_search({
      projectRoot: testDir,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
      query: "ranking",
    })
    const empty = await memory_search({
      projectRoot: testDir,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
      query: "no-hit-token",
    })

    //#then
    expect(scoped.items.map((item) => item.id)).toEqual(["dec-1"])
    expect(scoped.total).toBe(1)
    expect(empty.items).toEqual([])
    expect(empty.total).toBe(0)
  })

  test("memory_forget deletes only in current scope and reports unknown IDs", async () => {
    //#given
    const testDir = createTestDir("forget-scope")
    initializeProjectMemoryStorage(testDir, {
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })

    seedTimeline(testDir, [
      createRecordEvent({
        id: "shared-id",
        class: "decision",
        summary: "Workspace A record",
        created_at: "2026-03-26T10:00:00.000Z",
        updated_at: "2026-03-26T10:00:00.000Z",
        workspace_id: "workspace-a",
        branch: "feature/project-memory",
        rationale: "Should be deleted",
      }),
      createRecordEvent({
        id: "shared-id",
        class: "decision",
        summary: "Workspace B record",
        created_at: "2026-03-26T10:01:00.000Z",
        updated_at: "2026-03-26T10:01:00.000Z",
        workspace_id: "workspace-b",
        branch: "feature/project-memory",
        rationale: "Must be preserved",
      }),
      createRecordEvent({
        id: "keep-id",
        class: "thread",
        summary: "Keep this thread",
        created_at: "2026-03-26T10:02:00.000Z",
        updated_at: "2026-03-26T10:02:00.000Z",
        workspace_id: "workspace-a",
        branch: "feature/project-memory",
        thread_id: "thread-keep",
      }),
    ])

    //#when
    const result = await memory_forget({
      projectRoot: testDir,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
      ids: ["shared-id", "missing-id"],
      reason: "operator cleanup",
    })

    //#then
    expect(result.forgotten).toEqual(["shared-id"])
    expect(result.not_found).toEqual(["missing-id"])

    const scopeA = await memory_search({
      projectRoot: testDir,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
      query: "",
      limit: 20,
    })
    expect(scopeA.items.map((item) => item.id).sort()).toEqual(["keep-id"])

    const scopeB = await memory_search({
      projectRoot: testDir,
      workspaceId: "workspace-b",
      branch: "feature/project-memory",
      query: "",
      limit: 20,
    })
    expect(scopeB.items.map((item) => item.id)).toContain("shared-id")

    const forgetEvents = readTimeline(testDir)
      .map((entry) => entry as Record<string, unknown>)
      .filter((entry) => entry.operation === "forget" && entry.memory_id === "shared-id")
    expect(forgetEvents.length).toBe(1)
  })

  test("memory_rebuild prunes stale entries and does not resurrect forgotten IDs", async () => {
    //#given
    const testDir = createTestDir("rebuild-prune")
    initializeProjectMemoryStorage(testDir, {
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })

    seedTimeline(testDir, [
      createRecordEvent({
        id: "forget-me",
        class: "decision",
        summary: "This record is intentionally forgotten",
        created_at: "2025-01-01T10:00:00.000Z",
        updated_at: "2025-01-01T10:00:00.000Z",
        workspace_id: "workspace-a",
        branch: "feature/project-memory",
        rationale: "old",
      }),
      createRecordEvent({
        id: "stale-id",
        class: "decision",
        summary: "Very stale memory",
        created_at: "2025-02-01T10:00:00.000Z",
        updated_at: "2025-02-01T10:00:00.000Z",
        workspace_id: "workspace-a",
        branch: "feature/project-memory",
        rationale: "stale",
      }),
      createRecordEvent({
        id: "fresh-id",
        class: "decision",
        summary: "Fresh memory to keep",
        created_at: "2026-04-01T10:00:00.000Z",
        updated_at: "2026-04-01T10:00:00.000Z",
        workspace_id: "workspace-a",
        branch: "feature/project-memory",
        rationale: "fresh",
      }),
    ])

    await memory_forget({
      projectRoot: testDir,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
      ids: ["forget-me"],
      reason: "explicit forget",
    })

    const timelineWithCorruption = readTimeline(testDir)
    timelineWithCorruption.push(createRecordEvent({
      id: "forget-me",
      class: "decision",
      summary: "Corrupted reinsert after forget",
      created_at: "2026-04-10T10:00:00.000Z",
      updated_at: "2026-04-10T10:00:00.000Z",
      workspace_id: "workspace-a",
      branch: "feature/project-memory",
      rationale: "must stay forgotten",
    }))
    seedTimeline(testDir, timelineWithCorruption)

    //#when
    const rebuild = await memory_rebuild({
      projectRoot: testDir,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
      now: "2026-05-01T00:00:00.000Z",
      pruneOlderThanDays: 45,
    })
    const after = await memory_search({
      projectRoot: testDir,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
      query: "",
      limit: 20,
    })

    //#then
    expect(after.items.map((item) => item.id)).toEqual(["fresh-id"])
    expect(rebuild.pruned_ids).toContain("stale-id")
    expect(rebuild.forgotten_blocked_ids).toContain("forget-me")

    const decisionIndexPath = join(testDir, ".kord", "memory", "decision-index.json")
    const decisionIndexRaw = readFileSync(decisionIndexPath, "utf8")
    expect(decisionIndexRaw).toContain("fresh-id")
    expect(decisionIndexRaw).not.toContain("forget-me")
    expect(decisionIndexRaw).not.toContain("stale-id")
  })
})

function createTestDir(label: string): string {
  const dir = join(tmpdir(), `project-memory-controls-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  TEST_DIRS.add(dir)
  return dir
}

function createRecordEvent(record: TimelineRecordSeed): TimelineSeedEvent {
  return {
    record,
    provenance: {
      source: "compaction",
      captured_at: record.updated_at,
      supporting_paths: [],
    },
    confidence: 0.9,
    freshness: 0.9,
    scope: {
      workspace_id: record.workspace_id,
      branch: record.branch,
      scope: "workspace",
    },
  }
}

function readTimeline(projectRoot: string): TimelineSeedEvent[] {
  const timelinePath = join(projectRoot, ".kord", "memory", "timeline.json")
  const raw = readFileSync(timelinePath, "utf8")
  const payload = JSON.parse(raw) as {
    data?: {
      events?: TimelineSeedEvent[]
    }
  }
  return Array.isArray(payload.data?.events) ? payload.data.events : []
}

function seedTimeline(projectRoot: string, events: TimelineSeedEvent[]): void {
  const timelinePath = join(projectRoot, ".kord", "memory", "timeline.json")
  const raw = readFileSync(timelinePath, "utf8")
  const payload = JSON.parse(raw) as {
    data: {
      events: TimelineSeedEvent[]
    }
  }
  payload.data.events = events
  writeFileSync(timelinePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
}
