import { createKordDirectory } from "../kord-directory"
import { scaffoldProject } from "../scaffolder"
import { writeProjectKordAiosConfig } from "../config-manager"
import { extract } from "../extract"
import { printBanner } from "../banner"
import { bold, cyan } from "picocolors"
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { join, resolve, dirname } from "node:path"
import { execSync } from "node:child_process"
import { KORD_DIR } from "../project-layout"
import * as p from "@clack/prompts"
import { parseJsonc } from "../../shared"
import { listKordAiosSkillFilesSync } from "../../features/builtin-skills/kord-aios-loader"

// Path to the builtin code squad
const BUILTIN_SQUAD_PATH = join(import.meta.dir, "..", "..", "features", "builtin-squads", "code")
const BUILTIN_SQUAD_FILE = "SQUAD.yaml"
const BUILTIN_AGENTS_PATH = join(import.meta.dir, "..", "..", "features", "builtin-agents")
const APPROVED_T2_AGENT_FILES = [
  "pm.md",
  "po.md",
  "sm.md",
  "qa.md",
  "devops.md",
  "data-engineer.md",
  "ux-design-expert.md",
  "squad-creator.md",
  "analyst.md",
  "plan-analyzer.md",
  "plan-reviewer.md",
] as const

export interface InitOptions {
  directory?: string
  force?: boolean
  skipExtract?: boolean
  projectMode?: "new" | "existing"
  bootstrap?: boolean
}

export interface InitResult {
  success: boolean
  kordDirectory: {
    success: boolean
    created: boolean
  }
  scaffold: {
    created: string[]
    skipped: string[]
    errors: string[]
  }
  migration: {
    migrated: boolean
    source?: string
    target?: string
    error?: string
  }
  squadExport: {
    success: boolean
    exported: boolean
    error?: string
  }
  agentExport: {
    success: boolean
    exported: string[]
    skipped: string[]
    error?: string
  }
  config: {
    success: boolean
    configPath?: string
    error?: string
  }
  opencodeConfig: {
    success: boolean
    configPath?: string
    error?: string
  }
  bootstrap: {
    success: boolean
    gitInitialized: boolean
    packageJsonCreated: boolean
    warning?: string
    error?: string
  }
  extract: {
    success: boolean
    exitCode: number
  }
  exitCode: number
}

/**
 * Initialize Kord AIOS in a project directory.
 *
 * Creates:
 * - .kord/ directory structure
 * - docs/kord/ subdirectories (plans, drafts, notepads)
 * - Template files (story.md, adr.md, kord-rules.md)
 * - Project config (.opencode/kord-aios.json)
 * - OpenCode config (.opencode/opencode.jsonc) with plugin and instructions
 * - Exports code squad to .kord/squads/code/
 * - Exports approved T2 agents and methodology skills to .opencode/ (unless sync is skipped)
 * - Syncs builtin squads to .opencode/squads/ (unless sync is skipped)
 * - Optionally bootstrap (git init + package.json) if --bootstrap is set and mode is "new"
 *
 * Does NOT touch global config.
 */
