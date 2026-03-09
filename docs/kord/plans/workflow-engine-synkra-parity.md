# Workflow Engine with Synkra Parity

## TL;DR

> **Quick Summary**: Build a Kord-native workflow engine that imports and adapts Synkra workflows with maximum parity, preserving the real framework model: orchestrator-owned elicitation, JIT prompt assembly per step, deterministic workflow state, artifact dependency tracking, and repeatable command aliases.
>
> **Deliverables**:
> - Native workflow engine in Kord AIOS
> - Synkra workflow import/adaptation pipeline
> - Builtin workflow pack + project-local overrides
> - Per-workflow slash commands (`/greenfield-fullstack`, `/brownfield-discovery`, etc.)
> - Workflow authoring path (`/create-workflow` + templates + validator)

**Estimated Effort**: XL
**Parallel Execution**: YES - 4 waves
**Critical Path**: architecture/spec -> engine core -> command/runtime integration -> Synkra import/adaptation -> init/install + guides + authoring

---

## Context

### Objective

This is a **new platform feature** for Kord AIOS, not a docs tweak.

The goal is to import the Synkra workflow mental model into Kord with high fidelity, while adapting only the parts that must change because of Kord/OpenCode realities.

### What Must Be Preserved from Synkra

The value to preserve is not "YAML exists". The real framework model is:

- Orchestrator-owned elicitation for iterative steps
- JIT prompt assembly per step from referenced assets
- Deterministic workflow state and resume
- Explicit artifact flow via `requires` / `creates` / `updates`
- Multi-agent orchestration, including parallel fan-out/join
- Validation/gates between steps
- Workflow authoring as a first-class capability

### Evidence Base

Synkra workflow definitions and runtime:
- `D:\\dev\\synkra-aios\\.aios-core\\development\\workflows\\greenfield-fullstack.yaml`
- `D:\\dev\\synkra-aios\\.aios-core\\development\\workflows\\brownfield-discovery.yaml`
- 14 total workflows under `D:\\dev\\synkra-aios\\.aios-core\\development\\workflows\\*.yaml`
- `D:\\dev\\synkra-aios\\.aios-core\\development\\tasks\\run-workflow.md`
- `D:\\dev\\synkra-aios\\.aios-core\\development\\tasks\\run-workflow-engine.md`
- `D:\\dev\\synkra-aios\\.aios-core\\core\\orchestration\\workflow-orchestrator.js`
- `D:\\dev\\synkra-aios\\.aios-core\\core\\orchestration\\subagent-prompt-builder.js`
- `D:\\dev\\synkra-aios\\.aios-core\\core\\orchestration\\context-manager.js`
- `D:\\dev\\synkra-aios\\.aios-core\\development\\templates\\subagent-step-prompt.md`
- `D:\\dev\\synkra-aios\\.aios-core\\data\\workflow-state-schema.yaml`
- `D:\\dev\\synkra-aios\\.aios-core\\development\\tasks\\create-workflow.md`
- `D:\\dev\\synkra-aios\\.aios-core\\product\\templates\\workflow-template.yaml`

Kord/OpenCode realities:
- OpenCode has no native workflow engine; slash commands are prompt templates only.
- Kord subagents cannot ask user questions: `src/hooks/subagent-question-blocker/index.ts`
- `/start-work` already switches to `builder`: `src/hooks/start-work/index.ts`
- `builder` currently denies `task`: `src/agents/builder/index.ts`
- `kord` is the strongest orchestrator persona: `src/agents/kord/index.ts`
- Project commands can be scaffolded into `.opencode/command/*.md`: `src/features/claude-code-command-loader/loader.ts`

### Adaptation Decision

Preserve Synkra mental model, but adapt the runtime as follows:

- **Keep**: workflow YAML, step/phase semantics, stateful runs, importer, authoring path, prompt injection model
- **Adapt**: use `kord` as the default visible workflow runner instead of persona switching across steps
- **Reuse**: Kord boulder only as a lightweight pointer/summary, not as the workflow state engine itself
- **Replace**: Claude Code specific task UX with Kord-native command aliases + plugin runtime

---

## Work Objectives

### Core Objective

Ship a workflow engine that makes Synkra-style workflows a first-class executable feature in Kord, without reducing them to generic checklists or static guides.

### Concrete Deliverables

