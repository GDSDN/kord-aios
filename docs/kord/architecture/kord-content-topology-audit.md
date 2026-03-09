# Kord Content Topology Audit

## Scope

This artifact captures the current Kord-side content topology before the master execution plan is rewritten again.

> Note: this artifact records the pre-alignment topology, not the final target contract.
>
> Authoritative final decisions now live in:
> - `docs/kord/architecture/content-layer-target-architecture-adr.md`
> - `docs/kord/architecture/content-source-canonical-map.md`
> - `docs/kord/plans/content-layer-curated-export-alignment.md`
>
> Key superseding decisions:
> - `init` is the only supported content-delivery path
> - `extract` is removed from the product-facing architecture
> - agent-facing project guidance is unified under `.kord/instructions/`
> - public methodology naming uses `greenfield|brownfield`

It focuses on:
- canonical source ownership
- delivery surfaces
- override behavior
- duplication or fragmentation
- concrete architecture debt

## Category Matrix

| Category | Current Source | Delivery Surface | Override Surface | Current Problem |
|---|---|---|---|---|
| T0 agents | compiled `src/agents/*.ts` | runtime only | none | intentional builtin-only engine layer |
| Builtin agents (T2 etc.) | `src/features/builtin-agents/*.md` | runtime + extract | `.opencode/agents/` | relatively clean, but still needs contract placement |
| Methodology skills | `src/features/builtin-skills/skills/kord-aios/{domain}/{skill}/SKILL.md` | runtime + extract | `.opencode/skills/` | extract currently flattens domain hierarchy |
| Hardcoded skills | `src/features/builtin-skills/skills/*.ts` | runtime only | none | exportable methodology is locked in TypeScript |
| Builtin squads | `src/features/builtin-squads/code/SQUAD.yaml` | extract seed | `.opencode/squads/` | currently only one builtin squad seed |
| Builtin commands | `src/features/builtin-commands/templates/*.ts` + `commands.ts` | runtime + extract (broken) | intended `.opencode/commands/` | extract currently copies `.ts` source instead of markdown command assets |
| Builtin workflows | `src/features/builtin-workflows/*.yaml` | runtime + scaffold | `.kord/workflows/` | only 1 builtin workflow exists |
| Scaffolded workflows | hardcoded in `src/cli/scaffolder.ts` via `BUILTIN_WORKFLOW_YAMLS` | init/scaffold | `.kord/workflows/` after scaffold | scaffolder exposes 2 workflows, not the full set |
| Project-local workflows | `.kord/workflows/*.yaml` | project-local runtime override | same directory | 14 workflows exist locally, but are not the builtin shipped catalog |
| Templates | string constants in `src/cli/project-layout.ts` | scaffold only | `.kord/templates/` after scaffold | hidden canonical source, not extractable |
| Checklists | string constants in `src/cli/project-layout.ts` | scaffold only | `.kord/templates/` after scaffold | hidden canonical source, not extractable |
| Guides | string constants in `src/cli/project-layout.ts` | scaffold only | `.kord/guides/` after scaffold | hidden canonical source, not extractable |
| Standards | string constants in `src/cli/project-layout.ts` | scaffold only | `.kord/standards/` after scaffold | hidden canonical source, not extractable |
| Rules | string constants in `src/cli/project-layout.ts` | scaffold only | `.kord/rules/` after scaffold | hidden canonical source, not extractable |
| Scaffolded AGENTS guidance | string constants in `src/cli/project-layout.ts` and scaffold logic | scaffold only | project files after scaffold | hidden canonical source mixed into CLI plumbing |

## Concrete Workflow Discrepancy

The workflow layer is currently fragmented across three places:

1. Builtin shipped workflows:
   - `src/features/builtin-workflows/greenfield-fullstack.yaml`
   - count today: **1**

2. Scaffolder assumptions:
   - `src/cli/scaffolder.ts:177`
   - `src/cli/scaffolder.ts:178`
   - hardcoded scaffold exports: `greenfield-fullstack`, `brownfield-discovery`

3. Project-local workflow catalog:
   - `.kord/workflows/*.yaml`
   - count today: **14**

This means the system currently has no single canonical workflow source.

## Greenfield Fullstack Depth Discrepancy

### Builtin shipped version

