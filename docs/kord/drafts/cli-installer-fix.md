# Draft: CLI Installer Critical Fixes

## Reported Issues (Windows Install)

### Issue 1: Scattered config directories
- `~/.config/opencode`, `~/.opencode`, `~/.kord` all created at user home level
- Expected: organized, not scattered

### Issue 2: opencode.json not generated
- OpenCode's own config was not created
- This means the plugin can't be registered

### Issue 3: .kord/ directory issues
- Only `templates/` has content (ADR and Story .md files)
- All other subdirectories empty
- `skill/` folder created inside `.kord/` (shouldn't be there)

### Issue 4: kord-aios.json missing fallbacks
- Models configured without fallback chains
- User says this is expected for now (not yet configured)

### Issue 5: Plugin not registered
- Because opencode.json wasn't generated
- Plugin never added to OpenCode config

### Issue 6: Google Auth / Antigravity
- `opencode auth login` didn't install Antigravity plugin
- Possibly an OpenCode-side issue, not kord-aios

## Key Questions
- Was the previous installer refactor (commits a688036a-9e874d64) included in the published npm release?
- Or was it only on local dev branch and never published?
- Is this a npm package version issue (user installed old version)?

## Research Findings

### ROOT CAUSE: Release Desatualizada (CONFIRMED)
- npm published version = 1.0.0
- local dev version = 1.0.0 (same semver but different code!)
- Installer refactor commits (a688036a-9e874d64) ARE in `dev` branch
- But the publish workflow goes `dev → main → npm`
- **If `main` hasn't been updated since the refactor, the npm package has OLD installer code**
- This explains why the user's `bunx kord-aios@latest install` didn't behave as expected

### Issue-by-Issue Analysis

**Issue 1 (Scattered dirs)**: 
- `~/.config/opencode` = correct (OpenCode global config)
- `~/.opencode` = likely OpenCode runtime data (not kord-aios)
- `~/.kord` = BUG! `.kord/` should only be at PROJECT level. If user ran installer from home dir, `process.cwd()` = home → creates `~/.kord/`
- The installer should either: (a) detect project root, or (b) require running from project dir

**Issue 2 (opencode.json not generated)**:
- Windows path conflict: kord-aios looks at `%APPDATA%\opencode\` on Windows
- BUT OpenCode itself may create config at `~/.config/opencode/`
- The `detectConfigFormat()` could fail to find the right path
- Also: `ensureConfigDir()` might silently fail on Windows permissions

**Issue 3 (.kord/ directory issues)**:
- `createKordDirectory()` creates ALL KORD_INPUT_SUBDIRS including `skills/`
- KORD_INPUT_SUBDIRS = ["scripts", "templates", "checklists", "skills", "squads"]
- User correctly notes: most of these are empty and confusing
- `skills/` inside `.kord/` is arguable - user says it shouldn't be there

**Issue 5 (Plugin not registered)**:
- Downstream of Issue 2 - if opencode.json can't be found/created, plugin can't register
- Windows path resolution is the likely culprit

**Issue 6 (Google Auth / Antigravity)**:
- Needs investigation - may be OpenCode-side or may need installer integration

### Key Code Locations
- `src/cli/install.ts` (774 lines) - main installer flow
- `src/cli/config-manager.ts` (868 lines) - config writing, addPluginToKordAiosConfig
- `src/cli/kord-directory.ts` (44 lines) - creates .kord/ subdirs
- `src/cli/scaffolder.ts` (99 lines) - docs/kord/ and templates
- `src/cli/project-layout.ts` (116 lines) - defines KORD_INPUT/OUTPUT_SUBDIRS
- `src/shared/opencode-config-dir.ts` - Windows path resolution
- `src/cli/doctor/` - verification checks
- `src/cli/model-fallback.ts` (240 lines) - model fallback generation

## User Clarifications (Round 2)

### Install location
- User ran `bunx kord-aios install` from CMD (not from a project dir)
- User agrees: .kord/ should only install at project level
- Global config should go to .config/opencode
- Need to separate: global install (config + plugin) vs project init (.kord + docs/kord)

### .kord/ structure
- User clarifies: scripts, templates, checklists, squads ARE part of the framework
- These are override points for users (like ADR templates, story templates, checklists)
- Skills might NOT belong in .kord/
- User asks: could all of this live inside .opencode/ as a unified structure?
- NEED TO CHECK: how synkra-aios structures this → agent launched

### Install flow
- User says: don't reinvent — look at how oh-my-opencode (omoc) handles this
- NEED TO RESEARCH: omoc installer patterns → agent launched

### Auth handling
- NEW BUG: installer SKIPPED auth steps and marked as OK with no providers!
- User says: look at how omoc handles auth
- NEED TO INVESTIGATE: why auth was skipped → agent launched

### Content pack / extract
- User expected `init` to export agents, skills, etc. into .opencode/
- Currently `init` only creates empty dirs + templates
- The `extract` command exists (`bunx kord-aios extract`) but it's separate
- Need to clarify: should `init` auto-extract? Or keep it manual?

### Antigravity
- User says: omoc handles this, follow their pattern

## Research Findings (Round 2)

### Auth Skip Bug — ROOT CAUSE FOUND
**File**: `src/cli/config-manager.ts` lines 800-836
- `detectProvidersFromKordAiosConfig()` returns `hasOpenAI: true, hasOpencodeZen: true` when NO config exists!
- Same false positives when config is invalid or throws error
- `detectCurrentConfig()` defaults also wrong: `hasClaude: true, hasOpenAI: true` etc.
- Fix: all defaults should be `false` — absence of config = no providers configured

### oh-my-opencode (omoc) Patterns — REFERENCE IMPLEMENTATION
- kord-aios is clearly a fork/evolution of omoc (shared codebase structure)
- omoc handles first-time install correctly: creates opencode.json with plugin entry
- omoc uses `@clack/prompts` for TUI (same as kord-aios)
- omoc handles Antigravity: adds `opencode-antigravity-auth` plugin + configures google provider
- omoc defers OAuth to `opencode auth login` (tells user to run it after install)
- omoc Windows paths: checks `~/.config/opencode` first, then `%APPDATA%/opencode`

### synkra-aios Structure — DIFFERENT ARCHITECTURE
- Uses `.aios-core/` pattern, NOT `.kord/` or `.opencode/`
- Not directly applicable to current kord-aios architecture
- Content pack = copy entire `.aios-core/` directory to project
- Squads at root level, agents as .md files in `.aios-core/development/agents/`

## Architecture Decision: Global vs Project Layering

### Global (~/.config/opencode/)
- `opencode.json` — plugin registration + provider config
- `kord-aios.json` — model config, agent model mappings
- `agents/*.md` — extracted builtin agents (loaded by OpenCode)

### Project Level
- `.kord/` — framework templates, checklists (read by agents)
- `.kord/squads/` — project-specific squad overrides
- `.opencode/kord-aios.json` — project-level config override
- `docs/kord/` — plans, drafts, notepads (agent output)
- `kord-rules.md` — project rules

### Command Separation
- `install` = GLOBAL: plugin registration, provider setup, model config, auth plugins
- `init` = PROJECT: .kord/, docs/kord/, .opencode/, exports content (agents if needed, squads)

## All Identified Bugs

| # | Bug | File | Severity |
|---|-----|------|----------|
| 1 | Provider detection returns true when no config exists | config-manager.ts:800-836 | CRITICAL |
| 2 | .kord/ created at cwd (could be home dir) during install | install.ts:525 | HIGH |
| 3 | opencode.json path mismatch on Windows | opencode-config-dir.ts | HIGH |
| 4 | Auth steps skipped with no providers configured | install.ts:407-429 | CRITICAL |
| 5 | Empty subdirs created in .kord/ confusing users | kord-directory.ts:23-28 | MEDIUM |
| 6 | init doesn't export content (agents, skills) | init/index.ts | MEDIUM |
| 7 | Antigravity plugin not installed for Google auth | config-manager.ts | MEDIUM |
| 8 | install command doesn't separate global from project | install.ts | HIGH |
