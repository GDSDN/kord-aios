import { describe, it, expect } from "bun:test"
import type { OhMyOpenCodeConfig } from "../../config"
import { resolveRunAgent } from "./runner"

const createConfig = (overrides: Partial<OhMyOpenCodeConfig> = {}): OhMyOpenCodeConfig => ({
  ...overrides,
})

describe("resolveRunAgent", () => {
  it("uses CLI agent over env and config", () => {
    // given
    const config = createConfig({ default_run_agent: "plan" })
    const env = { OPENCODE_DEFAULT_AGENT: "Atlas" }

    // when
    const agent = resolveRunAgent(
      { message: "test", agent: "Dev" },
      config,
      env
    )

    // then
    expect(agent).toBe("dev")
  })

  it("uses env agent over config", () => {
    // given
    const config = createConfig({ default_run_agent: "plan" })
    const env = { OPENCODE_DEFAULT_AGENT: "Atlas" }

    // when
    const agent = resolveRunAgent({ message: "test" }, config, env)

    // then
    expect(agent).toBe("builder")
  })

  it("uses config agent over default", () => {
    // given
    const config = createConfig({ default_run_agent: "Planner" })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("planner")
  })

  it("falls back to kord when none set", () => {
    // given
    const config = createConfig()

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("kord")
  })

  it("skips disabled kord for next available core agent", () => {
    // given
    const config = createConfig({ disabled_agents: ["kord"] })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("dev")
  })
})
