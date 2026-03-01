## 2026-03-01 Plan Start: three-layer-architecture

- Notes will be appended after each completed task.

## Task 1: Create OpenCode Agent Loader (2026-02-28)

### Learnings

- **Pattern Replication**: Successfully replicated the claude-code-agent-loader pattern for OpenCode agents
- **Key Decision - Filename vs Frontmatter Name**: The task specifies agents are keyed by filename without `.md`, not by frontmatter `name` field
- **Description Formatting**: Similar to claude-code-agent-loader, prepend agent name to description for identification
- **TDD Approach**: Wrote tests first (RED), then implementation (GREEN), which caught several issues:
  - Test expected description to contain agent name
  - Test expected key to be filename, not frontmatter name
- **Error Handling**: Gracefully handles missing directories (returns `{}`) and malformed frontmatter (skips file)
- **Tools Parsing**: Implemented comma-separated tools parsing with lowercase normalization (matching claude-code-agent-loader behavior)

## Task 2: Define Agent Frontmatter Schema (2026-02-28)

### Learnings

- **Zod Schema Design**: Created `openCodeAgentFrontmatterSchema` with all optional fields for backward compatibility
- **Parser Helper Pattern**: Implemented `parseOpenCodeAgentFrontmatter()` returning a discriminated union `{ ok: true; value: T } | { ok: false; error: string }` for explicit error handling
- **Semver Validation**: Added lightweight regex-based semver validation for `engine_min_version` field (Task 9 will handle runtime gating)
- **Type Safety**: Used Zod's `safeParse()` with explicit type casting to handle ZodError issues array
- **Loader Integration**: Updated loader to use the new parser, skipping agents with invalid frontmatter shapes without crashing
- **Additional Validation**: Added runtime checks for `write_paths` and `tool_allowlist` being arrays (defense in depth beyond Zod)

## Task 3: Implement Declarative Permission Model (2026-02-28)

### Learnings

- **Source Type Design**: Created `AgentCapabilitySources` interface to represent input sources (frontmatter, squad, config) - keeps module pure and testable
- **Precedence Implementation**: Resolver applies sources in order (frontmatter -> squad -> config) with later sources overwriting earlier ones
- **Fallback Chain**: Implemented 4-level fallback: (1) explicit sources, (2) T0/T1 hardcoded, (3) DEFAULT_AGENT_ALLOWLIST, (4) empty array for unknown agents
- **Case Insensitivity**: Agent name matching is case-insensitive (normalized to lowercase for lookups)
- **TDD Approach**: Wrote 30 tests covering all scenarios - caught 2 test bugs where expected values didn't match test descriptions
- **DEFAULT_AGENT_ALLOWLIST Integration**: Successfully reused existing constant as fallback source (no duplication needed)
- **Barrel Export Pattern**: Added export to shared/index.ts following existing pattern for other utilities

