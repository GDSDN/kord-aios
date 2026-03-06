import type { PluginInput } from "@opencode-ai/plugin"
import { executeWorkflowCommand } from "../../features/workflow-engine"
import { log } from "../../shared/logger"

export const HOOK_NAME = "workflow"

interface WorkflowHookInput {
  sessionID: string
}

interface WorkflowHookOutput {
  parts: Array<{ type: string; text?: string }>
}

function extractUserRequest(promptText: string): string {
  const match = promptText.match(/<user-request>\s*([\s\S]*?)\s*<\/user-request>/i)
  return match?.[1]?.trim() ?? ""
}

function extractWorkflowId(promptText: string): string | undefined {
  const match = promptText.match(/<workflow-id>\s*([\s\S]*?)\s*<\/workflow-id>/i)
  const value = match?.[1]?.trim()
  return value || undefined
}

export function createWorkflowHook(ctx: PluginInput) {
  return {
    "chat.message": async (input: WorkflowHookInput, output: WorkflowHookOutput): Promise<void> => {
      const promptText = output.parts
        .filter((part) => part.type === "text" && part.text)
        .map((part) => part.text)
        .join("\n")

      if (!promptText.includes("<workflow-context>")) {
        return
      }

      const args = extractUserRequest(promptText)
      const aliasWorkflowId = extractWorkflowId(promptText)

      const workflowMessage = executeWorkflowCommand({
        directory: ctx.directory,
        sessionID: input.sessionID,
        rawArgs: args,
        aliasWorkflowId,
      })

      const firstTextIndex = output.parts.findIndex((part) => part.type === "text")
      if (firstTextIndex >= 0 && output.parts[firstTextIndex].text) {
        output.parts[firstTextIndex].text += `\n\n---\n## Workflow Runtime\n\n${workflowMessage}`
      }

      log(`[${HOOK_NAME}] workflow command processed`, {
        sessionID: input.sessionID,
        aliasWorkflowId,
      })
    },
  }
}
