# ADR: Kord Content Layer Target Architecture

**Status:** Accepted
**Date:** 2026-03-07
**Author:** Architect / Planner consolidation
**Supersedes:** Prior fragmented content-layer notes and contradictory plan assumptions

---

## Context

Kord AIOS is being built as a self-improving system:

- the **engine layer** executes, routes, validates, loads, and enforces contracts
- the **content layer** carries methodology and evolves over time

The current repository mixes these layers. The main ambiguities are:

- workflows exist in three different depths/locations
- agent prompt ownership is split between `src/agents` and `src/features/builtin-agents`
- methodology content still lives in `src/cli/project-layout.ts`
- some methodology skills are file-based while others remain trapped in TS
- command export exists even though commands are engine behavior, not exportable methodology

The goal is not to mimic Synkra literally. The goal is to define a Kord-native architecture that can evolve safely while borrowing the useful content-packaging ideas from Synkra/AIOX.

---

## Problem Statement

Before implementation, the architecture must answer clearly:

1. What is the canonical source of truth per category?
2. What belongs to engine vs methodology/content?
3. Where do workflows, subagents, skills, squads, templates, and instructions live?
4. What gets exported by `init`, and what remains builtin-only?
5. What role, if any, does `extract` still play?
6. Which existing duplicates must be removed to eliminate ambiguity?

---

## Architecture Decision

### Core Rule

If something encodes **what to do, how to act, or what to produce**, it is **content**.

If something **dispatches, hooks, loads, validates, routes, or executes**, it is **engine**.

### Primary Delivery Rule

`init` is the primary delivery mechanism for the content layer.

- Users should receive the full approved content layer through `init`
- exported project-local copies are the editable/override layer
- builtin assets remain the source of truth for the framework itself

### Override Rule

Builtin content is the framework source of truth.

Project-local copies in `.kord/**` and `.opencode/**` are exported working copies / overrides.

Runtime precedence remains:
- local override first
- builtin fallback second

But builtin must remain canonical, so local richness cannot silently outgrow shipped builtin content forever.

---

## Engine Layer (Builtin-Only, Never Exported)

These remain engine-only:

- T0 orchestrators in `src/agents/*.ts`
- hooks in `src/hooks/`
- tools in `src/tools/`
- plugin infrastructure in `src/index.ts`, `src/plugin-handlers/`, `src/plugin-state.ts`
- background agent manager
- MCP clients and transport
- workflow runtime code in `src/features/workflow-engine/*.ts`
- skill loaders / agent loaders / runtime registries
- CLI machinery (`install`, `doctor`, config management, plumbing)
- engine-bound runtime skills like `playwright.ts` and `agent-browser.ts`
- builtin commands as engine behavior/registration

### Commands Decision

Builtin commands are **engine**, not exportable methodology.

They should not be exported to `.opencode/commands/` as part of the target architecture.

If user-facing command content is ever needed later, that must be a separate design, not the current broken TS export path.

---

## Exportable Content Layer

These belong to the methodology/content layer and are exported by `init`:

- workflows
- exportable agents / subagents
- methodology skills under `src/features/builtin-skills/skills/kord-aios/**`
- squads
- templates
- checklists
- instructions
- standards
- scaffolded AGENTS guidance / project-facing docs

---

## Canonical Source of Truth by Category

| Category | Canonical Source | Exported To | Notes |
|---|---|---|---|
| T0 runtime agents | `src/agents/*.ts` | not exported | engine-only |
| Agent prompt source-of-truth | `src/features/builtin-agents/` | exported subset to `.opencode/agents/` | single source of truth for prompt content |
| Methodology skills | `src/features/builtin-skills/skills/kord-aios/**/SKILL.md` | `.opencode/skills/` | export all methodology skills |
| Runtime-bound skills | TS only | not exported | only if truly execution-bound |
| Squads | `src/features/builtin-squads/` | `.opencode/squads/` | exportable methodology |
| Workflows | `src/features/builtin-workflows/*.yaml` | `.kord/workflows/` | all 14 curated workflows shipped + exported |
| Templates | `src/features/builtin-templates/` | `.kord/templates/` | exportable content |
| Checklists | `src/features/builtin-checklists/` | `.kord/checklists/` | exportable content |
| Instructions | `src/features/builtin-instructions/` | `.kord/instructions/` | unified agent-facing instruction content |
| Standards | `src/features/builtin-standards/` | `.kord/standards/` | exportable content |
| Scaffolded AGENTS/project guidance | `src/features/builtin-docs/` | project files during init | exportable content |

