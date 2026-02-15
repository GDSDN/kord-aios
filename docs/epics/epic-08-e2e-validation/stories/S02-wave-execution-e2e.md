# S02: Wave Execution E2E Test

> **Epic**: EPIC-08 E2E Validation & Documentation
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: EPIC-03

---

## Objective

Validate multi-wave plan execution end-to-end: a plan with 3 waves, @po checkpoint between each wave, and proper wave progression tracking in boulder state.

## Tasks

- [ ] Create E2E test scenario: "Execute a 3-wave development plan with checkpoints"
- [ ] Mock plan document with: Wave 1 (docs), Wave 2 (implementation), Wave 3 (delivery)
- [ ] Verify: @build processes all Wave 1 items before moving to Wave 2
- [ ] Verify: wave-checkpoint hook fires between waves
- [ ] Verify: @po checkpoint decision respected (GO continues, PAUSE stops)
- [ ] Verify: boulder state tracks current_wave progression (1 → 2 → 3)
- [ ] Verify: /status command shows correct wave progress at each point
- [ ] Test both `auto` and `interactive` checkpoint modes

## Acceptance Criteria

- [ ] 3-wave plan executes in correct order
- [ ] Checkpoints fire between waves
- [ ] Boulder state tracks wave progression
- [ ] Auto mode skips checkpoints, interactive mode pauses
- [ ] Test passes in CI (`bun test`)

## Files

```
tests/e2e/
  wave-execution.test.ts    ← NEW
```
