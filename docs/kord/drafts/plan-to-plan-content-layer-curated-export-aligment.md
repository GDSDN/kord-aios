# Content Layer Curated Export Alignment

## TL;DR

> **Quick Summary**: Define and align Kord AIOS as a two-layer system: a builtin execution engine and a curated, exportable content layer. Analyze Synkra's `.aios-core`, Kord's current init/extract/wizard/runtime architecture, and document exactly what must change across workflows, agents, skills, squads, guides, rules, templates, commands, and tooling so future follow-on plans can build on a stable contract.
>
> **Deliverables**:
> - One architecture contract for `builtin-only` vs `exportable content`
> - One canonical content-source model for `init`, `install`, and `extract`
> - A category-by-category gap map across workflows, agents, skills, guides, rules, squads, commands, templates, docs, and tools
> - A migration strategy from the current inconsistent state
> - Explicit follow-on plan map for runtime parity, content parity, sync/update behavior, and documentation completion
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: contract definition -> topology audit -> category decisions -> migration design -> docs/update contract -> continuation backlog

---

## Context

### Original Request

Analyze Synkra's current framework packaging (`.aiox-core/`), Kord's wizard/init layer, and Kord's current architecture to define what should be builtin-only versus exportable, document what is missing, and leave a mapped continuation path for later plans.

### Confirmed Decisions

- Default content policy: **curated export**
- Kord should distinguish:
  - an **engine/runtime layer** that improves and runs the plugin
  - a **framework content layer** that can be exported, initialized, overridden, and evolved
- This needs to be documented so future work does not keep drifting across scaffolder/runtime/content paths
- Subagent analysis should be used to preserve the mapping and avoid losing architecture context

### Evidence (already verified)

- Workflow registry load order is `builtin -> squad -> project` in `src/features/workflow-engine/registry.ts`
- `src/cli/scaffolder.ts` currently hardcodes only two workflow exports into `.kord/workflows/`
- `src/features/builtin-workflows/` is underpopulated relative to project-local `.kord/workflows/`
- Project-local `.kord/workflows/` currently contains 14 Synkra-derived workflows
- Builtin content already exists across multiple categories:
  - `src/features/builtin-agents/`
  - `src/features/builtin-skills/`
  - `src/features/builtin-squads/`
  - `src/features/builtin-workflows/`
  - `src/features/builtin-commands/`
- Additional architect-verified violations:
  - command export currently copies TypeScript source templates instead of markdown command files usable by OpenCode
  - skill export currently flattens domain hierarchy during extraction
  - guides, templates, standards, and rules still live as string literals inside `src/cli/project-layout.ts`
  - several high-value methodology skills remain hardcoded TypeScript instead of exportable `SKILL.md`
  - builtin workflow source-of-truth remains fragmented across plugin assets, scaffolder assumptions, and project-local `.kord/workflows/`
- Existing adjacent plans already touched parts of this problem without defining one shared content contract:
  - `docs/kord/plans/init-delivery.md`
  - `docs/kord/plans/init-onboarding-depth-gap-fix.md`
  - `docs/kord/plans/workflow-engine-synkra-parity.md`
- Plan-analyzer findings that materially affect the architecture:
  - Synkra's current repository/content root is `.aiox-core/`, not `.aios-core/`
  - `.aiox-core/` is not a content-only layer; it ships engine + content together into projects
  - the most reusable Synkra patterns for Kord are the documented preset/profile schema and install-manifest/checksum upgrade strategy, not Synkra's overall deployment model

### Architecture Framing

The working product model is:

- **Engine Layer**: builtin, internal, required for Kord to run
- **Content Layer**: shipped by the plugin, selectively exportable, project-overridable, and versioned as framework content

The core failure to fix is not only "missing files". It is the absence of a single contract that answers:

- what stays builtin-only
- what is shipped as content
- what gets exported during `init` / `install`
- what is extract-only
- what is overrideable in `.kord/**` or `.opencode/**`
- how content evolves without drifting away from the runtime

This plan therefore treats Synkra as a **reference for content-packaging patterns**, not as a one-to-one engine/content architecture model.

---

## Project Artifacts

| Artifact | Agent | Path | Status |
|----------|-------|------|--------|
| Work Plan | planner | `docs/kord/plans/content-layer-curated-export-alignment.md` | generated |
| Working Draft | planner | `docs/kord/drafts/content-layer-architecture.md` | active |
| Architecture Review | architect | `docs/kord/architecture/engine-vs-content-boundary.md` | generated |
| Kord Content Topology Audit | explore | pending consolidation into plan/draft | pending |
| Synkra Content Model Comparison | librarian | pending consolidation into plan/draft | pending |

