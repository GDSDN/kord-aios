import { describe, expect, test } from "bun:test"
import { createKordAgent, KORD_PROMPT_METADATA } from "./index"

describe("kord agent exports", () => {
  test("keeps prompt metadata stable", () => {
    expect(KORD_PROMPT_METADATA).toEqual({
      category: "utility",
      cost: "EXPENSIVE",
      promptAlias: "Kord",
      triggers: [],
    })
  })

  test("keeps factory behavior and includes methodology advisory rules", () => {
    const agent = createKordAgent("openai/gpt-5.2", [], ["read"], [], [], false)

    expect(agent.mode).toBe("primary")
    expect(agent.permission).toEqual({ question: "allow", call_kord_agent: "deny" })
    expect(agent.reasoningEffort).toBe("medium")
    expect(agent.prompt).toContain("Methodology Advisory Rules")
    expect(agent.prompt).toContain("Stories are the default execution unit")
    expect(agent.prompt).toContain(".kord/templates/")
    expect(agent.prompt).toContain("PRD (`@pm`) -> Epic -> Stories (`@sm`) -> Validation (`@po`) -> Implementation -> QA")
  })
})
