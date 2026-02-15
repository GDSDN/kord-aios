import { describe, it, expect } from "bun:test"
import { AGENT_DISPLAY_NAMES, getAgentDisplayName } from "./agent-display-names"

describe("getAgentDisplayName", () => {
  it("returns display name for lowercase config key (new format)", () => {
    // given config key "kord"
    const configKey = "kord"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Kord (Ultraworker)"
    expect(result).toBe("Kord (Ultraworker)")
  })

  it("returns display name for uppercase config key (old format - case-insensitive)", () => {
    // given config key "Kord" (old format)
    const configKey = "Kord"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Kord (Ultraworker)" (case-insensitive lookup)
    expect(result).toBe("Kord (Ultraworker)")
  })

  it("returns original key for unknown agents (fallback)", () => {
    // given config key "custom-agent"
    const configKey = "custom-agent"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "custom-agent" (original key unchanged)
    expect(result).toBe("custom-agent")
  })

  it("returns display name for builder", () => {
    // given config key "builder"
    const configKey = "builder"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Builder (Plan Execution Orchestrator)"
    expect(result).toBe("Builder (Plan Execution Orchestrator)")
  })

  it("returns display name for legacy build key", () => {
    // given config key "build" (legacy)
    const configKey = "build"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Build (Plan Execution Orchestrator)" for backward compat
    expect(result).toBe("Build (Plan Execution Orchestrator)")
  })

  it("returns display name for plan", () => {
    // given config key "plan"
    const configKey = "plan"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Plan (Plan Builder)"
    expect(result).toBe("Plan (Plan Builder)")
  })

  it("returns display name for dev-junior", () => {
    // given config key "dev-junior"
    const configKey = "dev-junior"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Dev-Junior"
    expect(result).toBe("Dev-Junior")
  })

  it("returns display name for analyst", () => {
    // given config key "analyst"
    const configKey = "analyst"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Analyst (Plan Consultant)"
    expect(result).toBe("Analyst (Plan Consultant)")
  })

  it("returns display name for plan-analyzer", () => {
    // given config key "plan-analyzer"
    const configKey = "plan-analyzer"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Plan Analyzer"
    expect(result).toBe("Plan Analyzer")
  })

  it("returns display name for plan-reviewer", () => {
    // given config key "plan-reviewer"
    const configKey = "plan-reviewer"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Plan Reviewer"
    expect(result).toBe("Plan Reviewer")
  })

  it("returns display name for qa", () => {
    // given config key "qa"
    const configKey = "qa"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "QA (Plan Reviewer)"
    expect(result).toBe("QA (Plan Reviewer)")
  })

  it("returns display name for architect", () => {
    // given config key "architect"
    const configKey = "architect"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "architect"
    expect(result).toBe("architect")
  })

  it("returns display name for librarian", () => {
    // given config key "librarian"
    const configKey = "librarian"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "librarian"
    expect(result).toBe("librarian")
  })

  it("returns display name for explore", () => {
    // given config key "explore"
    const configKey = "explore"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "explore"
    expect(result).toBe("explore")
  })

  it("returns display name for vision", () => {
    // given config key "vision"
    const configKey = "vision"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "vision"
    expect(result).toBe("vision")
  })
})

describe("AGENT_DISPLAY_NAMES", () => {
  it("contains all expected agent mappings", () => {
    // given expected mappings
    const expectedMappings = {
      kord: "Kord (Ultraworker)",
      builder: "Builder (Plan Execution Orchestrator)",
    build: "Build (Plan Execution Orchestrator)",
      plan: "Plan (Plan Builder)",
      "dev-junior": "Dev-Junior",
      analyst: "Analyst (Plan Consultant)",
      "plan-analyzer": "Plan Analyzer",
      "plan-reviewer": "Plan Reviewer",
      planner: "Planner (Plan Builder)",
      qa: "QA (Plan Reviewer)",
      architect: "architect",
      librarian: "librarian",
      explore: "explore",
      "vision": "vision",
    }

    // when checking the constant
    // then contains all expected mappings
    expect(AGENT_DISPLAY_NAMES).toEqual(expectedMappings)
  })
})