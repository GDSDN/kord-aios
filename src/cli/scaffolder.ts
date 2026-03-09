import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
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
  KORD_STANDARDS_QUALITY_GATES_CONTENT,
  KORD_STANDARDS_DECISION_HEURISTICS_CONTENT,
  KORD_STANDARDS_ONBOARDING_DEPTH_RUBRIC_CONTENT,
  KORD_STANDARDS_METHODOLOGY_ARTIFACTS_QUALITY_RUBRIC_CONTENT,
  CHECKLIST_AGENT_QUALITY_GATE_CONTENT,
} from "./project-layout"
import { BUILTIN_WORKFLOW_YAMLS } from "../features/workflow-engine"

const WORKFLOW_TEMPLATE_CONTENT = `schema_version: "1"
workflow:
  id: your-workflow-id
  name: Your Workflow
  version: "1.0.0"
  type: development
  runner_agent: kord
sequence:
  - id: kickoff
    intent: interview
    title: Gather goals and constraints
`

const WORKFLOWS_README_CONTENT = `# Workflow Authoring Workspace

This directory contains project-local workflow definitions used by the Kord workflow runtime.

## Purpose

- Author and override workflows without editing plugin source code.
- Keep workflow YAML, aliases, and validation in a deterministic local path.

## File Structure

- \`_template.yaml\`: starter workflow template.
- \`<workflow-id>.yaml\`: your workflow definitions.
- \`README.md\`: this authoring guide.

## Safety Notes

- Keep \`schema_version\` and \`workflow.id\` explicit in every workflow file.
- Use lowercase, dash-separated workflow ids (for example: \`ads-analysis\`).
- Reuse runtime commands instead of custom scripting:
  - \`/workflow validate <id>\`
  - \`/workflow <id>\`
  - \`/workflow continue <id>\`

## Minimal Authoring Steps

1. Run \`/create-workflow <id>\` (or \`/workflow create <id>\`) to scaffold files.
2. Edit \`.kord/workflows/<id>.yaml\` and define the step sequence.
3. Run \`/workflow validate <id>\`.
4. Run \`/<id>\` (alias) or \`/workflow <id>\` to start.
`

const GREENFIELD_INSTRUCTION_CONTENT = readFileSync(
  join(import.meta.dir, "..", "features", "builtin-instructions", "greenfield.md"),
  "utf-8",
)

const BROWNFIELD_INSTRUCTION_CONTENT = readFileSync(
  join(import.meta.dir, "..", "features", "builtin-instructions", "brownfield.md"),
  "utf-8",
)

function getWorkflowAliasCommandContent(workflowId: string): string {
  return `---
description: Workflow alias for ${workflowId}
---

<workflow-context>
<workflow-id>${workflowId}</workflow-id>
</workflow-context>

<user-request>
\${user_message}
</user-request>
`
}

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

  // .kord/checklists/ files
  const checklistsDir = join(baseDir, KORD_DIR, "checklists")
  entries.push({ path: checklistsDir, isDir: true })
  entries.push({ path: join(checklistsDir, "checklist-story-draft.md"), content: CHECKLIST_STORY_DRAFT_CONTENT })
  entries.push({ path: join(checklistsDir, "checklist-story-dod.md"), content: CHECKLIST_STORY_DOD_CONTENT })
  entries.push({ path: join(checklistsDir, "checklist-pr-review.md"), content: CHECKLIST_PR_REVIEW_CONTENT })
  entries.push({ path: join(checklistsDir, "checklist-architect.md"), content: CHECKLIST_ARCHITECT_CONTENT })
  entries.push({ path: join(checklistsDir, "checklist-pre-push.md"), content: CHECKLIST_PRE_PUSH_CONTENT })
  entries.push({ path: join(checklistsDir, "checklist-self-critique.md"), content: CHECKLIST_SELF_CRITIQUE_CONTENT })
  entries.push({ path: join(checklistsDir, "checklist-agent-quality-gate.md"), content: CHECKLIST_AGENT_QUALITY_GATE_CONTENT })

  // .kord/AGENTS.md (root index)
  entries.push({ path: join(baseDir, KORD_DIR, "AGENTS.md"), content: KORD_ROOT_AGENTS_CONTENT })

  // .kord/standards/ files
  const standardsDir = join(baseDir, KORD_DIR, "standards")
  entries.push({ path: standardsDir, isDir: true })
  entries.push({ path: join(standardsDir, "AGENTS.md"), content: KORD_STANDARDS_AGENTS_CONTENT })
  entries.push({ path: join(standardsDir, "quality-gates.md"), content: KORD_STANDARDS_QUALITY_GATES_CONTENT })
  entries.push({ path: join(standardsDir, "decision-heuristics.md"), content: KORD_STANDARDS_DECISION_HEURISTICS_CONTENT })
  entries.push({ path: join(standardsDir, "onboarding-depth-rubric.md"), content: KORD_STANDARDS_ONBOARDING_DEPTH_RUBRIC_CONTENT })
  entries.push({
    path: join(standardsDir, "methodology-artifacts-quality-rubric.md"),
    content: KORD_STANDARDS_METHODOLOGY_ARTIFACTS_QUALITY_RUBRIC_CONTENT,
  })

  // .kord/instructions/ files
  const instructionsDir = join(baseDir, KORD_DIR, "instructions")
  entries.push({ path: instructionsDir, isDir: true })

  // kord-rules.md in .kord/instructions/
  entries.push({ path: join(baseDir, KORD_RULES_FILE), content: KORD_RULES_CONTENT })

  // exactly one project-type instruction file
  const projectTypeInstructionName = projectMode === "new" ? "greenfield.md" : "brownfield.md"
  const projectTypeInstructionContent = projectMode === "new"
    ? GREENFIELD_INSTRUCTION_CONTENT
    : BROWNFIELD_INSTRUCTION_CONTENT
  entries.push({ path: join(instructionsDir, projectTypeInstructionName), content: projectTypeInstructionContent })

  // .kord/workflows/ files
  const workflowsDir = join(baseDir, KORD_DIR, "workflows")
  entries.push({ path: workflowsDir, isDir: true })
  entries.push({ path: join(workflowsDir, "README.md"), content: WORKFLOWS_README_CONTENT })
  entries.push({ path: join(workflowsDir, "_template.yaml"), content: WORKFLOW_TEMPLATE_CONTENT })
  for (const [workflowId, workflowYaml] of Object.entries(BUILTIN_WORKFLOW_YAMLS)) {
    entries.push({ path: join(workflowsDir, `${workflowId}.yaml`), content: workflowYaml })
  }

  // .opencode/command workflow aliases
  const opencodeCommandDir = join(baseDir, ".opencode", "command")
  entries.push({ path: opencodeCommandDir, isDir: true })
  for (const workflowId of Object.keys(BUILTIN_WORKFLOW_YAMLS)) {
    entries.push({
      path: join(opencodeCommandDir, `${workflowId}.md`),
      content: getWorkflowAliasCommandContent(workflowId),
    })
  }

  return entries
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
