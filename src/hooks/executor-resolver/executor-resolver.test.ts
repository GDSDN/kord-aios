import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createExecutorResolverHook } from "./index"
import { DEFAULT_EXECUTOR_SKILL_MAP } from "./constants"
import { writeBoulderState } from "../../features/boulder-state"
import type { BoulderState } from "../../features/boulder-state"

const TEST_DIR = join(tmpdir(), "executor-resolver-test-" + Date.now())
const KORD_DIR = join(TEST_DIR, "docs", "kord")

function createMockPluginInput() {
  return {
    directory: TEST_DIR,
    client: {} as any,
    config: {} as any,
  } as any
}

describe("executor-resolver hook", () => {
  beforeEach(() => {
    mkdirSync(KORD_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  describe("default skill mapping", () => {
    test("should inject develop-story skill for dev executor", async () => {
      //#given - delegation with executor=dev
      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        executor: "dev",
        prompt: "Implement the feature",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then
      expect(params.load_skills).toEqual(["develop-story"])
    })

    test("should inject qa-review-story skill for qa executor", async () => {
      //#given
      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        executor: "qa",
        prompt: "Review the implementation",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then
      expect(params.load_skills).toEqual(["qa-review-story"])
    })

    test("should inject create-prd skill for pm executor", async () => {
      //#given
      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        executor: "pm",
        prompt: "Create PRD",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then
      expect(params.load_skills).toEqual(["create-prd"])
    })

    test("should inject skills for all mapped executors", () => {
      //#given - all executors in the default map
      //#then - each should have at least one skill
      for (const [executor, skills] of Object.entries(DEFAULT_EXECUTOR_SKILL_MAP)) {
        expect(skills.length).toBeGreaterThan(0)
        expect(typeof executor).toBe("string")
      }
    })
  })

  describe("skill override from plan item", () => {
    test("should use plan item skills when available from boulder state", async () => {
      //#given - boulder state with plan that has skills field on next task
      const plansDir = join(KORD_DIR, "plans")
      mkdirSync(plansDir, { recursive: true })
      const planPath = join(plansDir, "override-plan.md")
      writeFileSync(planPath, [
        "# Plan",
        "- [ ] 1. Custom task",
        "  **Executor**: dev",
        "  **Skills**: [custom-skill, another-skill]",
      ].join("\n"))

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["s1"],
        plan_name: "override-plan",
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        prompt: "Do the thing",
      }

      //#when - no explicit executor in params, falls back to boulder state
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then - should use plan item skills instead of default mapping
      expect(params.load_skills).toEqual(["custom-skill", "another-skill"])
    })
  })

  describe("explicit load_skills in params", () => {
    test("should not duplicate skills already in params", async () => {
      //#given - params already have develop-story
      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        executor: "dev",
        load_skills: ["develop-story"],
        prompt: "Build it",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then - should not duplicate
      expect(params.load_skills).toEqual(["develop-story"])
    })

    test("should merge new skills with existing ones", async () => {
      //#given - params have one skill, executor maps to another
      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        executor: "dev",
        load_skills: ["git-master"],
        prompt: "Build it",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then - should merge
      expect(params.load_skills).toEqual(["git-master", "develop-story"])
    })
  })

  describe("graceful degradation", () => {
    test("should not fail for unknown executor", async () => {
      //#given - executor not in mapping
      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        executor: "unknown-agent",
        prompt: "Do something",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then - should not modify load_skills
      expect(params.load_skills).toBeUndefined()
    })

    test("should ignore non-delegation tools", async () => {
      //#given - read tool (not a delegation tool)
      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        executor: "dev",
        prompt: "Read file",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "read", sessionID: "s1" },
        params
      )

      //#then - should not inject skills
      expect(params.load_skills).toBeUndefined()
    })

    test("should not inject when no executor available", async () => {
      //#given - no executor in params and no boulder state
      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        prompt: "Do something",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then
      expect(params.load_skills).toBeUndefined()
    })
  })

  describe("custom mapping", () => {
    test("should allow custom executor→skill overrides", async () => {
      //#given - custom mapping overriding dev
      const hook = createExecutorResolverHook(createMockPluginInput(), {
        "dev": ["my-custom-dev-skill"],
      })
      const params: Record<string, unknown> = {
        executor: "dev",
        prompt: "Build",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then - should use custom mapping
      expect(params.load_skills).toEqual(["my-custom-dev-skill"])
    })

    test("should extend default mapping with new executors", async () => {
      //#given - custom mapping adding new executor
      const hook = createExecutorResolverHook(createMockPluginInput(), {
        "ml-engineer": ["train-model"],
      })
      const params: Record<string, unknown> = {
        executor: "ml-engineer",
        prompt: "Train the model",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then
      expect(params.load_skills).toEqual(["train-model"])
    })
  })

  describe("@ prefix handling", () => {
    test("should strip @ prefix from executor name", async () => {
      //#given - executor with @ prefix
      const hook = createExecutorResolverHook(createMockPluginInput())
      const params: Record<string, unknown> = {
        executor: "@dev",
        prompt: "Build it",
      }

      //#when
      await hook["tool.execute.before"](
        { tool: "task", sessionID: "s1" },
        params
      )

      //#then
      expect(params.load_skills).toEqual(["develop-story"])
    })
  })
})
