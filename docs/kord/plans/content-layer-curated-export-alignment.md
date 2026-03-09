# Content Layer Curated Export Alignment

## TL;DR

> **Quick Summary**: Execute one architecture-led migration so Kord becomes a self-improving system with a clear engine layer and a canonical methodology/content layer. Builtin content becomes the framework source of truth, `init` exports the full approved content layer to `.kord/**` and `.opencode/**`, and local copies become overrides rather than hidden sources of truth.
>
> **Executor**: `builder`
>
> **Primary Outcome**: after execution, Kord ships a complete canonical methodology layer from `src/features/builtin-*`, exports it through `init`, and no longer carries ambiguous duplicate sources across workflows, agents, skills, scaffolder content, or docs.
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES - staged waves
> **Critical Path**: content-source unification -> agent/skill/workflow canonicalization -> init export alignment -> docs/final verification

---

## Context

### Original Request

Use a full planning pass to understand Kord vs Synkra/AIOX, define the correct architecture, and only then produce a real builder-executable implementation plan.

### Planning Source Of Truth

The planning workflow came from:

- `docs/kord/drafts/plan-to-plan-content-layer-curated-export-aligment.md`

The resulting architecture artifacts are:

- `docs/kord/architecture/engine-vs-content-boundary.md`
- `docs/kord/architecture/kord-content-topology-audit.md`
- `docs/kord/architecture/synkra-kord-content-depth-comparison.md`
- `docs/kord/architecture/content-source-canonical-map.md`
- `docs/kord/architecture/content-layer-target-architecture-adr.md`

### Locked Product Decisions

- builtin content is the framework **source of truth**
- `init` exports the **full approved content layer**
- there are **no** `minimal/default/full` profiles
- `.kord/**` and `.opencode/**` are exported working copies / override layers
- methodology skills under `src/features/builtin-skills/skills/kord-aios/**` are content-layer and are exported
- builtin commands are engine-only and are **not** exported as methodology content
- all 14 workflows currently in `.kord/workflows/` are in scope for canonical builtin promotion/reclassification
- `extract` is removed from the product-facing delivery model; `init` is the only supported content-delivery path
- agent-facing project guidance is unified under `.kord/instructions/`
- exported public methodology naming uses `greenfield|brownfield`; backend may still detect `new|existing` internally
- Kord is inspired by Synkra/AIOX patterns, but follows its **own** plugin/content architecture
- Kord is a self-improving system:
  - engine executes and enforces
  - content layer evolves
  - delivery/update architecture must let methodology improve without recreating ambiguity

### Authoritative ADR

If this plan conflicts with older notes, the authoritative decision record is:

- `docs/kord/architecture/content-layer-target-architecture-adr.md`

---

## Final Architecture Summary

### Engine Layer (builtin-only)

Stays compiled and never exported:

- T0 agents in `src/agents/*.ts`
- hooks, tools, MCP/runtime machinery
- workflow runtime code in `src/features/workflow-engine/*.ts`
- plugin infrastructure and CLI machinery
- runtime-bound skills (only those with real execution/config dependence)
- builtin commands as engine behavior

### Content Layer (canonical builtin + init export)

Lives canonically under `src/features/builtin-*` and is exported by `init`:

- exportable agent prompts / subagent prompts
- methodology skills
- squads
- workflows
- templates
- checklists
- instructions
- standards
- scaffolded project guidance / `AGENTS.md`

### Override Model

- builtin content remains the framework source of truth
- `init` exports the full approved content layer
- local files are editable overrides
- runtime precedence remains local override first, builtin fallback second

---

## Architecture Findings That Drive This Plan

### Workflows are currently ambiguous

Current state:
- `src/features/builtin-workflows/` -> 1 builtin workflow
- `src/cli/scaffolder.ts` -> 2 hardcoded exported workflows
- `.kord/workflows/` -> 14 richer adapted workflows

This is not acceptable for a self-improving system.

Target:
- the full approved 14-workflow catalog must be resolved into the builtin canonical catalog
- `init` exports that full approved set
- local `.kord/workflows/` files are override copies, not the canonical source
- duplicate live versions must be removed or reclassified

### Agent prompt ownership must be formalized

Current state:
- T2 methodology agents already use `src/features/builtin-agents/*.md` as canonical prompt source
- generated `prompts.ts` plus `src/agents/*.ts` wrappers form the current adapter pipeline
- T0/T1 engine agents still live inline in `src/agents/*.ts`

