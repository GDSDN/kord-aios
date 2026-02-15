import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import {
  ModelEntrySchema,
  ModelSchemaFileSchema,
  DEFAULT_MODEL_SCHEMA,
  getModelsForAgent,
  getModelsByDomain,
  getModelsByReasoning,
  loadModelSchema,
  clearModelSchemaCache,
  type ModelEntry,
} from "./model-schema"
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

describe("ModelEntrySchema", () => {
  test("accepts a valid full entry", () => {
    //#given
    const entry = {
      model: "claude-opus-4-6",
      providers: ["anthropic", "github-copilot"],
      reasoning: "ultra",
      domains: ["planning", "analysis", "coding"],
      description: "Deep reasoning",
      enabled_agents: ["kord", "planner"],
      cost_tier: 5,
      variant: "max",
    }

    //#when
    const result = ModelEntrySchema.safeParse(entry)

    //#then
    expect(result.success).toBe(true)
  })

  test("applies defaults for reasoning and enabled_agents", () => {
    //#given
    const entry = {
      model: "test-model",
      providers: ["openai"],
      domains: ["general"],
      description: "Test",
      cost_tier: 2,
    }

    //#when
    const result = ModelEntrySchema.parse(entry)

    //#then
    expect(result.reasoning).toBe("none")
    expect(result.enabled_agents).toEqual([])
  })

  test("rejects missing required fields", () => {
    //#given
    const entry = { model: "test" }

    //#when
    const result = ModelEntrySchema.safeParse(entry)

    //#then
    expect(result.success).toBe(false)
  })

  test("rejects invalid reasoning tier", () => {
    //#given
    const entry = {
      model: "test",
      providers: ["openai"],
      reasoning: "mega",
      domains: ["general"],
      description: "Test",
      cost_tier: 2,
    }

    //#when
    const result = ModelEntrySchema.safeParse(entry)

    //#then
    expect(result.success).toBe(false)
  })

  test("rejects invalid domain", () => {
    //#given
    const entry = {
      model: "test",
      providers: ["openai"],
      reasoning: "none",
      domains: ["invalid-domain"],
      description: "Test",
      cost_tier: 2,
    }

    //#when
    const result = ModelEntrySchema.safeParse(entry)

    //#then
    expect(result.success).toBe(false)
  })

  test("rejects cost_tier outside 1-5 range", () => {
    //#given
    const tooLow = {
      model: "test",
      providers: ["openai"],
      domains: ["general"],
      description: "Test",
      cost_tier: 0,
    }
    const tooHigh = {
      model: "test",
      providers: ["openai"],
      domains: ["general"],
      description: "Test",
      cost_tier: 6,
    }

    //#when / #then
    expect(ModelEntrySchema.safeParse(tooLow).success).toBe(false)
    expect(ModelEntrySchema.safeParse(tooHigh).success).toBe(false)
  })

  test("accepts optional context_window", () => {
    //#given
    const entry = {
      model: "test",
      providers: ["openai"],
      domains: ["general"],
      description: "Test",
      cost_tier: 2,
      context_window: 200000,
    }

    //#when
    const result = ModelEntrySchema.safeParse(entry)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.context_window).toBe(200000)
    }
  })

  test("variant is optional", () => {
    //#given
    const entry = {
      model: "test",
      providers: ["openai"],
      domains: ["general"],
      description: "Test",
      cost_tier: 2,
    }

    //#when
    const result = ModelEntrySchema.parse(entry)

    //#then
    expect(result.variant).toBeUndefined()
  })
})

describe("ModelSchemaFileSchema", () => {
  test("accepts valid models array", () => {
    //#given
    const file = {
      models: [
        {
          model: "claude-opus-4-6",
          providers: ["anthropic"],
          reasoning: "ultra",
          domains: ["planning"],
          description: "Deep",
          enabled_agents: ["kord"],
          cost_tier: 5,
        },
      ],
    }

    //#when
    const result = ModelSchemaFileSchema.safeParse(file)

    //#then
    expect(result.success).toBe(true)
  })

  test("rejects non-object", () => {
    expect(ModelSchemaFileSchema.safeParse("string").success).toBe(false)
    expect(ModelSchemaFileSchema.safeParse(42).success).toBe(false)
  })

  test("rejects missing models field", () => {
    expect(ModelSchemaFileSchema.safeParse({}).success).toBe(false)
  })
})

