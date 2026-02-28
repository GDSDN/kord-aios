import { describe, expect, test, mock, beforeEach, afterEach, spyOn } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { install } from "./install"
import * as configManager from "./config-manager"
import type { InstallArgs } from "./types"

// Mock console methods to capture output
const mockConsoleLog = mock(() => {})
const mockConsoleError = mock(() => {})

describe("install CLI - binary check behavior", () => {
  let configDir: string
  let projectDir: string
  let originalCwd: string
  let originalEnv: string | undefined
  let isOpenCodeInstalledSpy: ReturnType<typeof spyOn>
  let getOpenCodeVersionSpy: ReturnType<typeof spyOn>
  let detectCurrentConfigSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    // given temporary OpenCode config directory
    configDir = join(tmpdir(), `kord-test-config-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(configDir, { recursive: true })

    // given isolated project directory (install scaffolds into cwd)
    projectDir = join(tmpdir(), `kord-test-project-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(projectDir, { recursive: true })

    originalCwd = process.cwd()
    process.chdir(projectDir)

    originalEnv = process.env.OPENCODE_CONFIG_DIR
    process.env.OPENCODE_CONFIG_DIR = configDir

    // Reset config context
    configManager.resetConfigContext()
    configManager.initConfigContext("opencode", null)

    // Capture console output
    console.log = mockConsoleLog
    mockConsoleLog.mockClear()
  })

  afterEach(() => {
    process.chdir(originalCwd)
    if (originalEnv !== undefined) {
      process.env.OPENCODE_CONFIG_DIR = originalEnv
    } else {
      delete process.env.OPENCODE_CONFIG_DIR
    }

    if (existsSync(projectDir)) {
      rmSync(projectDir, { recursive: true, force: true })
    }

    if (existsSync(configDir)) {
      rmSync(configDir, { recursive: true, force: true })
    }

    isOpenCodeInstalledSpy?.mockRestore()
    getOpenCodeVersionSpy?.mockRestore()
    detectCurrentConfigSpy?.mockRestore()
  })

  test("non-TUI mode: should show warning but continue when OpenCode binary not found", async () => {
    // given OpenCode binary is NOT installed
    isOpenCodeInstalledSpy = spyOn(configManager, "isKordAiosInstalled").mockResolvedValue(false)
    getOpenCodeVersionSpy = spyOn(configManager, "getKordAiosVersion").mockResolvedValue(null)

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    }

    // when running install
    const exitCode = await install(args)

    // then should return success (0), not failure (1)
    expect(exitCode).toBe(0)

    // then should have printed a warning (not error)
    const allCalls = mockConsoleLog.mock.calls.flat().join("\n")
    expect(allCalls).toContain("[!]") // warning symbol
    expect(allCalls).toContain("OpenCode")
  })

  test("non-TUI mode: should create opencode.json with plugin even when binary not found", async () => {
    // given OpenCode binary is NOT installed
    isOpenCodeInstalledSpy = spyOn(configManager, "isKordAiosInstalled").mockResolvedValue(false)
    getOpenCodeVersionSpy = spyOn(configManager, "getKordAiosVersion").mockResolvedValue(null)

    // given mock npm fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response)
    ) as unknown as typeof fetch

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    }

    // when running install
    const exitCode = await install(args)

    // then should create opencode.json
    const configPath = join(configDir, "opencode.json")
    expect(existsSync(configPath)).toBe(true)

    // then opencode.json should have plugin entry
    const config = JSON.parse(readFileSync(configPath, "utf-8"))
    expect(config.plugin).toBeDefined()
    expect(config.plugin.some((p: string) => p.includes("kord-aios"))).toBe(true)

    // then exit code should be 0 (success)
    expect(exitCode).toBe(0)
  })

  test("non-TUI mode: should still succeed and complete all steps when binary exists", async () => {
    // given OpenCode binary IS installed
    isOpenCodeInstalledSpy = spyOn(configManager, "isKordAiosInstalled").mockResolvedValue(true)
    getOpenCodeVersionSpy = spyOn(configManager, "getKordAiosVersion").mockResolvedValue("1.0.200")

    // given mock npm fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response)
    ) as unknown as typeof fetch

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    }

    // when running install
    const exitCode = await install(args)

    // then should return success
    expect(exitCode).toBe(0)

    // then should have printed success (OK symbol)
    const allCalls = mockConsoleLog.mock.calls.flat().join("\n")
    expect(allCalls).toContain("[OK]")
    expect(allCalls).toContain("OpenCode 1.0.200")
  })

  test("non-TUI mode: scaffolds project baseline files", async () => {
    // given OpenCode binary is NOT installed
    isOpenCodeInstalledSpy = spyOn(configManager, "isKordAiosInstalled").mockResolvedValue(false)
    getOpenCodeVersionSpy = spyOn(configManager, "getKordAiosVersion").mockResolvedValue(null)

    // given mock npm fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response)
    ) as unknown as typeof fetch

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    }

    // when
    const exitCode = await install(args)

    // then
    expect(exitCode).toBe(0)
    expect(existsSync(join(projectDir, ".kord", "templates", "story.md"))).toBe(true)
    expect(existsSync(join(projectDir, "docs", "kord", "plans"))).toBe(true)
    expect(existsSync(join(projectDir, "kord-rules.md"))).toBe(true)
  })

  test("non-TUI mode: writes project config under .opencode", async () => {
    // given OpenCode binary is NOT installed
    isOpenCodeInstalledSpy = spyOn(configManager, "isKordAiosInstalled").mockResolvedValue(false)
    getOpenCodeVersionSpy = spyOn(configManager, "getKordAiosVersion").mockResolvedValue(null)

    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response)
    ) as unknown as typeof fetch

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    }

    // when
    const exitCode = await install(args)

    // then
    expect(exitCode).toBe(0)
    expect(existsSync(join(projectDir, ".opencode"))).toBe(true)
    expect(existsSync(join(projectDir, ".opencode", "kord-aios.json"))).toBe(true)
  })

  test("non-TUI mode: preserves existing project config values with add-only merge", async () => {
    // given OpenCode binary is NOT installed
    isOpenCodeInstalledSpy = spyOn(configManager, "isKordAiosInstalled").mockResolvedValue(false)
    getOpenCodeVersionSpy = spyOn(configManager, "getKordAiosVersion").mockResolvedValue(null)

    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response)
    ) as unknown as typeof fetch

    mkdirSync(join(projectDir, ".opencode"), { recursive: true })
    writeFileSync(
      join(projectDir, ".opencode", "kord-aios.json"),
      JSON.stringify({
        defaultAgent: "custom-agent",
        provider: { anthropic: { options: { maxTokens: 1234 } } },
      }, null, 2)
    )

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    }

    // when
    const exitCode = await install(args)

    // then
    expect(exitCode).toBe(0)
    const projectConfig = JSON.parse(readFileSync(join(projectDir, ".opencode", "kord-aios.json"), "utf-8"))
    expect(projectConfig.defaultAgent).toBe("custom-agent")
    expect(projectConfig.provider.anthropic.options.maxTokens).toBe(1234)
  })
})

