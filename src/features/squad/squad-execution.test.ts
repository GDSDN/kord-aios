import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createAgentAuthorityHook } from "../../hooks/agent-authority"
import { updateSessionAgent, _resetForTesting } from "../../features/claude-code-session-state"
import { resolveAgentFallbackChain } from "../../shared/agent-fallback"
import {
  clearAgentFrontmatterCapabilities,
  getAgentFrontmatterCapabilities,
} from "../../shared/agent-frontmatter-capabilities-store"
import {
  clearSquadFallbackStore,
  getSquadAgentFallback,
  setSquadAgentFallback,
} from "../../shared/squad-fallback-store"
import { createAllSquadAgentConfigs, createSquadAgentConfig, SquadNameCollisionError } from "./factory"
import { squadSchema } from "./schema"
import type { LoadedSquad } from "./loader"

const jsYaml = require("js-yaml")

const BACKWARD_COMPAT_MANIFEST_YAML = `
name: marketing
description: Marketing squad
agents:
  chief:
    description: "Chief"
    is_chief: true
  writer:
    description: "Writer"
`

function parseSquad(yaml: string): LoadedSquad {
  return {
    manifest: squadSchema.parse(jsYaml.load(yaml)),
    source: "user",
    basePath: "/tmp/squad-execution",
    resolvedPrompts: {},
  }
}

describe("squad execution pipeline - schema", () => {
  test("accepts fallback on squad agent", () => {
    //#given
    const raw = jsYaml.load(`
name: marketing
description: Marketing squad
agents:
  chief:
    description: "Chief"
    is_chief: true
    fallback:
      - model: anthropic/claude-sonnet-4-5
      - model: openai/gpt-5.2
        variant: max
`)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents.chief.fallback).toEqual([
        { model: "anthropic/claude-sonnet-4-5" },
        { model: "openai/gpt-5.2", variant: "max" },
      ])
    }
  })

  test("accepts write_paths on squad agent", () => {
    //#given
    const raw = jsYaml.load(`
name: marketing
description: Marketing squad
agents:
  chief:
    description: "Chief"
    write_paths:
      - reports/**
      - assets/*.md
`)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents.chief.write_paths).toEqual(["reports/**", "assets/*.md"])
    }
  })

  test("keeps backward compatibility for manifests without fallback and write_paths", () => {
    //#given
    const raw = jsYaml.load(BACKWARD_COMPAT_MANIFEST_YAML)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents.chief.fallback).toBeUndefined()
      expect(result.data.agents.chief.write_paths).toBeUndefined()
      expect(result.data.agents.writer.fallback).toBeUndefined()
      expect(result.data.agents.writer.write_paths).toBeUndefined()
    }
  })

  test("rejects write_paths root wildcard", () => {
    //#given
    const raw = jsYaml.load(`
name: marketing
description: Marketing squad
agents:
  chief:
    description: "Chief"
    write_paths: ["**"]
`)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.message.includes("root wildcard"))).toBe(true)
    }
  })

  test("rejects write_paths that start with docs/kord/", () => {
    //#given
    const raw = jsYaml.load(`
name: marketing
description: Marketing squad
agents:
  chief:
    description: "Chief"
    write_paths:
      - docs/kord/private/**
`)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.message.includes("docs/kord/"))).toBe(true)
    }
  })

  test("rejects write_paths containing ..", () => {
    //#given
    const raw = jsYaml.load(`
name: marketing
description: Marketing squad
agents:
  chief:
    description: "Chief"
    write_paths:
      - reports/../secrets/**
`)

    //#when
    const result = squadSchema.safeParse(raw)

    //#then
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.message.includes(".."))).toBe(true)
    }
  })
})

describe("squad execution pipeline - fallback", () => {
  beforeEach(() => {
    clearSquadFallbackStore()
  })

  afterEach(() => {
    clearSquadFallbackStore()
  })

  test("supports squad fallback store set/get/clear", () => {
    //#given
    const entries = [{ providers: ["anthropic"], model: "claude-sonnet-4-5" }]

    //#when
    setSquadAgentFallback("squad-marketing-chief", entries)
    const read = getSquadAgentFallback("squad-marketing-chief")
    clearSquadFallbackStore()
    const cleared = getSquadAgentFallback("squad-marketing-chief")

    //#then
    expect(read).toEqual(entries)
    expect(cleared).toBeUndefined()
  })

  test("resolveAgentFallbackChain uses squad fallback for squad-* agents", () => {
    //#given
    setSquadAgentFallback("squad-marketing-chief", [
      { providers: ["google"], model: "gemini-3-flash" },
    ])

    //#when
    const resolved = resolveAgentFallbackChain("squad-marketing-chief")

    //#then
    expect(resolved).toEqual([
      { providers: ["google"], model: "gemini-3-flash" },
    ])
  })

  test("user override fallback wins over squad fallback", () => {
    //#given
    setSquadAgentFallback("squad-marketing-chief", [
      { providers: ["google"], model: "gemini-3-flash" },
    ])
    const userOverrides = {
      "squad-marketing-chief": {
        fallback: [{ model: "openai/gpt-5.2" }],
      },
    }

    //#when
    const resolved = resolveAgentFallbackChain("squad-marketing-chief", {
      userAgentOverrides: userOverrides,
    })

    //#then
    expect(resolved).toEqual([{ providers: ["openai"], model: "gpt-5.2" }])
  })

  test("non-squad agents are unaffected by squad fallback store", () => {
    //#given
    setSquadAgentFallback("squad-marketing-chief", [
      { providers: ["google"], model: "gemini-3-flash" },
    ])

    //#when
    const resolved = resolveAgentFallbackChain("unknown-custom-agent")

    //#then
    expect(resolved).toBeUndefined()
  })
})

