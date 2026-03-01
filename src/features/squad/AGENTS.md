# SQUAD SYSTEM KNOWLEDGE BASE

## OVERVIEW

Squads are portable, reusable agent team configurations. A squad brings domain-specialized agents, task categories, skill references, plan templates, and delegation targets — all defined in a single `SQUAD.yaml` manifest. The squad system handles discovery, validation, loading, and injection into agent prompts.

## STRUCTURE
```
squad/
├── schema.ts          # Zod schemas for SQUAD.yaml v2 (109 lines)
├── loader.ts          # Squad discovery + loading from all paths (166 lines)
├── factory.ts         # SquadAgent → AgentConfig, prompt section builder (282 lines)
├── chief-template.ts  # CHIEF_COORDINATION_TEMPLATE constant (93 lines)
├── squad.test.ts      # Schema, loader, factory tests (886 lines)
├── l2-squad-integration.test.ts  # L2-Squad integration tests (11 tests)
├── index.ts           # Barrel exports
├── __test_squads__/   # Test fixtures
└── __l2_test_squads__/ # Integration test fixtures
```

## SQUAD.YAML v2 SCHEMA

### Full Manifest (`squadSchema`)
```yaml
name: my-squad              # Required, kebab-case
description: What this squad does  # Required
version: "1.0.0"            # Semver

agents:                      # Required, map of agent-name → agent-def
  content-writer:
    description: "Writes marketing copy"
    model: anthropic/claude-sonnet-4-5   # Optional model override
    mode: subagent                        # subagent (default) or all
    prompt: "You are a content writer..." # Inline prompt
    prompt_file: ./content-writer.md      # OR external .md file (relative to SQUAD.yaml)
    skills: [writing, seo]                # Skill names to inject
    tools: { task: false }                # Tool permission overrides
    temperature: 0.7                      # 0-1
    is_chief: false                       # If true, can delegate via task()

categories:                  # Optional, domain-specific task routing
  content:
    description: "Content creation tasks"
    model: google/gemini-3-pro
    variant: fast

default_executor: content-writer    # Fallback agent for task execution
default_reviewer: editor            # Fallback agent for task review
contract_type: campaign             # Default contract type (task, story, campaign, case, etc.)
plan_template: "## Campaign Plan\n..."  # Custom plan format

# v2 fields
config:
  extends: default                  # Base config to inherit
  rules: ["Always use brand voice"]
dependencies:
  skills: [writing, seo]            # Required skills
  squads: [base-dev]                # Required squads
tags: [marketing, content]          # Searchable tags
kord:
  minVersion: "3.5.0"              # Minimum Kord AIOS version
```

### Agent Schema (`squadAgentSchema`)
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | string | required | Agent role description |
| `model` | string | — | Model override |
| `mode` | "subagent" \| "all" | "subagent" | Agent invocation mode |
| `prompt` | string | — | Inline system prompt |
| `prompt_file` | string | — | Path to .md prompt file (relative to SQUAD.yaml) |
| `skills` | string[] | [] | Skills to inject |
| `tools` | Record<string, boolean> | — | Tool enable/disable overrides |
| `temperature` | number | — | 0-1 |
| `is_chief` | boolean | false | Can delegate via task() |

### Prompt Resolution Priority
```
1. resolvedPrompts[yamlAgentKey] (loaded from prompt_file on disk)
2. agentDef.prompt (inline YAML)
3. buildDefaultSquadAgentPrompt() (auto-generated from name + description)
```

## AGENT RUNTIME NAMESPACING + CHIEF BEHAVIOR

- Runtime agent registration name is always prefixed: `squad-{manifest.name}-{yamlKey}`
- Prefixing prevents collisions when multiple squads define the same YAML key (for example, `worker`)
- `prompt_file` resolution still keys by original YAML key, not the prefixed runtime name
- `is_chief: true` forces runtime `mode: "all"` (primary + subagent)
- Non-chief agents default to runtime `mode: "subagent"`
- Chief prompts include an auto-generated **Squad Awareness** section:
  - prefixed member names (`@squad-...`)
  - member descriptions
  - skills per member
  - tool permission summary (`default` when no explicit `tools` map)
  - delegation syntax lines using prefixed names

## L2-SQUAD ARCHITECTURE

The L2-Squad system provides a hierarchical agent structure with chief (L2) and worker (L1) agents.

### Layer Model

| Layer | Agent Type | Mode | Capabilities |
|-------|-----------|------|-------------|
| L2 | Chief | `all` | Awareness + Coordination + Domain |
| L1 | Worker | `subagent` | Domain only |

### Chief Prompt Assembly

Chief agent prompts are assembled in four layers:

```
1. Identity Header (buildDefaultSquadAgentPrompt)
   ↓
2. Squad Awareness Section (auto-generated from SQUAD.yaml)
   ↓
3. Custom Domain Content (prompt_file or inline prompt)
   ↓
4. Coordination Protocol Template (CHIEF_COORDINATION_TEMPLATE)
```

The factory function `createSquadAgentConfig()` performs this assembly:
- For chiefs: `appendChiefAwarenessSection(identityHeader, manifest, customDomainContent)`
- For workers: `customDomainContent ?? identityHeader`

### Naming Convention