---

## Decision Points

- [ ] Decision: canonical source for exportable content
  - Options: `src/features/builtin-*` per category (recommended) | separate `content/` tree | mixed category-specific locations
  - Evaluation rubric: discoverability | extractability | testability | maintenance cost
  - Provisional direction: `src/features/builtin-*` becomes the canonical shipped-content contract

- [ ] Decision: export policy for `init`
  - Options: export everything | curated profiles (recommended) | minimal-only
  - Locked user preference: curated profiles
  - Remaining design work: define profiles (`minimal`, `default`, `full`) and declaration mechanism

- [ ] Decision: content declaration model
  - Options: inline hardcoded lists | per-file metadata marker | category manifest file (recommended)
  - Evaluation rubric: maintainability | testability | category consistency
  - Provisional direction: manifest-driven export declarations per content category

- [ ] Decision: content override model
  - Options: plugin wins | project wins (recommended) | merge engine
  - Evaluation rubric: user control | predictability | complexity
  - Provisional direction: project-local overrides win by stable IDs; no generic merge engine

- [ ] Decision: workflow treatment during transition
  - Options: immediately promote all Synkra-derived workflows to builtin | keep only Kord-native executable workflows builtin and classify others separately (recommended) | keep workflow content project-local only
  - Evaluation rubric: runtime fidelity | maintenance risk | user clarity

- [ ] Decision: content synchronization after install
  - Options: no sync behavior | manual extract diff only | doctor/status-aware checksum drift reporting (recommended target)
  - Evaluation rubric: upgrade safety | user clarity | operational overhead

- [ ] Decision: Synkra adoption level
  - Options: schema-compatible | inspired-by (recommended) | reference-only
  - Evaluation rubric: maintenance risk | conceptual fit | upgrade pressure
  - Provisional direction: inspired-by; adopt useful packaging patterns without mirroring Synkra's deploy-engine-to-project model

---

## Work Objectives

### Core Objective

Define the content contract that lets Kord evolve safely as a framework+engine system, instead of continuing with fragmented content sources and ad hoc export behavior.

### Concrete Deliverables

- A documented engine-vs-content boundary
- A category inventory for what is:
  - builtin-only
  - exportable by default
  - extract-only
  - overrideable in project-local paths
- A canonical content source decision
- A curated-export delivery model for `init` / `install` / `extract`
- A migration strategy for current mismatches
- A continuation backlog of follow-on plans needed after this contract is set
- A concrete violation list for current broken/incomplete content-export behavior
- A declared adoption level for Synkra patterns and the specific patterns Kord should borrow

### Definition of Done

- A single plan documents the target content architecture and the current mismatches by category
- The plan explicitly maps how existing adjacent plans (`init-delivery`, `init-onboarding-depth-gap-fix`, `workflow-engine-synkra-parity`) must be adjusted or continued
- The plan leaves no ambiguity about which categories are engine-only versus content-layer
- The plan includes a concrete continuation map for missing work still needed to reach Synkra-level effectiveness

### Must NOT Have (Guardrails)

- Do NOT collapse runtime-engine work and content-distribution work into one vague backlog
- Do NOT assume every shipped artifact should be auto-exported
- Do NOT let `scaffolder.ts` or other CLI code remain the source of truth for content selection
- Do NOT treat imported/reference-only Synkra assets as executable Kord-native content without explicit classification
- Do NOT rely on undocumented implicit behavior across `init`, `install`, `extract`, and runtime loaders
- Do NOT require human-only review steps as acceptance criteria
- Do NOT frame Kord's target architecture as "Synkra's content layer"; Synkra's current `.aiox-core/` bundles engine and content together

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: YES (tests-after for the later implementation work)
- **Framework**: Bun test + structural verification in future continuation plans

### Agent-Executed QA Scenarios

Scenario: content contract is concretely documented
  Tool: Bash / file existence checks
  Preconditions: plan is written
  Steps:
    1. Assert `docs/kord/plans/content-layer-curated-export-alignment.md` exists
    2. Assert the plan contains sections for decision points, category inventory, migration path, and continuation backlog
  Expected Result: the architecture contract is recorded in a stable artifact

Scenario: future implementation can be derived from the plan without hidden assumptions
  Tool: Read / grep
  Preconditions: plan finalized
  Steps:
    1. Verify the plan names concrete source files and categories
    2. Verify the plan distinguishes engine-only and exportable content
    3. Verify the plan includes explicit follow-on work areas
  Expected Result: the plan is actionable and auditable

