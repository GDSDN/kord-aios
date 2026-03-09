---
name: qa-gate
description: "qa-gate methodology and workflow"
agent: qa
subtask: false
template: qa-gate.md
---

# QA Gate

## Purpose
Generate a standalone quality gate file that provides a clear pass/fail decision with actionable feedback. This gate serves as an advisory checkpoint for teams to understand quality status before code is merged or pushed to production environments.

## Execution Modes
Choose your execution mode:
- **1. YOLO Mode**: Fast, Autonomous (0-1 prompts). Minimal user interaction.
- **2. Interactive Mode [DEFAULT]**: Balanced, Educational (5-10 prompts). Explicit decision checkpoints.
- **3. Pre-Flight Planning**: Comprehensive Upfront Planning. Zero ambiguity execution.

## Prerequisites
- The story has been reviewed (manually or via a `review-story` task).
- Review findings, test results, and compliance checks are available.
- Full understanding of story requirements and implementation details.

## Gate Decision Criteria

### PASS
- All acceptance criteria are met.
- No high-severity issues identified in the codebase.
- Test coverage meets project standards.
- Documentation and guidelines have been adhered to.
- Action: Update story status from `REVIEW` to `DONE`.

### CONDITIONAL
- Non-blocking issues present (e.g., performance optimizations, minor UX quirks).
- These issues should be tracked and scheduled for future resolution.
- The project can proceed with awareness.
- Action: Update story status from `REVIEW` to `DONE`, but log the conditions.

### FAIL
- Acceptance criteria are NOT met.
- High-severity issues are present (e.g., security vulnerabilities, broken core functionality).
- Action: Return story status to `IN_PROGRESS` or keep in `REVIEW` pending immediate fixes.

## Story Status Lifecycle
- `DRAFT` -> `READY` -> `IN_PROGRESS` -> `REVIEW` -> `DONE`
- QA gate evaluates stories in `REVIEW`.
- `PASS`/`CONDITIONAL` moves the story to `DONE`.
- `FAIL` moves the story back to `IN_PROGRESS`.

## Severity Scale

**FIXED VALUES - NO VARIATIONS:**
- `low`: Minor issues, cosmetic problems, non-functional nits.
- `medium`: Should fix soon, but not a blocker for release.
- `high`: Critical issues, must block release immediately.

## Issue ID Prefixes
When generating issue IDs, use the following standardized prefixes:
- `SEC-`: Security issues (e.g., lack of rate limiting)
- `PERF-`: Performance issues (e.g., slow database queries)
- `REL-`: Reliability issues (e.g., lack of error handling)
- `TEST-`: Testing gaps (e.g., missing unit tests)
- `MNT-`: Maintainability concerns (e.g., convoluted logic)
- `ARCH-`: Architecture issues (e.g., violating established patterns)
- `DOC-`: Documentation gaps (e.g., missing docstrings)
- `REQ-`: Requirements issues (e.g., unmet acceptance criteria)

## Output Requirements

### 1. File Location & Naming
- Create the gate file at: `docs/qa/gates/{epic}.{story}-{slug}.md` using the `.kord/templates/qa-gate.md` template (if available, otherwise fallback to standard YAML schema).
- Slug rules:
  - Convert the story title to lowercase.
  - Replace spaces with hyphens.
  - Strip all punctuation.
  - Example: "User Auth - Login!" becomes `user-auth-login`.

### 2. Story Update
- **ALWAYS** append the QA result to the story's QA Results section.
- Keep the `status_reason` concise (1-2 sentences maximum).
- Use severity values exactly: `low`, `medium`, or `high`.

### 3. File Schema Requirements
The generated QA gate YAML file MUST follow this schema strictly:

```yaml
schema: 1
story: '{epic}.{story}'
gate: PASS|FAIL|CONDITIONAL
status_reason: '1-2 sentence explanation of gate decision'
reviewer: 'Your Agent Name'
updated: '{ISO-8601 timestamp}'
top_issues: [] # Empty array if no issues, or populated with issue objects
conditions: [] # Only populated if CONDITIONAL
```

### 4. Schema with Issues Example
```yaml
schema: 1
story: '1.3'
gate: CONDITIONAL
status_reason: 'Missing rate limiting on auth endpoints poses security risk.'
reviewer: 'QA Agent'
updated: '2025-01-12T10:15:00Z'
top_issues:
  - id: 'SEC-001'
    severity: high
    finding: 'No rate limiting on login endpoint'
    suggested_action: 'Add rate limiting middleware before production'
  - id: 'TEST-001'
    severity: medium
    finding: 'No integration tests for auth flow'
    suggested_action: 'Add integration test coverage'
conditions:
  - 'Implement rate limiting in subsequent story'
```

### 5. Schema when Failed Example
```yaml
schema: 1
story: '1.3'
gate: FAIL
status_reason: 'Critical bug prevents login.'
reviewer: 'QA Agent'
updated: '2025-01-12T10:15:00Z'
top_issues:
  - id: 'SEC-002'
    severity: high
    finding: 'Login throws 500 error.'
    suggested_action: 'Fix server error.'
conditions: []
```

## Anti-Patterns
- Skipping the `top_issues` section when `FAIL` or `CONDITIONAL` is selected.
- Creating custom severity levels (e.g., `critical`, `warning`) instead of `low`, `medium`, `high`.
- Placing the gate file outside the `docs/qa/gates/` directory.
- Not updating the original story file with the gate reference.
- Using a non-English language in the output.
