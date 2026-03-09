import { describe, expect, test } from "bun:test"
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { buildWorkflowAliasTemplate, executeWorkflowCommand } from "./engine"

describe("workflow-engine", () => {
  test("lists builtin workflows", () => {
    const directory = process.cwd()

    const message = executeWorkflowCommand({
      directory,
      sessionID: "session-1",
      rawArgs: "list",
    })

    expect(message).toContain("greenfield-fullstack")
    expect(message).toContain("brownfield-discovery")
  })

  test("starts workflow and writes run state", () => {
    const directory = join(tmpdir(), `workflow-engine-${randomUUID()}`)

    const started = executeWorkflowCommand({
      directory,
      sessionID: "session-start",
      rawArgs: "greenfield-fullstack",
    })

    expect(started).toContain("started")
    const runPathMatch = started.match(/State:\s*(.+)$/m)
    expect(runPathMatch).not.toBeNull()
    const runPath = runPathMatch![1]
    expect(existsSync(runPath)).toBe(true)

    const state = JSON.parse(readFileSync(runPath, "utf-8")) as {
      workflow_id: string
      current_step_id?: string
      status: string
    }

    expect(state.workflow_id).toBe("greenfield-fullstack")
    expect(state.current_step_id).toBe("step-1")
    expect(state.status).toBe("running")

    rmSync(directory, { recursive: true, force: true })
  })

  test("create command scaffolds workflow and alias files", () => {
    const directory = join(tmpdir(), `workflow-create-${randomUUID()}`)

    const result = executeWorkflowCommand({
      directory,
      sessionID: "session-create",
      rawArgs: "create ads-analysis",
    })

    expect(result).toContain("Scaffolded workflow")
    expect(existsSync(join(directory, ".kord", "workflows", "ads-analysis.yaml"))).toBe(true)
    expect(existsSync(join(directory, ".opencode", "command", "ads-analysis.md"))).toBe(true)

    rmSync(directory, { recursive: true, force: true })
  })

  test("import synkra writes project workflow and adaptation report", () => {
    const directory = join(tmpdir(), `workflow-import-${randomUUID()}`)

    const result = executeWorkflowCommand({
      directory,
      sessionID: "session-import",
      rawArgs: "import synkra greenfield-fullstack",
    })

    expect(result).toContain("Imported 1 Synkra workflow")
    const workflowMatch = result.match(/workflow='([^']+greenfield-fullstack\.yaml)'/)
    const reportMatch = result.match(/report='([^']+import-report-greenfield-fullstack\.md)'/)
    expect(workflowMatch).not.toBeNull()
    expect(reportMatch).not.toBeNull()
    expect(existsSync(workflowMatch![1])).toBe(true)
    expect(existsSync(reportMatch![1])).toBe(true)
    expect(workflowMatch![1]).toContain(join(".kord", "workflows"))
    expect(reportMatch![1]).toContain(join("docs", "kord", "workflows"))

    const imported = readFileSync(workflowMatch![1], "utf-8")
    expect(imported).toContain("id: greenfield-fullstack")
    expect(imported).toContain("raw_workflow")
    expect(imported).toContain("project_types")
    expect(imported).toContain("decision_guidance")

    const report = readFileSync(reportMatch![1], "utf-8")
    expect(report).toContain("## Unchanged Fields")
    expect(report).toContain("## Kord-Specific Substitutions")
    expect(report).toContain("## Unsupported Constructs")
    expect(report).toContain("## Handling Notes")

    rmSync(directory, { recursive: true, force: true })
  })

  test("buildWorkflowAliasTemplate emits workflow tags", () => {
    const template = buildWorkflowAliasTemplate("greenfield-fullstack", "continue")
    expect(template).toContain("<workflow-context>")
    expect(template).toContain("<workflow-id>greenfield-fullstack</workflow-id>")
    expect(template).toContain("<user-request>")
  })

  test("loads squad package workflows and supports namespaced alias", () => {
    const directory = join(tmpdir(), `workflow-squad-${randomUUID()}`)
    const squadDir = join(directory, ".kord", "squads", "marketing")
    const workflowDir = join(squadDir, "workflows")
    mkdirSync(workflowDir, { recursive: true })

    writeFileSync(join(squadDir, "SQUAD.yaml"), `
name: marketing
description: Marketing squad
agents:
  chief:
    description: "Chief"
    is_chief: true
components:
  workflows:
    - workflows/marketing-campaign.yaml
orchestration:
  runner: workflow-engine
  delegation_mode: chief
  entry_workflow: marketing-campaign
`)

    writeFileSync(join(workflowDir, "marketing-campaign.yaml"), `schema_version: "1"
workflow:
  id: marketing-campaign
  name: marketing-campaign
  version: "1.0.0"
  type: squad
  runner_agent: squad-marketing-chief
sequence:
  - id: kickoff
    intent: interview
`)

    const list = executeWorkflowCommand({
      directory,
      sessionID: "session-list",
      rawArgs: "list",
    })

    expect(list).toContain("marketing-campaign")

    const namespacedStart = executeWorkflowCommand({
      directory,
      sessionID: "session-start",
      rawArgs: "marketing:marketing-campaign",
    })

    expect(namespacedStart).toContain("Workflow 'marketing:marketing-campaign' started")

    rmSync(directory, { recursive: true, force: true })
  })

  test("alias workflow id starts workflow without recursion", () => {
    const directory = join(tmpdir(), `workflow-alias-start-${randomUUID()}`)

    const started = executeWorkflowCommand({
      directory,
      sessionID: "session-alias-start",
      rawArgs: "",
      aliasWorkflowId: "greenfield-fullstack",
    })

    expect(started).toContain("Workflow 'greenfield-fullstack' started")

    rmSync(directory, { recursive: true, force: true })
  })

  test("alias workflow status and continue route deterministically to alias id", () => {
    const directory = join(tmpdir(), `workflow-alias-route-${randomUUID()}`)

    executeWorkflowCommand({
      directory,
      sessionID: "session-alias-seed",
      rawArgs: "",
      aliasWorkflowId: "greenfield-fullstack",
    })

    const status = executeWorkflowCommand({
      directory,
      sessionID: "session-alias-status",
      rawArgs: "status",
      aliasWorkflowId: "greenfield-fullstack",
    })

    expect(status).toContain("Workflow: greenfield-fullstack")

    const continued = executeWorkflowCommand({
      directory,
      sessionID: "session-alias-continue",
      rawArgs: "continue",
      aliasWorkflowId: "greenfield-fullstack",
    })

    expect(continued).toContain("Workflow 'greenfield-fullstack' continued")

    rmSync(directory, { recursive: true, force: true })
  })

  test("alias target actions ignore explicit workflow target overrides", () => {
    const directory = join(tmpdir(), `workflow-alias-override-${randomUUID()}`)

    executeWorkflowCommand({
      directory,
      sessionID: "session-alias-seed-main",
      rawArgs: "",
      aliasWorkflowId: "greenfield-fullstack",
    })

    executeWorkflowCommand({
      directory,
      sessionID: "session-alias-seed-other",
      rawArgs: "brownfield-discovery",
    })

    const status = executeWorkflowCommand({
      directory,
      sessionID: "session-alias-status-override",
      rawArgs: "status brownfield-discovery",
      aliasWorkflowId: "greenfield-fullstack",
    })

    expect(status).toContain("Workflow: greenfield-fullstack")

    rmSync(directory, { recursive: true, force: true })
  })

  test("imports synkra workflow by id and generates adaptation report", () => {
    const directory = join(tmpdir(), `workflow-import-id-${randomUUID()}`)
    const synkraCatalog = join(directory, "synkra-catalog")
    mkdirSync(synkraCatalog, { recursive: true })

    writeFileSync(
      join(synkraCatalog, "example-rich.yaml"),
      `workflow:
  id: example-rich
  name: Example Rich Workflow
  version: "2.0"
  description: Rich Synkra workflow
  metadata:
    elicit: true
  sequence:
    - phase: 1
      name: Discovery
      description: Discovery phase
    - id: gather
      agent: analyst
      action: gather_context
      creates:
        - docs/context.md
      notes: Collect project context.
      condition: project_ready
    - step: validate_gate
      phase: 2
      agent: qa
      validates: context
      requires:
        - docs/context.md
      notes: Validate collected context.
`,
      "utf-8",
    )

    const previousCatalog = process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = synkraCatalog

    const result = executeWorkflowCommand({
      directory,
      sessionID: "session-import-id",
      rawArgs: "import synkra example-rich",
    })

    expect(result).toContain("Imported 1 Synkra workflow")

    const workflowMatch = result.match(/workflow='([^']+example-rich\.yaml)'/)
    const reportMatch = result.match(/report='([^']+import-report-example-rich\.md)'/)
    expect(workflowMatch).not.toBeNull()
    expect(reportMatch).not.toBeNull()

    const importedWorkflowPath = workflowMatch![1]
    const reportPath = reportMatch![1]
    expect(existsSync(importedWorkflowPath)).toBe(true)
    expect(existsSync(reportPath)).toBe(true)

    const imported = readFileSync(importedWorkflowPath, "utf-8")
    expect(imported).toContain("schema_version:")
    expect(imported).toContain("id: example-rich")
    expect(imported).toContain("notes: Collect project context.")
    expect(imported).toContain("source_step")
    expect(imported).toContain("raw_workflow")

    const report = readFileSync(reportPath, "utf-8")
    expect(report).toContain("## Unchanged Fields")
    expect(report).toContain("## Kord-Specific Substitutions")
    expect(report).toContain("## Unsupported Constructs")
    expect(report).toContain("## Handling Notes")
    expect(report).toContain("condition")

    if (previousCatalog === undefined) {
      delete process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    } else {
      process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = previousCatalog
    }
    rmSync(directory, { recursive: true, force: true })
  })

  test("imports synkra workflow by workflow.id even when filename differs", () => {
    const directory = join(tmpdir(), `workflow-import-by-id-${randomUUID()}`)
    const synkraCatalog = join(directory, "catalog")
    mkdirSync(synkraCatalog, { recursive: true })

    writeFileSync(
      join(synkraCatalog, "legacy-name.yaml"),
      `workflow:
  id: canonical-rich-id
  name: Canonical Rich Workflow
  version: "1.0"
  type: development
  sequence:
    - id: kickoff
      agent: analyst
      notes: Preserve this note.
      creates:
        - docs/output.md
`,
      "utf-8",
    )

    const previousCatalog = process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = synkraCatalog

    const result = executeWorkflowCommand({
      directory,
      sessionID: "session-import-by-id",
      rawArgs: "import synkra canonical-rich-id",
    })

    expect(result).toContain("Imported 1 Synkra workflow")
    const workflowMatch = result.match(/workflow='([^']+canonical-rich-id\.yaml)'/)
    const reportMatch = result.match(/report='([^']+import-report-canonical-rich-id\.md)'/)
    expect(workflowMatch).not.toBeNull()
    expect(reportMatch).not.toBeNull()
    expect(existsSync(workflowMatch![1])).toBe(true)
    expect(existsSync(reportMatch![1])).toBe(true)

    const imported = readFileSync(workflowMatch![1], "utf-8")
    expect(imported).toContain("id: canonical-rich-id")
    expect(imported).toContain("raw_workflow")
    expect(imported).toContain("notes: Preserve this note.")

    const report = readFileSync(reportMatch![1], "utf-8")
    expect(report).toContain("## Unchanged Fields")
    expect(report).toContain("## Kord-Specific Substitutions")
    expect(report).toContain("## Unsupported Constructs")
    expect(report).toContain("## Handling Notes")

    if (previousCatalog === undefined) {
      delete process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    } else {
      process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = previousCatalog
    }

    rmSync(directory, { recursive: true, force: true })
  })

  test("imports all synkra workflows from configured catalog with adaptation reports", () => {
    const directory = join(tmpdir(), `workflow-import-all-${randomUUID()}`)
    const synkraCatalog = join(directory, "catalog")
    mkdirSync(synkraCatalog, { recursive: true })

    writeFileSync(
      join(synkraCatalog, "a.yaml"),
      `workflow:
  id: greenfield-fullstack
  name: Greenfield Fullstack
  version: "1.0"
  project_types:
    - web-app
  phases:
    - phase_1: Discovery
  flow_diagram: |
    graph TD
      A --> B
  decision_guidance:
    when_to_use:
      - complex projects
  handoff_prompts:
    phase1_to_phase2: Continue to phase 2
  triggers:
    - manual
  config:
    runtime: orchestrated
  sequence:
    - id: kickoff
      agent: analyst
      creates: docs/a.md
      notes: Keep context rich.
`,
      "utf-8",
    )

    writeFileSync(
      join(synkraCatalog, "b.yaml"),
      `workflow:
  id: brownfield-discovery
  name: Brownfield Discovery
  version: "2.0"
  completion:
    criterion: all findings captured
  error_handling:
    retryable: true
  sequence:
    - step: system_documentation
      phase_name: Kickoff
      action: collect
      notes: Gather details.
      delegates_to:
        - architect
      repeats: for_each_component
    - meta: repeat
      target_steps:
        - system_documentation
`,
      "utf-8",
    )

    const previousCatalog = process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = synkraCatalog

    const result = executeWorkflowCommand({
      directory,
      sessionID: "session-import-all",
      rawArgs: "import synkra all",
    })

    expect(result).toContain("Imported 2 Synkra workflow")
    const importLines = result
      .split("\n")
      .filter((line) => line.startsWith("- "))
    expect(importLines[0]).toContain("brownfield-discovery")
    expect(importLines[1]).toContain("greenfield-fullstack")
    const workflowAMatch = result.match(/workflow='([^']+greenfield-fullstack\.yaml)'/)
    const workflowBMatch = result.match(/workflow='([^']+brownfield-discovery\.yaml)'/)
    const reportAMatch = result.match(/report='([^']+import-report-greenfield-fullstack\.md)'/)
    const reportBMatch = result.match(/report='([^']+import-report-brownfield-discovery\.md)'/)
    expect(workflowAMatch).not.toBeNull()
    expect(workflowBMatch).not.toBeNull()
    expect(reportAMatch).not.toBeNull()
    expect(reportBMatch).not.toBeNull()
    expect(existsSync(workflowAMatch![1])).toBe(true)
    expect(existsSync(workflowBMatch![1])).toBe(true)
    expect(existsSync(reportAMatch![1])).toBe(true)
    expect(existsSync(reportBMatch![1])).toBe(true)

    const importedGreenfield = readFileSync(workflowAMatch![1], "utf-8")
    expect(importedGreenfield).toContain("id: greenfield-fullstack")
    expect(importedGreenfield).toContain("raw_workflow")
    expect(importedGreenfield).toContain("flow_diagram")
    expect(importedGreenfield).toContain("decision_guidance")
    expect(importedGreenfield).toContain("handoff_prompts")

    const importedBrownfield = readFileSync(workflowBMatch![1], "utf-8")
    expect(importedBrownfield).toContain("id: brownfield-discovery")
    expect(importedBrownfield).toContain("source_step")
    expect(importedBrownfield).toContain("delegates_to")
    expect(importedBrownfield).toContain("repeats")

    const reportGreenfield = readFileSync(reportAMatch![1], "utf-8")
    expect(reportGreenfield).toContain("## Unchanged Fields")
    expect(reportGreenfield).toContain("## Kord-Specific Substitutions")
    expect(reportGreenfield).toContain("## Unsupported Constructs")
    expect(reportGreenfield).toContain("## Handling Notes")

    const reportBrownfield = readFileSync(reportBMatch![1], "utf-8")
    expect(reportBrownfield).toContain("delegates_to")
    expect(reportBrownfield).toContain("repeats")
    expect(reportBrownfield).toContain("runtime execution support is not implemented")

    if (previousCatalog === undefined) {
      delete process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    } else {
      process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = previousCatalog
    }

    rmSync(directory, { recursive: true, force: true })
  })

  test("imports real synkra workflow pair and writes workflow/report artifacts", () => {
    const directory = join(tmpdir(), `workflow-import-real-synkra-${randomUUID()}`)
    const synkraCatalog = join(directory, "catalog")
    mkdirSync(synkraCatalog, { recursive: true })

    const synkraRoot =
      process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR ?? "D:/dev/synkra-aios/.aios-core/development/workflows"
    const greenfieldSource = join(synkraRoot, "greenfield-fullstack.yaml")
    const brownfieldSource = join(synkraRoot, "brownfield-discovery.yaml")

    if (!existsSync(greenfieldSource) || !existsSync(brownfieldSource)) {
      rmSync(directory, { recursive: true, force: true })
      return
    }

    copyFileSync(greenfieldSource, join(synkraCatalog, "greenfield-fullstack.yaml"))
    copyFileSync(brownfieldSource, join(synkraCatalog, "brownfield-discovery.yaml"))

    const previousCatalog = process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = synkraCatalog

    try {
      const result = executeWorkflowCommand({
        directory,
        sessionID: "session-import-real-synkra",
        rawArgs: "import synkra all",
      })

      expect(result).toContain("Imported 2 Synkra workflow")
      const workflowGreenfieldMatch = result.match(/workflow='([^']+greenfield-fullstack\.yaml)'/)
      const workflowBrownfieldMatch = result.match(/workflow='([^']+brownfield-discovery\.yaml)'/)
      const reportGreenfieldMatch = result.match(/report='([^']+import-report-greenfield-fullstack\.md)'/)
      const reportBrownfieldMatch = result.match(/report='([^']+import-report-brownfield-discovery\.md)'/)

      expect(workflowGreenfieldMatch).not.toBeNull()
      expect(workflowBrownfieldMatch).not.toBeNull()
      expect(reportGreenfieldMatch).not.toBeNull()
      expect(reportBrownfieldMatch).not.toBeNull()
      expect(workflowGreenfieldMatch![1]).toContain(join(directory, ".kord", "workflows"))
      expect(workflowBrownfieldMatch![1]).toContain(join(directory, ".kord", "workflows"))
      expect(reportGreenfieldMatch![1]).toContain(join(directory, "docs", "kord", "workflows"))
      expect(reportBrownfieldMatch![1]).toContain(join(directory, "docs", "kord", "workflows"))
      expect(existsSync(workflowGreenfieldMatch![1])).toBe(true)
      expect(existsSync(workflowBrownfieldMatch![1])).toBe(true)
      expect(existsSync(reportGreenfieldMatch![1])).toBe(true)
      expect(existsSync(reportBrownfieldMatch![1])).toBe(true)

      const importedGreenfield = readFileSync(workflowGreenfieldMatch![1], "utf-8")
      expect(importedGreenfield).toContain("id: greenfield-fullstack")
      expect(importedGreenfield).toContain("raw_workflow")
      expect(importedGreenfield).toContain("decision_guidance")
      expect(importedGreenfield).toContain("handoff_prompts")

      const importedBrownfield = readFileSync(workflowBrownfieldMatch![1], "utf-8")
      expect(importedBrownfield).toContain("id: brownfield-discovery")
      expect(importedBrownfield).toContain("source_step")

      const reportGreenfield = readFileSync(reportGreenfieldMatch![1], "utf-8")
      expect(reportGreenfield).toContain("## Unchanged Fields")
      expect(reportGreenfield).toContain("workflow.flow_diagram")

      const reportBrownfield = readFileSync(reportBrownfieldMatch![1], "utf-8")
      expect(reportBrownfield).toContain("## Unsupported Constructs")
      expect(reportBrownfield).toContain("runtime execution support is not implemented")
    } finally {
      if (previousCatalog === undefined) {
        delete process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
      } else {
        process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = previousCatalog
      }

      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("import synkra all skips non-workflow yaml and preserves raw source document", () => {
    const directory = join(tmpdir(), `workflow-import-all-filtered-${randomUUID()}`)
    const synkraCatalog = join(directory, "catalog")
    mkdirSync(synkraCatalog, { recursive: true })

    writeFileSync(
      join(synkraCatalog, "workflow-a.yaml"),
      `workflow:
  id: source-rich
  name: Source Rich Workflow
  version: "1.0"
  metadata:
    elicit: true
  sequence:
    - id: kickoff
      notes: Preserve this note.
`,
      "utf-8",
    )

    writeFileSync(
      join(synkraCatalog, "not-a-workflow.yaml"),
      `name: plain-config
kind: helper
value: true
`,
      "utf-8",
    )

    const previousCatalog = process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = synkraCatalog

    const result = executeWorkflowCommand({
      directory,
      sessionID: "session-import-all-filtered",
      rawArgs: "import synkra all",
    })

    expect(result).toContain("Imported 1 Synkra workflow")
    expect(result).toContain("source-rich")
    expect(result).not.toContain("not-a-workflow")

    const workflowMatch = result.match(/workflow='([^']+source-rich\.yaml)'/)
    const reportMatch = result.match(/report='([^']+import-report-source-rich\.md)'/)
    expect(workflowMatch).not.toBeNull()
    expect(reportMatch).not.toBeNull()
    expect(existsSync(workflowMatch![1])).toBe(true)
    expect(existsSync(reportMatch![1])).toBe(true)

    const imported = readFileSync(workflowMatch![1], "utf-8")
    expect(imported).toContain("raw_document")
    expect(imported).toContain("raw_workflow")

    const report = readFileSync(reportMatch![1], "utf-8")
    expect(report).toContain("raw_document")
    expect(report).toContain("Kord-Specific Substitutions")

    if (previousCatalog === undefined) {
      delete process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    } else {
      process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = previousCatalog
    }

    rmSync(directory, { recursive: true, force: true })
  })

  test("import synkra all deduplicates duplicate workflow ids deterministically", () => {
    const directory = join(tmpdir(), `workflow-import-all-dedupe-${randomUUID()}`)
    const synkraCatalog = join(directory, "catalog")
    mkdirSync(synkraCatalog, { recursive: true })

    writeFileSync(
      join(synkraCatalog, "a-first.yaml"),
      `workflow:
  id: duplicate-id
  name: First Duplicate
  version: "1.0"
  sequence:
    - id: kickoff
      notes: Keep first file.
`,
      "utf-8",
    )

    writeFileSync(
      join(synkraCatalog, "z-second.yaml"),
      `workflow:
  id: duplicate-id
  name: Second Duplicate
  version: "1.0"
  sequence:
    - id: kickoff
      notes: Should be skipped.
`,
      "utf-8",
    )

    const previousCatalog = process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = synkraCatalog

    const result = executeWorkflowCommand({
      directory,
      sessionID: "session-import-all-dedupe",
      rawArgs: "import synkra all",
    })

    expect(result).toContain("Imported 1 Synkra workflow")
    expect(result).toContain("NOTICE: Skipped duplicate workflow.id entries")

    const workflowMatch = result.match(/workflow='([^']+duplicate-id\.yaml)'/)
    expect(workflowMatch).not.toBeNull()

    const imported = readFileSync(workflowMatch![1], "utf-8")
    expect(imported).toContain("Keep first file.")
    expect(imported).not.toContain("Should be skipped.")

    if (previousCatalog === undefined) {
      delete process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR
    } else {
      process.env.KORD_SYNKRA_WORKFLOW_CATALOG_DIR = previousCatalog
    }

    rmSync(directory, { recursive: true, force: true })
  })

  test("import synkra requires workflow id or all", () => {
    const directory = join(tmpdir(), `workflow-import-usage-${randomUUID()}`)

    const result = executeWorkflowCommand({
      directory,
      sessionID: "session-import-usage",
      rawArgs: "import synkra",
    })

    expect(result).toBe("Usage: /workflow import synkra <workflow-id|all>")

    rmSync(directory, { recursive: true, force: true })
  })

  test("import synkra rejects non-workflow-id target", () => {
    const directory = join(tmpdir(), `workflow-import-invalid-${randomUUID()}`)

    const result = executeWorkflowCommand({
      directory,
      sessionID: "session-import-invalid",
      rawArgs: "import synkra ../greenfield-fullstack.yaml",
    })

    expect(result).toBe("Usage: /workflow import synkra <workflow-id|all>")

    rmSync(directory, { recursive: true, force: true })
  })
})
