import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createDecisionLoggerHook } from "./index"

const buildArgs = (overrides: Record<string, unknown> = {}) => ({
  decision: "Use adapter pattern",
  rationale: "Keeps modules isolated",
  context: "Plugin refactor",
  alternatives: "Factory pattern",
  ...overrides,
})

describe("createDecisionLoggerHook", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "decision-logger-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("writes first ADR with incremented id", async () => {
    //#given
    const hook = createDecisionLoggerHook({ directory: tempDir } as any)
    const input = { tool: "decision_log", sessionID: "session-1", callID: "call-1" }
    const output = { args: buildArgs() }

    //#when
    await hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    const adrPath = join(tempDir, "docs", "kord", "adrs", "ADR-001.md")
    const content = require("node:fs").readFileSync(adrPath, "utf-8")
    expect(content).toContain("ADR-001")
    expect(content).toContain("Decision: Use adapter pattern")
  })

  test("increments ADR id when existing files found", async () => {
    //#given
    const adrDir = join(tempDir, "docs", "kord", "adrs")
    mkdirSync(adrDir, { recursive: true })
    writeFileSync(join(adrDir, "ADR-002.md"), "existing")

    const hook = createDecisionLoggerHook({ directory: tempDir } as any)
    const input = { tool: "decision_log", sessionID: "session-2", callID: "call-2" }
    const output = { args: buildArgs() }

    //#when
    await hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    const adrPath = join(adrDir, "ADR-003.md")
    const content = require("node:fs").readFileSync(adrPath, "utf-8")
    expect(content).toContain("ADR-003")
  })

  test("throws when decision log directory is invalid", async () => {
    //#given
    const invalidDir = join(tempDir, "docs", "kord", "adrs")
    mkdirSync(invalidDir, { recursive: true })
    writeFileSync(join(invalidDir, "nested.txt"), "bad")
    mkdirSync(join(invalidDir, "nested"), { recursive: true })

    const hook = createDecisionLoggerHook({ directory: tempDir } as any)
    const input = { tool: "decision_log", sessionID: "session-3", callID: "call-3" }
    const output = { args: buildArgs() }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).rejects.toThrow("Decision log directory is invalid")
  })
})
