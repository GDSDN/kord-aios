import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir, homedir } from "node:os"
import { randomUUID } from "node:crypto"
import { createStartWorkHook } from "./index"
import {
  writeBoulderState,
  clearBoulderState,
} from "../../features/boulder-state"
import type { BoulderState } from "../../features/boulder-state"
import * as sessionState from "../../features/claude-code-session-state"

describe("start-work hook", () => {
  let testDir: string
  let kordDir: string

  function createMockPluginInput() {
    return {
      directory: testDir,
      client: {},
    } as Parameters<typeof createStartWorkHook>[0]
  }

  beforeEach(() => {
    testDir = join(tmpdir(), `start-work-test-${randomUUID()}`)
    kordDir = join(testDir, "docs", "kord")
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
    if (!existsSync(kordDir)) {
      mkdirSync(kordDir, { recursive: true })
    }
    clearBoulderState(testDir)
  })

  afterEach(() => {
    clearBoulderState(testDir)
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe("chat.message handler", () => {
    test("should ignore non-start-work commands", async () => {
      // given - hook and non-start-work message
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: "Just a regular message" }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - output should be unchanged
      expect(output.parts[0].text).toBe("Just a regular message")
    })

    test("should detect start-work command via session-context tag", async () => {
      // given - hook and start-work message
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: "<session-context>Some context here</session-context>",
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - output should be modified with context info
      expect(output.parts[0].text).toContain("---")
    })

    test("should inject resume info when existing boulder state found", async () => {
      // given - existing boulder state with incomplete plan
      const planPath = join(testDir, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [x] Task 2")

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "test-plan",
      }
      writeBoulderState(testDir, state)

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: "<session-context></session-context>" }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should show resuming status
      expect(output.parts[0].text).toContain("RESUMING")
      expect(output.parts[0].text).toContain("test-plan")
    })

    test("should replace $SESSION_ID placeholder", async () => {
      // given - hook and message with placeholder
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: "<session-context>Session: $SESSION_ID</session-context>",
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "ses-abc123" },
        output
      )

      // then - placeholder should be replaced
      expect(output.parts[0].text).toContain("ses-abc123")
      expect(output.parts[0].text).not.toContain("$SESSION_ID")
    })

    test("should replace $TIMESTAMP placeholder", async () => {
      // given - hook and message with placeholder
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: "<session-context>Time: $TIMESTAMP</session-context>",
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - placeholder should be replaced with ISO timestamp
      expect(output.parts[0].text).not.toContain("$TIMESTAMP")
      expect(output.parts[0].text).toMatch(/\d{4}-\d{2}-\d{2}T/)
    })

    test("should auto-select when only one incomplete plan among multiple plans", async () => {
      // given - multiple plans but only one incomplete
      const plansDir = join(testDir, "docs", "kord", "plans")
      mkdirSync(plansDir, { recursive: true })

      // Plan 1: complete (all checked)
      const plan1Path = join(plansDir, "plan-complete.md")
      writeFileSync(plan1Path, "# Plan Complete\n- [x] Task 1\n- [x] Task 2")

      // Plan 2: incomplete (has unchecked)
      const plan2Path = join(plansDir, "plan-incomplete.md")
      writeFileSync(plan2Path, "# Plan Incomplete\n- [ ] Task 1\n- [x] Task 2")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: "<session-context></session-context>" }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should auto-select the incomplete plan, not ask user
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
      expect(output.parts[0].text).toContain("plan-incomplete")
      expect(output.parts[0].text).not.toContain("Multiple Plans Found")
    })

    test("should wrap multiple plans message in system-reminder tag", async () => {
      // given - multiple incomplete plans
      const plansDir = join(testDir, "docs", "kord", "plans")
      mkdirSync(plansDir, { recursive: true })

      const plan1Path = join(plansDir, "plan-a.md")
      writeFileSync(plan1Path, "# Plan A\n- [ ] Task 1")

      const plan2Path = join(plansDir, "plan-b.md")
      writeFileSync(plan2Path, "# Plan B\n- [ ] Task 2")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: "<session-context></session-context>" }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should use system-reminder tag format
      expect(output.parts[0].text).toContain("<system-reminder>")
      expect(output.parts[0].text).toContain("</system-reminder>")
      expect(output.parts[0].text).toContain("Multiple Plans Found")
    })

    test("should use 'ask user' prompt style for multiple plans", async () => {
      // given - multiple incomplete plans
      const plansDir = join(testDir, "docs", "kord", "plans")
      mkdirSync(plansDir, { recursive: true })

      const plan1Path = join(plansDir, "plan-x.md")
      writeFileSync(plan1Path, "# Plan X\n- [ ] Task 1")

      const plan2Path = join(plansDir, "plan-y.md")
      writeFileSync(plan2Path, "# Plan Y\n- [ ] Task 2")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: "<session-context></session-context>" }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should prompt agent to ask user, not ask directly
      expect(output.parts[0].text).toContain("Ask the user")
      expect(output.parts[0].text).not.toContain("Which plan would you like to work on?")
    })

    test("should select explicitly specified plan name from user-request, ignoring existing boulder state", async () => {
      // given - existing boulder state pointing to old plan
      const plansDir = join(testDir, "docs", "kord", "plans")
      mkdirSync(plansDir, { recursive: true })

      // Old plan (in boulder state)
      const oldPlanPath = join(plansDir, "old-plan.md")
      writeFileSync(oldPlanPath, "# Old Plan\n- [ ] Old Task 1")

      // New plan (user wants this one)
      const newPlanPath = join(plansDir, "new-plan.md")
      writeFileSync(newPlanPath, "# New Plan\n- [ ] New Task 1")

      // Set up stale boulder state pointing to old plan
      const staleState: BoulderState = {
        active_plan: oldPlanPath,
        started_at: "2026-01-01T10:00:00Z",
        session_ids: ["old-session"],
        plan_name: "old-plan",
      }
      writeBoulderState(testDir, staleState)

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: `<session-context>
<user-request>new-plan</user-request>
</session-context>`,
          },
        ],
      }

      // when - user explicitly specifies new-plan
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should select new-plan, NOT resume old-plan
      expect(output.parts[0].text).toContain("new-plan")
      expect(output.parts[0].text).not.toContain("RESUMING")
      expect(output.parts[0].text).not.toContain("old-plan")
    })

    test("should strip ultrawork/ulw keywords from plan name argument", async () => {
      // given - plan with ultrawork keyword in user-request
      const plansDir = join(testDir, "docs", "kord", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "my-feature-plan.md")
      writeFileSync(planPath, "# My Feature Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: `<session-context>
<user-request>my-feature-plan ultrawork</user-request>
</session-context>`,
          },
        ],
      }

      // when - user specifies plan with ultrawork keyword
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should find plan without ultrawork suffix
      expect(output.parts[0].text).toContain("my-feature-plan")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })

    test("should strip ulw keyword from plan name argument", async () => {
      // given - plan with ulw keyword in user-request
      const plansDir = join(testDir, "docs", "kord", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "api-refactor.md")
      writeFileSync(planPath, "# API Refactor\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: `<session-context>
<user-request>api-refactor ulw</user-request>
</session-context>`,
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should find plan without ulw suffix
      expect(output.parts[0].text).toContain("api-refactor")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })

    test("should match plan by partial name", async () => {
      // given - user specifies partial plan name
      const plansDir = join(testDir, "docs", "kord", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "2026-01-15-feature-implementation.md")
      writeFileSync(planPath, "# Feature Implementation\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: `<session-context>
<user-request>feature-implementation</user-request>
</session-context>`,
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should find plan by partial match
      expect(output.parts[0].text).toContain("2026-01-15-feature-implementation")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })
  })

  describe("session agent management", () => {
    test("should update session agent to build when start-work command is triggered", async () => {
      // given
      const updateSpy = spyOn(sessionState, "updateSessionAgent")
      
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: "<session-context></session-context>" }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "ses-plan-to-kord" },
        output
      )

      // then
      expect(updateSpy).toHaveBeenCalledWith("ses-plan-to-kord", "build")
      updateSpy.mockRestore()
    })
  })

  describe("--squad parameter", () => {
    test("should extract squad from user-request and store in boulder state", async () => {
      // given - single incomplete plan + --squad parameter
      const { readBoulderState } = await import("../../features/boulder-state")
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "my-plan.md"), "# Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>my-plan --squad=devops</user-request>",
        }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-squad-1" },
        output
      )

      // then - boulder state should have squad field
      const state = readBoulderState(testDir)
      expect(state).not.toBeNull()
      expect(state!.squad).toBe("devops")
      expect(state!.plan_name).toBe("my-plan")
    })

    test("should extract squad with space separator", async () => {
      // given
      const { readBoulderState } = await import("../../features/boulder-state")
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "feature-x.md"), "# Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>feature-x --squad data-team</user-request>",
        }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-squad-2" },
        output
      )

      // then
      const state = readBoulderState(testDir)
      expect(state).not.toBeNull()
      expect(state!.squad).toBe("data-team")
    })

    test("should strip --squad from plan name extraction", async () => {
      // given
      const { readBoulderState } = await import("../../features/boulder-state")
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "auth-refactor.md"), "# Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>auth-refactor --squad=security</user-request>",
        }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-squad-3" },
        output
      )

      // then - plan name should not contain --squad
      const state = readBoulderState(testDir)
      expect(state).not.toBeNull()
      expect(state!.plan_name).toBe("auth-refactor")
      expect(state!.squad).toBe("security")
    })

    test("should include squad info in context output", async () => {
      // given
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "db-migration.md"), "# Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>db-migration --squad=data-team</user-request>",
        }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-squad-4" },
        output
      )

      // then - output should mention squad
      expect(output.parts[0].text).toContain("Squad")
      expect(output.parts[0].text).toContain("data-team")
    })

    test("should not set squad when --squad is not provided", async () => {
      // given
      const { readBoulderState } = await import("../../features/boulder-state")
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "simple-plan.md"), "# Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>simple-plan</user-request>",
        }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-no-squad" },
        output
      )

      // then - boulder state should not have squad
      const state = readBoulderState(testDir)
      expect(state).not.toBeNull()
      expect(state!.squad).toBeUndefined()
    })
  })

  describe("--wave parameter (EPIC-03 S03)", () => {
    test("should extract --wave from user-request and store in boulder state", async () => {
      //#given - plan with waves + --wave parameter
      const { readBoulderState } = await import("../../features/boulder-state")
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "auth-feature.md"), [
        "# PLAN: Auth",
        "### Wave 1 — Foundation",
        "- [x] 1. Setup",
        "### Wave 2 — Implementation",
        "- [ ] 2. Build API",
      ].join("\n"))

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>auth-feature --wave 2</user-request>",
        }],
      }

      //#when
      await hook["chat.message"](
        { sessionID: "session-wave-1" },
        output
      )

      //#then - boulder state should have current_wave = 2
      const state = readBoulderState(testDir)
      expect(state).not.toBeNull()
      expect(state!.current_wave).toBe(2)
      expect(state!.plan_name).toBe("auth-feature")
    })

    test("should extract --wave with = separator", async () => {
      //#given
      const { readBoulderState } = await import("../../features/boulder-state")
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "db-migration.md"), "# Plan\n- [ ] 1. Task A")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>db-migration --wave=3</user-request>",
        }],
      }

      //#when
      await hook["chat.message"](
        { sessionID: "session-wave-eq" },
        output
      )

      //#then
      const state = readBoulderState(testDir)
      expect(state).not.toBeNull()
      expect(state!.current_wave).toBe(3)
    })

    test("should strip --wave from plan name extraction", async () => {
      //#given
      const { readBoulderState } = await import("../../features/boulder-state")
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "my-feature.md"), "# Plan\n- [ ] 1. Task")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>my-feature --wave 2 --squad=backend</user-request>",
        }],
      }

      //#when
      await hook["chat.message"](
        { sessionID: "session-wave-strip" },
        output
      )

      //#then - plan name should not contain --wave
      const state = readBoulderState(testDir)
      expect(state).not.toBeNull()
      expect(state!.plan_name).toBe("my-feature")
      expect(state!.current_wave).toBe(2)
      expect(state!.squad).toBe("backend")
    })

    test("should not set current_wave when --wave is not provided", async () => {
      //#given
      const { readBoulderState } = await import("../../features/boulder-state")
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "no-wave-plan.md"), "# Plan\n- [ ] 1. Task")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>no-wave-plan</user-request>",
        }],
      }

      //#when
      await hook["chat.message"](
        { sessionID: "session-no-wave" },
        output
      )

      //#then
      const state = readBoulderState(testDir)
      expect(state).not.toBeNull()
      expect(state!.current_wave).toBeUndefined()
    })

    test("should include wave info in context output", async () => {
      //#given
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "wave-info-plan.md"), "# Plan\n- [ ] 1. Task")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>wave-info-plan --wave 2</user-request>",
        }],
      }

      //#when
      await hook["chat.message"](
        { sessionID: "session-wave-info" },
        output
      )

      //#then - output should mention wave
      expect(output.parts[0].text).toContain("Wave")
      expect(output.parts[0].text).toContain("2")
    })

    test("should auto-detect plan_type when plan has wave structure", async () => {
      //#given - plan with wave headings
      const { readBoulderState } = await import("../../features/boulder-state")
      const plansDir = join(kordDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "wave-detect.md"), [
        "# PLAN: Feature",
        "## Plan Type: development",
        "### Wave 1 — Setup",
        "- [ ] 1. Init",
        "### Wave 2 — Build",
        "- [ ] 2. Implement",
      ].join("\n"))

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{
          type: "text",
          text: "<session-context></session-context>\n<user-request>wave-detect</user-request>",
        }],
      }

      //#when
      await hook["chat.message"](
        { sessionID: "session-type-detect" },
        output
      )

      //#then - boulder state should have plan_type detected from waves
      const state = readBoulderState(testDir)
      expect(state).not.toBeNull()
      expect(state!.plan_type).toBe("story-driven")
    })
  })
})
