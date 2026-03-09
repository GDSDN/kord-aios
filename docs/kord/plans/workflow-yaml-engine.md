# YAML Workflow Engine Integration (Synkra -> Kord)

## TL;DR

> **Quick Summary**: Add native support for Synkra-style YAML workflows in Kord AIOS, so teams can run multi-step, multi-agent, stateful workflows (interviews, parallel discovery, gated artifacts) with step-locking and resume across sessions.
>
> **Core Strategy**: Implement a workflow engine (state machine) first. Reuse `docs/kord/boulder.json` only as a resume pointer and high-level progress. Optionally support "workflow -> plan" export as an audit view, not as the primary runtime.

**Deliverables**:
- New workflow system in Kord AIOS:
  - Workflow definitions (YAML) + validator + loader
  - Workflow run state (JSON) + resume + step locking
  - CLI/chat commands:
    - Generic: `/workflow start|status|continue|pause|skip|abort|list|validate|import`
    - Per-workflow aliases: `/<workflow-id>` (e.g. `/greenfield-fullstack`, `/brownfield-discovery`) as thin wrappers over the engine
- Pack integration:
  - Scaffold workflows into `.kord/workflows/` during `init`/`install` (builtin defaults + user overrides)
  - Scaffold per-workflow command stubs into `.opencode/command/` so each workflow becomes a first-class slash command without bloating builtin command schema
  - Update `.kord/guides/new-project.md` and `.kord/guides/existing-project.md` to route users into the correct workflow/skills
- Quality and safety:
  - Allowlist-based tools and path boundaries per workflow
  - JIT prompting (inject only current step context)

**Estimated Effort**: Large
**Parallel Execution**: YES (2-3 waves)
**Critical Path**: spec/schema -> validator/loader/state -> runner -> commands (generic + aliases) -> importer -> init+guides integration

---

## Context

### Why This Work Exists

The current New Project / Existing Project onboarding in Kord is improving, but a major missing capability compared to Synkra is first-class **workflow execution**:
- Synkra has YAML workflows with phases, conditions, parallel steps, and explicit artifacts.
- Synkra runs them with state and step control (`run-workflow`, engine mode), not just static documentation.

You want Kord to:
- run these workflows with proper control (no skipping required steps)
- support multi-agent dispatch per step, including parallel steps
- ensure prerequisites exist (templates, guides, skills) and validate artifacts
- allow creating our own workflows (e.g., from your advanced methodology research)

### Evidence (How Synkra Executes Workflows)

Synkra workflow definitions:
- `D:\\dev\\synkra-aios\\.aios-core\\development\\workflows\\greenfield-fullstack.yaml`
- `D:\\dev\\synkra-aios\\.aios-core\\development\\workflows\\brownfield-discovery.yaml`

Synkra guided/engine task interface:
- `D:\\dev\\synkra-aios\\.aios-core\\development\\tasks\\run-workflow.md`
- `D:\\dev\\synkra-aios\\.aios-core\\development\\tasks\\run-workflow-engine.md`

Synkra deterministic orchestrator and state/validation:
- `D:\\dev\\synkra-aios\\.aios-core\\core\\orchestration\\workflow-orchestrator.js`
- `D:\\dev\\synkra-aios\\.aios-core\\development\\scripts\\workflow-state-manager.js`
- `D:\\dev\\synkra-aios\\.aios-core\\development\\scripts\\workflow-validator.js`

Kord resume/progress primitives (to reuse):
- `/start-work` + `docs/kord/boulder.json`:
  - `src/hooks/start-work/index.ts`
  - `src/features/boulder-state/AGENTS.md`

### OpenCode Capability Check (No Native Workflow Engine)

OpenCode provides slash commands as prompt templates (config-defined commands, skills, and MCP prompts), but it does not provide a Synkra-style workflow runner/state machine.

Implication: Kord must implement workflow execution inside the plugin (runner + state + validation). Workflow alias commands (`/greenfield-fullstack`) can be implemented as command templates that trigger the Kord workflow engine via a hook.

