import { describe, expect, test } from "bun:test"
import {
  AgentOverrideConfigSchema,
  BrowserAutomationConfigSchema,
  BrowserAutomationProviderSchema,
  BuiltinCategoryNameSchema,
  CategoryConfigSchema,
  OhMyOpenCodeConfigSchema,
} from "./schema"

describe("disabled_mcps schema", () => {
  test("should accept built-in MCP names", () => {
    // given
    const config = {
      disabled_mcps: ["context7", "grep_app"],
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual(["context7", "grep_app"])
    }
  })

  test("should accept custom MCP names", () => {
    // given
    const config = {
      disabled_mcps: ["playwright", "sqlite", "custom-mcp"],
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual(["playwright", "sqlite", "custom-mcp"])
    }
  })

  test("should accept mixed built-in and custom names", () => {
    // given
    const config = {
      disabled_mcps: ["context7", "playwright", "custom-server"],
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual(["context7", "playwright", "custom-server"])
    }
  })

  test("should accept empty array", () => {
    // given
    const config = {
      disabled_mcps: [],
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual([])
    }
  })

  test("should reject non-string values", () => {
    // given
    const config = {
      disabled_mcps: [123, true, null],
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(false)
  })

  test("should accept undefined (optional field)", () => {
    // given
    const config = {}

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toBeUndefined()
    }
  })

  test("should reject empty strings", () => {
    // given
    const config = {
      disabled_mcps: [""],
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(false)
  })

  test("should accept MCP names with various naming patterns", () => {
    // given
    const config = {
      disabled_mcps: [
        "my-custom-mcp",
        "my_custom_mcp",
        "myCustomMcp",
        "my.custom.mcp",
        "my-custom-mcp-123",
      ],
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_mcps).toEqual([
        "my-custom-mcp",
        "my_custom_mcp",
        "myCustomMcp",
        "my.custom.mcp",
        "my-custom-mcp-123",
      ])
    }
  })
})

describe("AgentOverrideConfigSchema", () => {
  describe("category field", () => {
    test("accepts category as optional string", () => {
      // given
      const config = { category: "visual-engineering" }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe("visual-engineering")
      }
    })

    test("accepts config without category", () => {
      // given
      const config = { temperature: 0.5 }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
    })

    test("rejects non-string category", () => {
      // given
      const config = { category: 123 }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(false)
    })
  })

  describe("variant field", () => {
    test("accepts variant as optional string", () => {
      // given
      const config = { variant: "high" }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.variant).toBe("high")
      }
    })

    test("rejects non-string variant", () => {
      // given
      const config = { variant: 123 }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(false)
    })
  })

  describe("skills field", () => {
    test("accepts skills as optional string array", () => {
      // given
      const config = { skills: ["frontend-ui-ux", "code-reviewer"] }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.skills).toEqual(["frontend-ui-ux", "code-reviewer"])
      }
    })

    test("accepts empty skills array", () => {
      // given
      const config = { skills: [] }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.skills).toEqual([])
      }
    })

    test("accepts config without skills", () => {
      // given
      const config = { temperature: 0.5 }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
    })

    test("rejects non-array skills", () => {
      // given
      const config = { skills: "frontend-ui-ux" }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(false)
    })
  })

  describe("backward compatibility", () => {
    test("still accepts model field (deprecated)", () => {
      // given
      const config = { model: "openai/gpt-5.2" }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.model).toBe("openai/gpt-5.2")
      }
    })

    test("accepts both model and category (deprecated usage)", () => {
      // given - category should take precedence at runtime, but both should validate
      const config = { 
        model: "openai/gpt-5.2",
        category: "ultrabrain"
      }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.model).toBe("openai/gpt-5.2")
        expect(result.data.category).toBe("ultrabrain")
      }
    })
  })

  describe("combined fields", () => {
    test("accepts category with skills", () => {
      // given
      const config = { 
        category: "visual-engineering",
        skills: ["frontend-ui-ux"]
      }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe("visual-engineering")
        expect(result.data.skills).toEqual(["frontend-ui-ux"])
      }
    })

    test("accepts category with skills and other fields", () => {
      // given
      const config = { 
        category: "ultrabrain",
        skills: ["code-reviewer"],
        temperature: 0.3,
        prompt_append: "Extra instructions"
      }

      // when
      const result = AgentOverrideConfigSchema.safeParse(config)

      // then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe("ultrabrain")
        expect(result.data.skills).toEqual(["code-reviewer"])
        expect(result.data.temperature).toBe(0.3)
        expect(result.data.prompt_append).toBe("Extra instructions")
      }
    })
  })
})

describe("CategoryConfigSchema", () => {
  test("accepts variant as optional string", () => {
    // given
    const config = { model: "openai/gpt-5.2", variant: "xhigh" }

    // when
    const result = CategoryConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.variant).toBe("xhigh")
    }
  })

  test("accepts reasoningEffort as optional string with xhigh", () => {
    // given
    const config = { reasoningEffort: "xhigh" }

    // when
    const result = CategoryConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reasoningEffort).toBe("xhigh")
    }
  })

  test("rejects non-string variant", () => {
    // given
    const config = { model: "openai/gpt-5.2", variant: 123 }

    // when
    const result = CategoryConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(false)
  })
})

