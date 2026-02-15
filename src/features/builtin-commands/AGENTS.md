# BUILT-IN COMMANDS KNOWLEDGE BASE

## OVERVIEW

Slash commands registered with OpenCode. When a user types `/command-name`, OpenCode dispatches to the matching template which provides a structured prompt for the agent.

## STRUCTURE
```
builtin-commands/
├── commands.ts            # loadBuiltinCommands() — maps command names → templates
├── types.ts               # BuiltinCommandName type + template interface
├── index.ts               # Barrel exports
└── templates/
    ├── init-deep.ts       # /init-deep — launch deep research session
    ├── ralph-loop.ts      # /ralph-loop — self-referential dev loop
    ├── ulw-loop.ts        # /ulw-loop — ultrawork autonomous loop
    ├── cancel-ralph.ts    # /cancel-ralph — stop ralph loop
    ├── refactor.ts        # /refactor — guided refactoring (619 lines)
    ├── start-work.ts      # /start-work — resume work from boulder state
    ├── stop-continuation.ts # /stop-continuation — halt todo continuation
    ├── checkpoint.ts      # /checkpoint — save progress checkpoint
    ├── status.ts          # /status — show system status
    ├── squad.ts           # /squad — switch active squad context
    ├── squad-create.ts    # /squad-create — create new squad via squad-creator agent
```

## REGISTERED COMMANDS

| Command | Template | Description |
|---------|----------|-------------|
| `init-deep` | `INIT_DEEP_TEMPLATE` | Launch Hephaestus/Deep for intensive research |
| `ralph-loop` | `RALPH_LOOP_TEMPLATE` | Self-referential autonomous dev loop |
| `ulw-loop` | `ULW_LOOP_TEMPLATE` | Ultrawork autonomous execution loop |
| `cancel-ralph` | `CANCEL_RALPH_TEMPLATE` | Stop an active ralph loop |
| `refactor` | `REFACTOR_TEMPLATE` | Guided multi-step refactoring with analysis → plan → execute |
| `start-work` | `START_WORK_TEMPLATE` | Resume from boulder state, load plan and todos |
| `stop-continuation` | `STOP_CONTINUATION_TEMPLATE` | Halt todo continuation enforcer |
| `checkpoint` | `CHECKPOINT_TEMPLATE` | Save progress to boulder state |
| `status` | `STATUS_TEMPLATE` | Show agent status, active tasks, session info |
| `squad` | `SQUAD_TEMPLATE` | Switch active squad context |
| `squad-create` | `SQUAD_CREATE_TEMPLATE` | Create new squad via squad-creator agent |

## HOW TO ADD A NEW COMMAND

1. Create template in `templates/{command-name}.ts`:
```typescript
export const MY_COMMAND_TEMPLATE = `
You are executing the /my-command slash command.

## Instructions
1. [Step 1]
2. [Step 2]
...

## User Input
$ARGUMENTS
`
```

2. Add command name to `BuiltinCommandNameSchema` in `src/config/schema.ts`:
```typescript
export const BuiltinCommandNameSchema = z.enum([
  // ... existing
  "my-command",
])
```

3. Register in `commands.ts`:
```typescript
import { MY_COMMAND_TEMPLATE } from "./templates/my-command"

commands["my-command"] = {
  description: "What this command does",
  template: MY_COMMAND_TEMPLATE,
}
```

4. Export type in `types.ts` if needed

5. Run `bun run build:schema` to update JSON schema

## TEMPLATE PATTERNS

- Templates are plain strings injected as the agent's prompt when the command is invoked
- `$ARGUMENTS` placeholder is replaced with the user's input after the command name
- Templates can reference agents via `task(subagent_type="...")` for delegation
- Templates can reference skills via `*skill-name` for skill invocation
- Templates should be self-contained — include all context the agent needs

## ANTI-PATTERNS

- **Hardcoded legacy names**: Use canonical Kord AIOS names (@plan, @build, @dev), never legacy aliases
- **Duplicate native commands**: Don't add commands that conflict with OpenCode's built-in commands
- **Missing schema registration**: Command MUST be in `BuiltinCommandNameSchema` or it can't be disabled via config
- **Giant templates**: Keep templates focused (< 200 lines). For complex workflows, delegate to skills
