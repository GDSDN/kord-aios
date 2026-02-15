# Kord AIOS v1 (OMOC Engine + Synkra AIOS Story-Driven Framework, Rebranded)

## TL;DR

> **Quick Summary**: Keep OMOC as the only execution engine (delegation/tools/hooks). Bring Synkra AIOS in as a story-driven framework “pack” + story runtime + `*` quick-instructions UX, and rebrand all user-facing artifacts to `.kord-aios/`.
>
> **Deliverables**:
> - Kord AIOS project root layout:
>   - `docs/kord-aios/` (single human-facing source of truth: stories/PRDs/architecture/plans/backlog)
>   - `.kord-aios/` (framework payload + machine state/evidence; not a documentation source)
> - Story runtime: story parsing → task graph/todos → OMOC delegation + verification/evidence
> - `*` quick-instructions layer (separate from `/commands`) with authority matrix + `*yolo`/`*help`
> - Fused Kord AIOS agent roster (replacing OMOC agent IDs where needed; no alias layer)
> - Script-first migration toolchain (rebrand + pack sync + path migration) to save tokens
> - Installation/bootstrapping via CLI (`kord-aios init`) + diagnostics (`kord-aios doctor`)

**Estimated Effort**: Large
**Parallel Execution**: YES (2–3 waves once core runtime paths are set)
**Critical Path**: Fix delegation reliability → runtime paths + `.kord-aios` contract → `*` commands → story runtime → fused roster → init/migrate scripts → end-to-end QA

---

## Context

### Original Request
Create “Kord AIOS”: a fusion/rebrand where Synkra AIOS methodology (story-driven, packs, templates/scripts/skills, `*` quick commands) runs on top of OMOC’s execution engine (best-in-class delegation/autonomy in OpenCode). Avoid prior failures (alias mapping debt, rewriting OMOC subsystems as stubs) and prioritize migration scripts to reduce token cost.

### What We Know (Evidence)
- OMOC base (this repo) has clear extension points:
  - Agent registry: `src/agents/utils.ts` + docs `src/agents/AGENTS.md`
  - Hook system: `src/hooks/index.ts` + docs `src/hooks/AGENTS.md`
  - Delegation runtime: `src/tools/delegate-task/executor.ts`
  - Keyword detector hook already runs on `chat.message` and avoids background sessions: `src/hooks/keyword-detector/index.ts`
  - CLI exists and is extensible: `src/cli/index.ts` (install/doctor/run)
- AIOS quick commands + authority matrix exist upstream:
  - `docs/guides/user-guide.md` (AIOS uses `@agent` + `*help`/`*task`)
  - `docs/architecture/command-authority-matrix.md` (“1 command = 1 owner”, includes `*yolo`)
- Prior internal planning artifacts exist in-repo (token-saving references):
  - `layer/aios/docs/stories/*.md` (notably `layer/aios/docs/stories/017-omoc-parity-tools-delegation-fix.md` warns against stub rewrites)

### What We Have NOT Ingested Yet (Must Read)
- Backup branch migration plan + architecture notes under `MIGRATION-OPEN-AIOS/` (user provided canonical snapshot link).
  - Snapshot reference (GitHub): `https://github.com/GDSDN/kord-aios/tree/35635bc0b9e956904f844ccdd56122c205ff4218/MIGRATION-OPEN-AIOS`
  - Key docs in that snapshot:
    - `MIGRATION-OPEN-AIOS/HANDOFF.md` (canonical UX model + agent roles)
    - `MIGRATION-OPEN-AIOS/QUALITY_GATES.md` (regression test set)
    - `MIGRATION-OPEN-AIOS/docs/architecture/adr-0001-agent-topology.md` (agent topology)
    - `MIGRATION-OPEN-AIOS/docs/architecture/adr-0002-story-driven-orchestration.md` (artifact hierarchy + story state machine + escalation rules)

### Critical Problem Detected During Planning
Subagent delegation via the `task` tool is currently failing in this environment with `JSON Parse error: Unexpected EOF` (tool execution layer). This must be fixed first because Kord AIOS depends on reliable delegation.

