import type { AgentConfig } from "@opencode-ai/sdk"
import type { BuiltinAgentName, AgentOverrideConfig, AgentOverrides, AgentFactory, AgentPromptMetadata } from "./types"
import type { CategoriesConfig, CategoryConfig, GitMasterConfig } from "../config/schema"
import { createKordAgent } from "./kord"
import { createArchitectAgent, ARCHITECT_PROMPT_METADATA } from "./architect"
import { createLibrarianAgent, LIBRARIAN_PROMPT_METADATA } from "./librarian"
import { createExploreAgent, EXPLORE_PROMPT_METADATA } from "./explore"
import { createVisionAgent, VISION_PROMPT_METADATA } from "./vision"
import { createAnalystAgent, analystPromptMetadata } from "./analyst"
import { createPlanAnalyzerAgent, planAnalyzerPromptMetadata } from "./plan-analyzer"
import { createPlanReviewerAgent, planReviewerPromptMetadata } from "./plan-reviewer"
import { createBuilderAgent, builderPromptMetadata } from "./builder"
import { createQaAgent, qaPromptMetadata } from "./qa"
import { createDevAgent } from "./dev"
import { createSmAgent, smPromptMetadata } from "./sm"
import { createPmAgent, pmPromptMetadata } from "./pm"
import { createPoAgent, poPromptMetadata } from "./po"
import { createDevopsAgent, devopsPromptMetadata } from "./devops"
import { createDataEngineerAgent, dataEngineerPromptMetadata } from "./data-engineer"
import { createUxDesignExpertAgent, uxDesignExpertPromptMetadata } from "./ux-design-expert"
import { createSquadCreatorAgent, squadCreatorPromptMetadata } from "./squad-creator"
import type { AvailableAgent, AvailableCategory, AvailableSkill } from "./dynamic-agent-prompt-builder"
import { deepMerge, fetchAvailableModels, resolveModelPipeline, AGENT_MODEL_REQUIREMENTS, readConnectedProvidersCache, isModelAvailable, isAnyFallbackModelAvailable, isAnyProviderConnected, migrateAgentConfig } from "../shared"
import { DEFAULT_CATEGORIES, CATEGORY_DESCRIPTIONS } from "../tools/delegate-task/constants"
import { resolveMultipleSkills } from "../features/opencode-skill-loader/skill-content"
import { createBuiltinSkills } from "../features/builtin-skills"
import type { LoadedSkill, SkillScope } from "../features/opencode-skill-loader/types"
import type { BrowserAutomationProvider } from "../config/schema"

type AgentSource = AgentFactory | AgentConfig

const agentSources: Record<BuiltinAgentName, AgentSource> = {
  kord: createKordAgent,
  dev: createDevAgent,
  architect: createArchitectAgent,
  librarian: createLibrarianAgent,
  explore: createExploreAgent,
  "vision": createVisionAgent,
  analyst: createAnalystAgent,
  "plan-analyzer": createPlanAnalyzerAgent,
  "plan-reviewer": createPlanReviewerAgent,
  qa: createQaAgent,
  // Note: Builder is handled specially in createBuiltinAgents()
  // because it needs OrchestratorContext, not just a model string
  builder: createBuilderAgent as unknown as AgentFactory,
  sm: createSmAgent,
  pm: createPmAgent,
  po: createPoAgent,
  devops: createDevopsAgent,
  "data-engineer": createDataEngineerAgent,
  "ux-design-expert": createUxDesignExpertAgent,
  "squad-creator": createSquadCreatorAgent,
}

/**
 * Metadata for each agent, used to build Kord's dynamic prompt sections
 * (Delegation Table, Tool Selection, Key Triggers, etc.)
 */
const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  architect: ARCHITECT_PROMPT_METADATA,
  librarian: LIBRARIAN_PROMPT_METADATA,
  explore: EXPLORE_PROMPT_METADATA,
  "vision": VISION_PROMPT_METADATA,
  analyst: analystPromptMetadata,
  "plan-analyzer": planAnalyzerPromptMetadata,
  "plan-reviewer": planReviewerPromptMetadata,
  qa: qaPromptMetadata,
  builder: builderPromptMetadata,
  sm: smPromptMetadata,
  pm: pmPromptMetadata,
  po: poPromptMetadata,
  devops: devopsPromptMetadata,
  "data-engineer": dataEngineerPromptMetadata,
  "ux-design-expert": uxDesignExpertPromptMetadata,
  "squad-creator": squadCreatorPromptMetadata,
}

