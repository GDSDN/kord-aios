import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { ContextCollector } from "../context-injector/collector"
import {
  createContextInjectorMessagesTransformHook,
  createProjectMemoryContextHook,
} from "../context-injector/injector"
import { createProjectMemoryCaptureHook } from "../../hooks/project-memory-capture"
import { memory_forget, memory_rebuild, memory_search } from "./controls"
import { retrieveProjectMemory } from "./retrieval"

const TEST_DIRS = new Set<string>()

interface UserMessage {
  info: {
    id: string
    sessionID: string
    role: "user"
    time: { created: number }
  }
  parts: Array<{
    id: string
    messageID: string
    sessionID: string
    type: "text"
    text: string
    synthetic?: boolean
  }>
}

describe("project-memory end-to-end integration", () => {
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

  test("End-to-end continuity across restart works", async () => {
    //#given
    const projectRoot = createTestDir("restart")
    const workspaceId = "workspace-a"
    const branch = "feature/project-memory"
    const captureHook = createCaptureHook(projectRoot, workspaceId, branch)

    await captureHook["experimental.session.compacting"](
      {
        sessionID: "ses_previous_001",
        summary: {
          decisions: [
            {
              summary: "Preserve durable-first retrieval layering",
              rationale: "Stable project continuity should come from durable memory first",
              tags: ["memory", "retrieval"],
            },
          ],
          remaining_tasks: [
            "Implement ranking heuristics for retrieval",
          ],
          supporting_paths: ["src/features/project-memory/retrieval.ts"],
        },
      },
      { context: [] },
    )

    const collector = new ContextCollector()
    const memoryHook = createProjectMemoryContextHook(collector, {
      projectRoot,
      enabled: true,
      workspaceId,
      branch,
      budgets: {
        durable_records: 4,
        local_cache_bytes: 1024,
      },
    })

    const restartSessionId = "ses_restart_001"

    //#when
    await memoryHook.event?.({
      event: {
        type: "session.created",
        properties: {
          info: {
            id: restartSessionId,
          },
        },
      },
    })

    await memoryHook["chat.message"]?.(
      { sessionID: restartSessionId },
      {
        message: {},
        parts: [
          {
            type: "text",
            text: "Resume retrieval work from the last session.",
          },
        ],
      },
    )

    const transformHook = createContextInjectorMessagesTransformHook(collector)
    const transformed = {
      messages: [createUserMessage(restartSessionId, "Resume retrieval work from the last session.")],
    }

    await transformHook["experimental.chat.messages.transform"]?.({}, transformed)

    await captureHook.event({
      event: {
        type: "checkpoint.completed",
        properties: {
          info: { id: restartSessionId },
          summary: {
            decisions: [
              {
                summary: "Checkpoint update keeps retrieval token budgets explicit",
                rationale: "Prevents memory injection from growing into transcript-sized payloads",
                tags: ["checkpoint", "budgets"],
              },
            ],
          },
        },
      },
    })

    const retrieval = await retrieveProjectMemory({
      projectRoot,
      workspaceId,
      branch,
      query: "checkpoint token budgets retrieval",
      maxItems: 8,
      maxTokens: 320,
    })

    //#then
    const injectedText = extractSyntheticText(transformed.messages[0])
    expect(injectedText).toContain("Project Memory (Advisory)")
    expect(injectedText).toContain("Preserve durable-first retrieval layering")
    expect(injectedText).toContain("Implement ranking heuristics for retrieval")

    const injectedCountMatch = injectedText.match(/Retrieved items:\s*(\d+)/)
    expect(Number(injectedCountMatch?.[1] ?? "0")).toBeGreaterThan(0)
    expect(Number(injectedCountMatch?.[1] ?? "99")).toBeLessThanOrEqual(4)

    expect(
      retrieval.items.some((item) => item.summary.includes("Checkpoint update keeps retrieval token budgets explicit")),
    ).toBe(true)
  })

  test("covers forget/prune flow end to end", async () => {
    //#given
    const projectRoot = createTestDir("govern")
    const workspaceId = "workspace-a"
    const branch = "feature/project-memory"
    const captureHook = createCaptureHook(projectRoot, workspaceId, branch)

    await captureHook.event({
      event: {
        type: "checkpoint.created",
        properties: {
          info: { id: "ses_govern_001" },
          summary: {
            decisions: [
              {
                summary: "Forget me decision",
                rationale: "Used only to validate forget tombstones",
              },
            ],
            captured_at: "2026-03-01T10:00:00.000Z",
          },
        },
      },
    })

    await captureHook.event({
      event: {
        type: "checkpoint.created",
        properties: {
          info: { id: "ses_govern_002" },
          summary: {
            decisions: [
              {
                summary: "Very stale decision",
                rationale: "Used only to validate prune behavior",
              },
            ],
            captured_at: "2025-01-01T10:00:00.000Z",
          },
        },
      },
    })

    await captureHook.event({
      event: {
        type: "checkpoint.created",
        properties: {
          info: { id: "ses_govern_003" },
          summary: {
            decisions: [
              {
                summary: "Fresh decision stays after rebuild",
                rationale: "Most recent scoped memory should survive controls",
              },
            ],
            captured_at: "2026-04-20T10:00:00.000Z",
          },
        },
      },
    })

    const beforeForget = await memory_search({
      projectRoot,
      workspaceId,
      branch,
      query: "",
      limit: 50,
    })

    const forgetTarget = beforeForget.items.find((item) => item.summary === "Forget me decision")
    expect(forgetTarget).toBeDefined()

    //#when
    const forgetResult = await memory_forget({
      projectRoot,
      workspaceId,
      branch,
      ids: [forgetTarget!.id],
      reason: "integration-test-forget",
    })

    await captureHook.event({
      event: {
        type: "checkpoint.created",
        properties: {
          info: { id: "ses_govern_001" },
          summary: {
            decisions: [
              {
                summary: "Forget me decision",
                rationale: "Attempted resurrection should be blocked by tombstone",
              },
            ],
            captured_at: "2026-04-25T10:00:00.000Z",
          },
        },
      },
    })

    const rebuild = await memory_rebuild({
      projectRoot,
      workspaceId,
      branch,
      now: "2026-05-01T00:00:00.000Z",
      pruneOlderThanDays: 45,
    })

    const afterControls = await memory_search({
      projectRoot,
      workspaceId,
      branch,
      query: "",
      limit: 50,
    })

    const retrievalAfterControls = await retrieveProjectMemory({
      projectRoot,
      workspaceId,
      branch,
      query: "decision",
      maxItems: 20,
      maxTokens: 500,
    })

    //#then
    expect(forgetResult.forgotten).toEqual([forgetTarget!.id])
    expect(rebuild.forgotten_blocked_ids).toContain(forgetTarget!.id)
    expect(rebuild.pruned_ids.length).toBeGreaterThan(0)

    const remainingSummaries = afterControls.items.map((item) => item.summary)
    expect(remainingSummaries).toContain("Fresh decision stays after rebuild")
    expect(remainingSummaries).not.toContain("Forget me decision")
    expect(remainingSummaries).not.toContain("Very stale decision")

    expect(retrievalAfterControls.items.some((item) => item.summary === "Forget me decision")).toBe(false)
    expect(retrievalAfterControls.items.some((item) => item.summary === "Very stale decision")).toBe(false)
  })

  test("Wrong-project isolation holds end to end (isolates memory by workspace)", async () => {
    //#given
    const projectA = createTestDir("isolation-a")
    const projectB = createTestDir("isolation-b")
    const branch = "feature/project-memory"

    const captureA = createCaptureHook(projectA, "workspace-a", branch)
    const captureAMain = createCaptureHook(projectA, "workspace-a", "main")
    const captureB = createCaptureHook(projectB, "workspace-b", branch)

    await captureA["experimental.session.compacting"](
      {
        sessionID: "ses_a_001",
        summary: {
          decisions: [
            {
              summary: "Project A decision for APIClient refactor",
              rationale: "A-only memory should remain in project A scope",
            },
          ],
        },
      },
      { context: [] },
    )

    await captureAMain["experimental.session.compacting"](
      {
        sessionID: "ses_a_main",
        summary: {
          decisions: [
            {
              summary: "Project A main-branch only decision",
              rationale: "Feature branch retrieval must exclude this",
            },
          ],
        },
      },
      { context: [] },
    )

    await captureB["experimental.session.compacting"](
      {
        sessionID: "ses_b_001",
        summary: {
          decisions: [
            {
              summary: "Project B decision for APIClient refactor",
              rationale: "Foreign project memory must not leak into project A",
            },
          ],
        },
      },
      { context: [] },
    )

    //#when
    const scopedRetrieval = await retrieveProjectMemory({
      projectRoot: projectA,
      workspaceId: "workspace-a",
      branch,
      query: "APIClient refactor decision",
      maxItems: 10,
      maxTokens: 400,
    })

    const collector = new ContextCollector()
    const memoryHook = createProjectMemoryContextHook(collector, {
      projectRoot: projectA,
      enabled: true,
      workspaceId: "workspace-a",
      branch,
    })

    const sessionID = "ses_isolation_001"
    await memoryHook.event?.({
      event: {
        type: "session.created",
        properties: {
          info: {
            id: sessionID,
          },
        },
      },
    })

    await memoryHook["chat.message"]?.(
      { sessionID },
      {
        message: {},
        parts: [{ type: "text", text: "Continue APIClient refactor" }],
      },
    )

    const transformHook = createContextInjectorMessagesTransformHook(collector)
    const transformed = {
      messages: [createUserMessage(sessionID, "Continue APIClient refactor")],
    }

    await transformHook["experimental.chat.messages.transform"]?.({}, transformed)

    //#then
    const summaries = scopedRetrieval.items.map((item) => item.summary)
    expect(summaries).toContain("Project A decision for APIClient refactor")
    expect(summaries).not.toContain("Project B decision for APIClient refactor")
    expect(summaries).not.toContain("Project A main-branch only decision")

    const injectedText = extractSyntheticText(transformed.messages[0])
    expect(injectedText).toContain("Project A decision for APIClient refactor")
    expect(injectedText).not.toContain("Project B decision for APIClient refactor")
    expect(injectedText).not.toContain("Project A main-branch only decision")
  })
})

function createTestDir(label: string): string {
  const dir = join(tmpdir(), `project-memory-integration-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  TEST_DIRS.add(dir)
  return dir
}

function createCaptureHook(projectRoot: string, workspaceId: string, branch: string) {
  return createProjectMemoryCaptureHook({
    directory: projectRoot,
    client: {},
  } as never, {
    enabled: true,
    workspaceId,
    branch,
  })
}

function createUserMessage(sessionID: string, text: string): UserMessage {
  const id = `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`
  return {
    info: {
      id,
      sessionID,
      role: "user",
      time: { created: Date.now() },
    },
    parts: [
      {
        id: `part-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        messageID: id,
        sessionID,
        type: "text",
        text,
      },
    ],
  }
}

function extractSyntheticText(message: UserMessage): string {
  const synthetic = message.parts.find((part) => part.synthetic === true)
  return synthetic?.text ?? ""
}
