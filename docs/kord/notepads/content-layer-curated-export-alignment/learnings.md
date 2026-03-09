# Learnings — content-layer-curated-export-alignment

## [2026-03-07] Initial Setup

### Codebase State at Start
- `src/features/builtin-workflows/` has exactly 1 file: `greenfield-fullstack.yaml`
- `.kord/workflows/` has all 14 workflows (the richer adapted versions)
- `src/features/builtin-agents/` has 12 .md files: analyst, data-engineer, devops, plan-analyzer, plan-reviewer, pm, po, qa, sm, squad-creator, ux-design-expert + prompts.ts (auto-generated)
- `src/features/builtin-skills/skills/` has: dev-browser.ts, frontend-ui-ux.ts, git-master.ts, playwright.ts (TS-only hardcoded), plus `kord-aios/` subdir (methodology skills)
- `src/cli/` has: extract.ts, extract.test.ts, project-layout.ts, scaffolder.ts, status/, init/
- `src/features/` does NOT yet have: builtin-templates/, builtin-checklists/, builtin-instructions/, builtin-standards/, builtin-docs/

### Key Conventions
- Package manager: Bun only
- Types: bun-types (never @types/node)
- Build: `bun build` (ESM) + `tsc --emitDeclarationOnly`
- TDD: RED-GREEN-REFACTOR mandatory
- No `as any`, no `@ts-ignore`
- Naming: kebab-case dirs, `createXXXHook`/`createXXXTool` factories

### Architecture Decisions (Locked)
- `init` is the ONLY content delivery path; `extract` is removed
- Canonical source: `src/features/builtin-*`
- Project guidance: `.kord/instructions/` only
- Public naming: `greenfield|brownfield`; backend detects `new|existing`
- No persistent project-state file
- Commands are engine-only, never exported
- T0/T1 agents are engine-only
- Exportable T2 agents: pm, po, sm, qa, devops, data-engineer, ux-design-expert, squad-creator, analyst, plan-analyzer, plan-reviewer
- All 14 workflows in scope for canonical promotion
- Checklist export destination: `.kord/checklists/`

## [2026-03-07] Task 2: Fix skill export hierarchy

- `kord-aios` methodology skills were being flattened by the init delivery path because extraction wrote each `SKILL.md` to `.opencode/skills/{skill-name}/SKILL.md`.
- Added hierarchy-aware skill discovery in `src/features/builtin-skills/kord-aios-loader.ts` via `listKordAiosSkillFilesSync()`, which returns export-ready paths preserving `kord-aios/{domain}/{skill-name}/SKILL.md`.
- Refactored sync/async built-in skill loading to consume the shared discovered file list, preventing directory-shape assumptions and aligning loader semantics with export semantics.
- Updated `src/cli/init/index.ts` to keep using extract for agents/squads and export methodology skills with preserved hierarchy directly to `.opencode/skills/{relative-path}`.
- Added RED/GREEN coverage in `src/features/builtin-skills/kord-aios-loader.test.ts` to assert hierarchy preservation and local `.opencode/skills` base-path template injection behavior.

## [2026-03-07] Task 1: Remove extract

- Removed user-facing `extract` CLI command registration from `src/cli/index.ts`.
- Deleted `src/cli/extract.ts` and `src/cli/extract.test.ts`.
- Added internal-only extraction module at `src/cli/extract/index.ts` to keep `init` delivery working without exposing a standalone `extract` command.
- Internal extraction now syncs only agents, skills, and squads; command templates are no longer part of content delivery.
- Updated CLI help wording to position `init` as the delivery surface and removed command-export language.

## [2026-03-07] Task 2: Fix skill export hierarchy (extract module)

