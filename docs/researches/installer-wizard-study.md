> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Installer Wizard Study — Synkra AIOS vs OMOC vs Kord AIOS

> **Date**: 2026-02-12
> **Status**: Complete
> **Scope**: How installers work in Synkra AIOS and OMOC, and how to orchestrate the Kord AIOS installer

---

## Executive Summary

Synkra AIOS has a mature installer with OS detection, dependency checking, brownfield/greenfield detection, profile selection, and doctor integration. OMOC (Kord AIOS) has a strong provider-based wizard but lacks OpenCode auto-install, project maturity detection, and post-install diagnostics. This study proposes a unified installer that combines OMOC's provider intelligence with Synkra's operational maturity.

---

## 1. Synkra AIOS Installer (`@synkra/aios-install`)

### 1.1 Entry Point

```bash
npx @synkra/aios-install              # Interactive
npx @synkra/aios-install --dry-run    # Preview mode
npx @synkra/aios-install --profile bob # Direct profile
```

### 1.2 Installation Flow

```
Step 1: OS Detection
  → Detects OS (Windows/macOS/Linux), architecture, display name
  → Shows notes (e.g., "Apple Silicon detected")

Step 2: Dependency Check
  → Checks required deps (Node.js, git, npm)
  → Shows pass/fail summary
  → Blocks if missing required deps
  → Warns for optional deps

Step 3: Profile Selection
  → "Bob Mode" (simplified) — educational, guided
  → "Advanced Mode" — full access to all agents and commands
  → Writes to ~/.aios/user-config.yaml

Step 4: User Config
  → Creates ~/.aios/user-config.yaml
  → Sets user_profile + educational_mode

Step 5: Brownfield Detection
  → Checks for existing .aios-core/ directory
  → Checks for legacy config (core-config.yaml)
  → Checks for layered config (framework-config.yaml)
  → If brownfield + legacy: offers migration
  → If brownfield + current: "Config is up to date"
  → If greenfield: npm init → npm install aios-core → npx aios-core install

Step 6: Doctor
  → Runs `npx aios-core doctor`
  → Verifies installation health

Completion:
  → Shows elapsed time
  → Shows next steps
  → 5-minute timeout warning
```

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| **Dry-run mode** | Preview all actions without executing |
| **Timeout tracking** | Warns if install exceeds 5 minutes |
| **Legacy migration** | Detects and migrates old configs |
| **Profile system** | Bob (beginner) vs Advanced (power user) |
| **TUI** | Uses @clack/prompts for interactive UI |

### 1.4 Brownfield/Greenfield Logic

```javascript
function detectBrownfield(projectRoot) {
  // Checks:
  // 1. .aios-core/ directory exists?
  // 2. core-config.yaml (legacy monolithic)?
  // 3. framework-config.yaml (layered)?
  // 4. Config resolver module available?
  
  // Result: { isBrownfield, hasLegacyConfig, hasLayeredConfig, configResolver }
}
```

**Brownfield path**: Detect existing install → offer migration if legacy → verify if current
**Greenfield path**: Create package.json → install aios-core → initialize

---

## 2. OMOC (Kord AIOS) Current Installer

### 2.1 Entry Point

```bash
bunx kord-aios install                    # TUI mode
bunx kord-aios install --no-tui --claude=yes --gemini=yes --copilot=no  # CLI mode
```

### 2.2 Installation Flow

```
Step 1: OpenCode Detection
  → Checks if OpenCode binary is installed
  → Shows version if found
  → Warns if not found (does NOT install)

Step 2: Update Detection
  → Reads existing opencode.json
  → Detects if plugin is already configured
  → Shows current config if updating

Step 3: Provider Wizard (7 questions)
  → Claude subscription? (no / yes / max20)
  → OpenAI/ChatGPT? (no / yes)
  → Gemini? (no / yes)
  → GitHub Copilot? (no / yes)
  → OpenCode Zen? (no / yes)
  → Z.ai Coding Plan? (no / yes)
  → Kimi For Coding? (no / yes)
  → Auto-detects existing values as defaults

Step 4: Plugin Registration
  → Adds kord-aios plugin to opencode.json

Step 5: Auth Plugins (if Gemini)
  → Adds antigravity auth plugin

Step 6: Provider Config
  → Writes provider configurations

Step 7: Kord AIOS Config
  → Writes kord-aios.config.jsonc

Step 8: Scaffolding
  → Creates .kord/ directory
  → Creates docs/kord/{plans,drafts,notepads}/
  → Creates templates (story.md, adr.md)
  → Creates kord-rules.md

Completion:
  → Shows config summary
  → Critical warning if no Claude
  → Auth reminder (opencode auth login)
  → "ultrawork" magic word tip
```

