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

