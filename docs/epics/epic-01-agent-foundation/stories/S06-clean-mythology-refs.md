# S06: Clean Mythology/Persona References

> **Epic**: EPIC-01 Agent Foundation
> **Status**: Draft
> **Estimate**: 1h
> **Agent**: @dev
> **Dependencies**: S01-S05 (all agent updates must be done first)

---

## Objective

Final sweep across all agent files to remove any remaining Greek mythology, zodiac, or persona name references. This includes promptAlias values, inline comments, variable names, and string literals.

## Tasks

- [ ] Search all `src/agents/` files for: Sisyphus, Prometheus, Atlas, Hephaestus, Oracle, Metis, Momus, Titan, Greek, mythology, zodiac, Morgan, River, Pax
- [ ] Update all `promptAlias` values to role-based names (e.g., "Architect" not "Oracle")
- [ ] Remove mythology references from inline comments
- [ ] Verify no mythology refs leaked into `src/hooks/` or `src/tools/` delegation constants
- [ ] Run `bun test` — all tests pass
- [ ] Run branding validation (grep for stale refs)

## Acceptance Criteria

- [ ] Zero mythology/persona references in `src/agents/`
- [ ] Zero mythology/persona references in delegation constants
- [ ] Branding validation passes

## Files

```
src/agents/**/*.ts         ← SCAN + CLEAN
src/tools/delegate-task/constants.ts  ← VERIFY (agent name references)
src/hooks/**/index.ts      ← VERIFY (agent name references)
```
