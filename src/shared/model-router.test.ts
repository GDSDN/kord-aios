import { describe, expect, test } from "bun:test"
import { classifyTask, routeModel, classifyTaskWithLLM, type TaskClassification, type RouteResult, type LLMClassifierClient } from "./model-router"
import { type ModelEntry } from "./model-schema"

describe("classifyTask", () => {
  describe("keyword-based classification", () => {
    test("detects trivial from 'fix typo' keywords", () => {
      //#when
      const result = classifyTask("fix typo in the README file")

      //#then
      expect(result.complexity).toBe("trivial")
    })

    test("detects trivial from 'rename' keywords", () => {
      const result = classifyTask("rename the variable from foo to bar")
      expect(result.complexity).toBe("trivial")
    })

    test("detects trivial from 'quick fix' keywords", () => {
      const result = classifyTask("quick fix for the import path")
      expect(result.complexity).toBe("trivial")
    })

    test("detects complex from 'refactor' keyword", () => {
      const result = classifyTask("refactor the authentication module to use the new pattern across all services")
      expect(result.complexity).toBe("complex")
    })

    test("detects complex from 'architecture' keyword", () => {
      const result = classifyTask("design the architecture for the new event-driven system")
      expect(result.complexity).toBe("complex")
    })

    test("detects complex from 'debug' keyword with investigation context", () => {
      const result = classifyTask("debug the race condition in the async queue processor that happens under high load")
      expect(result.complexity).toBe("complex")
    })

    test("detects complex from 'system-wide' dependency keyword", () => {
      const result = classifyTask("apply system-wide changes to the logging infrastructure")
      expect(result.complexity).toBe("complex")
    })

    test("detects complex from 'across modules' dependency keyword", () => {
      const result = classifyTask("update the error handling across modules to use the new Result type")
      expect(result.complexity).toBe("complex")
    })

    test("detects complex from 'breaking change' dependency keyword", () => {
      const result = classifyTask("implement breaking change to the API schema and update all consumers")
      expect(result.complexity).toBe("complex")
    })
  })

  describe("prompt length influence", () => {
    test("very short prompt leans trivial", () => {
      const result = classifyTask("add a comma")
      expect(result.complexity).toBe("trivial")
    })

    test("very long prompt leans complex", () => {
      const longPrompt = "I need you to analyze the entire authentication subsystem, " +
        "identify all the places where we use the legacy JWT validation, " +
        "migrate them to the new PASETO-based system, ensure backward compatibility " +
        "with existing sessions, add proper error handling for edge cases, " +
        "update the middleware chain, write comprehensive integration tests, " +
        "and document all the changes in the architecture decision records. " +
        "Also consider the impact on the rate limiter and the session store. " +
        "Make sure to handle the database migration for the new token format. " +
        "The rollback strategy should be documented in case we need to revert."
      const result = classifyTask(longPrompt)
      expect(["complex", "deep"]).toContain(result.complexity)
    })
  })

  describe("agent type influence", () => {
    test("planning agent leans toward complex", () => {
      const result = classifyTask("create a plan for adding the new feature", "plan")
      expect(["moderate", "complex"]).toContain(result.complexity)
    })

    test("explore agent leans toward trivial", () => {
      const result = classifyTask("find the file where the config is loaded", "explore")
      expect(result.complexity).toBe("trivial")
    })

    test("analyst agent leans toward complex", () => {
      const result = classifyTask("analyze this module", "analyst")
      expect(["moderate", "complex"]).toContain(result.complexity)
    })

    test("kord agent leans toward complex", () => {
      const result = classifyTask("coordinate the implementation", "kord")
      expect(["moderate", "complex"]).toContain(result.complexity)
    })
  })

  describe("category influence", () => {
    test("ultrabrain category pushes toward complex", () => {
      const result = classifyTask("solve this problem", undefined, "ultrabrain")
      expect(["complex", "deep"]).toContain(result.complexity)
    })

    test("deep category pushes toward deep", () => {
      const result = classifyTask("solve this problem", undefined, "deep")
      expect(result.complexity).toBe("deep")
    })

    test("quick category pushes toward trivial", () => {
      const result = classifyTask("do this task", undefined, "quick")
      expect(result.complexity).toBe("trivial")
    })
  })

  describe("domain detection", () => {
    test("detects coding domain from code-related keywords", () => {
      const result = classifyTask("implement the new API endpoint for user authentication")
      expect(result.domains).toContain("coding")
    })

    test("detects planning domain from planning keywords", () => {
      const result = classifyTask("create a plan for the migration strategy")
      expect(result.domains).toContain("planning")
    })

    test("detects analysis domain from analysis keywords", () => {
      const result = classifyTask("analyze the performance bottleneck in the database queries")
      expect(result.domains).toContain("analysis")
    })

    test("detects visual domain from visual keywords", () => {
      const result = classifyTask("look at this screenshot and tell me what's wrong with the UI layout")
      expect(result.domains).toContain("visual")
    })

    test("detects writing domain from writing keywords", () => {
      const result = classifyTask("write documentation for the API endpoints")
      expect(result.domains).toContain("writing")
    })

    test("detects search domain from search keywords", () => {
      const result = classifyTask("search for where the config is loaded in the codebase")
      expect(result.domains).toContain("search")
    })

    test("defaults to general when no specific domain detected", () => {
      const result = classifyTask("hello world")
      expect(result.domains).toContain("general")
    })
  })

  describe("determinism", () => {
    test("same input produces same output", () => {
      const prompt = "refactor the module to use dependency injection"
      const r1 = classifyTask(prompt, "dev")
      const r2 = classifyTask(prompt, "dev")
      expect(r1).toEqual(r2)
    })
  })

  describe("combined signals", () => {
    test("trivial keyword + explore agent = trivial", () => {
      const result = classifyTask("fix typo in comment", "explore")
      expect(result.complexity).toBe("trivial")
    })

    test("complex keyword + planning agent = complex or deep", () => {
      const result = classifyTask("design the architecture for the new microservices migration", "plan")
      expect(["complex", "deep"]).toContain(result.complexity)
    })

    test("neutral prompt + ultrabrain category = complex", () => {
      const result = classifyTask("process this request", undefined, "ultrabrain")
      expect(["complex", "deep"]).toContain(result.complexity)
    })
  })
})