---

## Execution Strategy

### Wave 1 - Contract and Topology
- Task 1: define the engine-vs-content contract
- Task 2: map the current Kord content topology
- Task 3: map the Synkra content-layer topology and comparison points

### Wave 2 - Category Decisions
- Task 4: classify workflows, agents, skills, squads, commands, guides, rules, templates, and docs by delivery model
- Task 5: define canonical content sources and manifest/profile strategy
- Task 6: define override and precedence rules across builtin, squad/package, and project-local layers

### Wave 3 - Migration and Documentation
- Task 7: identify current mismatches and required corrections in init/install/extract/scaffolder/loaders
- Task 8: define documentation and AGENTS updates required to keep the contract discoverable
- Task 9: define sync/update/drift-reporting requirements for shipped content

### Wave 4 - Continuation Backlog
- Task 10: split remaining work into follow-on plans/epics
- Task 11: map Synkra parity gaps that are content-layer versus runtime-layer
- Task 12: final architecture closure review

Critical Path: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 10 -> 11 -> 12

---

## TODOs

- [ ] 1. Define the Kord engine-vs-content contract

  **What to do**:
  - Define stable category rules for:
    - builtin-only engine internals
    - shipped exportable content
    - extract-only content
    - project-local overrideable content
  - Use current repo evidence plus Synkra comparison to justify the split

  **References**:
  - `docs/kord/drafts/content-layer-architecture.md`
  - `src/features/workflow-engine/registry.ts`
  - `src/features/builtin-commands/commands.ts`
  - `docs/kord/plans/init-delivery.md`
  - `docs/kord/plans/workflow-engine-synkra-parity.md`

  **Acceptance Criteria**:
  - [ ] Contract explicitly names which categories stay engine-internal
  - [ ] Contract explicitly names which categories are exportable content

- [ ] 2. Audit current Kord content topology by category

  **What to do**:
  - Map how each category currently exists in the repo:
    - workflows
    - agents
    - skills
    - squads
    - commands
    - guides/rules/templates/checklists/docs
  - Classify each as:
    - inline constant
    - builtin asset
    - scaffolded output
    - extract output
    - missing category contract

  **Acceptance Criteria**:
  - [ ] The plan includes a file-by-file topology map or equivalent table
  - [ ] Current mismatches are explicit, not implied

- [ ] 3. Audit Synkra `.aios-core` as the reference content-layer model
 - [ ] 3. Audit Synkra `.aiox-core/` packaging as the reference pattern source

  **What to do**:
  - Map how Synkra organizes workflows, tasks, templates, guides, standards, and related content under the current `.aiox-core/` packaging model
  - Distinguish which Synkra patterns are worth borrowing versus which are incompatible with Kord's plugin architecture
  - Explicitly capture useful borrowed patterns:
    - preset/profile schema concepts
    - install-manifest/checksum drift detection concepts
  - Extract the parts Kord still lacks conceptually

  **Acceptance Criteria**:
  - [ ] The plan records the key `.aiox-core/` packaging patterns relevant to Kord
  - [ ] The plan explicitly states what should NOT be copied verbatim or structurally mirrored

- [ ] 4. Classify every major content category by delivery model

  **What to do**:
  - For each category, define whether it should be:
    - builtin-only
    - exportable by default
    - extract-only
    - project-authored only
  - Cover at minimum:
    - T0 agents
    - specialist agents
    - workflows
    - skills
    - squads
    - guides
    - rules
    - templates/checklists
    - builtin slash command templates

  **Acceptance Criteria**:
  - [ ] Every major category has a delivery classification
  - [ ] No category is left ambiguous between engine and content

- [ ] 5. Define the canonical source-of-truth model for exportable content

  **What to do**:
  - Choose the canonical content home for shipped exportable assets
  - Define how `init`, `install`, and `extract` consume that source
  - Define how categories that are currently inline should migrate into canonical asset directories

  **Acceptance Criteria**:
  - [ ] The plan names the canonical source model
  - [ ] The plan forbids hardcoded content selection in CLI scaffolding

- [ ] 6. Define curated export profiles and declaration mechanism

  **What to do**:
  - Define `minimal`, `default`, and `full` export intent
  - Decide whether declaration is per-file metadata or per-category manifest
  - Specify how aliases/commands derived from exportable workflows are generated from the same declaration

  **Acceptance Criteria**:
  - [ ] The plan defines the profile model
  - [ ] The plan specifies a manifest/declaration strategy

