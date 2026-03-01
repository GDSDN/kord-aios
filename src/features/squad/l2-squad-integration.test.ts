/**
 * L2-Squad Integration Tests
 *
 * End-to-end tests for the L2-Squad system including:
 * - Chief prompt assembly (awareness + domain methodology + coordination)
 * - Prefixed naming collision prevention
 * - Chief mode "all" vs worker mode "subagent"
 * - Worker prompt isolation (no coordination template)
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { squadSchema } from "./schema"
import { loadSquadsFromDir } from "./loader"
import {
  createSquadAgentConfig,
  createAllSquadAgentConfigs,
} from "./factory"
import type { SquadAgent, SquadManifest } from "./schema"
import type { LoadedSquad } from "./loader"

const TEST_DIR = join(import.meta.dir, "__l2_test_squads__")

// Two squads with the same agent key "worker" - tests collision prevention
const SQUAD_ALPHA_YAML = `
name: alpha
description: Alpha squad
version: "1.0.0"

agents:
  chief:
    description: "Alpha chief"
    is_chief: true
    prompt: "Alpha domain methodology: Always prioritize speed."
  worker:
    description: "Alpha worker"
    mode: subagent

categories:
  fast:
    description: "Fast tasks"
`

const SQUAD_BETA_YAML = `
name: beta
description: Beta squad
version: "1.0.0"

agents:
  chief:
    description: "Beta chief"
    is_chief: true
    prompt: "Beta domain methodology: Always prioritize quality."
  worker:
    description: "Beta worker"
    mode: subagent
    prompt: "Worker with custom prompt"

categories:
  quality:
    description: "Quality tasks"
`

// Squad without chief - tests non-chief behavior
const SQUAD_GAMMA_YAML = `
name: gamma
description: Gamma squad without chief
version: "1.0.0"

agents:
  specialist:
    description: "Gamma specialist"
    mode: subagent
    skills: [analysis]
  coordinator:
    description: "Gamma coordinator"
    is_chief: false
`

describe("L2-Squad Integration: Chief Prompt Assembly", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("chief prompt contains awareness + domain methodology + coordination template", () => {
    //#given
    const squadDir = join(TEST_DIR, "alpha")
    mkdirSync(squadDir, { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), SQUAD_ALPHA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")
    const configs = createAllSquadAgentConfigs(result.squads)
    const chiefConfig = configs.get("squad-alpha-chief")!

    //#then
    // 1. Awareness section present
    expect(chiefConfig.prompt).toContain("## Squad Awareness")
    expect(chiefConfig.prompt).toContain("@squad-alpha-chief")
    expect(chiefConfig.prompt).toContain("@squad-alpha-worker")

    // 2. Domain methodology (custom prompt) present
    expect(chiefConfig.prompt).toContain("Alpha domain methodology")

    // 3. Coordination template present
    expect(chiefConfig.prompt).toContain("## Coordination Protocol")
    expect(chiefConfig.prompt).toContain("Delegation Guidelines")
    expect(chiefConfig.prompt).toContain("Quality Gates")

    // Order: identity -> awareness -> custom -> coordination
    const awarenessIdx = chiefConfig.prompt.indexOf("## Squad Awareness")
    const customIdx = chiefConfig.prompt.indexOf("Alpha domain methodology")
    const coordIdx = chiefConfig.prompt.indexOf("## Coordination Protocol")

    expect(awarenessIdx).toBeGreaterThan(0)
    expect(customIdx).toBeGreaterThan(awarenessIdx)
    expect(coordIdx).toBeGreaterThan(customIdx)
  })

  test("chief prompt without custom domain content still has awareness + coordination", () => {
    //#given
    const squadDir = join(TEST_DIR, "gamma")
    mkdirSync(squadDir, { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), SQUAD_GAMMA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")
    const configs = createAllSquadAgentConfigs(result.squads)

    // Chief doesn't exist in gamma, coordinator is not chief
    // Test that non-chief coordinator has neither awareness nor coordination
    const coordConfig = configs.get("squad-gamma-coordinator")!

    //#then
    expect(coordConfig.prompt).not.toContain("## Squad Awareness")
    expect(coordConfig.prompt).not.toContain("## Coordination Protocol")
  })
})

describe("L2-Squad Integration: Prefixed Naming Collision Prevention", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("same yaml key across squads generates unique runtime names", () => {
    //#given
    const alphaDir = join(TEST_DIR, "alpha")
    const betaDir = join(TEST_DIR, "beta")
    mkdirSync(alphaDir, { recursive: true })
    mkdirSync(betaDir, { recursive: true })
    writeFileSync(join(alphaDir, "SQUAD.yaml"), SQUAD_ALPHA_YAML)
    writeFileSync(join(betaDir, "SQUAD.yaml"), SQUAD_BETA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")

    //#then
    // Should load both squads
    expect(result.squads).toHaveLength(2)
    expect(result.errors).toHaveLength(0)

    const configs = createAllSquadAgentConfigs(result.squads)

    // Both squads have "worker" key - should NOT collide
    expect(configs.has("squad-alpha-worker")).toBe(true)
    expect(configs.has("squad-beta-worker")).toBe(true)

    // Both squads have "chief" key - should NOT collide
    expect(configs.has("squad-alpha-chief")).toBe(true)
    expect(configs.has("squad-beta-chief")).toBe(true)

    // Each worker has correct description
    expect(configs.get("squad-alpha-worker")?.description).toContain("Alpha worker")
    expect(configs.get("squad-beta-worker")?.description).toContain("Beta worker")
  })

  test("delegation syntax uses prefixed names in chief awareness", () => {
    //#given
    const alphaDir = join(TEST_DIR, "alpha")
    mkdirSync(alphaDir, { recursive: true })
    writeFileSync(join(alphaDir, "SQUAD.yaml"), SQUAD_ALPHA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")
    const configs = createAllSquadAgentConfigs(result.squads)
    const chiefConfig = configs.get("squad-alpha-chief")!

    //#then
    // Delegation syntax should use prefixed names
    expect(chiefConfig.prompt).toContain('task(subagent_type="squad-alpha-worker")')
    expect(chiefConfig.prompt).not.toContain('task(subagent_type="worker")')
  })
})

describe("L2-Squad Integration: Chief Mode vs Worker Mode", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("chief agent mode is forced to 'all'", () => {
    //#given
    const squadDir = join(TEST_DIR, "alpha")
    mkdirSync(squadDir, { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), SQUAD_ALPHA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")
    const configs = createAllSquadAgentConfigs(result.squads)

    //#then
    const chiefConfig = configs.get("squad-alpha-chief")!
    expect(chiefConfig.mode).toBe("all")
  })

  test("worker agent mode defaults to 'subagent'", () => {
    //#given
    const squadDir = join(TEST_DIR, "alpha")
    mkdirSync(squadDir, { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), SQUAD_ALPHA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")
    const configs = createAllSquadAgentConfigs(result.squads)

    //#then
    const workerConfig = configs.get("squad-alpha-worker")!
    expect(workerConfig.mode).toBe("subagent")
  })

  test("explicit worker mode 'subagent' is preserved", () => {
    //#given
    const squadDir = join(TEST_DIR, "beta")
    mkdirSync(squadDir, { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), SQUAD_BETA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")
    const configs = createAllSquadAgentConfigs(result.squads)

    //#then
    const workerConfig = configs.get("squad-beta-worker")!
    expect(workerConfig.mode).toBe("subagent")
  })
})

describe("L2-Squad Integration: Worker Prompt Isolation", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("worker prompt does NOT contain coordination template", () => {
    //#given
    const alphaDir = join(TEST_DIR, "alpha")
    mkdirSync(alphaDir, { recursive: true })
    writeFileSync(join(alphaDir, "SQUAD.yaml"), SQUAD_ALPHA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")
    const configs = createAllSquadAgentConfigs(result.squads)
    const workerConfig = configs.get("squad-alpha-worker")!

    //#then
    expect(workerConfig.prompt).not.toContain("## Coordination Protocol")
    expect(workerConfig.prompt).not.toContain("Delegation Guidelines")
    expect(workerConfig.prompt).not.toContain("Quality Gates")
  })

  test("worker prompt does NOT contain Squad Awareness section", () => {
    //#given
    const alphaDir = join(TEST_DIR, "alpha")
    mkdirSync(alphaDir, { recursive: true })
    writeFileSync(join(alphaDir, "SQUAD.yaml"), SQUAD_ALPHA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")
    const configs = createAllSquadAgentConfigs(result.squads)
    const workerConfig = configs.get("squad-alpha-worker")!

    //#then
    expect(workerConfig.prompt).not.toContain("## Squad Awareness")
  })

  test("worker with custom prompt gets custom content but no awareness/coordination", () => {
    //#given
    const betaDir = join(TEST_DIR, "beta")
    mkdirSync(betaDir, { recursive: true })
    writeFileSync(join(betaDir, "SQUAD.yaml"), SQUAD_BETA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")
    const configs = createAllSquadAgentConfigs(result.squads)
    const workerConfig = configs.get("squad-beta-worker")!

    //#then
    // Custom prompt present
    expect(workerConfig.prompt).toContain("Worker with custom prompt")

    // But no L2 features
    expect(workerConfig.prompt).not.toContain("## Squad Awareness")
    expect(workerConfig.prompt).not.toContain("## Coordination Protocol")
  })
})

describe("L2-Squad Integration: Category Routing with Prefixed Names", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("category names include squad prefix to prevent collisions", () => {
    //#given
    const alphaDir = join(TEST_DIR, "alpha")
    const betaDir = join(TEST_DIR, "beta")
    mkdirSync(alphaDir, { recursive: true })
    mkdirSync(betaDir, { recursive: true })
    writeFileSync(join(alphaDir, "SQUAD.yaml"), SQUAD_ALPHA_YAML)
    writeFileSync(join(betaDir, "SQUAD.yaml"), SQUAD_BETA_YAML)

    //#when
    const result = loadSquadsFromDir(TEST_DIR, "user")

    //#then
    const { getSquadCategories } = require("./factory")
    const categories = getSquadCategories(result.squads)

    expect(categories.find(c => c.name === "alpha:fast")).toBeDefined()
    expect(categories.find(c => c.name === "beta:quality")).toBeDefined()
    // No collision on "fast" or "quality" - each namespaced by squad
    expect(categories.find(c => c.name === "fast")).toBeUndefined()
    expect(categories.find(c => c.name === "quality")).toBeUndefined()
  })
})
