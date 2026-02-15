import { describe, expect, test } from "bun:test"
import { createPlanAnalyzerAgent, planAnalyzerPromptMetadata } from "./plan-analyzer"
import { createPlanReviewerAgent, planReviewerPromptMetadata } from "./plan-reviewer"

const TEST_MODEL = "anthropic/claude-sonnet-4-5"

describe("Plan-internal agent factories", () => {
  //#region Plan Analyzer
  describe("Plan Analyzer", () => {
    test("creates agent with correct mode and temperature", () => {
      //#given
      const agent = createPlanAnalyzerAgent(TEST_MODEL)

      //#then
    expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.3)
      expect(agent.model).toBe(TEST_MODEL)
    })

    test("prompt contains role identity", () => {
      //#given
      const agent = createPlanAnalyzerAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Plan Analyzer")
      expect(agent.prompt).toContain("Pre-Planning Consultant")
    })

    test("metadata includes alias and triggers", () => {
      //#then
      expect(planAnalyzerPromptMetadata.promptAlias).toBe("Plan Analyzer")
      expect(planAnalyzerPromptMetadata.triggers.length).toBeGreaterThan(0)
      expect(planAnalyzerPromptMetadata.keyTrigger).toBeDefined()
    })

    test("factory has correct mode property", () => {
      //#then
    expect(createPlanAnalyzerAgent.mode).toBe("subagent")
    })
  })
  //#endregion

  //#region Plan Reviewer
  describe("Plan Reviewer", () => {
    test("creates agent with correct mode and temperature", () => {
      //#given
      const agent = createPlanReviewerAgent(TEST_MODEL)

      //#then
    expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.1)
      expect(agent.model).toBe(TEST_MODEL)
    })

    test("prompt contains review focus", () => {
      //#given
      const agent = createPlanReviewerAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("work plan reviewer")
      expect(agent.prompt).toContain("executable")
    })

    test("metadata includes alias and triggers", () => {
      //#then
      expect(planReviewerPromptMetadata.promptAlias).toBe("Plan Reviewer")
      expect(planReviewerPromptMetadata.triggers.length).toBeGreaterThan(0)
      expect(planReviewerPromptMetadata.keyTrigger).toBeDefined()
    })

    test("factory has correct mode property", () => {
      //#then
    expect(createPlanReviewerAgent.mode).toBe("subagent")
    })

    test("gpt model uses reasoningEffort and textVerbosity", () => {
      //#given
      const agent = createPlanReviewerAgent("openai/gpt-5.2")

      //#then
      expect(agent.reasoningEffort).toBe("medium")
      expect(agent.textVerbosity).toBe("high")
      expect(agent.thinking).toBeUndefined()
    })
  })
  //#endregion
})
