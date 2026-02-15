import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { validateSquadManifest, createSquadValidateTool } from "./tools"

const VALID_SQUAD = `
name: marketing
description: Marketing squad
agents:
  copywriter:
    description: "Writes copy"
  designer:
    description: "Designs assets"
    is_chief: true
default_executor: copywriter
contract_type: story
`

const INVALID_YAML = `
name: [broken
  yaml: {
`

const MISSING_NAME = `
description: No name here
agents:
  worker:
    description: "Works"
contract_type: story
`

const BAD_AGENT_NAME = `
name: test-squad
description: Test
agents:
  BadAgent:
    description: "Not kebab"
  "another Bad":
    description: "Also not kebab"
contract_type: story
`

const BAD_EXECUTOR_REF = `
name: test-squad
description: Test
agents:
  worker:
    description: "Works"
default_executor: nonexistent
contract_type: story
`

const BAD_REVIEWER_REF = `
name: test-squad
description: Test
agents:
  worker:
    description: "Works"
default_reviewer: nonexistent
contract_type: story
`

const WITH_PROMPT_FILE = `
name: test-squad
description: Test
agents:
  researcher:
    description: "Researches"
    prompt_file: agents/researcher.md
contract_type: story
`

const NO_AGENTS = `
name: empty-squad
description: Empty
agents: {}
contract_type: story
`

const MULTI_CHIEF = `
name: multi-chief
description: Test
agents:
  alpha:
    description: "A"
    is_chief: true
  beta:
    description: "B"
    is_chief: true
contract_type: story
`

describe("squad_validate", () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `squad-validate-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe("validateSquadManifest", () => {
    test("valid squad passes", () => {
      //#when
      const result = validateSquadManifest(VALID_SQUAD, testDir)

      //#then
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test("invalid YAML returns error", () => {
      //#when
      const result = validateSquadManifest(INVALID_YAML, testDir)

      //#then
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain("YAML parse error")
    })

    test("missing required field returns schema error", () => {
      //#when
      const result = validateSquadManifest(MISSING_NAME, testDir)

      //#then
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes("Schema"))).toBe(true)
    })

    test("non-kebab-case agent names are errors", () => {
      //#when
      const result = validateSquadManifest(BAD_AGENT_NAME, testDir)

      //#then
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes("BadAgent") && e.includes("kebab-case"))).toBe(true)
      expect(result.errors.some(e => e.includes("another Bad") && e.includes("kebab-case"))).toBe(true)
    })

    test("bad default_executor reference is error", () => {
      //#when
      const result = validateSquadManifest(BAD_EXECUTOR_REF, testDir)

      //#then
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes("default_executor") && e.includes("nonexistent"))).toBe(true)
    })

    test("bad default_reviewer reference is error", () => {
      //#when
      const result = validateSquadManifest(BAD_REVIEWER_REF, testDir)

      //#then
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes("default_reviewer") && e.includes("nonexistent"))).toBe(true)
    })

    test("missing prompt_file on disk is error", () => {
      //#when
      const result = validateSquadManifest(WITH_PROMPT_FILE, testDir)

      //#then
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes("prompt_file") && e.includes("not found"))).toBe(true)
    })

    test("existing prompt_file passes", () => {
      //#given
      const promptDir = join(testDir, "agents")
      mkdirSync(promptDir, { recursive: true })
      writeFileSync(join(promptDir, "researcher.md"), "# Researcher prompt")

      //#when
      const result = validateSquadManifest(WITH_PROMPT_FILE, testDir)

      //#then
      expect(result.errors.filter(e => e.includes("prompt_file"))).toHaveLength(0)
    })

    test("no agents is error", () => {
      //#when
      const result = validateSquadManifest(NO_AGENTS, testDir)

      //#then
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes("no agents"))).toBe(true)
    })

    test("no chief agent is warning (multi-agent squad)", () => {
      //#given
      const noChief = `
name: test
description: Test
agents:
  alpha:
    description: "A"
  beta:
    description: "B"
contract_type: story
`
      //#when
      const result = validateSquadManifest(noChief, testDir)

      //#then
      expect(result.warnings.some(w => w.includes("chief"))).toBe(true)
    })

    test("multiple chiefs is warning", () => {
      //#when
      const result = validateSquadManifest(MULTI_CHIEF, testDir)

      //#then
      expect(result.warnings.some(w => w.includes("Multiple chief"))).toBe(true)
    })

    test("no default_executor is warning", () => {
      //#given
      const noExecutor = `
name: test
description: Test
agents:
  worker:
    description: "W"
    is_chief: true
contract_type: story
`
      //#when
      const result = validateSquadManifest(noExecutor, testDir)

      //#then
      expect(result.warnings.some(w => w.includes("default_executor"))).toBe(true)
    })
  })

  describe("createSquadValidateTool", () => {
    test("validates squad by name", async () => {
      //#given
      const squadDir = join(testDir, ".opencode", "squads", "marketing")
      mkdirSync(squadDir, { recursive: true })
      writeFileSync(join(squadDir, "SQUAD.yaml"), VALID_SQUAD)

      const tool = createSquadValidateTool({ directory: testDir } as any)
      const toolContext = {
        sessionID: "test-session",
        messageID: "test-message",
        agent: "test-agent",
        abort: new AbortController().signal,
      }

      //#when
      const result = await tool.execute({ squad_name: "marketing" }, toolContext as any)
      const parsed = JSON.parse(result)

      //#then
      expect(parsed.valid).toBe(true)
      expect(parsed.errors).toHaveLength(0)
    })

    test("returns error for missing squad", async () => {
      //#given
      const tool = createSquadValidateTool({ directory: testDir } as any)
      const toolContext = {
        sessionID: "test-session",
        messageID: "test-message",
        agent: "test-agent",
        abort: new AbortController().signal,
      }

      //#when
      const result = await tool.execute({ squad_name: "missing" }, toolContext as any)
      const parsed = JSON.parse(result)

      //#then
      expect(parsed.valid).toBe(false)
      expect(parsed.errors[0]).toContain("not found")
    })
  })
})
