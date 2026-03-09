# ADR-0003: YAML Workflow Support (Engine-first, Boulder-integrated)

> Status: Draft
> Created: 2026-03-06

## Context

Synkra provides YAML workflows and a deterministic orchestrator with file/session state, validation, conditions, and parallel step dispatch. Kord AIOS currently executes `docs/kord/plans/*.md` via `/start-work` with persistent progress in `docs/kord/boulder.json`, but has no native workflow runner.

The user requirement is explicit: workflows include interviews, brainstorm, parallel steps, agent switching, and must not skip steps; therefore “compile YAML to a plan” alone is insufficient.

## Decision

Implement a native YAML workflow runner/state machine as the primary execution path, while reusing Boulder as a lightweight resume pointer and progress ledger.

Additionally, implement an optional workflow-to-plan export view for readability/auditability (not the execution source of truth).

## Decision Drivers

- Enforceable step ordering (no skipping) and resumability across sessions.
- First-class parallelism + joins + deterministic condition evaluation.
- Compatibility with Kord’s agent delegation (`task()`) and background task subsystem.
- Ability to validate required/produced artifacts deterministically.

## Consequences

Positive:

- Matches the workflow UX Synkra users expect while keeping Kord’s artifact-first pipeline.
- Enables incremental support (sequential runner first, then parallel/conditions) without breaking existing plan execution.

Negative:

- Higher implementation complexity than a compiler; requires a versioned workflow spec and state migrations.
- Introduces a second execution domain (plan vs workflow) that must be surfaced clearly in `/status` and resume flows.

## Alternatives Considered

1. Workflow-to-plan compiler only.
   - Too lossy for parallelism/conditions and too easy to “drift” into skipped steps.

2. Native runner with YAML state files (Synkra-style) instead of JSON.
   - Rejected for v1 to align with existing `docs/kord/boulder.json` JSON tooling and reduce parsing/merge edge cases.

## Follow-ups

- Add `docs/kord/architecture/yaml-workflow-engine.md` as the detailed design spec.
- Define a v1 YAML schema and validator command (`/workflow validate`).
- Add a `docs/kord/workflow-runs/` state location and Boulder pointer field.
