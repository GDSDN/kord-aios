/**
 * Boulder State Types
 *
 * Manages the active work plan state for Kord orchestrator.
 * Named after Kord's boulder - the eternal task that must be rolled.
 */

import type { PlanType } from "../../shared/types"

/** Progress tracking for a single wave within a plan. */
export interface WaveProgress {
  /** Wave number (1-indexed) */
  number: number
  /** Wave name (if named in the plan) */
  name?: string
  /** Total items in this wave */
  total: number
  /** Completed items in this wave */
  completed: number
}

export interface BoulderState {
  /** Absolute path to the active plan file */
  active_plan: string
  /** ISO timestamp when work started */
  started_at: string
  /** Session IDs that have worked on this plan */
  session_ids: string[]
  /** Plan name derived from filename */
  plan_name: string
  /** Agent type to use when resuming (e.g., 'build') */
  agent?: string
  /** Squad name if this plan was started with --squad */
  squad?: string
  /** Plan format: story-driven, task-driven, or research */
  plan_type?: PlanType
  /** Current wave number being executed (1-indexed) */
  current_wave?: number
  /** Per-wave progress tracking */
  waves?: WaveProgress[]
  /** Current executor agent for the active task (e.g., 'dev', 'qa') */
  executor?: string
  /** Per-story quality gate iteration counts */
  quality_gate_iterations?: Record<string, number>
}

export interface PlanProgress {
  /** Total number of checkboxes */
  total: number
  /** Number of completed checkboxes */
  completed: number
  /** Whether all tasks are done */
  isComplete: boolean
}
