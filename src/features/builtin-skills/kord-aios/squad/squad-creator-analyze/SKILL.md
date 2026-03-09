---
name: squad-creator-analyze
description: "Analyze an existing squad's structure, coverage, and quality"
agent: squad-creator
subtask: false
---

# Analyze Squad

## Purpose

Analyze an existing squad's structure, components, and coverage to provide insights and improvement suggestions. Helps developers understand what a squad contains and identify opportunities for enhancement.

## Usage

```
@squad-creator
analyze-squad my-squad
analyze-squad my-squad --format json
analyze-squad my-squad --suggestions
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `squad_name` | string | - | Squad name (resolves via search paths) |
| `--format` | string | console | Output: console, markdown, json |
| `--suggestions` | flag | true | Include improvement suggestions |

## Analysis Steps

### Step 1: Locate and Load Squad

1. Search for the squad in `.opencode/squads/`, `.kord/squads/`, `docs/kord/squads/`
2. Read and parse `SQUAD.yaml`
3. Extract overview: name, version, description, tags, kord.minVersion

### Step 2: Inventory Components

Scan the squad directory for:

| Component | Location | Description |
|-----------|----------|-------------|
| Agents | `agents/*.md` | External prompt files |
| Skills | `skills/*/SKILL.md` | Domain methodology files |
| Templates | `templates/` | Output template files |
| README | `README.md` | Squad documentation |

### Step 3: Validate References

- Check each agent's `prompt_file` resolves to an existing file
- Verify `default_executor` and `default_reviewer` point to valid agents
- Run `squad_validate` for comprehensive schema check

### Step 4: Calculate Coverage Metrics

| Metric | Calculation |
|--------|-------------|
| Agent coverage | Agents with prompt_file / Total agents |
| Skill coverage | Skills with SKILL.md / Referenced skills |
| Documentation | Has README + description + tags |
| Schema compliance | v2 fields present (tags, kord.minVersion) |

### Step 5: Generate Suggestions

Based on coverage gaps, suggest improvements:
- Missing `prompt_file` references
- Missing `is_chief` designation
- Missing `tags` or `kord.minVersion`
- Agents without skills
- Missing README.md

## Output Format (Console)

```
=== Squad Analysis: {squad-name} ===

Overview
  Name: {name}
  Version: {version}
  Description: {description}
  Tags: {tags}
  Kord Min Version: {kord.minVersion}

Components
  Agents ({count})
    {agent-name-1} (prompt_file: {status})
    {agent-name-2} (prompt_file: {status})
  Skills ({count})
    {skill-name-1}
  Templates ({count})

Coverage
  Agents:  ████████░░ 80%
  Skills:  ██████░░░░ 60%
  Docs:    ██████████ 100%
  Schema:  ████████░░ 80%

Suggestions
  1. [HIGH] Add prompt_file for agent "helper"
  2. [MED] Add tags for discoverability
  3. [LOW] Create SKILL.md for "data-processing" skill

Next: validate-squad {squad-name}
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `SQUAD_NOT_FOUND` | Squad directory not found | Use list-squads to see available squads |
| `MANIFEST_PARSE_ERROR` | SQUAD.yaml invalid YAML | Fix YAML syntax, run validate-squad |
| `PERMISSION_DENIED` | Cannot read directory | Check file permissions |

## Related

- **Tool:** `squad_validate`, `squad_load`
- **Command:** `/squad-create`
- **Agent:** @squad-creator
