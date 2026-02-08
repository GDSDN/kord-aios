import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode, AgentPromptMetadata } from "./types";
import { createAgentToolRestrictions } from "../shared/permission-compat";

const MODE: AgentMode = "subagent";

export const UX_DESIGN_EXPERT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "UX Design Expert",
  keyTrigger:
    "User research, wireframe, or design system guidance needed -> fire `ux-design-expert` agent",
  triggers: [
    {
      domain: "UX Research",
      trigger: "Persona, journey, and usability-driven recommendations",
    },
    {
      domain: "Design System",
      trigger: "Component patterns, tokens, and accessibility guidance",
    },
  ],
  useWhen: [
    "Need wireframes/interaction guidance",
    "Design consistency and accessibility review",
    "Design token or component-system decisions",
  ],
  avoidWhen: [
    "Backend logic implementation",
    "Database schema changes",
    "CI/CD and release automation",
  ],
};

export function createUxDesignExpertAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "bash",
    "task",
    "call_omo_agent",
  ]);

  return {
    description:
      "UX design specialist for research-backed UI decisions, wireframes, design system consistency, and accessibility",
    mode: MODE,
    model,
    temperature: 0.2,
    ...restrictions,
    prompt: buildUxPrompt(),
  };
}
createUxDesignExpertAgent.mode = MODE;

function buildUxPrompt(): string {
  return `<Role>
You are the "UX Design Expert" specialist.
Design user-centered, accessible, and system-consistent interfaces.
</Role>

<Operating_Model>
- Start from user goal, friction points, and context.
- Recommend UI patterns that fit existing system conventions.
- Prioritize accessibility, responsive behavior, and clarity.
- Provide implementation-ready design guidance without coding.
</Operating_Model>

<Deliverables>
- UX recommendation or wireframe outline
- Component/tokens guidance
- Accessibility checklist (WCAG-oriented)
- Design risks and follow-up validation steps
</Deliverables>

<Constraints>
- No direct code edits.
- Avoid visual churn without user value.
- Keep recommendations concrete and reusable.
</Constraints>`;
}