`src/features/builtin-workflows/greenfield-fullstack.yaml` is heavily simplified:
- 3 high-level sequence steps only
- interview -> research -> handoff_to_plan
- no explicit multi-phase environment bootstrap / planning / sharding / development cycle depth

### Project-local Kord version

`.kord/workflows/greenfield-fullstack.yaml` is far richer:
- imported Synkra metadata retained
- multi-phase structure retained in metadata and adapted sequence
- detailed handoff prompts, decision guidance, raw workflow embedding, and many agent steps preserved

### Synkra original

`D:/dev/synkra-aios/.aios-core/development/workflows/greenfield-fullstack.yaml` contains:
- full phase model
- explicit sequence with many steps
- optional paths
- rich notes/handoffs/guidance
- significantly higher methodology depth than the builtin shipped Kord workflow

## Architectural Meaning Of The Workflow Gap

This is not just a missing-file issue.

It means Kord currently has:
- a **simplified builtin** workflow source
- a **different scaffolded** workflow subset
- a **richer local dev-only** workflow set

So before implementation, the architecture plan must answer:
- which workflow definitions become canonical builtin shipped content
- which workflows stay project-only or reference-only
- whether simplification is intentional product design or accidental drift
- whether scaffold/install/export should use the exact builtin catalog or a curated subset declared by manifest/profile

## Commands Extract Gap

`src/cli/extract.ts` currently reads command source files from:
- `src/features/builtin-commands/templates/*.ts`

This means extracted commands are source templates, not user-facing markdown command assets.

Current proof:
- `src/cli/extract.ts:11`
- `src/cli/extract.ts:149-164`

## Skills Export Gaps

### Domain hierarchy loss

`src/cli/extract.ts:101-116` computes destination as:
- `skills/{skillName}/SKILL.md`

This drops the `kord-aios/{domain}/...` hierarchy from the source tree.

### Hardcoded-skill lock-in

Current TypeScript-only hardcoded skills:
- `src/features/builtin-skills/skills/git-master.ts`
- `src/features/builtin-skills/skills/frontend-ui-ux.ts`
- `src/features/builtin-skills/skills/dev-browser.ts`
- `src/features/builtin-skills/skills/playwright.ts`

This means some methodology content is overrideable and file-based, while some is still compiled.

### Extracted-skill base-path debt

`src/features/builtin-skills/kord-aios-loader.ts:45-53` injects the base directory into the wrapped skill template.
That is correct for builtin-served skills, but extracted skills need their actual local path, not the plugin-dist path.

## Project Layout Debt

`src/cli/project-layout.ts` currently mixes:
- directory constants
- rules content
- templates
- checklists
- guides
- standards
- AGENTS scaffold content
- project-mode content generation

This makes CLI plumbing the hidden source of truth for exportable methodology content.

Current proof:
- file length exceeds 1400 lines
- content constants include rules, templates, PRD/ADR/story/task formats, and guide content

## Current Delivery Model Summary

Kord currently uses a mixed delivery model:

- runtime-only compiled engine content
- runtime + extract content for some categories
- scaffold-only one-shot content for other categories
- local project-only workflow depth that is not reflected in builtin shipping

This is the core architecture problem the final implementation plan must solve.

## Immediate Planning Conclusions

1. The final master implementation plan must not treat all categories the same.
2. Workflows must get their own explicit canonical-source decision, not just be grouped generically with other content.
3. `project-layout.ts` decomposition is architecture-critical, not just cleanup.
4. The final plan must distinguish:
   - source-verified debt
   - architecture decisions required to resolve it
   - Synkra/AIOX-inspired patterns borrowed for the solution

## Evidence Files Used

- `src/cli/extract.ts`
- `src/cli/scaffolder.ts`
- `src/cli/project-layout.ts`
- `src/features/workflow-engine/registry.ts`
- `src/features/builtin-workflows/greenfield-fullstack.yaml`
- `.kord/workflows/greenfield-fullstack.yaml`
- `D:/dev/synkra-aios/.aios-core/development/workflows/greenfield-fullstack.yaml`
- `src/features/builtin-skills/kord-aios-loader.ts`
- `src/features/builtin-commands/commands.ts`
- `src/features/builtin-agents/*.md`
- `src/features/builtin-skills/skills/**/*.md`
- `src/features/builtin-skills/skills/*.ts`
- `src/features/builtin-squads/code/SQUAD.yaml`
