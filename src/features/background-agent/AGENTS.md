# BACKGROUND AGENT KNOWLEDGE BASE

## OVERVIEW

Runs agent sessions asynchronously in parallel. The manager handles the full lifecycle: queue → concurrency gate → spawn → poll → stale detection → result collection → notification. This is what powers `task(run_in_background=true)` and unstable agent monitoring.

## STRUCTURE
```
background-agent/
├── manager.ts             # BackgroundAgentManager — full lifecycle (1556 lines)
├── concurrency.ts         # ConcurrencyManager — per-model slot tracking + queuing (138 lines)
├── spawner.ts             # Spawns OpenCode subagent sessions
├── result-handler.ts      # Collects and formats completed task results
├── state.ts               # In-memory task state (Map<id, BackgroundTask>)
├── constants.ts           # Timeouts, intervals, types (53 lines)
├── types.ts               # BackgroundTask, LaunchInput, ResumeInput (73 lines)
├── index.ts               # Barrel exports
├── manager.test.ts        # Manager integration tests
└── concurrency.test.ts    # Concurrency slot and queue tests
```

## TASK LIFECYCLE STATE MACHINE

```
task(run_in_background=true)
    ↓
┌─────────┐   concurrency    ┌─────────┐   spawn    ┌─────────┐
│ PENDING │───────gate───────▶│ RUNNING │───session──▶│ polling │
└─────────┘   (may queue)    └────┬────┘            └────┬────┘
                                  │                       │
                          ┌───────┼───────┐               │
                          ↓       ↓       ↓               ↓
                   ┌──────────┐ ┌─────┐ ┌───────────┐ ┌──────┐
                   │COMPLETED │ │ERROR│ │ CANCELLED  │ │STALE │
                   └──────────┘ └─────┘ └───────────┘ └──────┘
                        ↓                                  ↓
                   result-handler                    auto-cancel
                        ↓
                   notification → parent session
```

### Status Values (`BackgroundTaskStatus`)
| Status | Meaning |
|--------|---------|
| `pending` | Queued, waiting for concurrency slot |
| `running` | Session spawned, actively executing |
| `completed` | Finished successfully, result available |
| `error` | Failed with error message |
| `cancelled` | Cancelled by user or stale detection |

## KEY TYPES

```typescript
interface BackgroundTask {
  id: string                    // Unique task ID
  sessionID?: string            // OpenCode session ID (set after spawn)
  parentSessionID: string       // Who launched this task
  parentMessageID: string       // Message context for notification
  description: string           // Human-readable task description
  prompt: string                // Full prompt sent to subagent
  agent: string                 // Agent name (e.g., "explore", "librarian")
  status: BackgroundTaskStatus
  queuedAt?: Date
  startedAt?: Date
  completedAt?: Date
  result?: string               // Completed output
  error?: string                // Error message
  progress?: TaskProgress       // { toolCalls, lastTool, lastUpdate, lastMessage }
  parentModel?: { providerID, modelID }
  model?: { providerID, modelID, variant? }
  concurrencyKey?: string       // Active slot key (e.g., "anthropic/claude-sonnet-4-5")
  concurrencyGroup?: string     // For re-acquiring on resume
  parentAgent?: string          // For notification routing
  isUnstableAgent?: boolean     // Launched from unstable agent/category
  category?: string             // Category used (e.g., "quick")
  lastMsgCount?: number         // For stability detection
  stablePolls?: number          // Consecutive polls with no new messages
}

interface LaunchInput {
  description: string
  prompt: string
  agent: string
  parentSessionID: string
  parentMessageID: string
  parentModel?: { providerID, modelID }
  parentAgent?: string
  model?: { providerID, modelID, variant? }
  isUnstableAgent?: boolean
  skills?: string[]
  skillContent?: string
  category?: string
}
```

## CONCURRENCY MODEL (`concurrency.ts`)

`ConcurrencyManager` enforces per-model concurrency limits with a queue:

```
acquire(model) → if count < limit: increment count, proceed
                 if count >= limit: queue (Promise), wait for release
release(model) → if queue has waiters: hand off slot (no count change)
                 if no waiters: decrement count
```

