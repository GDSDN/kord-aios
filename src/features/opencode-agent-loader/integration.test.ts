/**
 * EPIC-10: Integration Tests for Custom Agent Loading + Agent Authority
 *
 * End-to-end tests validating:
 * - .opencode/agents/*.md loads via config-handler
 * - Override resolution: compiled < .opencode/agents < kord-aios.json
 * - Agent-authority enforces declared write_paths
 */

import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test"
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createConfigHandler } from "../../plugin-handlers/config-handler"
import type { OhMyOpenCodeConfig } from "../../config"
import { createAgentAuthorityHook } from "../../hooks/agent-authority"
import { setSessionAgent, clearSessionAgent } from "../../features/claude-code-session-state"
import { clearAgentFrontmatterCapabilities } from "../../shared/agent-frontmatter-capabilities-store"

import * as agents from "../../agents"
import * as shared from "../../shared"
import * as configDir from "../../shared/opencode-config-dir"
import * as permissionCompat from "../../shared/permission-compat"
import * as modelResolver from "../../shared/model-resolver"

function makeTmpDir(): string {
  const dir = join(tmpdir(), `integration-agents-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function makeCtx(directory: string) {
  return { directory } as any
}

const SESSION_ID = "integration-session"

describe("EPIC-10: Custom Agent Loader + Authority Integration", () => {
  let tmpDir: string
  let agentsDir: string

  beforeEach(async () => {
    tmpDir = makeTmpDir()
    agentsDir = join(tmpDir, ".opencode", "agents")
    mkdirSync(agentsDir, { recursive: true })

    // Mock config handler dependencies
    spyOn(agents, "createBuiltinAgents" as any).mockResolvedValue({
      kord: { name: "kord", prompt: "You are Kord", mode: "primary" },
      dev: { name: "dev", prompt: "You are Dev", mode: "primary" },
      builder: { name: "builder", prompt: "You are Builder", mode: "subagent" },
      planner: { name: "planner", prompt: "You are Planner", mode: "subagent" },
      pm: { name: "pm", prompt: "You are PM", mode: "subagent" },
    })

    spyOn(shared, "log" as any).mockImplementation(() => {})
    spyOn(shared, "fetchAvailableModels" as any).mockResolvedValue(new Set(["anthropic/claude-opus-4-6"]))
    spyOn(shared, "readConnectedProvidersCache" as any).mockReturnValue(null)

    spyOn(configDir, "getOpenCodeConfigPaths" as any).mockReturnValue({
      global: join(tmpdir(), ".config/opencode"),
      project: tmpDir,
    })
    spyOn(configDir, "getOpenCodeConfigDir" as any).mockReturnValue(join(tmpDir, ".opencode-user"))

    spyOn(permissionCompat, "migrateAgentConfig" as any).mockImplementation((config: Record<string, unknown>) => config)

    spyOn(modelResolver, "resolveModelWithFallback" as any).mockReturnValue({ model: "anthropic/claude-opus-4-6" })
    clearAgentFrontmatterCapabilities()
  })

  afterEach(() => {
    clearSessionAgent(SESSION_ID)
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
    ;(agents.createBuiltinAgents as any)?.mockRestore?.()
    ;(shared.log as any)?.mockRestore?.()
    ;(shared.fetchAvailableModels as any)?.mockRestore?.()
    ;(shared.readConnectedProvidersCache as any)?.mockRestore?.()
    ;(configDir.getOpenCodeConfigPaths as any)?.mockRestore?.()
    ;(configDir.getOpenCodeConfigDir as any)?.mockRestore?.()
    ;(permissionCompat.migrateAgentConfig as any)?.mockRestore?.()
    ;(modelResolver.resolveModelWithFallback as any)?.mockRestore?.()
    clearAgentFrontmatterCapabilities()
  })

  //#region Config Handler Integration

  describe("config handler loads .opencode/agents/*.md", () => {
    test(".opencode/agents/course-creator.md loads via config-handler", async () => {
      //#given - create course-creator.md agent file
      const agentContent = `---
name: Course Creator
description: Creates course content
model: openai/gpt-5.2
temperature: 0.3
tools: Read,Write
---

You are a course creator agent that helps design and create educational content.
`
      writeFileSync(join(agentsDir, "course-creator.md"), agentContent)

      //#when - config handler processes agents
      const pluginConfig: OhMyOpenCodeConfig = {}
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {},
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#then - agent is present in config.agent
      const agents = config.agent as Record<string, { name?: string; prompt?: string; model?: string; temperature?: number }>
      expect(agents["course-creator"]).toBeDefined()
      expect(agents["course-creator"].prompt).toContain("course creator agent")
      expect(agents["course-creator"].model).toBe("openai/gpt-5.2")
      expect(agents["course-creator"].temperature).toBe(0.3)
    })

    test("override resolution: compiled < .opencode/agents < kord-aios.json", async () => {
      //#given - create custom.md in .opencode/agents
      const opencodeCustomContent = `---
name: Custom Agent
description: OpenCode custom agent
---

You are a custom agent from .opencode/agents.
`
      writeFileSync(join(agentsDir, "custom-agent.md"), opencodeCustomContent)

      // OpenCode project config has custom-agent override
      const pluginConfig: OhMyOpenCodeConfig = {}
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {
          "custom-agent": {
            name: "custom-agent",
            prompt: "Custom agent from opencode config",
            model: "google/gemini-2.5-pro",
          },
        },
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#then - OpenCode config wins over .opencode/agents
      const resolvedAgents = config.agent as Record<string, { prompt?: string; model?: string }>
      expect(resolvedAgents["custom-agent"]).toBeDefined()
      expect(resolvedAgents["custom-agent"].prompt).toBe("Custom agent from opencode config")
      expect(resolvedAgents["custom-agent"].model).toBe("google/gemini-2.5-pro")
    })

    test(".opencode/agents overrides compiled builtin agents", async () => {
      //#given - create pm.md in .opencode/agents
      const opencodePmContent = `---
name: PM
description: OpenCode PM override
---

You are a PM from .opencode/agents override.
`
      writeFileSync(join(agentsDir, "pm.md"), opencodePmContent)

      // kord-aios.json has no pm override
      const pluginConfig: OhMyOpenCodeConfig = {}
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {},
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#then - .opencode/agents overrides compiled
      const resolvedAgents = config.agent as Record<string, { prompt?: string }>
      expect(resolvedAgents.pm).toBeDefined()
      expect(resolvedAgents.pm.prompt).toBe("You are a PM from .opencode/agents override.")
    })
  })

  //#endregion

  //#region Agent Authority Integration with Custom Agents

  describe("agent-authority enforces write_paths from custom agents", () => {
    test("custom agent with write_paths can write inside declared paths", async () => {
      //#given - create course-creator.md with write_paths
      const agentContent = `---
name: Course Creator
description: Creates course content
write_paths:
  - docs/courses/**
  - docs/curriculum/**
---

You are a course creator agent.
`
      writeFileSync(join(agentsDir, "course-creator.md"), agentContent)

      // Load agent via config handler first
      const pluginConfig: OhMyOpenCodeConfig = {}
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {},
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#when - agent-authority checks write permission
      setSessionAgent(SESSION_ID, "course-creator")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const hookHandler = hook["tool.execute.before"]

      //#then - writes to declared paths are ALLOWED
      await expect(
        hookHandler(
          { tool: "write", sessionID: SESSION_ID, callID: "c1" },
          { args: { filePath: join(tmpDir, "docs/courses/intro.md"), content: "# Course" } }
        )
      ).resolves.toBeUndefined()

      await expect(
        hookHandler(
          { tool: "write", sessionID: SESSION_ID, callID: "c2" },
          { args: { filePath: join(tmpDir, "docs/curriculum/overview.md"), content: "# Overview" } }
        )
      ).resolves.toBeUndefined()
    })

    test("custom agent with write_paths is BLOCKED from writing outside declared paths", async () => {
      //#given - create course-creator.md with write_paths
      const agentContent = `---
name: Course Creator
description: Creates course content
write_paths:
  - docs/courses/**
  - docs/curriculum/**
---

You are a course creator agent.
`
      writeFileSync(join(agentsDir, "course-creator.md"), agentContent)

      // Load agent via config handler
      const pluginConfig: OhMyOpenCodeConfig = {}
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {},
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#when - agent-authority checks write permission
      setSessionAgent(SESSION_ID, "course-creator")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const hookHandler = hook["tool.execute.before"]

      //#then - writes outside declared paths are BLOCKED
      await expect(
        hookHandler(
          { tool: "write", sessionID: SESSION_ID, callID: "c3" },
          { args: { filePath: join(tmpDir, "src/index.ts"), content: "// code" } }
        )
      ).rejects.toThrow(/does not have write permission/)

      await expect(
        hookHandler(
          { tool: "write", sessionID: SESSION_ID, callID: "c4" },
          { args: { filePath: join(tmpDir, "tests/main.test.ts"), content: "// test" } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("agent without write_paths falls back to DEFAULT_AGENT_ALLOWLIST", async () => {
      //#given - create pm override without write_paths
      const agentContent = `---
name: PM
description: PM without write_paths
---

You are a PM agent.
`
      writeFileSync(join(agentsDir, "pm.md"), agentContent)

      //#when - agent-authority checks write permission
      setSessionAgent(SESSION_ID, "pm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const hookHandler = hook["tool.execute.before"]

      //#then - falls back to DEFAULT_AGENT_ALLOWLIST (pm gets docs/**)
      await expect(
        hookHandler(
          { tool: "write", sessionID: SESSION_ID, callID: "c5" },
          { args: { filePath: join(tmpDir, "docs/kord/plans/plan.md"), content: "# Plan" } }
        )
      ).resolves.toBeUndefined()

      // But blocked from src/**
      await expect(
        hookHandler(
          { tool: "write", sessionID: SESSION_ID, callID: "c6" },
          { args: { filePath: join(tmpDir, "src/main.ts"), content: "// code" } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("unknown agent with no allowlist entry is BLOCKED", async () => {
      //#given - no DEFAULT_AGENT_ALLOWLIST entry for this agent
      //#when - agent-authority checks write permission
      setSessionAgent(SESSION_ID, "unknown-custom-agent")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const hookHandler = hook["tool.execute.before"]

      //#then - blocked from writing anywhere
      await expect(
        hookHandler(
          { tool: "write", sessionID: SESSION_ID, callID: "c7" },
          { args: { filePath: join(tmpDir, "docs/test.md"), content: "# Test" } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })
  })

  //#endregion

  //#region call_kord_agent Permission Tests

  describe("call_kord_agent permission integration", () => {
    test("normal agents allow call_kord_agent by default", async () => {
      //#given - normal subagent
      //#when - config handler sets permissions
      const pluginConfig: OhMyOpenCodeConfig = {}
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {
          "custom-agent": {
            name: "custom-agent",
            prompt: "You are a custom agent",
            mode: "subagent",
          },
        },
        permission: {},
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#then - global permission includes call_kord_agent: allow
      const globalPerms = config.permission as Record<string, string>
      expect(globalPerms.call_kord_agent).toBe("allow")
    })

    test("kord agent denies call_kord_agent", async () => {
      //#given - kord is T0 orchestrator
      const pluginConfig: OhMyOpenCodeConfig = {}
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {},
        permission: {},
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#then - kord has call_kord_agent denied
      const agents = config.agent as Record<string, { permission?: Record<string, string> }>
      expect(agents.kord).toBeDefined()
      expect(agents.kord.permission?.call_kord_agent).toBe("deny")
    })

    test("dev agent denies call_kord_agent", async () => {
      //#given - dev is T0 executor
      const pluginConfig: OhMyOpenCodeConfig = {}
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {},
        permission: {},
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#then - dev has call_kord_agent denied
      const agents = config.agent as Record<string, { permission?: Record<string, string> }>
      expect(agents.dev).toBeDefined()
      expect(agents.dev.permission?.call_kord_agent).toBe("deny")
    })

    test("builder agent denies call_kord_agent", async () => {
      //#given - builder is T0 builder
      const pluginConfig: OhMyOpenCodeConfig = {
        kord_agent: {
          default_builder_enabled: true,
        },
      }
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {},
        permission: {},
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#then - builder has call_kord_agent denied
      const agents = config.agent as Record<string, { permission?: Record<string, string> }>
      expect(agents.builder).toBeDefined()
      expect(agents.builder.permission?.call_kord_agent).toBe("deny")
    })

    test("planner agent denies call_kord_agent", async () => {
      //#given - planner is T0 planner
      const pluginConfig: OhMyOpenCodeConfig = {
        kord_agent: {
          planner_enabled: true,
        },
      }
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {},
        permission: {},
      }

      const handler = createConfigHandler({
        ctx: { directory: tmpDir },
        pluginConfig,
        modelCacheState: {
          anthropicContext1MEnabled: false,
          modelContextLimitsCache: new Map(),
        },
      })

      await handler(config)

      //#then - planner has call_kord_agent denied
      const agents = config.agent as Record<string, { permission?: Record<string, string> }>
      expect(agents.planner).toBeDefined()
      expect(agents.planner.permission?.call_kord_agent).toBe("deny")
    })
  })

  //#endregion
})