- [ ] 7. Map current implementation mismatches and required corrections

  **What to do**:
  - Record the concrete areas needing correction in:
    - `init`
    - `install`
    - `extract`
    - `scaffolder`
    - workflow registry/loaders
    - content asset directories
    - docs and AGENTS discoverability
  - Explicitly map the currently verified contract violations:
    - broken commands export surface
    - flattened skills hierarchy on export
    - `project-layout.ts` as a monolithic content source
    - non-extractable hardcoded methodology skills
    - incomplete builtin workflow catalog and hardcoded scaffold assumptions
  - Separate quick structural fixes from larger follow-on work

  **Acceptance Criteria**:
  - [ ] The plan includes a correction matrix by file/area
  - [ ] The plan distinguishes urgent contract bugs from broader parity epics

- [ ] 8. Define documentation and discoverability updates

  **What to do**:
  - Map what must be updated in documentation so future contributors/agents know:
    - what is builtin-only
    - what is exportable content
    - where each category lives
    - how overrides work
    - how content is expected to evolve
  - Include internal agent-facing docs such as `AGENTS.md` and knowledge-base files

  **Acceptance Criteria**:
  - [ ] The plan includes explicit documentation targets
  - [ ] The plan requires final docs alignment after implementation

- [ ] 9. Define sync/update/drift-reporting requirements

  **What to do**:
  - Specify how shipped content drift should be detected after project export
  - Decide what later commands/checks should exist for:
    - content diff
    - content update notice
    - checksum/version tracking
    - backup/reinstall behavior for managed exported files
  - Keep this as planned behavior; no implementation in this plan

  **Acceptance Criteria**:
  - [ ] The plan defines future drift/sync expectations
  - [ ] The plan avoids implying silent overwrite behavior
  - [ ] The plan captures whether Kord should adopt an install-manifest/checksum pattern inspired by Synkra

- [ ] 10. Produce a continuation map of follow-on plans

  **What to do**:
  - Split post-contract work into distinct continuation tracks
  - At minimum include:
    - content architecture refactor
    - init/install/extract alignment
    - workflow content packaging
    - workflow runtime parity
    - documentation/AGENTS final alignment
  - Seed the continuation map with the concrete story groups already surfaced by architecture review:
    - fix commands export to markdown command assets
    - preserve skill domain hierarchy on extract
    - decompose `project-layout.ts` into builtin content directories
    - migrate exportable hardcoded skills into `SKILL.md`
    - audit/promote builtin workflow catalog from canonical shipped assets

  **Acceptance Criteria**:
  - [ ] The plan leaves a clear continuation backlog
  - [ ] Follow-on areas are separated rather than mixed into one mega-story

- [ ] 11. Separate content-layer gaps from runtime-parity gaps

  **What to do**:
  - Identify what still needs to be brought from Synkra as content-layer capability
  - Identify what instead belongs to runtime-engine parity work
  - Use this split to prevent future plan confusion

  **Acceptance Criteria**:
  - [ ] The plan clearly separates content and runtime work
  - [ ] Workflow engine parity is referenced as adjacent, not conflated

- [ ] 12. Final architecture closure review

  **What to do**:
  - Re-check the plan against current evidence and research findings
  - Verify no major category was omitted
  - Verify the plan remains aligned with the chosen curated-export policy

  **Acceptance Criteria**:
  - [ ] The plan can be used as the parent architecture contract for future continuation plans
  - [ ] No critical ambiguity remains around builtin-only vs exportable content

---

## Success Criteria

- Kord has a documented, stable content contract
- The curated-export policy is concretely defined rather than implied
- Every major content category is classified by delivery model
- Current mismatches in scaffolding/export/runtime discovery are explicitly mapped
- Synkra comparison is used to reveal missing capability without collapsing engine and content concerns
- Future continuation plans can be generated from this contract without re-litigating the architecture


Minha recomendação: 
     1. content-asset-source-refactor (recomendado) — tirar conteúdo de project-                                        Research Swarm and persist        
     layout.ts, corrigir fonte canônica                                                                                 evidence
     2. init-install-extract-alignment — corrigir export/scaffold/extract            stall export model.            [ ] If Medium/Complex: run Artifact     
     3. workflow-content-pack-alignment — alinhar builtin workflows, aliases e                                          Generation Swarm with Context       
     export curated                                                                                                     Packs
     4. hardcoded-skills-liberation — mover skills exportáveis para SKILL.md                                        [ ] Finalize plan v1 and perform        
     5. docs-agents-content-contract-alignment — alinhar docs/AGENTS ao novo                                            self-review (gap classification)    
     contrato 