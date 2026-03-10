import { readBuiltinAsset } from "../features/builtin-assets"

function readBuiltinTemplate(fileName: string): string {
  return readBuiltinAsset("builtin-templates", fileName)
}

function readBuiltinChecklist(fileName: string): string {
  return readBuiltinAsset("builtin-checklists", fileName)
}

function readBuiltinStandard(fileName: string): string {
  return readBuiltinAsset("builtin-standards", fileName)
}

function readBuiltinInstruction(fileName: string): string {
  return readBuiltinAsset("builtin-instructions", fileName)
}

export const KORD_DIR = ".kord"
export const KORD_DOCS_DIR = "docs/kord"
export const KORD_RULES_FILE = ".kord/instructions/kord-rules.md"

export const KORD_INPUT_SUBDIRS = [
  "scripts",
  "templates",
  "checklists",
  "skills",
  "squads",
] as const

/**
 * Subdirectories that are actively created by createKordDirectory()
 * These are the only .kord/ subdirs that get created automatically.
 */
export const KORD_ACTIVE_SUBDIRS = [
  "templates",
  "squads",
  "instructions",
  "standards",
  "checklists",
] as const

/**
 * Reserved subdirectories that are NOT created automatically.
 * These document future intent but are not currently used.
 */
export const KORD_RESERVED_SUBDIRS = [
  "scripts",
  "skills",
] as const

export const KORD_OUTPUT_SUBDIRS = [
  "plans",
  "stories",
  "epics",
  "prds",
  "drafts",
  "notepads",
] as const

export const KORD_RULES_CONTENT = readBuiltinInstruction("kord-rules.md")

export const GREENFIELD_INSTRUCTION_CONTENT = readBuiltinInstruction("greenfield.md")

export const BROWNFIELD_INSTRUCTION_CONTENT = readBuiltinInstruction("brownfield.md")

export const MODULAR_CODE_ENFORCEMENT_CONTENT = readBuiltinInstruction("modular-code-enforcement.md")

export const STORY_TEMPLATE_CONTENT = readBuiltinTemplate("story.md")

export const ADR_TEMPLATE_CONTENT = readBuiltinTemplate("adr.md")

export const PRD_TEMPLATE_CONTENT = readBuiltinTemplate("prd.md")

export const EPIC_TEMPLATE_CONTENT = readBuiltinTemplate("epic.md")

export const TASK_TEMPLATE_CONTENT = readBuiltinTemplate("task.md")

export const QA_GATE_TEMPLATE_CONTENT = readBuiltinTemplate("qa-gate.md")

export const QA_REPORT_TEMPLATE_CONTENT = readBuiltinTemplate("qa-report.md")

export const CHECKLIST_STORY_DRAFT_CONTENT = readBuiltinChecklist("checklist-story-draft.md")

export const CHECKLIST_STORY_DOD_CONTENT = readBuiltinChecklist("checklist-story-dod.md")

export const CHECKLIST_PR_REVIEW_CONTENT = readBuiltinChecklist("checklist-pr-review.md")

export const CHECKLIST_ARCHITECT_CONTENT = readBuiltinChecklist("checklist-architect.md")

export const CHECKLIST_PRE_PUSH_CONTENT = readBuiltinChecklist("checklist-pre-push.md")

export const CHECKLIST_SELF_CRITIQUE_CONTENT = readBuiltinChecklist("checklist-self-critique.md")

export const KORD_ROOT_AGENTS_CONTENT = readBuiltinInstruction("kord-root-agents.md")

export const KORD_STANDARDS_AGENTS_CONTENT = readBuiltinStandard("AGENTS.md")

export const KORD_STANDARDS_ONBOARDING_DEPTH_RUBRIC_CONTENT = readBuiltinStandard("onboarding-depth-rubric.md")

export const KORD_STANDARDS_METHODOLOGY_ARTIFACTS_QUALITY_RUBRIC_CONTENT = readBuiltinStandard("methodology-artifacts-quality-rubric.md")

export const KORD_STANDARDS_QUALITY_GATES_CONTENT = readBuiltinStandard("quality-gates.md")

export const KORD_STANDARDS_DECISION_HEURISTICS_CONTENT = readBuiltinStandard("decision-heuristics.md")

export const CHECKLIST_AGENT_QUALITY_GATE_CONTENT = readBuiltinChecklist("checklist-agent-quality-gate.md")
