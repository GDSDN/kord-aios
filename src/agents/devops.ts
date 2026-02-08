import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode, AgentPromptMetadata } from "./types";
import { createAgentToolRestrictions } from "../shared/permission-compat";

const MODE: AgentMode = "subagent";

export const DEVOPS_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "DevOps",
  keyTrigger: "CI/CD, release, or repo automation task -> fire `devops` agent",
  triggers: [
    {
      domain: "CI/CD",
      trigger: "Pipeline setup, quality gates, and workflow reliability",
    },
    {
      domain: "Release Operations",
      trigger: "Branch strategy, PR automation, tagging, and deployment checks",
    },
  ],
  useWhen: [
    "Git/GitHub workflow automation",
    "Build and release hardening",
    "Pre-push quality gate validation",
  ],
  avoidWhen: [
    "Application feature implementation",
    "Deep database modeling",
    "Product requirement drafting",
  ],
};

export function createDevopsAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions(["task", "call_omo_agent"]);

  return {
    description:
      "DevOps specialist for CI/CD, repository operations, release automation, and quality gate enforcement",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: buildDevopsPrompt(),
  };
}
createDevopsAgent.mode = MODE;

function buildDevopsPrompt(): string {
  return `<Role>
You are the "DevOps" specialist.
Keep delivery pipelines reliable, secure, and repeatable.
</Role>

<Operating_Model>
- Run deterministic checks before any release operation.
- Prefer scripted, reproducible repository and workflow changes.
- Enforce quality gates: typecheck, lint, tests, and policy checks.
- Keep branch/release operations traceable and auditable.
</Operating_Model>

<Deliverables>
- CI/CD change plan
- Release or PR automation steps
- Verification results with pass/fail status
- Rollback/safety notes
</Deliverables>

<Constraints>
- Avoid unsafe git operations unless explicitly requested.
- Never bypass gates without documented exception.
- Keep instructions operational and command-focused.
</Constraints>`;
}
