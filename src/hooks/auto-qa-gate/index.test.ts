import { describe, test, expect } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import { createAutoQaGateHook } from "./index"

function createCtx(): PluginInput {
  return {
    directory: "/repo",
    client: {} as any,
  } as unknown as PluginInput
}

describe("auto-qa-gate hook", () => {
  test("does nothing when disabled", async () => {
    const hook = createAutoQaGateHook(createCtx(), { enabled: false }, {
      getGitStatusPorcelain: async () => " M src/a.ts",
      runCommand: async () => ({ exitCode: 0, stdout: "ok" }),
    })

    const output: { output?: string } = { output: "result" }
    await hook["tool.execute.before"]?.({ tool: "task", sessionID: "s1", callID: "c1" }, { args: { run_in_background: false } })
    await hook["tool.execute.after"]?.({ tool: "task", sessionID: "s1", callID: "c1" }, output)

    expect(output.output).toBe("result")
  })

  test("appends PASS report when files changed and commands pass", async () => {
    let call = 0
    const hook = createAutoQaGateHook(createCtx(), { enabled: true }, {
      getGitStatusPorcelain: async () => {
        call++
        return call === 1 ? "" : " M src/a.ts\n?? assets/x.json"
      },
      runCommand: async (_cwd, cmd) => ({ exitCode: 0, stdout: `ran ${cmd}` }),
    })

    const output: { output?: string } = { output: "result" }
    await hook["tool.execute.before"]?.({ tool: "task", sessionID: "s1", callID: "c1" }, { args: { run_in_background: false } })
    await hook["tool.execute.after"]?.({ tool: "task", sessionID: "s1", callID: "c1" }, output)

    expect(output.output).toContain("[AUTO QA GATE]")
    expect(output.output).toContain("Status: PASS")
    expect(output.output).toContain("- src/a.ts")
  })

  test("skips when task was run in background", async () => {
    const hook = createAutoQaGateHook(createCtx(), { enabled: true }, {
      getGitStatusPorcelain: async () => " M src/a.ts",
      runCommand: async () => ({ exitCode: 0, stdout: "ok" }),
    })

    const output: { output?: string } = { output: "result" }
    await hook["tool.execute.before"]?.({ tool: "task", sessionID: "s1", callID: "c1" }, { args: { run_in_background: true } })
    await hook["tool.execute.after"]?.({ tool: "task", sessionID: "s1", callID: "c1" }, output)

    expect(output.output).toBe("result")
  })
})
