# S04: Agent Authority E2E Test

> **Epic**: EPIC-08 E2E Validation & Documentation
> **Status**: Draft
> **Estimate**: 1h
> **Agent**: @dev
> **Dependencies**: EPIC-04 S01

---

## Objective

Validate that the agent-authority hook correctly enforces file and git permissions across all agents. Verify that unauthorized operations are blocked with clear error messages.

## Tasks

- [ ] Create E2E test scenarios for permission enforcement:
  - @pm attempts to write to `src/` → BLOCKED
  - @dev writes to `src/` → ALLOWED
  - @dev attempts `git push` → BLOCKED
  - @devops performs `git push` → ALLOWED
  - @plan-analyzer attempts any write → BLOCKED (read-only)
  - @architect writes to `docs/kord/architecture/` → ALLOWED
  - @architect writes to `src/` → BLOCKED
- [ ] Verify error messages are clear and actionable
- [ ] Verify config allowlist override works (temporarily grant permission)

## Acceptance Criteria

- [ ] All permission scenarios pass (blocked when should block, allowed when should allow)
- [ ] Error messages include agent name and target path
- [ ] Config allowlist override works
- [ ] Test passes in CI (`bun test`)

## Files

```
tests/e2e/
  agent-authority.test.ts    ← NEW
```
