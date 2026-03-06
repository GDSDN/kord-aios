import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import yaml from "js-yaml"
import type {
  LoadedWorkflow,
  WorkflowDefinition,
  WorkflowRunState,
  WorkflowRunStepState,
  WorkflowValue,
} from "./types"
import { loadWorkflowRegistry } from "./registry"
import {
  createWorkflowRunState,
  getLatestWorkflowRun,
  readActiveWorkflowRun,
  writeWorkflowRunState,
} from "./storage"
import { validateWorkflowAssets, validateWorkflowDefinition } from "./validator"

interface WorkflowCommandArgs {
  directory: string
  sessionID: string
  rawArgs: string
  aliasWorkflowId?: string
}

interface SynkraImportTarget {
  filePath: string
  workflowId: string
}

interface AdaptedSynkraWorkflow {
  definition: WorkflowDefinition
  unchangedFields: string[]
  substitutions: Array<{ from: string; to: string; reason: string }>
  unsupportedConstructs: Array<{ construct: string; handling: string }>
  handlingNotes: string[]
}

function formatValidation(definition: WorkflowDefinition, directory: string): string {
  const core = validateWorkflowDefinition(definition)
  const assetIssues = validateWorkflowAssets(directory, definition)
  const issues = [...core.issues, ...assetIssues]

  if (issues.length === 0) {
    return `VALID workflow '${definition.workflow.id}' (no issues)`
  }

  const lines = issues.map((issue) => `- [${issue.level.toUpperCase()}] ${issue.message}`)
  return `${core.valid ? "VALID_WITH_WARNINGS" : "INVALID"} workflow '${definition.workflow.id}'\n${lines.join("\n")}`
}

function formatWorkflowList(registry: Map<string, LoadedWorkflow>): string {
  const rows = Array.from(registry.values())
    .map((item) => `- ${item.definition.workflow.id} (${item.source})`)
    .join("\n")

  return rows
    ? `Registered workflows:\n${rows}`
    : "No workflows registered."
}

function scaffoldWorkflow(directory: string, id: string): string {
  const workflowDir = join(directory, ".kord", "workflows")
  const commandDir = join(directory, ".opencode", "command")

  if (!existsSync(workflowDir)) {
    mkdirSync(workflowDir, { recursive: true })
  }
  if (!existsSync(commandDir)) {
    mkdirSync(commandDir, { recursive: true })
  }

  const workflowPath = join(workflowDir, `${id}.yaml`)
  const commandPath = join(commandDir, `${id}.md`)

  const workflowTemplate = `schema_version: "1"
workflow:
  id: ${id}
  name: ${id}
  version: "1.0.0"
  type: development
  runner_agent: kord
sequence:
  - id: kickoff
    intent: interview
    title: Gather goals and constraints
`

  const commandTemplate = `---
description: Workflow alias for ${id}
---

<workflow-context>
<workflow-id>${id}</workflow-id>
</workflow-context>

<user-request>
\${user_message}
</user-request>
`

  if (!existsSync(workflowPath)) {
    writeFileSync(workflowPath, workflowTemplate, "utf-8")
  }

  if (!existsSync(commandPath)) {
    writeFileSync(commandPath, commandTemplate, "utf-8")
  }

  return `Scaffolded workflow at '${workflowPath}' and alias at '${commandPath}'.`
}

function setRunPaused(run: WorkflowRunState): WorkflowRunState {
  return {
    ...run,
    status: "paused",
    updated_at: new Date().toISOString(),
    action_required: true,
    action_summary: "Workflow paused",
  }
}

function setRunAborted(run: WorkflowRunState): WorkflowRunState {
  return {
    ...run,
    status: "aborted",
    updated_at: new Date().toISOString(),
    action_required: false,
    action_summary: "Workflow aborted",
  }
}

