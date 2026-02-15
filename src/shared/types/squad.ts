import type { PlanType } from "./plan"

/** Individual agent entry within a squad manifest. */
export interface SquadAgent {
  name: string
  role?: string
  description?: string
}

/** Squad-specific configuration for plan and execution rules. */
export interface SquadConfig {
  planFormat?: PlanType
  executionRules?: string[]
  overrides?: Record<string, string>
}

/** Parsed representation of a SQUAD.yaml manifest. */
export interface SquadManifest {
  name: string
  description?: string
  agents: SquadAgent[]
  config?: SquadConfig
}
