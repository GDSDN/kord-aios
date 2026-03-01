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

## Task 6.5: Squad Agent Namespace + Chief L2 Awareness (2026-03-01)

### Issues/Gotchas

- **Collision risk in shared keys**: Multiple squads can define the same YAML agent key (for example, `worker`), so bare runtime names would silently overwrite map entries.
- **Prompt lookup pitfall**: Switching runtime names to prefixed values can accidentally break `prompt_file` hydration if lookup is changed from YAML key to prefixed key.
- **Chief-only awareness boundary**: Awareness injection must be constrained to `is_chief` agents only; worker prompts should remain unmodified.
- **Delegation syntax drift**: Prompt builder content must be updated consistently to prefixed subagent names to avoid stale examples.