function continueRun(run: WorkflowRunState): WorkflowRunState {
  if (run.status !== "running" && run.status !== "paused") {
    return run
  }

  const currentIndex = run.steps.findIndex((step) => step.id === run.current_step_id)
  if (currentIndex < 0) {
    return run
  }

  const now = new Date().toISOString()
  const nextIndex = currentIndex + 1
  const nextStep = run.steps[nextIndex]

  const updatedSteps: WorkflowRunStepState[] = run.steps.map((step, index) => {
    if (index === currentIndex) {
      return { ...step, status: "completed", completed_at: now }
    }
    if (index === nextIndex) {
      return { ...step, status: "in_progress", started_at: now }
    }
    return step
  })

  if (!nextStep) {
    return {
      ...run,
      steps: updatedSteps,
      current_step_id: undefined,
      status: "completed",
      updated_at: now,
      action_required: false,
      action_summary: "Workflow completed",
    }
  }

  return {
    ...run,
    steps: updatedSteps,
    current_step_id: nextStep.id,
    status: "running",
    updated_at: now,
    action_required: true,
    action_summary: `Current step: ${nextStep.id}`,
  }
}

function parseWorkflowArgs(rawArgs: string): { action: string; target?: string; rest: string } {
  const trimmed = rawArgs.trim()
  if (!trimmed) {
    return { action: "list", rest: "" }
  }

  const tokens = trimmed.split(/\s+/)
  return {
    action: tokens[0].toLowerCase(),
    target: tokens[1],
    rest: tokens.slice(2).join(" "),
  }
}

function normalizeAliasWorkflowArgs(rawArgs: string, aliasWorkflowId?: string): string {
  if (!aliasWorkflowId) {
    return rawArgs
  }

  const trimmed = rawArgs.trim()
  if (!trimmed) {
    return aliasWorkflowId
  }

  const parsed = parseWorkflowArgs(trimmed)
  const aliasTargetActions = new Set(["validate", "pause", "abort", "continue", "status"])
  if (!aliasTargetActions.has(parsed.action)) {
    return trimmed
  }

  const suffix = parsed.target ? (parsed.rest ? ` ${parsed.rest}` : "") : parsed.rest ? ` ${parsed.rest}` : ""
  return `${parsed.action} ${aliasWorkflowId}${suffix}`
}

function getSynkraCatalogDirectory(): string {
  return process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR ?? "D:/dev/synkra-aios/.aios-core/development/workflows"
}

function collectYamlFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return []
  }

  const files = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map((entry) => join(directory, entry.name))

  return files.sort((a, b) => a.localeCompare(b))
}

function readSynkraWorkflowId(filePath: string): string | undefined {
  try {
    const raw = readFileSync(filePath, "utf-8")
    const parsed = yaml.load(raw)
    if (!parsed || typeof parsed !== "object") {
      return undefined
    }

    const root = parsed as Record<string, unknown>
    const workflow = root.workflow
    if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) {
      return undefined
    }

    const id = (workflow as Record<string, unknown>).id
    return typeof id === "string" && id.trim().length > 0 ? id.trim().toLowerCase() : undefined
  } catch {
    return undefined
  }
}

function resolveSynkraWorkflowTarget(catalogDir: string, workflowId: string): SynkraImportTarget | undefined {
  for (const filePath of collectYamlFiles(catalogDir)) {
    const parsedId = readSynkraWorkflowId(filePath)
    if (parsedId === workflowId) {
      return { filePath, workflowId }
    }
  }
  return undefined
}

function isValidSynkraWorkflowId(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(value)
}

