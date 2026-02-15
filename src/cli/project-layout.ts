export const KORD_DIR = ".kord"
export const KORD_DOCS_DIR = "docs/kord"
export const KORD_RULES_FILE = "kord-rules.md"

export const KORD_INPUT_SUBDIRS = [
  "scripts",
  "templates",
  "checklists",
  "skills",
  "squads",
] as const

export const KORD_OUTPUT_SUBDIRS = [
  "plans",
  "drafts",
  "notepads",
] as const

export const KORD_RULES_CONTENT = `# Kord AIOS — Project Rules

This file is loaded by OpenCode via the \`instructions\` array in \`opencode.json\`.
It provides project-level rules that all Kord agents follow.

## Agent Workflow

- **Planning**: Use \`/plan\` to create structured work plans in \`docs/kord/plans/\`
- **Execution**: Use \`/start-work\` to execute plans via the Build orchestrator
- **Delegation**: Build delegates to specialist agents via \`task()\`
- **Verification**: Build verifies all subagent work before marking tasks complete

## Directory Conventions

| Path | Purpose |
|------|---------|
| \`docs/kord/plans/\` | Work plans (markdown) |
| \`docs/kord/drafts/\` | Draft plans (deleted after finalization) |
| \`docs/kord/notepads/\` | Agent working memory per plan |
| \`.kord/templates/\` | Story, ADR, and other templates |

## Rules

1. Agents write plans and notes ONLY to \`docs/kord/\`
2. Implementation code goes to the project source tree
3. Use \`task()\` for delegation — never implement directly from Build
4. Mark plan checkboxes \`- [x]\` as tasks complete
5. Record learnings in \`docs/kord/notepads/{plan-name}/\`
`

export const STORY_TEMPLATE_CONTENT = `---
title: "{TITLE}"
type: story
status: draft
priority: medium
created: "{DATE}"
---

# {TITLE}

## Description

_As a [user/role], I want [goal] so that [benefit]._

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes

_Implementation details, constraints, dependencies._

## Definition of Done

- [ ] Code implemented and passes linting
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if applicable)
- [ ] Documentation updated
- [ ] PR reviewed and approved
`

export const ADR_TEMPLATE_CONTENT = `---
title: "ADR-{NUMBER}: {TITLE}"
type: adr
status: proposed
created: "{DATE}"
---

# ADR-{NUMBER}: {TITLE}

## Status

Proposed

## Context

_What is the issue that we're seeing that is motivating this decision or change?_

## Decision

_What is the change that we're proposing and/or doing?_

## Consequences

### Positive

- _Benefit 1_

### Negative

- _Trade-off 1_

### Neutral

- _Observation 1_
`
