# Installer Optimization: Smart Merge + Project Config + Init Command

## TL;DR

> **Quick Summary**: Refactor the kord-aios CLI installer to stop overwriting global config on re-install, add smart (add-only) merging, create a `kord-aios init` command for project scaffolding, and generate project-level `.opencode/kord-aios.json` for per-project customization.
> 
> **Deliverables**:
> - Smart merge in `writeKordAiosConfig()` — add-only, never overwrite existing values
> - Provider detection — skip questions for already-configured providers
> - New `kord-aios init` CLI command — scaffold project + copy global config to project-level
> - `install` command also creates project-level `.opencode/kord-aios.json`
> - Updated tests for all changed CLI modules
> - Updated `docs/guide/installation.md` with new flow
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 (smart merge) → Task 3 (install flow) → Task 5 (init command) → Task 7 (tests) → Task 8 (docs)

---

## Context

### Original Request

The user discovered that re-running `bunx kord-aios install` in a new project overwrites the global `kord-aios.json`, destroying customizations made for a previous project. Additionally, provider subscription questions (7 questions about Claude, OpenAI, Gemini, etc.) are asked every time, even when providers are already authenticated. The installer also doesn't create project-level config, despite the runtime already supporting it.

### Interview Summary

**Key Discussions**:
- **Config Strategy**: "Global mirror + Project override" — global keeps model config (written once), project gets a copy for per-project customization
- **Provider Questions**: Skip if providers are already configured in existing global config. Only ask about what's missing.
- **Auto-Init**: Separate `kord-aios init` command (not hook-based). Scaffolds project + copies global config to `.opencode/kord-aios.json`
- **Model Resolution**: Keep current static architecture. Installer generates "golden path" defaults, user overrides via kord-aios.json. Fallback pipeline exists as safety net.
- **Model Defaults Optimization**: Explicitly OUT OF SCOPE for this plan
- **Test Strategy**: Include tests + docs updates

**Research Findings**:
- Runtime (`plugin-config.ts:93-136`) already loads global then project config with deep merge — project wins
- Project config path: `.opencode/kord-aios.json` (already supported, never created by installer)
- `writeKordAiosConfig()` at `config-manager.ts:322` uses `deepMerge(existing, newConfig)` where newConfig overrides — needs reversal for add-only
- `detectCurrentConfig()` at `config-manager.ts:700` already detects existing providers from global config
- `connected-providers-cache.ts` tracks connected providers at runtime (not needed for installer changes)

### Self-Analysis (Gap Review)

**Gaps Identified and Addressed**:
1. **Edge case: `kord-aios init` when project config already exists** → Default: skip if exists (no `--force` discussed)
2. **Edge case: First install vs re-install** → First install: full flow. Re-install: smart merge + skip configured providers
3. **Edge case: `addAuthPlugins()` and `addProviderConfig()` also write to global** → Apply same add-only principle
4. **Backward compatibility**: Users expecting current behavior → provider questions still available via `--reconfigure` flag
5. **`kord-aios init` when no global config exists** → Create minimal config with $schema only, warn user to run `install` first

---

## Work Objectives

### Core Objective
Make the kord-aios installer idempotent and project-aware: re-running install never destroys existing config, each project gets its own config copy, and unnecessary provider questions are skipped.

### Concrete Deliverables
- Refactored `writeKordAiosConfig()` with add-only merge
- Refactored `writeKordAiosConfigToProject()` new function for project-level config
- Updated provider question flow with skip logic
- New `kord-aios init` CLI command registered in Commander.js
- Updated tests covering new behaviors
- Updated installation guide

### Definition of Done
- [ ] `bunx kord-aios install` on machine with existing global config does NOT overwrite existing model assignments
- [ ] `bunx kord-aios install` skips provider questions for already-configured providers
- [ ] `bunx kord-aios install` creates `.opencode/kord-aios.json` in project directory
- [ ] `bunx kord-aios init` scaffolds project structure and copies global config to project
- [ ] All existing tests pass + new tests for changed behavior
- [ ] `docs/guide/installation.md` reflects the new flow
- [ ] `bun run typecheck` passes with zero errors
- [ ] `bun test` passes

