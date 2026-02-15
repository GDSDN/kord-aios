# S03: Implement quality-gate Hook

> **Epic**: EPIC-04 Authority & Quality System
> **Status**: Draft
> **Estimate**: 5h
> **Agent**: @dev
> **Dependencies**: EPIC-02 S01 (shared types)

---

## Objective

Implement the quality-gate hook that triggers @qa review after story/task execution. After an executor completes a work item, this hook delegates a review to the designated quality gate agent. The quality gate agent is ALWAYS different from the executor (constitutional rule). Supports max 2 NEEDS_WORK iterations before escalation.

## Tasks

- [ ] Create hook directory: `src/hooks/quality-gate/`
- [ ] Implement `createQualityGateHook()` factory
- [ ] Hook point: called by build hook after executor completes a story/task
- [ ] Resolve quality gate agent from plan item metadata (`quality_gate` field)
- [ ] Enforce: quality_gate agent ≠ executor agent (block if same)
- [ ] Delegate review to quality gate agent with completed work context
- [ ] Handle review verdicts: APPROVED, NEEDS_WORK, REJECT
- [ ] APPROVED: mark item complete, continue to next
- [ ] NEEDS_WORK: re-delegate to executor (max 2 iterations, then escalate)
- [ ] REJECT: pause execution, notify user
- [ ] Track iteration count in boulder state
- [ ] Create co-located tests
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Quality gate triggers after story/task completion
- [ ] Quality gate agent ≠ executor (enforced, blocks if violated)
- [ ] APPROVED flow works (item marked done)
- [ ] NEEDS_WORK loop works (max 2 iterations)
- [ ] REJECT pauses execution
- [ ] Escalation after 2 NEEDS_WORK iterations
- [ ] Tests cover: all 3 verdicts, iteration limit, executor≠gate check

## Files

```
src/hooks/
  quality-gate/
    index.ts                ← NEW
    types.ts                ← NEW (ReviewVerdict enum)
    constants.ts            ← NEW
    quality-gate.test.ts    ← NEW
```
