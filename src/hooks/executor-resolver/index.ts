/**
 * Executor-Resolver Hook
 *
 * Automatically loads the correct skill for the executor agent
 * based on plan item metadata. When @build delegates a story/task,
 * this hook intercepts the delegation and injects the appropriate skill.
 *
 * Hook point: tool.execute.before on delegate-task (task) tool
 */

import type { PluginInput } from "@opencode-ai/plugin"
import { readBoulderState, getNextIncompleteTask } from "../../features/boulder-state"
import { log } from "../../shared/logger"
import { DEFAULT_EXECUTOR_SKILL_MAP, DELEGATION_TOOLS } from "./constants"
import type { ExecutorResolverInput, DelegationParams } from "./types"

export const HOOK_NAME = "executor-resolver"

export function createExecutorResolverHook(
  ctx: PluginInput,
  customMapping?: Record<string, string[]>
) {
  const skillMap = { ...DEFAULT_EXECUTOR_SKILL_MAP, ...customMapping }

  function resolveSkills(executor: string, explicitSkills?: string[]): string[] {
    // Explicit skills from plan item override default mapping
    if (explicitSkills && explicitSkills.length > 0) {
      return explicitSkills
    }

    const normalizedExecutor = executor.toLowerCase().replace(/^@/, "")
    const mapped = skillMap[normalizedExecutor]

    if (!mapped) {
      log(`[${HOOK_NAME}] No skill mapping for executor: ${normalizedExecutor}`)
      return []
    }

    return mapped
  }

  const toolExecuteBefore = async (
    input: ExecutorResolverInput,
    params: DelegationParams
  ): Promise<void> => {
    const toolLower = input.tool.toLowerCase()

    if (!DELEGATION_TOOLS.has(toolLower)) {
      return
    }

    // Determine executor from delegation params or boulder state
    let executor = params.executor ?? params.subagent_type
    let planSkills: string[] | undefined

    // If no explicit executor in params, check boulder state for next task's executor
    if (!executor) {
      const boulderState = readBoulderState(ctx.directory)
      if (boulderState?.active_plan) {
        const nextTask = getNextIncompleteTask(boulderState.active_plan)
        if (nextTask?.executor) {
          executor = nextTask.executor
          planSkills = nextTask.skills
        }
      }
    }

    if (!executor) {
      return
    }

    // Resolve skills: explicit params > plan item skills > default mapping
    const existingSkills = params.load_skills ?? []
    const resolvedSkills = resolveSkills(executor, planSkills)

    if (resolvedSkills.length === 0) {
      return
    }

    // Merge: don't duplicate skills already in params
    const newSkills = resolvedSkills.filter(s => !existingSkills.includes(s))
    if (newSkills.length === 0) {
      return
    }

    params.load_skills = [...existingSkills, ...newSkills]

    log(`[${HOOK_NAME}] Injected skills for executor`, {
      sessionID: input.sessionID,
      executor,
      injectedSkills: newSkills,
      totalSkills: params.load_skills,
    })
  }

  return {
    "tool.execute.before": toolExecuteBefore,
  }
}
