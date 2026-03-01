import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import uxDesignExpertPromptMd from "../features/builtin-agents/ux-design-expert.md" with { type: "text" }

const MODE: AgentMode = "subagent"
const { body: uxDesignExpertPromptBody } = parseFrontmatter(uxDesignExpertPromptMd)
const UX_DESIGN_EXPERT_SYSTEM_PROMPT = uxDesignExpertPromptBody + SKILLS_PROTOCOL_SECTION

/**
 * UX Design Expert - Interface Soul Agent
 *
 * UX/UI Designer and Design System Architect.
 * Hybrid methodology: user-centric research + data-driven systems.
 *
 * Core responsibilities:
 * - User research and empathetic discovery
 * - Wireframing and interaction design
 * - Design system architecture (Atomic Design)
 * - Accessibility (WCAG AA minimum)
 * - Design token extraction and component specs
 */

export const uxDesignExpertPromptMetadata: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "UX Design Expert",
  triggers: [
    { domain: "UX Research", trigger: "User research, personas, journey maps, usability analysis" },
    { domain: "UI Design", trigger: "Wireframes, component design, design system architecture" },
    { domain: "Accessibility", trigger: "WCAG compliance, accessibility audit, inclusive design" },
  ],
  useWhen: [
    "User research and persona development",
    "Wireframing and interaction design",
    "Design system creation or audit",
    "Accessibility review and WCAG compliance",
    "Component specification and design tokens",
  ],
  avoidWhen: [
    "Frontend implementation (use @dev-junior for atomic tasks, @dev for complex multi-step work)",
    "Visual asset creation (use @vision for analysis)",
    "Product strategy (use @pm)",
  ],
  keyTrigger: "UX/UI design, accessibility, or design system work → fire `ux-design-expert`",
}

export function createUxDesignExpertAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "task",
  ])

  return {
    description:
      "Interface Soul. UX research, wireframes, design systems (Atomic Design), accessibility (WCAG), component specifications and design tokens. (UX Design Expert - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: UX_DESIGN_EXPERT_SYSTEM_PROMPT,
  }
}
createUxDesignExpertAgent.mode = MODE
