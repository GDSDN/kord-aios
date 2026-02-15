# TOOL METADATA STORE KNOWLEDGE BASE

## OVERVIEW

In-memory store for tool execution metadata. Tracks which tools have been called, their arguments, and results across a session. Used by hooks and features that need to make decisions based on tool history (e.g., deduplication, context pruning, edit error recovery).

## STRUCTURE
```
tool-metadata-store/
├── index.ts          # ToolMetadataStore class + singleton export
└── index.test.ts     # Store operation tests
```

## API

The store is a simple Map-based tracker:
- **Record tool calls**: Store tool name, args, result, timestamp
- **Query history**: Check if a tool was called with specific args
- **Clear session**: Reset on session end

## CONSUMERS

| Component | Usage |
|-----------|-------|
| `dynamic-context-pruning` | Deduplication strategy — prune repeated tool calls |
| `edit-error-recovery` hook | Track failed edits for retry logic |
| `tool-output-truncator` hook | Check previous tool outputs for truncation decisions |

## ANTI-PATTERNS

- **Persistent storage**: This is in-memory only — do NOT persist to disk. Cleared per session.
- **Large results**: Store metadata (tool name, args hash) not full results — avoid memory bloat
