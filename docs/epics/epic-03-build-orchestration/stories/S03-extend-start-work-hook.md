# S03: Extend Start-Work Hook for Discovery Mode

> **Epic**: EPIC-03 Build Orchestration Engine
> **Status**: Draft
> **Estimate**: 4h
> **Agent**: @dev
> **Dependencies**: S01 (boulder state extension)

---

## Objective

Extend the start-work/ hook to support discovery mode (no args → scan for pending work), `--wave` parameter (start at specific wave), and `--squad` parameter (load squad context). Discovery mode scans `docs/kord/plans/` for plans with pending items.

## Tasks

- [ ] Add discovery mode: when `/start-work` invoked without args, scan for pending plan items
- [ ] Scan `docs/kord/plans/` for plan files with pending items (status ≠ DONE)
- [ ] If multiple pending plans found, present list and let user choose
- [ ] If single pending plan, auto-select and start execution
- [ ] Add `--wave N` parameter: start execution at wave N (skip earlier waves)
- [ ] Add `--squad NAME` parameter: load squad manifest before execution
- [ ] Populate extended boulder state fields from plan metadata
- [ ] Update existing start-work tests + add discovery mode tests
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] `/start-work` without args scans and finds pending plans
- [ ] `/start-work plan.md` works as before (explicit plan path)
- [ ] `--wave 2` skips Wave 1, starts at Wave 2
- [ ] `--squad marketing` loads marketing squad manifest
- [ ] Boulder state populated with plan_type, plan_path, squad_id
- [ ] Tests cover: no args (discovery), explicit path, --wave, --squad

## Files

```
src/hooks/
  start-work/
    index.ts         ← MODIFY (discovery mode, --wave, --squad)
    *.test.ts        ← UPDATE + NEW tests
```
