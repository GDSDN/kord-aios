import { describe, expect, test } from "bun:test"
import { createPmAgent } from "./pm"
import { createPoAgent } from "./po"
import { createSmAgent } from "./sm"
import { createQaAgent } from "./qa"
import { createDevopsAgent } from "./devops"
import { createDataEngineerAgent } from "./data-engineer"
import { createUxDesignExpertAgent } from "./ux-design-expert"
import { createSquadCreatorAgent } from "./squad-creator"
import { createAnalystAgent } from "./analyst"
import { createPlanAnalyzerAgent } from "./plan-analyzer"
import { createPlanReviewerAgent } from "./plan-reviewer"

const TEST_MODEL = "anthropic/claude-sonnet-4-5"

describe("T2 agents embed markdown defaults", () => {
  const cases = [
    {
      name: "pm",
      create: createPmAgent,
      anchors: ["Product Visionary", "Problem Statement"],
    },
    {
      name: "po",
      create: createPoAgent,
      anchors: ["Backlog Guardian", "PASS", "NEEDS_WORK"],
    },
    {
      name: "sm",
      create: createSmAgent,
      anchors: ["Story Architect", "STATELESS"],
    },
    {
      name: "qa",
      create: createQaAgent,
      anchors: ["Quality Guardian", "OKAY with CONCERNS"],
    },
    {
      name: "devops",
      create: createDevopsAgent,
      anchors: ["Pipeline Protector", "rollback"],
    },
    {
      name: "data-engineer",
      create: createDataEngineerAgent,
      anchors: ["Database Architect", "Correctness before speed"],
    },
    {
      name: "ux-design-expert",
      create: createUxDesignExpertAgent,
      anchors: ["Interface Soul", "Atomic Design"],
    },
    {
      name: "squad-creator",
      create: createSquadCreatorAgent,
      anchors: ["Squad Assembler", "SQUAD.yaml"],
    },
    {
      name: "analyst",
      create: createAnalystAgent,
      anchors: ["Strategic Research & Ideation", "Intent Classification"],
    },
    {
      name: "plan-analyzer",
      create: createPlanAnalyzerAgent,
      anchors: ["Plan Analyzer", "Intent Classification"],
    },
    {
      name: "plan-reviewer",
      create: createPlanReviewerAgent,
      anchors: ["work plan reviewer", "APPROVAL BIAS"],
    },
  ]

  for (const { name, create, anchors } of cases) {
    test(`${name}: prompt is non-empty and preserves anchor phrases`, () => {
      const agent = create(TEST_MODEL)
      expect(typeof agent.prompt).toBe("string")
      expect((agent.prompt as string).trim().length).toBeGreaterThan(100)

      for (const anchor of anchors) {
        expect(agent.prompt).toContain(anchor)
      }
    })
  }
})
