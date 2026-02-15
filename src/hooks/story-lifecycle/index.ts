import type { PluginInput } from "@opencode-ai/plugin"
import { readFile } from "node:fs/promises"
import { existsSync, readdirSync } from "node:fs"
import { isAbsolute, join, resolve } from "node:path"
import { readBoulderState } from "../../features/boulder-state"
import { getSessionAgent } from "../../features/claude-code-session-state"
import { findFirstMessageWithAgent, findNearestMessageWithFields, MESSAGE_STORAGE } from "../../features/hook-message-injector"
import { getAgentDisplayName } from "../../shared/agent-display-names"
import { log } from "../../shared/logger"
import { parseStoryMarkdown } from "../../tools/story-read"
import type { StoryStatus } from "../../shared/types"
import { HOOK_NAME, TRANSITION_ROLES, VALID_TRANSITIONS } from "./constants"
import type { StoryLifecycleConfig } from "./types"

function normalizeAgent(value?: string): string | undefined {
  if (!value) return undefined
  return value.toLowerCase().replace(/^@/, "")
}

function normalizeStatus(value: string): StoryStatus | undefined {
  switch (value.toUpperCase()) {
    case "DRAFT":
    case "READY":
    case "IN_PROGRESS":
    case "REVIEW":
    case "DONE":
      return value.toUpperCase() as StoryStatus
    default:
      return undefined
  }
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

function isValidTransition(current: StoryStatus, next: StoryStatus): boolean {
  if (current === next) return true
  return VALID_TRANSITIONS[current].includes(next)
}

async function readStoryStatus(ctx: PluginInput, storyPath: string): Promise<StoryStatus> {
  const resolved = isAbsolute(storyPath) ? storyPath : resolve(ctx.directory, storyPath)
  const content = await readFile(resolved, "utf-8")
  return parseStoryMarkdown(content).status
}

export function createStoryLifecycleHook(ctx: PluginInput, config?: StoryLifecycleConfig) {
  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown> }
    ): Promise<void> => {
      if (input.tool !== "story_update") return

      const boulderState = readBoulderState(ctx.directory)
      if (!boulderState || boulderState.plan_type !== "story-driven") return

      if (config?.allow_force_override) return

      const action = output.args.action
      if (action !== "set_status") return

      const storyPath = output.args.story_path
      if (typeof storyPath !== "string") return

      const requestedStatusRaw = output.args.data && typeof output.args.data === "object"
        ? (output.args.data as { status?: unknown }).status
        : undefined

      if (typeof requestedStatusRaw !== "string") return

      const requestedStatus = normalizeStatus(requestedStatusRaw)
      if (!requestedStatus) {
        throw new Error(`Cannot transition story from unknown to ${requestedStatusRaw}.`)
      }

      const currentStatus = await readStoryStatus(ctx, storyPath)
      if (!isValidTransition(currentStatus, requestedStatus)) {
        throw new Error(`Cannot transition story from ${currentStatus} to ${requestedStatus}.`)
      }

      const agentName = normalizeAgent(getAgentFromSession(input.sessionID, ctx.directory))
      const transitionKey = `${currentStatus}->${requestedStatus}`
      const allowedAgents = TRANSITION_ROLES[transitionKey]

      if (allowedAgents && agentName && !allowedAgents.includes(agentName)) {
        log(`[${HOOK_NAME}] Blocked transition`, {
          sessionID: input.sessionID,
          agent: agentName,
          from: currentStatus,
          to: requestedStatus,
        })
        throw new Error(`Agent ${getAgentDisplayName(agentName)} cannot transition story from ${currentStatus} to ${requestedStatus}.`)
      }
    },
  }
}
