import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import dataEngineerPromptMd from "../features/builtin-agents/data-engineer.md" with { type: "text" }

const MODE: AgentMode = "subagent"
const { body: dataEngineerPromptBody } = parseFrontmatter(dataEngineerPromptMd)
const DATA_ENGINEER_SYSTEM_PROMPT = dataEngineerPromptBody + SKILLS_PROTOCOL_SECTION

/**
 * Data Engineer - Database Architect Agent
 *
 * Database specialist for schema design, migrations, RLS policies,
 * query optimization, and data modeling.
 *
 * Core responsibilities:
 * - Database schema design and architecture
 * - Migration creation and management
 * - Row Level Security (RLS) policies
 * - Query optimization and analysis
 * - Data modeling and normalization
 */

export const dataEngineerPromptMetadata: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "Data Engineer",
  triggers: [
    { domain: "Database design", trigger: "Schema architecture, data modeling, table design" },
    { domain: "Migrations", trigger: "Database migrations, schema changes, version management" },
    { domain: "Security", trigger: "RLS policies, access control, data protection" },
    { domain: "Optimization", trigger: "Query optimization, index design, performance tuning" },
  ],
  useWhen: [
    "Database schema design or modification",
    "Creating or reviewing migrations",
    "RLS policy design and audit",
    "Query optimization and performance analysis",
    "Data modeling for new features",
  ],
  avoidWhen: [
    "Application code implementation (use @dev-junior for atomic tasks, @dev for complex multi-step work)",
    "API endpoint design (use @architect)",
    "CI/CD and deployment (use @devops)",
  ],
  keyTrigger: "Database, schema, migration, or SQL work → fire `data-engineer`",
}

export function createDataEngineerAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "task",
  ])

  return {
    description:
      "Database Architect. Schema design, migrations, RLS policies, query optimization, data modeling. Owns the data layer. (Data Engineer - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: DATA_ENGINEER_SYSTEM_PROMPT,
  }
}
createDataEngineerAgent.mode = MODE
