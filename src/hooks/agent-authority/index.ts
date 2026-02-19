import type { PluginInput } from "@opencode-ai/plugin"
import { existsSync, readdirSync } from "node:fs"
import { isAbsolute, join, relative, resolve } from "node:path"
import { readBoulderState } from "../../features/boulder-state"
import { getSessionAgent } from "../../features/claude-code-session-state"
import { findFirstMessageWithAgent, findNearestMessageWithFields, MESSAGE_STORAGE } from "../../features/hook-message-injector"
import { getAgentDisplayName } from "../../shared/agent-display-names"
import { log } from "../../shared/logger"
import { BLOCKED_GIT_COMMANDS, DEFAULT_AGENT_ALLOWLIST, HOOK_NAME } from "./constants"
import type { AgentAuthorityConfig } from "./types"

const WRITE_TOOLS = new Set(["write", "edit", "write_file", "edit_file"])
const BASH_TOOLS = new Set(["bash", "interactive_bash"])

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/")
}

function sanitizeFilePath(value: string): string {
  // Trim first to avoid accidental leading/trailing whitespace from tool args.
  let filePath = value.trim()

  // Some UIs/LSPs wrap long paths with line breaks and indentation.
  // Paths should not contain line terminators in practice, so remove them.
  filePath = filePath.replace(/[\r\n\u2028\u2029]+[ \t]*/g, "")

  // Strip remaining ASCII control characters (e.g., ANSI escapes) that can
  // accidentally appear in tool args and break glob matching.
  filePath = filePath.replace(/[\x00-\x1F\x7F]/g, "")

  // Normalize file:// URIs (commonly produced by LSPs) into filesystem paths.
  if (filePath.startsWith("file://")) {
    try {
      const url = new URL(filePath)
      if (url.protocol === "file:") {
        let pathname = url.pathname
        try {
          pathname = decodeURIComponent(pathname)
        } catch (err) {
          // Keep raw pathname if decoding fails.
          void err
        }

        // On Windows, URL.pathname comes as /C:/path...
        if (process.platform === "win32" && /^\/[A-Za-z]:\//.test(pathname)) {
          pathname = pathname.slice(1)
        }
        filePath = pathname
      }
    } catch (err) {
      // If parsing fails, fall back to the original string.
      void err
    }
  }

  return filePath
}

function escapeRegexExceptAsterisk(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
}

function matchesPattern(pathValue: string, pattern: string): boolean {
  if (!pattern) return false
  const normalized = normalizePath(pathValue)
  const normalizedPattern = normalizePath(pattern)
  const escaped = escapeRegexExceptAsterisk(normalizedPattern)
  const regex = new RegExp(`^${escaped.replace(/\*\*/g, "\0GLOBSTAR\0").replace(/\*/g, "[^/]*").replace(/\0GLOBSTAR\0/g, ".*")}$`, "is")
  return regex.test(normalized)
}

function isAllowedPath(targetPath: string, allowlist: string[]): boolean {
  return allowlist.some((pattern) => matchesPattern(targetPath, pattern))
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

function getAgentFromMessageFiles(sessionID: string): string | undefined {
  const messageDir = getMessageDir(sessionID)
  if (!messageDir) return undefined
  return findFirstMessageWithAgent(messageDir) ?? findNearestMessageWithFields(messageDir)?.agent
}

function getAgentFromSession(sessionID: string, directory: string): string | undefined {
  const memoryAgent = getSessionAgent(sessionID)
  if (memoryAgent) return memoryAgent

  const boulderState = readBoulderState(directory)
  if (boulderState?.session_ids.includes(sessionID) && boulderState.agent) {
    return boulderState.agent
  }

  return getAgentFromMessageFiles(sessionID)
}

function resolveAllowlist(config?: AgentAuthorityConfig): Record<string, string[]> {
  if (!config?.allowlist) return DEFAULT_AGENT_ALLOWLIST
  const merged: Record<string, string[]> = { ...DEFAULT_AGENT_ALLOWLIST }
  for (const [agent, paths] of Object.entries(config.allowlist)) {
    const normalized = paths.map((path) => normalizePath(path))
    merged[agent] = [...(merged[agent] ?? []), ...normalized]
  }
  return merged
}

function extractFilePath(args: Record<string, unknown>): string | undefined {
  const raw = (args.filePath ?? args.path ?? args.file_path ?? args.file) as unknown
  if (typeof raw !== "string") return undefined

  return sanitizeFilePath(raw)
}

function resolveRelativePath(workspaceRoot: string, filePath: string): string | null {
  const resolved = isAbsolute(filePath) ? filePath : resolve(workspaceRoot, filePath)
  const rel = relative(workspaceRoot, resolved)
  if (rel.startsWith("..") || isAbsolute(rel)) return null
  return normalizePath(rel)
}

function isBlockedGitCommand(command: string): boolean {
  const lower = command.toLowerCase()
  return BLOCKED_GIT_COMMANDS.some((blocked) => lower.includes(blocked))
}

export function createAgentAuthorityHook(ctx: PluginInput, config?: AgentAuthorityConfig) {
  const allowlistByAgent = resolveAllowlist(config)

  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown> }
    ): Promise<void> => {
      const toolName = input.tool?.toLowerCase()
      const agentName = getAgentFromSession(input.sessionID, ctx.directory)

      if (!agentName) {
        return
      }

      if (toolName && BASH_TOOLS.has(toolName)) {
        const command = String(output.args.command ?? output.args.tmux_command ?? "")
        if (command && agentName !== "devops" && isBlockedGitCommand(command)) {
          log(`[${HOOK_NAME}] Blocked git command`, {
            sessionID: input.sessionID,
            agent: agentName,
            command,
          })
          throw new Error(`Agent ${getAgentDisplayName(agentName)} cannot run git push/merge/rebase commands.`)
        }
      }

      if (!toolName || !WRITE_TOOLS.has(toolName)) {
        return
      }

      const filePath = extractFilePath(output.args)
      if (!filePath) return

      const relativePath = resolveRelativePath(ctx.directory, filePath)
      if (!relativePath) {
        throw new Error(`Agent ${getAgentDisplayName(agentName)} does not have write permission for path ${filePath}.`)
      }

      const allowlist = allowlistByAgent[agentName] ?? []
      if (!isAllowedPath(relativePath, allowlist)) {
        log(`[${HOOK_NAME}] Blocked write`, {
          sessionID: input.sessionID,
          agent: agentName,
          filePath: relativePath,
        })
        throw new Error(`Agent ${getAgentDisplayName(agentName)} does not have write permission for path ${relativePath}.`)
      }
    },
  }
}
