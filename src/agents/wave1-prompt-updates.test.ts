import { describe, test, expect } from "bun:test"
import { createKordAgent } from "./kord"
import { createDevAgent } from "./dev"
import { createQaAgent } from "./qa"
import { createArchitectAgent, ARCHITECT_PROMPT_METADATA } from "./architect"
import { createAnalystAgent, analystPromptMetadata } from "./analyst"
import { createVisionAgent, VISION_PROMPT_METADATA } from "./vision"
import { builderPromptMetadata } from "./builder"
import { PLAN_SYSTEM_PROMPT } from "./plan"

const TEST_MODEL = "anthropic/claude-sonnet-4-5"

describe("Agent prompt identity and methodology", () => {
  //#region Kord - Core principles
  describe("Kord (core principles)", () => {
    test("prompt omits mythology persona references", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).not.toContain("Orion")
      expect(agent.prompt).not.toContain("Master Orchestrator")
    })

    test("prompt contains AIOS core principles", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Security-first")
      expect(agent.prompt).toContain("Orchestrate with discipline")
      expect(agent.prompt).toContain("Numbered options")
    })
  })
  //#endregion

  //#region Dev - Builder principles
  describe("Dev (Builder principles)", () => {
    test("prompt contains AIOS Builder principles section", () => {
      //#given
      const agent = createDevAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Requirements as contracts")
      expect(agent.prompt).toContain("Numbered options")
    })

    test("prompt retains development methodology", () => {
      //#given
      const agent = createDevAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Story-first")
      expect(agent.prompt).toContain("Sequential execution")
      expect(agent.prompt).toContain("Evidence-based completion")
    })
  })
  //#endregion

  //#region QA - Quality advisory
  describe("QA (Quality advisory)", () => {
    test("prompt contains AIOS quality advisory principles", () => {
      //#given
      const agent = createQaAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Quality Advisory Principles")
      expect(agent.prompt).toContain("Risk-based review")
      expect(agent.prompt).toContain("Gate governance")
    })

    test("prompt retains QA identity", () => {
      //#given
      const agent = createQaAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Quality Guardian")
      expect(agent.prompt).toContain("executable")
    })
  })
  //#endregion

  //#region Architect - Responsibility boundaries
  describe("Architect (responsibility boundaries)", () => {
    test("prompt contains AIOS responsibility boundaries", () => {
      //#given
      const agent = createArchitectAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("responsibility_boundaries")
      expect(agent.prompt).toContain("@data-engineer")
      expect(agent.prompt).toContain("@devops")
      expect(agent.prompt).toContain("@pm")
      expect(agent.prompt).toContain("@analyst")
    })

    test("prompt retains architectural principles", () => {
      //#given
      const agent = createArchitectAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Holistic System Thinking")
      expect(agent.prompt).toContain("Progressive Complexity")
    })
  })
  //#endregion

  //#region Analyst - Strategic research
  describe("Analyst (strategic research)", () => {
    test("prompt contains AIOS strategic research scope", () => {
      //#given
      const agent = createAnalystAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Strategic Research & Ideation")
      expect(agent.prompt).toContain("Market and competitive analysis")
      expect(agent.prompt).toContain("Brainstorming facilitation")
    })

    test("metadata includes expanded useWhen triggers", () => {
      //#then
      expect(analystPromptMetadata.useWhen).toContain("Market or competitive research is requested")
      expect(analystPromptMetadata.useWhen).toContain("Structured brainstorming or ideation is needed")
    })
  })
  //#endregion
})

describe("Agent prompt utility refresh", () => {
  //#region Vision metadata rename
  describe("Vision metadata", () => {
    test("VISION_PROMPT_METADATA has correct promptAlias", () => {
      //#then
      expect(VISION_PROMPT_METADATA.promptAlias).toBe("Vision")
    })

    test("VISION_PROMPT_METADATA has keyTrigger and triggers", () => {
      //#then
      expect(VISION_PROMPT_METADATA.keyTrigger).toBeDefined()
      expect(VISION_PROMPT_METADATA.triggers.length).toBeGreaterThan(0)
    })

    test("VISION_PROMPT_METADATA has useWhen and avoidWhen", () => {
      //#then
      expect(VISION_PROMPT_METADATA.useWhen!.length).toBeGreaterThan(0)
      expect(VISION_PROMPT_METADATA.avoidWhen!.length).toBeGreaterThan(0)
    })

    test("createVisionAgent has Kord AIOS branding", () => {
      //#given
      const agent = createVisionAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("Kord AIOS")
      expect(agent.description).toContain("Vision")
    })
  })
  //#endregion

  //#region Builder metadata
  describe("Builder metadata", () => {
    test("promptAlias is Build (not Atlas)", () => {
      //#then
      expect(builderPromptMetadata.promptAlias).toBe("Build")
    })
  })
  //#endregion

  //#region Plan prompt
  describe("Plan prompt", () => {
    test("system prompt contains Kord AIOS path references", () => {
      //#then
      expect(PLAN_SYSTEM_PROMPT).toContain("docs/kord/plans/")
      expect(PLAN_SYSTEM_PROMPT).toContain("docs/kord/drafts/")
    })

    test("system prompt does not reference legacy paths", () => {
      //#then
      expect(PLAN_SYSTEM_PROMPT).not.toContain(".sisyphus/")
    })
  })
  //#endregion
})
