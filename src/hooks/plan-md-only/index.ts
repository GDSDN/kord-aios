import type { PluginInput } from "@opencode-ai/plugin"
import { existsSync, readdirSync } from "node:fs"
import { join, resolve, relative, isAbsolute } from "node:path"
import {
  HOOK_NAME,
  PLAN_AGENT,
  ALLOWED_EXTENSIONS,
  ALLOWED_PATH_PREFIX,
  BLOCKED_TOOLS,
  PLANNING_CONSULT_WARNING,
  PLAN_WORKFLOW_REMINDER,
  ARTIFACT_WRITE_SUBAGENTS,
  ARTIFACT_GENERATION_WARNING,
} from "./constants"
import { findNearestMessageWithFields, findFirstMessageWithAgent, MESSAGE_STORAGE } from "../../features/hook-message-injector"
import { getSessionAgent } from "../../features/claude-code-session-state"
import { readBoulderState } from "../../features/boulder-state"
import { log } from "../../shared/logger"
import { SYSTEM_DIRECTIVE_PREFIX } from "../../shared/system-directive"
import { getAgentDisplayName } from "../../shared/agent-display-names"

export * from "./constants"

/**
 * Cross-platform path validator for Plan file writes.
 * Uses path.resolve/relative instead of string matching to handle:
 * - Windows backslashes (e.g., docs\kord\plans\x.md)
 * - Mixed separators (e.g., docs\kord\plans/x.md)
 * - Case-insensitive directory/extension matching
 * - Workspace confinement (blocks paths outside root or via traversal)
 * - Nested project paths (e.g., parent/docs/kord/... when ctx.directory is parent)
 */
function isAllowedFile(filePath: string, workspaceRoot: string): boolean {
  // 1. Resolve to absolute path
  const resolved = resolve(workspaceRoot, filePath)

  // 2. Get relative path from workspace root
  const rel = relative(workspaceRoot, resolved)

  // 3. Reject if escapes root (starts with ".." or is absolute)
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return false
  }

  // 4. Check if docs/kord/ exists anywhere in the path (case-insensitive)
  // This handles both direct paths (docs/kord/x.md) and nested paths (project/docs/kord/x.md)
  if (!/docs[/\\]kord[/\\]/i.test(rel)) {
    return false
  }

  // 5. Check extension matches one of ALLOWED_EXTENSIONS (case-insensitive)
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some(
    ext => resolved.toLowerCase().endsWith(ext.toLowerCase())
  )
  if (!hasAllowedExtension) {
    return false
  }

  return true
}

function getMessageDir(sessionID: string): string | null {
  if (!existsSync(MESSAGE_STORAGE)) return null

  const directPath = join(MESSAGE_STORAGE, sessionID)
  if (existsSync(directPath)) return directPath

  for (const dir of readdirSync(MESSAGE_STORAGE)) {
    const sessionPath = join(MESSAGE_STORAGE, dir, sessionID)
    if (existsSync(sessionPath)) return sessionPath
  }

  return null
}

const TASK_TOOLS = ["task", "call_kord_agent"]

function getAgentFromMessageFiles(sessionID: string): string | undefined {
  const messageDir = getMessageDir(sessionID)
  if (!messageDir) return undefined
  return findFirstMessageWithAgent(messageDir) ?? findNearestMessageWithFields(messageDir)?.agent
}

/**
 * Get the effective agent for the session.
 * Priority order:
 * 1. In-memory session agent (most recent, set by /start-work)
 * 2. Boulder state agent (persisted across restarts, fixes #927)
 * 3. Message files (fallback for sessions without boulder state)
 *
 * This fixes issue #927 where after interruption:
 * - In-memory map is cleared (process restart)
 * - Message files return "plan" (oldest message from /plan)
 * - But boulder.json has agent: "build" (set by /start-work)
 */
function getAgentFromSession(sessionID: string, directory: string): string | undefined {
  // Check in-memory first (current session)
  const memoryAgent = getSessionAgent(sessionID)
  if (memoryAgent) return memoryAgent

  // Check boulder state (persisted across restarts) - fixes #927
  const boulderState = readBoulderState(directory)
  if (boulderState?.session_ids.includes(sessionID) && boulderState.agent) {
    return boulderState.agent
  }

  // Fallback to message files
  return getAgentFromMessageFiles(sessionID)
}

