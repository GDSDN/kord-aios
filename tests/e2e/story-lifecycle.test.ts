/**
 * EPIC-08 S01: Story Lifecycle E2E Test
 *
 * Validates the complete story lifecycle flow:
 * DRAFT → READY → IN_PROGRESS → REVIEW → DONE
 * with agent role enforcement at each transition.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { parseStoryMarkdown } from "../../src/tools/story-read/tools"
import { createStoryLifecycleHook } from "../../src/hooks/story-lifecycle"
import { writeBoulderState, readBoulderState } from "../../src/features/boulder-state/storage"
import { setSessionAgent, clearSessionAgent } from "../../src/features/claude-code-session-state"
import type { BoulderState } from "../../src/features/boulder-state/types"

function makeTmpDir(): string {
  const dir = join(tmpdir(), `e2e-story-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function makeCtx(directory: string) {
  return { directory } as any
}

function writeStory(dir: string, filename: string, status: string, tasks: string[] = []): string {
  const storiesDir = join(dir, "docs/kord/stories")
  mkdirSync(storiesDir, { recursive: true })
  const storyPath = join(storiesDir, filename)

  const taskLines = tasks.map((t) => `- [ ] ${t}`).join("\n")
  const content = `---
title: Test Story
status: ${status}
---

# Test Story

## Status

${status}

## Tasks

${taskLines}

## Acceptance Criteria

- Feature works correctly
- Tests pass
`
  writeFileSync(storyPath, content, "utf-8")
  return storyPath
}

function setupBoulder(dir: string, planType: BoulderState["plan_type"] = "story-driven"): void {
  const state: BoulderState = {
    active_plan: join(dir, "docs/kord/plans/test-plan.md"),
    started_at: new Date().toISOString(),
    session_ids: ["e2e-session-lifecycle"],
    plan_name: "test-plan",
    plan_type: planType,
  }
  writeBoulderState(dir, state)
}

const SESSION_ID = "e2e-session-lifecycle"

describe("EPIC-08 S01: Story Lifecycle E2E", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTmpDir()
  })

  afterEach(() => {
    clearSessionAgent(SESSION_ID)
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  //#region Story Parsing

  describe("story parsing", () => {
    test("parseStoryMarkdown extracts status, title, and tasks", () => {
      //#given a story file with DRAFT status and tasks
      const content = `---
title: Implement Login
status: DRAFT
---

# Implement Login

## Status

DRAFT

## Tasks

- [ ] Create login form
- [ ] Add validation
- [x] Setup auth provider

## Acceptance Criteria

- User can login with email/password
`
      //#when parsed
      const story = parseStoryMarkdown(content)

      //#then all fields extracted correctly
      expect(story.title).toBe("Implement Login")
      expect(story.status).toBe("DRAFT")
      expect(story.tasks).toHaveLength(3)
      expect(story.tasks[0].title).toBe("Create login form")
      expect(story.tasks[0].checked).toBe(false)
      expect(story.tasks[2].title).toBe("Setup auth provider")
      expect(story.tasks[2].checked).toBe(true)
    })

    test("parseStoryMarkdown defaults to DRAFT for unknown status", () => {
      const content = `---
title: Unknown
status: BANANA
---

# Unknown
`
      const story = parseStoryMarkdown(content)
      expect(story.status).toBe("DRAFT")
    })

    test("parseStoryMarkdown normalizes hyphenated status", () => {
      const content = `---
title: InProgress Test
status: in-progress
---

# InProgress Test
`
      const story = parseStoryMarkdown(content)
      expect(story.status).toBe("IN_PROGRESS")
    })
  })

  //#endregion

  //#region Valid Transitions

  describe("valid state transitions", () => {
    //#given a story-driven boulder state and story-lifecycle hook

    test("DRAFT → READY by @sm → ALLOWED", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "DRAFT")
      setSessionAgent(SESSION_ID, "sm")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "t1" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "READY" } } }
        )
      ).resolves.toBeUndefined()
    })

    test("READY → IN_PROGRESS by @dev → ALLOWED", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "READY")
      setSessionAgent(SESSION_ID, "dev")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "t2" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "IN_PROGRESS" } } }
        )
      ).resolves.toBeUndefined()
    })

    test("IN_PROGRESS → REVIEW by @dev → ALLOWED", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "IN_PROGRESS")
      setSessionAgent(SESSION_ID, "dev")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "t3" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "REVIEW" } } }
        )
      ).resolves.toBeUndefined()
    })

    test("REVIEW → DONE by @qa → ALLOWED", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "REVIEW")
      setSessionAgent(SESSION_ID, "qa")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "t4" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "DONE" } } }
        )
      ).resolves.toBeUndefined()
    })

    test("REVIEW → IN_PROGRESS by @qa (rejection) → ALLOWED", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "REVIEW")
      setSessionAgent(SESSION_ID, "qa")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "t5" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "IN_PROGRESS" } } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion

  //#region Invalid Transitions

  describe("invalid state transitions", () => {
    test("DRAFT → DONE → BLOCKED (skips intermediate states)", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "DRAFT")
      setSessionAgent(SESSION_ID, "sm")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "i1" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "DONE" } } }
        )
      ).rejects.toThrow(/Cannot transition story from DRAFT to DONE/)
    })

    test("DONE → anything → BLOCKED (terminal state)", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "DONE")
      setSessionAgent(SESSION_ID, "sm")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "i2" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "DRAFT" } } }
        )
      ).rejects.toThrow(/Cannot transition story from DONE to DRAFT/)
    })

    test("IN_PROGRESS → READY → BLOCKED (backward not allowed)", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "IN_PROGRESS")
      setSessionAgent(SESSION_ID, "dev")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "i3" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "READY" } } }
        )
      ).rejects.toThrow(/Cannot transition story from IN_PROGRESS to READY/)
    })
  })

  //#endregion

  //#region Agent Role Enforcement

  describe("agent role enforcement", () => {
    test("@dev cannot DRAFT → READY (only @sm can)", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "DRAFT")
      setSessionAgent(SESSION_ID, "dev")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "r1" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "READY" } } }
        )
      ).rejects.toThrow(/cannot transition story from DRAFT to READY/)
    })

    test("@sm cannot REVIEW → DONE (only @qa can)", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "REVIEW")
      setSessionAgent(SESSION_ID, "sm")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "r2" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "DONE" } } }
        )
      ).rejects.toThrow(/cannot transition story from REVIEW to DONE/)
    })

    test("@qa cannot READY → IN_PROGRESS (only @dev can)", async () => {
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "READY")
      setSessionAgent(SESSION_ID, "qa")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "r3" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "IN_PROGRESS" } } }
        )
      ).rejects.toThrow(/cannot transition story from READY to IN_PROGRESS/)
    })
  })

  //#endregion

  //#region Full Lifecycle Golden Path

  describe("full lifecycle golden path", () => {
    test("DRAFT → READY → IN_PROGRESS → REVIEW → DONE", async () => {
      //#given a story in DRAFT and boulder state set up
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "DRAFT", [
        "Create component",
        "Write tests",
      ])

      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      //#when each agent transitions in the correct order

      // Step 1: @sm moves DRAFT → READY
      clearSessionAgent(SESSION_ID)
      setSessionAgent(SESSION_ID, "sm")
      await handler(
        { tool: "story_update", sessionID: SESSION_ID, callID: "full-1" },
        { args: { action: "set_status", story_path: storyPath, data: { status: "READY" } } }
      )
      // Simulate the actual file update
      writeStory(tmpDir, "1.1.story.md", "READY", ["Create component", "Write tests"])

      // Step 2: @dev moves READY → IN_PROGRESS
      clearSessionAgent(SESSION_ID)
      setSessionAgent(SESSION_ID, "dev")
      await handler(
        { tool: "story_update", sessionID: SESSION_ID, callID: "full-2" },
        { args: { action: "set_status", story_path: storyPath, data: { status: "IN_PROGRESS" } } }
      )
      writeStory(tmpDir, "1.1.story.md", "IN_PROGRESS", ["Create component", "Write tests"])

      // Step 3: @dev moves IN_PROGRESS → REVIEW (dev already set)
      await handler(
        { tool: "story_update", sessionID: SESSION_ID, callID: "full-3" },
        { args: { action: "set_status", story_path: storyPath, data: { status: "REVIEW" } } }
      )
      writeStory(tmpDir, "1.1.story.md", "REVIEW", ["Create component", "Write tests"])

      // Step 4: @qa moves REVIEW → DONE
      clearSessionAgent(SESSION_ID)
      setSessionAgent(SESSION_ID, "qa")
      await handler(
        { tool: "story_update", sessionID: SESSION_ID, callID: "full-4" },
        { args: { action: "set_status", story_path: storyPath, data: { status: "DONE" } } }
      )
      writeStory(tmpDir, "1.1.story.md", "DONE", ["Create component", "Write tests"])

      //#then final story is DONE
      const finalContent = readFileSync(storyPath, "utf-8")
      const finalStory = parseStoryMarkdown(finalContent)
      expect(finalStory.status).toBe("DONE")
    })
  })

  //#endregion

  //#region Non-Story-Driven Plans

  describe("non-story-driven plans", () => {
    test("task-driven plan → story-lifecycle hook is dormant", async () => {
      //#given boulder state with plan_type = "task-driven"
      setupBoulder(tmpDir, "task-driven")
      const storyPath = writeStory(tmpDir, "1.1.story.md", "DRAFT")
      setSessionAgent(SESSION_ID, "dev")

      //#when any agent attempts any transition
      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      //#then hook is dormant — no enforcement
      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "ns1" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "DONE" } } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion

  //#region Force Override

  describe("force override config", () => {
    test("allow_force_override skips all enforcement", async () => {
      //#given boulder state + force override enabled
      setupBoulder(tmpDir)
      const storyPath = writeStory(tmpDir, "1.1.story.md", "DRAFT")
      setSessionAgent(SESSION_ID, "dev")

      const hook = createStoryLifecycleHook(makeCtx(tmpDir), { allow_force_override: true })
      const handler = hook["tool.execute.before"]

      //#then even invalid transitions are allowed
      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "fo1" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "DONE" } } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion
})
