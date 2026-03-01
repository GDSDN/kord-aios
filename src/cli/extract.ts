import { promises as fs } from "node:fs"
import { basename, dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { getOpenCodeConfigDir } from "../shared"

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const FEATURES_DIR = join(MODULE_DIR, "..", "features")
const BUILTIN_AGENTS_DIR = join(FEATURES_DIR, "builtin-agents")
const BUILTIN_SKILLS_DIR = join(FEATURES_DIR, "builtin-skills", "skills")
const BUILTIN_SQUADS_DIR = join(FEATURES_DIR, "builtin-squads")
const BUILTIN_COMMANDS_TEMPLATES_DIR = join(FEATURES_DIR, "builtin-commands", "templates")

export interface ExtractOptions {
  global?: boolean
  agentsOnly?: boolean
  skillsOnly?: boolean
  squadsOnly?: boolean
  commandsOnly?: boolean
  force?: boolean
  diff?: boolean
  directory?: string
}

interface ExtractPlanItem {
  category: "agents" | "skills" | "squads" | "commands"
  sourcePath: string
  destinationPath: string
}

interface ExtractCategorySummary {
  copied: number
  skipped: number
}

interface SelectedCategories {
  agents: boolean
  skills: boolean
  squads: boolean
  commands: boolean
}

function resolveSelectedCategories(options: ExtractOptions): SelectedCategories {
  const hasCategoryFlag =
    options.agentsOnly ||
    options.skillsOnly ||
    options.squadsOnly ||
    options.commandsOnly

  if (!hasCategoryFlag) {
    return {
      agents: true,
      skills: true,
      squads: true,
      commands: true,
    }
  }

  return {
    agents: options.agentsOnly ?? false,
    skills: options.skillsOnly ?? false,
    squads: options.squadsOnly ?? false,
    commands: options.commandsOnly ?? false,
  }
}

async function listFilesRecursive(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(fullPath))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

async function collectAgentItems(targetDir: string): Promise<ExtractPlanItem[]> {
  const entries = await fs.readdir(BUILTIN_AGENTS_DIR, { withFileTypes: true })
  const items: ExtractPlanItem[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue
    const sourcePath = join(BUILTIN_AGENTS_DIR, entry.name)
    const destinationPath = join(targetDir, "agents", entry.name)
    items.push({
      category: "agents",
      sourcePath,
      destinationPath,
    })
  }

  return items
}

async function collectSkillItems(targetDir: string): Promise<ExtractPlanItem[]> {
  const allFiles = await listFilesRecursive(BUILTIN_SKILLS_DIR)
  const items: ExtractPlanItem[] = []

  for (const sourcePath of allFiles) {
    if (!sourcePath.endsWith("SKILL.md")) continue
    const skillName = basename(dirname(sourcePath))
    const destinationPath = join(targetDir, "skills", skillName, "SKILL.md")
    items.push({
      category: "skills",
      sourcePath,
      destinationPath,
    })
  }

  return items
}

async function collectSquadItems(targetDir: string): Promise<ExtractPlanItem[]> {
  const entries = await fs.readdir(BUILTIN_SQUADS_DIR, { withFileTypes: true })
  const items: ExtractPlanItem[] = []

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue
    const squadDir = join(BUILTIN_SQUADS_DIR, entry.name)
    const squadYamlPath = join(squadDir, "SQUAD.yaml")

    try {
      await fs.access(squadYamlPath)
    } catch {
      continue
    }

    const files = await listFilesRecursive(squadDir)
    for (const sourcePath of files) {
      const relativePath = relative(squadDir, sourcePath)
      const destinationPath = join(targetDir, "squads", entry.name, relativePath)
      items.push({
        category: "squads",
        sourcePath,
        destinationPath,
      })
    }
  }

  return items
}

async function collectCommandItems(targetDir: string): Promise<ExtractPlanItem[]> {
  const files = await listFilesRecursive(BUILTIN_COMMANDS_TEMPLATES_DIR)
  const items: ExtractPlanItem[] = []

  for (const sourcePath of files) {
    if (sourcePath.endsWith(".test.ts")) continue
    const relativePath = relative(BUILTIN_COMMANDS_TEMPLATES_DIR, sourcePath)
    const destinationPath = join(targetDir, "commands", relativePath)
    items.push({
      category: "commands",
      sourcePath,
      destinationPath,
    })
  }

  return items
}

function createEmptySummary(): Record<ExtractPlanItem["category"], ExtractCategorySummary> {
  return {
    agents: { copied: 0, skipped: 0 },
    skills: { copied: 0, skipped: 0 },
    squads: { copied: 0, skipped: 0 },
    commands: { copied: 0, skipped: 0 },
  }
}

function printSummary(
  summary: Record<ExtractPlanItem["category"], ExtractCategorySummary>,
  targetDir: string,
  isDiff: boolean
): void {
  const totalCopied = Object.values(summary).reduce((acc, current) => acc + current.copied, 0)
  const totalSkipped = Object.values(summary).reduce((acc, current) => acc + current.skipped, 0)

  console.log("")
  console.log(isDiff ? "Extract dry-run summary:" : "Extract summary:")
  console.log(`  Target: ${targetDir}`)
  console.log(`  Agents: ${summary.agents.copied} copied, ${summary.agents.skipped} skipped`)
  console.log(`  Skills: ${summary.skills.copied} copied, ${summary.skills.skipped} skipped`)
  console.log(`  Squads: ${summary.squads.copied} copied, ${summary.squads.skipped} skipped`)
  console.log(`  Commands: ${summary.commands.copied} copied, ${summary.commands.skipped} skipped`)
  console.log(`  Total: ${totalCopied} copied, ${totalSkipped} skipped`)
}

export async function extract(options: ExtractOptions): Promise<number> {
  const cwd = options.directory ?? process.cwd()
  const selected = resolveSelectedCategories(options)
  const targetDir = options.global
    ? getOpenCodeConfigDir({ binary: "opencode", checkExisting: false })
    : join(cwd, ".opencode")

  const plan: ExtractPlanItem[] = []

  if (selected.agents) {
    plan.push(...await collectAgentItems(targetDir))
  }

  if (selected.skills) {
    plan.push(...await collectSkillItems(targetDir))
  }

  if (selected.squads) {
    plan.push(...await collectSquadItems(targetDir))
  }

  if (selected.commands) {
    plan.push(...await collectCommandItems(targetDir))
  }

  const summary = createEmptySummary()

  for (const item of plan) {
    let destinationExists = false
    try {
      await fs.access(item.destinationPath)
      destinationExists = true
    } catch {
      destinationExists = false
    }

    const shouldSkip = destinationExists && !options.force

    if (shouldSkip) {
      summary[item.category].skipped += 1
      if (options.diff) {
        console.log(`[SKIP] ${item.destinationPath}`)
      }
      continue
    }

    summary[item.category].copied += 1
    if (options.diff) {
      console.log(`[WRITE] ${item.sourcePath} -> ${item.destinationPath}`)
      continue
    }

    await fs.mkdir(dirname(item.destinationPath), { recursive: true })
    const content = await fs.readFile(item.sourcePath, "utf-8")
    await fs.writeFile(item.destinationPath, content, "utf-8")
  }

  printSummary(summary, targetDir, options.diff ?? false)

  return 0
}
