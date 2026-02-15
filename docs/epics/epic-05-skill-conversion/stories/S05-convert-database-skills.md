# S05: Convert Database Skills (~20 tasks)

> **Epic**: EPIC-05 Skill Conversion
> **Status**: Draft
> **Estimate**: 4h
> **Agent**: @dev
> **Dependencies**: S01 (format template)

---

## Objective

Convert ~20 AIOS database task files into SKILL.md format. These cover: database design, migrations, RLS policies, Supabase patterns, query optimization, performance analysis, and DBA workflows.

## Tasks

- [ ] Identify all database tasks from `aios-skill-catalog.md`
- [ ] Convert each task following CONVERSION-GUIDE.md rules
- [ ] Place in `.kord/skills/database/`
- [ ] Embed relevant checklists: database-design-checklist, dba-predeploy-checklist, dba-rollback-checklist, migration-readiness-checklist
- [ ] Embed relevant data files: database-best-practices, supabase-patterns, rls-security-patterns, postgres-tuning-guide, migration-safety-guide
- [ ] Strip AIOS-specific references, keep methodology
- [ ] Verify each SKILL.md has valid frontmatter

## Acceptance Criteria

- [ ] ~20 SKILL.md files in `.kord/skills/database/`
- [ ] All have valid YAML frontmatter
- [ ] Relevant checklists and data files embedded
- [ ] No AIOS-specific references remain

## Files

```
.kord/skills/database/
  database-design.md
  create-migration.md
  rls-policies.md
  supabase-patterns.md
  query-optimization.md
  analyze-performance.md
  ... (~20 files)
```
