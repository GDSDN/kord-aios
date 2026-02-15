import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { checkProjectLayout } from "./project-layout"
import { KORD_DIR, KORD_DOCS_DIR, KORD_RULES_FILE } from "../../project-layout"

describe("checkProjectLayout", () => {
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

  test("should pass when project structure is complete", async () => {
    // Setup valid structure
    mkdirSync(join(tempDir, KORD_DIR, "templates"), { recursive: true })
    mkdirSync(join(tempDir, KORD_DOCS_DIR, "plans"), { recursive: true })
    writeFileSync(join(tempDir, KORD_RULES_FILE), "rules")

    const result = await checkProjectLayout(tempDir)

    expect(result.status).toBe("pass")
    expect(result.message).toBe("Project layout valid")
  })

  test("should warn when .kord/ is missing", async () => {
    // No .kord dir
    const result = await checkProjectLayout(tempDir)

    expect(result.status).toBe("warn")
    expect(result.details).toContain(`  - ${KORD_DIR}`)
  })

  test("should warn when .kord/templates is missing", async () => {
    mkdirSync(join(tempDir, KORD_DIR), { recursive: true })
    // Missing templates
    
    const result = await checkProjectLayout(tempDir)

    expect(result.status).toBe("warn")
    expect(result.details).toContain(`  - ${KORD_DIR}/templates`)
  })

  test("should warn when docs/kord/plans is missing", async () => {
     mkdirSync(join(tempDir, KORD_DIR, "templates"), { recursive: true })
     // Missing docs/kord
     
     const result = await checkProjectLayout(tempDir)

     expect(result.status).toBe("warn")
     expect(result.details).toContain(`  - ${KORD_DOCS_DIR}`)
  })
  
  test("should warn when kord-rules.md is missing", async () => {
    mkdirSync(join(tempDir, KORD_DIR, "templates"), { recursive: true })
    mkdirSync(join(tempDir, KORD_DOCS_DIR, "plans"), { recursive: true })
    // Missing kord-rules.md

    const result = await checkProjectLayout(tempDir)

    expect(result.status).toBe("warn")
    expect(result.details).toContain(`  - ${KORD_RULES_FILE}`)
  })
})
