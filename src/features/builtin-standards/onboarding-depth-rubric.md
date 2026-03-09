# Onboarding Depth Rubric

This file defines the minimum acceptable depth for onboarding content.

## Required Sections

### Project-Type Instructions

Greenfield instruction MUST include:
- `## Who This Is For`
- `## When Not To Use This`
- `## Phases`
- `## Gates`
- `## Artifacts (Outputs)`
- `## Recommended Skills`
- `## Verification Commands`
- `## Failure Modes`

Brownfield instruction MUST include:
- `## Safety First`
- `## Discovery Options`
- `## Baseline Gates`
- `## Artifacts (Outputs)`
- `## Recommended Skills`
- `## Verification Commands`
- `## What Not To Do`

### Core Rules

`.kord/instructions/kord-rules.md` MUST include:
- workflow and delegation rules
- canonical `docs/kord/` and `.kord/` path guidance
- content-layer vs override guidance where relevant

## Depth Markers

- Phases: numbered or named sequence with clear intent
- Gates: entry/exit criteria with checkable items
- Artifacts: explicit file paths and templates
- Verification: runnable commands or explicit manual steps
- Failure modes: common mistakes + recovery

## Size Budgets

- `.kord/instructions/kord-rules.md`: keep focused enough to stay high-signal when injected
- `.kord/instructions/greenfield.md`: prefer concise guidance over exhaustive duplication of workflow detail
- `.kord/instructions/brownfield.md`: prefer concise guidance over exhaustive duplication of workflow detail

## Verification

- Enforced by `bun test src/cli/scaffolder.test.ts`.
