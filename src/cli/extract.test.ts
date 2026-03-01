import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { extract } from "./extract"

describe("extract", () => {
  let projectDir: string
  let globalDir: string
  let originalEnv: string | undefined

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "kord-extract-project-"))
    globalDir = mkdtempSync(join(tmpdir(), "kord-extract-global-"))
    originalEnv = process.env.OPENCODE_CONFIG_DIR
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OPENCODE_CONFIG_DIR = originalEnv
    } else {
      delete process.env.OPENCODE_CONFIG_DIR
    }

    if (existsSync(projectDir)) {
      rmSync(projectDir, { recursive: true, force: true })
    }

    if (existsSync(globalDir)) {
      rmSync(globalDir, { recursive: true, force: true })
    }
  })

  test("extracts all content sets to project .opencode by default", async () => {
    //#when
    const exitCode = await extract({ directory: projectDir })

    //#then
    expect(exitCode).toBe(0)
    expect(existsSync(join(projectDir, ".opencode", "agents", "pm.md"))).toBe(true)
    expect(existsSync(join(projectDir, ".opencode", "skills", "advanced-elicitation", "SKILL.md"))).toBe(true)
    expect(existsSync(join(projectDir, ".opencode", "squads", "dev", "SQUAD.yaml"))).toBe(true)
    expect(existsSync(join(projectDir, ".opencode", "commands", "status.ts"))).toBe(true)
  })

  test("supports combinable content flags", async () => {
    //#when
    const exitCode = await extract({
      directory: projectDir,
      skillsOnly: true,
      commandsOnly: true,
    })

    //#then
    expect(exitCode).toBe(0)
    expect(existsSync(join(projectDir, ".opencode", "skills", "advanced-elicitation", "SKILL.md"))).toBe(true)
    expect(existsSync(join(projectDir, ".opencode", "commands", "status.ts"))).toBe(true)
    expect(existsSync(join(projectDir, ".opencode", "agents", "pm.md"))).toBe(false)
    expect(existsSync(join(projectDir, ".opencode", "squads", "dev", "SQUAD.yaml"))).toBe(false)
  })

  test("skips existing files unless --force is set", async () => {
    //#given
    const existingPath = join(projectDir, ".opencode", "agents", "pm.md")
    mkdirSync(join(projectDir, ".opencode", "agents"), { recursive: true })
    writeFileSync(existingPath, "CUSTOM-PM", "utf-8")

    //#when
    await extract({ directory: projectDir, agentsOnly: true })

    //#then
    expect(readFileSync(existingPath, "utf-8")).toBe("CUSTOM-PM")
  })

  test("overwrites existing files when --force is set", async () => {
    //#given
    const existingPath = join(projectDir, ".opencode", "agents", "pm.md")
    mkdirSync(join(projectDir, ".opencode", "agents"), { recursive: true })
    writeFileSync(existingPath, "CUSTOM-PM", "utf-8")

    //#when
    await extract({ directory: projectDir, agentsOnly: true, force: true })

    //#then
    const updated = readFileSync(existingPath, "utf-8")
    expect(updated).toContain("name: PM")
    expect(updated).not.toBe("CUSTOM-PM")
  })

  test("runs in --diff mode without writing files", async () => {
    //#given
    const logSpy = spyOn(console, "log").mockImplementation(() => {})

    try {
      //#when
      const exitCode = await extract({ directory: projectDir, agentsOnly: true, diff: true })

      //#then
      expect(exitCode).toBe(0)
      expect(existsSync(join(projectDir, ".opencode", "agents", "pm.md"))).toBe(false)

      const output = logSpy.mock.calls.flat().map((v) => String(v)).join("\n")
      expect(output).toContain("[WRITE]")
      expect(output).toContain("Extract dry-run summary")
    } finally {
      logSpy.mockRestore()
    }
  })

  test("extracts to global OpenCode config directory with --global", async () => {
    //#given
    process.env.OPENCODE_CONFIG_DIR = globalDir

    //#when
    const exitCode = await extract({
      directory: projectDir,
      global: true,
      commandsOnly: true,
    })

    //#then
    expect(exitCode).toBe(0)
    expect(existsSync(join(globalDir, "commands", "status.ts"))).toBe(true)
    expect(existsSync(join(projectDir, ".opencode", "commands", "status.ts"))).toBe(false)
  })
})