### Agent Source-of-Truth Decision

There must be **one** prompt source of truth for exportable methodology agents/subagents.

Confirmed rule:
- T2 methodology agent prompt content lives in `src/features/builtin-agents/*.md`
- `src/features/builtin-agents/prompts.ts` is a generated build artifact, not an authoring source
- `src/agents/*.ts` for those T2 agents are runtime wrappers/config adapters only
- exportability is controlled by metadata/manifest, not by duplicate prompt copies in different directories

Engine-only agents do not follow the exportable markdown pattern:
- T0 orchestrators remain engine-owned in `src/agents/*.ts`
- T1 specialists remain engine-owned in `src/agents/*.ts` unless a future product decision explicitly makes them exportable

This narrows the real risk: not every agent is duplicated today, but the architecture must explicitly protect the wrapper-vs-content boundary so prompt edits cannot drift in the future.

---

## Delivery Model (`init`, `install`, `extract`, runtime)

### `init`

`init` exports the approved full content layer.

There are **no profile variants** in the target architecture.

The user explicitly decided:
- do not maintain `minimal/default/full`
- `init` should export everything we define as part of the methodology/content layer

### `install`

`install` remains plugin setup only.
It is engine-layer plumbing and does not define content ownership.

### `extract`

`extract` is removed from the target content-delivery architecture.

Under the corrected architecture:
- `init` is the single supported delivery path for framework content
- users receive the full approved content layer during `init`
- no product-critical content category depends on a separate extract command

If any internal refresh or migration utility survives later, it is implementation detail rather than a user-facing architectural pillar.

### Runtime

Runtime uses local project/user content first and builtin content second.

This preserves customization while keeping builtin assets as the framework source of truth.

---

## Synkra Content Adoption / Import Strategy

### What we borrow

- file-based methodology ownership
- workflow richness and multi-phase depth where appropriate
- content-as-assets mindset
- future drift/update awareness

### What we reject

- mirroring Synkra directory structure literally
- treating engine and content as the same layer
- bundling the whole engine into the project

### What still needs to be imported/adapted

For workflows, the answer is **not new import work**.

The 14 `.kord/workflows/*.yaml` files already represent the richer adapted working set. The remaining work is:
- classify them
- promote them into builtin canonical workflow content
- remove/reclassify duplicate non-canonical copies

For other content categories, the work is not “import from Synkra” so much as:
- align Kord’s content ownership model
- ensure our builtin content layer is complete and canonical

---

## Workflow Strategy

### Canonical Rule

All 14 workflows currently in `.kord/workflows/` must be reviewed as the candidate canonical catalog.

The target architecture is:
- builtin workflow catalog in `src/features/builtin-workflows/` is the source of truth
- `init` exports that full approved catalog to `.kord/workflows/`
- project-local files are editable overrides

### Greenfield Decision

The simplified builtin `src/features/builtin-workflows/greenfield-fullstack.yaml` does **not** remain the canonical shipped version.

The richer imported/adapted version from `.kord/workflows/greenfield-fullstack.yaml` is the promotion baseline.

### Catalog Rule

The same rule applies to all 14 workflows:
- either promote into builtin canonical content
- or mark as non-shipped reference-only and remove them from the live exported/runtime ambiguity path

There must not remain:
- one simplified builtin
- one different scaffolded copy
- one richer local copy
- all simultaneously treated as valid

---

## Agent Strategy

### T0

- stays engine-only in `src/agents/*.ts`
- not exported

### T1 specialists

- `architect`, `librarian`, `explore`, `vision`, and similar runtime specialists remain engine-only
- they are not part of the exportable methodology layer
- if any future T1 agent needs user-overridable prompt content, it must be explicitly migrated rather than duplicated ad hoc

