# Squad Orchestration Remediation

## TL;DR

> **Quick Summary**: Close the remaining blockers left after `squad-orchestration-deepening` by removing legacy squad/category teaching from active user-facing artifacts, upgrading the built-in `code` squad seed to the new package/orchestration mental model, and recording staged follow-up gaps explicitly.
>
> **Deliverables**:
> - Corrected active squad documentation in `README.md`
> - Updated built-in `code` squad seed aligned with the new package/orchestration model
> - Discoverable follow-up artifact documenting staged compatibility/runtime gaps
>
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: inventory -> README fix -> code seed fix -> staged-gap artifact -> regression verification

---

## Context

### Original Request

After reviewing the implementation of `docs/kord/plans/squad-orchestration-deepening.md`, the user approved moving forward with a focused remediation plan to close remaining blockers and explicitly stage anything that should not be fixed in this pass.

### Interview Summary

**Key Discussions**:
- The deep squad orchestration implementation is technically green, but not fully complete against the plan's acceptance language.
- The most important remaining problems are active docs and shipped seed content still teaching or implying the legacy squad model.
- The next plan should be remediation-oriented, not another full re-architecture effort.

**Research Findings**:
- `README.md` still says squads declare categories for task routing and includes a `categories:` example.
- `src/features/builtin-squads/code/SQUAD.yaml` still looks like a shallow chief/developer seed and does not demonstrate package/orchestration semantics.
- `src/tools/squad-load/tools.ts` and `src/shared/types/squad.ts` still preserve a legacy-shaped compatibility surface.
- Shared workflow-engine integration exists, but deeper squad-aware runtime behavior remains staged work.

### Analyst Review

**Identified Gaps** (applied in this remediation plan):
- Classification rules must be explicit: blocker vs staged follow-up vs intentional compatibility gap.
- Scope must be locked down to avoid drifting back into architecture work.
- Story closure must be defined with executable acceptance checks, not subjective review.
- Staged gaps must be recorded in a discoverable artifact so they are not lost.

---

## Project Artifacts

| Artifact | Agent | Path | Status |
|----------|-------|------|--------|
| Review Draft | planner | `docs/kord/drafts/squads-next-steps.md` | generated |
| Remediation Plan | planner | `docs/kord/plans/squad-orchestration-remediation.md` | generated |

---

## Decision Points

- [ ] Decision: Classification rules for remaining gaps
  - Options: blocker vs staged follow-up vs intentional compatibility gap
  - Evaluation rubric: story acceptance impact | user-facing mental model impact | architectural churn | migration risk
  - Evidence:
    - `docs/kord/drafts/squads-next-steps.md`
    - `docs/kord/stories/squad-orchestration-deepening.md`
  - Final decision: blocker = acceptance-blocking or user-facing legacy teaching; staged follow-up = real but non-blocking gap; intentional compatibility gap = accepted divergence with documented rationale
  - Rationale: keeps the remediation pass narrow while preserving visibility for unresolved work

- [ ] Decision: Scope of "active docs/artifacts"
  - Options: README only | README + shipped seeds + active squad docs
  - Evaluation rubric: acceptance coverage | user impact | implementation scope | consistency
  - Evidence:
    - `README.md`
    - `src/features/builtin-squads/code/SQUAD.yaml`
    - `docs/kord/stories/squad-orchestration-deepening.md`
  - Final decision: `README.md` + shipped built-in `code` seed + one discoverable follow-up artifact
  - Rationale: these are the smallest surfaces that still materially affect current teaching and story closure

- [ ] Decision: Treatment of `squad_load` legacy output shape
  - Options: fix now | stage as compatibility gap
  - Evaluation rubric: runtime breakage evidence | migration cost | scope fit | acceptance impact
  - Evidence:
    - `src/tools/squad-load/tools.ts`
    - `src/shared/types/squad.ts`
    - `docs/kord/drafts/squads-next-steps.md`
  - Final decision: stage as compatibility gap in this remediation pass
  - Rationale: no verified user-facing breakage has been established yet; changing it here would expand scope into migration/runtime redesign

---

## Work Objectives

### Core Objective

Close the remaining blocker-level gaps from deep squad orchestration so active Kord docs and shipped seed content no longer teach the legacy squad/category model, while explicitly preserving staged follow-up gaps for later work.

### Concrete Deliverables

- Updated `README.md` squad section and example
- Updated `src/features/builtin-squads/code/SQUAD.yaml` seed
- A discoverable markdown artifact recording staged follow-up gaps and rationale

### Definition of Done

