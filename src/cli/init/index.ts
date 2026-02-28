import { createKordDirectory } from "../kord-directory"
import { scaffoldProject } from "../scaffolder"
import { writeProjectKordAiosConfig } from "../config-manager"
import { bold, cyan } from "picocolors"

export interface InitOptions {
  directory?: string
  force?: boolean
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
  config: {
    success: boolean
    configPath?: string
    error?: string
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
 *
 * Does NOT touch global config.
 */
export async function init(options: InitOptions): Promise<InitResult> {
  const cwd = options.directory ?? process.cwd()

  // Step 1: Create .kord/ directory
  const kordResult = createKordDirectory(cwd)

  // Step 2: Scaffold project structure
  const scaffoldResult = scaffoldProject({
    directory: cwd,
    force: options.force ?? false,
  })

  // Step 3: Write project config
  const configResult = writeProjectKordAiosConfig(cwd)

  // Print results
  printInitResults({
    kordCreated: kordResult.created,
    scaffold: scaffoldResult,
    config: configResult,
  })

  const success = kordResult.success && configResult.success

  return {
    success,
    kordDirectory: {
      success: kordResult.success,
      created: kordResult.created,
    },
    scaffold: scaffoldResult,
    config: {
      success: configResult.success,
      configPath: configResult.configPath,
      error: configResult.error,
    },
    exitCode: success ? 0 : 1,
  }
}

interface PrintResultsParams {
  kordCreated: boolean
  scaffold: {
    created: string[]
    skipped: string[]
    errors: string[]
  }
  config: {
    success: boolean
    configPath?: string
    error?: string
  }
}

function printInitResults(params: PrintResultsParams): void {
  const { kordCreated, scaffold, config } = params

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

  // Print config result
  if (config.success) {
    console.log(`${cyan("✓")} ${bold(".opencode/kord-aios.json")} written`)
  } else if (config.error) {
    console.log(`${cyan("✗")} Failed to write config: ${config.error}`)
  }

  // Print errors if any
  if (scaffold.errors.length > 0) {
    console.log(`${cyan("✗")} Scaffold errors:`)
    for (const err of scaffold.errors) {
      console.log(`  - ${err}`)
    }
  }
}
