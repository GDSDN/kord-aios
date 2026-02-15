# EPIC-08: E2E Validation & Documentation

> **Wave**: C (after all other epics complete)
> **Scope**: `tests/e2e/`, `docs/`
> **Estimate**: ~8h
> **Parallel OK with**: None (integration testing requires all components)
> **Prerequisites**: EPIC-01 through EPIC-07

---

## Objective

Validate the complete Kord AIOS system end-to-end: story lifecycle flow, wave execution with checkpoints, squad override behavior, agent authority enforcement, and full system documentation. This is the final validation before the system is production-ready.

## Source Documents

- `docs/researches/kord-aios-master-decision.md` §4 Wave 6 — E2E additions
- All epic acceptance criteria — this epic verifies them in integration

## Acceptance Criteria

- [ ] Story lifecycle E2E: /plan → stories → /start-work → @dev develops → @qa reviews → @devops pushes
- [ ] Wave execution E2E: multi-wave plan with @po checkpoints between waves
- [ ] Squad override E2E: custom squad overrides plan format and execution
- [ ] Agent authority E2E: file permission enforcement verified across all agents
- [ ] Full system documentation updated (README, AGENTS.md, architecture docs)
- [ ] All tests pass: `bun test` (unit) + E2E scenarios
- [ ] `bun run validate` green

## Stories

| ID | Story | Estimate | Dependencies |
|----|-------|----------|-------------|
| S01 | Story lifecycle E2E test | 2h | All EPIC-01 to EPIC-04 |
| S02 | Wave execution E2E test | 2h | EPIC-03 |
| S03 | Squad override E2E test | 1h | EPIC-02 S06, EPIC-03 |
| S04 | Agent authority E2E test | 1h | EPIC-04 S01 |
| S05 | Final documentation update (README, AGENTS.md, architecture) | 2h | All |

## File Ownership

```
tests/
  e2e/
    story-lifecycle.test.ts      ← NEW
    wave-execution.test.ts       ← NEW
    squad-override.test.ts       ← NEW
    agent-authority.test.ts      ← NEW
docs/
  architecture/                  ← UPDATE (final architecture docs)
  README.md                      ← UPDATE
  AGENTS.md                      ← UPDATE
```

## Notes

- E2E tests may need mock agents or simplified prompts to run in CI
- Story lifecycle E2E is the most complex — covers the full plan→build→develop→review→push flow
- Documentation update should reference all epics and their outcomes
- This epic marks the transition from "migration" to "production-ready"
