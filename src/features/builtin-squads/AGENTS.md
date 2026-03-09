# BUILT-IN SQUADS KNOWLEDGE BASE

## OVERVIEW

Pre-packaged squad seed definitions shipped with the plugin. These are L3 content seeds exported by `init`/`extract` into user-controlled squad directories. Currently contains the `code` squad seed for development workflows.

## STRUCTURE
```
builtin-squads/
└── code/
    └── SQUAD.yaml    # Default development squad
```

## THE CODE SQUAD

The `code` squad seed (`src/features/builtin-squads/code/SQUAD.yaml`) provides:
- **chief** agent — orchestrates the squad and delegates to workers
- **developer** agent — implementation specialist for code, tests, and bug fixes

This seed is exported into project/global squad directories and then loaded from there at runtime.

## RUNTIME CONTRACT

```
1. Project/local squads (`.opencode/squads/`, `.kord/squads/`, `docs/kord/squads/`)
2. Global squads (`{OpenCodeConfigDir}/squads/`)
```

`src/features/builtin-squads/**` is not a runtime load source.

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

components:
  workflows: ["workflows/main.yaml"]

orchestration:
  runner: workflow-engine
  delegation_mode: chief
```
3. Optional: Add `prompt_file` references to external `.md` files in the same directory
4. Ensure `init`/`extract` exports the seed into user directories
5. Test export + load behavior via CLI/squad tests

## SQUAD.YAML v2 REFERENCE

See `src/features/squad/AGENTS.md` for the complete schema reference including all fields, package/orchestration sections, and validation rules.

## ANTI-PATTERNS

- **Giant squads**: Keep built-in squads focused on a single domain
- **Hardcoded models**: Use model field only when a specific model is essential
- **v1 format**: Never use `config.yaml`, `pack_name`, or array-based agent definitions
- **Missing descriptions**: Every agent MUST have a description — it's shown in the prompt section
