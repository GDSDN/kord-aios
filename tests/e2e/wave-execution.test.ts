/**
 * EPIC-08 S02: Wave Execution E2E Test
 *
 * Validates multi-wave plan execution:
 * - Plan parsing into waves with tasks
 * - Wave checkpoint logic between waves
 * - Boulder state wave progression tracking
 * - Auto vs interactive checkpoint modes
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { parsePlanWavesFromContent, parsePlanTasksFromContent } from "../../src/features/boulder-state/plan-parser"
import { writeBoulderState, readBoulderState } from "../../src/features/boulder-state/storage"
import {
  buildWaveCheckpointSummary,
  formatCheckpointPrompt,
  parseCheckpointAction,
  applyCheckpointResult,
  createWaveCheckpointHook,
} from "../../src/hooks/wave-checkpoint"
import type { BoulderState } from "../../src/features/boulder-state/types"

function makeTmpDir(): string {
  const dir = join(tmpdir(), `e2e-wave-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

const THREE_WAVE_PLAN = `# Sprint Plan

## Overview

Three-wave development plan for feature implementation.

### Wave 1 — Foundation

- [x] 1. Setup project structure
  **Executor**: @dev
  **Verify**: typecheck
- [x] 2. Create database schema
  **Executor**: @data-engineer
  **Verify**: tdd

### Wave 2 — Implementation

- [ ] 3. Build API endpoints
  **Executor**: @dev
  **Verify**: tdd
- [ ] 4. Create frontend components
  **Executor**: @dev
  **Category**: visual-engineering

### Wave 3 — Delivery

- [ ] 5. Write documentation
  **Executor**: @pm
  **Verify**: none
- [ ] 6. Configure CI/CD
  **Executor**: @devops
  **Verify**: typecheck
`

function writePlanFile(dir: string, content: string): string {
  const plansDir = join(dir, "docs/kord/plans")
  mkdirSync(plansDir, { recursive: true })
  const planPath = join(plansDir, "sprint-plan.md")
  writeFileSync(planPath, content, "utf-8")
  return planPath
}

function setupBoulder(dir: string, planPath: string, wave: number = 1): BoulderState {
  const state: BoulderState = {
    active_plan: planPath,
    started_at: new Date().toISOString(),
    session_ids: ["e2e-session-wave"],
    plan_name: "sprint-plan",
    plan_type: "story-driven",
    current_wave: wave,
    agent: "builder",
  }
  writeBoulderState(dir, state)
  return state
}

describe("EPIC-08 S02: Wave Execution E2E", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTmpDir()
  })

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  //#region Plan Wave Parsing

  describe("plan wave parsing", () => {
    test("parses 3-wave plan into structured waves", () => {
      //#given a 3-wave plan document
      const waves = parsePlanWavesFromContent(THREE_WAVE_PLAN)

      //#then 3 waves extracted with correct structure
      expect(waves).toHaveLength(3)
      expect(waves[0].number).toBe(1)
      expect(waves[0].name).toBe("Foundation")
      expect(waves[0].tasks).toHaveLength(2)
      expect(waves[1].number).toBe(2)
      expect(waves[1].name).toBe("Implementation")
      expect(waves[1].tasks).toHaveLength(2)
      expect(waves[2].number).toBe(3)
      expect(waves[2].name).toBe("Delivery")
      expect(waves[2].tasks).toHaveLength(2)
    })

    test("wave 1 tasks are completed, wave 2-3 tasks are pending", () => {
      const waves = parsePlanWavesFromContent(THREE_WAVE_PLAN)

      //#then wave 1 is complete
      expect(waves[0].tasks.every((t) => t.completed)).toBe(true)
      //#then wave 2 and 3 are not complete
      expect(waves[1].tasks.every((t) => !t.completed)).toBe(true)
      expect(waves[2].tasks.every((t) => !t.completed)).toBe(true)
    })

    test("task executor and verify fields parsed correctly", () => {
      const waves = parsePlanWavesFromContent(THREE_WAVE_PLAN)

      expect(waves[0].tasks[0].executor).toBe("dev")
      expect(waves[0].tasks[0].verify).toBe("typecheck")
      expect(waves[0].tasks[1].executor).toBe("data-engineer")
      expect(waves[0].tasks[1].verify).toBe("tdd")
      expect(waves[1].tasks[1].category).toBe("visual-engineering")
    })

    test("empty content returns no waves", () => {
      expect(parsePlanWavesFromContent("")).toHaveLength(0)
      expect(parsePlanWavesFromContent("# Just a heading")).toHaveLength(0)
    })
  })

  //#endregion

  //#region Wave Checkpoint Summary

  describe("wave checkpoint summary", () => {
    test("builds summary for completed wave 1 with next wave info", () => {
      //#given plan file on disk with wave 1 complete
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      const summary = buildWaveCheckpointSummary(planPath, 1)

      //#then summary includes wave 1 completion and wave 2 preview
      expect(summary).not.toBeNull()
      expect(summary!.waveNumber).toBe(1)
      expect(summary!.waveName).toBe("Foundation")
      expect(summary!.totalItems).toBe(2)
      expect(summary!.completedItems).toBe(2)
      expect(summary!.nextWaveNumber).toBe(2)
      expect(summary!.nextWaveName).toBe("Implementation")
      expect(summary!.nextWaveItems).toBe(2)
      expect(summary!.totalWaves).toBe(3)
    })

    test("returns null for non-existent wave number", () => {
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      expect(buildWaveCheckpointSummary(planPath, 99)).toBeNull()
    })

    test("last wave has no nextWaveNumber", () => {
      // Make wave 3 complete
      const completePlan = THREE_WAVE_PLAN
        .replace("- [ ] 5.", "- [x] 5.")
        .replace("- [ ] 6.", "- [x] 6.")
      const planPath = writePlanFile(tmpDir, completePlan)
      const summary = buildWaveCheckpointSummary(planPath, 3)

      expect(summary).not.toBeNull()
      expect(summary!.nextWaveNumber).toBeUndefined()
    })
  })

  //#endregion

  //#region Checkpoint Prompt Formatting

  describe("checkpoint prompt formatting", () => {
    test("mid-plan checkpoint includes next wave info", () => {
      const prompt = formatCheckpointPrompt({
        waveNumber: 1,
        waveName: "Foundation",
        totalItems: 2,
        completedItems: 2,
        nextWaveNumber: 2,
        nextWaveName: "Implementation",
        nextWaveItems: 3,
        totalWaves: 3,
      })

      expect(prompt).toContain("Wave 1")
      expect(prompt).toContain("Foundation")
      expect(prompt).toContain("Wave 2")
      expect(prompt).toContain("Implementation")
    })

    test("last wave prompt indicates all waves complete", () => {
      const prompt = formatCheckpointPrompt({
        waveNumber: 3,
        waveName: "Delivery",
        totalItems: 2,
        completedItems: 2,
        totalWaves: 3,
      })

      expect(prompt).toContain("Wave 3")
    })
  })

  //#endregion

  //#region Checkpoint Action Parsing

  describe("checkpoint action parsing", () => {
    test("GO recognized from response", () => {
      expect(parseCheckpointAction("GO — looks good")).toBe("GO")
      expect(parseCheckpointAction("Let's go ahead")).toBe("GO")
    })

    test("PAUSE recognized from response", () => {
      expect(parseCheckpointAction("PAUSE — need more time")).toBe("PAUSE")
    })

    test("REVIEW recognized from response", () => {
      expect(parseCheckpointAction("REVIEW — plan needs changes")).toBe("REVIEW")
    })

    test("ABORT recognized from response", () => {
      expect(parseCheckpointAction("ABORT — critical issue found")).toBe("ABORT")
    })

    test("ABORT takes priority over GO", () => {
      expect(parseCheckpointAction("GO but also ABORT")).toBe("ABORT")
    })

    test("defaults to GO for unclear response", () => {
      expect(parseCheckpointAction("Everything looks fine")).toBe("GO")
    })
  })

  //#endregion

  //#region Boulder State Wave Progression

  describe("boulder state wave progression", () => {
    test("GO advances current_wave from 1 to 2", () => {
      //#given boulder at wave 1
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      setupBoulder(tmpDir, planPath, 1)

      //#when GO applied
      applyCheckpointResult(tmpDir, { action: "GO" })

      //#then wave advanced to 2
      const state = readBoulderState(tmpDir)
      expect(state!.current_wave).toBe(2)
    })

    test("PAUSE does not advance wave", () => {
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      setupBoulder(tmpDir, planPath, 1)

      applyCheckpointResult(tmpDir, { action: "PAUSE" })

      const state = readBoulderState(tmpDir)
      expect(state!.current_wave).toBe(1)
    })

    test("REVIEW does not advance wave", () => {
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      setupBoulder(tmpDir, planPath, 2)

      applyCheckpointResult(tmpDir, { action: "REVIEW" })

      const state = readBoulderState(tmpDir)
      expect(state!.current_wave).toBe(2)
    })

    test("ABORT does not advance wave", () => {
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      setupBoulder(tmpDir, planPath, 2)

      applyCheckpointResult(tmpDir, { action: "ABORT" })

      const state = readBoulderState(tmpDir)
      expect(state!.current_wave).toBe(2)
    })

    test("successive GO advances through all waves: 1 → 2 → 3", () => {
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      setupBoulder(tmpDir, planPath, 1)

      applyCheckpointResult(tmpDir, { action: "GO" })
      expect(readBoulderState(tmpDir)!.current_wave).toBe(2)

      applyCheckpointResult(tmpDir, { action: "GO" })
      expect(readBoulderState(tmpDir)!.current_wave).toBe(3)
    })
  })

  //#endregion

  //#region Checkpoint Modes

  describe("checkpoint modes (auto vs interactive)", () => {
    test("auto mode: checkWaveCompletion returns null (silently advances)", () => {
      //#given auto checkpoint hook and completed wave 1
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      setupBoulder(tmpDir, planPath, 1)
      const hook = createWaveCheckpointHook(tmpDir, { mode: "auto" })

      //#when wave 1 is checked
      const result = hook.checkWaveCompletion(planPath, 1)

      //#then returns null (no prompt needed) and wave advances silently
      expect(result).toBeNull()
      expect(readBoulderState(tmpDir)!.current_wave).toBe(2)
    })

    test("interactive mode: checkWaveCompletion returns prompt string", () => {
      //#given interactive checkpoint hook and completed wave 1
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      setupBoulder(tmpDir, planPath, 1)
      const hook = createWaveCheckpointHook(tmpDir, { mode: "interactive" })

      //#when wave 1 is checked
      const result = hook.checkWaveCompletion(planPath, 1)

      //#then returns a checkpoint prompt for @po
      expect(result).not.toBeNull()
      expect(result).toContain("Wave 1")
      // Wave does NOT advance until action is applied
      expect(readBoulderState(tmpDir)!.current_wave).toBe(1)
    })

    test("interactive mode: incomplete wave returns null (no checkpoint yet)", () => {
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      setupBoulder(tmpDir, planPath, 2)
      const hook = createWaveCheckpointHook(tmpDir, { mode: "interactive" })

      // Wave 2 has unchecked tasks
      const result = hook.checkWaveCompletion(planPath, 2)
      expect(result).toBeNull()
    })
  })

  //#endregion

  //#region Full 3-Wave Execution Flow

  describe("full 3-wave execution flow", () => {
    test("wave 1 → checkpoint → GO → wave 2 → checkpoint → GO → wave 3", () => {
      //#given 3-wave plan with wave 1 complete
      const planPath = writePlanFile(tmpDir, THREE_WAVE_PLAN)
      setupBoulder(tmpDir, planPath, 1)
      const hook = createWaveCheckpointHook(tmpDir, { mode: "interactive" })

      // Wave 1 complete → checkpoint fires
      const checkpoint1 = hook.checkWaveCompletion(planPath, 1)
      expect(checkpoint1).not.toBeNull()
      expect(checkpoint1).toContain("Wave 2")

      // @po says GO
      const action1 = hook.parseCheckpointAction("GO — wave 1 looks good")
      expect(action1).toBe("GO")
      hook.applyCheckpointResult({ action: action1 })
      expect(readBoulderState(tmpDir)!.current_wave).toBe(2)

      // Simulate wave 2 completion
      const completedWave2Plan = THREE_WAVE_PLAN
        .replace("- [ ] 3.", "- [x] 3.")
        .replace("- [ ] 4.", "- [x] 4.")
      writeFileSync(planPath, completedWave2Plan, "utf-8")

      const checkpoint2 = hook.checkWaveCompletion(planPath, 2)
      expect(checkpoint2).not.toBeNull()

      // @po says GO again
      hook.applyCheckpointResult({ action: "GO" })
      expect(readBoulderState(tmpDir)!.current_wave).toBe(3)
    })
  })

  //#endregion
})
