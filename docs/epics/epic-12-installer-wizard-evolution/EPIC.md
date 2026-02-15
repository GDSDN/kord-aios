# EPIC-12: Installer Wizard Evolution

> **Status**: Draft
> **Created**: 2026-02-12
> **Research**: [Installer Wizard Study](../../researches/installer-wizard-study.md)
> **Priority**: High
> **Depends on**: None (standalone)

---

## Summary

Evolve the Kord AIOS installer from a pure provider-configuration wizard into a full lifecycle manager. Add OpenCode detection with auto-install, brownfield/greenfield project maturity detection, post-install doctor verification, and dry-run mode. Preserve the existing 7-provider wizard as the core — wrap it with operational maturity.

---

## Context

### Current State (OMOC)
- TUI mode (interactive @clack/prompts) and non-TUI mode (CLI args)
- 7-provider wizard: Claude, OpenAI, Gemini, Copilot, OpenCode Zen, Z.ai, Kimi
- OpenCode detection (detect only — warns if missing, does NOT install)
- Update detection (detects existing config, pre-fills defaults)
- Project scaffolding (.kord/, docs/kord/, templates, kord-rules.md)
- Auth guidance (reminds about `opencode auth login`)
- Config writing (opencode.json, kord-aios.config.jsonc)
- Doctor module exists at `src/cli/doctor/` but is NOT integrated into install flow

### Target State
- OpenCode detection + **auto-install** (OS-aware: brew/curl/winget)
- **Brownfield/greenfield detection** with adaptive flow
- **Doctor integration** — automatic post-install health check
- **Dry-run mode** — preview all actions without modifying anything
- Preserved provider wizard (unchanged)
- Clean separation of concerns (detect → configure → install → verify)

### Key Insight from Synkra
Synkra's installer treats brownfield/greenfield as a first-class concern — not an afterthought. It also runs a doctor after every install. These two additions alone would prevent 80% of "install didn't work" issues.

### OpenCode Plugin Architecture (Critical Context)

OpenCode installs npm plugins to `~/.cache/opencode/node_modules/` using its **own bundled Bun**. The user does NOT need Bun installed. The npm-installed plugin is **immutable** — it cannot be edited in place.

The plugin loads **runtime content from project-level directories**:
- `.kord/` — templates, skills (editable)
- `.opencode/squads/` — squad data packages (editable)
- `docs/kord/` — plans, notepads (editable)
- `kord-aios.config.jsonc` — configuration (editable)
- `kord-rules.md` — project rules (editable)

**Architecture**: Plugin = engine (immutable npm package) + content (editable project files).

The installer's job is two-fold:
1. **Register the plugin** in `opencode.json` (OpenCode handles npm install)
2. **Initialize project content** (scaffold directories, write config, create rules)

