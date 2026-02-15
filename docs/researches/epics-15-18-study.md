# Epics 15-18: Deep Gap Analysis & Root Cause Study

> **Status**: Complete
> **Created**: 2026-02-14
> **Mirror Sources Consulted**:
> - `D:\dev\opencode-source` — OpenCode engine (agent.ts, local.tsx, task.ts)
> - `D:\dev\oh-my-opencode` — OMOC reference (config-handler.ts, install.ts, config-manager.ts)
> - `D:\dev\synkra-aios` — Synkra AIOS methodology (`.aios-core/` layout)

---

## 1. Agent Topology & Invocation (EPIC-15)

### 1.1 OpenCode Agent Visibility Rules (Source of Truth)

From `D:\dev\opencode-source\packages\opencode\src\agent\agent.ts`:

**Agent schema** (lines 24-48):
```typescript
mode: z.enum(["subagent", "primary", "all"])
hidden: z.boolean().optional()
```

**Plugin agent defaults** (lines 204-231): When a plugin registers an agent that doesn't exist natively, OpenCode creates it with `mode: "all"` by default. Plugin can override `mode` and `hidden` via config.

**Primary picker** (`local.tsx` line 37):
```typescript
const agents = createMemo(() => sync.data.agent.filter((x) => x.mode !== "subagent" && !x.hidden))
```

**Task tool / @-invocation** (`task.ts` line 28):
```typescript
const agents = await Agent.list().then((x) => x.filter((a) => a.mode !== "primary"))
```

**Effective visibility matrix**:

| Mode | Primary Picker | Task/@-invoke |
|------|---------------|---------------|
| `"primary"` | ✓ (unless hidden) | ✗ |
| `"subagent"` | ✗ | ✓ |
| `"all"` | ✓ (unless hidden) | ✓ |
| `hidden: true` | ✗ (regardless) | depends on mode |

**Default agent selection** (`agent.ts` lines 265-279):
- If `cfg.default_agent` set → uses that (must not be subagent or hidden)
- Otherwise → first agent where `mode !== "subagent" && hidden !== true`

### 1.2 OMOC Agent Topology (Working Reference)

From `D:\dev\oh-my-opencode\src\plugin-handlers\config-handler.ts`:

**Core agent order** (line 51):
```typescript
const CORE_AGENT_ORDER = ["sisyphus", "hephaestus", "prometheus", "atlas"] as const;
```

**Agent mode assignments**:

| OMOC Agent | Mode | How Set | Picker | Task |
|------------|------|---------|--------|------|
| `sisyphus` | `"primary"` | factory default | ✓ (default) | ✗ |
| `hephaestus` | `"primary"` | factory default | ✓ | ✗ |
| `prometheus` | `"all"` | **explicitly set in config-handler line 306** | ✓ | ✓ |
| `atlas` | `"primary"` | factory default (in builtinAgents) | ✓ | ✗ |
| `oracle` | `"subagent"` | factory default | ✗ | ✓ |
| `explore` | `"subagent"` | factory default | ✗ | ✓ |
| OpenCode `build` | `"subagent"` + hidden | **overridden at line 376** | ✗ | ✗ |
| OpenCode `plan` | `"subagent"` | **overridden at line 377** | ✗ | ✓ |

**Key design pattern**: OMOC creates its OWN planner (`prometheus`) as a separate agent registered in `agentConfig`, then HIDES OpenCode's native `build` and DEMOTES OpenCode's native `plan` to prevent conflicts. This is done at lines 367-378:

```typescript
config.agent = {
  ...agentConfig,           // sisyphus, prometheus
  ...builtinAgents,         // oracle, explore, etc. (minus sisyphus)
  ...userAgents, ...projectAgents, ...pluginAgents,
  ...filteredConfigAgents,
  build: { ...migratedBuild, mode: "subagent", hidden: true },  // Hide OpenCode's native build
  ...(planDemoteConfig ? { plan: planDemoteConfig } : {}),       // Demote OpenCode's native plan
};
```

### 1.3 Kord-aios Agent Topology (The Bug)

From `d:\dev\kord-aios\src\plugin-handlers\config-handler.ts` lines 365-376:

