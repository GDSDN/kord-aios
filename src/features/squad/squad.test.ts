import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { squadSchema } from "./schema"
import { loadSquadsFromDir, loadAllSquads, type LoadedSquad } from "./loader"
import {
  createSquadAgentConfig,
  getSquadAgents,
  getSquadCategories,
  buildSquadPromptSection,
  createAllSquadAgentConfigs,
} from "./factory"
import type { SquadAgent } from "./schema"

const TEST_DIR = join(import.meta.dir, "__test_squads__")

const VALID_SQUAD_YAML = `
name: marketing
description: Marketing team with copywriters and designers
version: 1.0.0

agents:
  copywriter:
    description: "Expert copywriter for all channels"
    mode: subagent
    skills:
      - brand-voice
  designer:
    description: "Visual designer for marketing assets"
    mode: subagent
  brand-chief:
    description: "Marketing squad chief"
    mode: subagent
    is_chief: true

categories:
  creative:
    description: "Creative writing and ideation tasks"
  visual:
    description: "Visual design and layout tasks"

default_executor: copywriter
default_reviewer: brand-chief
contract_type: campaign
`

const MINIMAL_SQUAD_YAML = `
name: minimal
description: Minimal squad
agents:
  worker:
    description: "General worker"
`

const INVALID_SQUAD_YAML = `
description: Missing required name field
agents:
  worker:
    description: "General worker"
`

const V2_SQUAD_YAML = `
name: data-team
description: Data engineering squad with v2 features
version: 2.0.0

agents:
  etl-engineer:
    description: "ETL pipeline specialist"
    prompt_file: agents/etl-engineer.md
    skills:
      - data-pipeline
  analyst:
    description: "Data analyst"
    prompt: "You are a data analyst."

categories:
  data:
    description: "Data processing tasks"

default_executor: etl-engineer
contract_type: pipeline

config:
  extends: strict
  rules:
    - "Always validate schema before write"
    - "Log every transformation step"

dependencies:
  skills:
    - data-pipeline
    - sql-expert
  squads:
    - dev

tags:
  - data-engineering
  - etl
  - analytics

kord:
  minVersion: "3.5.0"
`

describe("squadSchema", () => {
  test("parses valid full squad manifest", () => {
    //#given
    const jsYaml = require("js-yaml")
    const raw = jsYaml.load(VALID_SQUAD_YAML)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("marketing")
      expect(result.data.description).toBe("Marketing team with copywriters and designers")
      expect(result.data.version).toBe("1.0.0")
      expect(Object.keys(result.data.agents)).toHaveLength(3)
      const copywriter = result.data.agents.copywriter as SquadAgent
      expect(copywriter.description).toBe("Expert copywriter for all channels")
      expect(copywriter.skills).toEqual(["brand-voice"])
      const brandChief = result.data.agents["brand-chief"] as SquadAgent
      expect(brandChief.is_chief).toBe(true)
      expect(result.data.default_executor).toBe("copywriter")
      expect(result.data.contract_type).toBe("campaign")
    }
  })

  test("parses minimal squad manifest with defaults", () => {
    //#given
    const jsYaml = require("js-yaml")
    const raw = jsYaml.load(MINIMAL_SQUAD_YAML)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("minimal")
      expect(result.data.version).toBe("1.0.0")
      expect(result.data.contract_type).toBe("task")
      const worker = result.data.agents.worker as SquadAgent
      expect(worker.mode).toBe("subagent")
      expect(worker.skills).toEqual([])
      expect(worker.is_chief).toBe(false)
    }
  })

  test("rejects manifest missing name", () => {
    //#given
    const jsYaml = require("js-yaml")
    const raw = jsYaml.load(INVALID_SQUAD_YAML)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(false)
  })

  test("parses v2 manifest with config, dependencies, tags, kord", () => {
    //#given
    const jsYaml = require("js-yaml")
    const raw = jsYaml.load(V2_SQUAD_YAML)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.config?.extends).toBe("strict")
      expect(result.data.config?.rules).toEqual(["Always validate schema before write", "Log every transformation step"])
      expect(result.data.dependencies?.skills).toEqual(["data-pipeline", "sql-expert"])
      expect(result.data.dependencies?.squads).toEqual(["dev"])
      expect(result.data.tags).toEqual(["data-engineering", "etl", "analytics"])
      expect(result.data.kord?.minVersion).toBe("3.5.0")
    }
  })

  test("v2 fields are optional — v1 manifest still parses", () => {
    //#given
    const jsYaml = require("js-yaml")
    const raw = jsYaml.load(MINIMAL_SQUAD_YAML)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.config).toBeUndefined()
      expect(result.data.dependencies).toBeUndefined()
      expect(result.data.tags).toBeUndefined()
      expect(result.data.kord).toBeUndefined()
    }
  })

  test("agent prompt_file field is optional", () => {
    //#given
    const jsYaml = require("js-yaml")
    const raw = jsYaml.load(V2_SQUAD_YAML)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents["etl-engineer"].prompt_file).toBe("agents/etl-engineer.md")
      expect(result.data.agents["analyst"].prompt_file).toBeUndefined()
    }
  })
})

