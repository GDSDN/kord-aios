# S03: Implement /squad Command

> **Epic**: EPIC-06 Commands & Installer
> **Status**: Draft
> **Estimate**: 1h
> **Agent**: @dev
> **Dependencies**: EPIC-02 (squad types)

---

## Objective

Implement the `/squad [name]` slash command that switches the active squad context. This loads a SQUAD.yaml manifest and adjusts agent composition, plan format, and execution rules for the specified domain.

## Tasks

- [ ] Create command template: `src/features/builtin-commands/templates/squad.ts`
- [ ] Register command in `commands.ts`
- [ ] Command parameter: squad name (required)
- [ ] Use squad_load tool to load manifest
- [ ] Update boulder state with squad_id
- [ ] Show confirmation: loaded squad name, agent count, domain
- [ ] Handle missing squad: clear error message with available squads list
- [ ] Add co-located test
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] `/squad marketing` loads marketing squad
- [ ] Boulder state updated with squad_id
- [ ] Missing squad shows helpful error
- [ ] Test covers: valid squad, missing squad

## Files

```
src/features/builtin-commands/
  templates/squad.ts  ← NEW
  commands.ts         ← MODIFY (register)
```
