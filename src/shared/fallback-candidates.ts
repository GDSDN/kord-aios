import type { createOpencodeClient } from "@opencode-ai/sdk"
import { readConnectedProvidersCache } from "./connected-providers-cache"
import { fetchAvailableModels, fuzzyMatchModel, getConnectedProviders } from "./model-availability"
import type { FallbackEntry } from "./model-requirements"
import { isProviderHealthy } from "./provider-health"

type Client = ReturnType<typeof createOpencodeClient>

export type FallbackCandidate = {
  providerID: string
  modelID: string
  variant?: string
}

export type FallbackCandidateDiagnostics = {
  connectedProvidersKnown: boolean
  connectedProviders: string[]
  availableModelCount: number
  skippedDisconnected: string[]
  skippedUnavailable: string[]
  skippedUnhealthy: string[]
}

export type BuildFallbackCandidatesResult = {
  candidates: FallbackCandidate[]
  diagnostics: FallbackCandidateDiagnostics
}

export type BuildFallbackCandidatesInput = {
  fallbackChain: FallbackEntry[]
  client?: Client
  connectedProviders?: string[] | null
  availableModels?: Set<string>
  excludeModels?: Set<string>
  allowModelListMiss?: boolean
}

function parseProviderModel(fullModel: string): { providerID: string; modelID: string } | null {
  const [providerID, ...modelParts] = fullModel.split("/")
  if (!providerID || modelParts.length === 0) {
    return null
  }
  return { providerID, modelID: modelParts.join("/") }
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items))
}

export async function buildFallbackCandidates(
  input: BuildFallbackCandidatesInput,
): Promise<BuildFallbackCandidatesResult> {
  const allowModelListMiss = input.allowModelListMiss === true
  const connectedFromCache = input.connectedProviders ?? readConnectedProvidersCache()
  let connectedProviders = connectedFromCache

  if (connectedProviders === null && input.client) {
    const liveProviders = await getConnectedProviders(input.client)
    connectedProviders = liveProviders.length > 0 ? liveProviders : []
  }

  const connectedProvidersKnown = connectedProviders !== null
  const connectedSet = connectedProvidersKnown ? new Set(connectedProviders) : null

  let availableModels = input.availableModels
  if (!availableModels && input.client) {
    availableModels = await fetchAvailableModels(input.client, {
      connectedProviders: connectedProviders ?? undefined,
    })
  }
  const availableSet = availableModels ?? new Set<string>()

  const exclude = input.excludeModels ?? new Set<string>()
  const candidates: FallbackCandidate[] = []
  const seen = new Set<string>()
  const skippedDisconnected: string[] = []
  const skippedUnavailable: string[] = []
  const skippedUnhealthy: string[] = []

  for (const entry of input.fallbackChain) {
    for (const providerID of entry.providers) {
      if (connectedSet && !connectedSet.has(providerID)) {
        skippedDisconnected.push(`${providerID}/${entry.model}`)
        continue
      }

      if (!isProviderHealthy(providerID)) {
        skippedUnhealthy.push(`${providerID}/${entry.model}`)
        continue
      }

      let modelID = entry.model
      if (availableSet.size > 0) {
        const preferred = fuzzyMatchModel(`${providerID}/${entry.model}`, availableSet, [providerID])
        const fallback = preferred ?? fuzzyMatchModel(entry.model, availableSet, [providerID])
        if (!fallback) {
          if (!allowModelListMiss) {
            skippedUnavailable.push(`${providerID}/${entry.model}`)
            continue
          }
        } else {
          const parsed = parseProviderModel(fallback)
          if (!parsed || parsed.providerID !== providerID) {
            if (!allowModelListMiss) {
              skippedUnavailable.push(`${providerID}/${entry.model}`)
              continue
            }
          } else {
            modelID = parsed.modelID
          }
        }
      }

      const key = `${providerID}/${modelID}`
      if (exclude.has(key) || seen.has(key)) {
        continue
      }

      seen.add(key)
      candidates.push({
        providerID,
        modelID,
        ...(entry.variant ? { variant: entry.variant } : {}),
      })
    }
  }

  return {
    candidates,
    diagnostics: {
      connectedProvidersKnown,
      connectedProviders: connectedProviders ?? [],
      availableModelCount: availableSet.size,
      skippedDisconnected: unique(skippedDisconnected),
      skippedUnavailable: unique(skippedUnavailable),
      skippedUnhealthy: unique(skippedUnhealthy),
    },
  }
}
