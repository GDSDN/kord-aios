# Methodology Artifacts Quality Rubric

This file defines the minimum quality bar for scaffolded templates, checklists, standards, and mode-relevant skills.

## Templates

Each template in `.kord/templates/` MUST include these headings:
- `## Purpose`
- `## Scope`
- `## Inputs`
- `## Output`
- `## Acceptance Criteria`
- `## Verification`
- `## Failure Modes`

## Checklists

Each checklist template MUST be:
- Objective: each item can be verified (pass/fail)
- Actionable: includes file paths or commands when relevant
- Risk-aware: includes at least one negative/failure condition

## Standards

Standards MUST:
- Define what "good" looks like
- Include evidence requirements (commands, artifacts)
- Map to Kord flow: `/plan` -> `/start-work`

## Skills (Mode-Relevant)

Skills used for onboarding MUST:
- Reference real Kord paths (`.kord/`, `.opencode/`, `docs/kord/`)
- Avoid foreign/legacy framework tokens (e.g. `core-config.yaml`, `documentation-integrity`)
- Provide a clear sequence and outputs
