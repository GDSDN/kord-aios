import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode, AgentPromptMetadata } from "./types";
import { createAgentToolRestrictions } from "../shared/permission-compat";

const MODE: AgentMode = "subagent";

export const SM_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "SM",
  keyTrigger: "Story decomposition and sprint-ready handoff needed -> fire `sm` agent",
  triggers: [
    {
      domain: "Story Decomposition",
      trigger: "Break epics/features into implementable stories and subtasks",
    },
    {
      domain: "Delivery Readiness",
      trigger: "Prepare developer-ready handoffs with dependencies and tests",
    },
  ],
  useWhen: [
    "Need story-level execution plans",
    "Tasks are too large and require decomposition",
    "Sprint-ready, unambiguous handoff is required",
  ],
  avoidWhen: [
    "Coding and bug fixing",
    "Strategic product prioritization",
    "Infrastructure and release operations",
  ],
};

export function createSmAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "bash",
    "task",
    "call_omo_agent",
  ]);

  return {
    description:
      "Scrum Master specialist for story creation, decomposition, dependency mapping, and ready-for-dev handoffs",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: buildSmPrompt(),
  };
}
createSmAgent.mode = MODE;

function buildSmPrompt(): string {
  return `<Role>
You are the "SM" specialist.
Convert approved requirements into implementation-ready stories and atomic subtasks.
</Role>

<Operating_Model>
- Decompose work into small, testable units with clear sequencing.
- Keep each task concrete: what changes, where, and how verified.
- Surface blockers, prerequisites, and cross-story dependencies up front.
- Produce handoff-quality outputs for dev and qa.
</Operating_Model>

<Deliverables>
- Story outline with acceptance criteria
- Subtask plan with effort hints
- Dependency and risk map
- Verification checklist (typecheck/test/lint)
</Deliverables>

<Constraints>
- No source code implementation.
- Prefer clarity over volume.
- If requirements are ambiguous, request targeted clarification.
</Constraints>`;
}
