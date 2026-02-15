import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createQualityGateHook } from "./index"
import { createBoulderState, writeBoulderState, readBoulderState } from "../../features/boulder-state"

const STORY_WITH_GATE = `---
name: Sample Story
executor: dev
quality_gate: qa
---
# Sample Story
`

const STORY_INVALID_GATE = `---
name: Sample Story
executor: qa
quality_gate: qa
---
# Sample Story
`

describe("createQualityGateHook", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "quality-gate-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("blocks when executor matches quality gate", async () => {
    //#given
    const storyPath = join(tempDir, "story.md")
    writeFileSync(storyPath, STORY_INVALID_GATE)
    const hook = createQualityGateHook({ directory: tempDir } as any)

    const input = { tool: "task", sessionID: "session-1", callID: "call-1" }
    const output = { args: { story_path: storyPath, executor: "qa" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).rejects.toThrow("quality_gate agent must differ")
  })

  test("appends quality gate prompt after task", async () => {
    //#given
    const storyPath = join(tempDir, "story.md")
    writeFileSync(storyPath, STORY_WITH_GATE)
    const hook = createQualityGateHook({ directory: tempDir } as any)

    const input = { tool: "task", sessionID: "session-1", callID: "call-2" }
    const beforeOutput = { args: { story_path: storyPath, executor: "dev" } }
    await hook["tool.execute.before"]?.(input as any, beforeOutput as any)

    const afterOutput = { output: "Task completed" }

    //#when
    await hook["tool.execute.after"]?.(input as any, afterOutput as any)

    //#then
    expect(afterOutput.output).toContain("QUALITY GATE REQUIRED")
    expect(afterOutput.output).toContain("@qa")
  })

  test("tracks NEEDS_WORK iterations and escalates", async () => {
    //#given
    const storyPath = join(tempDir, "story.md")
    writeFileSync(storyPath, STORY_WITH_GATE)
    writeBoulderState(tempDir, createBoulderState(storyPath, "session-2", "build", undefined, { plan_type: "story-driven" }))

    const hook = createQualityGateHook({ directory: tempDir } as any, 0)
    const input = { tool: "task", sessionID: "session-2", callID: "call-3" }

    const beforeOutput = { args: { story_path: storyPath, executor: "qa" } }
    await hook["tool.execute.before"]?.(input as any, beforeOutput as any)

    const afterOutput = { output: "quality_gate_verdict: NEEDS_WORK" }

    //#when
    await hook["tool.execute.after"]?.(input as any, afterOutput as any)

    //#then
    const state = readBoulderState(tempDir)
    expect(state?.quality_gate_iterations?.[storyPath]).toBe(1)
    expect(afterOutput.output).toContain("Escalate to user")
  })
})
