# S01: Story Lifecycle E2E Test

> **Epic**: EPIC-08 E2E Validation & Documentation
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: EPIC-01 through EPIC-04

---

## Objective

Validate the complete story lifecycle end-to-end: /plan generates a story-driven plan → /start-work triggers @build → @build delegates to @pm (PRD) → @sm (stories) → @dev (implementation) → @qa (review) → @devops (push). This is the golden path for story-driven development.

## Tasks

- [ ] Create E2E test scenario: "Implement a simple feature using story-driven flow"
- [ ] Mock agents with simplified prompts (no real LLM calls needed for structure validation)
- [ ] Verify: /plan produces plan with stories
- [ ] Verify: /start-work reads plan and starts Wave 1
- [ ] Verify: @build delegates to correct executors per plan items
- [ ] Verify: story_update tool called to update checkboxes
- [ ] Verify: story-lifecycle hook enforces valid state transitions
- [ ] Verify: quality-gate triggers @qa after story completion
- [ ] Verify: agent-authority blocks unauthorized file writes
- [ ] Verify: final story status = DONE

## Acceptance Criteria

- [ ] Full lifecycle executes without errors
- [ ] State transitions follow: DRAFT → READY → IN_PROGRESS → REVIEW → DONE
- [ ] All hooks fire at correct points
- [ ] Test passes in CI (`bun test`)

## Files

```
tests/e2e/
  story-lifecycle.test.ts    ← NEW
```
