import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import {
  KORD_DIR,
  KORD_DOCS_DIR,
  KORD_RULES_FILE,
  KORD_OUTPUT_SUBDIRS,
  KORD_RULES_CONTENT,
  STORY_TEMPLATE_CONTENT,
  ADR_TEMPLATE_CONTENT,
} from "./project-layout"

export interface ScaffoldResult {
  created: string[]
  skipped: string[]
  errors: string[]
}

export interface ScaffoldOptions {
  directory: string
  force?: boolean
}

const GITKEEP = ""

interface DirEntry {
  path: string
  content?: string
  isDir?: boolean
}

function getScaffoldEntries(baseDir: string): DirEntry[] {
  const entries: DirEntry[] = []

  // docs/kord/ work directories
  for (const subdir of KORD_OUTPUT_SUBDIRS) {
    const dirPath = join(baseDir, KORD_DOCS_DIR, subdir)
    entries.push({ path: dirPath, isDir: true })
    entries.push({ path: join(dirPath, ".gitkeep"), content: GITKEEP })
  }

  // .kord/ templates
  const templatesDir = join(baseDir, KORD_DIR, "templates")
  entries.push({ path: templatesDir, isDir: true })
  entries.push({ path: join(templatesDir, "story.md"), content: STORY_TEMPLATE_CONTENT })
  entries.push({ path: join(templatesDir, "adr.md"), content: ADR_TEMPLATE_CONTENT })

  // kord-rules.md at project root
  entries.push({ path: join(baseDir, KORD_RULES_FILE), content: KORD_RULES_CONTENT })

  return entries
}

export function scaffoldProject(options: ScaffoldOptions): ScaffoldResult {
  const { directory, force = false } = options
  const result: ScaffoldResult = { created: [], skipped: [], errors: [] }

  const entries = getScaffoldEntries(directory)

  for (const entry of entries) {
    try {
      if (entry.isDir) {
        if (!existsSync(entry.path)) {
          mkdirSync(entry.path, { recursive: true })
          result.created.push(entry.path)
        } else {
          result.skipped.push(entry.path)
        }
      } else if (entry.content !== undefined) {
        if (!existsSync(entry.path) || force) {
          const dir = join(entry.path, "..")
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
          }
          writeFileSync(entry.path, entry.content, "utf-8")
          result.created.push(entry.path)
        } else {
          result.skipped.push(entry.path)
        }
      }
    } catch (err) {
      result.errors.push(`${entry.path}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}

export function isProjectScaffolded(directory: string): boolean {
  // Check for presence of required baseline directories
  // 1. docs/kord/plans
  // 2. .kord/templates
  return (
    existsSync(join(directory, KORD_DOCS_DIR, "plans")) &&
    existsSync(join(directory, KORD_DIR, "templates"))
  )
}