### 2.3 Key Features

| Feature | Description |
|---------|-------------|
| **Provider intelligence** | 7-provider wizard with auto-detection |
| **Dual mode** | TUI (interactive) and non-TUI (CLI args) |
| **Update detection** | Detects existing config, offers update |
| **Scaffolding** | Creates project directory structure |
| **Auth guidance** | Reminds about `opencode auth login` |
| **ChatGPT-only warning** | Shows critical warning without Claude |

---

## 3. Comparative Analysis

### 3.1 Feature Matrix

```
Feature                     Synkra AIOS    OMOC (Current)    Gap
──────────────────────────────────────────────────────────────────
OS detection                ✅             ❌                 Need
Dependency checking         ✅             ❌                 Need
Profile selection           ✅             ❌                 Consider
Provider wizard             ❌             ✅ (7 providers)   Keep
OpenCode detection          ❌             ✅ (detect only)   Enhance
OpenCode auto-install       ❌             ❌                 Need
Brownfield/greenfield       ✅             ❌                 Need
Legacy migration            ✅             ❌                 Need (for future)
Project scaffolding         ❌             ✅ (.kord/, docs/) Keep
Config writing              ❌             ✅                 Keep
Auth guidance               ❌             ✅                 Keep
Doctor integration          ✅             ❌ (exists unused) Integrate
Dry-run mode                ✅             ❌                 Need
Timeout tracking            ✅             ❌                 Nice to have
TUI mode                    ✅             ✅                 Keep
Non-TUI mode                ❌             ✅                 Keep
Update detection             ❌             ✅                 Keep
```

### 3.2 What Synkra Has That We Need

1. **OpenCode detection + auto-install**: If user doesn't have OpenCode, offer to install it. This is the #1 friction point for new users.

2. **Brownfield/greenfield detection**: Check if project already has `.kord/`, `opencode.json`, `docs/kord/`. Adapt flow accordingly:
   - **Greenfield**: Full fresh setup (scaffold + provider wizard + auth)
   - **Brownfield**: Update mode (preserve existing config, offer migration)

3. **Doctor integration**: After install, run diagnostics to verify:
   - OpenCode binary works
   - Plugin loads correctly
   - Config is valid
   - Providers are reachable (optional)

4. **Dry-run mode**: `--dry-run` flag that previews all actions without modifying anything. Essential for CI/CD and cautious users.

### 3.3 What Synkra Has That We DON'T Need

1. **Profile system (Bob/Advanced)**: OMOC's provider wizard already handles complexity. No need for separate profiles.

2. **OS-specific dependency checking**: OpenCode handles its own dependencies. We just need to detect if OpenCode is installed.

3. **npm package install**: We're a plugin, not an npm package. Our "install" is config writing, not package installation.

---

## 4. Proposed Kord AIOS Installer Flow

### 4.1 New Flow

```
Phase 0: Environment Check
  ├── Detect OS (for OpenCode install method)
  ├── Check if OpenCode is installed
  │   ├── YES → Show version, continue
  │   └── NO → Offer to install OpenCode
  │       ├── Auto-install (curl/brew/winget based on OS)
  │       └── Show manual instructions
  └── Check OpenCode version compatibility

Phase 1: Project Maturity Detection
  ├── Check for existing opencode.json
  ├── Check for existing .kord/ directory
  ├── Check for existing kord-aios.config.jsonc
  ├── Check for existing docs/kord/
  └── Classify:
      ├── FRESH → Full install
      ├── PARTIAL → Resume/repair install
      └── EXISTING → Update mode

Phase 2: Provider Configuration (existing wizard)
  ├── Claude subscription
  ├── OpenAI/ChatGPT
  ├── Gemini
  ├── GitHub Copilot
  ├── OpenCode Zen
  ├── Z.ai Coding Plan
  └── Kimi For Coding

Phase 3: Installation
  ├── Add plugin to opencode.json
  ├── Write provider configs
  ├── Write kord-aios.config.jsonc
  ├── Add auth plugins (if Gemini)
  └── Scaffold project (.kord/, docs/kord/, templates)

Phase 4: Post-Install Verification (Doctor)
  ├── Verify opencode.json is valid JSON
  ├── Verify plugin entry exists
  ├── Verify config file exists and is valid
  ├── Verify .kord/ directory was created
  ├── Verify OpenCode can load the plugin (optional)
  └── Show health summary

Phase 5: Completion
  ├── Config summary
  ├── Auth reminder
  ├── Next steps
  └── Magic word tip
```

