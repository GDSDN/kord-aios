# S01: Adapt 5 Computation Scripts for .kord/scripts/

> **Epic**: EPIC-07 Computation Scripts & Templates
> **Status**: Draft
> **Estimate**: 3h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Adapt the 5 AIOS computation scripts for standalone execution in `.kord/scripts/`. Remove AIOS-specific paths, update require() references, add CLI --help support, ensure each script can run independently with `node .kord/scripts/<script>.js`.

## Tasks

- [ ] Adapt `code-quality-improver.js` (1312 lines): remove AIOS paths, add CLI entry point
- [ ] Adapt `refactoring-suggester.js` (1139 lines): remove AIOS paths, add CLI entry point
- [ ] Adapt `performance-analyzer.js` (758 lines): remove AIOS paths, add CLI entry point
- [ ] Adapt `test-generator.js` (844 lines): remove AIOS paths, add CLI entry point
- [ ] Adapt `pattern-learner.js` (1225 lines): remove AIOS paths, add CLI entry point
- [ ] Each script: add `--help` flag, `--target <path>` flag, `--format json|text` flag
- [ ] Each script: add `if (require.main === module)` CLI entry point
- [ ] Each script: update internal require() paths to be self-contained within .kord/scripts/
- [ ] Test each script: `node .kord/scripts/<script>.js --help` works

## Acceptance Criteria

- [ ] All 5 scripts placed in `.kord/scripts/`
- [ ] Each script runs standalone: `node .kord/scripts/<script>.js --help`
- [ ] No AIOS-specific paths or references remain
- [ ] Each script has CLI entry point with --target and --format flags

## Files

```
.kord/scripts/
  code-quality-improver.js      ← ADAPT from synkra-aios
  refactoring-suggester.js      ← ADAPT from synkra-aios
  performance-analyzer.js       ← ADAPT from synkra-aios
  test-generator.js             ← ADAPT from synkra-aios
  pattern-learner.js            ← ADAPT from synkra-aios
```