### Must Have
- Smart merge: never overwrite existing config values, only add missing ones
- Provider detection: detect existing config, skip provider questions for configured providers
- Project-level config: `.opencode/kord-aios.json` created on both `install` and `init`
- `kord-aios init` command: scaffold + copy global config
- Backward compat: `--reconfigure` flag for users who WANT to re-answer provider questions

### Must NOT Have (Guardrails)
- DO NOT change model defaults in `model-requirements.ts` or `model-fallback.ts` (explicitly out of scope)
- DO NOT change runtime config loading in `plugin-config.ts` (already works correctly)
- DO NOT add hook-based auto-init (user chose explicit command)
- DO NOT create dynamic model resolution (user wants static config approach)
- DO NOT add npm/bun package management logic (installer registers plugin, doesn't install packages)
- DO NOT break existing CLI flags (`--no-tui`, `--claude`, `--gemini`, etc.)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (`bun test`, 100+ test files)
- **Automated tests**: YES (Tests-after — refactor first, then update/add tests)
- **Framework**: bun test (already configured)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Every task includes specific QA scenarios using Bash (CLI commands) to verify behavior. See individual task definitions below.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Smart merge refactor (config-manager.ts)
└── Task 2: Provider detection refactor (config-manager.ts + install.ts)

Wave 2 (After Wave 1):
├── Task 3: Install flow update (install.ts + install-phases.ts)
├── Task 4: Project-level config writer (config-manager.ts)
└── Task 5: kord-aios init command (new file + index.ts)

Wave 3 (After Wave 2):
├── Task 6: Scaffolder update for init (scaffolder.ts)
├── Task 7: Test updates (*.test.ts)
└── Task 8: Documentation update (installation.md)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 5, 7 | 4 |
| 4 | 1 | 5, 7 | 3 |
| 5 | 3, 4 | 7 | 6 |
| 6 | None (isolated) | 7 | 5 |
| 7 | 3, 4, 5, 6 | 8 | None |
| 8 | 7 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | `task(category="unspecified-high", load_skills=["git-master"])` — parallel |
| 2 | 3, 4, 5 | `task(category="unspecified-high", load_skills=["git-master"])` — parallel |
| 3 | 6, 7, 8 | `task(category="unspecified-low", load_skills=["git-master"])` then `task(category="writing")` |

---

## TODOs

- [x] 1. Refactor `writeKordAiosConfig()` to add-only smart merge

  **What to do**:
  - In `src/cli/config-manager.ts`, modify `writeKordAiosConfig()` (line 322) to reverse merge direction
  - Currently: `deepMerge(existing, newConfig)` → newConfig overrides existing
  - Change to: `addOnlyMerge(existing, newConfig)` → existing values preserved, only missing keys added
  - Create new `addOnlyMerge()` helper function that:
    - For objects: recursively merge, but SKIP keys that already exist in target
    - For arrays: keep existing array, don't replace
    - For primitives: keep existing value if present, only set if missing/undefined
  - Apply same add-only logic to `addAuthPlugins()` (line 405) — don't re-add plugins that already exist (this already partially works via `hasGeminiAuthPlugin` check, verify it's complete)
  - Apply same add-only logic to `addProviderConfig()` (line 606) — don't overwrite existing provider blocks

  **Must NOT do**:
  - Do NOT change `deepMerge()` in `src/shared/deep-merge.ts` — that's used by runtime and must keep current override semantics
  - Do NOT change the signature of `writeKordAiosConfig()` — keep `InstallConfig` parameter
  - Do NOT touch `model-fallback.ts` or `model-requirements.ts`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Careful refactoring of config merge logic with edge case handling
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commits for config-manager changes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/cli/config-manager.ts:291-316` — Current `deepMerge()` implementation in CLI (local copy, override semantics)
  - `src/cli/config-manager.ts:322-367` — `writeKordAiosConfig()` — THE function to refactor
  - `src/cli/config-manager.ts:405-481` — `addAuthPlugins()` — apply add-only for plugin array
  - `src/cli/config-manager.ts:606-673` — `addProviderConfig()` — apply add-only for provider block
  - `src/shared/deep-merge.ts` — Runtime deep merge (DO NOT modify, reference only for understanding semantics)

  **Test References**:
  - `src/cli/config-manager.test.ts` — Existing tests for config-manager functions

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Existing global config preserved on re-install
    Tool: Bash
    Preconditions: Global kord-aios.json exists with custom agent override
    Steps:
      1. Read existing global kord-aios.json content
      2. Call writeKordAiosConfig() with different InstallConfig
      3. Read global kord-aios.json after write
      4. Assert: custom agent override still present
      5. Assert: new keys from InstallConfig added where missing
    Expected Result: Existing values preserved, missing values added
    Evidence: Test output from bun test

  Scenario: Fresh install writes full config
    Tool: Bash
    Preconditions: No global kord-aios.json exists
    Steps:
      1. Call writeKordAiosConfig() with full InstallConfig
      2. Assert: kord-aios.json created with all expected keys
    Expected Result: Full config written on first install
    Evidence: Test output from bun test

  Scenario: Auth plugins not duplicated
    Tool: Bash
    Preconditions: opencode.json already has antigravity plugin
    Steps:
      1. Call addAuthPlugins() with hasGemini=true
      2. Assert: plugin array has exactly ONE antigravity entry (not duplicated)
    Expected Result: No duplication of auth plugins
    Evidence: Test output from bun test
  ```

  - [x] `addOnlyMerge()` function implemented and tested
  - [x] `writeKordAiosConfig()` uses add-only semantics
  - [x] `addAuthPlugins()` verified to not duplicate existing entries
  - [x] `addProviderConfig()` does not overwrite existing provider blocks
  - [x] `bun test src/cli/config-manager.test.ts` → PASS

  **Commit**: YES
  - Message: `fix(cli): make writeKordAiosConfig add-only to prevent overwriting existing config`
  - Files: `src/cli/config-manager.ts`
  - Pre-commit: `bun test src/cli/config-manager.test.ts`

