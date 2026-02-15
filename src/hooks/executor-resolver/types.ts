/**
 * Executor-Resolver Types
 */

export interface ExecutorResolverInput {
  tool: string
  sessionID: string
  callID?: string
  agent?: string
}

export interface ExecutorResolverOutput {
  title: string
  output: string
  metadata: Record<string, unknown>
}

/** Input parameters for a delegation tool call. */
export interface DelegationParams {
  /** Named executor agent (e.g., "dev", "qa") */
  executor?: string
  /** Explicit skills to load (overrides default mapping) */
  load_skills?: string[]
  /** Subagent type / category */
  subagent_type?: string
  category?: string
  /** Prompt text */
  prompt?: string
  [key: string]: unknown
}