export async function init(options: InitOptions): Promise<InitResult> {
  const cwd = options.directory ?? process.cwd()
  const force = options.force ?? false
  const skipExtract = options.skipExtract ?? false
  const bootstrap = options.bootstrap ?? false

  // Step 0: Detect or prompt for project mode (for future use, currently just detection)
  // This can be used to customize behavior based on project type
  let projectMode: "new" | "existing"
  
  if (options.projectMode) {
    // CLI flag takes precedence
    projectMode = options.projectMode
  } else {
    // Use the detection/prompt function
    projectMode = await detectOrPromptProjectMode(cwd)
  }

  // Note: projectMode detection happens inline above. For TTY prompt in non-TTY mode,
  // the user should use --project-mode flag

  // Print banner with project context
  printBanner({ mode: projectMode })

  // Step 1: Create .kord/ directory
  const kordResult = createKordDirectory(cwd)

  // Step 2: Scaffold project structure (pass projectMode for project-type instruction export)
  const scaffoldResult = scaffoldProject({
    directory: cwd,
    force,
    projectMode,
  })

  // Step 2.5: Migrate legacy kord-rules.md to .kord/instructions/ if needed
  const migrationResult = migrateLegacyRulesFile(cwd)

  // Step 3: Export code squad to .kord/squads/code/
  const squadExportResult = exportCodeSquad(cwd, force)

  // Step 4: Write project config (copies global config if exists)
  const configResult = writeProjectKordAiosConfig(cwd)

  // Step 5: Configure opencode.jsonc with plugin and instructions
  const opencodeConfigResult = await configureOpenCodeConfig(cwd, force)

  // Step 6: Bootstrap if requested (git init + package.json for new projects)
  const bootstrapResult = handleBootstrap(cwd, projectMode, bootstrap)

  // Step 7: Sync squads and export curated agents/skills to .opencode/
  let extractExitCode = 0
  let agentExportResult: InitResult["agentExport"] = {
    success: true,
    exported: [],
    skipped: [],
  }
  if (!skipExtract) {
    const extractResult = await extract({
      directory: cwd,
      force,
      squadsOnly: true,
    })

    if (extractResult !== 0) {
      extractExitCode = extractResult
    } else {
      agentExportResult = exportT2Agents(cwd, force)
      const skillExport = exportMethodologySkills(cwd, force)
      extractExitCode = agentExportResult.success && skillExport.success ? 0 : 1
    }
  }

  // Print results
  printInitResults({
    kordCreated: kordResult.created,
    scaffold: scaffoldResult,
    migration: migrationResult,
    squadExport: squadExportResult,
    config: configResult,
    opencodeConfig: opencodeConfigResult,
    extractSkipped: skipExtract,
    bootstrap: bootstrapResult,
  })

  const success = kordResult.success && squadExportResult.success && configResult.success && opencodeConfigResult.success && bootstrapResult.success && extractExitCode === 0

  return {
    success,
    kordDirectory: {
      success: kordResult.success,
      created: kordResult.created,
    },
    scaffold: scaffoldResult,
    migration: migrationResult,
    squadExport: squadExportResult,
    agentExport: agentExportResult,
    config: {
      success: configResult.success,
      configPath: configResult.configPath,
      error: configResult.error,
    },
    opencodeConfig: {
      success: opencodeConfigResult.success,
      configPath: opencodeConfigResult.configPath,
      error: opencodeConfigResult.error,
    },
    bootstrap: bootstrapResult,
    extract: {
      success: extractExitCode === 0,
      exitCode: extractExitCode,
    },
    exitCode: success ? 0 : 1,
  }
}

function exportT2Agents(projectDir: string, force: boolean): {
  success: boolean
  exported: string[]
  skipped: string[]
  error?: string
} {
  try {
    const agentsRoot = join(projectDir, ".opencode", "agents")
    const exported: string[] = []
    const skipped: string[] = []

    for (const agentFile of APPROVED_T2_AGENT_FILES) {
      const sourcePath = join(BUILTIN_AGENTS_PATH, agentFile)
      if (!existsSync(sourcePath)) {
        return {
          success: false,
          exported,
          skipped,
          error: `Approved T2 agent source not found: ${sourcePath}`,
        }
      }

      const destinationPath = join(agentsRoot, agentFile)
      if (!force && existsSync(destinationPath)) {
        skipped.push(agentFile)
        continue
      }

      const destinationDir = dirname(destinationPath)
      if (!existsSync(destinationDir)) {
        mkdirSync(destinationDir, { recursive: true })
      }

      const content = readFileSync(sourcePath, "utf-8")
      writeFileSync(destinationPath, content, "utf-8")
      exported.push(agentFile)
    }

    return { success: true, exported, skipped }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      exported: [],
      skipped: [],
      error: `T2 agent export failed: ${message}`,
    }
  }
}

