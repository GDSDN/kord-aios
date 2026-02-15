# S02: Implement /status Command

> **Epic**: EPIC-06 Commands & Installer
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: EPIC-02 (plan_read types)

---

## Objective

Implement the `/status` slash command that shows current plan execution progress: current wave, completed/pending items, active executor, story statuses, and overall progress percentage.

## Tasks

- [ ] Create command template: `src/features/builtin-commands/templates/status.ts`
- [ ] Register command in `commands.ts`
- [ ] Read boulder state for current execution context
- [ ] Read plan document via plan_read for item statuses
- [ ] Format output: wave progress, item completion %, active items, blocked items
- [ ] Handle: no active plan (show "No plan in progress"), active plan with waves, active plan without waves
- [ ] Add co-located test
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] `/status` command registered and invokable
- [ ] Shows wave progress when plan is active
- [ ] Shows "No plan in progress" when no plan
- [ ] Includes completion percentage
- [ ] Test covers: active plan, no plan

## Files

```
src/features/builtin-commands/
  templates/status.ts  ← NEW
  commands.ts          ← MODIFY (register)
```