| Field | Example | Purpose |
|-------|---------|---------|
| Squad name | `marketing` | kebab-case identifier |
| YAML key | `copywriter` | Original agent key in SQUAD.yaml |
| Runtime name | `squad-marketing-copywriter` | Full delegation target |
| Category | `marketing:creative` | Namespaced routing |

### Chief vs Worker Behavior

| Behavior | Chief | Worker |
|----------|-------|--------|
| Runtime mode | `all` (forced) | `subagent` (default) or `all` |
| Squad Awareness | Yes (auto-generated) | No |
| Coordination Template | Yes (CHIEF_COORDINATION_TEMPLATE) | No |
| Custom domain content | Appended after awareness | Full prompt (if provided) |
| Can delegate via `task()` | Yes | No |

### Integration Tests

See `l2-squad-integration.test.ts` for end-to-end verification:
- Chief prompt contains awareness + domain methodology + coordination template
- Prefixed naming prevents collisions across squads
- Chief mode is "all"; workers mode is "subagent"
- Workers do not contain coordination template

## LOADER PIPELINE (`loader.ts`)

### Discovery Order
```
1. Built-in squads: src/features/builtin-squads/{squad-name}/SQUAD.yaml
   ↓
2. .opencode/squads/{squad-name}/SQUAD.yaml
   ↓
3. .kord/squads/{squad-name}/SQUAD.yaml
   ↓
4. docs/kord/squads/{squad-name}/SQUAD.yaml
```

**Dedup rule**: First-seen squad name wins. Built-in squads can be overridden by user squads with the same name.

### Load Process
```
loadAllSquads(projectDir)
  ↓
  loadSquadsFromDir(BUILTIN_SQUADS_DIR, "builtin")
  loadSquadsFromDir(".opencode/squads", "user")
  loadSquadsFromDir(".kord/squads", "user")
  loadSquadsFromDir("docs/kord/squads", "user")
    ↓ for each {squad-name}/SQUAD.yaml
    parseSquadYaml(content) → squadSchema.safeParse()
    resolvePromptFiles(manifest, squadDir) → reads .md files
    ↓
  returns: { squads: LoadedSquad[], errors: SquadLoadError[] }
```

### Key Types
```typescript
interface LoadedSquad {
  manifest: SquadManifest      // Validated SQUAD.yaml
  source: "builtin" | "user"   // Where it came from
  basePath: string             // Absolute path to squad directory
  resolvedPrompts: Record<string, string>  // agent-name → prompt content
}
```

## FACTORY FUNCTIONS (`factory.ts`)

| Function | Purpose |
|----------|---------|
| `createSquadAgentConfig(name, agentDef, squadName, resolvedPrompts)` | Converts a `SquadAgent` → OpenCode `AgentConfig` with resolved prompt |
| `getSquadAgents(squads)` | Extracts all agents from loaded squads for prompt injection |
| `getSquadCategories(squads)` | Extracts all categories (prefixed `{squad}:{category}`) |
| `buildSquadPromptSection(squads)` | Generates markdown section injected into Kord's SystemAwareness |
| `createAllSquadAgentConfigs(squads)` | Batch creates all AgentConfigs from loaded squads |

### Prompt Section Output
`buildSquadPromptSection()` generates:
1. **Available Squads** table (squad name, domain, prefixed agents, prefixed chief)
2. **How to Delegate** — `task(subagent_type="squad-{squad}-{agent}")` syntax per agent
3. **Squad Categories** — `task(category="squad:category")` routing
4. **Squad Skills** — skills per squad

This section is injected into Kord's `<SystemAwareness>` prompt in `src/agents/kord.ts`.

## HOW TO ADD A NEW SQUAD FIELD

1. Add Zod schema in `schema.ts` (field in `squadSchema` or sub-schema)
2. If the field affects agent config, update `createSquadAgentConfig()` in `factory.ts`
3. If the field should appear in agent prompts, update `buildSquadPromptSection()` in `factory.ts`
4. Add test cases in `squad.test.ts`
5. Update test fixtures in `__test_squads__/` if needed

## HOW TO ADD A NEW SEARCH PATH

1. Add entry to `USER_SQUAD_SEARCH_PATHS` array in `loader.ts`
2. Update `docs/configurations.md` to document the new path
3. Add test case verifying discovery from the new path

## VALIDATION TOOL

Squads can be validated at runtime via `src/tools/squad-validate/`:
- Schema validation (Zod)
- Kebab-case name enforcement
- prompt_file existence check
- default_executor/reviewer reference validation
- Chief agent delegation warnings

Invoked via `squad_validate` tool or automatically by `/squad-create` command.

## ANTI-PATTERNS

- **Hardcoded paths**: Use `USER_SQUAD_SEARCH_PATHS` — never hardcode squad discovery paths
- **v1 fields**: NEVER reference `config.yaml`, `pack_name`, `SQS` — these are deprecated legacy formats
- **Agents as record array**: Agents are a `Record<string, SquadAgent>` (keyed by name), NOT an array
- **Missing prompt resolution**: Always pass `resolvedPrompts` to `createSquadAgentConfig()` — the prompt_file content won't appear otherwise
- **Wrong prompt key**: `resolvedPrompts` must use original YAML key, not prefixed runtime agent name
- **Category naming**: Categories are namespaced as `{squad}:{category}` — never use bare category names for squad categories
- **Bare delegation names**: Never delegate with unprefixed `task(subagent_type="agent")` for squad agents