describe("BuiltinCategoryNameSchema", () => {
  test("accepts all builtin category names", () => {
    // given
    const categories = ["visual-engineering", "ultrabrain", "artistry", "quick", "unspecified-low", "unspecified-high", "writing"]

    // when / #then
    for (const cat of categories) {
      const result = BuiltinCategoryNameSchema.safeParse(cat)
      expect(result.success).toBe(true)
    }
  })
})

describe("Dev-Junior agent override", () => {
  test("schema accepts agents['Dev-Junior'] and retains the key after parsing", () => {
    // given
    const config = {
      agents: {
        "dev-junior": {
          model: "openai/gpt-5.2",
          temperature: 0.2,
        },
      },
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.["dev-junior"]).toBeDefined()
      expect(result.data.agents?.["dev-junior"]?.model).toBe("openai/gpt-5.2")
      expect(result.data.agents?.["dev-junior"]?.temperature).toBe(0.2)
    }
  })

  test("schema accepts dev-junior with prompt_append", () => {
    // given
    const config = {
      agents: {
        "dev-junior": {
          prompt_append: "Additional instructions for dev-junior",
        },
      },
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.["dev-junior"]?.prompt_append).toBe(
        "Additional instructions for dev-junior"
      )
    }
  })

  test("schema accepts dev-junior with tools override", () => {
    // given
    const config = {
      agents: {
        "dev-junior": {
          tools: {
            read: true,
            write: false,
          },
        },
      },
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.["dev-junior"]?.tools).toEqual({
        read: true,
        write: false,
      })
    }
  })

  test("schema accepts lowercase agent names (kord, build, plan)", () => {
    // given
    const config = {
      agents: {
        kord: {
          temperature: 0.1,
        },
        build: {
          temperature: 0.2,
        },
        planner: {
          temperature: 0.3,
        },
      },
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.kord?.temperature).toBe(0.1)
      expect(result.data.agents?.build?.temperature).toBe(0.2)
      expect(result.data.agents?.planner?.temperature).toBe(0.3)
    }
  })

  test("schema accepts lowercase analyst and qa agent names", () => {
    // given
    const config = {
      agents: {
        analyst: {
          category: "ultrabrain",
        },
        qa: {
          category: "quick",
        },
      },
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.analyst?.category).toBe("ultrabrain")
      expect(result.data.agents?.qa?.category).toBe("quick")
    }
  })
})

describe("EPIC-06 consolidated config fields", () => {
  describe("wave_checkpoint config", () => {
    test("accepts wave_checkpoint with mode auto", () => {
      //#given
      const config = { wave_checkpoint: { mode: "auto" } }

      //#when
      const result = OhMyOpenCodeConfigSchema.safeParse(config)

      //#then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.wave_checkpoint?.mode).toBe("auto")
      }
    })

    test("accepts wave_checkpoint with mode interactive", () => {
      //#given
      const config = { wave_checkpoint: { mode: "interactive" } }

      //#when
      const result = OhMyOpenCodeConfigSchema.safeParse(config)

      //#then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.wave_checkpoint?.mode).toBe("interactive")
      }
    })

    test("rejects invalid wave_checkpoint mode", () => {
      //#given
      const config = { wave_checkpoint: { mode: "invalid" } }

      //#when
      const result = OhMyOpenCodeConfigSchema.safeParse(config)

      //#then
      expect(result.success).toBe(false)
    })

    test("accepts config without wave_checkpoint (optional)", () => {
      //#given
      const config = {}

      //#when
      const result = OhMyOpenCodeConfigSchema.safeParse(config)

      //#then
      expect(result.success).toBe(true)
      expect(result.data?.wave_checkpoint).toBeUndefined()
    })
  })

  describe("executor_resolver config", () => {
    test("accepts executor_resolver with custom skill mapping", () => {
      //#given
      const config = {
        executor_resolver: {
          skill_mapping: {
            "dev": ["custom-dev-skill"],
            "ml-engineer": ["train-model", "data-pipeline"],
          },
        },
      }

      //#when
      const result = OhMyOpenCodeConfigSchema.safeParse(config)

      //#then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.executor_resolver?.skill_mapping?.["dev"]).toEqual(["custom-dev-skill"])
      }
    })

    test("accepts config without executor_resolver (optional)", () => {
      //#given
      const config = {}

      //#when
      const result = OhMyOpenCodeConfigSchema.safeParse(config)

      //#then
      expect(result.success).toBe(true)
      expect(result.data?.executor_resolver).toBeUndefined()
    })
  })

  describe("squad config", () => {
    test("accepts squad with default_squad", () => {
      //#given
      const config = { squad: { default_squad: "marketing" } }

      //#when
      const result = OhMyOpenCodeConfigSchema.safeParse(config)

      //#then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.squad?.default_squad).toBe("marketing")
      }
    })

    test("accepts squad with search_paths", () => {
      //#given
      const config = {
        squad: {
          search_paths: [".kord/squads", "docs/squads"],
        },
      }

      //#when
      const result = OhMyOpenCodeConfigSchema.safeParse(config)

      //#then
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.squad?.search_paths).toEqual([".kord/squads", "docs/squads"])
      }
    })

    test("accepts config without squad (optional)", () => {
      //#given
      const config = {}

      //#when
      const result = OhMyOpenCodeConfigSchema.safeParse(config)

      //#then
      expect(result.success).toBe(true)
      expect(result.data?.squad).toBeUndefined()
    })
  })
})

