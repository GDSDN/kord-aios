export const SQUAD_TEMPLATE = `You are switching the active squad context.

## WHAT TO DO

1. **Parse squad name** from $ARGUMENTS (required)
2. **Load squad manifest** using squad_load tool with the given name
3. **Update boulder state**: Set squad field in docs/kord/boulder.json
4. **Confirm** the switch to the user

## LOADING THE SQUAD

Use the squad_load tool:
\`\`\`
squad_load(squad_name="{name}")
\`\`\`

The tool searches these directories for SQUAD.yaml:
- .opencode/squads/{name}/SQUAD.yaml
- .kord/squads/{name}/SQUAD.yaml
- docs/kord/squads/{name}/SQUAD.yaml

## SUCCESS OUTPUT

\`\`\`
Squad Activated: {squad_name}

Domain: {description}
Agents: {agent_count}
  - {agent_1} ({role})
  - {agent_2} ({role})

Plan Format: {story-driven | task-driven | research}
Execution Rules:
  - {rule_1}
  - {rule_2}

Boulder state updated with squad_id.
\`\`\`

## SQUAD NOT FOUND

If squad manifest is not found:
\`\`\`
Squad "{name}" not found.

Search paths checked:
  - .opencode/squads/{name}/SQUAD.yaml
  - .kord/squads/{name}/SQUAD.yaml
  - docs/kord/squads/{name}/SQUAD.yaml

Available squads:
  - {list directories in search paths that contain SQUAD.yaml}

Usage: /squad <name>
\`\`\`

## NO ARGUMENT PROVIDED

If $ARGUMENTS is empty:
\`\`\`
Usage: /squad <name>

Switches the active squad context. This loads a SQUAD.yaml manifest
and adjusts agent composition, plan format, and execution rules.

Available squads:
  - {list from search paths}
\`\`\`

## CRITICAL

- Squad name is REQUIRED — show usage if missing
- Always update boulder.json squad field after successful load
- If no boulder state exists, create a minimal one with just the squad field
- List available squads when showing errors to help the user`
