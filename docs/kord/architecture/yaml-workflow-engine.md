# Synkra-Style YAML Workflows in Kord AIOS (Native Engine Proposal)

> Status: Proposal
> Owner: @architect
> Last updated: 2026-03-06

## Bottom line

Kord should add a native YAML workflow runner (state machine) and reuse `docs/kord/boulder.json` only as the *resume pointer* and high-level progress ledger. A workflow-to-plan compiler is still useful as an onboarding bridge and for “documentation mode”, but it cannot be the primary execution path if we must support interviews, parallelism, conditions, and strict step ordering.

## Core design

### Storage locations

- **Workflow definitions (project)**: `.kord/workflows/*.yaml`
- **Workflow definitions (legacy import, optional read-only)**: `.aios-core/development/workflows/*.yaml`
- **Workflow run state (persistent, resumable)**:
  - `docs/kord/boulder.json` (pointer + summary only)
  - `docs/kord/workflow-runs/<run-id>.json` (full run state)
- **Workflow-produced artifacts**: remain in their natural homes (e.g. `docs/kord/plans/`, `docs/kord/adrs/`, `docs/kord/architecture/`, `docs/stories/`), referenced by the workflow step `requires`/`produces` fields.

Rationale:

- `.kord/` is the canonical “project config” space (analogous to `.kord/rules/`), while `docs/kord/` holds durable methodology artifacts and resumable state.
- Keeping the full run state out of `docs/kord/boulder.json` reduces churn/merge conflicts and avoids schema lock-in for Boulder.

### State format

`docs/kord/workflow-runs/<run-id>.json` is the canonical workflow execution record.

Minimum fields (v1):

```json
{
  "version": 1,
  "runId": "wf_2026-03-06_123456",
  "workflow": { "name": "greenfield-fullstack", "sourcePath": ".kord/workflows/greenfield-fullstack.yaml" },
  "status": "running",
  "createdAt": "2026-03-06T00:00:00Z",
  "updatedAt": "2026-03-06T00:00:00Z",
  "current": { "stepId": "S3", "path": ["S1", "S2", "S3"] },
  "steps": {
    "S1": { "status": "completed", "attempts": 1, "startedAt": "...", "endedAt": "..." },
    "S2": { "status": "blocked", "reason": "awaiting_user_input" },
    "S3": { "status": "pending" }
  },
  "artifacts": {
    "known": ["docs/kord/plans/plan.md"],
    "checks": [{ "type": "exists", "path": "docs/kord/plans/plan.md", "ok": true }]
  },
  "dispatch": {
    "tasks": [{ "stepId": "S1", "taskId": "task_abc", "agent": "pm", "status": "completed" }]
  }
}
```

`docs/kord/boulder.json` gets only:

- `workflow.activeRunId` (or a general `execution.active` pointer if Boulder already abstracts this)
- `workflow.lastRunSummary` (optional: name, updatedAt, status)

### Commands (user-facing)

Introduce a workflow command family (names illustrative):

- `/workflow list` (discover `.kord/workflows/*.yaml`)
- `/workflow validate <name|path>` (schema + static checks)
- `/workflow start <name|path> [--resume] [--from <stepId>]`
- `/workflow status` (active run)
- `/workflow resume` (continue active run)
- `/workflow cancel` (mark run cancelled; do not delete artifacts)
- `/workflow import synkra` (copy/convert from `.aios-core/...`)

Non-goal (v1): arbitrary shell execution steps. Any “run tests/build” remains a delegated agent action (so Kord’s safety gates stay centralized).

## Step execution model

### Workflow definition schema (YAML)

Keep a tight, deterministic v1 schema to avoid “YAML as a programming language”.

Top-level:

- `version`: `1`
- `name`: string
- `description`: string (optional)
- `inputs`: list of named inputs (optional)
- `steps`: array of steps (must have stable `id`)

Step types (v1):

1. `prompt` (user interaction)
   - Blocks until the user explicitly answers; writes answers into run state.
2. `agent` (delegated subagent execution)
   - Dispatches `task()` or foreground agent call with a specified `agent` and `prompt`.
3. `parallel` (fan-out/fan-in)
   - Contains `steps: [...]` executed concurrently with a `maxConcurrency` cap.
4. `gate` (validation)
   - Deterministic checks: `exists`, `globCount`, `jsonSchema`, `markdownChecklist`.
5. `decision` (branching)
   - Deterministic boolean expression over `inputs`, prior `prompt` answers, and `gate` results.

Common step fields:

- `id`: string (unique)
- `name`: string
- `when`: expression (optional; default true)
- `requires`: artifact checks (optional)
- `produces`: artifact hints (optional; for reporting)
- `onFail`: `stop | retry | continue` (default `stop`)

### Parallel groups

- `parallel` steps execute children concurrently via the existing background-task subsystem.
- Join behavior: default `all` (the group completes only when all children succeed); optional `any` is possible but should be avoided in v1 unless required.
- Persist child task IDs in `docs/kord/workflow-runs/<run-id>.json` so `/workflow resume` can reattach and continue without re-running completed children.

### Conditions

Conditions must be deterministic and sandboxed:

