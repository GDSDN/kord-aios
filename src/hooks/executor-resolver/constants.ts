/**
 * Executor-Resolver Constants
 *
 * Default executor→skill mapping table.
 * When @build delegates a task with an `executor` field,
 * the resolver looks up skills to auto-inject.
 */

/** Default mapping from executor agent name to skills to load. */
export const DEFAULT_EXECUTOR_SKILL_MAP: Record<string, string[]> = {
  "dev": ["develop-story"],
  "dev-junior": ["develop-story"],
  "qa": ["qa-review-story"],
  "pm": ["create-prd"],
  "sm": ["create-next-story"],
  "devops": ["git-push"],
  "architect": ["architecture-design"],
  "analyst": ["deep-research"],
  "data-engineer": ["database-migration"],
  "ux-design-expert": ["frontend-ui-ux"],
}

/** Tools that trigger executor resolution (delegation tools). */
export const DELEGATION_TOOLS = new Set(["task", "call_kord_agent"])
