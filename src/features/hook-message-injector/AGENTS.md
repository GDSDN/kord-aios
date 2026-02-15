# HOOK MESSAGE INJECTOR KNOWLEDGE BASE

## OVERVIEW

Utility for hooks to inject messages into tool outputs. Provides a standardized way to append warnings, reminders, or context to tool execution results without directly mutating the output string.

## STRUCTURE
```
hook-message-injector/
├── injector.ts     # injectMessage(), formatInjection() — output formatting
├── constants.ts    # Injection separators, max lengths
├── types.ts        # InjectionOptions, InjectionResult interfaces
└── index.ts        # Barrel exports
```

## USAGE PATTERN

Hooks use this to append formatted messages to tool outputs:
```typescript
import { injectMessage } from "../hook-message-injector"

// In a PostToolUse hook:
injectMessage(output, {
  source: "my-hook",
  message: "⚠️ Warning: this file has uncommitted changes",
  priority: "high",
})
```

## INTEGRATION

Used by PostToolUse hooks that need to add contextual information to tool outputs without replacing the original content. The injector handles formatting, separators, and deduplication.

## ANTI-PATTERNS

- **Direct output mutation**: Use `injectMessage()` instead of `output.output += "..."` for consistent formatting
- **PreToolUse injection**: This is for PostToolUse only — for PreToolUse context, use `context-injector`