const TEST_SCHEMA: ModelEntry[] = [
  {
    model: "claude-opus-4-6",
    providers: ["anthropic"],
    reasoning: "ultra",
    domains: ["planning", "analysis", "coding"],
    description: "Ultra reasoning",
    enabled_agents: ["kord", "planner"],
    cost_tier: 5,
    variant: "max",
  },
  {
    model: "gpt-5.2",
    providers: ["openai"],
    reasoning: "high",
    domains: ["coding", "analysis", "planning"],
    description: "High reasoning",
    enabled_agents: ["kord", "architect", "qa"],
    cost_tier: 4,
    variant: "high",
  },
  {
    model: "claude-sonnet-4-5",
    providers: ["anthropic"],
    reasoning: "high",
    domains: ["coding", "general"],
    description: "Balanced",
    enabled_agents: ["builder", "librarian"],
    cost_tier: 3,
  },
  {
    model: "gemini-3-flash",
    providers: ["google"],
    reasoning: "medium",
    domains: ["writing", "visual", "search"],
    description: "Fast multimodal",
    enabled_agents: ["vision", "writing", "quick"],
    cost_tier: 2,
  },
  {
    model: "claude-haiku-4-5",
    providers: ["anthropic"],
    reasoning: "low",
    domains: ["search", "general"],
    description: "Fast economy",
    enabled_agents: ["explore", "quick"],
    cost_tier: 1,
  },
  {
    model: "gpt-5-nano",
    providers: ["openai"],
    reasoning: "none",
    domains: ["search"],
    description: "Ultra-fast",
    enabled_agents: ["explore"],
    cost_tier: 1,
  },
]

