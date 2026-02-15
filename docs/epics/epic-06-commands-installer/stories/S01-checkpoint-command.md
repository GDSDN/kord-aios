# S01: Implement /checkpoint Command

> **Epic**: EPIC-06 Commands & Installer
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Implement the `/checkpoint` slash command that manually triggers a @po checkpoint decision. This allows users to pause execution and request a checkpoint review at any point, not just between waves.

## Tasks

- [ ] Create command template: `src/features/builtin-commands/templates/checkpoint.ts`
- [ ] Register command in `commands.ts`
- [ ] Command behavior: delegate to @po with current execution context (boulder state summary)
- [ ] @po receives: completed items, pending items, current wave, issues encountered
- [ ] @po responds with: GO, PAUSE, REVIEW, or ABORT recommendation
- [ ] Add co-located test
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] `/checkpoint` command registered and invokable
- [ ] Delegates to @po with execution context
- [ ] Works both inside and outside build loop
- [ ] Test covers command registration and delegation

## Files

```
src/features/builtin-commands/
  templates/checkpoint.ts  ← NEW
  commands.ts              ← MODIFY (register)
```
