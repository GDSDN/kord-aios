# Init & Delivery (Plan 2 - init-delivery)

## TL;DR

> **Quick Summary**: Make `bunx kord-aios init` fully deliver the methodology layer by scaffolding the project and then auto-running `extract`, while staying non-destructive by default. Fix the rules story by moving project rules to `.kord/rules/` and updating rules-injector precedence so user overrides work predictably.
>
> **Deliverables**:
> - `init` auto-runs `extract` (with a `--skip-extract` escape hatch)
> - Init asks project type (greenfield/brownfield) and persists selection (bounded: marker + guidance)
> - Init configures project OpenCode config at `.opencode/opencode.jsonc` (plugin + instructions + providers)
> - Init scaffolds missing methodology directories + 13 `.kord/templates/*` files + story output dirs
> - Project rules live at `.kord/rules/kord-rules.md` and are injected with correct precedence
> - Tests: TDD updates for `init`, `extract`, `rules-injector`, and config-manager (idempotency + non-destructive behavior)
> - `.kord/` methodology pack extended with a small, curated set of standards/checklists (no YAML workflow engine; no Synkra 1:1 copy)
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES (4 waves)
> **Critical Path**: init mode -> project config copy -> rules injection -> model updates -> curated .kord pack -> verification

---

## Context

### Original Request
Continue with “Part 2 of the plan” (init-delivery): improve CLI `init`/`extract` delivery of the methodology framework.

### Confirmed Decisions
- `init` should auto-run `extract`.
- Default behavior should be non-destructive “merge/update in place”. Interpreted as: create missing outputs, preserve user edits, do not clobber unknown files.
- Rules architecture: canonical project-editable rules live under `.kord/rules/` and should take precedence over `docs/kord/rules/` (keep existing search paths for backward compatibility).
- Tests: YES (TDD).
- Plan style: Flat TODO plan (no story/PRD artifact swarm).

### Added Requirements (from user)
- Update Antigravity provider model entries from Claude 4.5 -> 4.6 where applicable.
- Init should configure project-scoped `opencode.json` (in addition to `.opencode/kord-aios.json`).
- Init should create project `.opencode/kord-aios.json` by copying/merging from the global `kord-aios.json` (provider-aware fallbacks are configured globally via `bunx kord-aios install`).
- Per-project init should ask whether this is a New Project vs Current Project (greenfield vs brownfield) similar to Synkra AIOS installer, and use that to choose safe defaults.
- Update docs/guides explaining where model lists/fallbacks live and how the installer writes them.

### Clarification (important)
- `kord-aios.json` is configured globally (user config). Project `.opencode/kord-aios.json` should be created by copying/merging from the global config to avoid ambiguity.
  - Project init should NOT become a second independent provider-config wizard unless explicitly requested.

### Evidence (current repo state)
- CLI:
  - `init`: `src/cli/init/index.ts` (currently does NOT call extract)
  - `extract`: `src/cli/extract.ts`
- Init scaffolds `.kord/templates/` (13 files) and writes `kord-rules.md` at project root via scaffolder.
  - `src/cli/project-layout.ts` (`KORD_RULES_FILE = "kord-rules.md"`)
  - `src/cli/scaffolder.ts`
- Rules injection:
  - Paths: `src/hooks/rules-injector/constants.ts` (`PROJECT_RULE_SUBDIRS` includes `docs/kord/rules/`, not `.kord/rules/`)
  - Discovery/precedence logic: `src/hooks/rules-injector/finder.ts`
- OpenCode config precedence (project-scoped):
  - Low -> high: global config -> project root `opencode.json{,c}` -> `.opencode/opencode.json{,c}`
  - Therefore init should write `.opencode/opencode.jsonc` (preferred) for project-scoped configuration.
- Model defaults + migration:
  - `src/shared/model-requirements.ts` (hardcoded fallbacks)
  - `src/shared/agent-fallback.ts` (`resolveAgentFallbackChain()` uses: user config -> squad -> hardcoded)
  - `src/shared/migration.ts` (config migrations)

---

## Project Artifacts

| Artifact | Agent | Path | Status |
|----------|-------|------|--------|
| Work Plan | plan | `docs/kord/plans/init-delivery.md` | active |

---

## Decision Points

- [ ] Managed-update policy (avoid scope creep)
  - Options:
    - A) Add-missing only by default; overwrite only with `--force` (simplest, safest)
    - B) Update “known-managed” files in-place when safe (requires baseline detection)
  - Recommended: A for templates/agents/skills/commands; selective merge only for `.opencode/kord-aios.json`
  - Risk: “merge/update in place” can balloon into a generic merge engine; explicitly forbid 3-way merge.

- [ ] Legacy rule alias support
  - Decision: whether to also search `.sisyphus/rules/**` as a compatibility alias.
  - Recommended: OPTIONAL, only if user has legacy usage; otherwise defer.

- [ ] Project mode persistence (greenfield vs brownfield)
  - Options:
    - A) Store in `.opencode/kord-aios.json` (requires schema + migration)
    - B) Store in `.kord/` marker (no schema change; used for human guidance now)
  - Recommended: B for Plan 2 to keep scope bounded; optionally revisit A when plugin/hook needs to read it.

- [ ] Project OpenCode config file location
  - Decision: where to write project config updates.
  - Evidence-based answer: use `.opencode/opencode.jsonc` (highest project precedence in OpenCode).

- [ ] Init mode UX labels
  - Decision: choose user-facing labels that clearly differentiate new project vs existing project install without using Synkra wording verbatim.

