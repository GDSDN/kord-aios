import { describe, expect, test, beforeEach, afterEach, afterAll, mock } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { _resetForTesting, setMainSession, subagentSessions } from "../../features/claude-code-session-state"
import {
  writeBoulderState,
  clearBoulderState,
  readBoulderState,
} from "../../features/boulder-state"
import type { BoulderState } from "../../features/boulder-state"

const TEST_STORAGE_ROOT = join(tmpdir(), `build-message-storage-${randomUUID()}`)
const TEST_MESSAGE_STORAGE = join(TEST_STORAGE_ROOT, "message")
const TEST_PART_STORAGE = join(TEST_STORAGE_ROOT, "part")

mock.module("../../features/hook-message-injector/constants", () => ({
  OPENCODE_STORAGE: TEST_STORAGE_ROOT,
  MESSAGE_STORAGE: TEST_MESSAGE_STORAGE,
  PART_STORAGE: TEST_PART_STORAGE,
}))

const { createBuildHook } = await import("./index")
const { MESSAGE_STORAGE } = await import("../../features/hook-message-injector")

afterAll(() => {
  mock.restore()
})

describe("build hook", () => {
  let TEST_DIR: string
  let KORD_DIR: string

  function createMockPluginInput(overrides?: { promptMock?: ReturnType<typeof mock> }) {
    const promptMock = overrides?.promptMock ?? mock(() => Promise.resolve())
    return {
      directory: TEST_DIR,
      client: {
        session: {
          prompt: promptMock,
        },
      },
      _promptMock: promptMock,
    } as unknown as Parameters<typeof createBuildHook>[0] & { _promptMock: ReturnType<typeof mock> }
  }

  function setupMessageStorage(sessionID: string, agent: string): void {
    const messageDir = join(MESSAGE_STORAGE, sessionID)
    if (!existsSync(messageDir)) {
      mkdirSync(messageDir, { recursive: true })
    }
    const messageData = {
      agent,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }
    writeFileSync(join(messageDir, "msg_test001.json"), JSON.stringify(messageData))
  }

  function cleanupMessageStorage(sessionID: string): void {
    const messageDir = join(MESSAGE_STORAGE, sessionID)
    if (existsSync(messageDir)) {
      rmSync(messageDir, { recursive: true, force: true })
    }
  }

  beforeEach(() => {
    TEST_DIR = join(tmpdir(), `build-test-${randomUUID()}`)
    KORD_DIR = join(TEST_DIR, "docs", "kord")
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true })
    }
    if (!existsSync(KORD_DIR)) {
      mkdirSync(KORD_DIR, { recursive: true })
    }
    clearBoulderState(TEST_DIR)
  })

  afterEach(() => {
    clearBoulderState(TEST_DIR)
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
    rmSync(TEST_STORAGE_ROOT, { recursive: true, force: true })
  })

  describe("tool.execute.after handler", () => {
    test("should handle undefined output gracefully (issue #1035)", async () => {
      // given - hook and undefined output (e.g., from /review command)
      const hook = createBuildHook(createMockPluginInput())

      // when - calling with undefined output
      const result = await hook["tool.execute.after"](
        { tool: "task", sessionID: "session-123" },
        undefined as unknown as { title: string; output: string; metadata: Record<string, unknown> }
      )

      // then - returns undefined without throwing
      expect(result).toBeUndefined()
    })

    test("should ignore non-task tools", async () => {
      // given - hook and non-task tool
      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Test Tool",
        output: "Original output",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "other_tool", sessionID: "session-123" },
        output
      )

      // then - output unchanged
      expect(output.output).toBe("Original output")
    })

     test("should not transform when caller is not Build", async () => {
       // given - boulder state exists but caller agent in message storage is not Build
       const sessionID = "session-non-orchestrator-test"
       setupMessageStorage(sessionID, "other-agent")
      
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task completed successfully",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - output unchanged because caller is not orchestrator
      expect(output.output).toBe("Task completed successfully")
      
      cleanupMessageStorage(sessionID)
    })

     test("should append standalone verification when no boulder state but caller is Build", async () => {
       // given - no boulder state, but caller is Build
       const sessionID = "session-no-boulder-test"
       setupMessageStorage(sessionID, "build")
      
      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task completed successfully",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - standalone verification reminder appended
      expect(output.output).toContain("Task completed successfully")
      expect(output.output).toContain("MANDATORY:")
      expect(output.output).toContain("task(session_id=")
      
      cleanupMessageStorage(sessionID)
    })

     test("should transform output when caller is Build with boulder state", async () => {
       // given - Build caller with boulder state
       const sessionID = "session-transform-test"
       setupMessageStorage(sessionID, "build")
      
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [x] Task 2")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task completed successfully",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - output should be transformed (original output preserved for debugging)
      expect(output.output).toContain("Task completed successfully")
      expect(output.output).toContain("SUBAGENT WORK COMPLETED")
      expect(output.output).toContain("test-plan")
      expect(output.output).toContain("LIE")
      expect(output.output).toContain("task(session_id=")
      
      cleanupMessageStorage(sessionID)
    })

     test("should still transform when plan is complete (shows progress)", async () => {
       // given - boulder state with complete plan, Build caller
       const sessionID = "session-complete-plan-test"
       setupMessageStorage(sessionID, "build")
      
      const planPath = join(TEST_DIR, "complete-plan.md")
      writeFileSync(planPath, "# Plan\n- [x] Task 1\n- [x] Task 2")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "complete-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Original output",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - output transformed even when complete (shows 2/2 done)
      expect(output.output).toContain("SUBAGENT WORK COMPLETED")
      expect(output.output).toContain("2/2 done")
      expect(output.output).toContain("0 remaining")
      
      cleanupMessageStorage(sessionID)
    })

     test("should append session ID to boulder state if not present", async () => {
       // given - boulder state without session-append-test, Build caller
       const sessionID = "session-append-test"
       setupMessageStorage(sessionID, "build")
      
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task output",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - sessionID should be appended
      const updatedState = readBoulderState(TEST_DIR)
      expect(updatedState?.session_ids).toContain(sessionID)
      
      cleanupMessageStorage(sessionID)
    })

     test("should not duplicate existing session ID", async () => {
       // given - boulder state already has session-dup-test, Build caller
       const sessionID = "session-dup-test"
       setupMessageStorage(sessionID, "build")
      
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [sessionID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task output",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - should still have only one sessionID
      const updatedState = readBoulderState(TEST_DIR)
      const count = updatedState?.session_ids.filter((id) => id === sessionID).length
      expect(count).toBe(1)
      
      cleanupMessageStorage(sessionID)
    })

     test("should include boulder.json path and notepad path in transformed output", async () => {
       // given - boulder state, Build caller
       const sessionID = "session-path-test"
       setupMessageStorage(sessionID, "build")
      
      const planPath = join(TEST_DIR, "my-feature.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2\n- [x] Task 3")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "my-feature",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task completed",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - output should contain plan name and progress
      expect(output.output).toContain("my-feature")
      expect(output.output).toContain("1/3 done")
      expect(output.output).toContain("2 remaining")
      
      cleanupMessageStorage(sessionID)
    })

     test("should include session_id and checkbox instructions in reminder", async () => {
       // given - boulder state, Build caller
       const sessionID = "session-resume-test"
       setupMessageStorage(sessionID, "build")
      
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task completed",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - should include session_id instructions and verification
      expect(output.output).toContain("task(session_id=")
      expect(output.output).toContain("[x]")
      expect(output.output).toContain("MANDATORY:")
      
      cleanupMessageStorage(sessionID)
    })

    describe("Write/Edit tool direct work reminder", () => {
      const ORCHESTRATOR_SESSION = "orchestrator-write-test"

       beforeEach(() => {
         setupMessageStorage(ORCHESTRATOR_SESSION, "build")
       })

      afterEach(() => {
        cleanupMessageStorage(ORCHESTRATOR_SESSION)
      })

      test("should append delegation reminder when orchestrator writes outside docs/kord/", async () => {
        // given
        const hook = createBuildHook(createMockPluginInput())
        const output = {
          title: "Write",
          output: "File written successfully",
          metadata: { filePath: "/path/to/code.ts" },
        }

        // when
        await hook["tool.execute.after"](
          { tool: "Write", sessionID: ORCHESTRATOR_SESSION },
          output
        )

        // then
        expect(output.output).toContain("ORCHESTRATOR, not an IMPLEMENTER")
        expect(output.output).toContain("task")
        expect(output.output).toContain("task")
      })

      test("should append delegation reminder when orchestrator edits outside docs/kord/", async () => {
        // given
        const hook = createBuildHook(createMockPluginInput())
        const output = {
          title: "Edit",
          output: "File edited successfully",
          metadata: { filePath: "/src/components/button.tsx" },
        }

        // when
        await hook["tool.execute.after"](
          { tool: "Edit", sessionID: ORCHESTRATOR_SESSION },
          output
        )

        // then
        expect(output.output).toContain("ORCHESTRATOR, not an IMPLEMENTER")
      })

      test("should NOT append reminder when orchestrator writes inside docs/kord/", async () => {
        // given
        const hook = createBuildHook(createMockPluginInput())
        const originalOutput = "File written successfully"
        const output = {
          title: "Write",
          output: originalOutput,
          metadata: { filePath: "/project/docs/kord/plans/work-plan.md" },
        }

        // when
        await hook["tool.execute.after"](
          { tool: "Write", sessionID: ORCHESTRATOR_SESSION },
          output
        )

        // then
        expect(output.output).toBe(originalOutput)
        expect(output.output).not.toContain("ORCHESTRATOR, not an IMPLEMENTER")
      })

      test("should NOT append reminder when non-orchestrator writes outside docs/kord/", async () => {
        // given
        const nonOrchestratorSession = "non-orchestrator-session"
        setupMessageStorage(nonOrchestratorSession, "dev-junior")
        
        const hook = createBuildHook(createMockPluginInput())
        const originalOutput = "File written successfully"
        const output = {
          title: "Write",
          output: originalOutput,
          metadata: { filePath: "/path/to/code.ts" },
        }

        // when
        await hook["tool.execute.after"](
          { tool: "Write", sessionID: nonOrchestratorSession },
          output
        )

        // then
        expect(output.output).toBe(originalOutput)
        expect(output.output).not.toContain("ORCHESTRATOR, not an IMPLEMENTER")
        
        cleanupMessageStorage(nonOrchestratorSession)
      })

      test("should NOT append reminder for read-only tools", async () => {
        // given
        const hook = createBuildHook(createMockPluginInput())
        const originalOutput = "File content"
        const output = {
          title: "Read",
          output: originalOutput,
          metadata: { filePath: "/path/to/code.ts" },
        }

        // when
        await hook["tool.execute.after"](
          { tool: "Read", sessionID: ORCHESTRATOR_SESSION },
          output
        )

        // then
        expect(output.output).toBe(originalOutput)
      })

      test("should handle missing filePath gracefully", async () => {
        // given
        const hook = createBuildHook(createMockPluginInput())
        const originalOutput = "File written successfully"
        const output = {
          title: "Write",
          output: originalOutput,
          metadata: {},
        }

        // when
        await hook["tool.execute.after"](
          { tool: "Write", sessionID: ORCHESTRATOR_SESSION },
          output
        )

        // then
        expect(output.output).toBe(originalOutput)
      })

      describe("cross-platform path validation (Windows support)", () => {
        test("should NOT append reminder when orchestrator writes inside docs\\kord\\ (Windows backslash)", async () => {
          // given
          const hook = createBuildHook(createMockPluginInput())
          const originalOutput = "File written successfully"
          const output = {
            title: "Write",
            output: originalOutput,
            metadata: { filePath: "docs\\kord\\plans\\work-plan.md" },
          }

          // when
          await hook["tool.execute.after"](
            { tool: "Write", sessionID: ORCHESTRATOR_SESSION },
            output
          )

          // then
          expect(output.output).toBe(originalOutput)
          expect(output.output).not.toContain("ORCHESTRATOR, not an IMPLEMENTER")
        })

        test("should NOT append reminder when orchestrator writes inside docs/kord with mixed separators", async () => {
          // given
          const hook = createBuildHook(createMockPluginInput())
          const originalOutput = "File written successfully"
          const output = {
            title: "Write",
            output: originalOutput,
            metadata: { filePath: "docs\\kord\\plans/work-plan.md" },
          }

          // when
          await hook["tool.execute.after"](
            { tool: "Write", sessionID: ORCHESTRATOR_SESSION },
            output
          )

          // then
          expect(output.output).toBe(originalOutput)
          expect(output.output).not.toContain("ORCHESTRATOR, not an IMPLEMENTER")
        })

        test("should NOT append reminder for absolute Windows path inside docs\\kord\\", async () => {
          // given
          const hook = createBuildHook(createMockPluginInput())
          const originalOutput = "File written successfully"
          const output = {
            title: "Write",
            output: originalOutput,
            metadata: { filePath: "C:\\Users\\test\\project\\docs\\kord\\plans\\x.md" },
          }

          // when
          await hook["tool.execute.after"](
            { tool: "Write", sessionID: ORCHESTRATOR_SESSION },
            output
          )

          // then
          expect(output.output).toBe(originalOutput)
          expect(output.output).not.toContain("ORCHESTRATOR, not an IMPLEMENTER")
        })

        test("should append reminder for Windows path outside docs\\kord\\", async () => {
          // given
          const hook = createBuildHook(createMockPluginInput())
          const output = {
            title: "Write",
            output: "File written successfully",
            metadata: { filePath: "C:\\Users\\test\\project\\src\\code.ts" },
          }

          // when
          await hook["tool.execute.after"](
            { tool: "Write", sessionID: ORCHESTRATOR_SESSION },
            output
          )

          // then
          expect(output.output).toContain("ORCHESTRATOR, not an IMPLEMENTER")
        })
      })
    })
  })

  describe("session.idle handler (boulder continuation)", () => {
    const MAIN_SESSION_ID = "main-session-123"

    async function flushMicrotasks(): Promise<void> {
      await Promise.resolve()
      await Promise.resolve()
    }

     beforeEach(() => {
       _resetForTesting()
       setMainSession(MAIN_SESSION_ID)
       subagentSessions.clear()
       setupMessageStorage(MAIN_SESSION_ID, "builder")
     })

     afterEach(() => {
       cleanupMessageStorage(MAIN_SESSION_ID)
       _resetForTesting()
     })

    test("should inject continuation when boulder has incomplete tasks", async () => {
      // given - boulder state with incomplete plan
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      // when
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should call prompt with continuation
      expect(mockInput._promptMock).toHaveBeenCalled()
      const callArgs = mockInput._promptMock.mock.calls[0][0]
      expect(callArgs.path.id).toBe(MAIN_SESSION_ID)
      expect(callArgs.body.parts[0].text).toContain("incomplete tasks")
      expect(callArgs.body.parts[0].text).toContain("2 remaining")
    })

    test("should not inject when no boulder state exists", async () => {
      // given - no boulder state
      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      // when
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should not call prompt
      expect(mockInput._promptMock).not.toHaveBeenCalled()
    })

    test("should not inject when boulder plan is complete", async () => {
      // given - boulder state with complete plan
      const planPath = join(TEST_DIR, "complete-plan.md")
      writeFileSync(planPath, "# Plan\n- [x] Task 1\n- [x] Task 2")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "complete-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      // when
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should not call prompt
      expect(mockInput._promptMock).not.toHaveBeenCalled()
    })

    test("should skip when abort error occurred before idle", async () => {
      // given - boulder state with incomplete plan
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      // when - send abort error then idle
      await hook.handler({
        event: {
          type: "session.error",
          properties: {
            sessionID: MAIN_SESSION_ID,
            error: { name: "AbortError", message: "aborted" },
          },
        },
      })
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should not call prompt
      expect(mockInput._promptMock).not.toHaveBeenCalled()
    })

    test("should skip when background tasks are running", async () => {
      // given - boulder state with incomplete plan
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const mockBackgroundManager = {
        getTasksByParentSession: () => [{ status: "running" }],
      }

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput, {
        directory: TEST_DIR,
        backgroundManager: mockBackgroundManager as any,
      })

      // when
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should not call prompt
      expect(mockInput._promptMock).not.toHaveBeenCalled()
    })

    test("should clear abort state on message.updated", async () => {
      // given - boulder with incomplete plan
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      // when - abort error, then message update, then idle
      await hook.handler({
        event: {
          type: "session.error",
          properties: {
            sessionID: MAIN_SESSION_ID,
            error: { name: "AbortError" },
          },
        },
      })
      await hook.handler({
        event: {
          type: "message.updated",
          properties: { info: { sessionID: MAIN_SESSION_ID, role: "user" } },
        },
      })
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should call prompt because abort state was cleared
      expect(mockInput._promptMock).toHaveBeenCalled()
    })

    test("should include plan progress in continuation prompt", async () => {
      // given - boulder state with specific progress
      const planPath = join(TEST_DIR, "progress-plan.md")
      writeFileSync(planPath, "# Plan\n- [x] Task 1\n- [x] Task 2\n- [ ] Task 3\n- [ ] Task 4")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "progress-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      // when
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should include progress
      const callArgs = mockInput._promptMock.mock.calls[0][0]
      expect(callArgs.body.parts[0].text).toContain("2/4 completed")
      expect(callArgs.body.parts[0].text).toContain("2 remaining")
    })

     test("should not inject when last agent does not match boulder agent", async () => {
       // given - boulder state with incomplete plan, but last agent does NOT match
       const planPath = join(TEST_DIR, "test-plan.md")
       writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2")

       const state: BoulderState = {
         active_plan: planPath,
         started_at: "2026-01-02T10:00:00Z",
         session_ids: [MAIN_SESSION_ID],
         plan_name: "test-plan",
         agent: "builder",
       }
       writeBoulderState(TEST_DIR, state)

       // given - last agent is NOT the boulder agent
       cleanupMessageStorage(MAIN_SESSION_ID)
       setupMessageStorage(MAIN_SESSION_ID, "kord")

       const mockInput = createMockPluginInput()
       const hook = createBuildHook(mockInput)

       // when
       await hook.handler({
         event: {
           type: "session.idle",
           properties: { sessionID: MAIN_SESSION_ID },
         },
       })

       // then - should NOT call prompt because agent does not match
       expect(mockInput._promptMock).not.toHaveBeenCalled()
     })

     test("should inject when last agent matches boulder agent even if non-Build", async () => {
       // given - boulder state expects kord and last agent is kord
       const planPath = join(TEST_DIR, "test-plan.md")
       writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2")

       const state: BoulderState = {
         active_plan: planPath,
         started_at: "2026-01-02T10:00:00Z",
         session_ids: [MAIN_SESSION_ID],
         plan_name: "test-plan",
         agent: "kord",
       }
       writeBoulderState(TEST_DIR, state)

       cleanupMessageStorage(MAIN_SESSION_ID)
       setupMessageStorage(MAIN_SESSION_ID, "kord")

       const mockInput = createMockPluginInput()
       const hook = createBuildHook(mockInput)

       // when
       await hook.handler({
         event: {
           type: "session.idle",
           properties: { sessionID: MAIN_SESSION_ID },
         },
       })

       // then - should call prompt for kord
       expect(mockInput._promptMock).toHaveBeenCalled()
       const callArgs = mockInput._promptMock.mock.calls[0][0]
       expect(callArgs.body.agent).toBe("kord")
     })

    test("should debounce rapid continuation injections (prevent infinite loop)", async () => {
      // given - boulder state with incomplete plan
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      // when - fire multiple idle events in rapid succession (simulating infinite loop bug)
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should only call prompt ONCE due to debouncing
      expect(mockInput._promptMock).toHaveBeenCalledTimes(1)
    })

    test("should stop continuation after 2 consecutive prompt failures (issue #1355)", async () => {
      //#given - boulder state with incomplete plan and prompt always fails
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const promptMock = mock(() => Promise.reject(new Error("Bad Request")))
      const mockInput = createMockPluginInput({ promptMock })
      const hook = createBuildHook(mockInput)

      const originalDateNow = Date.now
      let now = 0
      Date.now = () => now

      try {
        //#when - idle fires repeatedly, past cooldown each time
        await hook.handler({ event: { type: "session.idle", properties: { sessionID: MAIN_SESSION_ID } } })
        await flushMicrotasks()
        now += 6000

        await hook.handler({ event: { type: "session.idle", properties: { sessionID: MAIN_SESSION_ID } } })
        await flushMicrotasks()
        now += 6000

        await hook.handler({ event: { type: "session.idle", properties: { sessionID: MAIN_SESSION_ID } } })
        await flushMicrotasks()

        //#then - should attempt only twice, then disable continuation
        expect(promptMock).toHaveBeenCalledTimes(2)
      } finally {
        Date.now = originalDateNow
      }
    })

    test("should reset prompt failure counter on success and only stop after 2 consecutive failures", async () => {
      //#given - boulder state with incomplete plan
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const promptMock = mock(() => Promise.resolve())
      promptMock.mockImplementationOnce(() => Promise.reject(new Error("Bad Request")))
      promptMock.mockImplementationOnce(() => Promise.resolve())
      promptMock.mockImplementationOnce(() => Promise.reject(new Error("Bad Request")))
      promptMock.mockImplementationOnce(() => Promise.reject(new Error("Bad Request")))

      const mockInput = createMockPluginInput({ promptMock })
      const hook = createBuildHook(mockInput)

      const originalDateNow = Date.now
      let now = 0
      Date.now = () => now

      try {
        //#when - fail, succeed (reset), then fail twice (disable), then attempt again
        for (let i = 0; i < 5; i++) {
          await hook.handler({ event: { type: "session.idle", properties: { sessionID: MAIN_SESSION_ID } } })
          await flushMicrotasks()
          now += 6000
        }

        //#then - 4 prompt attempts; 5th idle is skipped after 2 consecutive failures
        expect(promptMock).toHaveBeenCalledTimes(4)
      } finally {
        Date.now = originalDateNow
      }
    })

    test("should reset continuation failure state on session.compacted event", async () => {
      //#given - boulder state with incomplete plan and prompt always fails
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const promptMock = mock(() => Promise.reject(new Error("Bad Request")))
      const mockInput = createMockPluginInput({ promptMock })
      const hook = createBuildHook(mockInput)

      const originalDateNow = Date.now
      let now = 0
      Date.now = () => now

      try {
        //#when - two failures disables continuation, then compaction resets it
        await hook.handler({ event: { type: "session.idle", properties: { sessionID: MAIN_SESSION_ID } } })
        await flushMicrotasks()
        now += 6000

        await hook.handler({ event: { type: "session.idle", properties: { sessionID: MAIN_SESSION_ID } } })
        await flushMicrotasks()
        now += 6000

        await hook.handler({ event: { type: "session.idle", properties: { sessionID: MAIN_SESSION_ID } } })
        await flushMicrotasks()

        await hook.handler({ event: { type: "session.compacted", properties: { sessionID: MAIN_SESSION_ID } } })
        now += 6000

        await hook.handler({ event: { type: "session.idle", properties: { sessionID: MAIN_SESSION_ID } } })
        await flushMicrotasks()

        //#then - 2 attempts + 1 after compaction (3 total)
        expect(promptMock).toHaveBeenCalledTimes(3)
      } finally {
        Date.now = originalDateNow
      }
    })

    test("should cleanup on session.deleted", async () => {
      // given - boulder state
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      // when - create abort state then delete
      await hook.handler({
        event: {
          type: "session.error",
          properties: {
            sessionID: MAIN_SESSION_ID,
            error: { name: "AbortError" },
          },
        },
      })
      await hook.handler({
        event: {
          type: "session.deleted",
          properties: { info: { id: MAIN_SESSION_ID } },
        },
      })

      // Re-create boulder after deletion
      writeBoulderState(TEST_DIR, state)

      // Trigger idle - should inject because state was cleaned up
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should call prompt because session state was cleaned
      expect(mockInput._promptMock).toHaveBeenCalled()
    })

    test("should include next task executor context in continuation prompt", async () => {
      // given - plan with executor field on next incomplete task
      const plansDir = join(KORD_DIR, "plans")
      mkdirSync(plansDir, { recursive: true })
      const planPath = join(plansDir, "executor-plan.md")
      writeFileSync(planPath, [
        "# Plan",
        "- [x] 1. Setup project",
        "- [ ] 2. Create database schema",
        "  **Executor**: data-engineer",
        "  **Verify**: typecheck",
        "- [ ] 3. Build API",
      ].join("\n"))

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "executor-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      // when
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - continuation prompt should include executor context
      expect(mockInput._promptMock).toHaveBeenCalled()
      const callArgs = mockInput._promptMock.mock.calls[0][0]
      const promptText = callArgs.body.parts[0].text
      expect(promptText).toContain("data-engineer")
      expect(promptText).toContain("CURRENT TASK: #2")
      expect(promptText).toContain("typecheck")
    })
  })

  describe("generalized task delegation (executor/verify in tool.execute.after)", () => {
    test("should include next task context in tool.execute.after output", async () => {
      // given - plan with executor/verify on next task
      const sessionID = "session-executor-after"
      setupMessageStorage(sessionID, "build")

      const plansDir = join(KORD_DIR, "plans")
      mkdirSync(plansDir, { recursive: true })
      const planPath = join(plansDir, "after-executor-plan.md")
      writeFileSync(planPath, [
        "# Plan",
        "- [ ] 1. Design UI mockups",
        "  **Executor**: ux-design-expert",
        "  **Verify**: qa-scenarios",
        "  **Category**: visual-engineering",
      ].join("\n"))

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "after-executor-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Previous task completed",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - output should contain next task delegation context
      expect(output.output).toContain("NEXT TASK DELEGATION")
      expect(output.output).toContain("ux-design-expert")
      expect(output.output).toContain("visual-engineering")
      expect(output.output).toContain("qa-scenarios")

      cleanupMessageStorage(sessionID)
    })

    test("should not include executor when plan has no executor fields", async () => {
      // given - plan without executor fields
      const sessionID = "session-no-executor"
      setupMessageStorage(sessionID, "build")

      const plansDir = join(KORD_DIR, "plans")
      mkdirSync(plansDir, { recursive: true })
      const planPath = join(plansDir, "plain-plan.md")
      writeFileSync(planPath, [
        "# Plan",
        "- [ ] 1. Simple task",
        "- [ ] 2. Another task",
      ].join("\n"))

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plain-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task done",
        metadata: {},
      }

      // when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      // then - should still have next task context but without executor
      expect(output.output).toContain("NEXT TASK DELEGATION")
      expect(output.output).toContain("CURRENT TASK: #1")
      expect(output.output).not.toContain("EXECUTOR")

      cleanupMessageStorage(sessionID)
    })
  })

  describe("wave-aware orchestration (EPIC-03 S02)", () => {
    const WAVE_MAIN_SESSION = "wave-main-session"

    beforeEach(() => {
      _resetForTesting()
      setMainSession(WAVE_MAIN_SESSION)
      subagentSessions.clear()
      setupMessageStorage(WAVE_MAIN_SESSION, "builder")
    })

    afterEach(() => {
      cleanupMessageStorage(WAVE_MAIN_SESSION)
      _resetForTesting()
    })

    test("should include wave context in continuation prompt for wave-based plan", async () => {
      //#given - plan with wave structure and boulder state with current_wave
      const plansDir = join(KORD_DIR, "plans")
      mkdirSync(plansDir, { recursive: true })
      const planPath = join(plansDir, "wave-plan.md")
      writeFileSync(planPath, [
        "# PLAN: Auth System",
        "",
        "## Wave Structure",
        "",
        "### Wave 1 — Foundation",
        "- [x] 1. Setup project structure",
        "  **Executor**: dev-junior",
        "- [x] 2. Install dependencies",
        "  **Executor**: dev-junior",
        "",
        "### Wave 2 — Implementation",
        "- [ ] 3. Build login API",
        "  **Executor**: dev",
        "- [ ] 4. Build registration API",
        "  **Executor**: dev",
      ].join("\n"))

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [WAVE_MAIN_SESSION],
        plan_name: "wave-plan",
        plan_type: "story-driven",
        current_wave: 2,
      }
      writeBoulderState(TEST_DIR, state)

      const mockInput = createMockPluginInput()
      const hook = createBuildHook(mockInput)

      //#when - session goes idle
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: WAVE_MAIN_SESSION },
        },
      })

      //#then - continuation prompt should include wave context
      expect(mockInput._promptMock).toHaveBeenCalled()
      const callArgs = mockInput._promptMock.mock.calls[0][0]
      const promptText = callArgs.body.parts[0].text
      expect(promptText).toContain("Wave 2")
    })

    test("should include wave progress in tool.execute.after output for wave-based plan", async () => {
      //#given - wave-based plan with boulder state
      const sessionID = "session-wave-after"
      setupMessageStorage(sessionID, "build")

      const plansDir = join(KORD_DIR, "plans")
      mkdirSync(plansDir, { recursive: true })
      const planPath = join(plansDir, "wave-after-plan.md")
      writeFileSync(planPath, [
        "# PLAN: Feature X",
        "",
        "### Wave 1 — Setup",
        "- [x] 1. Init project",
        "  **Executor**: dev-junior",
        "- [ ] 2. Create config",
        "  **Executor**: dev-junior",
        "",
        "### Wave 2 — Build",
        "- [ ] 3. Implement core",
        "  **Executor**: dev",
      ].join("\n"))

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "wave-after-plan",
        plan_type: "story-driven",
        current_wave: 1,
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task completed successfully",
        metadata: {},
      }

      //#when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      //#then - output should contain wave progress info
      expect(output.output).toContain("SUBAGENT WORK COMPLETED")
      expect(output.output).toContain("Wave 1")

      cleanupMessageStorage(sessionID)
    })

    test("should delegate to correct executor from wave task metadata", async () => {
      //#given - wave plan where next task has specific executor
      const sessionID = "session-wave-executor"
      setupMessageStorage(sessionID, "build")

      const plansDir = join(KORD_DIR, "plans")
      mkdirSync(plansDir, { recursive: true })
      const planPath = join(plansDir, "wave-executor-plan.md")
      writeFileSync(planPath, [
        "### Wave 1 — Docs",
        "- [x] 1. Create PRD",
        "  **Executor**: pm",
        "- [ ] 2. Architecture design",
        "  **Executor**: architect",
        "  **Verify**: none",
      ].join("\n"))

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "wave-executor-plan",
        plan_type: "story-driven",
        current_wave: 1,
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "PRD created successfully",
        metadata: {},
      }

      //#when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      //#then - next task delegation should reference architect
      expect(output.output).toContain("NEXT TASK DELEGATION")
      expect(output.output).toContain("architect")
      expect(output.output).toContain("CURRENT TASK: #2")

      cleanupMessageStorage(sessionID)
    })

    test("should preserve existing behavior when plan has no waves", async () => {
      //#given - flat plan (no wave headings) with boulder state
      const sessionID = "session-no-waves"
      setupMessageStorage(sessionID, "build")

      const planPath = join(TEST_DIR, "flat-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] 1. Task A\n- [ ] 2. Task B")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "flat-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createBuildHook(createMockPluginInput())
      const output = {
        title: "Kord Task",
        output: "Task output",
        metadata: {},
      }

      //#when
      await hook["tool.execute.after"](
        { tool: "task", sessionID },
        output
      )

      //#then - should still work as before (SUBAGENT WORK COMPLETED, no wave info)
      expect(output.output).toContain("SUBAGENT WORK COMPLETED")
      expect(output.output).toContain("NEXT TASK DELEGATION")
      expect(output.output).toContain("CURRENT TASK: #1")
      expect(output.output).not.toContain("Wave")

      cleanupMessageStorage(sessionID)
    })
  })
})