- [ ] `README.md` no longer teaches squads as categories or shows a `categories:` squad example
- [ ] The built-in `code` squad seed demonstrates package/orchestration semantics, not just agent declarations
- [ ] Staged compatibility/runtime gaps are recorded in a discoverable markdown artifact
- [ ] `bun test`, `bun run typecheck`, and `bun run build` all pass after remediation

### Must Have

- Explicit blocker vs follow-up classification
- Narrow implementation scope focused on active docs/seeds and follow-up recording
- No reintroduction of category-based squad semantics
- Clear, executable verification criteria

### Must NOT Have (Guardrails)

- No changes to `src/tools/squad-load/tools.ts`
- No changes to `src/shared/types/squad.ts`
- No workflow-engine runtime deepening in this pass
- No squad schema redesign in this pass
- No broad README cleanup unrelated to squad semantics
- No new squads or broad seed-library expansion

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: bun test

### Agent-Executed QA Scenarios

Scenario: README no longer teaches category-based squad semantics
  Tool: Bash
  Preconditions: Repository available locally
  Steps:
    1. Search `README.md` for `categories for task routing`
    2. Search `README.md` for `categories:` within the squad example block
    3. Read the squad section and confirm it describes squads as package-oriented teams coordinated by chiefs
  Expected Result: No legacy category-based squad teaching remains in `README.md`
  Failure Indicators: Legacy category language still present or replacement language still describes shallow squad semantics
  Evidence: terminal output capture

Scenario: Built-in code squad seed reflects the new mental model
  Tool: Bash
  Preconditions: `src/features/builtin-squads/code/SQUAD.yaml` exists
  Steps:
    1. Read `src/features/builtin-squads/code/SQUAD.yaml`
    2. Confirm the manifest includes `components` and `orchestration`
    3. Confirm the manifest still reads as a minimal seed, not a legacy shallow example
  Expected Result: `code` seed demonstrates package/orchestration semantics clearly
  Failure Indicators: Seed remains agent-only or omits package/orchestration structure
  Evidence: terminal output capture

Scenario: Staged gaps are preserved for future sessions
  Tool: Bash
  Preconditions: remediation work completed
  Steps:
    1. Read the chosen follow-up artifact
    2. Confirm it lists at least `squad_load` compatibility shape, deeper runtime orchestration, and creator determinism as staged items
    3. Confirm each staged item includes a rationale for why it was not fixed in this pass
  Expected Result: Future planning sessions can recover the remaining work without relying on chat memory
  Failure Indicators: No artifact created or staged items listed without rationale
  Evidence: terminal output capture

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):
- Task 1: Inventory in-scope legacy squad semantics and verify exact edit targets
- Task 2: Design the minimal correct `code` squad seed contract

Wave 2 (After Wave 1):
- Task 3: Fix active README squad teaching
- Task 4: Upgrade the built-in `code` squad seed
- Task 5: Record staged follow-up gaps in a discoverable artifact
- Task 6: Run final non-regression verification

Critical Path: 1 -> 3 -> 4 -> 5 -> 6

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4 | 2 |
| 2 | None | 4 | 1 |
| 3 | 1 | 6 | 4, 5 |
| 4 | 1, 2 | 6 | 3, 5 |
| 5 | 1 | 6 | 3, 4 |
| 6 | 3, 4, 5 | None | None |

---

## TODOs

