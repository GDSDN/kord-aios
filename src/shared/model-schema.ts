import { z } from "zod"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parseJsonc } from "./jsonc-parser"

export const ReasoningTierSchema = z.enum(["none", "low", "medium", "high", "ultra"])
export type ReasoningTier = z.infer<typeof ReasoningTierSchema>

export const ModelDomainSchema = z.enum(["planning", "coding", "analysis", "visual", "writing", "search", "general"])
export type ModelDomain = z.infer<typeof ModelDomainSchema>

export const ModelEntrySchema = z.object({
  model: z.string(),
  providers: z.array(z.string()),
  reasoning: ReasoningTierSchema.default("none"),
  domains: z.array(ModelDomainSchema),
  description: z.string(),
  enabled_agents: z.array(z.string()).default([]),
  cost_tier: z.number().min(1).max(5),
  variant: z.string().optional(),
  context_window: z.number().optional(),
})

export type ModelEntry = z.infer<typeof ModelEntrySchema>

export const ModelSchemaFileSchema = z.object({
  models: z.array(ModelEntrySchema),
})

export type ModelSchemaFile = z.infer<typeof ModelSchemaFileSchema>

export const DEFAULT_MODEL_SCHEMA: ModelEntry[] = [
  {
    model: "claude-opus-4-6",
    providers: ["anthropic", "github-copilot", "opencode"],
    reasoning: "ultra",
    domains: ["planning", "analysis", "coding"],
    description: "Deep reasoning, strategic planning, complex architecture",
    enabled_agents: ["kord", "planner", "analyst", "plan-analyzer", "unspecified-high"],
    cost_tier: 5,
    variant: "max",
  },
  {
    model: "claude-sonnet-4-5",
    providers: ["anthropic", "github-copilot", "opencode"],
    reasoning: "high",
    domains: ["coding", "general"],
    description: "Balanced reasoning and speed",
    enabled_agents: ["builder", "librarian", "unspecified-low"],
    cost_tier: 3,
  },
  {
    model: "claude-haiku-4-5",
    providers: ["anthropic", "github-copilot", "opencode"],
    reasoning: "low",
    domains: ["search", "general"],
    description: "Fast, economical, quick tasks",
    enabled_agents: ["explore", "quick"],
    cost_tier: 1,
  },
  {
    model: "gpt-5.3-codex",
    providers: ["openai", "github-copilot", "opencode"],
    reasoning: "ultra",
    domains: ["coding", "analysis"],
    description: "Autonomous deep coding, extended problem solving",
    enabled_agents: ["dev", "ultrabrain", "deep"],
    cost_tier: 5,
    variant: "medium",
  },
  {
    model: "gpt-5.2",
    providers: ["openai", "github-copilot", "opencode"],
    reasoning: "high",
    domains: ["coding", "analysis", "planning"],
    description: "Strong general reasoning",
    enabled_agents: ["architect", "qa", "plan-reviewer"],
    cost_tier: 4,
    variant: "high",
  },
  {
    model: "gpt-5-nano",
    providers: ["openai", "opencode"],
    reasoning: "none",
    domains: ["search"],
    description: "Ultra-fast lookups, zero reasoning overhead",
    enabled_agents: ["explore"],
    cost_tier: 1,
  },
  {
    model: "gemini-3-pro",
    providers: ["google", "github-copilot", "opencode"],
    reasoning: "high",
    domains: ["visual", "coding", "analysis"],
    description: "Multimodal, creative, strong visual understanding",
    enabled_agents: ["visual-engineering", "artistry"],
    cost_tier: 4,
    variant: "high",
  },
  {
    model: "gemini-3-flash",
    providers: ["google", "github-copilot", "opencode"],
    reasoning: "medium",
    domains: ["writing", "visual", "search"],
    description: "Fast multimodal, good for writing and quick visual",
    enabled_agents: ["vision", "writing", "quick"],
    cost_tier: 2,
  },
  {
    model: "glm-4.7",
    providers: ["zai-coding-plan"],
    reasoning: "medium",
    domains: ["search", "general"],
    description: "Budget alternative, documentation search",
    enabled_agents: ["librarian", "builder"],
    cost_tier: 2,
  },
  {
    model: "k2p5",
    providers: ["kimi-for-coding"],
    reasoning: "high",
    domains: ["coding", "planning"],
    description: "Kimi strong reasoning, cost-effective alternative",
    enabled_agents: ["kord", "planner", "analyst", "builder"],
    cost_tier: 3,
  },
]

export function getModelsForAgent(agentName: string, schema: ModelEntry[]): ModelEntry[] {
  return schema.filter(entry => entry.enabled_agents.includes(agentName))
}

export function getModelsByDomain(domain: string, schema: ModelEntry[]): ModelEntry[] {
  return schema.filter(entry => (entry.domains as string[]).includes(domain))
}

export function getModelsByReasoning(tier: ReasoningTier, schema: ModelEntry[]): ModelEntry[] {
  return schema.filter(entry => entry.reasoning === tier)
}

export interface LoadModelSchemaOptions {
  userConfigDir?: string
  projectDir?: string
}

let cachedSchema: ModelEntry[] | null = null

export function clearModelSchemaCache(): void {
  cachedSchema = null
}

function readSchemaFile(filePath: string): ModelEntry[] {
  if (!existsSync(filePath)) return []

  try {
    const content = readFileSync(filePath, "utf-8")
    const parsed = parseJsonc<unknown>(content)

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return []

    const raw = (parsed as Record<string, unknown>).models
    if (!Array.isArray(raw)) return []

    const valid: ModelEntry[] = []
    for (const item of raw) {
      const result = ModelEntrySchema.safeParse(item)
      if (result.success) {
        valid.push(result.data)
      }
    }
    return valid
  } catch {
    return []
  }
}

function normalizeEntry(entry: ModelEntry): ModelEntry {
  if (entry.reasoning === "none" && entry.variant !== undefined) {
    const { variant: _, ...rest } = entry
    return rest as ModelEntry
  }
  return entry
}

function mergeSchemas(base: ModelEntry[], overlay: ModelEntry[]): ModelEntry[] {
  const map = new Map<string, ModelEntry>()
  for (const entry of base) {
    map.set(entry.model, entry)
  }
  for (const entry of overlay) {
    map.set(entry.model, entry)
  }
  return Array.from(map.values())
}

export function loadModelSchema(options?: LoadModelSchemaOptions): ModelEntry[] {
  if (cachedSchema) return cachedSchema

  let merged = [...DEFAULT_MODEL_SCHEMA]

  if (options?.userConfigDir) {
    const userFile = join(options.userConfigDir, "model-schema.jsonc")
    const userEntries = readSchemaFile(userFile)
    if (userEntries.length > 0) {
      merged = mergeSchemas(merged, userEntries)
    }
  }

  if (options?.projectDir) {
    const projectFile = join(options.projectDir, ".opencode", "kord-aios", "model-schema.jsonc")
    const projectEntries = readSchemaFile(projectFile)
    if (projectEntries.length > 0) {
      merged = mergeSchemas(merged, projectEntries)
    }
  }

  cachedSchema = merged.map(normalizeEntry)
  return cachedSchema
}
