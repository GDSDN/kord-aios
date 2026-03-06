# Stories: Squad Orchestration Deepening

## Epic

Transform Kord squads from shallow chief-managed agent teams into orchestration-aware domain packages that integrate with Kord’s shared workflow engine and support Synkra-level depth with Kord-specific improvements.

## Story 1: Define the next-generation squad package schema

### Goal

Redesign squad schema semantics so squads can represent the correct package model rather than only agent declarations.

### Scope

- remove `categories`
- define package-oriented fields
- model squad-local assets and integration points
- preserve a clean boundary with the shared workflow engine

### Acceptance Criteria

- Squad schema no longer treats `categories` as a valid squad concept
- Schema direction supports more than agent declarations
- Schema clearly distinguishes shared engine concerns from squad package concerns
- Migration implications for existing manifests are documented

### References

- `docs/kord/adrs/squad-package-model.md`
- `docs/kord/analyses/squads/orchestration-boundary.md`
- `src/features/squad/schema.ts`
- `D:\dev\synkra-aios\.aios-core\schemas\squad-schema.json`

## Story 2: Redesign squad runtime materialization around the package model

### Goal

Adapt squad loader/factory/runtime behavior so squads are represented as orchestration-aware packages and not only runtime-generated agents.

### Scope

- revise package loading expectations
- define runtime metadata for squad assets
- align chief/subteam semantics with deeper orchestration goals

### Acceptance Criteria

- Runtime model represents squad packages, not just materialized agents
- Chief/subteam relationships remain valid in the deeper model
- Runtime model exposes enough metadata for validators and the shared workflow engine

### References

- `src/features/squad/loader.ts`
- `src/features/squad/factory.ts`
- `src/features/squad/chief-template.ts`
- `docs/kord/analyses/squads/kord-current-state-gap-analysis.md`

## Story 3: Define the shared workflow-engine integration contract for squads

### Goal

Specify exactly how squad packages interact with the separate Kord workflow engine effort.

### Scope

- define ownership boundaries
- define package-to-engine interaction points
- allow optional squad-local adapters without duplicating engine responsibilities

### Acceptance Criteria

- Shared engine responsibilities are explicit
- Squad responsibilities are explicit
- Optional squad-local adapters are documented as extensions, not default engine duplication
- The resulting contract is usable by both the squad work and the workflow-engine work

### References

- `docs/kord/analyses/squads/orchestration-boundary.md`
- `docs/kord/adrs/squad-package-model.md`

## Story 4: Upgrade squad validation to package integrity and orchestration readiness

### Goal

Expand validation from shallow manifest checks into package-level structural validation.

### Scope

- validate skill existence
- validate package completeness
- validate asset references
- validate chief/subteam integrity
- validate workflow-engine compatibility
- emit actionable migration warnings

### Acceptance Criteria

- Validator scope includes package integrity, not just syntax
- Missing skills are detected with actionable error output
- Category-based legacy manifests are rejected or migrated according to the chosen migration policy
- Validation results help migrate older squads to the new model

### References

- `src/tools/squad-validate/tools.ts`
- `docs/kord/analyses/squads/migration-keep-adapt-remove.md`
- `docs/kord/analyses/squads/migration-and-opportunities.md`

## Story 5: Upgrade squad creator to deterministic package authoring

### Goal

Deepen squad creation so it can produce high-quality package-oriented squads rather than generic agent bundles.

### Scope

- research-first creation flow
- package-aware generation
- anti-generic agent/task/workflow generation discipline
- stronger validation during creation

### Acceptance Criteria

- Creator supports package-oriented outputs beyond agents
- Creator guidance explicitly avoids shallow/generic squad generation
- Creator aligns with the new package schema and validation model
- Creator documentation reflects the deeper orchestration mental model

### References

- `src/agents/squad-creator.ts`
- `src/features/builtin-agents/squad-creator.md`
- `src/features/builtin-commands/templates/squad-create.ts`
- `D:\dev\synkra-aios\squads\squad-creator\tasks\create-agent.md`
- `D:\dev\synkra-aios\docs\guides\agents\SQUAD-CREATOR-SYSTEM.md`

## Story 6: Migrate current squad implementation to the deeper architecture

### Goal

Refactor existing squad code and assets using the keep/adapt/remove classification rather than starting from scratch blindly.

### Scope

- preserve valid foundations
- refactor shallow layers
- remove invalid semantics
- update tests/examples/built-in seeds

### Acceptance Criteria

- Existing squad implementation is classified and migrated deliberately
- No retained artifact still teaches categories as squad semantics
- Useful foundations are preserved where compatible
- Tests/examples align with the new mental model

### References

- `docs/kord/analyses/squads/migration-keep-adapt-remove.md`
- `docs/kord/plans/plan-3-squads-authority.md`
- `docs/kord/plans/squad-orchestration-deepening.md`

## Story 7: Refresh documentation and contributor guidance

### Goal

Update all relevant docs so Kord teaches the correct squad mental model consistently.

### Scope

- architecture docs
- contributor docs
- usage docs
- squad subsystem docs
- creator docs/templates

### Acceptance Criteria

- `AGENTS.md` reflects the deeper package/orchestration model
- `README.md` and squad guides explain the new model clearly
- No documentation still describes squads as categories or delegation-only wrappers
- Migration guidance is discoverable for contributors

### References

- `docs/kord/analyses/squads/documentation-impact.md`
- `AGENTS.md`
- `README.md`
- `src/features/squad/AGENTS.md`

## Suggested Delivery Sequence

1. Story 1
2. Story 3
3. Story 2
4. Story 4
5. Story 5
6. Story 6
7. Story 7

## Suggested Parallelism

- Stories 1 and deep evidence review can start first
- Story 2 should follow Story 1 and Story 3
- Story 4 can begin once Stories 1 and 3 stabilize
- Story 5 depends on Stories 1, 3, and 4
- Story 6 depends on Stories 2, 4, and 5
- Story 7 should run near the end but can draft early based on the ADR and schema decisions
