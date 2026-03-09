# Squad Orchestration Boundary for Kord

## Purpose

Define the boundary between the separate Kord workflow engine effort and the squad system, so the squad redesign does not duplicate engine responsibilities.

## Architectural Principle

Kord should prefer **one shared orchestration engine** with squad-aware extensions, not two fully separate orchestration engines.

## Recommended Boundary

### Shared Kord workflow/orchestration engine owns

- workflow execution lifecycle,
- workflow state and resume behavior,
- generic phase/step execution semantics,
- artifact/state tracking,
- generic delegation primitives,
- scheduling/parallelism semantics,
- evidence and verification plumbing,
- engine-wide observability and control.

### Squad layer owns

- package definition for a domain team,
- squad-local agents/tasks/workflows/templates/checklists/data,
- chief/subteam topology,
- squad-specific routing hints,
- squad-specific validation rules,
- packaging/discovery/manifest resolution,
- optional squad-local adapters when domain execution needs custom runtime behavior.

## Mental Model

### Recommended model

`workflow engine = execution substrate`

`squad = orchestration-aware package loaded into that substrate`

This means a squad is not itself the engine. It is a structured bundle that the engine can execute coherently.

## Why this boundary is correct

### Avoids duplication

If Kord builds a standalone squad engine plus a standalone workflow engine, both will tend to grow overlapping features:

- state,
- routing,
- lifecycle,
- retries,
- progress,
- checkpoints,
- evidence.

That creates fragmentation and inconsistent behavior.

### Matches Synkra’s deeper model

Synkra appears to distinguish between:

- general workflow/orchestration systems,
- and squad packages that plug into them.

Kord can mirror that mental model while adapting implementation details to its own runtime.

### Still leaves room for squad-specific execution logic

Some domains may need squad-local runtime helpers or adapters.

This should be allowed, but as an extension mechanism rather than a second core engine.

## Practical Kord Design Rules

### Rule 1

Squads must not re-invent generic workflow lifecycle features.

### Rule 2

Squads may contribute package-local workflows/tasks that the shared engine can run.

### Rule 3

Chief delegation is one execution pattern inside squad packages, not the entire definition of squad orchestration.

### Rule 4

Where squad-specific runtime behavior is needed, represent it as explicit adapters/hooks/scripts instead of undocumented prompt-only behavior.

### Rule 5

Validation must check both package integrity and engine compatibility.

## Design Consequences for the Revised Plan

The squad redesign plan should include:

- package schema redesign,
- categories removal,
- package asset discovery,
- workflow-engine integration contract,
- chief/subteam orchestration semantics,
- deterministic creator/validator improvements,
- migration strategy from current shallow model.

It should **not** attempt to fully implement the shared workflow engine inside the squad plan. That remains the other plan’s responsibility.

## Default Assumption for Planning

Until proven otherwise, all new squad orchestration behavior should be designed as:

- **dependent on the shared workflow engine**,
- **with an explicit compatibility adapter layer**,
- and **with optional squad-local adapters only where the domain requires them**.
