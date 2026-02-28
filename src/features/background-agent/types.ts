import type { FallbackEntry } from "../../shared/model-requirements"

export type BackgroundTaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "cancelled"

export interface TaskProgress {
  toolCalls: number
  lastTool?: string
  lastUpdate: Date
  lastMessage?: string
  lastMessageAt?: Date
}

export interface BackgroundTask {
  id: string
  sessionID?: string
  parentSessionID: string
  parentMessageID: string
  description: string
  prompt: string
  agent: string
  status: BackgroundTaskStatus
  queuedAt?: Date
  startedAt?: Date
  completedAt?: Date
  result?: string
  error?: string
  progress?: TaskProgress
  parentModel?: { providerID: string; modelID: string }
  model?: { providerID: string; modelID: string; variant?: string }
  /** Active concurrency slot key */
  concurrencyKey?: string
  /** Persistent key for re-acquiring concurrency on resume */
  concurrencyGroup?: string
  /** Parent session's agent name for notification */
  parentAgent?: string
  /** Marks if the task was launched from an unstable agent/category */
  isUnstableAgent?: boolean
  /** Category used for this task (e.g., 'quick', 'visual-engineering') */
  category?: string
  /** Candidate models to try when quota/rate-limit errors occur */
  fallbackChain?: FallbackEntry[]

  /** Skill content injected as `system` (if any) */
  skillContent?: string

  /** When session entered `retry` (used for stuck detection) */
  retrySince?: Date

  /** Models attempted due to retry-stuck fallback */
  retryFallbackTriedModels?: string[]

  /** Last message count for stability detection */
  lastMsgCount?: number
  /** Number of consecutive polls with stable message count */
  stablePolls?: number
}

export interface LaunchInput {
  description: string
  prompt: string
  agent: string
  parentSessionID: string
  parentMessageID: string
  parentModel?: { providerID: string; modelID: string }
  parentAgent?: string
  model?: { providerID: string; modelID: string; variant?: string }
  isUnstableAgent?: boolean
  skills?: string[]
  skillContent?: string
  category?: string
  fallbackChain?: FallbackEntry[]
}

export interface ResumeInput {
  sessionId: string
  prompt: string
  parentSessionID: string
  parentMessageID: string
  parentModel?: { providerID: string; modelID: string }
  parentAgent?: string
}
