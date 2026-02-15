# CONFIG KNOWLEDGE BASE

## OVERVIEW

Zod validation schemas and TypeScript types for the entire Kord AIOS configuration system. The `kord-aios.json` config file is validated against these schemas at plugin load time.

## STRUCTURE
```
config/
├── schema.ts          # All Zod schemas (516 lines) — THE source of truth
├── schema.test.ts     # Schema validation tests
└── index.ts           # Barrel re-exports (schemas + types)
```

## SCHEMA INVENTORY

### Root Config (`OhMyOpenCodeConfigSchema`)
The top-level config object loaded from `kord-aios.json`:

| Field | Schema | Purpose |
|-------|--------|---------|
| `disabled_mcps` | `AnyMcpNameSchema[]` | Disable built-in MCPs by name |
| `disabled_agents` | `BuiltinAgentNameSchema[]` | Disable agents by name |
| `disabled_skills` | `BuiltinSkillNameSchema[]` | Disable skills by name |
| `disabled_hooks` | `HookNameSchema[]` | Disable hooks by name |
| `disabled_commands` | `BuiltinCommandNameSchema[]` | Disable slash commands |
| `disabled_tools` | `string[]` | Disable tools by name |
| `agents` | `AgentOverridesSchema` | Per-agent model/prompt/tool overrides |
| `categories` | `CategoriesConfigSchema` | Category-based delegation config (model, temp, thinking) |
| `claude_code` | `ClaudeCodeConfigSchema` | Claude Code compatibility toggles |
| `kord_agent` | `KordAgentConfigSchema` | Kord master agent behavior |
| `experimental` | `ExperimentalConfigSchema` | Experimental features (truncation, auto_resume, pruning) |
| `skills` | `SkillsConfigSchema` | Skill sources, enable/disable lists |
| `ralph_loop` | `RalphLoopConfigSchema` | Self-referential dev loop config |
| `background_task` | `BackgroundTaskConfigSchema` | Concurrency limits per provider/model |
| `squad` | `SquadConfigSchema` | Default squad, extra search paths |
| `browser_automation_engine` | `BrowserAutomationConfigSchema` | playwright / agent-browser / dev-browser |
| `websearch` | `WebsearchConfigSchema` | exa (default) or tavily |
| `tmux` | `TmuxConfigSchema` | Tmux layout for multi-agent sessions |
| `kord` | `KordConfigSchema` | Kord-specific: tasks storage path |
| `git_master` | `GitMasterConfigSchema` | Commit footer and co-authored-by settings |
| `notification` | `NotificationConfigSchema` | Force enable session notifications |
| `comment_checker` | `CommentCheckerConfigSchema` | Custom AI slop warning prompt |
| `babysitting` | `BabysittingConfigSchema` | Unstable agent timeout |
| `agent_authority` | Object | Agent→file authority allowlists |
| `story_lifecycle` | Object | Story lifecycle force override |
| `quality_gate` | Object | Max QA iterations |
| `decision_logger` | Object | Decision log directory |
| `wave_checkpoint` | `WaveCheckpointConfigSchema` | Auto vs interactive checkpoint mode |
| `executor_resolver` | `ExecutorResolverConfigSchema` | Custom executor→skill mapping |

### Agent Overrides (`AgentOverrideConfigSchema`)
Per-agent configuration applied on top of defaults:

```typescript
{
  model?: string,           // Override model (deprecated — use category)
  category?: string,        // Inherit from category config
  variant?: string,         // Prompt variant (e.g., "gpt" for GPT-optimized)
  skills?: string[],        // Inject skill names into agent prompt
  temperature?: number,     // 0-2
  top_p?: number,           // 0-1
  prompt?: string,          // Replace entire system prompt
  prompt_append?: string,   // Append to system prompt
  tools?: Record<string, boolean>,  // Enable/disable specific tools
  disable?: boolean,        // Disable agent entirely
  mode?: "subagent" | "primary" | "all",
  color?: string,           // Hex color for UI
  permission?: AgentPermissionSchema,  // edit/bash/webfetch/task/doom_loop permissions
  maxTokens?: number,       // Response token limit
  thinking?: { type: "enabled"|"disabled", budgetTokens?: number },  // Anthropic thinking
  reasoningEffort?: "low"|"medium"|"high"|"xhigh",  // OpenAI reasoning
  textVerbosity?: "low"|"medium"|"high",
  providerOptions?: Record<string, unknown>,  // Provider-specific passthrough
}
```

