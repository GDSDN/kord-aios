import { describe, test, expect } from "bun:test"
import { createSmAgent, smPromptMetadata } from "./sm"
import { createPmAgent, pmPromptMetadata } from "./pm"
import { createPoAgent, poPromptMetadata } from "./po"
import { createDevopsAgent, devopsPromptMetadata } from "./devops"
import { createDataEngineerAgent, dataEngineerPromptMetadata } from "./data-engineer"
import { createUxDesignExpertAgent, uxDesignExpertPromptMetadata } from "./ux-design-expert"
import { createSquadCreatorAgent, squadCreatorPromptMetadata } from "./squad-creator"

const TEST_MODEL = "anthropic/claude-sonnet-4-5"

describe("Wave 1 new agent factories", () => {
  //#region SM Agent
  describe("SM (Story Architect)", () => {
    test("creates agent with correct mode and temperature", () => {
      //#given
      const agent = createSmAgent(TEST_MODEL)

      //#then
      expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.1)
      expect(agent.model).toBe(TEST_MODEL)
    })

    test("has Kord AIOS branding in description", () => {
      //#given
      const agent = createSmAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("Kord AIOS")
      expect(agent.description).not.toContain("OhMyOpenCode")
    })

    test("prompt contains story creation methodology", () => {
      //#given
      const agent = createSmAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Story Architect")
      expect(agent.prompt).toContain("crystal-clear")
      expect(agent.prompt).toContain("acceptance criteria")
    })

    test("prompt enforces read-only constraint (no implementation)", () => {
      //#given
      const agent = createSmAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("MUST NOT implement")
    })

    test("has correct metadata", () => {
      //#then
      expect(smPromptMetadata.category).toBe("specialist")
      expect(smPromptMetadata.promptAlias).toBe("SM")
      expect(smPromptMetadata.triggers.length).toBeGreaterThan(0)
      expect(smPromptMetadata.useWhen!.length).toBeGreaterThan(0)
      expect(smPromptMetadata.avoidWhen!.length).toBeGreaterThan(0)
    })

    test("factory has correct mode property", () => {
      //#then
      expect(createSmAgent.mode).toBe("subagent")
    })
  })
  //#endregion

  //#region PM Agent
  describe("PM (Product Visionary)", () => {
    test("creates agent with correct mode and temperature", () => {
      //#given
      const agent = createPmAgent(TEST_MODEL)

      //#then
      expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.1)
      expect(agent.model).toBe(TEST_MODEL)
    })

    test("has Kord AIOS branding in description", () => {
      //#given
      const agent = createPmAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("Kord AIOS")
    })

    test("prompt contains PRD methodology", () => {
      //#given
      const agent = createPmAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Product Visionary")
      expect(agent.prompt).toContain("PRD")
      expect(agent.prompt).toContain("Problem Statement")
    })

    test("prompt enforces no-emulation constraint", () => {
      //#given
      const agent = createPmAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("MUST NOT emulate other agents")
    })

    test("has correct metadata", () => {
      //#then
      expect(pmPromptMetadata.category).toBe("specialist")
      expect(pmPromptMetadata.promptAlias).toBe("PM")
    })

    test("factory has correct mode property", () => {
      //#then
      expect(createPmAgent.mode).toBe("subagent")
    })
  })
  //#endregion

  //#region PO Agent
  describe("PO (Backlog Guardian)", () => {
    test("creates agent with correct mode and temperature", () => {
      //#given
      const agent = createPoAgent(TEST_MODEL)

      //#then
      expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.1)
      expect(agent.model).toBe(TEST_MODEL)
    })

    test("has Kord AIOS branding in description", () => {
      //#given
      const agent = createPoAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("Kord AIOS")
    })

    test("prompt contains validation checklist", () => {
      //#given
      const agent = createPoAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Backlog Guardian")
      expect(agent.prompt).toContain("PASS")
      expect(agent.prompt).toContain("NEEDS_WORK")
      expect(agent.prompt).toContain("Acceptance Criteria")
    })

    test("has correct metadata", () => {
      //#then
      expect(poPromptMetadata.category).toBe("specialist")
      expect(poPromptMetadata.promptAlias).toBe("PO")
    })

    test("factory has correct mode property", () => {
      //#then
      expect(createPoAgent.mode).toBe("subagent")
    })
  })
  //#endregion

  //#region DevOps Agent
  describe("DevOps (Pipeline Protector)", () => {
    test("creates agent with correct mode and temperature", () => {
      //#given
      const agent = createDevopsAgent(TEST_MODEL)

      //#then
      expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.1)
      expect(agent.model).toBe(TEST_MODEL)
    })

    test("has Kord AIOS branding in description", () => {
      //#given
      const agent = createDevopsAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("Kord AIOS")
    })

    test("prompt contains CI/CD and deployment methodology", () => {
      //#given
      const agent = createDevopsAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Pipeline Protector")
      expect(agent.prompt).toContain("CI/CD")
      expect(agent.prompt).toContain("rollback")
      expect(agent.prompt).toContain("GitHub Actions")
    })

    test("has correct metadata with multiple triggers", () => {
      //#then
      expect(devopsPromptMetadata.category).toBe("specialist")
      expect(devopsPromptMetadata.promptAlias).toBe("DevOps")
      expect(devopsPromptMetadata.triggers.length).toBeGreaterThanOrEqual(2)
    })

    test("factory has correct mode property", () => {
      //#then
      expect(createDevopsAgent.mode).toBe("subagent")
    })
  })
  //#endregion

  //#region Data Engineer Agent
  describe("Data Engineer (Database Architect)", () => {
    test("creates agent with correct mode and temperature", () => {
      //#given
      const agent = createDataEngineerAgent(TEST_MODEL)

      //#then
      expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.1)
      expect(agent.model).toBe(TEST_MODEL)
    })

    test("has Kord AIOS branding in description", () => {
      //#given
      const agent = createDataEngineerAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("Kord AIOS")
    })

    test("prompt contains database methodology", () => {
      //#given
      const agent = createDataEngineerAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Database Architect")
      expect(agent.prompt).toContain("RLS")
      expect(agent.prompt).toContain("migration")
      expect(agent.prompt).toContain("Correctness before speed")
    })

    test("prompt contains security principles", () => {
      //#given
      const agent = createDataEngineerAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Security by default")
      expect(agent.prompt).toContain("COMMENT ON")
    })

    test("has correct metadata", () => {
      //#then
      expect(dataEngineerPromptMetadata.category).toBe("specialist")
      expect(dataEngineerPromptMetadata.promptAlias).toBe("Data Engineer")
      expect(dataEngineerPromptMetadata.triggers.length).toBeGreaterThanOrEqual(3)
    })

    test("factory has correct mode property", () => {
      //#then
      expect(createDataEngineerAgent.mode).toBe("subagent")
    })
  })
  //#endregion

  //#region UX Design Expert Agent
  describe("UX Design Expert (Interface Soul)", () => {
    test("creates agent with correct mode and temperature", () => {
      //#given
      const agent = createUxDesignExpertAgent(TEST_MODEL)

      //#then
      expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.1)
      expect(agent.model).toBe(TEST_MODEL)
    })

    test("has Kord AIOS branding in description", () => {
      //#given
      const agent = createUxDesignExpertAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("Kord AIOS")
    })

    test("prompt contains Atomic Design framework", () => {
      //#given
      const agent = createUxDesignExpertAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Atomic Design")
      expect(agent.prompt).toContain("Atoms")
      expect(agent.prompt).toContain("Molecules")
      expect(agent.prompt).toContain("Organisms")
    })

    test("prompt contains accessibility requirements", () => {
      //#given
      const agent = createUxDesignExpertAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("WCAG")
      expect(agent.prompt).toContain("accessibility")
    })

    test("has correct metadata", () => {
      //#then
      expect(uxDesignExpertPromptMetadata.category).toBe("specialist")
      expect(uxDesignExpertPromptMetadata.promptAlias).toBe("UX Design Expert")
    })

    test("factory has correct mode property", () => {
      //#then
      expect(createUxDesignExpertAgent.mode).toBe("subagent")
    })
  })
  //#endregion

  //#region Squad Creator Agent
  describe("Squad Creator (Squad Assembler)", () => {
    test("creates agent with correct mode and elevated temperature", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.2)
      expect(agent.model).toBe(TEST_MODEL)
    })

    test("has Kord AIOS branding in description", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("Kord AIOS")
    })

    test("prompt contains squad creation methodology", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Squad Assembler")
      expect(agent.prompt).toContain("SQUAD.yaml")
      expect(agent.prompt).toContain("Task-first architecture")
    })

    test("prompt contains creation workflow", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Domain Research")
      expect(agent.prompt).toContain("Agent Design")
      expect(agent.prompt).toContain("Validation")
    })

    test("has correct metadata as utility category", () => {
      //#then
      expect(squadCreatorPromptMetadata.category).toBe("utility")
      expect(squadCreatorPromptMetadata.cost).toBe("EXPENSIVE")
      expect(squadCreatorPromptMetadata.promptAlias).toBe("Squad Creator")
    })

    test("factory has correct mode property", () => {
      //#then
      expect(createSquadCreatorAgent.mode).toBe("subagent")
    })
  })
  //#endregion

  //#region Cross-cutting concerns
  describe("All new agents - cross-cutting", () => {
    const factories = [
      { name: "sm", create: createSmAgent, meta: smPromptMetadata },
      { name: "pm", create: createPmAgent, meta: pmPromptMetadata },
      { name: "po", create: createPoAgent, meta: poPromptMetadata },
      { name: "devops", create: createDevopsAgent, meta: devopsPromptMetadata },
      { name: "data-engineer", create: createDataEngineerAgent, meta: dataEngineerPromptMetadata },
      { name: "ux-design-expert", create: createUxDesignExpertAgent, meta: uxDesignExpertPromptMetadata },
      { name: "squad-creator", create: createSquadCreatorAgent, meta: squadCreatorPromptMetadata },
    ]

    for (const { name, create, meta } of factories) {
      test(`${name}: factory mode is subagent`, () => {
      expect(create.mode).toBe("subagent")
      })

      test(`${name}: metadata has keyTrigger`, () => {
        expect(meta.keyTrigger).toBeDefined()
        expect(typeof meta.keyTrigger).toBe("string")
      })

      test(`${name}: metadata has at least one trigger`, () => {
        expect(meta.triggers.length).toBeGreaterThan(0)
      })

      test(`${name}: agent has prompt`, () => {
        //#given
        const agent = create(TEST_MODEL)

        //#then
        expect(agent.prompt).toBeDefined()
        expect(typeof agent.prompt).toBe("string")
        expect((agent.prompt as string).length).toBeGreaterThan(100)
      })

      test(`${name}: description does not reference OhMyOpenCode`, () => {
        //#given
        const agent = create(TEST_MODEL)

        //#then
        expect(agent.description).not.toContain("OhMyOpenCode")
      })
    }
  })
  //#endregion
})