function parseSynkraImportTargets(rawTarget: string): {
  targets: SynkraImportTarget[]
  error?: string
  notices?: string[]
} {
  const target = rawTarget.trim()
  if (!target) {
    return { targets: [], error: "Usage: /workflow import synkra <workflow-id|all>" }
  }

  const catalogDir = getSynkraCatalogDirectory()
  if (target.toLowerCase() === "all") {
    const rawTargets = collectYamlFiles(catalogDir)
      .map((filePath) => {
        const workflowId = readSynkraWorkflowId(filePath)
        return workflowId ? { filePath, workflowId } : undefined
      })
      .filter((item): item is SynkraImportTarget => !!item)

    const deduped = new Map<string, SynkraImportTarget>()
    const duplicateIds = new Set<string>()
    for (const entry of rawTargets) {
      if (deduped.has(entry.workflowId)) {
        duplicateIds.add(entry.workflowId)
        continue
      }
      deduped.set(entry.workflowId, entry)
    }

    const allTargets = [...deduped.values()]

    if (allTargets.length === 0) {
      return {
        targets: [],
        error: `No Synkra workflows with workflow.id found in catalog '${catalogDir}'.`,
      }
    }

    const notices =
      duplicateIds.size > 0
        ? [
            `Skipped duplicate workflow.id entries from Synkra catalog: ${[...duplicateIds].sort((a, b) => a.localeCompare(b)).join(", ")}`,
          ]
        : undefined

    return { targets: allTargets, notices }
  }

  const workflowId = target.toLowerCase()
  if (!isValidSynkraWorkflowId(workflowId)) {
    return {
      targets: [],
      error: "Usage: /workflow import synkra <workflow-id|all>",
    }
  }

  const resolved = resolveSynkraWorkflowTarget(catalogDir, workflowId)
  if (!resolved) {
    return {
      targets: [],
      error: `Workflow '${workflowId}' not found in Synkra catalog '${catalogDir}'.`,
    }
  }

  return { targets: [resolved] }
}

function toStepId(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    if (normalized) {
      return normalized
    }
  }
  return fallback
}

function toArtifactRefs(value: unknown): Array<string | { id: string; optional?: boolean; from?: string; description?: string }> {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
  const refs: Array<string | { id: string; optional?: boolean; from?: string; description?: string }> = []

  for (const item of values) {
    if (typeof item === "string") {
      const optional = /\(if\s+exists\)|\(optional\)/i.test(item)
      const cleaned = item.replace(/\s*\((if\s+exists|optional)\)\s*/gi, "").trim()
      if (!cleaned) {
        continue
      }
      refs.push(optional ? { id: cleaned, optional: true } : cleaned)
      continue
    }

    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>
      const id = typeof obj.id === "string" && obj.id.trim() ? obj.id.trim() : undefined
      if (!id) {
        continue
      }

      refs.push({
        id,
        optional: typeof obj.optional === "boolean" ? obj.optional : undefined,
        from: typeof obj.from === "string" ? obj.from : undefined,
        description: typeof obj.description === "string" ? obj.description : undefined,
      })
    }
  }

  return refs
}

function toConditionArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  return items.length > 0 ? items : undefined
}

function toWorkflowValue(value: unknown): WorkflowValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => toWorkflowValue(item))
  }

  if (value && typeof value === "object") {
    const output: Record<string, WorkflowValue> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      output[key] = toWorkflowValue(entry)
    }
    return output
  }

  return String(value)
}

function toWorkflowCondition(value: unknown): WorkflowDefinition["sequence"][number]["skip_if"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }

  const condition = value as Record<string, unknown>
  const equals =
    condition.equals && typeof condition.equals === "object" && !Array.isArray(condition.equals)
      ? Object.fromEntries(
          Object.entries(condition.equals as Record<string, unknown>).map(([key, entry]) => [key, toWorkflowValue(entry)]),
        )
      : undefined

  const normalized = {
    all_of: toConditionArray(condition.all_of),
    any_of: toConditionArray(condition.any_of),
    not: toConditionArray(condition.not),
    exists: toConditionArray(condition.exists),
    equals,
  }

  return normalized.all_of || normalized.any_of || normalized.not || normalized.exists || normalized.equals
    ? normalized
    : undefined
}

function inferStepIntent(step: Record<string, unknown>): WorkflowDefinition["sequence"][number]["intent"] {
  const meta = typeof step.meta === "string" ? step.meta.toLowerCase() : ""
  if (meta === "repeat") {
    return "parallel"
  }
  if (meta === "end") {
    return "gate"
  }
  if (meta === "guidance") {
    return "research"
  }
  if (step.gate === true || step.validates !== undefined || step.on_verdict !== undefined) {
    return "gate"
  }
  if (step.elicit === true) {
    return "interview"
  }
  if (typeof step.agent === "string") {
    return "agent"
  }
  return "research"
}

