# Learnings

## Task 2: Fix Windows path resolution for opencode.json

### Issue
On Windows, the CLI installer was checking `%APPDATA%/opencode` FIRST before checking `~/.config/opencode`. However, OpenCode (the underlying engine) uses `~/.config/opencode` as its primary config location on all platforms, including Windows.

### Root Cause
The `getCliConfigDir` function in `src/shared/opencode-config-dir.ts` had the priority order reversed:
- **Before (wrong)**: Check appdata first, then cross-platform
- **After (correct)**: Check cross-platform first (~/.config/opencode), then appdata

### Fix Applied
Modified `getCliConfigDir` in `src/shared/opencode-config-dir.ts`:
1. Reordered the checks so `~/.config/opencode` is checked FIRST
2. Falls back to `%APPDATA%/opencode` if cross-platform path doesn't exist
3. Default remains `%APPDATA%/opencode` if neither exists

### Files Changed
- `src/shared/opencode-config-dir.ts` - Fixed Windows path resolution priority
- `src/shared/opencode-config-dir.test.ts` - Added tests for Windows path resolution

### Verification
- All 25 tests pass
- Type check passes
- Commit: `85f32611` - fix(cli): align Windows path resolution with OpenCode config location

---

## Task: Fix provider detection false positives

### Issue
The CLI installer was incorrectly detecting providers as "installed" when no config file existed or when the config was invalid. This caused false positives during fresh system installations.

### Root Cause
Two functions in `src/cli/config-manager.ts` had incorrect default values:

1. **`detectProvidersFromKordAiosConfig()`** - When config file didn't exist or was invalid, it returned:
   - `hasOpenAI: true` (WRONG - should be `false`)
   - `hasOpencodeZen: true` (WRONG - should be `false`)

2. **`detectCurrentConfig()`** - Default values were set to `true` for installed providers even when no config existed:
   - `hasClaude: true` (WRONG - should be `false`)
   - `isMax20: true` (WRONG - should be `false`)
   - `hasOpenAI: true` (WRONG - should be `false`)
   - `hasOpencodeZen: true` (WRONG - should be `false`)

### Fix Applied
Modified `src/cli/config-manager.ts`:

1. Lines 803, 810, 821: Changed `detectProvidersFromKordAiosConfig()` to return all `false` when:
   - Config file doesn't exist
   - Config is invalid/unparseable
   - Error occurs during parsing

2. Lines 828-835: Changed `detectCurrentConfig()` defaults to all `false`:
   - `hasClaude: false`
   - `isMax20: false`
   - `hasOpenAI: false`
   - `hasOpencodeZen: false`
   - `hasZaiCodingPlan: false`
   - `hasKimiForCoding: false`

### Files Changed
- `src/cli/config-manager.ts` - Fixed default values to return `false` when no config exists
- `src/cli/config-manager.test.ts` - Added tests for provider detection defaults

### Tests Added
- `detectProvidersFromKordAiosConfig`:
  - Returns ALL `false` when no config file exists
  - Returns ALL `false` when config is invalid/unparseable
- `detectCurrentConfig`:
  - Defaults to ALL `false` for provider flags when not installed

### Verification
- All 35 config-manager tests pass
- All 9 install tests pass
- Type check passes
- Commit: `3be6a7ef` - fix(cli): provider detection defaults to false when no config exists

---

## Task 4: Fix .kord/ directory structure (only create active subdirs)

### Issue
The CLI installer was creating all 5 subdirectories under `.kord/`:
- scripts
- templates
- checklists
- skills
- squads

However, only `templates/` and `squads/` have actual content/templates. The other 3 directories (scripts, checklists, skills) are reserved for future use but should NOT be created automatically.

### Root Cause
`createKordDirectory()` in `src/cli/kord-directory.ts` was iterating over `KORD_INPUT_SUBDIRS` which contained all 5 subdirectories.

### Fix Applied
1. **project-layout.ts**: Split `KORD_INPUT_SUBDIRS` into:
   - `KORD_ACTIVE_SUBDIRS` = ["templates", "squads"] - actually created
   - `KORD_RESERVED_SUBDIRS` = ["scripts", "checklists", "skills"] - documented but NOT created

2. **kord-directory.ts**: Changed iteration to use `KORD_ACTIVE_SUBDIRS` instead of `KORD_INPUT_SUBDIRS`

3. **kord-directory.test.ts**: Rewrote tests to verify:
   - Creates `.kord/templates/`
   - Creates `.kord/squads/`
   - Does NOT create `.kord/scripts/`
   - Does NOT create `.kord/checklists/`
   - Does NOT create `.kord/skills/`
   - Is idempotent (running twice succeeds)

