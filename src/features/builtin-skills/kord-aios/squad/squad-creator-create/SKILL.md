---
name: squad-creator-create
description: "Create a new specialized agent squad with v2 SQUAD.yaml manifest"
agent: squad-creator
subtask: false
---

# Create Squad

## Usage

```
@squad-creator
create-squad my-domain
create-squad my-domain --description "Automation squad for X"
```

Or use the `/squad-create` command directly:

```
/squad-create my-domain
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | - | Squad name (kebab-case, required) |
| `--description` | string | "Custom squad" | Squad description |
| `--skip-validation` | flag | false | Skip post-creation validation |

## Generated Squad Structure

```
.opencode/squads/{name}/
├── SQUAD.yaml           # v2 manifest (agents, tags, kord.minVersion)
├── README.md            # Squad documentation and usage guide
├── agents/              # External prompt files for each agent
│   └── {role-name}.md   # Agent persona + expertise + constraints
├── skills/              # Domain-specific SKILL.md files
│   └── {skill-name}/
│       └── SKILL.md     # Methodology, workflows, templates
└── templates/           # Output templates for the domain
```

## Generated SQUAD.yaml (v2)

```yaml
name: {name}
description: {description}
version: 1.0.0

tags: ["{domain}", "custom"]

kord:
  minVersion: "1.0.0"

agents:
  {primary-agent}:
    description: "{role description}"
    prompt_file: agents/{primary-agent}.md
    model: "anthropic/claude-sonnet-4-5"
    mode: subagent
    skills: []
    is_chief: true

  {support-agent}:
    description: "{role description}"
    prompt_file: agents/{support-agent}.md
    model: "anthropic/claude-sonnet-4-5"
    mode: subagent
    skills: []

default_executor: {primary-agent}
default_reviewer: {support-agent}
contract_type: task
```

## Creation Flow

```
1. Parse arguments
   ├── Validate name is kebab-case: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
   └── If invalid → error with suggestion

2. Check if squad exists
   ├── Search .opencode/squads/{name}/
   └── If exists → error with suggestion

3. Research domain
   ├── Identify key roles and workflows
   ├── Study domain expert methodologies
   └── Design agent personas

4. Generate squad files
   ├── Create .opencode/squads/{name}/ directory
   ├── Write SQUAD.yaml with v2 fields
   ├── Write README.md
   ├── Write agents/*.md prompt files
   └── Write skills/*/SKILL.md files

5. Validate
   ├── Run squad_validate on the generated squad
   └── Fix any validation errors

6. Display success
   └── Show location and next steps
```

## Success Output

```
Squad created successfully!

Location: .opencode/squads/{name}/

Next steps:
  1. Review SQUAD.yaml and customize agent definitions
  2. Edit agents/*.md prompt files with domain expertise
  3. Create skills/*/SKILL.md with domain methodologies
  4. Validate: squad_validate({ squad_name: "{name}" })
  5. Use: task(category="{name}:{agent}")
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `INVALID_NAME` | Name not kebab-case | Use lowercase letters, numbers, hyphens |
| `SQUAD_EXISTS` | Squad already exists | Choose different name or delete existing |
| `PERMISSION_DENIED` | Cannot write to directory | Check directory permissions |
| `VALIDATION_FAILED` | Generated squad invalid | Check error details, fix manually |

## Related

- **Tool:** `squad_validate`
- **Command:** `/squad-create`
- **Agent:** @squad-creator
