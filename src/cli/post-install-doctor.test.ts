import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { runPostInstallDoctor } from "./post-install-doctor"

describe("post-install-doctor", () => {
  let testDir: string
  let configDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `post-doctor-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })

    configDir = join(testDir, "opencode-config")
    mkdirSync(configDir, { recursive: true })
    process.env.OPENCODE_CONFIG_DIR = configDir
  })

  afterEach(() => {
    delete process.env.OPENCODE_CONFIG_DIR
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("empty directory: all checks fail (non-blocking)", () => {
    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    expect(result.total).toBe(10)
    expect(result.checks.every(c => !c.blocking)).toBe(true)
    expect(result.checks[0].name).toBe("OpenCode config valid")
    expect(result.checks[0].passed).toBe(false)
  })

  test("valid OpenCode config passes check", () => {
    //#given
    writeFileSync(join(configDir, "opencode.json"), JSON.stringify({ plugin: ["kord-aios"] }))

    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    const jsonCheck = result.checks.find(c => c.name === "OpenCode config valid")!
    expect(jsonCheck.passed).toBe(true)
  })

  test("invalid OpenCode config fails check", () => {
    //#given
    writeFileSync(join(configDir, "opencode.json"), "{ broken json")

    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    const jsonCheck = result.checks.find(c => c.name === "OpenCode config valid")!
    expect(jsonCheck.passed).toBe(false)
    expect(jsonCheck.message).toContain("Invalid")
  })

  test("plugin registered check passes when kord-aios in plugins", () => {
    //#given
    writeFileSync(join(configDir, "opencode.json"), JSON.stringify({ plugin: ["kord-aios@1.0.0"] }))

    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    const pluginCheck = result.checks.find(c => c.name === "Plugin registered")!
    expect(pluginCheck.passed).toBe(true)
  })

  test("plugin registered check fails when kord-aios missing", () => {
    //#given
    writeFileSync(join(configDir, "opencode.json"), JSON.stringify({ plugin: ["other-plugin"] }))

    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    const pluginCheck = result.checks.find(c => c.name === "Plugin registered")!
    expect(pluginCheck.passed).toBe(false)
  })

  test("kord-aios.json config check passes with valid config", () => {
    //#given
    writeFileSync(join(configDir, "kord-aios.json"), '{ "agents": {} }')

    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    const configCheck = result.checks.find(c => c.name === "Kord AIOS config valid")!
    expect(configCheck.passed).toBe(true)
  })

  test("config file check fails when missing", () => {
    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    const configCheck = result.checks.find(c => c.name === "Kord AIOS config valid")!
    expect(configCheck.passed).toBe(false)
  })

  test(".kord/ directory check passes when exists", () => {
    //#given
    mkdirSync(join(testDir, ".kord"), { recursive: true })

    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    const kordCheck = result.checks.find(c => c.name === ".kord/ directory exists")!
    expect(kordCheck.passed).toBe(true)
  })

  test("docs/kord/ directory check passes when exists", () => {
    //#given
    mkdirSync(join(testDir, "docs", "kord"), { recursive: true })

    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    const docsCheck = result.checks.find(c => c.name === "docs/kord/ directory exists")!
    expect(docsCheck.passed).toBe(true)
  })

  test("fully installed project: all filesystem checks pass", () => {
    //#given
    writeFileSync(
      join(configDir, "opencode.json"),
      JSON.stringify({ plugin: ["kord-aios", "opencode-antigravity-auth@1.0.0"], provider: { google: {} } }),
    )
    writeFileSync(join(configDir, "kord-aios.json"), "{}")
    mkdirSync(join(testDir, ".kord", "templates"), { recursive: true })
    writeFileSync(join(testDir, ".kord", "templates", "story.md"), "# Story")
    mkdirSync(join(testDir, "docs", "kord", "plans"), { recursive: true })
    mkdirSync(join(testDir, "docs", "kord"), { recursive: true })
    writeFileSync(join(testDir, "kord-rules.md"), "# Rules")

    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    expect(result.passed).toBe(10)
    expect(result.total).toBe(10)
    expect(result.checks.every(c => !c.blocking)).toBe(true)
  })

  test("passed count matches actual passes", () => {
    //#given
    writeFileSync(join(configDir, "opencode.json"), JSON.stringify({ plugin: ["kord-aios"] }))

    //#when
    const result = runPostInstallDoctor(testDir, { skipBinaryCheck: true })

    //#then
    const actualPasses = result.checks.filter(c => c.passed).length
    expect(result.passed).toBe(actualPasses)
  })
})