- Workflow YAML schema v1 for Kord
- Workflow validator
- Workflow registry/loader
- Workflow run state manager
- Workflow engine/runtime
- Command alias generation per workflow
- Synkra importer + adaptation reports
- Builtin workflow pack scaffolding into `.kord/workflows/`
- Workflow authoring template + command/skill

### Definition of Done

- At least the imported Synkra workflows can be registered, validated, and adapted into Kord format with explicit compatibility reports
- Interactive workflows run under `kord` with resumable state
- Per-workflow aliases work (`/greenfield-fullstack`, `/brownfield-discovery`, etc.)
- Workflow authoring path exists and can scaffold a new valid workflow

### Must NOT Have (Guardrails)

- Do NOT simplify Synkra workflows into generic prose or checklist-only prompts
- Do NOT embed unrestricted code execution in workflow YAML
- Do NOT bloat `.kord/rules/*` with runtime logic
- Do NOT rely on subagents for iterative user Q&A
- Do NOT collapse workflow runtime into boulder/plan runtime; they may integrate, but they are not the same system
- Do NOT import non-English workflow content into the Kord pack without translation to English
- Do NOT support workflow-to-plan compilation in v1 runtime scope
- Do NOT allow workflow alias names that collide with builtin commands

---

## Architecture Decisions

### Runner Persona

- Default visible workflow runner: `kord`
- Optional per-workflow override: `runner_agent` (only when a workflow is truly non-interactive)
- `builder` remains the plan executor for `/start-work`

### Interactive Step Model

The engine must support these step intents:

- `brainstorm`: iterative ideation in the main session
- `interview`: guided elicitation in the main session with workflow-defined gates
- `research`: internal delegation to `analyst` / `explore` / `librarian`
- `agent`: delegated execution by a specialist
- `parallel`: fan-out/join for multiple specialist steps
- `gate`: deterministic validation before advancing
- `handoff_to_plan`: optional bridge into `/start-work` / `builder`

### Prompt Assembly Model

Follow Synkra's pattern with Kord adaptation:

- YAML stays compact and declarative
- Step guidance comes from referenced Markdown assets when possible
- Runtime assembles step context JIT from:
  - workflow metadata
  - prior step outputs/state
  - referenced task/guide/checklist/template docs
  - orchestrator-collected user input
- Subagents never ask questions; they receive `user_input` already prepared

### Output Chaining Decision (v1)

- Primary chaining model: **artifact-based chaining**
  - steps declare `creates` / `updates`
  - subsequent steps use `requires`
  - gate steps validate artifact existence/content/size
- Structured YAML response blocks may be added later, but are NOT required for v1 runtime correctness

### Workflow Inventory Policy

Import all Synkra workflows into the Kord catalog, but certify runtime execution in phases.

| Workflow | Import | Runtime Certification |
|----------|--------|-----------------------|
| `greenfield-fullstack` | YES | v1 anchor |
| `brownfield-discovery` | YES | v1 anchor |
| `greenfield-service` | YES | v1 secondary |
| `brownfield-fullstack` | YES | v1 secondary |
| `greenfield-ui` | YES | v1.1 |
| `brownfield-ui` | YES | v1.1 |
| `brownfield-service` | YES | v1.1 |
| `qa-loop` | YES | v1.1 |
| `spec-pipeline` | YES | v1.1 |
| `design-system-build-quality` | YES | v1.1 |
| `development-cycle` | YES | deferred runtime certification |
| `story-development-cycle` | YES | deferred runtime certification |
| `epic-orchestration` | YES | deferred runtime certification |
| `auto-worktree` | YES | deferred runtime certification |

Rationale:
- "Import all" satisfies parity and pack completeness.
- Runtime certification is phased so the engine lands safely without watering down semantics.

### State Model

- Detailed workflow state: `docs/kord/workflows/runs/<workflow-id>/<run-id>.json`
- Lightweight pointer/summary in `docs/kord/boulder.json`
- State tracks steps, artifacts, decisions, user inputs, spawned task IDs, phase boundaries, and current action-required status

### Command UX

Generic runtime command family:
- `/workflow list`
- `/workflow validate <id>`
- `/workflow import synkra <path-or-id>`
- `/workflow create <id>`

Per-workflow aliases (generated):
- `/<workflow-id>`
- `/<workflow-id> status`
- `/<workflow-id> continue`
- `/<workflow-id> pause`
- `/<workflow-id> abort`

