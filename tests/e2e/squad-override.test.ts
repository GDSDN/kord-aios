/**
 * EPIC-08 S03: Squad Override E2E Test
 *
 * Validates that a custom squad overrides default agent composition,
 * plan format, and execution rules. Verifies squad loading, manifest
 * parsing, and boulder state integration.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { findSquadManifestPath, parseSquadManifest } from "../../src/tools/squad-load/tools"
import { writeBoulderState, readBoulderState, createBoulderState } from "../../src/features/boulder-state/storage"
import { createStoryLifecycleHook } from "../../src/hooks/story-lifecycle"
import { setSessionAgent, clearSessionAgent } from "../../src/features/claude-code-session-state"
import type { BoulderState } from "../../src/features/boulder-state/types"

function makeTmpDir(): string {
  const dir = join(tmpdir(), `e2e-squad-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function makeCtx(directory: string) {
  return { directory } as any
}

const MARKETING_SQUAD_YAML = `name: marketing
description: Marketing content generation squad
agents:
  copywriter:
    role: lead
    description: Content creation and copywriting
  designer:
    role: support
    description: Visual asset creation
  analyst:
    role: support
    description: Market research and analytics
contract_type: task-driven
execution_rules:
  - No code changes allowed
  - All output in docs/marketing/
  - Designer reviews all visual assets
overrides:
  plan_format: task-driven
`

const DEV_SQUAD_YAML = `name: dev-team
description: Full-stack development squad
agents:
  dev:
    role: lead
    description: Full-stack development
  qa:
    role: support
    description: Quality assurance
  architect:
    role: advisor
    description: Architecture guidance
contract_type: story-driven
`

const SESSION_ID = "e2e-session-squad"

describe("EPIC-08 S03: Squad Override E2E", () => {
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

  //#region Squad Manifest Discovery

  describe("squad manifest discovery", () => {
    test("finds SQUAD.yaml in .kord/squads/{name}/", () => {
      //#given a squad manifest in the standard location
      const squadDir = join(tmpDir, ".kord/squads/marketing")
      mkdirSync(squadDir, { recursive: true })
      writeFileSync(join(squadDir, "SQUAD.yaml"), MARKETING_SQUAD_YAML, "utf-8")

      //#when searching for the squad
      const found = findSquadManifestPath(tmpDir, "marketing")

      //#then path is resolved
      expect(found).not.toBeNull()
      expect(found).toContain("marketing")
      expect(found).toContain("SQUAD.yaml")
    })

    test("finds SQUAD.yaml in .opencode/squads/{name}/", () => {
      const squadDir = join(tmpDir, ".opencode/squads/marketing")
      mkdirSync(squadDir, { recursive: true })
      writeFileSync(join(squadDir, "SQUAD.yaml"), MARKETING_SQUAD_YAML, "utf-8")

      const found = findSquadManifestPath(tmpDir, "marketing")
      expect(found).not.toBeNull()
    })

    test("finds SQUAD.yaml in docs/kord/squads/{name}/", () => {
      const squadDir = join(tmpDir, "docs/kord/squads/marketing")
      mkdirSync(squadDir, { recursive: true })
      writeFileSync(join(squadDir, "SQUAD.yaml"), MARKETING_SQUAD_YAML, "utf-8")

      const found = findSquadManifestPath(tmpDir, "marketing")
      expect(found).not.toBeNull()
    })

    test("returns null when squad does not exist", () => {
      const found = findSquadManifestPath(tmpDir, "nonexistent")
      expect(found).toBeNull()
    })
  })

  //#endregion

  //#region Squad Manifest Parsing

  describe("squad manifest parsing", () => {
    test("parses marketing squad with agents and config", () => {
      //#given marketing squad YAML content
      const manifest = parseSquadManifest(MARKETING_SQUAD_YAML)

      //#then name, description, agents, and config are extracted
      expect(manifest.name).toBe("marketing")
      expect(manifest.description).toContain("Marketing")
      expect(manifest.agents).toHaveLength(3)
      expect(manifest.agents.map((a) => a.name)).toEqual(["copywriter", "designer", "analyst"])
      expect(manifest.agents[0].role).toBe("lead")
      expect(manifest.agents[1].role).toBe("support")
    })

    test("parses config with planFormat and executionRules", () => {
      const manifest = parseSquadManifest(MARKETING_SQUAD_YAML)

      expect(manifest.config).toBeDefined()
      expect(manifest.config!.planFormat).toBe("task-driven")
      expect(manifest.config!.executionRules).toHaveLength(3)
      expect(manifest.config!.executionRules![0]).toContain("No code changes")
    })

    test("parses dev squad with story-driven format", () => {
      const manifest = parseSquadManifest(DEV_SQUAD_YAML)

      expect(manifest.name).toBe("dev-team")
      expect(manifest.agents).toHaveLength(3)
      expect(manifest.config!.planFormat).toBe("story-driven")
    })

    test("throws on invalid YAML", () => {
      expect(() => parseSquadManifest("")).toThrow()
    })
  })

  //#endregion

  //#region Boulder State Squad Integration

  describe("boulder state squad integration", () => {
    test("createBoulderState stores squad name", () => {
      //#given a plan with a squad override
      const planPath = join(tmpDir, "docs/kord/plans/marketing-plan.md")
      const state = createBoulderState(planPath, SESSION_ID, "build", "marketing", {
        plan_type: "task-driven",
        current_wave: 1,
      })

      //#then squad is stored in boulder state
      expect(state.squad).toBe("marketing")
      expect(state.plan_type).toBe("task-driven")
      expect(state.current_wave).toBe(1)
    })

    test("boulder state persists and reads squad_id", () => {
      const planPath = join(tmpDir, "docs/kord/plans/marketing-plan.md")
      const state = createBoulderState(planPath, SESSION_ID, "build", "marketing", {
        plan_type: "task-driven",
      })
      writeBoulderState(tmpDir, state)

      const read = readBoulderState(tmpDir)
      expect(read).not.toBeNull()
      expect(read!.squad).toBe("marketing")
      expect(read!.plan_type).toBe("task-driven")
    })
  })

  //#endregion

  //#region Story Lifecycle Dormancy for Non-Dev Squads

  describe("story-lifecycle hook dormancy for non-dev squads", () => {
    test("task-driven squad → story-lifecycle hook does not enforce transitions", async () => {
      //#given boulder state with task-driven plan_type (marketing squad)
      const planPath = join(tmpDir, "docs/kord/plans/marketing-plan.md")
      const state = createBoulderState(planPath, SESSION_ID, "build", "marketing", {
        plan_type: "task-driven",
      })
      writeBoulderState(tmpDir, state)

      // Write a story file to verify hook doesn't block
      const storiesDir = join(tmpDir, "docs/kord/stories")
      mkdirSync(storiesDir, { recursive: true })
      const storyPath = join(storiesDir, "1.1.story.md")
      writeFileSync(storyPath, `---\ntitle: Test\nstatus: DRAFT\n---\n# Test\n`, "utf-8")

      setSessionAgent(SESSION_ID, "dev")
      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      //#when dev tries to jump DRAFT → DONE (normally invalid)
      //#then hook is dormant — transition allowed because plan_type is task-driven
      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "sq1" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "DONE" } } }
        )
      ).resolves.toBeUndefined()
    })

    test("story-driven squad → story-lifecycle hook IS active", async () => {
      //#given boulder state with story-driven plan_type
      const planPath = join(tmpDir, "docs/kord/plans/dev-plan.md")
      const state = createBoulderState(planPath, SESSION_ID, "build", "dev-team", {
        plan_type: "story-driven",
      })
      writeBoulderState(tmpDir, state)

      const storiesDir = join(tmpDir, "docs/kord/stories")
      mkdirSync(storiesDir, { recursive: true })
      const storyPath = join(storiesDir, "1.1.story.md")
      writeFileSync(storyPath, `---\ntitle: Test\nstatus: DRAFT\n---\n# Test\n`, "utf-8")

      setSessionAgent(SESSION_ID, "dev")
      const hook = createStoryLifecycleHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      //#when dev tries DRAFT → DONE (invalid skip)
      //#then hook blocks it
      await expect(
        handler(
          { tool: "story_update", sessionID: SESSION_ID, callID: "sq2" },
          { args: { action: "set_status", story_path: storyPath, data: { status: "DONE" } } }
        )
      ).rejects.toThrow(/Cannot transition story/)
    })
  })

  //#endregion

  //#region Full Squad Override Flow

  describe("full squad override flow", () => {
    test("load marketing squad → configure boulder → verify task-driven behavior", () => {
      //#given marketing squad manifest on disk
      const squadDir = join(tmpDir, ".kord/squads/marketing")
      mkdirSync(squadDir, { recursive: true })
      writeFileSync(join(squadDir, "SQUAD.yaml"), MARKETING_SQUAD_YAML, "utf-8")

      // Step 1: Find and load squad
      const manifestPath = findSquadManifestPath(tmpDir, "marketing")
      expect(manifestPath).not.toBeNull()

      const { readFileSync } = require("node:fs")
      const content = readFileSync(manifestPath!, "utf-8")
      const manifest = parseSquadManifest(content)

      expect(manifest.name).toBe("marketing")
      expect(manifest.config!.planFormat).toBe("task-driven")

      // Step 2: Create boulder state with squad override
      const planPath = join(tmpDir, "docs/kord/plans/marketing-q1.md")
      const state = createBoulderState(planPath, SESSION_ID, "build", manifest.name, {
        plan_type: manifest.config!.planFormat,
        current_wave: 1,
      })
      writeBoulderState(tmpDir, state)

      // Step 3: Verify boulder state reflects squad
      const boulder = readBoulderState(tmpDir)
      expect(boulder!.squad).toBe("marketing")
      expect(boulder!.plan_type).toBe("task-driven")

      // Step 4: Verify agents match squad composition
      expect(manifest.agents.map((a) => a.name)).toEqual(["copywriter", "designer", "analyst"])
      expect(manifest.agents.find((a) => a.name === "dev")).toBeUndefined()
    })
  })

  //#endregion
})
