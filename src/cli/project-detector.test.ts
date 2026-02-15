import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { detectProjectMaturity } from "./project-detector"

const TEST_DIR = join(tmpdir(), `project-detector-test-${Date.now()}`)

describe("detectProjectMaturity", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("fresh: no opencode.json at all", () => {
    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.status).toBe("fresh")
    expect(result.hasOpenCodeJson).toBe(false)
    expect(result.hasKordPlugin).toBe(false)
    expect(result.currentVersion).toBeNull()
  })

  test("fresh: opencode.json exists but no kord-aios plugin", () => {
    //#given
    writeFileSync(join(TEST_DIR, "opencode.json"), JSON.stringify({ plugin: ["some-other-plugin"] }))

    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.status).toBe("fresh")
    expect(result.hasOpenCodeJson).toBe(true)
    expect(result.hasKordPlugin).toBe(false)
  })

  test("partial: kord-aios plugin registered but no scaffold", () => {
    //#given
    writeFileSync(join(TEST_DIR, "opencode.json"), JSON.stringify({ plugin: ["kord-aios@3.0.0"] }))

    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.status).toBe("partial")
    expect(result.hasKordPlugin).toBe(true)
    expect(result.hasKordDirectory).toBe(false)
    expect(result.hasDocsKord).toBe(false)
    expect(result.currentVersion).toBe("3.0.0")
  })

  test("partial: plugin + .kord/ but no docs/kord/", () => {
    //#given
    writeFileSync(join(TEST_DIR, "opencode.json"), JSON.stringify({ plugin: ["kord-aios"] }))
    mkdirSync(join(TEST_DIR, ".kord"), { recursive: true })

    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.status).toBe("partial")
    expect(result.hasKordDirectory).toBe(true)
    expect(result.hasDocsKord).toBe(false)
  })

  test("partial: plugin + docs/kord/ but no .kord/", () => {
    //#given
    writeFileSync(join(TEST_DIR, "opencode.json"), JSON.stringify({ plugin: ["kord-aios"] }))
    mkdirSync(join(TEST_DIR, "docs", "kord"), { recursive: true })

    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.status).toBe("partial")
    expect(result.hasKordDirectory).toBe(false)
    expect(result.hasDocsKord).toBe(true)
  })

  test("existing: plugin + scaffold + config all present", () => {
    //#given
    writeFileSync(join(TEST_DIR, "opencode.json"), JSON.stringify({ plugin: ["kord-aios@3.5.0"] }))
    writeFileSync(join(TEST_DIR, "kord-aios.config.jsonc"), "{}")
    mkdirSync(join(TEST_DIR, ".kord"), { recursive: true })
    mkdirSync(join(TEST_DIR, "docs", "kord"), { recursive: true })
    writeFileSync(join(TEST_DIR, "kord-rules.md"), "# Rules")

    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.status).toBe("existing")
    expect(result.hasOpenCodeJson).toBe(true)
    expect(result.hasKordPlugin).toBe(true)
    expect(result.hasKordAiosConfig).toBe(true)
    expect(result.hasKordDirectory).toBe(true)
    expect(result.hasDocsKord).toBe(true)
    expect(result.hasKordRules).toBe(true)
    expect(result.currentVersion).toBe("3.5.0")
  })

  test("extracts version from kord-aios@x.y.z plugin entry", () => {
    //#given
    writeFileSync(join(TEST_DIR, "opencode.json"), JSON.stringify({ plugin: ["kord-aios@2.1.0"] }))
    mkdirSync(join(TEST_DIR, ".kord"), { recursive: true })
    mkdirSync(join(TEST_DIR, "docs", "kord"), { recursive: true })
    writeFileSync(join(TEST_DIR, "kord-aios.config.jsonc"), "{}")

    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.currentVersion).toBe("2.1.0")
  })

  test("currentVersion is null when no version pinned", () => {
    //#given
    writeFileSync(join(TEST_DIR, "opencode.json"), JSON.stringify({ plugin: ["kord-aios"] }))

    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.currentVersion).toBeNull()
  })

  test("handles malformed opencode.json gracefully", () => {
    //#given
    writeFileSync(join(TEST_DIR, "opencode.json"), "not valid json {{{")

    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.status).toBe("fresh")
    expect(result.hasOpenCodeJson).toBe(true)
    expect(result.hasKordPlugin).toBe(false)
  })

  test("detects kord-aios.config.json as alternative config name", () => {
    //#given
    writeFileSync(join(TEST_DIR, "opencode.json"), JSON.stringify({ plugin: ["kord-aios"] }))
    writeFileSync(join(TEST_DIR, "kord-aios.config.json"), "{}")
    mkdirSync(join(TEST_DIR, ".kord"), { recursive: true })
    mkdirSync(join(TEST_DIR, "docs", "kord"), { recursive: true })

    //#when
    const result = detectProjectMaturity(TEST_DIR)

    //#then
    expect(result.hasKordAiosConfig).toBe(true)
    expect(result.status).toBe("existing")
  })
})
