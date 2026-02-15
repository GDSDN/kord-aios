/**
 * Wave-Checkpoint Types
 */

/** Actions available at a wave checkpoint. */
export type CheckpointAction = "GO" | "PAUSE" | "REVIEW" | "ABORT"

/** Checkpoint mode configuration. */
export type CheckpointMode = "auto" | "interactive"

/** Summary of a completed wave presented to @po at checkpoint. */
export interface WaveCheckpointSummary {
  /** Wave number that just completed */
  waveNumber: number
  /** Wave name (if any) */
  waveName?: string
  /** Total items in the completed wave */
  totalItems: number
  /** Completed items */
  completedItems: number
  /** Failed/blocked items (if any) */
  failedItems?: number
  /** Next wave number (if exists) */
  nextWaveNumber?: number
  /** Next wave name (if exists) */
  nextWaveName?: string
  /** Items in the next wave */
  nextWaveItems?: number
  /** Total waves in the plan */
  totalWaves: number
}

/** Result of a checkpoint decision. */
export interface CheckpointResult {
  /** The decided action */
  action: CheckpointAction
  /** Optional reason/notes from @po */
  reason?: string
}