### Limit Resolution Priority
```
1. modelConcurrency[model]      — per exact model (e.g., "anthropic/claude-sonnet-4-5": 3)
2. providerConcurrency[provider] — per provider (e.g., "anthropic": 5)
3. defaultConcurrency            — global default
4. Hardcoded fallback: 5
```

Setting any limit to `0` means **unlimited** (Infinity).

### Config (`BackgroundTaskConfigSchema`)
```json
{
  "background_task": {
    "defaultConcurrency": 5,
    "providerConcurrency": { "anthropic": 3, "openai": 5 },
    "modelConcurrency": { "anthropic/claude-opus-4-6": 2 },
    "staleTimeoutMs": 180000
  }
}
```

## CONSTANTS

| Constant | Value | Description |
|----------|-------|-------------|
| `TASK_TTL_MS` | 30min | Task auto-cleanup after completion |
| `MIN_STABILITY_TIME_MS` | 10s | Min time before stability detection |
| `DEFAULT_STALE_TIMEOUT_MS` | 180s (3min) | Default idle timeout for stale detection |
| `MIN_RUNTIME_BEFORE_STALE_MS` | 30s | Min runtime before stale check applies |
| `MIN_IDLE_TIME_MS` | 5s | Min idle time to consider task stale |
| `POLLING_INTERVAL_MS` | 3s | How often manager polls running tasks |
| `TASK_CLEANUP_DELAY_MS` | 10min | Delay before removing completed tasks from state |
| `TMUX_CALLBACK_DELAY_MS` | 200ms | Tmux layout callback delay |

## MANAGER PIPELINE (`manager.ts`)

The manager is a 1556-line singleton that handles everything:

1. **Launch**: Validates input → creates BackgroundTask → acquires concurrency → spawns session
2. **Polling**: Every 3s checks running tasks → reads session messages → updates progress
3. **Stale detection**: If no new messages for `staleTimeoutMs` after `MIN_RUNTIME_BEFORE_STALE_MS` → cancel
4. **Completion**: Detects session stop → calls result-handler → releases concurrency → notifies parent
5. **Cleanup**: Removes old completed tasks after `TASK_CLEANUP_DELAY_MS`
6. **Resume**: Re-attaches to existing sessions after crashes (via `session.stop` events)

### Key Manager Methods
| Method | Purpose |
|--------|---------|
| `launch(input)` | Queue and spawn a background task |
| `cancel(taskId)` | Cancel a running task |
| `getTask(taskId)` | Get task by ID |
| `getActiveTasks()` | List non-completed tasks |
| `getCompletedTasks(parentSessionID)` | Get results for a parent session |
| `cleanup()` | Release all resources, cancel all waiters |

## HOW TO ADD A NEW TASK TRIGGER

Background tasks are spawned via:
1. `task(run_in_background=true)` in `src/tools/delegate-task/` — explicit background
2. Unstable agent detection in `src/hooks/unstable-agent-babysitter/` — forced background
3. The manager exposes `launch(LaunchInput)` for programmatic use

To add a new trigger:
1. Construct a `LaunchInput` with description, prompt, agent, parent context
2. Call `manager.launch(input)`
3. The manager handles queuing, concurrency, spawning, polling, and result collection

## NOTIFICATION FLOW

```
Task completes → result-handler formats output
    ↓
background-notification hook (src/hooks/background-notification/)
    ↓
OS notification + parent session message injection
```

## ANTI-PATTERNS

- **Blocking on background**: Never `await` a background task from the main session — use polling or notifications
- **Bypassing concurrency**: Always go through `ConcurrencyManager.acquire()` — never spawn sessions directly
- **Ignoring stale**: The stale timeout exists to prevent runaway tasks — don't disable without understanding the cost
- **Direct state mutation**: Use manager methods to update task state — never modify `state.ts` maps directly
- **Manager modifications**: This file is 1556 lines for a reason — understand the full lifecycle before editing. Test with `bun test manager.test` after any change