- Confirmed `src/cli/extract/index.ts` still flattened skill exports in `collectSkillItems()` by writing to `.opencode/skills/{skill-name}/SKILL.md`.
- Fixed `collectSkillItems()` to preserve full hierarchy using `relative(BUILTIN_SKILLS_DIR, dirname(sourcePath))`, then export to `.opencode/skills/{relativePath}/SKILL.md`.
- Strengthened hierarchy coverage in `src/features/builtin-skills/kord-aios-loader.test.ts` to assert each `relativePath` keeps `kord-aios/{domain}/{skill}/SKILL.md` structure.
- Verified outcomes with `bun test src/features/builtin-skills/` (pass) and `bun run typecheck` (pass).

## [2026-03-07] Task 4: Create builtin-instructions/ and builtin-standards/

- Created canonical instruction files from `src/cli/project-layout.ts` constants:
  - `src/features/builtin-instructions/kord-rules.md` from `KORD_RULES_CONTENT`
  - `src/features/builtin-instructions/kord-root-agents.md` from `KORD_ROOT_AGENTS_CONTENT`
  - `src/features/builtin-instructions/kord-guides-agents.md` from `KORD_GUIDES_AGENTS_CONTENT`
- Created canonical standards files from `src/cli/project-layout.ts` constants:
  - `src/features/builtin-standards/AGENTS.md` from `KORD_STANDARDS_AGENTS_CONTENT`
  - `src/features/builtin-standards/quality-gates.md` from `KORD_STANDARDS_QUALITY_GATES_CONTENT`
  - `src/features/builtin-standards/decision-heuristics.md` from `KORD_STANDARDS_DECISION_HEURISTICS_CONTENT`
  - `src/features/builtin-standards/onboarding-depth-rubric.md` from `KORD_STANDARDS_ONBOARDING_DEPTH_RUBRIC_CONTENT`
  - `src/features/builtin-standards/methodology-artifacts-quality-rubric.md` from `KORD_STANDARDS_METHODOLOGY_ARTIFACTS_QUALITY_RUBRIC_CONTENT`
- Verified checklist destination references:
  - Docs and planning artifacts consistently reference `.kord/checklists/`.
  - Current scaffolding code in `src/cli/scaffolder.ts` still writes checklist files under `.kord/templates/` (legacy behavior to be addressed in follow-up task).
- Confirmed no changes were made to `src/cli/project-layout.ts` in this task.

## [2026-03-07] Task 8: Define exported T2 agent set

- Exportable T2 agents (canonical and locked): `pm`, `po`, `sm`, `qa`, `devops`, `data-engineer`, `ux-design-expert`, `squad-creator`, `analyst`, `plan-analyzer`, `plan-reviewer`.
- Verified `src/features/builtin-agents/` contains matching `.md` files for all 11 exportable T2 agents:
  - `pm.md`, `po.md`, `sm.md`, `qa.md`, `devops.md`, `data-engineer.md`, `ux-design-expert.md`, `squad-creator.md`, `analyst.md`, `plan-analyzer.md`, `plan-reviewer.md`.
- Gaps found: **none** (`11/11` present).
- Engine-only agents remain explicitly separated from exportable T2:
  - T0: `kord`, `dev`, `builder`, `planner`
  - T1: `architect`, `librarian`, `explore`, `vision`
  - Engine category executor: `dev-junior`
- Canonical reference updated in `docs/kord/architecture/agent-source-and-project-guidance-architecture.md` under `2.3.1 Canonical Export Reference (Task 8 lock)`.

## [2026-03-07] Task 5: Create builtin-docs/ and remove project-layout.ts guidance bodies

- Created `src/features/builtin-docs/` and added canonical scaffolded project guidance docs:
  - `src/features/builtin-docs/kord-root-agents.md`
  - `src/features/builtin-docs/kord-standards-agents.md`
  - `src/features/builtin-docs/kord-guides-agents.md`
  - `src/features/builtin-docs/new-project.md`
  - `src/features/builtin-docs/existing-project.md`
  - `src/features/builtin-docs/project-mode-template.md`
