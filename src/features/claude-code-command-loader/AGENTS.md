# CLAUDE CODE COMMAND LOADER KNOWLEDGE BASE

## OVERVIEW

Loads slash command definitions from Claude Code's standard command directories. Supports four discovery paths covering both Claude Code and OpenCode conventions. Commands are `.md` files whose content becomes the command template.

## STRUCTURE
```
claude-code-command-loader/
├── loader.ts    # loadUserCommands(), loadProjectCommands(), loadOpencodeGlobal/ProjectCommands()
├── types.ts     # CommandDefinition interface
└── index.ts     # Barrel exports
```

## DISCOVERY PATHS

| Function | Search Path | Scope |
|----------|-------------|-------|
| `loadUserCommands()` | `~/.claude/commands/*.md` | User-global (Claude Code) |
| `loadProjectCommands()` | `.claude/commands/*.md` | Project-local (Claude Code) |
| `loadOpencodeGlobalCommands()` | `~/.config/opencode/commands/*.md` | User-global (OpenCode) |
| `loadOpencodeProjectCommands()` | `.opencode/commands/*.md` | Project-local (OpenCode) |

## COMMAND FILE FORMAT

Each `.md` file becomes a slash command. Filename = command name. Subdirectories create namespaced commands (e.g., `AIOS/agents/kord.md` → `/AIOS-agents-kord`).

```markdown
# Command content becomes the template
$ARGUMENTS is replaced with user input
```

## INTEGRATION

Called by `src/plugin-handlers/config-handler.ts` (step 8). Commands from all sources are merged with builtin commands, with later sources overriding earlier ones.

Can be disabled via `claude_code.commands: false` in `kord-aios.json`.
