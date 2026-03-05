import { resolve, join } from "node:path"
import { existsSync, readFileSync } from "node:fs"
import pc from "picocolors"
import { parseJsonc } from "../../shared"
import { KORD_DIR } from "../project-layout"

export interface StatusOptions {
  directory?: string
  json?: boolean
}

export interface ProjectStatus {
  projectMode: string | null
  projectStage: string | null
  rulesConfigured: boolean
  kordInstalled: boolean
  opencodeConfigPath: string | null
}

/**
 * Extract Project Mode and Project Stage from project-mode.md
 */
function parseProjectModeFile(projectModePath: string): { mode: string | null; stage: string | null } {
  try {
    const content = readFileSync(projectModePath, "utf-8")

    const modeMatch = content.match(/Project Mode:\s*(\S+)/i)
    const stageMatch = content.match(/Project Stage:\s*(\S+)/i)

    return {
      mode: modeMatch ? modeMatch[1] : null,
      stage: stageMatch ? stageMatch[1] : null,
    }
  } catch {
    return { mode: null, stage: null }
  }
}

/**
 * Check if opencode config has .kord/rules/** in instructions
 */
function checkRulesInstruction(directory: string): { configured: boolean; configPath: string | null } {
  const opencodeDir = resolve(directory, ".opencode")

  // Try .jsonc first, then .json
  const jsoncPath = join(opencodeDir, "opencode.jsonc")
  const jsonPath = join(opencodeDir, "opencode.json")

  let configPath: string | null = null
  let content: string | null = null

  if (existsSync(jsoncPath)) {
    configPath = jsoncPath
    content = readFileSync(jsoncPath, "utf-8")
  } else if (existsSync(jsonPath)) {
    configPath = jsonPath
    content = readFileSync(jsonPath, "utf-8")
  }

  if (!content || !configPath) {
    return { configured: false, configPath: null }
  }

  try {
    const config = parseJsonc<{ instructions?: string[] }>(content)
    const instructions = config.instructions ?? []

    const hasRules = instructions.some((pattern) =>
      pattern.includes(".kord/rules")
    )

    return { configured: hasRules, configPath }
  } catch {
    return { configured: false, configPath }
  }
}

/**
 * Check if Kord is installed (plugin is configured)
 */
function checkKordInstalled(directory: string): boolean {
  const kordConfigPath = resolve(directory, ".opencode", "kord-aios.json")
  const kordConfigJsonPath = resolve(directory, ".opencode", "kord-aios.jsonc")

  return existsSync(kordConfigPath) || existsSync(kordConfigJsonPath)
}

/**
 * Format status output for human-readable display
 */
function formatStatusOutput(status: ProjectStatus): string {
  const lines: string[] = []

  lines.push(pc.bold(pc.white("Kord AIOS Project Status")))
  lines.push("")
  lines.push(pc.dim("─".repeat(40)))
  lines.push("")

  // Project Mode & Stage
  if (status.projectMode) {
    lines.push(`${pc.cyan("Project Mode:")} ${pc.white(status.projectMode)}`)
    if (status.projectStage) {
      lines.push(`${pc.cyan("Project Stage:")} ${pc.white(status.projectStage)}`)
    }
  } else {
    lines.push(`${pc.yellow("⚠")} ${pc.dim("No project-mode.md found - run 'kord-aios init' first")}`)
  }

  lines.push("")

  // Configuration status
  lines.push(pc.bold(pc.white("Configuration")))
  lines.push("")

  // Kord installation
  const kordStatus = status.kordInstalled
    ? pc.green("✓ Configured")
    : pc.yellow("⚠ Not configured")
  lines.push(`  ${pc.cyan("Kord Plugin:")} ${kordStatus}`)

  // Rules instruction
  const rulesStatus = status.rulesConfigured
    ? pc.green("✓ Enabled")
    : pc.yellow("⚠ Missing")
  lines.push(`  ${pc.cyan("Rules Injection:")} ${rulesStatus}`)

  if (status.opencodeConfigPath) {
    lines.push(`  ${pc.dim("Config:")} ${pc.dim(status.opencodeConfigPath)}`)
  }

  lines.push("")
  lines.push(pc.dim("─".repeat(40)))

  return lines.join("\n")
}

/**
 * Format status output as JSON
 */
function formatJsonOutput(status: ProjectStatus): string {
  return JSON.stringify(status, null, 2)
}

/**
 * Get Kord AIOS project status.
 *
 * Reads:
 * - .kord/rules/project-mode.md for Project Mode and Project Stage
 * - .opencode/opencode.jsonc (or .json) for rules configuration
 * - .opencode/kord-aios.json (or .jsonc) for plugin installation
 *
 * Outputs human-readable or JSON format based on options.
 */
export async function getStatus(options: StatusOptions = {}): Promise<number> {
  const directory = options.directory ?? process.cwd()

  // Check for project-mode.md
  const projectModePath = resolve(directory, KORD_DIR, "rules", "project-mode.md")
  const { mode, stage } = existsSync(projectModePath)
    ? parseProjectModeFile(projectModePath)
    : { mode: null, stage: null }

  // Check opencode config for rules instruction
  const { configured: rulesConfigured, configPath: opencodeConfigPath } =
    checkRulesInstruction(directory)

  // Check if Kord is installed
  const kordInstalled = checkKordInstalled(directory)

  const status: ProjectStatus = {
    projectMode: mode,
    projectStage: stage,
    rulesConfigured,
    kordInstalled,
    opencodeConfigPath,
  }

  if (options.json) {
    console.log(formatJsonOutput(status))
  } else {
    console.log(formatStatusOutput(status))
  }

  return 0
}