- Removed legacy inline guidance bodies from `src/cli/project-layout.ts` by replacing the following constants with file-based loads from `src/features/builtin-docs/`:
  - `KORD_ROOT_AGENTS_CONTENT`
  - `KORD_STANDARDS_AGENTS_CONTENT`
  - `KORD_GUIDES_AGENTS_CONTENT`
  - `KORD_GUIDE_NEW_PROJECT_CONTENT`
  - `KORD_GUIDE_EXISTING_PROJECT_CONTENT`
- Removed legacy inline project-mode guidance body from `src/cli/scaffolder.ts` by loading `project-mode-template.md` and substituting mode placeholders.
- Verification status:
  - `bun run typecheck`: pass
  - `bun test src/cli/` before changes: 469 pass, 2 fail (pre-existing failures in `src/cli/scaffolder.test.ts` and `src/cli/init/index.test.ts`)
  - `bun test src/cli/` after changes: 469 pass, 2 fail (same two failures; no new failures introduced)

## [2026-03-07] Task 3: Create builtin-templates/ and builtin-checklists/

- Created canonical template directory: `src/features/builtin-templates/`.
- Created canonical checklist directory: `src/features/builtin-checklists/`.
- Added template files from CLI template list:
  - `src/features/builtin-templates/story.md`
  - `src/features/builtin-templates/adr.md`
  - `src/features/builtin-templates/prd.md`
  - `src/features/builtin-templates/epic.md`
  - `src/features/builtin-templates/task.md`
  - `src/features/builtin-templates/qa-gate.md`
  - `src/features/builtin-templates/qa-report.md`
- Added checklist files from CLI checklist list:
  - `src/features/builtin-checklists/checklist-story-draft.md`
  - `src/features/builtin-checklists/checklist-story-dod.md`
  - `src/features/builtin-checklists/checklist-pr-review.md`
  - `src/features/builtin-checklists/checklist-architect.md`
  - `src/features/builtin-checklists/checklist-pre-push.md`
  - `src/features/builtin-checklists/checklist-self-critique.md`
- Verified each created canonical file matches the exact raw string content from its corresponding constant in `src/cli/project-layout.ts`.
- `src/cli/project-layout.ts` and `src/cli/scaffolder.ts` were not modified in this task.

## [2026-03-07] Task 12: Workflow classification

- Classified all 14 workflows in `.kord/workflows/` for canonical builtin promotion using workflow-engine schema/runtime constraints.
- Confirmed local adapted workflow set is the promotion baseline; specifically, `.kord/workflows/greenfield-fullstack.yaml` (1038 lines, multi-phase) is materially richer than `src/features/builtin-workflows/greenfield-fullstack.yaml` (23 lines, 3 steps).
- Compatibility check against `src/features/workflow-engine/schema.ts` + `src/features/workflow-engine/validator.ts` found:
  - `PROMOTE`: 11 workflows
  - `NEEDS-REVIEW`: 2 workflows (`epic-orchestration`, `development-cycle`) due to schema failure (`sequence` empty / min(1) violation)
  - `SKIP`: 1 workflow (`auto-worktree`) due to heavy external/runtime dependency assumptions not directly executable by current workflow runtime
- Most promotable workflows still carry expected validator warnings for preserved Synkra runtime metadata (`triggers`, `config`, `pre_flight`, `completion`, `error_handling`, `resume`, `integration`) that are intentionally non-executable in current runtime.
- Detailed per-workflow status/rationale/compatibility concerns recorded in `docs/kord/notepads/content-layer-curated-export-alignment/workflow-classification.md`.

## [2026-03-07] Task 12: Workflow classification (execution summary)

- Re-validated all 14 `.kord/workflows/*.yaml` files directly with `WorkflowDefinitionSchema` plus `validateWorkflowDefinition` to ensure schema/runtime compatibility evidence.
- Final classification remains: `PROMOTE=11`, `NEEDS-REVIEW=2` (`development-cycle`, `epic-orchestration`), `SKIP=1` (`auto-worktree`).
- Updated `docs/kord/notepads/content-layer-curated-export-alignment/workflow-classification.md` table to required columns: `Workflow | Status | Rationale | Concerns`.
- Reconfirmed key baseline decision: local `.kord/workflows/greenfield-fullstack.yaml` is the canonical promotion baseline over the simplified builtin `src/features/builtin-workflows/greenfield-fullstack.yaml`.

