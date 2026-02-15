# S02: Convert Dev/Implementation Skills (~30 tasks)

> **Epic**: EPIC-05 Skill Conversion
> **Status**: Draft
> **Estimate**: 6h
> **Agent**: @dev
> **Dependencies**: S01 (format template)

---

## Objective

Convert ~30 AIOS development/implementation task files into SKILL.md format. These cover: story development, code implementation, refactoring, debugging, testing integration, and dev workflow patterns.

## Tasks

- [ ] Identify all dev/implementation tasks from `aios-skill-catalog.md` (KEEP + ADAPT in dev domain)
- [ ] Convert each task following CONVERSION-GUIDE.md rules
- [ ] Place in `.kord/skills/dev/`
- [ ] Strip: AIOS execution modes, task format YAML, AIOS paths
- [ ] Keep: process steps, methodology, checklists, error handling
- [ ] Verify each SKILL.md has valid frontmatter
- [ ] Spot-check 3 skills with OMOC skill loader

## Acceptance Criteria

- [ ] ~30 SKILL.md files in `.kord/skills/dev/`
- [ ] All have valid YAML frontmatter
- [ ] No AIOS-specific references remain
- [ ] 3 spot-checked skills load successfully

## Files

```
.kord/skills/dev/
  develop-story.md
  develop-feature.md
  implement-component.md
  refactor-code.md
  debug-issue.md
  ... (~30 files)
```
