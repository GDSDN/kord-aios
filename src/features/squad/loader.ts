import { promises as fs, readdirSync, readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import jsYaml from "js-yaml"
import { squadSchema, type SquadManifest } from "./schema"

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const BUILTIN_SQUADS_DIR = join(MODULE_DIR, "..", "builtin-squads")

export interface LoadedSquad {
  manifest: SquadManifest
  source: "builtin" | "user"
  basePath: string
  /** Resolved prompt_file contents keyed by agent name */
  resolvedPrompts: Record<string, string>
}

export interface SquadLoadError {
  path: string
  error: string
}

export interface SquadLoadResult {
  squads: LoadedSquad[]
  errors: SquadLoadError[]
}

function parseSquadYaml(content: string, filePath: string): SquadManifest | SquadLoadError {
  try {
    const raw = jsYaml.load(content)
    const result = squadSchema.safeParse(raw)
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
      return { path: filePath, error: `Validation failed: ${issues}` }
    }
    return result.data
  } catch (err) {
    return { path: filePath, error: `YAML parse error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

function isSquadLoadError(result: SquadManifest | SquadLoadError): result is SquadLoadError {
  return "error" in result
}

/**
 * Discovers and loads squads from a directory.
 * Expects: {dir}/{squad-name}/SQUAD.yaml
 */
function loadSquadsFromDir(dir: string, source: "builtin" | "user"): SquadLoadResult {
  const squads: LoadedSquad[] = []
  const errors: SquadLoadError[] = []

  if (!existsSync(dir)) return { squads, errors }

  try {
    const entries = readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue

      const squadDir = join(dir, entry.name)
      const yamlPath = join(squadDir, "SQUAD.yaml")

      if (!existsSync(yamlPath)) continue

      try {
        const content = readFileSync(yamlPath, "utf-8")
        const result = parseSquadYaml(content, yamlPath)

        if (isSquadLoadError(result)) {
          errors.push(result)
        } else {
          const resolvedPrompts = resolvePromptFiles(result, squadDir)
          squads.push({ manifest: result, source, basePath: squadDir, resolvedPrompts })
        }
      } catch (err) {
        errors.push({
          path: yamlPath,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  } catch {
    // Directory unreadable — not an error, just no squads
  }

  return { squads, errors }
}

/**
 * Resolves prompt_file references for all agents in a squad manifest.
 * Reads the .md file content from {squadDir}/{prompt_file}.
 * Returns a map of agent name → resolved prompt content.
 */
function resolvePromptFiles(manifest: SquadManifest, squadDir: string): Record<string, string> {
  const resolved: Record<string, string> = {}

  for (const [agentName, agentDef] of Object.entries(manifest.agents)) {
    if (!agentDef.prompt_file) continue

    const promptPath = join(squadDir, agentDef.prompt_file)
    try {
      if (existsSync(promptPath)) {
        resolved[agentName] = readFileSync(promptPath, "utf-8")
      }
    } catch {
      // File unreadable — skip, factory will fall back to inline prompt or default
    }
  }

  return resolved
}

/** User squad search paths in priority order */
const USER_SQUAD_SEARCH_PATHS = [
  [".opencode", "squads"],
  [".kord", "squads"],
  ["docs", "kord", "squads"],
] as const

/**
 * Loads all squads from built-in and user directories.
 * Built-in squads: src/features/builtin-squads/
 * User squads (in order): .opencode/squads/ → .kord/squads/ → docs/kord/squads/
 */
export function loadAllSquads(projectDir?: string): SquadLoadResult {
  const allSquads: LoadedSquad[] = []
  const allErrors: SquadLoadError[] = []
  const seenNames = new Set<string>()

  // 1. Built-in squads
  const builtin = loadSquadsFromDir(BUILTIN_SQUADS_DIR, "builtin")
  for (const squad of builtin.squads) {
    seenNames.add(squad.manifest.name)
    allSquads.push(squad)
  }
  allErrors.push(...builtin.errors)

  // 2. User squads from multiple search paths
  if (projectDir) {
    for (const pathParts of USER_SQUAD_SEARCH_PATHS) {
      const userDir = join(projectDir, ...pathParts)
      const user = loadSquadsFromDir(userDir, "user")
      for (const squad of user.squads) {
        if (!seenNames.has(squad.manifest.name)) {
          seenNames.add(squad.manifest.name)
          allSquads.push(squad)
        }
      }
      allErrors.push(...user.errors)
    }
  }

  return { squads: allSquads, errors: allErrors }
}

/**
 * Async version for hot-reloading scenarios.
 */
export async function loadAllSquadsAsync(projectDir?: string): Promise<SquadLoadResult> {
  return loadAllSquads(projectDir)
}

export { loadSquadsFromDir }
