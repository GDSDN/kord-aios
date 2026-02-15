# S02: Implement story-lifecycle Hook

> **Epic**: EPIC-04 Authority & Quality System
> **Status**: Draft
> **Estimate**: 5h
> **Agent**: @dev
> **Dependencies**: EPIC-02 S01 (shared types — StoryStatus)

---

## Objective

Implement the story-lifecycle hook that enforces the story state machine: DRAFT → READY → IN_PROGRESS → REVIEW → DONE. This hook is opt-in — only active when boulder state has `plan_type: 'story-driven'`. It prevents invalid state transitions and ensures stories follow the defined lifecycle.

## Tasks

- [ ] Create hook directory: `src/hooks/story-lifecycle/`
- [ ] Implement `createStoryLifecycleHook()` factory
- [ ] Define state machine transitions in constants
- [ ] Hook point: `tool.execute.before` on story_update tool (when action = set_status)
- [ ] Validate transition: only allow valid state changes (e.g., IN_PROGRESS → REVIEW, not IN_PROGRESS → DRAFT)
- [ ] Dormant when `plan_type !== 'story-driven'` (check boulder state)
- [ ] Block invalid transitions with clear error: "Cannot transition story from X to Y"
- [ ] Allow force-override via config flag (for recovery scenarios)
- [ ] Track who transitions: @sm creates (DRAFT→READY), @dev implements (READY→IN_PROGRESS→REVIEW), @qa reviews (REVIEW→DONE)
- [ ] Create co-located tests
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Valid transitions allowed: DRAFT→READY, READY→IN_PROGRESS, IN_PROGRESS→REVIEW, REVIEW→DONE, REVIEW→IN_PROGRESS (NEEDS_WORK)
- [ ] Invalid transitions blocked with clear error
- [ ] Hook dormant in task-driven mode
- [ ] Force-override config works
- [ ] Tests cover: all valid transitions, invalid transitions, dormant mode, force-override

## Files

```
src/hooks/
  story-lifecycle/
    index.ts                    ← NEW
    types.ts                    ← NEW (state machine)
    constants.ts                ← NEW (valid transitions)
    story-lifecycle.test.ts     ← NEW
```