describe("DEFAULT_MODEL_SCHEMA", () => {
  test("contains at least 10 model entries", () => {
    expect(DEFAULT_MODEL_SCHEMA.length).toBeGreaterThanOrEqual(10)
  })

  test("all entries validate against ModelEntrySchema", () => {
    for (const entry of DEFAULT_MODEL_SCHEMA) {
      const result = ModelEntrySchema.safeParse(entry)
      expect(result.success).toBe(true)
    }
  })

  test("includes claude-opus-4-6 with ultra reasoning", () => {
    const opus = DEFAULT_MODEL_SCHEMA.find((e: ModelEntry) => e.model === "claude-opus-4-6")
    expect(opus).toBeDefined()
    expect(opus!.reasoning).toBe("ultra")
    expect(opus!.variant).toBe("max")
    expect(opus!.cost_tier).toBe(5)
  })

  test("includes gpt-5.3-codex with ultra reasoning", () => {
    const codex = DEFAULT_MODEL_SCHEMA.find((e: ModelEntry) => e.model === "gpt-5.3-codex")
    expect(codex).toBeDefined()
    expect(codex!.reasoning).toBe("ultra")
    expect(codex!.variant).toBe("medium")
  })

  test("includes budget models with low cost_tier", () => {
    const budget = DEFAULT_MODEL_SCHEMA.filter((e: ModelEntry) => e.cost_tier <= 2)
    expect(budget.length).toBeGreaterThanOrEqual(2)
  })

  test("every entry has at least one provider", () => {
    for (const entry of DEFAULT_MODEL_SCHEMA) {
      expect(entry.providers.length).toBeGreaterThanOrEqual(1)
    }
  })

  test("every entry has at least one domain", () => {
    for (const entry of DEFAULT_MODEL_SCHEMA) {
      expect(entry.domains.length).toBeGreaterThanOrEqual(1)
    }
  })
})

describe("getModelsForAgent", () => {
  test("returns models enabled for kord", () => {
    //#when
    const models = getModelsForAgent("kord", DEFAULT_MODEL_SCHEMA)

    //#then
    expect(models.length).toBeGreaterThanOrEqual(1)
    expect(models.every((m: ModelEntry) => m.enabled_agents.includes("kord"))).toBe(true)
  })

  test("returns empty array for unknown agent", () => {
    //#when
    const models = getModelsForAgent("nonexistent-agent", DEFAULT_MODEL_SCHEMA)

    //#then
    expect(models).toEqual([])
  })

  test("returns different sets for different agents", () => {
    //#when
    const kordModels = getModelsForAgent("kord", DEFAULT_MODEL_SCHEMA)
    const exploreModels = getModelsForAgent("explore", DEFAULT_MODEL_SCHEMA)

    //#then
    const kordNames = kordModels.map((m: ModelEntry) => m.model)
    const exploreNames = exploreModels.map((m: ModelEntry) => m.model)
    expect(kordNames).not.toEqual(exploreNames)
  })
})

describe("getModelsByDomain", () => {
  test("returns models with coding domain", () => {
    //#when
    const models = getModelsByDomain("coding", DEFAULT_MODEL_SCHEMA)

    //#then
    expect(models.length).toBeGreaterThanOrEqual(1)
    expect(models.every((m: ModelEntry) => m.domains.includes("coding"))).toBe(true)
  })

  test("returns models with visual domain", () => {
    //#when
    const models = getModelsByDomain("visual", DEFAULT_MODEL_SCHEMA)

    //#then
    expect(models.length).toBeGreaterThanOrEqual(1)
  })

  test("returns empty for nonexistent domain", () => {
    //#when
    const models = getModelsByDomain("nonexistent" as any, DEFAULT_MODEL_SCHEMA)

    //#then
    expect(models).toEqual([])
  })
})