- [ ] How project-mode context is injected into agent prompts
  - Options:
    - A) Rules-injector only (inject `.kord/rules/**` when tools read/write)
    - B) OpenCode `instructions` config (inject at session start; depends on OpenCode semantics)
    - C) Hybrid (Recommended): keep `.kord/rules/**` as source-of-truth and point OpenCode `instructions` at `.kord/rules/**` for immediate context (robust to renames)
  - Evidence: OpenCode `instructions` supports file paths and globs and injects at session start.
    - Schema: `packages/opencode/src/config/config.ts#L1129`
    - Glob + loading: `packages/opencode/src/session/instruction.ts#L90-L143`
    - System prompt injection: `packages/opencode/src/session/prompt.ts#L652`
  - Rationale: rules-injector is robust + edit-friendly; OpenCode `instructions` avoids “no injection until first tool call”.
  - Decision (locked): write `.opencode/opencode.jsonc` with `instructions: [".kord/rules/**"]`.

- [ ] `.kord/` methodology pack scope
  - Decision: what additional methodology assets (standards/checklists/scripts) should be scaffolded under `.kord/` beyond templates/squads/rules.
  - Guardrail: no YAML workflow engine; no wholesale Synkra port.

---

## Work Objectives

### Core Objective
Make init/extract delivery reliable, non-destructive, testable, and rules-overridable.

### Concrete Deliverables
- CLI behavior:
  - `bunx kord-aios init` creates missing directories/files then auto-runs extract
  - `bunx kord-aios init --skip-extract` scaffolds only
  - `bunx kord-aios extract` remains independently usable
- Project OpenCode config:
  - init creates/merges `.opencode/opencode.jsonc` (preferred) and ensures `kord-aios` plugin is enabled (without breaking existing configs)
  - if Gemini is selected globally, ensure project config does not break it; optionally enable `opencode-antigravity-auth` project-locally (do not copy full provider model catalogs into project config by default)
- Scaffolding:
  - `.kord/rules/kord-rules.md` scaffolded (project-editable)
  - `docs/kord/{stories,epics,prds}/` directories scaffolded
- Rules injection:
  - rules-injector discovers `.kord/rules/**` with precedence over `docs/kord/rules/**` while preserving existing search paths
- Config surface:
  - update Antigravity provider model list to Claude 4.6
  - project `.opencode/kord-aios.json` is created by copying/merging from global `~/.config/opencode/kord-aios.json` (provider-aware fallbacks are configured globally by `bunx kord-aios install`)
  - add init question: project type (greenfield vs brownfield) and persist it (config/marker) for later workflows
  - reduce reliance on hardcoded defaults by using config overrides (minimally: scaffold override slots; optionally add new schema keys + migrations if needed)

### Must NOT Have (Guardrails)
- No generic 3-way merge engine for Markdown/JSONC/YAML.
- No destructive overwrites by default.
- No Plan 3 (squad polish) implementation work.

---

## Verification Strategy (MANDATORY)

### Test Decision
- Infrastructure exists: YES (Bun)
- Automated tests: YES (TDD)
- Framework: `bun test`

### Agent-Executed QA Scenarios (MANDATORY)

All scenarios are verified by the executing agent using tools (Bash / interactive_bash). No human steps.

---

## Execution Strategy

Wave 1 (Init contract + project mode + project config copy): Tasks 1-3, 10-12
Wave 2 (Rules location/precedence + migration behavior): Tasks 4-6
Wave 3 (Model list updates + provider-aware fallbacks + docs): Tasks 7-8, 13-14
Wave 4 (.kord pack additions): Tasks 15-16
Wave 5 (Greenfield bootstrap): Task 17
Wave 6 (Project onboarding UX): Task 19-20
Wave 7 (CLI status): Task 21-22
Wave 8 (Final verification): Task 23

Critical Path: 1 -> 10 -> 11 -> 12 -> 4 -> 6 -> 13 -> 15 -> 17 -> 19 -> 21 -> 23

---

## TODOs

- [ ] 1. Define the “init-delivery contract” (explicit outputs + non-destructive policy)

  **What to do (TDD)**:
  - **RED**: Add/extend tests that assert the contract for `init` and `extract`:
    - expected output directories
    - expected template file count (13) under `.kord/templates/`
    - expected `.opencode/` exports after extract
  - **GREEN**: Implement minimal changes to satisfy contract.
  - **REFACTOR**: Keep the contract documented and deterministic.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `git-master` (for atomic commits)

  **Parallelization**:
  - Can Run In Parallel: NO

  **References**:
  - `src/cli/init/index.ts` - init behavior to test/modify
  - `src/cli/init/index.test.ts` - existing init tests to extend
  - `src/cli/extract.ts` - extract behavior to test/modify
  - `src/cli/scaffolder.ts` - which files init scaffolds
  - `src/cli/project-layout.ts` - authoritative template constants

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/init/index.test.ts` -> PASS
  - [ ] Contract test asserts `.kord/templates/` contains 13 template/checklist files

  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: init scaffolds minimal layout deterministically
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir>
      3. Assert: <tempdir>/.kord/templates/story.md exists
      4. Assert: <tempdir>/.kord/templates/checklist-story-dod.md exists
      5. Assert: <tempdir>/docs/kord/plans/ exists
    Expected Result: Required directories/files exist
  ```

