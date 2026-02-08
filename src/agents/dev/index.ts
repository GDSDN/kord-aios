import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode } from "../types";
import { isGptModel } from "../types";
import type { AgentOverrideConfig } from "../../config/schema";
import {
  createAgentToolRestrictions,
  type PermissionValue,
} from "../../shared/permission-compat";

import { buildDefaultDevPrompt } from "./default";
import { buildGptDevPrompt } from "./gpt";

export { buildDefaultDevPrompt } from "./default";
export { buildGptDevPrompt } from "./gpt";

const MODE: AgentMode = "subagent";

const BLOCKED_TOOLS = ["task"];

export const DEV_DEFAULTS = {
  model: "anthropic/claude-sonnet-4-5",
  temperature: 0.1,
} as const;

export type DevPromptSource = "default" | "gpt";

export function getDevPromptSource(model?: string): DevPromptSource {
  if (model && isGptModel(model)) {
    return "gpt";
  }
  return "default";
}

export function buildDevPrompt(
  model: string | undefined,
  useTaskSystem: boolean,
  promptAppend?: string,
): string {
  const source = getDevPromptSource(model);

  switch (source) {
    case "gpt":
      return buildGptDevPrompt(useTaskSystem, promptAppend);
    case "default":
    default:
      return buildDefaultDevPrompt(useTaskSystem, promptAppend);
  }
}

export function createDevAgentWithOverrides(
  override: AgentOverrideConfig | undefined,
  systemDefaultModel?: string,
  useTaskSystem = false,
): AgentConfig {
  if (override?.disable) {
    override = undefined;
  }

  const model = override?.model ?? systemDefaultModel ?? DEV_DEFAULTS.model;
  const temperature = override?.temperature ?? DEV_DEFAULTS.temperature;

  const promptAppend = override?.prompt_append;
  const prompt = buildDevPrompt(model, useTaskSystem, promptAppend);

  const baseRestrictions = createAgentToolRestrictions(BLOCKED_TOOLS);

  const userPermission = (override?.permission ?? {}) as Record<
    string,
    PermissionValue
  >;
  const basePermission = baseRestrictions.permission;
  const merged: Record<string, PermissionValue> = { ...userPermission };
  for (const tool of BLOCKED_TOOLS) {
    merged[tool] = "deny";
  }
  merged.call_omo_agent = "allow";
  const toolsConfig = { permission: { ...merged, ...basePermission } };

  const base: AgentConfig = {
    description:
      override?.description ??
      "DEV - Developer agent for Open-AIOS. Story-aware, evidence-driven implementation partner.",
    mode: MODE,
    model,
    temperature,
    maxTokens: 64000,
    prompt,
    color: override?.color ?? "#20B2AA",
    ...toolsConfig,
  };

  if (override?.top_p !== undefined) {
    base.top_p = override.top_p;
  }

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium" } as AgentConfig;
  }

  return {
    ...base,
    thinking: { type: "enabled", budgetTokens: 32000 },
  } as AgentConfig;
}

export function createDevAgent(model: string): AgentConfig {
  return createDevAgentWithOverrides(undefined, model);
}

createDevAgentWithOverrides.mode = MODE;
createDevAgent.mode = MODE;
