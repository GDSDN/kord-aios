# S04: Convert Architecture/Design-Pattern Skills (~20 tasks)

> **Epic**: EPIC-05 Skill Conversion
> **Status**: Draft
> **Estimate**: 4h
> **Agent**: @dev
> **Dependencies**: S01 (format template)

---

## Objective

Convert ~20 AIOS architecture/design-pattern task files into SKILL.md format. These cover: system design, API design, design patterns, impact analysis, migration planning, and architectural decision records.

## Tasks

- [ ] Identify all architecture tasks from `aios-skill-catalog.md`
- [ ] Convert each task following CONVERSION-GUIDE.md rules
- [ ] Place in `.kord/skills/architecture/`
- [ ] Embed relevant checklists: architect-checklist, pattern-audit-checklist
- [ ] Embed relevant data files: integration-patterns, decision-heuristics-framework
- [ ] Strip AIOS-specific references, keep methodology
- [ ] Verify each SKILL.md has valid frontmatter
- [ ] Spot-check 3 skills with OMOC skill loader

## Acceptance Criteria

- [ ] ~20 SKILL.md files in `.kord/skills/architecture/`
- [ ] All have valid YAML frontmatter
- [ ] Relevant checklists and data files embedded
- [ ] No AIOS-specific references remain

## Files

```
.kord/skills/architecture/
  architecture-design.md
  api-design.md
  design-patterns.md
  impact-analysis.md
  migration-planning.md
  create-adr.md
  ... (~20 files)
```
