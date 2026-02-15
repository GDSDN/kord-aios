---
title: "{{story_title}}"
epic: "{{epic_id}}"
story: "{{story_id}}"
status: "{{status}}" # Draft | In Progress | Review | Done
owner: "{{owner}}"
executor: "{{executor}}"
quality_gate: "{{quality_gate}}"
created: "{{created_date}}"
updated: "{{updated_date}}"
---

# Story {{story_id}}: {{story_title}}

## Status
<!-- Describe current status and any blockers. -->
- Status: {{status}}
- Owner: {{owner}}
- Executor: {{executor}}
- Quality Gate: {{quality_gate}}

## Story
<!-- User story in "As a..., I want..., so that..." format. -->
As a {{user_role}}, I want {{user_goal}} so that {{user_benefit}}.

## Tasks
<!-- Break down the implementation into actionable tasks. -->
- [ ] {{task_1}}
- [ ] {{task_2}}

## Acceptance Criteria
<!-- List clear, testable acceptance criteria. -->
1. {{acceptance_criteria_1}}
2. {{acceptance_criteria_2}}

## File List
<!-- Files created or modified for this story. -->
- `{{file_path}}` ({{action}})

## Dev Notes
<!-- Provide constraints, references, and context that must be preserved. -->
{{dev_notes}}

## Testing
<!-- Required tests and commands. -->
- {{test_command_1}}
- {{test_command_2}}

## Change Log
<!-- Track story document changes. -->
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| {{change_date}} | {{version}} | {{change_summary}} | {{author}} |

## Dev Agent Record
<!-- Filled by the development agent during implementation. -->
- Model: {{agent_model}}
- Completion Notes: {{completion_notes}}
- Files Touched: {{files_touched}}

## QA Results
<!-- Filled by QA during review. -->
- Verdict: {{qa_verdict}}
- Findings: {{qa_findings}}