---

## Work Objectives

### Core Objective
Implement Kord AIOS as:
1) a **single** OpenCode plugin runtime (OMOC engine preserved),
2) a **story-driven framework layer** (AIOS methodology),
3) a **rebranded, project-local workspace contract** under `.kord-aios/`,
4) a **fused agent roster** (Kord AIOS canonical IDs) with no long-lived alias/translation layer.

### Must Have
- No parallel orchestrator loops fighting each other: OMOC remains the execution control plane.
- `*` quick-instructions are first-class and **separate** from `/commands`.
- Story runtime can drive end-to-end work: story → tasks/todos → delegated execution → evidence.
- Migration is script-driven (bulk edits, syncing upstream packs, path transforms).

### Must NOT Have (Guardrails)
- No “agent alias map” that permanently translates AIOS names ↔ OMOC names at runtime.
- No rewrite-from-scratch of OMOC subsystems (delegation/background tools/hooks). Prefer copy/adapt or reuse existing modules.
- No user-facing dependency on `.sisyphus/` as a product directory; `.kord-aios/` is the branded root.
- Do not store machine state/checkpoints as documentation:
  - `docs/` is for human-facing, git-tracked artifacts (stories/PRDs/architecture decisions).
  - `.kord-aios/` is for framework payload + runtime state/evidence (mostly git-ignored).

---

## Workspace Layout (Rebranded)

### Documentation (Human-facing, git-tracked)
- `docs/kord-aios/`
  - `stories/` (canonical story files)
  - `prds/`, `architecture/`, `decisions/` (optional)
  - `plans/` (non-story plans when needed: migration plans, large refactors)
  - `backlog/` (optional: epics, roadmap)
  - `reference/`
    - `MIGRATION-OPEN-AIOS/` (kept for consultation until migration completes)
  - `sessions/` (per-session context journal; `.sisyphus` equivalent; recommended git-ignored)
  - `drafts/` (in-progress artifacts; recommended git-ignored)

### Framework + Runtime State (Tooling-facing)
- `.kord-aios/`
  - `packs/` (templates/scripts/skills payload)
  - `state/` (todos/checkpoints/run logs; machine state; git-ignored)
  - `evidence/` (screenshots/log captures; git-ignored)

Rationale:
- Matches your goal: rebrand to Kord AIOS without carrying OMOC or Synkra “original dirt”.
- Preserves the AIOS mental model (docs-driven) while keeping runtime state out of docs.
- Aligns with migration ADR mapping: `.sisyphus/plans/*.md` → story files under `docs/**/stories/*.md` (see `MIGRATION-OPEN-AIOS/docs/architecture/adr-0002-story-driven-orchestration.md`).

Equivalence map (policy):
- `.sisyphus/plans/*.md` (planning context) → `docs/kord-aios/sessions/ses_<id>.md`
- `.sisyphus/drafts/*.md` (working memory) → `docs/kord-aios/drafts/` (git-ignored)
- Canonical plan/requirements for build → `docs/kord-aios/stories/*.md` (git-tracked)

---

## Target Architecture (v1)

### Layering (Single Control Plane)
- **OMOC Engine (existing)**: tools + hooks + background manager + model routing.
- **Kord AIOS Runtime (new modules)**:
  - RuntimePaths: resolve `.kord-aios/` root, story dirs, pack dirs, evidence/state locations.
  - StoryRuntime: parse stories, derive tasks/todos, enforce acceptance/evidence contract.
  - QuickInstructionRouter: parse `*commands`, enforce command authority, dispatch to correct agent/tool.
  - PackManager: load Kord AIOS packs (Synkra-derived templates/scripts/skills) into runtime.
