# S03: Create @plan-reviewer Agent

> **Epic**: EPIC-01 Agent Foundation
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Create the @plan-reviewer agent (renamed from momus). This is a plan-internal agent that @plan delegates to for plan review, blocker identification, and feasibility validation. Import the full momus prompt, rename to plan-reviewer, and refocus on planning-phase review.

## Tasks

- [ ] Copy `momus.ts` → create `plan-reviewer.ts`
- [ ] Update agent identity: name, promptAlias, description
- [ ] Refocus prompt on plan review (blocker finding, feasibility check, scope validation, risk assessment)
- [ ] Remove mythology references (Momus, god of criticism, etc.)
- [ ] Add `category: 'plan-internal'` metadata
- [ ] Register in `agentSources` map in `utils.ts`
- [ ] Add co-located test file `plan-reviewer.test.ts`
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] `plan-reviewer.ts` exists with full prompt (not skeleton)
- [ ] Agent registered in `agentSources` with `plan-internal` category
- [ ] Zero mythology references
- [ ] Test verifies agent definition structure

## Files

```
src/agents/
  momus.ts              → basis for plan-reviewer.ts
  plan-reviewer.ts      ← NEW
  plan-reviewer.test.ts ← NEW
  utils.ts              ← MODIFY (register)
```
