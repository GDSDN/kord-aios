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
`

export const PRD_TEMPLATE_CONTENT = `---
title: "{TITLE}"
type: prd
status: draft
priority: high
created: "{DATE}"
---

# Product Requirements Document: {TITLE}

## Purpose

_What are we building and why now?_

## Scope

### In Scope

- _In scope item_

### Out of Scope (Non-Goals)

- _Explicitly out of scope item_

## Inputs

- _Context, constraints, and stakeholders_

## Output

- _What changes for users and how success will be measured_

## Acceptance Criteria

- [ ] Requirements are specific and testable (no vague aspirations)
- [ ] Non-goals are explicit
- [ ] Success metrics are measurable

## Verification

- [ ] Stories can be derived without missing information
- [ ] Risks and mitigations are documented

## Failure Modes

- Requirements are ambiguous or untestable
- Missing constraints (integration, performance, security)

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

## Purpose

_Why this epic exists and what it enables._

## Scope

### In Scope

- _Item_

### Out of Scope

- _Item_

## Inputs

- _PRD link(s) and constraints_
- _Dependencies and integration points_

## Output

- _What the system looks like when the epic is complete_

## Acceptance Criteria

- [ ] Waves and dependencies are explicit
- [ ] Stories are independently executable within a wave

## Verification

- [ ] Each story has verification commands or steps

## Failure Modes

- Epic mixes multiple unrelated deliverables
- Dependencies are implicit

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

## Purpose

_Why this task exists and how it supports the story/epic._

## Scope

### In Scope

- _What will be done_

### Out of Scope

- _What will not be done_

## Inputs

- _Story link and relevant docs_
- _Constraints and patterns to follow_

## Output

- _What will be produced/changed (files, behavior)_

## Acceptance Criteria

- [ ] Task completion is objectively verifiable

## Verification

~~~bash
# examples (adapt to project)
bun test
~~~

## Failure Modes

- Missing context causes rework
- Task scope expands beyond a single change

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

## Purpose

_What is being validated and why this gate exists._

## Scope

### In Scope

- _What is validated by this gate_

### Out of Scope

- _What is not validated here_

## Inputs

- _Story link and acceptance criteria_
- _Relevant risk profile_

## Output

- Gate decision: APPROVED / REJECTED / CONDITIONAL

## Acceptance Criteria

- [ ] Gate decision is backed by evidence (tests, logs, manual checks)

## Verification

- [ ] Evidence is recorded in this document

## Failure Modes

- Gate decision made without evidence
- Acceptance criteria not traced to tests/steps

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

## Purpose

_Summarize verification results for a story or release._

## Scope

### In Scope

- _What was tested_

### Out of Scope

- _What was not tested and why_

## Inputs

- _Story link, plan link, and artifacts under test_

## Output

- Pass/fail status and actionable defect list

## Acceptance Criteria

- [ ] Report traces results back to acceptance criteria
- [ ] Defects are actionable and reproducible

## Verification

- [ ] Commands and environments are recorded

## Failure Modes

- Vague defects without reproduction steps
- Results not tied to acceptance criteria

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

- [ ] Title is clear and action-oriented (verb + object)
- [ ] User Story states role, capability, and value (not implementation)
- [ ] Scope is a single deliverable (no hidden sub-stories)
- [ ] Acceptance Criteria are objectively testable (pass/fail)
- [ ] Story includes explicit verification steps (commands or manual steps) tied to AC

## Content

- [ ] Technical Notes include concrete file paths and patterns to follow
- [ ] Dependencies are explicit and actionable (what must exist first)
- [ ] Risks include at least one mitigation (even if "accept risk")
- [ ] "Must NOT" section exists to prevent scope creep

## Quality

- [ ] No ambiguous language ("should", "nice", "as needed") without criteria
- [ ] No placeholders like "TODO" or "TBD" without a follow-up task
- [ ] If behavior changes are risky, rollback plan is described

## Evidence