- **User Workspace Contract (project-local)**:
- **User Workspace Contract (project-local)**:
  - `docs/kord-aios/`:
    - `stories/` (canonical story files; Synkra-compatible format + `open_aios` extension block)
    - `prds/`, `architecture/`, `decisions/` (as needed; optional)
    - `reference/` (migration handoff snapshot, kept for consultation until migration completes)
  - `.kord-aios/`:
    - `packs/` (templates/scripts/skills payload)
    - `state/` (todos/checkpoints/run logs; machine state)
    - `evidence/` (screenshots/log captures)

### Naming + Rebrand Policy
- Keep upstream story format semantics; rebrand paths and identifiers.
- Provide compatibility readers for:
  - `.aios-core/` (if present) → read-only import/migrate into `.kord-aios/`
  - `docs/stories/` (if present) → optional import/migrate

---

## Verification Strategy (MANDATORY)

**Universal Rule**: all verification must be agent-executable (commands/tools), no human steps.

### Tests
- Follow repo convention: TDD where feasible.
- Core verification commands (expected in CI/local):
  - `bun test`
  - `bun run typecheck`
  - `bun run build`

### Evidence
- All story-driven executions produce evidence under `.kord-aios/evidence/` (or configured runtime path).

---

## Execution Strategy (Parallel Waves)

Wave 1 (Stabilize engine + contracts):
- Task 1: Fix `task` tool delegation failure (Unexpected EOF)
- Task 2: RuntimePaths + `.kord-aios` workspace contract
- Task 3: `*` quick-instructions parsing + authority framework (minimal)

Wave 2 (Framework features):
- Task 4: Story runtime MVP (load story → todos)
- Task 5: Pack manager MVP (Synkra pack sync + load)
- Task 6: Fused roster skeleton + registry wiring

Wave 3 (Productization):
- Task 7: CLI `kord-aios init` + migrate/import scripts
- Task 8: End-to-end scenario harness (story → delegated run → evidence)
- Task 9: Docs for install/enable workflow (Windows-first)

---

## TODOs

> Each TODO includes: (1) what to do, (2) guardrails, (3) references, (4) acceptance criteria with agent-executable QA.

### 0) Harvest Prior Attempts (Decisions + Pitfalls) Into a Single Reference Doc

**What to do**:
- Ensure we are on the working branch `kord-aios-v1` (all commits land here).
- Bring the `MIGRATION-OPEN-AIOS/` snapshot into `kord-aios-v1` and store it under `docs/kord-aios/reference/` for ongoing consultation.
  - Recommended git approach (path-only restore):
    - `git restore --source 35635bc0b9e956904f844ccdd56122c205ff4218 -- MIGRATION-OPEN-AIOS/`
  - If restore is unavailable, use:
    - `git checkout 35635bc0b9e956904f844ccdd56122c205ff4218 -- MIGRATION-OPEN-AIOS/`
- Then move/copy (keeping history optional in v1) to:
  - `docs/kord-aios/reference/MIGRATION-OPEN-AIOS/`
- Read the migration handoff + ADRs and treat them as baseline reference for agent topology + story orchestration rules.
- Extract: agent roster mapping attempt, where alias debt was introduced, and which parts were still valid.
- Convert findings into a short “Pitfalls + Decisions” reference doc under `docs/kord-aios/decisions/`.

**Must also do (organization)**:
- Create `docs/kord-aios/` skeleton directories (stories/architecture/decisions/plans/reference/sessions/drafts).
- Add `.gitignore` entries so `docs/kord-aios/sessions/` and `docs/kord-aios/drafts/` are ignored (or commit them if you explicitly want that).

**Must NOT do**:
- Do not reintroduce alias mapping; document it only as a pitfall.

**References**:
- Branch: `kord-aios-backup-v1` (Git history)
- In-repo story references: `layer/aios/docs/stories/017-omoc-parity-tools-delegation-fix.md`

**Acceptance Criteria**:
- A single markdown doc exists capturing actionable do/don't rules and concrete examples of what failed.
- Plan updated with any architectural improvements discovered in `kord-aios-backup-v1/MIGRATION-OPEN-AIOS*` (explicitly listed as deltas).

---

### 0.1) Dogfood: Make Kord AIOS Write/Read the New Sources of Truth

