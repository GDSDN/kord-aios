# S06: Implement squad_load Tool

> **Epic**: EPIC-02 Story & Plan Tools
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: S01 (shared types)

---

## Objective

Implement the `squad_load` tool that loads SQUAD.yaml manifests. Squads define non-default agent compositions, custom plan formats, and domain-specific execution rules (e.g., marketing squad, legal squad).

## Tasks

- [ ] Create tool directory: `src/tools/squad-load/`
- [ ] Implement `index.ts` with `createSquadLoadTool()` factory
- [ ] Create `types.ts` with tool-specific types (import shared SquadManifest)
- [ ] Create `constants.ts` with tool name, description
- [ ] Create `tools.ts` with tool definition (parameters: squad_name or squad_path)
- [ ] Parse SQUAD.yaml: agents, plan_format, execution_rules, config overrides
- [ ] Search paths: `.kord/squads/`, `docs/kord/squads/`
- [ ] Create `squad-load.test.ts` with test fixtures
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Tool registered and callable by agents
- [ ] Loads SQUAD.yaml from standard search paths
- [ ] Returns typed SquadManifest
- [ ] Handles missing squad file gracefully (error message, not crash)
- [ ] Tests cover: valid squad, missing squad, malformed YAML

## Files

```
src/tools/squad-load/
  index.ts           ← NEW (createSquadLoadTool factory)
  types.ts           ← NEW
  constants.ts       ← NEW
  tools.ts           ← NEW (tool definition)
  squad-load.test.ts ← NEW
```
