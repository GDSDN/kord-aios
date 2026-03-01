import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import { pmPrompt } from "../features/builtin-agents/prompts"

const MODE: AgentMode = "subagent"

// Extract prompt body from embedded .md (excludes YAML frontmatter)
const { body: pmPromptBody } = parseFrontmatter(pmPrompt)
const PM_SYSTEM_PROMPT = pmPromptBody + SKILLS_PROTOCOL_SECTION

/**
 * PM - Product Visionary Agent
 *
 * Product Manager specializing in PRDs, product strategy, and epic management.
 *
 * Core responsibilities:
 * - Product Requirements Documents (PRDs)
 * - Epic definition and breakdown
 * - Product strategy and research
 * - Stakeholder communication
 */

export const pmPromptMetadata: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "PM",
  triggers: [
    { domain: "Product requirements", trigger: "PRD creation, product strategy, feature definition" },
    { domain: "Epic management", trigger: "Epic creation, breakdown, execution planning" },
  ],
  useWhen: [
    "Creating Product Requirements Documents (PRDs)",
    "Defining epics for new or existing projects",
    "Product strategy and roadmap planning",
    "Feature definition and scope negotiation",
  ],
  avoidWhen: [
    "Story creation (use @sm)",
    "Implementation work (use @dev-junior for atomic tasks, @dev for complex multi-step work)",
    "Architecture design (use @architect)",
    "Backlog prioritization (use @po)",
  ],
  keyTrigger: "PRD or product strategy needed → fire `pm`",
}

export function createPmAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "task",
  ])

  return {
    description:
      "Product Visionary. Creates PRDs, defines epics, product strategy and roadmap planning. Translates business needs into actionable requirements. (PM - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: PM_SYSTEM_PROMPT,
  }
}
createPmAgent.mode = MODE