describe("getModelsByReasoning", () => {
  test("returns ultra-reasoning models", () => {
    //#when
    const models = getModelsByReasoning("ultra", DEFAULT_MODEL_SCHEMA)

    //#then
    expect(models.length).toBeGreaterThanOrEqual(1)
    expect(models.every((m: ModelEntry) => m.reasoning === "ultra")).toBe(true)
  })

  test("returns none-reasoning models", () => {
    //#when
    const models = getModelsByReasoning("none", DEFAULT_MODEL_SCHEMA)

    //#then
    expect(models.length).toBeGreaterThanOrEqual(1)
    expect(models.every((m: ModelEntry) => m.reasoning === "none")).toBe(true)
  })

  test("returns empty for tier with no models", () => {
    //#given - custom schema with no "low" entries
    const schema: ModelEntry[] = [
      {
        model: "test",
        providers: ["openai"],
        reasoning: "ultra",
        domains: ["general"],
        description: "Test",
        enabled_agents: [],
        cost_tier: 5,
      },
    ]

    //#when
    const models = getModelsByReasoning("low", schema)

    //#then
    expect(models).toEqual([])
  })
})

const LOADER_TEST_DIR = join(tmpdir(), `model-schema-loader-test-${Date.now()}`)
const USER_DIR = join(LOADER_TEST_DIR, "user-config", "kord-aios")
const PROJECT_DIR = join(LOADER_TEST_DIR, "project")
const PROJECT_SCHEMA_DIR = join(PROJECT_DIR, ".opencode", "kord-aios")

function writeUserSchema(content: string): void {
  mkdirSync(USER_DIR, { recursive: true })
  writeFileSync(join(USER_DIR, "model-schema.jsonc"), content)
}

function writeProjectSchema(content: string): void {
  mkdirSync(PROJECT_SCHEMA_DIR, { recursive: true })
  writeFileSync(join(PROJECT_SCHEMA_DIR, "model-schema.jsonc"), content)
}

