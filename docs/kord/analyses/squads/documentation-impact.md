# Documentation Impact for Deep Squad Orchestration

## Purpose

Identify the documentation surfaces that must change when Kord squads move from a shallow agent-team feature to a deep orchestration-aware package model.

## Why this matters

If code changes without documentation changes, Kord will keep teaching the wrong mental model.

The documentation update is therefore part of the architecture migration, not a cleanup after implementation.

## Documentation surfaces that must be updated

### Core knowledge and architecture

- `AGENTS.md`
  - Update the project-level explanation of what squads are and how they relate to the workflow/orchestration engine.
- squad architecture docs under `src/features/squad/`
  - Explain squads as packages, not only team manifests.
- architecture/ADR docs under `docs/kord/`
  - Record the boundary between shared engine responsibilities and squad-layer responsibilities.

### User-facing usage docs

- `README.md`
  - Explain the intended squad model, high-level user value, and expected structure.
- command/guides docs for squad creation and usage
  - Clarify what squad creation now generates and how squad execution works.
- any docs describing built-in/exported squads
  - Clarify seed/export behavior versus runtime behavior.

### Agent/system prompt docs

- `src/features/builtin-agents/squad-creator.md`
  - Must align with the deeper package/orchestration model.
- `src/features/builtin-commands/templates/squad-create.ts`
  - Must reflect the revised authoring flow and expected outputs.
- any `AGENTS.md` files referencing squad categories or shallow squad semantics
  - Must be updated to remove that framing.

### Validation and contributor guidance

- validator docs for squad manifests
  - Must explain richer integrity checks.
- contributor docs for creating squads
  - Must explain package assets, workflow integration, and migration expectations.

## Required documentation outcomes

- No doc should describe squads as categories.
- No doc should imply that squad support is only chief prompt delegation.
- Docs should clearly distinguish:
  - shared workflow engine,
  - squad package model,
  - optional squad-local adapters.
- Docs should explain migration from the current shallow model.

## Recommendation

Treat documentation refresh as a dedicated workstream in the implementation plan, with explicit acceptance criteria and file-level scope.
