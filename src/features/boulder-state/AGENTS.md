# BOULDER STATE KNOWLEDGE BASE

## OVERVIEW

Persistent state management for plan-driven execution. Tracks the active plan, current story/wave progress, checkpoints, and todo items across sessions. Named after the Sisyphus myth — the boulder the agent keeps pushing uphill.

When Kord starts a session via `/start-work`, it reads `docs/kord/boulder.json` to resume where it left off. When progress is made, the state is updated so the next session can continue.

## STRUCTURE
```
boulder-state/
├── storage.ts           # readBoulderState(), writeBoulderState() — file I/O
├── plan-parser.ts       # parsePlanMarkdown() — extracts stories, checkboxes, progress
├── constants.ts         # File paths, default values
├── types.ts             # BoulderState, PlanProgress, StoryProgress interfaces
├── index.ts             # Barrel exports
├── storage.test.ts      # Storage read/write tests
└── plan-parser.test.ts  # Plan parsing tests
```

## STATE FILE

**Location**: `{projectRoot}/docs/kord/boulder.json`

```json
{
  "activePlan": "docs/kord/plans/epic-13-docs-audit.md",
  "currentWave": 2,
  "currentStory": "S07",
  "checkpoint": {
    "timestamp": "2026-02-13T15:30:00Z",
    "message": "Wave 2 S07: 1/17 research headers added"
  },
  "progress": {
    "totalStories": 12,
    "completedStories": 7,
    "stories": {
      "S01": { "status": "completed", "wave": 1 },
      "S07": { "status": "in_progress", "wave": 2 }
    }
  },
  "todos": [
    { "id": "w2-s07", "content": "Add historical headers", "status": "in_progress" }
  ]
}
```

## KEY TYPES

```typescript
interface BoulderState {
  activePlan?: string           // Path to active plan markdown
  currentWave?: number          // Current wave number
  currentStory?: string         // Current story ID (e.g., "S07")
  checkpoint?: {
    timestamp: string           // ISO 8601
    message: string             // Human-readable progress note
  }
  progress?: PlanProgress       // Parsed plan progress
  todos?: Todo[]                // Active todo items
}

interface PlanProgress {
  totalStories: number
  completedStories: number
  stories: Record<string, StoryProgress>
}

interface StoryProgress {
  status: "pending" | "in_progress" | "completed" | "blocked"
  wave: number
}
```

## PLAN PARSER (`plan-parser.ts`)

Parses plan markdown files to extract structured progress:
- Scans for `## Wave N` headings to identify waves
- Scans for `### S{NN}:` or `- [ ]`/`- [x]` patterns to identify stories
- Counts checkboxes for completion percentage
- Returns `PlanProgress` with per-story status

### Supported Plan Formats
```markdown
## Wave 1 — Foundation

### S01: README Rewrite
- [x] Origin story
- [x] Hero image fix
- [ ] Testimonial audit

### S02: CONTRIBUTING.md
- [x] Title rebrand
- [x] URLs updated
```

## STORAGE API (`storage.ts`)

| Function | Purpose |
|----------|---------|
| `readBoulderState(projectDir)` | Read and parse `docs/kord/boulder.json` — returns `BoulderState` or default |
| `writeBoulderState(projectDir, state)` | Write state to `docs/kord/boulder.json` — creates dirs if needed |

### File I/O Behavior
- **Read**: Returns empty default state if file doesn't exist (no error)
- **Write**: Creates `docs/kord/` directory if it doesn't exist
- **Format**: Pretty-printed JSON with 2-space indent
- **Atomic**: Write is NOT atomic (simple writeFile) — acceptable for single-writer use

## DATA FLOW

```
/start-work command
    ↓
readBoulderState(projectDir) → loads last checkpoint
    ↓
Kord reads activePlan → parses plan markdown → shows progress
    ↓
Agent works on currentStory
    ↓
/checkpoint command or auto-checkpoint
    ↓
writeBoulderState(projectDir, updatedState)
    ↓
Next session resumes from checkpoint
```

## CONSUMERS

| Component | How it uses boulder state |
|-----------|--------------------------|
| `/start-work` command | Reads state to resume plan execution |
| `/checkpoint` command | Writes current progress to state |
| `/status` command | Reads state to show progress |
| Kord agent (`kord.ts`) | References boulder.json in SystemAwareness |
| Build hook (`src/hooks/build/`) | May update progress after story completion |

## HOW TO ADD NEW STATE FIELDS

1. Add field to `BoulderState` interface in `types.ts`
2. Handle read/write in `storage.ts` (ensure backward compatibility — new fields should be optional)
3. Update consumers (commands, hooks, agents) to use the new field
4. Add test cases in `storage.test.ts`
5. The state file is schemaless JSON — no migration needed, old files just won't have the new field

## ANTI-PATTERNS

- **Large data**: Keep state lightweight — IDs, paths, progress counters. Don't store file contents or logs
- **Direct file access**: Always use `readBoulderState()`/`writeBoulderState()` — never read/write the JSON directly
- **Concurrent writes**: Only one session should write boulder state at a time (Kord is single-session primary)
- **Required fields**: All BoulderState fields should be optional — the file may not exist or may be from an older version
- **Non-JSON state**: Boulder state is always JSON — don't add YAML or other format support
