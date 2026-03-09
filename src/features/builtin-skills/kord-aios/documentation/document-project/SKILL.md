---
name: document-project
description: "Create a brownfield baseline + architecture map for an existing codebase"
agent: dev
subtask: false
---

# Document Project (Brownfield Baseline)

Create a reality-based baseline and architecture map for an existing codebase.

## Purpose

- Give agents enough context to make safe changes without breaking existing behavior
- Capture the actual constraints, workarounds, and technical debt (not aspirational design)

## When to Use

- Existing codebase (brownfield)
- Onboarding new engineers/agents
- Before large refactors, migrations, or high-risk features

## Outputs

Write these artifacts:

- `docs/kord/drafts/brownfield-architecture.md`
- `docs/kord/drafts/baseline-verification.md`

If scope is huge, add working notes under `docs/kord/notepads/`.

## Instructions

1. Determine scope
   - If a PRD exists, document only impacted areas.
   - If no PRD exists, document the whole system at a practical level.

2. Capture the baseline
   - Identify the real build/test commands.
   - Record what passes/fails today and why (pre-existing failures).

3. Map the codebase reality
   - Entry points, core flows, and where business logic lives.
   - Integration points (DB, external services, queues, auth, payments).
   - Conventions actually used (folder structure, naming, error handling, testing patterns).

4. Capture risk and constraints
   - Technical debt, workarounds, "do not touch" areas.
   - Performance/security constraints.
   - Rollback options for risky changes.

5. If PRD exists: impact analysis
   - Identify concrete files likely to change.
   - Call out breaking-change risks and mitigation.

## Quality Bar

The documentation MUST include:

- A source tree overview (real paths)
- The build/test baseline with commands
- A "Technical Debt and Gotchas" section
- A "Safe Change Strategy" section (rollback notes)

## Must NOT Do

- Do not invent commands, paths, or architecture.
- Do not describe ideal future architecture unless explicitly requested.
