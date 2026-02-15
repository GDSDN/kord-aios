import { describe, test, expect } from "bun:test"
import { createKordAgent } from "./kord"
import { createDevAgent } from "./dev"
import { createQaAgent } from "./qa"
import { createAnalystAgent } from "./analyst"
import { createSmAgent } from "./sm"
import { createPmAgent } from "./pm"
import { createPoAgent } from "./po"
import { createDevopsAgent } from "./devops"
import { createDataEngineerAgent } from "./data-engineer"
import { createUxDesignExpertAgent } from "./ux-design-expert"
import { createSquadCreatorAgent } from "./squad-creator"
import { BUILD_SYSTEM_PROMPT } from "./builder/default"
import { BUILD_GPT_SYSTEM_PROMPT } from "./builder/gpt"
import { INIT_DEEP_TEMPLATE } from "../features/builtin-commands/templates/init-deep"
import { SQUAD_CREATE_TEMPLATE } from "../features/builtin-commands/templates/squad-create"

const TEST_MODEL = "anthropic/claude-sonnet-4-5"

describe("EPIC-09: Agent prompt refinement", () => {
  //#region S01: Kord — AIOS Master Identity + Framework Governance
  describe("S01: Kord — AIOS Master identity", () => {
    test("prompt identifies Kord as AIOS Master", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("AIOS Master")
    })

    test("prompt contains development pipeline framework", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("<Framework>")
      expect(agent.prompt).toContain("story-driven development")
    })

    test("prompt contains process-aware delegation", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("development pipeline")
    })

    test("prompt preserves existing core principles", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Security-first")
      expect(agent.prompt).toContain("Orchestrate with discipline")
      expect(agent.prompt).toContain("Numbered options")
    })

    test("description reflects AIOS Master role", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("AIOS Master")
    })
  })
  //#endregion

  //#region S02: Dev — No merge markers
  describe("S02: Dev — builder principles integrated", () => {
    test("prompt does NOT contain merge marker", () => {
      //#given
      const agent = createDevAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).not.toContain("(AIOS Merge)")
    })

    test("prompt retains builder principle content naturally", () => {
      //#given
      const agent = createDevAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Requirements as contracts")
      expect(agent.prompt).toContain("Numbered options")
    })
  })
  //#endregion

  //#region S07: QA — No merge markers
  describe("S07: QA — quality principles integrated", () => {
    test("prompt does NOT contain merge marker", () => {
      //#given
      const agent = createQaAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).not.toContain("(AIOS Merge)")
    })

    test("prompt retains quality advisory content naturally", () => {
      //#given
      const agent = createQaAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Risk-based review")
      expect(agent.prompt).toContain("Gate governance")
    })
  })
  //#endregion

  //#region S08: Analyst — No merge markers
  describe("S08: Analyst — research scope integrated", () => {
    test("prompt does NOT contain merge marker", () => {
      //#given
      const agent = createAnalystAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).not.toContain("(AIOS Merge)")
    })

    test("prompt retains strategic research content naturally", () => {
      //#given
      const agent = createAnalystAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Market and competitive analysis")
      expect(agent.prompt).toContain("Brainstorming facilitation")
    })
  })
  //#endregion

  //#region Global: No legacy references in ANY agent prompt
  describe("Global: no legacy references", () => {
    test("no agent prompt contains legacy markers", () => {
      //#given
      const kord = createKordAgent(TEST_MODEL)
      const dev = createDevAgent(TEST_MODEL)
      const qa = createQaAgent(TEST_MODEL)
      const analyst = createAnalystAgent(TEST_MODEL)

      const allPrompts = [kord, dev, qa, analyst].map(a => a.prompt as string)

      //#then
      for (const prompt of allPrompts) {
        expect(prompt).not.toContain("(AIOS Merge)")
        expect(prompt).not.toContain("OMOC")
        expect(prompt).not.toContain("Synkra")
      }
    })
  })
  //#endregion
})