Target:
- exportable T2 prompt content stays canonical in `src/features/builtin-agents/*.md`
- T2 `src/agents/*.ts` files act as runtime wrapper/config only
- T0/T1 agents stay engine-only unless explicitly reclassified later
- exportable subset is explicitly declared and exported by `init`

### `project-layout.ts` is a hidden methodology source

Current state:
- templates/checklists/legacy guide content/standards/legacy rule content/scaffolded guidance live in TS string literals

Target:
- move them into `src/features/builtin-*`
- keep `project-layout.ts` as plumbing only

### `extract` is removed from the target architecture

Current state:
- `extract` is broken and incomplete

Target:
- `init` is the only supported content delivery path
- `extract` is removed from the product-facing architecture
- command export is removed from the methodology-delivery target entirely

### Project-type guidance is fragmented

Current state:
- legacy `project-mode.md` mixes project selection with onboarding guidance
- legacy rules/guides surfaces, workflows, and standalone skills overlap on greenfield/brownfield guidance

Target:
- agent-facing guidance is unified under `.kord/instructions/`
- `init` always exports core instruction content plus exactly one project-type instruction file
- installer detection remains the only project-type selection mechanism
- no persistent project-state file exists in the target architecture
- workflows become the primary greenfield/brownfield execution path
- standalone kickoff/documentation skills become escape hatches, not the scaffolded primary path

---

## Category Source And Delivery Model

| Category | Canonical Builtin Source | Exported By `init` To | Engine or Content |
|---|---|---|---|
| T0 agents | `src/agents/*.ts` | not exported | engine |
| Exportable agent prompts | `src/features/builtin-agents/` | `.opencode/agents/` | content |
| Methodology skills | `src/features/builtin-skills/skills/kord-aios/**` | `.opencode/skills/` | content |
| Runtime-only skills | TS | not exported | engine |
| Squads | `src/features/builtin-squads/` | `.opencode/squads/` | content |
| Commands | TS engine registration | not exported | engine |
| Workflows | `src/features/builtin-workflows/` | `.kord/workflows/` | content |
| Templates | `src/features/builtin-templates/` | `.kord/templates/` | content |
| Checklists | `src/features/builtin-checklists/` | `.kord/checklists/` | content |
| Instructions | `src/features/builtin-instructions/` | `.kord/instructions/` | content |
| Standards | `src/features/builtin-standards/` | `.kord/standards/` | content |
| Scaffolded AGENTS/project guidance | `src/features/builtin-docs/` | project files | content |

---

## Work Objectives

### Core Objective

Make the content layer truly canonical, complete, and exportable while leaving the engine layer clean and runtime-focused.

### Definition of Done

- builtin content under `src/features/builtin-*` is the framework source of truth
- `init` exports the full approved content layer
- no major content category still depends on `src/cli/project-layout.ts` as a hidden source
- agent prompt ownership is unified
- the full 14-workflow set is resolved into canonical builtin or explicitly non-shipped status
- legacy project-guidance surfaces no longer exist as active exported/runtime paths
- tests, typecheck, and build pass

### Guardrails

- do not split this work into child execution plans before implementation starts
- do not absorb workflow runtime parity work into this plan
- do not leave ambiguous duplicate workflow/agent prompt sources alive
- do not keep command export as part of the target methodology-delivery model
- do not preserve profile logic; this architecture exports the full approved content layer
- do not leave legacy project-guidance files anywhere under active `.kord/**`, hook scan paths, or init/scaffolder outputs after migration
- if legacy guidance files are retained for history, archive them only under `docs/kord/**`

---

## Execution Strategy

### Wave 1 - Remove Broken / Wrong Delivery Assumptions

1. Remove `extract` and command-export assumptions from the product-facing delivery model and clean the related code paths/tests
2. Fix methodology skill export semantics in the `init` delivery path so hierarchy and local path behavior stay correct

### Wave 2 - Canonicalize Hidden Scaffold Content

3. Move templates and checklists out of `src/cli/project-layout.ts` into canonical builtin asset directories
4. Move instructions and standards out of `src/cli/project-layout.ts` into canonical builtin asset directories
5. Move scaffolded `AGENTS.md` / project guidance out of `src/cli/project-layout.ts`
6. Consolidate agent-facing project guidance into `.kord/instructions/`, retire legacy runtime consumers, and keep installer-only project-type detection
7. Rewire `project-layout.ts`, `scaffolder.ts`, and instruction injection/loading paths to consume canonical file-based assets

### Wave 3 - Agent Prompt Canonicalization

