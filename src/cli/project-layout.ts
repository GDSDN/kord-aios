export const KORD_DIR = ".kord"
export const KORD_DOCS_DIR = "docs/kord"
export const KORD_RULES_FILE = ".kord/rules/kord-rules.md"

export const KORD_INPUT_SUBDIRS = [
  "scripts",
  "templates",
  "checklists",
  "skills",
  "squads",
] as const

/**
 * Subdirectories that are actively created by createKordDirectory()
 * These are the only .kord/ subdirs that get created automatically.
 */
export const KORD_ACTIVE_SUBDIRS = [
  "templates",
  "squads",
  "rules",
  "standards",
  "guides",
] as const

/**
 * Reserved subdirectories that are NOT created automatically.
 * These document future intent but are not currently used.
 */
export const KORD_RESERVED_SUBDIRS = [
  "scripts",
  "checklists",
  "skills",
] as const

export const KORD_OUTPUT_SUBDIRS = [
  "plans",
  "stories",
  "epics",
  "prds",
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
wave: 1
assignee: ""
---

# {TITLE}

## User Story

_As a [user/role], I want [goal] so that [benefit]._

## Problem Statement

_What problem does this story solve? Why is it needed now?_

## Acceptance Criteria

- [ ] Criterion 1: _Description of expected behavior_
- [ ] Criterion 2: _Description of expected behavior_
- [ ] Criterion 3: _Description of expected behavior_

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

export const PRD_TEMPLATE_CONTENT = `---
title: "{TITLE}"
type: prd
status: draft
priority: high
created: "{DATE}"
---

# Product Requirements Document: {TITLE}

## Executive Summary

_Brief overview of the product/feature and its business value._

## Problem Statement

_What problem are we solving? Who experiences this problem?_

## Target Users

- _User persona 1_
- _User persona 2_

## Goals & Non-Goals

### Goals

- _Goal 1_
- _Goal 2_

### Non-Goals

- _Out of scope 1_
- _Out of scope 2_

## Requirements

### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-001 | _Requirement description_ | Must/Should/Could | _AC_ |
| FR-002 | _Requirement description_ | Must/Should/Could | _AC_ |

### Non-Functional Requirements

- _Performance requirement_
- _Security requirement_
- _Usability requirement_

## User Stories

- _User story 1_
- _User story 2_

## Technical Considerations

_Architecture, technology stack, integration points, constraints._

## Timeline & Milestones

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| _M1_ | _Date_ | _Deliverables_ |
| _M2_ | _Date_ | _Deliverables_ |

## Success Metrics

- _Metric 1: how we measure_
- _Metric 2: how we measure_

## Open Questions

- _Question 1_
- _Question 2_
`

export const EPIC_TEMPLATE_CONTENT = `---
title: "{TITLE}"
type: epic
status: draft
priority: high
created: "{DATE}"
wave: 1
---

# Epic: {TITLE}

## Vision

_One-sentence description of the epic's end state._

## Background

_Why are we doing this? What problem does it solve?_

## Scope

### In Scope

- _Item 1_
- _Item 2_

### Out of Scope

- _Item 1_
- _Item 2_

## User Journey

_Description of the end-to-end user experience after this epic is complete._

## Stories

| Story | Priority | Status |
|-------|----------|--------|
| _Story link_ | Must/Should | Draft |

## Technical Approach

_High-level technical strategy and architecture._

## Dependencies

- _Dependency 1_
- _Dependency 2_

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| _Risk_ | High/Medium/Low | _Mitigation_ |

## Milestones

| Milestone | Target | Stories |
|-----------|--------|---------|
| _M1_ | _Date_ | _Stories_ |
`

export const TASK_TEMPLATE_CONTENT = `---
title: "{TITLE}"
type: task
status: pending
priority: medium
created: "{DATE}"
assignee: ""
story: ""
---

# Task: {TITLE}

## Description

_Detailed description of what needs to be done._

## Context

_Why is this task needed? What is the background?_

## Requirements

- _Requirement 1_
- _Requirement 2_

## Technical Details

_Implementation specifics, code changes, configuration updates._

## Testing Approach

_How should this be tested?_

## Definition of Done

- [ ] _Task-specific completion criteria_
- [ ] _Code changes complete_
- [ ] _Tests passing_
- [ ] _Documentation updated_

## Notes

_Additional notes, links to related work, references._
`

export const QA_GATE_TEMPLATE_CONTENT = `---
title: "{TITLE}"
type: qa-gate
status: pending
created: "{DATE}"
story: ""
---

# QA Gate: {TITLE}

## Gate Purpose

_What is being validated at this gate?_

## Pre-Gate Criteria

- [ ] _Criteria 1_
- [ ] _Criteria 2_

## Validation Checklist

### Functional Testing

- [ ] _Test case 1_
- [ ] _Test case 2_

### Non-Functional Testing

- [ ] Performance: _Test description_
- [ ] Security: _Test description_
- [ ] Usability: _Test description_

### Edge Cases

- [ ] _Edge case 1_
- [ ] _Edge case 2_

## Test Results

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| _Test_ | _Result_ | _Result_ | Pass/Fail |

## Gate Decision

- [ ] **APPROVED**: _Condition_
- [ ] **REJECTED**: _Condition_
- [ ] **CONDITIONAL**: _Condition_

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| PO | | | |

## Notes

_Any additional observations or follow-up items._
`

export const QA_REPORT_TEMPLATE_CONTENT = `---
title: "{TITLE}"
type: qa-report
status: draft
created: "{DATE}"
story: ""
---

# QA Report: {TITLE}

## Executive Summary

_High-level summary of testing results._

## Test Scope

### Covered

- _Scope item 1_
- _Scope item 2_

### Not Covered

- _Excluded item 1_
- _Excluded item 2_

## Test Results Summary

| Category | Total | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Functional | N | N | N | N |
| Integration | N | N | N | N |
| Performance | N | N | N | N |

## Defects

### Critical

| ID | Description | Status | Assigned To |
|----|-------------|--------|-------------|
| _ID_ | _Description_ | Open/In Progress | _Name_ |

### Major

| ID | Description | Status | Assigned To |
|----|-------------|--------|-------------|
| _ID_ | _Description_ | Open/In Progress | _Name_ |

### Minor

| ID | Description | Status | Assigned To |
|----|-------------|--------|-------------|
| _ID_ | _Description_ | Open/In Progress | _Name_ |

## Test Coverage

_Coverage metrics and analysis._

## Quality Metrics

- _Metric 1: value_
- _Metric 2: value_

## Recommendations

- _Recommendation 1_
- _Recommendation 2_

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| PO | | | |

## Notes

_Additional observations, lessons learned_
`

export const CHECKLIST_STORY_DRAFT_CONTENT = `---
title: "Story Draft Checklist"
type: checklist
status: active
created: "{DATE}"
---

# Story Draft Checklist

Use this checklist before submitting a story for PO validation.

## Structure

- [ ] Title is clear and descriptive
- [ ] Description follows "As a... I want... so that..." format
- [ ] Acceptance criteria are specific and testable
- [ ] Scope is a single deliverable

## Content

- [ ] Technical notes included
- [ ] Dependencies listed
- [ ] File references included
- [ ] Risks identified

## Quality

- [ ] Acceptance criteria have clear pass/fail conditions
- [ ] No ambiguous language
- [ ] Dependencies are achievable
`

export const CHECKLIST_STORY_DOD_CONTENT = `---
title: "Story Definition of Done"
type: checklist
status: active
created: "{DATE}"
---

# Story Definition of Done

Verify all items before marking story as complete.

## Code Complete

- [ ] Code implemented
- [ ] Code passes linting
- [ ] No type errors

## Testing

- [ ] Unit tests written
- [ ] Unit tests passing
- [ ] Integration tests passing (if applicable)
- [ ] No regressions

## Review

- [ ] PR reviewed
- [ ] PR approved
- [ ] Comments addressed

## Documentation

- [ ] Documentation updated
- [ ] README updated (if needed)
`

export const CHECKLIST_PR_REVIEW_CONTENT = `---
title: "PR Review Checklist"
type: checklist
status: active
created: "{DATE}"
---

# PR Review Checklist

Use this checklist when reviewing pull requests.

## Build

- [ ] Code compiles without errors
- [ ] Tests pass
- [ ] No linting errors

## Code Quality

- [ ] No AI comment bloat
- [ ] No "as any" type assertions
- [ ] No "@ts-ignore" or "@ts-expect-error"
- [ ] Follows codebase patterns
- [ ] No hardcoded secrets

## Functionality

- [ ] Requirements met
- [ ] Edge cases handled
- [ ] Error cases handled

## Security

- [ ] No security vulnerabilities
- [ ] Input validation present
- [ ] Authentication/authorization correct
`

export const CHECKLIST_ARCHITECT_CONTENT = `---
title: "Architecture Review Checklist"
type: checklist
status: active
created: "{DATE}"
---

# Architecture Review Checklist

Use this checklist when reviewing architectural decisions.

## Design

- [ ] Solution addresses the problem
- [ ] Scalability considered
- [ ] Performance requirements met
- [ ] Security requirements met

## Integration

- [ ] External dependencies documented
- [ ] API contracts defined
- [ ] Data flow understood

## Trade-offs

- [ ] Pros/cons documented
- [ ] Alternatives considered
- [ ] Technical debt identified

## Maintainability

- [ ] Code is testable
- [ ] Complexity is manageable
- [ ] Dependencies are clear
`

export const CHECKLIST_PRE_PUSH_CONTENT = `---
title: "Pre-Push Checklist"
type: checklist
status: active
created: "{DATE}"
---

# Pre-Push Checklist

Run this checklist before pushing to remote.

## Local Verification

- [ ] All tests passing locally
- [ ] Linting passes
- [ ] Type checking passes
- [ ] No console.log or debug code

## Commit Quality

- [ ] Commits are atomic
- [ ] Commit messages are descriptive
- [ ] No unintended files included

## Final Review

- [ ] Self-review completed
- [ ] Code changes verified
- [ ] Related issues linked
`

export const CHECKLIST_SELF_CRITIQUE_CONTENT = `---
title: "Self-Critique Checklist"
type: checklist
status: active
created: "{DATE}"
---

# Self-Critique Checklist

Reflect on your work before submission.

## Implementation

- [ ] Solution is correct
- [ ] Edge cases handled
- [ ] Error handling present

## Code Quality

- [ ] Code is readable
- [ ] No unnecessary complexity
- [ ] Naming is clear
- [ ] Functions are focused

## Testing

- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests are maintainable

## Improvements

- [ ] Potential refactors identified
- [ ] Technical debt noted
- [ ] Follow-up items documented
`

// ============================================================================
// New methodology files for .kord/standards/ and .kord/guides/
// ============================================================================

export const KORD_ROOT_AGENTS_CONTENT = `# .kord — Kord AIOS Project Configuration

This directory contains project-level methodology and configuration for Kord AIOS agents.

## Directory Structure

| Path | Purpose |
|------|---------|
| \`templates/\` | Story, ADR, PRD, task, and checklist templates |
| \`standards/\` | Quality gates, decision heuristics, best practices |
| \`guides/\` | Onboarding guides for new and existing projects |
| \`squads/\` | Custom SQUAD.yaml manifests |
| \`rules/\` | Project-specific agent rules |

## Usage

- Templates are used by \`/plan\` and \`/start-work\` commands
- Standards provide guidance for agent decision-making
- Guides help onboard agents to project context

For details, see individual directory \`AGENTS.md\` files.
`

export const KORD_STANDARDS_AGENTS_CONTENT = `# .kord/standards — Quality Standards and Heuristics

This directory contains quality gates and decision heuristics for Kord AIOS agents.

## Files

| File | Purpose |
|------|---------|
| \`quality-gates.md\` | Checkpoints that must pass before advancing |
| \`decision-heuristics.md\` | Guidelines for agent decision-making |

## Quality Gates

Quality gates are advisory checkpoints. Agents should verify relevant gates before marking work complete:

- **Planning Gate**: Requirements are clear and testable
- **Implementation Gate**: Code passes lint, typecheck, and tests
- **Review Gate**: PR follows project conventions
- **Agent Quality Gate**: Agent outputs meet quality standards

## Decision Heuristics

These heuristics guide agents when making technical decisions:

- Prefer explicit over implicit
- Prefer simple over complex (unless complexity is justified)
- Prefer reversible over irreversible
- Document trade-offs in ADRs
`

export const KORD_GUIDES_AGENTS_CONTENT = `# .kord/guides — Project Onboarding Guides

This directory contains guides to help agents understand project context.

## Files

| File | Purpose |
|------|---------|
| \`new-project.md\` | Guide for starting a new project with Kord AIOS |
| \`existing-project.md\` | Guide for adding Kord AIOS to an existing project |

## Usage

These guides are loaded by the agent when initializing work. They provide context about:

- Project setup and configuration
- Development workflow
- Team conventions
- Quality expectations
`

export const KORD_STANDARDS_QUALITY_GATES_CONTENT = `# Quality Gates

Advisory checkpoints that agents should verify before marking work complete.

## Planning Gate

- [ ] Requirements are clear and testable
- [ ] Acceptance criteria have pass/fail conditions
- [ ] Dependencies are identified
- [ ] Scope is manageable (single deliverable)

## Implementation Gate

- [ ] Code compiles without errors
- [ ] Tests pass (unit + integration)
- [ ] Linting passes
- [ ] No type errors
- [ ] No debug code (console.log, etc.)

## Review Gate

- [ ] PR description is complete
- [ ] Code follows project conventions
- [ ] No AI comment bloat
- [ ] No "as any", "@ts-ignore", "@ts-expect-error"

## Agent Quality Gate

- [ ] Output is actionable (not vague)
- [ ] Decisions are explained
- [ ] Trade-offs are documented
- [ ] Edge cases are considered
`

export const KORD_STANDARDS_DECISION_HEURISTICS_CONTENT = `# Decision Heuristics

Guidelines for agents making technical decisions.

## General Principles

1. **Explicit over implicit**: Make assumptions visible
2. **Simple over complex**: Avoid unnecessary complexity
3. **Reversible over irreversible**: Prefer reversible decisions
4. **Document trade-offs**: Use ADRs for significant choices

## Code Decisions

- Follow existing patterns in the codebase
- Name variables clearly (self-documenting)
- Keep functions focused (single responsibility)
- Error handling: fail fast with clear messages

## Architecture Decisions

- Consider scalability, performance, security
- External dependencies should be documented
- API contracts should be defined
- Data flow should be understood

## Trade-off Analysis

When making decisions, consider:

- **Pros**: Benefits of the approach
- **Cons**: Costs and risks
- **Alternatives**: Other options considered
- **Mitigation**: How to address downsides
`

export const KORD_GUIDE_NEW_PROJECT_CONTENT = `# New Project Guide

Guide for starting a new project with Kord AIOS.

## Prerequisites

- OpenCode >= 1.0.150 installed
- Kord AIOS plugin installed

## Quick Start

1. Run the installer: \`bunx kord-aios init\`
2. Follow interactive prompts
3. Review generated \`.kord/\` structure

## What Gets Created

- \`.kord/templates/\` — Story, ADR, task, checklist templates
- \`.kord/standards/\` — Quality gates and decision heuristics
- \`.kord/guides/\` — This guide and existing-project guide
- \`docs/kord/\` — Plans, stories, epics, drafts directories

## First Steps

1. Create your first story: \`/plan\`
2. Execute via Build: \`/start-work\`
3. Add team members as needed

## Configuration

Edit \`.opencode/kord-aios.json\` to customize:

- Agent models and temperatures
- Background task concurrency
- Disabled hooks/skills

See \`docs/guide/configurations.md\` for details.
`

export const KORD_GUIDE_EXISTING_PROJECT_CONTENT = `# Existing Project Guide

Guide for adding Kord AIOS to an existing project.

## Prerequisites

- OpenCode >= 1.0.150 installed
- Existing project with code

## Quick Start

1. Run: \`bunx kord-aios install\`
2. Configure agents in \`.opencode/kord-aios.json\`
3. Start using \`/plan\` and \`/start-work\`

## Integration Tips

### Migrate Existing Docs

- Move existing specs to \`docs/kord/stories/\`
- Move roadmaps to \`docs/kord/epics/\`
- Move plans to \`docs/kord/plans/\`

### Configure Agents

Start with default configurations, then tune:

- Temperature: 0.1-0.3 for code agents
- Models: Use Opus/Sonnet for planning, Codex for code

### Preserve Workflow

- Keep existing CI/CD
- Adapt Kord methodology to existing processes
- Start small: use \`/plan\` for one feature

## Common Issues

- **Conflicting configs**: Check \`.opencode/\` takes precedence
- **Missing permissions**: Verify \`write_paths\` in config
- **Model issues**: Use doctor: \`bunx kord-aios doctor\`
`

export const CHECKLIST_AGENT_QUALITY_GATE_CONTENT = `---
title: "Agent Quality Gate Checklist"
type: checklist
status: active
created: "{DATE}"
---

# Agent Quality Gate Checklist

Verify agent outputs meet quality standards before accepting work.

## Completeness

- [ ] All acceptance criteria addressed
- [ ] No placeholder comments remaining
- [ ] No "TODO" without description

## Clarity

- [ ] Output is actionable
- [ ] Decisions are explained
- [ ] Next steps are clear

## Technical Quality

- [ ] Code compiles without errors
- [ ] Tests are included
- [ ] No anti-patterns used

## Edge Cases

- [ ] Error cases handled
- [ ] Boundary conditions considered

## Documentation

- [ ] Code comments are meaningful
- [ ] Documentation updated if needed

## Notes

_Additional observations about agent performance_
`