See [Installer Study §8](../../researches/installer-wizard-study.md#8-deep-dive-opencode-plugin-installation-mechanism) for full analysis.

### Bun vs npm (No Fundamental Conflict)

The CLI uses precompiled platform binaries (self-contained Bun executables). The bin wrapper uses `#!/usr/bin/env node`. So `npx kord-aios install` should work without Bun installed. The main action item is to **document and test npx as first-class install method**, especially for Windows.

See [Installer Study §9](../../researches/installer-wizard-study.md#9-deep-dive-bun-vs-npm-compatibility) for full analysis.

---

## Stories

### Wave 1: Environment & Detection

#### S01: OpenCode Auto-Install

**As** a new user, **I need** the installer to detect and optionally install OpenCode **so that** I don't have to figure out how to install OpenCode separately.

**Acceptance Criteria**:
- [ ] New module `src/cli/opencode-installer.ts` with:
  - `detectOS()`: returns `"macos" | "linux" | "windows"`
  - `getInstallCommand(os)`: returns the appropriate install command
  - `isOpenCodeInstalled()`: checks binary availability (reuse existing `isKordAiosInstalled`)
  - `installOpenCode(os)`: executes install command with spinner
- [ ] Install methods by OS:
  - macOS: `brew install sst/tap/opencode` (fallback: curl)
  - Linux: `curl -fsSL https://opencode.ai/install.sh | sh`
  - Windows: `winget install sst.opencode` (fallback: manual instructions)
- [ ] In TUI mode: if OpenCode not found, prompt "Install OpenCode now? (Y/n)"
  - Yes → install with spinner → verify → continue
  - No → show manual instructions → continue (with warning)
- [ ] In non-TUI mode: `--install-opencode` flag to auto-install
- [ ] After install attempt, verify OpenCode is available and show version
- [ ] Tests: mock execa calls, verify correct command per OS
- [ ] `bun run typecheck` passes

**Files**: `src/cli/opencode-installer.ts` (new), `src/cli/install.ts`, `src/cli/types.ts`

**Note**: Install commands must be verified against OpenCode's actual docs. The study provides best guesses — confirm before implementing.

---

#### S02: Brownfield/Greenfield Detection

**As** the installer, **I need** to detect project maturity **so that** the install flow adapts to existing projects vs fresh setups.

**Acceptance Criteria**:
- [ ] New module `src/cli/project-detector.ts` with:
  ```typescript
  interface ProjectMaturity {
    status: "fresh" | "partial" | "existing"
    hasOpenCodeJson: boolean
    hasKordPlugin: boolean
    hasKordConfig: boolean
    hasKordDirectory: boolean
    hasDocsKord: boolean
    hasKordRules: boolean
    currentVersion: string | null
  }
  ```
- [ ] Detection logic:
  - `fresh`: No opencode.json OR no kord plugin entry
  - `partial`: Plugin exists but missing scaffold artifacts (.kord/, docs/kord/)
  - `existing`: Plugin + config + scaffold all present
- [ ] Classification is pure (no side effects — only reads filesystem)
- [ ] Tests: mock filesystem states, verify correct classification
- [ ] `bun run typecheck` passes

**Files**: `src/cli/project-detector.ts` (new), `src/cli/types.ts`

---

#### S03: Adaptive Install Flow

**As** the installer, **I need** to adapt my behavior based on project maturity **so that** fresh installs, partial repairs, and updates each get the right treatment.

**Acceptance Criteria**:
- [ ] Install flow branches on maturity status:
  - **fresh**: Full install (OpenCode check → provider wizard → config write → scaffold → doctor)
  - **partial**: Resume install (skip provider wizard if config exists → scaffold missing dirs → doctor)
  - **existing**: Update mode (show current config → provider wizard with defaults → update config → doctor)
- [ ] TUI mode shows maturity status message:
  - fresh: "New installation detected"
  - partial: "Incomplete installation detected — resuming setup"
  - existing: "Existing installation detected — update mode"
- [ ] Non-TUI mode: `--force` flag to treat as fresh regardless of maturity
- [ ] Tests: each maturity status triggers correct flow branch
- [ ] `bun run typecheck` passes

**Files**: `src/cli/install.ts`, `src/cli/types.ts`

---

### Wave 2: Post-Install & Quality

#### S04: Doctor Integration in Install Flow

**As** the installer, **I need** to run diagnostic checks after installation **so that** issues are caught immediately.

**Acceptance Criteria**:
- [ ] After all install steps complete, run doctor checks:
  - `opencode.json` exists and is valid JSON
  - Plugin entry exists in opencode.json plugins array
  - `kord-aios.config.jsonc` exists and is valid JSONC
  - `.kord/` directory exists
  - `docs/kord/plans/` directory exists
  - OpenCode binary can be invoked (if installed)
- [ ] Doctor results shown as pass/fail checklist:
  ```
  Post-Install Verification:
    ✓ opencode.json valid
    ✓ Plugin registered
    ✓ Config file valid
    ✓ .kord/ directory exists
    ✓ docs/kord/ directory exists
    ✗ OpenCode binary not found (non-blocking)
  ```
- [ ] Doctor failures are warnings (non-blocking) — install still "succeeds"
- [ ] Non-TUI mode: `--skip-doctor` flag to skip verification
- [ ] Tests: mock filesystem, verify doctor output for various states
- [ ] `bun run typecheck` passes

**Files**: `src/cli/doctor/` (enhance existing), `src/cli/install.ts`

---

#### S05: Dry-Run Mode

**As** a cautious user, **I need** a dry-run mode **so that** I can preview what the installer would do without modifying anything.

**Acceptance Criteria**:
- [ ] `--dry-run` flag added to CLI args
- [ ] In dry-run mode:
  - All detection steps run normally (read-only)
  - All write operations are logged but NOT executed
  - Output prefixed with `[DRY-RUN]`
  - Shows what would be created/modified
- [ ] Format: `[DRY-RUN] Would create: .kord/templates/story.md`
- [ ] TUI mode: shows note banner "Dry-run mode — no changes will be made"
- [ ] Non-TUI mode: same prefix format
- [ ] Exit code 0 (success) even in dry-run
- [ ] Tests: verify no filesystem writes in dry-run mode
- [ ] `bun run typecheck` passes

**Files**: `src/cli/install.ts`, `src/cli/types.ts`, `src/cli/scaffolder.ts`

---

#### S06: Standalone Doctor Command

**As** a user, **I need** a standalone `bunx kord-aios doctor` command **so that** I can run diagnostics anytime, not just during install.

**Acceptance Criteria**:
- [ ] `bunx kord-aios doctor` command registered in CLI entry point
- [ ] Runs the same checks as S04 post-install doctor
- [ ] Additional checks for standalone mode:
  - Config file values are valid (provider names, model names)
  - Auth status for configured providers (optional, non-blocking)
  - Plugin version matches installed package version
- [ ] Shows summary with health score: `Health: 5/6 checks passed`
- [ ] Exit code: 0 if all pass, 1 if any critical failures
- [ ] `--json` flag for machine-readable output
- [ ] Tests: verify output format, exit codes
- [ ] `bun run typecheck` passes

**Files**: `src/cli/doctor/` (enhance), `src/cli/index.ts` or CLI entry point

---

### Wave 3: Polish & Tests

#### S07: Install Flow Refactor — Clean Phases

**As** the codebase, **I need** the install flow refactored into clean phases **so that** each phase is testable and the flow is maintainable.

**Acceptance Criteria**:
- [ ] `install.ts` refactored into phase functions:
  - `phaseEnvironment()`: OpenCode detection + auto-install
  - `phaseDetection()`: Project maturity detection
  - `phaseConfiguration()`: Provider wizard (existing)
  - `phaseInstallation()`: Config writing + scaffolding (existing)
  - `phaseVerification()`: Doctor checks
- [ ] Each phase returns a result object (not void)
- [ ] Main `install()` orchestrates phases sequentially
- [ ] Existing TUI and non-TUI modes preserved
- [ ] No behavioral changes — pure refactor
- [ ] Tests: each phase function tested independently
- [ ] `bun run typecheck` passes

**Files**: `src/cli/install.ts`

---

#### S08: Comprehensive Test Suite

**As** the test suite, **I need** comprehensive coverage of all installer changes **so that** regressions are caught.

**Acceptance Criteria**:
- [ ] Tests for S01 (OpenCode detection, install command per OS, mock execa)
- [ ] Tests for S02 (project maturity detection — fresh/partial/existing)
- [ ] Tests for S03 (adaptive flow branching)
- [ ] Tests for S04 (doctor checks — all pass, some fail, all fail)
- [ ] Tests for S05 (dry-run — no writes, correct output)
- [ ] Tests for S06 (standalone doctor command output, exit codes)
- [ ] Tests for S07 (phase functions return correct results)
- [ ] Tests for S09 (npx compatibility — bin wrapper works without bun)
- [ ] All existing install tests still pass (3 known ESM spy failures tolerated)
- [ ] `bun run typecheck` passes
- [ ] `bun test` — all installer-related tests green

**Files**: `src/cli/opencode-installer.test.ts`, `src/cli/project-detector.test.ts`, `src/cli/install.test.ts` (enhance), `src/cli/doctor/runner.test.ts` (enhance)

---

#### S09: npx Compatibility — Document and Test

**As** a Windows user who can't use Bun reliably, **I need** `npx kord-aios install` to work as a first-class install method **so that** I can set up Kord AIOS without Bun.

**Context**: The CLI already uses precompiled platform binaries (self-contained Bun executables) spawned by a `#!/usr/bin/env node` wrapper. In theory, `npx` should work. But this has never been explicitly tested or documented.

**Acceptance Criteria**:
- [ ] Verify `npx kord-aios install` works end-to-end on:
  - Windows (primary concern)
  - macOS
  - Linux
- [ ] Verify precompiled binary is correctly resolved by the bin wrapper when run via npx
- [ ] Verify `optionalDependencies` platform packages are installed by npm
- [ ] Update README install instructions: show `npx` as primary method, `bunx` as alternative
- [ ] Update CLI help text to mention both `npx` and `bunx`
- [ ] Update installer completion message to not assume bun
- [ ] If npx doesn't work on Windows: investigate and fix the bin wrapper or add a `--target node` CLI build variant
- [ ] `bun run typecheck` passes

**Files**: `bin/kord-aios.js`, `bin/platform.js`, `README.md`, `src/cli/install.ts`

---

## Wave Execution Plan

| Wave | Stories | Focus | Dependencies |
|------|---------|-------|-------------|
| **Wave 1** | S01, S02, S03 | Environment detection + adaptive flow | None |
| **Wave 2** | S04, S05, S06 | Doctor + dry-run + standalone command | Wave 1 |
| **Wave 3** | S07, S08, S09 | Refactor + tests + npx compatibility | Wave 2 |

---

## Out of Scope (Future)

- **Version migration**: Automatic config migration between plugin versions
- **Uninstall command**: Clean removal of all Kord artifacts
- **Plugin version pinning**: Lock to specific plugin version
- **Remote config import**: Import config from URL/gist
- **Team onboarding**: Export/import config for teams
- **Profile system**: Bob/Advanced mode (Synkra has this but our provider wizard is sufficient)
- **CI mode**: Non-interactive install for CI/CD pipelines (non-TUI mode partially covers this)

---

## Technical Notes

### OpenCode Install Commands (Verify Before Implementing)

These are best guesses based on common patterns. **Must be verified** against https://opencode.ai/docs before implementation:

| OS | Command | Fallback |
|----|---------|----------|
| macOS | `brew install sst/tap/opencode` | curl script |
| Linux | `curl -fsSL https://opencode.ai/install.sh \| sh` | manual |
| Windows | `winget install sst.opencode` | scoop / manual |

### Existing Doctor Module

`src/cli/doctor/` has:
- `types.ts` — DoctorCheck, DoctorResult types
- `runner.ts` — Check runner
- `formatter.ts` — Result formatter
- `constants.ts` — Check definitions
- Tests for runner and formatter

Currently **empty checks/** directory — needs actual check implementations.

### Known Installer Test Failures

3 existing failures in `install.test.ts` due to ESM spy limitation (`spyOn` doesn't intercept internal module calls). Pre-existing, not caused by changes. Tolerated.

---

## Anti-Patterns

- **Don't auto-install without asking** — always prompt before installing OpenCode
- **Don't overwrite config without confirmation** — detect existing, ask before changing
- **Don't block on doctor failures** — doctor is advisory, not gate-keeping
- **Don't hardcode OpenCode install URLs** — use constants that can be updated
- **Don't break non-TUI mode** — all features must work in both modes
- **Don't add profile system** — provider wizard already handles complexity
