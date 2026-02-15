# EPIC-17: Installer Scaffolding & Auth Reliability

> **Status**: Draft
> **Created**: 2026-02-14
> **Research**: [Epics 15-18 Deep Study](../../researches/epics-15-18-study.md) §3
> **Priority**: High
> **Depends on**: EPIC-16 (Project Layout Architecture)

> **Mirror Sources** (consulted and verified):
> - `D:\dev\oh-my-opencode` — OMOC installer (`install.ts`, `config-manager.ts`)
> - `D:\dev\opencode-source` — OpenCode plugin loading (`plugin/`)
> - `D:\dev\synkra-aios` — Synkra layout (no installer, manual setup)

---

## Summary

Wire `scaffoldProject()` into the install flow so that `kord-aios install` produces a **fully functional** project setup. Verify auth plugin reliability by tracing the full lifecycle through OpenCode's plugin system.

**Root cause** (verified): `scaffoldProject()` exists in `src/cli/scaffolder.ts` and creates all required templates/dirs, but is never called. OMOC had no scaffolding (plugin-only model). Kord-aios added `createKordDirectory()` for empty dirs but forgot to wire the content scaffolder.

---

## Context

### OMOC Installer Flow (Reference)

Source: `D:\dev\oh-my-opencode\src\cli\install.ts`

```
1. Check OpenCode binary
2. Provider wizard (TUI prompts)
3. addPluginToOpenCodeConfig() → writes to opencode.json
4. addAuthPlugins() → if Gemini, writes opencode-antigravity-auth@version to opencode.json plugins
5. addProviderConfig() → writes google provider config to opencode.json
6. writeOmoConfig() → writes oh-my-opencode.jsonc
7. Print auth instructions ("run opencode auth login")
```

**No scaffolding. No doctor. No directory creation.** OMOC is purely a config-writing installer.

### Kord-aios Installer Flow (Current)

Source: `d:\dev\kord-aios\src\cli\install.ts` lines 350-462

```
1. Check OpenCode binary
2. Detect project maturity (EPIC-12 addition)
3. Provider wizard (TUI prompts)
4. addPluginToKordAiosConfig() → writes to opencode.json
5. addAuthPlugins() → if Gemini, writes opencode-antigravity-auth@version
6. addProviderConfig() → writes google provider config
7. writeKordAiosConfig() → writes kord-aios.config.jsonc
8. createKordDirectory() → creates EMPTY .kord/ subdirs    ← THE GAP
9. Post-install doctor (EPIC-12 addition)
10. Print auth instructions
```

**Gap**: Step 8 creates empty dirs but does not call `scaffoldProject()` which would populate them with content.

### Auth Plugin Mechanism

**Identical between OMOC and kord-aios** (verified):
- Both write `opencode-antigravity-auth@version` to `opencode.json` `plugin` array
- OpenCode handles actual npm install of plugins when it reads the config
- Neither OMOC nor kord-aios runs `bun install` during install
- `GEMINI_AUTH_PLUGIN = "opencode-antigravity-auth"` (correct, same package)

**Potential failure points to investigate**:
1. Config path mismatch (kord-aios writing to wrong opencode.json)
2. OpenCode version compatibility (plugin loading API changes)
3. Provider config format (Antigravity model definitions)

---

## Stories

### S01: Research — DONE (Findings in Study Doc)

**Status**: Complete — see [epics-15-18-study.md §3](../../researches/epics-15-18-study.md)

Findings:
- OMOC has no scaffolding (config-only installer)
- Kord-aios `scaffoldProject()` exists but is not called
- Auth plugin mechanism is identical between OMOC and kord-aios
- OpenCode handles plugin npm install automatically

---

### S02: Wire `scaffoldProject()` Into Install Flow

**As** a user, **I need** the installer to scaffold templates and docs dirs **so that** agents can immediately find required assets.

**Exact changes**:

1. In `src/cli/install.ts` (non-TUI mode, after `createKordDirectory()`): Call `scaffoldProject({ directory: process.cwd() })`
2. In `src/cli/install.ts` (TUI mode, after `createKordDirectory()` spinner): Call `scaffoldProject({ directory: process.cwd() })`
3. In `src/cli/install-phases.ts` (if it orchestrates phases): Add scaffoldProject to the phase sequence

**Idempotency requirement**: `scaffoldProject()` already checks if files exist before writing (uses `existsSync`). Verify this for all output files.

**Acceptance Criteria**:
- [ ] Fresh install creates: `.kord/templates/story.md`, `.kord/templates/adr.md`, `docs/kord/plans/`, `docs/kord/notepads/`, `docs/kord/drafts/`, `kord-rules.md`
- [ ] Existing files are NOT overwritten
- [ ] Both TUI and non-TUI install paths call scaffoldProject
- [ ] `bun run typecheck` passes

**Files**: `src/cli/install.ts`, `src/cli/install-phases.ts`

---

### S03: Auth Plugin Verification & Config Path Audit

**As** a user, **I need** the Gemini/Antigravity auth plugin to work after install.

**Investigation steps**:
1. Trace `getOpenCodeConfigPaths()` in kord-aios to verify the exact `opencode.json` path written to
2. Compare with the path OpenCode reads from (check `D:\dev\opencode-source\packages\opencode\src\config\`)
3. Verify the plugin entry format matches what OpenCode expects
4. Verify the Antigravity provider config (model names, variants) matches what the auth plugin exposes

**Acceptance Criteria**:
- [ ] Config path audit: confirm kord-aios writes to the same `opencode.json` OpenCode reads
- [ ] Plugin entry format: `"opencode-antigravity-auth@x.y.z"` matches OpenCode plugin loader expectations
- [ ] Provider config: Antigravity model names match `opencode-antigravity-auth` package exports
- [ ] If config path mismatch found → fix it
- [ ] If no mismatch → document that auth works correctly and the reported issue was transient

**Files**: `src/cli/config-manager.ts`, `src/shared/opencode-config-dir.ts`

---

### S04: Enhance Doctor Checks for Templates & Auth

**As** the installer, **I need** doctor checks that validate the full scaffold + auth state.

**New/updated checks**:
- [ ] `.kord/templates/story.md` exists (warning, auto-repairable by re-running scaffoldProject)
- [ ] `docs/kord/plans/` exists (warning, auto-repairable)
- [ ] Auth plugin present in opencode.json plugin array (info check)
- [ ] Antigravity provider config present in opencode.json (info check)

**Files**: `src/cli/post-install-doctor.ts`

---

### S05: Tests — Scaffold + Auth

**As** a maintainer, **I need** tests covering the scaffold integration.

**Tests to add**:
- [ ] Fresh install → scaffoldProject called → expected files exist
- [ ] Partial install (some files exist) → scaffoldProject called → missing files created, existing untouched
- [ ] Auth plugin config written correctly to opencode.json
- [ ] Doctor reports missing templates as warnings

**Files**: `src/cli/install.test.ts`, `src/cli/scaffolder.test.ts`, `src/cli/post-install-doctor.test.ts`

---

## Out of Scope

- Interactive auth TUI (OpenCode handles `opencode auth login`)
- Large template library beyond the minimal baseline (story.md, adr.md)
- Synkra `.aios-core/` full migration (separate skill EPIC)
