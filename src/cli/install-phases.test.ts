import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { phaseDetection, phaseVerification, phaseConfiguration } from "./install-phases"

describe("install-phases", () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `phases-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe("phaseDetection", () => {
    test("returns fresh for empty directory", () => {
      //#when
      const result = phaseDetection(testDir)

      //#then
      expect(result.effectiveStatus).toBe("fresh")
      expect(result.isUpdate).toBe(false)
    })

    test("returns existing when plugin + scaffold present", () => {
      //#given
      writeFileSync(join(testDir, "opencode.json"), JSON.stringify({ plugin: ["kord-aios"] }))
      mkdirSync(join(testDir, ".kord"), { recursive: true })
      mkdirSync(join(testDir, "docs", "kord"), { recursive: true })
      writeFileSync(join(testDir, "kord-aios.config.jsonc"), "{}")

      //#when
      const result = phaseDetection(testDir)

      //#then
      expect(result.effectiveStatus).toBe("existing")
      expect(result.isUpdate).toBe(true)
    })

    test("force flag overrides to fresh", () => {
      //#given
      writeFileSync(join(testDir, "opencode.json"), JSON.stringify({ plugin: ["kord-aios"] }))
      mkdirSync(join(testDir, ".kord"), { recursive: true })
      mkdirSync(join(testDir, "docs", "kord"), { recursive: true })
      writeFileSync(join(testDir, "kord-aios.config.jsonc"), "{}")

      //#when
      const result = phaseDetection(testDir, true)

      //#then
      expect(result.effectiveStatus).toBe("fresh")
      expect(result.isUpdate).toBe(false)
    })

    test("result includes maturity object", () => {
      //#when
      const result = phaseDetection(testDir)

      //#then
      expect(result.maturity).toBeDefined()
      expect(result.maturity.status).toBe("fresh")
    })
  })

  describe("phaseConfiguration", () => {
    test("wraps config in result", () => {
      //#given
      const config = {
        hasClaude: true,
        isMax20: false,
        hasOpenAI: false,
        hasGemini: true,
        hasCopilot: false,
        hasOpencodeZen: false,
        hasZaiCodingPlan: false,
        hasKimiForCoding: false,
      }

      //#when
      const result = phaseConfiguration(config)

      //#then
      expect(result.config).toEqual(config)
    })
  })

  describe("phaseVerification", () => {
    test("skipped when skip=true", () => {
      //#when
      const result = phaseVerification(testDir, true)

      //#then
      expect(result.skipped).toBe(true)
      expect(result.doctor.total).toBe(0)
    })

    test("runs doctor checks when not skipped", () => {
      //#when
      const result = phaseVerification(testDir, false)

      //#then
      expect(result.skipped).toBe(false)
      expect(result.doctor.total).toBeGreaterThan(0)
    })

    test("reports correct pass count for empty dir", () => {
      //#when
      const result = phaseVerification(testDir, false)

      //#then
      expect(result.doctor.passed).toBeLessThan(result.doctor.total)
    })
  })
})
