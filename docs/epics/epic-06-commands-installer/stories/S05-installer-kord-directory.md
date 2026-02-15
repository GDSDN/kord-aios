# S05: Update CLI Installer for .kord/ Directory Structure

> **Epic**: EPIC-06 Commands & Installer
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: EPIC-07 (must know what files to install)

---

## Objective

Update the Kord AIOS CLI installer to create the `.kord/` directory structure during `kord install`. This includes templates, checklists, scripts subdirectories, and their contents from EPIC-07.

## Tasks

- [ ] Add `.kord/` directory creation to installer flow
- [ ] Create subdirectories: `scripts/`, `templates/`, `checklists/`, `skills/`
- [ ] Copy template files from plugin's bundled assets to `.kord/templates/`
- [ ] Copy checklist files to `.kord/checklists/`
- [ ] Copy computation scripts to `.kord/scripts/` (including package.json)
- [ ] Prompt user to run `npm install` in `.kord/scripts/` (or auto-run if configured)
- [ ] Handle re-install: detect existing `.kord/`, offer merge/overwrite/skip
- [ ] Update installer tests
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] `kord install` creates complete `.kord/` directory structure
- [ ] All template, checklist, and script files present after install
- [ ] Re-install handles existing `.kord/` gracefully
- [ ] Tests cover: fresh install, re-install

## Files

```
src/cli/
  install.ts           ← MODIFY (add .kord/ directory creation)
  *.test.ts            ← UPDATE
```
