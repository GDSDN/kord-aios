import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createStoryLifecycleHook } from "./index"
import { updateSessionAgent, _resetForTesting } from "../../features/claude-code-session-state"
import { createBoulderState, writeBoulderState } from "../../features/boulder-state"

const STORY_TEMPLATE = (status: string) => `---
title: Sample story
status: ${status}
---
# Sample story

## Status
${status}
`

describe("createStoryLifecycleHook", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "story-lifecycle-"))
  })

  afterEach(() => {
    _resetForTesting()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("allows valid transition for story-driven plan", async () => {
    //#given
    const storyPath = join(tempDir, "story.md")
    writeFileSync(storyPath, STORY_TEMPLATE("DRAFT"))
    writeBoulderState(tempDir, createBoulderState(storyPath, "session-1", "build", undefined, { plan_type: "story-driven" }))
    updateSessionAgent("session-1", "sm")
    const hook = createStoryLifecycleHook({ directory: tempDir } as any)

    const input = { tool: "story_update", sessionID: "session-1", callID: "call_1" }
    const output = { args: { action: "set_status", story_path: storyPath, data: { status: "READY" } } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("blocks invalid transition", async () => {
    //#given
    const storyPath = join(tempDir, "story.md")
    writeFileSync(storyPath, STORY_TEMPLATE("IN_PROGRESS"))
    writeBoulderState(tempDir, createBoulderState(storyPath, "session-2", "build", undefined, { plan_type: "story-driven" }))
    updateSessionAgent("session-2", "dev")
    const hook = createStoryLifecycleHook({ directory: tempDir } as any)

    const input = { tool: "story_update", sessionID: "session-2", callID: "call_2" }
    const output = { args: { action: "set_status", story_path: storyPath, data: { status: "DRAFT" } } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).rejects.toThrow("Cannot transition story from IN_PROGRESS to DRAFT")
  })

  test("is dormant when not story-driven", async () => {
    //#given
    const storyPath = join(tempDir, "story.md")
    writeFileSync(storyPath, STORY_TEMPLATE("IN_PROGRESS"))
    writeBoulderState(tempDir, createBoulderState(storyPath, "session-3", "build", undefined, { plan_type: "task-driven" }))
    updateSessionAgent("session-3", "dev")
    const hook = createStoryLifecycleHook({ directory: tempDir } as any)

    const input = { tool: "story_update", sessionID: "session-3", callID: "call_3" }
    const output = { args: { action: "set_status", story_path: storyPath, data: { status: "DRAFT" } } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("force override allows invalid transition", async () => {
    //#given
    const storyPath = join(tempDir, "story.md")
    writeFileSync(storyPath, STORY_TEMPLATE("IN_PROGRESS"))
    writeBoulderState(tempDir, createBoulderState(storyPath, "session-4", "build", undefined, { plan_type: "story-driven" }))
    updateSessionAgent("session-4", "dev")
    const hook = createStoryLifecycleHook({ directory: tempDir } as any, { allow_force_override: true })

    const input = { tool: "story_update", sessionID: "session-4", callID: "call_4" }
    const output = { args: { action: "set_status", story_path: storyPath, data: { status: "DRAFT" } } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("blocks transition when agent role is not allowed", async () => {
    //#given
    const storyPath = join(tempDir, "story.md")
    writeFileSync(storyPath, STORY_TEMPLATE("DRAFT"))
    writeBoulderState(tempDir, createBoulderState(storyPath, "session-5", "build", undefined, { plan_type: "story-driven" }))
    updateSessionAgent("session-5", "dev")
    const hook = createStoryLifecycleHook({ directory: tempDir } as any)

    const input = { tool: "story_update", sessionID: "session-5", callID: "call_5" }
    const output = { args: { action: "set_status", story_path: storyPath, data: { status: "READY" } } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).rejects.toThrow(/cannot transition story from DRAFT to READY/i)
  })
})
