/**
 * EPIC-10: Agent Authority Integration Tests
 *
 * End-to-end tests validating:
 * - T0 agents (kord, dev, dev-junior) have full write access
 * - DEFAULT_AGENT_ALLOWLIST fallback works for known agents
 * - Unknown agents without allowlist entry are blocked
 * - call_kord_agent permission defaults
 */

import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test"
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createAgentAuthorityHook } from "./index"
import { setSessionAgent, clearSessionAgent } from "../../features/claude-code-session-state"
import { createConfigHandler } from "../../plugin-handlers/config-handler"
import type { OhMyOpenCodeConfig } from "../../config"
import { clearAgentFrontmatterCapabilities } from "../../shared/agent-frontmatter-capabilities-store"

import * as agents from "../../agents"
import * as shared from "../../shared"
import * as configDir from "../../shared/opencode-config-dir"
import * as permissionCompat from "../../shared/permission-compat"
import * as modelResolver from "../../shared/model-resolver"

function makeTmpDir(): string {
  const dir = join(tmpdir(), `authority-integration-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function makeCtx(directory: string) {
  return { directory } as any
}

const SESSION_ID = "authority-integration-session"

describe("EPIC-10: Agent Authority Integration", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTmpDir()

    // Mock config handler dependencies
    spyOn(agents, "createBuiltinAgents" as any).mockResolvedValue({
      kord: { name: "kord", prompt: "You are Kord", mode: "primary" },
      dev: { name: "dev", prompt: "You are Dev", mode: "primary" },
      builder: { name: "builder", prompt: "You are Builder", mode: "subagent" },
      planner: { name: "planner", prompt: "You are Planner", mode: "subagent" },
      pm: { name: "pm", prompt: "You are PM", mode: "subagent" },
      architect: { name: "architect", prompt: "You are Architect", mode: "subagent" },
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

  //#region T0 Agent Full Access

  describe("T0 agents have full write access", () => {
    test("kord can write to any path", async () => {
      setSessionAgent(SESSION_ID, "kord")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      // Should allow writes anywhere
      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "k1" },
          { args: { filePath: join(tmpDir, "src/index.ts"), content: "code" } }
        )
      ).resolves.toBeUndefined()

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "k2" },
          { args: { filePath: join(tmpDir, "docs/plan.md"), content: "plan" } }
        )
      ).resolves.toBeUndefined()
    })

    test("dev can write to any path", async () => {
      setSessionAgent(SESSION_ID, "dev")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "d1" },
          { args: { filePath: join(tmpDir, "src/main.ts"), content: "code" } }
        )
      ).resolves.toBeUndefined()
    })

    test("dev-junior can write to any path", async () => {
      setSessionAgent(SESSION_ID, "dev-junior")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "dj1" },
          { args: { filePath: join(tmpDir, "tests/test.ts"), content: "test" } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion

  //#region DEFAULT_AGENT_ALLOWLIST Fallback

  describe("DEFAULT_AGENT_ALLOWLIST fallback for known agents", () => {
    test("pm can write to docs/** but not src/**", async () => {
      setSessionAgent(SESSION_ID, "pm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      // Should allow docs/**
      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "pm1" },
          { args: { filePath: join(tmpDir, "docs/kord/plans/plan.md"), content: "plan" } }
        )
      ).resolves.toBeUndefined()

      // Should block src/**
      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "pm2" },
          { args: { filePath: join(tmpDir, "src/main.ts"), content: "code" } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("architect can write to docs/** but not src/**", async () => {
      setSessionAgent(SESSION_ID, "architect")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "a1" },
          { args: { filePath: join(tmpDir, "docs/architecture.md"), content: "arch" } }
        )
      ).resolves.toBeUndefined()

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "a2" },
          { args: { filePath: join(tmpDir, "src/main.ts"), content: "code" } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("qa can write to docs/**", async () => {
      setSessionAgent(SESSION_ID, "qa")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "q1" },
          { args: { filePath: join(tmpDir, "docs/kord/test-plan.md"), content: "test" } }
        )
      ).resolves.toBeUndefined()
    })

    test("sm can write to docs/**", async () => {
      setSessionAgent(SESSION_ID, "sm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "s1" },
          { args: { filePath: join(tmpDir, "docs/kord/sprint.md"), content: "sprint" } }
        )
      ).resolves.toBeUndefined()
    })

    test("builder can write to docs/kord/notepads/** and docs/kord/runs/**", async () => {
      setSessionAgent(SESSION_ID, "builder")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "b1" },
          { args: { filePath: join(tmpDir, "docs/kord/notepads/notes.md"), content: "notes" } }
        )
      ).resolves.toBeUndefined()

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "b2" },
          { args: { filePath: join(tmpDir, "docs/kord/runs/run-001.md"), content: "run" } }
        )
      ).resolves.toBeUndefined()
    })

    test("planner can write to docs/kord/plans/**", async () => {
      setSessionAgent(SESSION_ID, "planner")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "p1" },
          { args: { filePath: join(tmpDir, "docs/kord/plans/feature-plan.md"), content: "plan" } }
        )
      ).resolves.toBeUndefined()
    })

    test("devops can write to .github/**", async () => {
      setSessionAgent(SESSION_ID, "devops")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "do1" },
          { args: { filePath: join(tmpDir, ".github/workflows/ci.yml"), content: "ci" } }
        )
      ).resolves.toBeUndefined()
    })

    test("data-engineer can write to migrations/**", async () => {
      setSessionAgent(SESSION_ID, "data-engineer")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "de1" },
          { args: { filePath: join(tmpDir, "supabase/migrations/001_init.sql"), content: "sql" } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion

  //#region Unknown Agent Blocking

  describe("unknown agents are blocked", () => {
    test("unknown custom agent is blocked from all writes", async () => {
      setSessionAgent(SESSION_ID, "unknown-custom-agent")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "u1" },
          { args: { filePath: join(tmpDir, "docs/test.md"), content: "test" } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("random agent name is blocked", async () => {
      setSessionAgent(SESSION_ID, "random-agent")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "r1" },
          { args: { filePath: join(tmpDir, "anything.md"), content: "test" } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })
  })

  //#endregion

  //#region Config Allowlist Override

  describe("config allowlist override adds to defaults", () => {
    test("config allowlist extends pm with src/** access", async () => {
      setSessionAgent(SESSION_ID, "pm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir), {
        allowlist: { pm: ["src/**"] },
      })
      const handler = hook["tool.execute.before"]

      // Should allow docs/** (default) AND src/** (from config)
      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c1" },
          { args: { filePath: join(tmpDir, "docs/kord/plans/plan.md"), content: "plan" } }
        )
      ).resolves.toBeUndefined()

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c2" },
          { args: { filePath: join(tmpDir, "src/main.ts"), content: "code" } }
        )
      ).resolves.toBeUndefined()
    })

    test("config allowlist grants access to unknown agent", async () => {
      setSessionAgent(SESSION_ID, "my-custom-agent")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir), {
        allowlist: { "my-custom-agent": ["docs/**", "src/**"] },
      })
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c3" },
          { args: { filePath: join(tmpDir, "src/app.ts"), content: "code" } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion

  //#region call_kord_agent Permission Tests

  describe("call_kord_agent permissions via config handler", () => {
    test("global permission includes call_kord_agent: allow", async () => {
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

      const globalPerms = config.permission as Record<string, string>
      expect(globalPerms.call_kord_agent).toBe("allow")
    })

    test("normal subagent inherits global call_kord_agent: allow", async () => {
      const pluginConfig: OhMyOpenCodeConfig = {}
      const config: Record<string, unknown> = {
        model: "anthropic/claude-opus-4-6",
        agent: {
          "custom-worker": {
            name: "custom-worker",
            prompt: "You are a custom worker",
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

      // Global permission allows call_kord_agent
      const globalPerms = config.permission as Record<string, string>
      expect(globalPerms.call_kord_agent).toBe("allow")
    })

    test("kord explicitly denies call_kord_agent", async () => {
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

      const agents = config.agent as Record<string, { permission?: Record<string, string> }>
      expect(agents.kord.permission?.call_kord_agent).toBe("deny")
    })

    test("dev explicitly denies call_kord_agent", async () => {
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

      const agents = config.agent as Record<string, { permission?: Record<string, string> }>
      expect(agents.dev.permission?.call_kord_agent).toBe("deny")
    })

    test("builder denies call_kord_agent when enabled", async () => {
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

      const agents = config.agent as Record<string, { permission?: Record<string, string> }>
      expect(agents.builder.permission?.call_kord_agent).toBe("deny")
    })

    test("planner denies call_kord_agent when enabled", async () => {
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

      const agents = config.agent as Record<string, { permission?: Record<string, string> }>
      expect(agents.planner.permission?.call_kord_agent).toBe("deny")
    })
  })

  //#endregion
})
