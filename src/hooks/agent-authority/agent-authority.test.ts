import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"
import { createAgentAuthorityHook } from "./index"
import { updateSessionAgent, _resetForTesting } from "../../features/claude-code-session-state"
import * as opencodeConfigDir from "../../shared/opencode-config-dir"

describe("createAgentAuthorityHook", () => {
  let tempDir: string
  let hook: ReturnType<typeof createAgentAuthorityHook>

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "agent-authority-"))
    spyOn(opencodeConfigDir, "getOpenCodeConfigDir").mockReturnValue(join(tempDir, "opencode-global"))
    hook = createAgentAuthorityHook({ directory: tempDir } as any)
  })

  afterEach(() => {
    ;(opencodeConfigDir.getOpenCodeConfigDir as any)?.mockRestore?.()
    _resetForTesting()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("allows dev writing to src", async () => {
    //#given
    updateSessionAgent("ses_dev", "dev")
    const input = { tool: "Write", sessionID: "ses_dev", callID: "call_1" }
    const output = { args: { filePath: "src/feature.ts", content: "hello" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows Kord (uppercase) writing to src", async () => {
    //#given
    updateSessionAgent("ses_Kord", "Kord")
    const input = { tool: "Write", sessionID: "ses_Kord", callID: "call_k1" }
    const output = { args: { filePath: "src/feature.ts", content: "hello" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("does not enforce allowlist for OpenCode native agent general", async () => {
    //#given
    updateSessionAgent("ses_general", "general")
    const input = { tool: "Write", sessionID: "ses_general", callID: "call_g1" }
    const output = { args: { filePath: "src/feature.ts", content: "hello" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("does not enforce allowlist for OpenCode native agent plan", async () => {
    //#given
    updateSessionAgent("ses_plan", "plan")
    const input = { tool: "Write", sessionID: "ses_plan", callID: "call_p1" }
    const output = { args: { filePath: "src/feature.ts", content: "hello" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows dev writing when filePath contains line breaks", async () => {
    //#given
    updateSessionAgent("ses_dev_wrap", "dev")
    const input = { tool: "Write", sessionID: "ses_dev_wrap", callID: "call_1b" }
    const output = {
      args: {
        filePath: "src/components/\n      members/InviteMemberModal.tsx",
        content: "hello",
      },
    }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows dev writing when filePath is a file:// URI", async () => {
    //#given
    updateSessionAgent("ses_dev_uri", "dev")
    const input = { tool: "Write", sessionID: "ses_dev_uri", callID: "call_1c" }
    const fileUrl = pathToFileURL(join(tempDir, "src/feature.ts")).toString()
    const output = { args: { filePath: fileUrl, content: "hello" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows kord writing when filePath contains line breaks", async () => {
    //#given
    updateSessionAgent("ses_kord_wrap", "kord")
    const input = { tool: "Edit", sessionID: "ses_kord_wrap", callID: "call_1d" }
    const output = {
      args: {
        filePath: "src/components/\n      members/InviteMemberModal.tsx",
        oldString: "",
        newString: "log",
      },
    }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("blocks pm writing to src", async () => {
    //#given
    updateSessionAgent("ses_pm", "pm")
    const input = { tool: "Edit", sessionID: "ses_pm", callID: "call_2" }
    const output = { args: { filePath: "src/feature.ts", content: "update" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).rejects.toThrow("does not have write permission")
  })

  test("blocks git push for non-devops", async () => {
    //#given
    updateSessionAgent("ses_dev", "dev")
    const input = { tool: "bash", sessionID: "ses_dev", callID: "call_3" }
    const output = { args: { command: "git push origin dev" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).rejects.toThrow("git push")
  })

  test("allowlist override permits pm plan writes", async () => {
    //#given
    hook = createAgentAuthorityHook({ directory: tempDir } as any, {
      allowlist: {
        pm: ["docs/kord/plans/**"],
      },
    })
    updateSessionAgent("ses_pm", "pm")
    const input = { tool: "Write", sessionID: "ses_pm", callID: "call_4" }
    const output = { args: { filePath: "docs/kord/plans/plan.md", content: "plan" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows planner writing plan/draft files", async () => {
    //#given
    updateSessionAgent("ses_planner", "planner")
    const input = { tool: "Write", sessionID: "ses_planner", callID: "call_5" }
    const output = { args: { filePath: "docs/kord/plans/new-plan.md", content: "# Plan" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows builder writing notepad/run files", async () => {
    //#given
    updateSessionAgent("ses_builder", "builder")
    const input = { tool: "Edit", sessionID: "ses_builder", callID: "call_6" }
    const output = { args: { filePath: "docs/kord/runs/run-001.md", oldString: "", newString: "log" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows squad-creator writing squad files", async () => {
    //#given
    updateSessionAgent("ses_squad", "squad-creator")
    const input = { tool: "Write", sessionID: "ses_squad", callID: "call_7" }
    const output = { args: { filePath: ".opencode/squads/my-squad/SQUAD.yaml", content: "name: my-squad" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows squad-creator writing to .kord squad files", async () => {
    //#given
    updateSessionAgent("ses_squad_kord", "squad-creator")
    const input = { tool: "Write", sessionID: "ses_squad_kord", callID: "call_7b" }
    const output = { args: { filePath: ".kord/squads/my-squad/SQUAD.yaml", content: "name: my-squad" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("allows squad-creator writing global squad files with absolute path", async () => {
    //#given
    updateSessionAgent("ses_squad_global", "squad-creator")
    const input = { tool: "Write", sessionID: "ses_squad_global", callID: "call_7c" }
    const globalPath = join(tempDir, "opencode-global", "squads", "global-team", "SQUAD.yaml")
    const output = { args: { filePath: globalPath, content: "name: global-team" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).resolves.toBeUndefined()
  })

  test("blocks non-squad-creator writing global squad files with absolute path", async () => {
    //#given
    updateSessionAgent("ses_pm_global", "pm")
    const input = { tool: "Write", sessionID: "ses_pm_global", callID: "call_7d" }
    const globalPath = join(tempDir, "opencode-global", "squads", "global-team", "SQUAD.yaml")
    const output = { args: { filePath: globalPath, content: "name: global-team" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).rejects.toThrow("does not have write permission")
  })

  test("blocks squad-creator absolute path traversal outside global squads root", async () => {
    //#given
    updateSessionAgent("ses_squad_escape", "squad-creator")
    const input = { tool: "Write", sessionID: "ses_squad_escape", callID: "call_7e" }
    const escapedPath = join(tempDir, "opencode-global", "squads", "..", "..", "evil.txt")
    const output = { args: { filePath: escapedPath, content: "evil" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    await expect(result).rejects.toThrow("does not have write permission")
  })

  // Tests for getAgentCapabilities integration
  test("blocks unknown agent with no allowlist entry from writing", async () => {
    //#given
    updateSessionAgent("ses_unknown", "unknown-custom-agent")
    const input = { tool: "Write", sessionID: "ses_unknown", callID: "call_unknown_1" }
    const output = { args: { filePath: "docs/test.md", content: "hello" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then
    // Unknown agent has no write_paths from getAgentCapabilities and no DEFAULT_AGENT_ALLOWLIST entry
    await expect(result).rejects.toThrow("does not have write permission")
  })

  test("pm falls back to DEFAULT_AGENT_ALLOWLIST for legacy agent", async () => {
    //#given - pm is in DEFAULT_AGENT_ALLOWLIST, should allow docs/** but block src/**
    updateSessionAgent("ses_pm_docs", "pm")
    const input = { tool: "Write", sessionID: "ses_pm_docs", callID: "call_pm_docs" }
    const output = { args: { filePath: "docs/kord/plans/plan.md", content: "plan" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then - pm can write to docs/** per DEFAULT_AGENT_ALLOWLIST
    await expect(result).resolves.toBeUndefined()
  })

  test("pm blocks writing to src via DEFAULT_AGENT_ALLOWLIST fallback", async () => {
    //#given
    updateSessionAgent("ses_pm_src", "pm")
    const input = { tool: "Write", sessionID: "ses_pm_src", callID: "call_pm_src" }
    const output = { args: { filePath: "src/feature.ts", content: "code" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then - pm cannot write to src/** per DEFAULT_AGENT_ALLOWLIST
    await expect(result).rejects.toThrow("does not have write permission")
  })

  test("dev-junior has full access as T0/T1 agent", async () => {
    //#given - dev-junior is a T0/T1 agent with ["**"] access
    updateSessionAgent("ses_dev_junior", "dev-junior")
    const input = { tool: "Write", sessionID: "ses_dev_junior", callID: "call_dj_1" }
    const output = { args: { filePath: "src/any/file.ts", content: "code" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then - dev-junior can write anywhere
    await expect(result).resolves.toBeUndefined()
  })

  test("data-engineer has limited access per DEFAULT_AGENT_ALLOWLIST", async () => {
    //#given - data-engineer has specific paths in DEFAULT_AGENT_ALLOWLIST
    updateSessionAgent("ses_de", "data-engineer")
    const input = { tool: "Write", sessionID: "ses_de", callID: "call_de_1" }

    // data-engineer can write to migrations and schema files
    const allowedOutput = { args: { filePath: "db/migrations/001.sql", content: "CREATE TABLE" } }

    //#when
    const allowedResult = hook["tool.execute.before"]?.(input as any, allowedOutput as any)

    //#then
    await expect(allowedResult).resolves.toBeUndefined()
  })

  test("data-engineer blocked from writing to src", async () => {
    //#given
    updateSessionAgent("ses_de_src", "data-engineer")
    const input = { tool: "Write", sessionID: "ses_de_src", callID: "call_de_src" }
    const output = { args: { filePath: "src/feature.ts", content: "code" } }

    //#when
    const result = hook["tool.execute.before"]?.(input as any, output as any)

    //#then - data-engineer cannot write to src/** (not in allowlist)
    await expect(result).rejects.toThrow("does not have write permission")
  })
})