- [ ] 1. Inventory the exact in-scope legacy squad semantics

  **What to do**:
  - Search the explicit in-scope surfaces for lingering legacy squad/category teaching
  - Confirm the exact lines/sections that must change before editing begins
  - Record the inventory so implementation stays bounded

  **Must NOT do**:
  - Do not widen scope to unrelated docs or runtime files
  - Do not fix out-of-scope historical plan files in this pass

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: this is primarily documentation inventory and scope control
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 3, 4, 5
  - **Blocked By**: None

  **References**:
  - `README.md` - current user-facing squad description and example to audit
  - `src/features/builtin-squads/code/SQUAD.yaml` - shipped seed that may still teach shallow semantics
  - `docs/kord/drafts/squads-next-steps.md` - already-collected review findings and blocker classification
  - `docs/kord/stories/squad-orchestration-deepening.md` - source of the acceptance criteria this remediation must satisfy

  **Acceptance Criteria**:
  - [ ] In-scope file list is explicitly confirmed before edits begin
  - [ ] Exact legacy claims to remove are identified, not just generally described

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Inventory finds all in-scope legacy squad language
    Tool: Bash
    Preconditions: Repository available locally
    Steps:
      1. Search `README.md` for `categories`, `SQUAD.yaml`, and squad example sections
      2. Read `src/features/builtin-squads/code/SQUAD.yaml`
      3. Compare findings with `docs/kord/stories/squad-orchestration-deepening.md`
    Expected Result: A bounded edit target list exists for the remediation pass
    Evidence: Search output and file reads captured
  ```

  **Commit**: NO

- [ ] 2. Define the minimal correct built-in `code` squad seed contract

  **What to do**:
  - Decide the minimal package/orchestration sections the shipped `code` seed must include
  - Keep the seed small and illustrative, not production-bloated
  - Ensure it still fits the current schema and validator expectations

  **Must NOT do**:
  - Do not turn the seed into a large showcase squad
  - Do not redesign the squad schema in order to support the seed

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: this balances schema correctness, UX clarity, and shipped-example quality
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 4
  - **Blocked By**: None

  **References**:
  - `src/features/builtin-squads/code/SQUAD.yaml` - existing shallow seed to adapt
  - `src/features/squad/schema.ts` - source of truth for allowed package/orchestration fields
  - `src/features/squad/AGENTS.md` - current schema documentation and intended mental model
  - `docs/kord/adrs/squad-package-model.md` - architecture decision that explains what squads are now

  **Acceptance Criteria**:
  - [ ] Minimal required seed sections are decided before editing the seed
  - [ ] The target seed shape is package-oriented without becoming unnecessarily complex

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Seed contract is minimal but aligned
    Tool: Bash
    Preconditions: Schema and current seed files exist
    Steps:
      1. Read `src/features/squad/schema.ts`
      2. Read `src/features/builtin-squads/code/SQUAD.yaml`
      3. Compare with the package model in `docs/kord/adrs/squad-package-model.md`
    Expected Result: The planned seed update includes `components` and `orchestration` with a justified minimal footprint
    Evidence: File read notes captured
  ```

  **Commit**: NO

- [ ] 3. Rewrite the active README squad section to the new mental model

  **What to do**:
  - Replace category-based squad language with package/team-oriented wording
  - Update the embedded `SQUAD.yaml` example so it no longer shows `categories:`
  - Keep the README changes surgical and limited to squad semantics

  **Must NOT do**:
  - Do not reorganize unrelated README sections
  - Do not expand the README into a full squad guide

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: this is a user-facing documentation correction task
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 6
  - **Blocked By**: 1

  **References**:
  - `README.md` - active user-facing doc that currently teaches the wrong model
  - `src/features/squad/AGENTS.md` - accurate subsystem wording to mirror
  - `docs/kord/stories/squad-orchestration-deepening.md` - story acceptance criteria for doc correction
  - `docs/kord/drafts/squads-next-steps.md` - review notes identifying the exact doc problem

  **Acceptance Criteria**:
  - [ ] `README.md` no longer contains `categories for task routing`
  - [ ] `README.md` no longer contains a `categories:` block in the squad example
  - [ ] README squad wording describes squads as orchestration-aware packages/teams coordinated by chiefs

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: README category language is fully removed
    Tool: Bash
    Preconditions: README changes saved
    Steps:
      1. Search `README.md` for `categories for task routing`
      2. Search `README.md` for `categories:`
      3. Read the `### Squads` section and verify the replacement wording references package assets/orchestration rather than categories
    Expected Result: No legacy squad/category teaching remains in the active README section
    Evidence: Search output and section read captured
  ```

  **Commit**: NO

- [ ] 4. Upgrade the built-in `code` squad seed to the package/orchestration model

  **What to do**:
  - Update `src/features/builtin-squads/code/SQUAD.yaml` so the shipped seed reflects the new squad model
  - Add minimal `components` and `orchestration` sections appropriate for the default `code` squad
  - Preserve the seed as a minimal starter, not a comprehensive framework demo

  **Must NOT do**:
  - Do not add unrelated runtime logic or new supporting code files unless the seed contract absolutely requires them
  - Do not turn this into a creator/runtime refactor

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: this is a small file but it encodes shipped architecture and user expectations
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 6
  - **Blocked By**: 1, 2

  **References**:
  - `src/features/builtin-squads/code/SQUAD.yaml` - file to update
  - `src/features/squad/schema.ts` - schema rules to remain valid against
  - `src/tools/squad-validate/tools.ts` - validator behavior the seed should satisfy
  - `src/features/builtin-squads/AGENTS.md` - built-in squad expectations and seed guidance

  **Acceptance Criteria**:
  - [ ] `code` seed includes `components` and `orchestration`
  - [ ] Seed remains readable as a minimal shipped starter
  - [ ] Seed content aligns with the current validator and package/orchestration mental model

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Built-in code seed validates as a package-oriented squad
    Tool: Bash
    Preconditions: Seed changes saved
    Steps:
      1. Read `src/features/builtin-squads/code/SQUAD.yaml`
      2. Confirm `components` exists with package asset declarations
      3. Confirm `orchestration.runner` and `orchestration.delegation_mode` exist
      4. Run the squad validation flow used by the repo for squad manifests
    Expected Result: The shipped seed is no longer a shallow agent-only example and validates cleanly
    Evidence: File read plus validator output captured
  ```

  **Commit**: NO