Collision rule:
- Workflow IDs that conflict with existing builtin commands MUST be rejected or namespaced during import/creation.

---

## Recovery Update (2026-03-06)

The previous implementation attempt was executed under `dev` instead of being resumed through `/start-work` with `builder` as the primary orchestrator.

Treat the current codebase state as a **partial MVP foundation**, not as completed parity work.

### Builder-Only Execution Rule

- Resume this plan with `/start-work workflow-engine-synkra-parity`
- `builder` is the primary executor for this plan
- `dev` may only be used as a delegated worker for isolated subtasks after `builder` performs the audit and decides what to keep/rework
- Do NOT mark any workflow-engine TODO complete purely because code exists; completion requires parity-level behavior, tests, and docs

### Partial Implementation Already Present (Must Be Audited First)

- `src/features/workflow-engine/*` - initial schema/registry/storage/engine scaffold exists
- `src/hooks/workflow/index.ts` - initial workflow runtime hook exists
- `src/hooks/auto-slash-command/executor.ts` - initial workflow alias interception exists
- `src/features/builtin-commands/templates/workflow.ts` and `src/features/builtin-commands/commands.ts` - builtin `/workflow` command exists
- `src/cli/scaffolder.ts` - initial `.kord/workflows/` and `.opencode/command/` scaffolding exists

### Known Gaps From The Partial Attempt

- Synkra importer is still a stub and does not import the real catalog
- Only two simplified workflows exist; the full Synkra set is not yet present
- Alias behavior must be audited for recursion and proper `status` / `continue` / `pause` / `abort` routing
- Interactive interview/brainstorm runtime is not parity-complete
- JIT prompt assembly is not implemented to Synkra depth
- Parallel fan-out/join and real gate semantics are not implemented
- README / docs / AGENTS / guides / skills were not comprehensively updated
- Builtin workflow source-of-truth should be a shipped asset pack, not only inline TypeScript strings

---

## Project Artifacts

| Artifact | Agent | Path | Status |
|----------|-------|------|--------|
| Workflow Delivery Plan | planner | `docs/kord/plans/workflow-engine-synkra-parity.md` | generated |
| Workflow Integration Draft | planner | `docs/kord/drafts/guides-skills-workflows-integration.md` | active |

---

## Decision Points

- [ ] Decision: Kord workflow YAML v1 compatibility mode
  - Options: strict-Kord-v1 | Synkra-compat-v1 (recommended) | dual-parser
  - Evaluation rubric: fidelity | maintenance cost | importer complexity | validator clarity
  - Final decision: Synkra-compat-v1 parser with explicit Kord-only extensions
  - Rationale: preserve parity while allowing Kord-specific runner fields

- [ ] Decision: step guidance storage
  - Options: inline YAML notes only | referenced Markdown assets (recommended) | mixed mode
  - Evaluation rubric: parity | maintainability | prompt assembly clarity | authoring ergonomics
  - Final decision: mixed mode, but prefer referenced Markdown assets with YAML notes as overrides
  - Rationale: matches Synkra's JIT prompt assembly model and avoids bloated YAML

---

## Execution Strategy

### Wave 0 - Recovery Audit and Builder Re-entry
- Task 0: audit the partial MVP implementation created under `dev`
- Task 1: classify each existing workflow-engine change as keep / rework / replace / delete
- Task 2: fix any critical defects that would make `/start-work` continuation unsafe or misleading

### Wave 1 - Architecture and Spec
- Task 1: define workflow model and adaptation matrix
- Task 2: define schema + validator contract
- Task 3: define state model + engine lifecycle

### Wave 2 - Engine Core
- Task 4: implement registry/loader/validator
- Task 5: implement run state manager
- Task 6: implement core runner loop

### Wave 3 - Runtime UX and Integration
- Task 7: command aliases and generic workflow commands
- Task 8: prompt assembly + step asset references + elicitation runtime
- Task 9: init/install/extract scaffolding for workflows

### Wave 4 - Synkra Parity and Authoring
- Task 10: import/adapt the Synkra workflow set
- Task 11: create workflow authoring path
- Task 12: update guides/skills/tests/docs for workflow-aware onboarding

### Wave 5 - Closure and Parity Review
- Task 16: perform final parity/doc/runtime closure review before marking the plan complete

Critical Path: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 8 -> 10 -> 11 -> 12 -> 16

---

## TODOs

