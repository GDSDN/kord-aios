import { readFileSync, existsSync } from "node:fs"
import { isAbsolute, join, resolve } from "node:path"
import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import { z } from "zod"
import yaml from "js-yaml"
import { squadSchema } from "../../features/squad/schema"
import { WorkflowDefinitionSchema } from "../../features/workflow-engine/schema"
import { validateWorkflowDefinition } from "../../features/workflow-engine/validator"
import { createBuiltinSkills } from "../../features/builtin-skills/skills"
import { discoverSkills } from "../../features/opencode-skill-loader"
import { SQUAD_VALIDATE_DESCRIPTION } from "./constants"
import type { SquadValidateArgs, SquadValidationResult } from "./types"
import { findSquadManifestPath } from "../squad-load/tools"

const KEBAB_CASE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

export function validateSquadManifest(content: string, squadDir: string): SquadValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Parse YAML
  let raw: unknown
  try {
    raw = yaml.load(content)
  } catch (err) {
    return { valid: false, errors: [`YAML parse error: ${err instanceof Error ? err.message : String(err)}`], warnings }
  }

  // 2. Validate against Zod schema
  const result = squadSchema.safeParse(raw)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`Schema: ${issue.path.join(".")}: ${issue.message}`)
    }
    return { valid: false, errors, warnings }
  }

  const manifest = result.data

  // 2.1. categories are deprecated and invalid for squad semantics
  const rawManifest = raw as Record<string, unknown>
  if ("categories" in rawManifest) {
    errors.push("Schema: categories: categories are not supported for squads; squads are teams coordinated by chiefs")
  }

  // 3. Validate agent names are kebab-case
  for (const agentName of Object.keys(manifest.agents)) {
    if (!KEBAB_CASE_RE.test(agentName)) {
      errors.push(`Agent name "${agentName}" is not kebab-case`)
    }
  }

  // 4. Validate prompt_file references exist
  for (const [agentName, agentDef] of Object.entries(manifest.agents)) {
    if (agentDef.prompt_file) {
      const promptPath = join(squadDir, agentDef.prompt_file)
      if (!existsSync(promptPath)) {
        errors.push(`Agent "${agentName}": prompt_file "${agentDef.prompt_file}" not found at ${promptPath}`)
      }
    }
  }

  // 4.1. Validate package component file references exist
  const componentEntries = [
    ["tasks", manifest.components?.tasks],
    ["workflows", manifest.components?.workflows],
    ["templates", manifest.components?.templates],
    ["checklists", manifest.components?.checklists],
    ["scripts", manifest.components?.scripts],
    ["data", manifest.components?.data],
  ] as const

  for (const [componentType, entries] of componentEntries) {
    for (const entry of entries ?? []) {
      const entryPath = join(squadDir, entry)
      if (!existsSync(entryPath)) {
        errors.push(`Component "${componentType}": "${entry}" not found at ${entryPath}`)
      }
    }
  }

  // 4.2. Validate referenced workflows with workflow-engine schema and rules
  for (const workflowRef of manifest.components?.workflows ?? []) {
    const workflowPath = join(squadDir, workflowRef)
    if (!existsSync(workflowPath)) continue

    try {
      const workflowContent = readFileSync(workflowPath, "utf-8")
      const workflowRaw = yaml.load(workflowContent)
      const workflowParse = WorkflowDefinitionSchema.safeParse(workflowRaw)
      if (!workflowParse.success) {
        for (const issue of workflowParse.error.issues) {
          errors.push(`Workflow "${workflowRef}": ${issue.path.join(".")}: ${issue.message}`)
        }
        continue
      }

      const workflowValidation = validateWorkflowDefinition(workflowParse.data)
      for (const issue of workflowValidation.issues) {
        const prefix = `Workflow "${workflowRef}": ${issue.message}`
        if (issue.level === "error") {
          errors.push(prefix)
        } else {
          warnings.push(prefix)
        }
      }

      if (!workflowParse.data.workflow.id.startsWith(`${manifest.name}-`)) {
        warnings.push(`Workflow "${workflowRef}" id "${workflowParse.data.workflow.id}" should be prefixed with "${manifest.name}-" to avoid cross-squad collisions`)
      }
    } catch (err) {
      errors.push(`Workflow "${workflowRef}": failed to read/parse (${err instanceof Error ? err.message : String(err)})`)
    }
  }

  // 5. Validate default_executor references a defined agent
  if (manifest.default_executor) {
    if (!manifest.agents[manifest.default_executor]) {
      errors.push(`default_executor "${manifest.default_executor}" is not a defined agent`)
    }
  }

  // 6. Validate default_reviewer references a defined agent
  if (manifest.default_reviewer) {
    if (!manifest.agents[manifest.default_reviewer]) {
      errors.push(`default_reviewer "${manifest.default_reviewer}" is not a defined agent`)
    }
  }

  // 6.1. Validate orchestration metadata coherence
  if (manifest.orchestration?.entry_workflow) {
    const hasDeclaredWorkflows = (manifest.components?.workflows?.length ?? 0) > 0
    if (!hasDeclaredWorkflows) {
      warnings.push("orchestration.entry_workflow is set but components.workflows is empty")
    } else {
      const declared = new Set(manifest.components?.workflows ?? [])
      const hasEntryRef = Array.from(declared).some((workflowRef) => {
        if (!existsSync(join(squadDir, workflowRef))) return false
        try {
          const workflowContent = readFileSync(join(squadDir, workflowRef), "utf-8")
          const workflowRaw = yaml.load(workflowContent)
          const parsedWorkflow = WorkflowDefinitionSchema.safeParse(workflowRaw)
          return parsedWorkflow.success && parsedWorkflow.data.workflow.id === manifest.orchestration?.entry_workflow
        } catch {
          return false
        }
      })

      if (!hasEntryRef) {
        warnings.push(`orchestration.entry_workflow "${manifest.orchestration.entry_workflow}" was not found among components.workflows IDs`)
      }
    }
  }

  // 7. Warnings for best practices
  if (!manifest.default_executor) {
    warnings.push("No default_executor defined — delegation may require explicit agent selection")
  }

  if (Object.keys(manifest.agents).length === 0) {
    errors.push("Squad has no agents defined")
  }

  const chiefs = Object.entries(manifest.agents).filter(([, a]) => a.is_chief)
  if (chiefs.length === 0 && Object.keys(manifest.agents).length > 1) {
    warnings.push("No chief agent defined — consider setting is_chief: true on one agent")
  }

  if (chiefs.length > 1) {
    warnings.push(`Multiple chief agents defined: ${chiefs.map(([n]) => n).join(", ")}`)
  }

  return { valid: errors.length === 0, errors, warnings }
}