- [ ] 5. Record staged follow-up gaps in a discoverable artifact

  **What to do**:
  - Add or update a markdown artifact that explicitly records the remaining staged gaps
  - Include at least the `squad_load` compatibility shape, deeper squad runtime semantics, and stronger creator determinism
  - For each staged item, explain why it is not being fixed in this remediation pass

  **Must NOT do**:
  - Do not leave follow-up gaps only in chat memory
  - Do not silently downgrade blockers into vague future work

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: this is documentation of staged architectural debt and migration intent
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 6
  - **Blocked By**: 1

  **References**:
  - `docs/kord/drafts/squads-next-steps.md` - current review findings and classification basis
  - `docs/kord/stories/squad-orchestration-deepening.md` - existing story framing and acceptance context
  - `src/tools/squad-load/tools.ts` - compatibility-gap source
  - `src/shared/types/squad.ts` - legacy parsed shape source
  - `src/features/workflow-engine/registry.ts` - current workflow integration boundary
  - `src/features/workflow-engine/engine.ts` - current runtime execution boundary
  - `src/features/builtin-agents/squad-creator.md` - current creator contract that remains partly prompt-enforced

  **Acceptance Criteria**:
  - [ ] A discoverable markdown artifact lists all staged follow-up items
  - [ ] Each staged item includes rationale and boundary notes
  - [ ] Future sessions can recover the remaining work without relying on chat context

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Follow-up gaps remain visible after remediation closes
    Tool: Bash
    Preconditions: Follow-up artifact created or updated
    Steps:
      1. Read the artifact
      2. Verify it includes `squad_load` compatibility shape, deeper runtime orchestration, and creator determinism
      3. Verify each includes rationale for staging
    Expected Result: The remaining work is preserved in repo docs and does not depend on session memory
    Evidence: Artifact content captured
  ```

  **Commit**: NO

- [ ] 6. Run final non-regression verification and close the remediation pass

  **What to do**:
  - Run the repo verification commands after README/seed/follow-up artifact changes
  - Confirm no new blocker-level drift was introduced
  - Confirm the remediation pass stayed within scope

  **Must NOT do**:
  - Do not interpret green tests as proof that staged follow-up gaps are solved
  - Do not expand scope if a staged gap is merely rediscovered during verification

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: this is a bounded verification/closure task
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final sequential
  - **Blocks**: None
  - **Blocked By**: 3, 4, 5

  **References**:
  - `docs/kord/plans/squad-orchestration-remediation.md` - scope and closure criteria for the remediation pass
  - `docs/kord/stories/squad-orchestration-deepening.md` - story acceptance the remediation is intended to unblock
  - `README.md` - corrected user-facing squad doc
  - `src/features/builtin-squads/code/SQUAD.yaml` - corrected shipped seed

  **Acceptance Criteria**:
  - [ ] `bun test` passes
  - [ ] `bun run typecheck` passes
  - [ ] `bun run build` passes
  - [ ] No blocker-level legacy squad teaching remains in the explicit in-scope surfaces

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Repository remains green after remediation
    Tool: Bash
    Preconditions: All remediation edits saved
    Steps:
      1. Run `bun test`
      2. Run `bun run typecheck`
      3. Run `bun run build`
      4. Re-check `README.md` and `src/features/builtin-squads/code/SQUAD.yaml` against this plan's blocker criteria
    Expected Result: Repo stays green and the remediation pass closes its defined blockers
    Evidence: Command output captured
  ```

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 6 | `docs(squads): align active docs and seed with package model` | `README.md`, `src/features/builtin-squads/code/SQUAD.yaml`, chosen follow-up artifact | `bun test && bun run typecheck && bun run build` |

---

## Success Criteria

### Verification Commands

```bash
bun test
bun run typecheck
bun run build
```

### Final Checklist

- [ ] Active user-facing squad teaching no longer references category-based squad semantics
- [ ] Built-in `code` squad seed reflects the package/orchestration model
- [ ] Staged follow-up gaps are documented in-repo and discoverable
- [ ] No out-of-scope architecture or compatibility work was pulled into this remediation pass

---

## Handoff

Plan saved to: `docs/kord/plans/squad-orchestration-remediation.md`

Supporting context:
- `docs/kord/plans/squad-orchestration-deepening.md`
- `docs/kord/stories/squad-orchestration-deepening.md`
- `docs/kord/drafts/squads-next-steps.md`

This remediation plan is intentionally narrow. It closes blocker-level drift from the deeper squad rollout without reopening the larger architecture program.