- [ ] 0. Audit and reconcile the partial workflow-engine MVP created under `dev`

  **What to do**:
  - Inspect all workflow-engine related files already changed in the previous attempt
  - Classify each change as:
    - keep as-is
    - rework
    - replace
    - delete
  - Verify the current implementation against this plan instead of trusting code presence
  - Identify any critical defects that would break restart/resume flow under `builder`
  - Record the audit in `docs/kord/notepads/workflow-engine-synkra-parity/recovery-audit.md`

  **Acceptance Criteria**:
  - [ ] Recovery audit exists and explicitly lists keep/rework/replace/delete decisions
  - [ ] Builder has a verified restart point and is not relying on `dev`-owned assumptions
  - [ ] Any critical defect that blocks safe continuation is fixed before parity expansion begins

- [ ] 1. Produce a Synkra -> Kord workflow adaptation matrix

  **What to do**:
  - Create a parity matrix that maps Synkra workflow concepts to Kord runtime concepts:
    - workflow metadata
    - phases/sequence
    - `elicit`
    - `requires` / `creates` / `updates`
    - `notes`
    - task/template/checklist references
    - state schema
    - command aliases
  - For each concept, classify as:
    - preserved as-is
    - adapted to Kord
    - intentionally replaced

  **References**:
  - `docs/kord/drafts/guides-skills-workflows-integration.md`
  - Synkra workflow/runtime files listed above

  **Acceptance Criteria**:
  - [ ] Matrix exists in the implementation notes/docs and covers all major workflow runtime concepts

- [ ] 2. Define Kord workflow YAML schema v1 with Synkra-compatible mental model

  **What to do**:
  - Define YAML schema fields for:
    - `schema_version`
    - `workflow.id/name/version/type`
    - `runner_agent`
    - `metadata`
    - `inputs`
    - `resources`
    - `sequence`
    - step intents (`brainstorm`, `interview`, `research`, `agent`, `parallel`, `gate`, `handoff_to_plan`)
    - `requires` / `creates` / `updates`
    - optionality and skip rules
    - workflow-local tool/path allowlists

  **Must NOT do**:
  - No arbitrary executable code inside YAML

  **Acceptance Criteria**:
  - [ ] Schema supports imported Synkra workflows without flattening them into generic steps
  - [ ] Schema rejects workflows without `schema_version`