**What to do**:
- Ensure the fused agents treat these as canonical:
  - Planning artifacts: `docs/kord-aios/stories/` (not `.sisyphus/plans`)
  - Architecture decisions: `docs/kord-aios/architecture/`
  - Runtime state: `.kord-aios/state/`
  - Plan/session journal: `docs/kord-aios/sessions/` (equivalent to `.sisyphus/` scratchpad, but rebranded)
- Replace any hardcoded assumptions that “plan files live in `.sisyphus/`” with a pluggable path resolver.

**Must NOT do**:
- Do not require humans to copy/paste between docs and state; the agent should write/update artifacts itself.

**References**:
- Migration ADR mapping guidance: `docs/kord-aios/reference/MIGRATION-OPEN-AIOS/docs/architecture/adr-0002-story-driven-orchestration.md`
- Existing OMOC planning model (Prometheus) for inspiration only: `src/agents/prometheus/*`

**Acceptance Criteria**:
- End-to-end run can:
  - create/update a story file under `docs/kord-aios/stories/`
  - persist state under `.kord-aios/state/`
  - attach evidence under `.kord-aios/evidence/`
  - write a session journal entry under `docs/kord-aios/sessions/ses_<id>.md` that includes: story id/path, chosen agent, key decisions, completed tasks

**Quality Gates** (from snapshot; keep as minimum regression set during migration):
- `bun run typecheck`
- `bun test src/agents/utils.test.ts src/agents/topology.test.ts src/config/schema.test.ts src/plugin-handlers/config-handler.test.ts src/tools/delegate-task/tools.test.ts src/cli/index.test.ts src/cli/init-command.test.ts src/cli/install.test.ts`

**Agent-Executed QA Scenarios**:
```
Scenario: Reference doc is generated and linted
  Tool: Bash
  Steps:
    1. bun test
  Expected Result: Tests PASS; doc generation step (if scripted) succeeds
```

### 1) Fix Delegation: `task` Tool JSON Parse Error

**What to do**:
- Reproduce `JSON Parse error: Unexpected EOF` in the `task` tool path and identify which JSON payload is empty/truncated.
- Add defensive parsing + better diagnostics (log the source file path and the raw payload length / preview) without leaking secrets.
- Add a regression test that exercises `task` with a minimal prompt and asserts a stable error format (or success).

**Must NOT do**:
- Do not "work around" by disabling delegation; Kord AIOS depends on it.

**References**:
- `src/tools/delegate-task/executor.ts` (main execution path for delegation)
- `src/tools/delegate-task/helpers.ts` (model parsing + detailed error formatting)
- `src/cli/doctor/checks/model-resolution.ts` (existing model availability checks; leverage for diagnostics)

**Acceptance Criteria**:
- `bun test` includes a new test that reproduces the previous failure and now passes.

**Agent-Executed QA Scenarios**:
```
Scenario: Delegate a trivial explore task
  Tool: Bash
  Steps:
    1. bun test
  Expected Result: All tests PASS; no Unexpected EOF errors
  Evidence: test output
```

### 2) Define Kord AIOS Workspace Contract + RuntimePaths

**What to do**:
- Define canonical project-local root `.kord-aios/` layout (stories/packs/state/evidence).
- Implement a single resolver used everywhere (no scattered string literals).
- Add compatibility readers for `.aios-core/` and `docs/stories/` (import-only in v1).

**References**:
- `src/plugin-handlers/config-handler.ts` (config loading/merging patterns)
- `src/hooks/directory-readme-injector/*` and `src/hooks/directory-agents-injector/*` (path resolution + injection patterns)
- `layer/aios/docs/stories/012-persistence-todos-checkpoints-contract.md` (persistence contract requirements)

**Acceptance Criteria**:
- Unit tests prove:
  - `.kord-aios/` path resolution is deterministic across Windows paths.
  - If `.kord-aios/` missing but `.aios-core/` exists, runtime can locate it and report "migrate suggested".

