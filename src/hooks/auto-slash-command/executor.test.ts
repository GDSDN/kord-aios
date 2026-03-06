import { describe, expect, test } from "bun:test"
import { executeSlashCommand } from "./executor"

describe("auto-slash executor workflow alias", () => {
  test("resolves create-workflow as builtin authoring command", async () => {
    const result = await executeSlashCommand({
      command: "create-workflow",
      args: "ads-analysis",
      raw: "/create-workflow ads-analysis",
    })

    expect(result.success).toBe(true)
    expect(result.replacementText).toContain("/create-workflow Command")
    expect(result.replacementText).toContain("/workflow create <id>")
    expect(result.replacementText).toContain("ads-analysis")
  })

  test("resolves known workflow id as command alias", async () => {
    const result = await executeSlashCommand({
      command: "greenfield-fullstack",
      args: "",
      raw: "/greenfield-fullstack",
    })

    expect(result.success).toBe(true)
    expect(result.replacementText).toContain("<workflow-context>")
    expect(result.replacementText).toContain("<workflow-id>greenfield-fullstack</workflow-id>")
  })

  test("keeps alias arguments in workflow template", async () => {
    const result = await executeSlashCommand({
      command: "greenfield-fullstack",
      args: "continue",
      raw: "/greenfield-fullstack continue",
    })

    expect(result.success).toBe(true)
    expect(result.replacementText).toContain("<workflow-id>greenfield-fullstack</workflow-id>")
    expect(result.replacementText).toContain("<user-request>")
    expect(result.replacementText).toContain("continue")
  })
})
