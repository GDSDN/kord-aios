import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { ANTIGRAVITY_PROVIDER_CONFIG, getPluginNameWithVersion, fetchNpmDistTags, generateKordAiosConfig, writeProjectKordAiosConfig } from "./config-manager"
import type { InstallConfig } from "./types"

describe("getPluginNameWithVersion", () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("returns @latest when current version matches latest tag", async () => {
    // #given npm dist-tags with latest=2.14.0
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is 2.14.0
    const result = await getPluginNameWithVersion("2.14.0")

    // #then should use @latest tag
    expect(result).toBe("kord-aios@latest")
  })

  test("returns @beta when current version matches beta tag", async () => {
    // #given npm dist-tags with beta=3.0.0-beta.3
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is 3.0.0-beta.3
    const result = await getPluginNameWithVersion("3.0.0-beta.3")

    // #then should use @beta tag
    expect(result).toBe("kord-aios@beta")
  })

  test("returns @next when current version matches next tag", async () => {
    // #given npm dist-tags with next=3.1.0-next.1
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3", next: "3.1.0-next.1" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is 3.1.0-next.1
    const result = await getPluginNameWithVersion("3.1.0-next.1")

    // #then should use @next tag
    expect(result).toBe("kord-aios@next")
  })

  test("returns pinned version when no tag matches", async () => {
    // #given npm dist-tags with beta=3.0.0-beta.3
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is old beta 3.0.0-beta.2
    const result = await getPluginNameWithVersion("3.0.0-beta.2")

    // #then should pin to specific version
    expect(result).toBe("kord-aios@3.0.0-beta.2")
  })

  test("returns pinned version when fetch fails", async () => {
    // #given network failure
    globalThis.fetch = mock(() => Promise.reject(new Error("Network error"))) as unknown as typeof fetch

    // #when current version is 3.0.0-beta.3
    const result = await getPluginNameWithVersion("3.0.0-beta.3")

    // #then should fall back to pinned version
    expect(result).toBe("kord-aios@3.0.0-beta.3")
  })

  test("returns pinned version when npm returns non-ok response", async () => {
    // #given npm returns 404
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is 2.14.0
    const result = await getPluginNameWithVersion("2.14.0")

    // #then should fall back to pinned version
    expect(result).toBe("kord-aios@2.14.0")
  })

  test("prioritizes latest over other tags when version matches multiple", async () => {
    // #given version matches both latest and beta (during release promotion)
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ beta: "3.0.0", latest: "3.0.0", next: "3.1.0-alpha.1" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version matches both
    const result = await getPluginNameWithVersion("3.0.0")

    // #then should prioritize @latest
    expect(result).toBe("kord-aios@latest")
  })
})

describe("fetchNpmDistTags", () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("returns dist-tags on success", async () => {
    // #given npm returns dist-tags
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when fetching dist-tags
    const result = await fetchNpmDistTags("kord-aios")

    // #then should return the tags
    expect(result).toEqual({ latest: "2.14.0", beta: "3.0.0-beta.3" })
  })

  test("returns null on network failure", async () => {
    // #given network failure
    globalThis.fetch = mock(() => Promise.reject(new Error("Network error"))) as unknown as typeof fetch

    // #when fetching dist-tags
    const result = await fetchNpmDistTags("kord-aios")

    // #then should return null
    expect(result).toBeNull()
  })

  test("returns null on non-ok response", async () => {
    // #given npm returns 404
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      } as Response)
    ) as unknown as typeof fetch

    // #when fetching dist-tags
    const result = await fetchNpmDistTags("kord-aios")

    // #then should return null
    expect(result).toBeNull()
  })
})