---

- [x] 2. Refactor provider detection to skip already-configured providers

  **What to do**:
  - In `src/cli/install.ts`, modify `runTuiMode()` (line 187) and `runNonTuiInstall()` (line 312):
    - Before asking provider questions, check `detectCurrentConfig()` result
    - If provider is already configured (e.g., `detected.hasClaude === true`), SKIP that question
    - Show summary of detected providers: "Found existing config: Claude=max20, OpenAI=yes. Skipping these."
    - Only ask questions for providers NOT yet configured
  - Add `--reconfigure` flag to `InstallArgs` in `src/cli/types.ts`:
    - When `--reconfigure` is passed, bypass detection and ask ALL questions (backward compat)
  - Register `--reconfigure` flag in `src/cli/index.ts` Commander.js command definition
  - In non-TUI mode: if global config exists and no explicit provider flags given, reuse existing provider config

  **Must NOT do**:
  - Do NOT change `detectCurrentConfig()` itself — it works correctly
  - Do NOT remove any provider question — just conditionally skip
  - Do NOT remove existing CLI flags (`--claude`, `--gemini`, etc.)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: UX flow changes with conditional logic
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit for install flow changes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/cli/install.ts:187-299` — `runTuiMode()` — 7 provider questions to add skip logic
  - `src/cli/install.ts:312-473` — `runNonTuiInstall()` — non-TUI flow to update
  - `src/cli/install.ts:170-185` — `detectedToInitialValues()` — existing detection→values conversion
  - `src/cli/config-manager.ts:700-743` — `detectCurrentConfig()` — reads existing global config

  **Type References**:
  - `src/cli/types.ts` — `InstallArgs`, `InstallConfig`, `DetectedConfig` type definitions

  **Test References**:
  - `src/cli/install.test.ts` — Existing install tests

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Provider questions skipped when already configured
    Tool: Bash
    Preconditions: Global kord-aios.json exists with Claude=max20, OpenAI=yes
    Steps:
      1. Run install in TUI simulation
      2. Assert: Claude question NOT shown
      3. Assert: OpenAI question NOT shown
      4. Assert: Gemini question IS shown (not configured)
    Expected Result: Only unconfigured providers asked
    Evidence: Test output from bun test

  Scenario: --reconfigure bypasses detection
    Tool: Bash
    Preconditions: Global kord-aios.json exists with all providers
    Steps:
      1. Run install with --reconfigure flag
      2. Assert: ALL provider questions shown
    Expected Result: Full question flow when --reconfigure is used
    Evidence: Test output from bun test

  Scenario: Non-TUI mode reuses existing config
    Tool: Bash
    Preconditions: Global kord-aios.json exists with providers
    Steps:
      1. Run install --no-tui without explicit provider flags
      2. Assert: existing provider config preserved
      3. Assert: no validation error for missing required flags
    Expected Result: Non-TUI mode gracefully reuses existing
    Evidence: Test output from bun test
  ```

  - [x] Skip logic for TUI provider questions implemented
  - [x] `--reconfigure` flag added to CLI and types
  - [x] Non-TUI mode handles existing config gracefully
  - [x] Summary of detected providers shown to user

  **Commit**: YES
  - Message: `feat(cli): skip provider questions for already-configured providers`
  - Files: `src/cli/install.ts`, `src/cli/types.ts`, `src/cli/index.ts`
  - Pre-commit: `bun test src/cli/install.test.ts`

