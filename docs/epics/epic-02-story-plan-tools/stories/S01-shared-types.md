# S01: Define Shared Types

> **Epic**: EPIC-02 Story & Plan Tools
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Define the core TypeScript types that all story/plan tools and Wave B hooks depend on: StoryFile, StoryStatus, PlanDocument, PlanItem, Wave, TaskHierarchy, SquadManifest. These types must be stable — they are the contract between EPIC-02, EPIC-03, and EPIC-04.

## Tasks

- [ ] Create `src/shared/types/story.ts` with StoryFile, StoryStatus, StoryTask, StorySection types
- [ ] Create `src/shared/types/plan.ts` with PlanDocument, PlanItem, Wave, TaskHierarchy, PlanType types
- [ ] Create `src/shared/types/squad.ts` with SquadManifest, SquadConfig, SquadAgent types
- [ ] Export all types from `src/shared/types/index.ts` barrel
- [ ] Add JSDoc comments for all types
- [ ] Run `bun run typecheck` — clean

## Acceptance Criteria

- [ ] All types exported from `src/shared/types/`
- [ ] StoryStatus includes: DRAFT, READY, IN_PROGRESS, REVIEW, DONE
- [ ] PlanType includes: 'story-driven', 'task-driven', 'research'
- [ ] TaskHierarchy models: Plan → Epic → Story → Task containment
- [ ] Type check passes

## Files

```
src/shared/types/
  story.ts    ← NEW
  plan.ts     ← NEW
  squad.ts    ← NEW
  index.ts    ← MODIFY (add exports)
```
