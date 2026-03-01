import type { AgentConfig } from "@opencode-ai/sdk"

export interface OpenCodeAgentFrontmatter {
  name?: string
  description?: string
  model?: string
  tools?: string
}

export interface LoadedOpenCodeAgent {
  name: string
  path: string
  config: AgentConfig
}