**Agent-Executed QA Scenarios**:
```
Scenario: Resolve paths on Windows-style directory
  Tool: Bash
  Steps:
    1. bun test
  Expected Result: Path resolver tests PASS
```

### 3) Implement `*` Quick-Instructions Router (Minimal v1)

**What to do**:
- Add a hook that recognizes messages starting with `*` and routes them without colliding with `/commands`.
- Implement minimal commands:
  - `*help` (list available `*` commands)
  - `*yolo` / `*YOLO` (enable autonomous loop behavior; map to build-loop agent/controller)
  - `*story` (show/select current story)
- Enforce “1 command = 1 owner” authority (Synkra pattern) while keeping Kord AIOS fused roster.

**Must NOT do**:
- Do not implement a second CLI; `*` is chat UX.
- Do not allow `*` parsing inside background task sessions.

**References**:
- `src/hooks/keyword-detector/index.ts` (chat.message interception + background-session guard)
- Upstream authority matrix: `https://raw.githubusercontent.com/SynkraAI/aios-core/main/docs/architecture/command-authority-matrix.md`
- Upstream quick command usage: `https://raw.githubusercontent.com/SynkraAI/aios-core/main/docs/guides/user-guide.md`

**Acceptance Criteria**:
- New tests validate parsing:
  - `*help` recognized and handled
  - `*yolo` toggles a persisted state flag under `.kord-aios/state/`
  - In background sessions, `*` commands are ignored

**Agent-Executed QA Scenarios**:
```
Scenario: Quick command parsing unit tests
  Tool: Bash
  Steps:
    1. bun test
  Expected Result: Tests PASS
```

### 4) Story Runtime MVP: Story → Todos → Next Step Selection

**What to do**:
- Define a Synkra-compatible story markdown format with an `open_aios:` extension block.
- Implement story loader + checkbox task extraction.
- Map extracted tasks to OMOC Todo system (or a parallel story-todo store) with deterministic IDs.

**References**:
- `src/tools/task/*` (task CRUD tools; understand how todos are represented)
- `src/features/boulder-state/*` and `src/features/task-toast-manager/*` (state + observability)
- `layer/aios/docs/stories/001-plugin-first-mvp.md` (story-driven MVP intent)

**Acceptance Criteria**:
- Given a sample story file in `.kord-aios/stories/`, runtime extracts N tasks and creates/updates todos idempotently.

**Agent-Executed QA Scenarios**:
```
Scenario: Story loader extracts checkboxes
  Tool: Bash
  Steps:
    1. bun test
  Expected Result: Story runtime tests PASS
```

### 5) Pack Manager MVP (Synkra Pack as Source, Rebranded)

**What to do**:
- Define `.kord-aios/packs/` format and a “Synkra pack” import strategy.
- Implement script-first sync:
  - clone/update upstream Synkra AIOS into a temp location
  - copy the required templates/scripts/skills into `.kord-aios/packs/synkra/`
  - keep a manifest with upstream commit hash

**Must NOT do**:
- Do not vendor the entire upstream repo without a manifest/version pin.

**References**:
- `layer/aios/docs/stories/016-install-payload-separation-opencode.md` (payload separation + sync scripts)
- `layer/aios/docs/stories/010-normalize-opencode-skills-base.md` (runbook/skill contract + bulk scripting)

**Acceptance Criteria**:
- A script exists and is tested (smoke test) that updates the Synkra pack and records upstream version.

**Agent-Executed QA Scenarios**:
```
Scenario: Pack sync script dry-run
  Tool: Bash
  Steps:
    1. bun test
  Expected Result: Script tests PASS
```

### 6) Fused Kord AIOS Agent Roster (Canonical IDs, No Aliases)

**What to do**:
- Define Kord AIOS canonical agent IDs (core + specialists) and their responsibilities.
- Implement registry wiring so the plugin registers Kord AIOS agents as the built-ins.
- Keep OMOC strengths:
  - Sisyphus-style delegation table + dynamic prompt builder
  - Atlas-style orchestration loop
  - Prometheus-style planning constraints (but rebranded)

