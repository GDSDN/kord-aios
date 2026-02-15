# S02: Create @plan-analyzer Agent

> **Epic**: EPIC-01 Agent Foundation
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Create the @plan-analyzer agent (renamed from metis). This is a plan-internal agent that @plan delegates to during planning for gap analysis and ambiguity detection. Import the full metis prompt, rename to plan-analyzer, and refocus the prompt on planning-phase analysis.

## Tasks

- [ ] Copy `metis.ts` → create `plan-analyzer.ts`
- [ ] Update agent identity: name, promptAlias, description
- [ ] Refocus prompt on planning-phase analysis (gap detection, ambiguity identification, requirement completeness)
- [ ] Remove mythology references (Metis, Titan, etc.)
- [ ] Add `category: 'plan-internal'` metadata to distinguish from user-facing agents
- [ ] Register in `agentSources` map in `utils.ts`
- [ ] Add co-located test file `plan-analyzer.test.ts`
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] `plan-analyzer.ts` exists with full prompt (not skeleton)
- [ ] Agent registered in `agentSources` with `plan-internal` category
- [ ] Zero mythology references
- [ ] Test verifies agent definition structure

## Files

```
src/agents/
  metis.ts             → basis for plan-analyzer.ts
  plan-analyzer.ts     ← NEW
  plan-analyzer.test.ts ← NEW
  utils.ts             ← MODIFY (register)
```
