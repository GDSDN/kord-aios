# Learnings

## 2026-03-02 Bootstrap
- Notepad initialized for squad-execution plan.

## 2026-03-02 Schema Extension
- Extended SQUAD.yaml schema with per-agent `fallback` and `write_paths` fields.
- Changes made to `src/features/squad/schema.ts`:
  - Added `squadAgentFallbackSchema` - mirrors `AgentFallbackSlotSchema` from `src/config/schema.ts`
    - Uses same regex `/^[^/\s]+\/.+$/` for provider/model format validation
  - Added `writePathsSchema` with safety validation:
    - Rejects empty strings
    - Rejects paths starting with `/` (must use relative paths)
    - Rejects paths containing `..` (path traversal prevention)
    - Rejects root wildcard `**`
    - Rejects overly broad `docs/kord/**` (reserved for Kord internals)
  - Added `fallback` field to `squadAgentSchema` (max 4 slots, optional)
  - Added `write_paths` field to `squadAgentSchema` (optional)
  - Added kebab-case validation to `squadSchema.name` with regex `/^[a-z0-9]+(-[a-z0-9]+)*$/`
- Backward compatible: all new fields are optional, existing SQUAD.yaml files without these fields will continue to work.
- Verification: `bun run typecheck` passes; 42 squad tests pass.
- No changes to `src/config/schema.ts` (as required).

## 2026-03-02 Chief Task Permission Auto-Enable
- Implemented auto-enable `permission.task = "allow"` for `is_chief: true` agents in `src/features/squad/factory.ts`.
- Logic: After applying tools from SQUAD.yaml, if `agentDef.is_chief` AND `config.permission?.task` is undefined, set `config.permission.task = "allow"`.
- SQUAD.yaml explicit overrides win: if `tools: { task: false }` is set, the auto-enable does NOT override.
- Type fix: Used type assertion `as Record<string, "allow" | "deny">` because SDK's `AgentConfig.permission` type is strict and doesn't include `task` as a known property (but runtime supports any tool name).
- Verified: `bun run typecheck` passes (pre-existing unrelated error in config-handler.ts remains); 42 squad tests pass.
- `call_kord_agent` is NOT auto-enabled - chiefs only get `task` delegation, not direct agent spawning power.
- Finding: Agent tool permissions in OpenCode SDK use strict typing but runtime accepts any tool name - tests also use `as Record<string, string>` casts.

## 2026-03-02 Agent-Authority Convention Paths + Name Collision Validation
- Implemented squad convention write paths in `src/hooks/agent-authority/index.ts`:
  - Squad agents (agentName starts with `squad-`) automatically get write access to:
    - `docs/kord/squads/{squadName}/**`
    - `docs/{squadName}/**`
  - Extraction logic: `squad-{squadName}-{agentKey}` format; validates squadName is kebab-case `/^[a-z0-9]+(-[a-z0-9]+)*$/`
  - Convention paths are additive: merged after frontmatter write_paths but before config allowlist
- Implemented explicit boulder.json deny:
  - All squad agents are blocked from writing to `docs/kord/boulder.json`
  - Throws clear error message indicating the path is reserved for Kord orchestration state
- Implemented name collision validation in `src/features/squad/factory.ts`:
  - Added `BUILTIN_AGENT_NAMES` constant containing all built-in agent names
  - Added `SquadNameCollisionError` custom error class
  - Validation runs in `createAllSquadAgentConfigs()` BEFORE creating configs
  - Error message lists all reserved names to help user understand the conflict
- Built-in squad renamed from `dev` to `code` to avoid collision with built-in agent name `dev`
- Test updates: Updated squad test file to use new `code` squad name
- Verification: `bun run typecheck` passes; 42 squad tests pass; 40 agent-authority tests pass.
- Backward compatible: Non-squad agents unchanged; existing squads without name collisions work as before.

## 2026-03-02 CLI Extract Test Fix - Squad Name Change
- Fixed failing CLI extract test after built-in squad rename from `dev` to `code`.
- Updated `src/cli/extract.test.ts`:
  - Line 42: Changed expected path from `.opencode/squads/dev/SQUAD.yaml` to `.opencode/squads/code/SQUAD.yaml`
  - Line 59: Changed negative assertion from `.opencode/squads/dev/SQUAD.yaml` to `.opencode/squads/code/SQUAD.yaml`
- Verification: `bun test src/cli/extract.test.ts` passes (6 tests, 0 failures).
- Root cause: Test was written before the squad rename; extraction logic correctly uses new `code` squad name but test assertions referenced old `dev` path.

## 2026-03-02 Squad Fallback Store + Write Paths Wiring
- Created `src/shared/squad-fallback-store.ts`:
  - Pattern follows `agent-frontmatter-capabilities-store.ts`: Map-based store with normalize/get/set/clear
  - Exports: `setSquadAgentFallback()`, `getSquadAgentFallback()`, `clearSquadFallbackStore()`
  - Uses `FallbackEntry` type from `model-requirements.ts`
