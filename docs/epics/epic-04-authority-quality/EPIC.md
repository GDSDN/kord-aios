# EPIC-04: Authority & Quality System

> **Wave**: B (after EPIC-02 interfaces are defined)
> **Scope**: `src/hooks/agent-authority/`, `quality-gate/`, `story-lifecycle/`, `decision-logger/`
> **Estimate**: ~18h
> **Parallel OK with**: EPIC-03, EPIC-06
> **Prerequisites**: EPIC-02 S01 (shared types must exist)

---

## Objective

Implement the enforcement layer: agent file/git permission checking, story state machine lifecycle, QA quality gate review trigger, and decision logging. These hooks ensure agents operate within their authority and that quality gates are respected.

## Source Documents

- `docs/researches/kord-aios-contracts.md` — file authority matrix, delegation rules
- `docs/researches/kord-aios-tools-hooks-commands.md` §1 — hook decisions
- `docs/researches/kord-aios-skills-templates-scripts.md` §6 — constitution articles

## Acceptance Criteria

- [x] agent-authority hook blocks file writes outside agent's permitted paths
- [x] agent-authority hook blocks git push for non-@devops agents
- [x] story-lifecycle hook enforces state machine: DRAFT → READY → IN_PROGRESS → REVIEW → DONE
- [x] story-lifecycle hook is dormant when not in story-driven mode
- [x] quality-gate hook triggers @qa review after story execution
- [x] quality-gate hook enforces: quality gate agent ≠ executor agent
- [x] quality-gate hook supports max 2 NEEDS_WORK iterations before escalation
- [x] decision-logger hook records architectural decisions to designated path
- [x] All hooks have co-located tests
- [x] All existing tests pass (`bun test`)

## Stories

| ID | Story | Estimate | Dependencies |
|----|-------|----------|-------------|
| S01 | Implement agent-authority hook (file + git permission enforcement) | 5h | None |
| S02 | Implement story-lifecycle hook (story state machine) | 5h | EPIC-02 S01 |
| S03 | Implement quality-gate hook (QA review trigger + iteration limit) | 5h | EPIC-02 S01 |
| S04 | Implement decision-logger hook | 3h | None |

## File Ownership

```
src/hooks/
  agent-authority/       ← NEW (file path check, git operation check)
    index.ts
    types.ts
    constants.ts         ← agent→path permission map
    agent-authority.test.ts
  story-lifecycle/       ← NEW (state machine enforcement)
    index.ts
    types.ts
    constants.ts         ← state transitions
    story-lifecycle.test.ts
  quality-gate/          ← NEW (QA review trigger)
    index.ts
    types.ts
    constants.ts
    quality-gate.test.ts
  decision-logger/       ← NEW (ADR append)
    index.ts
    decision-logger.test.ts
```

## Notes

- agent-authority uses `tool.execute.before` hook point to intercept write/edit/bash tools
- story-lifecycle is opt-in: only active when boulder state has `plan_type: 'story-driven'`
- quality-gate must check that the reviewer agent differs from the executor (constitutional rule)
- decision-logger is low priority within this epic — can be deferred if time-boxed
