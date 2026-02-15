# S04: Implement decision-logger Hook

> **Epic**: EPIC-04 Authority & Quality System
> **Status**: Draft
> **Estimate**: 3h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Implement the decision-logger hook that records architectural and design decisions to a designated ADR (Architecture Decision Record) path. When agents make significant decisions during execution, this hook appends a structured record to the decision log.

## Tasks

- [ ] Create hook directory: `src/hooks/decision-logger/`
- [ ] Implement `createDecisionLoggerHook()` factory
- [ ] Hook point: explicit call from agents (not automatic on every tool)
- [ ] Define decision record format: timestamp, agent, context, decision, rationale, alternatives considered
- [ ] Write to `docs/kord/adrs/` in structured markdown format
- [ ] Auto-increment decision ID (scan existing ADRs for next number)
- [ ] Create co-located tests
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Decision records written as structured markdown to docs/kord/adrs/
- [ ] Auto-incrementing ID (ADR-001, ADR-002, etc.)
- [ ] Record includes: timestamp, agent, context, decision, rationale
- [ ] Tests cover: first ADR, subsequent ADR (incrementing), malformed directory

## Files

```
src/hooks/
  decision-logger/
    index.ts                    ← NEW
    types.ts                    ← NEW (DecisionRecord type)
    decision-logger.test.ts     ← NEW
```
