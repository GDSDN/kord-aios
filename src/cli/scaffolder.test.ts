import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { scaffoldProject, isProjectScaffolded } from "./scaffolder"

const TEST_DIR = join(import.meta.dir, "__test_scaffold__")

describe("scaffoldProject", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("creates docs/kord/ directory structure", () => {
    //#given - empty project directory

    //#when
    const result = scaffoldProject({ directory: TEST_DIR })

    //#then
    expect(existsSync(join(TEST_DIR, "docs", "kord", "plans"))).toBe(true)
    expect(existsSync(join(TEST_DIR, "docs", "kord", "drafts"))).toBe(true)
    expect(existsSync(join(TEST_DIR, "docs", "kord", "notepads"))).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test("creates .kord/templates/ with story and ADR templates", () => {
    //#given - empty project directory

    //#when
    scaffoldProject({ directory: TEST_DIR })

    //#then
    expect(existsSync(join(TEST_DIR, ".kord", "templates", "story.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "templates", "adr.md"))).toBe(true)

    const story = readFileSync(join(TEST_DIR, ".kord", "templates", "story.md"), "utf-8")
    expect(story).toContain("Acceptance Criteria")
    expect(story).toContain("Definition of Done")

    const adr = readFileSync(join(TEST_DIR, ".kord", "templates", "adr.md"), "utf-8")
    expect(adr).toContain("Context")
    expect(adr).toContain("Decision")
    expect(adr).toContain("Consequences")
  })

  test("creates kord-rules.md at project root", () => {
    //#given - empty project directory

    //#when
    scaffoldProject({ directory: TEST_DIR })

    //#then
    const rules = readFileSync(join(TEST_DIR, "kord-rules.md"), "utf-8")
    expect(rules).toContain("Kord AIOS")
    expect(rules).toContain("docs/kord/plans/")
    expect(rules).toContain("docs/kord/drafts/")
  })

  test("skips existing files without force flag", () => {
    //#given - already scaffolded
    scaffoldProject({ directory: TEST_DIR })

    //#when - scaffold again
    const result = scaffoldProject({ directory: TEST_DIR })

    //#then - files skipped, not overwritten
    expect(result.skipped.length).toBeGreaterThan(0)
    expect(result.created.length).toBe(0)
  })

  test("overwrites existing files with force flag", () => {
    //#given - already scaffolded
    scaffoldProject({ directory: TEST_DIR })

    //#when - scaffold with force
    const result = scaffoldProject({ directory: TEST_DIR, force: true })

    //#then - files are overwritten (created includes file entries)
    const fileEntries = result.created.filter(p => p.endsWith(".md") || p.endsWith(".gitkeep"))
    expect(fileEntries.length).toBeGreaterThan(0)
  })

  test("returns created paths", () => {
    //#given - empty project directory

    //#when
    const result = scaffoldProject({ directory: TEST_DIR })

    //#then
    expect(result.created.length).toBeGreaterThan(0)
    expect(result.errors).toHaveLength(0)
  })
})

describe("isProjectScaffolded", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("returns false for empty directory", () => {
    expect(isProjectScaffolded(TEST_DIR)).toBe(false)
  })

  test("returns true after scaffolding", () => {
    scaffoldProject({ directory: TEST_DIR })
    expect(isProjectScaffolded(TEST_DIR)).toBe(true)
  })
})
