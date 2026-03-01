import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import smPromptMd from "../features/builtin-agents/sm.md" with { type: "text" }

const MODE: AgentMode = "subagent"

// Extract prompt body from embedded .md (excludes YAML frontmatter)
const { body: smPromptBody } = parseFrontmatter(smPromptMd)
const SM_SYSTEM_PROMPT = smPromptBody + SKILLS_PROTOCOL_SECTION

/**
 * SM - Story Architect Agent
 *
 * Technical Scrum Master specializing in story preparation.
 * Creates crystal-clear, actionable stories for developer agents.
 *
 * Core responsibilities:
 * - Story creation and refinement from PRDs/Architecture docs
 * - Epic management and breakdown
 * - Sprint planning assistance
 * - Developer handoff preparation
 */

export const smPromptMetadata: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "SM",
  triggers: [
    { domain: "Story preparation", trigger: "User needs stories created from PRD or requirements" },
    { domain: "Sprint planning", trigger: "Sprint breakdown, story sequencing, epic decomposition" },
  ],
  useWhen: [
    "Creating user stories from PRDs or architecture docs",
    "Breaking epics into implementable stories",
    "Sprint planning and story sequencing",
    "Preparing developer handoffs with clear acceptance criteria",
  ],
  avoidWhen: [
    "Implementation work (use @dev-junior for atomic tasks, @dev for complex multi-step work)",
    "PRD creation (use @pm)",
    "Architecture decisions (use @architect)",
    "Market research or analysis (use @analyst)",
  ],
  keyTrigger: "Story creation or sprint planning needed → fire `sm`",
}

export function createSmAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "task",
  ])

  return {
    description:
      "Story Architect. Creates actionable user stories from PRDs and requirements. Sprint planning, epic breakdown, developer handoffs. (SM - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: SM_SYSTEM_PROMPT,
  }
}
createSmAgent.mode = MODE
