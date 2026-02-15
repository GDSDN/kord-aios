import type { PluginInput } from "@opencode-ai/plugin"
import { readFile } from "node:fs/promises"
import { isAbsolute, resolve } from "node:path"
import { readBoulderState, writeBoulderState } from "../../features/boulder-state"
import { parseFrontmatter } from "../../shared/frontmatter"
import { log } from "../../shared/logger"
import type { ReviewVerdict } from "./types"
import { DEFAULT_MAX_ITERATIONS, HOOK_NAME, QUALITY_GATE_PROMPT } from "./constants"

interface PendingGateContext {
  storyPath: string
  executor?: string
  qualityGate: string
  isReviewTask: boolean
}

const pending = new Map<string, PendingGateContext>()

function normalizeAgent(value?: string): string | undefined {
  if (!value) return undefined
  return value.toLowerCase().replace(/^@/, "")
}

async function readStoryGateInfo(
  ctx: PluginInput,
  storyPath: string
): Promise<{ qualityGate?: string; executor?: string }> {
  const resolved = isAbsolute(storyPath) ? storyPath : resolve(ctx.directory, storyPath)
  const content = await readFile(resolved, "utf-8")
  const { data } = parseFrontmatter<Record<string, unknown>>(content)
  const qualityGate = typeof data.quality_gate === "string" ? normalizeAgent(data.quality_gate) : undefined
  const executor = typeof data.executor === "string" ? normalizeAgent(data.executor) : undefined
  return { qualityGate, executor }
}

function detectVerdict(output: string): ReviewVerdict | null {
  const match = output.match(/(?:quality[_ ]gate[_ ]verdict|verdict)\s*:\s*(approved|needs_work|reject)/i)
  if (!match) return null
  const verdict = match[1].toUpperCase() as ReviewVerdict
  return verdict
}

function applyIteration(directory: string, storyPath: string, verdict: ReviewVerdict, maxIterations: number): { iterations: number; escalated: boolean } {
  const state = readBoulderState(directory)
  if (!state) return { iterations: 0, escalated: false }

  const iterations = state.quality_gate_iterations ?? {}
  const current = iterations[storyPath] ?? 0

  if (verdict === "APPROVED") {
    delete iterations[storyPath]
  } else if (verdict === "NEEDS_WORK") {
    iterations[storyPath] = current + 1
  }

  state.quality_gate_iterations = Object.keys(iterations).length > 0 ? iterations : undefined
  writeBoulderState(directory, state)

  const nextCount = iterations[storyPath] ?? 0
  return { iterations: nextCount, escalated: verdict === "NEEDS_WORK" && nextCount > maxIterations }
}

export function createQualityGateHook(ctx: PluginInput, maxIterations: number = DEFAULT_MAX_ITERATIONS) {
  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown> }
    ): Promise<void> => {
      if (input.tool !== "task") return

      const storyPath = output.args.story_path
      if (typeof storyPath !== "string") return

      const gateInfo = await readStoryGateInfo(ctx, storyPath)
      if (!gateInfo.qualityGate) return

      if (gateInfo.executor && gateInfo.qualityGate && gateInfo.executor === gateInfo.qualityGate) {
        throw new Error(`quality_gate agent must differ from executor (@${gateInfo.executor}).`)
      }

      const taskExecutor = normalizeAgent(
        typeof output.args.executor === "string"
          ? output.args.executor
          : typeof output.args.subagent_type === "string"
            ? output.args.subagent_type
            : undefined
      )

      if (input.callID) {
        pending.set(input.callID, {
          storyPath,
          executor: gateInfo.executor,
          qualityGate: gateInfo.qualityGate,
          isReviewTask: taskExecutor === gateInfo.qualityGate,
        })
      }
    },

    "tool.execute.after": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { output?: string }
    ): Promise<void> => {
      if (input.tool !== "task") return

      const context = input.callID ? pending.get(input.callID) : undefined
      if (input.callID) {
        pending.delete(input.callID)
      }
      if (!context) return

      if (!context.isReviewTask) {
        if (typeof output.output === "string") {
          output.output += QUALITY_GATE_PROMPT(context.qualityGate, context.storyPath)
        }
        return
      }

      if (typeof output.output !== "string") return

      const verdict = detectVerdict(output.output)
      if (!verdict) return

      const result = applyIteration(ctx.directory, context.storyPath, verdict, maxIterations)
      if (verdict === "NEEDS_WORK" && result.escalated) {
        output.output += `\n[QUALITY GATE] NEEDS_WORK exceeded ${maxIterations} iterations. Escalate to user.`
        log(`[${HOOK_NAME}] Escalation required`, {
          storyPath: context.storyPath,
          iterations: result.iterations,
        })
      }
    },
  }
}
