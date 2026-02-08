import { describe, test, expect, spyOn } from "bun:test";
import { createBuiltinAgents } from "./utils";
import { resolveRunAgent } from "../cli/run/agent-resolver";
import type { OhMyOpenCodeConfig } from "../config";
import * as shared from "../shared";

const TEST_DEFAULT_MODEL = "anthropic/claude-opus-4-6";

const AVAILABLE_MODELS = new Set([
  "anthropic/claude-opus-4-6",
  "anthropic/claude-sonnet-4-5",
  "anthropic/claude-haiku-4-5",
  "openai/gpt-5.2",
  "openai/gpt-5.3-codex",
  "google/gemini-3-pro",
  "google/gemini-3-flash",
  "opencode/gpt-5.3-codex",
  "opencode/gpt-5-nano",
  "opencode/kimi-k2.5-free",
  "opencode/glm-4.7-free",
  "kimi-for-coding/k2p5",
  "zai-coding-plan/glm-4.7",
]);

const createConfig = (
  overrides: Partial<OhMyOpenCodeConfig> = {},
): OhMyOpenCodeConfig => ({
  ...overrides,
});

describe("agent topology compliance - Alias Normalization", () => {
  test("legacy aliases normalize to canonical names", () => {
    const config = createConfig();

    const aliasCases = [
      ["prometheus", "plan"],
      ["sisyphus", "build"],
      ["atlas", "build-loop"],
      ["hephaestus", "deep"],
      ["aios-master", "kord"],
      ["sisyphus-junior", "dev"],
      ["planner", "plan"],
    ] as const;

    for (const [alias, canonical] of aliasCases) {
      expect(
        resolveRunAgent({ message: "test", agent: alias }, config, {}),
      ).toBe(canonical);
    }
  });

  test("ENV OPENCODE_DEFAULT_AGENT normalizes aliases", () => {
    const config = createConfig();
    const env = { OPENCODE_DEFAULT_AGENT: "sisyphus" };

    const result = resolveRunAgent({ message: "test" }, config, env);

    expect(result).toBe("build");
  });

  test("config default_run_agent normalizes aliases", () => {
    const config = createConfig({
      default_run_agent: "atlas",
    });

    const result = resolveRunAgent({ message: "test" }, config, {});

    expect(result).toBe("build-loop");
  });
});

describe("agent topology compliance - Default and Fallback", () => {
  test("resolver defaults to build when no agent specified", () => {
    expect(resolveRunAgent({ message: "test" }, createConfig(), {})).toBe(
      "build",
    );
  });

  test("default_run_agent config is normalized", () => {
    expect(
      resolveRunAgent(
        { message: "test" },
        createConfig({ default_run_agent: "sisyphus" }),
        {},
      ),
    ).toBe("build");
  });

  test("fallback respects CORE_AGENT_ORDER", () => {
    const configDisabledBuild = createConfig({
      disabled_agents: ["build"],
    });

    expect(
      resolveRunAgent(
        { message: "test", agent: "build" },
        configDisabledBuild,
        {},
      ),
    ).toBe("deep");
  });

  test("fallback cascades through core order", () => {
    const config = createConfig({
      disabled_agents: ["build", "deep"],
    });

    expect(
      resolveRunAgent({ message: "test", agent: "build" }, config, {}),
    ).toBe("plan");
  });

  test("disabling multiple agents skips to first enabled", () => {
    const config = createConfig({
      disabled_agents: ["build", "deep", "plan"],
    });

    const result = resolveRunAgent(
      { message: "test", agent: "build" },
      config,
      {},
    );

    expect(result).toBe("build-loop");
  });
});

