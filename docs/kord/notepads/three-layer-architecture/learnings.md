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