## [2026-03-07] Task 5: Create builtin-docs/
[files created, constants found]

## [2026-03-07] Task 1 test fix + missing checklist
- Fixed init/index.test.ts to remove .opencode/commands expectation
- Created src/features/builtin-checklists/checklist-agent-quality-gate.md

## [2026-03-07] Task 6: Consolidate into .kord/instructions/
- Added canonical project-type instruction sources at `src/features/builtin-instructions/greenfield.md` and `src/features/builtin-instructions/brownfield.md`, adapted from legacy builtin docs and aligned to `.kord/instructions/` paths.
- Updated scaffolding to stop exporting legacy project guidance surfaces (`.kord/rules/project-mode.md`, `.kord/guides/new-project.md`, `.kord/guides/existing-project.md`, `.kord/guides/AGENTS.md`) and instead export `.kord/instructions/kord-rules.md` plus exactly one of `greenfield.md` or `brownfield.md` based on installer-detected `projectMode`.
- Repointed init OpenCode instructions glob from `.kord/rules/**` to `.kord/instructions/**`, migrated legacy `kord-rules.md` target to `.kord/instructions/`, and removed status runtime dependency on `project-mode.md` by inferring mode from instruction file presence with graceful unknown-stage behavior.
- Updated rules-injector discovery surface from `.kord/rules/` to `.kord/instructions/` so legacy project-guidance files cannot reactivate through injection.
- Updated affected CLI and rules-injector tests for new paths and single project-type export behavior; verification passed with `bun run typecheck` and `bun test src/cli/` (471 pass, 0 fail).

## [2026-03-07] Task 13: Promote 11 workflows to builtin-workflows/

- Promoted canonical shipped workflow set from `.kord/workflows/` into `src/features/builtin-workflows/`:
  - `story-development-cycle.yaml`
  - `spec-pipeline.yaml`
  - `qa-loop.yaml`
  - `greenfield-ui.yaml`
  - `greenfield-service.yaml`
  - `greenfield-fullstack.yaml`
  - `design-system-build-quality.yaml`
  - `brownfield-ui.yaml`
  - `brownfield-service.yaml`
  - `brownfield-fullstack.yaml`
  - `brownfield-discovery.yaml`
- `greenfield-fullstack.yaml` in builtin catalog was replaced by the richer promoted baseline from `.kord/workflows/` (now 1038-line multi-phase workflow), replacing the previous simplified 23-line/3-step builtin version.
- Confirmed non-promoted workflows were not copied: `epic-orchestration.yaml`, `development-cycle.yaml`, `auto-worktree.yaml`.

## [2026-03-07] Task 9: Formalize T2 pattern
[pattern confirmed]

- Verified `src/features/builtin-agents/prompts.ts` has the auto-generated header: `Auto-generated file - DO NOT EDIT` and `Generated by: script/build-agent-prompts.ts`.
- Verified prompt embedding pipeline in `script/build-agent-prompts.ts`: source `.md` files in `src/features/builtin-agents/` are embedded into generated `prompts.ts` exports.
- Verified T2 wrappers checked for this task (`src/agents/pm.ts`, `src/agents/po.ts`, `src/agents/sm.ts`, `src/agents/qa.ts`) import prompt content from generated `prompts.ts` and use `parseFrontmatter(...)`; no inline prompt string literals found.
- Updated architecture doc to explicitly formalize the canonical T2 flow (`.md` -> build script -> `prompts.ts` -> wrapper) and to state there is no whole-tree duplication issue.
- Wrapper gap audit result for requested set (`pm`, `po`, `sm`, `qa`): none.

