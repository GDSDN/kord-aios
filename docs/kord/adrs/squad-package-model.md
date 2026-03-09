# ADR: Squad Package Model and Orchestration Boundary

## Status

Accepted

## Context

Kord’s initial squad implementation established a workable team model:

- squad manifests can materialize agents,
- squads use chief/worker hierarchy,
- user/global squad loading exists,
- creation and authority rules exist.

However, deeper comparison with Synkra shows that the target mental model is broader.

In Synkra, squads are not only prompt-declared agent groups. They behave more like domain packages that plug into a larger orchestration substrate with workflows, tasks, scripts, registries, and optional squad-local runtime helpers.

The user explicitly wants Kord to move toward that deeper model while keeping compatibility with Kord’s own engine direction.

At the same time, a separate Kord workflow engine effort already exists in another session/plan. That means the squad redesign must avoid duplicating generic orchestration responsibilities.

## Decision

Kord will treat squads as **orchestration-aware domain packages** that integrate with the shared Kord workflow/orchestration engine.

### Squads are not

- routing categories,
- prompt-only chief wrappers,
- or a separate default orchestration engine that duplicates the shared workflow engine.

### Squads are

- domain packages containing coordinated execution assets,
- teams/subteams with chief-led delegation semantics,
- a packaging and integration layer that plugs into the shared workflow engine,
- and, where necessary, a place to declare optional squad-local adapters for domain-specific runtime behavior.

## Core Architecture Rules

### Rule 1: Shared workflow engine owns generic orchestration

The shared engine owns generic workflow responsibilities such as:

- execution lifecycle,
- state and resume,
- phase/step handling,
- evidence and verification plumbing,
- generic delegation primitives,
- observability and control.

### Rule 2: Squad layer owns package semantics

The squad layer owns:

- package structure,
- squad-local agents/tasks/workflows/templates/checklists/data,
- chief/subteam topology,
- package validation,
- package discovery/loading,
- and optional squad-local adapters.

### Rule 3: Categories are invalid for squads

Squads are teams. Chief coordination is the valid abstraction.

`categories` must therefore be removed from squad semantics and from the squad schema/docs/tests over time.

### Rule 4: Chief delegation is one orchestration pattern, not the whole model

Chief-led delegation remains valid and important, but deep squad support must include package assets and workflow-engine integration, not just prompt behavior.

### Rule 5: Validation and creation must become package-aware

Squad validation and squad creation must evolve from shallow manifest/prompt handling into deterministic package-oriented processes.

## Consequences

### Positive

- Aligns Kord with the desired Synkra-level mental model without blindly cloning Synkra implementation details.
- Prevents duplicate orchestration engines.
- Gives a clear place for squad tasks/workflows/assets to live.
- Makes room for Kord to improve beyond Synkra through clearer boundaries and stronger validation.

### Costs

- Previously implemented squad work must be revisited and partially refactored.
- Schema, validator, creator, loader/factory, and docs all require coordinated updates.
- Migration planning becomes mandatory rather than optional.

### Required follow-up

- Define the next-generation squad package schema.
- Remove `categories`.
- Define workflow-engine integration contracts.
- Upgrade validator and creator depth.
- Migrate docs and tests.

## Alternatives Considered

### 1. Keep squads as shallow agent teams

Rejected.

Reason:

- too shallow for the desired outcome,
- mismatched with the researched Synkra mental model,
- would preserve ambiguity and underpowered execution semantics.

### 2. Build a completely separate squad engine

Rejected as the default.

Reason:

- high duplication risk with the shared workflow engine,
- weaker architecture clarity,
- unnecessary divergence unless a domain proves it needs custom adapters.

### 3. Shared engine plus squad package layer

Accepted.

Reason:

- preserves clear layering,
- matches the desired direction most closely,
- and still allows optional squad-local extensions where needed.

## References

- `docs/kord/analyses/squads/synkra-execution-model.md`
- `docs/kord/analyses/squads/kord-current-state-gap-analysis.md`
- `docs/kord/analyses/squads/orchestration-boundary.md`
- `docs/kord/analyses/squads/migration-keep-adapt-remove.md`
- `docs/kord/plans/squad-orchestration-deepening.md`
