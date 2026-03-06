# CLI Installer Critical Fix — Reliable Install on All Platforms

## TL;DR

> **Quick Summary**: Fix 8 bugs in the kord-aios CLI installer that prevent proper installation on fresh systems (especially Windows). Separate `install` (global config + plugin registration) from `init` (project scaffolding + content export). Follow oh-my-opencode (omoc) patterns as reference implementation.
> 
> **Deliverables**:
> - Fixed provider detection (no more false positives)
> - Fixed Windows path resolution for opencode.json
> - Separated `install` (global) from `init` (project) commands
> - Antigravity plugin support for Google auth
> - Content export in `init` command
> - Cleaned up .kord/ directory structure
> - Updated doctor checks
> - Published patch release
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Task 3 → Task 5 → Task 8

---

## Context

### Original Request
User installed `bunx kord-aios@latest install` on a fresh Windows machine and encountered 6 major failures:
1. Config directories scattered across home dir (~/.config/opencode, ~/.opencode, ~/.kord)
2. opencode.json not generated
3. .kord/ has mostly empty subdirs, only templates/ has content
4. kord-aios.json generated without model fallbacks (expected, not yet configured)
5. Plugin not registered because opencode.json missing
6. Google auth didn't install Antigravity plugin

### Interview Summary
**Key Discussions**:
- User confirmed: `install` should be GLOBAL only (plugin + providers + auth), `init` should be PROJECT only (structure + content)
- User confirmed: follow omoc patterns — don't reinvent
- User confirmed: TDD approach with tests before fixes
- User confirmed: publish a new release after fixes
- User confirmed: include Antigravity plugin support in scope
- User clarified: .kord/ framework structure (templates, checklists, squads) is correct but should only create dirs with content
- User clarified: ran installer from CMD without being in a project directory

**Research Findings**:
- **Root cause of auth skip**: `detectProvidersFromKordAiosConfig()` in config-manager.ts:800-823 returns `hasOpenAI: true, hasOpencodeZen: true` when NO config file exists. All error/missing paths return `true` instead of `false`.
- **Root cause of path issue**: Windows path resolution in opencode-config-dir.ts may conflict with where OpenCode itself creates its config
- **omoc reference**: Fork parent handles all these cases correctly — same file structure, directly portable patterns
- **synkra-aios**: Uses different architecture (.aios-core/), not directly applicable

### Self-Analysis (Gap Review)
**Identified Gaps** (addressed in plan):
- Backwards compatibility: existing working configs must not break → guardrail added
- Doctor command needs updates to verify new install/init separation
- Edge cases: JSONC format, partial configs, WSL2, permission issues → test scenarios added
- macOS path handling: should also be verified, not just Windows

---

## Decision Points

- [x] Decision: Provider detection defaults
  - Options: `true` (current, broken) | `false` (correct)
  - Final decision: `false` — absence of config means no providers configured
  - Rationale: omoc pattern + logical correctness

- [x] Decision: Install vs Init separation
  - Options: Combined (current) | Separated (proposed)
  - Final decision: Separated — `install` = global, `init` = project
  - Rationale: User confirmed, prevents `.kord/` at home dir

- [x] Decision: .kord/ subdirectories
  - Options: All 5 upfront | Only with content | On-demand
  - Final decision: Only create dirs that have content (templates/) + dirs user explicitly configures (squads/)
  - Rationale: User confirmed, empty dirs confuse users

- [x] Decision: Antigravity plugin
  - Options: Exclude | Include
  - Final decision: Include — follow omoc pattern
  - Rationale: User confirmed, omoc has reference implementation

---

## Work Objectives

### Core Objective
Make `bunx kord-aios@latest install` and `bunx kord-aios init` work reliably on fresh Windows, macOS, and Linux systems, with correct provider detection, proper path resolution, and clear separation of global vs project concerns.

### Concrete Deliverables
- Fixed `src/cli/config-manager.ts` — provider detection returns `false` by default
- Fixed `src/shared/opencode-config-dir.ts` — Windows path resolution aligned with OpenCode
- Refactored `src/cli/install.ts` — global-only flow (no project scaffolding)
- Enhanced `src/cli/init/index.ts` — project scaffolding + content export
- New Antigravity plugin integration in installer
- Updated `src/cli/kord-directory.ts` — minimal directory creation
- Updated `src/cli/doctor/` — checks for new install/init separation
- New tests for all fixes (TDD)

### Definition of Done
- [ ] `bunx kord-aios install` on fresh Windows creates opencode.json with plugin at correct path
- [ ] `bunx kord-aios install` never creates .kord/ or docs/kord/
- [ ] `bunx kord-aios init` in project creates .kord/, docs/kord/, .opencode/kord-aios.json
- [ ] Fresh install with no providers prompts ALL auth questions (none skipped)
- [ ] Google/Gemini selection installs opencode-antigravity-auth plugin
- [ ] `bun test` passes (all new + existing tests)
- [ ] `bun run typecheck` passes
- [ ] `bun run build` passes

