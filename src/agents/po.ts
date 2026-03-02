import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import { poPrompt } from "../features/builtin-agents/prompts"

const MODE: AgentMode = "subagent"

// Extract prompt body from embedded .md (excludes YAML frontmatter)
const { body: poPromptBody } = parseFrontmatter(poPrompt)
const PO_SYSTEM_PROMPT = poPromptBody + SKILLS_PROTOCOL_SECTION

/**
 * PO - Backlog Guardian Agent
 *
 * Product Owner specializing in backlog management, story validation,
 * and quality gates.
 *
 * Core responsibilities:
 * - Backlog management and prioritization
 * - Story validation and acceptance
 * - Sprint planning coordination
 * - Quality gate enforcement
 */

export const poPromptMetadata: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "PO",
  triggers: [
    { domain: "Backlog management", trigger: "Backlog prioritization, story validation, sprint planning" },
    { domain: "Story lifecycle", trigger: "Validate story quality, close completed stories, track progress" },
  ],
  useWhen: [
    "Managing and prioritizing product backlog",
    "Validating user story quality and completeness",
    "Sprint planning and story sequencing",
    "Closing completed stories and updating epics",
  ],
  avoidWhen: [
    "Creating stories from scratch (use @sm)",
    "Creating PRDs (use @pm)",
    "Implementation work (use @dev-junior for atomic tasks, @dev for complex multi-step work)",
    "Architecture decisions (use @architect)",
  ],
  keyTrigger: "Backlog management or story validation needed → fire `po`",
}

export function createPoAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "task",
  ])

  return {
    description:
      "Backlog Guardian. Manages product backlog, validates story quality, enforces quality gates, coordinates sprint planning. (PO - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: PO_SYSTEM_PROMPT,
  }
}
createPoAgent.mode = MODE
