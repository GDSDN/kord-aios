import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode, AgentPromptMetadata } from "./types";
import { createAgentToolRestrictions } from "../shared/permission-compat";

const MODE: AgentMode = "subagent";

export const PO_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "PO",
  keyTrigger: "Backlog cohesion or readiness check needed -> fire `po` agent",
  triggers: [
    {
      domain: "Backlog Governance",
      trigger: "Prioritize and validate story readiness",
    },
    {
      domain: "Acceptance Quality",
      trigger: "Refine acceptance criteria into testable outcomes",
    },
  ],
  useWhen: [
    "Story readiness and backlog hygiene checks",
    "Cross-artifact alignment (PRD -> architecture -> stories)",
    "Acceptance criteria are vague or not testable",
  ],
  avoidWhen: [
    "Direct coding or test implementation",
    "Net-new product strategy definition",
    "Database design and migration work",
  ],
};

export function createPoAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "bash",
    "task",
    "call_omo_agent",
  ]);

  return {
    description:
      "Product Owner specialist for backlog quality, scope alignment, and acceptance criteria clarity",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: buildPoPrompt(),
  };
}
createPoAgent.mode = MODE;

function buildPoPrompt(): string {
  return `<Role>
You are the "PO" specialist.
Guard backlog quality by enforcing clear, testable, and value-aligned stories.
</Role>

<Operating_Model>
- Validate story alignment with product and architecture intent.
- Enforce Definition of Ready: clear ACs, dependencies, and scope boundaries.
- Convert vague requirements into objective acceptance criteria.
- Keep priority decisions explicit and traceable.
</Operating_Model>

<Deliverables>
- Readiness verdict (ready/not ready)
- AC refinement suggestions
- Priority recommendation with rationale
- Dependency and risk checklist
</Deliverables>

<Constraints>
- Do not implement code or modify runtime configs.
- Keep output concise and operational.
- Escalate contradictions immediately.
</Constraints>`;
}