### Must Have
- Provider detection defaults to `false` when no config exists
- opencode.json created at correct path on Windows (%APPDATA% or ~/.config/opencode)
- `install` never creates project-level directories
- `init` creates complete project structure with content
- Auth questions not skipped on fresh install
- Backwards compatibility: existing working configs preserved

### Must NOT Have (Guardrails)
- DO NOT change model defaults or fallback chains (out of scope, separate concern)
- DO NOT refactor the TUI library or prompts UX (just fix the data flow)
- DO NOT change the config schema (kord-aios.json structure stays the same)
- DO NOT add new providers or models
- DO NOT modify `src/shared/deep-merge.ts` (runtime merge, not CLI)
- DO NOT break existing working installations (add-only merge preserved)
- DO NOT create AI-slop: no unnecessary abstractions, no over-validation, no doc bloat
- DO NOT touch `src/shared/model-requirements.ts` (hardcoded fallback chains are separate)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.

### Test Decision
- **Infrastructure exists**: YES (bun test, 100+ test files)
- **Automated tests**: TDD (RED-GREEN-REFACTOR)
- **Framework**: bun test (built-in)

### TDD Structure Per Task

Each TODO follows RED-GREEN-REFACTOR:
1. **RED**: Write failing test first
   - Test file alongside source: `*.test.ts`
   - Test command: `bun test <file>`
   - Expected: FAIL (test exists, fix doesn't)
2. **GREEN**: Implement minimum fix to pass
   - Command: `bun test <file>`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `bun test <file>`
   - Expected: PASS (still)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Fix provider detection false positives [no dependencies]
└── Task 2: Fix Windows path resolution [no dependencies]

Wave 2 (After Wave 1):
├── Task 3: Separate install (global only) [depends: 1, 2]
└── Task 4: Fix .kord/ directory structure [depends: 1]

Wave 3 (After Wave 2):
├── Task 5: Enhance init with content export [depends: 3, 4]
└── Task 6: Add Antigravity plugin support [depends: 3]

Wave 4 (After Wave 3):
├── Task 7: Update doctor checks [depends: 3, 5]
└── Task 8: Full verification + publish prep [depends: ALL]

Critical Path: Task 1 → Task 3 → Task 5 → Task 8
Parallel Speedup: ~50% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 5, 6, 7 | 4 |
| 4 | 1 | 5 | 3 |
| 5 | 3, 4 | 7, 8 | 6 |
| 6 | 3 | 8 | 5 |
| 7 | 3, 5 | 8 | 6 |
| 8 | ALL | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | task(category="quick", load_skills=["git-master"], run_in_background=false) each |
| 2 | 3, 4 | task(category="unspecified-high", load_skills=["git-master"], run_in_background=false) each |
| 3 | 5, 6 | task(category="unspecified-high", load_skills=["git-master"], run_in_background=false) each |
| 4 | 7, 8 | task(category="quick") for 7, then task(category="quick", load_skills=["git-master"]) for 8 |

---

## TODOs
- [x] 1. Fix provider detection false positives (TDD)

  **What to do**:
  - **RED**: Write tests in `src/cli/config-manager.test.ts` that verify:
    - `detectProvidersFromKordAiosConfig()` returns ALL `false` when no config file exists
    - `detectProvidersFromKordAiosConfig()` returns ALL `false` when config is invalid/unparseable
    - `detectProvidersFromKordAiosConfig()` returns ALL `false` on any error
    - `detectCurrentConfig()` defaults to ALL `false` for provider flags when not installed
    - `detectProvidersFromKordAiosConfig()` returns correct `true` values when config EXISTS with providers
    - `detectCurrentConfig()` correctly detects existing providers from valid config
  - **GREEN**: Fix `src/cli/config-manager.ts`:
    - Line 803: Change `{ hasOpenAI: true, hasOpencodeZen: true, ...}` to `{ hasOpenAI: false, hasOpencodeZen: false, hasZaiCodingPlan: false, hasKimiForCoding: false }`
    - Line 810: Same fix for invalid config case
    - Line 821: Same fix for error/catch case
    - Lines 828-835: Change `detectCurrentConfig()` defaults: `hasClaude: false`, `isMax20: false`, `hasOpenAI: false`, `hasOpencodeZen: false`
  - **REFACTOR**: Ensure the detection logic is clean and consistent

  **Must NOT do**:
  - DO NOT change the `DetectedConfig` interface (src/cli/types.ts)
  - DO NOT modify how detection works when config EXISTS and is valid
  - DO NOT change the `--reconfigure` flag behavior

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Focused bug fix in a single file, clear line-number targets
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit after fix
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work involved

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/cli/config-manager.ts:800-823` — `detectProvidersFromKordAiosConfig()`: The buggy function. Lines 803, 810, 821 have wrong default returns. Fix each `true` to `false`.
  - `src/cli/config-manager.ts:825-836` — `detectCurrentConfig()`: Wrong defaults at lines 828-835. Change `hasClaude: true` → `false`, `isMax20: true` → `false`, `hasOpenAI: true` → `false`, `hasOpencodeZen: true` → `false`.
  - `src/cli/config-manager.ts:838-868` — Rest of `detectCurrentConfig()`: This part reads the ACTUAL config and sets values to `true` when providers are found. This logic is CORRECT — do not change it.

  **Test References** (testing patterns to follow):
  - `src/cli/config-manager.test.ts` — Existing test file for config-manager. Add new describe blocks for detection functions.

  **External References** (omoc reference):
  - oh-my-opencode (local clone repo in D:\dev\oh-my-opencode) `src/cli/config-manager/detect-current-config.ts` — Reference implementation that handles defaults correctly

  **WHY Each Reference Matters**:
  - config-manager.ts:800-823: This IS the bug. Three return statements need `true` → `false`.
  - config-manager.ts:825-836: Compound bug — defaults also wrong. Must fix both functions together.
  - config-manager.ts:838-868: Shows the CORRECT detection logic — don't break this part.
  - config-manager.test.ts: Add regression tests here to prevent this bug from returning.

  **Acceptance Criteria**:

  **TDD (tests):**
  - [ ] Test file: `src/cli/config-manager.test.ts`
  - [ ] Test: `detectProvidersFromKordAiosConfig()` returns all `false` when no config file
  - [ ] Test: `detectProvidersFromKordAiosConfig()` returns all `false` when config is invalid
  - [ ] Test: `detectCurrentConfig()` defaults all `false` when not installed
  - [ ] Test: `detectCurrentConfig()` correctly returns `true` for providers in valid config
  - [ ] `bun test src/cli/config-manager.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Provider detection with no config file
    Tool: Bash (bun test)
    Preconditions: Test environment with OPENCODE_CONFIG_DIR pointing to empty temp dir
    Steps:
      1. Run: bun test src/cli/config-manager.test.ts --grep "no config"
      2. Assert: All provider flags are false
      3. Assert: Test passes (exit code 0)
    Expected Result: All detection defaults return false
    Evidence: Test output captured

  Scenario: Provider detection with valid config containing providers
    Tool: Bash (bun test)
    Preconditions: Test environment with config file containing provider entries
    Steps:
      1. Run: bun test src/cli/config-manager.test.ts --grep "valid config"
      2. Assert: Configured providers return true, unconfigured return false
      3. Assert: Test passes (exit code 0)
    Expected Result: Detection correctly identifies configured providers
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `fix(cli): provider detection defaults to false when no config exists`
  - Files: `src/cli/config-manager.ts`, `src/cli/config-manager.test.ts`
  - Pre-commit: `bun test src/cli/config-manager.test.ts`

---
- [x] 2. Fix Windows path resolution for opencode.json (TDD)

  **What to do**:
  - **RED**: Write tests in `src/shared/opencode-config-dir.test.ts` that verify:
    - On Windows (win32): if `~/.config/opencode/opencode.json` exists, use that path
    - On Windows (win32): if neither exists, default to `%APPDATA%/opencode` (consistent with omoc)
    - On macOS/Linux: XDG path resolution works correctly
    - OPENCODE_CONFIG_DIR env var takes priority on all platforms
  - **GREEN**: Fix `src/shared/opencode-config-dir.ts`:
    - Align Windows path resolution with omoc pattern: check `~/.config/opencode` first (cross-platform), then `%APPDATA%/opencode`
    - Ensure `ensureConfigDir()` creates the directory if it doesn't exist
    - Handle edge case: both paths exist (prefer the one with actual config files)
  - **REFACTOR**: Clean up any redundant path checks

  **Must NOT do**:
  - DO NOT change the Tauri desktop app path resolution (separate concern)
  - DO NOT change paths for macOS/Linux unless there's a proven bug
  - DO NOT hardcode Windows paths — always use env vars with fallbacks

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Focused fix in a single shared utility file
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit after fix
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/shared/opencode-config-dir.ts:49-84` — `getCliConfigDir()`: Current Windows path logic. The function checks `%APPDATA%\opencode` first on Windows. Should check `~/.config/opencode` first (cross-platform path that OpenCode CLI also uses).
  - `src/shared/opencode-config-dir.ts:109-119` — `getOpenCodeConfigPaths()`: Returns all config paths based on config dir. Correct logic — no changes needed.

  **Test References** (testing patterns to follow):
  - `src/shared/opencode-config-dir.test.ts` — Existing tests for this module. Add platform-specific test cases.
  - `src/cli/doctor/checks/opencode.test.ts:48-103` — Contains Windows platform path tests. Follow this pattern.

  **External References** (omoc reference):
  - oh-my-opencode `src/shared/opencode-config-dir.ts:49-66` — Their Windows handling: checks `~/.config/opencode` first (cross-platform), then falls back to `%APPDATA%/opencode`. This is the correct order because OpenCode CLI creates config at `~/.config/opencode` regardless of platform.

  **WHY Each Reference Matters**:
  - opencode-config-dir.ts:49-84: This is the function that determines WHERE opencode.json gets written. If this points to wrong dir, plugin can't register.
  - omoc's version: Shows the correct priority order — `~/.config/opencode` first on all platforms.
  - doctor/checks/opencode.test.ts: Shows how to mock platform in tests.

  **Acceptance Criteria**:

  **TDD (tests):**
  - [ ] Test: Windows (win32) checks `~/.config/opencode` first
  - [ ] Test: Windows falls back to `%APPDATA%/opencode` when no cross-platform config exists
  - [ ] Test: OPENCODE_CONFIG_DIR env var takes priority on all platforms
  - [ ] Test: Linux/macOS uses XDG_CONFIG_HOME or `~/.config/opencode`
  - [ ] `bun test src/shared/opencode-config-dir.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Windows path resolution with cross-platform config
    Tool: Bash (bun test)
    Preconditions: Test mocks process.platform === "win32"
    Steps:
      1. Run: bun test src/shared/opencode-config-dir.test.ts --grep "windows"
      2. Assert: Returns ~/.config/opencode when that path has config
      3. Assert: Falls back to %APPDATA%/opencode when cross-platform path empty
      4. Assert: Test passes (exit code 0)
    Expected Result: Correct path priority on Windows
    Evidence: Test output captured

  Scenario: Env var override on all platforms
    Tool: Bash (bun test)
    Preconditions: OPENCODE_CONFIG_DIR set to custom path
    Steps:
      1. Run: bun test src/shared/opencode-config-dir.test.ts --grep "env"
      2. Assert: Returns the env var path regardless of platform
    Expected Result: Env var always wins
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `fix(cli): align Windows path resolution with OpenCode config location`
  - Files: `src/shared/opencode-config-dir.ts`, `src/shared/opencode-config-dir.test.ts`
  - Pre-commit: `bun test src/shared/opencode-config-dir.test.ts`

---
- [x] 3. Separate install command to global-only (TDD)

  **What to do**:
  - **RED**: Write tests in `src/cli/install.test.ts` that verify:
    - `install` does NOT call `createKordDirectory()`
    - `install` does NOT call `scaffoldProject()`
    - `install` DOES call `addPluginToKordAiosConfig()` (registers plugin)
    - `install` DOES write global `kord-aios.json`
    - `install` shows guidance message: "Run `bunx kord-aios init` in your project directory"
    - `install` with no config file prompts ALL provider questions (not skipped)
    - `install` with existing providers only prompts unconfigured ones
    - `install` with `--reconfigure` prompts ALL regardless
  - **GREEN**: Refactor `src/cli/install.ts`:
    - Remove `createKordDirectory()` call from install flow (line ~525-533)
    - Remove `scaffoldProject()` call from install flow (line ~535-542)
    - Remove `writeProjectKordAiosConfig()` call from install flow (line ~518)
    - Add post-install guidance: "To set up a project, run: bunx kord-aios init"
    - Ensure the non-TUI install path correctly uses the fixed detection from Task 1
    - Ensure the TUI install path correctly uses the fixed detection from Task 1
  - **REFACTOR**: Clean up now-unused imports, simplify flow

  **Must NOT do**:
  - DO NOT change the TUI prompts/UX (just fix the data flow)
  - DO NOT change the `--reconfigure` flag behavior (it works correctly)
  - DO NOT remove the `writeProjectKordAiosConfig` function itself (init still uses it)
  - DO NOT change the provider config writing logic (just ensure it gets correct inputs)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Significant refactor of the main install flow with multiple behavioral changes
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit for this structural change
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work, TUI prompts unchanged

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Tasks 5, 6, 7
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References** (existing code to follow):
  - `src/cli/install.ts:456-542` — The `phaseInstallation()` function: Current flow that mixes global + project. Lines 525-542 are the project-level calls to REMOVE. Lines 483-511 are the global calls to KEEP.
  - `src/cli/install.ts:212-383` — TUI install flow (`runTuiInstall`): Uses `shouldSkip()` helper at lines 216-219 that depends on detection results from Task 1. After Task 1 fix, this will correctly prompt all questions on fresh install.
  - `src/cli/install.ts:396-452` — Non-TUI install flow (`runNonTuiInstall`): Lines 407-429 reuse detected config. After Task 1 fix, this will correctly require explicit flags on fresh install.
  - `src/cli/install.ts:660-720` — `runCliInstaller()`: Main entry point. Calls `phaseInstallation()` which needs the project calls removed.

  **Test References** (testing patterns to follow):
  - `src/cli/install.test.ts` — Existing install tests. Add new tests for global-only behavior.

  **External References** (omoc reference):
  - oh-my-opencode `src/cli/cli-installer.ts` — Their install flow is global-only: plugin registration + provider config + auth plugins. No project scaffolding.

  **WHY Each Reference Matters**:
  - install.ts:456-542: This is WHERE to remove project calls (lines 525-542) and keep global calls (483-511).
  - install.ts:212-383: TUI flow depends on Task 1 fix for correct detection.
  - install.ts:396-452: Non-TUI flow also depends on Task 1 fix.
  - omoc cli-installer.ts: Shows the clean global-only install pattern we should match.

  **Acceptance Criteria**:

  **TDD (tests):**
  - [ ] Test: install does not create .kord/ directory
  - [ ] Test: install does not create docs/kord/ directories
  - [ ] Test: install creates opencode.json with plugin entry
  - [ ] Test: install writes global kord-aios.json
  - [ ] Test: install shows init guidance message
  - [ ] Test: fresh install (no config) prompts all providers
  - [ ] `bun test src/cli/install.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Install from home directory does not create project structure
    Tool: Bash (bun test)
    Preconditions: Clean test environment, OPENCODE_CONFIG_DIR set to temp dir
    Steps:
      1. Run: bun test src/cli/install.test.ts --grep "global only"
      2. Assert: No .kord/ directory created at cwd
      3. Assert: No docs/kord/ directory created at cwd
      4. Assert: opencode.json created with plugin entry
      5. Assert: kord-aios.json created with model config
    Expected Result: Install is purely global
    Evidence: Test output captured

  Scenario: Fresh install prompts all providers
    Tool: Bash (bun test)
    Preconditions: No existing config, no providers
    Steps:
      1. Run: bun test src/cli/install.test.ts --grep "fresh install"
      2. Assert: All provider prompts shown (none skipped)
      3. Assert: No "already configured, skipping" messages
    Expected Result: Every auth question asked
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `refactor(cli): separate install to global-only, remove project scaffolding`
  - Files: `src/cli/install.ts`, `src/cli/install.test.ts`
  - Pre-commit: `bun test src/cli/install.test.ts`

---
- [x] 4. Fix .kord/ directory structure (TDD)

  **What to do**:
  - **RED**: Write tests in `src/cli/kord-directory.test.ts` that verify:
    - `createKordDirectory()` creates `.kord/` root
    - `createKordDirectory()` creates `.kord/templates/` with story.md and adr.md
    - `createKordDirectory()` creates `.kord/squads/` (empty, for user overrides)
    - `createKordDirectory()` does NOT create `.kord/scripts/`, `.kord/checklists/`, `.kord/skills/`
    - Idempotent: running twice doesn't error or duplicate content
  - **GREEN**: Fix `src/cli/kord-directory.ts`:
    - Change from iterating ALL `KORD_INPUT_SUBDIRS` to only creating `templates/` and `squads/`
    - Update `src/cli/project-layout.ts`: split `KORD_INPUT_SUBDIRS` into `KORD_ACTIVE_SUBDIRS` (templates, squads) and `KORD_RESERVED_SUBDIRS` (scripts, checklists, skills — for future use)
    - Only iterate `KORD_ACTIVE_SUBDIRS` in `createKordDirectory()`
  - **REFACTOR**: Ensure project-layout.ts exports are clean

  **Must NOT do**:
  - DO NOT remove the reserved subdir constants (they document future intent)
  - DO NOT change the templates content (story.md, adr.md)
  - DO NOT change docs/kord/ subdirectories (plans, drafts, notepads are correct)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small focused change in 2 files
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References** (existing code to follow):
  - `src/cli/kord-directory.ts:14-43` — `createKordDirectory()`: Currently iterates ALL `KORD_INPUT_SUBDIRS` at lines 23-28. Change to iterate only active subdirs.
  - `src/cli/project-layout.ts:5-11` — `KORD_INPUT_SUBDIRS`: Currently `["scripts", "templates", "checklists", "skills", "squads"]`. Split into active and reserved.

  **Test References**:
  - `src/cli/kord-directory.test.ts` — If exists, add new tests. If not, create with BDD pattern.
  - `src/cli/scaffolder.test.ts` — Scaffolder tests show the testing pattern for directory creation.

  **WHY Each Reference Matters**:
  - kord-directory.ts:14-43: This IS the function creating unwanted empty dirs. Fix the iteration target.
  - project-layout.ts:5-11: This defines WHAT dirs are created. Split the constant to separate active from reserved.

  **Acceptance Criteria**:

  **TDD (tests):**
  - [ ] Test: createKordDirectory creates .kord/templates/ with content
  - [ ] Test: createKordDirectory creates .kord/squads/ (empty)
  - [ ] Test: createKordDirectory does NOT create .kord/scripts/, .kord/checklists/, .kord/skills/
  - [ ] Test: createKordDirectory is idempotent
  - [ ] `bun test src/cli/kord-directory.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: .kord/ only contains expected subdirectories
    Tool: Bash (bun test)
    Preconditions: Clean temp directory as project root
    Steps:
      1. Run: bun test src/cli/kord-directory.test.ts
      2. Assert: .kord/templates/ exists with story.md and adr.md
      3. Assert: .kord/squads/ exists (empty)
      4. Assert: .kord/scripts/ does NOT exist
      5. Assert: .kord/checklists/ does NOT exist
      6. Assert: .kord/skills/ does NOT exist
    Expected Result: Only active subdirs created
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `fix(cli): only create .kord/ subdirs that have content (templates, squads)`
  - Files: `src/cli/kord-directory.ts`, `src/cli/project-layout.ts`, `src/cli/kord-directory.test.ts`
  - Pre-commit: `bun test src/cli/kord-directory.test.ts`

---
- [x] 5. Enhance init command with content export (TDD)

  **What to do**:
  - **RED**: Write tests in `src/cli/init/index.test.ts` that verify:
    - `init` creates `.kord/` with templates/ and squads/
    - `init` creates `docs/kord/` with plans/, drafts/, notepads/
    - `init` creates `.opencode/kord-aios.json` (project-level config)
    - `init` exports squad configurations to `.kord/squads/` (if builtin squads exist)
    - `init` creates `kord-rules.md` at project root
    - `init` is idempotent (running twice preserves existing content)
    - `init` shows clear success messages listing what was created
  - **GREEN**: Enhance `src/cli/init/index.ts`:
    - Keep existing functionality (createKordDirectory, scaffoldProject, writeProjectKordAiosConfig)
    - Add content export: copy builtin squad configs to `.kord/squads/`
    - Add summary output showing all created directories/files
    - Ensure .opencode/ directory is created if it doesn't exist
  - **REFACTOR**: Clean up messaging, ensure consistent output format

  **Must NOT do**:
  - DO NOT create agent files in .opencode/agents/ (agents are loaded from npm plugin, not from project files)
  - DO NOT copy skills to project level (skills are runtime, not project files)
  - DO NOT touch global config (init is project-only)
  - DO NOT overwrite existing user content (add-only merge for kord-aios.json)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple file changes, content export logic, comprehensive testing
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: Tasks 7, 8
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References** (existing code to follow):
  - `src/cli/init/index.ts:41-79` — Current init flow. Has createKordDirectory + scaffoldProject + writeProjectKordAiosConfig. ENHANCE, don't rewrite.
  - `src/cli/scaffolder.ts:32-52` — `getScaffoldEntries()`: Shows the pattern for creating directories with content. Follow this for squad export.
  - `src/features/builtin-squads/code/SQUAD.yaml` — The builtin "code" squad. This is the default squad to export to `.kord/squads/`.

  **Test References**:
  - `src/cli/init/index.test.ts` — If exists, extend. If not, create following scaffolder.test.ts patterns.
  - `src/cli/scaffolder.test.ts` — Shows how to test directory/file creation with temp dirs.

  **External References**:
  - synkra-aios `packages/installer/src/installer/aios-core-installer.js` — Shows the pattern for copying framework content to project. The `FOLDERS_TO_COPY` approach.

  **WHY Each Reference Matters**:
  - init/index.ts:41-79: Current init flow to enhance (not replace).
  - scaffolder.ts:32-52: Pattern for creating dirs with content files.
  - builtin-squads/code/SQUAD.yaml: The squad to export as default project squad.

  **Acceptance Criteria**:

  **TDD (tests):**
  - [ ] Test: init creates .kord/ with templates/ and squads/
  - [ ] Test: init creates docs/kord/ with plans/, drafts/, notepads/
  - [ ] Test: init creates .opencode/kord-aios.json
  - [ ] Test: init exports code squad to .kord/squads/
  - [ ] Test: init creates kord-rules.md
  - [ ] Test: init is idempotent
  - [ ] `bun test src/cli/init/index.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Init creates complete project structure
    Tool: Bash (bun test)
    Preconditions: Clean temp directory as project root
    Steps:
      1. Run: bun test src/cli/init/index.test.ts --grep "complete structure"
      2. Assert: .kord/templates/story.md exists
      3. Assert: .kord/templates/adr.md exists
      4. Assert: .kord/squads/ exists with default squad
      5. Assert: docs/kord/plans/ exists with .gitkeep
      6. Assert: docs/kord/drafts/ exists with .gitkeep
      7. Assert: docs/kord/notepads/ exists with .gitkeep
      8. Assert: .opencode/kord-aios.json exists
      9. Assert: kord-rules.md exists at root
    Expected Result: All project structure created
    Evidence: Test output captured

  Scenario: Init preserves existing content on re-run
    Tool: Bash (bun test)
    Preconditions: Project already initialized with custom content
    Steps:
      1. Run: bun test src/cli/init/index.test.ts --grep "idempotent"
      2. Assert: Existing custom content preserved
      3. Assert: No errors on re-init
    Expected Result: Safe re-initialization
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(cli): enhance init with content export and complete project scaffolding`
  - Files: `src/cli/init/index.ts`, `src/cli/init/index.test.ts`
  - Pre-commit: `bun test src/cli/init/index.test.ts`

---
- [x] 6. Add Antigravity plugin support for Google auth (TDD)

  **What to do**:
  - **RED**: Write tests that verify:
    - When `hasGemini: true`, install adds `opencode-antigravity-auth` to plugin array in opencode.json
    - When `hasGemini: true`, google provider config is added to opencode.json
    - When `hasGemini: false`, no antigravity plugin or google provider added
    - Plugin version is fetched from npm registry (or falls back to unversioned)
    - Existing antigravity entry is updated (not duplicated)
  - **GREEN**: Add Antigravity support:
    - Create or extend auth plugin handling in `src/cli/config-manager.ts`
    - Add `addAuthPlugins(config)` function following omoc pattern:
      - If `config.hasGemini`: fetch latest `opencode-antigravity-auth` version from npm
      - Add to plugins array in opencode.json
      - Add google provider config to opencode.json
    - Call `addAuthPlugins()` from install flow after provider config
  - **REFACTOR**: Extract npm version fetching to a reusable utility if not already present

  **Must NOT do**:
  - DO NOT handle OAuth tokens (that's `opencode auth login`)
  - DO NOT hardcode the antigravity version (fetch from npm)
  - DO NOT add antigravity for non-Gemini providers

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New feature with npm registry integration, multiple file changes
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: Task 8
  - **Blocked By**: Task 3

  **References**:

  **Pattern References** (existing code to follow):
  - `src/cli/config-manager.ts:231-289` — `addPluginToKordAiosConfig()`: Shows the pattern for adding plugins to opencode.json. Follow this for antigravity.
  - `src/cli/config-manager.ts:291-322` — `addProviderConfig()`: Shows the pattern for adding provider entries. Follow for google provider.

  **External References** (omoc reference — CRITICAL):
  - oh-my-opencode `src/cli/config-manager/auth-plugins.ts:53-60` — Shows EXACTLY how to add antigravity: fetch latest version → add to plugins array. Copy this pattern.
  - oh-my-opencode `src/cli/config-manager/add-provider-config.ts:30-42` — Shows google provider config structure: `providers.google = ANTIGRAVITY_PROVIDER_CONFIG.google`

  **WHY Each Reference Matters**:
  - config-manager.ts:231-289: Pattern for plugin array manipulation in opencode.json (same approach for antigravity).
  - omoc auth-plugins.ts: The EXACT implementation we need. Fetch version from npm, add to plugins.
  - omoc add-provider-config.ts: Shows the google provider config structure with Antigravity models.

  **Acceptance Criteria**:

  **TDD (tests):**
  - [ ] Test: Gemini selection adds opencode-antigravity-auth to plugins
  - [ ] Test: Gemini selection adds google provider config
  - [ ] Test: Non-Gemini config does NOT add antigravity
  - [ ] Test: Existing antigravity entry gets updated (not duplicated)
  - [ ] `bun test src/cli/config-manager.test.ts` → PASS (antigravity tests)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Gemini provider adds Antigravity plugin
    Tool: Bash (bun test)
    Preconditions: Test environment with mock npm registry
    Steps:
      1. Run: bun test src/cli/config-manager.test.ts --grep "antigravity"
      2. Assert: opencode.json plugins array contains "opencode-antigravity-auth@<version>"
      3. Assert: opencode.json has google provider config
    Expected Result: Antigravity plugin and provider correctly configured
    Evidence: Test output captured

  Scenario: Non-Gemini config has no Antigravity
    Tool: Bash (bun test)
    Preconditions: Config with hasGemini: false
    Steps:
      1. Run: bun test src/cli/config-manager.test.ts --grep "no gemini"
      2. Assert: No antigravity in plugins
      3. Assert: No google provider config
    Expected Result: Antigravity only added when Gemini selected
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(cli): add Antigravity plugin support for Google/Gemini auth`
  - Files: `src/cli/config-manager.ts`, `src/cli/config-manager.test.ts`, `src/cli/install.ts`
  - Pre-commit: `bun test src/cli/config-manager.test.ts`

---
- [x] 7. Update doctor checks for new install/init model (TDD)

  **What to do**:
  - **RED**: Write tests that verify:
    - Doctor checks for opencode.json with plugin entry (global check)
    - Doctor checks for .kord/ and docs/kord/ in current project dir (project check)
    - Doctor shows "Run `bunx kord-aios init`" when project structure missing
    - Doctor passes when both global and project are correctly configured
  - **GREEN**: Update `src/cli/doctor/`:
    - Modify `checks/plugin.ts` to verify global plugin registration separately
    - Add new check `checks/project-structure.ts` for project-level init verification
    - Register new check in doctor index
  - **REFACTOR**: Ensure check output messages are clear and actionable

  **Must NOT do**:
  - DO NOT change existing passing checks
  - DO NOT add checks for optional features (Antigravity, etc.)
  - DO NOT make project check fail if user hasn't run init (warn, not fail)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small addition to existing doctor framework
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential in Wave 4
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 3, 5

  **References**:

  **Pattern References** (existing code to follow):
  - `src/cli/doctor/checks/plugin.ts:79-117` — `checkPluginRegistration()`: Existing plugin check. Update to be more specific about global vs project.
  - `src/cli/doctor/checks/config.ts` — Config validation check pattern. Follow for project structure check.
  - `src/cli/doctor/index.ts` — Where checks are registered and orchestrated.

  **Test References**:
  - `src/cli/doctor/checks/plugin.test.ts` — Existing plugin check tests. Extend with new scenarios.

  **WHY Each Reference Matters**:
  - checks/plugin.ts: Existing check to modify — add project structure awareness.
  - checks/config.ts: Pattern for writing new checks.
  - doctor/index.ts: Where to register new project-structure check.

  **Acceptance Criteria**:

  **TDD (tests):**
  - [ ] Test: doctor detects missing global plugin registration
  - [ ] Test: doctor warns when project structure missing (not error)
  - [ ] Test: doctor passes when everything is correctly set up
  - [ ] `bun test src/cli/doctor/` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Doctor reports project structure status
    Tool: Bash (bun test)
    Preconditions: Global config correct, no project init
    Steps:
      1. Run: bun test src/cli/doctor/ --grep "project structure"
      2. Assert: Plugin registration check passes
      3. Assert: Project structure check shows warning (not error)
      4. Assert: Suggestion includes "bunx kord-aios init"
    Expected Result: Clear guidance for missing project init
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(cli): add doctor check for project structure (init verification)`
  - Files: `src/cli/doctor/checks/project-structure.ts`, `src/cli/doctor/checks/project-structure.test.ts`, `src/cli/doctor/index.ts`
  - Pre-commit: `bun test src/cli/doctor/`

---
- [x] 8. Full verification + publish preparation

  **What to do**:
  - Run complete test suite: `bun test`
  - Run type check: `bun run typecheck`
  - Run build: `bun run build`
  - Fix any failures introduced by the changes
  - Verify all 8 original issues are resolved:
    1. ✅ Provider detection defaults to false
    2. ✅ opencode.json generated at correct Windows path
    3. ✅ .kord/ only has templates/ and squads/
    4. ✅ kord-aios.json generated (model fallbacks are separate scope)
    5. ✅ Plugin registered in opencode.json
    6. ✅ Antigravity plugin installed for Gemini
    7. ✅ Install is global-only, init is project-only
    8. ✅ Fresh install prompts all auth questions
  - Create final commit if needed, then trigger publish via: `gh workflow run publish -f bump=patch`

  **Must NOT do**:
  - DO NOT publish directly (`bun publish` is forbidden)
  - DO NOT bump version manually (CI handles it)
  - DO NOT skip failing tests (fix them)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification and CI trigger, no new code
  - **Skills**: [`git-master`]
    - `git-master`: Final verification commit if needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None (final)
  - **Blocked By**: ALL previous tasks

  **References**:

  **Pattern References**:
  - `AGENTS.md:DEPLOYMENT` — "GitHub Actions workflow_dispatch ONLY. Never bun publish directly."
  - `AGENTS.md:COMMANDS` — `bun run typecheck`, `bun run build`, `bun test`

  **WHY Each Reference Matters**:
  - AGENTS.md: Defines the build/publish workflow. Follow exactly.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full test suite passes
    Tool: Bash
    Steps:
      1. Run: bun test
      2. Assert: Exit code 0
      3. Assert: No test failures in CLI-related test files
    Expected Result: All tests pass
    Evidence: Test output captured

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun run typecheck
      2. Assert: Exit code 0 (no type errors)
      3. Run: bun run build
      4. Assert: Exit code 0 (build succeeds)
      5. Assert: dist/ directory contains output
    Expected Result: Clean build
    Evidence: Build output captured

  Scenario: Publish triggered
    Tool: Bash
    Steps:
      1. Run: gh workflow run publish -f bump=patch
      2. Assert: Workflow triggered successfully
    Expected Result: CI publishes new version
    Evidence: gh output captured
  ```

  **Commit**: YES (if any fixes needed)
  - Message: `chore(cli): fix test/build issues from installer refactor`
  - Pre-commit: `bun test && bun run typecheck`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(cli): provider detection defaults to false when no config exists` | config-manager.ts, config-manager.test.ts | bun test src/cli/config-manager.test.ts |
| 2 | `fix(cli): align Windows path resolution with OpenCode config location` | opencode-config-dir.ts, opencode-config-dir.test.ts | bun test src/shared/opencode-config-dir.test.ts |
| 3 | `refactor(cli): separate install to global-only, remove project scaffolding` | install.ts, install.test.ts | bun test src/cli/install.test.ts |
| 4 | `fix(cli): only create .kord/ subdirs that have content (templates, squads)` | kord-directory.ts, project-layout.ts, kord-directory.test.ts | bun test src/cli/kord-directory.test.ts |
| 5 | `feat(cli): enhance init with content export and complete project scaffolding` | init/index.ts, init/index.test.ts | bun test src/cli/init/index.test.ts |
| 6 | `feat(cli): add Antigravity plugin support for Google/Gemini auth` | config-manager.ts, config-manager.test.ts, install.ts | bun test src/cli/config-manager.test.ts |
| 7 | `feat(cli): add doctor check for project structure (init verification)` | doctor/checks/*, doctor/index.ts | bun test src/cli/doctor/ |
| 8 | `chore(cli): fix test/build issues from installer refactor` (if needed) | various | bun test && bun run typecheck && bun run build |

---

## Success Criteria

### Verification Commands
```bash
bun test                  # Expected: all tests pass
bun run typecheck         # Expected: no type errors
bun run build             # Expected: clean build
```

### Final Checklist
- [ ] All 8 original issues resolved
- [ ] `install` is global-only (never creates .kord/ or docs/kord/)
- [ ] `init` creates complete project structure with content
- [ ] Fresh install on any platform prompts all auth questions
- [ ] Antigravity plugin installed when Gemini selected
- [ ] Doctor detects and reports installation state correctly
- [ ] All new tests pass with TDD methodology
- [ ] Existing tests still pass (no regressions)
- [ ] Patch release published via GitHub Actions
