# CLAUDE CODE PLUGIN LOADER KNOWLEDGE BASE

## OVERVIEW

Loads Claude Code plugins (npm packages that extend Claude Code) and extracts their components: commands, skills, agents, MCP servers, and hooks configs. This enables Kord AIOS to reuse the Claude Code plugin ecosystem.

## STRUCTURE
```
claude-code-plugin-loader/
├── loader.ts    # loadAllPluginComponents() — discovers, loads, and extracts components
├── types.ts     # PluginComponent, LoadedPlugin interfaces
└── index.ts     # Barrel exports
```

## KEY FUNCTION

`loadAllPluginComponents(options?)` → discovers installed Claude Code plugins and returns:
```typescript
{
  commands: Record<string, CommandDefinition>,
  skills: Record<string, SkillDefinition>,
  agents: Record<string, AgentConfig>,
  mcpServers: Record<string, McpServerConfig>,
  hooksConfigs: HookConfig[],
  plugins: LoadedPlugin[],       // Successfully loaded plugins
  errors: string[],              // Load errors (non-fatal)
}
```

## OPTIONS

- `enabledPluginsOverride`: `Record<string, boolean>` — selectively enable/disable plugins by name. Configured via `claude_code.plugins_override` in `kord-aios.json`.

## INTEGRATION

Called by `src/plugin-handlers/config-handler.ts` (step 2). Plugin components are merged into the runtime config alongside builtin and user components. Plugin agents get permission migration applied via `migrateAgentConfig()`.

Can be disabled entirely via `claude_code.plugins: false`.

## ANTI-PATTERNS

- **Blocking on errors**: Plugin load errors are non-fatal — log them but don't crash initialization
- **Missing migration**: Plugin agents MUST be run through `migrateAgentConfig()` for permission compatibility
