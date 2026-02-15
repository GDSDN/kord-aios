---
id: "{{epic_id}}"
title: "{{epic_title}}"
status: "{{status}}" # Planning | In Progress | Completed | On Hold | Cancelled
owner: "{{owner}}"
created: "{{created_date}}"
updated: "{{updated_date}}"
---

# {{epic_id}}: {{epic_title}}

## Objective
<!-- Describe the epic's primary objective and business value. -->
{{objective}}

## Stories
<!-- List story IDs, titles, estimates, and status. -->
| ID | Title | Estimate | Status |
|----|-------|----------|--------|
| {{story_id}} | {{story_title}} | {{estimate}} | {{story_status}} |

## Acceptance Criteria
<!-- Epic-level acceptance criteria (high-level outcomes). -->
- {{acceptance_criteria_1}}
- {{acceptance_criteria_2}}

## File Ownership
<!-- List key files/modules this epic owns or touches. -->
- `{{path_or_module}}`

## Risks & Mitigations
<!-- Track risks and mitigations. -->
| Risk | Impact | Mitigation |
|------|--------|------------|
| {{risk}} | {{impact}} | {{mitigation}} |

## Dependencies
<!-- List dependencies and blockers. -->
- Depends on: {{dependency}}
- Blocks: {{blocker}}

## Change Log
<!-- Track changes to the epic document. -->
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| {{change_date}} | {{version}} | {{change_summary}} | {{author}} |
