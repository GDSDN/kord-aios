import { describe, it, expect } from "bun:test";
import type { OhMyOpenCodeConfig } from "../../config";
import { resolveRunAgent } from "./runner";

const createConfig = (
  overrides: Partial<OhMyOpenCodeConfig> = {},
): OhMyOpenCodeConfig => ({
  ...overrides,
});

describe("resolveRunAgent", () => {
  it("uses CLI agent over env and config", () => {
    // given
    const config = createConfig({ default_run_agent: "plan" });
    const env = { OPENCODE_DEFAULT_AGENT: "Atlas" };

    // when
    const agent = resolveRunAgent(
      { message: "test", agent: "Hephaestus" },
      config,
      env,
    );

    // then
    expect(agent).toBe("deep");
  });

  it("uses env agent over config", () => {
    // given
    const config = createConfig({ default_run_agent: "plan" });
    const env = { OPENCODE_DEFAULT_AGENT: "Atlas" };

    // when
    const agent = resolveRunAgent({ message: "test" }, config, env);

    // then
    expect(agent).toBe("build-loop");
  });

  it("uses config agent over default", () => {
    // given
    const config = createConfig({ default_run_agent: "Prometheus" });

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {});

    // then
    expect(agent).toBe("plan");
  });

  it("falls back to build when none set", () => {
    // given
    const config = createConfig();

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {});

    // then
    expect(agent).toBe("build");
  });

  it("skips disabled build for next available core agent", () => {
    // given
    const config = createConfig({ disabled_agents: ["sisyphus"] });

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {});

    // then
    expect(agent).toBe("deep");
  });
});
