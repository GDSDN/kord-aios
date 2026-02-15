# S03: Squad Override E2E Test

> **Epic**: EPIC-08 E2E Validation & Documentation
> **Status**: Draft
> **Estimate**: 1h
> **Agent**: @dev
> **Dependencies**: EPIC-02 S06, EPIC-03

---

## Objective

Validate that a custom squad overrides the default agent composition, plan format, and execution rules. A marketing squad should use different agents and skip story-driven enforcement.

## Tasks

- [ ] Create mock SQUAD.yaml for "marketing" squad (custom agent list, task-driven plan format)
- [ ] Verify: `/squad marketing` loads the squad manifest
- [ ] Verify: `/plan` generates task-driven plan (not story-driven) when squad is active
- [ ] Verify: story-lifecycle hook is dormant (plan_type != story-driven)
- [ ] Verify: boulder state has correct squad_id
- [ ] Verify: @build delegates to squad-specific agents

## Acceptance Criteria

- [ ] Squad loading changes active agent composition
- [ ] Plan format adapts to squad definition
- [ ] Story-lifecycle hook dormant for non-dev squads
- [ ] Test passes in CI (`bun test`)

## Files

```
tests/e2e/
  squad-override.test.ts    ← NEW
  fixtures/
    marketing-squad.yaml    ← NEW (test fixture)
```
