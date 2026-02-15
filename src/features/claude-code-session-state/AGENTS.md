# CLAUDE CODE SESSION STATE KNOWLEDGE BASE

## OVERVIEW

Tracks the main session ID across the plugin lifecycle. OpenCode sessions don't always carry their session ID through all hook events, so this module provides a global singleton to store and retrieve the current main session ID.

## STRUCTURE
```
claude-code-session-state/
├── state.ts         # getMainSessionID(), setMainSessionID() — singleton state
├── state.test.ts    # State tracking tests
└── index.ts         # Barrel exports
```

## API

| Function | Purpose |
|----------|---------|
| `setMainSessionID(id)` | Store the current main session ID (called by session hooks) |
| `getMainSessionID()` | Retrieve the stored session ID (used by context-injector, hooks) |

## CONSUMERS

- `src/features/context-injector/injector.ts` — fallback session ID when message doesn't carry one
- Various hooks that need to know the current session context

## ANTI-PATTERNS

- **Multiple writers**: Only session lifecycle hooks should call `setMainSessionID()` — never set it from tools or features
- **Stale ID**: The ID may be stale after session crashes — always treat as best-effort fallback
