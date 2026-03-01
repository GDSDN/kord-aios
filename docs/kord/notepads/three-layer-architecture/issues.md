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
