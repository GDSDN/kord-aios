# installer-optimization — learnings

## 2026-02-28T15:47:54Z Session: ses_35b53de03ffewzR9SogyZGRqRg
- (start) Notepad initialized.

## 2026-02-28T16:30:00Z Refactoring writeKordAiosConfig()
### Implementation Details
- Created `addOnlyMerge()` helper function in `src/cli/config-manager.ts`
- Uses object-recursive approach: primitives and arrays preserved from existing; objects recursively merged
- Key insight: for nested objects, NEW keys from newConfig are ADDED while existing keys are PRESERVED (not overwritten)
- This differs from deepMerge which overwrites all source values

### Behavior Summary
- Primitives: existing wins (never overwritten)
- Arrays: existing wins (never replaced)
- Objects: recursively merged - existing takes precedence for overlapping keys, but new keys from newConfig are added

### Test Coverage Added
- Preserves existing primitive values
- Does NOT replace arrays (existing array wins)
- Adds missing keys from new config
- Recursively merges nested objects correctly
- Handles null values properly
- Provider block add-only behavior verified

## 2026-02-28T18:30:00Z Task 2: Provider Detection Refactoring
### Implementation Details
- Added `--reconfigure` CLI flag to force full reconfiguration
- Refactored `runTuiMode()` to accept `reconfigure` parameter and skip questions for already-configured providers
- Created `providerArgsToConfig()` helper for converting partial provider args to InstallConfig
- Added logic in `runNonTuiInstall()` to detect existing config and reuse when no explicit flags provided

### Behavior Summary
- TUI mode (runTuiMode):
  - If `--reconfigure` is true: ask all provider questions (existing behavior)
  - If `--reconfigure` is false: skip questions where provider is already configured
  - Shows info message "(already configured, skipping)" for skipped providers
  - Combines detected + newly answered into final InstallConfig

- Non-TUI mode (runNonTuiInstall):
  - If any provider flag is explicitly provided: use those values (existing behavior)
  - If no flags provided AND global config exists AND --reconfigure is false: reuse existing config
  - If --reconfigure is true OR no existing config: validate and require all flags (existing behavior)

### Key Insight
- Provider detection uses `detectCurrentConfig()` from config-manager.ts as source of truth
- Not modifying detectCurrentConfig() - treating it as stable API
- Separate `ProviderArgs` interface created to avoid type issues with partial InstallArgs

### Test Coverage Added
- Reuses existing config when no explicit flags and config exists
- Still validates when explicit flags are provided
- --reconfigure forces full validation even with existing config

## 2026-02-28T18:45:00Z Task 4: writeProjectKordAiosConfig()
### Implementation Details
- Created `writeProjectKordAiosConfig(projectDir: string, globalConfigPath?: string)` function in `src/cli/config-manager.ts`
- Creates `.opencode/` directory under project if missing
- Writes/copies global `kord-aios.json` to `<projectDir>/.opencode/kord-aios.json`
- Uses add-only merge when project config exists (existing project values win)
- If global config missing, writes minimal project config containing `$schema` only
- Returns `ConfigMergeResult` with `configPath` pointing to the project file

### Behavior Summary
- Creates project config from global: copies global config to project .opencode directory
- Preserves existing project overrides: uses addOnlyMerge (existing wins)
- Handles missing global config: writes minimal $schema config

### Test Coverage Added
- Creates project config from global
- Preserves existing project overrides
- Handles missing global config (writes minimal $schema)
- Creates .opencode directory if missing

## 2026-02-28T18:55:00Z Task 3: Install Pipeline Project Config Write
### Implementation Details
- Added `writeProjectKordAiosConfig(process.cwd())` immediately after successful `writeKordAiosConfig(config)` in both install flows:
  - Non-TUI shared pipeline: `runNonTuiInstallWithArgs()` in `src/cli/install.ts`
  - TUI flow in `install()` in `src/cli/install.ts`
- Added matching project-config write in `phaseInstallation()` in `src/cli/install-phases.ts` to keep phase pipeline behavior consistent

### Behavior Summary
- Installer now writes project-level config to `<project>/.opencode/kord-aios.json` during install/update
- Project config write failures are treated as warnings (install continues)
- Success and warning messages include the project config path for visibility

## 2026-02-28T19:00:00Z Task 5: kord-aios init CLI command
### Implementation Details
- Created `src/cli/init/index.ts` with init command module
- Added `--directory` and `--force` options to the command
- Init steps execute in order:
  1. `createKordDirectory(cwd)` - creates .kord/ with subdirectories
  2. `scaffoldProject({ directory: cwd, force })` - scaffolds docs/kord/ and templates
  3. `writeProjectKordAiosConfig(cwd)` - writes project .opencode/kord-aios.json
- Output shows created/skipped counts for user feedback

### Behavior Summary
- Creates project directory structure without touching global config
- --force flag only affects scaffolded files (templates, kord-rules.md), NOT directories
- Safe for repeated use - will skip existing files without --force
- Does NOT call addPluginToKordAiosConfig() or writeKordAiosConfig() (no global modifications)
- Does NOT run post-install doctor checks
- Does NOT prompt provider questions

### Test Coverage Added
- Creates .kord/ directory structure with all subdirectories
- Creates docs/kord/ subdirectories (plans, drafts, notepads)
- Creates template files (story.md, adr.md)
- Creates kord-rules.md at project root
- Writes project config .opencode/kord-aios.json
- Does NOT modify global config (verified via OPENCODE_CONFIG_DIR temp dir)
- --force overwrites existing scaffolded files
- Without --force, skips existing files
- Reports created/skipped counts in output