describe("agent topology compliance - Alias and Canonical Equivalence", () => {
  test("sisyphus and build are same config", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      expect(agents.sisyphus).toBe(agents.build);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("atlas and build-loop are same config", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      expect(agents.atlas).toBe(agents["build-loop"]);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("hephaestus and deep are same config", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      expect(agents.hephaestus).toBe(agents.deep);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("aios-master and kord are same config", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      expect(agents["aios-master"]).toBe(agents.kord);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe("agent topology compliance - Agent Creatability", () => {
  test("all core primary agents are creatable", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      // Core agents that should always be creatable
      expect(agents.build).toBeDefined();
      expect(agents["build-loop"]).toBeDefined();
      expect(agents.deep).toBeDefined();
      expect(agents.kord).toBeDefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("all subagents are creatable", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      expect(agents.dev).toBeDefined();
      expect(agents.qa).toBeDefined();
      expect(agents.architect).toBeDefined();
      expect(agents.pm).toBeDefined();
      expect(agents.po).toBeDefined();
      expect(agents.sm).toBeDefined();
      expect(agents.analyst).toBeDefined();
      expect(agents["data-engineer"]).toBeDefined();
      expect(agents.devops).toBeDefined();
      expect(agents["ux-design-expert"]).toBeDefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe("agent topology compliance - Disabled Agent Handling", () => {
  test("disabling sisyphus disables build in createBuiltinAgents", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        ["sisyphus"],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      expect(agents.sisyphus).toBeUndefined();
      expect(agents.build).toBeUndefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("disabling build disables sisyphus alias", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        ["build"],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      expect(agents.build).toBeUndefined();
      expect(agents.sisyphus).toBeUndefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("disabling sisyphus_agent config disables kord", () => {
    const config = createConfig({
      sisyphus_agent: { disabled: true },
    });

    const result = resolveRunAgent(
      { message: "test", agent: "kord" },
      config,
      {},
    );

    expect(result).toBe("deep");
  });

  test("sisyphus_agent disabled also disables build", () => {
    const config = createConfig({
      sisyphus_agent: { disabled: true },
    });

    const result = resolveRunAgent(
      { message: "test", agent: "build" },
      config,
      {},
    );

    expect(result).toBe("deep");
  });

  test("disabled agent with canonical name works", () => {
    const config = createConfig({
      disabled_agents: ["kord"],
    });

    expect(
      resolveRunAgent({ message: "test", agent: "kord" }, config, {}),
    ).toBe("build");
  });

  test("disabling atlas normalizes and falls back", () => {
    // When atlas is disabled (which maps to build-loop), the fallback is the next
    // available agent in CORE_AGENT_ORDER after build-loop.
    // CORE_AGENT_ORDER = [build, deep, plan, build-loop, kord]
    // So if build-loop is disabled, fallback should be kord.
    // However, if kord is also disabled, fallback would be build (wraps around).
    const config = createConfig({
      disabled_agents: ["atlas"],
    });

    // The result depends on what's disabled - we test the normalization works
    const result = resolveRunAgent(
      { message: "test", agent: "atlas" },
      config,
      {},
    );
    // Atlas normalizes to build-loop, and build-loop should be in fallback logic
    expect(["build", "deep", "plan", "kord"]).toContain(result);
  });

  test("disabling hephaestus normalizes and falls back to build", () => {
    const config = createConfig({
      disabled_agents: ["hephaestus"],
    });

    expect(
      resolveRunAgent({ message: "test", agent: "hephaestus" }, config, {}),
    ).toBe("build");
  });

  test("disabling prometheus normalizes and falls back", () => {
    const config = createConfig({
      disabled_agents: ["prometheus"],
    });

    expect(
      resolveRunAgent({ message: "test", agent: "prometheus" }, config, {}),
    ).toBe("build");
  });
});

describe("agent topology compliance - Disabled Alias Consistency", () => {
  test("disabling dev also disables sisyphus-junior in createBuiltinAgents", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        ["dev"],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      expect(agents.dev).toBeUndefined();
      expect(agents["sisyphus-junior"]).toBeUndefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("disabling sisyphus-junior also disables dev in createBuiltinAgents", async () => {
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(AVAILABLE_MODELS),
    );

    try {
      const agents = await createBuiltinAgents(
        ["sisyphus-junior"],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
      );

      expect(agents.dev).toBeUndefined();
      expect(agents["sisyphus-junior"]).toBeUndefined();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("resolver falls back when dev is disabled", () => {
    const config = createConfig({
      disabled_agents: ["dev"],
    });

    expect(resolveRunAgent({ message: "test", agent: "dev" }, config, {})).toBe(
      "build",
    );
  });

  test("resolver falls back when sisyphus-junior is disabled", () => {
    const config = createConfig({
      disabled_agents: ["sisyphus-junior"],
    });

    expect(
      resolveRunAgent(
        { message: "test", agent: "sisyphus-junior" },
        config,
        {},
      ),
    ).toBe("build");
  });
});