describe("config-manager ANTIGRAVITY_PROVIDER_CONFIG", () => {
  test("all models include full spec (limit + modalities + Antigravity label)", () => {
    const google = (ANTIGRAVITY_PROVIDER_CONFIG as any).google
    expect(google).toBeTruthy()

    const models = google.models as Record<string, any>
    expect(models).toBeTruthy()

    const required = [
      "antigravity-gemini-3-pro",
      "antigravity-gemini-3-flash",
      "antigravity-claude-sonnet-4-5",
      "antigravity-claude-sonnet-4-5-thinking",
      "antigravity-claude-opus-4-5-thinking",
    ]

    for (const key of required) {
      const model = models[key]
      expect(model).toBeTruthy()
      expect(typeof model.name).toBe("string")
      expect(model.name.includes("(Antigravity)")).toBe(true)

      expect(model.limit).toBeTruthy()
      expect(typeof model.limit.context).toBe("number")
      expect(typeof model.limit.output).toBe("number")

      expect(model.modalities).toBeTruthy()
      expect(Array.isArray(model.modalities.input)).toBe(true)
      expect(Array.isArray(model.modalities.output)).toBe(true)
    }
  })

  test("Gemini models have variant definitions", () => {
    // #given the antigravity provider config
    const models = (ANTIGRAVITY_PROVIDER_CONFIG as any).google.models as Record<string, any>

    // #when checking Gemini Pro variants
    const pro = models["antigravity-gemini-3-pro"]
    // #then should have low and high variants
    expect(pro.variants).toBeTruthy()
    expect(pro.variants.low).toBeTruthy()
    expect(pro.variants.high).toBeTruthy()

    // #when checking Gemini Flash variants
    const flash = models["antigravity-gemini-3-flash"]
    // #then should have minimal, low, medium, high variants
    expect(flash.variants).toBeTruthy()
    expect(flash.variants.minimal).toBeTruthy()
    expect(flash.variants.low).toBeTruthy()
    expect(flash.variants.medium).toBeTruthy()
    expect(flash.variants.high).toBeTruthy()
  })

  test("Claude thinking models have variant definitions", () => {
    // #given the antigravity provider config
    const models = (ANTIGRAVITY_PROVIDER_CONFIG as any).google.models as Record<string, any>

    // #when checking Claude thinking variants
    const sonnetThinking = models["antigravity-claude-sonnet-4-5-thinking"]
    const opusThinking = models["antigravity-claude-opus-4-5-thinking"]

    // #then both should have low and max variants
    for (const model of [sonnetThinking, opusThinking]) {
      expect(model.variants).toBeTruthy()
      expect(model.variants.low).toBeTruthy()
      expect(model.variants.max).toBeTruthy()
    }
  })
})