### 4.2 OpenCode Auto-Install Strategy

```
Detect OS:
  macOS → brew install opencode (or curl)
  Linux → curl install script
  Windows → winget install opencode (or scoop)

Flow:
  1. Check: which opencode / where opencode
  2. If found: show version, skip
  3. If not found:
     a. "OpenCode is not installed. Install now?"
     b. Yes → detect OS → run install command → verify
     c. No → show manual instructions, continue anyway
```

### 4.3 Brownfield/Greenfield Logic

```typescript
interface ProjectMaturity {
  status: "fresh" | "partial" | "existing"
  hasOpenCodeJson: boolean
  hasKordPlugin: boolean    // plugin entry in opencode.json
  hasKordConfig: boolean    // kord-aios.config.jsonc exists
  hasKordDirectory: boolean // .kord/ exists
  hasDocsKord: boolean      // docs/kord/ exists
  hasKordRules: boolean     // kord-rules.md exists
  currentVersion: string | null
}
```

| Status | Condition | Action |
|--------|-----------|--------|
| **fresh** | No opencode.json OR no kord plugin | Full install |
| **partial** | Plugin exists but missing scaffold | Resume: scaffold only |
| **existing** | Everything present | Update: provider wizard with current values |

### 4.4 Doctor Integration

The doctor module already exists at `src/cli/doctor/` but is not integrated into the install flow. It should:

1. Run automatically after install
2. Verify all installation artifacts
3. Show clear pass/fail for each check
4. Provide fix suggestions for failures

---

## 5. Implementation Priority

### Must Have (EPIC scope)
1. **OpenCode detection + auto-install** — biggest UX improvement
2. **Brownfield/greenfield detection** — prevents corrupt re-installs
3. **Doctor integration** — catches issues immediately
4. **Dry-run mode** — essential for cautious users and CI

### Should Have (follow-up)
5. **Version migration** — when config format changes between versions
6. **Health check command** — standalone `bunx kord-aios doctor` command
7. **Uninstall command** — clean removal of all Kord artifacts

### Nice to Have (future)
8. **Plugin version pinning** — lock to specific plugin version
9. **Remote config** — import config from URL/gist
10. **Team sharing** — export/import config for team onboarding

---

## 6. Technical Considerations

### 6.1 OpenCode Install Methods by OS

| OS | Primary | Fallback |
|----|---------|----------|
| macOS | `brew install sst/tap/opencode` | `curl -fsSL https://opencode.ai/install.sh \| sh` |
| Linux | `curl -fsSL https://opencode.ai/install.sh \| sh` | Manual download |
| Windows | `winget install sst.opencode` | `scoop install opencode` |

These need to be verified against OpenCode's actual distribution. Check `https://opencode.ai/docs` for current install methods.

### 6.2 Config Detection Order

```
1. opencode.json (project root)
2. .opencode/config.json (alternative location)
3. ~/.config/opencode/config.json (user-level)
```

### 6.3 Backward Compatibility

The installer must handle:
- Projects with older kord-aios.config.jsonc format
- Projects with manual opencode.json edits
- Projects where only some artifacts exist

Strategy: **Never overwrite without asking.** Detect what exists, show what would change, ask for confirmation.

---

## 7. Conclusion

The Kord AIOS installer should evolve from a pure provider wizard to a full lifecycle manager:

1. **Before install**: Detect environment, install OpenCode if missing
2. **During install**: Detect project state, adapt flow, configure providers
3. **After install**: Verify health, guide authentication, show next steps

The core provider wizard (Phase 2) is excellent and should be preserved. The additions (Phases 0, 1, 4) wrap it with operational maturity borrowed from Synkra's battle-tested approach.

---

## 8. Deep Dive: OpenCode Plugin Installation Mechanism