### Category Config (`CategoryConfigSchema`)
Defines model/settings for delegation categories:

```typescript
{
  description?: string,     // Shown in task prompt
  model?: string,           // Model for this category
  variant?: string,
  temperature?: number,
  maxTokens?: number,
  thinking?: { type, budgetTokens },
  reasoningEffort?: string,
  tools?: Record<string, boolean>,
  prompt_append?: string,
  is_unstable_agent?: boolean,  // Force background mode
}
```

### Built-in Categories (`BuiltinCategoryNameSchema`)
`visual-engineering`, `ultrabrain`, `deep`, `artistry`, `quick`, `unspecified-low`, `unspecified-high`, `writing`

### Registered Names

**Agents** (20): `kord`, `dev`, `plan`, `architect`, `librarian`, `explore`, `vision`, `analyst`, `plan-analyzer`, `plan-reviewer`, `qa`, `build`, `sm`, `pm`, `po`, `devops`, `data-engineer`, `ux-design-expert`, `squad-creator`

**Skills** (5): `playwright`, `agent-browser`, `dev-browser`, `frontend-ui-ux`, `git-master`

**Hooks** (47): `todo-continuation-enforcer`, `context-window-monitor`, `session-recovery`, `session-notification`, `comment-checker`, `tool-output-truncator`, `directory-agents-injector`, `think-mode`, `keyword-detector`, `ralph-loop`, `build`, `unstable-agent-babysitter`, `agent-authority`, `story-lifecycle`, `quality-gate`, `decision-logger`, ... (see `HookNameSchema` for full list)

**Commands** (10): `init-deep`, `ralph-loop`, `ulw-loop`, `cancel-ralph`, `refactor`, `start-work`, `stop-continuation`, `checkpoint`, `status`, `squad`

## HOW TO ADD A NEW CONFIG SECTION

1. Define the Zod schema in `schema.ts`:
```typescript
export const MyFeatureConfigSchema = z.object({
  enabled: z.boolean().default(false),
  threshold: z.number().min(0).max(100).default(50),
})
```

2. Add it to `OhMyOpenCodeConfigSchema`:
```typescript
export const OhMyOpenCodeConfigSchema = z.object({
  // ... existing fields
  my_feature: MyFeatureConfigSchema.optional(),
})
```

3. Export the type in `index.ts`:
```typescript
export { MyFeatureConfigSchema } from "./schema"
export type { MyFeatureConfig } from "./schema"
```

4. Regenerate JSON schema:
```bash
bun run build:schema
```
This updates `assets/kord-opencode.schema.json` for IDE autocomplete.

5. Access in your feature:
```typescript
const config = pluginConfig.my_feature;
```

## HOW TO ADD A NEW AGENT NAME

1. Add to `BuiltinAgentNameSchema` enum in `schema.ts`
2. If overridable by users, also add to `OverridableAgentNameSchema`
3. Create the agent factory in `src/agents/`
4. Register in `src/agents/utils.ts` → `agentSources`

## HOW TO ADD A NEW HOOK NAME

1. Add to `HookNameSchema` enum in `schema.ts`
2. Create hook in `src/hooks/[name]/`
3. Register in `src/hooks/index.ts` and `src/index.ts`

## DATA FLOW

```
kord-aios.json (JSONC)
    ↓ loaded by
src/plugin-handlers/config-handler.ts
    ↓ validated against
src/config/schema.ts (Zod)
    ↓ produces
OhMyOpenCodeConfig (TypeScript type)
    ↓ consumed by
src/index.ts → agents, hooks, tools, features
```

## BUILD PIPELINE

```bash
bun run build:schema   # schema.ts → assets/kord-opencode.schema.json (via script/build-schema.ts)
bun run build          # includes schema generation + ESM + .d.ts
```

## ANTI-PATTERNS

- **No Zod**: Every config field MUST have a Zod schema — never accept unvalidated input
- **Direct JSON schema edit**: NEVER edit `assets/kord-opencode.schema.json` — it's generated from `schema.ts`
- **Missing defaults**: Use `.default()` on Zod schemas for optional fields with sensible defaults
- **Loose types**: Prefer `.enum()` over `.string()` when the set of valid values is known
- **@types/node**: Use bun-types exclusively