### Exportable methodology agents/subagents

- prompt content lives in `src/features/builtin-agents/*.md`
- exported subset goes to `.opencode/agents/`
- runtime wrappers/config in `src/agents/*.ts` or loaders read from the canonical prompt source rather than embedding duplicate prompt bodies
- current T2 methodology agents already mostly follow this pattern and should be treated as the baseline architecture

### Implication

Agent export requires a script/loader path that:
- knows which agents are exportable
- reads the canonical prompt source
- exports only those marked as methodology content

---

## Skills Strategy

### Methodology skills

Everything under:
- `src/features/builtin-skills/skills/kord-aios/**`

is content-layer methodology and should be exported.

### Runtime-only skills

Only genuinely engine-bound skills remain compiled and non-exported.

### Hardcoded methodology skills

These should be migrated out of TS into the content layer if they are methodology, not runtime machinery.

---

## Commands Strategy

Commands stay in the engine layer.

- runtime registration remains TS
- builtin commands are not exported as part of the methodology layer
- the current command extraction/export behavior is not part of the target architecture and should be removed or reduced accordingly

---

## Project-Type Guidance Strategy

Project-type guidance is consolidated into a single instruction surface.

Target rule:
- agent-facing instruction content lives under `.kord/instructions/`
- canonical builtin source lives under `src/features/builtin-instructions/`
- `kord-rules.md` becomes instruction content, not a separate semantic category
- workflows are the primary execution path for greenfield and brownfield methodology
- standalone kickoff/documentation skills become secondary escape hatches, not the primary scaffolded path
- installer detection remains the only project-type selection mechanism
- no persistent project-state file is required in the target architecture

Export rule:
- `init` always exports the core instruction file (for example `kord-rules.md`)
- `init` exports exactly one project-type instruction file: `greenfield.md` or `brownfield.md`
- internal backend detection may still use `new|existing`, but exported/user-facing methodology uses `greenfield|brownfield`

Removal rule:
- legacy `project-mode.md` does not survive as an exported project-guidance surface
- legacy `new-project.md` / `existing-project.md` guide files do not survive as active project-type instruction surfaces
- if retained for history, those legacy surfaces move only to non-product documentation paths under `docs/kord/**`
- they must not remain in `.kord/**`, runtime hook scan paths, or init/scaffolder outputs

## Instructions / Templates / Standards / Checklists Strategy

All of these are methodology content and must move out of `src/cli/project-layout.ts` into canonical builtin directories.

`project-layout.ts` should become plumbing only.

---

## Risks

- promoting the richer workflow catalog may reveal runtime/schema gaps that the current engine still does not fully support
- agent prompt unification may require runtime wrapper refactors to avoid duplicate prompt ownership
- removing profile logic means the shipped content set must be carefully bounded up front
- command export removal may break any current users relying on that path
- consolidating legacy rule/guide surfaces into instructions requires hook/runtime alignment so the right instruction files are injected or read

---

## Rejected Alternatives

- keep multiple live workflow sources and let precedence sort it out
- keep `project-layout.ts` as a hidden content source
- keep exportable agent prompts duplicated between `src/agents` and `src/features/builtin-agents`
- keep profiles `minimal/default/full`
- make `extract` the main delivery path
- export builtin commands as methodology content

---

## Immediate Implementation Implications

The current master plan needs targeted corrections:

1. remove profile-driven assumptions
2. treat `init` as the primary full-content export path
3. remove `extract` from the product-facing content-delivery architecture
4. make the 14-workflow catalog promotion a central architectural migration step
5. treat T2 markdown prompts plus TS wrappers as the canonical exportable agent pattern
6. remove command export from the content-delivery target
7. consolidate project guidance into `.kord/instructions/` with installer-only project-type detection and no persistent state file

---

## Gaps Still Unresolved

- exact runtime compatibility status of every one of the 14 workflows after promotion
- the implementation shape of the agent export/sync script
- whether any internal non-user-facing refresh utility is still worth keeping after `extract` is removed from the product surface