const ALL_AVAILABLE = new Set([
  "anthropic/claude-opus-4-6",
  "openai/gpt-5.2",
  "anthropic/claude-sonnet-4-5",
  "google/gemini-3-flash",
  "anthropic/claude-haiku-4-5",
  "openai/gpt-5-nano",
])

describe("routeModel", () => {
  describe("agent filtering", () => {
    test("only considers models enabled for the target agent", () => {
      //#given
      const classification: TaskClassification = { complexity: "complex", domains: ["coding"] }

      //#when
      const result = routeModel("kord", classification, TEST_SCHEMA, ALL_AVAILABLE)

      //#then
      expect(result).toBeDefined()
      expect(["claude-opus-4-6", "gpt-5.2"]).toContain(result!.model)
    })

    test("returns undefined for agent with no enabled models", () => {
      //#given
      const classification: TaskClassification = { complexity: "moderate", domains: ["general"] }

      //#when
      const result = routeModel("nonexistent-agent", classification, TEST_SCHEMA, ALL_AVAILABLE)

      //#then
      expect(result).toBeUndefined()
    })
  })

  describe("domain matching", () => {
    test("prefers models with matching domains", () => {
      //#given
      const classification: TaskClassification = { complexity: "moderate", domains: ["search"] }

      //#when
      const result = routeModel("explore", classification, TEST_SCHEMA, ALL_AVAILABLE)

      //#then
      expect(result).toBeDefined()
      expect(["claude-haiku-4-5", "gpt-5-nano"]).toContain(result!.model)
    })

    test("falls back when no domain match exists", () => {
      //#given — explore is only enabled for haiku and nano, both have search domain
      const classification: TaskClassification = { complexity: "trivial", domains: ["visual"] }

      //#when
      const result = routeModel("explore", classification, TEST_SCHEMA, ALL_AVAILABLE)

      //#then
      // Should still return something (best available for explore)
      expect(result).toBeDefined()
    })
  })

  describe("reasoning tier selection", () => {
    test("trivial complexity selects low/none reasoning", () => {
      //#given
      const classification: TaskClassification = { complexity: "trivial", domains: ["search"] }

      //#when
      const result = routeModel("explore", classification, TEST_SCHEMA, ALL_AVAILABLE)

      //#then
      expect(result).toBeDefined()
      expect(["claude-haiku-4-5", "gpt-5-nano"]).toContain(result!.model)
    })

    test("complex complexity selects high/ultra reasoning", () => {
      //#given
      const classification: TaskClassification = { complexity: "complex", domains: ["coding"] }

      //#when
      const result = routeModel("kord", classification, TEST_SCHEMA, ALL_AVAILABLE)

      //#then
      expect(result).toBeDefined()
      expect(["claude-opus-4-6", "gpt-5.2"]).toContain(result!.model)
    })

    test("deep complexity prefers ultra reasoning", () => {
      //#given
      const classification: TaskClassification = { complexity: "deep", domains: ["planning"] }

      //#when
      const result = routeModel("kord", classification, TEST_SCHEMA, ALL_AVAILABLE)

      //#then
      expect(result).toBeDefined()
      expect(result!.model).toBe("claude-opus-4-6")
    })
  })

  describe("cost preference", () => {
    test("economy prefers lower cost_tier", () => {
      //#given
      const classification: TaskClassification = { complexity: "trivial", domains: ["search"] }

      //#when
      const result = routeModel("explore", classification, TEST_SCHEMA, ALL_AVAILABLE, "economy")

      //#then
      expect(result).toBeDefined()
      expect(result!.model).toBe("gpt-5-nano")
    })

    test("performance prefers higher cost_tier", () => {
      //#given
      const classification: TaskClassification = { complexity: "complex", domains: ["coding"] }

      //#when
      const result = routeModel("kord", classification, TEST_SCHEMA, ALL_AVAILABLE, "performance")

      //#then
      expect(result).toBeDefined()
      expect(result!.model).toBe("claude-opus-4-6")
    })
  })

  describe("availability check", () => {
    test("skips unavailable models", () => {
      //#given
      const limited = new Set(["openai/gpt-5.2"])
      const classification: TaskClassification = { complexity: "complex", domains: ["coding"] }

      //#when
      const result = routeModel("kord", classification, TEST_SCHEMA, limited)

      //#then
      expect(result).toBeDefined()
      expect(result!.model).toBe("gpt-5.2")
    })

    test("returns undefined when no models are available", () => {
      //#given
      const empty = new Set<string>()
      const classification: TaskClassification = { complexity: "complex", domains: ["coding"] }

      //#when
      const result = routeModel("kord", classification, TEST_SCHEMA, empty)

      //#then
      expect(result).toBeUndefined()
    })
  })

  describe("provenance", () => {
    test("returns dynamic-route provenance", () => {
      //#given
      const classification: TaskClassification = { complexity: "complex", domains: ["coding"] }

      //#when
      const result = routeModel("kord", classification, TEST_SCHEMA, ALL_AVAILABLE)

      //#then
      expect(result).toBeDefined()
      expect(result!.provenance).toBe("dynamic-route")
    })

    test("includes variant when model has one", () => {
      //#given
      const classification: TaskClassification = { complexity: "deep", domains: ["planning"] }

      //#when
      const result = routeModel("kord", classification, TEST_SCHEMA, ALL_AVAILABLE)

      //#then
      expect(result).toBeDefined()
      expect(result!.variant).toBe("max")
    })

    test("variant is undefined when model has none", () => {
      //#given
      const classification: TaskClassification = { complexity: "trivial", domains: ["search"] }

      //#when
      const result = routeModel("explore", classification, TEST_SCHEMA, ALL_AVAILABLE, "economy")

      //#then
      expect(result).toBeDefined()
      expect(result!.variant).toBeUndefined()
    })
  })
})

