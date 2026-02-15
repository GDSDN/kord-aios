import { describe, expect, test } from "bun:test"
import {
  AGENT_MODEL_REQUIREMENTS,
  CATEGORY_MODEL_REQUIREMENTS,
  type FallbackEntry,
  type ModelRequirement,
} from "./model-requirements"

describe("AGENT_MODEL_REQUIREMENTS", () => {
  test("architect has valid fallbackChain with gpt-5.2 as primary", () => {
    // given - architect agent requirement
    const architect = AGENT_MODEL_REQUIREMENTS["architect"]

    // when - accessing architect requirement
    // then - fallbackChain exists with gpt-5.2 as first entry
    expect(architect).toBeDefined()
    expect(architect.fallbackChain).toBeArray()
    expect(architect.fallbackChain.length).toBeGreaterThan(0)

    const primary = architect.fallbackChain[0]
    expect(primary.providers).toContain("openai")
    expect(primary.model).toBe("gpt-5.2")
    expect(primary.variant).toBe("high")
  })

  test("kord has claude-opus-4-6 as primary and requiresAnyModel", () => {
    // #given - kord agent requirement
    const kord = AGENT_MODEL_REQUIREMENTS["kord"]

    // #when - accessing Kord requirement
    // #then - fallbackChain has claude-opus-4-6 first, glm-4.7-free last
    expect(kord).toBeDefined()
    expect(kord.fallbackChain).toBeArray()
    expect(kord.fallbackChain).toHaveLength(5)
    expect(kord.requiresAnyModel).toBe(true)

    const primary = kord.fallbackChain[0]
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.variant).toBe("max")

    const last = kord.fallbackChain[4]
    expect(last.providers[0]).toBe("opencode")
    expect(last.model).toBe("glm-4.7-free")
  })

  test("librarian has valid fallbackChain with glm-4.7 as primary", () => {
    // given - librarian agent requirement
    const librarian = AGENT_MODEL_REQUIREMENTS["librarian"]

    // when - accessing librarian requirement
    // then - fallbackChain exists with glm-4.7 as first entry
    expect(librarian).toBeDefined()
    expect(librarian.fallbackChain).toBeArray()
    expect(librarian.fallbackChain.length).toBeGreaterThan(0)

    const primary = librarian.fallbackChain[0]
    expect(primary.providers[0]).toBe("zai-coding-plan")
    expect(primary.model).toBe("glm-4.7")
  })

  test("explore has valid fallbackChain with grok-code-fast-1 as primary", () => {
    // given - explore agent requirement
    const explore = AGENT_MODEL_REQUIREMENTS["explore"]

    // when - accessing explore requirement
    // then - fallbackChain exists with grok-code-fast-1 as first entry, claude-haiku-4-5 as second
    expect(explore).toBeDefined()
    expect(explore.fallbackChain).toBeArray()
    expect(explore.fallbackChain).toHaveLength(3)

    const primary = explore.fallbackChain[0]
    expect(primary.providers).toContain("github-copilot")
    expect(primary.model).toBe("grok-code-fast-1")

    const secondary = explore.fallbackChain[1]
    expect(secondary.providers).toContain("anthropic")
    expect(secondary.providers).toContain("opencode")
    expect(secondary.model).toBe("claude-haiku-4-5")

    const tertiary = explore.fallbackChain[2]
    expect(tertiary.providers).toContain("opencode")
    expect(tertiary.model).toBe("gpt-5-nano")
  })

  test("vision has valid fallbackChain with gemini-3-flash as primary", () => {
    // given - vision agent requirement
    const multimodalLooker = AGENT_MODEL_REQUIREMENTS["vision"]

    // when - accessing vision requirement
    // then - fallbackChain exists with gemini-3-flash as first entry
    expect(multimodalLooker).toBeDefined()
    expect(multimodalLooker.fallbackChain).toBeArray()
    expect(multimodalLooker.fallbackChain.length).toBeGreaterThan(0)

    const primary = multimodalLooker.fallbackChain[0]
    expect(primary.providers[0]).toBe("google")
    expect(primary.model).toBe("gemini-3-flash")
  })

  test("planner has claude-opus-4-6 as primary", () => {
    // #given - planner agent requirement
    const planner = AGENT_MODEL_REQUIREMENTS["planner"]

    // #when - accessing Planner requirement
    // #then - claude-opus-4-6 is first
    expect(planner).toBeDefined()
    expect(planner.fallbackChain).toBeArray()
    expect(planner.fallbackChain.length).toBeGreaterThan(1)

    const primary = planner.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(primary.variant).toBe("max")
  })

  test("plan-analyzer has claude-opus-4-6 as primary", () => {
    // #given - plan-analyzer agent requirement
    const planAnalyzer = AGENT_MODEL_REQUIREMENTS["plan-analyzer"]

    // #when - accessing plan-analyzer requirement
    // #then - claude-opus-4-6 is first
    expect(planAnalyzer).toBeDefined()
    expect(planAnalyzer.fallbackChain).toBeArray()
    expect(planAnalyzer.fallbackChain.length).toBeGreaterThan(1)

    const primary = planAnalyzer.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(primary.variant).toBe("max")
  })

  test("plan-reviewer has gpt-5.2 as primary", () => {
    // #given - plan-reviewer agent requirement
    const planReviewer = AGENT_MODEL_REQUIREMENTS["plan-reviewer"]

    // #when - accessing plan-reviewer requirement
    // #then - gpt-5.2 is first
    expect(planReviewer).toBeDefined()
    expect(planReviewer.fallbackChain).toBeArray()
    expect(planReviewer.fallbackChain.length).toBeGreaterThan(0)

    const primary = planReviewer.fallbackChain[0]
    expect(primary.model).toBe("gpt-5.2")
    expect(primary.providers[0]).toBe("openai")
    expect(primary.variant).toBe("medium")
  })

  test("analyst has claude-opus-4-6 as primary", () => {
    // #given - analyst agent requirement
    const analyst = AGENT_MODEL_REQUIREMENTS["analyst"]

    // #when - accessing Analyst requirement
    // #then - claude-opus-4-6 is first
    expect(analyst).toBeDefined()
    expect(analyst.fallbackChain).toBeArray()
    expect(analyst.fallbackChain.length).toBeGreaterThan(1)

    const primary = analyst.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(primary.variant).toBe("max")
  })

  test("qa has valid fallbackChain with gpt-5.2 as primary", () => {
    // given - qa agent requirement
    const qa = AGENT_MODEL_REQUIREMENTS["qa"]

    // when - accessing QA requirement
    // then - fallbackChain exists with gpt-5.2 as first entry, variant medium
    expect(qa).toBeDefined()
    expect(qa.fallbackChain).toBeArray()
    expect(qa.fallbackChain.length).toBeGreaterThan(0)

    const primary = qa.fallbackChain[0]
    expect(primary.model).toBe("gpt-5.2")
    expect(primary.variant).toBe("medium")
    expect(primary.providers[0]).toBe("openai")
  })

  test("build has valid fallbackChain with k2p5 as primary (kimi-for-coding prioritized)", () => {
    // given - build agent requirement
    const build = AGENT_MODEL_REQUIREMENTS["builder"]

    // when - accessing Atlas requirement
    // then - fallbackChain exists with k2p5 as first entry (kimi-for-coding prioritized)
    expect(build).toBeDefined()
    expect(build.fallbackChain).toBeArray()
    expect(build.fallbackChain.length).toBeGreaterThan(0)

    const primary = build.fallbackChain[0]
    expect(primary.model).toBe("k2p5")
    expect(primary.providers[0]).toBe("kimi-for-coding")
  })

  test("dev requires openai/github-copilot/opencode provider", () => {
    // #given - dev agent requirement
    const dev = AGENT_MODEL_REQUIREMENTS["dev"]

    // #when - accessing dev requirement
    // #then - requiresProvider is set to openai, github-copilot, opencode (not requiresModel)
    expect(dev).toBeDefined()
    expect(dev.requiresProvider).toEqual(["openai", "github-copilot", "opencode"])
    expect(dev.requiresModel).toBeUndefined()
  })

  test("all builtin agents have valid fallbackChain arrays", () => {
    // #given - list of agent names
    const expectedAgents = [
      "kord",
      "dev",
      "architect",
      "librarian",
      "explore",
      "vision",
      "planner",
      "analyst",
      "plan-analyzer",
      "plan-reviewer",
      "qa",
      "builder",
      "sm",
      "pm",
      "po",
      "devops",
      "data-engineer",
      "ux-design-expert",
      "squad-creator",
    ]

    // when - checking AGENT_MODEL_REQUIREMENTS
    const definedAgents = Object.keys(AGENT_MODEL_REQUIREMENTS)

    // #then - all agents present with valid fallbackChain
    expect(definedAgents).toHaveLength(19)
    for (const agent of expectedAgents) {
      const requirement = AGENT_MODEL_REQUIREMENTS[agent]
      expect(requirement).toBeDefined()
      expect(requirement.fallbackChain).toBeArray()
      expect(requirement.fallbackChain.length).toBeGreaterThan(0)

      for (const entry of requirement.fallbackChain) {
        expect(entry.providers).toBeArray()
        expect(entry.providers.length).toBeGreaterThan(0)
        expect(typeof entry.model).toBe("string")
        expect(entry.model.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("CATEGORY_MODEL_REQUIREMENTS", () => {
  test("ultrabrain has valid fallbackChain with gpt-5.3-codex as primary", () => {
    // given - ultrabrain category requirement
    const ultrabrain = CATEGORY_MODEL_REQUIREMENTS["ultrabrain"]

    // when - accessing ultrabrain requirement
    // then - fallbackChain exists with gpt-5.3-codex as first entry
    expect(ultrabrain).toBeDefined()
    expect(ultrabrain.fallbackChain).toBeArray()
    expect(ultrabrain.fallbackChain.length).toBeGreaterThan(0)

    const primary = ultrabrain.fallbackChain[0]
    expect(primary.variant).toBe("xhigh")
    expect(primary.model).toBe("gpt-5.3-codex")
    expect(primary.providers[0]).toBe("openai")
  })

  test("deep has valid fallbackChain with gpt-5.3-codex as primary", () => {
    // given - deep category requirement
    const deep = CATEGORY_MODEL_REQUIREMENTS["deep"]

    // when - accessing deep requirement
    // then - fallbackChain exists with gpt-5.3-codex as first entry, medium variant
    expect(deep).toBeDefined()
    expect(deep.fallbackChain).toBeArray()
    expect(deep.fallbackChain.length).toBeGreaterThan(0)

    const primary = deep.fallbackChain[0]
    expect(primary.variant).toBe("medium")
    expect(primary.model).toBe("gpt-5.3-codex")
    expect(primary.providers[0]).toBe("openai")
  })

  test("visual-engineering has valid fallbackChain with gemini-3-pro as primary", () => {
    // given - visual-engineering category requirement
    const visualEngineering = CATEGORY_MODEL_REQUIREMENTS["visual-engineering"]

    // when - accessing visual-engineering requirement
    // then - fallbackChain exists with gemini-3-pro as first entry
    expect(visualEngineering).toBeDefined()
    expect(visualEngineering.fallbackChain).toBeArray()
    expect(visualEngineering.fallbackChain.length).toBeGreaterThan(0)

    const primary = visualEngineering.fallbackChain[0]
    expect(primary.providers[0]).toBe("google")
    expect(primary.model).toBe("gemini-3-pro")
  })

  test("quick has valid fallbackChain with claude-haiku-4-5 as primary", () => {
    // given - quick category requirement
    const quick = CATEGORY_MODEL_REQUIREMENTS["quick"]

    // when - accessing quick requirement
    // then - fallbackChain exists with claude-haiku-4-5 as first entry
    expect(quick).toBeDefined()
    expect(quick.fallbackChain).toBeArray()
    expect(quick.fallbackChain.length).toBeGreaterThan(0)

    const primary = quick.fallbackChain[0]
    expect(primary.model).toBe("claude-haiku-4-5")
    expect(primary.providers[0]).toBe("anthropic")
  })

  test("unspecified-low has valid fallbackChain with claude-sonnet-4-5 as primary", () => {
    // given - unspecified-low category requirement
    const unspecifiedLow = CATEGORY_MODEL_REQUIREMENTS["unspecified-low"]

    // when - accessing unspecified-low requirement
    // then - fallbackChain exists with claude-sonnet-4-5 as first entry
    expect(unspecifiedLow).toBeDefined()
    expect(unspecifiedLow.fallbackChain).toBeArray()
    expect(unspecifiedLow.fallbackChain.length).toBeGreaterThan(0)

    const primary = unspecifiedLow.fallbackChain[0]
    expect(primary.model).toBe("claude-sonnet-4-5")
    expect(primary.providers[0]).toBe("anthropic")
  })

  test("unspecified-high has claude-opus-4-6 as primary", () => {
    // #given - unspecified-high category requirement
    const unspecifiedHigh = CATEGORY_MODEL_REQUIREMENTS["unspecified-high"]

    // #when - accessing unspecified-high requirement
    // #then - claude-opus-4-6 is first
    expect(unspecifiedHigh).toBeDefined()
    expect(unspecifiedHigh.fallbackChain).toBeArray()
    expect(unspecifiedHigh.fallbackChain.length).toBeGreaterThan(1)

    const primary = unspecifiedHigh.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.variant).toBe("max")
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode"])
  })

  test("artistry has valid fallbackChain with gemini-3-pro as primary", () => {
    // given - artistry category requirement
    const artistry = CATEGORY_MODEL_REQUIREMENTS["artistry"]

    // when - accessing artistry requirement
    // then - fallbackChain exists with gemini-3-pro as first entry
    expect(artistry).toBeDefined()
    expect(artistry.fallbackChain).toBeArray()
    expect(artistry.fallbackChain.length).toBeGreaterThan(0)

    const primary = artistry.fallbackChain[0]
    expect(primary.model).toBe("gemini-3-pro")
    expect(primary.variant).toBe("high")
    expect(primary.providers[0]).toBe("google")
  })

  test("writing has valid fallbackChain with gemini-3-flash as primary", () => {
    // given - writing category requirement
    const writing = CATEGORY_MODEL_REQUIREMENTS["writing"]

    // when - accessing writing requirement
    // then - fallbackChain exists with gemini-3-flash as first entry
    expect(writing).toBeDefined()
    expect(writing.fallbackChain).toBeArray()
    expect(writing.fallbackChain.length).toBeGreaterThan(0)

    const primary = writing.fallbackChain[0]
    expect(primary.model).toBe("gemini-3-flash")
    expect(primary.providers[0]).toBe("google")
  })

  test("all 8 categories have valid fallbackChain arrays", () => {
    // given - list of 8 category names
    const expectedCategories = [
      "visual-engineering",
      "ultrabrain",
      "deep",
      "artistry",
      "quick",
      "unspecified-low",
      "unspecified-high",
      "writing",
    ]

    // when - checking CATEGORY_MODEL_REQUIREMENTS
    const definedCategories = Object.keys(CATEGORY_MODEL_REQUIREMENTS)

    // then - all categories present with valid fallbackChain
    expect(definedCategories).toHaveLength(8)
    for (const category of expectedCategories) {
      const requirement = CATEGORY_MODEL_REQUIREMENTS[category]
      expect(requirement).toBeDefined()
      expect(requirement.fallbackChain).toBeArray()
      expect(requirement.fallbackChain.length).toBeGreaterThan(0)

      for (const entry of requirement.fallbackChain) {
        expect(entry.providers).toBeArray()
        expect(entry.providers.length).toBeGreaterThan(0)
        expect(typeof entry.model).toBe("string")
        expect(entry.model.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("FallbackEntry type", () => {
  test("FallbackEntry structure is correct", () => {
    // given - a valid FallbackEntry object
    const entry: FallbackEntry = {
      providers: ["anthropic", "github-copilot", "opencode"],
      model: "claude-opus-4-6",
      variant: "high",
    }

    // when - accessing properties
    // then - all properties are accessible
    expect(entry.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(entry.model).toBe("claude-opus-4-6")
    expect(entry.variant).toBe("high")
  })

  test("FallbackEntry variant is optional", () => {
    // given - a FallbackEntry without variant
    const entry: FallbackEntry = {
      providers: ["opencode", "anthropic"],
      model: "glm-4.7-free",
    }

    // when - accessing variant
    // then - variant is undefined
    expect(entry.variant).toBeUndefined()
  })
})

describe("ModelRequirement type", () => {
  test("ModelRequirement structure with fallbackChain is correct", () => {
    // given - a valid ModelRequirement object
    const requirement: ModelRequirement = {
      fallbackChain: [
        { providers: ["anthropic", "github-copilot"], model: "claude-opus-4-6", variant: "max" },
        { providers: ["openai", "github-copilot"], model: "gpt-5.2", variant: "high" },
      ],
    }

    // when - accessing properties
    // then - fallbackChain is accessible with correct structure
    expect(requirement.fallbackChain).toBeArray()
    expect(requirement.fallbackChain).toHaveLength(2)
    expect(requirement.fallbackChain[0].model).toBe("claude-opus-4-6")
    expect(requirement.fallbackChain[1].model).toBe("gpt-5.2")
  })

  test("ModelRequirement variant is optional", () => {
    // given - a ModelRequirement without top-level variant
    const requirement: ModelRequirement = {
      fallbackChain: [{ providers: ["opencode"], model: "glm-4.7-free" }],
    }

    // when - accessing variant
    // then - variant is undefined
    expect(requirement.variant).toBeUndefined()
  })

  test("no model in fallbackChain has provider prefix", () => {
    // given - all agent and category requirements
    const allRequirements = [
      ...Object.values(AGENT_MODEL_REQUIREMENTS),
      ...Object.values(CATEGORY_MODEL_REQUIREMENTS),
    ]

    // when - checking each model in fallbackChain
    // then - none contain "/" (provider prefix)
    for (const req of allRequirements) {
      for (const entry of req.fallbackChain) {
        expect(entry.model).not.toContain("/")
      }
    }
  })

   test("all fallbackChain entries have non-empty providers array", () => {
     // given - all agent and category requirements
     const allRequirements = [
       ...Object.values(AGENT_MODEL_REQUIREMENTS),
       ...Object.values(CATEGORY_MODEL_REQUIREMENTS),
     ]

     // when - checking each entry in fallbackChain
     // then - all have non-empty providers array
     for (const req of allRequirements) {
       for (const entry of req.fallbackChain) {
         expect(entry.providers).toBeArray()
         expect(entry.providers.length).toBeGreaterThan(0)
       }
     }
   })
})

describe("requiresModel field in categories", () => {
  test("deep category has requiresModel set to gpt-5.3-codex", () => {
    // given
    const deep = CATEGORY_MODEL_REQUIREMENTS["deep"]

    // when / #then
    expect(deep.requiresModel).toBe("gpt-5.3-codex")
  })

  test("artistry category has requiresModel set to gemini-3-pro", () => {
    // given
    const artistry = CATEGORY_MODEL_REQUIREMENTS["artistry"]

    // when / #then
    expect(artistry.requiresModel).toBe("gemini-3-pro")
  })
})