### Files Changed
- `src/cli/project-layout.ts` - Added KORD_ACTIVE_SUBDIRS and KORD_RESERVED_SUBDIRS constants
- `src/cli/kord-directory.ts` - Changed to iterate KORD_ACTIVE_SUBDIRS
- `src/cli/kord-directory.test.ts` - Updated tests for new behavior

### Verification
- All 10 tests pass
- Type check passes
- Commit: `35ce2a55` - fix(cli): only create .kord/ subdirs that have content (templates, squads)

---

## Task 3: Separate install command to global-only

### Issue
The `install` command was doing too much - it was handling both global config AND project scaffolding:
- Writing global `kord-aios.json` (CORRECT - should keep)
- Writing project-level `.opencode/kord-aios.json` (SHOULD BE REMOVED)
- Creating `.kord/` directory structure (SHOULD BE REMOVED - moved to `init`)
- Scaffolding project baseline files (SHOULD BE REMOVED - moved to `init`)

The `init` command should handle project setup, while `install` should only handle global configuration.

### Root Cause
The `install` command was not following the separation of concerns:
- **Global install**: Plugin registration in OpenCode + global `kord-aios.json`
- **Project init**: Creating `.kord/`, scaffolding templates/docs, writing project config

### Fix Applied
Modified `src/cli/install.ts`:

1. **Removed from install** (both TUI and non-TUI paths):
   - `writeProjectKordAiosConfig(process.cwd())` - No longer writes project-level config
   - `createKordDirectory(process.cwd())` - No longer creates .kord/ directory
   - `scaffoldProject({ directory: process.cwd() })` - No longer scaffolds project files

2. **Added guidance message**:
   - Shows "To set up a project with Kord AIOS: bunx kord-aios init" after successful install
   - Both TUI and non-TUI modes display this guidance

3. **Removed unused imports**:
   - `writeProjectKordAiosConfig` from config-manager
   - `createKordDirectory` from kord-directory
   - `scaffoldProject` from scaffolder
   - `detectOS`, `getManualInstallInstructions` from opencode-installer
   - `shouldShowChatGPTOnlyWarning` from model-fallback

4. **Updated totalSteps**: Reduced from 7 to 4 in non-TUI mode since project scaffolding steps were removed

### Files Changed
- `src/cli/install.ts` - Removed project scaffolding, added guidance message
- `src/cli/install.test.ts` - Added tests for global-only behavior, removed old project scaffolding tests

### Tests Added
- `install should NOT call createKordDirectory()` - Verifies .kord/ not created
- `install should NOT call scaffoldProject()` - Verifies templates/docs not scaffolded
- `install should NOT call writeProjectKordAiosConfig()` - Verifies project config not written
- `install SHOULD call addPluginToKordAiosConfig()` - Verifies plugin registered globally
- `install SHOULD write global kord-aios.json` - Verifies global config written
- `install should show guidance message to run init` - Verifies message displayed
- `fresh install (no config) should prompt all providers` - Verifies fresh install behavior

### Verification
- All 13 tests pass
- Type check passes
- Commit: `0027c4a3` - refactor(cli): separate install to global-only, remove project scaffolding

---

## Task 6: Add Antigravity plugin support for Google/Gemini auth

### Issue
The CLI installer needed to add Antigravity plugin support when users select Gemini as a provider. This includes:
- Adding `opencode-antigravity-auth` plugin to `opencode.json`
- Adding Google provider configuration to `opencode.json`

### Investigation
Upon reviewing the existing code, the functionality was **already implemented** in `src/cli/config-manager.ts`:

1. **`addAuthPlugins(config)` function** (lines 529-605):
   - Adds `opencode-antigravity-auth` plugin when `config.hasGemini` is true
   - Fetches latest version from npm (or falls back to unversioned)
   - Handles legacy plugin migration (`kord-aios-antigravity-auth` → `opencode-antigravity-auth`)
   - Prevents duplicate entries

2. **`addProviderConfig(config)` function** (lines 730-798):
   - Adds Google provider configuration when `config.hasGemini` is true
   - Uses `ANTIGRAVITY_PROVIDER_CONFIG.google` for model definitions
   - Respects add-only merge (existing values take precedence)

3. **Called from install.ts** (lines 485-503, 633-651):
   - Both TUI and non-TUI modes call these functions when `config.hasGemini` is true

### Tests Added
Added comprehensive tests to `src/cli/config-manager.test.ts`:

