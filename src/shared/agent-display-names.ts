/**
 * Agent config keys to display names mapping.
 * Config keys are lowercase (e.g., "kord", "build").
 * Display names include suffixes for UI/logs (e.g., "Kord (Ultraworker)").
 */
export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  kord: "Kord (Ultraworker)",
  builder: "Builder (Plan Execution Orchestrator)",
  build: "Build (Plan Execution Orchestrator)",
  planner: "Planner (Plan Builder)",
  plan: "Plan (Plan Builder)",  // Legacy - kept for backward compat
  "dev-junior": "Dev-Junior",
  analyst: "Analyst (Plan Consultant)",
  "plan-analyzer": "Plan Analyzer",
  "plan-reviewer": "Plan Reviewer",
  qa: "QA (Plan Reviewer)",
  architect: "architect",
  librarian: "librarian",
  explore: "explore",
  "vision": "vision",
}

/**
 * Get display name for an agent config key.
 * Uses case-insensitive lookup for backward compatibility.
 * Returns original key if not found.
 */
export function getAgentDisplayName(configKey: string): string {
  // Try exact match first
  const exactMatch = AGENT_DISPLAY_NAMES[configKey]
  if (exactMatch !== undefined) return exactMatch
  
  // Fall back to case-insensitive search
  const lowerKey = configKey.toLowerCase()
  for (const [k, v] of Object.entries(AGENT_DISPLAY_NAMES)) {
    if (k.toLowerCase() === lowerKey) return v
  }
  
  // Unknown agent: return original key
  return configKey
}