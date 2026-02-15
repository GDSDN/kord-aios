# S05: Implement wave-checkpoint Hook

> **Epic**: EPIC-03 Build Orchestration Engine
> **Status**: Draft
> **Estimate**: 5h
> **Agent**: @dev
> **Dependencies**: S02 (build hook triggers checkpoint between waves)

---

## Objective

Implement the wave-checkpoint hook that triggers @po checkpoint decisions between waves. After all items in a wave complete, this hook pauses execution and presents a checkpoint: GO (continue to next wave), PAUSE (wait for user), REVIEW (re-evaluate plan), or ABORT (stop execution).

## Tasks

- [ ] Create hook directory: `src/hooks/wave-checkpoint/`
- [ ] Implement `createWaveCheckpointHook()` factory
- [ ] Define checkpoint actions: GO, PAUSE, REVIEW, ABORT
- [ ] Hook point: called by build hook after wave completion
- [ ] In `interactive` mode: delegate checkpoint decision to @po agent
- [ ] In `auto` mode: automatically GO to next wave (skip checkpoint)
- [ ] Present wave summary to @po: completed items, pending items, issues found
- [ ] Handle ABORT: clean up boulder state, report final status
- [ ] Handle REVIEW: pause and allow plan modification before continuing
- [ ] Configuration: `checkpoint_mode: 'auto' | 'interactive'` in config
- [ ] Create co-located tests
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Checkpoint triggers between waves in interactive mode
- [ ] @po receives wave summary and can decide GO/PAUSE/REVIEW/ABORT
- [ ] Auto mode skips checkpoint and continues
- [ ] ABORT cleanly stops execution
- [ ] Configuration respected from opencode.json
- [ ] Tests cover: all 4 actions, auto mode, interactive mode

## Files

```
src/hooks/
  wave-checkpoint/
    index.ts                    ← NEW (createWaveCheckpointHook factory)
    types.ts                    ← NEW (CheckpointAction enum)
    constants.ts                ← NEW
    wave-checkpoint.test.ts     ← NEW
```