describe("EPIC-10: Agent architecture refinement", () => {
  //#region S01: Dev — Mode "all" + delegation hierarchy
  describe("S01: Dev — mode and delegation hierarchy", () => {
    test("Dev mode is 'all'", () => {
      //#then
      expect(createDevAgent.mode).toBe("all")
    })

    test("Dev description mentions invocability", () => {
      //#given
      const agent = createDevAgent(TEST_MODEL)

      //#then
      expect(agent.description).toContain("Invocable by orchestrators")
    })

    test("agent prompts that reference @dev also reference @dev-junior", () => {
      //#given — agents whose prompts have collaboration/constraints mentioning dev
      const agents = [
        createPmAgent(TEST_MODEL),
        createPoAgent(TEST_MODEL),
        createSmAgent(TEST_MODEL),
        createDevopsAgent(TEST_MODEL),
        createDataEngineerAgent(TEST_MODEL),
        createUxDesignExpertAgent(TEST_MODEL),
      ]

      //#then — all should use @dev/@dev-junior pattern in collaboration sections
      for (const agent of agents) {
        expect(agent.prompt).toContain("@dev/@dev-junior")
      }
    })
  })
  //#endregion

  //#region S02: Build — Story/plan awareness
  describe("S02: Build — story/plan awareness", () => {
    test("default Build prompt has framework section", () => {
      //#then
      expect(BUILD_SYSTEM_PROMPT).toContain("<framework>")
      expect(BUILD_SYSTEM_PROMPT).toContain("docs/kord/plans/")
      expect(BUILD_SYSTEM_PROMPT).toContain("boulder.json")
    })

    test("GPT Build prompt has framework section", () => {
      //#then
      expect(BUILD_GPT_SYSTEM_PROMPT).toContain("<framework>")
      expect(BUILD_GPT_SYSTEM_PROMPT).toContain("docs/kord/plans/")
      expect(BUILD_GPT_SYSTEM_PROMPT).toContain("boulder.json")
    })

    test("Build framework mentions Dev-Junior as default executor", () => {
      //#then
      expect(BUILD_SYSTEM_PROMPT).toContain("Dev-Junior is the default executor")
      expect(BUILD_GPT_SYSTEM_PROMPT).toContain("Dev-Junior = default executor")
    })
  })
  //#endregion

  //#region S03: Kord — Guardian consciousness
  describe("S03: Kord — SystemAwareness", () => {
    test("Kord prompt contains SystemAwareness section", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("<SystemAwareness>")
      expect(agent.prompt).toContain("Plugin Architecture")
    })

    test("SystemAwareness contains agent hierarchy table", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Agent Hierarchy")
      expect(agent.prompt).toContain("dev | all")
      expect(agent.prompt).toContain("dev-junior | subagent")
    })

    test("SystemAwareness contains framework locations", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Framework Locations")
      expect(agent.prompt).toContain("docs/kord/plans/")
      expect(agent.prompt).toContain(".kord/skills/")
      expect(agent.prompt).toContain("boulder.json")
    })

    test("SystemAwareness contains delegation model", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Delegation Model")
      expect(agent.prompt).toContain("Dev-Junior is the DEFAULT executor")
    })

    test("SystemAwareness contains self-analysis capability", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("Self-Analysis")
    })
  })
  //#endregion

  //#region S04: Agent communication
  describe("S04: Agent communication — inter-agent clarification", () => {
    test("PM collaboration mentions call_kord_agent for SM", () => {
      //#given
      const agent = createPmAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("call_kord_agent")
    })

    test("SM collaboration mentions call_kord_agent for PM/PO", () => {
      //#given
      const agent = createSmAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("call_kord_agent")
    })

    test("PO collaboration mentions call_kord_agent for SM", () => {
      //#given
      const agent = createPoAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("call_kord_agent")
    })
  })
  //#endregion

  //#region S05-S06: Init-deep
  describe("S05-S06: /init-deep brownfield + framework consciousness", () => {
    test("init-deep has Phase 0 maturity detection", () => {
      //#then
      expect(INIT_DEEP_TEMPLATE).toContain("Phase 0: Project Maturity Detection")
      expect(INIT_DEEP_TEMPLATE).toContain("brownfield")
      expect(INIT_DEEP_TEMPLATE).toContain("greenfield")
    })

    test("init-deep TodoWrite includes maturity task", () => {
      //#then
      expect(INIT_DEEP_TEMPLATE).toContain('"maturity"')
    })

    test("init-deep Phase 5a uses dynamic agent discovery", () => {
      //#then
      expect(INIT_DEEP_TEMPLATE).toContain("Discover agents dynamically")
      expect(INIT_DEEP_TEMPLATE).not.toContain("| kord | Primary orchestrator | orchestration |")
    })

    test("init-deep has framework consciousness section (5f)", () => {
      //#then
      expect(INIT_DEEP_TEMPLATE).toContain("HOW KORD AIOS WORKS")
      expect(INIT_DEEP_TEMPLATE).toContain("Delegation Model")
      expect(INIT_DEEP_TEMPLATE).toContain("Story-Driven Pipeline")
      expect(INIT_DEEP_TEMPLATE).toContain("Skill System")
    })

    test("init-deep delegation ref uses Dev-Junior as default", () => {
      //#then
      expect(INIT_DEEP_TEMPLATE).toContain("Dev-Junior (atomic tasks via category)")
    })
  })
  //#endregion

  //#region EPIC-11 S05: Squad Creator v2 schema references
  describe("S05: Squad Creator — v2 schema references", () => {
    test("prompt references prompt_file in SQUAD.yaml template", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("prompt_file")
    })

    test("prompt references tags and kord.minVersion", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("tags:")
      expect(agent.prompt).toContain("minVersion")
    })

    test("prompt references README.md in squad structure", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("README.md")
    })

    test("prompt references squad_validate tool", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("squad_validate")
    })

    test("prompt references SKILL.md format in skills directory", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("SKILL.md")
    })

    test("output format lists v2 manifest artifacts", () => {
      //#given
      const agent = createSquadCreatorAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("v2 manifest")
      expect(agent.prompt).toContain("agents/*.md")
      expect(agent.prompt).toContain("skills/*/SKILL.md")
    })
  })
  //#endregion

  //#region EPIC-11 S06: /squad-create command template
  describe("S06: /squad-create command template", () => {
    test("template delegates to squad-creator agent", () => {
      //#then
      expect(SQUAD_CREATE_TEMPLATE).toContain("squad-creator")
      expect(SQUAD_CREATE_TEMPLATE).toContain("call_kord_agent")
    })

    test("template references squad_validate for post-creation check", () => {
      //#then
      expect(SQUAD_CREATE_TEMPLATE).toContain("squad_validate")
    })

    test("template shows usage when no arguments", () => {
      //#then
      expect(SQUAD_CREATE_TEMPLATE).toContain("/squad-create <domain-name>")
      expect(SQUAD_CREATE_TEMPLATE).toContain("$ARGUMENTS")
    })

    test("template references v2 manifest in usage", () => {
      //#then
      expect(SQUAD_CREATE_TEMPLATE).toContain("SQUAD.yaml")
      expect(SQUAD_CREATE_TEMPLATE).toContain("agents/*.md")
      expect(SQUAD_CREATE_TEMPLATE).toContain("skills/*/SKILL.md")
    })

    test("template mentions v2 schema fields in delegation task", () => {
      //#then
      expect(SQUAD_CREATE_TEMPLATE).toContain("prompt_file")
      expect(SQUAD_CREATE_TEMPLATE).toContain("tags")
      expect(SQUAD_CREATE_TEMPLATE).toContain("kord.minVersion")
    })
  })
  //#endregion

  //#region EPIC-11 S07: Kord SystemAwareness — Squad System
  describe("S07: Kord SystemAwareness — Squad System", () => {
    test("SystemAwareness contains Squad System section", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("### Squad System")
    })

    test("SystemAwareness shows delegation syntax task(subagent_type=...)", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain('task(subagent_type="{agent-name}"')
    })

    test("SystemAwareness shows category routing syntax task(category=...)", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain('task(category="{squad}:{category}"')
    })

    test("SystemAwareness references squad_validate tool", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("squad_validate")
    })

    test("SystemAwareness references /squad-create command", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("/squad-create")
    })

    test("SystemAwareness mentions SQUAD.yaml manifest", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain("SQUAD.yaml")
    })

    test("SystemAwareness mentions squad search paths", () => {
      //#given
      const agent = createKordAgent(TEST_MODEL)

      //#then
      expect(agent.prompt).toContain(".kord/squads/")
      expect(agent.prompt).toContain(".opencode/squads/")
      expect(agent.prompt).toContain("docs/kord/squads/")
    })
  })
  //#endregion
})
