import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  readBoulderState,
  writeBoulderState,
  appendSessionId,
  clearBoulderState,
  getPlanProgress,
  getPlanName,
  createBoulderState,
  findPlanPlans,
} from "./storage"
import type { BoulderState } from "./types"

describe("boulder-state", () => {
  const TEST_DIR = join(tmpdir(), "boulder-state-test-" + Date.now())
  const KORD_DIR = join(TEST_DIR, "docs", "kord")

  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true })
    }
    if (!existsSync(KORD_DIR)) {
      mkdirSync(KORD_DIR, { recursive: true })
    }
    clearBoulderState(TEST_DIR)
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  describe("readBoulderState", () => {
    test("should return null when no boulder.json exists", () => {
      // given - no boulder.json file
      // when
      const result = readBoulderState(TEST_DIR)
      // then
      expect(result).toBeNull()
    })

    test("should read valid boulder state", () => {
      // given - valid boulder.json
      const state: BoulderState = {
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1", "session-2"],
        plan_name: "my-plan",
      }
      writeBoulderState(TEST_DIR, state)

      // when
      const result = readBoulderState(TEST_DIR)

      // then
      expect(result).not.toBeNull()
      expect(result?.active_plan).toBe("/path/to/plan.md")
      expect(result?.session_ids).toEqual(["session-1", "session-2"])
      expect(result?.plan_name).toBe("my-plan")
    })
  })

  describe("writeBoulderState", () => {
    test("should write state and create docs/kord directory if needed", () => {
      // given - state to write
      const state: BoulderState = {
        active_plan: "/test/plan.md",
        started_at: "2026-01-02T12:00:00Z",
        session_ids: ["ses-123"],
        plan_name: "test-plan",
      }

      // when
      const success = writeBoulderState(TEST_DIR, state)
      const readBack = readBoulderState(TEST_DIR)

      // then
      expect(success).toBe(true)
      expect(readBack).not.toBeNull()
      expect(readBack?.active_plan).toBe("/test/plan.md")
    })
  })

  describe("appendSessionId", () => {
    test("should append new session id to existing state", () => {
      // given - existing state with one session
      const state: BoulderState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
      }
      writeBoulderState(TEST_DIR, state)

      // when
      const result = appendSessionId(TEST_DIR, "session-2")

      // then
      expect(result).not.toBeNull()
      expect(result?.session_ids).toEqual(["session-1", "session-2"])
    })

    test("should not duplicate existing session id", () => {
      // given - state with session-1 already
      const state: BoulderState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
      }
      writeBoulderState(TEST_DIR, state)

      // when
      appendSessionId(TEST_DIR, "session-1")
      const result = readBoulderState(TEST_DIR)

      // then
      expect(result?.session_ids).toEqual(["session-1"])
    })

    test("should return null when no state exists", () => {
      // given - no boulder.json
      // when
      const result = appendSessionId(TEST_DIR, "new-session")
      // then
      expect(result).toBeNull()
    })
  })

  describe("clearBoulderState", () => {
    test("should remove boulder.json", () => {
      // given - existing state
      const state: BoulderState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
      }
      writeBoulderState(TEST_DIR, state)

      // when
      const success = clearBoulderState(TEST_DIR)
      const result = readBoulderState(TEST_DIR)

      // then
      expect(success).toBe(true)
      expect(result).toBeNull()
    })

    test("should succeed even when no file exists", () => {
      // given - no boulder.json
      // when
      const success = clearBoulderState(TEST_DIR)
      // then
      expect(success).toBe(true)
    })
  })

  describe("getPlanProgress", () => {
    test("should count completed and uncompleted checkboxes", () => {
      // given - plan file with checkboxes
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, `# Plan
- [ ] Task 1
- [x] Task 2  
- [ ] Task 3
- [X] Task 4
`)

      // when
      const progress = getPlanProgress(planPath)

      // then
      expect(progress.total).toBe(4)
      expect(progress.completed).toBe(2)
      expect(progress.isComplete).toBe(false)
    })

    test("should return isComplete true when all checked", () => {
      // given - all tasks completed
      const planPath = join(TEST_DIR, "complete-plan.md")
      writeFileSync(planPath, `# Plan
- [x] Task 1
- [X] Task 2
`)

      // when
      const progress = getPlanProgress(planPath)

      // then
      expect(progress.total).toBe(2)
      expect(progress.completed).toBe(2)
      expect(progress.isComplete).toBe(true)
    })

    test("should return isComplete true for empty plan", () => {
      // given - plan with no checkboxes
      const planPath = join(TEST_DIR, "empty-plan.md")
      writeFileSync(planPath, "# Plan\nNo tasks here")

      // when
      const progress = getPlanProgress(planPath)

      // then
      expect(progress.total).toBe(0)
      expect(progress.isComplete).toBe(true)
    })

    test("should handle non-existent file", () => {
      // given - non-existent file
      // when
      const progress = getPlanProgress("/non/existent/file.md")
      // then
      expect(progress.total).toBe(0)
      expect(progress.isComplete).toBe(true)
    })
  })

  describe("getPlanName", () => {
    test("should extract plan name from path", () => {
      // given
      const path = "/home/user/docs/kord/plans/project/my-feature.md"
      // when
      const name = getPlanName(path)
      // then
      expect(name).toBe("my-feature")
    })
  })

  describe("createBoulderState", () => {
    test("should create state with correct fields", () => {
      // given
      const planPath = "/path/to/auth-refactor.md"
      const sessionId = "ses-abc123"

      // when
      const state = createBoulderState(planPath, sessionId)

      // then
      expect(state.active_plan).toBe(planPath)
      expect(state.session_ids).toEqual([sessionId])
      expect(state.plan_name).toBe("auth-refactor")
      expect(state.started_at).toBeDefined()
    })

    test("should include agent field when provided", () => {
      //#given - plan path, session id, and agent type
      const planPath = "/path/to/feature.md"
      const sessionId = "ses-xyz789"
      const agent = "builder"

      //#when - createBoulderState is called with agent
      const state = createBoulderState(planPath, sessionId, agent)

      //#then - state should include the agent field
      expect(state.agent).toBe("builder")
      expect(state.active_plan).toBe(planPath)
      expect(state.session_ids).toEqual([sessionId])
      expect(state.plan_name).toBe("feature")
    })

    test("should allow agent to be undefined", () => {
      //#given - plan path and session id without agent
      const planPath = "/path/to/legacy.md"
      const sessionId = "ses-legacy"

      //#when - createBoulderState is called without agent
      const state = createBoulderState(planPath, sessionId)

      //#then - state should not have agent field (backward compatible)
      expect(state.agent).toBeUndefined()
    })
  })

  describe("extended boulder state fields (EPIC-03 S01)", () => {
    test("should serialize and deserialize plan_type field", () => {
      //#given - boulder state with plan_type
      const state: BoulderState = {
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
        plan_type: "story-driven",
      }

      //#when - write and read back
      writeBoulderState(TEST_DIR, state)
      const result = readBoulderState(TEST_DIR)

      //#then - plan_type should survive roundtrip
      expect(result).not.toBeNull()
      expect(result!.plan_type).toBe("story-driven")
    })

    test("should serialize and deserialize current_wave field", () => {
      //#given - boulder state with current_wave
      const state: BoulderState = {
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
        current_wave: 2,
      }

      //#when - write and read back
      writeBoulderState(TEST_DIR, state)
      const result = readBoulderState(TEST_DIR)

      //#then
      expect(result!.current_wave).toBe(2)
    })

    test("should serialize and deserialize waves progress array", () => {
      //#given - boulder state with waves progress
      const state: BoulderState = {
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
        waves: [
          { number: 1, name: "Foundation", total: 3, completed: 3 },
          { number: 2, name: "Implementation", total: 5, completed: 2 },
        ],
      }

      //#when - write and read back
      writeBoulderState(TEST_DIR, state)
      const result = readBoulderState(TEST_DIR)

      //#then
      expect(result!.waves).toHaveLength(2)
      expect(result!.waves![0]).toEqual({ number: 1, name: "Foundation", total: 3, completed: 3 })
      expect(result!.waves![1]).toEqual({ number: 2, name: "Implementation", total: 5, completed: 2 })
    })

    test("should serialize and deserialize executor field", () => {
      //#given - boulder state with executor
      const state: BoulderState = {
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
        executor: "dev-junior",
      }

      //#when - write and read back
      writeBoulderState(TEST_DIR, state)
      const result = readBoulderState(TEST_DIR)

      //#then
      expect(result!.executor).toBe("dev-junior")
    })

    test("should serialize and deserialize quality_gate_iterations field", () => {
      //#given - boulder state with quality gate iterations
      const state: BoulderState = {
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
        quality_gate_iterations: { "/path/to/story.md": 2 },
      }

      //#when - write and read back
      writeBoulderState(TEST_DIR, state)
      const result = readBoulderState(TEST_DIR)

      //#then
      expect(result!.quality_gate_iterations).toEqual({ "/path/to/story.md": 2 })
    })

    test("should preserve backward compatibility - new fields absent", () => {
      //#given - old-format boulder state (no new fields)
      const state: BoulderState = {
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
      }

      //#when - write and read back
      writeBoulderState(TEST_DIR, state)
      const result = readBoulderState(TEST_DIR)

      //#then - new fields should be undefined
      expect(result).not.toBeNull()
      expect(result!.active_plan).toBe("/path/to/plan.md")
      expect(result!.plan_type).toBeUndefined()
      expect(result!.current_wave).toBeUndefined()
      expect(result!.waves).toBeUndefined()
      expect(result!.executor).toBeUndefined()
      expect(result!.quality_gate_iterations).toBeUndefined()
    })

    test("should serialize all extended fields together", () => {
      //#given - boulder state with all extended fields
      const state: BoulderState = {
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "epic-feature",
        agent: "builder",
        squad: "platform-team",
        plan_type: "task-driven",
        current_wave: 1,
        waves: [{ number: 1, total: 4, completed: 1 }],
        executor: "dev",
        quality_gate_iterations: { "story.md": 1 },
      }

      //#when - write and read back
      writeBoulderState(TEST_DIR, state)
      const result = readBoulderState(TEST_DIR)

      //#then - all fields survive roundtrip
      expect(result!.plan_type).toBe("task-driven")
      expect(result!.current_wave).toBe(1)
      expect(result!.waves).toEqual([{ number: 1, total: 4, completed: 1 }])
      expect(result!.executor).toBe("dev")
      expect(result!.quality_gate_iterations).toEqual({ "story.md": 1 })
        expect(result!.agent).toBe("builder")
      expect(result!.squad).toBe("platform-team")
    })

    test("createBoulderState should accept extended options", () => {
      //#given - plan path, session, and extended options
      const planPath = "/path/to/big-plan.md"
      const sessionId = "ses-ext-001"

      //#when - createBoulderState with extended options
      const state = createBoulderState(planPath, sessionId, "builder", "devops", {
        plan_type: "story-driven",
        current_wave: 1,
        waves: [{ number: 1, total: 3, completed: 0 }],
        executor: "dev-junior",
        quality_gate_iterations: { "story.md": 1 },
      })

      //#then - all extended fields should be set
      expect(state.plan_type).toBe("story-driven")
      expect(state.current_wave).toBe(1)
      expect(state.waves).toEqual([{ number: 1, total: 3, completed: 0 }])
      expect(state.executor).toBe("dev-junior")
      expect(state.quality_gate_iterations).toEqual({ "story.md": 1 })
      expect(state.agent).toBe("builder")
      expect(state.squad).toBe("devops")
    })

    test("createBoulderState should work without extended options (backward compat)", () => {
      //#given - plan path and session only
      const planPath = "/path/to/simple.md"
      const sessionId = "ses-simple"

      //#when - createBoulderState without extended options
      const state = createBoulderState(planPath, sessionId, "builder")

      //#then - extended fields should be undefined
      expect(state.plan_type).toBeUndefined()
      expect(state.current_wave).toBeUndefined()
      expect(state.waves).toBeUndefined()
      expect(state.executor).toBeUndefined()
      expect(state.quality_gate_iterations).toBeUndefined()
    })
  })
})
