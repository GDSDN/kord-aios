import { describe, test, expect } from "bun:test"
import { getAgentCapabilities, type AgentCapabilities } from "./agent-capabilities"

describe("agent-capabilities", () => {
  describe("AgentCapabilities type", () => {
    test("has required write_paths field", () => {
      // given an agent capabilities object
      const caps: AgentCapabilities = {
        write_paths: ["**"],
      }

      // then it should have write_paths
      expect(caps.write_paths).toEqual(["**"])
    })

    test("has optional tool_allowlist field", () => {
      // given an agent capabilities object with tool_allowlist
      const caps: AgentCapabilities = {
        write_paths: ["**"],
        tool_allowlist: ["read", "glob"],
      }

      // then it should have tool_allowlist
      expect(caps.tool_allowlist).toEqual(["read", "glob"])
    })

    test("has optional tool_denylist field", () => {
      // given an agent capabilities object with tool_denylist
      const caps: AgentCapabilities = {
        write_paths: ["**"],
        tool_denylist: ["bash", "task"],
      }

      // then it should have tool_denylist
      expect(caps.tool_denylist).toEqual(["bash", "task"])
    })

    test("has can_delegate field with default true", () => {
      // given an agent capabilities object without can_delegate
      const caps: AgentCapabilities = {
        write_paths: ["**"],
      }

      // then can_delegate should default to true
      expect(caps.can_delegate).toBeUndefined() // Implementation will set default
    })
  })

  describe("getAgentCapabilities", () => {
    describe("frontmatter as defaults (lowest priority)", () => {
      test("uses frontmatter write_paths as base defaults", () => {
        // given frontmatter source with write_paths
        const sources = {
          frontmatter: {
            write_paths: ["src/**", "tests/**"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("custom-agent", sources)

        // then uses frontmatter as defaults
        expect(result.write_paths).toEqual(["src/**", "tests/**"])
      })

      test("uses frontmatter tool_allowlist as base defaults", () => {
        // given frontmatter source with tool_allowlist
        const sources = {
          frontmatter: {
            tool_allowlist: ["read", "glob", "grep"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("custom-agent", sources)

        // then uses frontmatter tool_allowlist
        expect(result.tool_allowlist).toEqual(["read", "glob", "grep"])
      })

      test("frontmatter can_delegate defaults to true when not specified", () => {
        // given frontmatter source without can_delegate
        const sources = {
          frontmatter: {
            write_paths: ["**"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("custom-agent", sources)

        // then can_delegate defaults to true
        expect(result.can_delegate).toBe(true)
      })

      test("frontmatter explicit can_delegate false is respected", () => {
        // given frontmatter source with can_delegate explicitly false
        const sources = {
          frontmatter: {
            write_paths: ["**"],
            can_delegate: false,
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("custom-agent", sources)

        // then respects the explicit false
        expect(result.can_delegate).toBe(false)
      })
    })

    describe("squad manifest (medium-low priority)", () => {
      test("squad manifest overrides frontmatter write_paths", () => {
        // given both frontmatter and squad sources
        const sources = {
          frontmatter: {
            write_paths: ["src/**"],
          },
          squad: {
            write_paths: ["squad-src/**"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("squad-agent", sources)

        // then squad overrides frontmatter
        expect(result.write_paths).toEqual(["squad-src/**"])
      })

      test("squad manifest tool permissions override frontmatter", () => {
        // given both frontmatter and squad sources with tool permissions
        const sources = {
          frontmatter: {
            tool_allowlist: ["read", "glob"],
          },
          squad: {
            tool_allowlist: ["read", "glob", "bash"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("squad-agent", sources)

        // then squad overrides frontmatter tool_allowlist
        expect(result.tool_allowlist).toEqual(["read", "glob", "bash"])
      })
    })

    describe("kord-aios.json config (highest priority override)", () => {
      test("config overrides squad manifest write_paths", () => {
        // given frontmatter, squad, and config sources
        const sources = {
          frontmatter: {
            write_paths: ["src/**"],
          },
          squad: {
            write_paths: ["squad-src/**"],
          },
          config: {
            write_paths: ["config-src/**"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("custom-agent", sources)

        // then config has highest priority
        expect(result.write_paths).toEqual(["config-src/**"])
      })

      test("config overrides squad and frontmatter tool permissions", () => {
        // given all three sources with tool permissions
        const sources = {
          frontmatter: {
            tool_allowlist: ["read"],
          },
          squad: {
            tool_allowlist: ["read", "glob"],
          },
          config: {
            tool_allowlist: ["read", "glob", "bash", "write"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("custom-agent", sources)

        // then config has highest priority
        expect(result.tool_allowlist).toEqual(["read", "glob", "bash", "write"])
      })

      test("config can_delegate false overrides higher sources", () => {
        // given all sources with can_delegate
        const sources = {
          frontmatter: {
            write_paths: ["**"],
            can_delegate: true,
          },
          squad: {
            can_delegate: true,
          },
          config: {
            can_delegate: false,
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("custom-agent", sources)

        // then config has highest priority
        expect(result.can_delegate).toBe(false)
      })
    })

    describe("hardcoded defaults for T0/T1 agents (fallback)", () => {
      test("kord agent gets full access as T0", () => {
        // given known T0 agent with no sources
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("kord", sources)

        // then has full access
        expect(result.write_paths).toEqual(["**"])
        expect(result.can_delegate).toBe(true)
      })

      test("dev agent gets full access as T1", () => {
        // given known T1 agent with no sources
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("dev", sources)

        // then has full access
        expect(result.write_paths).toEqual(["**"])
        expect(result.can_delegate).toBe(true)
      })

      test("dev-junior agent gets full access as T1", () => {
        // given known T1 agent with no sources
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("dev-junior", sources)

        // then has full access
        expect(result.write_paths).toEqual(["**"])
        expect(result.can_delegate).toBe(true)
      })

      test("build agent gets limited write paths", () => {
        // given build agent with no sources
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("build", sources)

        // then has limited write paths from DEFAULT_AGENT_ALLOWLIST
        expect(result.write_paths).toEqual([
          "docs/kord/notepads/**",
          "docs/kord/runs/**",
          "docs/kord/plans/**",
          "docs/kord/drafts/**",
          "docs/kord/boulder.json",
        ])
        expect(result.can_delegate).toBe(true)
      })

      test("planner agent gets limited write paths", () => {
        // given planner agent with no sources
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("planner", sources)

        // then has limited write paths from DEFAULT_AGENT_ALLOWLIST
        expect(result.write_paths).toEqual(["docs/kord/plans/**", "docs/kord/drafts/**"])
        expect(result.can_delegate).toBe(true)
      })

      test("explore agent gets empty write paths (not in allowlist)", () => {
        // given explore agent (NOT in DEFAULT_AGENT_ALLOWLIST)
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("explore", sources)

        // then no paths (deny all - not in DEFAULT_AGENT_ALLOWLIST)
        expect(result.write_paths).toEqual([])
      })

      test("librarian agent gets empty write paths (not in allowlist)", () => {
        // given librarian agent (NOT in DEFAULT_AGENT_ALLOWLIST)
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("librarian", sources)

        // then no paths (deny all - not in DEFAULT_AGENT_ALLOWLIST)
        expect(result.write_paths).toEqual([])
      })
    })

    describe("fallback for unknown agents", () => {
      test("unknown agent with no sources gets empty write_paths", () => {
        // given unknown agent with no sources
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("unknown-agent-xyz", sources)

        // then defaults to empty write_paths
        expect(result.write_paths).toEqual([])
      })

      test("unknown agent can_delegate defaults to true", () => {
        // given unknown agent with no sources
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("unknown-agent-xyz", sources)

        // then can_delegate defaults to true
        expect(result.can_delegate).toBe(true)
      })

      test("unknown agent with frontmatter gets frontmatter values", () => {
        // given unknown agent with frontmatter
        const sources = {
          frontmatter: {
            write_paths: ["custom/**"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("unknown-agent-xyz", sources)

        // then uses frontmatter values
        expect(result.write_paths).toEqual(["custom/**"])
      })
    })

    describe("resolution precedence order", () => {
      test("full precedence chain: frontmatter -> squad -> config", () => {
        // given all sources with different values
        const sources = {
          frontmatter: {
            write_paths: ["frontmatter/**"],
            tool_allowlist: ["read"],
            can_delegate: true,
          },
          squad: {
            write_paths: ["squad/**"],
            tool_allowlist: ["read", "glob"],
            can_delegate: true,
          },
          config: {
            write_paths: ["config/**"],
            tool_allowlist: ["read", "glob", "bash"],
            can_delegate: false,
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("test-agent", sources)

        // then config (highest priority) wins for all fields
        expect(result.write_paths).toEqual(["config/**"])
        expect(result.tool_allowlist).toEqual(["read", "glob", "bash"])
        expect(result.can_delegate).toBe(false)
      })

      test("partial precedence: frontmatter + config only", () => {
        // given frontmatter and config only
        const sources = {
          frontmatter: {
            write_paths: ["frontmatter/**"],
            tool_allowlist: ["read"],
          },
          config: {
            write_paths: ["config/**"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("test-agent", sources)

        // then config overrides frontmatter
        expect(result.write_paths).toEqual(["config/**"])
        // tool_allowlist from frontmatter preserved (no config override)
        expect(result.tool_allowlist).toEqual(["read"])
      })

      test("partial precedence: squad + config for tool_denylist", () => {
        // given squad and config with tool_denylist
        const sources = {
          squad: {
            tool_denylist: ["dangerous-tool"],
          },
          config: {
            tool_denylist: ["dangerous-tool", "another-tool"],
          },
        }

        // when resolving capabilities
        const result = getAgentCapabilities("test-agent", sources)

        // then config overrides squad
        expect(result.tool_denylist).toEqual(["dangerous-tool", "another-tool"])
      })
    })

    describe("case insensitivity", () => {
      test("agent name matching is case insensitive for hardcoded defaults", () => {
        // given known agent with different case
        const sources = {}

        // when resolving with uppercase
        const result = getAgentCapabilities("KORD", sources)

        // then matches lowercase kord
        expect(result.write_paths).toEqual(["**"])
      })

      test("agent name matching is case insensitive for DEFAULT_AGENT_ALLOWLIST", () => {
        // given known agent with mixed case
        const sources = {}

        // when resolving with mixed case
        const result = getAgentCapabilities("Build", sources)

        // then matches build
        expect(result.write_paths).toEqual([
          "docs/kord/notepads/**",
          "docs/kord/runs/**",
          "docs/kord/plans/**",
          "docs/kord/drafts/**",
          "docs/kord/boulder.json",
        ])
      })
    })

    describe("empty source handling", () => {
      test("handles empty sources object", () => {
        // given empty sources
        const sources = {}

        // when resolving capabilities
        const result = getAgentCapabilities("some-agent", sources)

        // then returns valid capabilities
        expect(result).toBeDefined()
        expect(result.write_paths).toBeDefined()
        expect(Array.isArray(result.write_paths)).toBe(true)
      })

      test("handles undefined source fields", () => {
        // given sources with undefined fields
        const sources = {
          frontmatter: undefined,
          squad: undefined,
          config: undefined,
        }

        // when resolving capabilities
        const result = getAgentCapabilities("kord", sources)

        // then falls back to hardcoded defaults
        expect(result.write_paths).toEqual(["**"])
      })
    })
  })
})