describe("BrowserAutomationProviderSchema", () => {
  test("accepts 'playwright' as valid provider", () => {
    // given
    const input = "playwright"

    // when
    const result = BrowserAutomationProviderSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data).toBe("playwright")
  })

  test("accepts 'agent-browser' as valid provider", () => {
    // given
    const input = "agent-browser"

    // when
    const result = BrowserAutomationProviderSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data).toBe("agent-browser")
  })

  test("rejects invalid provider", () => {
    // given
    const input = "invalid-provider"

    // when
    const result = BrowserAutomationProviderSchema.safeParse(input)

    // then
    expect(result.success).toBe(false)
  })
})

describe("BrowserAutomationConfigSchema", () => {
  test("defaults provider to 'playwright' when not specified", () => {
    // given
    const input = {}

    // when
    const result = BrowserAutomationConfigSchema.parse(input)

    // then
    expect(result.provider).toBe("playwright")
  })

  test("accepts agent-browser provider", () => {
    // given
    const input = { provider: "agent-browser" }

    // when
    const result = BrowserAutomationConfigSchema.parse(input)

    // then
    expect(result.provider).toBe("agent-browser")
  })
})

describe("OhMyOpenCodeConfigSchema - browser_automation_engine", () => {
  test("accepts browser_automation_engine config", () => {
    // given
    const input = {
      browser_automation_engine: {
        provider: "agent-browser",
      },
    }

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data?.browser_automation_engine?.provider).toBe("agent-browser")
  })

  test("accepts config without browser_automation_engine", () => {
    // given
    const input = {}

    // when
    const result = OhMyOpenCodeConfigSchema.safeParse(input)

    // then
    expect(result.success).toBe(true)
    expect(result.data?.browser_automation_engine).toBeUndefined()
  })
})

describe("Agent fallback configuration", () => {
  test("accepts fallback entries with model and variant", () => {
    //#given
    const config = {
      agents: {
        kord: {
          fallback: [
            { model: "anthropic/claude-opus-4-6", variant: "max" },
            { model: "openai/gpt-5.2", variant: "high" },
          ],
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.kord?.fallback).toEqual([
        { model: "anthropic/claude-opus-4-6", variant: "max" },
        { model: "openai/gpt-5.2", variant: "high" },
      ])
    }
  })

  test("accepts fallback entries without variant", () => {
    //#given
    const config = {
      agents: {
        dev: {
          fallback: [
            { model: "openai/gpt-5.3-codex" },
            { model: "anthropic/claude-opus-4-6" },
          ],
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.dev?.fallback).toHaveLength(2)
    }
  })

  test("rejects fallback with invalid model format", () => {
    //#given
    const config = {
      agents: {
        kord: {
          fallback: [{ model: "claude-opus-4-6" }],
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(false)
  })

  test("rejects more than 4 fallback entries", () => {
    //#given
    const config = {
      agents: {
        kord: {
          fallback: [
            { model: "anthropic/claude-opus-4-6" },
            { model: "openai/gpt-5.2" },
            { model: "google/gemini-3-pro" },
            { model: "zai-coding-plan/glm-4.7" },
            { model: "opencode/gpt-5-nano" },
          ],
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(false)
  })

  test("accepts empty fallback array", () => {
    //#given
    const config = {
      agents: {
        kord: {
          fallback: [],
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.kord?.fallback).toEqual([])
    }
  })

  test("legacy routing fields are ignored", () => {
    //#given
    const config = {
      agents: {
        kord: {
          routing_mode: "dynamic",
          fallback_slots: ["anthropic/claude-opus-4-6"],
          model: "openai/gpt-5.2",
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.kord?.model).toBe("openai/gpt-5.2")
      expect((result.data.agents?.kord as Record<string, unknown>)?.routing_mode).toBeUndefined()
      expect((result.data.agents?.kord as Record<string, unknown>)?.fallback_slots).toBeUndefined()
    }
  })

  test("legacy model_routing config is ignored", () => {
    //#given
    const config = {
      model_routing: {
        classifier: "heuristic",
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).model_routing).toBeUndefined()
    }
  })
})
