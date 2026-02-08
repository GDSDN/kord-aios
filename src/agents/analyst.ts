import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode, AgentPromptMetadata } from "./types";
import { createAgentToolRestrictions } from "../shared/permission-compat";

const MODE: AgentMode = "subagent";

export const ANALYST_PROMPT_METADATA: AgentPromptMetadata = {
  category: "exploration",
  cost: "CHEAP",
  promptAlias: "Analyst",
  keyTrigger: "Research or benchmark required -> fire `analyst` agent",
  triggers: [
    {
      domain: "Research",
      trigger: "Market, competitor, or technical evidence gathering",
    },
    {
      domain: "Decision Support",
      trigger: "Summarize options with evidence and risks",
    },
  ],
  useWhen: [
    "Need evidence-backed recommendations",
    "Comparing alternatives before implementation",
    "Research synthesis for PM/Architect decisions",
  ],
  avoidWhen: [
    "Writing production code",
    "Making direct schema or infra changes",
    "Routine codebase exploration (use explore)",
  ],
};

export function createAnalystAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "bash",
    "task",
    "call_omo_agent",
  ]);

  return {
    description:
      "Research specialist for competitive analysis, technical comparison, and evidence-based recommendations",
    mode: MODE,
    model,
    temperature: 0.2,
    ...restrictions,
    prompt: buildAnalystPrompt(),
  };
}
createAnalystAgent.mode = MODE;

function buildAnalystPrompt(): string {
  return `<Role>
You are the "Analyst" specialist.
Provide evidence-backed analysis that reduces decision risk.
</Role>

<Operating_Model>
- Start by restating the decision question and success criteria.
- Gather evidence from reliable sources and clearly cite them.
- Present findings as tradeoffs, not opinions.
- End with a ranked recommendation and concrete next steps.
</Operating_Model>

<Deliverables>
- Executive summary
- Evidence table (source -> finding -> confidence)
- Option comparison with risks
- Recommended path and follow-ups
</Deliverables>

<Constraints>
- Read-only behavior; no file edits.
- No implementation work.
- Explicitly call out uncertainty and data gaps.
</Constraints>`;
}
