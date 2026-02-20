import { log } from "./logger"

export const DEFAULT_PROVIDER_BAN_TTL_MS = 5 * 60 * 1000

type ProviderBan = {
  until: number
  reason: string
}

const providerBans = new Map<string, ProviderBan>()

function isExpired(ban: ProviderBan, now: number): boolean {
  return now >= ban.until
}

export function markProviderUnhealthy(
  providerID: string,
  reason: string,
  ttlMs: number = DEFAULT_PROVIDER_BAN_TTL_MS,
): void {
  if (!providerID.trim()) {
    return
  }

  const now = Date.now()
  const until = now + Math.max(ttlMs, 1000)
  providerBans.set(providerID, { until, reason })

  log("[provider-health] provider marked unhealthy", {
    providerID,
    reason,
    ttlMs,
    until,
  })
}

export function isProviderHealthy(providerID: string): boolean {
  const ban = providerBans.get(providerID)
  if (!ban) {
    return true
  }

  const now = Date.now()
  if (isExpired(ban, now)) {
    providerBans.delete(providerID)
    return true
  }

  return false
}

export function getProviderBanInfo(
  providerID: string,
): { until: number; reason: string } | null {
  const ban = providerBans.get(providerID)
  if (!ban) {
    return null
  }

  const now = Date.now()
  if (isExpired(ban, now)) {
    providerBans.delete(providerID)
    return null
  }

  return { until: ban.until, reason: ban.reason }
}

export function clearProviderHealth(): void {
  providerBans.clear()
}