function normalizeStep(step: Record<string, unknown>, index: number): WorkflowDefinition["sequence"][number] {
  const idSource = step.id ?? step.step ?? step.action ?? step.meta
  const stepId = toStepId(idSource, `step-${index + 1}`)
  const requires = toArtifactRefs(step.requires)
  const creates = toArtifactRefs(step.creates)
  const updates = toArtifactRefs(step.updates)

  return {
    id: stepId,
    intent: inferStepIntent(step),
    title:
      typeof step.name === "string"
        ? step.name
        : typeof step.phase_name === "string"
          ? step.phase_name
          : typeof step.action === "string"
            ? step.action
            : undefined,
    notes: typeof step.notes === "string" ? step.notes : undefined,
    requires: requires.length > 0 ? requires : undefined,
    creates: creates.length > 0 ? creates : undefined,
    updates: updates.length > 0 ? updates : undefined,
    optional: typeof step.optional === "boolean" ? step.optional : undefined,
    skip_if: toWorkflowCondition(step.skip_if),
    when: toWorkflowCondition(step.when),
    confirmation_required: typeof step.confirmation_required === "boolean" ? step.confirmation_required : undefined,
    metadata: {
      synkra: {
        source_step: toWorkflowValue(step),
      },
    },
  }
}

function adaptSynkraWorkflow(sourcePath: string): AdaptedSynkraWorkflow {
  const raw = readFileSync(sourcePath, "utf-8")
  const parsed = yaml.load(raw)
  const root = (parsed ?? {}) as Record<string, unknown>
  const workflowBlock = (root.workflow ?? {}) as Record<string, unknown>
  const sourceId =
    typeof workflowBlock.id === "string" && workflowBlock.id.trim()
      ? workflowBlock.id.trim()
      : basename(sourcePath).replace(/\.ya?ml$/i, "")
  const rawSequence = Array.isArray(workflowBlock.sequence)
    ? workflowBlock.sequence.filter((step): step is Record<string, unknown> => !!step && typeof step === "object")
    : []

  const definition: WorkflowDefinition = {
    schema_version: "1",
    workflow: {
      id: sourceId,
      name: typeof workflowBlock.name === "string" ? workflowBlock.name : sourceId,
      version: typeof workflowBlock.version === "string" ? workflowBlock.version : "1.0",
      type: typeof workflowBlock.type === "string" ? workflowBlock.type : "development",
      runner_agent: "kord",
      metadata: {
        synkra: {
          project_types: workflowBlock.project_types ? toWorkflowValue(workflowBlock.project_types) : null,
          phases: workflowBlock.phases ? toWorkflowValue(workflowBlock.phases) : null,
          flow_diagram: workflowBlock.flow_diagram ? toWorkflowValue(workflowBlock.flow_diagram) : null,
          decision_guidance: workflowBlock.decision_guidance
            ? toWorkflowValue(workflowBlock.decision_guidance)
            : null,
          handoff_prompts: workflowBlock.handoff_prompts ? toWorkflowValue(workflowBlock.handoff_prompts) : null,
        },
      },
    },
    runner_agent: "kord",
    metadata: {
      source: "synkra",
      source_path: sourcePath,
        synkra: {
          raw_document: toWorkflowValue(root),
          raw_workflow: toWorkflowValue(workflowBlock),
          description: workflowBlock.description ? toWorkflowValue(workflowBlock.description) : null,
          metadata: workflowBlock.metadata ? toWorkflowValue(workflowBlock.metadata) : null,
        triggers: workflowBlock.triggers ? toWorkflowValue(workflowBlock.triggers) : null,
        config: workflowBlock.config ? toWorkflowValue(workflowBlock.config) : null,
        pre_flight: workflowBlock.pre_flight ? toWorkflowValue(workflowBlock.pre_flight) : null,
        completion: workflowBlock.completion ? toWorkflowValue(workflowBlock.completion) : null,
        error_handling: workflowBlock.error_handling ? toWorkflowValue(workflowBlock.error_handling) : null,
        resume: workflowBlock.resume ? toWorkflowValue(workflowBlock.resume) : null,
        integration: workflowBlock.integration ? toWorkflowValue(workflowBlock.integration) : null,
      },
    },
    sequence: rawSequence.map((step, index) => normalizeStep(step, index)),
  }

  const compatibility = validateWorkflowDefinition(definition)
  const unsupportedConstructs: Array<{ construct: string; handling: string }> = []
  const handlingNotes: string[] = []

  const unsupportedRootFields = ["triggers", "config", "pre_flight", "completion", "error_handling", "resume", "integration"]
  for (const field of unsupportedRootFields) {
    if (workflowBlock[field] !== undefined) {
      unsupportedConstructs.push({
        construct: `workflow.${field}`,
        handling: "Preserved in metadata.synkra for compatibility reporting; runtime execution not implemented yet.",
      })
    }
  }

  rawSequence.forEach((step, index) => {
    const stepId = toStepId(step.id ?? step.step ?? step.action, `step-${index + 1}`)

    if (typeof step.condition === "string") {
      unsupportedConstructs.push({
        construct: `workflow.sequence[${index}].condition (step=${stepId})`,
        handling:
          "Preserved in metadata.synkra.source_step.condition; current validator/runtime does not execute string condition expressions.",
      })
    }

    const unsupportedStepFields = [
      "script",
      "template",
      "inputs",
      "outputs",
      "on_success",
      "on_failure",
      "on_verdict",
      "returns_to",
      "delegates_to",
      "repeats",
      "dynamic_phases",
    ]

    for (const field of unsupportedStepFields) {
      if (step[field] !== undefined) {
        unsupportedConstructs.push({
          construct: `workflow.sequence[${index}].${field} (step=${stepId})`,
          handling: "Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.",
        })
      }
    }
  })

  const substitutions: Array<{ from: string; to: string; reason: string }> = []
  substitutions.push({
    from: "(none)",
    to: "schema_version=1",
    reason: "Kord workflow schema requires explicit schema_version.",
  })
  substitutions.push({
    from: "workflow.metadata / step metadata with Synkra runtime semantics",
    to: "metadata.synkra preservation blocks",
    reason: "Keep non-executable runtime constructs visible without silently dropping them.",
  })
  substitutions.push({
    from: "Synkra step shape (phase/meta/step/action/script/template)",
    to: "Kord sequence step shape (id/intent/requires/creates/updates + metadata.synkra.source_step)",
    reason: "Map into current Kord runtime model while retaining original step richness.",
  })
  substitutions.push({
    from: "Synkra workflow root object",
    to: "metadata.synkra.raw_workflow",
    reason: "Preserve complete source workflow richness for future runtime parity and auditing.",
  })
  substitutions.push({
    from: "Synkra YAML source document",
    to: "metadata.synkra.raw_document",
    reason: "Preserve top-level source fidelity for auditing, including non-workflow wrapper fields.",
  })

  if (compatibility.issues.length > 0) {
    handlingNotes.push(
      `Compatibility warnings captured: ${compatibility.issues.map((issue) => issue.message).join(" | ")}`,
    )
  }
  handlingNotes.push("Importer preserves source notes and dependencies verbatim where schema-compatible.")
  handlingNotes.push("Unsupported executable constructs are reported and retained under metadata.synkra instead of dropped.")
  handlingNotes.push("Full source workflow object is retained under metadata.synkra.raw_workflow for traceability and auditing.")

  const unchangedFields = [
    "workflow.id",
    "workflow.name",
    "workflow.version",
    "workflow.type",
    "workflow.description (metadata.synkra.description)",
    "workflow.metadata (metadata.synkra.metadata)",
    "workflow.sequence[].notes",
    "workflow.sequence[].requires",
    "workflow.sequence[].creates",
    "workflow.sequence[].updates",
  ]

  if (workflowBlock.project_types !== undefined) {
    unchangedFields.push("workflow.project_types (metadata.synkra.project_types)")
  }
  if (workflowBlock.phases !== undefined) {
    unchangedFields.push("workflow.phases (metadata.synkra.phases)")
  }
  if (workflowBlock.flow_diagram !== undefined) {
    unchangedFields.push("workflow.flow_diagram (metadata.synkra.flow_diagram)")
  }
  if (workflowBlock.decision_guidance !== undefined) {
    unchangedFields.push("workflow.decision_guidance (metadata.synkra.decision_guidance)")
  }
  if (workflowBlock.handoff_prompts !== undefined) {
    unchangedFields.push("workflow.handoff_prompts (metadata.synkra.handoff_prompts)")
  }

  return {
    definition,
    unchangedFields,
    substitutions,
    unsupportedConstructs,
    handlingNotes,
  }
}