> **Added**: 2026-02-12 (follow-up research)
> **Source**: https://opencode.ai/docs/plugins

### 8.1 How OpenCode Loads Plugins

OpenCode supports **two plugin installation methods**:

| Method | Location | Editable? | Scope |
|--------|----------|-----------|-------|
| **npm packages** | `~/.cache/opencode/node_modules/` | **No** (cached, immutable) | Global (per version) |
| **Local files** | `.opencode/plugins/` (project) or `~/.config/opencode/plugins/` (global) | **Yes** | Per-project or global |

**Load order** (all sources merged, hooks run in sequence):
1. Global config (`~/.config/opencode/opencode.json`) — npm plugins
2. Project config (`opencode.json`) — npm plugins
3. Global plugin directory (`~/.config/opencode/plugins/`)
4. Project plugin directory (`.opencode/plugins/`)

### 8.2 npm Plugin Installation (Current Kord AIOS Method)

When `opencode.json` contains `"plugin": ["kord-aios"]`:

```
OpenCode startup
  → Reads opencode.json
  → Finds "kord-aios" in plugin array
  → Runs `bun install kord-aios` internally
  → Caches to ~/.cache/opencode/node_modules/kord-aios/
  → Loads dist/index.js as plugin
```

**Key**: OpenCode uses its **own bundled Bun** for plugin installation. The user does NOT need Bun installed on their machine for this to work. Even if the user installed OpenCode via npm, OpenCode handles plugin management internally.

**The npm-installed plugin is NOT editable.** It lives in a global cache. All projects using the same plugin version share the same cached code.

### 8.3 Local Plugin Installation (Alternative)

For development/customization, users can copy plugin files to `.opencode/plugins/`:

```
.opencode/plugins/
  └── my-custom-plugin.ts    # Loaded directly at startup
```

Local plugins CAN use external packages if a `package.json` exists in the config directory. OpenCode runs `bun install` at startup to install dependencies.

### 8.4 What This Means for Kord AIOS

**The plugin code (agents, hooks, tools) is immutable once installed via npm.** But the plugin LOADS runtime content from project-level directories:

| Content Type | Location | Editable? | How Loaded |
|-------------|----------|-----------|------------|
| Plugin code | `~/.cache/opencode/node_modules/kord-aios/dist/` | No | By OpenCode at startup |
| Config | `kord-aios.config.jsonc` (project root) | **Yes** | By plugin at runtime |
| Squads | `.opencode/squads/` or `.kord/squads/` | **Yes** | By squad loader at runtime |
| Skills | `.kord/skills/` (future) | **Yes** | By skill loader at runtime |
| Plans | `docs/kord/plans/` | **Yes** | By plan agent at runtime |
| Templates | `.kord/templates/` | **Yes** | By template loader at runtime |
| Rules | `kord-rules.md` | **Yes** | By OpenCode instructions[] |

**Architecture**: Plugin = engine (immutable npm package) + content (editable project files)

This is analogous to:
- WordPress = engine (wp-content/) + themes/plugins (editable)
- Synkra AIOS = .aios-core/ (engine) + squads/ + tasks/ (editable)

### 8.5 Per-Project vs Global Installation

**Question**: Should we recommend per-project or global install?

**Answer**: **Both, with different purposes.**

| Aspect | npm Plugin (Global) | Project Content (Per-Project) |
|--------|-------------------|------------------------------|
| What | Plugin engine code | Squads, skills, config, plans |
| Where | `~/.cache/opencode/node_modules/` | `.kord/`, `.opencode/squads/`, `docs/kord/` |
| Install | `opencode.json` → `"plugin": ["kord-aios"]` | `bunx kord-aios install` (or `npx`) |
| Updates | OpenCode auto-updates on startup | User manages |
| Editable | No | Yes |
| Shared | All projects share same version | Each project has own content |

**The installer flow should be:**
1. **Plugin registration** (once per project): Add `"kord-aios"` to `opencode.json` plugin array → OpenCode handles npm install automatically
2. **Project initialization** (once per project): Run CLI to create `.kord/`, `docs/kord/`, `kord-aios.config.jsonc`, `kord-rules.md`
3. **Content customization** (ongoing): User creates squads, skills, plans in project directories

**The plugin itself does NOT need to be in `.opencode/plugins/`.** That's only for development. For end users, npm plugin registration is sufficient and OpenCode handles the rest.

