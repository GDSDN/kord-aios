# Draft: Content Layer Architecture Planning Pass 2

## Corrected Planning Intent

- The previous master plan was produced before fully executing the planning flow in `docs/kord/drafts/plan-to-plan-content-layer-curated-export-aligment.md`.
- This pass treats that draft as the required planning workflow, not as implementation tasks.
- Goal: complete the analysis first, produce evidence artifacts, then rewrite the master execution plan for `builder`.

## Required Analysis Scope

- workflows
- agents
- skills
- squads
- commands
- templates
- checklists
- guides
- rules
- standards
- extract/install/init/scaffolder/delivery surfaces

## Key Architecture Questions

- What is the canonical source of truth for each category?
- What is builtin-only versus exportable versus project-local overrideable?
- Where does Kord currently diverge from Synkra/AIOX content depth or delivery shape?
- Where is content simplified, duplicated, hidden, or fragmented?
- What should be installed/exported, and from where?
- How can non-engine agents be exportable without maintaining prompt content in both `src/agents` and `src/features/builtin-agents`?
- Should `src/agents` become engine wrappers/config only, pulling prompt content from canonical markdown prompt assets?
- Should `project-mode` as scaffolded content disappear in favor of installer-selected instructions/rules tied to greenfield vs brownfield?
- Should project-type guidance live in `rules` or a renamed `instructions` concept instead of a separate project-mode document?
- If workflows already encode greenfield/brownfield methodology, does a separate kickoff skill or project-mode content remain valid?

## Concrete Example To Validate

- Builtin workflows currently differ across three places:
  - `src/features/builtin-workflows/`
  - scaffolded workflow output assumptions in `src/cli/scaffolder.ts`
  - project-local `.kord/workflows/`
- The greenfield workflow must be checked for simplification/depth relative to the Synkra source before final architectural decisions are made.
- The architecture must explicitly decide which `greenfield-fullstack` stays alive as the canonical version:
  - builtin shipped version
  - scaffolded/exported version
  - project-local imported version
- Non-canonical duplicates must be removed or reclassified to avoid ambiguous runtime/scaffold behavior.
- The same rule must apply to the full 14-workflow catalog currently present in `.kord/workflows/`, not just `greenfield-fullstack`.
- Final architecture must decide, for all 14 workflows:
  - which ones become canonical shipped builtins
  - which ones remain project-local overrides only
  - which ones are reference/import artifacts and should not stay live as executable sources

## Output Requirement

- The final plan must be an implementation plan for `builder`, but only after the analysis artifacts are complete.

## Completed Findings

### Kord Topology Findings

- Kord currently uses a mixed delivery model:
  - runtime-only compiled engine content
  - runtime + extract content for some categories
  - scaffold-only one-shot content for other categories
  - local project-only workflow depth not reflected in shipped builtins
- `src/cli/project-layout.ts` is still a hidden methodology source for templates, checklists, guides, standards, rules, and scaffolded `AGENTS.md`.
- `src/cli/extract.ts` currently only covers agents, skills, squads, and commands.
- Commands extract from TypeScript template sources, not markdown assets.
- Skills extraction drops domain hierarchy.
- Workflow ownership is fragmented across:
  - `src/features/builtin-workflows/`
  - `src/cli/scaffolder.ts`
  - `.kord/workflows/`

### Workflow Depth Findings

- Builtin shipped `greenfield-fullstack` is heavily simplified.
- Project-local `.kord/workflows/greenfield-fullstack.yaml` preserves much richer imported Synkra structure and metadata.
- Synkra original `greenfield-fullstack.yaml` is significantly deeper, phase-based, and handoff-rich.
- This means workflow architecture decisions cannot be made from builtin files alone; the simplification/depth gap must be addressed explicitly.
- The final architecture must answer:
  - which version is canonical and remains alive
  - whether exported workflow copies are installation snapshots or the real execution source
  - which duplicate versions should be deleted after migration
  - how the same canonical/removal rule applies across the full 14-workflow catalog