- Wired squad fallback into `src/features/squad/factory.ts` in `createAllSquadAgentConfigs()`:
  - If `agentDef.fallback` exists, converts via `convertAgentFallbackSlots()` and stores via `setSquadAgentFallback()`
  - Populates write paths: convention paths (`docs/kord/squads/{squadName}/**`, `docs/{squadName}/**`) merged with SQUAD.yaml `write_paths`
  - Uses existing `setAgentFrontmatterCapabilities()` to avoid creating separate store
- Updated `src/shared/agent-fallback.ts` in `resolveAgentFallbackChain()`:
  - Added squad fallback check after user-config override, before AGENT_MODEL_REQUIREMENTS
  - Only triggers for agents with name starting with `squad-`
  - Uses `getSquadAgentFallback()` to retrieve stored fallback chain
- Fallback resolution priority (unchanged for non-squad agents):
  1. User override (kord-aios.json)
  2. Squad-manifest fallback (squad-* agents only)
  3. Hardcoded AGENT_MODEL_REQUIREMENTS
- Verification: `bun run typecheck` passes; 42 squad tests pass; 9 model-resolution-pipeline tests pass.
- Backward compatible: Non-squad agents unchanged; existing squads without fallback/write_paths work as before.

## 2026-03-02 Task 5 Regression Fixes
- Fixed `CHIEF_COORDINATION_TEMPLATE` parse regression in `src/features/squad/chief-template.ts` by escaping inline markdown backticks inside the TypeScript backtick template literal.
- Updated `appendChiefAwarenessSection()` in `src/features/squad/factory.ts` to append `CHIEF_COORDINATION_TEMPLATE.replace(/\{SQUAD_NAME\}/g, manifest.name)` so chiefs receive concrete squad paths/names instead of literal placeholders.
- Verification run: `bun test src/features/squad/chief-template.test.ts` and `bun run typecheck`.

## 2026-03-02 Task 7 Integration Tests + Full Verification
- Added `src/features/squad/squad-execution.test.ts` with integration-style coverage across Phase 2 execution pipeline.
- Coverage groups implemented:
  - Schema safety and compatibility (`fallback`, `write_paths`, backward compatibility, and validation rejections for `**`, `docs/kord/*`, and `..`).
  - Fallback behavior (`set/get/clear` store flow, squad fallback precedence, user override precedence, and non-squad isolation).
  - Factory behavior (chief `task` auto-enable, worker no auto-enable, explicit `task: false` override).
  - Authority/safeguards (squad convention path allow, additional `write_paths` allow via factory-seeded capabilities, boulder deny, reserved squad-name collisions).
  - E2E assembly (chief prompt contains concrete squad name with no `{SQUAD_NAME}` literal, `task: "allow"`, and convention write paths in frontmatter capabilities store).
- Isolation choices:
  - `clearSquadFallbackStore()` in `beforeEach`/`afterEach` where relevant.
  - `clearAgentFrontmatterCapabilities()` in `beforeEach`/`afterEach` for tests touching capability store.

## 2026-03-02 Squad Creator Chief Design Refresh
- Updated `<chief_design>` guidance in `src/features/builtin-agents/squad-creator.md` to align with Phase 2 execution architecture.
- Clarified chief role as hybrid (Dev-style autonomy + Kord-style orchestration + domain expertise) and documented `todowrite()` tracking expectation.
- Added explicit YAML examples for `is_chief: true` + `mode: all`, per-agent `fallback`, and per-agent `write_paths`.
- Added `write_paths` safety constraints: relative only, no `..`, no root `**`, no `docs/kord/` prefix.
- Preserved explicit warning that factory auto-generates squad awareness, delegation syntax, and coordination protocol.

## 2026-03-02 Squad Creator Chief Design Alignment (Task 6)
- Refined `<chief_design>` wording to remove continuation-flow references and keep chief behavior aligned to Phase 2 execution.
- Added compact YAML snippets for chief-required fields plus optional per-agent `fallback` and `write_paths` examples.
- Clarified delegation convention (`task(subagent_type="squad-{squad}-{key}")`) and reaffirmed that prompt files must not embed member/delegation lists because factory assembly injects awareness and coordination scaffolding.

## 2026-03-02 Documentation Sync (Task 8)
- Updated squad documentation across root and feature guides to reflect shipped built-in squad `code` at `src/features/builtin-squads/code/SQUAD.yaml` (replacing stale `dev` references).
- Documented `SQUAD.yaml` agent fields `fallback` and `write_paths`, including `write_paths` safety constraints (relative-only, no `..`, no root `**`, no `docs/kord/` prefix).
- Documented runtime behavior: chief `task` auto-allow unless overridden, `{SQUAD_NAME}` placeholder substitution in chief template assembly, squad name reserved-name collision guard.
- Documented authority/fallback wiring: squad convention write paths, explicit deny for `docs/kord/boulder.json`, and squad-manifest fallback-store source in `resolveAgentFallbackChain()` for `squad-*` agents.
