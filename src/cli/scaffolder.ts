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
  PRD_TEMPLATE_CONTENT,
  EPIC_TEMPLATE_CONTENT,
  TASK_TEMPLATE_CONTENT,
  QA_GATE_TEMPLATE_CONTENT,
  QA_REPORT_TEMPLATE_CONTENT,
  CHECKLIST_STORY_DRAFT_CONTENT,
  CHECKLIST_STORY_DOD_CONTENT,
  CHECKLIST_PR_REVIEW_CONTENT,
  CHECKLIST_ARCHITECT_CONTENT,
  CHECKLIST_PRE_PUSH_CONTENT,
  CHECKLIST_SELF_CRITIQUE_CONTENT,
  KORD_ROOT_AGENTS_CONTENT,
  KORD_STANDARDS_AGENTS_CONTENT,
  KORD_GUIDES_AGENTS_CONTENT,
  KORD_STANDARDS_QUALITY_GATES_CONTENT,
  KORD_STANDARDS_DECISION_HEURISTICS_CONTENT,
  KORD_GUIDE_NEW_PROJECT_CONTENT,
  KORD_GUIDE_EXISTING_PROJECT_CONTENT,
  CHECKLIST_AGENT_QUALITY_GATE_CONTENT,
} from "./project-layout"

export interface ScaffoldResult {
  created: string[]
  skipped: string[]
  errors: string[]
}

export interface ScaffoldOptions {
  directory: string
  force?: boolean
  projectMode?: "new" | "existing"
}

const GITKEEP = ""

interface DirEntry {
  path: string
  content?: string
  isDir?: boolean
}

function getScaffoldEntries(baseDir: string, projectMode?: "new" | "existing"): DirEntry[] {
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
  entries.push({ path: join(templatesDir, "prd.md"), content: PRD_TEMPLATE_CONTENT })
  entries.push({ path: join(templatesDir, "epic.md"), content: EPIC_TEMPLATE_CONTENT })
  entries.push({ path: join(templatesDir, "task.md"), content: TASK_TEMPLATE_CONTENT })
  entries.push({ path: join(templatesDir, "qa-gate.md"), content: QA_GATE_TEMPLATE_CONTENT })
  entries.push({ path: join(templatesDir, "qa-report.md"), content: QA_REPORT_TEMPLATE_CONTENT })

  // .kord/templates/checklists/ (flat, no subdirs)
  entries.push({ path: join(templatesDir, "checklist-story-draft.md"), content: CHECKLIST_STORY_DRAFT_CONTENT })
  entries.push({ path: join(templatesDir, "checklist-story-dod.md"), content: CHECKLIST_STORY_DOD_CONTENT })
  entries.push({ path: join(templatesDir, "checklist-pr-review.md"), content: CHECKLIST_PR_REVIEW_CONTENT })
  entries.push({ path: join(templatesDir, "checklist-architect.md"), content: CHECKLIST_ARCHITECT_CONTENT })
  entries.push({ path: join(templatesDir, "checklist-pre-push.md"), content: CHECKLIST_PRE_PUSH_CONTENT })
  entries.push({ path: join(templatesDir, "checklist-self-critique.md"), content: CHECKLIST_SELF_CRITIQUE_CONTENT })

  // .kord/templates/checklist-agent-quality-gate.md
  entries.push({ path: join(templatesDir, "checklist-agent-quality-gate.md"), content: CHECKLIST_AGENT_QUALITY_GATE_CONTENT })

  // .kord/AGENTS.md (root index)
  entries.push({ path: join(baseDir, KORD_DIR, "AGENTS.md"), content: KORD_ROOT_AGENTS_CONTENT })

  // .kord/standards/ files
  const standardsDir = join(baseDir, KORD_DIR, "standards")
  entries.push({ path: standardsDir, isDir: true })
  entries.push({ path: join(standardsDir, "AGENTS.md"), content: KORD_STANDARDS_AGENTS_CONTENT })
  entries.push({ path: join(standardsDir, "quality-gates.md"), content: KORD_STANDARDS_QUALITY_GATES_CONTENT })
  entries.push({ path: join(standardsDir, "decision-heuristics.md"), content: KORD_STANDARDS_DECISION_HEURISTICS_CONTENT })

  // .kord/guides/ files
  const guidesDir = join(baseDir, KORD_DIR, "guides")
  entries.push({ path: guidesDir, isDir: true })
  entries.push({ path: join(guidesDir, "AGENTS.md"), content: KORD_GUIDES_AGENTS_CONTENT })
  entries.push({ path: join(guidesDir, "new-project.md"), content: KORD_GUIDE_NEW_PROJECT_CONTENT })
  entries.push({ path: join(guidesDir, "existing-project.md"), content: KORD_GUIDE_EXISTING_PROJECT_CONTENT })

  // kord-rules.md at project root
  entries.push({ path: join(baseDir, KORD_RULES_FILE), content: KORD_RULES_CONTENT })

  // .kord/rules/project-mode.md - generated dynamically based on projectMode
  const projectModeContent = getProjectModeContent(projectMode)
  entries.push({ path: join(baseDir, KORD_DIR, "rules", "project-mode.md"), content: projectModeContent })

  return entries
}

/**
 * Generate project-mode.md content based on project mode.
 * This file tells agents how to onboard to this project.
 */
function getProjectModeContent(projectMode?: "new" | "existing"): string {
  const mode = projectMode ?? "existing" // Default to existing for backward compatibility
  const stage = mode === "new" ? "NEW_SETUP" : "EXISTING_UNASSESSED"
  const readFirst = mode === "new" ? ".kord/guides/new-project.md" : ".kord/guides/existing-project.md"

  return `# Project Mode

Project Mode: ${mode}
Project Stage: ${stage}
Read-first: ${readFirst}

## Context

This file tells Kord agents how to onboard to this project.

- **New Project**: Starting from scratch, no existing codebase
- **Existing Project**: Adding Kord to an existing codebase that needs assessment

## For New Projects

Read \`.kord/guides/new-project.md\` for guidance on:
- Setting up the initial project structure
- Creating your first story
- Establishing development workflow

## For Existing Projects

Read \`.kord/guides/existing-project.md\` for guidance on:
- Assessing the existing codebase
- Planning the migration
- Identifying integration points
`
}

export function scaffoldProject(options: ScaffoldOptions): ScaffoldResult {
  const { directory, force = false, projectMode } = options
  const result: ScaffoldResult = { created: [], skipped: [], errors: [] }

  const entries = getScaffoldEntries(directory, projectMode)

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
  // Check for presence of required baseline signals:
  // 1. Project config (.opencode/kord-aios.json) - new baseline signal
  // 2. docs/kord/plans AND .kord/templates - full scaffold
  const hasProjectConfig = existsSync(join(directory, ".opencode", "kord-aios.json"))
  const hasFullScaffold =
    existsSync(join(directory, KORD_DOCS_DIR, "plans")) &&
    existsSync(join(directory, KORD_DIR, "templates"))

  return hasProjectConfig || hasFullScaffold
}