export function createPlanMdOnlyHook(ctx: PluginInput) {
  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown>; message?: string }
    ): Promise<void> => {
      const agentName = getAgentFromSession(input.sessionID, ctx.directory)

      if (agentName !== PLAN_AGENT) {
        return
      }

      const toolName = input.tool

      // Inject read-only warning for task tools called by Plan
      if (TASK_TOOLS.includes(toolName)) {
        const prompt = output.args.prompt as string | undefined

        // call_kord_agent is explore/librarian-only; always consult-mode
        if (toolName === "call_kord_agent") {
          if (prompt && !prompt.includes(SYSTEM_DIRECTIVE_PREFIX)) {
            output.args.prompt = PLANNING_CONSULT_WARNING + prompt
            log(`[${HOOK_NAME}] Injected read-only planning warning to ${toolName}`, {
              sessionID: input.sessionID,
              tool: toolName,
              agent: agentName,
            })
          }
          return
        }

        if (prompt && !prompt.includes(SYSTEM_DIRECTIVE_PREFIX)) {
          let subagentType = output.args.subagent_type as string | undefined
          if (!subagentType) {
            const match = prompt.match(/subagent_type=['"]([^'"]+)['"]/)
            if (match) {
              subagentType = match[1]
            }
          }

          const warningToInject = subagentType && ARTIFACT_WRITE_SUBAGENTS.includes(subagentType)
            ? ARTIFACT_GENERATION_WARNING
            : PLANNING_CONSULT_WARNING

          output.args.prompt = warningToInject + prompt
          log(`[${HOOK_NAME}] Injected read-only planning warning to ${toolName}`, {
            sessionID: input.sessionID,
            tool: toolName,
            agent: agentName,
            subagentType,
          })
        }
        return
      }

      if (!BLOCKED_TOOLS.includes(toolName)) {
        return
      }

      // Block bash commands completely - Plan is read-only
      if (toolName === "bash") {
        log(`[${HOOK_NAME}] Blocked: Plan cannot execute bash commands`, {
          sessionID: input.sessionID,
          tool: toolName,
          agent: agentName,
        })
        throw new Error(
          `[${HOOK_NAME}] ${getAgentDisplayName("planner")} cannot execute bash commands. ` +
          `${getAgentDisplayName("planner")} is a READ-ONLY planner. Use /start-work to execute the plan. ` +
          `APOLOGIZE TO THE USER, REMIND OF YOUR PLAN WRITING PROCESSES, TELL USER WHAT YOU WILL GOING TO DO AS THE PROCESS, WRITE THE PLAN`
        )
      }

      const filePath = (output.args.filePath ?? output.args.path ?? output.args.file) as string | undefined
      if (!filePath) {
        return
      }

       if (!isAllowedFile(filePath, ctx.directory)) {
         log(`[${HOOK_NAME}] Blocked: Plan can only write to docs/kord/*.md`, {
           sessionID: input.sessionID,
           tool: toolName,
           filePath,
           agent: agentName,
         })
          throw new Error(
            `[${HOOK_NAME}] ${getAgentDisplayName("planner")} can only write/edit .md files inside docs/kord/ directory. ` +
            `Attempted to modify: ${filePath}. ` +
            `${getAgentDisplayName("planner")} is a READ-ONLY planner. Use /start-work to execute the plan. ` +
            `APOLOGIZE TO THE USER, REMIND OF YOUR PLAN WRITING PROCESSES, TELL USER WHAT YOU WILL GOING TO DO AS THE PROCESS, WRITE THE PLAN`
          )
        }

      const normalizedPath = filePath.toLowerCase().replace(/\\/g, "/")
      if (normalizedPath.includes("docs/kord/plans/") || normalizedPath.includes("docs\\kord\\plans\\")) {
        log(`[${HOOK_NAME}] Injecting workflow reminder for plan write`, {
          sessionID: input.sessionID,
          tool: toolName,
          filePath,
          agent: agentName,
        })
        output.message = (output.message || "") + PLAN_WORKFLOW_REMINDER
      }

      log(`[${HOOK_NAME}] Allowed: docs/kord/*.md write permitted`, {
        sessionID: input.sessionID,
        tool: toolName,
        filePath,
        agent: agentName,
      })
    },
  }
}
