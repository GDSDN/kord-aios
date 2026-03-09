import { z } from "zod"
import type { WorkflowValue } from "./types"

export const WorkflowStepIntentSchema = z.enum([
  "brainstorm",
  "interview",
  "research",
  "agent",
  "parallel",
  "gate",
  "handoff_to_plan",
])

const WorkflowValueSchema: z.ZodType<WorkflowValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(WorkflowValueSchema), z.record(z.string(), WorkflowValueSchema)]),
)

const WorkflowConditionSchema = z.object({
  all_of: z.array(z.string().min(1)).optional(),
  any_of: z.array(z.string().min(1)).optional(),
  not: z.array(z.string().min(1)).optional(),
  exists: z.array(z.string().min(1)).optional(),
  equals: z.record(z.string(), WorkflowValueSchema).optional(),
})

const WorkflowArtifactRefSchema = z.union([
  z.string().min(1),
  z.object({
    id: z.string().min(1),
    description: z.string().optional(),
    optional: z.boolean().optional(),
    from: z.string().optional(),
  }),
])

const WorkflowInputSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  required: z.boolean().optional(),
  default: WorkflowValueSchema.optional(),
  options: z.array(z.string().min(1)).optional(),
})

const WorkflowResourceSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
  ref: z.string().optional(),
  path: z.string().optional(),
  uri: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
})

const WorkflowAllowlistSchema = z.object({
  tools: z.array(z.string().min(1)).optional(),
  paths: z.array(z.string().min(1)).optional(),
})

export const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  intent: WorkflowStepIntentSchema,
  title: z.string().optional(),
  notes: z.string().optional(),
  requires: z.array(WorkflowArtifactRefSchema).optional(),
  creates: z.array(WorkflowArtifactRefSchema).optional(),
  updates: z.array(WorkflowArtifactRefSchema).optional(),
  optional: z.boolean().optional(),
  skip_if: WorkflowConditionSchema.optional(),
  when: WorkflowConditionSchema.optional(),
  confirmation_required: z.boolean().optional(),
  asset_refs: z.array(z.string()).optional(),
  metadata: z.record(z.string(), WorkflowValueSchema).optional(),
})

export const WorkflowDefinitionSchema = z.object({
  schema_version: z.string().min(1),
  workflow: z.object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().min(1),
    version: z.string().min(1),
    type: z.string().optional(),
    // Kept for backward compatibility with existing workflow assets.
    runner_agent: z.string().optional(),
    metadata: z.record(z.string(), WorkflowValueSchema).optional(),
  }),
  runner_agent: z.string().optional(),
  metadata: z.record(z.string(), WorkflowValueSchema).optional(),
  inputs: z.array(WorkflowInputSchema).optional(),
  resources: z.array(WorkflowResourceSchema).optional(),
  allowlist: WorkflowAllowlistSchema.optional(),
  sequence: z.array(WorkflowStepSchema).min(1),
})
