import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { retrieveProjectMemory } from "./retrieval"
import { initializeProjectMemoryStorage } from "./storage"

const TEST_DIRS = new Set<string>()

interface TimelineRecord {
  id: string
  class: "decision" | "constraint" | "preference" | "thread" | "artifact" | "entity" | "gotcha"
  summary: string
  created_at: string
  updated_at: string
  workspace_id: string
  branch: string
  source_session_id?: string
  tags?: string[]
  thread_id?: string
  constraint?: string
  preference?: string
  rationale?: string
  artifact_path?: string
  symptom?: string
}

describe("project-memory retrieval", () => {
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

  test("scopes records by workspace+branch and ranks by priority", async () => {
    //#given
    const testDir = createTestDir("scope-rank")
    const workspaceId = "workspace-a"
    const branch = "feature/project-memory"
    initializeProjectMemoryStorage(testDir, { workspaceId, branch })

    seedTimeline(testDir, workspaceId, branch, [
      {
        id: "thread-active",
        class: "thread",
        summary: "Finish retrieval pipeline",
        created_at: "2026-03-26T10:00:00.000Z",
        updated_at: "2026-03-26T10:00:00.000Z",
        workspace_id: workspaceId,
        branch,
        thread_id: "thread-123",
      },
      {
        id: "constraint-1",
        class: "constraint",
        summary: "Never inject whole transcripts",
        created_at: "2026-03-26T09:00:00.000Z",
        updated_at: "2026-03-26T09:00:00.000Z",
        workspace_id: workspaceId,
        branch,
        constraint: "Never inject whole transcripts",
      },
      {
        id: "preference-1",
        class: "preference",
        summary: "Prefer deterministic ranking output",
        created_at: "2026-03-26T09:30:00.000Z",
        updated_at: "2026-03-26T09:30:00.000Z",
        workspace_id: workspaceId,
        branch,
        preference: "Prefer deterministic ranking output",
      },
      {
        id: "decision-1",
        class: "decision",
        summary: "Use staged retrieval with durable-first lookup",
        created_at: "2026-03-26T08:00:00.000Z",
        updated_at: "2026-03-26T08:00:00.000Z",
        workspace_id: workspaceId,
        branch,
        rationale: "Durable state is stable across sessions",
        tags: ["retrieval", "durable"],
      },
      {
        id: "artifact-1",
        class: "artifact",
        summary: "src/features/project-memory/retrieval.ts",
        created_at: "2026-03-26T07:00:00.000Z",
        updated_at: "2026-03-26T07:00:00.000Z",
        workspace_id: workspaceId,
        branch,
        artifact_path: "src/features/project-memory/retrieval.ts",
      },
      {
        id: "foreign-workspace",
        class: "decision",
        summary: "Should never be returned",
        created_at: "2026-03-26T11:00:00.000Z",
        updated_at: "2026-03-26T11:00:00.000Z",
        workspace_id: "workspace-b",
        branch,
        rationale: "Wrong workspace",
      },
      {
        id: "foreign-branch",
        class: "gotcha",
        summary: "Should never be returned either",
        created_at: "2026-03-26T11:00:00.000Z",
        updated_at: "2026-03-26T11:00:00.000Z",
        workspace_id: workspaceId,
        branch: "main",
        symptom: "Wrong branch",
      },
    ])
    seedActiveContext(testDir, workspaceId, branch, "Finish retrieval pipeline")

    //#when
    const result = await retrieveProjectMemory({
      projectRoot: testDir,
      workspaceId,
      branch,
      query: "retrieval ranking",
      activeThreadId: "thread-123",
      maxItems: 8,
      maxTokens: 400,
    })

    //#then
    const classes = result.items.map((item) => item.class)
    expect(result.items.some((item) => item.summary.includes("Should never be returned"))).toBe(false)
    expect(result.items.every((item) => item.workspace_id === workspaceId && item.branch === branch)).toBe(true)
    expect(classes[0]).toBe("thread")

    const firstConstraintOrPreference = classes.findIndex((item) => item === "constraint" || item === "preference")
    const firstDecisionOrGotcha = classes.findIndex((item) => item === "decision" || item === "gotcha")
    const firstArtifact = classes.findIndex((item) => item === "artifact")

    expect(firstConstraintOrPreference).toBeGreaterThan(-1)
    expect(firstDecisionOrGotcha).toBeGreaterThan(-1)
    expect(firstArtifact).toBeGreaterThan(-1)
    expect(firstConstraintOrPreference).toBeLessThan(firstDecisionOrGotcha)
    expect(firstDecisionOrGotcha).toBeLessThan(firstArtifact)
  })

  test("builds local sqlite index and promotes query matches from FTS", async () => {
    //#given
    const testDir = createTestDir("fts")
    const workspaceId = "workspace-a"
    const branch = "feature/project-memory"
    initializeProjectMemoryStorage(testDir, { workspaceId, branch })
    seedTimeline(testDir, workspaceId, branch, [
      {
        id: "decision-bm25",
        class: "decision",
        summary: "Use BM25-like ranking for local retrieval matches",
        created_at: "2026-03-26T12:00:00.000Z",
        updated_at: "2026-03-26T12:00:00.000Z",
        workspace_id: workspaceId,
        branch,
        rationale: "FTS should highlight relevant memory quickly",
      },
    ])

    //#when
    const result = await retrieveProjectMemory({
      projectRoot: testDir,
      workspaceId,
      branch,
      query: "bm25 retrieval",
      maxItems: 4,
      maxTokens: 200,
    })

    //#then
    expect(existsSync(join(testDir, ".kord", "memory", ".local", "search-index.db"))).toBe(true)
    const matchedDecision = result.items.find((item) => item.id === "decision-bm25")
    expect(matchedDecision).toBeDefined()
    expect(matchedDecision?.source).toBe("local-fts")
  })

  test("falls back to session history via branch metadata cursor when durable memory is empty", async () => {
    //#given
    const testDir = createTestDir("session-fallback")
    const workspaceId = "workspace-a"
    const branch = "feature/project-memory"
    initializeProjectMemoryStorage(testDir, { workspaceId, branch })
    seedBranchCursor(testDir, workspaceId, branch, "ses_cursor_001")

    //#when
    const result = await retrieveProjectMemory({
      projectRoot: testDir,
      workspaceId,
      branch,
      query: "ranking",
      maxItems: 3,
      maxTokens: 120,
      sessionReader: async (sessionID) => {
        expect(sessionID).toBe("ses_cursor_001")
        return [
          {
            id: "msg-1",
            role: "assistant",
            time: { created: 100 },
            parts: [
              {
                id: "part-1",
                type: "text",
                text: "Implemented staged retrieval ranking: durable first, local FTS second, session fallback third.",
              },
            ],
          },
        ]
      },
    })

    //#then
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.items[0]?.class).toBe("session-evidence")
    expect(result.items[0]?.source).toBe("session-fallback")
    expect(result.items[0]?.summary.length).toBeLessThan(220)
  })

  test("enforces item and token budgets", async () => {
    //#given
    const testDir = createTestDir("budgets")
    const workspaceId = "workspace-a"
    const branch = "feature/project-memory"
    initializeProjectMemoryStorage(testDir, { workspaceId, branch })
    seedTimeline(testDir, workspaceId, branch, [
      {
        id: "decision-budget-1",
        class: "decision",
        summary: "Short decision A",
        created_at: "2026-03-26T12:00:00.000Z",
        updated_at: "2026-03-26T12:00:00.000Z",
        workspace_id: workspaceId,
        branch,
        rationale: "A",
      },
      {
        id: "decision-budget-2",
        class: "decision",
        summary: "Short decision B",
        created_at: "2026-03-26T11:00:00.000Z",
        updated_at: "2026-03-26T11:00:00.000Z",
        workspace_id: workspaceId,
        branch,
        rationale: "B",
      },
      {
        id: "decision-budget-3",
        class: "decision",
        summary: "Short decision C",
        created_at: "2026-03-26T10:00:00.000Z",
        updated_at: "2026-03-26T10:00:00.000Z",
        workspace_id: workspaceId,
        branch,
        rationale: "C",
      },
    ])

    //#when
    const result = await retrieveProjectMemory({
      projectRoot: testDir,
      workspaceId,
      branch,
      query: "decision",
      maxItems: 2,
      maxTokens: 20,
    })

    //#then
    expect(result.items.length).toBeLessThanOrEqual(2)
    expect(result.totals.tokens).toBeLessThanOrEqual(20)
    expect(result.items.map((item) => item.id)).not.toContain("decision-budget-3")
  })
})