describe("loadModelSchema", () => {
  beforeEach(() => {
    clearModelSchemaCache()
    mkdirSync(LOADER_TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    clearModelSchemaCache()
    if (existsSync(LOADER_TEST_DIR)) {
      rmSync(LOADER_TEST_DIR, { recursive: true, force: true })
    }
  })

  test("returns DEFAULT_MODEL_SCHEMA when no files exist", () => {
    //#when
    const result = loadModelSchema({
      userConfigDir: join(LOADER_TEST_DIR, "nonexistent"),
      projectDir: join(LOADER_TEST_DIR, "nonexistent-project"),
    })

    //#then
    expect(result.length).toBe(DEFAULT_MODEL_SCHEMA.length)
    expect(result).toEqual(DEFAULT_MODEL_SCHEMA)
  })

  test("user-level file overrides default entries by model name", () => {
    //#given
    writeUserSchema(JSON.stringify({
      models: [
        {
          model: "claude-opus-4-6",
          providers: ["anthropic"],
          reasoning: "high",
          domains: ["coding"],
          description: "User override",
          enabled_agents: ["kord"],
          cost_tier: 4,
        },
      ],
    }))

    //#when
    const result = loadModelSchema({
      userConfigDir: USER_DIR,
      projectDir: join(LOADER_TEST_DIR, "nonexistent-project"),
    })

    //#then
    const opus = result.find((e: ModelEntry) => e.model === "claude-opus-4-6")
    expect(opus).toBeDefined()
    expect(opus!.reasoning).toBe("high")
    expect(opus!.description).toBe("User override")
    expect(opus!.cost_tier).toBe(4)
  })

  test("project-level file overrides user-level entries by model name", () => {
    //#given
    writeUserSchema(JSON.stringify({
      models: [
        {
          model: "claude-opus-4-6",
          providers: ["anthropic"],
          reasoning: "high",
          domains: ["coding"],
          description: "User override",
          enabled_agents: ["kord"],
          cost_tier: 4,
        },
      ],
    }))
    writeProjectSchema(JSON.stringify({
      models: [
        {
          model: "claude-opus-4-6",
          providers: ["anthropic", "opencode"],
          reasoning: "medium",
          domains: ["general"],
          description: "Project override",
          enabled_agents: ["builder"],
          cost_tier: 2,
        },
      ],
    }))

    //#when
    const result = loadModelSchema({
      userConfigDir: USER_DIR,
      projectDir: PROJECT_DIR,
    })

    //#then
    const opus = result.find((e: ModelEntry) => e.model === "claude-opus-4-6")
    expect(opus).toBeDefined()
    expect(opus!.description).toBe("Project override")
    expect(opus!.reasoning).toBe("medium")
    expect(opus!.cost_tier).toBe(2)
  })

  test("adds new models from user/project files", () => {
    //#given
    writeUserSchema(JSON.stringify({
      models: [
        {
          model: "custom-model-xyz",
          providers: ["custom-provider"],
          reasoning: "low",
          domains: ["general"],
          description: "Custom model",
          enabled_agents: ["kord"],
          cost_tier: 1,
        },
      ],
    }))

    //#when
    const result = loadModelSchema({
      userConfigDir: USER_DIR,
      projectDir: join(LOADER_TEST_DIR, "nonexistent-project"),
    })

    //#then
    expect(result.length).toBe(DEFAULT_MODEL_SCHEMA.length + 1)
    const custom = result.find((e: ModelEntry) => e.model === "custom-model-xyz")
    expect(custom).toBeDefined()
  })

  test("skips invalid entries and keeps valid ones", () => {
    //#given
    writeUserSchema(JSON.stringify({
      models: [
        {
          model: "valid-model",
          providers: ["openai"],
          reasoning: "low",
          domains: ["general"],
          description: "Valid",
          enabled_agents: [],
          cost_tier: 2,
        },
        {
          model: "invalid-model",
          providers: ["openai"],
          reasoning: "INVALID_TIER",
          domains: ["general"],
          description: "Invalid",
          cost_tier: 2,
        },
      ],
    }))

    //#when
    const result = loadModelSchema({
      userConfigDir: USER_DIR,
      projectDir: join(LOADER_TEST_DIR, "nonexistent-project"),
    })

    //#then
    const valid = result.find((e: ModelEntry) => e.model === "valid-model")
    const invalid = result.find((e: ModelEntry) => e.model === "invalid-model")
    expect(valid).toBeDefined()
    expect(invalid).toBeUndefined()
  })

  test("normalizes: drops variant when reasoning is none", () => {
    //#given
    writeUserSchema(JSON.stringify({
      models: [
        {
          model: "no-reason-with-variant",
          providers: ["openai"],
          reasoning: "none",
          domains: ["general"],
          description: "Should drop variant",
          enabled_agents: [],
          cost_tier: 1,
          variant: "high",
        },
      ],
    }))

    //#when
    const result = loadModelSchema({
      userConfigDir: USER_DIR,
      projectDir: join(LOADER_TEST_DIR, "nonexistent-project"),
    })

    //#then
    const entry = result.find((e: ModelEntry) => e.model === "no-reason-with-variant")
    expect(entry).toBeDefined()
    expect(entry!.variant).toBeUndefined()
  })

  test("caches result on subsequent calls with same options", () => {
    //#given
    const opts = {
      userConfigDir: join(LOADER_TEST_DIR, "nonexistent"),
      projectDir: join(LOADER_TEST_DIR, "nonexistent-project"),
    }
    const first = loadModelSchema(opts)

    //#when — write a file AFTER first load (should not affect cached result)
    writeUserSchema(JSON.stringify({
      models: [
        {
          model: "after-cache",
          providers: ["openai"],
          reasoning: "low",
          domains: ["general"],
          description: "After cache",
          enabled_agents: [],
          cost_tier: 1,
        },
      ],
    }))
    const second = loadModelSchema(opts)

    //#then
    expect(second).toEqual(first)
    expect(second.find((e: ModelEntry) => e.model === "after-cache")).toBeUndefined()
  })

  test("handles malformed JSONC file gracefully (falls back to defaults)", () => {
    //#given
    mkdirSync(USER_DIR, { recursive: true })
    writeFileSync(join(USER_DIR, "model-schema.jsonc"), "{ this is not valid json ]}")

    //#when
    const result = loadModelSchema({
      userConfigDir: USER_DIR,
      projectDir: join(LOADER_TEST_DIR, "nonexistent-project"),
    })

    //#then
    expect(result.length).toBe(DEFAULT_MODEL_SCHEMA.length)
  })
})
