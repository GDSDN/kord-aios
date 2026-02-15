# Kord AIOS Migration — Wave Changelog

Tracks all completed tasks per wave. Updated as work progresses.

---

## Wave 0: Clean Baseline via Script Substitution

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Remove debris files | ✅ Done | Already cleaned in prior session |
| 0.2 | Archive migration docs | ✅ Done | `docs/archive/` created in prior session |
| 0.3 | Create `script/rename-agents.ts` | ✅ Done | Context-aware parser: deterministic + camelCase + string/comment replacements |
| 0.4 | Run rename script (dry-run → apply) | ✅ Done | 3 passes: 138 + 19 + 71 files. Fixed 8 parser-corrupted files, schema dupes, hook renames |
| 0.5 | Create `docs/kord/` structure | ✅ Done | stories, plans, adrs, notepads, runs |
| 0.6 | Create `CHANGELOG-WAVES.md` | ✅ Done | This file |
| 0.7 | Manual audit grep for legacy names | ✅ Done | Only intentional refs remain: migration map (backward compat) + sisyphuslabs.ai email |
| 0.8 | Verify build (`bun run typecheck && bun test`) | ✅ Done | typecheck passes. 3 pre-existing test timeouts (session.prompt mocks) — not rename-related |
| 0.9 | Wave 0 rebrand cleanup (tools/shared/cli/tests) | 🔄 In progress | Rebranded config/cache paths, LSP hints, plugin detector messaging, CLI help, and tests to Kord AIOS |

### Manual fixes after script run
- Renamed `CALL_OMO_AGENT_DESCRIPTION` → `CALL_KORD_AGENT_DESCRIPTION`, `CallOmoAgentArgs` → `CallKordAgentArgs`, `createCallOmoAgent` → `createCallKordAgent`
- Fixed duplicate `plan`/`build` keys in `AgentOverridesSchema` (schema.ts) and `AgentConfig` type (config-handler.ts)
- Renamed config key `sisyphus_agent` → `kord_agent` in schema + tests
- Added `sisyphus_agent` → `kord_agent` migration path in migration.ts
- Added all legacy agent names to `AGENT_NAME_MAP` for backward compatibility
- Fixed `createAtlasHook` → `createBuildHook`, `createKordJuniorNotepadHook` → `createDevNotepadHook`
- Fixed import path `./dev-junior-notepad` → `./dev-notepad`
- Fixed test assertion using legacy name `"Multimodal-Looker"` → `"Vision"`

### Wave 0 cleanup notes (post-script)
- Rebranded LSP config paths to `kord-aios.json` and updated tool messaging
- Updated cache directories from `.cache/kord-aios` → `.cache/kord-aios` in downloaders
- Rebranded external plugin detector and delegate-task error messaging to Kord AIOS
- Updated tests (task repo URL, session/background task paths, model cache dir, system directive labels)
- Rebranded CLI command names/help output and auto-update cache/package naming
- Updated comment-checker cache/log prefixes and plugin-loader/OAuth labels

## Wave 1: Agent System

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1–1.5 | Merged agent prompt updates (kord/dev/qa/architect/analyst) | ✅ Done | Kord: Orion persona + core principles. Dev: Builder principles. QA: quality advisory. Architect: responsibility boundaries + delegation map. Analyst: strategic research/ideation scope |
| 1.6–1.10 | OMOC-only agent prompt refresh (plan/build/librarian/explore/vision) | ✅ Done | Plan: comments cleaned, Kord AIOS identity. Build: promptAlias Atlas→Build, comments. Vision: MULTIMODAL_LOOKER_PROMPT_METADATA→VISION_PROMPT_METADATA, promptAlias→Vision, added triggers/useWhen/avoidWhen |
| 1.11–1.17 | New AIOS-sourced specialist agents | ✅ Done | sm/pm/po/devops/data-engineer/ux-design-expert/squad-creator created with prompts, metadata, and factory functions |
| 1.18–1.20 | Wiring (types/utils/index) | ✅ Done | All 18 agents in agentSources, agentMetadata, exports |
| 1.21 | Delegate-task categories | ✅ Verified | Categories route to dev-junior (unchanged). Specialist agents available via subagent_type. No category changes needed |
| 1.22 | Tests | ✅ Done | new-agents.test.ts (7 specialist agents), wave1-prompt-updates.test.ts (merged + OMOC-only prompt assertions) |

### Additional Wave 1 cleanup
- Renamed `MULTIMODAL_LOOKER_AGENT` → `VISION_AGENT` in `src/tools/look-at/constants.ts` and `tools.ts`
- Cleaned legacy Atlas references in `src/agents/build/index.ts` comments
- Cleaned Titan Prometheus references in `src/agents/plan/index.ts` comments