### Synkra/AIOX Comparison Findings

- Synkra/AIOX organizes methodology as a project content pack on disk.
- Kord should borrow:
  - file-based methodology ownership
  - profile/preset ideas
  - drift/update tracking concepts
- Kord should reject:
  - one-to-one structural cloning of Synkra's packaging
  - indiscriminate giant one-shot scaffolding as the only delivery model

### Architecture Debts Confirmed

1. Hidden methodology ownership in `project-layout.ts`
2. Snapshot trap created by scaffolded local workflow copies overriding shipped updates
3. Broken commands export surface
4. Skill extraction hierarchy/path issues
5. Fragmented canonical-source model across categories

## New User-Locked Preferences To Evaluate

- All 14 workflows should become builtin canonical content and be exported to `.kord/workflows/` for local override.
- Builtin content should remain Kord's source of truth.
- `init` should export the approved full content layer; profiles are no longer desired.
- All methodology skills under `src/features/builtin-skills/skills/kord-aios/**` belong to the content layer and should be exported.
- Builtin commands should remain engine-layer and not be exported.
- Agent prompt ownership must be unified so non-engine/exportable agents are not maintained in two places.
- `project-mode` as currently scaffolded is likely wrong and should be re-evaluated against Synkra's greenfield/brownfield guidance model.

## Additional Completed Findings From Search-Mode Pass

### Agent Source-Of-Truth Findings

- T2 methodology agents already use `src/features/builtin-agents/*.md` as the canonical prompt source.
- `src/features/builtin-agents/prompts.ts` is generated from those markdown files and should be treated as a build artifact, not an authoring source.
- T2 `src/agents/*.ts` files are runtime wrappers/adapters, not competing prompt sources.
- T0/T1 agents remain engine-owned in `src/agents/*.ts`; the architecture should formalize this boundary rather than pretend every agent already needs migration.

### Project Guidance Findings

- `project-mode.md` currently mixes two concerns: state tracking and onboarding guidance.
- State tracking is valid in `.kord/rules/` because status parsing and tiny injected context need it.
- Onboarding checklists and guidance should move to guides/workflows; they should not live in the injected rules payload.
- Workflows should be the primary greenfield/brownfield path.
- `greenfield-kickoff`, `document-project`, and similar skills should remain only as escape hatches, not the primary scaffolded guidance path.

### Synkra Comparison Refinement

- Synkra uses workflows and richer file-based guidance as the main onboarding path rather than a heavy always-injected project-mode document.
- Kord should borrow the workflow-first / guide-backed model without mirroring Synkra's directory structure literally.

### Delivery Model Correction

- `extract` should be removed from the product-facing architecture rather than kept as a secondary pillar.
- `init` is the only supported content-delivery path in the target system architecture.

## New Project Guidance Structure Decision (Locked)

- Project-type guidance should not remain in `.kord/rules/` as the main content location.
- The agent-facing instruction surface should be unified under `.kord/instructions/`.
- Locked public methodology language: `greenfield|brownfield`.
- Internal detector/backend may still use `new|existing`, but that is implementation detail only.
- Installer detection remains the only project-type selection mechanism.
- No persistent project-state file is required.
- Locked structure:
  - `.kord/instructions/kord-rules.md` -> core always-on instruction content
  - `.kord/instructions/greenfield.md` -> exported when project type is greenfield
  - `.kord/instructions/brownfield.md` -> exported when project type is brownfield
  - separate tiny project state file outside the instruction corpus if CLI/runtime needs mode-stage tracking
- Export rule:
  - `init` always exports the core instruction file
  - `init` exports exactly one project-type instruction file based on detected/selected project type
- Rationale:
  - one canonical source of truth for agent-consumed instruction content
  - folder naming becomes semantically aligned with actual usage by agents
  - avoids splitting equivalent agent-facing content across `rules` vs `guides`
  - preserves a single methodology vocabulary across workflows and onboarding