function isFactory(source: AgentSource): source is AgentFactory {
  return typeof source === "function"
}

export function buildAgent(
  source: AgentSource,
  model: string,
  categories?: CategoriesConfig,
  gitMasterConfig?: GitMasterConfig,
  browserProvider?: BrowserAutomationProvider,
  disabledSkills?: Set<string>
): AgentConfig {
  const base = isFactory(source) ? source(model) : source
  const categoryConfigs: Record<string, CategoryConfig> = categories
    ? { ...DEFAULT_CATEGORIES, ...categories }
    : DEFAULT_CATEGORIES

  const agentWithCategory = base as AgentConfig & { category?: string; skills?: string[]; variant?: string }
  if (agentWithCategory.category) {
    const categoryConfig = categoryConfigs[agentWithCategory.category]
    if (categoryConfig) {
      if (!base.model) {
        base.model = categoryConfig.model
      }
      if (base.temperature === undefined && categoryConfig.temperature !== undefined) {
        base.temperature = categoryConfig.temperature
      }
      if (base.variant === undefined && categoryConfig.variant !== undefined) {
        base.variant = categoryConfig.variant
      }
    }
  }

  if (agentWithCategory.skills?.length) {
    const { resolved } = resolveMultipleSkills(agentWithCategory.skills, { gitMasterConfig, browserProvider, disabledSkills })
    if (resolved.size > 0) {
      const skillContent = Array.from(resolved.values()).join("\n\n")
      base.prompt = skillContent + (base.prompt ? "\n\n" + base.prompt : "")
    }
  }

  return base
}

/**
 * Creates Kord-specific environment context (time, timezone, locale).
 * Note: Working directory, platform, and date are already provided by OpenCode's system.ts,
 * so we only include fields that OpenCode doesn't provide to avoid duplication.
 */