8. Define the exported agent/subagent set
9. Formalize the T2 markdown-plus-wrapper pattern as the canonical exportable agent architecture
10. Refactor any remaining exportable-agent wrappers so runtime config is separated from prompt ownership
11. Implement the init export path for the approved agent subset from the canonical source

### Wave 4 - Workflow Catalog Canonicalization

12. Classify all 14 workflows currently in `.kord/workflows/`
13. Promote the approved workflow set into `src/features/builtin-workflows/`
14. Add builtin brownfield onboarding coverage so greenfield/brownfield scaffolding has symmetric canonical sources
15. Replace hardcoded workflow scaffolder assumptions with iteration over the canonical builtin workflow catalog
16. Remove or reclassify duplicate live workflow sources so there is no ambiguity

### Wave 5 - Skill Content Completion

17. Migrate exportable hardcoded methodology skills into `SKILL.md`
18. Keep only truly runtime-bound skills compiled

### Wave 6 - Init Alignment And Final Contract Closure

19. Make `init` export the full approved content layer from canonical builtin sources
20. Update docs and scaffolded guidance to encode the final engine/content contract
21. Run final closure review and verification sweep

Critical Path: 1 -> 3 -> 6 -> 7 -> 8 -> 9 -> 12 -> 13 -> 15 -> 19 -> 20 -> 21

---

## TODOs

- [ ] 1. Remove `extract` and command export from the product-facing delivery model
  - **Basis**: Architecture-enforced + source-verified
  - **References**: `src/cli/extract.ts`, `src/features/builtin-commands/commands.ts`, `docs/kord/architecture/content-layer-target-architecture-adr.md`
  - **Acceptance Criteria**:
    - [ ] commands are no longer treated as exportable methodology content
    - [ ] `init` is the only supported content-delivery path in product docs and scaffolding guidance
    - [ ] `src/cli/extract.ts` is deleted or reduced to non-user-facing internal-only code with no product-facing content export role
    - [ ] no user-facing CLI help or docs present `extract` as a supported content-delivery command

- [ ] 2. Fix methodology skill export semantics
  - **Basis**: Source-verified
  - **References**: `src/features/builtin-skills/kord-aios-loader.ts`, `src/cli/init/index.ts`, `docs/kord/architecture/content-layer-target-architecture-adr.md`
  - **Acceptance Criteria**:
    - [ ] all methodology skills preserve domain hierarchy on export
    - [ ] methodology skills exported by `init` resolve against the local `.opencode/skills/` hierarchy correctly

- [ ] 3. Move templates and checklists out of `src/cli/project-layout.ts`
  - **Basis**: Source-verified + architecture-enforced
  - **Acceptance Criteria**:
    - [ ] template and checklist content is file-based builtin content

- [ ] 4. Move instructions and standards out of `src/cli/project-layout.ts`
  - **Basis**: Source-verified + architecture-enforced
  - **Acceptance Criteria**:
    - [ ] instruction and standard content is file-based builtin content
    - [ ] checklist content is exported to `.kord/checklists/` consistently across docs and scaffolding

- [ ] 5. Move scaffolded project guidance out of `src/cli/project-layout.ts`
  - **Basis**: Source-verified + architecture-enforced
  - **Acceptance Criteria**:
    - [ ] scaffolded AGENTS/project guidance is file-based builtin content
    - [ ] legacy scaffold-only project guidance bodies are removed from `src/cli/project-layout.ts`

- [ ] 6. Consolidate agent-facing project guidance into `.kord/instructions/`, retire legacy runtime consumers, and keep installer-only project-type detection
  - **Basis**: Source-verified + architecture-enforced
  - **References**: `src/cli/scaffolder.ts`, `src/cli/status/index.ts`, `src/hooks/rules-injector/`, `docs/kord/architecture/agent-source-and-project-guidance-architecture.md`
  - **Acceptance Criteria**:
    - [ ] `kord-rules.md` and project-type instruction content live under `.kord/instructions/`
    - [ ] `init` exports exactly one project-type instruction file: `greenfield.md` or `brownfield.md`
    - [ ] no persistent project-state file is introduced
    - [ ] workflows are presented as the primary greenfield/brownfield path
    - [ ] legacy `project-mode.md` is no longer exported or treated as an active runtime/project guidance surface
    - [ ] legacy `.kord/guides/new-project.md` and `.kord/guides/existing-project.md` no longer exist as active exported project-type instruction surfaces
    - [ ] `src/cli/status/index.ts` no longer reads or depends on `project-mode.md`
    - [ ] `.kord/rules/` is no longer an active injection surface for project guidance, or the rules injector is explicitly updated so legacy project-guidance files cannot reactivate at runtime