- [ ] 2. Make `init` auto-run `extract` (with non-TTY-safe escape hatch)

  **What to do (TDD)**:
  - **RED**: Add failing test: init should create `.opencode/agents`, `.opencode/skills`, `.opencode/commands` after init completes.
  - **GREEN**: Update `src/cli/init/index.ts` to call `extract({ directory: cwd, ... })` after scaffolding.
  - Add `--skip-extract` (or equivalent) to CLI wiring in `src/cli/index.ts` and to init options.
  - Add `--project-mode` flag as non-interactive override (values: `new` | `existing`) to avoid prompts in automation.
  - Define failure semantics: if extract fails, init returns exitCode 1 and prints actionable errors.

  **Must NOT do**:
  - Do not duplicate extract logic inside init.

  **References**:
  - `src/cli/index.ts` - command flags for init/extract
  - `src/cli/init/index.ts` - where to call extract
  - `src/cli/extract.ts` - extract return code and target dir logic

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/init/index.test.ts` -> PASS
  - [ ] Running init in tests results in `.opencode/agents/*.md` being copied

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: init auto-runs extract by default
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir>
      3. Assert: <tempdir>/.opencode/agents/ exists and contains at least 1 .md file
      4. Assert: <tempdir>/.opencode/skills/ exists and contains at least 1 SKILL.md
      5. Assert: <tempdir>/.opencode/commands/ exists and contains at least 1 file
    Expected Result: init delivers methodology exports via extract

  Scenario: init can skip extract
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir> --skip-extract
      3. Assert: <tempdir>/.opencode/agents/ does NOT exist (or is empty)
    Expected Result: extract is not executed when explicitly skipped
  ```

- [ ] 3. Define and implement “merge/update in place” without a merge engine

  **What to do (TDD)**:
  - Encode policy in tests:
    - Default: create missing; skip existing
    - `--force`: overwrite managed outputs
    - Preserve user edits: if a target file is edited, init/extract does not overwrite without `--force`
  - If a selective merge is needed, constrain it to `.opencode/kord-aios.json` only (JSONC-aware).

  **References**:
  - `src/cli/scaffolder.ts` - current silent-skip behavior
  - `src/cli/extract.ts` - current skip/force/diff behavior
  - `src/cli/config-manager.ts` - JSONC parsing/writing patterns

  **Acceptance Criteria**:
  - [ ] Tests demonstrate idempotency: init twice makes no destructive changes
  - [ ] Tests demonstrate preservation of user edits on extracted artifacts

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: rerun init preserves user edits by default
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir>
      3. Modify: <tempdir>/.kord/templates/story.md (append a unique marker line)
      4. Run: bunx kord-aios init --directory <tempdir>
      5. Assert: the unique marker line still exists in story.md
    Expected Result: non-destructive default behavior

  Scenario: force overwrites managed outputs
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir>
      3. Modify: <tempdir>/.kord/templates/story.md (append a unique marker line)
      4. Run: bunx kord-aios init --directory <tempdir> --force
      5. Assert: the unique marker line is NOT present in story.md
    Expected Result: explicit force enables overwrites
  ```

- [ ] 4. Move project rules to `.kord/rules/` and scaffold rules there

  **What to do (TDD)**:
  - **RED**: Update init test expectation from root `kord-rules.md` to `.kord/rules/kord-rules.md`.
  - **GREEN**: Update scaffolding to create `.kord/rules/` directory and write the rules file there.
  - Add migration behavior: if legacy root `kord-rules.md` exists and `.kord/rules/` does not, copy it into `.kord/rules/` (do not delete legacy file).

  **References**:
  - `src/cli/project-layout.ts` - current `KORD_RULES_FILE` + content
  - `src/cli/scaffolder.ts` - where the rules file is written today
  - `src/cli/kord-directory.ts` - add `rules` to created subdirs (if desired)
  - `src/cli/init/index.test.ts` - update assertions

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/init/index.test.ts` -> PASS
  - [ ] `.kord/rules/kord-rules.md` exists after init

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: init scaffolds project rules into .kord/rules
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir> --skip-extract
      3. Assert: <tempdir>/.kord/rules/kord-rules.md exists
    Expected Result: canonical rules file is project-editable and discoverable
  ```

- [ ] 5. Update rules-injector to discover `.kord/rules/**` with deterministic precedence

  **What to do (TDD)**:
  - **RED**: Add a rules-injector test showing `.kord/rules/` shadows `docs/kord/rules/` when both exist.
  - **GREEN**: Add `.kord/rules/` to `PROJECT_RULE_SUBDIRS`.
  - Ensure order remains deterministic; ensure global `~/.claude/rules/` stays last.

  **Must NOT do**:
  - Do not add new runtime “rule engine” behavior; this is discovery/precedence only.

  **References**:
  - `src/hooks/rules-injector/constants.ts` - add `.kord/rules` search path
  - `src/hooks/rules-injector/finder.ts` - distance/precedence logic
  - `src/hooks/rules-injector/finder.test.ts` - add precedence regression tests

  **Acceptance Criteria**:
  - [ ] `bun test src/hooks/rules-injector/` -> PASS
  - [ ] New test proves `.kord/rules/` precedence

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: rules precedence is enforced by tests
    Tool: Bash
    Preconditions: none
    Steps:
      1. Run: bun test src/hooks/rules-injector/finder.test.ts
      2. Assert: exit code 0
    Expected Result: precedence behavior is regression-tested
  ```

- [ ] 6. (Optional) Add legacy alias support if needed (`.sisyphus/rules/**`)

  **What to do**:
  - Only implement if the user confirms they rely on legacy OMOC `.sisyphus/rules/`.
  - Add as another search root with lower precedence than `.kord/rules/`.

  **Acceptance Criteria**:
  - [ ] Alias behavior is covered by a unit test

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: legacy alias path support is covered
    Tool: Bash
    Preconditions: alias support implemented
    Steps:
      1. Run: bun test src/hooks/rules-injector/
      2. Assert: exit code 0
    Expected Result: alias does not break existing discovery
  ```

- [ ] 7. Make provider model defaults configurable (minimally invasive)

  **What to do (TDD)**:
  - Decide approach:
    - Prefer using existing config override surfaces (`agents.*.fallback`, `categories.*.fallback_slots`) by scaffolding examples into `.opencode/kord-aios.json` and documenting precedence.
    - If still insufficient, add explicit config keys and migrations (keep backward compatible).
  - Add tests for config migration and fallback resolution.

  **References**:
  - `src/shared/model-requirements.ts` - current hardcoded fallback chains
  - `src/shared/agent-fallback.ts` - user config precedence behavior
  - `src/config/schema.ts` - where new keys (if any) must be added
  - `src/shared/migration.ts` - migration patterns + backups

  **Acceptance Criteria**:
  - [ ] `bun test` includes a regression ensuring user config overrides hardcoded defaults
  - [ ] No breaking changes to existing config files

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: user-config fallback overrides hardcoded chain
    Tool: Bash
    Preconditions: tests updated
    Steps:
      1. Run: bun test
      2. Assert: exit code 0
    Expected Result: overrides are validated by regression tests
  ```

- [ ] 8. Init scaffolds story delivery directories (`docs/kord/stories/`, `docs/kord/epics/`, `docs/kord/prds/`)

  **What to do (TDD)**:
  - Add failing test expecting those directories after init.
  - Implement directory creation with non-destructive behavior.

  **References**:
  - `src/cli/init/index.ts` - orchestration
  - `src/cli/scaffolder.ts` - currently creates `docs/kord/{plans,drafts,notepads}`
  - `src/cli/project-layout.ts` - `KORD_DOCS_DIR` + output subdir list

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/init/index.test.ts` -> PASS
  - [ ] Directories exist in a temp project after init

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: init scaffolds story delivery directories
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir> --skip-extract
      3. Assert: <tempdir>/docs/kord/stories/ exists
      4. Assert: <tempdir>/docs/kord/epics/ exists
      5. Assert: <tempdir>/docs/kord/prds/ exists
    Expected Result: output directories exist for story-driven artifacts
  ```

- [ ] 17. Optional greenfield bootstrap (fast start)

  **What to do (TDD)**:
  - Add an explicit bootstrap step that ONLY runs for "New Project" mode (greenfield) and ONLY when user opts in.
  - Bootstrap should be safe and minimal:
    - If no `.git/`: offer to run `git init` (or provide `--bootstrap-git` flag).
    - If no `package.json`: offer to create a minimal `package.json` (no dependency installs).
  - Never run bootstrap automatically for Existing Project (brownfield).
  - Ensure non-TTY behavior is deterministic:
    - default: do NOT bootstrap
    - require flags to enable

  **References**:
  - Synkra reference (local): `D:\dev\synkra-aios\bin\aios-init.js` (bootstraps git + package.json when missing)
  - `src/cli/init/index.ts` - where mode selection and bootstrap hooks belong

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/init/index.test.ts` -> PASS
  - [ ] Greenfield + `--bootstrap` creates `.git/` and `package.json` when missing
  - [ ] Brownfield never bootstraps unless explicitly forced (and even then, should refuse)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: greenfield bootstrap creates git + package.json
    Tool: Bash
    Preconditions: git installed
    Steps:
      1. Create empty temp dir
      2. Run: bunx kord-aios init --directory <tempdir> --skip-extract --project-mode new --bootstrap
      3. Assert: <tempdir>/.git/ exists
      4. Assert: <tempdir>/package.json exists
    Expected Result: fast-start bootstrap works for new projects

  Scenario: brownfield refuses bootstrap
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir with package.json present
      2. Run: bunx kord-aios init --directory <tempdir> --skip-extract --project-mode existing --bootstrap
      3. Assert: exit code is non-zero and message explains refusal
    Expected Result: bootstrap is blocked for existing projects
  ```

- [ ] 18. Ensure agents can reliably know the chosen init mode

  **What to do (TDD)**:
  - Persist project context in a way that our engine reliably injects into prompts (no “first session” special-casing):
    - Write `.kord/rules/project-mode.md` containing:
      - `Project Mode: New Project` or `Project Mode: Existing Project`
      - `Project Stage: ...` (see stages below)
      - A short “read-first” pointer to the correct guide under `.kord/guides/`
      - A small “sunset clause”: once the project reaches the next stage, agents should stop re-reading onboarding sections.
    - Content must be mode-specific:
      - New Project version emphasizes bootstrap/planning-first
      - Existing Project version emphasizes analysis/baseline-first
  - Recommended stage model (Synkra-inspired phases, but lightweight and file-based):
    - Track is a *workflow track*, not a permanent label about business maturity.
    - Stages are about onboarding readiness to avoid agents re-running “setup” guidance forever.
    - New Project stages:
      - `NEW_SETUP` (bootstrap + planning guidance still applies)
      - `NEW_ACTIVE` (normal story cycle; onboarding guidance is sunset)
    - Existing Project stages:
      - `EXISTING_UNASSESSED` (analysis/doc-first guidance applies)
      - `EXISTING_BASELINED` (normal story cycle; analysis guidance is sunset)
  - Stage promotion should be explicit and non-ambiguous:
    - `NEW_SETUP -> NEW_ACTIVE` when a short "greenfield onboarding checklist" inside `project-mode.md` is fully checked.
      - Rationale: a project may already be deployed; it should not be stuck in “new project” guidance.
    - `EXISTING_UNASSESSED -> EXISTING_BASELINED` when the "brownfield baseline checklist" is fully checked.
  - Stage promotion is agent-executable and does NOT require deleting rules:
    - Agents update `Project Stage:` line when criteria are met.
    - File stays forever but becomes a tiny pointer once “ACTIVE/BASELINED”.
  - Extend rules-injector tests to ensure `.kord/rules/project-mode.md` is discoverable and injected when tools touch files.

  **References**:
  - `src/hooks/rules-injector/constants.ts` + `src/hooks/rules-injector/finder.ts`
  - `docs/kord/plans/init-delivery.md` Task 4/5 (rules location + precedence)
  - Synkra evidence (local): `D:\dev\synkra-aios\.aios-core\core\orchestration\greenfield-handler.js` (greenfield phases + indicators)
  - Synkra evidence (local): `D:\dev\synkra-aios\.aios-core\working-in-the-brownfield.md` (workflow-choice framing)

  **Acceptance Criteria**:
  - [ ] `bun test src/hooks/rules-injector/` -> PASS
  - [ ] A test asserts `project-mode.md` is included in injected rules when present
  - [ ] `project-mode.md` includes `Project Mode:` and `Project Stage:` lines
  - [ ] `project-mode.md` includes a short checklist section for stage promotion (greenfield + brownfield)

- [ ] 19. Add mode-aware onboarding injection strategy (rules + optional OpenCode instructions)

  **What to do**:
  - Implement the chosen injection approach from the Decision Point "How project-mode context is injected":
    - Always: scaffold `.kord/rules/project-mode.md` (mode-specific) and ensure rules-injector finds `.kord/rules/**`.
    - Set OpenCode `instructions` in `.opencode/opencode.jsonc` to point at `.kord/rules/**`.
  - Ensure this does NOT create conflicting instructions between OpenCode `instructions` and rules-injector output.

  **Acceptance Criteria**:
  - [ ] OpenCode `instructions` includes `.kord/rules/**` and injects project rules at session start
  - [ ] There is exactly one canonical project-mode source of truth: `.kord/rules/project-mode.md`
  - [ ] Agents reliably see project mode/stage before doing planning work (either via `instructions` or first tool injection)

  **Evidence**:
  - OpenCode instructions schema: `https://github.com/sst/opencode/blob/715b844c2a88810b6178d7a2467c7d36ea8fb764/packages/opencode/src/config/config.ts#L1129`
  - OpenCode instruction glob + load: `https://github.com/sst/opencode/blob/715b844c2a88810b6178d7a2467c7d36ea8fb764/packages/opencode/src/session/instruction.ts#L90-L143`
  - OpenCode system injection: `https://github.com/sst/opencode/blob/715b844c2a88810b6178d7a2467c7d36ea8fb764/packages/opencode/src/session/prompt.ts#L652`

- [ ] 20. Add a minimal Kord banner + project context summary in CLI output (install/init/run)

  **What to do**:
  - For `bunx kord-aios install` and `bunx kord-aios init`, print a short banner and a 3-line summary:
    - Project Mode, Project Stage, and "Read-first" path.
  - For `bunx kord-aios run` (if used), print the same summary before streaming OpenCode events.
  - Keep this informational only (no behavior changes).

  **References**:
  - `src/cli/install.ts` (install output)
  - `src/cli/init/index.ts` (init output)
  - `src/cli/run/` (run output)

  **Acceptance Criteria**:
  - [ ] Output is deterministic and testable (snapshot or string-contains tests)
  - [ ] No banner is printed in machine mode unless TTY (or behind `--verbose`)

- [ ] 21. Add `bunx kord-aios status` for project status summary (CLI)

  **What to do**:
  - Add a new CLI command: `kord-aios status`
  - It should print:
    - detected project root
    - whether `.kord/rules/project-mode.md` exists; if it does, parse and print:
      - `Project Mode:`
      - `Project Stage:`
      - `Read-first:` (guide pointer)
      - If fields are missing, print a warning and the exact expected header lines
    - whether `.opencode/opencode.jsonc` exists, and whether it contains `instructions: [".kord/rules/**"]` (must match glob)
    - (optional) git branch and dirty summary, without leaking file contents
    - (optional) whether `docs/kord/boulder.json` exists and current active plan name if present
  - Keep it safe for scripting with `--json` option.

  **References**:
  - `src/cli/index.ts` (command wiring)
  - `src/cli/config-manager.ts` (config paths and JSONC parsing patterns)
  - `src/cli/project-detector.ts` (project root detection patterns)

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/index.test.ts` -> PASS
  - [ ] `bunx kord-aios status --json` outputs valid JSON with keys:
    - `projectRoot`, `projectMode`, `projectStage`, `readFirst`, `opencodeProjectConfigPath`, `opencodeInstructionsGlobOk`
  - [ ] When `.kord/rules/project-mode.md` is missing, status output includes a clear next step

- [ ] 22. Align docs/AGENTS.md to mention `kord-aios status`

  **What to do**:
  - Update internal docs so agents know where to look for project status signals.
  - Prefer AGENTS.md (agent-facing) over root README.
  - Ensure the CLI doc lists key commands:
    - `kord-aios install`, `kord-aios init`, `kord-aios run`, `kord-aios status`, `kord-aios doctor`, `kord-aios extract`

  **References**:
  - `src/cli/AGENTS.md`

  **Acceptance Criteria**:
  - [ ] `src/cli/AGENTS.md` documents `kord-aios status`.

- [x] 23. Final verification + documentation touch-ups

  **What to do**:
  - Run:
    - `bun run typecheck`
    - `bun run build`
    - `bun test`
  - Update any CLI help text to reflect `--skip-extract` and rules location changes.

  **Acceptance Criteria**:
  - [x] `bun run typecheck` -> PASS
  - [x] `bun run build` -> PASS
  - [x] `bun test` -> PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: full CI-equivalent verification
    Tool: Bash
    Preconditions: all previous tasks complete
    Steps:
      1. Run: bun run typecheck
      2. Assert: exit code 0
      3. Run: bun run build
      4. Assert: exit code 0
      5. Run: bun test
      6. Assert: exit code 0
    Expected Result: repo is green after init-delivery changes
  ```

- [ ] 10. Add init "New Project vs Current Project" (greenfield vs brownfield) mode

  **What to do (TDD)**:
  - **RED**: Add tests covering mode selection + detection defaults:
    - empty/new directory defaults to greenfield
    - existing project markers (e.g., `package.json` or `.git`) default to brownfield for safety
    - interactive init asks user to confirm/override
    - if user-selected mode contradicts detected mode, print a warning and show the recommended choice (Synkra-style)
  - **GREEN**: Implement minimal mode detection + prompt with intentional UX copy:
    - New Project: "Start a new project from scratch" (greenfield)
    - Existing Project: "Add Kord AIOS to an existing project" (brownfield)
    - Avoid copying Synkra text verbatim.
  - Persist the chosen mode in a project-scoped place (decision required):
    - Option A: add a backward-compatible field to `.opencode/kord-aios.json` (requires schema + migration)
    - Option B: write a small marker file under `.kord/` (no schema changes)
  - Use the mode to influence onboarding output (bounded scope):
    - Greenfield: print next-step guidance focused on PRD/story creation
    - Brownfield: print next-step guidance focused on project analysis/documentation first

  **References**:
  - Synkra reference (local): `D:\dev\synkra-aios\packages\installer\src\detection\detect-project-type.js` (greenfield/brownfield detection)
  - Synkra reference (local): `D:\dev\synkra-aios\packages\installer\src\wizard\questions.js` (project type question)
  - `src/cli/init/index.ts` - where to plug the prompt/detection

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/init/index.test.ts` -> PASS
  - [ ] Mode selection is deterministic in non-TTY (safe default) and prompt-driven in TTY
  - [ ] Init output includes mode-specific next-step guidance (assertable in tests)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: init asks project type and persists selection
    Tool: interactive_bash (tmux)
    Preconditions: TTY available; bunx kord-aios runnable
    Steps:
      1. Create temp dir
      2. Start: bunx kord-aios init --directory <tempdir> --skip-extract
      3. Wait for prompt text: "Is this a new project or an existing project?"
      4. Select: "Current Project" (brownfield)
      5. Complete init
      6. Assert: a persisted marker exists (either .kord marker file or config field)
      7. Assert: init output contains a brownfield-oriented next step (analysis/documentation first)
    Expected Result: mode selection influences onboarding guidance and is persisted
  ```

- [ ] 11. Copy global `kord-aios.json` into project `.opencode/kord-aios.json` (no ambiguity)

  **What to do (TDD)**:
  - **RED**: Add tests showing init writes project `.opencode/kord-aios.json` by copying/merging from the global config (`~/.config/opencode/kord-aios.json`), with add-only merge (project values win).
  - Behavior requirements (locked):
    - If global config exists: copy/merge into project.
    - If global config is missing: write minimal project config with `$schema` and print next steps telling the user to run `bunx kord-aios install`.
    - Init should NOT ask provider questions.

  **References**:
  - `src/cli/config-manager.ts` - `writeProjectKordAiosConfig()` merge strategy (global -> project)
  - `src/shared/agent-fallback.ts` - precedence: user config -> squad -> hardcoded

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/init/index.test.ts` -> PASS
  - [ ] When global config exists, project `.opencode/kord-aios.json` contains agent/category fallback config copied from global
  - [ ] When global config is missing, project `.opencode/kord-aios.json` contains only `$schema` (and no provider assumptions)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: init copies global kord-aios.json into project
    Tool: Bash
    Preconditions: global config exists at ~/.config/opencode/kord-aios.json (or platform equivalent)
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir> --skip-extract
      3. Assert: <tempdir>/.opencode/kord-aios.json exists
      4. Assert: file contains at least one `agents` or `categories` override copied from global
    Expected Result: project config mirrors global fallback settings without prompting
  ```

- [ ] 12. Configure project-scoped `opencode.json` during init (plugin + instructions + providers)

  **What to do (TDD)**:
  - **RED**: Add tests asserting init creates/merges a project `opencode.json` without breaking existing configs.
  - Requirements (default approach):
    - Ensure `kord-aios` is listed in `plugin` array.
    - Ensure OpenCode `instructions` includes `.kord/rules/**` (glob) so all project rules are injected at session start.
    - Ensure `.kord/rules/project-mode.md` exists (mode-specific) as the canonical place to store Project Mode/Stage.
    - If Gemini is selected globally, ensure project config does NOT break it; optionally add `opencode-antigravity-auth` to project plugin list for project-local enablement.
    - Default: do NOT copy full provider model catalogs into project opencode.jsonc; rely on global provider config unless explicitly requested.
  - Discovery requirement (research-backed): confirm OpenCode config precedence for project configs before implementing.

  **Decision (locked)**:
  - Write project config to `.opencode/opencode.jsonc` (preferred) or `.opencode/opencode.json` if JSONC not feasible.

  **References**:
  - `src/cli/config-manager.ts` - existing plugin/provider manipulation patterns
  - `src/cli/init/index.test.ts` - init should not touch global opencode.json, but now should manage project-level
  - OpenCode source (librarian evidence) - confirm config location/precedence
  - Official precedence comment: `https://github.com/sst/opencode/blob/715b844c2a88810b6178d7a2467c7d36ea8fb764/packages/opencode/src/config/config.ts#L76-L83`
  - Project file discovery: `https://github.com/sst/opencode/blob/715b844c2a88810b6178d7a2467c7d36ea8fb764/packages/opencode/src/config/paths.ts#L8-L18`

  **Acceptance Criteria**:
  - [ ] Tests cover: create new project opencode.json, merge into existing, avoid duplication, preserve unrelated keys

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: init writes project .opencode/opencode.jsonc with plugin enabled
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir> --skip-extract
      3. Assert: <tempdir>/.opencode/opencode.jsonc exists (or opencode.json)
      4. Assert: config contains "kord-aios" in plugin array
      5. Assert: config includes instruction pointing at .kord/rules/kord-rules.md
    Expected Result: project-scoped OpenCode config is present and correct
  ```

- [ ] 13. Update Antigravity provider models from Claude 4.5 -> 4.6 (small bump)

  **What to do (TDD)**:
  - **RED**: Add/update tests for the Antigravity provider config model keys.
  - **GREEN**: Update `ANTIGRAVITY_PROVIDER_CONFIG` in `src/cli/config-manager.ts`:
    - `antigravity-claude-sonnet-4-5` -> `antigravity-claude-sonnet-4-6`
    - `antigravity-claude-sonnet-4-5-thinking` -> `antigravity-claude-sonnet-4-6-thinking`
    - `antigravity-claude-opus-4-5-thinking` -> `antigravity-claude-opus-4-6-thinking`
  - Also update Gemini model naming:
    - `antigravity-gemini-3-pro` -> `antigravity-gemini-3.1-pro`
    - Confirm canonical ID and any required variants by checking opencode-antigravity-auth docs before landing changes.
  - Update any installer hints/docs that mention Opus/Sonnet 4.5.

  **References**:
  - `src/cli/config-manager.ts` - `ANTIGRAVITY_PROVIDER_CONFIG`
  - `src/cli/config-manager.test.ts` - antigravity plugin/provider tests
  - `src/cli/install.ts` - user-facing model hints
  - `docs/kord/MODEL-USAGE-GUIDE.md` - model list documentation

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/config-manager.test.ts` -> PASS
  - [ ] No remaining references to antigravity Claude 4.5 model IDs

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: antigravity model IDs updated
    Tool: Bash
    Preconditions: changes implemented
    Steps:
      1. Run: bun test src/cli/config-manager.test.ts
      2. Assert: exit code 0
      3. Run: git grep "antigravity-claude-.*-4-5" -- src docs || true
      4. Assert: no matches
    Expected Result: 4.5 model IDs are fully migrated to 4.6
  ```

- [ ] 14. Documentation updates: models + fallbacks + init modes + manual update guidance

  **What to do**:
  - Update docs to clearly answer:
    - Where provider model lists live (opencode.json provider block; kord-aios.json agent/category fallbacks)
    - How install (global) decides which providers/models to write
    - How init (project) copies global into `.opencode/` (no ambiguity)
    - How to manually change provider models/fallback slots after install
    - Greenfield vs brownfield meaning and what changes in defaults
    - How to check project state quickly:
      - `bunx kord-aios status`

  **References**:
  - `docs/kord/MODEL-USAGE-GUIDE.md`
  - `src/shared/model-requirements.ts` - hardcoded fallback chains (what config overrides)
  - `src/shared/agent-fallback.ts` - precedence order (user config vs hardcoded)
  - `src/cli/install.ts` - provider selection questions/hints
  - `src/cli/config-manager.ts` - writes opencode.json plugins/providers and kord-aios.json merge behavior
  - `src/features/builtin-skills/AGENTS.md` (skill/template docs)
  - `src/cli/AGENTS.md` (scaffolded templates)

  **Acceptance Criteria**:
  - [ ] Docs are consistent with actual scaffolded files and config keys
  - [ ] Docs explicitly document "where to change models" (code sources) and "what installer writes" (project vs global)
  - [ ] Updated docs are English-only

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: docs updates are internally consistent
    Tool: Bash
    Preconditions: docs updated
    Steps:
      1. Run: git grep "Opus 4.5" -- docs src || true
      2. Confirm remaining references are intentional (or none)
      3. Run: bun test
      4. Assert: exit code 0
    Expected Result: docs are updated without breaking tests
  ```


- [ ] 15. Extend `.kord/` with a curated methodology pack (standards + checklists + AGENTS.md)

  **What to do (TDD)**:
  - Add a curated methodology pack under `.kord/` that is intentionally designed for **our plugin-based execution model**.
  - Selection rubric (to avoid random/simplified picks): every scaffolded doc must satisfy:
    - It is referenced by, or directly useful to, our Kord AIOS agents/skills (prompt-reading value).
    - It is stable, non-executable methodology content (no workflow engine required).
    - It is short enough to maintain (target: <= 200 lines per file) and English-only.
    - It does not introduce “constitution/constitutional gates” framing.
  - Standards (scaffold under `.kord/standards/`):
    - `.kord/standards/quality-gates.md` (advisory quality gates; how to verify work)
    - `.kord/standards/decision-heuristics.md` (when to checkpoint, when to ask, how to avoid scope creep)
    - `.kord/standards/quality-dimensions.md` (optional; can be deferred)
  - Guides (scaffold under `.kord/guides/`):
    - `.kord/guides/new-project.md` (greenfield onboarding; which templates to use first)
    - `.kord/guides/existing-project.md` (brownfield onboarding; analyze/document first, then story cycle)
  - Checklists (scaffold as templates under `.kord/templates/`):
    - `.kord/templates/checklist-agent-quality-gate.md`
  - Agent-facing documentation convention:
    - Create `.kord/AGENTS.md` with a quick index of what `.kord/` contains (templates, standards, rules).
    - Create `.kord/standards/AGENTS.md` describing what each standard doc is for and when agents should consult it.
    - Create `.kord/guides/AGENTS.md` describing what each guide is for.
  - Update scaffolder to create these files add-only by default; overwrite only with `--force`.

  **Must NOT do**:
  - Do not add a YAML workflow engine.
  - Do not port Synkra `.aios-core` wholesale.
  - Do not use “constitution” wording or mandatory “constitutional gates”. Keep language advisory.
  - Do not create a “framework within the framework” (keep it minimal and referenced).

  **References**:
  - `src/cli/scaffolder.ts` - scaffold entries (currently only templates + root rules)
  - `src/cli/project-layout.ts` - add new markdown constants (English-only)
  - Synkra reference (local, for inspiration only):
    - `D:\dev\synkra-aios\.aios-core\docs\standards\QUALITY-GATES-SPECIFICATION.md`
    - `D:\dev\synkra-aios\.aios-core\development\data\decision-heuristics-framework.md`
    - `D:\dev\synkra-aios\.aios-core\development\data\quality-dimensions-framework.md`
    - `D:\dev\synkra-aios\.aios-core\development\checklists\agent-quality-gate.md`

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/scaffolder.test.ts` -> PASS
  - [ ] After init, the new `.kord/standards/*.md` files exist
  - [ ] After init, the new `.kord/guides/*.md` files exist
  - [ ] New checklist template exists under `.kord/templates/`
  - [ ] `.kord/AGENTS.md` exists after init
  - [ ] `.kord/standards/AGENTS.md` exists after init
  - [ ] `.kord/guides/AGENTS.md` exists after init

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: init scaffolds methodology pack files
    Tool: Bash
    Preconditions: none
    Steps:
      1. Create temp dir
      2. Run: bunx kord-aios init --directory <tempdir> --skip-extract
      3. Assert: <tempdir>/.kord/standards/quality-gates.md exists
      4. Assert: <tempdir>/.kord/templates/checklist-agent-quality-gate.md exists
      5. Assert: <tempdir>/.kord/AGENTS.md exists
      6. Assert: <tempdir>/.kord/standards/AGENTS.md exists
      7. Assert: <tempdir>/.kord/guides/new-project.md exists
      8. Assert: <tempdir>/.kord/guides/AGENTS.md exists
    Expected Result: curated methodology references are present
  ```


- [ ] 16. Inventory Synkra scripts and decide how (or whether) to integrate them

  **What to do**:
  - Inspect Synkra’s `.aios-core/development/scripts/` (and any “workflow intelligence” scripts) and produce an adaptation matrix for Kord AIOS:
    - Category A: should become a **Kord tool** (deterministic TS) in this repo
    - Category B: should become **skill/prompt content** (methodology)
    - Category C: should be **omitted** (redundant with plugin execution or too heavy)
  - Output a single doc in this repo (agent-facing, not a README):
    - `docs/kord/research/init-delivery-scripts.md`
    - Include: script name, purpose, required inputs, outputs, how it maps to our existing tools (`checklist_runner`, story tools, build hook, etc.), and a recommendation (A/B/C).
  - Guardrail: do NOT ship a large script suite into user projects in Plan 2.

  **References**:
  - Synkra (local): `D:\dev\synkra-aios\.aios-core\development\scripts\`
  - Kord tools: `src/tools/**`
  - Build hook prompt: `src/hooks/build/index.ts`

  **Acceptance Criteria**:
  - [ ] `docs/kord/research/init-delivery-scripts.md` exists and is English-only
  - [ ] Matrix includes at least 15 scripts and a justified A/B/C classification

---

## Commit Strategy

| After Task(s) | Commit Message | Notes |
|--------------|----------------|-------|
| 1-3 | `feat(cli): define init-delivery contract and auto-extract behavior` | Include tests |
| 10-12 | `feat(cli): add init modes, project config copy, and project opencode.jsonc` | Keep bounded; tests required |
| 4-5 | `feat(rules): move project rules to .kord/rules and update injector precedence` | Include rules-injector tests |
| 7-8 | `feat(config): provider-aware fallbacks and docs output dirs` | Backward compatible |
| 13-14 | `docs(config): update antigravity models and fallback guidance` | Keep English-only docs |
| 15-16 | `feat(cli): scaffold curated .kord methodology pack` | Keep advisory; no YAML engine |
| 23 | `test: full verification for init-delivery plan` | If needed |

---

## Success Criteria

### Verification Commands
```bash
bun run typecheck
bun run build
bun test
```

### Final Checklist
- [x] `init` auto-runs `extract` by default; can skip with flag
- [x] Non-destructive defaults; destructive operations require explicit force
- [x] `.kord/rules/` is canonical; rules-injector precedence is tested and documented
- [x] Init scaffolds `docs/kord/{stories,epics,prds}/`
- [x] Project `.opencode/kord-aios.json` is created by copying/mering from global config (no ambiguity)
- [x] Project `.opencode/opencode.jsonc` is created/merged with `kord-aios` plugin enabled
- [x] Antigravity model IDs updated (Claude 4.6 + Gemini 3.1 Pro)
- [x] `.kord/standards/` + `.kord/standards/AGENTS.md` scaffolded (curated pack)
- [x] Script integration matrix exists: `docs/kord/research/init-delivery-scripts.md`
- [x] Provider model overrides are configurable without breaking existing configs
- [x] `kord-aios status` prints project mode/stage and verifies `.kord/rules/**` instructions are configured