---

- [x] 3. Update install flow to create project-level config

  **What to do**:
  - In `src/cli/install-phases.ts`, modify `phaseInstallation()` (line 64):
    - After writing global config, call new `writeProjectKordAiosConfig()` (from Task 4)
    - Copies global kord-aios.json to `.opencode/kord-aios.json` in project directory
    - If `.opencode/kord-aios.json` already exists, apply add-only merge (from Task 1)
  - In `src/cli/install.ts`, add output messaging for project config creation:
    - TUI: `s.stop(\`Project config written to ${color.cyan(projectConfigPath)}\`)`
    - Non-TUI: `printSuccess(\`Project config created ${SYMBOLS.arrow} ${color.dim(projectConfigPath)}\`)`
  - Update `PhaseInstallationResult` in `src/cli/install-phases.ts` to include project config result
  - Ensure `.opencode/` directory is created if it doesn't exist

  **Must NOT do**:
  - Do NOT modify `plugin-config.ts` runtime loading
  - Do NOT change merge order (global base, project override)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Orchestrating the install flow changes across multiple files
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit for install flow update

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Wave 1)
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Tasks 5, 7
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/cli/install-phases.ts:64-116` — `phaseInstallation()` — add project config write step
  - `src/cli/install.ts:383-408` — Non-TUI config write section (add project config messaging)
  - `src/cli/install.ts:539-566` — TUI config write section (add project config messaging)
  - `src/plugin-config.ts:106-112` — Runtime project config path (`.opencode/kord-aios`) — verify consistency

  **Type References**:
  - `src/cli/install-phases.ts:24-38` — `PhaseInstallationResult` type to extend

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Install creates project-level config
    Tool: Bash
    Preconditions: Clean project directory, global config exists
    Steps:
      1. Run install in project directory
      2. Assert: .opencode/kord-aios.json created in project
      3. Assert: content matches global config
      4. Assert: global config NOT modified
    Expected Result: Project gets copy of global config
    Evidence: Test output from bun test

  Scenario: Install preserves existing project config
    Tool: Bash
    Preconditions: Project already has .opencode/kord-aios.json with custom overrides
    Steps:
      1. Run install in project directory
      2. Assert: existing project overrides preserved
      3. Assert: missing keys from global added
    Expected Result: Add-only merge on project config too
    Evidence: Test output from bun test
  ```

  - [ ] `phaseInstallation()` creates `.opencode/kord-aios.json` in project
  - [ ] `.opencode/` directory created if missing
  - [ ] Existing project config not overwritten (add-only merge)
  - [ ] TUI and non-TUI flows both show project config messaging

  **Commit**: YES (groups with Task 4)
  - Message: `feat(cli): create project-level kord-aios.json on install`
  - Files: `src/cli/install-phases.ts`, `src/cli/install.ts`
  - Pre-commit: `bun test src/cli/install-phases.test.ts`