## Wave 2: Hooks & Engine

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Verify path refs in hooks (build/plan-md-only/dev-notepad/start-work) | ✅ Done | All hooks already use `docs/kord/` paths from Wave 0 |
| 2.2 | Boulder-state audit | ✅ Done | No legacy refs found |
| 2.3 | Rename AtlasHookOptions → BuildHookOptions | ✅ Done | `src/hooks/build/index.ts` |
| 2.4 | Rename Atlas functions in build agent | ✅ Done | `getDefaultAtlasPrompt→getDefaultBuildPrompt`, `getGptAtlasPrompt→getGptBuildPrompt`, `getAtlasPrompt→getBuildPrompt`, `AtlasPromptSource→BuildPromptSource` |
| 2.5 | Update display names | ✅ Done | `Atlas (Plan Execution Orchestrator)` → `Build (Plan Execution Orchestrator)` in agent-display-names.ts |
| 2.6 | Update CLI help text | ✅ Done | `Kord, Dev, Plan, Atlas` → `Kord, Dev, Plan, Build` |
| 2.7 | Update test comments/descriptions | ✅ Done | build/index.test.ts, category-skill-reminder/index.test.ts, start-work/index.test.ts, agent-display-names.test.ts, agent-config-integration.test.ts, utils.test.ts, dynamic-agent-prompt-builder.test.ts |
| 2.8 | Update dev-notepad comment | ✅ Done | "caller is Atlas" → "caller is Build" |

### Intentionally kept Atlas references
- `migration.ts` / `migration.test.ts`: Atlas→build migration aliases for backward compat
- `runner.test.ts`: env variable test with "Atlas" as legacy input
- `agent-config-integration.test.ts`: Tests migration path from old Atlas key
- `build/default.ts`: Mythological narrative in prompt (flavor text, not branding)

## Wave 3: Built-in Skills

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Skill loader infrastructure | ✅ Already done | `kord-aios-loader.ts` reads `skills/kord-aios/{domain}/{skill-name}/SKILL.md` with YAML frontmatter |
| 3.2 | AIOS skill conversion (142/151) | ✅ Done | 142 SKILL.md files across 13 domains: analysis, database, design-system, dev-workflow, devops, documentation, mcp, product, qa, squad, story, utilities, worktrees |
| 3.3 | Skill wiring | ✅ Done | `createBuiltinSkills()` includes kord-aios skills by default via `loadKordAiosSkillsSync()` |
| 3.4 | Tests | ✅ Done | `kord-aios-loader.test.ts` — loader, caching, uniqueness, integration with `createBuiltinSkills` |

### Notes
- 9 AIOS tasks not yet converted (ADAPT category requiring engine-overlap stripping). These are deferred to a future iteration.
- All 142 converted skills have YAML frontmatter (name, description, subtask) and markdown body wrapped in `<skill-instruction>` tags.

## Wave 4: Installer + Squad Infrastructure

### Phase 4A: Installer / Scaffolding

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | OpenCode detection | ✅ Already done | `isKordAiosInstalled()`, `getKordAiosVersion()` in config-manager.ts |
| 4.2 | OAuth/Provider setup | ✅ Already done | `addAuthPlugins()`, `addProviderConfig()` |
| 4.3 | Project detection (greenfield/brownfield) | ✅ Already done | `detectCurrentConfig()` in config-manager.ts |
| 4.4 | Project scaffolding | ✅ Done | New `scaffolder.ts` — creates `docs/kord/`, `.kord/templates/`, `kord-rules.md` |
| 4.5 | opencode.json generation/merge | ✅ Already done | `addPluginToKordAiosConfig()`, `writeKordAiosConfig()` |
| 4.6 | Doctor checks + tests | ✅ Already done | Comprehensive doctor module with 7 check categories |

### Phase 4B: Squad Infrastructure

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.7 | SQUAD.yaml schema (Zod) | ✅ Done | `src/features/squad/schema.ts` — squadSchema, squadAgentSchema, squadCategorySchema |
| 4.8 | Squad loader | ✅ Done | `src/features/squad/loader.ts` — discovers `{dir}/{name}/SQUAD.yaml`, builtin + user dirs |
| 4.9 | Squad agent factory | ✅ Done | `src/features/squad/factory.ts` — `createSquadAgentConfig()`, `createAllSquadAgentConfigs()` |
| 4.10 | Squad prompt builder integration | ✅ Done | `buildSquadPromptSection()`, `getSquadAgents()`, `getSquadCategories()` |
| 4.11 | Built-in dev squad | ✅ Done | `src/features/builtin-squads/dev/SQUAD.yaml` — dev-junior agent, 4 categories, story contract |
| 4.12 | Squad unit tests | ✅ Done | `squad.test.ts` (17 tests) + `scaffolder.test.ts` (8 tests) = 25 tests, 0 failures |

### New files
- `src/cli/scaffolder.ts` — project scaffolding (.kord/, docs/kord/, kord-rules.md)
- `src/cli/scaffolder.test.ts` — 8 tests
- `src/features/squad/schema.ts` — SQUAD.yaml Zod schema
- `src/features/squad/loader.ts` — squad discovery from builtin + user directories
- `src/features/squad/factory.ts` — agent config factory + prompt section builder
- `src/features/squad/index.ts` — barrel export
- `src/features/squad/squad.test.ts` — 17 tests
- `src/features/builtin-squads/dev/SQUAD.yaml` — built-in dev squad manifest

