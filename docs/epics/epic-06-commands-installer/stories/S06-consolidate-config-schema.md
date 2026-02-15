# S06: Consolidate Config Schema Changes

> **Epic**: EPIC-06 Commands & Installer
> **Status**: Draft
> **Estimate**: 1h
> **Agent**: @dev
> **Dependencies**: EPIC-02, EPIC-03, EPIC-04 (all schema-impacting epics)

---

## Objective

Consolidate all config schema changes from other epics into `src/config/schema.ts`. This is the single point where Zod schema modifications happen, avoiding cross-epic conflicts on this shared file.

## Tasks

- [ ] Collect all new config fields needed from EPIC-02 (story/plan types), EPIC-03 (wave/checkpoint config), EPIC-04 (authority config)
- [ ] Add to schema.ts: `storyLifecycle` config section (enabled, forceOverride)
- [ ] Add to schema.ts: `waveCheckpoint` config section (mode: auto|interactive)
- [ ] Add to schema.ts: `agentAuthority` config section (enabled, allowlist overrides)
- [ ] Add to schema.ts: `executorResolver` config section (executor→skill mapping overrides)
- [ ] Add to schema.ts: `squad` config section (default squad, squad search paths)
- [ ] Run `bun run build:schema` to regenerate schema
- [ ] Run `bun run typecheck` — clean
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] All new config fields added to Zod schema
- [ ] Schema generation passes
- [ ] Type check clean
- [ ] All tests pass

## Files

```
src/config/
  schema.ts    ← MODIFY (add new config sections)
```

## Dev Notes

- This MUST be the last story executed in EPIC-06 — it depends on all other epics finalizing their config needs
- Run `bun run build:schema` after changes to regenerate the JSON schema
- Keep changes additive (optional fields with defaults) to maintain backward compatibility
