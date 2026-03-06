# Deep Squad Orchestration for Kord

## TL;DR

> **Quick Summary**: Re-architect Kord squads from a shallow agent-team feature into orchestration-aware domain packages aligned with Synkra’s mental model, while integrating cleanly with Kord’s separate shared workflow engine effort.
>
> **Deliverables**:
> - Durable analysis artifacts under `docs/kord/analyses/squads/`
> - Revised squad architecture and schema direction
> - Explicit boundary contract between squads and the shared workflow engine
> - Migration and validation plan for existing squad work
> - Explicit documentation refresh plan covering `AGENTS.md`, `README.md`, guides, and squad-related docs
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: architecture comparison -> boundary contract -> schema/package redesign -> validator/creator redesign

---

## Context

### Original Request

The user wants Kord squads to follow Synkra’s full orchestration mental model, not remain a shallow “chief + workers + delegation syntax” feature. Categories for squads are explicitly invalid because squads are teams coordinated by a chief.

### Interview Summary

**Key Discussions**:
- Squads should be treated as teams/subteams, not category routing constructs.
- Synkra comparison must determine whether there is a deeper execution model behind squads.
- Kord already has a separate workflow engine effort in another session/plan; squad planning must account for that instead of ignoring it.
- Analysis and comparison must be saved as artifacts, not left in volatile session context.

**Research Findings**:
- Synkra has a broader orchestration/workflow substrate plus squad packaging/tooling.
- Kord currently covers agent-team materialization well but lacks the richer package/orchestration layer.
- Kord schema still contains `categories`, which conflicts with the clarified target model.

### Analyst Review

**Identified Gaps** (addressed in this revised plan):
- Prior squad planning under-scoped orchestration depth.
- Previously implemented work improved the current shallow model but did not redefine squads as orchestration-aware packages.
- The workflow-engine boundary was not explicit enough.

---

## Project Artifacts

| Artifact | Agent | Path | Status |
|----------|-------|------|--------|
| Synkra Execution Model Analysis | analyst | `docs/kord/analyses/squads/synkra-execution-model.md` | generated |
| Kord Gap Analysis | analyst | `docs/kord/analyses/squads/kord-current-state-gap-analysis.md` | generated |
| Orchestration Boundary Analysis | architect | `docs/kord/analyses/squads/orchestration-boundary.md` | generated |
| Documentation Impact Analysis | analyst | `docs/kord/analyses/squads/documentation-impact.md` | generated |
| Migration and Opportunities Analysis | analyst | `docs/kord/analyses/squads/migration-and-opportunities.md` | generated |
| Keep/Adapt/Remove Migration Analysis | analyst | `docs/kord/analyses/squads/migration-keep-adapt-remove.md` | generated |
| Revised Squad Plan | planner | `docs/kord/plans/squad-orchestration-deepening.md` | generated |
| Squad Package Model ADR | architect | `docs/kord/adrs/squad-package-model.md` | generated |
| Execution Stories | sm | `docs/kord/stories/squad-orchestration-deepening.md` | generated |

---

## Decision Points

- [ ] Decision: Shared workflow engine vs dedicated squad engine
  - Options: shared engine with squad adapter | fully separate squad engine | hybrid with shared core and squad-local adapters
  - Evaluation rubric: conceptual clarity | duplication risk | maintainability | execution fidelity | migration cost
  - Evidence:
    - `docs/kord/analyses/squads/synkra-execution-model.md`
    - `docs/kord/analyses/squads/orchestration-boundary.md`
  - Final decision: shared engine with squad adapter layer (default planning assumption)
  - Rationale: closest to Synkra mental model without duplicating core orchestration responsibilities

- [ ] Decision: Categories handling
  - Options: remove entirely | keep as deprecated no-op
  - Evaluation rubric: conceptual clarity | migration pain | ambiguity reduction
  - Evidence:
    - `docs/kord/analyses/squads/kord-current-state-gap-analysis.md`
  - Final decision: remove entirely
  - Rationale: squads are teams, chief coordinates, categories conflict with intended semantics

---

## Work Objectives

### Core Objective

Redefine Kord squads as orchestration-aware domain packages that integrate with Kord’s shared workflow engine and support chief/subteam execution patterns without conceptual ambiguity.

### Concrete Deliverables

- Revised squad package architecture
- Removal plan for squad categories
- Integration contract between squads and the workflow engine
- Validator/creator redesign plan
- Migration strategy for already-implemented shallow squad work
- Documentation refresh scope for all squad-facing architecture and usage docs
- Opportunity map for improving beyond Synkra where Kord can be clearer or stronger

### Definition of Done

- [ ] Analysis artifacts exist under `docs/kord/analyses/squads/`
- [ ] Squad architecture is documented with clear engine boundary
- [ ] Revised plan covers schema, packaging, orchestration, validation, creator, and migration
- [ ] No new squad plan item depends on categories semantics

