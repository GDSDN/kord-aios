---
title: "{TITLE}"
type: story
status: draft
priority: medium
created: "{DATE}"
wave: 1
assignee: ""
---

# {TITLE}

## Purpose

_Why does this story exist? What user value does it deliver?_

## Scope

### In Scope

- _What will be delivered_

### Out of Scope

- _What will NOT be delivered (explicitly)_

## Inputs

- _Links to PRD/epic (if any)_
- _Relevant constraints (tech, timeline, security)_

## Output

- _What changes for users and where it shows up_

## User Story

_As a [user/role], I want [goal] so that [benefit]._

## Problem Statement

_What problem does this story solve? Why is it needed now?_

## Acceptance Criteria

- [ ] Criterion 1: _Description of expected behavior_
- [ ] Criterion 2: _Description of expected behavior_
- [ ] Criterion 3: _Description of expected behavior_

## Verification

_How to prove acceptance criteria are met (commands and/or manual steps)._

~~~bash
# examples (adapt to project)
bun test
bun run build
~~~

## Failure Modes

- _What commonly goes wrong and how to detect/recover_

## Technical Notes

_Implementation details, constraints, dependencies, architectural considerations._

## Dependencies

- _Dependency 1_
- _Dependency 2_

## Definition of Done

- [ ] Code implemented and passes linting
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if applicable)
- [ ] Documentation updated
- [ ] PR reviewed and approved

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| _Risk 1_ | High/Medium/Low | _Mitigation strategy_ |
`

export const ADR_TEMPLATE_CONTENT = `---
title: "ADR-{NUMBER}: {TITLE}"
type: adr
status: proposed
created: "{DATE}"
---

# ADR-{NUMBER}: {TITLE}

## Purpose

_Why do we need a decision record? What decision is being captured?_

## Scope

_What this ADR covers and what it explicitly does not cover._

## Inputs

- _Constraints (security, performance, cost, timeline)_
- _Alternatives considered_
- _Prior art / existing patterns_

## Output

_The decision and the resulting constraints for implementation._

## Acceptance Criteria

- [ ] Decision is clear, concrete, and testable in implementation
- [ ] Trade-offs are documented (pros/cons)

## Verification

- [ ] Implementation references this ADR when relevant
- [ ] Risks are mitigated or explicitly accepted

## Failure Modes

- Decision is vague or untestable
- Alternatives were not evaluated

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
