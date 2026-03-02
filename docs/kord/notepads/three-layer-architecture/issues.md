## 2026-03-01 Plan Start: three-layer-architecture

- Issues and gotchas will be appended after each completed task.

## Task 1: Create OpenCode Agent Loader (2026-02-28)

### Issues/Gotchas

- **Conflicting Requirements**: Task said "keyed by filename without .md" but test expected agent name in description - required careful reading to understand intent
- **Unused Type Import**: `LoadedOpenCodeAgent` type was defined but not used in final implementation (kept for potential future use)
- **Windows Path Handling**: Using `process.cwd()` and `join()` works correctly on Windows; no special handling needed
- **Test Directory Cleanup**: Created `.test-opencode-agents` directory for tests; properly cleaned up in afterEach hook

## 2026-03-01 Orchestrator Note

- `lsp_diagnostics` is not available on this Windows environment (`typescript-language-server` missing). Use `bun run typecheck` + `bun run build` + `bun test` as the verification gate until LSP is installed.

## Task 2: Define Agent Frontmatter Schema (2026-02-28)

### Issues/Gotchas

- **Zod Type Error**: TypeScript complained about `parseResult.error.errors` not existing on ZodError type. Fixed by casting to `{ issues: ZodIssue[] }` type
- **Zod API**: In Zod v3, the property is `issues` not `errors` - had to use type assertion to access it properly
- **Backward Compatibility**: All fields are optional to maintain compatibility with existing agents that might not have all fields
- **Validation Layering**: Zod validates the shape, but we also added runtime checks for array types to handle edge cases where YAML parsing might produce unexpected types

## Task 4: Enable call_kord_agent by Default (2026-02-28)

### Issues/Gotchas

- **Tool Naming**: Must use exact tool name `call_kord_agent` (not `call_kord_agent_*`)
- **Merge Order**: Global permission is spread first, then per-agent overrides are applied - this allows agents like kord to explicitly deny what global allows
- **No task Override**: Global permission keeps `task: "deny"` - only `call_kord_agent` is allowed, not `task`
- **Test Verification**: All 3034 tests pass, including new tests for permission behavior
- **Architect Not in builtinAgents**: Architect is loaded via builtinAgents, not as a special agent in config-handler - permissions are handled by global default + restrictions

## Task 5: Integrate Agent Loader with Override-First Resolution (2026-02-28)

### Issues/Gotchas

- **Duplicate Test Code**: During implementation, accidentally created duplicate test blocks due to edit errors - had to clean up leftover code at end of file
- **Mock Mismatch**: Test expected `builder` key but config-handler creates `OpenCode-Builder` when `default_builder_enabled` is true - fixed test to check for correct key
- **T0 Filtering**: Implemented `filterT0Agents()` function to prevent kord/dev/builder/planner from being overridden via `.opencode/agents/*.md` - these are core Kord agents
- **Merge Order**: Correctly placed OpenCode agents between builtinAgents and Claude Code agents in the merge order
- **No migrateAgentConfig**: OpenCode agents use their own format (tools as object with boolean values), so no permission migration is applied

## Task 6: Update Agent Authority Hook to Read Declarative Permissions (2026-02-28)

### Issues/Gotchas

- **Unused Variable**: Removed unused `allowlistByAgent` variable from hook - was using getAgentCapabilities instead
- **Import Order**: Had to add back `getAgentDisplayName` import which was accidentally removed - needed for error messages
- **Unknown Agent Blocking**: New behavior blocks unknown agents that have no entry in DEFAULT_AGENT_ALLOWLIST - this is intentional but may affect custom agents that weren't explicitly added
- **Test Coverage**: Added 6 new tests to cover unknown agent blocking, DEFAULT_AGENT_ALLOWLIST fallback, and T0/T1 agent full access
- **19 Tests Pass**: All 19 agent-authority tests pass including new and existing tests

## Task 7: Convert T2 Prompt-Only Agents to Overridable .md Defaults (2026-03-01)

### Issues/Gotchas

- **Broken raw import quoting**: `pm.ts`, `po.ts`, `sm.ts`, `qa.ts`, and `devops.ts` had missing closing quotes on `*.md?raw` imports, causing immediate TypeScript parse failures.
- **Duplicate prompt constants**: Partial migration left both parsed-body and legacy inline `*_SYSTEM_PROMPT` constants in the same files, creating redeclarations and inconsistent prompt sources.
- **Partial conversion drift**: Some T2 wrappers still used embedded template literals while related `.md` defaults already existed, so runtime behavior diverged from the intended three-layer embedding pattern.
- **TypeScript ?raw import incompatibility**: The `?raw` import suffix (Vite/Bun feature) doesn't work with TypeScript out of the box - even with `moduleResolution: "bundler"`. TypeScript would fail with "Cannot find module" errors.
- **Solution**: Created `script/build-agent-prompts.ts` that runs at build time to generate `src/features/builtin-agents/prompts.ts` with all .md content embedded as template literals. Agent wrappers now import from this generated TypeScript file, which compiles cleanly.

## Task 6.5: Squad Agent Namespace + Chief L2 Awareness (2026-03-01)

### Issues/Gotchas