### Must Have

- Squads modeled as teams/packages, not routing categories
- Chief/subteam orchestration semantics
- Integration with shared workflow engine
- Durable artifacts documenting the rationale
- First-class documentation updates planned alongside architecture changes
- Explicit keep/adapt/remove migration treatment for already-implemented squad work

### Must NOT Have (Guardrails)

- Reintroducing categories into squad semantics
- Building a duplicate orchestration engine inside the squad layer without necessity
- Leaving architectural conclusions only in chat memory
- Treating prompt-only delegation as sufficient for deep squad orchestration

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: bun test

### Agent-Executed QA Scenarios

Scenario: Analysis artifact set is complete
  Tool: Bash
  Preconditions: Repository available locally
  Steps:
    1. Check that `docs/kord/analyses/squads/` exists
    2. Verify the expected markdown files are present
    3. Read each file and confirm it contains architecture content, not placeholders
  Expected Result: All analysis artifacts exist and contain substantive content
  Failure Indicators: Missing files, empty files, or placeholder-only content
  Evidence: terminal output capture

Scenario: Revised plan covers required architecture domains
  Tool: Bash
  Preconditions: Plan file created
  Steps:
    1. Open `docs/kord/plans/squad-orchestration-deepening.md`
    2. Confirm it includes architecture, boundary, migration, validation, and creator redesign tasks
    3. Confirm categories are treated as removed, not repurposed
  Expected Result: Plan reflects the clarified target architecture
  Failure Indicators: Missing sections, shallow scope, or lingering category-based design
  Evidence: terminal output capture

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):
- Task 1: Consolidate Synkra execution model evidence
- Task 2: Consolidate Kord current-state gap analysis

Wave 2 (After Wave 1):
- Task 3: Define orchestration boundary with shared workflow engine
- Task 4: Define target squad package model and schema direction

Wave 3 (After Wave 2):
- Task 5: Redesign squad validator and creator scope
- Task 6: Produce migration strategy for already-implemented squad work
- Task 7: Produce explicit documentation refresh and guidance update scope

Critical Path: 1 -> 3 -> 4 -> 5 -> 6 -> 7

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4 | 2 |
| 2 | None | 3, 4 | 1 |
| 3 | 1, 2 | 4, 5 | None |
| 4 | 1, 2, 3 | 5, 6, 7 | None |
| 5 | 3, 4 | 6, 7 | None |
| 6 | 4, 5 | 7 | None |
| 7 | 4, 5, 6 | None | None |

---

## TODOs

- [ ] 1. Consolidate Synkra squad execution evidence

  **What to do**:
  - Synthesize how Synkra separates workflow/orchestration concerns from squad packaging
  - Identify where squad-local runtime adapters exist versus generic engine behavior

  **Must NOT do**:
  - Do not assume squad manifests alone explain execution
  - Do not copy Synkra terminology blindly without mapping it to Kord

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: cross-cutting architecture and evidence synthesis
  - **Skills**: `[]`
    - Reason: repo/document analysis is primary here

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 3, 4
  - **Blocked By**: None

  **References**:
  - `docs/kord/analyses/squads/synkra-execution-model.md` - initial synthesized evidence
  - `D:\dev\synkra-aios\docs\guides\workflows-guide.md` - generic workflow execution model
  - `D:\dev\synkra-aios\.aios-core\schemas\squad-schema.json` - squad package structure

  **Acceptance Criteria**:
  - [ ] Synkra evidence clearly distinguishes generic engine vs squad package roles
  - [ ] Evidence includes at least one example of squad-local runtime behavior

- [ ] 2. Consolidate Kord squad current-state architecture

  **What to do**:
  - Document what Kord squads currently do well
  - Identify shallow areas relative to the target orchestration model

  **Must NOT do**:
  - Do not frame current implementation as final-state architecture

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: architecture and gap analysis
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 3, 4
  - **Blocked By**: None

  **References**:
  - `docs/kord/analyses/squads/kord-current-state-gap-analysis.md` - current state summary
  - `src/features/squad/schema.ts` - current schema assumptions
  - `src/features/squad/factory.ts` - current runtime materialization model
  - `src/tools/squad-validate/tools.ts` - current validation depth

  **Acceptance Criteria**:
  - [ ] Gaps are grouped by architecture layer, not scattered observations
  - [ ] Categories are identified as conceptually invalid for squads

- [ ] 3. Define the squad/workflow-engine boundary

  **What to do**:
  - Establish what the shared workflow engine owns versus what the squad layer owns
  - Define how squads plug into the engine without duplicating it

  **Must NOT do**:
  - Do not collapse everything into a squad-specific engine by default

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 4, 5
  - **Blocked By**: 1, 2

  **References**:
  - `docs/kord/analyses/squads/orchestration-boundary.md` - initial boundary proposal
  - `docs/kord/analyses/squads/synkra-execution-model.md` - upstream mental model

  **Acceptance Criteria**:
  - [ ] Shared engine responsibilities are explicitly listed
  - [ ] Squad responsibilities are explicitly listed
  - [ ] Optional squad-local adapter mechanism is allowed but not overused

