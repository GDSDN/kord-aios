import type { FallbackEntry } from "./model-requirements"

const squadFallbackStore = new Map<string, FallbackEntry[]>()

function normalizeAgentName(agentName: string): string {
  return agentName.trim().toLowerCase()
}

function cloneFallbackEntries(entries: FallbackEntry[]): FallbackEntry[] {
  return entries.map((entry) => ({
    ...entry,
    providers: [...entry.providers],
  }))
}

/**
 * Sets the fallback chain for a squad agent.
 * @param agentName - The squad agent name (e.g., "squad-code-chief")
 * @param entries - The fallback entries to store
 */
export function setSquadAgentFallback(agentName: string, entries: FallbackEntry[]): void {
  const key = normalizeAgentName(agentName)
  if (!entries || entries.length === 0) {
    squadFallbackStore.delete(key)
    return
  }
  squadFallbackStore.set(key, cloneFallbackEntries(entries))
}

/**
 * Gets the fallback chain for a squad agent.
 * @param agentName - The squad agent name (e.g., "squad-code-chief")
 * @returns The fallback entries or undefined if not found
 */
export function getSquadAgentFallback(
  agentName: string,
): FallbackEntry[] | undefined {
  const key = normalizeAgentName(agentName)
  const entries = squadFallbackStore.get(key)
  return entries ? cloneFallbackEntries(entries) : undefined
}

/**
 * Clears the squad fallback store.
 * Useful for testing to reset state between tests.
 */
export function clearSquadFallbackStore(): void {
  squadFallbackStore.clear()
}
