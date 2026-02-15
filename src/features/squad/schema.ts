import { z } from "zod"

/**
 * SQUAD.yaml schema — defines a portable agent team for a specific domain.
 *
 * Squads bring:
 * 1. Agents — domain-specialized personas
 * 2. Categories — domain-specific task routing
 * 3. Skills — domain methodology (referenced by name)
 * 4. Plan template — domain-specific plan format
 * 5. Default executor/reviewer — fallback delegation targets
 */

/** Agent definition within a squad */
export const squadAgentSchema = z.object({
  /** Short description of the agent's role */
  description: z.string(),
  /** Model override (e.g., anthropic/claude-sonnet-4-5) */
  model: z.string().optional(),
  /** Agent mode: subagent (default) or all */
  mode: z.enum(["subagent", "all"]).default("subagent"),
  /** System prompt for the agent (inline or file ref) */
  prompt: z.string().optional(),
  /** Path to external .md prompt file, relative to squad directory */
  prompt_file: z.string().optional(),
  /** Skills this agent should load */
  skills: z.array(z.string()).default([]),
  /** Tool permission overrides */
  tools: z.record(z.string(), z.boolean()).optional(),
  /** Temperature override (0-1) */
  temperature: z.number().min(0).max(1).optional(),
  /** If true, agent can delegate via task() */
  is_chief: z.boolean().default(false),
})

/** Category definition within a squad */
export const squadCategorySchema = z.object({
  /** Model for this category */
  model: z.string().optional(),
  /** What this category handles */
  description: z.string(),
  /** Model variant */
  variant: z.string().optional(),
})

/** Squad config section (v2) */
export const squadConfigSchema = z.object({
  /** Base config to extend from (e.g., "default", "strict") */
  extends: z.string().optional(),
  /** Domain-specific rules or constraints */
  rules: z.array(z.string()).optional(),
}).optional()

/** Squad dependencies section (v2) */
export const squadDependenciesSchema = z.object({
  /** Skills this squad requires */
  skills: z.array(z.string()).optional(),
  /** Other squads this squad depends on */
  squads: z.array(z.string()).optional(),
}).optional()

/** Kord AIOS compatibility metadata (v2) */
export const squadKordSchema = z.object({
  /** Minimum Kord AIOS version required */
  minVersion: z.string().optional(),
}).optional()

/** Top-level SQUAD.yaml manifest */
export const squadSchema = z.object({
  /** Squad identifier (kebab-case) */
  name: z.string().min(1),
  /** Human-readable squad description */
  description: z.string(),
  /** Semantic version */
  version: z.string().default("1.0.0"),

  /** Named agents in this squad */
  agents: z.record(z.string(), squadAgentSchema),

  /** Domain-specific task categories */
  categories: z.record(z.string(), squadCategorySchema).optional(),

  /** Default agent for task execution */
  default_executor: z.string().optional(),
  /** Default agent for task review */
  default_reviewer: z.string().optional(),
  /** Default contract type (story, campaign, case, etc.) */
  contract_type: z.string().default("task"),

  /** Custom plan template for this domain */
  plan_template: z.string().optional(),

  /** Squad configuration (v2) */
  config: squadConfigSchema,
  /** Squad dependencies (v2) */
  dependencies: squadDependenciesSchema,
  /** Searchable tags (v2) */
  tags: z.array(z.string()).optional(),
  /** Kord AIOS compatibility metadata (v2) */
  kord: squadKordSchema,
})

export type SquadManifest = z.infer<typeof squadSchema>
export type SquadAgent = z.infer<typeof squadAgentSchema>
export type SquadCategory = z.infer<typeof squadCategorySchema>
export type SquadConfig = z.infer<typeof squadConfigSchema>
export type SquadDependencies = z.infer<typeof squadDependenciesSchema>
export type SquadKord = z.infer<typeof squadKordSchema>
