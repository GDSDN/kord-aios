# PLUGIN HANDLERS KNOWLEDGE BASE

## OVERVIEW

Central config handler that orchestrates the entire plugin initialization. `createConfigHandler()` is called by OpenCode on startup and produces the fully resolved runtime configuration: agents, tools, hooks, MCPs, skills, commands, categories — all merged from multiple sources with migration, validation, and model resolution.

This is **the most critical file for understanding how Kord AIOS boots**.

## STRUCTURE
```
plugin-handlers/
├── config-handler.ts       # createConfigHandler() — 501 lines, THE boot orchestrator
├── config-handler.test.ts  # Config loading, migration, merge priority tests
└── index.ts                # Barrel exports
```

## CONFIG HANDLER PIPELINE

`createConfigHandler(deps)` executes this sequence on every OpenCode startup:

```
1. Read OpenCode provider config (anthropic beta headers, context limits)
   ↓
2. Load Claude Code plugin components (if claude_code.plugins enabled)
   → commands, skills, agents, mcpServers, hooksConfigs
   ↓
3. Migrate disabled_agents (old names → new names via AGENT_NAME_MAP)
   ↓
4. Discover skills from all sources (parallel):
   → Claude user skills (~/.claude/skills/)
   → Claude project skills (.claude/skills/)
   → OpenCode global skills (~/.config/opencode/skills/)
   → OpenCode project skills (.opencode/skills/)
   ↓
5. Create builtin agents (createBuiltinAgents)
   → Applies agent overrides from config
   → Resolves models via fallback chains
   → Injects discovered skills into agent prompts
   ↓
6. Load external agents:
   → Claude Code user agents (~/.claude/agents/)
   → Claude Code project agents (.claude/agents/)
   → Plugin agents (from step 2, with permission migration)
   ↓
7. Configure Kord agent behavior:
   → Set as default_agent if enabled
   → Create dev-junior with overrides
   → Optionally expose OpenCode-Builder (if default_builder_enabled)
   → Resolve Plan agent model (with fallback pipeline)
   → Optionally demote OpenCode's plan to subagent (if replace_plan)
   ↓
8. Load commands from all sources:
   → Builtin commands (src/features/builtin-commands/)
   → Claude Code user/project commands
   → OpenCode global/project commands
   → Plugin commands
   ↓
9. Load skills from all sources:
   → Claude Code user/project skills
   → OpenCode global/project skills
   → Plugin skills
   → Apply disabled_skills filter
   ↓
10. Register tools:
    → Builtin tools (LSP, AST-Grep, delegate-task, etc.)
    → Apply disabled_tools filter
    ↓
11. Register hooks:
    → All builtin hooks
    → Claude Code hooks compatibility layer
    → Apply disabled_hooks filter
    ↓
12. Register MCPs:
    → Builtin MCPs (websearch, context7, grep_app)
    → Claude Code .mcp.json MCPs
    → Plugin MCPs
    → Apply disabled_mcps filter
    ↓
13. Merge agent configs:
    → Priority: builtin < plugin < user < project < OpenCode config
    → Apply AgentOverrideConfig per agent
    → reorderAgentsByPriority(): kord → dev → plan → build first
    ↓
14. Resolve categories:
    → Merge user categories with DEFAULT_CATEGORIES
    → Apply category model/temp/thinking settings
    ↓
15. Return final merged config to OpenCode
```

## KEY FUNCTIONS

| Function | Purpose |
|----------|---------|
| `createConfigHandler(deps)` | Main factory — returns the async config handler |
| `resolveCategoryConfig(name, userCategories)` | Merge user category override with DEFAULT_CATEGORIES |
| `reorderAgentsByPriority(agents)` | Ensure core agents (kord, dev, plan, build) appear first in UI |

## DEPENDENCIES INTERFACE

```typescript
interface ConfigHandlerDeps {
  ctx: { directory: string; client?: any };  // OpenCode plugin context
  pluginConfig: OhMyOpenCodeConfig;          // Parsed kord-aios.json
  modelCacheState: ModelCacheState;          // Shared model resolution cache
}
```

## LOAD SOURCE PRIORITY

Components are loaded from multiple sources and merged. Later sources override earlier ones:

| Source | Agents | Commands | Skills | MCPs |
|--------|--------|----------|--------|------|
| **Builtin** (plugin code) | ✓ | ✓ | ✓ | ✓ |
| **Claude Code plugins** (.mcp.json) | ✓ | ✓ | ✓ | ✓ |
| **User global** (~/.claude/, ~/.config/opencode/) | ✓ | ✓ | ✓ | — |
| **Project** (.claude/, .opencode/) | ✓ | ✓ | ✓ | — |
| **kord-aios.json overrides** | ✓ (agents section) | — | ✓ (skills section) | — |

## AGENT NAME MIGRATION

Old agent names are automatically migrated via `AGENT_NAME_MAP` from `src/shared/migration.ts`:
```
prometheus → plan, sisyphus → build, atlas → build-loop,
hephaestus → deep, momus → qa, oracle → architect,
metis → analyst, sisyphus-junior → dev-junior
```
This applies to both `disabled_agents` and agent override keys.

## MODEL RESOLUTION

For primary agents (kord, build, plan), model resolution follows this priority:
```
1. UI-selected model (from OpenCode's model picker) — highest priority
2. Agent override model (from kord-aios.json agents section)
3. Category model (from categories config)
4. Agent fallback chain (hardcoded per agent in src/agents/)
5. Connected provider auto-detection (via readConnectedProvidersCache)
```

For subagents, UI selection is ignored — they use their own fallback chains.

## HOW TO ADD A NEW COMPONENT SOURCE

1. **New skill source**: Add discovery function in `src/features/opencode-skill-loader/` or `src/features/claude-code-plugin-loader/`, call it in step 4
2. **New agent source**: Add load function, call in step 6, ensure migration is applied
3. **New MCP source**: Add to step 12, follow `loadMcpConfigs()` pattern

## HOW TO ADD A CONFIG MIGRATION

1. Add mapping to `AGENT_NAME_MAP` in `src/shared/migration.ts`
2. Or add field migration in `migrateAgentConfig()` in `src/shared/permission-compat.ts`
3. Migrations run automatically — no version checks needed (idempotent transforms)

## CRITICAL BEHAVIORS

- **Kord replaces default_agent**: When enabled, `config.default_agent = "kord"` — Kord becomes the primary agent users interact with
- **Plan demotion**: When `planner_enabled && replace_plan`, OpenCode's native plan agent is demoted to subagent mode, and Kord's Plan agent takes over as primary
- **Provider deadlock**: NEVER call `client.provider.list()` from inside the config handler — it causes a deadlock because plugin init waits for the server which is waiting for plugin init

## ANTI-PATTERNS

- **Client API in config handler**: Causes deadlock — use `readConnectedProvidersCache()` instead
- **Skipping migration**: Always run `migrateAgentConfig()` on external agent configs
- **Hardcoded models**: Use `resolveModelPipeline()` from `src/shared/` for model resolution
- **Ignoring disabled lists**: Always check `disabled_agents`, `disabled_hooks`, `disabled_tools`, `disabled_mcps` before registering
- **Wrong merge order**: Builtin configs must be overridable by user/project configs