## [2026-03-07] Task: Rewire project-layout constants to canonical builtin files

- Replaced large inline content constants in `src/cli/project-layout.ts` with file-based reads using `readFileSync` + `join(import.meta.dir, "..", "features", ...)`.
- Added dedicated helpers in `src/cli/project-layout.ts` for canonical sources:
  - `readBuiltinTemplate()` -> `src/features/builtin-templates/*.md`
  - `readBuiltinChecklist()` -> `src/features/builtin-checklists/*.md`
  - `readBuiltinStandard()` -> `src/features/builtin-standards/*.md`
  - `readBuiltinInstruction()` -> `src/features/builtin-instructions/*.md`
- Kept all exported constant names unchanged so `src/cli/scaffolder.ts` continues to consume the same named exports without modifications.
- Updated the required constant mappings to canonical files:
  - templates: `story.md`, `adr.md`, `prd.md`, `epic.md`, `task.md`, `qa-gate.md`, `qa-report.md`
  - checklists: `checklist-story-draft.md`, `checklist-story-dod.md`, `checklist-pr-review.md`, `checklist-architect.md`, `checklist-pre-push.md`, `checklist-self-critique.md`, `checklist-agent-quality-gate.md`
  - standards: `onboarding-depth-rubric.md`, `methodology-artifacts-quality-rubric.md`, `quality-gates.md`, `decision-heuristics.md`
  - instructions: `kord-rules.md`
- Verification:
  - `bun run typecheck`: pass
  - `bun test src/cli/`: 471 pass, 0 fail
  - `lsp_diagnostics` on `src/cli/project-layout.ts` could not run due missing `typescript-language-server` binary in this environment.

## [2026-03-07] Task 10: Verify remaining T2 wrappers
- devops.ts: PASS - imports `devopsPrompt` from `src/features/builtin-agents/prompts.ts`, extracts prompt body via `parseFrontmatter(devopsPrompt)`, no inline prompt string literal.
- data-engineer.ts: PASS - imports `dataEngineerPrompt` from `src/features/builtin-agents/prompts.ts`, extracts prompt body via `parseFrontmatter(dataEngineerPrompt)`, no inline prompt string literal.
- ux-design-expert.ts: PASS - imports `uxDesignExpertPrompt` from `src/features/builtin-agents/prompts.ts`, extracts prompt body via `parseFrontmatter(uxDesignExpertPrompt)`, no inline prompt string literal.
- squad-creator.ts: PASS - imports `squadCreatorPrompt` from `src/features/builtin-agents/prompts.ts`, extracts prompt body via `parseFrontmatter(squadCreatorPrompt)`, no inline prompt string literal.
- analyst.ts: PASS - imports `analystPrompt` from `src/features/builtin-agents/prompts.ts`, uses `parseFrontmatter(analystPrompt).body`, no inline prompt string literal.
- plan-analyzer.ts: PASS - imports `planAnalyzerPrompt` from `src/features/builtin-agents/prompts.ts`, uses `parseFrontmatter(planAnalyzerPrompt).body`, no inline prompt string literal.
- plan-reviewer.ts: PASS - imports `planReviewerPrompt` from `src/features/builtin-agents/prompts.ts`, uses `parseFrontmatter(planReviewerPrompt).body`, no inline prompt string literal.

## [2026-03-07] Verification: brownfield workflow canonical + scaffolder symmetry

- Confirmed canonical builtin workflow exists at `src/features/builtin-workflows/brownfield-discovery.yaml` with valid top-level schema markers present in header (`schema_version`, `workflow.id`, `workflow.type`, `workflow.version`).
- Confirmed scaffolder workflow export uses builtin map reference (not hardcoded YAML body): `BUILTIN_WORKFLOW_YAMLS["brownfield-discovery"]` in `src/cli/scaffolder.ts`.
- Confirmed symmetric greenfield/brownfield scaffolding coverage in both workflow file export and workflow alias command export:
  - `.kord/workflows/greenfield-fullstack.yaml` + `.kord/workflows/brownfield-discovery.yaml`
  - `.opencode/command/greenfield-fullstack.md` + `.opencode/command/brownfield-discovery.md`
