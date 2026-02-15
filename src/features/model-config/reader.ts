import { AGENT_MODEL_REQUIREMENTS, CATEGORY_MODEL_REQUIREMENTS, type FallbackEntry } from "../../shared/model-requirements"
import { readConnectedProvidersCache, readProviderModelsCache } from "../../shared/connected-providers-cache"
import type { AgentFallbackSlot, AgentOverrides } from "../../config/schema"

const MAX_SLOTS = 4

export type AgentModelState = {
  name: string
  defaultSlots: string[]
  defaultVariants: (string | undefined)[]
  customSlots?: string[]
  customFallback?: AgentFallbackSlot[]
  modelOverride?: string
}

export type CategoryModelState = {
  name: string
  defaultSlots: string[]
  defaultVariants: (string | undefined)[]
  modelOverride?: string
}

export type ModelConfigState = {
  agents: AgentModelState[]
  categories: CategoryModelState[]
  connectedProviders: string[]
  modelsByProvider: Record<string, string[]>
}

function fallbackChainToSlots(chain: FallbackEntry[]): { slots: string[]; variants: (string | undefined)[] } {
  const truncated = chain.slice(0, MAX_SLOTS)
  const slots = truncated.map(entry => {
    const provider = entry.providers[0]
    return `${provider}/${entry.model}`
  })
  const variants = truncated.map(entry => entry.variant)
  return { slots, variants }
}

export async function readModelConfigState(
  agentOverrides?: AgentOverrides,
): Promise<ModelConfigState> {
  const connectedProviders = readConnectedProvidersCache() ?? []

  const providerModelsCache = readProviderModelsCache()
  const modelsByProvider: Record<string, string[]> = {}
  if (providerModelsCache) {
    for (const [providerId, modelIds] of Object.entries(providerModelsCache.models)) {
      modelsByProvider[providerId] = (modelIds as any[]).map(
        (item: any) => typeof item === "string" ? item : item?.id,
      ).filter(Boolean) as string[]
    }
  }

  const overrides = agentOverrides ?? {}

  const agents: AgentModelState[] = Object.entries(AGENT_MODEL_REQUIREMENTS).map(
    ([name, requirement]) => {
      const override = (overrides as Record<string, any>)[name]
      const { slots: defaultSlots, variants: defaultVariants } = fallbackChainToSlots(requirement.fallbackChain)

      const customFallback: AgentFallbackSlot[] | undefined = override?.fallback
      const customSlots: string[] | undefined = customFallback?.map((slot) => slot.model)
      const modelOverride: string | undefined = override?.model

      return {
        name,
        defaultSlots,
        defaultVariants,
        customSlots,
        customFallback,
        modelOverride,
      }
    },
  )

  const categories: CategoryModelState[] = Object.entries(CATEGORY_MODEL_REQUIREMENTS).map(
    ([name, requirement]) => {
      const { slots: defaultSlots, variants: defaultVariants } = fallbackChainToSlots(requirement.fallbackChain)
      return {
        name,
        defaultSlots,
        defaultVariants,
      }
    },
  )

  return {
    agents,
    categories,
    connectedProviders,
    modelsByProvider,
  }
}
