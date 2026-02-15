# S07: Convert DevOps/Infra Skills (~13) + Remaining KEEP Tasks

> **Epic**: EPIC-05 Skill Conversion
> **Status**: Draft
> **Estimate**: 4h
> **Agent**: @dev
> **Dependencies**: S01 (format template)

---

## Objective

Convert ~13 AIOS devops/infrastructure task files plus any remaining KEEP tasks not covered by S02-S06 into SKILL.md format. These cover: CI/CD pipeline, deployment, git workflow, release management, monitoring, and infrastructure.

## Tasks

- [ ] Identify all devops/infra tasks from `aios-skill-catalog.md`
- [ ] Convert each devops/infra task → `.kord/skills/devops/`
- [ ] Embed: pre-push-checklist, release-checklist
- [ ] Identify any remaining KEEP tasks not assigned to S02-S06 domains
- [ ] Convert remaining tasks to appropriate domain directories (analysis/, squad/, etc.)
- [ ] Strip AIOS-specific references, keep methodology
- [ ] Verify each SKILL.md has valid frontmatter

## Acceptance Criteria

- [ ] ~13 SKILL.md files in `.kord/skills/devops/`
- [ ] All remaining KEEP tasks converted and placed in domain directories
- [ ] All have valid YAML frontmatter
- [ ] No AIOS-specific references remain
- [ ] Total KEEP conversions (S02-S07) = 138 skills

## Files

```
.kord/skills/devops/
  git-push-workflow.md
  ci-cd-pipeline.md
  deploy-production.md
  release-management.md
  ... (~13 files)

.kord/skills/analysis/
  research-topic.md
  brainstorm-solutions.md
  ... (remaining)

.kord/skills/squad/
  create-squad.md
  squad-composition.md
  ... (remaining)
```
