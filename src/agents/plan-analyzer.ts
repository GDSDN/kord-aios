import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import planAnalyzerPromptMd from "../features/builtin-agents/plan-analyzer.md" with { type: "text" }

const MODE: AgentMode = "subagent"
export const PLAN_ANALYZER_SYSTEM_PROMPT = parseFrontmatter(planAnalyzerPromptMd).body

/**
 * Plan Analyzer - Pre-Planning Gap Analysis Agent
 *
 * Reviews requests BEFORE planning to identify ambiguities, missing constraints,
 * and AI failure patterns. Produces actionable directives for Plan.
 */

const planAnalyzerRestrictions = createAgentToolRestrictions([
  "write",
  "edit",
  "task",
])

export function createPlanAnalyzerAgent(model: string): AgentConfig {
  return {
    description:
      "Pre-planning consultant that analyzes requests to identify hidden intentions, ambiguities, and AI failure points. (Plan Analyzer - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.3,
    ...planAnalyzerRestrictions,
    prompt: PLAN_ANALYZER_SYSTEM_PROMPT + SKILLS_PROTOCOL_SECTION,
    thinking: { type: "enabled", budgetTokens: 32000 },
  } as AgentConfig
}
createPlanAnalyzerAgent.mode = MODE

export const planAnalyzerPromptMetadata: AgentPromptMetadata = {
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
  ],
  avoidWhen: [
    "Simple, well-defined tasks",
    "User has already provided detailed requirements",
  ],
  promptAlias: "Plan Analyzer",
  keyTrigger: "Ambiguous or complex request → consult Plan Analyzer before Plan",
}
