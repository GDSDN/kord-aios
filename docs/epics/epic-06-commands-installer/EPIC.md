# EPIC-06: Commands & Installer

> **Wave**: B (after EPIC-01 and EPIC-02 are substantially complete)
> **Scope**: `src/features/builtin-commands/`, `src/cli/`, `src/config/schema.ts`
> **Estimate**: ~10h
> **Parallel OK with**: EPIC-03, EPIC-04
> **Prerequisites**: EPIC-01 (agent names finalized), ~~EPIC-02 (tool names finalized)~~ ✅ DONE

---

## Objective

Implement new slash commands (/checkpoint, /status, /squad), refactor /init-deep with Kord AIOS context (agents, skills, squads), update the CLI installer to create the .kord/ directory structure, and consolidate all config schema changes from other epics.

> **NOTE**: `/init` is a native OpenCode command — do NOT create a new `/init`. Refactor the existing `/init-deep` instead.

## Source Documents

- `docs/researches/kord-aios-tools-hooks-commands.md` §3 — command decisions
- `docs/researches/kord-aios-master-decision.md` §2.5 — command summary
- `docs/researches/kord-aios-star-commands-scripts-investigation.md` §3 — star commands hybrid

## Acceptance Criteria

- [ ] `/checkpoint` command triggers @po checkpoint decision
- [ ] `/status` command shows current plan progress, wave, pending items
- [ ] `/squad [name]` command switches active squad context
- [ ] `/init-deep` refactored with Kord AIOS awareness (agents, skills, squads)
- [ ] CLI installer creates `.kord/` directory with templates, checklists, scripts subdirs
- [ ] Config schema updated with all new fields from EPIC-02/03/04
- [ ] All commands have co-located tests
- [ ] All existing tests pass (`bun test`)

## Stories

| ID | Story | Estimate | Dependencies |
|----|-------|----------|-------------|
| S01 | Implement /checkpoint command | 2h | None |
| S02 | Implement /status command | 2h | ~~EPIC-02~~ ✅ (plan_read types ready) |
| S03 | Implement /squad command | 1h | ~~EPIC-02~~ ✅ (squad types ready) |
| S04 | Refactor /init-deep with Kord AIOS context | 2h | None |
| S05 | Update CLI installer for .kord/ directory structure | 2h | EPIC-07 (know what to install) |
| S06 | Consolidate config schema changes | 1h | EPIC-02, EPIC-03, EPIC-04 |

## File Ownership

```
src/
  features/
    builtin-commands/
      templates/
        checkpoint.ts    ← NEW
        status.ts        ← NEW
        squad.ts         ← NEW
        init-deep.ts     ← MODIFY (refactor with Kord AIOS context)
      commands.ts        ← MODIFY (register new commands)
  cli/
    install.ts           ← MODIFY (add .kord/ directory creation)
  config/
    schema.ts            ← MODIFY (add story/wave/squad/authority config fields)
```

## Notes

- /status reads from boulder state + plan document — plan_read types from EPIC-02 ✅ already available
- `/init` is a **native OpenCode command** — do NOT override it. Refactor `/init-deep` instead.
- /init-deep already generates AGENTS.md — add Kord AIOS awareness (agent list, skill catalog, squad info)
- Config schema consolidation (S06) should be the LAST story — collects all new fields from other epics
- CLI installer changes should be coordinated with EPIC-07 (which defines what goes in .kord/)
- `.kord/scripts` uses Bun for dependency installs (use `bun install`, not npm/yarn)
- S02/S03 can now use actual plan_read/squad_load tool APIs (EPIC-02 is implemented)
