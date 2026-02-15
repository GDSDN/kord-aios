# CONTEXT INJECTOR KNOWLEDGE BASE

## OVERVIEW

Centralized system for collecting and injecting context into agent messages. Multiple hooks (keyword-detector, rules-injector, directory-agents, directory-readme) register context entries with priority. The injector then merges and prepends them to the next user message as a synthetic part.

This replaces the old pattern where each hook independently modified `output.output +=`. Now all context flows through a single collector → injector pipeline with priority ordering and deduplication.

## STRUCTURE
```
context-injector/
├── collector.ts         # ContextCollector class — register, consume, clear (86 lines)
├── injector.ts          # injectPendingContext() + hook factories (168 lines)
├── types.ts             # ContextEntry, PendingContext, ContextSourceType (92 lines)
├── index.ts             # Barrel exports + singleton contextCollector
├── collector.test.ts    # Collector register/consume/priority tests
└── injector.test.ts     # Injection hook tests
```

## PIPELINE

```
Hook A (keyword-detector)  ──┐
Hook B (rules-injector)    ──┤  collector.register(sessionID, { source, id, content, priority })
Hook C (directory-agents)  ──┤
Hook D (directory-readme)  ──┘
                              ↓
                     ContextCollector (Map<sessionID, Map<key, ContextEntry>>)
                              ↓
                     On next user message:
                     experimental.chat.messages.transform hook
                              ↓
                     collector.consume(sessionID)
                              ↓
                     Sort entries by priority (critical > high > normal > low)
                              ↓
                     Merge with separator: "\n\n---\n\n"
                              ↓
                     Insert as synthetic part before user's text part
                     (synthetic: true → hidden in UI)
```

## CONTEXT SOURCES

| Source | Priority | What it registers |
|--------|----------|-------------------|
| `keyword-detector` | high | Ultrawork/search/analyze mode instructions |
| `rules-injector` | normal | Conditional rules from `.github/instructions/`, `.cursor/rules/`, `.claude/rules/`, `docs/kord/rules/` |
| `directory-agents` | normal | AGENTS.md content for current working directory |
| `directory-readme` | low | README.md content for current working directory |
| `custom` | varies | Extension point for new sources |

## KEY TYPES

```typescript
type ContextSourceType = "keyword-detector" | "rules-injector" | "directory-agents" | "directory-readme" | "custom"
type ContextPriority = "critical" | "high" | "normal" | "low"

interface ContextEntry {
  id: string                    // Unique within source (dedup key)
  source: ContextSourceType     // Which hook registered this
  content: string               // Actual content to inject
  priority: ContextPriority     // Ordering (critical first)
  timestamp: number             // When registered
  metadata?: Record<string, unknown>
}

interface RegisterContextOptions {
  id: string
  source: ContextSourceType
  content: string
  priority?: ContextPriority    // Default: "normal"
  metadata?: Record<string, unknown>
}

interface PendingContext {
  merged: string                // All entries joined with separator
  entries: ContextEntry[]       // Individual entries
  hasContent: boolean           // Whether there's anything to inject
}
```

## COLLECTOR API (`collector.ts`)

| Method | Purpose |
|--------|---------|
| `register(sessionID, options)` | Add context entry — deduplicates by `{source}:{id}` key |
| `hasPending(sessionID)` | Check if any context is waiting |
| `getPending(sessionID)` | Get merged pending context without consuming |
| `consume(sessionID)` | Get merged pending context AND clear it |
| `clear(sessionID)` | Discard all pending context for a session |

**Singleton**: `contextCollector` is exported as a module-level singleton used by all hooks.

## INJECTION HOOKS (`injector.ts`)

Two injection mechanisms:

### 1. `createContextInjectorHook(collector)` — chat.message
Prepends pending context to the output parts of a chat.message event. Simpler but less reliable.

### 2. `createContextInjectorMessagesTransformHook(collector)` — experimental.chat.messages.transform
Inserts a **synthetic part** into the last user message. This is the preferred mechanism:
- Finds the last user message in the conversation
- Creates a synthetic text part with `synthetic: true` (hidden in UI)
- Inserts it before the user's actual text part
- Result: agent sees the injected context as part of the user message

## HOW TO ADD A NEW CONTEXT SOURCE

1. Add source name to `ContextSourceType` in `types.ts`:
```typescript
export type ContextSourceType =
  | "keyword-detector"
  | "rules-injector"
  | "directory-agents"
  | "directory-readme"
  | "my-new-source"    // Add here
  | "custom"
```

2. In your hook, import the singleton and register:
```typescript
import { contextCollector } from "../context-injector"

// In your hook handler:
contextCollector.register(sessionID, {
  id: "unique-entry-id",
  source: "my-new-source",
  content: "Context to inject...",
  priority: "normal",  // or "critical", "high", "low"
})
```

3. The injector will automatically pick up your entries on the next message.

## DEDUPLICATION

Entries are keyed by `{source}:{id}`. Registering the same source+id pair overwrites the previous entry. This prevents duplicate injection when a hook fires multiple times.

## ANTI-PATTERNS

- **Direct output mutation**: Don't use `output.output +=` in hooks — use the collector instead
- **Missing consume**: Always `consume()` not `getPending()` when injecting — otherwise entries accumulate forever
- **Critical overuse**: Reserve "critical" priority for truly essential context (e.g., safety rules). Most sources should use "normal"
- **Large content**: Keep injected content concise — it adds to every message's token count
- **Session leaks**: The collector stores state per session — if sessions are never cleared, memory grows. The `consume()` method handles this automatically.
