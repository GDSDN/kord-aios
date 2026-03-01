import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { isGptModel } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import { planReviewerPrompt } from "../features/builtin-agents/prompts"

const MODE: AgentMode = "subagent"
export const PLAN_REVIEWER_SYSTEM_PROMPT = parseFrontmatter(planReviewerPrompt).body

/**
 * Plan Reviewer - Plan Review & Blocker Detection Agent
 *
 * Reviews work plans for executability and reference validity.
 */

export function createPlanReviewerAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "task",
  ])

  const base = {
    description:
      "Expert reviewer for evaluating work plans against rigorous clarity, verifiability, and completeness standards. (Plan Reviewer - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: PLAN_REVIEWER_SYSTEM_PROMPT + SKILLS_PROTOCOL_SECTION,
  } as AgentConfig

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium", textVerbosity: "high" } as AgentConfig
  }

  return { ...base, thinking: { type: "enabled", budgetTokens: 32000 } } as AgentConfig
}
createPlanReviewerAgent.mode = MODE

export const planReviewerPromptMetadata: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  promptAlias: "Plan Reviewer",
  triggers: [
    {
      domain: "Plan review",
      trigger: "Evaluate work plans for clarity, verifiability, and completeness",
    },
    {
      domain: "Blocker detection",
      trigger: "Catch gaps, ambiguities, and missing context before implementation",
    },
  ],
  useWhen: [
    "After Plan creates a work plan",
    "Before executing a complex todo list",
    "To validate plan quality before delegating to executors",
    "When plan needs rigorous review for ADHD-driven omissions",
  ],
  avoidWhen: [
    "Simple, single-task requests",
    "When user explicitly wants to skip review",
    "For trivial plans that don't need formal review",
  ],
  keyTrigger: "Work plan created → invoke Plan Reviewer for review before execution",
}
