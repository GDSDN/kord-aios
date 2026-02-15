# EPIC-07: Computation Scripts & Templates

> **Wave**: A (no prerequisites — can start immediately)
> **Scope**: `.kord/scripts/`, `.kord/templates/`, `.kord/checklists/`
> **Estimate**: ~8h
> **Parallel OK with**: EPIC-01, EPIC-02, EPIC-05

---

## Objective

Prepare the 5 computation scripts for `.kord/scripts/` (adapted from AIOS), create the 7 shared template files, adapt 8 AIOS-internal templates for framework evolution, and set up the story DoD checklist. These are all external files — NO plugin source changes.

## Source Documents

- `docs/researches/kord-aios-star-commands-scripts-investigation.md` §2 — script audit
- `docs/researches/kord-aios-skills-templates-scripts.md` §2, §3.3, §4 — templates, scripts, checklists
- AIOS source: `synkra-aios/.aios-core/development/scripts/` — original scripts

## Acceptance Criteria

- [x] 5 computation scripts adapted and placed in `.kord/scripts/`
- [x] `.kord/scripts/package.json` with all required dependencies
- [x] Scripts have CLI `--help` support (runtime requires `npm install` in `.kord/scripts/` first)
- [x] 7 shared template files in `.kord/templates/` (story, epic, prd, adr, task, qa-report, changelog)
- [x] 8 AIOS-internal templates adapted for framework evolution (13 delivered)
- [x] Story DoD checklist in `.kord/checklists/story-dod.md`
- [x] All files are standalone (no plugin compilation needed)

## Stories

| ID | Story | Estimate | Status | Dependencies |
|----|-------|----------|--------|-------------|
| S01 | Adapt 5 computation scripts for .kord/scripts/ | 3h | ✅ Done | None |
| S02 | Create .kord/scripts/package.json with dependencies | 0.5h | ✅ Done | S01 |
| S03 | Create 7 shared template files in .kord/templates/ | 2h | ✅ Done | None |
| S04 | Adapt 8 AIOS-internal templates for framework evolution | 2h | ✅ Done | None |
| S05 | Create story DoD checklist in .kord/checklists/ | 0.5h | ✅ Done | None |

## Verification Summary

**Scripts** (5 files, 5739 total lines):
- `code-quality-improver.js` — 1396 lines, AST analysis + ESLint + Prettier
- `refactoring-suggester.js` — 1222 lines, @babel/parser AST refactoring detection
- `performance-analyzer.js` — 840 lines, regex pattern scanning + complexity analysis
- `test-generator.js` — 941 lines, template-based test generation
- `pattern-learner.js` — 1282 lines, EventEmitter-based learning system
- All have `--help`, `--target`, `--format` CLI args and `require.main === module` guard

**Templates** (7 shared + 13 framework = 20 files):
- Shared: story, epic, prd, adr, task, qa-report, changelog (all with `{{variable}}` placeholders)
- Framework: agent-template.yaml, activation-instructions, personalized-agent/task/checklist/prompt/workflow templates

**Checklist**: `story-dod.md` — 6 mandatory + 4 optional items

## File Ownership

```
.kord/
  scripts/
    package.json                  ← NEW (deps: @babel/parser, eslint, prettier, etc.)
    code-quality-improver.js      ← ADAPT from AIOS
    refactoring-suggester.js      ← ADAPT from AIOS
    performance-analyzer.js       ← ADAPT from AIOS
    test-generator.js             ← ADAPT from AIOS
    pattern-learner.js            ← ADAPT from AIOS
  templates/
    story.md                      ← NEW (story template)
    epic.md                       ← NEW (epic template)
    prd.md                        ← NEW (PRD template)
    adr.md                        ← NEW (ADR template)
    task.md                       ← NEW (task template)
    qa-report.md                  ← NEW (QA report template)
    changelog.md                  ← NEW (changelog template)
    framework/                    ← ADAPT (8 AIOS-internal templates)
  checklists/
    story-dod.md                  ← NEW (story Definition of Done)
```

## Notes

- Script adaptation involves: removing AIOS-specific paths, updating require() references, adding CLI --help, ensuring standalone execution
- Templates follow AIOS methodology format but use Kord AIOS naming/paths
- This epic is fully independent — all outputs are external files, no plugin compilation
- The CLI installer (EPIC-06 S05) will copy these files during `kord install`