function writeAdaptationReport(
  directory: string,
  workflowId: string,
  sourcePath: string,
  adaptation: AdaptedSynkraWorkflow,
): string {
  const reportsDir = join(directory, "docs", "kord", "workflows")
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true })
  }

  const reportPath = join(reportsDir, `import-report-${workflowId}.md`)
  const unchanged = adaptation.unchangedFields.map((field) => `- ${field}`).join("\n")
  const substitutions = adaptation.substitutions
    .map((item) => `- \`${item.from}\` -> \`${item.to}\`: ${item.reason}`)
    .join("\n")
  const unsupported =
    adaptation.unsupportedConstructs.length > 0
      ? adaptation.unsupportedConstructs
          .map((item) => `- \`${item.construct}\`: ${item.handling}`)
          .join("\n")
      : "- None"
  const notes = adaptation.handlingNotes.map((note) => `- ${note}`).join("\n")

  const report = `# Synkra Import Adaptation Report: ${workflowId}

- Source: \`${sourcePath}\`
- Imported At: ${new Date().toISOString()}

## Unchanged Fields
${unchanged}

## Kord-Specific Substitutions
${substitutions}

## Unsupported Constructs
${unsupported}

## Handling Notes
${notes}
`

  writeFileSync(reportPath, report, "utf-8")
  return reportPath
}

