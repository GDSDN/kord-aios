import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { WorkflowRunState, WorkflowStep } from "./types"

const WORKFLOW_DIR = join("docs", "kord", "workflows")
const RUNS_DIR = "runs"
const ACTIVE_RUN_FILE = "active-run.json"

function getWorkflowRoot(projectDir: string): string {
  return join(projectDir, WORKFLOW_DIR)
}

function getRunsDir(projectDir: string, workflowId: string): string {
  return join(getWorkflowRoot(projectDir), RUNS_DIR, workflowId)
}

function nowIso(): string {
  return new Date().toISOString()
}

export function createWorkflowRunState(workflowId: string, sessionID: string, steps: WorkflowStep[]): WorkflowRunState {
  const runId = `${Date.now()}`
  const startedAt = nowIso()
  return {
    run_id: runId,
    workflow_id: workflowId,
    started_at: startedAt,
    updated_at: startedAt,
    session_ids: [sessionID],
    status: "running",
    current_step_id: steps[0]?.id,
    action_required: steps[0]?.intent === "brainstorm" || steps[0]?.intent === "interview",
    action_summary: steps[0]
      ? `Current step: ${steps[0].id} (${steps[0].intent})`
      : "No actionable steps",
    steps: steps.map((step, index) => ({
      id: step.id,
      status: index === 0 ? "in_progress" : "pending",
      ...(index === 0 ? { started_at: startedAt } : {}),
    })),
    artifacts: {},
    decisions: [],
    user_inputs: [],
  }
}

export function writeWorkflowRunState(projectDir: string, state: WorkflowRunState): string {
  const runsDir = getRunsDir(projectDir, state.workflow_id)
  if (!existsSync(runsDir)) {
    mkdirSync(runsDir, { recursive: true })
  }

  const filePath = join(runsDir, `${state.run_id}.json`)
  writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8")

  const pointerPath = join(getWorkflowRoot(projectDir), ACTIVE_RUN_FILE)
  if (!existsSync(getWorkflowRoot(projectDir))) {
    mkdirSync(getWorkflowRoot(projectDir), { recursive: true })
  }
  writeFileSync(pointerPath, JSON.stringify({ workflow_id: state.workflow_id, run_id: state.run_id }, null, 2), "utf-8")
  return filePath
}

export function readWorkflowRunState(projectDir: string, workflowId: string, runId: string): WorkflowRunState | null {
  const runPath = join(getRunsDir(projectDir, workflowId), `${runId}.json`)
  if (!existsSync(runPath)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(runPath, "utf-8")) as WorkflowRunState
  } catch {
    return null
  }
}

export function readActiveWorkflowRun(projectDir: string): WorkflowRunState | null {
  const pointerPath = join(getWorkflowRoot(projectDir), ACTIVE_RUN_FILE)
  if (!existsSync(pointerPath)) {
    return null
  }

  try {
    const pointer = JSON.parse(readFileSync(pointerPath, "utf-8")) as {
      workflow_id?: string
      run_id?: string
    }
    if (!pointer.workflow_id || !pointer.run_id) {
      return null
    }
    return readWorkflowRunState(projectDir, pointer.workflow_id, pointer.run_id)
  } catch {
    return null
  }
}

export function getLatestWorkflowRun(projectDir: string, workflowId: string): WorkflowRunState | null {
  const runsDir = getRunsDir(projectDir, workflowId)
  if (!existsSync(runsDir)) {
    return null
  }

  const files = readdirSync(runsDir)
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => Number.parseInt(b.replace(".json", ""), 10) - Number.parseInt(a.replace(".json", ""), 10))

  const latest = files[0]
  if (!latest) {
    return null
  }

  return readWorkflowRunState(projectDir, workflowId, latest.replace(".json", ""))
}
