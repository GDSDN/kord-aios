# S01: Extend Boulder State with Story/Wave/Executor Fields

> **Epic**: EPIC-03 Build Orchestration Engine
> **Status**: Draft
> **Estimate**: 3h
> **Agent**: @dev
> **Dependencies**: EPIC-02 S01 (shared types)

---

## Objective

Extend the existing boulder state (background agent context) with new fields for story-driven execution: plan_type, current_wave, wave_items, executor, squad_id, and task_hierarchy. These fields enable the build hook to track progress through a plan's waves.

## Tasks

- [ ] Define extended boulder state interface importing shared types (PlanType, Wave, TaskHierarchy)
- [ ] Add optional fields: `plan_type`, `current_wave`, `wave_items`, `executor`, `squad_id`, `task_hierarchy`, `plan_path`
- [ ] Ensure backward compatibility: all new fields are optional (existing boulder state still works)
- [ ] Update boulder state serialization/deserialization to handle new fields
- [ ] Add tests for: new fields present, new fields absent (backward compat), serialization roundtrip
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Extended boulder state type defined and exported
- [ ] All new fields optional (backward compatible)
- [ ] Serialization/deserialization handles new fields
- [ ] Existing boulder state tests still pass

## Files

```
src/
  shared/types/
    boulder-ext.ts          ← NEW (extended boulder state fields)
  features/
    background-agent/
      manager.ts            ← MODIFY (use extended state type, preserve backward compat)
      *.test.ts             ← UPDATE
```
