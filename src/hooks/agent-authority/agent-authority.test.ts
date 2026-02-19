import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"
import { createAgentAuthorityHook } from "./index"
import { updateSessionAgent, _resetForTesting } from "../../features/claude-code-session-state"

describe("createAgentAuthorityHook", () => {
  let tempDir: string
  let hook: ReturnType<typeof createAgentAuthorityHook>

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "agent-authority-"))
    hook = createAgentAuthorityHook({ directory: tempDir } as any)
  })

  afterEach(() => {
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
})
