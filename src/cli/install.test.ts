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
})
