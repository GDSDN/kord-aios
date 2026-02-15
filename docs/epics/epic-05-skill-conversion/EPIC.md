# EPIC-05: Skill Conversion

> **Wave**: A (no prerequisites — can start immediately)
> **Scope**: `src/features/builtin-skills/skills/kord-aios/` (plugin built-in SKILL.md files)
> **Estimate**: ~40h
> **Status**: COMPLETE
> **Parallel OK with**: EPIC-01, EPIC-02, EPIC-07

---

## Objective

Convert 151 AIOS task files into SKILL.md format compatible with the OMOC skill loader. This is the largest epic by volume (~2MB of methodology content). Split into domain batches for manageable execution.

## Source Documents

- `docs/researches/aios-skill-catalog.md` — full per-skill classification
- `docs/researches/kord-os-skill-adaptation-plan.md` — timeline, directory structure
- `docs/researches/skill-system-deep-analysis.md` — AIOS vs OMOC comparison
- AIOS source: `synkra-aios/.aios-core/development/tasks/` — 200 task files

## Acceptance Criteria

- [x] 138 KEEP tasks converted to SKILL.md format (no content changes, format only)
- [x] 13 ADAPT tasks converted with engine-overlap content stripped
- [x] All SKILL.md files have valid YAML frontmatter (name, description, agent)
- [x] Skills organized by domain in `src/features/builtin-skills/skills/kord-aios/<domain>/`
- [x] Checklists embedded in relevant skills
- [x] Data files embedded in relevant skills
- [x] Skill loader can discover and load all 144 converted skills (9/9 tests pass)

**Final metrics:** 144 SKILL.md files across 12 domains. 194 AIOS source tasks → 144 converted (KEEP+ADAPT), 50 skipped (ENGINE+SKIP). 0 missing.

## Stories

| ID | Story | Estimate | Dependencies | Status |
|----|-------|----------|-------------|--------|
| S01 | Define SKILL.md format template and conversion script | 3h | None | DONE |
| S02 | Convert dev/implementation skills (~30 tasks) | 6h | S01 | DONE |
| S03 | Convert QA/testing skills (~25 tasks) | 5h | S01 | DONE |
| S04 | Convert architecture/design-patterns skills (~20 tasks) | 4h | S01 | DONE |
| S05 | Convert database skills (~20 tasks) | 4h | S01 | DONE |
| S06 | Convert UX/design skills (~15 tasks) + PM/PO skills (~15 tasks) | 5h | S01 | DONE |
| S07 | Convert devops/infra skills (~13 tasks) + remaining KEEP tasks | 4h | S01 | DONE |
| S08 | Convert 13 ADAPT tasks (strip engine overlap, keep methodology) | 5h | S01 | DONE |
| S09 | Embed checklists (17) and data files (14) into relevant skills | 4h | S02-S08 | DONE |

## File Ownership

```
src/features/builtin-skills/skills/kord-aios/
  analysis/        (17) ← research, brainstorming, elicitation, spec skills
  database/        (21) ← DB design, migration, Supabase skills
  design-system/   (13) ← UX, accessibility, design system, tokens skills
  dev-workflow/    (15) ← development, implementation, refactoring skills
  devops/           (9) ← CI/CD, deployment, infrastructure skills
  documentation/   (10) ← project docs, gotchas, sync, indexing skills
  mcp/              (2) ← MCP workflow and search skills
  product/          (6) ← PM, PO, story backlog skills
  qa/              (22) ← testing, review, quality, security skills
  squad/            (7) ← squad-creator, agent design skills
  story/           (12) ← story creation, planning, epic orchestration skills
  utilities/        (7) ← cleanup, undo, migration strategy skills
  worktrees/        (3) ← git worktree management skills
```

## Notes

- S01 creates a conversion helper (can be a script or just a template) to standardize the SKILL.md format
- Each batch (S02-S07) is independent — could theoretically run in parallel if multiple agents available
- ADAPT tasks (S08) need careful review: remove AIOS activation pipeline, greeting, config references
- S09 is the final pass that enriches skills with checklist and data file content
- This epic produces NO changes to plugin source code — only external SKILL.md files