- Confirmed scaffolding no longer depends on standalone brownfield skill references as the primary workflow path; primary path is builtin workflow YAML catalog via `BUILTIN_WORKFLOW_YAMLS`.
- Verified test status: `bun test src/cli/scaffolder.test.ts` passed (`18 pass, 0 fail`).

## [2026-03-07] Task 14: Remove/reclassify duplicate live workflow sources

- Removed 11 promoted workflow duplicates from `.kord/workflows/` so they no longer compete with canonical shipped sources in `src/features/builtin-workflows/`:
  - `story-development-cycle.yaml`, `spec-pipeline.yaml`, `qa-loop.yaml`, `greenfield-ui.yaml`, `greenfield-service.yaml`, `greenfield-fullstack.yaml`, `design-system-build-quality.yaml`, `brownfield-ui.yaml`, `brownfield-service.yaml`, `brownfield-fullstack.yaml`, `brownfield-discovery.yaml`.
- Archived all 3 non-promoted workflows to `docs/kord/architecture/archived-workflows/`:
  - `epic-orchestration.yaml` (`NEEDS-REVIEW`: empty `sequence`, schema violation)
  - `development-cycle.yaml` (`NEEDS-REVIEW`: empty `sequence`, schema violation)
  - `auto-worktree.yaml` (`SKIP`: external env/script dependency model)
- Added `docs/kord/architecture/archived-workflows/README.md` documenting non-shipped rationale and source-of-truth policy.
- Preserved `.kord/workflows/` as a scaffold/override surface only by keeping authoring aids:
  - `.kord/workflows/README.md`
  - `.kord/workflows/_template.yaml`
- Final `.kord/workflows/` state contains only `README.md` and `_template.yaml`, eliminating ambiguous duplicate live workflow sources.

## [2026-03-07] Task: Migrate hardcoded exportable skills to canonical SKILL.md

- Migrated canonical methodology content for all 3 exportable hardcoded skills into SKILL.md files under the `kord-aios` hierarchy:
  - `src/features/builtin-skills/skills/kord-aios/utilities/git-master/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/design-system/frontend-ui-ux/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/utilities/dev-browser/SKILL.md`
- Added YAML frontmatter (`name`, `description`) to each SKILL.md and moved full prior template bodies from TS inline literals into those canonical files.
- Refactored runtime adapter files to keep exported `BuiltinSkill` registration fields unchanged while loading template content from SKILL.md via `readFileSync(join(import.meta.dir, ...), "utf-8")` and stripping frontmatter through `parseFrontmatter(...).body.trim()`:
  - `src/features/builtin-skills/skills/git-master.ts`
  - `src/features/builtin-skills/skills/frontend-ui-ux.ts`
  - `src/features/builtin-skills/skills/dev-browser.ts`
- Verification evidence:
  - `bun run typecheck`: pass
  - `bun test src/features/builtin-skills/`: pass (`42 pass, 0 fail`)
- Environment note: `lsp_diagnostics` could not be executed because `typescript-language-server` is unavailable in this environment.

## [2026-03-07] Task 11: Init curated T2 agent export path

- Added direct curated agent export in `src/cli/init/index.ts` with `exportT2Agents(projectDir, force)`.
- `exportT2Agents()` now reads canonical source files directly from `src/features/builtin-agents/*.md` for exactly the approved 11 T2 agents:
  - `pm`, `po`, `sm`, `qa`, `devops`, `data-engineer`, `ux-design-expert`, `squad-creator`, `analyst`, `plan-analyzer`, `plan-reviewer`.
