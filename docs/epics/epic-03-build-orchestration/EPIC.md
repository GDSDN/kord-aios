# EPIC-03: Build Orchestration Engine

> **Wave**: B (after EPIC-02 interfaces are defined)
> **Scope**: `src/hooks/build/`, `start-work/`, `executor-resolver/`, `wave-checkpoint/`, boulder state
> **Estimate**: ~25h
> **Status**: ✅ COMPLETE
> **Parallel OK with**: EPIC-04, EPIC-06
> **Prerequisites**: EPIC-02 S01 (shared types must exist) ✅

---

## Objective

Extend the build and start-work hooks to support story-driven execution with wave-based parallel stories, executor resolution from plan metadata, and checkpoint decisions. Implement the full @build autonomous loop: read plan → resolve executor → delegate → verify → checkpoint → next.

## Source Documents

- `docs/researches/kord-aios-orchestration-model.md` — Option D architecture, phase flows
- `docs/researches/kord-aios-master-decision.md` §2.2 — orchestration summary
- `docs/researches/kord-aios-contracts.md` §2 — delegation contracts

## Acceptance Criteria

- [x] Boulder state extended with: `plan_type`, `current_wave`, `waves`, `executor` (S01)
- [x] Build hook parses plan document and iterates through waves (S02)
- [x] Build hook delegates to correct executor per plan item (S02)
- [x] Start-work hook supports discovery mode (no args → scan pending) (pre-existing)
- [x] Start-work hook supports `--wave`, `--squad` parameters (S03)
- [x] executor-resolver hook loads correct skill based on plan item metadata (S04)
- [x] wave-checkpoint hook triggers @po checkpoint between waves (S05)
- [x] All hooks have co-located tests (141 tests across 6 files)
- [x] All existing tests pass (`bun test`)

## Stories

| ID | Story | Estimate | Dependencies | Status |
|----|-------|----------|-------------|--------|
| S01 | Extend boulder state with story/wave/executor fields | 3h | EPIC-02 S01 | ✅ Done |
| S02 | Extend build/ hook for story/task/wave parsing and executor delegation | 8h | S01 | ✅ Done |
| S03 | Extend start-work/ hook for discovery mode and extended params | 4h | S01 | ✅ Done |
| S04 | Implement executor-resolver hook (auto-skill loading from plan metadata) | 5h | S02 | ✅ Done |
| S05 | Implement wave-checkpoint hook (@po checkpoint between waves) | 5h | S02 | ✅ Done |

## File Ownership

```
src/
  hooks/
    build/               ← MODIFY (story/task/wave parsing, executor delegation)
    start-work/          ← MODIFY (discovery mode, --wave/--squad params)
    executor-resolver/   ← NEW (resolve executor + load skill from plan item)
    wave-checkpoint/     ← NEW (@po checkpoint trigger between waves)
  features/
    background-agent/    ← MODIFY (boulder state extension — coordinated with existing)
  shared/types/
    boulder-ext.ts       ← NEW (extended boulder state fields — imports from EPIC-02 types)
```

## Notes

- Build hook is the largest change (~8h) — it orchestrates the entire execution phase
- executor-resolver hook needs access to the skill catalog to know which skill to load for which executor
- wave-checkpoint can be configured: `auto` (skip checkpoints) or `interactive` (ask user via @po)
- Discovery mode: start-work without args should scan `docs/kord/plans/` for pending items
