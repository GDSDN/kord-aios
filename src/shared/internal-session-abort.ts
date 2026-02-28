const INTERNAL_ABORT_WINDOW_MS = 15_000
const INTERNAL_ABORT_TTL_MS = 5 * 60_000

interface InternalAbortEntry {
  at: number
  reason: string
}

const internalAborts = new Map<string, InternalAbortEntry>()

function cleanupExpired(now: number): void {
  for (const [sessionID, entry] of internalAborts.entries()) {
    if (now - entry.at > INTERNAL_ABORT_TTL_MS) {
      internalAborts.delete(sessionID)
    }
  }
}

export function markInternalSessionAbort(sessionID: string, reason: string): void {
  const now = Date.now()
  cleanupExpired(now)
  internalAborts.set(sessionID, { at: now, reason })
}

export function isRecentInternalSessionAbort(
  sessionID: string,
  windowMs: number = INTERNAL_ABORT_WINDOW_MS,
): boolean {
  const now = Date.now()
  cleanupExpired(now)
  const entry = internalAborts.get(sessionID)
  if (!entry) return false
  return now - entry.at <= windowMs
}

export function clearInternalSessionAbort(sessionID: string): void {
  internalAborts.delete(sessionID)
}

/** @internal test helper */
export function _resetInternalSessionAbortState(): void {
  internalAborts.clear()
}
