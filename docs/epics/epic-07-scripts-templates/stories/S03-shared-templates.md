# S03: Create 7 Shared Template Files

> **Epic**: EPIC-07 Computation Scripts & Templates
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Create the 7 shared template files that agents use during planning and execution: story, epic, PRD, ADR, task, QA report, and changelog templates. These are installed to `.kord/templates/` and referenced by agent prompts.

## Tasks

- [ ] Create `story.md` template (frontmatter + sections: Status, Tasks, Acceptance Criteria, File List, Dev Notes)
- [ ] Create `epic.md` template (frontmatter + sections: Objective, Stories, Acceptance Criteria, File Ownership)
- [ ] Create `prd.md` template (frontmatter + sections: Problem, Solution, Requirements, Success Metrics, Risks)
- [ ] Create `adr.md` template (frontmatter + sections: Context, Decision, Consequences, Alternatives)
- [ ] Create `task.md` template (frontmatter + sections: Objective, Tasks, Acceptance Criteria)
- [ ] Create `qa-report.md` template (frontmatter + sections: Summary, Findings, Verdict, Recommendations)
- [ ] Create `changelog.md` template (frontmatter + sections: Added, Changed, Fixed, Removed)
- [ ] Each template has YAML frontmatter with placeholder fields
- [ ] Each template includes inline comments explaining each section

## Acceptance Criteria

- [ ] 7 template files in `.kord/templates/`
- [ ] Each has valid YAML frontmatter with placeholder fields
- [ ] Templates follow AIOS methodology format (adapted for Kord)
- [ ] Inline comments guide agents on how to fill each section

## Files

```
.kord/templates/
  story.md       ← NEW
  epic.md        ← NEW
  prd.md         ← NEW
  adr.md         ← NEW
  task.md        ← NEW
  qa-report.md   ← NEW
  changelog.md   ← NEW
```
