import type { AgentFallbackSlot, AgentOverrides, AgentOverrideConfig } from "../config/schema"
import { AGENT_MODEL_REQUIREMENTS, type FallbackEntry } from "./model-requirements"
import { log } from "./logger"

const AGENT_ALIASES: Record<string, string> = {
  plan: "planner",
  build: "builder",
}

function normalizeAgentName(agentName: string): string {
  return agentName.trim().toLowerCase()
}

function toFallbackEntry(slot: AgentFallbackSlot): FallbackEntry | null {
  const [providerID, ...modelParts] = slot.model.split("/")
  if (!providerID || modelParts.length === 0) {
    return null
  }

  return {
    providers: [providerID],
    model: modelParts.join("/"),
    ...(slot.variant ? { variant: slot.variant } : {}),
  }
}

export function convertAgentFallbackSlots(
  slots: AgentFallbackSlot[] | undefined,
): FallbackEntry[] | undefined {
  if (!slots || slots.length === 0) {
    return undefined
  }

  const converted = slots
    .map((slot) => toFallbackEntry(slot))
    .filter((entry): entry is FallbackEntry => entry !== null)

  return converted.length > 0 ? converted : undefined
}

function findAgentOverride(
  agentName: string,
  overrides: AgentOverrides | undefined,
): { name: string; config: AgentOverrideConfig } | undefined {
  if (!overrides) {
    return undefined
  }

  const normalized = normalizeAgentName(agentName)
  const alias = AGENT_ALIASES[normalized]
  const namesToTry = alias ? [normalized, alias] : [normalized]

  for (const [name, config] of Object.entries(overrides)) {
    if (!config) continue
    if (namesToTry.includes(normalizeAgentName(name))) {
      return { name, config }
    }
  }

  return undefined
}

export function resolveAgentFallbackChain(
  agentName: string,
  options?: { userAgentOverrides?: AgentOverrides },
): FallbackEntry[] | undefined {
  const override = findAgentOverride(agentName, options?.userAgentOverrides)
  const overrideFallback = convertAgentFallbackSlots(override?.config.fallback)
  if (overrideFallback && overrideFallback.length > 0) {
    log("[model-fallback] resolveAgentFallbackChain", {
      agentName,
      source: "user-config",
      chainLength: overrideFallback.length,
      overrideAgentName: override?.name,
    })
    return overrideFallback
  }

  const normalized = normalizeAgentName(agentName)
  const direct = AGENT_MODEL_REQUIREMENTS[agentName]?.fallbackChain
  if (direct && direct.length > 0) {
    log("[model-fallback] resolveAgentFallbackChain", {
      agentName,
      source: "hardcoded",
      chainLength: direct.length,
    })
    return direct
  }

  const alias = AGENT_ALIASES[normalized]
  const namesToTry = alias ? [normalized, alias] : [normalized]
  const matched = Object.entries(AGENT_MODEL_REQUIREMENTS).find(([name]) =>
    namesToTry.includes(normalizeAgentName(name)),
  )
  const chain = matched?.[1]?.fallbackChain

  log("[model-fallback] resolveAgentFallbackChain", {
    agentName,
    source: "hardcoded",
    chainLength: chain?.length ?? 0,
    normalizedMatch: Boolean(matched),
  })

  return chain
}