- **Collision risk in shared keys**: Multiple squads can define the same YAML agent key (for example, `worker`), so bare runtime names would silently overwrite map entries.
- **Prompt lookup pitfall**: Switching runtime names to prefixed values can accidentally break `prompt_file` hydration if lookup is changed from YAML key to prefixed key.
- **Chief-only awareness boundary**: Awareness injection must be constrained to `is_chief` agents only; worker prompts should remain unmodified.
- **Delegation syntax drift**: Prompt builder content must be updated consistently to prefixed subagent names to avoid stale examples.

## Task: Fix Config Allowlist Override Regression (2026-03-01)

### Issues/Gotchas

- **Regression in agent-authority hook**: The `resolveAllowlist(config)` function existed in `src/hooks/agent-authority/index.ts` (lines 123-131) but was never called - the hook ignored `config.allowlist` entirely.
- **Test failure**: E2E test "config allowlist override" failed because `createAgentAuthorityHook(ctx, { allowlist: { pm: ["src/**"] } })` did not grant write access to `src/**`.
- **Fix**: After determining base allowlist from `getAgentCapabilities()` or `DEFAULT_AGENT_ALLOWLIST`, merge in any additional paths from `config.allowlist` using case-insensitive agent key matching.
- **Additive behavior**: Config allowlist entries are merged additively (extend, not replace), so agents retain access to default paths plus any custom paths.
- **Verification**: All 22 agent-authority E2E tests pass, full test suite (3066 tests) passes with no regressions.

## Task 8: Create `kord-aios extract` CLI command (2026-03-01)

### Issues/Gotchas

- **T2-only agent scope ambiguity**: The source directory currently contains only T2 agent markdown defaults, so extraction uses `src/features/builtin-agents/*.md` directly; if other tiers are added later in the same directory, filtering logic will need to be tightened.
- **Skill destination collisions**: Extracting to `skills/{skill}/SKILL.md` drops domain segments by design, which can collide if two domains introduce the same skill folder name.
- **Diff-mode expectations**: `--diff` intentionally reports both `[WRITE]` and `[SKIP]` decisions while performing no filesystem writes, so summary counts are simulation counts rather than persisted outputs.

## Task 11: Create CHIEF_COORDINATION_TEMPLATE Constant (2026-03-01)

### Issues/Gotchas

- **Export Location**: Placed template in `src/features/squad/chief-template.ts` to keep it alongside other squad factory code (not in the factory file itself per Task 12 requirements).
- **Test File Convention**: Created separate `chief-template.test.ts` following the existing pattern of one test file per source file in the squad module.
- **Literal Syntax Requirement**: Task required delegation syntax as literal example - used backticks to escape the string properly in the template.

## Task 12: Integrate Chief Template into Factory Prompt Assembly (2026-03-01)

### Issues/Gotchas

- **Prompt key resolution**: The `resolvedPrompts` lookup still uses the original YAML key (not the prefixed runtime name) - this is intentional and must be preserved
- **Custom content duplication risk**: Initially implemented incorrectly where custom content appeared twice - fixed by using separate `identityHeader` and `customDomainContent` variables
- **Test assertion syntax**: Using `expect(string).indexOf()` doesn't work - must use `expect(string.indexOf())` for proper assertion
- **Section ordering verification**: Tests validate that custom content appears between awareness and coordination, not just that all sections exist

## Task 13: Upgrade Squad Creator to Generate L2-Aware Chief Prompts (2026-03-01)

### Issues/Gotchas

- **Prompt-reality alignment**: Must verify squad-creator.md instructions match actual factory.ts behavior - this required reading factory.ts to confirm auto-awareness generation and coordination template appending
- **Anchor phrase preservation**: The T2 agent prompts test checks for specific anchor phrases - verified that "Squad Assembler" and "SQUAD.yaml" remain in the prompt after edits
- **SQUAD.yaml example update**: Needed to show chief agent with both `is_chief: true` AND `mode: all` - neither alone is sufficient
- **GOOD vs BAD examples**: Created explicit chief.md examples showing what NOT to include (team lists, delegation syntax) vs what to include (domain methodology, quality gates)

## Task 14: L2-Squad Integration Tests + Documentation (2026-03-01)

### Issues/Gotchas

- **Test directory cleanup**: Integration tests use separate `__l2_test_squads__` directory to avoid conflicts with existing `__test_squads__` fixtures - ensure proper cleanup in afterEach hooks
- **Squad loading in tests**: Loading multiple squads from a single directory requires each squad in its own subdirectory - both alpha and beta squads loaded correctly when in separate subdirectories
- **Test assertion count**: Expected 6 agent configs (2 squads × 2 agents + 2 chiefs) but got 4 - confirmed both squads load, 4 agents total (2 chiefs + 2 workers) across 2 squads
- **No new deps**: Task required no new dependencies - integration tests use existing test infrastructure (bun:test, fs utilities)

## Task 10: Integration Tests + Documentation (2026-03-01)

### Issues/Gotchas

- **Mock-induced false negatives**: `loadOpenCodeAgents()` was mocked to `{}` in integration tests, causing every override/write-path assertion to fail despite correct runtime behavior.
- **Key mismatch**: Tests expected `course_creator`, but runtime contract uses filename keys (`course-creator`), so assertions were checking non-existent entries.
- **Permission expectation drift**: A test used `custom-pm` (not in default allowlist) but expected PM fallback permissions; aligning filename to `pm.md` fixed the expectation.
- **State leakage risk**: Capability data is in-memory; tests must clear the store between runs to prevent cross-test contamination.
