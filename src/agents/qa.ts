import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { isGptModel } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import { qaPrompt } from "../features/builtin-agents/prompts"

const MODE: AgentMode = "subagent"

// Extract prompt body from embedded .md (excludes YAML frontmatter)
const { body: qaPromptBody } = parseFrontmatter(qaPrompt)

/**
 * QA - Quality Guardian Agent
 *
 * Reviews work plans for executability, verifies references,
 * and provides structured quality gate decisions (OKAY/CONCERNS/REJECT).
 * Catches blocking gaps, ambiguities, and missing context before implementation.
 */

export const QA_SYSTEM_PROMPT = qaPromptBody + SKILLS_PROTOCOL_SECTION

export function createQaAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "task",
    "task",
  ])

  const base = {
    description:
      "Quality Guardian. Reviews work plans for executability, verifies references, provides structured quality gate decisions (OKAY/CONCERNS/REJECT). (QA - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: QA_SYSTEM_PROMPT,
  } as AgentConfig

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium", textVerbosity: "high" } as AgentConfig
  }

  return { ...base, thinking: { type: "enabled", budgetTokens: 32000 } } as AgentConfig
}
createQaAgent.mode = MODE

export const qaPromptMetadata: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  promptAlias: "QA",
  triggers: [
    {
      domain: "Plan review",
      trigger: "Evaluate work plans for clarity, verifiability, and completeness",
    },
    {
      domain: "Quality assurance",
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
  keyTrigger: "Work plan created → invoke QA for review before execution",
}