describe("install CLI - provider detection and reuse", () => {
  let configDir: string
  let projectDir: string
  let originalCwd: string
  let originalEnv: string | undefined
  let isOpenCodeInstalledSpy: ReturnType<typeof spyOn>
  let getOpenCodeVersionSpy: ReturnType<typeof spyOn>
  let detectCurrentConfigSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    // given temporary OpenCode config directory
    configDir = join(tmpdir(), `kord-test-config-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(configDir, { recursive: true })

    // given isolated project directory
    projectDir = join(tmpdir(), `kord-test-project-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(projectDir, { recursive: true })

    originalCwd = process.cwd()
    process.chdir(projectDir)

    originalEnv = process.env.OPENCODE_CONFIG_DIR
    process.env.OPENCODE_CONFIG_DIR = configDir

    // Reset config context
    configManager.resetConfigContext()
    configManager.initConfigContext("opencode", null)

    // Capture console output
    console.log = mockConsoleLog
    mockConsoleLog.mockClear()
  })

  afterEach(() => {
    process.chdir(originalCwd)
    if (originalEnv !== undefined) {
      process.env.OPENCODE_CONFIG_DIR = originalEnv
    } else {
      delete process.env.OPENCODE_CONFIG_DIR
    }

    if (existsSync(projectDir)) {
      rmSync(projectDir, { recursive: true, force: true })
    }

    if (existsSync(configDir)) {
      rmSync(configDir, { recursive: true, force: true })
    }

    isOpenCodeInstalledSpy?.mockRestore()
    getOpenCodeVersionSpy?.mockRestore()
    detectCurrentConfigSpy?.mockRestore()
  })

  test("non-TUI mode: reuses existing config when no explicit flags and config exists", async () => {
    // given OpenCode binary IS installed
    isOpenCodeInstalledSpy = spyOn(configManager, "isKordAiosInstalled").mockResolvedValue(true)
    getOpenCodeVersionSpy = spyOn(configManager, "getKordAiosVersion").mockResolvedValue("1.0.200")

    // given existing config is detected
    detectCurrentConfigSpy = spyOn(configManager, "detectCurrentConfig").mockReturnValue({
      isInstalled: true,
      hasClaude: true,
      isMax20: false,
      hasOpenAI: true,
      hasGemini: true,
      hasCopilot: false,
      hasOpencodeZen: true,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    })

    // given mock npm fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response)
    ) as unknown as typeof fetch

    // when running install WITHOUT explicit provider flags
    const args: InstallArgs = {
      tui: false,
      // No provider flags - should reuse existing
    }

    const exitCode = await install(args)

    // then should succeed
    expect(exitCode).toBe(0)

    // then should have reused config (show message)
    const allCalls = mockConsoleLog.mock.calls.flat().join("\n")
    expect(allCalls).toContain("Existing configuration detected")
    expect(allCalls).toContain("reusing provider settings")
    expect(allCalls).toContain("Reusing: Claude=yes")
  })

  test("non-TUI mode: still validates when explicit flags are provided", async () => {
    // given OpenCode binary IS installed
    isOpenCodeInstalledSpy = spyOn(configManager, "isKordAiosInstalled").mockResolvedValue(true)
    getOpenCodeVersionSpy = spyOn(configManager, "getKordAiosVersion").mockResolvedValue("1.0.200")

    // given existing config is detected
    detectCurrentConfigSpy = spyOn(configManager, "detectCurrentConfig").mockReturnValue({
      isInstalled: true,
      hasClaude: true,
      isMax20: false,
      hasOpenAI: true,
      hasGemini: true,
      hasCopilot: false,
      hasOpencodeZen: true,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    })

    // given mock npm fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response)
    ) as unknown as typeof fetch

    // when running install WITH explicit provider flags
    const args: InstallArgs = {
      tui: false,
      claude: "max20",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    }

    const exitCode = await install(args)

    // then should succeed
    expect(exitCode).toBe(0)

    // then should NOT have reused config message (explicit flags provided)
    const allCalls = mockConsoleLog.mock.calls.flat().join("\n")
    expect(allCalls).not.toContain("Existing configuration detected - reusing")
  })

  test("non-TUI mode: --reconfigure forces full validation even with existing config", async () => {
    // given OpenCode binary IS installed
    isOpenCodeInstalledSpy = spyOn(configManager, "isKordAiosInstalled").mockResolvedValue(true)
    getOpenCodeVersionSpy = spyOn(configManager, "getKordAiosVersion").mockResolvedValue("1.0.200")

    // given mock npm fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response)
    ) as unknown as typeof fetch

    // when running install with --reconfigure but no provider flags
    const args: InstallArgs = {
      tui: false,
      reconfigure: true,
      // No provider flags but reconfigure=true should trigger validation error
    }

    const exitCode = await install(args)

    // then should fail with validation error
    expect(exitCode).toBe(1)

    // then should show validation error message
    const allCalls = mockConsoleLog.mock.calls.flat().join("\n")
    expect(allCalls).toContain("Validation failed")
    expect(allCalls).toContain("--claude is required")
  })
})