- Export destination is `.opencode/agents/{agent-name}.md`; idempotency follows `force` semantics (`skip if exists && !force`).
- Updated `InitResult` to include `agentExport` with `{ success, exported, skipped, error? }` for explicit result reporting.
- Consolidated init Step 7 flow to avoid duplication with internal extract agent sync:
  - Removed `agentsOnly: true` from `extract()` call.
  - Kept `extract()` for squads sync (`squadsOnly: true`).
  - Agent and methodology skill exports now run via direct canonical file-based functions in init.
- Extended init test coverage in `src/cli/init/index.test.ts` to assert `.opencode/agents/` contains exactly the 11 approved T2 `.md` files and excludes engine-only agent filenames.

## [2026-03-07] Task: Scaffolder workflow export alignment to canonical catalog

- Replaced hardcoded workflow scaffolding entries in `src/cli/scaffolder.ts` with iteration over `Object.entries(BUILTIN_WORKFLOW_YAMLS)`, so `.kord/workflows/` now exports the full canonical builtin workflow set.
- Replaced hardcoded workflow alias command exports in `src/cli/scaffolder.ts` with iteration over `Object.keys(BUILTIN_WORKFLOW_YAMLS)`, so `.opencode/command/` now emits one alias command per builtin workflow id.
- Updated `src/cli/scaffolder.test.ts` workflow pack test to validate all builtin workflow ids (asserting `11` ids), verify each scaffolded workflow file matches its corresponding `src/features/builtin-workflows/{id}.yaml`, and verify each alias includes the expected `<workflow-id>{id}</workflow-id>` tag.
- Preserved `.kord/workflows/README.md` and `.kord/workflows/_template.yaml` scaffolding behavior unchanged.
- Verification:
  - `bun test src/cli/scaffolder.test.ts`: pass (`18 pass, 0 fail`)
  - `bun run typecheck`: pass
  - `lsp_diagnostics` on modified files could not run in this environment because `typescript-language-server` is not installed.

## [2026-03-07] Task: Migrate hardcoded exportable skills to SKILL.md adapters

- Verified canonical SKILL files for all three exportable methodology skills are present with frontmatter and markdown body content:
  - `src/features/builtin-skills/skills/kord-aios/utilities/git-master/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/design-system/frontend-ui-ux/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/utilities/dev-browser/SKILL.md`
- Confirmed `git-master.ts` was already migrated to adapter pattern (`readFileSync` + `parseFrontmatter(...).body`) and kept `name`/`description` unchanged.
- Migrated `frontend-ui-ux.ts` and `dev-browser.ts` from inline template literals to thin runtime adapters that load body content from canonical SKILL.md files via `parseFrontmatter`.
- No changes made to skill registry/types surfaces (`skills/index.ts`, `skills.ts`, `types.ts`) and no new dependencies added.
- Verification run for this migration:
  - `bun run typecheck`: pass
  - `bun test src/features/builtin-skills/`: pass

## [2026-03-07] Task 18: Deduplicate hardcoded vs kord-aios skill registration

- Updated `src/features/builtin-skills/skills.ts` so hardcoded skill registrations win over discovered `kord-aios` SKILL.md entries when names collide.
- Added dedupe logic in `createBuiltinSkills()`:
  - `hardcodedNames = new Set(hardcodedSkills.map((skill) => skill.name))`
  - `filteredKordAiosSkills = kordAiosSkills.filter((skill) => !hardcodedNames.has(skill.name))`
  - Final merge now uses `[..., hardcodedSkills, ...filteredKordAiosSkills]` ordering without duplicate names reaching runtime.
- Added code comments documenting why this is required now that `git-master`, `frontend-ui-ux`, and `dev-browser` also exist as export-oriented SKILL.md files under `skills/kord-aios/...`.
- Documented runtime-only browser skill rationale in code: `playwright` and `agent-browser` remain TS-only selection targets because browser provider resolution is runtime config-driven.
- Added regression coverage in `src/features/builtin-skills/skills.test.ts` asserting there is exactly one registration each for `git-master`, `frontend-ui-ux`, and `dev-browser`.

