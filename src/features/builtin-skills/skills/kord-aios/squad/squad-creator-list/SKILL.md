---
name: squad-creator-list
description: "List installed squads from all search paths"
agent: squad-creator
subtask: false
---

# List Squads

## Usage

```
@squad-creator
list-squads
list-squads --format json
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `--format` | string | table | Output format: table, json |
| `--include-invalid` | flag | false | Include squads without valid SQUAD.yaml |

## Search Paths

Squads are discovered from these directories (in priority order, first wins on name conflict):

1. `.opencode/squads/` — project-level squads
2. `.kord/squads/` — Kord directory squads
3. `docs/kord/squads/` — documentation squads

## Output Example (Table)

```
Installed Squads

┌─────────────────────┬─────────┬─────────────────────────────┬────────┬──────────────────────┐
│ Name                │ Version │ Description                 │ Status │ Location             │
├─────────────────────┼─────────┼─────────────────────────────┼────────┼──────────────────────┤
│ my-domain-squad     │ 1.0.0   │ Automation squad for X      │ ✅     │ .opencode/squads/    │
│ analytics-squad     │ 2.1.0   │ Data analytics team         │ ✅     │ .kord/squads/        │
│ dev                 │ 1.0.0   │ Built-in development squad  │ ✅     │ (built-in)           │
└─────────────────────┴─────────┴─────────────────────────────┴────────┴──────────────────────┘

Total: 3 squads (3 valid)
```

## Output Example (JSON)

```json
{
  "squads": [
    {
      "name": "my-domain-squad",
      "version": "1.0.0",
      "description": "Automation squad for X",
      "path": ".opencode/squads/my-domain-squad",
      "status": "valid",
      "agents": 3,
      "tags": ["automation"]
    }
  ],
  "count": 1
}
```

## Status Indicators

| Status | Icon | Description |
|--------|------|-------------|
| valid | ✅ | Valid SQUAD.yaml manifest |
| invalid | ❌ | Missing or invalid SQUAD.yaml |

## Flow

```
1. Scan search paths
   ├── .opencode/squads/
   ├── .kord/squads/
   └── docs/kord/squads/

2. For each subdirectory
   ├── Check for SQUAD.yaml
   ├── Parse manifest if found
   └── Deduplicate by name (first wins)

3. Format output
   ├── table → ASCII table with summary
   └── json → structured JSON

4. Display result
```

## How to Implement

Use the `squad_load` tool to discover squads programmatically:

```
squad_load({ action: "list" })
```

Or read squad directories directly from the search paths.

## Empty State

```
No squads found.

Create one with: /squad-create my-domain
```

## Related

- **Tool:** `squad_load` (registered in Kord AIOS)
- **Command:** `/squad-create`
- **Agent:** @squad-creator