function createTestDir(label: string): string {
  const dir = join(tmpdir(), `project-memory-retrieval-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  TEST_DIRS.add(dir)
  return dir
}

function seedTimeline(
  projectRoot: string,
  workspaceId: string,
  branch: string,
  records: TimelineRecord[],
): void {
  const timelinePath = join(projectRoot, ".kord", "memory", "timeline.json")
  const raw = readFileSync(timelinePath, "utf8")
  const payload = JSON.parse(raw) as {
    schema: string
    key: string
    durability: string
    workspace_id: string
    branch: string
    created_at: string
    updated_at: string
    provenance: Record<string, unknown>
    data: { events: unknown[] }
  }

  payload.workspace_id = workspaceId
  payload.branch = branch
  payload.data.events = records.map((record) => ({
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
  }))

  writeFileSync(timelinePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
}

function seedActiveContext(
  projectRoot: string,
  workspaceId: string,
  branch: string,
  activeContext: string,
): void {
  const activeContextPath = join(projectRoot, ".kord", "memory", "active-context.json")
  const raw = readFileSync(activeContextPath, "utf8")
  const payload = JSON.parse(raw) as {
    workspace_id: string
    branch: string
    data: {
      active_context: string | null
      last_class: string | null
    }
  }

  payload.workspace_id = workspaceId
  payload.branch = branch
  payload.data.active_context = activeContext
  payload.data.last_class = "thread"
  writeFileSync(activeContextPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
}

function seedBranchCursor(
  projectRoot: string,
  workspaceId: string,
  branch: string,
  cursor: string,
): void {
  const sanitizedWorkspace = workspaceId.replace(/[^A-Za-z0-9._-]+/g, "-")
  const sanitizedBranch = branch.replace(/[^A-Za-z0-9._-]+/g, "-")
  const branchPath = join(
    projectRoot,
    ".kord",
    "memory",
    ".local",
    "workspaces",
    sanitizedWorkspace,
    "branches",
    `${sanitizedBranch}.json`,
  )

  const raw = readFileSync(branchPath, "utf8")
  const payload = JSON.parse(raw) as {
    data: {
      workspace_id: string
      branch: string
      durable_cursor: string | null
    }
  }

  payload.data.workspace_id = workspaceId
  payload.data.branch = branch
  payload.data.durable_cursor = cursor
  writeFileSync(branchPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
}
