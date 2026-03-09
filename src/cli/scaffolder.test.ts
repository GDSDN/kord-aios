import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { scaffoldProject, isProjectScaffolded } from "./scaffolder"
import {
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
  CHECKLIST_AGENT_QUALITY_GATE_CONTENT,
} from "./project-layout"
import { BUILTIN_WORKFLOW_YAMLS } from "../features/workflow-engine"

const TEST_DIR = join(import.meta.dir, "__test_scaffold__")

describe("scaffoldProject", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("creates docs/kord/ directory structure", () => {
    //#given - empty project directory

    //#when
    const result = scaffoldProject({ directory: TEST_DIR })

    //#then
    expect(existsSync(join(TEST_DIR, "docs", "kord", "plans"))).toBe(true)
    expect(existsSync(join(TEST_DIR, "docs", "kord", "drafts"))).toBe(true)
    expect(existsSync(join(TEST_DIR, "docs", "kord", "notepads"))).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test("creates .kord/templates/ with story and ADR templates", () => {
    //#given - empty project directory

    //#when
    scaffoldProject({ directory: TEST_DIR })

    //#then
    expect(existsSync(join(TEST_DIR, ".kord", "templates", "story.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "templates", "adr.md"))).toBe(true)

    const story = readFileSync(join(TEST_DIR, ".kord", "templates", "story.md"), "utf-8")
    expect(story).toContain("Acceptance Criteria")
    expect(story).toContain("Definition of Done")
    expect(story).toContain("## Purpose")
    expect(story).toContain("## Scope")
    expect(story).toContain("## Inputs")
    expect(story).toContain("## Output")
    expect(story).toContain("## Verification")
    expect(story).toContain("## Failure Modes")

    const adr = readFileSync(join(TEST_DIR, ".kord", "templates", "adr.md"), "utf-8")
    expect(adr).toContain("Context")
    expect(adr).toContain("Decision")
    expect(adr).toContain("Consequences")
    expect(adr).toContain("## Purpose")
    expect(adr).toContain("## Scope")
    expect(adr).toContain("## Inputs")
    expect(adr).toContain("## Output")
    expect(adr).toContain("## Acceptance Criteria")
    expect(adr).toContain("## Verification")
    expect(adr).toContain("## Failure Modes")
  })

  test("creates .kord/templates/ with new templates (prd, epic, task, qa-gate, qa-report)", () => {
    //#given - empty project directory

    //#when
    scaffoldProject({ directory: TEST_DIR })

    //#then
    expect(existsSync(join(TEST_DIR, ".kord", "templates", "prd.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "templates", "epic.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "templates", "task.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "templates", "qa-gate.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "templates", "qa-report.md"))).toBe(true)

    const prd = readFileSync(join(TEST_DIR, ".kord", "templates", "prd.md"), "utf-8")
    expect(prd).toContain("Product Requirements Document")
    expect(prd).toContain("Executive Summary")
    expect(prd).toContain("## Purpose")
    expect(prd).toContain("## Scope")
    expect(prd).toContain("## Inputs")
    expect(prd).toContain("## Output")
    expect(prd).toContain("## Acceptance Criteria")
    expect(prd).toContain("## Verification")
    expect(prd).toContain("## Failure Modes")

    const epic = readFileSync(join(TEST_DIR, ".kord", "templates", "epic.md"), "utf-8")
    expect(epic).toContain("Epic:")
    expect(epic).toContain("Vision")
    expect(epic).toContain("## Purpose")
    expect(epic).toContain("## Scope")
    expect(epic).toContain("## Inputs")
    expect(epic).toContain("## Output")
    expect(epic).toContain("## Acceptance Criteria")
    expect(epic).toContain("## Verification")
    expect(epic).toContain("## Failure Modes")

    const task = readFileSync(join(TEST_DIR, ".kord", "templates", "task.md"), "utf-8")
    expect(task).toContain("Task:")
    expect(task).toContain("Description")
    expect(task).toContain("## Purpose")
    expect(task).toContain("## Scope")
    expect(task).toContain("## Inputs")
    expect(task).toContain("## Output")
    expect(task).toContain("## Acceptance Criteria")
    expect(task).toContain("## Verification")
    expect(task).toContain("## Failure Modes")

    const qaGate = readFileSync(join(TEST_DIR, ".kord", "templates", "qa-gate.md"), "utf-8")
    expect(qaGate).toContain("QA Gate")
    expect(qaGate).toContain("Gate Decision")
    expect(qaGate).toContain("## Purpose")
    expect(qaGate).toContain("## Scope")
    expect(qaGate).toContain("## Inputs")
    expect(qaGate).toContain("## Output")
    expect(qaGate).toContain("## Acceptance Criteria")
    expect(qaGate).toContain("## Verification")
    expect(qaGate).toContain("## Failure Modes")

    const qaReport = readFileSync(join(TEST_DIR, ".kord", "templates", "qa-report.md"), "utf-8")
    expect(qaReport).toContain("QA Report")
    expect(qaReport).toContain("Test Results Summary")
    expect(qaReport).toContain("## Purpose")
    expect(qaReport).toContain("## Scope")
    expect(qaReport).toContain("## Inputs")
    expect(qaReport).toContain("## Output")
    expect(qaReport).toContain("## Acceptance Criteria")
    expect(qaReport).toContain("## Verification")
    expect(qaReport).toContain("## Failure Modes")
  })

  test("creates .kord/checklists/ with checklist templates", () => {
    //#given - empty project directory

    //#when
    scaffoldProject({ directory: TEST_DIR })

    //#then
    expect(existsSync(join(TEST_DIR, ".kord", "checklists", "checklist-story-draft.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "checklists", "checklist-story-dod.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "checklists", "checklist-pr-review.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "checklists", "checklist-architect.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "checklists", "checklist-pre-push.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "checklists", "checklist-self-critique.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".kord", "checklists", "checklist-agent-quality-gate.md"))).toBe(true)

    // Verify content matches constants
    const storyDraft = readFileSync(join(TEST_DIR, ".kord", "checklists", "checklist-story-draft.md"), "utf-8")
    expect(storyDraft).toBe(CHECKLIST_STORY_DRAFT_CONTENT)

    const storyDod = readFileSync(join(TEST_DIR, ".kord", "checklists", "checklist-story-dod.md"), "utf-8")
    expect(storyDod).toBe(CHECKLIST_STORY_DOD_CONTENT)

    const prReview = readFileSync(join(TEST_DIR, ".kord", "checklists", "checklist-pr-review.md"), "utf-8")
    expect(prReview).toBe(CHECKLIST_PR_REVIEW_CONTENT)

    const architect = readFileSync(join(TEST_DIR, ".kord", "checklists", "checklist-architect.md"), "utf-8")
    expect(architect).toBe(CHECKLIST_ARCHITECT_CONTENT)

    const prePush = readFileSync(join(TEST_DIR, ".kord", "checklists", "checklist-pre-push.md"), "utf-8")
    expect(prePush).toBe(CHECKLIST_PRE_PUSH_CONTENT)

    const selfCritique = readFileSync(join(TEST_DIR, ".kord", "checklists", "checklist-self-critique.md"), "utf-8")
    expect(selfCritique).toBe(CHECKLIST_SELF_CRITIQUE_CONTENT)

    const agentQualityGate = readFileSync(
      join(TEST_DIR, ".kord", "checklists", "checklist-agent-quality-gate.md"),
      "utf-8",
    )
    expect(agentQualityGate).toBe(CHECKLIST_AGENT_QUALITY_GATE_CONTENT)
  })

  test("creates .kord/instructions/ with default brownfield onboarding content", () => {
    //#given - empty project directory

    //#when
    scaffoldProject({ directory: TEST_DIR })

    //#then
    const instructionsDir = join(TEST_DIR, ".kord", "instructions")
    const greenfieldPath = join(instructionsDir, "greenfield.md")
    const brownfieldPath = join(instructionsDir, "brownfield.md")

    expect(existsSync(greenfieldPath)).toBe(false)
    expect(existsSync(brownfieldPath)).toBe(true)

    const brownfield = readFileSync(brownfieldPath, "utf-8")
    expect(brownfield).toContain("## Safety First")
    expect(brownfield).toContain("## Discovery Options")
    expect(brownfield).toContain("## Baseline Gates")
    expect(brownfield).toContain("## Artifacts (Outputs)")
    expect(brownfield).toContain("## Recommended Skills")
    expect(brownfield).toContain("## Verification Commands")
    expect(brownfield).toContain("## What Not To Do")
    expect(brownfield.toLowerCase()).toContain("rollback")
  })

  test("creates workflow pack and workflow alias commands", () => {
    //#given - empty project directory

    //#when
    scaffoldProject({ directory: TEST_DIR })

    //#then
    const workflowTemplatePath = join(TEST_DIR, ".kord", "workflows", "_template.yaml")
    const workflowReadmePath = join(TEST_DIR, ".kord", "workflows", "README.md")
    const workflowIds = Object.keys(BUILTIN_WORKFLOW_YAMLS)

    expect(existsSync(workflowTemplatePath)).toBe(true)
    expect(existsSync(workflowReadmePath)).toBe(true)
    expect(workflowIds).toHaveLength(14)

    for (const workflowId of workflowIds) {
      const scaffoldedWorkflowPath = join(TEST_DIR, ".kord", "workflows", `${workflowId}.yaml`)
      const builtinWorkflowAssetPath = join(import.meta.dir, "..", "features", "builtin-workflows", `${workflowId}.yaml`)
      const workflowAliasPath = join(TEST_DIR, ".opencode", "command", `${workflowId}.md`)

      expect(existsSync(scaffoldedWorkflowPath)).toBe(true)
      expect(existsSync(workflowAliasPath)).toBe(true)

      const scaffoldedWorkflow = readFileSync(scaffoldedWorkflowPath, "utf-8")
      const builtinWorkflow = readFileSync(builtinWorkflowAssetPath, "utf-8")
      expect(scaffoldedWorkflow).toBe(builtinWorkflow)

      const aliasContent = readFileSync(workflowAliasPath, "utf-8")
      expect(aliasContent).toContain("<workflow-context>")
      expect(aliasContent).toContain(`<workflow-id>${workflowId}</workflow-id>`)
    }
    const workflowReadme = readFileSync(workflowReadmePath, "utf-8")
    expect(workflowReadme).toContain("Workflow Authoring Workspace")
    expect(workflowReadme).toContain("/create-workflow <id>")
    expect(workflowReadme).toContain("/workflow create <id>")
  })

  test("creates .kord/standards/ with onboarding and artifact quality rubrics", () => {
    //#given - empty project directory

    //#when
    scaffoldProject({ directory: TEST_DIR })

    //#then
    const onboardingRubricPath = join(TEST_DIR, ".kord", "standards", "onboarding-depth-rubric.md")
    const artifactsRubricPath = join(TEST_DIR, ".kord", "standards", "methodology-artifacts-quality-rubric.md")
    expect(existsSync(onboardingRubricPath)).toBe(true)
    expect(existsSync(artifactsRubricPath)).toBe(true)

    const onboardingRubric = readFileSync(onboardingRubricPath, "utf-8")
    expect(onboardingRubric).toContain("## Required Sections")
    expect(onboardingRubric).toContain("## Depth Markers")
    expect(onboardingRubric).toContain("## Size Budgets")
    expect(onboardingRubric).toContain("## Verification")

    const artifactsRubric = readFileSync(artifactsRubricPath, "utf-8")
    expect(artifactsRubric).toContain("## Templates")
    expect(artifactsRubric).toContain("## Checklists")
    expect(artifactsRubric).toContain("## Standards")
    expect(artifactsRubric).toContain("## Skills")
  })

  test("creates kord-rules.md in .kord/instructions/", () => {
    //#given - empty project directory

    //#when
    scaffoldProject({ directory: TEST_DIR })

    //#then
    const rules = readFileSync(join(TEST_DIR, ".kord", "instructions", "kord-rules.md"), "utf-8")
    expect(rules).toContain("Kord AIOS")
    expect(rules).toContain("docs/kord/plans/")
    expect(rules).toContain("docs/kord/drafts/")
  })

  test("skips existing files without force flag", () => {
    //#given - already scaffolded
    scaffoldProject({ directory: TEST_DIR })

    //#when - scaffold again
    const result = scaffoldProject({ directory: TEST_DIR })

    //#then - files skipped, not overwritten
    expect(result.skipped.length).toBeGreaterThan(0)
    expect(result.created.length).toBe(0)
  })

  test("overwrites existing files with force flag", () => {
    //#given - already scaffolded
    scaffoldProject({ directory: TEST_DIR })

    //#when - scaffold with force
    const result = scaffoldProject({ directory: TEST_DIR, force: true })

    //#then - files are overwritten (created includes file entries)
    const fileEntries = result.created.filter(p => p.endsWith(".md") || p.endsWith(".gitkeep"))
    expect(fileEntries.length).toBeGreaterThan(0)
  })

  test("returns created paths", () => {
    //#given - empty project directory

    //#when
    const result = scaffoldProject({ directory: TEST_DIR })

    //#then
    expect(result.created.length).toBeGreaterThan(0)
    expect(result.errors).toHaveLength(0)
  })
})

describe("isProjectScaffolded", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("returns false for empty directory", () => {
    expect(isProjectScaffolded(TEST_DIR)).toBe(false)
  })

  test("returns true after scaffolding", () => {
    scaffoldProject({ directory: TEST_DIR })
    expect(isProjectScaffolded(TEST_DIR)).toBe(true)
  })

  test("returns true with project config (.opencode/kord-aios.json) without full scaffold", () => {
    //#given - project config as baseline signal
    mkdirSync(join(TEST_DIR, ".opencode"), { recursive: true })
    writeFileSync(join(TEST_DIR, ".opencode", "kord-aios.json"), "{}")

    //#when
    const result = isProjectScaffolded(TEST_DIR)

    //#then
    expect(result).toBe(true)
  })

  test("returns false without project config or full scaffold", () => {
    //#given - neither project config nor full scaffold
    // Empty directory

    //#when
    const result = isProjectScaffolded(TEST_DIR)

    //#then
    expect(result).toBe(false)
  })
})

describe("project-type instruction generation", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("exports greenfield.md only when projectMode is new", () => {
    //#given - empty project directory
    //#when - scaffold with projectMode = "new"
    scaffoldProject({ directory: TEST_DIR, projectMode: "new" })

    //#then
    const greenfieldPath = join(TEST_DIR, ".kord", "instructions", "greenfield.md")
    const brownfieldPath = join(TEST_DIR, ".kord", "instructions", "brownfield.md")
    const projectModePath = join(TEST_DIR, ".kord", "rules", "project-mode.md")

    expect(existsSync(greenfieldPath)).toBe(true)
    expect(existsSync(brownfieldPath)).toBe(false)
    expect(existsSync(projectModePath)).toBe(false)

    const content = readFileSync(greenfieldPath, "utf-8")
    expect(content).toContain("## Who This Is For")
    expect(content).toContain("## Phases")
    expect(content).toContain("## Gates")
    expect(content).toContain("## Failure Modes")
  })

  test("exports brownfield.md only when projectMode is existing", () => {
    //#given - empty project directory
    //#when - scaffold with projectMode = "existing"
    scaffoldProject({ directory: TEST_DIR, projectMode: "existing" })

    //#then
    const greenfieldPath = join(TEST_DIR, ".kord", "instructions", "greenfield.md")
    const brownfieldPath = join(TEST_DIR, ".kord", "instructions", "brownfield.md")
    const projectModePath = join(TEST_DIR, ".kord", "rules", "project-mode.md")

    expect(existsSync(greenfieldPath)).toBe(false)
    expect(existsSync(brownfieldPath)).toBe(true)
    expect(existsSync(projectModePath)).toBe(false)

    const content = readFileSync(brownfieldPath, "utf-8")
    expect(content).toContain("## Safety First")
    expect(content).toContain("## Baseline Gates")
    expect(content).toContain("## What Not To Do")
  })

  test("defaults to brownfield.md when projectMode is not specified", () => {
    //#given - empty project directory
    //#when - scaffold without projectMode
    scaffoldProject({ directory: TEST_DIR })

    //#then
    const greenfieldPath = join(TEST_DIR, ".kord", "instructions", "greenfield.md")
    const brownfieldPath = join(TEST_DIR, ".kord", "instructions", "brownfield.md")
    expect(existsSync(greenfieldPath)).toBe(false)
    expect(existsSync(brownfieldPath)).toBe(true)
  })
})