1. **addAuthPlugins tests**:
   - Adds `opencode-antigravity-auth` plugin when hasGemini is true
   - Does NOT add antigravity plugin when hasGemini is false
   - Does NOT duplicate existing antigravity entry
   - Migrates legacy `kord-aios-antigravity-auth` to canonical name

2. **addProviderConfig tests**:
   - Adds google provider config when hasGemini is true
   - Does NOT add google provider when hasGemini is false
   - Preserves existing google provider config (add-only merge)

### Files Changed
- `src/cli/config-manager.test.ts` - Added tests for addAuthPlugins and addProviderConfig

### Verification
- All 42 tests pass
- Type check passes

### Key Implementation Details
- Version fetching: Uses `fetchNpmDistTags()` to get latest `opencode-antigravity-auth` version
- Legacy migration: Automatically converts old `kord-aios-antigravity-auth` to new canonical name
- Duplicate prevention: Checks if plugin already exists before adding
- Add-only merge: Existing config values take precedence when merging provider configurations

---

## Task 5: Enhance init command with content export

### Issue
The `init` command needed to export the builtin code squad to the project's `.kord/squads/` directory, enabling users to customize the squad configuration. Additionally, it needed to ensure idempotent behavior (running twice should succeed).

### Changes Applied
1. **Enhanced init command** (`src/cli/init/index.ts`):
   - Added `exportCodeSquad()` function that copies SQUAD.yaml from `src/features/builtin-squads/code/` to `.kord/squads/code/`
   - Integrated squad export into the init flow (Step 3)
   - Added summary output showing squad export status
   - Ensured idempotent behavior (skips if already exists, overwrites with --force)

2. **Updated InitResult interface**:
   - Added `squadExport` field with success, exported, and error properties

3. **Added tests** (`src/cli/init/index.test.ts`):
   - `exports code squad to .kord/squads/code/` - Verifies SQUAD.yaml is created with correct content
   - `init is idempotent - running twice succeeds` - Verifies second run succeeds without errors
   - `init with force re-exports squad` - Verifies --force flag overwrites existing squad

4. **Fixed existing test**:
   - Corrected test that expected `.kord/scripts`, `.kord/checklists`, `.kord/skills` to exist (they don't - only templates and squads are created)

### Files Changed
- `src/cli/init/index.ts` - Added squad export functionality
- `src/cli/init/index.test.ts` - Added tests for squad export and idempotency

### Verification
- All 14 init tests pass
- Type check passes
- Commit: `ba9a484d` - feat(cli): enhance init with content export and complete project scaffolding

### Key Implementation Details
- Uses `cpSync()` with `force: true` to handle overwrites when --force is used
- Checks `existsSync()` before copying for idempotent behavior
- Creates `.kord/squads/code/` directory if it doesn't exist
- Returns detailed success/exported/error status for each operation

---

## Task 7: Add doctor check for project structure (init verification)

### Issue
Doctor should warn users when project structure is missing (`.kord/` or `docs/kord/`), with a hint to run `bunx kord-aios init`. This helps users who haven't run init yet understand what to do.

### Changes Applied
1. **Created new check file** (`src/cli/doctor/checks/project-structure.ts`):
   - `checkProjectStructure()` function that checks for `.kord/` and `docs/kord/` directories
   - Returns `status: "warn"` (not fail) when directories are missing
   - Message: "Project not initialized — run `bunx kord-aios init` to set up your project"
   - Details list which directories are missing

2. **Added tests** (`src/cli/doctor/checks/project-structure.test.ts`):
   - Passes when both `.kord/` and `docs/kord/` exist
   - Warns when `.kord/` is missing
   - Warns when `docs/kord/` is missing
   - Warns when both are missing
   - Verifies suggestion includes "bunx kord-aios init"

3. **Registered check**:
   - Added `PROJECT_STRUCTURE` check ID and name to `constants.ts`
   - Added export and registration in `checks/index.ts`

### Files Changed
- `src/cli/doctor/checks/project-structure.ts` - New check implementation
- `src/cli/doctor/checks/project-structure.test.ts` - New test file
- `src/cli/doctor/constants.ts` - Added PROJECT_STRUCTURE constant
- `src/cli/doctor/checks/index.ts` - Registered new check

### Verification
- All 136 doctor tests pass
- Type check passes
- Commit: `54a842d7` - feat(cli): add doctor check for project structure (init verification)

### Key Implementation Details
- Uses `KORD_DIR` and `KORD_DOCS_DIR` constants from `project-layout.ts` (no hardcoded paths)
- Returns `warn` status (not `fail`) since user may not have run init yet
- Category: "installation" - fits with other setup checks
