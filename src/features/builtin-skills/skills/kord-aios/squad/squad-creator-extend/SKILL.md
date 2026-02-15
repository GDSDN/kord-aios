---
name: squad-creator-extend
description: "Add new agents or skills to an existing squad"
agent: squad-creator
subtask: false
---

# Extend Squad

## Purpose

Add new components to an existing squad with automatic SQUAD.yaml manifest updates and validation. Enables incremental squad improvement without manual file manipulation.

## Usage

```
@squad-creator
extend-squad my-squad
extend-squad my-squad --add agent --name analytics-expert
extend-squad my-squad --add skill --name data-processing --agent lead-agent
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `squad_name` | string | - | Name of the squad to extend |
| `--add` | string | - | Component type: agent, skill |
| `--name` | string | - | Component name (kebab-case) |
| `--agent` | string | - | Agent to assign skill to (required for skills) |
| `--force` | flag | false | Overwrite existing component |

## Supported Component Types

| Type | Location | Description |
|------|----------|-------------|
| **agent** | `agents/{name}.md` | New agent persona with prompt file |
| **skill** | `skills/{name}/SKILL.md` | Domain methodology for an agent |

## Interactive Flow

```
@squad-creator extend-squad my-squad

? What would you like to add?
  1. Agent — New agent persona
  2. Skill — New SKILL.md methodology
> 1

? Agent name (kebab-case): analytics-expert
? Agent role: Analyzes data and generates reports
? Should this agent be chief? (y/N): N

Creating agent...
  Created: agents/analytics-expert.md
  Updated: SQUAD.yaml (added to agents section)
  Validation: PASS

Next steps:
  1. Edit agents/analytics-expert.md with domain expertise
  2. Create skills for this agent
  3. Run: squad_validate({ squad_name: "my-squad" })
```

## Extension Steps

### Step 1: Locate Squad

1. Search for the squad in `.opencode/squads/`, `.kord/squads/`, `docs/kord/squads/`
2. Read and parse `SQUAD.yaml`
3. Verify squad exists

### Step 2: Validate Input

- Component name must be kebab-case: `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`
- No path traversal characters (`/`, `\`, `..`)
- Check if component already exists (error unless `--force`)

### Step 3: Create Component File

**For agents:**
- Create `agents/{name}.md` with agent persona template
- Add agent entry to `agents:` section in SQUAD.yaml
- Set `prompt_file: agents/{name}.md`

**For skills:**
- Create `skills/{name}/SKILL.md` with SKILL.md template
- Add skill name to the agent's `skills:` array in SQUAD.yaml

### Step 4: Update SQUAD.yaml

- Read current SQUAD.yaml
- Add the new component reference
- Write updated SQUAD.yaml
- Preserve existing formatting and comments

### Step 5: Validate

- Run `squad_validate` on the updated squad
- Report any errors or warnings
- Suggest fixes if validation fails

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `SQUAD_NOT_FOUND` | Squad directory not found | Use list-squads to see available squads |
| `INVALID_NAME` | Name not kebab-case | Use lowercase letters, numbers, hyphens |
| `COMPONENT_EXISTS` | File already exists | Use --force to overwrite |
| `AGENT_NOT_FOUND` | Agent not in squad (for skills) | Create agent first |
| `MANIFEST_UPDATE_FAILED` | Cannot update SQUAD.yaml | Check file permissions |

## Related

- **Skill:** `squad-creator-create` (creates new squads)
- **Skill:** `squad-creator-analyze` (analyze before extending)
- **Tool:** `squad_validate`
- **Agent:** @squad-creator
