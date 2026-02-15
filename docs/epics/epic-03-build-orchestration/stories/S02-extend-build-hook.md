# S02: Extend Build Hook for Story/Task/Wave Parsing

> **Epic**: EPIC-03 Build Orchestration Engine
> **Status**: Draft
> **Estimate**: 8h
> **Agent**: @dev
> **Dependencies**: S01 (boulder state extension)

---

## Objective

Extend the existing build/ hook (atlas orchestration) to support story-driven and task-driven execution with wave-based iteration. The build hook reads the plan document, iterates through waves, delegates each item to the designated executor, tracks completion, and handles story vs task modes.

## Tasks

- [ ] Read plan document via plan_read tool at build start
- [ ] Determine plan_type from plan metadata (story-driven, task-driven, research)
- [ ] Iterate through waves sequentially (Wave 1 → Wave 2 → ...)
- [ ] For each wave item: resolve executor from plan item metadata
- [ ] Delegate to executor via delegate-task with executor + story_path params
- [ ] Track item completion status in boulder state
- [ ] After wave completion: trigger wave-checkpoint (if configured)
- [ ] Handle plan scope: docs-only plans stop after doc generation wave, end-to-end runs all waves
- [ ] Prefer @dev-junior for atomic tasks, reserve @dev for complex multi-file work
- [ ] Update existing build hook tests + add new wave iteration tests
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Build hook reads and parses plan document at start
- [ ] Wave iteration works: processes all items in Wave 1 before moving to Wave 2
- [ ] Executor delegation uses plan metadata (not just category heuristics)
- [ ] Story-driven mode: delegates stories to @dev/@dev-junior with story_path
- [ ] Task-driven mode: delegates tasks directly
- [ ] Boulder state tracks current wave and completion progress
- [ ] Existing build hook behavior preserved when no plan document present
- [ ] Tests cover: story-driven plan, task-driven plan, multi-wave execution

## Files

```
src/hooks/
  build/
    index.ts         ← MODIFY (add wave parsing, executor delegation)
    *.test.ts        ← UPDATE + NEW tests
```

## Dev Notes

- This is the largest single story (~8h) — consider splitting if needed during execution
- The build hook is `src/hooks/atlas/index.ts` (770 lines) — work carefully
- Existing SINGLE_TASK_DIRECTIVE behavior should be preserved within each wave item
- Wave checkpoint integration happens in S05 — this story just calls the checkpoint hook
