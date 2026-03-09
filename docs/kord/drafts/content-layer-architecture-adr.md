# ADR Draft: Curated Export Content Boundary

## Context

Kord AIOS currently mixes execution-engine internals and framework content in inconsistent ways.

Verified repo problems include:
- workflow registry precedence is clear, but workflow source-of-truth is fragmented
- `src/cli/scaffolder.ts` hardcodes a tiny subset of workflow exports
- `src/features/builtin-workflows/` is underpopulated relative to project-local workflow content
- command extraction currently copies TypeScript templates instead of markdown command files
- skill extraction loses domain hierarchy
- guides, templates, standards, and rules remain embedded as string literals in `src/cli/project-layout.ts`
- several high-value methodology skills remain hardcoded TypeScript instead of exportable `SKILL.md`

This blocks a clean `curated export` model and creates drift between shipped assets, scaffolded project content, and runtime behavior.

## Decision

Kord AIOS will be treated as a two-layer system:

- **Engine layer**: builtin-only, compiled/runtime-critical, not exportable
- **Content layer**: shipped as canonical source assets, exportable through curated profiles, and overrideable in project-local paths

Builtin must mean "required for execution", not "all framework content".

## Engine-Internal Builtin-Only Categories

- T0 orchestrators: `kord`, `dev`, `builder`, `planner`
- hooks, tools, MCP infrastructure, background-agent machinery
- config schema, plugin handlers, runtime loaders
- workflow engine runtime code (`engine.ts`, `registry.ts`, `schema.ts`, `storage.ts`), not the workflow YAML content itself
- CLI machinery (`init`, `install`, `extract`, `doctor`, `status`, wiring), not the content it delivers

## Exportable Content-Layer Categories

- specialist/non-primary agents
- methodology skills
- squads and squad assets
- workflows
- guides
- standards
- rules
- templates and checklists
- command content/templates intended for user override

## Canonical Source-of-Truth Model

Canonical shipped content should live under `src/features/builtin-*` per category.

Recommended target categories:
- `src/features/builtin-agents/`
- `src/features/builtin-skills/`
- `src/features/builtin-squads/`
- `src/features/builtin-workflows/`
- `src/features/builtin-commands/`
- `src/features/builtin-guides/`
- `src/features/builtin-standards/`
- `src/features/builtin-rules/`
- `src/features/builtin-templates/`
- `src/features/builtin-checklists/`

`init`, `install`, and `extract` should consume these canonical asset directories, never hardcoded inline lists.

## Curated Export Profiles

- `minimal`: only essential project-facing assets
- `default`: recommended curated framework content for most projects
- `full`: all exportable content categories

Profile membership should be manifest-driven, not hardcoded in `scaffolder.ts`.

## Override and Precedence Rules

- project-local exported content overrides shipped content by stable ID/path
- `.kord/**` is the override surface for project methodology content
- `.opencode/**` is the override surface for agents/skills/commands/squads
- runtime precedence should remain deterministic and documented by category

## Current Mismatches in the Repo

- commands export broken: `.ts` templates copied instead of `.md`
- workflow export mismatch: builtin catalog, scaffold output, and project-local assets diverge
- `project-layout.ts` is a monolithic content container instead of plumbing-only code
- skills export hierarchy flattening destroys domain structure
- hardcoded skills block override and extract behavior

## Migration Strategy

1. Fix correctness issues first:
   - commands export
   - skills hierarchy export
   - extracted-skill base-path handling
2. Decompose `project-layout.ts` into builtin content directories
3. Audit and promote canonical workflow assets into `src/features/builtin-workflows/`
4. Convert exportable hardcoded skills into `SKILL.md`
5. Make scaffolder and extract manifest-driven by profile/category
6. Add drift/sync visibility for exported content over time

## Risks and Non-Goals

### Risks
- refactoring `project-layout.ts` can silently change scaffold output if not test-guarded
- promoting workflows without runtime classification can blur executable vs reference-only content
- changing extract paths can break existing user overrides if compatibility fallback is not preserved

### Non-Goals
- do not port Synkra directory structure verbatim
- do not move engine internals into exportable content
- do not claim runtime parity just by reorganizing content delivery

## Follow-On Plans Required

- content architecture refactor
- init/install/extract alignment
- workflow content packaging and promotion audit
- hardcoded-skill extraction refactor
- commands export refactor
- documentation and `AGENTS.md` alignment
- workflow runtime parity continuation

## Status

This ADR draft should be treated as the companion artifact to:
- `docs/kord/plans/content-layer-curated-export-alignment.md`
- `docs/kord/drafts/content-layer-architecture.md`

It defines the boundary and migration direction; implementation remains follow-on work.