describe("squad execution pipeline - factory", () => {
  test("chief auto-enables task permission", () => {
    //#given
    const config = createSquadAgentConfig(
      "squad-marketing-chief",
      {
        description: "Chief",
        is_chief: true,
        skills: [],
      },
      "marketing",
    )

    //#then
    expect(config.permission).toBeDefined()
    expect((config.permission as Record<string, string>).task).toBe("allow")
  })

  test("worker does not auto-enable task permission", () => {
    //#given
    const config = createSquadAgentConfig(
      "squad-marketing-writer",
      {
        description: "Writer",
        is_chief: false,
        skills: [],
      },
      "marketing",
    )

    //#then
    expect(config.permission).toBeUndefined()
  })

  test("explicit tools.task=false wins over chief auto-enable", () => {
    //#given
    const config = createSquadAgentConfig(
      "squad-marketing-chief",
      {
        description: "Chief",
        is_chief: true,
        skills: [],
        tools: { task: false },
      },
      "marketing",
    )

    //#then
    expect((config.permission as Record<string, string>).task).toBe("deny")
  })
})

describe("squad execution pipeline - authority and safeguards", () => {
  let tempDir: string
  let hook: ReturnType<typeof createAgentAuthorityHook>

  beforeEach(() => {
    clearSquadFallbackStore()
    clearAgentFrontmatterCapabilities()
    tempDir = mkdtempSync(join(tmpdir(), "squad-exec-authority-"))
    hook = createAgentAuthorityHook({ directory: tempDir } as PluginInput)
  })

  afterEach(() => {
    _resetForTesting()
    clearSquadFallbackStore()
    clearAgentFrontmatterCapabilities()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("allows squad convention paths for squad-marketing-chief", async () => {
    //#given
    updateSessionAgent("ses_squad_convention", "squad-marketing-chief")
    const input = { tool: "Write", sessionID: "ses_squad_convention", callID: "call_sq_1" }
    const output = { args: { filePath: "docs/marketing/report.md", content: "ok" } }

    //#when
    const result = hook["tool.execute.before"]?.(input, output)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows additional write_paths from squad capabilities", async () => {
    //#given
    const loaded = parseSquad(`
name: marketing
description: Marketing squad
agents:
  chief:
    description: "Chief"
    is_chief: true
    write_paths:
      - reports/**
`)
    createAllSquadAgentConfigs([loaded])
    updateSessionAgent("ses_squad_writepaths", "squad-marketing-chief")
    const input = { tool: "Write", sessionID: "ses_squad_writepaths", callID: "call_sq_2" }
    const output = { args: { filePath: "reports/q1.md", content: "ok" } }

    //#when
    const result = hook["tool.execute.before"]?.(input, output)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("denies docs/kord/boulder.json for squad-marketing-chief", async () => {
    //#given
    updateSessionAgent("ses_squad_deny", "squad-marketing-chief")
    const input = { tool: "Edit", sessionID: "ses_squad_deny", callID: "call_sq_3" }
    const output = { args: { filePath: "docs/kord/boulder.json", oldString: "", newString: "x" } }

    //#when
    const result = hook["tool.execute.before"]?.(input, output)

    //#then
    await expect(result).rejects.toThrow("reserved for Kord orchestration state")
  })

  test("throws collision error for reserved squad name dev", () => {
    //#given
    const loaded = parseSquad(`
name: dev
description: Colliding squad
agents:
  chief:
    description: "Chief"
`)

    //#then
    expect(() => createAllSquadAgentConfigs([loaded])).toThrow(SquadNameCollisionError)
  })

  test("throws collision error for reserved squad name planner", () => {
    //#given
    const loaded = parseSquad(`
name: planner
description: Colliding squad
agents:
  chief:
    description: "Chief"
`)

    //#then
    expect(() => createAllSquadAgentConfigs([loaded])).toThrow(SquadNameCollisionError)
  })
})

describe("squad execution pipeline - e2e assembly", () => {
  beforeEach(() => {
    clearSquadFallbackStore()
    clearAgentFrontmatterCapabilities()
  })

  afterEach(() => {
    clearSquadFallbackStore()
    clearAgentFrontmatterCapabilities()
  })

  test("chief config uses concrete squad name, task allow, and convention write paths", () => {
    //#given
    const loaded = parseSquad(`
name: marketing
description: Marketing squad
agents:
  chief:
    description: "Chief"
    is_chief: true
  writer:
    description: "Writer"
`)

    //#when
    const configs = createAllSquadAgentConfigs([loaded])
    const chiefConfig = configs.get("squad-marketing-chief")
    const capabilities = getAgentFrontmatterCapabilities("squad-marketing-chief")

    //#then
    expect(chiefConfig).toBeDefined()
    expect(chiefConfig?.prompt).toContain("marketing")
    expect(chiefConfig?.prompt).not.toContain("{SQUAD_NAME}")
    expect((chiefConfig?.permission as Record<string, string>).task).toBe("allow")
    expect(capabilities?.write_paths).toContain("docs/kord/squads/marketing/**")
    expect(capabilities?.write_paths).toContain("docs/marketing/**")
  })
})