## [2026-03-07] Task: Move checklist scaffolding to `.kord/checklists/` and verify full curated export layer

- Updated `.kord` subdir activation in `src/cli/project-layout.ts`:
  - `KORD_ACTIVE_SUBDIRS` now includes `"checklists"` (`["templates", "squads", "instructions", "standards", "checklists"]`).
  - `KORD_RESERVED_SUBDIRS` now excludes `"checklists"` (`["scripts", "skills"]`).
- Rewired checklist scaffolding output in `src/cli/scaffolder.ts` from legacy `.kord/templates/*.md` to canonical `.kord/checklists/*.md` by introducing `checklistsDir` and moving all 7 checklist files:
  - `checklist-story-draft.md`, `checklist-story-dod.md`, `checklist-pr-review.md`, `checklist-architect.md`, `checklist-pre-push.md`, `checklist-self-critique.md`, `checklist-agent-quality-gate.md`.
- Updated checklist path assertions in `src/cli/scaffolder.test.ts` to `.kord/checklists/` and added content assertion for `checklist-agent-quality-gate.md`.
- Updated template-count contract in `src/cli/init/index.test.ts`:
  - renamed test to `creates exactly 7 template files under .kord/templates/`
  - removed checklist filenames from `.kord/templates/` expected list
  - updated `.kord/templates/` markdown count assertion from `14` to `7`.
- Updated `src/cli/kord-directory.test.ts` for new subdir activation semantics:
  - `.kord/checklists/` is now expected to be created
  - active-subdir test description aligned to include `checklists`.

### Verification Evidence

- Profile branching grep (`minimal|default|full`):
  - `src/cli/scaffolder.ts`: only non-branching comment match (`"full scaffold"`), no profile branching logic.
  - `src/cli/init/index.ts`: only non-branching comment match (`"minimal package.json"`), no profile branching logic.
  - `src/cli/init/**/*.ts`: extra matches in tests (`"default"` wording), no profile branching implementation paths.
- `bun test src/cli/`: pass (`471 pass, 0 fail`).
- `bun run typecheck`: pass.
- `lsp_diagnostics` on modified files could not run in this environment because `typescript-language-server` is not installed.

### Curated Content Layer Export Coverage (Current State)

- Templates -> `.kord/templates/` from `src/features/builtin-templates/` (via `src/cli/project-layout.ts` constants consumed by `src/cli/scaffolder.ts`).
- Checklists -> `.kord/checklists/` from `src/features/builtin-checklists/` (via `src/cli/project-layout.ts` constants consumed by `src/cli/scaffolder.ts`).
- Standards -> `.kord/standards/` from `src/features/builtin-standards/` (via `src/cli/project-layout.ts` constants consumed by `src/cli/scaffolder.ts`).
- Instructions -> `.kord/instructions/` from `src/features/builtin-instructions/` (`kord-rules.md` + project-type `greenfield.md|brownfield.md`).
- Workflows -> `.kord/workflows/` and `.opencode/command/` from `BUILTIN_WORKFLOW_YAMLS` in `src/features/workflow-engine` (consumed by `src/cli/scaffolder.ts`).
- Agents -> `.opencode/agents/` curated T2 set from `src/features/builtin-agents/*.md` (`exportT2Agents()` in `src/cli/init/index.ts`).
- Skills -> `.opencode/skills/` from `src/features/builtin-skills/skills/kord-aios/**/SKILL.md` via `listKordAiosSkillFilesSync()` + `exportMethodologySkills()` in `src/cli/init/index.ts`.
- Squads -> `.kord/squads/code/SQUAD.yaml` from `src/features/builtin-squads/code/SQUAD.yaml` (`exportCodeSquad()` in `src/cli/init/index.ts`) plus `.opencode/squads/` sync via internal extract squads-only path.
- Project guidance -> `.kord/AGENTS.md`, `.kord/standards/AGENTS.md`, and related standard/instruction docs from canonical builtin-docs and builtin-standards/instructions sources through scaffolding constants.
