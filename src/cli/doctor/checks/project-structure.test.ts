import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { checkProjectStructure } from "./project-structure"
import { KORD_DIR, KORD_DOCS_DIR } from "../../project-layout"

describe("checkProjectStructure", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `kord-doctor-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  test("should pass when both .kord/ and docs/kord/ exist", async () => {
    // Setup: both directories exist (as if init was run)
    mkdirSync(join(tempDir, KORD_DIR), { recursive: true })
    mkdirSync(join(tempDir, KORD_DOCS_DIR), { recursive: true })

    const result = await checkProjectStructure(tempDir)

    expect(result.status).toBe("pass")
    expect(result.message).toContain("Project initialized")
  })

  test("should warn when .kord/ directory is missing", async () => {
    // Setup: only docs/kord exists
    mkdirSync(join(tempDir, KORD_DOCS_DIR), { recursive: true })

    const result = await checkProjectStructure(tempDir)

    expect(result.status).toBe("warn")
    expect(result.details).toContain(`Missing: ${KORD_DIR}`)
    // Check that init suggestion appears somewhere in the result
    const allContent = [result.message, ...(result.details ?? [])].join(" ")
    expect(allContent).toContain("bunx kord-aios init")
  })

  test("should warn when docs/kord/ directory is missing", async () => {
    // Setup: only .kord exists
    mkdirSync(join(tempDir, KORD_DIR), { recursive: true })

    const result = await checkProjectStructure(tempDir)

    expect(result.status).toBe("warn")
    expect(result.details).toContain(`Missing: ${KORD_DOCS_DIR}`)
    const allContent = [result.message, ...(result.details ?? [])].join(" ")
    expect(allContent).toContain("bunx kord-aios init")
  })

  test("should warn when both directories are missing", async () => {
    // Setup: neither directory exists
    const result = await checkProjectStructure(tempDir)

    expect(result.status).toBe("warn")
    expect(result.details).toContain(`Missing: ${KORD_DIR}`)
    expect(result.details).toContain(`Missing: ${KORD_DOCS_DIR}`)
    const allContent = [result.message, ...(result.details ?? [])].join(" ")
    expect(allContent).toContain("bunx kord-aios init")
  })

  test("should include init suggestion in message", async () => {
    const result = await checkProjectStructure(tempDir)

    // Both message and details should contain the init suggestion
    const allContent = [result.message, ...(result.details ?? [])].join(" ")
    expect(allContent).toContain("bunx kord-aios init")
  })
})
