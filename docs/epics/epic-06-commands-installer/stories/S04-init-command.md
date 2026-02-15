# S04: Refactor /init-deep with Kord AIOS Context

> **Epic**: EPIC-06 Commands & Installer
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Refactor the existing `/init-deep` command to include Kord AIOS awareness. Currently it generates hierarchical AGENTS.md using explore agents + LSP codemap. After refactoring, it also includes: Kord AIOS agent list, installed skills catalog, squad definitions, available commands, and methodology references.

> **IMPORTANT**: `/init` is a native OpenCode command — do NOT create or override it. Only modify `/init-deep`.

## Tasks

- [ ] Update `init-deep.ts` template to add Kord AIOS context sections to generated AGENTS.md
- [ ] Add section: active agents (from agentSources registry — list names, roles, categories)
- [ ] Add section: installed skills (scan `.kord/skills/` + built-in skills)
- [ ] Add section: available commands (/plan, /start-work, /checkpoint, /status, /squad, /ralph-loop, etc.)
- [ ] Add section: squad definitions (scan `.kord/squads/` if present)
- [ ] Add section: methodology summary (story-driven development, wave execution, quality gates)
- [ ] Preserve existing discovery + analysis workflow (explore agents, LSP codemap)
- [ ] Update co-located test if exists
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] `/init-deep` generates AGENTS.md with Kord AIOS context sections
- [ ] AGENTS.md includes: agents, skills, commands, squads, methodology in addition to existing project analysis
- [ ] Existing /init-deep behavior preserved (discovery, scoring, generation phases)
- [ ] No new `/init` command created

## Files

```
src/features/builtin-commands/
  templates/init-deep.ts    ← MODIFY (add Kord AIOS context)
```
