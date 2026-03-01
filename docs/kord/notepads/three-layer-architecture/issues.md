## 2026-03-01 Plan Start: three-layer-architecture

- Issues and gotchas will be appended after each completed task.

## Task 1: Create OpenCode Agent Loader (2026-02-28)

### Issues/Gotchas

- **Conflicting Requirements**: Task said "keyed by filename without .md" but test expected agent name in description - required careful reading to understand intent
- **Unused Type Import**: `LoadedOpenCodeAgent` type was defined but not used in final implementation (kept for potential future use)
- **Windows Path Handling**: Using `process.cwd()` and `join()` works correctly on Windows; no special handling needed
- **Test Directory Cleanup**: Created `.test-opencode-agents` directory for tests; properly cleaned up in afterEach hook