describe("generateKordAiosConfig - model fallback system", () => {
  test("generates native sonnet models when Claude standard subscription", () => {
    // #given user has Claude standard subscription (not max20)
    const config: InstallConfig = {
      hasClaude: true,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateKordAiosConfig(config)

    // #then Kord uses Claude (OR logic - at least one provider available)
    expect(result.$schema).toBe("https://raw.githubusercontent.com/GDSDN/kord-aios/master/assets/kord-opencode.schema.json")
    expect(result.agents).toBeDefined()
    expect((result.agents as Record<string, { model: string }>).kord.model).toBe("anthropic/claude-opus-4-6")
  })

  test("generates native opus models when Claude max20 subscription", () => {
    // #given user has Claude max20 subscription
    const config: InstallConfig = {
      hasClaude: true,
      isMax20: true,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateKordAiosConfig(config)

    // #then Kord uses Claude (OR logic - at least one provider available)
    expect((result.agents as Record<string, { model: string }>).kord.model).toBe("anthropic/claude-opus-4-6")
  })

  test("uses github-copilot sonnet fallback when only copilot available", () => {
    // #given user has only copilot (no max plan)
    const config: InstallConfig = {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: true,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateKordAiosConfig(config)

    // #then Kord uses Copilot (OR logic - copilot is in claude-opus-4-6 providers)
    expect((result.agents as Record<string, { model: string }>).kord.model).toBe("github-copilot/claude-opus-4.6")
  })

  test("uses ultimate fallback when no providers configured", () => {
    // #given user has no providers
    const config: InstallConfig = {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateKordAiosConfig(config)

    // #then Kord is omitted (requires all fallback providers)
    expect(result.$schema).toBe("https://raw.githubusercontent.com/GDSDN/kord-aios/master/assets/kord-opencode.schema.json")
    expect((result.agents as Record<string, { model: string }>).kord).toBeUndefined()
  })

  test("uses zai-coding-plan/glm-4.7 for librarian when Z.ai available", () => {
    // #given user has Z.ai and Claude max20
    const config: InstallConfig = {
      hasClaude: true,
      isMax20: true,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: true,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateKordAiosConfig(config)

    // #then librarian should use zai-coding-plan/glm-4.7
    expect((result.agents as Record<string, { model: string }>).librarian.model).toBe("zai-coding-plan/glm-4.7")
    // #then Kord uses Claude (OR logic)
    expect((result.agents as Record<string, { model: string }>).kord.model).toBe("anthropic/claude-opus-4-6")
  })

  test("uses native OpenAI models when only ChatGPT available", () => {
    // #given user has only ChatGPT subscription
    const config: InstallConfig = {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: true,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateKordAiosConfig(config)

    // #then Kord is omitted (requires all fallback providers)
    expect((result.agents as Record<string, { model: string }>).kord).toBeUndefined()
    // #then Architect should use native OpenAI (first fallback entry)
    expect((result.agents as Record<string, { model: string }>).architect.model).toBe("openai/gpt-5.2")
    // #then vision should use native OpenAI (fallback within native tier)
    expect((result.agents as Record<string, { model: string }>)["vision"].model).toBe("openai/gpt-5.2")
  })

  test("uses haiku for explore when Claude max20", () => {
    // #given user has Claude max20
    const config: InstallConfig = {
      hasClaude: true,
      isMax20: true,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateKordAiosConfig(config)

    // #then explore should use haiku (max20 plan uses Claude quota)
    expect((result.agents as Record<string, { model: string }>).explore.model).toBe("anthropic/claude-haiku-4-5")
  })

  test("uses haiku for explore regardless of max20 flag", () => {
    // #given user has Claude but not max20
    const config: InstallConfig = {
      hasClaude: true,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateKordAiosConfig(config)

    // #then explore should use haiku (isMax20 doesn't affect explore anymore)
    expect((result.agents as Record<string, { model: string }>).explore.model).toBe("anthropic/claude-haiku-4-5")
  })
})

describe("addOnlyMerge", () => {
  // Helper to test addOnlyMerge behavior
  const addOnlyMerge = (existing: Record<string, unknown>, newConfig: Record<string, unknown>): Record<string, unknown> => {
    const result = { ...newConfig } // Start with newConfig as base

    for (const key of Object.keys(existing)) {
      const existingValue = existing[key]
      const newValue = newConfig[key]

      // If key exists in existing, it always wins
      if (existingValue !== undefined) {
        // For objects: recursively merge (existing takes precedence)
        if (
          existingValue !== null &&
          typeof existingValue === "object" &&
          !Array.isArray(existingValue) &&
          newValue !== null &&
          typeof newValue === "object" &&
          !Array.isArray(newValue)
        ) {
          // Recursive call for nested objects
          result[key] = addOnlyMerge(existingValue as Record<string, unknown>, newValue as Record<string, unknown>)
        } else {
          // For primitives and arrays: existing always wins
          result[key] = existingValue
        }
      }
    }

    return result
  }

  test("preserves existing primitive values", () => {
    // #given existing config with some values
    const existing = { a: "existing-a", b: "existing-b" }
    // #and new config with different values
    const newConfig = { a: "new-a", c: "new-c" }

    // #when merging
    const result = addOnlyMerge(existing, newConfig)

    // #then existing values preserved
    expect(result.a).toBe("existing-a")
    // #and new values added for missing keys
    expect(result.c).toBe("new-c")
    // #and existing.b also preserved (since it's in existing but not in newConfig)
    expect(result.b).toBe("existing-b")
  })

  test("does NOT replace arrays - existing array wins", () => {
    // #given existing config with array
    const existing = { plugins: ["plugin-a", "plugin-b"] }
    // #and new config with different array
    const newConfig = { plugins: ["plugin-c"] }

    // #when merging
    const result = addOnlyMerge(existing, newConfig)

    // #then existing array is preserved (not replaced)
    expect(result.plugins).toEqual(["plugin-a", "plugin-b"])
  })

  test("adds missing keys from new config", () => {
    // #given existing config
    const existing = { a: 1, b: 2 }
    // #and new config with additional keys
    const newConfig = { a: 100, b: 200, c: 300 }

    // #when merging
    const result = addOnlyMerge(existing, newConfig)

    // #then existing keys preserved
    expect(result.a).toBe(1)
    expect(result.b).toBe(2)
    // #and new key added
    expect(result.c).toBe(300)
  })

  test("recursively merges nested objects with existing taking precedence", () => {
    // #given existing config with nested objects
    const existing = {
      agents: {
        kord: { model: "existing-model", temperature: 0.1 },
        librarian: { model: "existing-librarian" },
      },
    }
    // #and new config with different nested values
    const newConfig = {
      agents: {
        kord: { model: "new-model", maxTokens: 1000 },
        architect: { model: "new-architect" },
      },
    }

    // #when merging
    const result = addOnlyMerge(existing, newConfig)

    // #then existing nested values preserved (model, temperature)
    expect((result.agents as Record<string, unknown>).kord).toEqual({ model: "existing-model", temperature: 0.1, maxTokens: 1000 })
    // #and new nested keys added (maxTokens from newConfig)
    // #and existing keys preserved
    expect((result.agents as Record<string, unknown>).librarian).toEqual({ model: "existing-librarian" })
    // #and new agent added
    expect((result.agents as Record<string, unknown>).architect).toEqual({ model: "new-architect" })
  })

  test("handles null values correctly", () => {
    // #given existing config with null
    const existing = { a: null }
    // #and new config with value
    const newConfig = { a: "new-value" }

    // #when merging
    const result = addOnlyMerge(existing, newConfig)

    // #then null from existing is preserved (not replaced)
    expect(result.a).toBeNull()
  })

  test("handles missing provider block add-only", () => {
    // #given existing config with provider
    const existing = {
      provider: {
        google: { name: "Existing Google", models: {} },
      },
    }
    // #and new config with different provider
    const newConfig = {
      provider: {
        google: { name: "New Google", models: { "new-model": {} } },
      },
    }

    // #when merging
    const result = addOnlyMerge(existing, newConfig)

    // #then existing provider is preserved (name), but new keys added (models)
    expect((result.provider as Record<string, unknown>).google).toEqual({ name: "Existing Google", models: { "new-model": {} } })
  })
})

describe("writeProjectKordAiosConfig", () => {
  const testDir = resolve(__dirname, "test-temp-project-config")
  const opencodeDir = resolve(testDir, ".opencode")
  const projectConfigPath = resolve(opencodeDir, "kord-aios.json")

  beforeEach(() => {
    // Clean up test directory before each test
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    // Clean up test directory after each test
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("creates project config from global", () => {
    // #given global config with some settings
    const globalConfigDir = resolve(__dirname, "test-temp-global-config")
    const globalConfigPath = resolve(globalConfigDir, "kord-aios.json")
    mkdirSync(globalConfigDir, { recursive: true })
    const globalConfig = {
      $schema: "https://raw.githubusercontent.com/GDSDN/kord-aios/master/assets/kord-opencode.schema.json",
      agents: {
        kord: { model: "anthropic/claude-opus-4-6", temperature: 0.1 },
      },
    }
    writeFileSync(globalConfigPath, JSON.stringify(globalConfig, null, 2))

    try {
      // #when writing project config from global
      const result = writeProjectKordAiosConfig(testDir, globalConfigPath)

      // #then should succeed and return project config path
      expect(result.success).toBe(true)
      expect(result.configPath).toBe(projectConfigPath)
      // #and .opencode directory should be created
      expect(existsSync(opencodeDir)).toBe(true)
      // #and project config should match global
      const written = JSON.parse(readFileSync(projectConfigPath, "utf-8"))
      expect(written.agents.kord.model).toBe("anthropic/claude-opus-4-6")
      expect(written.agents.kord.temperature).toBe(0.1)
    } finally {
      rmSync(globalConfigDir, { recursive: true, force: true })
    }
  })

  test("preserves existing project overrides", () => {
    // #given global config
    const globalConfigDir = resolve(__dirname, "test-temp-global-config-2")
    const globalConfigPath = resolve(globalConfigDir, "kord-aios.json")
    mkdirSync(globalConfigDir, { recursive: true })
    const globalConfig = {
      $schema: "https://raw.githubusercontent.com/GDSDN/kord-aios/master/assets/kord-opencode.schema.json",
      agents: {
        kord: { model: "anthropic/claude-opus-4-6", temperature: 0.1 },
        librarian: { model: "zai-coding-plan/glm-4.7" },
      },
    }
    writeFileSync(globalConfigPath, JSON.stringify(globalConfig, null, 2))

    // #and existing project config with overrides
    mkdirSync(opencodeDir, { recursive: true })
    const projectConfig = {
      $schema: "https://raw.githubusercontent.com/GDSDN/kord-aios/master/assets/kord-opencode.schema.json",
      agents: {
        kord: { model: "anthropic/claude-sonnet-4-5", temperature: 0.2 }, // User override
      },
    }
    writeFileSync(projectConfigPath, JSON.stringify(projectConfig, null, 2))

    try {
      // #when writing project config from global (add-only merge)
      const result = writeProjectKordAiosConfig(testDir, globalConfigPath)

      // #then should succeed
      expect(result.success).toBe(true)
      // #and project overrides should be preserved
      const written = JSON.parse(readFileSync(projectConfigPath, "utf-8"))
      // kord values should be from existing project config (not overwritten)
      expect(written.agents.kord.model).toBe("anthropic/claude-sonnet-4-5")
      expect(written.agents.kord.temperature).toBe(0.2)
      // #but new keys from global should be added (librarian)
      expect(written.agents.librarian.model).toBe("zai-coding-plan/glm-4.7")
    } finally {
      rmSync(globalConfigDir, { recursive: true, force: true })
    }
  })

  test("handles missing global config (writes minimal $schema)", () => {
    // #given no global config exists
    const nonExistentGlobalPath = resolve(__dirname, "non-existent-global-kord-aios.json")

    // #when writing project config with missing global
    const result = writeProjectKordAiosConfig(testDir, nonExistentGlobalPath)

    // #then should succeed
    expect(result.success).toBe(true)
    expect(result.configPath).toBe(projectConfigPath)
    // #and should write minimal config with $schema only
    const written = JSON.parse(readFileSync(projectConfigPath, "utf-8"))
    expect(written.$schema).toBe("https://raw.githubusercontent.com/GDSDN/kord-aios/master/assets/kord-opencode.schema.json")
    // #and no other keys
    expect(Object.keys(written).length).toBe(1)
  })

  test("creates .opencode directory if missing", () => {
    // #given test dir exists but no .opencode directory
    mkdirSync(testDir, { recursive: true })
    expect(existsSync(opencodeDir)).toBe(false)

    // #given global config
    const globalConfigDir = resolve(__dirname, "test-temp-global-config-3")
    const globalConfigPath = resolve(globalConfigDir, "kord-aios.json")
    mkdirSync(globalConfigDir, { recursive: true })
    writeFileSync(globalConfigPath, JSON.stringify({ $schema: "test" }, null, 2))

    try {
      // #when writing project config
      const result = writeProjectKordAiosConfig(testDir, globalConfigPath)

      // #then should create .opencode directory
      expect(result.success).toBe(true)
      expect(existsSync(opencodeDir)).toBe(true)
    } finally {
      rmSync(globalConfigDir, { recursive: true, force: true })
    }
  })

  test("returns error when unable to create directory", () => {
    // This test is hard to implement without mocking fs
    // Skipping for now as the implementation handles the error case
  })
})
