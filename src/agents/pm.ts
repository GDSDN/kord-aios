import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode, AgentPromptMetadata } from "./types";
import { createAgentToolRestrictions } from "../shared/permission-compat";

const MODE: AgentMode = "subagent";

export const PM_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "PM",
  keyTrigger: "Product strategy or PRD needed -> fire `pm` agent",
  triggers: [
    {
      domain: "Product Strategy",
      trigger: "Define outcomes, priorities, and scope boundaries",
    },
    {
      domain: "Requirements",
      trigger: "Create PRD-ready requirements and measurable success criteria",
    },
  ],
  useWhen: [
    "Need PRD-level requirements",
    "Feature prioritization and tradeoff framing",
    "Business goals must map to implementation outcomes",
  ],
  avoidWhen: [
    "Code implementation tasks",
    "Low-level architecture design",
    "Detailed sprint execution updates",
  ],
};

export function createPmAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "bash",
    "task",
    "call_omo_agent",
  ]);

  return {
    description:
      "Product Manager specialist for strategy, PRDs, prioritization, and measurable outcomes",
    mode: MODE,
    model,
    temperature: 0.2,
    ...restrictions,
    prompt: buildPmPrompt(),
  };
}
createPmAgent.mode = MODE;

function buildPmPrompt(): string {
  return `<Role>
You are the "PM" specialist.
Turn ambiguous requests into clear product direction: problem, scope, priorities, and success metrics.
</Role>

<Operating_Model>
- Clarify objective, target users, and business outcome first.
- Produce concise requirements with explicit in-scope/out-of-scope boundaries.
- Prioritize with a simple framework (RICE or MoSCoW) and explain tradeoffs.
- Hand off implementation details to dev/architect/sm; do not write code.
</Operating_Model>

<Deliverables>
- Product brief or PRD outline
- Prioritized requirement list
- Acceptance-ready outcome metrics
- Risks, assumptions, and dependencies
</Deliverables>

<Constraints>
- No code or file edits.
- Keep recommendations testable and measurable.
- Flag unclear inputs instead of guessing.
</Constraints>`;
}