**References**:
- `src/agents/AGENTS.md` (current OMOC roster + patterns)
- `src/agents/utils.ts` (`agentSources` registry)
- `src/agents/dynamic-agent-prompt-builder.ts` (dynamic prompt composition)
- Synkra roster reference: upstream `docs/guides/user-guide.md` (IDs: @dev, @qa, @architect, @aios-master, etc.)

**Acceptance Criteria**:
- `AgentNameSchema` in `src/config/schema.ts` includes the fused roster.
- No runtime alias translation table is required to select the correct agent.

**Agent-Executed QA Scenarios**:
```
Scenario: Agent registry unit tests
  Tool: Bash
  Steps:
    1. bun test
  Expected Result: Agent registry tests PASS
```

### 7) Rebrand: Config + CLI + Docs (kord-aios → kord-aios)

**What to do**:
- Rename user-facing CLI and config file names:
  - CLI: `kord-aios`
  - Config: `.opencode/kord-aios.json` (project) and `~/.config/opencode/kord-aios.json` (user)
- Remove/disable legacy naming paths (`kord-aios.json`, `kord-aios` bin) to enforce hard rebrand.

**References**:
- `src/cli/index.ts` (CLI entry)
- `src/plugin-config.ts` and `src/plugin-handlers/config-handler.ts` (config paths, merging, schema)
- `package.json` (bin name, exports)

**Acceptance Criteria**:
- `bun run build` succeeds with new names.
- `kord-aios doctor` validates models/providers and flags invalid models early.

**Agent-Executed QA Scenarios**:
```
Scenario: CLI builds and doctor runs in tests
  Tool: Bash
  Steps:
    1. bun run build
    2. bun test
  Expected Result: Build succeeds; tests PASS
```

### 8) Migration Scripts (Token Economy First)

**What to do**:
- Add script(s) that:
  - migrate `.aios-core/` → `.kord-aios/` (paths only; content preserved)
  - migrate `docs/stories/` → `.kord-aios/stories/`
  - update references in docs/templates (string replace with allowlist)
- Ensure scripts are idempotent and safe (dry-run option, backups).

**References**:
- Existing script patterns: `layer/aios/scripts/opencode/normalize-agents-frontmatter.js`
- Story-driven migration notes: `layer/aios/docs/stories/016-install-payload-separation-opencode.md`

**Acceptance Criteria**:
- Running migration scripts twice produces no additional diffs.

**Agent-Executed QA Scenarios**:
```
Scenario: Migration scripts idempotency
  Tool: Bash
  Steps:
    1. bun test
  Expected Result: Script idempotency tests PASS
```

### 9) End-to-End Harness: One Story, One Loop, Evidence Produced

**What to do**:
- Create a minimal sample story in `.kord-aios/stories/` for this repo itself.
- Run the story runtime to generate todos and simulate one loop iteration (unit/integration test harness).
- Ensure evidence paths are created and referenced.

**References**:
- `src/hooks/start-work/*` and `src/hooks/atlas/*` (existing loop mechanisms)
- `layer/aios/docs/stories/013-plugin-install-enable-dev-workflow.md` (install/enable workflow)

**Acceptance Criteria**:
- Integration test passes: story → todos created → one step executed (mocked) → evidence path registered.

---

## Commit Strategy

- Prefer atomic commits by subsystem (delegation fix, paths contract, quick commands, story runtime, roster, CLI/rebrand, migration scripts).
- Always run `bun test` before each commit.

---

## Success Criteria

### Verification Commands
```bash
bun test
bun run typecheck
bun run build
```

### Final Checklist
- [ ] Delegation/subagents work reliably (no Unexpected EOF)
- [ ] `.kord-aios/` contract implemented and used everywhere
- [ ] `*help`, `*yolo`, `*story` work and do not interfere with `/commands`
- [ ] Story runtime can drive todo generation deterministically
- [ ] Fused roster exists with canonical Kord AIOS agent IDs (no alias layer)
- [ ] Migration scripts exist and are idempotent