function exportMethodologySkills(projectDir: string, force: boolean): { success: boolean; error?: string } {
  try {
    const skillFiles = listKordAiosSkillFilesSync()
    const skillsRoot = join(projectDir, ".opencode", "skills")

    for (const skillFile of skillFiles) {
      const destinationPath = join(skillsRoot, skillFile.relativePath)
      if (!force && existsSync(destinationPath)) {
        continue
      }

      const destinationDir = dirname(destinationPath)
      if (!existsSync(destinationDir)) {
        mkdirSync(destinationDir, { recursive: true })
      }

      const content = readFileSync(skillFile.sourcePath, "utf-8")
      writeFileSync(destinationPath, content, "utf-8")
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: `Methodology skill export failed: ${message}` }
  }
}

/**
 * Detect project mode (new vs existing) based on filesystem.
 * If detection is ambiguous and TTY is available, prompts user.
 */

/**
 * Migrate legacy kord-rules.md from project root to .kord/instructions/kord-rules.md.
 * This ensures backward compatibility for projects that were initialized before
 * the .kord/instructions/ directory was introduced.
 *
 * Returns: { migrated: boolean, source?: string, target?: string }
 */
function migrateLegacyRulesFile(projectDir: string): { migrated: boolean; source?: string; target?: string; error?: string } {
  const legacyPath = join(projectDir, "kord-rules.md")
  const newPath = join(projectDir, KORD_DIR, "instructions", "kord-rules.md")

  // Check if legacy file exists and new location doesn't
  const hasLegacy = existsSync(legacyPath)
  const hasNew = existsSync(newPath)

  // Only migrate if legacy exists AND new doesn't exist
  if (hasLegacy && !hasNew) {
    try {
      // Ensure the target directory exists
      const targetDir = join(projectDir, KORD_DIR, "instructions")
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }

      // Read legacy file content
      const content = readFileSync(legacyPath, "utf-8")

      // Write to new location
      writeFileSync(newPath, content, "utf-8")

      // Optionally remove the legacy file (commented out for safety)
      // rmSync(legacyPath)

      return { migrated: true, source: legacyPath, target: newPath }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { migrated: false, error: `Migration failed: ${message}` }
    }
  }

  return { migrated: false }
}

async function detectOrPromptProjectMode(cwd: string): Promise<"new" | "existing"> {
  // Detect based on existing project markers
  const hasPackageJson = existsSync(join(cwd, "package.json"))
  const hasGit = existsSync(join(cwd, ".git"))
  const hasSrc = existsSync(join(cwd, "src"))
  
  // If any of these exist, it's an existing project
  if (hasPackageJson || hasGit || hasSrc) {
    return "existing"
  }

  // If no markers found, check if we can prompt
  // Default to "new" for empty directories
  if (!process.stdout.isTTY) {
    return "new"
  }

  // TTY available - prompt user for ambiguous cases
  const selection = await p.select({
    message: "Is this a new project from scratch or an existing project?",
    options: [
      { value: "new" as const, label: "New project", hint: "Starting from scratch" },
      { value: "existing" as const, label: "Existing project", hint: "Adding Kord to existing codebase" },
    ],
    initialValue: "new",
  })

  if (p.isCancel(selection)) {
    p.cancel("Init cancelled.")
    process.exit(1)
  }

  return selection as "new" | "existing"
}

/**
 * Handle bootstrap operation for new projects.
 * If mode is "new" and bootstrap is true: run git init and create package.json if missing.
 * If mode is "existing" and bootstrap is true: warn and skip bootstrap.
 */
