import type { PluginInput } from "@opencode-ai/plugin"
import { existsSync, readdirSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { readBoulderState } from "../../features/boulder-state"
import { getSessionAgent } from "../../features/claude-code-session-state"
import { findFirstMessageWithAgent, findNearestMessageWithFields, MESSAGE_STORAGE } from "../../features/hook-message-injector"
import { getAgentDisplayName } from "../../shared/agent-display-names"
import { log } from "../../shared/logger"
import { DEFAULT_ADR_DIR, HOOK_NAME } from "./constants"
import type { DecisionRecordInput } from "./types"

interface DecisionLoggerConfig {
  directory?: string
}

function normalizeAgent(value?: string): string | undefined {
  if (!value) return undefined
  return value.toLowerCase().replace(/^@/, "")
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

function resolveAdrDirectory(ctx: PluginInput, config?: DecisionLoggerConfig): string {
  return resolve(ctx.directory, config?.directory ?? DEFAULT_ADR_DIR)
}

function nextAdrId(directory: string): number {
  if (!existsSync(directory)) return 1
  const entries = readdirSync(directory)
  const ids = entries
    .map((name) => name.match(/^ADR-(\d+)\.md$/i))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value))

  const max = ids.length > 0 ? Math.max(...ids) : 0
  return max + 1
}

function formatDecisionRecord(id: number, agent: string, input: DecisionRecordInput): string {
  const padded = String(id).padStart(3, "0")
  const timestamp = new Date().toISOString()
  const context = input.context ? input.context.trim() : ""
  const alternatives = input.alternatives ? input.alternatives.trim() : ""

  return `# ADR-${padded}\n\n` +
    `- Timestamp: ${timestamp}\n` +
    `- Agent: ${agent}\n` +
    (context ? `- Context: ${context}\n` : "") +
    `- Decision: ${input.decision.trim()}\n` +
    `- Rationale: ${input.rationale.trim()}\n` +
    (alternatives ? `- Alternatives: ${alternatives}\n` : "")
}

export function createDecisionLoggerHook(ctx: PluginInput, config?: DecisionLoggerConfig) {
  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown> }
    ): Promise<void> => {
      if (input.tool !== "decision_log") return

      const decision = typeof output.args.decision === "string" ? output.args.decision : undefined
      const rationale = typeof output.args.rationale === "string" ? output.args.rationale : undefined
      if (!decision || !rationale) {
        throw new Error("Decision logging requires decision and rationale fields.")
      }

      const agentRaw = typeof output.args.agent === "string" ? output.args.agent : undefined
      const agentName = normalizeAgent(agentRaw) ?? normalizeAgent(getAgentFromSession(input.sessionID, ctx.directory)) ?? "unknown"
      const directory = resolveAdrDirectory(ctx, config)

      if (existsSync(directory) && !readdirSync(directory, { withFileTypes: true }).every((entry) => entry.isFile())) {
        throw new Error(`Decision log directory is invalid: ${directory}`)
      }

      await mkdir(directory, { recursive: true })

      const id = nextAdrId(directory)
      const record = formatDecisionRecord(id, getAgentDisplayName(agentName), {
        decision,
        rationale,
        context: typeof output.args.context === "string" ? output.args.context : undefined,
        alternatives: typeof output.args.alternatives === "string" ? output.args.alternatives : undefined,
        agent: agentName,
      })

      const fileName = `ADR-${String(id).padStart(3, "0")}.md`
      const filePath = join(directory, fileName)
      await writeFile(filePath, record, "utf-8")

      log(`[${HOOK_NAME}] Decision record written`, { filePath, agent: agentName })
    },
  }
}