**Agent name mapping** (from the migration):
- `sisyphus` → `kord`
- `hephaestus` → `dev`
- `prometheus` → `plan`
- `atlas` → `build`

**The bug**: The config-handler was copied from OMOC and agent names were renamed, but the **override logic was NOT updated** to account for the rename. Specifically:

```typescript
config.agent = {
  ...agentConfig,           // kord, plan (with full prompt/config)
  ...builtinAgents,         // All other agents (minus kord)
  ...userAgents, ...projectAgents, ...pluginAgents,
  ...filteredConfigAgents,
  build: { ...migratedBuild, mode: "subagent", hidden: true },  // ← BUG: hides kord-aios's OWN build agent
  ...(planDemoteConfig ? { plan: planDemoteConfig } : {}),       // ← BUG: overwrites kord-aios's OWN plan agent
};
```

**Root cause**: In OMOC, `build` (the override target) was OpenCode's native agent — OMOC's own orchestrator was named `atlas`. In kord-aios, the orchestrator was RENAMED to `build`, so this override now destroys its own agent.

Same for `plan`: OMOC created `prometheus` as a separate agent and demoted OpenCode's native `plan`. Kord-aios renamed prometheus TO `plan`, so the demotion now destroys its own planner.

### 1.4 Exact Fix Required

**For `build`**: Remove the hardcoded `build: { ...migratedBuild, mode: "subagent", hidden: true }` override. The build agent is now kord-aios's own agent (from builtinAgents), not OpenCode's native one.

