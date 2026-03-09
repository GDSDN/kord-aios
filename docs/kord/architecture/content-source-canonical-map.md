# Content Source Canonical Map

## Scope

This artifact defines the corrected canonical-source model for Kord content categories after the explicit product decisions were locked.

Locked decisions reflected here:
- builtin content is the framework source of truth
- `init` exports the full approved content layer
- no `minimal/default/full` profiles
- methodology skills under `src/features/builtin-skills/skills/kord-aios/**` are exported
- builtin commands remain engine-only and are not part of the exportable content layer
- agent prompt ownership must have one source of truth
- all 14 workflows are in scope for builtin promotion/reclassification

## Category Matrix

| Category | Current Source | Target Canonical Source | Delivered By | Override Surface | Notes |
|---|---|---|---|---|---|
| T0 agents | `src/agents/*.ts` | unchanged | runtime only | none | engine-only |
| Exportable agent prompts | `src/features/builtin-agents/*.md` + generated `prompts.ts` + T2 wrapper adapters in `src/agents/*.ts` | `src/features/builtin-agents/*.md` | `init` | `.opencode/agents/` | T2 methodology agents already follow this pattern; wrappers are engine adapters |
| Methodology skills | `src/features/builtin-skills/skills/kord-aios/**/SKILL.md` | unchanged | `init` | `.opencode/skills/` | export all |
| Runtime-bound skills | TS | unchanged | runtime only | none | only if truly engine-bound |
| Squads | `src/features/builtin-squads/` | unchanged | `init` | `.opencode/squads/` | exportable methodology |
| Commands | `src/features/builtin-commands/*.ts` | unchanged as engine behavior | runtime only | none in target architecture | not exported |
| Workflows | fragmented across builtin/scaffolder/local | `src/features/builtin-workflows/*.yaml` | `init` | `.kord/workflows/` | all 14 in scope for canonicalization |
| Templates | `src/cli/project-layout.ts` | `src/features/builtin-templates/` | `init` | `.kord/templates/` | exportable content |
| Checklists | `src/cli/project-layout.ts` | `src/features/builtin-checklists/` | `init` | `.kord/checklists/` | exportable content |
| Instructions | `src/cli/project-layout.ts` | `src/features/builtin-instructions/` | `init` | `.kord/instructions/` | unified agent-facing instruction content |
| Standards | `src/cli/project-layout.ts` | `src/features/builtin-standards/` | `init` | `.kord/standards/` | exportable content |
| Scaffolded AGENTS guidance | `src/cli/project-layout.ts` | `src/features/builtin-docs/` | `init` | project files | exportable project guidance |

## Delivery Surface Model

### Builtin-only
- engine/runtime code
- T0 orchestrators
- hooks, tools, loaders, runtime logic
- builtin commands as engine behavior

### Exported by `init`
- workflows
- exportable agents/subagents
- methodology skills
- squads
- templates/checklists
- instructions/standards
- scaffolded AGENTS/project guidance

### Removed from target delivery model
- `extract` is not part of the target product-facing architecture
- command export is not part of the target model
- `init` is the single supported delivery path for approved framework content

## Workflow Canonicalization Rule

### Current ambiguity

- `src/features/builtin-workflows/` has only 1 builtin workflow
- `src/cli/scaffolder.ts` hardcodes 2 workflow exports
- `.kord/workflows/` currently contains 14 richer adapted workflows

### Target rule

- `src/features/builtin-workflows/` becomes the canonical workflow catalog
- `init` exports that full approved catalog to `.kord/workflows/`
- project-local workflow files are overrides, not source of truth

### Promotion rule

The richer `.kord/workflows/*.yaml` set is the promotion baseline for the canonical builtin workflow catalog.

For the full 14-workflow set, each workflow must be resolved as one of:
- canonical builtin shipped content
- project-local override only
- reference-only/non-live artifact

There must be no ambiguous duplicate live workflow sources after migration.

## Agent Canonicalization Rule

Current state needs clarification more than wholesale migration:
- T2 methodology prompt content already lives canonically in `src/features/builtin-agents/*.md`
- generated `prompts.ts` embeds those markdown files for runtime use
- T2 wrapper/config code lives in `src/agents/`
- T0/T1 engine agents remain engine-owned in `src/agents/`

Target rule:
- prompt content for exportable methodology agents lives once, under `src/features/builtin-agents/*.md`
- runtime wrappers/config live in `src/agents/`
- exportable subset is declared and exported by `init`

This prevents future prompt drift while preserving the engine-only status of T0/T1 agents.

## Project Guidance Canonicalization Rule

Current state is fragmented because project-type guidance is spread across:
- legacy `.kord/rules/project-mode.md`
- legacy `.kord/guides/new-project.md`
- legacy `.kord/guides/existing-project.md`
- workflow files and standalone kickoff/documentation skills

Target rule:
- agent-facing instruction content is consolidated into `.kord/instructions/`
- canonical builtin source is `src/features/builtin-instructions/`
- `init` always exports the core instruction file and exactly one project-type instruction file: `greenfield.md` or `brownfield.md`
- internal detection may still use `new|existing`, but public methodology naming is `greenfield|brownfield`
- installer detection remains the only project-type selection mechanism
- no persistent project-state file is required
- greenfield/brownfield workflows are the primary execution path
- standalone kickoff/documentation skills remain secondary escape hatches, not the scaffolded primary route
- legacy `project-mode.md` and legacy project-type guide files must cease to exist as active exported/runtime instruction surfaces after migration
- if retained for history, they move only to non-product documentation paths under `docs/kord/**`

## Ordered Corrective Actions

1. remove command export from the content-delivery target and keep commands engine-only
2. fix skills export semantics (hierarchy and runtime/path correctness)
3. externalize hidden scaffold content from `project-layout.ts`
4. formalize the existing T2 prompt-source pattern and prevent future drift
5. consolidate rules/project-guide content into canonical instructions with installer-only project-type detection
6. classify and promote the 14-workflow catalog into builtin canonical content
7. make `init` export the full approved content layer from canonical builtin sources
8. remove `extract` from the product-facing delivery architecture
9. update docs and guidance so the contract stays visible

## What Remains Unknown

- exact runtime/schema readiness of all 14 workflows after promotion
- exact implementation shape of the agent-export script/loader path
- whether any internal non-user-facing refresh utility still deserves to exist after `extract` is removed
