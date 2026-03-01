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

## Task 4: Enable call_kord_agent by Default (2026-02-28)

### Learnings

- **Two-Layer Permission System**: Kord AIOS has two permission layers:
  1. Global permissions in `config.permission` (applied to all agents)
  2. Per-agent permission overrides in `config-handler.ts`
- **Default Permission Behavior**: Unknown tools are DENIED by default in OpenCode, so we must explicitly `allow` tools we want available
- **call_kord_agent vs task**: `call_kord_agent` is for spawning explore/librarian (read-only), while `task` is for category-based delegation
- **Architect Access**: Removed architect from restriction deny list to allow them to spawn explore/librarian
- **Explore/Librarian Lockdown**: These agents still cannot call `call_kord_agent` (denied in agent-tool-restrictions.ts EXPLORATION_AGENT_DENYLIST)
- **Test Coverage**: Added tests for:
  - Global permission includes call_kord_agent: "allow"
  - kord/dev/planner/builder deny call_kord_agent
  - explore/librarian deny call_kord_agent in restrictions
  - architect no longer denies call_kord_agent (now allowed by global default)

## Task 6: Update Agent Authority Hook to Read Declarative Permissions (2026-02-28)

### Learnings

- **getAgentCapabilities Integration**: Hook now uses `getAgentCapabilities(agentName)` for write permission resolution
- **Precedence Order**: The resolver handles:
  1. T0/T1 agents (kord, dev, dev-junior) get ["**"] access
  2. Agents in DEFAULT_AGENT_ALLOWLIST get fallback paths
  3. Unknown agents get empty array (deny all)
- **Backward Compatibility**: Legacy agents without frontmatter still work via DEFAULT_AGENT_ALLOWLIST fallback
- **Debug Logging**: Added logging to show which source was used (capabilities vs hardcoded vs none)
- **Path Sanitization**: Kept all existing path normalization/sanitization logic unchanged
- **Git Blocking**: Kept existing git command blocking logic unchanged