---

- [x] 4. Create `writeProjectKordAiosConfig()` function

  **What to do**:
  - In `src/cli/config-manager.ts`, add new function `writeProjectKordAiosConfig()`:
    - Parameters: `(projectDir: string, globalConfigPath?: string)`
    - Reads global kord-aios.json (if exists)
    - Writes copy to `<projectDir>/.opencode/kord-aios.json`
    - If project config already exists, apply add-only merge (reuse logic from Task 1)
    - Creates `.opencode/` directory if it doesn't exist
    - Returns `ConfigMergeResult` (consistent with other write functions)
  - Export the function from config-manager.ts

  **Must NOT do**:
  - Do NOT read from `.opencode/kord-aios.jsonc` (only `.json` for project-level — keep simple)
  - Do NOT modify runtime loading paths
  - Do NOT change global config write behavior (handled in Task 1)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New function with file I/O and merge logic
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit for new function

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Tasks 5, 7
  - **Blocked By**: Task 1 (needs addOnlyMerge)

  **References**:

  **Pattern References**:
  - `src/cli/config-manager.ts:322-367` — `writeKordAiosConfig()` — follow same pattern for project version
  - `src/cli/config-manager.ts:43-61` — Config path helper functions — reuse pattern
  - `src/plugin-config.ts:106-112` — Runtime project config path — MUST match this path exactly

  **Type References**:
  - `src/cli/types.ts` — `ConfigMergeResult` — return type

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Project config created from global
    Tool: Bash
    Preconditions: Global kord-aios.json exists at ~/.config/opencode/kord-aios.json
    Steps:
      1. Call writeProjectKordAiosConfig(projectDir)
      2. Assert: .opencode/kord-aios.json created in projectDir
      3. Assert: content matches global config
    Expected Result: Project config is copy of global
    Evidence: Test output from bun test

  Scenario: Project config add-only merge
    Tool: Bash
    Preconditions: Project .opencode/kord-aios.json exists with custom overrides
    Steps:
      1. Call writeProjectKordAiosConfig(projectDir)
      2. Assert: custom overrides preserved
      3. Assert: new keys from global added
    Expected Result: Existing values preserved, missing added
    Evidence: Test output from bun test

  Scenario: No global config graceful fallback
    Tool: Bash
    Preconditions: No global kord-aios.json exists
    Steps:
      1. Call writeProjectKordAiosConfig(projectDir)
      2. Assert: minimal config created with $schema only
      3. Assert: no crash/error
    Expected Result: Graceful handling of missing global
    Evidence: Test output from bun test
  ```

  - [x] `writeProjectKordAiosConfig()` function implemented
  - [x] Creates `.opencode/` directory if missing
  - [x] Copies global config to project
  - [x] Add-only merge when project config exists
  - [x] Handles missing global config gracefully

  **Commit**: YES (groups with Task 3)
  - Message: `feat(cli): create project-level kord-aios.json on install`
  - Files: `src/cli/config-manager.ts`
  - Pre-commit: `bun test src/cli/config-manager.test.ts`

---

- [x] 5. Create `kord-aios init` CLI command

  **What to do**:
  - Create `src/cli/init/index.ts` — new command implementation:
    - Calls `createKordDirectory(cwd)` from `kord-directory.ts`
    - Calls `scaffoldProject({ directory: cwd })` from `scaffolder.ts`
    - Calls `writeProjectKordAiosConfig(cwd)` from `config-manager.ts` (Task 4)
    - Shows summary of what was created/skipped
    - Does NOT ask provider questions
    - Does NOT modify global config
    - Supports `--force` flag to overwrite existing files
  - Register in `src/cli/index.ts` as Commander.js command:
    - `program.command("init").description("Initialize Kord AIOS project structure").option("--force", "Overwrite existing files")`
  - The init command output should be user-friendly:
    - Show what was created (green checkmarks)
    - Show what was skipped (dimmed)
    - Show path to project config for customization

  **Must NOT do**:
  - Do NOT ask provider subscription questions
  - Do NOT modify global opencode.json or kord-aios.json
  - Do NOT run bun install or npm install
  - Do NOT run post-install doctor (that's for `install` only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New CLI command with file creation and user output
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit for new command

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 3, 4 (needs writeProjectKordAiosConfig)

  **References**:

  **Pattern References**:
  - `src/cli/index.ts` — Commander.js command registration pattern (follow existing `install`, `doctor` patterns)
  - `src/cli/install.ts:391-408` — Non-TUI scaffold + .kord/ creation section (reuse this logic)
  - `src/cli/kord-directory.ts:14-43` — `createKordDirectory()` — call this for .kord/ creation
  - `src/cli/scaffolder.ts:54-87` — `scaffoldProject()` — call this for docs/kord/ creation

  **Type References**:
  - `src/cli/types.ts` — `InstallArgs` — may need new `InitArgs` type or subset

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Init creates project structure from scratch
    Tool: Bash
    Preconditions: Clean project directory, global config exists
    Steps:
      1. Run kord-aios init in project directory
      2. Assert: .kord/ directory created with subdirs (templates, scripts, checklists, skills, squads)
      3. Assert: docs/kord/ created with subdirs (plans, drafts, notepads)
      4. Assert: .opencode/kord-aios.json created (copy of global)
      5. Assert: kord-rules.md created at project root
      6. Assert: global config NOT modified
    Expected Result: Full project scaffold created
    Evidence: Test output from bun test

  Scenario: Init skips existing files
    Tool: Bash
    Preconditions: Project already has .kord/ and docs/kord/
    Steps:
      1. Run kord-aios init
      2. Assert: existing files NOT overwritten
      3. Assert: output shows "skipped" for existing files
    Expected Result: Existing structure preserved
    Evidence: Test output from bun test

  Scenario: Init with --force overwrites
    Tool: Bash
    Preconditions: Project has existing templates
    Steps:
      1. Run kord-aios init --force
      2. Assert: templates overwritten with fresh copies
    Expected Result: Force flag overwrites existing
    Evidence: Test output from bun test
  ```

  - [ ] `src/cli/init/index.ts` created with init command
  - [ ] Command registered in `src/cli/index.ts`
  - [ ] Creates .kord/, docs/kord/, .opencode/kord-aios.json
  - [ ] Does NOT touch global config
  - [ ] `--force` flag works
  - [ ] User-friendly output with created/skipped summary

  **Commit**: YES
  - Message: `feat(cli): add kord-aios init command for project scaffolding`
  - Files: `src/cli/init/index.ts`, `src/cli/index.ts`
  - Pre-commit: `bun run typecheck`

