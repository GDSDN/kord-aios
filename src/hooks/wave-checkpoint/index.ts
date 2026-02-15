/**
 * Wave-Checkpoint Hook
 *
 * Triggers checkpoint decisions between waves during plan execution.
 * After all items in a wave complete, this module presents a checkpoint:
 * GO (continue), PAUSE (wait for user), REVIEW (re-evaluate), ABORT (stop).
 *
 * Called by the build hook after detecting wave completion.
 */

import { readBoulderState, writeBoulderState } from "../../features/boulder-state"
import { parsePlanWaves } from "../../features/boulder-state/plan-parser"
import { log } from "../../shared/logger"
import { DEFAULT_CHECKPOINT_MODE, CHECKPOINT_PROMPT_TEMPLATE, ALL_WAVES_COMPLETE_TEMPLATE } from "./constants"
import type { CheckpointAction, CheckpointMode, CheckpointResult, WaveCheckpointSummary } from "./types"

export const HOOK_NAME = "wave-checkpoint"

/**
 * Build a checkpoint summary for a completed wave.
 */
export function buildWaveCheckpointSummary(planPath: string, completedWaveNumber: number): WaveCheckpointSummary | null {
  const waves = parsePlanWaves(planPath)
  if (waves.length === 0) return null

  const completedWave = waves.find(w => w.number === completedWaveNumber)
  if (!completedWave) return null

  const completedItems = completedWave.tasks.filter(t => t.completed).length
  const failedItems = completedWave.tasks.length - completedItems
  const nextWave = waves.find(w => w.number === completedWaveNumber + 1)

  return {
    waveNumber: completedWaveNumber,
    waveName: completedWave.name || undefined,
    totalItems: completedWave.tasks.length,
    completedItems,
    failedItems: failedItems > 0 ? failedItems : undefined,
    nextWaveNumber: nextWave?.number,
    nextWaveName: nextWave?.name || undefined,
    nextWaveItems: nextWave?.tasks.length,
    totalWaves: waves.length,
  }
}

/**
 * Format a checkpoint prompt from a summary.
 */
export function formatCheckpointPrompt(summary: WaveCheckpointSummary): string {
  const isLastWave = !summary.nextWaveNumber

  if (isLastWave) {
    return ALL_WAVES_COMPLETE_TEMPLATE
      .replace(/{WAVE_NUMBER}/g, String(summary.waveNumber))
      .replace(/{WAVE_NAME}/g, summary.waveName ? ` (${summary.waveName})` : "")
      .replace(/{COMPLETED}/g, String(summary.completedItems))
      .replace(/{TOTAL}/g, String(summary.totalItems))
      .replace(/{FAILED_LINE}/g, summary.failedItems ? `- **Failed/Blocked**: ${summary.failedItems} items\n` : "")
      .replace(/{TOTAL_WAVES}/g, String(summary.totalWaves))
  }

  const nextWaveInfo = summary.nextWaveNumber
    ? `**Wave ${summary.nextWaveNumber}${summary.nextWaveName ? ` — ${summary.nextWaveName}` : ""}**: ${summary.nextWaveItems ?? "?"} items`
    : "No more waves."

  return CHECKPOINT_PROMPT_TEMPLATE
    .replace(/{WAVE_NUMBER}/g, String(summary.waveNumber))
    .replace(/{WAVE_NAME}/g, summary.waveName ? ` (${summary.waveName})` : "")
    .replace(/{COMPLETED}/g, String(summary.completedItems))
    .replace(/{TOTAL}/g, String(summary.totalItems))
    .replace(/{FAILED_LINE}/g, summary.failedItems ? `- **Failed/Blocked**: ${summary.failedItems} items\n` : "")
    .replace(/{NEXT_WAVE_INFO}/g, nextWaveInfo)
    .replace(/{TOTAL_WAVES}/g, String(summary.totalWaves))
}

/**
 * Parse a checkpoint action from @po response text.
 */
export function parseCheckpointAction(responseText: string): CheckpointAction {
  const upper = responseText.toUpperCase().trim()

  if (upper.includes("ABORT")) return "ABORT"
  if (upper.includes("REVIEW")) return "REVIEW"
  if (upper.includes("PAUSE")) return "PAUSE"
  if (upper.includes("GO")) return "GO"

  // Default: GO if no clear action found
  return "GO"
}

/**
 * Execute a checkpoint decision and update boulder state accordingly.
 */
export function applyCheckpointResult(
  directory: string,
  result: CheckpointResult
): void {
  const state = readBoulderState(directory)
  if (!state) return

  switch (result.action) {
    case "GO": {
      // Advance to next wave
      const currentWave = state.current_wave ?? 1
      state.current_wave = currentWave + 1
      writeBoulderState(directory, state)
      log(`[${HOOK_NAME}] GO: advancing to wave ${state.current_wave}`, { plan: state.plan_name })
      break
    }
    case "PAUSE": {
      log(`[${HOOK_NAME}] PAUSE: waiting for user to resume`, { plan: state.plan_name })
      // Don't advance wave — user will manually resume
      break
    }
    case "REVIEW": {
      log(`[${HOOK_NAME}] REVIEW: plan modification requested`, { plan: state.plan_name })
      // Don't advance wave — plan may be modified
      break
    }
    case "ABORT": {
      log(`[${HOOK_NAME}] ABORT: stopping execution`, { plan: state.plan_name })
      // Don't advance — execution stopped
      break
    }
  }
}

export interface WaveCheckpointHookOptions {
  mode?: CheckpointMode
}

/**
 * Create the wave-checkpoint hook.
 *
 * In `auto` mode, checkpoints are skipped (GO is automatic).
 * In `interactive` mode, a checkpoint prompt is injected for @po decision.
 */
export function createWaveCheckpointHook(
  directory: string,
  options?: WaveCheckpointHookOptions
) {
  const mode: CheckpointMode = options?.mode ?? DEFAULT_CHECKPOINT_MODE

  /**
   * Check if a wave just completed and generate checkpoint context.
   * Returns the checkpoint prompt string if a checkpoint is needed, null otherwise.
   */
  function checkWaveCompletion(planPath: string, currentWaveNumber: number): string | null {
    const summary = buildWaveCheckpointSummary(planPath, currentWaveNumber)
    if (!summary) return null

    // Wave is not complete — no checkpoint needed
    if (summary.completedItems < summary.totalItems) return null

    // All waves done — return completion message
    if (!summary.nextWaveNumber) {
      return formatCheckpointPrompt(summary)
    }

    // Auto mode: silently advance
    if (mode === "auto") {
      applyCheckpointResult(directory, { action: "GO" })
      return null
    }

    // Interactive mode: return checkpoint prompt for @po
    return formatCheckpointPrompt(summary)
  }

  return {
    mode,
    checkWaveCompletion,
    buildWaveCheckpointSummary: (planPath: string, waveNumber: number) =>
      buildWaveCheckpointSummary(planPath, waveNumber),
    formatCheckpointPrompt,
    parseCheckpointAction,
    applyCheckpointResult: (result: CheckpointResult) =>
      applyCheckpointResult(directory, result),
  }
}
