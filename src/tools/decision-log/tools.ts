import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import { DECISION_LOG_DESCRIPTION } from "./constants"
import type { DecisionLogArgs } from "./types"

export function createDecisionLogTool(_ctx: PluginInput): ToolDefinition {
  return tool({
    description: DECISION_LOG_DESCRIPTION,
    args: {
      decision: tool.schema.string().describe("Decision statement"),
      rationale: tool.schema.string().describe("Rationale for the decision"),
      context: tool.schema.string().optional().describe("Context for the decision"),
      alternatives: tool.schema.string().optional().describe("Alternatives considered"),
      agent: tool.schema.string().optional().describe("Agent name override"),
    },
    execute: async (_args: DecisionLogArgs) => {
      return "Decision log request accepted."
    },
  })
}
