import { describe, test, expect } from "bun:test"
import { buildSquadPromptSection } from "./factory"
import type { LoadedSquad } from "./loader"
import { createKordAgent } from "../../agents/kord"

// Test fixtures - manually constructed LoadedSquad objects
const marketingSquad: LoadedSquad = {
  manifest: {
    name: "marketing",
    description: "Marketing team",
    version: "1.0.0",
    agents: {
      copywriter: {
        description: "Expert copywriter",
        mode: "subagent",
        skills: ["brand-voice"],
        is_chief: false,
        tools: {},
      },
      designer: {
        description: "Visual designer",
        mode: "subagent",
        skills: [],
        is_chief: false,
        tools: {},
      },
      "brand-chief": {
        description: "Marketing squad chief",
        mode: "subagent",
        skills: [],
        is_chief: true,
        tools: {},
      },
    },
    components: {
      workflows: ["workflows/marketing-campaign.yaml"],
      tasks: ["tasks/write-copy.md", "tasks/design-assets.md"],
    },
    orchestration: {
      runner: "workflow-engine",
      delegation_mode: "chief",
      entry_workflow: "marketing-campaign",
    },
    contract_type: "campaign",
  },
  source: "user",
  basePath: "/test/marketing",
  resolvedPrompts: {},
}

const devSquad: LoadedSquad = {
  manifest: {
    name: "dev",
    description: "Development team",
    version: "1.0.0",
    agents: {
      frontend: {
        description: "Frontend developer",
        mode: "subagent",
        skills: ["react", "typescript"],
        is_chief: false,
        tools: {},
      },
      "dev-chief": {
        description: "Development squad chief",
        mode: "subagent",
        skills: [],
        is_chief: true,
        tools: {},
      },
    },
    contract_type: "task",
  },
  source: "user",
  basePath: "/test/dev",
  resolvedPrompts: {},
}

const minimalSquad: LoadedSquad = {
  manifest: {
    name: "minimal",
    description: "Minimal squad without categories",
    version: "1.0.0",
    agents: {
      worker: {
        description: "General worker",
        mode: "subagent",
        skills: [],
        is_chief: false,
        tools: {},
      },
    },
    contract_type: "task",
  },
  source: "user",
  basePath: "/test/minimal",
  resolvedPrompts: {},
}

describe("buildSquadPromptSection", () => {
  test("returns empty string for 0 squads", () => {
    //#given
    const squads: LoadedSquad[] = []
    //#when
    const result = buildSquadPromptSection(squads)
    //#then
    expect(result).toBe("")
  })

  test("returns formatted section for 1 squad", () => {
    //#given
    const squads: LoadedSquad[] = [marketingSquad]
    //#when
    const result = buildSquadPromptSection(squads)
    //#then
    expect(result).toContain("### Available Squads")
    expect(result).toContain("| Squad | Domain | Agents | Chief |")
    expect(result).toContain("marketing")
    expect(result).toContain("Marketing team")
    expect(result).toContain("@squad-marketing-copywriter")
    expect(result).toContain("@squad-marketing-designer")
    expect(result).toContain("@squad-marketing-brand-chief")
    expect(result).toContain("task(subagent_type=")
    expect(result).toContain("squad-marketing-brand-chief")
  })

  test("lists all squads for N squads", () => {
    //#given
    const squads: LoadedSquad[] = [marketingSquad, devSquad]
    //#when
    const result = buildSquadPromptSection(squads)
    //#then
    expect(result).toContain("marketing")
    expect(result).toContain("dev")
    expect(result).toContain("Marketing team")
    expect(result).toContain("Development team")
  })

  test("includes delegation syntax for all agents", () => {
    //#given
    const squads: LoadedSquad[] = [marketingSquad]
    //#when
    const result = buildSquadPromptSection(squads)
    //#then
    expect(result).toContain('task(subagent_type="squad-marketing-copywriter")')
    expect(result).toContain('task(subagent_type="squad-marketing-designer")')
    expect(result).toContain('task(subagent_type="squad-marketing-brand-chief")')
  })

  test("does not include deprecated category routing in prompt output", () => {
    //#given
    const squads: LoadedSquad[] = [marketingSquad]
    //#when
    const result = buildSquadPromptSection(squads)
    //#then
    expect(result).not.toContain("### Squad Categories")
    expect(result).not.toContain("marketing:creative")
    expect(result).not.toContain("marketing:visual")
    expect(result).not.toContain("task(category=")
  })

  test("omits deprecated category routing section when components are absent", () => {
    //#given
    const squads: LoadedSquad[] = [minimalSquad]
    //#when
    const result = buildSquadPromptSection(squads)
    //#then
    expect(result).not.toContain("### Squad Categories")
    expect(result).not.toContain("task(category=")
  })

  test("includes skills when present", () => {
    //#given
    const squads: LoadedSquad[] = [marketingSquad]
    //#when
    const result = buildSquadPromptSection(squads)
    //#then
    expect(result).toContain("### Squad Skills")
    expect(result).toContain("brand-voice")
  })
})

describe("squad awareness injection in createKordAgent", () => {
  test("kord prompt contains Squad_Awareness when squads passed", () => {
    //#given
    const squads: LoadedSquad[] = [marketingSquad]
    //#when
    const result = createKordAgent("test-model", [], [], [], [], false, squads)
    //#then
    expect(result.prompt).toContain("<Squad_Awareness>")
    expect(result.prompt).toContain("</Squad_Awareness>")
    expect(result.prompt).toContain("### Available Squads")
    expect(result.prompt).toContain("marketing")
  })

  test("kord prompt has no Squad_Awareness when 0 squads passed", () => {
    //#given
    const squads: LoadedSquad[] = []
    //#when
    const result = createKordAgent("test-model", [], [], [], [], false, squads)
    //#then
    expect(result.prompt).not.toContain("<Squad_Awareness>")
    expect(result.prompt).not.toContain("</Squad_Awareness>")
  })

  test("kord prompt has no Squad_Awareness when squads undefined", () => {
    //#given - no squads argument
    //#when
    const result = createKordAgent("test-model", [], [], [], [], false)
    //#then
    expect(result.prompt).not.toContain("<Squad_Awareness>")
    expect(result.prompt).not.toContain("</Squad_Awareness>")
  })

  test("kord prompt includes delegation syntax from squads", () => {
    //#given
    const squads: LoadedSquad[] = [marketingSquad]
    //#when
    const result = createKordAgent("test-model", [], [], [], [], false, squads)
    //#then
    expect(result.prompt).toContain("task(subagent_type=")
    expect(result.prompt).toContain("squad-marketing-copywriter")
    expect(result.prompt).toContain("squad-marketing-brand-chief")
  })

  test("kord prompt includes chief agent reference", () => {
    //#given
    const squads: LoadedSquad[] = [marketingSquad]
    //#when
    const result = createKordAgent("test-model", [], [], [], [], false, squads)
    //#then
    expect(result.prompt).toContain("@squad-marketing-brand-chief")
    expect(result.prompt).toContain("Chief")
  })
})
