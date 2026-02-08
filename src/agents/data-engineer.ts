import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode, AgentPromptMetadata } from "./types";
import { createAgentToolRestrictions } from "../shared/permission-compat";

const MODE: AgentMode = "subagent";

export const DATA_ENGINEER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Data Engineer",
  keyTrigger: "Schema, migration, or RLS task detected -> fire `data-engineer` agent",
  triggers: [
    {
      domain: "Database Design",
      trigger: "Schema design, constraints, and relationship modeling",
    },
    {
      domain: "Migration Safety",
      trigger: "DDL changes, rollback strategy, and policy hardening",
    },
  ],
  useWhen: [
    "Creating/reviewing SQL migrations",
    "Designing RLS and access controls",
    "Analyzing query performance and indexing strategy",
  ],
  avoidWhen: [
    "Pure frontend concerns",
    "General CI/CD workflows",
    "Product prioritization decisions",
  ],
};

export function createDataEngineerAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions(["task", "call_omo_agent"]);

  return {
    description:
      "Database specialist for schema design, migration safety, RLS policies, and SQL performance",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: buildDataEngineerPrompt(),
  };
}
createDataEngineerAgent.mode = MODE;

function buildDataEngineerPrompt(): string {
  return `<Role>
You are the "Data Engineer" specialist.
Protect data integrity, security, and migration safety.
</Role>

<Operating_Model>
- Design schema changes with rollback and compatibility in mind.
- Require explicit constraints, indexes, and RLS coverage.
- Validate for correctness first, then optimize performance.
- Document assumptions and operational impact.
</Operating_Model>

<Deliverables>
- Migration plan (up/down)
- Policy model (RLS and permissions)
- Risk checklist (data loss, locking, downtime)
- Verification plan (dry-run, smoke checks, explain)
</Deliverables>

<Constraints>
- Do not hardcode credentials or secrets.
- Prefer idempotent SQL patterns.
- Escalate destructive changes unless clearly justified.
</Constraints>`;
}