export function createEnvContext(): string {
  const now = new Date()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const locale = Intl.DateTimeFormat().resolvedOptions().locale

  const dateStr = now.toLocaleDateString(locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const timeStr = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  return `
<kord-env>
  Current date: ${dateStr}
  Current time: ${timeStr}
  Timezone: ${timezone}
  Locale: ${locale}
</kord-env>`
}

/**
 * Expands a category reference from an agent override into concrete config properties.
 * Category properties are applied unconditionally (overwriting factory defaults),
 * because the user's chosen category should take priority over factory base values.
 * Direct override properties applied later via mergeAgentConfig() will supersede these.
 */
function applyCategoryOverride(
  config: AgentConfig,
  categoryName: string,
  mergedCategories: Record<string, CategoryConfig>
): AgentConfig {
  const categoryConfig = mergedCategories[categoryName]
  if (!categoryConfig) return config

  const result = { ...config } as AgentConfig & Record<string, unknown>
  if (categoryConfig.model) result.model = categoryConfig.model
  if (categoryConfig.variant !== undefined) result.variant = categoryConfig.variant
  if (categoryConfig.temperature !== undefined) result.temperature = categoryConfig.temperature
  if (categoryConfig.reasoningEffort !== undefined) result.reasoningEffort = categoryConfig.reasoningEffort
  if (categoryConfig.textVerbosity !== undefined) result.textVerbosity = categoryConfig.textVerbosity
  if (categoryConfig.thinking !== undefined) result.thinking = categoryConfig.thinking
  if (categoryConfig.top_p !== undefined) result.top_p = categoryConfig.top_p
  if (categoryConfig.maxTokens !== undefined) result.maxTokens = categoryConfig.maxTokens

  return result as AgentConfig
}

function applyModelResolution(input: {
  uiSelectedModel?: string
  userModel?: string
  requirement?: { fallbackChain?: { providers: string[]; model: string; variant?: string }[] }
  customFallbackChain?: { providers: string[]; model: string; variant?: string }[]
  availableModels: Set<string>
  systemDefaultModel?: string
}) {
  const { uiSelectedModel, userModel, requirement, customFallbackChain, availableModels, systemDefaultModel } = input
  return resolveModelPipeline({
    intent: { uiSelectedModel, userModel },
    constraints: { availableModels },
    policy: { fallbackChain: requirement?.fallbackChain, customFallbackSlots: customFallbackChain, systemDefaultModel },
  })
}

function getFirstFallbackModel(requirement?: {
  fallbackChain?: { providers: string[]; model: string; variant?: string }[]
}, customFallbackChain?: { providers: string[]; model: string; variant?: string }[]) {
  const chain = customFallbackChain && customFallbackChain.length > 0
    ? customFallbackChain
    : requirement?.fallbackChain
  const entry = chain?.[0]
  if (!entry || entry.providers.length === 0) return undefined
  return {
    model: `${entry.providers[0]}/${entry.model}`,
    provenance: "provider-fallback" as const,
    variant: entry.variant,
  }
}

function applyEnvironmentContext(config: AgentConfig, directory?: string): AgentConfig {
  if (!directory || !config.prompt) return config
  const envContext = createEnvContext()
  return { ...config, prompt: config.prompt + envContext }
}

function applyOverrides(
  config: AgentConfig,
  override: AgentOverrideConfig | undefined,
  mergedCategories: Record<string, CategoryConfig>
): AgentConfig {
  let result = config
  const overrideCategory = (override as Record<string, unknown> | undefined)?.category as string | undefined
  if (overrideCategory) {
    result = applyCategoryOverride(result, overrideCategory, mergedCategories)
  }

  if (override) {
    result = mergeAgentConfig(result, override)
  }

  return result
}

function mergeAgentConfig(
  base: AgentConfig,
  override: AgentOverrideConfig
): AgentConfig {
  const migratedOverride = migrateAgentConfig(override as Record<string, unknown>) as AgentOverrideConfig
  const {
    prompt_append,
    fallback: _fallback,
    routing_mode: _legacyRoutingMode,
    fallback_slots: _legacyFallbackSlots,
    ...rest
  } = migratedOverride as AgentOverrideConfig & {
    routing_mode?: unknown
    fallback_slots?: unknown
  }
  const merged = deepMerge(base, rest as Partial<AgentConfig>)

  if (prompt_append && merged.prompt) {
    merged.prompt = merged.prompt + "\n" + prompt_append
  }

  return merged
}

function buildCustomFallbackChain(override?: AgentOverrideConfig): {
  providers: string[]
  model: string
  variant?: string
}[] | undefined {
  const slots = override?.fallback
  if (!slots || slots.length === 0) return undefined

  const chain = slots
    .map((slot) => {
      const [provider, ...modelParts] = slot.model.split("/")
      const model = modelParts.join("/")
      if (!provider || !model) return null
      return {
        providers: [provider],
        model,
        ...(slot.variant ? { variant: slot.variant } : {}),
      }
    })
    .filter((entry): entry is { providers: string[]; model: string; variant?: string } => entry !== null)

  return chain.length > 0 ? chain : undefined
}

function mapScopeToLocation(scope: SkillScope): AvailableSkill["location"] {
  if (scope === "user" || scope === "opencode") return "user"
  if (scope === "project" || scope === "opencode-project") return "project"
  return "plugin"
}

export async function createBuiltinAgents(
  disabledAgents: string[] = [],
  agentOverrides: AgentOverrides = {},
  directory?: string,
  systemDefaultModel?: string,
  categories?: CategoriesConfig,
  gitMasterConfig?: GitMasterConfig,
  discoveredSkills: LoadedSkill[] = [],
  client?: any,
  browserProvider?: BrowserAutomationProvider,
  uiSelectedModel?: string,
  disabledSkills?: Set<string>
): Promise<Record<string, AgentConfig>> {
  const connectedProviders = readConnectedProvidersCache()
  // IMPORTANT: Do NOT pass client to fetchAvailableModels during plugin initialization.
  // This function is called from config handler, and calling client API causes deadlock.
  
  const availableModels = await fetchAvailableModels(undefined, {
    connectedProviders: connectedProviders ?? undefined,
  })
  const isFirstRunNoCache =
    availableModels.size === 0 && (!connectedProviders || connectedProviders.length === 0)

  const result: Record<string, AgentConfig> = {}
  const availableAgents: AvailableAgent[] = []

  const mergedCategories = categories
    ? { ...DEFAULT_CATEGORIES, ...categories }
    : DEFAULT_CATEGORIES

  const availableCategories: AvailableCategory[] = Object.entries(mergedCategories).map(([name]) => ({
    name,
    description: categories?.[name]?.description ?? CATEGORY_DESCRIPTIONS[name] ?? "General tasks",
  }))

  const builtinSkills = createBuiltinSkills({ browserProvider, disabledSkills })
  const builtinSkillNames = new Set(builtinSkills.map(s => s.name))

  const builtinAvailable: AvailableSkill[] = builtinSkills.map((skill) => ({
    name: skill.name,
    description: skill.description,
    location: "plugin" as const,
  }))

  const discoveredAvailable: AvailableSkill[] = discoveredSkills
    .filter(s => !builtinSkillNames.has(s.name))
    .map((skill) => ({
      name: skill.name,
      description: skill.definition.description ?? "",
      location: mapScopeToLocation(skill.scope),
    }))

  const availableSkills: AvailableSkill[] = [...builtinAvailable, ...discoveredAvailable]

  // Collect general agents first (for availableAgents), but don't add to result yet
  const pendingAgentConfigs: Map<string, AgentConfig> = new Map()

   for (const [name, source] of Object.entries(agentSources)) {
     const agentName = name as BuiltinAgentName

     if (agentName === "kord") continue
     if (agentName === "dev") continue
     if (agentName === "builder") continue
     if (disabledAgents.some((name) => name.toLowerCase() === agentName.toLowerCase())) continue

     const override = agentOverrides[agentName]
       ?? Object.entries(agentOverrides).find(([key]) => key.toLowerCase() === agentName.toLowerCase())?.[1]
     const requirement = AGENT_MODEL_REQUIREMENTS[agentName]
     const customFallbackChain = buildCustomFallbackChain(override)

     // Check if agent requires a specific model
     if (requirement?.requiresModel && availableModels) {
       if (!isModelAvailable(requirement.requiresModel, availableModels)) {
         continue
       }
     }

     const isPrimaryAgent = isFactory(source) && source.mode === "primary"

    const resolution = applyModelResolution({
      uiSelectedModel: isPrimaryAgent ? uiSelectedModel : undefined,
      userModel: override?.model,
      requirement,
      customFallbackChain,
      availableModels,
      systemDefaultModel,
    })
    if (!resolution) continue
    const { model, variant: resolvedVariant } = resolution

    let config = buildAgent(source, model, mergedCategories, gitMasterConfig, browserProvider, disabledSkills)
    
    // Apply resolved variant from model fallback chain
    if (resolvedVariant) {
      config = { ...config, variant: resolvedVariant }
    }

    // Expand override.category into concrete properties (higher priority than factory/resolved)
    const overrideCategory = (override as Record<string, unknown> | undefined)?.category as string | undefined
    if (overrideCategory) {
      config = applyCategoryOverride(config, overrideCategory, mergedCategories)
    }

    if (agentName === "librarian") {
      config = applyEnvironmentContext(config, directory)
    }

    config = applyOverrides(config, override, mergedCategories)

    // Store for later - will be added after kord and dev
    pendingAgentConfigs.set(name, config)

    const metadata = agentMetadata[agentName]
    if (metadata) {
      availableAgents.push({
        name: agentName,
        description: config.description ?? "",
        metadata,
      })
    }
  }

   const kordOverride = agentOverrides["kord"]
    const kordRequirement = AGENT_MODEL_REQUIREMENTS["kord"]
    const kordCustomFallbackChain = buildCustomFallbackChain(kordOverride)
    const hasKordExplicitConfig = Boolean(kordOverride?.model || kordCustomFallbackChain)
   const meetsKordAnyModelRequirement =
     !kordRequirement?.requiresAnyModel ||
     hasKordExplicitConfig ||
     isFirstRunNoCache ||
     isAnyFallbackModelAvailable(kordRequirement.fallbackChain, availableModels)

   if (!disabledAgents.includes("kord") && meetsKordAnyModelRequirement) {
    let kordResolution = applyModelResolution({
      uiSelectedModel,
      userModel: kordOverride?.model,
      requirement: kordRequirement,
      customFallbackChain: kordCustomFallbackChain,
      availableModels,
      systemDefaultModel,
    })

    if (isFirstRunNoCache && !kordOverride?.model && !uiSelectedModel) {
      kordResolution = getFirstFallbackModel(kordRequirement, kordCustomFallbackChain)
    }

    if (kordResolution) {
      const { model: kordModel, variant: kordResolvedVariant } = kordResolution

      let kordConfig = createKordAgent(
        kordModel,
        availableAgents,
        undefined,
        availableSkills,
        availableCategories
      )

      if (kordResolvedVariant) {
        kordConfig = { ...kordConfig, variant: kordResolvedVariant }
      }

      kordConfig = applyOverrides(kordConfig, kordOverride, mergedCategories)
      kordConfig = applyEnvironmentContext(kordConfig, directory)

      result["kord"] = kordConfig
    }
   }

  if (!disabledAgents.includes("dev")) {
    const devOverride = agentOverrides["dev"]
    const devRequirement = AGENT_MODEL_REQUIREMENTS["dev"]
    const devCustomFallbackChain = buildCustomFallbackChain(devOverride)
    const hasDevExplicitConfig = Boolean(devOverride?.model || devCustomFallbackChain)

    const hasRequiredProvider =
      !devRequirement?.requiresProvider ||
      hasDevExplicitConfig ||
      isFirstRunNoCache ||
      isAnyProviderConnected(devRequirement.requiresProvider, availableModels)

    if (hasRequiredProvider) {
      let devResolution = applyModelResolution({
        userModel: devOverride?.model,
        requirement: devRequirement,
        customFallbackChain: devCustomFallbackChain,
        availableModels,
        systemDefaultModel,
      })

      if (isFirstRunNoCache && !devOverride?.model) {
        devResolution = getFirstFallbackModel(devRequirement, devCustomFallbackChain)
      }

      if (devResolution) {
        const { model: devModel, variant: devResolvedVariant } = devResolution

        let devConfig = createDevAgent(
          devModel,
          availableAgents,
          undefined,
          availableSkills,
          availableCategories
        )

        devConfig = { ...devConfig, variant: devResolvedVariant ?? "medium" }

        const hepOverrideCategory = (devOverride as Record<string, unknown> | undefined)?.category as string | undefined
        if (hepOverrideCategory) {
          devConfig = applyCategoryOverride(devConfig, hepOverrideCategory, mergedCategories)
        }

        if (directory && devConfig.prompt) {
          const envContext = createEnvContext()
          devConfig = { ...devConfig, prompt: devConfig.prompt + envContext }
        }

        if (devOverride) {
          devConfig = mergeAgentConfig(devConfig, devOverride)
        }

        result["dev"] = devConfig
      }
    }
   }

   // Add pending agents after kord and dev to maintain order
   for (const [name, config] of pendingAgentConfigs) {
     result[name] = config
   }

    if (!disabledAgents.includes("builder")) {
      const orchestratorOverride = agentOverrides["builder"]
      const builderRequirement = AGENT_MODEL_REQUIREMENTS["builder"]
      const builderCustomFallbackChain = buildCustomFallbackChain(orchestratorOverride)

      const builderResolution = applyModelResolution({
        uiSelectedModel,
        userModel: orchestratorOverride?.model,
        requirement: builderRequirement,
        customFallbackChain: builderCustomFallbackChain,
        availableModels,
        systemDefaultModel,
      })
    
    if (builderResolution) {
      const { model: builderModel, variant: builderResolvedVariant } = builderResolution

      let orchestratorConfig = createBuilderAgent({
        model: builderModel,
        availableAgents,
        availableSkills,
        userCategories: categories,
      })

      if (builderResolvedVariant) {
        orchestratorConfig = { ...orchestratorConfig, variant: builderResolvedVariant }
      }

      orchestratorConfig = applyOverrides(orchestratorConfig, orchestratorOverride, mergedCategories)

      result["builder"] = orchestratorConfig
    }
   }

   return result
 }
