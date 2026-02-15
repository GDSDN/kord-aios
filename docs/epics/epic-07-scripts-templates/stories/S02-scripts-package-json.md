# S02: Create .kord/scripts/package.json

> **Epic**: EPIC-07 Computation Scripts & Templates
> **Status**: Draft
> **Estimate**: 0.5h
> **Agent**: @dev
> **Dependencies**: S01 (scripts must be adapted first to know exact deps)

---

## Objective

Create a package.json for `.kord/scripts/` with all required npm dependencies for the 5 computation scripts. Users run `npm install` once after `kord install` to set up script dependencies.

## Tasks

- [ ] Audit all 5 adapted scripts for `require()` statements
- [ ] Create `package.json` with all dependencies and pinned versions
- [ ] Known deps: `@babel/parser`, `@babel/traverse`, `@babel/generator`, `@babel/types`, `eslint`, `prettier`, `jscodeshift`, `js-yaml`, `chalk`
- [ ] Add `name: "@kord-aios/scripts"`, `private: true`
- [ ] Verify `npm install` succeeds in `.kord/scripts/`

## Acceptance Criteria

- [ ] `package.json` exists with all required deps
- [ ] `npm install` in `.kord/scripts/` succeeds
- [ ] All 5 scripts run after install

## Files

```
.kord/scripts/
  package.json    ← NEW
```