function importSynkraWorkflows(directory: string, rawTarget: string): string {
  const parsedTargets = parseSynkraImportTargets(rawTarget)
  if (parsedTargets.error) {
    return parsedTargets.error
  }

  const targets = [...parsedTargets.targets].sort((a, b) => a.workflowId.localeCompare(b.workflowId))

  const workflowDir = join(directory, ".kord", "workflows")
  if (!existsSync(workflowDir)) {
    mkdirSync(workflowDir, { recursive: true })
  }

  const imported: Array<{ workflowId: string; workflowPath: string; reportPath: string }> = []

  for (const target of targets) {
    const adaptation = adaptSynkraWorkflow(target.filePath)
    const workflowId = adaptation.definition.workflow.id
    const workflowPath = join(workflowDir, `${workflowId}.yaml`)
    const rendered = yaml.dump(adaptation.definition, { noRefs: true, lineWidth: 120 })
    writeFileSync(workflowPath, rendered, "utf-8")

    const reportPath = writeAdaptationReport(directory, workflowId, target.filePath, adaptation)
    imported.push({ workflowId, workflowPath, reportPath })
  }

  const lines = imported
    .map((item) => `- ${item.workflowId}: workflow='${item.workflowPath}', report='${item.reportPath}'`)
    .join("\n")
  const notices = parsedTargets.notices?.map((notice) => `- NOTICE: ${notice}`).join("\n")
  return `Imported ${imported.length} Synkra workflow(s):\n${lines}${notices ? `\n${notices}` : ""}`
}
export function buildWorkflowAliasTemplate(workflowId: string, args: string): string {
  return `<workflow-context>
<workflow-id>${workflowId}</workflow-id>
</workflow-context>

<user-request>
${args}
</user-request>`
}

