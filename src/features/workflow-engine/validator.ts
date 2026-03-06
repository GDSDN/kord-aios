import { existsSync } from "node:fs"
import { join } from "node:path"
import { BuiltinCommandNameSchema } from "../../config"
import type {
  WorkflowArtifactRef,
  WorkflowDefinition,
  WorkflowValidationIssue,
  WorkflowValidationResult,
} from "./types"

const BUILTIN_COMMANDS = new Set(BuiltinCommandNameSchema.options)

function getArtifactId(artifact: WorkflowArtifactRef): string {
  return typeof artifact === "string" ? artifact : artifact.id
}

export function validateWorkflowDefinition(definition: WorkflowDefinition): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = []

  const seenStepIds = new Set<string>()
  const createdArtifacts = new Set<string>()

  if (!definition.schema_version) {
    issues.push({ level: "error", message: "Missing required field: schema_version" })
  }

  const workflowId = definition.workflow.id
  if (BUILTIN_COMMANDS.has(workflowId as (typeof BuiltinCommandNameSchema.options)[number])) {
    issues.push({
      level: "error",
      message: `Workflow id '${workflowId}' collides with builtin command name`,
    })
  }

  const synkraMetadata = definition.metadata?.synkra
  if (synkraMetadata && typeof synkraMetadata === "object") {
    const unsupportedRuntimeFields = ["triggers", "config", "pre_flight", "completion", "error_handling", "resume", "integration"]
    for (const field of unsupportedRuntimeFields) {
      if ((synkraMetadata as Record<string, unknown>)[field] !== undefined) {
        issues.push({
          level: "warning",
          message: `Synkra construct '${field}' is preserved for reporting but not executable in current workflow runtime`,
        })
      }
    }
  }

  for (const step of definition.sequence) {
    if (seenStepIds.has(step.id)) {
      issues.push({ level: "error", message: `Duplicate step id '${step.id}'` })
    }
    seenStepIds.add(step.id)

    for (const artifact of step.creates ?? []) {
      createdArtifacts.add(getArtifactId(artifact))
    }
    for (const artifact of step.updates ?? []) {
      createdArtifacts.add(getArtifactId(artifact))
    }

    for (const required of step.requires ?? []) {
      const requiredArtifact = getArtifactId(required)
      if (!createdArtifacts.has(requiredArtifact)) {
        issues.push({
          level: "warning",
          message: `Step '${step.id}' requires '${requiredArtifact}' before it is created or updated`,
        })
      }
    }
  }

  return {
    valid: !issues.some((issue) => issue.level === "error"),
    issues,
  }
}

export function validateWorkflowAssets(projectDir: string, definition: WorkflowDefinition): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = []

  for (const step of definition.sequence) {
    for (const ref of step.asset_refs ?? []) {
      const candidate = join(projectDir, ref)
      if (!existsSync(candidate)) {
        issues.push({
          level: "warning",
          message: `Step '${step.id}' references missing asset '${ref}'`,
        })
      }
    }
  }

  return issues
}