- [ ] 7. Rewire `project-layout.ts`, `scaffolder.ts`, and instruction injection/loading paths to consume canonical builtin assets
  - **Basis**: Source-verified + architecture-enforced
  - **Acceptance Criteria**:
    - [ ] `project-layout.ts` no longer stores large methodology bodies
    - [ ] `init` scaffolding reads canonical file-based assets

- [ ] 8. Define the exported agent/subagent set
  - **Basis**: Architecture-enforced
  - **Acceptance Criteria**:
    - [ ] exportable T2 methodology agent classes are explicitly listed, including `plan-analyzer` and `plan-reviewer` unless explicitly excluded with rationale
    - [ ] engine-only T0/T1 agent classes remain clearly separated

- [ ] 9. Formalize the T2 markdown-plus-wrapper pattern as the canonical exportable agent architecture
  - **Basis**: Architecture-enforced + source-verified
  - **References**: `src/features/builtin-agents/`, `src/features/builtin-agents/prompts.ts`, `src/agents/pm.ts`, `docs/kord/architecture/agent-source-and-project-guidance-architecture.md`
  - **Acceptance Criteria**:
    - [ ] exportable T2 prompt content is authored only in `src/features/builtin-agents/*.md`
    - [ ] generated prompt embedding remains build-driven, not manually edited
    - [ ] architecture/docs no longer describe a false whole-tree duplication problem

- [ ] 10. Separate agent runtime wrappers from prompt ownership
  - **Basis**: Architecture-enforced
  - **Acceptance Criteria**:
    - [ ] `src/agents/*.ts` acts as runtime config/wrapper only for exported-prompt agents

- [ ] 11. Implement the init export path for the approved agent subset from the canonical source
  - **Basis**: Architecture-enforced
  - **Acceptance Criteria**:
    - [ ] approved exportable agents are emitted from one canonical prompt source

- [ ] 12. Classify the 14-workflow catalog
  - **Basis**: Source-verified + architecture-enforced
  - **References**: `.kord/workflows/`, `src/features/builtin-workflows/`, `docs/kord/architecture/synkra-kord-content-depth-comparison.md`
  - **Acceptance Criteria**:
    - [ ] all 14 workflows are classified
    - [ ] the richer local/adapted workflow set is treated as the promotion baseline
    - [ ] each candidate workflow is checked for workflow-engine schema/runtime compatibility before promotion

- [ ] 13. Promote the approved workflow set into canonical builtin content
  - **Basis**: Source-verified + architecture-enforced
  - **Acceptance Criteria**:
    - [ ] builtin workflow catalog matches the approved canonical shipped set
    - [ ] `greenfield-fullstack` builtin now reflects the richer promoted baseline

- [ ] 14. Add builtin brownfield onboarding coverage
  - **Basis**: Source-verified + architecture-enforced
  - **References**: `src/features/builtin-workflows/`, `src/cli/scaffolder.ts`, `docs/kord/architecture/agent-source-and-project-guidance-architecture.md`
  - **Acceptance Criteria**:
    - [ ] brownfield onboarding workflow exists as canonical builtin content
    - [ ] scaffolding no longer depends on standalone brownfield skill references as the primary path

- [ ] 15. Replace hardcoded workflow scaffolder assumptions with canonical catalog iteration
  - **Basis**: Source-verified + architecture-enforced
  - **Acceptance Criteria**:
    - [ ] scaffolder no longer hardcodes 2 workflow IDs
    - [ ] `init` exports the full approved workflow catalog

- [ ] 16. Remove or reclassify duplicate live workflow sources
  - **Basis**: Architecture-enforced
  - **Acceptance Criteria**:
    - [ ] ambiguous duplicate live workflow sources no longer remain

- [ ] 17. Migrate exportable hardcoded methodology skills into `SKILL.md`
  - **Basis**: Source-verified + architecture-enforced
  - **Acceptance Criteria**:
    - [ ] exportable methodology skills are no longer trapped in TS-only form

- [ ] 18. Keep only truly runtime-bound skills compiled
  - **Basis**: Architecture-enforced
  - **Acceptance Criteria**:
    - [ ] remaining TS-only skills have explicit runtime justification

- [ ] 19. Make `init` export the full approved content layer
  - **Basis**: Architecture-enforced + source-verified
  - **Acceptance Criteria**:
    - [ ] `init` exports workflows, agents, methodology skills, squads, templates, instructions, standards, and project guidance
    - [ ] no profile branching remains in the delivery model
    - [ ] grep-style verification over init/scaffolder code shows no active `minimal/default/full` profile branching remains