export function executeWorkflowCommand(input: WorkflowCommandArgs): string {
  if (input.aliasWorkflowId) {
    return executeWorkflowCommand({
      ...input,
      rawArgs: normalizeAliasWorkflowArgs(input.rawArgs, input.aliasWorkflowId),
      aliasWorkflowId: undefined,
    })
  }

  const registry = loadWorkflowRegistry(input.directory)
  const parsed = parseWorkflowArgs(input.rawArgs)

  if (parsed.action === "list") {
    return formatWorkflowList(registry)
  }

  if (parsed.action === "create") {
    if (!parsed.target) {
      return "Usage: /workflow create <workflow-id>"
    }
    return scaffoldWorkflow(input.directory, parsed.target)
  }

  if (parsed.action === "import" && parsed.target === "synkra") {
    return importSynkraWorkflows(input.directory, parsed.rest)
  }

  if (parsed.action === "status") {
    if (parsed.target) {
      const loadedStatusWorkflow = registry.get(parsed.target)
      if (!loadedStatusWorkflow) {
        return `Workflow '${parsed.target}' not found. Use '/workflow list'.`
      }

      const statusRun = getLatestWorkflowRun(input.directory, loadedStatusWorkflow.definition.workflow.id)
      if (!statusRun) {
        return `No run found for workflow '${parsed.target}'.`
      }

      return `Workflow: ${parsed.target}\nRun: ${statusRun.run_id}\nStatus: ${statusRun.status}\nCurrent step: ${statusRun.current_step_id ?? "none"}`
    }

    const active = readActiveWorkflowRun(input.directory)
    if (!active) {
      return "No active workflow run."
    }
    return `Active workflow: ${active.workflow_id}\nRun: ${active.run_id}\nStatus: ${active.status}\nCurrent step: ${active.current_step_id ?? "none"}`
  }

  const workflowId = parsed.target ? parsed.target : parsed.action
  const loaded = registry.get(workflowId)
  if (!loaded) {
    return `Workflow '${workflowId}' not found. Use '/workflow list'.`
  }
  const canonicalWorkflowId = loaded.definition.workflow.id

  if (parsed.action === "validate") {
    return formatValidation(loaded.definition, input.directory)
  }

  if (parsed.action === "pause") {
    const run = getLatestWorkflowRun(input.directory, canonicalWorkflowId)
    if (!run) {
      return `No run found for workflow '${workflowId}'.`
    }
    const paused = setRunPaused(run)
    writeWorkflowRunState(input.directory, paused)
    return `Workflow '${workflowId}' paused.`
  }

  if (parsed.action === "abort") {
    const run = getLatestWorkflowRun(input.directory, canonicalWorkflowId)
    if (!run) {
      return `No run found for workflow '${workflowId}'.`
    }
    const aborted = setRunAborted(run)
    writeWorkflowRunState(input.directory, aborted)
    return `Workflow '${workflowId}' aborted.`
  }

  if (parsed.action === "continue") {
    const run = getLatestWorkflowRun(input.directory, canonicalWorkflowId)
    if (!run) {
      return `No run found for workflow '${workflowId}'.`
    }
    const progressed = continueRun({
      ...run,
      session_ids: run.session_ids.includes(input.sessionID)
        ? run.session_ids
        : [...run.session_ids, input.sessionID],
    })
    writeWorkflowRunState(input.directory, progressed)
    return `Workflow '${workflowId}' continued. Current step: ${progressed.current_step_id ?? "none"}.`
  }

  const validation = validateWorkflowDefinition(loaded.definition)
  if (!validation.valid) {
    return formatValidation(loaded.definition, input.directory)
  }

  const run = createWorkflowRunState(canonicalWorkflowId, input.sessionID, loaded.definition.sequence)
  const runPath = writeWorkflowRunState(input.directory, run)
  return `Workflow '${workflowId}' started.\nRun: ${run.run_id}\nState: ${runPath}\nCurrent step: ${run.current_step_id ?? "none"}`
}