- [ ] 4. Redesign the squad package model and schema direction

  **What to do**:
  - Define the target package contents for Kord squads
  - Specify removal of `categories`
  - Define how tasks/workflows/templates/checklists/data/scripts should appear in the new squad model

  **Must NOT do**:
  - Do not leave squads as agent-only manifests

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 5, 6
  - **Blocked By**: 1, 2, 3

  **References**:
  - `src/features/squad/schema.ts` - current schema baseline
  - `D:\dev\synkra-aios\.aios-core\schemas\squad-schema.json` - richer package model reference

  **Acceptance Criteria**:
  - [ ] Categories removal is explicit
  - [ ] Package contents are defined beyond agents
  - [ ] Package model aligns with shared engine boundary

- [ ] 5. Redesign validator and squad-creator scope

  **What to do**:
  - Expand validation goals from syntax/basic references to package integrity and orchestration readiness
  - Define what squad-creator must generate/validate to avoid shallow or generic squads

  **Must NOT do**:
  - Do not stop at skill existence validation only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 6
  - **Blocked By**: 3, 4

  **References**:
  - `src/tools/squad-validate/tools.ts` - current validator
  - `src/agents/squad-creator.ts` - current creator entry point
  - `D:\dev\synkra-aios\squads\squad-creator\tasks\create-agent.md` - anti-generic creation reference
  - `D:\dev\synkra-aios\docs\guides\agents\SQUAD-CREATOR-SYSTEM.md` - deterministic authoring model

  **Acceptance Criteria**:
  - [ ] Validation scope includes package integrity and orchestration-readiness checks
  - [ ] Creator scope includes agents, tasks, workflows, and quality depth

- [ ] 6. Define migration strategy for previously implemented squad work

  **What to do**:
  - Review what was already implemented under the shallow model
  - Classify what remains valid foundation, what must change, and what must be removed

  **Must NOT do**:
  - Do not discard useful foundations unnecessarily

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final sequential
  - **Blocks**: None
  - **Blocked By**: 4, 5

  **References**:
  - `docs/kord/plans/plan-3-squads-authority.md` - earlier plan baseline
  - `docs/kord/analyses/squads/kord-current-state-gap-analysis.md` - current-state view

  **Acceptance Criteria**:
  - [ ] Prior work is classified as keep/adapt/remove
  - [ ] Migration path minimizes wasted work while correcting architecture

- [ ] 7. Define explicit documentation refresh scope

  **What to do**:
  - Enumerate all user-facing and contributor-facing docs that must change
  - Align documentation with the deeper squad package/orchestration model
  - Ensure no docs continue teaching the shallow or category-based model

  **Must NOT do**:
  - Do not leave documentation as an implied follow-up

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: documentation architecture and contributor guidance
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final sequential
  - **Blocks**: None
  - **Blocked By**: 4, 5, 6

  **References**:
  - `docs/kord/analyses/squads/documentation-impact.md` - doc-surface inventory
  - `AGENTS.md` - project mental model and architecture guidance
  - `README.md` - user-facing feature framing
  - `src/features/squad/AGENTS.md` - squad subsystem behavior
  - `src/features/builtin-agents/squad-creator.md` - creator expectations

  **Acceptance Criteria**:
  - [ ] Documentation scope includes architecture docs, user docs, contributor docs, and agent guidance
  - [ ] No documentation artifact describes squads as categories or shallow delegation-only constructs

---

## Success Criteria

### Verification Commands

```bash
bun test
bun run typecheck
bun run build
```

### Final Checklist

- [ ] All squad architecture decisions align with full orchestration target
- [ ] Categories are removed from squad semantics
- [ ] Squad redesign is explicitly integrated with the separate workflow-engine plan
- [ ] Durable analyses exist for future sessions and implementation agents
- [ ] Documentation updates are explicitly planned as part of the architecture migration

---

## Handoff

Plan saved to: `docs/kord/plans/squad-orchestration-deepening.md`

Supporting analysis artifacts:
- `docs/kord/analyses/squads/synkra-execution-model.md`
- `docs/kord/analyses/squads/kord-current-state-gap-analysis.md`
- `docs/kord/analyses/squads/orchestration-boundary.md`
- `docs/kord/analyses/squads/documentation-impact.md`
- `docs/kord/analyses/squads/migration-and-opportunities.md`
- `docs/kord/analyses/squads/migration-keep-adapt-remove.md`

Execution-enabling artifacts:
- `docs/kord/adrs/squad-package-model.md`
- `docs/kord/stories/squad-orchestration-deepening.md`

The draft remains useful until you confirm this direction is the new source of truth. After that, the execution path should start from this revised plan, not the older shallow squad assumptions.
