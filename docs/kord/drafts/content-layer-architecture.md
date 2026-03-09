# Draft: Content Layer Architecture

## Requirements (confirmed)
- User wants a clear architecture boundary between engine-internal builtins and exportable content-layer assets.
- User sees inconsistency between plugin builtin content and what gets exported to `.kord/` during init/install.
- User expects exportable framework content to come from a canonical source rather than duplicated hardcoded scaffold entries.
- User wants alignment with the product model: Kord as execution engine/framework, Synkra-like content layer as exportable/project-customizable assets.
- User selected `curated export` as the default model, matching Synkra-style content delivery.
- User wants a broader audit of missing elements and required modifications across agents, workflows, guides, rules, skills, tools, and related content/runtime areas.
- User wants this definition documented so future evolution has a stable contract.

## Repo Evidence
- Workflow registry loads `builtin -> squad -> project`, with project `.kord/workflows/*.yaml` overriding builtin by `workflow.id`.
- `src/cli/scaffolder.ts` currently hardcodes only two workflow exports into `.kord/workflows/`.
- `src/features/builtin-workflows/` currently contains only one builtin workflow asset.
- Project-local `.kord/workflows/` currently contains 14 Synkra-derived workflows.
- Builtin content already exists in multiple categories:
  - `src/features/builtin-agents/`
  - `src/features/builtin-skills/`
  - `src/features/builtin-squads/`
  - `src/features/builtin-workflows/`
- Existing plans already touch adjacent areas but do not define a single content/export contract:
  - `docs/kord/plans/init-delivery.md`
  - `docs/kord/plans/init-onboarding-depth-gap-fix.md`
  - `docs/kord/plans/workflow-engine-synkra-parity.md`
- `src/features/builtin-commands/commands.ts` confirms builtin slash commands are runtime/internal registration, distinct from project-scaffolded alias commands.
- Architect artifact now exists at `docs/kord/architecture/engine-vs-content-boundary.md`.
- Plan-analyzer correction: Synkra's current repo/content root is `.aiox-core/`, not `.aios-core/`.
- Plan-analyzer correction: `.aiox-core/` is not a pure content layer; it ships engine and content together.
- Borrowable Synkra patterns are narrower and more specific:
  - documented preset/profile schema concepts
  - install-manifest/checksum-based upgrade drift detection
- Concrete architect-verified violations:
  - commands export is structurally broken (`extract.ts` copies TypeScript templates instead of markdown command files)
  - workflow assets are fragmented (builtin/scaffolder/project-local mismatch)
  - `project-layout.ts` embeds large amounts of exportable content as string literals
  - skills export loses domain hierarchy
  - several high-value skills remain hardcoded TypeScript and are not user-overridable

## Technical Decisions
- Recommended split:
  - Engine-internal builtin-only: primary orchestrators, runtime hooks, command router, workflow engine/runtime, loader infrastructure, validation/execution internals.
  - Exportable content layer: workflows, squads, non-primary specialist agents, guides, templates, and optionally selected skills.
- Recommended single source of truth for exportable framework content: plugin-shipped asset catalogs, exported from one canonical content tree and never duplicated in `scaffolder.ts`.
- Chosen export policy: curated manifest-driven profiles (`minimal`, `default`, `full`) instead of hardcoded filenames.
- Recommended override model: project-local `.kord/**` and `.opencode/**` override shipped framework content by stable IDs.
- Recommended Synkra adoption level: inspired-by, not one-to-one structural mirroring.

## Recommendations
- Treat Kord as two layers:
  - `engine layer`: builtin, non-exported, versioned with plugin runtime
  - `framework content layer`: shipped assets, exportable to project, user-overridable
- Builtin should mean "required for execution" not "all framework content".
- Scaffolding/init should export from canonical shipped assets, not inline strings or hand-maintained lists.
- Export behavior should be manifest-driven per content category and profile, with tests enforcing parity between catalog and exported set.

## Migration Notes
- Current workflow export path is inconsistent: builtin catalog under `src/features/builtin-workflows/` is not the same as scaffolded/exported content in `.kord/workflows/`.
- Current hardcoded scaffold lines for only two workflows should be replaced by enumeration of the declared export manifest.
- Similar review is needed for builtin agents, skills, squads, guides, and any content intended for project-level customization.
- Likely first corrective waves:
  - commands export repair
  - skills hierarchy export fix
  - `project-layout.ts` decomposition into builtin content directories
  - hardcoded-skill conversion to `SKILL.md`
  - builtin workflow catalog promotion/audit

## Scope Boundaries
- INCLUDE: workflows, squads, non-primary agents, skills, guides, init/install export model.
- INCLUDE: comparison against Synkra content-layer approach.
- EXCLUDE: direct source-code implementation in this discussion.

## Open Questions
- What final artifact should capture the contract first: a dedicated architecture decision / work plan, or only internal AGENTS-level guidance?
- Which content categories are in immediate audit scope for the next pass: agents, workflows, guides, rules, skills, tools, commands, squads, docs/checklists/templates?
- How much of the Synkra parity gap should be treated as content-layer work versus separate runtime-engine work?

## Working Hypothesis
- Yes, substantial Synkra-aligned capability still appears missing.
- The missing work is likely split into two tracks:
  - content contract and distribution architecture
  - runtime parity and execution semantics
- Continuing without documenting this split would likely create more drift like the current workflow/scaffolder mismatch.
- The strongest external ideas to borrow are curated profiles/presets and manifest/checksum upgrade semantics, not Synkra's deploy-engine-into-project packaging model.

## Active Research
- Plan Analyzer: pre-generation gap review requested.
- Architect: target curated-export architecture, migration steps, and risks.
- Explore: Kord init/install/scaffolder/extract touchpoint map and current mismatches.
- Librarian: Synkra `.aios-core` content-layer model and missing-capability comparison.
