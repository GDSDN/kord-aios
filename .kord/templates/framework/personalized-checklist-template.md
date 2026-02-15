# {{agent_id}} — Checklist Template

**Agent:** {{agent_name}} ({{archetype}})
**Purpose:** {{purpose}}
**When to Use:** {{when_to_use}}

## Overview
{{overview}}

## Checklist
- [ ] {{check_item_1}}
- [ ] {{check_item_2}}
- [ ] {{check_item_3}}

## Quality Gates
- [ ] Tests passing
- [ ] Linting/type checks clean
- [ ] Documentation updated (if required)

## Reporting Template
```markdown
## Checklist Execution Report

**Agent:** {{agent_name}} ({{archetype}})
**Checklist:** {{checklist_title}}
**Started:** {{started_at}}
**Completed:** {{completed_at}}

### Status
{{status_message}}

### Results
- Completed: {{completed_count}}
- Failed: {{failed_count}}

{{signature_closing}}
```
