import pc from "picocolors";
import type { RunOptions } from "./types";
import type { OhMyOpenCodeConfig } from "../../config";

const CORE_AGENT_ORDER = [
  "build",
  "deep",
  "plan",
  "build-loop",
  "kord",
] as const;
const DEFAULT_AGENT = "build";
const AGENT_ALIASES: Record<string, string> = {
  prometheus: "plan",
  sisyphus: "build",
  atlas: "build-loop",
  hephaestus: "deep",
  "aios-master": "kord",
  planner: "plan",
};

type EnvVars = Record<string, string | undefined>;

type AgentSelection = {
  input: string | undefined;
  normalized: string;
};

const normalizeAgentName = (agent?: string): string | undefined => {
  if (!agent) return undefined;
  const trimmed = agent.trim();
  if (!trimmed) return undefined;
  const lowered = trimmed.toLowerCase();
  const alias = AGENT_ALIASES[lowered];
  if (alias) return alias;
  const coreMatch = CORE_AGENT_ORDER.find(
    (name) => name.toLowerCase() === lowered,
  );
  return coreMatch ?? trimmed;
};

const isAgentDisabled = (
  agent: string,
  config: OhMyOpenCodeConfig,
): boolean => {
  const lowered =
    normalizeAgentName(agent)?.toLowerCase() ?? agent.toLowerCase();
  if (
    (lowered === "build" || lowered === "kord" || lowered === "sisyphus") &&
    config.sisyphus_agent?.disabled === true
  ) {
    return true;
  }
  return (config.disabled_agents ?? []).some((disabled) => {
    const normalizedDisabled =
      normalizeAgentName(disabled)?.toLowerCase() ?? disabled.toLowerCase();
    return normalizedDisabled === lowered;
  });
};

const pickFallbackAgent = (config: OhMyOpenCodeConfig): string => {
  for (const agent of CORE_AGENT_ORDER) {
    if (!isAgentDisabled(agent, config)) {
      return agent;
    }
  }
  return DEFAULT_AGENT;
};

const formatAgentForLog = ({ input, normalized }: AgentSelection): string => {
  if (
    input &&
    input.trim() &&
    input.toLowerCase() !== normalized.toLowerCase()
  ) {
    return `${input} (canonical: ${normalized})`;
  }
  return normalized;
};

export const resolveRunAgent = (
  options: RunOptions,
  pluginConfig: OhMyOpenCodeConfig,
  env: EnvVars = process.env,
): string => {
  const cliAgent = normalizeAgentName(options.agent);
  const envAgent = normalizeAgentName(env.OPENCODE_DEFAULT_AGENT);
  const configAgent = normalizeAgentName(pluginConfig.default_run_agent);

  let selection: AgentSelection;
  if (cliAgent) {
    selection = { input: options.agent, normalized: cliAgent };
  } else if (envAgent) {
    selection = { input: env.OPENCODE_DEFAULT_AGENT, normalized: envAgent };
  } else if (configAgent) {
    selection = {
      input: pluginConfig.default_run_agent,
      normalized: configAgent,
    };
  } else {
    selection = { input: undefined, normalized: DEFAULT_AGENT };
  }

  const normalized = selection.normalized;

  if (isAgentDisabled(normalized, pluginConfig)) {
    const fallback = pickFallbackAgent(pluginConfig);
    const fallbackDisabled = isAgentDisabled(fallback, pluginConfig);
    const requestedForLog = formatAgentForLog(selection);
    if (fallbackDisabled) {
      console.log(
        pc.yellow(
          `Requested agent "${requestedForLog}" is disabled and no enabled core agent was found. Proceeding with "${fallback}".`,
        ),
      );
      return fallback;
    }
    console.log(
      pc.yellow(
        `Requested agent "${requestedForLog}" is disabled. Falling back to "${fallback}".`,
      ),
    );
    return fallback;
  }

  return normalized;
};
