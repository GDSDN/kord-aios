import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createSquadLoadTool } from "./tools"

const VALID_SQUAD = `
name: marketing
description: Marketing squad
agents:
  copywriter:
    description: "Writes copy"
  designer:
    description: "Designs assets"
contract_type: story
`

describe("squad_load", () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `squad-load-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("loads squad manifest by name", async () => {
    //#given
    const squadDir = join(testDir, ".opencode", "squads", "marketing")
    mkdirSync(squadDir, { recursive: true })
    writeFileSync(join(squadDir, "SQUAD.yaml"), VALID_SQUAD)

    const tool = createSquadLoadTool({ directory: testDir } as any)
    const toolContext = {
      sessionID: "test-session",
      messageID: "test-message",
      agent: "test-agent",
      abort: new AbortController().signal,
    }

    //#when
    const result = await tool.execute({ squad_name: "marketing" }, toolContext as any)
    const parsed = JSON.parse(result)

    //#then
    expect(parsed.manifest.name).toBe("marketing")
    expect(parsed.manifest.agents).toHaveLength(2)
  })

  test("returns error when squad not found", async () => {
    //#given
    const tool = createSquadLoadTool({ directory: testDir } as any)
    const toolContext = {
      sessionID: "test-session",
      messageID: "test-message",
      agent: "test-agent",
      abort: new AbortController().signal,
    }

    //#when
    const result = await tool.execute({ squad_name: "missing" }, toolContext as any)

    //#then
    expect(result).toContain("Error: Squad manifest not found")
  })
})
