# S06: Convert UX/Design Skills (~15) + PM/PO Skills (~15)

> **Epic**: EPIC-05 Skill Conversion
> **Status**: Draft
> **Estimate**: 5h
> **Agent**: @dev
> **Dependencies**: S01 (format template)

---

## Objective

Convert ~30 AIOS UX/design and PM/PO task files into SKILL.md format. These cover: design system, accessibility, atomic design, component quality, PRD creation, epic management, story drafting, backlog prioritization, and checkpoint decisions.

## Tasks

- [ ] Identify all UX/design tasks from `aios-skill-catalog.md`
- [ ] Convert each UX/design task → `.kord/skills/design/`
- [ ] Embed: component-quality-checklist, accessibility-wcag-checklist, atomic-design-principles, design-token-best-practices, wcag-compliance-guide
- [ ] Identify all PM/PO tasks from `aios-skill-catalog.md`
- [ ] Convert each PM/PO task → `.kord/skills/product/`
- [ ] Embed: pm-checklist, po-master-checklist, elicitation-methods
- [ ] Strip AIOS-specific references, keep methodology
- [ ] Verify each SKILL.md has valid frontmatter

## Acceptance Criteria

- [ ] ~15 SKILL.md files in `.kord/skills/design/`
- [ ] ~15 SKILL.md files in `.kord/skills/product/`
- [ ] All have valid YAML frontmatter
- [ ] Relevant checklists and data files embedded
- [ ] No AIOS-specific references remain

## Files

```
.kord/skills/design/
  design-system.md
  accessibility-audit.md
  component-design.md
  responsive-layout.md
  ... (~15 files)

.kord/skills/product/
  create-prd.md
  create-epic.md
  create-next-story.md
  backlog-prioritize.md
  checkpoint-decision.md
  ... (~15 files)
```
