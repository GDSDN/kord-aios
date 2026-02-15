import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createKordDirectory } from "./kord-directory"
import { KORD_INPUT_SUBDIRS } from "./project-layout"

describe("createKordDirectory", () => {
  let tempDir: string

  beforeEach(() => {
    //#given - a temporary project directory
    tempDir = join(tmpdir(), `kord-dir-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  test("should create .kord/ directory with all subdirectories", () => {
    //#given - a project directory with no .kord/

    //#when - creating the kord directory
    const result = createKordDirectory(tempDir)

    //#then - all subdirectories should exist
    expect(result.success).toBe(true)
    expect(result.created).toBe(true)
    for (const subdir of KORD_INPUT_SUBDIRS) {
      expect(existsSync(join(tempDir, ".kord", subdir))).toBe(true)
    }
  })

  test("should create scripts, templates, checklists, skills, squads subdirectories", () => {
    //#given - a project directory

    //#when - creating the kord directory
    createKordDirectory(tempDir)

    //#then - specific required subdirs should exist
    expect(existsSync(join(tempDir, ".kord", "scripts"))).toBe(true)
    expect(existsSync(join(tempDir, ".kord", "templates"))).toBe(true)
    expect(existsSync(join(tempDir, ".kord", "checklists"))).toBe(true)
    expect(existsSync(join(tempDir, ".kord", "skills"))).toBe(true)
    expect(existsSync(join(tempDir, ".kord", "squads"))).toBe(true)
  })

  test("should handle existing .kord/ directory gracefully (skip mode)", () => {
    //#given - a project directory with existing .kord/
    const kordDir = join(tempDir, ".kord")
    mkdirSync(kordDir, { recursive: true })
    const markerFile = join(kordDir, "existing-file.txt")
    writeFileSync(markerFile, "keep me")

    //#when - creating the kord directory
    const result = createKordDirectory(tempDir)

    //#then - should succeed and preserve existing files
    expect(result.success).toBe(true)
    expect(result.created).toBe(false)
    expect(readFileSync(markerFile, "utf-8")).toBe("keep me")
  })

  test("should still create missing subdirs when .kord/ exists", () => {
    //#given - a project directory with existing .kord/ but missing subdirs
    mkdirSync(join(tempDir, ".kord"), { recursive: true })

    //#when - creating the kord directory
    createKordDirectory(tempDir)

    //#then - missing subdirs should be created
    for (const subdir of KORD_INPUT_SUBDIRS) {
      expect(existsSync(join(tempDir, ".kord", subdir))).toBe(true)
    }
  })

  test("should return kordPath in result", () => {
    //#given - a project directory

    //#when - creating the kord directory
    const result = createKordDirectory(tempDir)

    //#then - result should contain the kord path
    expect(result.kordPath).toBe(join(tempDir, ".kord"))
  })
})
