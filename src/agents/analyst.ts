import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import { analystPrompt } from "../features/builtin-agents/prompts"

const MODE: AgentMode = "subagent"
export const ANALYST_SYSTEM_PROMPT = parseFrontmatter(analystPrompt).body

/**
 * Analyst - Plan Consultant Agent
 *
 * Analyzes user requests BEFORE planning to prevent AI failures.
 *
 * Core responsibilities:
 * - Identify hidden intentions and unstated requirements
 * - Detect ambiguities that could derail implementation
 * - Flag potential AI-slop patterns (over-engineering, scope creep)
 * - Generate clarifying questions for the user
 * - Prepare directives for the planner agent
 */

const analystRestrictions = createAgentToolRestrictions([
  "write",
  "edit",
  "task",
])

export function createAnalystAgent(model: string): AgentConfig {
  return {
    description:
      "Pre-planning consultant and strategic research partner. Analyzes requests to identify hidden intentions, ambiguities, and AI failure points. Evidence-based, curiosity-driven. (Analyst - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.3,
    ...analystRestrictions,
    prompt: ANALYST_SYSTEM_PROMPT + SKILLS_PROTOCOL_SECTION,
    thinking: { type: "enabled", budgetTokens: 32000 },
  } as AgentConfig
}
createAnalystAgent.mode = MODE

export const analystPromptMetadata: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  triggers: [
    {
      domain: "Pre-planning analysis",
      trigger: "Complex task requiring scope clarification, ambiguous requirements",
    },
  ],
  useWhen: [
    "Before planning non-trivial tasks",
    "When user request is ambiguous or open-ended",
    "To prevent AI over-engineering patterns",
    "Market or competitive research is requested",
    "Structured brainstorming or ideation is needed",
  ],
  avoidWhen: [
    "Simple, well-defined tasks",
    "User has already provided detailed requirements",
  ],
  promptAlias: "Analyst",
  keyTrigger: "Ambiguous or complex request → consult Analyst before Plan",
}