function handleBootstrap(
  projectDir: string,
  projectMode: "new" | "existing",
  bootstrap: boolean
): {
  success: boolean
  gitInitialized: boolean
  packageJsonCreated: boolean
  warning?: string
  error?: string
} {
  // No bootstrap requested - skip silently
  if (!bootstrap) {
    return {
      success: true,
      gitInitialized: false,
      packageJsonCreated: false,
    }
  }

  // Bootstrap requested but mode is existing - warn and skip
  if (projectMode === "existing") {
    return {
      success: true,
      gitInitialized: false,
      packageJsonCreated: false,
      warning: "--bootstrap ignored: project mode is 'existing'. Bootstrap only applies to 'new' projects.",
    }
  }

  // Bootstrap for new projects
  let gitInitialized = false
  let packageJsonCreated = false
  let error: string | undefined

  // 1. Run git init if .git doesn't exist
  const gitDir = join(projectDir, ".git")
  if (!existsSync(gitDir)) {
    try {
      execSync("git init", { cwd: projectDir, stdio: "ignore" })
      gitInitialized = true
    } catch (err) {
      error = `Failed to run git init: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  // 2. Create minimal package.json if it doesn't exist
  const packageJsonPath = join(projectDir, "package.json")
  if (!existsSync(packageJsonPath)) {
    try {
      // Derive name from directory
      const projectName = require("node:path").basename(projectDir)
        .replace(/[^a-z0-9-]/gi, "-")
        .toLowerCase()

      const packageJsonContent = JSON.stringify(
        {
          name: projectName,
          version: "1.0.0",
          description: `Project initialized with Kord AIOS`,
          type: "module",
        },
        null,
        2
      )

      writeFileSync(packageJsonPath, packageJsonContent, "utf-8")
      packageJsonCreated = true
    } catch (err) {
      error = `Failed to create package.json: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  return {
    success: !error,
    gitInitialized,
    packageJsonCreated,
    error,
  }
}

/**
 * Configure .opencode/opencode.jsonc with plugin and instructions.
 * - Adds "kord-aios" to plugins array
 * - Adds ".kord/instructions/**" to instructions array
 * - Preserves existing configuration
 */
async function configureOpenCodeConfig(
  projectDir: string,
  _force: boolean
): Promise<{ success: boolean; configPath?: string; error?: string }> {
  const projectOpencodeDir = resolve(projectDir, ".opencode")
  const opencodeJsoncPath = resolve(projectOpencodeDir, "opencode.jsonc")
  const opencodeJsonPath = resolve(projectOpencodeDir, "opencode.json")

  try {
    // Create .opencode directory if it doesn't exist
    if (!existsSync(projectOpencodeDir)) {
      mkdirSync(projectOpencodeDir, { recursive: true })
    }

    // Determine which config file exists (prefer jsonc)
    let configPath = opencodeJsoncPath
    let configExists = existsSync(configPath)
    
    if (!configExists && existsSync(opencodeJsonPath)) {
      configPath = opencodeJsonPath
      configExists = true
    }

    let config: Record<string, unknown> = {}

    if (configExists) {
      // Read existing config
      const content = readFileSync(configPath, "utf-8")
      const parsed = parseJsonc(content)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        config = parsed as Record<string, unknown>
      }
    }

    // Ensure plugins array exists and contains kord-aios
    const plugins = Array.isArray(config.plugin) ? config.plugin : []
    if (!plugins.includes("kord-aios")) {
      plugins.push("kord-aios")
      config.plugin = plugins
    }

    // Ensure instructions array exists and contains .kord/instructions/**
    const instructions = Array.isArray(config.instructions) ? config.instructions : []
    const rulesGlob = ".kord/instructions/**"
    if (!instructions.includes(rulesGlob)) {
      instructions.push(rulesGlob)
      config.instructions = instructions
    }

    // Write updated config
    // Use JSONC format if original was JSONC, otherwise JSON
    const isJsonc = configPath === opencodeJsoncPath
    const outputContent = isJsonc 
      ? JSON.stringify(config, null, 2) + "\n"
      : JSON.stringify(config, null, 2) + "\n"
    
    writeFileSync(configPath, outputContent)

    return { success: true, configPath }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, configPath: opencodeJsoncPath, error: message }
  }
}

/**
 * Export the builtin code squad to the project's .kord/squads/ directory.
 * Copies SQUAD.yaml from src/features/builtin-squads/code/ to .kord/squads/code/
 */
function exportCodeSquad(projectDir: string, force: boolean): {
  success: boolean
  exported: boolean
  error?: string
} {
  try {
    const sourceSquadPath = join(BUILTIN_SQUAD_PATH, BUILTIN_SQUAD_FILE)
    const targetSquadDir = join(projectDir, KORD_DIR, "squads", "code")
    const targetSquadPath = join(targetSquadDir, BUILTIN_SQUAD_FILE)

    // Check if source exists
    if (!existsSync(sourceSquadPath)) {
      return {
        success: false,
        exported: false,
        error: `Builtin squad not found at ${sourceSquadPath}`,
      }
    }

    // Check if target already exists (for idempotency)
    if (!force && existsSync(targetSquadPath)) {
      return {
        success: true,
        exported: false,
      }
    }

    // Create target directory if it doesn't exist
    if (!existsSync(targetSquadDir)) {
      mkdirSync(targetSquadDir, { recursive: true })
    }

    // Copy the squad file
    cpSync(sourceSquadPath, targetSquadPath, { force: true })

    return {
      success: true,
      exported: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      exported: false,
      error: message,
    }
  }
}

