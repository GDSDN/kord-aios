# TASK TOAST MANAGER KNOWLEDGE BASE

## OVERVIEW

Manages toast notifications for background task events. When background tasks complete, fail, or require attention, this manager formats and dispatches OS-level or in-session toast notifications to inform the user.

## STRUCTURE
```
task-toast-manager/
├── manager.ts         # TaskToastManager — notification formatting and dispatch
├── types.ts           # ToastEvent, ToastOptions interfaces
├── index.ts           # Barrel exports
└── manager.test.ts    # Manager tests
```

## INTEGRATION

Used by `src/hooks/background-notification/` to surface background task results:
- Task completed → success toast with result summary
- Task failed → error toast with error message
- Task stale → warning toast

## ANTI-PATTERNS

- **Spamming toasts**: Batch notifications when multiple tasks complete simultaneously
- **Large payloads**: Toast messages should be short summaries — full results go to session output