- [ ] 3. Implement workflow validator (syntax + graph + dependency + compatibility)

  **What to do**:
  - Validate YAML syntax and required fields
  - Validate step graph, references, conditions, and artifact flow
  - Validate referenced assets exist:
    - guides/tasks/checklists/templates/workflow assets
    - skills/agents/commands used by steps
  - Emit compatibility/adaptation warnings for imported Synkra workflows
  - Detect command alias collisions with builtin commands
  - Enforce English-only imported content in shipped workflow files

  **Acceptance Criteria**:
  - [ ] `/workflow validate <id>` returns actionable errors/warnings
  - [ ] Validator flags non-English shipped workflow content as blocking

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Invalid workflow is rejected
    Tool: Bash
    Steps:
      1. Run workflow validator on a malformed YAML
      2. Assert non-zero exit or explicit INVALID result
      3. Assert output names the offending field/step
    Expected Result: validator prevents unsafe/invalid workflow execution
  ```

- [ ] 4. Implement workflow registry + loader + override rules

  **What to do**:
  - Load builtin workflows from shipped plugin assets
  - Load project overrides from `.kord/workflows/*.yaml`
  - Resolve precedence deterministically
  - Support metadata discovery for command alias generation

  **Acceptance Criteria**:
  - [ ] Registry lists all builtin/imported/overridden workflows with correct source provenance

- [ ] 5. Implement workflow run state manager

  **What to do**:
  - Persist run state JSON under `docs/kord/workflows/runs/<workflow-id>/<run-id>.json`
  - Track:
    - run identity
    - current step/phase
    - action-required state
    - per-step status/timestamps
    - artifacts registry
    - decisions and user input
    - spawned background task IDs
  - Mirror only summary/pointer info into `docs/kord/boulder.json`
  - Keep detailed workflow state separate from boulder state files

  **Acceptance Criteria**:
  - [ ] Workflow resumes correctly after session interruption without losing step context

- [ ] 6. Implement the workflow engine core

  **What to do**:
  - `start`: create run state and begin at first actionable step
  - `continue`: advance from current state only when gates allow
  - `pause` / `abort`: update run lifecycle safely
  - Enforce that required steps cannot be bypassed
  - Support optional/skip behavior only where schema allows

  **Acceptance Criteria**:
  - [ ] Engine blocks illegal skipping of required steps
  - [ ] Engine resume semantics are deterministic

- [ ] 7. Implement interactive main-session step runtime

  **What to do**:
  - Add main-session execution logic for `brainstorm` and `interview` steps
  - Support guided step instructions, question sets, required decisions, and clearance/gate checks
  - Record all answers/decisions into workflow state
  - Keep this in the visible `kord` session

  **Acceptance Criteria**:
  - [ ] Interactive workflow steps do not require subagents to ask the user questions
  - [ ] Workflow state captures the result of iterative elicitation

- [ ] 8. Implement JIT prompt assembly for delegated workflow steps

  **What to do**:
  - Recreate Synkra's prompt assembly model in Kord:
    - runner prepares `user_input`
    - runtime loads referenced step assets
    - runtime injects only current-step context into delegated prompts
  - Support asset reference loading for:
    - workflow-specific step guides/tasks
    - checklists
    - templates
    - referenced docs/data

  **Acceptance Criteria**:
  - [ ] Delegated steps receive all required context without needing full workflow history dumped into prompt
  - [ ] Referenced Markdown task/guide assets are preferred over bloated inline YAML notes where available

- [ ] 9. Implement parallel fan-out/join and gate steps

  **What to do**:
  - Dispatch parallel specialist steps
  - Join only when required branches complete
  - Run gate steps deterministically against artifact existence/content criteria

  **Acceptance Criteria**:
  - [ ] Parallel workflow branches are visible in status and cannot incorrectly mark workflow complete

- [ ] 10. Implement Synkra workflow importer and adapt the workflow set

  **What to do**:
  - Import the shipped Synkra workflow catalog into Kord format/registry
  - Preserve robustness and content depth; do not genericize
  - Translate imported non-English content to English before shipping into the Kord pack
  - Produce an adaptation report for each imported workflow showing:
    - unchanged fields
    - Kord-specific substitutions
    - unsupported constructs and how they were handled
  - Start with high-priority anchors, but the plan target is the broader Synkra workflow set, not only two examples

  **Acceptance Criteria**:
  - [ ] Imported workflows retain step richness, dependencies, notes, and runtime semantics at high fidelity
  - [ ] Every imported workflow has an adaptation report under `docs/kord/workflows/import-report-<id>.md`

- [ ] 11. Scaffold workflows into init/install/extract

  **What to do**:
  - Ship builtin workflows under plugin source at `src/features/builtin-workflows/**/*.yaml`
  - Scaffold them into `.kord/workflows/`
  - Preserve local overrides on re-init unless forced
  - Ensure extract/init/install can keep workflow assets in sync

  **Acceptance Criteria**:
  - [ ] New/installing projects receive a usable workflow pack by default
  - [ ] Builtin workflow source-of-truth is asset-backed and not only embedded as inline TypeScript string literals

- [ ] 12. Generate per-workflow command aliases

  **What to do**:
  - For each registered workflow, scaffold `.opencode/command/<workflow-id>.md`
  - Alias command must route to the workflow engine and support:
    - default start/continue behavior
    - `status`, `continue`, `pause`, `abort`
  - Keep command descriptions explicit that these are workflows

  **Acceptance Criteria**:
  - [ ] Running `/<workflow-id>` uses the workflow engine, not a static prompt-only shortcut
  - [ ] Alias generation rejects command name collisions deterministically

- [ ] 13. Build workflow authoring as a first-class feature

  **What to do**:
  - Add:
    - `.kord/workflows/_template.yaml`
    - `.kord/workflows/README.md`
  - Add `/create-workflow <id>` (or `/workflow create <id>`) to scaffold:
    - workflow YAML
    - command alias wrapper
  - Add a workflow-authoring guidance path (command and/or skill) that elicits:
    - purpose
    - trigger model
    - runner agent
    - step graph
    - artifacts/gates
    - tool/path allowlists

  **Acceptance Criteria**:
  - [ ] A new custom workflow can be scaffolded, validated, and executed without manual runtime patching

- [ ] 14. Upgrade workflow-aware onboarding, skills, and documentation

  **What to do**:
  - Update `.kord/guides/new-project.md` and `.kord/guides/existing-project.md` so they route into workflows and their supporting skills
  - Ensure mode skills are framework-grade and produce the artifacts expected by imported workflows
  - Ensure workflow docs explain when to use workflow vs `/plan` vs `/start-work`
  - Update `README.md` with workflow runtime overview, command family, alias behavior, and builtin-vs-project workflow locations
  - Update relevant `AGENTS.md`/knowledge-base files so future agents can discover the workflow engine architecture and usage model correctly
  - Update any relevant docs under `docs/` that describe onboarding or execution flow so they stop implying workflow support is only prompt-level

  **Acceptance Criteria**:
  - [ ] Guides describe the real framework route instead of generic "create a PRD" or "run discovery"
  - [ ] README documents `/workflow`, per-workflow aliases, and workflow asset locations
  - [ ] AGENTS/docs references are aligned with the actual shipped workflow engine

- [ ] 15. Add comprehensive tests and compatibility fixtures

  **What to do**:
  - Add validator tests
  - Add loader/override tests
  - Add state/resume tests
  - Add command alias tests
  - Add importer parity fixtures using real Synkra workflow samples
  - Add workflow authoring scaffold tests
  - Add cross-session resume test
  - Add required-step skip rejection test
  - Add alias collision test
  - Add gate validation test that checks minimum file size, not just file existence

  **Acceptance Criteria**:
  - [ ] Engine behavior is covered for start/continue/pause/abort, invalid skip, fan-out/join, and imported workflow compatibility

- [ ] 16. Perform final parity and closure review before marking the plan complete

  **What to do**:
  - Re-audit implementation against every TODO in this plan
  - Verify that all Synkra workflows targeted by this plan were actually imported/adapted or explicitly deferred per the runtime certification table
  - Verify runtime behavior, documentation, scaffolding, alias routing, and workflow asset packaging are all aligned
  - Confirm that `builder`-driven `/start-work` execution is the authoritative delivery path for this plan

  **Acceptance Criteria**:
  - [ ] No TODO is considered complete solely because partial code exists
  - [ ] No critical gap remains in importer, alias routing, runtime semantics, or documentation
  - [ ] The plan can be honestly marked complete without claiming unshipped Synkra parity

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: YES (tests-after or TDD where practical)
- **Framework**: Bun test

### Agent-Executed QA Scenarios

Scenario: Imported workflow starts and creates state
  Tool: Bash
  Preconditions: imported `brownfield-discovery` exists
  Steps:
    1. Execute ` /brownfield-discovery `
    2. Assert a run state file exists under `docs/kord/workflows/runs/brownfield-discovery/`
    3. Assert status reports current phase and current action
  Expected Result: workflow run is registered and resumable
  Evidence: run state JSON path + command output

Scenario: Interactive step blocks until user input recorded
  Tool: Bash / command harness
  Preconditions: workflow starts with a `brainstorm` or `interview` step
  Steps:
    1. Start workflow
    2. Assert status shows `action_required`
    3. Provide input
    4. Assert state captures user response and step can advance
  Expected Result: orchestrator-owned elicitation works without subagent Q&A
  Evidence: run state JSON diff

Scenario: Parallel join waits for required branches
  Tool: Bash / test harness
  Preconditions: fixture workflow with parallel branches
  Steps:
    1. Start workflow
    2. Complete only one required branch
    3. Assert join step remains blocked
    4. Complete remaining required branch
    5. Assert workflow advances
  Expected Result: join semantics are enforced
  Evidence: status output + state transitions

Scenario: Workflow authoring path scaffolds a valid workflow
  Tool: Bash
  Preconditions: no existing workflow with chosen id
  Steps:
    1. Run `/create-workflow ads-analysis`
    2. Assert `.kord/workflows/ads-analysis.yaml` exists
    3. Assert `.opencode/command/ads-analysis.md` exists
    4. Run validator
  Expected Result: authored workflow is scaffolded and valid
  Evidence: files + validator output

---

## Success Criteria

- Imported Synkra workflows retain high-fidelity framework depth after adaptation
- Workflow runtime is distinct from but interoperable with plan/boulder runtime
- Interactive steps are handled by the visible runner (`kord`) without subagent questioning
- Delegated steps use JIT prompt assembly from referenced assets
- Workflow aliases behave like first-class commands
- New workflows can be authored inside Kord with templates/validation
