import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import squadCreatorPromptMd from "../features/builtin-agents/squad-creator.md" with { type: "text" }

const MODE: AgentMode = "subagent"
const { body: squadCreatorPromptBody } = parseFrontmatter(squadCreatorPromptMd)
const SQUAD_CREATOR_SYSTEM_PROMPT = squadCreatorPromptBody + SKILLS_PROTOCOL_SECTION

/**
 * Squad Creator - Squad Assembler Agent
 *
 * Meta-agent that creates specialized agent squads for any domain.
 * Researches domain experts, creates agent personas, generates workflows.
 *
 * Core responsibilities:
 * - Research domain experts and best practices
 * - Create agent persona definitions
 * - Generate task workflows and templates
 * - Validate squad structure against quality schema
 * - Package as distributable squad (SQUAD.yaml)
 */

export const squadCreatorPromptMetadata: AgentPromptMetadata = {
  category: "utility",
  cost: "EXPENSIVE",
  promptAlias: "Squad Creator",
  triggers: [
    { domain: "Squad creation", trigger: "User explicitly wants to create a new specialized agent team" },
  ],
  useWhen: [
    "User explicitly says 'create squad', 'generate SQUAD.yaml', or 'I need a new agent team'",
    "User explicitly requests a new specialized agent squad for a specific domain",
  ],
  avoidWhen: [
    "General planning, investigating, debugging, or routine tasks",
    "When user is just describing a problem or asking for help",
    "DO NOT trigger unless user specifically asks to create a squad",
  ],
  keyTrigger: "ONLY when user explicitly types 'create squad', 'generate SQUAD.yaml', or explicitly asks for a new agent team",
}

export function createSquadCreatorAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "task",
  ])

  return {
    description:
      "Squad Assembler. Creates specialized agent teams for any domain. Researches experts, designs personas, generates workflows and quality gates. (Squad Creator - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.2,
    ...restrictions,
    prompt: SQUAD_CREATOR_SYSTEM_PROMPT,
  }
}
createSquadCreatorAgent.mode = MODE