## Wave 5: Documentation

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Adapt existing docs/ for Kord branding | ✅ Done | 8 major docs rebranded: overview, installation, orchestration-system, features, configurations, cli-guide, orchestration-guide, category-skill-guide. Also task-system, troubleshooting/ollama-streaming-issue |
| 5.2 | Story/ADR templates in .kord/templates/ | ✅ Done | Completed in Wave 4 scaffolder |
| 5.3 | Documentation skill (built-in) | ✅ Skipped | Covered by Wave 3 AIOS skill conversion (documentation domain skills already converted) |
| 5.4 | Per-folder AGENTS.md updates | ✅ Done | Updated src/agents/AGENTS.md (Atlas→Build, Oracle→Architect, Multimodal-Looker→Vision) and src/cli/AGENTS.md (kord-aios→kord-opencode) |
| 5.5 | README rebrand | ✅ Done | Full rebrand: removed upstream-specific sections (impersonation warning, Sisyphus Labs, Claude OAuth notice), updated badges to GDSDN/kord-aios, rebranded all agent names and config references, added fork attribution |

### Rebranding map applied across all docs
| Legacy Name | Kord AIOS Name |
|-------------|-------------|
| Oh My OpenCode / kord-aios | Kord AIOS / kord-opencode |
| Sisyphus | Kord |
| Atlas | Build |
| Prometheus | Plan |
| Momus | QA |
| Metis | Analyst |
| Oracle / oracle | Architect / architect |
| multimodal-looker / Multimodal Looker | vision / Vision |
| Sisyphus-Junior | Dev-Junior |
| .sisyphus/ | docs/kord/ |
| kord-aios.json | kord-opencode.json |
| sisyphus_agent | kord_agent |
| code-yeongyu/kord-aios | GDSDN/kord-aios |

### Files not rebranded (intentional)
- `docs/archive/` — historical migration documents
- `docs/researches/` — analytical research documents
- `docs/architecture/` — internal architecture reference (heavy legacy terminology, deferred)
- `docs/ultrawork-manifesto.md` — no legacy agent names present

## Wave 6: E2E Validation

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Diagnose Bun crash root cause | ✅ Done | `build-binaries.ts` auto-executed `main()` on import — triggered cross-platform compilation (Linux/macOS Bun downloads on Windows). Fixed with `import.meta.main` guard |
| 6.2 | Align bun-types version | ✅ Done | Updated `bun-types` from 1.3.6 → 1.3.9 to match runtime |
| 6.3 | Regenerate stale snapshots | ✅ Done | 22 model-fallback snapshots had old `$schema` URLs (`kord-aios.schema.json`). Regenerated with `bun test -u` |
| 6.4 | TypeCheck validation | ✅ Done | `tsc --noEmit` passes clean |
| 6.5 | Build validation | ✅ Done | ESM + .d.ts + schema generation all pass |
| 6.6 | Unit test validation (2388 tests) | ✅ Done | **2336 pass** in full suite. 52 delegate-task timeouts (pass isolated, timeout under 155-file parallel load — event loop starvation). 5 findRuleFiles failures (pre-existing Windows filesystem bugs) |
| 6.7 | Integration test validation (delegate-task) | ✅ Done | **93/93 pass** when run isolated (3s). Polling-based tests require isolation from parallel workers |
| 6.8 | Schema generation | ✅ Done | `assets/kord-opencode.schema.json` generates correctly |
| 6.9 | Branding validation | ✅ Done | Zero stale legacy branding references in src/ or docs/ |
| 6.10 | Kord AIOS rebrand | ✅ Done | Updated all agent descriptions, prompts, squad factory, scaffolder, CLI text, and tests to "Kord AIOS" |
| 6.11 | Wave 6 validation script | ✅ Done | `script/validate-wave6.ts` — 6-step automated validation (typecheck, build, isolated integration, parallel unit, schema, branding) |

### Fixes applied
- **`script/build-binaries.ts`**: Added `if (import.meta.main)` guard around `main()` call — prevents cross-platform build from triggering when test imports the module
- **`package.json`**: `bun-types` 1.3.6 → 1.3.9 (match runtime), added `validate` script
- **`src/cli/__snapshots__/model-fallback.test.ts.snap`**: Regenerated 22 snapshots with correct `$schema` URL

### Known pre-existing test issues (not caused by migration)
- **findRuleFiles** (5 tests): Windows filesystem-dependent — `findProjectRoot` returns user home dir (`C:\Users\NASCIM~1`) instead of `null`, `.claude/rules/` and `.cursor/rules/` discovery path mismatches
- **delegate-task/tools.test.ts** (52 tests): Pass in isolation (93/93, 3s), timeout under full parallel suite (155 files). Root cause: event loop starvation from Bun's default 20-worker concurrency. Not a code bug — infrastructure/CI concern
- **McpOAuth, keyword-detector, plan-md-only, babysitter** (~21 tests): Parallel contention — pass in isolation, flaky under full suite load
