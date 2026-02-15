# TMUX SUBAGENT KNOWLEDGE BASE

## OVERVIEW

Manages tmux pane layout for visual multi-agent sessions. When background agents are spawned, this module decides whether to create new tmux panes, replace idle panes, or queue the spawn. Provides a visual dashboard where users can watch multiple agents working simultaneously.

## STRUCTURE
```
tmux-subagent/
├── manager.ts              # TmuxSubagentManager — pane lifecycle (main orchestrator)
├── decision-engine.ts      # SpawnDecision logic — can we spawn? which pane? split direction?
├── action-executor.ts      # Executes pane actions (spawn, close, replace) via tmux CLI
├── pane-state-querier.ts   # Queries tmux for current window/pane state
├── types.ts                # TrackedSession, TmuxPaneInfo, WindowState, PaneAction (49 lines)
├── index.ts                # Barrel exports
├── manager.test.ts         # Manager integration tests
└── decision-engine.test.ts # Spawn decision logic tests
```

## KEY TYPES

```typescript
interface TrackedSession {
  sessionId: string
  paneId: string
  description: string
  createdAt: Date
  lastSeenAt: Date
  lastMessageCount?: number    // For stability detection
  stableIdlePolls?: number     // Prevents premature pane closure
}

interface WindowState {
  windowWidth: number
  windowHeight: number
  mainPane: TmuxPaneInfo | null
  agentPanes: TmuxPaneInfo[]
}

type PaneAction =
  | { type: "close"; paneId; sessionId }
  | { type: "spawn"; sessionId; description; targetPaneId; splitDirection }
  | { type: "replace"; paneId; oldSessionId; newSessionId; description }
```

## DECISION ENGINE

The decision engine determines pane layout actions:

```
New background task spawned
    ↓
pane-state-querier → current WindowState
    ↓
decision-engine.makeSpawnDecision(windowState, newSession)
    ↓
┌─ Enough space? → spawn: split existing pane
├─ Idle pane exists? → replace: reuse idle pane
├─ Can close completed? → close + spawn
└─ No space → canSpawn: false (queue)
```

### Layout Constraints
| Constant | Value | Description |
|----------|-------|-------------|
| `MIN_PANE_WIDTH` | 52 | Minimum pane width in columns |
| `MIN_PANE_HEIGHT` | 11 | Minimum pane height in rows |
| `mainPaneMinWidth` | config (default 120) | Main pane never shrinks below this |
| `agentPaneMinWidth` | config (default 40) | Agent panes minimum width |

## CONFIG

Controlled via `tmux` section in `kord-aios.json`:
```json
{
  "tmux": {
    "enabled": false,
    "layout": "main-vertical",
    "main_pane_size": 60,
    "main_pane_min_width": 120,
    "agent_pane_min_width": 40
  }
}
```

### Layout Options
| Layout | Description |
|--------|-------------|
| `main-vertical` | Main pane left, agent panes stacked right (default) |
| `main-horizontal` | Main pane top, agent panes stacked bottom |
| `tiled` | All panes equal size grid |
| `even-horizontal` | All panes in a horizontal row |
| `even-vertical` | All panes in a vertical stack |

## INTEGRATION

- **Background agent manager**: Calls tmux manager when spawning/completing background tasks
- **Config**: `TmuxConfigSchema` in `src/config/schema.ts`
- **Constants**: `TMUX_CALLBACK_DELAY_MS` in `src/features/background-agent/constants.ts`

## ANTI-PATTERNS

- **Ignoring min sizes**: Never create panes smaller than `MIN_PANE_WIDTH` × `MIN_PANE_HEIGHT`
- **Blocking on tmux**: Tmux commands can fail (not installed, wrong terminal) — always handle errors gracefully
- **Premature closure**: Use stability detection (stableIdlePolls) before closing "idle" panes — agents may be thinking
- **Direct tmux CLI**: Always go through `action-executor.ts` — it handles error recovery and state tracking
