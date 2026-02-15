# S03: Convert QA/Testing Skills (~25 tasks)

> **Epic**: EPIC-05 Skill Conversion
> **Status**: Draft
> **Estimate**: 5h
> **Agent**: @dev
> **Dependencies**: S01 (format template)

---

## Objective

Convert ~25 AIOS QA/testing task files into SKILL.md format. These cover: code review, test generation, quality assessment, regression testing, acceptance validation, and QA workflow patterns.

## Tasks

- [ ] Identify all QA/testing tasks from `aios-skill-catalog.md`
- [ ] Convert each task following CONVERSION-GUIDE.md rules
- [ ] Place in `.kord/skills/qa/`
- [ ] Embed relevant checklists: self-critique-checklist, agent-quality-gate, test-levels-framework
- [ ] Strip AIOS-specific references, keep methodology
- [ ] Verify each SKILL.md has valid frontmatter
- [ ] Spot-check 3 skills with OMOC skill loader

## Acceptance Criteria

- [ ] ~25 SKILL.md files in `.kord/skills/qa/`
- [ ] All have valid YAML frontmatter
- [ ] Relevant checklists embedded in skills
- [ ] No AIOS-specific references remain

## Files

```
.kord/skills/qa/
  qa-review-story.md
  generate-tests.md
  review-code-quality.md
  validate-acceptance-criteria.md
  regression-test.md
  ... (~25 files)
```