- [ ] Story references where results will be saved (e.g. \`docs/kord/stories/\`)
- [ ] Verification commands are realistic for this repo (prefer \`bun test\`, \`bun run build\`)
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

- [ ] Code implemented for all acceptance criteria
- [ ] No debug leftovers (console logs, temp flags, commented blocks)
- [ ] No type error suppression (no \`as any\`, \`@ts-ignore\`, \`@ts-expect-error\`)

## Testing

- [ ] Unit tests cover happy path and at least one failure path
- [ ] All relevant tests pass locally
- [ ] If no tests exist, story includes documented verification steps
- [ ] No regressions in previously working flows

## Review

- [ ] Self-review completed (diff reviewed, no unintended files)
- [ ] PR is review-ready (description, screenshots/logs if relevant)
- [ ] Review comments addressed or tracked as follow-ups

## Documentation

- [ ] Documentation updated where behavior changed
- [ ] Operational notes captured (config, env vars, migrations)

## Evidence

- [ ] Commands executed and captured in notes:
  - \`bun test\`
  - \`bun run build\`
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

## Evidence

- [ ] PR description links to story/plan and explains verification
- [ ] Risky changes have rollback notes (feature flag, config toggle, revert path)
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

## Evidence

- [ ] ADR exists for significant trade-offs (when applicable)
- [ ] Integration points are enumerated with concrete file paths
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

## Evidence

- [ ] Ran and recorded:
  - \`bun run typecheck\` (if present)
  - \`bun run build\`
  - \`bun test\`
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

## Evidence

- [ ] If trade-offs were made, they are documented (ADR or story notes)
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

## Read Order (Recommended)

1. \`.kord/rules/project-mode.md\` (injected; current mode/stage + gates)
2. \`.kord/standards/onboarding-depth-rubric.md\` (quality bar for onboarding)
3. \`.kord/standards/methodology-artifacts-quality-rubric.md\` (quality bar for templates/checklists)

For details, see individual directory \`AGENTS.md\` files.
`

export const KORD_STANDARDS_AGENTS_CONTENT = `# .kord/standards — Quality Standards and Heuristics

This directory contains quality gates and decision heuristics for Kord AIOS agents.

## Files

| File | Purpose |
|------|---------|
| \`quality-gates.md\` | Checkpoints that must pass before advancing |
| \`decision-heuristics.md\` | Guidelines for agent decision-making |
| \`onboarding-depth-rubric.md\` | Auditable depth bar for new vs existing onboarding |
| \`methodology-artifacts-quality-rubric.md\` | Auditable quality bar for templates/checklists/standards/skills |

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

## Quality Bar

Guides should follow the rubric:
- \`.kord/standards/onboarding-depth-rubric.md\`
`

export const KORD_STANDARDS_ONBOARDING_DEPTH_RUBRIC_CONTENT = `# Onboarding Depth Rubric

This file defines the minimum acceptable depth for onboarding content.

## Required Sections

### Guides

New project guide MUST include:
- \`## Who This Is For\`
- \`## When Not To Use This\`
- \`## Phases\`
- \`## Gates\`
- \`## Artifacts (Outputs)\`
- \`## Recommended Skills\`
- \`## Verification Commands\`
- \`## Failure Modes\`

Existing project guide MUST include:
- \`## Safety First\`
- \`## Discovery Options\`
- \`## Baseline Gates\`
- \`## Artifacts (Outputs)\`
- \`## Recommended Skills\`
- \`## Verification Commands\`
- \`## What Not To Do\`

### Injected Rules

\`.kord/rules/project-mode.md\` MUST include:
- \`Project Mode:\` (single token value)
- \`Project Stage:\`
- \`Read-first:\`
- \`## Stage Gates\`
- \`## Sunset Clause\`

## Depth Markers

- Phases: numbered or named sequence with clear intent
- Gates: entry/exit criteria with checkable items
- Artifacts: explicit file paths and templates
- Verification: runnable commands or explicit manual steps
- Failure modes: common mistakes + recovery

## Size Budgets

- \`.kord/rules/project-mode.md\`: keep <= 2048 bytes (injected context budget)

## Verification

- Enforced by \`bun test src/cli/scaffolder.test.ts\`.
`

export const KORD_STANDARDS_METHODOLOGY_ARTIFACTS_QUALITY_RUBRIC_CONTENT = `# Methodology Artifacts Quality Rubric

This file defines the minimum quality bar for scaffolded templates, checklists, standards, and mode-relevant skills.

## Templates

Each template in \`.kord/templates/\` MUST include these headings:
- \`## Purpose\`
- \`## Scope\`
- \`## Inputs\`
- \`## Output\`
- \`## Acceptance Criteria\`
- \`## Verification\`
- \`## Failure Modes\`

## Checklists

Each checklist template MUST be:
- Objective: each item can be verified (pass/fail)
- Actionable: includes file paths or commands when relevant
- Risk-aware: includes at least one negative/failure condition

## Standards

Standards MUST:
- Define what "good" looks like
- Include evidence requirements (commands, artifacts)
- Map to Kord flow: \`/plan\` -> \`/start-work\`

## Skills (Mode-Relevant)

Skills used for onboarding MUST:
- Reference real Kord paths (\`.kord/\`, \`.opencode/\`, \`docs/kord/\`)
- Avoid foreign/legacy framework tokens (e.g. \`core-config.yaml\`, \`documentation-integrity\`)
- Provide a clear sequence and outputs
`

export const KORD_STANDARDS_QUALITY_GATES_CONTENT = `# Quality Gates

Advisory checkpoints that agents should verify before marking work complete.

## Planning Gate

- [ ] Requirements are clear and testable
- [ ] Acceptance criteria have pass/fail conditions
- [ ] Dependencies are identified
- [ ] Scope is manageable (single deliverable)

### Evidence

- [ ] A plan exists in \`docs/kord/plans/\` with executable steps
- [ ] Stories reference \`.kord/templates/story.md\` and include verification steps

## Implementation Gate

- [ ] Code compiles without errors
- [ ] Tests pass (unit + integration)
- [ ] Linting passes
- [ ] No type errors
- [ ] No debug code (console.log, etc.)

### Evidence

- [ ] \`bun test\` passes (or failures are documented as pre-existing)
- [ ] \`bun run build\` passes (when the project has a build command)

## Review Gate

- [ ] PR description is complete
- [ ] Code follows project conventions
- [ ] No AI comment bloat
- [ ] No "as any", "@ts-ignore", "@ts-expect-error"

### Evidence

- [ ] PR links to story/plan and includes verification performed

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

## When to Stop and Escalate

- If requirements are mutually exclusive, document it and checkpoint with PO
- If verification is impossible (no tests, no build), document the gap and add a QA plan
- If a change is irreversible, prefer an ADR first
`

export const KORD_GUIDE_NEW_PROJECT_CONTENT = `# New Project Guide

This mode assumes you are starting a new codebase (or a new product/module) and want a traceable delivery pipeline.

## Who This Is For

- Greenfield repositories with no legacy constraints
- Teams that want traceable artifacts (PRD -> Epic -> Stories -> QA)
- Projects where you want agents to follow a consistent methodology

## When Not To Use This

- If you are integrating into an existing codebase with production risk: use \`.kord/guides/existing-project.md\`
- If you need only a one-off experiment and do not want artifacts: keep it lightweight

## Phases

### Phase 0: Confirm Mode and Stage

- Read \`.kord/rules/project-mode.md\` (mode, stage, stage gates)
- If your repo already has substantial code, consider switching to existing-project mode

### Phase 1: Requirements (PRD)

- Create a PRD using \`.kord/templates/prd.md\`
- Ensure requirements are testable and include success metrics

### Phase 2: Architecture + Epic

- Create an epic using \`.kord/templates/epic.md\`
- If architecture decisions are non-trivial, write an ADR using \`.kord/templates/adr.md\`

### Phase 3: Story Cycle

- Create stories using \`.kord/templates/story.md\`
- Validate with PO using \`.kord/templates/checklist-story-draft.md\`
- Implement via \`/start-work\`
- Record QA outcomes using \`.kord/templates/qa-gate.md\` and \`.kord/templates/qa-report.md\`

## Gates

### Planning Gate

- [ ] PRD has clear goals, non-goals, and testable requirements
- [ ] Epic defines waves and dependencies

### Architecture Gate

- [ ] ADR exists for meaningful trade-offs
- [ ] Risks and mitigations are documented

### First Story Gate

- [ ] First story includes verification commands and failure modes
- [ ] Story scope is a single deliverable

## Artifacts (Outputs)

- PRDs: \`docs/kord/prds/\`
- Epics: \`docs/kord/epics/\`
- Stories: \`docs/kord/stories/\`
- Plans: \`docs/kord/plans/\`

## Recommended Skills

- \`greenfield-kickoff\` (create PRD + epic structure)
- \`create-next-story\` (standard story creation)
- \`validate-next-story\` (PO validation)

## Verification Commands

~~~bash
bun test
bun run build
~~~

## Failure Modes

- Writing vague acceptance criteria (fix: rewrite as pass/fail)
- Starting implementation before the first story is validated (fix: PO gate)
- Letting scope creep across multiple deliverables (fix: split story)
`

export const KORD_GUIDE_EXISTING_PROJECT_CONTENT = `# Existing Project Guide

This mode assumes your project has existing behavior that must not be broken.

## Safety First

- Preserve existing behavior by default
- Establish a baseline before refactoring
- Always have a rollback plan for risky changes

## Discovery Options

### Option A: PRD-First (Recommended for big changes)

- Define enhancement scope and constraints first
- Document only the impacted areas

### Option B: Document-First (Recommended when unfamiliar)

- Document the current system reality (including debt)
- Then write PRD/epic with real constraints

## Baseline Gates

- [ ] Tests/build baseline captured (what passes now)
- [ ] Critical flows identified with a minimal repro
- [ ] Rollback plan exists (revert path, feature flag, or staged rollout)

## Artifacts (Outputs)

- Discovery notes: \`docs/kord/notepads/\`
- Draft assessments: \`docs/kord/drafts/\`
- PRDs: \`docs/kord/prds/\`
- Stories: \`docs/kord/stories/\`

## Recommended Skills

- \`document-project\` (brownfield architecture + reality map)
- \`generate-shock-report\` (optional: make UI debt visible)
- \`create-brownfield-story\` (turn discovery into executable story)

## Verification Commands

~~~bash
bun test
bun run build
~~~

## What Not To Do

- Do not rewrite large areas before baseline is established
- Do not change dependencies blindly
- Do not remove tests to "make it pass"
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
