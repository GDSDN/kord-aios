export type WorkflowStepIntent =
  | "brainstorm"
  | "interview"
  | "research"
  | "agent"
  | "parallel"
  | "gate"
  | "handoff_to_plan"

export type WorkflowValue =
  | string
  | number
  | boolean
  | null
  | WorkflowValue[]
  | { [key: string]: WorkflowValue }

export interface WorkflowCondition {
  all_of?: string[]
  any_of?: string[]
  not?: string[]
  exists?: string[]
  equals?: Record<string, WorkflowValue>
}

export type WorkflowArtifactRef =
  | string
  | {
      id: string
      description?: string
      optional?: boolean
      from?: string
    }

export interface WorkflowInput {
  id: string
  title?: string
  description?: string
  type?: string
  required?: boolean
  default?: WorkflowValue
  options?: string[]
}

export interface WorkflowResource {
  id: string
  type?: string
  ref?: string
  path?: string
  uri?: string
  description?: string
  required?: boolean
}

export interface WorkflowAllowlist {
  tools?: string[]
  paths?: string[]
}

export interface WorkflowStep {
  id: string
  intent: WorkflowStepIntent
  title?: string
  notes?: string
  requires?: WorkflowArtifactRef[]
  creates?: WorkflowArtifactRef[]
  updates?: WorkflowArtifactRef[]
  optional?: boolean
  skip_if?: WorkflowCondition
  when?: WorkflowCondition
  confirmation_required?: boolean
  asset_refs?: string[]
  metadata?: Record<string, WorkflowValue>
}

export interface WorkflowDefinition {
  schema_version: string
  workflow: {
    id: string
    name: string
    version: string
    type?: string
    // Kept for backward compatibility with existing workflow assets.
    runner_agent?: string
    metadata?: Record<string, WorkflowValue>
  }
  runner_agent?: string
  metadata?: Record<string, WorkflowValue>
  inputs?: WorkflowInput[]
  resources?: WorkflowResource[]
  allowlist?: WorkflowAllowlist
  sequence: WorkflowStep[]
}

export type WorkflowSource = "builtin" | "project" | "squad"

export interface LoadedWorkflow {
  definition: WorkflowDefinition
  source: WorkflowSource
  path: string
}

export type WorkflowRunStatus = "running" | "paused" | "aborted" | "completed"

export type WorkflowStepStatus = "pending" | "in_progress" | "completed" | "blocked"

export interface WorkflowRunStepState {
  id: string
  status: WorkflowStepStatus
  started_at?: string
  completed_at?: string
  notes?: string
}

export interface WorkflowRunState {
  run_id: string
  workflow_id: string
  started_at: string
  updated_at: string
  session_ids: string[]
  status: WorkflowRunStatus
  current_step_id?: string
  action_required: boolean
  action_summary?: string
  steps: WorkflowRunStepState[]
  artifacts: Record<string, string>
  decisions: string[]
  user_inputs: string[]
}

export interface WorkflowValidationIssue {
  level: "error" | "warning"
  message: string
}

export interface WorkflowValidationResult {
  valid: boolean
  issues: WorkflowValidationIssue[]
}
