import { readFileSync, existsSync } from "node:fs"
import { isAbsolute, join, resolve } from "node:path"
import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import yaml from "js-yaml"
import { squadSchema } from "../../features/squad/schema"
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
        const result = validateSquadManifest(content, squadDir)
        return JSON.stringify({ ...result, path: resolvedPath })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return JSON.stringify({ valid: false, errors: [`Failed to read manifest: ${message}`], warnings: [] })
      }
    },
  })
}