- [ ] 20. Update docs and scaffolded guidance to encode the final contract
  - **Basis**: Architecture-enforced
  - **Acceptance Criteria**:
    - [ ] docs and scaffolded guidance explain engine vs content, builtin source of truth, and local override role
    - [ ] docs and scaffolded guidance describe workflows as the primary project-type path and kickoff/documentation skills as secondary escape hatches
    - [ ] docs use `greenfield|brownfield` as the public methodology language

- [ ] 21. Run final verification and closure review
  - **Basis**: Source-verified + architecture-enforced
  - **Acceptance Criteria**:
    - [ ] `bun test src/cli/scaffolder.test.ts` -> PASS
    - [ ] `bun test` -> PASS
    - [ ] `bun run typecheck` -> PASS
    - [ ] `bun run build` -> PASS
    - [ ] no major content ambiguity remains across categories

---

## Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|----------------------|
| 1 | None | 19 | 2 |
| 2 | None | 17, 19 | 1 |
| 3 | None | 7 | 4, 5 |
| 4 | None | 7 | 3, 5 |
| 5 | None | 7, 20 | 3, 4 |
| 6 | 4, 5 | 7, 20 | 14 |
| 7 | 3, 4, 5, 6 | 19, 20, 21 | None |
| 8 | None | 9, 10, 11 | 12 |
| 9 | 8 | 10, 11, 20 | None |
| 10 | 9 | 11, 21 | None |
| 11 | 8, 9, 10 | 19, 20 | None |
| 12 | None | 13, 14, 15, 16 | 8 |
| 13 | 12 | 15, 16, 19 | 17 |
| 14 | 12 | 15, 19, 20 | 6 |
| 15 | 12, 13, 14 | 19, 21 | None |
| 16 | 12, 13 | 21 | None |
| 17 | 2 | 18, 19 | 13 |
| 18 | 17 | 19, 21 | None |
| 19 | 1, 2, 7, 11, 13, 14, 15, 18 | 20, 21 | None |
| 20 | 5, 6, 7, 9, 11, 14, 19 | 21 | None |
| 21 | 7, 10, 15, 16, 18, 19, 20 | None | None |

---

## Verification Strategy

- **Infrastructure exists**: YES
- **Automated tests**: YES
- **Framework**: Bun test + typecheck + build

### Agent-Executed QA Scenarios

Scenario: `init` exports the full approved content layer from canonical builtin sources
  Tool: Bash
  Preconditions: waves 1-6 complete
  Steps:
    1. run `bun test src/cli/scaffolder.test.ts`
    2. run targeted init export tests that verify `.kord/workflows/`, `.kord/instructions/`, `.kord/checklists/`, and `.opencode/skills/` are populated from canonical builtin sources
    3. assert commands are not exported as methodology content
  Expected Result: `init` is the primary content delivery path and local copies are overrideable exports

Scenario: runtime no longer depends on ambiguous duplicated content ownership
  Tool: Bash
  Preconditions: final migration complete
  Steps:
    1. run workflow/scaffolder/status/instruction-injection regression tests
    2. run `bun run typecheck`
    3. run `bun run build`
  Expected Result: canonical builtin sources and override layers are aligned

---

## Commit Strategy

| After Wave | Message | Verification |
|------------|---------|--------------|
| Wave 1 | `refactor(cli): remove extract-first delivery assumptions` | targeted tests + typecheck |
| Wave 2 | `refactor(cli): externalize scaffold content assets` | scaffold tests |
| Wave 3 | `refactor(agents): formalize exportable prompt wrappers` | targeted agent/init tests |
| Wave 4 | `refactor(workflows): promote canonical workflow catalog` | targeted workflow/scaffold tests |
| Wave 5 | `refactor(skills): move methodology skills into content layer` | targeted skills tests |
| Wave 6 | `feat(cli): export full content layer from builtin sources` | full test/build sweep |

---

## Success Criteria

- builtin content under `src/features/builtin-*` is the framework source of truth
- `init` exports the full approved content layer
- `.kord/**` and `.opencode/**` are override layers, not hidden canonical sources
- all 14 workflows are resolved into the canonical shipped catalog or explicitly non-live status
- agent prompt ownership is unified
- methodology skills are fully part of the content layer
- builtin commands remain engine-only
- agent-facing project guidance has one canonical instruction surface under `.kord/instructions/`
- documentation and scaffolded guidance encode the final contract so the system can keep improving without recreating ambiguity
