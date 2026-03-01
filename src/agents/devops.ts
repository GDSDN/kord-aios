import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { SKILLS_PROTOCOL_SECTION } from "./prompt-snippets"
import { parseFrontmatter } from "../shared/frontmatter"
import { devopsPrompt } from "../features/builtin-agents/prompts"

const MODE: AgentMode = "subagent"

// Extract prompt body from embedded .md (excludes YAML frontmatter)
const { body: devopsPromptBody } = parseFrontmatter(devopsPrompt)
const DEVOPS_SYSTEM_PROMPT = devopsPromptBody + SKILLS_PROTOCOL_SECTION

/**
 * DevOps - Pipeline Protector Agent
 *
 * CI/CD specialist, infrastructure, git operations, release management.
 *
 * Core responsibilities:
 * - CI/CD pipeline configuration and debugging
 * - Git operations (push, PR creation, release)
 * - Quality gate enforcement before deployments
 * - Infrastructure and deployment configuration
 */

export const devopsPromptMetadata: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "DevOps",
  triggers: [
    { domain: "CI/CD", trigger: "Pipeline configuration, GitHub Actions, deployment workflows" },
    { domain: "Git operations", trigger: "PR creation, release management, branch strategy" },
    { domain: "Infrastructure", trigger: "Docker, deployment configs, environment setup" },
  ],
  useWhen: [
    "CI/CD pipeline creation or debugging",
    "GitHub Actions workflow configuration",
    "Release management and versioning",
    "Docker and deployment configuration",
    "Infrastructure-as-code tasks",
  ],
  avoidWhen: [
    "Application code implementation (use @dev-junior for atomic tasks, @dev for complex multi-step work)",
    "Architecture decisions (use @architect)",
    "Database operations (use @data-engineer)",
  ],
  keyTrigger: "CI/CD, deployment, or infrastructure work → fire `devops`",
}

export function createDevopsAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "task",
  ])

  return {
    description:
      "Pipeline Protector. CI/CD pipelines, GitHub Actions, deployment configuration, release management, infrastructure-as-code. (DevOps - Kord AIOS)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: DEVOPS_SYSTEM_PROMPT,
  }
}
createDevopsAgent.mode = MODE