### Inputs

- Advanced methodology research (Portuguese; must be adapted into English for repo artifacts):
  - `docs/kord/research/TÓPICO____Metodologia-Avançada-de-Desenvolvimento.md`
- Draft integration notes:
  - `docs/kord/drafts/guides-skills-workflows-integration.md`

---

## Decision (Architecture)

### Recommendation

Implement a **native workflow runner** (engine/state machine) with step locking and resume. Provide an optional "export to plan" view for audit, but do not use it as the primary runtime.

### Agent Contract (Who "runs" the workflow)

Default runner model:

- **Workflow runner (session persona)**: `kord`
  - Rationale: workflows are not only "execution". Many workflows include iterative ideation (brainstorm), elicitation (interview), and routing to multiple agents. `kord` already has the broadest orchestration freedom (delegation + question + framework awareness).
  - Builder remains the plan executor for `/start-work` and boulder-driven plan runs.

- **Per-workflow override**: allow workflow YAML to specify `runner_agent` (default: `kord`)
  - Example: a purely delivery workflow could choose `builder`, but only if it never needs interactive Q&A.
  - Example: a research-heavy workflow could choose `kord` or a dedicated future `workflow-runner` primary agent.

Interview/brainstorm handling (within a single runner persona):

- **Brainstorm** (`brainstorm` step intent): interactive ideation run by the main session agent (this is what we're doing now).
- **Interview** (`interview` step intent): still run by the main session agent, but using a strict elicitation protocol and clearance checks.
  - Implement as: workflow step macros (question sets + gates) and JIT prompt injection, not by delegating Q&A to a subagent.

- **Brainstorm/research steps**: model explicitly as TWO different step intents
  - `brainstorm` (interactive ideation): the main session collects input from the user (this is what we are doing now). No subagent is required.
  - `research` (evidence gathering + option synthesis): delegate to `analyst` (and optionally librarian/explore in parallel) and record outputs in workflow state.
- Note: users never "talk directly" to subagents in the UX; subagents are an internal execution mechanism. The orchestrator presents a single coherent conversation.

### Critical Constraint: Subagents Cannot Ask Users Questions

Kord has a hook that blocks the Question tool from subagent sessions:
- `src/hooks/subagent-question-blocker/index.ts`

Implication:
- Any step that requires iterative Q&A with the user MUST be executed by the **main session agent** (a primary agent persona), not by a subagent.
- Subagents (analyst/architect/etc) can still be used to generate prompts, propose the next question, or produce artifacts, but they cannot directly run an interactive interview with the user.

Therefore, the engine must support one of these patterns for iterative steps:

Pattern 1 (preferred): Single runner agent + built-in elicitation macros
- Main session agent stays constant (default: `kord`).
- Workflow step defines:
  - the question set (or references a question-set template)
  - required decisions
  - a clearance checklist
- Main session agent asks the user and records answers in workflow state.

Pattern 2 (optional): Phase-level runner switching
- Engine switches the main session agent at coarse phase boundaries.
- Example: a workflow may hand off to `/start-work` for plan execution (builder + boulder), then resume the workflow after plan completion.

We should AVOID per-step runner switching; only switch at coarse phase boundaries.

Implementation note (permission reality): Builder currently denies the `task` tool in `src/agents/builder/index.ts`.
- This reinforces why `builder` should not be the default workflow runner.
- The workflow engine should dispatch deterministically in plugin code (hooks/tools) regardless of runner persona.

### Centralize vs Switch Agents (Complexity/Benefit)

You do NOT need to "switch the chat persona" between agents to get the benefits of specialization.

- **Centralize (single UI persona, recommended)**: keep `kord` as the visible orchestrator for the entire workflow run, and call specialist agents as internal step executors.
  - Pros: simple UX, stable context, consistent state enforcement, no confusing persona changes.
  - Cons: requires the engine to own dispatch/state strongly (which we need anyway).

- **Hard agent switching (avoid as default)**: change the main session agent per step.
  - Pros: superficially mirrors Synkra "new chat per agent".
  - Cons: higher complexity, more fragile resume semantics, increases risk of skipped gates, and can conflict with Kord's existing start-work builder switching.

In short: the *real gain* is in having role-specific prompts/skills and enforceable gates, not in literally changing the main session agent.

### Why This Is Not "Gambiarra"

Workflow-to-plan compilation is a legitimate technique for auditability and reuse, but it does not naturally support:
- interactive interviews that pause/resume deterministically
- parallel fan-out/join with state tracking
- conditional steps and skip rules with enforcement
- robust artifact dependency validation

To preserve the Synkra workflow semantics (and your control requirements), a runner is necessary.

---

## Scope

### IN

- Kord-native workflow format + Synkra YAML import/compat layer
- Commands and state persistence (start/continue/status/skip/abort)
- Step types:
  - prompt/interview steps
  - agent steps (delegate via `task()`)
  - parallel groups (fan-out/join)
  - gate steps (validate artifacts exist + basic checks)
  - conditions (deterministic, sandboxed)
- Packaging/scaffolding into `.kord/workflows/` + docs pointers from guides/rules

### OUT

- A full Synkra clone (TerminalSpawner/session-state parity)
- Arbitrary code execution embedded in YAML
- Unrestricted Bash from workflow YAML

---

## Target UX (Commands)

Default command namespace (recommended): `/workflow`

- `/workflow list`
- `/workflow validate <name>`
- `/workflow start <name>`
- `/workflow status`
- `/workflow continue`
- `/workflow pause`
- `/workflow skip` (only if step is explicitly skippable)
- `/workflow abort`
- `/workflow import synkra <path-or-id>`

### Per-workflow Command Aliases (User-Facing)

Each workflow may be invoked directly as a slash command for repeatable usage:

- `/greenfield-fullstack` (equivalent to `/workflow start greenfield-fullstack` or `/workflow continue` if a run is active)
- `/brownfield-discovery`

These alias commands should be generated from YAML workflow metadata and scaffolded into `.opencode/command/`.
This avoids hardcoding every workflow into `BuiltinCommandNameSchema`.

Status output must show:
- current step and phase
- parallel substeps and their completion
- blocked steps and reason
- "Action required" block when an interview prompt is pending

---

## Proposed Kord Workflow System Design

### Locations

- Workflow definitions (project): `.kord/workflows/*.yaml`
- Workflow definitions (builtin): `src/features/builtin-workflows/**/*.yaml` (copied during init/install)
- Workflow run state (project): `docs/kord/workflows/runs/<workflow-id>/<run-id>.json`
- Resume pointer (project): `docs/kord/boulder.json` stores `active_workflow_run_id` + `active_workflow_id` + short summary only
- Workflow alias commands (project): `.opencode/command/<workflow-id>.md`

### State Model (JSON)

State must include:
- workflow id/name/version
- run id
- current step index
- per-step status (pending/running/completed/failed/skipped)
- artifacts registry (declared creates/updates)
- recorded decisions / user answers
- mapping from step id -> spawned task ids (for resume)

### Step Model

Support a small set of deterministic step types:
- `prompt` (interview): blocks until user answers
- `interview` (planner-style): runs a structured interview sequence and writes outputs into the workflow state (can be implemented as `prompt` + a dedicated "question set" generator)
- `agent` (delegated): dispatch via `task()` to the specified agent or category
- `parallel` (fan-out): contains multiple `agent` steps; join waits for all required
- `gate` (validation): check files exist, headings exist, size budgets, etc.

### Determinism and Safety

- Conditions must use a sandboxed expression language (no JS eval)
- Tools and paths allowed per workflow must be allowlist-based
- Default policy: restrictive reads/writes (docs/kord + .kord only)

---

## TODOs

- [ ] 1. Define Kord workflow YAML schema (v1)

  **What to do**:
  - Specify a Kord workflow YAML v1 schema that can represent:
    - metadata (id, version, description)
    - steps (prompt/agent/parallel/gate)
    - creates/updates/requires
    - optional/skippable/conditions
    - allowed tools and path constraints

  **References**:
  - Synkra examples: `D:\\dev\\synkra-aios\\.aios-core\\development\\workflows\\greenfield-fullstack.yaml`
  - Synkra validator: `D:\\dev\\synkra-aios\\.aios-core\\development\\scripts\\workflow-validator.js`

  **Acceptance Criteria**:
  - [ ] Schema document exists in `docs/kord/plans/workflow-yaml-engine.md` (this plan) or as a dedicated spec section

- [ ] 2. Implement workflow validator (syntax + references + graph)

  **What to do**:
  - Validate YAML syntax
  - Validate required fields
  - Validate agent references exist
  - Validate artifact flow (`requires` satisfied by previous `creates/updates`)
  - Detect circular dependencies
  - Validate condition expressions

  **References**:
  - `src/tools/squad-load/tools.ts` (js-yaml usage patterns)
  - Synkra: `D:\\dev\\synkra-aios\\.aios-core\\development\\scripts\\workflow-validator.js`

  **Agent-Executed QA Scenario**:
  - Run: `/workflow validate brownfield-discovery` -> prints VALID/INVALID with top errors

- [ ] 3. Add workflow registry + loader with override rules

  **What to do**:
  - Load builtin workflows and project workflows
  - Resolution order: project `.kord/workflows` overrides builtin

  **Acceptance Criteria**:
  - [ ] `/workflow list` shows builtin + overrides

- [ ] 4. Add workflow run state manager

  **What to do**:
  - Create/load/save run state JSON under `docs/kord/workflows/runs/<workflow-id>/`
  - Store only a pointer in `docs/kord/boulder.json`

  **References**:
  - Kord boulder storage: `src/features/boulder-state/storage.ts`
  - Synkra state manager: `D:\\dev\\synkra-aios\\.aios-core\\development\\scripts\\workflow-state-manager.js`

- [ ] 5. Implement workflow runner loop (sequential + prompt + agent)

  **What to do**:
  - `start` creates state and begins step 0
  - `continue` advances to next pending step
  - `prompt` / `interview` steps block and record answer(s)
  - `agent` step dispatches via `task()` and records task id + outputs

  **Acceptance Criteria**:
  - [ ] Required steps cannot be skipped
  - [ ] `status` reflects accurate per-step progress

- [ ] 6. Add parallel step support (fan-out/join)

  **What to do**:
  - Dispatch multiple agent steps concurrently
  - Join waits for all required steps; optional steps can be skipped

- [ ] 7. Add gate steps (artifact verification)

  **What to do**:
  - Implement file existence checks and basic content assertions
  - Enforce pack dependency checks (templates, guides, skills exist)

- [ ] 8. Add Synkra workflow importer (compat layer)

  **What to do**:
  - Import Synkra YAML from `.aios-core/development/workflows/*.yaml`
  - Map to Kord workflow v1
  - Fail loudly on unsupported constructs; provide a report

- [ ] 9. Package workflows into init/install

  **What to do**:
  - Add builtin workflow storage and copy-on-init behavior similar to squads
  - Preserve user changes on re-init (do not overwrite unless forced)

- [ ] 9.1 Scaffold per-workflow alias slash commands

  **What to do**:
  - For each workflow under `.kord/workflows/`, create a corresponding `.opencode/command/<workflow-id>.md` command stub that:
    - describes the workflow
    - routes to the engine (`/workflow start <id>` / `/workflow continue` / `/workflow status`)
    - provides argument hints (`status|continue|pause|abort|skip`)
  - Ensure `init` and `extract` both keep these stubs in sync (without overwriting user edits unless forced).

  **References**:
  - `src/cli/init/index.ts` (scaffold pipeline)
  - `src/cli/scaffolder.ts` (scaffold entries)

- [ ] 10. Update onboarding guides to route through framework and skills

  **What to do**:
  - New project guide must explicitly say:
    - PRD creation begins with a workflow-driven interview step (interactive; captured as workflow state)
    - Then delegate to PM skill (`greenfield-kickoff`) to write PRD + epic
    - Then SM/PO pipeline (`create-next-story`, `validate-next-story`)
    - Prefer running the workflow (`/greenfield-fullstack`) for repeatable guided execution
  - Existing project guide must explicitly say:
    - Start with brownfield discovery skill/workflow (baseline-first)
    - Then `create-brownfield-story`

  **References**:
  - `.kord/guides/new-project.md` and `.kord/guides/existing-project.md` scaffold sources in `src/cli/project-layout.ts`
  - Research input: `docs/kord/research/TÓPICO____Metodologia-Avançada-de-Desenvolvimento.md`

- [ ] 10.1 Upgrade mode skills so guides/workflows are actually executable

  **What to do**:
  - Ensure the greenfield kickoff skill is "framework-grade" for PRD generation:
    - `src/features/builtin-skills/skills/kord-aios/product/greenfield-kickoff/SKILL.md`
    - Must explicitly cover: ICP/target audience, problem framing, constraints, stack assumptions, success metrics, non-goals, risk/mitigation, and artifact outputs.
  - Ensure brownfield analysis skills form a coherent baseline-first chain and produce the required artifacts:
    - `document-project` (architecture + baseline)
    - `generate-shock-report` (optional)
    - `create-brownfield-story` (turn baseline into an executable story)
  - Add workflow gates that check these skill outputs exist before moving forward.

  **Acceptance Criteria**:
  - [ ] Greenfield kickoff flow can produce: PRD + epic with no missing fields
  - [ ] Brownfield discovery flow can produce: baseline docs + first brownfield story

- [ ] 11. Add workflow creation path (author our own workflows)

  **What to do**:
  - Provide templates:
    - `.kord/workflows/_template.yaml` (Kord workflow v1)
    - `.kord/workflows/README.md` (authoring guide + safety model)
  - Add a workflow authoring command (Synkra parity):
    - `/create-workflow <id>` (or `/workflow create <id>`) to scaffold:
      - `.kord/workflows/<id>.yaml`
      - `.opencode/command/<id>.md` (alias command wrapper)
  - Add a workflow authoring skill (optional) to guide elicitation when creating workflows:
    - `create-workflow` skill that asks for: purpose, triggers, runner_agent, steps, gates, required artifacts, tool/path allowlists.

  **References**:
  - Synkra workflow authoring:
    - `D:\\dev\\synkra-aios\\.aios-core\\development\\tasks\\create-workflow.md`
    - `D:\\dev\\synkra-aios\\.aios-core\\product\\templates\\workflow-template.yaml`
    - `D:\\dev\\synkra-aios\\.aios-core\\product\\templates\\personalized-workflow-template.yaml`
    - `D:\\dev\\synkra-aios\\.aios-core\\data\\workflow-state-schema.yaml`

---

## Verification

### Automated

- `bun test`
- `bun run build`

### Agent-Executed QA Scenarios

- Scenario: Start and resume a workflow
  - Run: `/brownfield-discovery`
  - Verify: `docs/kord/workflows/runs/brownfield-discovery/<run-id>.json` created
  - Run: `/brownfield-discovery status` shows current step
  - Run: `/brownfield-discovery continue` advances only when step complete

- Scenario: Parallel steps are joined
  - Start a workflow with a parallel group
  - Verify: status shows substeps; join blocks until required substeps complete

---

## Success Criteria

- Workflows are runnable and resumable across sessions
- Required steps cannot be bypassed
- Parallel steps execute with correct status and joining
- Workflows validate their dependencies (templates/guides/skills) before execution
- New/existing onboarding guides explicitly route to planner interview + correct mode skills/workflows
- New/existing onboarding guides explicitly route to workflow interview steps + correct mode skills/workflows