- Expressions should be limited to a small grammar (e.g. `and/or/not`, `eq`, `exists(path)`, `answered(stepId, key)`), *not* JS `eval`.
- Only allow reading from:
  - workflow inputs
  - previous `prompt` answers captured into state
  - `gate` results

### Required artifacts

Each step can declare `requires` checks. A step cannot execute unless its `requires` checks pass (or `onFail: continue` is explicitly set).

Recommended check types:

- `exists`: specific file path exists
- `globCount`: min/max matching files
- `markdownChecklist`: target file satisfies an explicit checklist file (deterministic)

This mirrors Synkra’s “validate outputs” while fitting Kord’s artifact-first pipeline.

## Agent dispatch integration

### Who runs the engine

The workflow runner should be orchestrated by the top-level Kord orchestrator (not by individual specialist agents), because it must:

- enforce step ordering (no skipping)
- maintain durable state across sessions
- coordinate parallel dispatch and join
- own the UI/UX loop with the user (prompts, confirmations)

### How steps map to Kord execution primitives

- `agent` step → dispatch via `task()` with an explicit `subagent_type` (or explicit agent name), capturing the returned `task_id` into run state.
- `prompt` step → handled in the primary session; the engine asks the user and records the answer.
- “agent switching” is modeled as choosing the agent per-step; do not rely on changing the primary session agent.

Recommended agent selection rule (v1):

- If the step declares `agent`, use it.
- Else if the step declares `category`, use Kord’s delegation routing.
- Else default to `dev` (implementation) or `planner/pm` (planning) based on workflow metadata.

## Validation strategy

### Static validation (`/workflow validate`)

Validate before starting:

- YAML schema validation (version, required fields, supported step types)
- Referential integrity (unique step IDs; `decision` targets exist)
- Forbidden constructs (no embedded scripts; no absolute paths in artifact checks)
- Safety checks for artifact patterns (reject `..`, drive letters, root globs)

### Runtime validation

- Before executing a step: evaluate `when`, then `requires`.
- After executing a step: run `produces` checks if present (or a step-local `gate`).
- On resume: re-hydrate in-flight tasks via stored task IDs; if a task is missing, mark the step `failed` with reason `lost_task` and apply `onFail`.

## Migration path from Synkra YAML

### Loader behavior

Support both layouts:

1. Canonical: `.kord/workflows/*.yaml`
2. Legacy read-only: `.aios-core/development/workflows/*.yaml`

`/workflow list` should show both, but prefer the canonical location when names collide.

### Converter (`/workflow import synkra`)

Create `.kord/workflows/<name>.yaml` by translating Synkra fields into the Kord v1 schema:

- Synkra “preActions/setup dirs” → Kord `gate` + `agent` steps (explicit; no implicit filesystem side effects)
- Synkra “dispatch subagents” → Kord `agent` steps
- Synkra “validate outputs” → Kord `gate` steps
- Synkra “conditions” → Kord `decision` / `when`

If Synkra workflows rely on features not in Kord v1 (e.g. arbitrary code evaluation), import should fail with a precise error and a suggested manual rewrite.

## Approach comparison

### A) Workflow-to-Plan compiler + boulder-driven execution

Pros:

- Reuses existing `docs/kord/plans/*.md` + `/start-work` mechanics immediately.
- Easy for humans to read and edit.

Cons (material):

- Hard to represent true parallelism and joins without losing determinism.
- Conditions become “agent judgment calls” inside markdown, which can drift and skip.
- Interviews/brainstorm steps collapse into freeform plan sections; enforcing “must not skip” is brittle.

Best use: “documentation mode” and a short bootstrap while the native runner is built.

### B) Native workflow runner/state machine

Pros:

- Enforces step ordering and explicit completion semantics (including user-input gates).
- First-class parallel groups, conditions, retries, and resumable in-flight tasks.
- Matches user preference: an engine, not a one-shot compilation.

Cons:

- Higher implementation complexity; requires a stable workflow schema and state migration story.
- Requires careful UX so users understand what is happening during parallel execution.

Best use: primary execution path.

## Recommended phased approach

Phase 1 (bootstrap):

- Implement workflow YAML schema + validator + importer.
- Provide a “guided runner” that executes sequential `prompt` and `agent` steps only, with durable run state.

Phase 2 (engine):

- Add `parallel`, `gate`, and `decision` support.
- Add robust resume (reattach tasks; handle lost tasks deterministically).

Phase 3 (unification):

- Add an optional “export to plan” view (`docs/kord/plans/<workflow-run>.md`) for auditability.
- Share common primitives between plan execution and workflow execution (same resume UX, same status reporting).

## Risks / trade-offs

- **State drift**: if artifacts change outside the engine, `requires` checks can flip; mitigate via re-checking on resume and surfacing a clear “needs re-run” prompt.
- **Over-flexible YAML**: avoid embedding code; keep expressions and validations deterministic.
- **Concurrency surprises**: parallel steps can saturate models/providers; enforce `maxConcurrency` and reuse existing background task concurrency limits.

## Escalation triggers (when to revisit v1 design)

- Cross-workflow dependencies and reuse (workflow libraries/modules) become necessary.
- Workflows need long-lived “waiting” states (days) with notification/webhook triggers.
- Teams demand auditable provenance for every artifact change (step-level file diffs).  
