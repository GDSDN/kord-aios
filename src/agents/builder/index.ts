/**
 * Build - Master Orchestrator Agent
 *
 * Orchestrates work via task() to complete ALL tasks in a todo list until fully done.
 * You are the conductor of a symphony of specialized agents.
 *
 * Routing:
 * 1. GPT models (openai/*, github-copilot/gpt-*) → gpt.ts (GPT-5.2 optimized)
 * 2. Default (Claude, etc.) → default.ts (Claude-optimized)
 */

import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "../types"
import { isGptModel } from "../types"
import type { AvailableAgent, AvailableSkill, AvailableCategory } from "../dynamic-agent-prompt-builder"
import { buildCategorySkillsDelegationGuide } from "../dynamic-agent-prompt-builder"
import type { CategoryConfig } from "../../config/schema"
import { DEFAULT_CATEGORIES } from "../../tools/delegate-task/constants"
import { createAgentToolRestrictions } from "../../shared/permission-compat"

import { BUILD_SYSTEM_PROMPT, getDefaultBuildPrompt } from "./default"
import { BUILD_GPT_SYSTEM_PROMPT, getGptBuildPrompt } from "./gpt"
import {
  getCategoryDescription,
  buildAgentSelectionSection,
  buildCategorySection,
  buildSkillsSection,
  buildDecisionMatrix,
} from "./utils"

export { BUILD_SYSTEM_PROMPT, getDefaultBuildPrompt } from "./default"
export { BUILD_GPT_SYSTEM_PROMPT, getGptBuildPrompt } from "./gpt"
export {
  getCategoryDescription,
  buildAgentSelectionSection,
  buildCategorySection,
  buildSkillsSection,
  buildDecisionMatrix,
} from "./utils"
export { isGptModel }

const MODE: AgentMode = "primary"

export type BuildPromptSource = "default" | "gpt"

/**
 * Determines which Build prompt to use based on model.
 */
export function getBuildPromptSource(model?: string): BuildPromptSource {
  if (model && isGptModel(model)) {
    return "gpt"
  }
  return "default"
}

export interface OrchestratorContext {
  model?: string
  availableAgents?: AvailableAgent[]
  availableSkills?: AvailableSkill[]
  userCategories?: Record<string, CategoryConfig>
}

/**
 * Gets the appropriate Build prompt based on model.
 */
export function getBuildPrompt(model?: string): string {
  const source = getBuildPromptSource(model)

  switch (source) {
    case "gpt":
      return getGptBuildPrompt()
    case "default":
    default:
      return getDefaultBuildPrompt()
  }
}

function buildDynamicOrchestratorPrompt(ctx?: OrchestratorContext): string {
  const agents = ctx?.availableAgents ?? []
  const skills = ctx?.availableSkills ?? []
  const userCategories = ctx?.userCategories
  const model = ctx?.model

  const allCategories = { ...DEFAULT_CATEGORIES, ...userCategories }
  const availableCategories: AvailableCategory[] = Object.entries(allCategories).map(([name]) => ({
    name,
    description: getCategoryDescription(name, userCategories),
  }))

  const categorySection = buildCategorySection(userCategories)
  const agentSection = buildAgentSelectionSection(agents)
  const decisionMatrix = buildDecisionMatrix(agents, userCategories)
  const skillsSection = buildSkillsSection(skills)
  const categorySkillsGuide = buildCategorySkillsDelegationGuide(availableCategories, skills)

  const basePrompt = getBuildPrompt(model)

  return basePrompt
    .replace("{CATEGORY_SECTION}", categorySection)
    .replace("{AGENT_SECTION}", agentSection)
    .replace("{DECISION_MATRIX}", decisionMatrix)
    .replace("{SKILLS_SECTION}", skillsSection)
    .replace("{{CATEGORY_SKILLS_DELEGATION_GUIDE}}", categorySkillsGuide)
}

export function createBuilderAgent(ctx: OrchestratorContext): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "task",
    "call_kord_agent",
  ])

  const baseConfig = {
    description:
      "Orchestrates work via task() to complete ALL tasks in a plan until fully done. Delegates to specialized agents, verifies results. (Builder - Kord AIOS)",
    mode: MODE,
    ...(ctx.model ? { model: ctx.model } : {}),
    temperature: 0.1,
    prompt: buildDynamicOrchestratorPrompt(ctx),
    color: "#10B981",
    ...restrictions,
  }

  return baseConfig as AgentConfig
}
createBuilderAgent.mode = MODE

export const builderPromptMetadata: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  promptAlias: "Build",
  triggers: [
    {
      domain: "Todo list orchestration",
      trigger: "Complete ALL tasks in a todo list with verification",
    },
    {
      domain: "Multi-agent coordination",
      trigger: "Parallel task execution across specialized agents",
    },
  ],
  useWhen: [
    "User provides a todo list path (docs/kord/plans/{name}.md)",
    "Multiple tasks need to be completed in sequence or parallel",
    "Work requires coordination across multiple specialized agents",
  ],
  avoidWhen: [
    "Single simple task that doesn't require orchestration",
    "Tasks that can be handled directly by one agent",
    "When user wants to execute tasks manually",
  ],
  keyTrigger:
    "Todo list path provided OR multiple tasks requiring multi-agent orchestration",
}
