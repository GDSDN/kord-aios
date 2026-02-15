# {{task_name}} — Task Template

## Purpose
{{purpose}}

## Parameters
| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| {{param_1}} | Yes | - | {{param_1_desc}} |
| {{param_2}} | No | {{param_2_default}} | {{param_2_desc}} |

## Workflow
1. {{step_1}}
2. {{step_2}}

## Output Format
```markdown
## Task Execution Report

**Agent:** {{agent_name}} ({{archetype}})
**Task:** {{task_name}}
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

{{signature_closing}}
```