---

- [x] 6. Update scaffolder for init compatibility

  **What to do**:
  - Review `src/cli/scaffolder.ts` to ensure `isProjectScaffolded()` (line 89) accounts for `.opencode/kord-aios.json` as a signal
  - Update `project-detector.ts` `detectProjectMaturity()` to include `.opencode/kord-aios.json` in detection signals
  - Add `hasProjectConfig: boolean` to `ProjectMaturity` interface
  - Update `classifyMaturity()` to consider project config in "existing" vs "partial" classification

  **Must NOT do**:
  - Do NOT change scaffold file creation logic (already correct with skip-if-exists)
  - Do NOT change KORD_DIR or KORD_DOCS_DIR constants

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Small additions to existing detection logic
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5) — technically independent
  - **Blocks**: Task 7
  - **Blocked By**: None (isolated change)

  **References**:

  **Pattern References**:
  - `src/cli/scaffolder.ts:89-97` — `isProjectScaffolded()` — add project config check
  - `src/cli/project-detector.ts:26-56` — `detectProjectMaturity()` — add .opencode/kord-aios.json detection
  - `src/cli/project-detector.ts:67-80` — `classifyMaturity()` — update classification logic

  **Type References**:
  - `src/cli/project-detector.ts:11-20` — `ProjectMaturity` interface to extend

  **Acceptance Criteria**:

  - [x] `ProjectMaturity` includes `hasProjectConfig: boolean`
  - [x] `detectProjectMaturity()` checks for `.opencode/kord-aios.json`
  - [x] `isProjectScaffolded()` includes project config in check
  - [x] Classification logic updated

  **Commit**: YES
  - Message: `feat(cli): detect project-level kord-aios.json in maturity check`
  - Files: `src/cli/scaffolder.ts`, `src/cli/project-detector.ts`
  - Pre-commit: `bun test src/cli/scaffolder.test.ts && bun test src/cli/project-detector.test.ts`