**For `plan`**: Remove the `planDemoteConfig` spread. The plan agent is now kord-aios's own planner (from agentConfig), not OpenCode's native one. Set plan to `mode: "all"` (matching prometheus's behavior in OMOC) so it appears in both the picker and task invocation.

**For `kord`**: Already correct — set as default_agent with mode "primary".

**For `dev`**: Already correct — mode "all" in factory.

**For specialists** (pm, devops, etc.): Their `mode: "subagent"` is CORRECT per OpenCode's task.ts filter. They show in task/@-invocation but not in the primary picker. The calling agent (kord) must have `task: "allow"` permission for them to be accessible (verify this is set).

### 1.5 CORE_AGENT_ORDER

OMOC: `["sisyphus", "hephaestus", "prometheus", "atlas"]`
Kord-aios must update to: `["kord", "dev", "plan", "build"]`

Verify this is correct in current kord-aios config-handler.

---

## 2. Project Layout Architecture (EPIC-16)

### 2.1 Synkra AIOS Layout (Methodology Source)

From `D:\dev\synkra-aios\.aios-core/`:

```
.aios-core/
  development/
    agents/          # Agent definition .md files (aios-master.md, analyst.md, architect.md, ...)
    checklists/      # Quality checklists (agent-quality-gate.md, self-critique-checklist.md)
    scripts/         # JS utility scripts (20+ files: branch-manager.js, commit-message-generator.js, ...)
    tasks/           # 200 task files (methodology skills)
    templates/       # Templates (squad/, service-template/, aios-doc-template.md, ...)
    workflows/       # Workflow definitions
  core/              # Engine config, execution, events
  data/              # Knowledge base, tech presets
  ...
```

Key traits:
- **Everything in `.aios-core/`** (project-level, git-tracked, editable)
- Agents look for assets via relative paths from `.aios-core/`
- Templates are concrete files (not prompts)
- Scripts are real JS executables
- Checklists are markdown quality gates

### 2.2 OMOC Layout (Engine Source)

From `D:\dev\oh-my-opencode\src\cli/`:

**OMOC has NO project-level directories**. No `.kord/`, no `.aios-core/`, no `docs/kord/`. Everything is:
- Plugin-embedded in `src/` (prompts, metadata, skill content)
- Written to OpenCode config dir (`~/.config/opencode/`)

The installer only writes config files (`opencode.json`, `oh-my-opencode.jsonc`).

### 2.3 Kord-aios Current Layout (Hybrid — Broken)

**Installer creates** (via `createKordDirectory()`):
```
.kord/
  scripts/       # EMPTY
  templates/     # EMPTY
  checklists/    # EMPTY
  skills/        # EMPTY
  squads/        # EMPTY
```

**Hooks enforce** (code references):
- `plan-md-only/index.ts`: Plan writes restricted to `docs/kord/*.md`
- `dev-notepad/constants.ts`: Notepads at `docs/kord/notepads/{plan-name}/`
- `init-deep.ts`: References `docs/kord/plans/` and `docs/kord/notepads/`

**Agent prompts reference** (kord.ts line 243):
```
Templates | `.kord/templates/`
```

**`scaffoldProject()` would create** (but is NOT called):
- `.kord/templates/story.md`
- `.kord/templates/adr.md`
- `docs/kord/plans/`
- `docs/kord/drafts/`
- `docs/kord/notepads/`
- `kord-rules.md`

**Squad loader search paths** (EPIC-11 S03):
- `.opencode/squads/` → `.kord/squads/` → `docs/kord/squads/`

### 2.4 Architecture Decision

The correct model for kord-aios is **Hybrid** (plugin defaults + project overrides):

| Asset Class | Location | Source | Editable |
|------------|----------|--------|----------|
| Templates | `.kord/templates/` | Scaffolded by installer | ✓ |
| Scripts | `.kord/scripts/` | Scaffolded or user-created | ✓ |
| Checklists | `.kord/checklists/` | Scaffolded or user-created | ✓ |
| Skills (SKILL.md) | `.kord/skills/` | Plugin builtin-skills + user additions | ✓ |
| Squads (SQUAD.yaml) | `.kord/squads/` | Plugin builtin-squads + user additions | ✓ |
| Plans (authored) | `docs/kord/plans/` | Agent-generated | ✓ |
| Notepads (authored) | `docs/kord/notepads/` | Agent-generated | ✓ |
| Drafts | `docs/kord/drafts/` | Agent-generated (temporary) | ✓ |
| Rules | `kord-rules.md` | Scaffolded | ✓ |

**Resolution order** (per asset class):
1. Project override (`.kord/*` or `docs/kord/*`)
2. Plugin defaults (embedded in `src/`)

**Missing asset handling**: Plugin defaults are always available as fallback. Agents should not fail if `.kord/` files are missing — they degrade to plugin-embedded defaults.

---

## 3. Installer Scaffolding & Auth Reliability (EPIC-17)

### 3.1 OMOC Installer Flow (Working Reference)

From `D:\dev\oh-my-opencode\src\cli\install.ts`:

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

### 3.2 Kord-aios Installer Flow (Current)

From `d:\dev\kord-aios\src\cli\install.ts`:

```
1. Check OpenCode binary
2. Detect project maturity (EPIC-12 addition)
3. Provider wizard (TUI prompts)
4. addPluginToKordAiosConfig() → writes to opencode.json
5. addAuthPlugins() → if Gemini, writes opencode-antigravity-auth@version to opencode.json plugins
6. addProviderConfig() → writes google provider config to opencode.json
7. writeKordAiosConfig() → writes kord-aios.config.jsonc
8. createKordDirectory() → creates EMPTY .kord/ subdirs  ← THE GAP
9. Post-install doctor (EPIC-12 addition)
10. Print auth instructions
```

### 3.3 Scaffolding Gap

**`createKordDirectory()`** (`src/cli/kord-directory.ts`): Creates 5 empty subdirectories.

**`scaffoldProject()`** (`src/cli/scaffolder.ts`): Creates actual content files. **Not called by installer.**

**Fix**: Wire `scaffoldProject()` into the install flow (both TUI and non-TUI modes), after `createKordDirectory()`. Make it idempotent (skip existing files).

### 3.4 Auth Plugin Analysis

**Auth mechanism is IDENTICAL** between OMOC and kord-aios:
- Both write `opencode-antigravity-auth@version` to `opencode.json` plugins array
- Neither runs `bun install` — **OpenCode handles plugin installation** automatically when it reads the plugin array
- `GEMINI_AUTH_PLUGIN = "opencode-antigravity-auth"` (correct, same as OMOC)
- `LEGACY_GEMINI_AUTH_PLUGIN = "kord-aios-antigravity-auth"` (migration compat for a name that probably never existed)

**Possible auth failure causes to investigate**:
1. **Config path mismatch**: If kord-aios writes to a different `opencode.json` location than OpenCode reads, the plugin entry won't be found
2. **Plugin entry format**: Verify the exact plugin entry format matches what OpenCode expects
3. **Provider config placement**: The Antigravity provider config must be in the same `opencode.json`
4. **OpenCode version**: Newer OpenCode versions may have changed plugin loading behavior

**Investigation needed**: Compare the actual `opencode.json` path that kord-aios writes to vs the path OpenCode reads from. Check `getOpenCodeConfigPaths()` in both OMOC and kord-aios.

---

## 4. Branding & Naming Audit (EPIC-18)

### 4.1 Stale References Found in src/

| File | Line | Stale Content | Category |
|------|------|--------------|----------|
| `src/cli/model-fallback.ts` | 41 | `SCHEMA_URL` references `kord-opencode.schema.json` | **STALE** — must fix |
| `assets/kord-opencode.schema.json` | filename | File named `kord-opencode` instead of `kord-aios` | **STALE** — must rename |

### 4.2 Intentional Compatibility References

| File | Matches | Category |
|------|---------|----------|
| `src/shared/migration.ts` | 14 | **COMPAT** — `AGENT_NAME_MAP` maps legacy names (sisyphus, prometheus, atlas, hephaestus) to new names |
| `src/shared/migration.test.ts` | 4 | **COMPAT** — tests for migration maps |
| `src/agents/wave1-prompt-updates.test.ts` | 2 | **COMPAT** — negative assertions (verify legacy names are NOT in prompts) |
| `src/cli/run/runner.test.ts` | 2 | **COMPAT** — test compatibility |
| `src/shared/agent-config-integration.test.ts` | 2 | **COMPAT** — test compatibility |
| `src/shared/model-requirements.test.ts` | 1 | **COMPAT** — test compatibility |

### 4.3 .github/ References

| File | Issue |
|------|-------|
| `.github/workflows/sisyphus-agent.yml` | Already fixed in previous session (renamed to kord-aios branding) |
| `.github/FUNDING.yml` | Points to `code-yeongyu` — needs audit for GDSDN alignment |

### 4.4 Branding Audit Summary

**Only 2 stale references remain in runtime code**:
1. `src/cli/model-fallback.ts` SCHEMA_URL
2. `assets/kord-opencode.schema.json` filename

All other legacy name references are intentional migration/compat mappings in `migration.ts` and test files.

---

## 5. Summary: Problems → Root Causes → Fixes

| # | Problem | Root Cause | Mirror Evidence | Fix |
|---|---------|-----------|-----------------|-----|
| 1 | `build` not primary | Config-handler overrides kord-aios's own build with `{mode:"subagent",hidden:true}` — copied from OMOC where it targeted OpenCode's native build | OMOC `config-handler.ts:376`, OpenCode `local.tsx:37` | Remove the `build:` override at line 374 |
| 2 | `plan` not primary | Config-handler overwrites kord-aios's own plan with `planDemoteConfig` — copied from OMOC where it targeted OpenCode's native plan | OMOC `config-handler.ts:377`, OMOC set prometheus to `mode:"all"` at line 306 | Remove planDemoteConfig spread; set plan to `mode:"all"` |
| 3 | Specialists not @-invokable | Likely correct — `mode:"subagent"` IS task-invokable per OpenCode `task.ts:28`. Verify kord has `task:"allow"` permission | OpenCode `task.ts:28-34` | Verify permissions; may already work once build/plan are fixed |
| 4 | Empty `.kord/` dirs | `scaffoldProject()` exists but installer calls `createKordDirectory()` instead | OMOC has no scaffolding at all; Synkra has full `.aios-core/` | Wire `scaffoldProject()` into install flow |
| 5 | Auth plugin unreliable | Mechanism is identical to OMOC. Investigate config path alignment with OpenCode | OMOC `config-manager.ts:397-435` is identical pattern | Verify config paths match OpenCode expectations |
| 6 | Stale branding | 2 stale refs: SCHEMA_URL + schema filename | All other legacy refs are intentional compat mappings | Fix 2 files; document compat policy |
