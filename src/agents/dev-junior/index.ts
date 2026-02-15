/**
 * Dev-Junior - Focused Task Executor
 *
 * Executes delegated tasks directly without spawning other agents.
 * Category-spawned executor with domain-specific configurations.
 *
 * Routing:
 * 1. GPT models (openai/*, github-copilot/gpt-*) -> gpt.ts (GPT-5.2 optimized)
 * 2. Default (Claude, etc.) -> default.ts (Claude-optimized)
 */

import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode } from "../types"
import { isGptModel } from "../types"
import type { AgentOverrideConfig } from "../../config/schema"
import {
  createAgentToolRestrictions,
  type PermissionValue,
} from "../../shared/permission-compat"

import { buildDefaultKordJuniorPrompt } from "./default"
import { buildGptKordJuniorPrompt } from "./gpt"

export { buildDefaultKordJuniorPrompt } from "./default"
export { buildGptKordJuniorPrompt } from "./gpt"

const MODE: AgentMode = "subagent"

// Core tools that Dev-Junior must NEVER have access to
// Note: call_kord_agent is ALLOWED so subagents can spawn explore/librarian
const BLOCKED_TOOLS = ["task"]

export const DEV_JUNIOR_DEFAULTS = {
  model: "anthropic/claude-sonnet-4-5",
  temperature: 0.1,
} as const

export type KordJuniorPromptSource = "default" | "gpt"

/**
 * Determines which Dev-Junior prompt to use based on model.
 */
export function getKordJuniorPromptSource(model?: string): KordJuniorPromptSource {
  if (model && isGptModel(model)) {
    return "gpt"
  }
  return "default"
}

/**
 * Builds the appropriate Dev-Junior prompt based on model.
 */
export function buildKordJuniorPrompt(
  model: string | undefined,
  useTaskSystem: boolean,
  promptAppend?: string
): string {
  const source = getKordJuniorPromptSource(model)

  switch (source) {
    case "gpt":
      return buildGptKordJuniorPrompt(useTaskSystem, promptAppend)
    case "default":
    default:
      return buildDefaultKordJuniorPrompt(useTaskSystem, promptAppend)
  }
}

export function createDevJuniorAgentWithOverrides(
  override: AgentOverrideConfig | undefined,
  systemDefaultModel?: string,
  useTaskSystem = false
): AgentConfig {
  if (override?.disable) {
    override = undefined
  }

  const model = override?.model ?? systemDefaultModel ?? DEV_JUNIOR_DEFAULTS.model
  const temperature = override?.temperature ?? DEV_JUNIOR_DEFAULTS.temperature

  const promptAppend = override?.prompt_append
  const prompt = buildKordJuniorPrompt(model, useTaskSystem, promptAppend)

  const baseRestrictions = createAgentToolRestrictions(BLOCKED_TOOLS)

  const userPermission = (override?.permission ?? {}) as Record<string, PermissionValue>
  const basePermission = baseRestrictions.permission
  const merged: Record<string, PermissionValue> = { ...userPermission }
  for (const tool of BLOCKED_TOOLS) {
    merged[tool] = "deny"
  }
  merged.call_kord_agent = "allow"
  const toolsConfig = { permission: { ...merged, ...basePermission } }

  const base: AgentConfig = {
    description: override?.description ??
      "Focused task executor. Atomic implementation, single-file changes, bug fixes. Uses call_kord_agent for explore/librarian. (Dev-Junior - Kord AIOS)",
    mode: MODE,
    model,
    temperature,
    maxTokens: 64000,
    prompt,
    color: override?.color ?? "#20B2AA",
    ...toolsConfig,
  }

  if (override?.top_p !== undefined) {
    base.top_p = override.top_p
  }

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium" } as AgentConfig
  }

  return {
    ...base,
    thinking: { type: "enabled", budgetTokens: 32000 },
  } as AgentConfig
}

createDevJuniorAgentWithOverrides.mode = MODE
