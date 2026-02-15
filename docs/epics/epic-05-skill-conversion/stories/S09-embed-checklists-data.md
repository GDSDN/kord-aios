# S09: Embed Checklists (17) and Data Files (14) into Skills

> **Epic**: EPIC-05 Skill Conversion
> **Status**: Draft
> **Estimate**: 4h
> **Agent**: @dev
> **Dependencies**: S02-S08 (all skill batches must be done)

---

## Objective

Final enrichment pass: embed the 17 AIOS checklists and 14 data files into the relevant skills created in S02-S08. Each checklist and data file has a designated skill target. After this story, skills contain the full methodology including checklists and reference data.

## Tasks

- [ ] Embed 17 checklists into designated skills (per mapping in kord-aios-skills-templates-scripts.md §4.1)
- [ ] Embed 14 data files into designated skills (per mapping in kord-aios-skills-templates-scripts.md §5)
- [ ] Key embeddings:
  - story-dod-checklist → develop-story skill
  - story-draft-checklist → create-next-story skill
  - architect-checklist → architecture-design skill
  - pm-checklist → create-prd skill
  - po-master-checklist → checkpoint-decision skill
  - pre-push-checklist → git-push-workflow skill (and git-master)
  - self-critique-checklist → qa-review-story skill
  - decision-heuristics-framework → impact-analysis skill
  - quality-dimensions-framework → review-code-quality skill
  - database-best-practices → database-design skill
  - supabase-patterns → supabase-patterns skill
  - rls-security-patterns → rls-policies skill
  - elicitation-methods → @plan prompt (not a skill, but noted)
- [ ] Verify embedded content doesn't duplicate what's already in the skill
- [ ] Verify all skills still have valid frontmatter after embedding

## Acceptance Criteria

- [ ] All 17 checklists embedded in their designated skills
- [ ] All 14 data files embedded in their designated skills
- [ ] No duplicated content within skills
- [ ] All skills have valid frontmatter
- [ ] Total skill count: 151 (138 KEEP + 13 ADAPT)

## Files

```
.kord/skills/**/*.md    ← MODIFY (embed checklist/data sections)
```
