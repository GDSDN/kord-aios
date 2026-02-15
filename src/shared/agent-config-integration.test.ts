import { describe, test, expect } from "bun:test"
import { migrateAgentNames } from "./migration"
import { getAgentDisplayName } from "./agent-display-names"
import { AGENT_MODEL_REQUIREMENTS } from "./model-requirements"

describe("Agent Config Integration", () => {
  describe("Old format config migration", () => {
    test("migrates old format agent keys to lowercase", () => {
      // given - config with old format keys
      const oldConfig = {
        Kord: { model: "anthropic/claude-opus-4-6" },
        Atlas: { model: "anthropic/claude-opus-4-6" },
        "Plan (Planner)": { model: "anthropic/claude-opus-4-6" },
        "Analyst (Plan Consultant)": { model: "anthropic/claude-sonnet-4-5" },
        "QA (Plan Reviewer)": { model: "anthropic/claude-sonnet-4-5" },
      }

      // when - migration is applied
      const result = migrateAgentNames(oldConfig)

      // then - keys are lowercase
      expect(result.migrated).toHaveProperty("kord")
      expect(result.migrated).toHaveProperty("builder")
      expect(result.migrated).toHaveProperty("planner")
      expect(result.migrated).toHaveProperty("analyst")
      expect(result.migrated).toHaveProperty("qa")

      // then - old keys are removed
      expect(result.migrated).not.toHaveProperty("Kord")
      expect(result.migrated).not.toHaveProperty("Atlas")
      expect(result.migrated).not.toHaveProperty("Plan (Planner)")
      expect(result.migrated).not.toHaveProperty("Analyst (Plan Consultant)")
      expect(result.migrated).not.toHaveProperty("QA (Plan Reviewer)")

      // then - values are preserved
      expect(result.migrated.kord).toEqual({ model: "anthropic/claude-opus-4-6" })
      expect(result.migrated.builder).toEqual({ model: "anthropic/claude-opus-4-6" })
      expect(result.migrated.planner).toEqual({ model: "anthropic/claude-opus-4-6" })
      
      // then - changed flag is true
      expect(result.changed).toBe(true)
    })

    test("preserves already lowercase keys", () => {
      // given - config with lowercase keys
      const config = {
        kord: { model: "anthropic/claude-opus-4-6" },
        architect: { model: "openai/gpt-5.2" },
        librarian: { model: "opencode/glm-4.7-free" },
      }

      // when - migration is applied
      const result = migrateAgentNames(config)

      // then - keys remain unchanged
      expect(result.migrated).toEqual(config)
      
      // then - changed flag is false
      expect(result.changed).toBe(false)
    })

    test("handles mixed case config", () => {
      // given - config with mixed old and new format
      const mixedConfig = {
        Kord: { model: "anthropic/claude-opus-4-6" },
        architect: { model: "openai/gpt-5.2" },
        "Plan (Planner)": { model: "anthropic/claude-opus-4-6" },
        librarian: { model: "opencode/glm-4.7-free" },
      }

      // when - migration is applied
      const result = migrateAgentNames(mixedConfig)

      // then - all keys are lowercase
      expect(result.migrated).toHaveProperty("kord")
      expect(result.migrated).toHaveProperty("architect")
      expect(result.migrated).toHaveProperty("planner")
      expect(result.migrated).toHaveProperty("librarian")
      expect(Object.keys(result.migrated).every((key) => key === key.toLowerCase())).toBe(true)
      
      // then - changed flag is true
      expect(result.changed).toBe(true)
    })
  })

  describe("Display name resolution", () => {
    test("returns correct display names for all builtin agents", () => {
      // given - lowercase config keys
      const agents = [
        "kord",
        "builder",
        "plan",
        "analyst",
        "plan-analyzer",
        "plan-reviewer",
        "qa",
        "architect",
        "librarian",
        "explore",
        "vision",
      ]

      // when - display names are requested
      const displayNames = agents.map((agent) => getAgentDisplayName(agent))

      // then - display names are correct
      expect(displayNames).toContain("Kord (Ultraworker)")
      expect(displayNames).toContain("Builder (Plan Execution Orchestrator)")
      expect(displayNames).toContain("Plan (Plan Builder)")
      expect(displayNames).toContain("Analyst (Plan Consultant)")
      expect(displayNames).toContain("Plan Analyzer")
      expect(displayNames).toContain("Plan Reviewer")
      expect(displayNames).toContain("QA (Plan Reviewer)")
      expect(displayNames).toContain("architect")
      expect(displayNames).toContain("librarian")
      expect(displayNames).toContain("explore")
      expect(displayNames).toContain("vision")
    })

    test("handles lowercase keys case-insensitively", () => {
      // given - various case formats of lowercase keys
      const keys = ["Kord", "builder", "KORD", "builder", "plan", "PLAN"]

      // when - display names are requested
      const displayNames = keys.map((key) => getAgentDisplayName(key))

      // then - correct display names are returned
      expect(displayNames[0]).toBe("Kord (Ultraworker)")
      expect(displayNames[1]).toBe("Builder (Plan Execution Orchestrator)")
      expect(displayNames[2]).toBe("Kord (Ultraworker)")
      expect(displayNames[3]).toBe("Builder (Plan Execution Orchestrator)")
      expect(displayNames[4]).toBe("Plan (Plan Builder)")
      expect(displayNames[5]).toBe("Plan (Plan Builder)")
    })

    test("returns original key for unknown agents", () => {
      // given - unknown agent key
      const unknownKey = "custom-agent"

      // when - display name is requested
      const displayName = getAgentDisplayName(unknownKey)

      // then - original key is returned
      expect(displayName).toBe(unknownKey)
    })
  })

  describe("Model requirements integration", () => {
    test("all model requirements use lowercase keys", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // when - checking key format
      const allLowercase = agentKeys.every((key) => key === key.toLowerCase())

      // then - all keys are lowercase
      expect(allLowercase).toBe(true)
    })

    test("model requirements include all builtin agents", () => {
      // given - expected builtin agents
      const expectedAgents = [
        "kord",
        "dev",
        "planner",
        "analyst",
        "plan-analyzer",
        "plan-reviewer",
        "qa",
        "architect",
        "librarian",
        "explore",
        "vision",
      ]

      // when - checking AGENT_MODEL_REQUIREMENTS
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // then - all expected agents are present
      for (const agent of expectedAgents) {
        expect(agentKeys).toContain(agent)
      }
    })

    test("no uppercase keys in model requirements", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // when - checking for uppercase keys
      const uppercaseKeys = agentKeys.filter((key) => key !== key.toLowerCase())

      // then - no uppercase keys exist
      expect(uppercaseKeys).toEqual([])
    })
  })

  describe("End-to-end config flow", () => {
    test("old config migrates and displays correctly", () => {
      // given - old format config
      const oldConfig = {
        Kord: { model: "anthropic/claude-opus-4-6", temperature: 0.1 },
        "Plan (Planner)": { model: "anthropic/claude-opus-4-6" },
      }

      // when - config is migrated
      const result = migrateAgentNames(oldConfig)

      // then - keys are lowercase
      expect(result.migrated).toHaveProperty("kord")
      expect(result.migrated).toHaveProperty("planner")

      // when - display names are retrieved
      const kordDisplay = getAgentDisplayName("kord")
      const plannerDisplay = getAgentDisplayName("planner")

      // then - display names are correct
      expect(kordDisplay).toBe("Kord (Ultraworker)")
      expect(plannerDisplay).toBe("Planner (Plan Builder)")

      // then - config values are preserved
      expect(result.migrated.kord).toEqual({ model: "anthropic/claude-opus-4-6", temperature: 0.1 })
      expect(result.migrated.planner).toEqual({ model: "anthropic/claude-opus-4-6" })
    })

    test("new config works without migration", () => {
      // given - new format config (already lowercase)
      const newConfig = {
        kord: { model: "anthropic/claude-opus-4-6" },
        builder: { model: "anthropic/claude-opus-4-6" },
      }

      // when - migration is applied (should be no-op)
      const result = migrateAgentNames(newConfig)

      // then - config is unchanged
      expect(result.migrated).toEqual(newConfig)
      
      // then - changed flag is false
      expect(result.changed).toBe(false)

      // when - display names are retrieved
      const kordDisplay = getAgentDisplayName("kord")
      const builderDisplay = getAgentDisplayName("builder")

      // then - display names are correct
      expect(kordDisplay).toBe("Kord (Ultraworker)")
      expect(builderDisplay).toBe("Builder (Plan Execution Orchestrator)")
    })
  })
})