---

- [x] 7. Update and add tests for all changed modules

  **What to do**:
  - Update `src/cli/config-manager.test.ts`:
    - Test `addOnlyMerge()` function (various merge scenarios)
    - Test `writeKordAiosConfig()` with existing config (assert add-only)
    - Test `writeProjectKordAiosConfig()` (new function)
    - Test `addAuthPlugins()` idempotency
    - Test `addProviderConfig()` add-only behavior
  - Update `src/cli/install.test.ts`:
    - Test provider question skip logic
    - Test `--reconfigure` flag behavior
    - Test non-TUI mode with existing config
  - Update `src/cli/install-phases.test.ts`:
    - Test `phaseInstallation()` creates project config
  - Update `src/cli/project-detector.test.ts`:
    - Test detection of `.opencode/kord-aios.json`
    - Test updated maturity classification
  - Update `src/cli/scaffolder.test.ts`:
    - Test `isProjectScaffolded()` with project config
  - Create `src/cli/init/index.test.ts` (if init command testable in isolation):
    - Test init creates scaffold + project config
    - Test init with --force
    - Test init without global config

  **Must NOT do**:
  - Do NOT delete existing passing tests
  - Do NOT change test infrastructure/config
  - Do NOT mock entire filesystem — use test fixtures

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive test coverage across multiple files
  - **Skills**: [`git-master`]
    - `git-master`: Atomic test commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3, after all implementation)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 3, 4, 5, 6

  **References**:

  **Test References**:
  - `src/cli/config-manager.test.ts` — Existing tests to extend
  - `src/cli/install.test.ts` — Existing tests to extend
  - `src/cli/install-phases.test.ts` — Existing tests to extend
  - `src/cli/project-detector.test.ts` — Existing tests to extend
  - `src/cli/scaffolder.test.ts` — Existing tests to extend
  - `src/cli/__snapshots__/` — Snapshot directory (may need updates)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All tests pass
    Tool: Bash
    Preconditions: All implementation tasks complete
    Steps:
      1. Run: bun test src/cli/
      2. Assert: all tests pass (0 failures)
      3. Run: bun run typecheck
      4. Assert: no type errors
    Expected Result: Full test suite green
    Evidence: Terminal output of bun test
  ```

  - [x] `bun test src/cli/config-manager.test.ts` → PASS (including new tests)
  - [x] `bun test src/cli/install.test.ts` → PASS
  - [x] `bun test src/cli/install-phases.test.ts` → PASS
  - [x] `bun test src/cli/project-detector.test.ts` → PASS
  - [x] `bun test src/cli/scaffolder.test.ts` → PASS
  - [x] `bun run typecheck` → 0 errors
  - [ ] `bun test` (full suite) → PASS (currently failing in non-CLI areas; see execution notes)

  **Commit**: YES
  - Message: `test(cli): update tests for smart merge, provider detection, and init command`
  - Files: `src/cli/*.test.ts`, `src/cli/init/index.test.ts`
  - Pre-commit: `bun test`

---

- [x] 8. Update installation documentation

  **What to do**:
  - Update `docs/guide/installation.md`:
    - **"For Humans" section**: Add mention of `kord-aios init` for project setup
    - **"For LLM Agents" section**:
      - Step 2 (Run installer): Note that re-install preserves existing config
      - Add note: provider questions are skipped for already-configured providers
      - Add `--reconfigure` flag documentation
      - Add new Step: "Initialize project" — `bunx kord-aios init` in each project
      - Explain: `install` = first-time setup + project scaffold. `init` = project scaffold only.
    - Add section explaining global vs project config:
      - Global (`~/.config/opencode/kord-aios.json`): Base config, shared across all projects
      - Project (`.opencode/kord-aios.json`): Per-project overrides, created by install/init
      - Precedence: project wins over global (deep merge)
  - Update README.md Installation section if needed (brief mention of `init` command)

  **Must NOT do**:
  - Do NOT rewrite the entire installation guide — only add/update relevant sections
  - Do NOT remove existing content that's still valid
  - Do NOT change the curl-based fetch instructions

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation writing task
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit for docs

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3, after tests)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 7

  **References**:

  **Documentation References**:
  - `docs/guide/installation.md` — Main installation guide to update
  - `README.md:50-58` — Installation section (brief reference to update)
  - `docs/guide/AGENTS.md` — Guide knowledge base (update if new guide added)

  **Acceptance Criteria**:

  - [x] `docs/guide/installation.md` updated with `kord-aios init` documentation
  - [x] `--reconfigure` flag documented
  - [x] Global vs project config section added
  - [x] Re-install behavior documented (preserves existing config)
  - [x] All code examples in docs actually work

  **Commit**: YES
  - Message: `docs: update installation guide with init command and smart merge behavior`
  - Files: `docs/guide/installation.md`, `README.md`
  - Pre-commit: N/A (docs only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(cli): make writeKordAiosConfig add-only to prevent overwriting existing config` | `src/cli/config-manager.ts` | `bun test src/cli/config-manager.test.ts` |
| 2 | `feat(cli): skip provider questions for already-configured providers` | `src/cli/install.ts`, `src/cli/types.ts`, `src/cli/index.ts` | `bun test src/cli/install.test.ts` |
| 3+4 | `feat(cli): create project-level kord-aios.json on install` | `src/cli/install-phases.ts`, `src/cli/install.ts`, `src/cli/config-manager.ts` | `bun test src/cli/` |
| 5 | `feat(cli): add kord-aios init command for project scaffolding` | `src/cli/init/index.ts`, `src/cli/index.ts` | `bun run typecheck` |
| 6 | `feat(cli): detect project-level kord-aios.json in maturity check` | `src/cli/scaffolder.ts`, `src/cli/project-detector.ts` | `bun test src/cli/scaffolder.test.ts` |
| 7 | `test(cli): update tests for smart merge, provider detection, and init command` | `src/cli/*.test.ts` | `bun test` |
| 8 | `docs: update installation guide with init command and smart merge behavior` | `docs/guide/installation.md`, `README.md` | N/A |

---

## Success Criteria

### Verification Commands
```bash
bun run typecheck       # Expected: 0 errors
bun test                # Expected: all tests pass
bun test src/cli/       # Expected: all CLI tests pass
bun run build           # Expected: successful build
```

### Final Checklist
- [x] Re-install in new project does NOT overwrite global kord-aios.json
- [x] Provider questions skipped for configured providers
- [x] `--reconfigure` flag available for full question flow
- [x] `kord-aios init` creates project scaffold + project config
- [x] `.opencode/kord-aios.json` created in project on install AND init
- [ ] All existing tests still pass
- [x] New tests cover changed behavior
- [x] Documentation updated
- [x] `bun run build` succeeds
- [x] `bun run typecheck` passes

## Execution Notes

- `bun test` full suite currently fails in non-CLI areas (`src/plugin-handlers/config-handler.test.ts`, `src/features/squad/squad.test.ts`).
- All CLI-focused tests and `bun run build` are passing for this plan's changes.
