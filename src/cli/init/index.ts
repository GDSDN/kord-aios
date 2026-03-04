import { createKordDirectory } from "../kord-directory"
import { scaffoldProject } from "../scaffolder"
import { writeProjectKordAiosConfig } from "../config-manager"
import { extract } from "../extract"
import { bold, cyan } from "picocolors"
import { existsSync, mkdirSync, cpSync } from "node:fs"
import { join } from "node:path"
import { KORD_DIR } from "../project-layout"

// Path to the builtin code squad
const BUILTIN_SQUAD_PATH = join(import.meta.dir, "..", "..", "features", "builtin-squads", "code")
const BUILTIN_SQUAD_FILE = "SQUAD.yaml"

export interface InitOptions {
  directory?: string
  force?: boolean
  skipExtract?: boolean
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
 * - Exports code squad to .kord/squads/code/
 * - Extracts agents, skills, commands to .opencode/ (unless skipExtract is true)
 *
 * Does NOT touch global config.
 */
export async function init(options: InitOptions): Promise<InitResult> {
  const cwd = options.directory ?? process.cwd()
  const force = options.force ?? false
  const skipExtract = options.skipExtract ?? false

  // Step 1: Create .kord/ directory
  const kordResult = createKordDirectory(cwd)

  // Step 2: Scaffold project structure
  const scaffoldResult = scaffoldProject({
    directory: cwd,
    force,
  })

  // Step 3: Export code squad to .kord/squads/code/
  const squadExportResult = exportCodeSquad(cwd, force)

  // Step 4: Write project config
  const configResult = writeProjectKordAiosConfig(cwd)

  // Step 5: Extract agents, skills, commands to .opencode/
  let extractExitCode = 0
  if (!skipExtract) {
    extractExitCode = await extract({ directory: cwd, force })
  }

  // Print results
  printInitResults({
    kordCreated: kordResult.created,
    scaffold: scaffoldResult,
    squadExport: squadExportResult,
    config: configResult,
    extractSkipped: skipExtract,
  })

  const success = kordResult.success && squadExportResult.success && configResult.success && extractExitCode === 0

  return {
    success,
    kordDirectory: {
      success: kordResult.success,
      created: kordResult.created,
    },
    scaffold: scaffoldResult,
    squadExport: squadExportResult,
    config: {
      success: configResult.success,
      configPath: configResult.configPath,
      error: configResult.error,
    },
    extract: {
      success: extractExitCode === 0,
      exitCode: extractExitCode,
    },
    exitCode: success ? 0 : 1,
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
  extractSkipped: boolean
}

function printInitResults(params: PrintResultsParams): void {
  const { kordCreated, scaffold, squadExport, config, extractSkipped } = params

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

  // Print extract result
  if (extractSkipped) {
    console.log(`${cyan("○")} ${bold("Extract")} skipped (--skip-extract flag)`)
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
}
