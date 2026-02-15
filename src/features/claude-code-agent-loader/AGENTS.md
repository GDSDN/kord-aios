# CLAUDE CODE AGENT LOADER KNOWLEDGE BASE

## OVERVIEW

Loads agent definitions from Claude Code's standard agent directories (`~/.claude/agents/` and `.claude/agents/`). This is part of the Claude Code compatibility layer — users who previously defined custom agents for Claude Code can reuse them in Kord AIOS without changes.

## STRUCTURE
```
claude-code-agent-loader/
├── loader.ts    # loadUserAgents(), loadProjectAgents() — discovers .md agent files
├── types.ts     # ClaudeCodeAgent interface
└── index.ts     # Barrel exports
```

## DISCOVERY PATHS

| Function | Search Path | Scope |
|----------|-------------|-------|
| `loadUserAgents()` | `~/.claude/agents/*.md` | User-global agents |
| `loadProjectAgents()` | `.claude/agents/*.md` | Project-local agents |

## AGENT FILE FORMAT

Each `.md` file in the agents directory becomes a custom agent. The filename (without extension) is the agent name.

```markdown
# My Custom Agent

You are a specialized agent for...

## Instructions
1. ...
```

The file content becomes the agent's system prompt. No frontmatter needed.

## INTEGRATION

Called by `src/plugin-handlers/config-handler.ts` (step 6):
- Claude Code agents are loaded AFTER builtin agents
- They do NOT get permission migration applied (Claude Code uses whitelist-based tools, different from OpenCode's denylist)
- Can be disabled via `claude_code.agents: false` in `kord-aios.json`

## ANTI-PATTERNS

- **Permission migration**: Do NOT apply `migrateAgentConfig()` to Claude Code agents — their tool format is semantically different
- **Overriding builtins**: Claude Code agents with the same name as builtin agents will override them — this is intentional