describe("classifyTaskWithLLM", () => {
  test("returns classification from successful LLM call", async () => {
    //#given
    const mockClient: LLMClassifierClient = {
      classify: async () => ({ complexity: "complex" as const, domains: ["coding", "analysis"] }),
    }

    //#when
    const result = await classifyTaskWithLLM("refactor the auth system", "dev", mockClient)

    //#then
    expect(result.complexity).toBe("complex")
    expect(result.domains).toEqual(["coding", "analysis"])
  })

  test("falls back to heuristic on LLM error", async () => {
    //#given
    const mockClient: LLMClassifierClient = {
      classify: async () => { throw new Error("LLM unavailable") },
    }

    //#when
    const result = await classifyTaskWithLLM("fix typo in README", "explore", mockClient)

    //#then
    expect(result).toBeDefined()
    expect(result.complexity).toBe("trivial")
  })

  test("falls back to heuristic when client returns invalid shape", async () => {
    //#given
    const mockClient: LLMClassifierClient = {
      classify: async () => ({ complexity: "INVALID" as any, domains: [] }),
    }

    //#when
    const result = await classifyTaskWithLLM("some task", "dev", mockClient)

    //#then
    expect(result).toBeDefined()
    expect(["trivial", "moderate", "complex", "deep"]).toContain(result.complexity)
  })

  test("returns same TaskClassification shape as heuristic", async () => {
    //#given
    const mockClient: LLMClassifierClient = {
      classify: async () => ({ complexity: "deep" as const, domains: ["planning"] }),
    }

    //#when
    const result = await classifyTaskWithLLM("strategic planning task", "kord", mockClient)

    //#then
    expect(typeof result.complexity).toBe("string")
    expect(Array.isArray(result.domains)).toBe(true)
  })

  test("uses heuristic when client is undefined", async () => {
    //#when
    const result = await classifyTaskWithLLM("fix typo", "explore", undefined)

    //#then
    expect(result.complexity).toBe("trivial")
  })
})
