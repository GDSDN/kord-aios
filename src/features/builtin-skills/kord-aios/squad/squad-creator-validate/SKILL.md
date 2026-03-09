---
name: squad-creator-validate
description: "Validate squad manifest and structure against v2 schema"
agent: squad-creator
subtask: false
---

# Validate Squad

## Usage

```
@squad-creator
validate-squad my-squad
validate-squad .opencode/squads/my-squad
validate-squad my-squad --strict
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `squad_path` | string | - | Full path to squad directory |
| `name` | string | - | Squad name (resolves via search paths) |
| `--strict` | flag | false | Treat warnings as errors |

## Validation Checks

### 1. Manifest Validation

- Check for `SQUAD.yaml` in the squad directory
- Parse YAML and validate against Zod schema (v2)
- Required fields: `name`, `version`, `agents`

### 2. Structure Validation

- Check for expected directories: `agents/`, `skills/`
- Verify `prompt_file` references in agents resolve to existing `.md` files

### 3. Agent Validation

- Agent names must be kebab-case: `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`
- `default_executor` and `default_reviewer` must reference existing agent keys
- Multi-agent squads should have at least one `is_chief: true` agent

### 4. Schema v2 Fields

- `tags` array (recommended)
- `kord.minVersion` (recommended)
- `prompt_file` per agent (recommended for external prompts)

## Flow

```
1. Resolve squad path
   ├── If full path provided → use directly
   └── If name provided → search .opencode/squads/ → .kord/squads/ → docs/kord/squads/

2. Execute validations
   ├── Parse SQUAD.yaml
   ├── Validate against Zod schema
   ├── Check agent names (kebab-case)
   ├── Check prompt_file existence
   ├── Check default_executor/reviewer references
   └── Check best-practice warnings (chief, tags, kord.minVersion)

3. Format and display result
   ├── Show errors (if any)
   ├── Show warnings (if any)
   └── Show final result (VALID/INVALID)
```

## Output Example

```
Validating squad: .opencode/squads/my-squad/

Errors: 0
Warnings: 2
  - [NO_CHIEF]: Multi-agent squad has no is_chief agent
  - [NO_TAGS]: No tags defined (recommended for discoverability)

Result: VALID (with warnings)
```

## Error Codes

| Code | Severity | Description |
|------|----------|-------------|
| `MANIFEST_NOT_FOUND` | Error | No SQUAD.yaml found |
| `YAML_PARSE_ERROR` | Error | Invalid YAML syntax |
| `SCHEMA_ERROR` | Error | Manifest doesn't match Zod schema |
| `PROMPT_FILE_NOT_FOUND` | Error | Referenced prompt_file doesn't exist |
| `BAD_EXECUTOR_REF` | Error | default_executor references non-existent agent |
| `BAD_REVIEWER_REF` | Error | default_reviewer references non-existent agent |
| `INVALID_AGENT_NAME` | Error | Agent name not kebab-case |
| `NO_AGENTS` | Error | No agents defined |
| `NO_CHIEF` | Warning | Multi-agent squad has no chief |
| `MULTIPLE_CHIEFS` | Warning | More than one is_chief agent |
| `NO_EXECUTOR` | Warning | No default_executor defined |
| `NO_TAGS` | Warning | No tags defined |

## How to Implement

Use the `squad_validate` tool to run validation programmatically:

```
squad_validate({ squad_name: "my-squad" })
```

This returns a structured result: `{ valid: boolean, errors: string[], warnings: string[] }`

## Related

- **Tool:** `squad_validate` (registered in Kord AIOS)
- **Schema:** `squadSchema` in `src/config/schema.ts`
- **Agent:** @squad-creator