function collectReferencedSkills(manifest: z.infer<typeof squadSchema>): string[] {
  const fromAgents = Object.values(manifest.agents).flatMap((agent) => agent.skills ?? [])
  const fromDependencies = manifest.dependencies?.skills ?? []
  return [...new Set([...fromAgents, ...fromDependencies])]
}

async function validateSkillReferences(manifestContent: string, squadDir: string): Promise<{ errors: string[], warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []

  let raw: unknown
  try {
    raw = yaml.load(manifestContent)
  } catch {
    return { errors, warnings }
  }

  const parsed = squadSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors, warnings }
  }

  const manifest = parsed.data
  const referencedSkills = collectReferencedSkills(manifest)
  if (referencedSkills.length === 0) {
    return { errors, warnings }
  }

  const builtinSkillNames = new Set(createBuiltinSkills().map((skill) => skill.name))
  const discoveredSkillNames = new Set((await discoverSkills({ includeClaudeCodePaths: true })).map((skill) => skill.name))
  const available = new Set([...builtinSkillNames, ...discoveredSkillNames])

  for (const skillName of referencedSkills) {
    if (!available.has(skillName)) {
      errors.push(
        `Skill \"${skillName}\" not found (searched: builtin skills, .opencode/skills, {OpenCodeConfigDir}/skills, .claude/skills, ~/.claude/skills). squadDir=${squadDir}`,
      )
    }
  }

  return { errors, warnings }
}

export function createSquadValidateTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: SQUAD_VALIDATE_DESCRIPTION,
    args: {
      squad_name: tool.schema.string().optional().describe("Squad name to validate (searches standard paths)"),
      squad_path: tool.schema.string().optional().describe("Explicit path to SQUAD.yaml"),
    },
    execute: async (args: SquadValidateArgs) => {
      if (!args.squad_name && !args.squad_path) {
        return "Error: Provide squad_name or squad_path."
      }

      const resolvedPath = args.squad_path
        ? (isAbsolute(args.squad_path) ? args.squad_path : resolve(ctx.directory, args.squad_path))
        : findSquadManifestPath(ctx.directory, args.squad_name!)

      if (!resolvedPath || !existsSync(resolvedPath)) {
        return JSON.stringify({ valid: false, errors: ["Squad manifest not found"], warnings: [] })
      }

      try {
        const content = readFileSync(resolvedPath, "utf-8")
        const squadDir = resolve(resolvedPath, "..")
        const base = validateSquadManifest(content, squadDir)
        const skills = await validateSkillReferences(content, squadDir)
        const merged = {
          valid: base.valid && skills.errors.length === 0,
          errors: [...base.errors, ...skills.errors],
          warnings: [...base.warnings, ...skills.warnings],
        }
        return JSON.stringify({ ...merged, path: resolvedPath })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return JSON.stringify({ valid: false, errors: [`Failed to read manifest: ${message}`], warnings: [] })
      }
    },
  })
}