describe("loadSquadsFromDir", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("resolves prompt_file to .md content", () => {
    //#given
    const squadDir = join(TEST_DIR, "data-team")
    mkdirSync(join(squadDir, "agents"), { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), V2_SQUAD_YAML)
    writeFileSync(join(squadDir, "agents", "etl-engineer.md"), "You are an expert ETL pipeline engineer.")

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")

    //#then
    expect(result.squads).toHaveLength(1)
    expect(result.squads[0].resolvedPrompts["etl-engineer"]).toBe("You are an expert ETL pipeline engineer.")
    expect(result.squads[0].resolvedPrompts["analyst"]).toBeUndefined()
  })

  test("resolvedPrompts is empty when prompt_file does not exist", () => {
    //#given
    const squadDir = join(TEST_DIR, "data-team")
    mkdirSync(squadDir, { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), V2_SQUAD_YAML)
    // No agents/etl-engineer.md file

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")

    //#then
    expect(result.squads).toHaveLength(1)
    expect(result.squads[0].resolvedPrompts["etl-engineer"]).toBeUndefined()
  })

  test("loads valid squad from directory", () => {
    //#given
    const squadDir = join(TEST_DIR, "marketing")
    mkdirSync(squadDir, { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), VALID_SQUAD_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")

    //#then
    expect(result.squads).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
    expect(result.squads[0].manifest.name).toBe("marketing")
    expect(result.squads[0].source).toBe("user")
    expect(result.squads[0].basePath).toBe(squadDir)
  })

  test("returns empty for nonexistent directory", () => {
    //#when
    const result = loadSquadsFromDir(join(TEST_DIR, "nonexistent"), "user")

    //#then
    expect(result.squads).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  test("reports errors for invalid YAML", () => {
    //#given
    const squadDir = join(TEST_DIR, "bad")
    mkdirSync(squadDir, { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), INVALID_SQUAD_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")

    //#then
    expect(result.squads).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].error).toContain("Validation failed")
  })

  test("skips directories without SQUAD.yaml", () => {
    //#given
    mkdirSync(join(TEST_DIR, "empty-squad"), { recursive: true })

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")

    //#then
    expect(result.squads).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  test("loads multiple squads", () => {
    //#given
    const mktDir = join(TEST_DIR, "marketing")
    const minDir = join(TEST_DIR, "minimal")
    mkdirSync(mktDir, { recursive: true })
    mkdirSync(minDir, { recursive: true })
    writeFileSync(join(mktDir, "SQUAD.yaml"), VALID_SQUAD_YAML)
    writeFileSync(join(minDir, "SQUAD.yaml"), MINIMAL_SQUAD_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")

    //#then
    expect(result.squads).toHaveLength(2)
    expect(result.errors).toHaveLength(0)
  })
})

describe("loadAllSquads", () => {
  test("loads built-in dev squad", () => {
    //#when
    const result = loadAllSquads()

    //#then
    expect(result.squads.length).toBeGreaterThanOrEqual(1)
    const devSquad = result.squads.find(s => s.manifest.name === "dev")
    expect(devSquad).toBeDefined()
    expect(devSquad!.source).toBe("builtin")
    expect(devSquad!.manifest.default_executor).toBe("dev-junior")
  })

  test("searches .kord/squads/ path", () => {
    //#given
    const projectDir = join(TEST_DIR, "project-kord")
    const kordSquadDir = join(projectDir, ".kord", "squads", "analytics")
    mkdirSync(kordSquadDir, { recursive: true })
    writeFileSync(join(kordSquadDir, "SQUAD.yaml"), MINIMAL_SQUAD_YAML.replace("minimal", "analytics"))

    //#when
    const result = loadAllSquads(projectDir)

    //#then
    const analytics = result.squads.find(s => s.manifest.name === "analytics")
    expect(analytics).toBeDefined()
    expect(analytics!.source).toBe("user")
  })

  test("searches docs/kord/squads/ path", () => {
    //#given
    const projectDir = join(TEST_DIR, "project-docs")
    const docsSquadDir = join(projectDir, "docs", "kord", "squads", "research")
    mkdirSync(docsSquadDir, { recursive: true })
    writeFileSync(join(docsSquadDir, "SQUAD.yaml"), MINIMAL_SQUAD_YAML.replace("minimal", "research"))

    //#when
    const result = loadAllSquads(projectDir)

    //#then
    const research = result.squads.find(s => s.manifest.name === "research")
    expect(research).toBeDefined()
    expect(research!.source).toBe("user")
  })

  test("deduplicates squads by name (first wins)", () => {
    //#given
    const projectDir = join(TEST_DIR, "project-dedup")
    const opencodePath = join(projectDir, ".opencode", "squads", "dupe")
    const kordPath = join(projectDir, ".kord", "squads", "dupe")
    mkdirSync(opencodePath, { recursive: true })
    mkdirSync(kordPath, { recursive: true })
    writeFileSync(join(opencodePath, "SQUAD.yaml"), MINIMAL_SQUAD_YAML.replace("minimal", "dupe"))
    writeFileSync(join(kordPath, "SQUAD.yaml"), MINIMAL_SQUAD_YAML.replace("minimal", "dupe"))

    //#when
    const result = loadAllSquads(projectDir)

    //#then — only one copy of "dupe"
    const dupes = result.squads.filter(s => s.manifest.name === "dupe")
    expect(dupes).toHaveLength(1)
    expect(dupes[0].basePath).toBe(opencodePath)
  })
})

describe("createSquadAgentConfig", () => {
  test("creates config with custom prompt", () => {
    //#given
    const agentDef: SquadAgent = {
      description: "Test agent",
      mode: "subagent",
      prompt: "You are a test agent.",
      skills: [],
      is_chief: false,
      model: "anthropic/claude-sonnet-4-5",
    }

    //#when
    const config = createSquadAgentConfig("test-agent", agentDef, "test-squad")

    //#then
    expect(config.description).toBe("(test-squad squad) Test agent")
    expect(config.prompt).toBe("You are a test agent.")
    expect(config.model).toBe("anthropic/claude-sonnet-4-5")
  })

  test("resolved prompt_file takes priority over inline prompt", () => {
    //#given
    const agentDef: SquadAgent = {
      description: "Test agent",
      mode: "subagent",
      prompt: "Inline prompt",
      prompt_file: "agents/test.md",
      skills: [],
      is_chief: false,
    }
    const resolvedPrompts = { "test-agent": "Resolved from .md file" }

    //#when
    const config = createSquadAgentConfig("test-agent", agentDef, "test-squad", resolvedPrompts)

    //#then
    expect(config.prompt).toBe("Resolved from .md file")
  })

  test("falls back to inline prompt when prompt_file not resolved", () => {
    //#given
    const agentDef: SquadAgent = {
      description: "Test agent",
      mode: "subagent",
      prompt: "Inline prompt",
      prompt_file: "agents/missing.md",
      skills: [],
      is_chief: false,
    }
    const resolvedPrompts: Record<string, string> = {}

    //#when
    const config = createSquadAgentConfig("test-agent", agentDef, "test-squad", resolvedPrompts)

    //#then
    expect(config.prompt).toBe("Inline prompt")
  })

  test("creates config with default prompt when none provided", () => {
    //#given
    const agentDef: SquadAgent = {
      description: "Copywriter for marketing",
      mode: "subagent",
      skills: [],
      is_chief: false,
    }

    //#when
    const config = createSquadAgentConfig("copywriter", agentDef, "marketing")

    //#then
    expect(config.prompt).toContain("copywriter")
    expect(config.prompt).toContain("marketing")
    expect(config.prompt).toContain("Kord AIOS")
  })

  test("chief agent prompt mentions delegation capability", () => {
    //#given
    const agentDef: SquadAgent = {
      description: "Squad chief",
      mode: "subagent",
      skills: [],
      is_chief: true,
    }

    //#when
    const config = createSquadAgentConfig("chief", agentDef, "test")

    //#then
    expect(config.prompt).toContain("Squad chief")
    expect(config.prompt).toContain("delegate")
  })
})

describe("getSquadAgents", () => {
  test("extracts agents from loaded squads", () => {
    //#given
    const result = loadAllSquads()

    //#when
    const agents = getSquadAgents(result.squads)

    //#then
    expect(agents.length).toBeGreaterThan(0)
    const devJunior = agents.find(a => a.name === "dev-junior")
    expect(devJunior).toBeDefined()
    expect(devJunior!.squadName).toBe("dev")
  })
})

describe("getSquadCategories", () => {
  test("extracts categories from loaded squads", () => {
    //#given
    const result = loadAllSquads()

    //#when
    const categories = getSquadCategories(result.squads)

    //#then
    expect(categories.length).toBeGreaterThan(0)
    const quickCat = categories.find(c => c.name === "dev:quick")
    expect(quickCat).toBeDefined()
    expect(quickCat!.squadName).toBe("dev")
  })
})

describe("buildSquadPromptSection", () => {
  test("returns empty string for no squads", () => {
    expect(buildSquadPromptSection([])).toBe("")
  })

  test("builds markdown table for squads", () => {
    //#given
    const result = loadAllSquads()

    //#when
    const section = buildSquadPromptSection(result.squads)

    //#then
    expect(section).toContain("### Available Squads")
    expect(section).toContain("| dev |")
    expect(section).toContain("@dev-junior")
    expect(section).toContain("### How to Delegate to Squad Agents")
  })

  test("includes delegation syntax per agent with task(subagent_type=...)", () => {
    //#given
    const result = loadAllSquads()

    //#when
    const section = buildSquadPromptSection(result.squads)

    //#then
    expect(section).toContain('task(subagent_type="dev-junior")')
    expect(section).toContain("Use `task(subagent_type=...)` to invoke a specific squad agent:")
  })

  test("includes category routing syntax with task(category=...)", () => {
    //#given
    const result = loadAllSquads()

    //#when
    const section = buildSquadPromptSection(result.squads)

    //#then — dev squad has categories (quick, visual, ultrabrain, artistry)
    expect(section).toContain("### Squad Categories")
    expect(section).toContain('task(category="dev:quick")')
    expect(section).toContain("Use `task(category=...)` for domain-specific routing:")
  })

  test("includes squad skills section", () => {
    //#given
    const result = loadAllSquads()

    //#when
    const section = buildSquadPromptSection(result.squads)

    //#then — dev squad agents have skills
    expect(section).toContain("### Squad Skills")
    expect(section).toContain("**dev**:")
  })

  test("omits categories section when no squads have categories", () => {
    //#given
    const jsYaml = require("js-yaml")
    const manifest = squadSchema.parse(jsYaml.load(MINIMAL_SQUAD_YAML))
    const squads: LoadedSquad[] = [{
      manifest,
      source: "user",
      basePath: "/tmp/fake",
      resolvedPrompts: {},
    }]

    //#when
    const section = buildSquadPromptSection(squads)

    //#then
    expect(section).toContain("### Available Squads")
    expect(section).not.toContain("### Squad Categories")
  })

  test("omits skills section when no agents have skills", () => {
    //#given
    const jsYaml = require("js-yaml")
    const manifest = squadSchema.parse(jsYaml.load(MINIMAL_SQUAD_YAML))
    const squads: LoadedSquad[] = [{
      manifest,
      source: "user",
      basePath: "/tmp/fake",
      resolvedPrompts: {},
    }]

    //#when
    const section = buildSquadPromptSection(squads)

    //#then
    expect(section).not.toContain("### Squad Skills")
  })

  test("shows all agents from multiple squads in delegation section", () => {
    //#given
    const jsYaml = require("js-yaml")
    const manifest1 = squadSchema.parse(jsYaml.load(VALID_SQUAD_YAML))
    const manifest2 = squadSchema.parse(jsYaml.load(MINIMAL_SQUAD_YAML))
    const squads: LoadedSquad[] = [
      { manifest: manifest1, source: "user", basePath: "/tmp/fake1", resolvedPrompts: {} },
      { manifest: manifest2, source: "user", basePath: "/tmp/fake2", resolvedPrompts: {} },
    ]

    //#when
    const section = buildSquadPromptSection(squads)

    //#then
    expect(section).toContain('task(subagent_type="copywriter")')
    expect(section).toContain('task(subagent_type="designer")')
    expect(section).toContain('task(subagent_type="brand-chief")')
    expect(section).toContain('task(subagent_type="worker")')
    expect(section).toContain('task(category="marketing:creative")')
    expect(section).toContain('task(category="marketing:visual")')
    expect(section).toContain("**marketing**: brand-voice")
  })
})

describe("createAllSquadAgentConfigs", () => {
  test("creates configs for all agents in all squads", () => {
    //#given
    const result = loadAllSquads()

    //#when
    const configs = createAllSquadAgentConfigs(result.squads)

    //#then
    expect(configs.size).toBeGreaterThan(0)
    expect(configs.has("dev-junior")).toBe(true)
    const devJuniorConfig = configs.get("dev-junior")!
    expect(devJuniorConfig.prompt).toContain("dev-junior")
  })
})