### 8.6 Can the Plugin Be Edited?

**Short answer**: The compiled plugin code — **no**. The runtime content it loads — **yes**.

If a user wants to customize plugin behavior beyond config:
1. **Skills/squads**: Create custom skills in `.kord/skills/`, custom squads in `.opencode/squads/` — the plugin loads these at runtime
2. **Rules**: Edit `kord-rules.md` — loaded by OpenCode instructions system
3. **Config**: Edit `kord-aios.config.jsonc` — parsed by plugin at startup
4. **Fork**: For deep changes, fork the repo and use local plugin mode (`.opencode/plugins/`)

---

## 9. Deep Dive: Bun vs npm Compatibility

> **Added**: 2026-02-12 (follow-up research)

### 9.1 The Problem

OMOC development uses Bun exclusively (`bun run`, `bun build`, `bun test`). The CLI installer is invoked via `bunx kord-aios install`. But:

1. **OpenCode can be installed via npm** — user may not have Bun installed
2. **Bun on Windows has known stability issues** — some users can't use Bun reliably
3. **The build uses `--target bun`** — CLI output may be Bun-specific

### 9.2 Current Architecture Analysis

**Build command** (from `package.json`):
```bash
bun build src/cli/index.ts --outdir dist/cli --target bun --format esm --external @ast-grep/napi
```

**`--target bun`** means the output uses Bun-specific APIs and runtime. This is fine for:
- The **plugin** (loaded by OpenCode which uses Bun internally)
- The **precompiled binaries** (self-contained, don't need Bun at runtime)

**CLI entry point** (`bin/kord-aios.js`):
```javascript
#!/usr/bin/env node  // ← Uses Node.js!
// Detects platform → spawns precompiled binary
```

The bin wrapper uses **Node.js** (`#!/usr/bin/env node`) and spawns a **precompiled platform binary** (e.g., `kord-aios-windows-x64`). These binaries are self-contained Bun executables — they don't need Bun installed.

### 9.3 Does `npx kord-aios install` Work?

**It should work.** The flow is:

```
npx kord-aios install
  → npm downloads kord-aios package
  → Runs bin/kord-aios.js (Node.js shebang)
  → Detects platform (windows-x64)
  → Spawns kord-aios-windows-x64 binary (self-contained)
  → Binary runs the CLI install command
```

The precompiled binary is a standalone Bun executable — it includes the Bun runtime. The user does NOT need Bun installed.

### 9.4 Potential Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **Binary not found** | High | If the optional platform package wasn't installed (npm can skip optionalDependencies) |
| **Binary permissions** | Medium | On Unix, binary may need `chmod +x` |
| **postinstall script** | Low | `postinstall.mjs` uses `node` — should be fine |
| **Windows path issues** | Low | `spawnSync` on Windows may need `.exe` extension handling |

### 9.5 Recommendations

1. **Document both `npx` and `bunx`**: The CLI should work with both. Update README and install instructions to show `npx kord-aios install` as the primary method (more universal), with `bunx` as alternative.

2. **Test `npx` on Windows**: Verify that `npx kord-aios install` works end-to-end on Windows where Bun is unreliable. The precompiled binary approach should bypass Bun issues.

3. **Keep `--target bun` for builds**: The plugin runs inside OpenCode (which uses Bun). The CLI runs via precompiled binary. No need to change build target.

4. **Fallback for missing binary**: If the platform binary isn't available, consider a fallback that uses Node.js directly (would require a `--target node` build variant). This is a nice-to-have, not critical.

5. **Development vs Distribution**:
   - **Development**: Bun required (build, test, dev scripts) — this is fine
   - **Distribution**: npm package with precompiled binaries — works with both npx and bunx
   - **Plugin loading**: OpenCode uses its own Bun — transparent to user

### 9.6 Conclusion on Bun/npm Conflict

**There is no fundamental conflict.** The architecture already handles this correctly:

- Plugin code → loaded by OpenCode (which uses Bun internally)
- CLI binary → precompiled, self-contained (no Bun needed at runtime)
- CLI wrapper → `#!/usr/bin/env node` (works with npx)

The main action item is to **document and test `npx kord-aios install`** as a first-class install method, especially for Windows users where Bun is unreliable. If testing reveals issues with the precompiled binary on Windows, a `--target node` build variant for the CLI should be considered.
