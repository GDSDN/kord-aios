import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  buildWaveCheckpointSummary,
  formatCheckpointPrompt,
  parseCheckpointAction,
  applyCheckpointResult,
  createWaveCheckpointHook,
} from "./index"
import { readBoulderState, writeBoulderState } from "../../features/boulder-state"
import type { BoulderState } from "../../features/boulder-state"

const TEST_DIR = join(tmpdir(), "wave-checkpoint-test-" + Date.now())
const KORD_DIR = join(TEST_DIR, "docs", "kord")
const PLANS_DIR = join(KORD_DIR, "plans")

function createWavePlan(filename: string, content: string): string {
  const planPath = join(PLANS_DIR, filename)
  writeFileSync(planPath, content)
  return planPath
}

describe("wave-checkpoint hook", () => {
  beforeEach(() => {
    mkdirSync(PLANS_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  describe("buildWaveCheckpointSummary", () => {
    test("should build summary for a completed wave", () => {
      //#given - plan with wave 1 complete, wave 2 pending
      const planPath = createWavePlan("checkpoint-1.md", [
        "### Wave 1 — Foundation",
        "- [x] 1. Setup project",
        "- [x] 2. Install deps",
        "",
        "### Wave 2 — Implementation",
        "- [ ] 3. Build API",
        "- [ ] 4. Build UI",
      ].join("\n"))

      //#when
      const summary = buildWaveCheckpointSummary(planPath, 1)

      //#then
      expect(summary).not.toBeNull()
      expect(summary!.waveNumber).toBe(1)
      expect(summary!.waveName).toBe("Foundation")
      expect(summary!.totalItems).toBe(2)
      expect(summary!.completedItems).toBe(2)
      expect(summary!.failedItems).toBeUndefined()
      expect(summary!.nextWaveNumber).toBe(2)
      expect(summary!.nextWaveName).toBe("Implementation")
      expect(summary!.nextWaveItems).toBe(2)
      expect(summary!.totalWaves).toBe(2)
    })

    test("should include failed items count when wave is partially complete", () => {
      //#given - wave 1 with one incomplete task
      const planPath = createWavePlan("checkpoint-partial.md", [
        "### Wave 1 — Setup",
        "- [x] 1. Task A",
        "- [ ] 2. Task B (blocked)",
        "",
        "### Wave 2 — Build",
        "- [ ] 3. Task C",
      ].join("\n"))

      //#when
      const summary = buildWaveCheckpointSummary(planPath, 1)

      //#then
      expect(summary!.completedItems).toBe(1)
      expect(summary!.failedItems).toBe(1)
    })

    test("should return null for non-existent wave", () => {
      //#given
      const planPath = createWavePlan("checkpoint-nowave.md", [
        "### Wave 1 — Only Wave",
        "- [x] 1. Done",
      ].join("\n"))

      //#when
      const summary = buildWaveCheckpointSummary(planPath, 5)

      //#then
      expect(summary).toBeNull()
    })

    test("should indicate last wave when no next wave exists", () => {
      //#given - single wave plan
      const planPath = createWavePlan("checkpoint-last.md", [
        "### Wave 1 — Only",
        "- [x] 1. Done",
      ].join("\n"))

      //#when
      const summary = buildWaveCheckpointSummary(planPath, 1)

      //#then
      expect(summary!.nextWaveNumber).toBeUndefined()
      expect(summary!.nextWaveName).toBeUndefined()
    })

    test("should return null for plan with no waves", () => {
      //#given - flat plan
      const planPath = createWavePlan("checkpoint-flat.md", "# Plan\n- [ ] 1. Task")

      //#when
      const summary = buildWaveCheckpointSummary(planPath, 1)

      //#then
      expect(summary).toBeNull()
    })
  })

  describe("formatCheckpointPrompt", () => {
    test("should format mid-plan checkpoint prompt", () => {
      //#given
      const summary = {
        waveNumber: 1,
        waveName: "Foundation",
        totalItems: 3,
        completedItems: 3,
        nextWaveNumber: 2,
        nextWaveName: "Implementation",
        nextWaveItems: 4,
        totalWaves: 3,
      }

      //#when
      const prompt = formatCheckpointPrompt(summary)

      //#then
      expect(prompt).toContain("Wave 1 Complete")
      expect(prompt).toContain("Foundation")
      expect(prompt).toContain("3/3")
      expect(prompt).toContain("Wave 2")
      expect(prompt).toContain("Implementation")
      expect(prompt).toContain("4 items")
      expect(prompt).toContain("GO")
      expect(prompt).toContain("PAUSE")
      expect(prompt).toContain("REVIEW")
      expect(prompt).toContain("ABORT")
    })

    test("should format all-waves-complete prompt", () => {
      //#given - last wave summary with no next wave
      const summary = {
        waveNumber: 3,
        waveName: "Delivery",
        totalItems: 2,
        completedItems: 2,
        totalWaves: 3,
      }

      //#when
      const prompt = formatCheckpointPrompt(summary)

      //#then
      expect(prompt).toContain("All Waves Complete")
      expect(prompt).toContain("Wave 3 was the final wave")
      expect(prompt).toContain("Delivery")
      expect(prompt).toContain("All done")
    })

    test("should include failed items line when present", () => {
      //#given
      const summary = {
        waveNumber: 1,
        totalItems: 5,
        completedItems: 3,
        failedItems: 2,
        nextWaveNumber: 2,
        nextWaveItems: 3,
        totalWaves: 2,
      }

      //#when
      const prompt = formatCheckpointPrompt(summary)

      //#then
      expect(prompt).toContain("Failed/Blocked")
      expect(prompt).toContain("2 items")
    })
  })

  describe("parseCheckpointAction", () => {
    test("should parse GO action", () => {
      expect(parseCheckpointAction("GO")).toBe("GO")
      expect(parseCheckpointAction("go ahead")).toBe("GO")
      expect(parseCheckpointAction("Let's go to the next wave")).toBe("GO")
    })

    test("should parse PAUSE action", () => {
      expect(parseCheckpointAction("PAUSE")).toBe("PAUSE")
      expect(parseCheckpointAction("pause execution")).toBe("PAUSE")
    })

    test("should parse REVIEW action", () => {
      expect(parseCheckpointAction("REVIEW")).toBe("REVIEW")
      expect(parseCheckpointAction("I want to review the plan")).toBe("REVIEW")
    })

    test("should parse ABORT action", () => {
      expect(parseCheckpointAction("ABORT")).toBe("ABORT")
      expect(parseCheckpointAction("abort everything")).toBe("ABORT")
    })

    test("should prioritize ABORT over other actions", () => {
      //#given - text containing multiple action keywords
      //#then - ABORT has highest priority
      expect(parseCheckpointAction("let's abort and go")).toBe("ABORT")
    })

    test("should default to GO for unrecognized input", () => {
      expect(parseCheckpointAction("continue")).toBe("GO")
      expect(parseCheckpointAction("yes")).toBe("GO")
      expect(parseCheckpointAction("")).toBe("GO")
    })
  })

  describe("applyCheckpointResult", () => {
    test("GO should advance current_wave in boulder state", () => {
      //#given - boulder state at wave 1
      const state: BoulderState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["s1"],
        plan_name: "plan",
        current_wave: 1,
      }
      writeBoulderState(TEST_DIR, state)

      //#when
      applyCheckpointResult(TEST_DIR, { action: "GO" })

      //#then
      const updated = readBoulderState(TEST_DIR)
      expect(updated!.current_wave).toBe(2)
    })

    test("PAUSE should not change current_wave", () => {
      //#given
      const state: BoulderState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["s1"],
        plan_name: "plan",
        current_wave: 2,
      }
      writeBoulderState(TEST_DIR, state)

      //#when
      applyCheckpointResult(TEST_DIR, { action: "PAUSE" })

      //#then
      const updated = readBoulderState(TEST_DIR)
      expect(updated!.current_wave).toBe(2)
    })

    test("REVIEW should not change current_wave", () => {
      //#given
      const state: BoulderState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["s1"],
        plan_name: "plan",
        current_wave: 1,
      }
      writeBoulderState(TEST_DIR, state)

      //#when
      applyCheckpointResult(TEST_DIR, { action: "REVIEW" })

      //#then
      const updated = readBoulderState(TEST_DIR)
      expect(updated!.current_wave).toBe(1)
    })

    test("ABORT should not change current_wave", () => {
      //#given
      const state: BoulderState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["s1"],
        plan_name: "plan",
        current_wave: 3,
      }
      writeBoulderState(TEST_DIR, state)

      //#when
      applyCheckpointResult(TEST_DIR, { action: "ABORT" })

      //#then
      const updated = readBoulderState(TEST_DIR)
      expect(updated!.current_wave).toBe(3)
    })
  })

  describe("createWaveCheckpointHook", () => {
    test("auto mode should silently advance and return null", () => {
      //#given - wave 1 complete, auto mode
      const planPath = createWavePlan("auto-plan.md", [
        "### Wave 1 — Setup",
        "- [x] 1. Done",
        "### Wave 2 — Build",
        "- [ ] 2. Pending",
      ].join("\n"))

      const state: BoulderState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["s1"],
        plan_name: "auto-plan",
        current_wave: 1,
      }
      writeBoulderState(TEST_DIR, state)

      const hook = createWaveCheckpointHook(TEST_DIR, { mode: "auto" })

      //#when
      const result = hook.checkWaveCompletion(planPath, 1)

      //#then - auto mode returns null (silently advances)
      expect(result).toBeNull()
      const updated = readBoulderState(TEST_DIR)
      expect(updated!.current_wave).toBe(2)
    })

    test("interactive mode should return checkpoint prompt", () => {
      //#given - wave 1 complete, interactive mode
      const planPath = createWavePlan("interactive-plan.md", [
        "### Wave 1 — Setup",
        "- [x] 1. Done",
        "- [x] 2. Also done",
        "### Wave 2 — Build",
        "- [ ] 3. Pending",
      ].join("\n"))

      const hook = createWaveCheckpointHook(TEST_DIR, { mode: "interactive" })

      //#when
      const result = hook.checkWaveCompletion(planPath, 1)

      //#then - interactive mode returns checkpoint prompt
      expect(result).not.toBeNull()
      expect(result).toContain("Wave 1 Complete")
      expect(result).toContain("GO")
      expect(result).toContain("ABORT")
    })

    test("should return completion message when all waves done", () => {
      //#given - last wave complete
      const planPath = createWavePlan("complete-plan.md", [
        "### Wave 1 — Only Wave",
        "- [x] 1. Done",
        "- [x] 2. Also done",
      ].join("\n"))

      const hook = createWaveCheckpointHook(TEST_DIR, { mode: "auto" })

      //#when
      const result = hook.checkWaveCompletion(planPath, 1)

      //#then - all-complete message shown regardless of mode
      expect(result).not.toBeNull()
      expect(result).toContain("All Waves Complete")
    })

    test("should return null when wave is not yet complete", () => {
      //#given - wave 1 still has incomplete tasks
      const planPath = createWavePlan("incomplete-plan.md", [
        "### Wave 1 — Setup",
        "- [x] 1. Done",
        "- [ ] 2. Not done",
        "### Wave 2 — Build",
        "- [ ] 3. Pending",
      ].join("\n"))

      const hook = createWaveCheckpointHook(TEST_DIR, { mode: "interactive" })

      //#when
      const result = hook.checkWaveCompletion(planPath, 1)

      //#then - no checkpoint needed
      expect(result).toBeNull()
    })

    test("defaults to auto mode", () => {
      //#given - no mode specified
      const hook = createWaveCheckpointHook(TEST_DIR)

      //#then
      expect(hook.mode).toBe("auto")
    })
  })
})