interface PrintResultsParams {
  kordCreated: boolean
  scaffold: {
    created: string[]
    skipped: string[]
    errors: string[]
  }
  migration: {
    migrated: boolean
    source?: string
    target?: string
    error?: string
  }
  squadExport: {
    success: boolean
    exported: boolean
    error?: string
  }
  config: {
    success: boolean
    configPath?: string
    error?: string
  }
  opencodeConfig: {
    success: boolean
    configPath?: string
    error?: string
  }
  bootstrap: {
    success: boolean
    gitInitialized: boolean
    packageJsonCreated: boolean
    warning?: string
    error?: string
  }
  extractSkipped: boolean
}

function printInitResults(params: PrintResultsParams): void {
  const { kordCreated, scaffold, migration, squadExport, config, opencodeConfig, bootstrap, extractSkipped } = params

  // Print directory creation status
  if (kordCreated) {
    console.log(`${cyan("✓")} ${bold(".kord/")} directory created`)
  }

  // Print scaffold results
  const totalCreated = scaffold.created.length
  const totalSkipped = scaffold.skipped.length

  if (totalCreated > 0) {
    console.log(`${cyan("✓")} ${bold(String(totalCreated))} file(s) created`)
  }

  if (totalSkipped > 0) {
    console.log(`${cyan("○")} ${bold(String(totalSkipped))} file(s) skipped (already exist)`)
  }

  // Print migration result
  if (migration.migrated) {
    console.log(`${cyan("✓")} ${bold("Migrated")} kord-rules.md to .kord/instructions/`)
  }

  // Print squad export result
  if (squadExport.exported) {
    console.log(`${cyan("✓")} ${bold(".kord/squads/code/")} squad exported`)
  }

  // Print config result
  if (config.success) {
    console.log(`${cyan("✓")} ${bold(".opencode/kord-aios.json")} written`)
  } else if (config.error) {
    console.log(`${cyan("✗")} Failed to write config: ${config.error}`)
  }

  // Print opencode.jsonc result
  if (opencodeConfig.success) {
    console.log(`${cyan("✓")} ${bold(".opencode/opencode.jsonc")} configured`)
  } else if (opencodeConfig.error) {
    console.log(`${cyan("✗")} Failed to configure opencode.jsonc: ${opencodeConfig.error}`)
  }

  // Print bootstrap result
  if (bootstrap.warning) {
    console.log(`${cyan("⚠")} ${bold("Bootstrap")} ${bootstrap.warning}`)
  } else if (bootstrap.gitInitialized || bootstrap.packageJsonCreated) {
    if (bootstrap.gitInitialized) {
      console.log(`${cyan("✓")} ${bold("Bootstrap")} git initialized`)
    }
    if (bootstrap.packageJsonCreated) {
      console.log(`${cyan("✓")} ${bold("Bootstrap")} package.json created`)
    }
  }

  // Print sync result
  if (extractSkipped) {
    console.log(`${cyan("○")} ${bold("Content Sync")} skipped (--skip-sync flag)`)
  }

  // Print errors if any
  if (scaffold.errors.length > 0) {
    console.log(`${cyan("✗")} Scaffold errors:`)
    for (const err of scaffold.errors) {
      console.log(`  - ${err}`)
    }
  }

  // Print squad export error if any
  if (squadExport.error) {
    console.log(`${cyan("✗")} Squad export error: ${squadExport.error}`)
  }

  // Print bootstrap error if any
  if (bootstrap.error) {
    console.log(`${cyan("✗")} Bootstrap error: ${bootstrap.error}`)
  }
}
