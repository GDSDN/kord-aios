# {{task_name}} — Task Template (v2)

**Task ID:** {{task_id}}
**Version:** {{version}}
**Status:** {{status}}

## Purpose
{{purpose}}

## Execution Modes
- YOLO: {{yolo_description}}
- Interactive: {{interactive_description}}
- Preflight: {{preflight_description}}

## Pre-Conditions
- [ ] {{precondition_1}}
- [ ] {{precondition_2}}

## Workflow
1. {{step_1}}
2. {{step_2}}

## Post-Conditions
- [ ] {{postcondition_1}}
- [ ] {{postcondition_2}}

## Output Format
```markdown
## Task Execution Report

**Agent:** {{agent_name}} ({{archetype}})
**Task:** {{task_name}}
**Mode:** {{execution_mode}}
**Started:** {{started_at}}
**Completed:** {{completed_at}}

### Status
{{status_message}}

### Output
{{output_content}}

### Metrics
- Tests: {{tests_passed}}/{{tests_total}}
- Coverage: {{coverage}}%
- Linting: {{lint_status}}
- Pre-conditions: {{preconditions_passed}}/{{preconditions_total}}
- Post-conditions: {{postconditions_passed}}/{{postconditions_total}}

{{signature_closing}}
```
