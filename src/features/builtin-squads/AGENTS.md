# BUILT-IN SQUADS KNOWLEDGE BASE

## OVERVIEW

Pre-packaged squad definitions shipped with the plugin. These provide default agent teams that users get out-of-the-box. Currently contains the `code` squad for development workflows.

## STRUCTURE
```
builtin-squads/
└── code/
    └── SQUAD.yaml    # Default development squad
```

## THE CODE SQUAD

The `code` squad is the built-in development team (`src/features/builtin-squads/code/SQUAD.yaml`). It provides:
- **developer** agent — implementation specialist for code, tests, and bug fixes
- Development categories for task routing (`quick`, `visual`, `ultrabrain`, `artistry`)

This squad is loaded automatically by `src/features/squad/loader.ts` on every startup.

## LOAD PRIORITY

```
1. Built-in squads (this directory) — loaded FIRST
2. .opencode/squads/ — user overrides
3. .kord/squads/ — user overrides
4. docs/kord/squads/ — user overrides
```

**Dedup rule**: First-seen name wins. Since built-in loads first, a user squad with the same name (e.g., `code`) will NOT override the built-in. To switch behavior, use `squad.default_squad` config or a differently-named squad.

## HOW TO ADD A NEW BUILT-IN SQUAD

1. Create directory: `builtin-squads/{squad-name}/`
2. Create `SQUAD.yaml` following v2 schema (see `src/features/squad/schema.ts`):
```yaml
name: my-squad
description: What this squad does
version: "1.0.0"
agents:
  my-agent:
    description: "Agent role description"
    mode: subagent
    prompt: "System prompt for this agent..."
    skills: []
categories:
  my-category:
    description: "Category description"
```
3. Optional: Add `prompt_file` references to external `.md` files in the same directory
4. The loader discovers it automatically — no code changes needed
5. Test: `bun test squad.test` to verify loading

## SQUAD.YAML v2 REFERENCE

See `src/features/squad/AGENTS.md` for the complete schema reference including all fields, agent schema, category schema, and validation rules.

## ANTI-PATTERNS

- **Giant squads**: Keep built-in squads focused on a single domain
- **Hardcoded models**: Use model field only when a specific model is essential — let category resolution handle it otherwise
- **v1 format**: Never use `config.yaml`, `pack_name`, or array-based agent definitions
- **Missing descriptions**: Every agent and category MUST have a description — it's shown in the prompt section
