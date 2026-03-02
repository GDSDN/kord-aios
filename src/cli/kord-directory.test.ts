import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createKordDirectory } from "./kord-directory"
import { KORD_ACTIVE_SUBDIRS, KORD_RESERVED_SUBDIRS } from "./project-layout"

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

  test("should create .kord/ directory", () => {
    //#given - a project directory with no .kord/

    //#when - creating the kord directory
    const result = createKordDirectory(tempDir)

    //#then - .kord/ directory should exist
    expect(result.success).toBe(true)
    expect(result.created).toBe(true)
    expect(existsSync(join(tempDir, ".kord"))).toBe(true)
  })

  test("should create .kord/templates/ subdirectory", () => {
    //#given - a project directory

    //#when - creating the kord directory
    const result = createKordDirectory(tempDir)

    //#then - templates subdir should exist
    expect(result.success).toBe(true)
    expect(existsSync(join(tempDir, ".kord", "templates"))).toBe(true)
  })

  test("should create .kord/squads/ subdirectory", () => {
    //#given - a project directory

    //#when - creating the kord directory
    const result = createKordDirectory(tempDir)

    //#then - squads subdir should exist
    expect(result.success).toBe(true)
    expect(existsSync(join(tempDir, ".kord", "squads"))).toBe(true)
  })

  test("should NOT create .kord/scripts/ subdirectory", () => {
    //#given - a project directory

    //#when - creating the kord directory
    createKordDirectory(tempDir)

    //#then - scripts subdir should NOT exist
    expect(existsSync(join(tempDir, ".kord", "scripts"))).toBe(false)
  })

  test("should NOT create .kord/checklists/ subdirectory", () => {
    //#given - a project directory

    //#when - creating the kord directory
    createKordDirectory(tempDir)

    //#then - checklists subdir should NOT exist
    expect(existsSync(join(tempDir, ".kord", "checklists"))).toBe(false)
  })

  test("should NOT create .kord/skills/ subdirectory", () => {
    //#given - a project directory

    //#when - creating the kord directory
    createKordDirectory(tempDir)

    //#then - skills subdir should NOT exist
    expect(existsSync(join(tempDir, ".kord", "skills"))).toBe(false)
  })

  test("should create only active subdirs (templates, squads)", () => {
    //#given - a project directory

    //#when - creating the kord directory
    createKordDirectory(tempDir)

    //#then - only active subdirs should exist
    for (const subdir of KORD_ACTIVE_SUBDIRS) {
      expect(existsSync(join(tempDir, ".kord", subdir))).toBe(true)
    }
    //#and - reserved subdirs should NOT exist
    for (const subdir of KORD_RESERVED_SUBDIRS) {
      expect(existsSync(join(tempDir, ".kord", subdir))).toBe(false)
    }
  })

  test("should be idempotent - running twice succeeds", () => {
    //#given - a project directory

    //#when - creating the kord directory twice
    const result1 = createKordDirectory(tempDir)
    const result2 = createKordDirectory(tempDir)

    //#then - both should succeed
    expect(result1.success).toBe(true)
    expect(result1.created).toBe(true)
    expect(result2.success).toBe(true)
    expect(result2.created).toBe(false)
  })

  test("should preserve existing files in .kord/ when re-running", () => {
    //#given - a project directory with existing .kord/
    const kordDir = join(tempDir, ".kord")
    mkdirSync(kordDir, { recursive: true })
    const markerFile = join(kordDir, "existing-file.txt")
    writeFileSync(markerFile, "keep me")

    //#when - creating the kord directory again
    const result = createKordDirectory(tempDir)

    //#then - should succeed and preserve existing files
    expect(result.success).toBe(true)
    expect(readFileSync(markerFile, "utf-8")).toBe("keep me")
  })

  test("should return kordPath in result", () => {
    //#given - a project directory

    //#when - creating the kord directory
    const result = createKordDirectory(tempDir)

    //#then - result should contain the kord path
    expect(result.kordPath).toBe(join(tempDir, ".kord"))
  })
})
