import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test"
import { dryRunLog, dryRunWriteResult, printDryRunBanner } from "./dry-run"

describe("dry-run", () => {
  let logSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    logSpy = spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  describe("dryRunLog", () => {
    test("logs action with DRY-RUN prefix", () => {
      //#when
      dryRunLog("create", ".kord/templates/story.md")

      //#then
      const output = logSpy.mock.calls[0][0] as string
      expect(output).toContain("[DRY-RUN]")
      expect(output).toContain("Would create")
      expect(output).toContain(".kord/templates/story.md")
    })
  })

  describe("dryRunWriteResult", () => {
    test("returns success result with dryRun flag", () => {
      //#when
      const result = dryRunWriteResult("/path/to/config.jsonc")

      //#then
      expect(result.success).toBe(true)
      expect(result.configPath).toBe("/path/to/config.jsonc")
      expect(result.dryRun).toBe(true)
    })
  })

  describe("printDryRunBanner", () => {
    test("prints dry-run mode banner", () => {
      //#when
      printDryRunBanner()

      //#then
      const allOutput = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n")
      expect(allOutput).toContain("DRY-RUN MODE")
      expect(allOutput).toContain("no changes will be made")
    })
  })
})
