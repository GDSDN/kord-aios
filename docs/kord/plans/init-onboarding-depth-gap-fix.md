# Init Onboarding Depth Gap Fix (New vs Existing Project)

## TL;DR

> **Quick Summary**: The previous `init-delivery` + `methodology-content` implementation shipped the *mechanics* (scaffold + mode marker), but multiple methodology artifacts (guides, injected rules, templates, checklists, and some skills) remain **quickstart-level** and fail the intended Synkra-level depth.
>
> This plan upgrades the scaffolded methodology pack to be **auditable** (rubrics + gates + concrete artifacts + agent-executable verification) while keeping injected rule files (`.kord/rules/*`) **small and high-signal**.

**Deliverables**:
- Updated scaffolded onboarding docs:
  - `.kord/guides/new-project.md`
  - `.kord/guides/existing-project.md`
- Upgraded injected rule file:
  - `.kord/rules/project-mode.md` (stage gates + sunset clause + links)
- New auditable rubrics (scaffolded):
  - `.kord/standards/onboarding-depth-rubric.md`
  - `.kord/standards/methodology-artifacts-quality-rubric.md` (templates + checklists + standards + mode skills)
- A parity audit report (quality-first, reviewer-friendly):
  - `docs/kord/research/synkra-methodology-parity-audit.md`
- Tests that enforce depth and size budgets:
  - `src/cli/scaffolder.test.ts`

**Estimated Effort**: Medium
**Parallel Execution**: YES (3 waves)
**Critical Path**: Define rubric/structure → add failing tests → update scaffold content → verify `bun test`

---

## Context

### Original Request

The user observed that Kord AIOS’s New Project vs Existing Project instructions are “too generic” and asked for a **new plan** that:
- pinpoints what went wrong in the previous implementation
- covers the gaps with **deep methodology** comparable to Synkra AIOS greenfield/brownfield
- makes it easy to **audit** whether onboarding content was implemented “properly”

### Previous Plans (Scope Source)

- `docs/kord/plans/init-delivery.md`
- `docs/kord/plans/methodology-content.md`

### Where the Current Implementation Lives

- `src/cli/project-layout.ts`:
  - `KORD_GUIDE_NEW_PROJECT_CONTENT` → scaffolds `.kord/guides/new-project.md`
  - `KORD_GUIDE_EXISTING_PROJECT_CONTENT` → scaffolds `.kord/guides/existing-project.md`
- `src/cli/scaffolder.ts`:
  - `getProjectModeContent()` → scaffolds `.kord/rules/project-mode.md` (injected via rules-injector)
- `src/cli/status/index.ts`:
  - parses `Project Mode:` / `Project Stage:` from `.kord/rules/project-mode.md`

### What Went Wrong (Concrete Gap Report)

These are the specific mismatches between intent (plans) and shipped implementation (code):

1) Onboarding docs are quickstart-level, not methodology-level
- Evidence: `src/cli/project-layout.ts` currently produces guides that mostly say “run init/install, then /plan and /start-work”.
- Missing: phase model, decision gates, artifact outputs, negative paths, explicit verification commands.

2) The injected onboarding “truth source” (`project-mode.md`) is still generic
- Evidence: `src/cli/scaffolder.ts` `getProjectModeContent()` includes:
  - mode + stage + read-first
  - generic “For New Projects” / “For Existing Projects” paragraphs
- Missing (explicitly required by `docs/kord/plans/init-delivery.md`):
  - stage promotion checklists (agent-executable)
  - sunset clause (“once active/baselined, stop re-reading onboarding sections”)
  - explicit brownfield safety rails (baseline-first)

3) No auditable depth rubric exists
- Consequence: you cannot “check” whether future edits maintain depth; reviewers must eyeball prose.

4) No tests enforce depth/guardrails
- Evidence: `src/cli/scaffolder.test.ts` only asserts mode/stage/read-first strings exist.
- Missing: assertions for required headings, checklists, and size budgets.

5) Hidden breaking edge-case if `Project Mode:` becomes multi-word
- Evidence: `src/cli/status/index.ts:parseProjectModeFile()` currently matches `Project Mode:\s*(\S+)`.
- If we ever output `Project Mode: New Project`, status would show `New` only.

6) Templates/checklists/standards were implemented but not quality-audited against Synkra depth
- Evidence: Kord scaffolds many artifacts from `src/cli/project-layout.ts`, but there is no depth rubric for templates/checklists, and no tests enforcing “framework-grade” content.
- Missing: a parity matrix (Synkra vs Kord), quality rubric, and test-enforced headings/sentinels.

7) Mode-specific analysis playbooks exist (partially) but are not made explicit in onboarding
- Evidence: Kord has brownfield-oriented skills like `document-project` and `create-brownfield-story`, but onboarding does not route agents to a mode-appropriate analysis sequence.
- Evidence: Some skills still contain legacy/TODO content or references that do not match Kord’s structure (quality issue, not presence issue).

---

## Work Objectives

### Core Objective

Ship a Synkra-depth methodology pack (guides + injected rules + templates + checklists + standards + mode-relevant skills) that is **deep, structured, and test-enforced**, while keeping injected rules minimal.

### Definition of Done

- `bun test` passes.
- Scaffolder tests prove that each mode scaffolds:
  - required onboarding sections
  - stage gates + sunset clause in `.kord/rules/project-mode.md`
  - rubric files exist
  - injected file size stays within budget
 - The methodology pack quality rubric is satisfied for templates/checklists/standards/mode-skills (enforced by tests/grep).

### Must NOT Have (Guardrails)

- Do NOT add a YAML workflow engine or any “automation runner”.
- Do NOT copy Synkra docs verbatim; adapt concepts to Kord and keep licensing clean.
- Do NOT bloat `.kord/rules/project-mode.md` (it is injected).
- Do NOT introduce non-English content.
 - Do NOT “water down” depth: preserve Synkra-level methodological density, adapting only Kord-specific structure and constraints.

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES (`bun test`)
- **Automated tests**: YES (TDD style: add failing assertions first)
- **Framework**: Bun test

### Agent-Executed QA Scenarios (MANDATORY)

All verification must be agent-executable (no “human reads doc and decides”).

---

## Execution Strategy

Wave 1:
- Task 1 (rubric + required structure)
- Task 2 (tests that fail on current content)

Wave 2 (after Wave 1):
- Task 3 (rewrite New Project guide)
- Task 4 (rewrite Existing Project guide)
- Task 5 (upgrade project-mode.md injection + keep budget)
- Task 6 (status parser hardening if needed)

Wave 3 (after Wave 2):
- Task 7 (Synkra parity audit report)
- Task 8 (quality rubric + template upgrades)
- Task 9 (checklist upgrades)
- Task 10 (standards upgrades)
- Task 11 (mode-specific analysis skills: audit + fix + make explicit)
- Task 12 (upgrade scaffolded `.kord/**/AGENTS.md` to route to the framework)
- Task 13 (audit + upgrade methodology agent prompts: SM/PM/PO/QA)

Critical Path: 1 → 2 → (3,4,5) → 6 → (7,8,9,10,11,12,13)

---

## TODOs

- [ ] 1. Define the “Onboarding Depth Rubric” (auditable standard)

  **What to do (TDD)**:
  - Add a new scaffolded file under `.kord/standards/`:
    - `.kord/standards/onboarding-depth-rubric.md`
  - Rubric must be checkable by tooling (stable headings + checkboxes), and must include at minimum:
    - Required sections for each guide (New + Existing)
    - Required sections for `.kord/rules/project-mode.md`
    - “depth markers”: phases, gates, artifacts, verification commands, negative paths
    - size budgets for injected files

  **Must NOT do**:
  - No stack-specific commands as requirements (keep language/tooling examples, but rubric stays generic)

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`course-curriculum-design`]
    - Use it as a structured rubric writer, not for course content

  **References**:
  - `src/cli/project-layout.ts` (where scaffolded standards live)
  - Synkra depth exemplars:
    - `D:\\dev\\synkra-aios\\docs\\guides\\workflows\\GREENFIELD-FULLSTACK-WORKFLOW.md`
    - `D:\\dev\\synkra-aios\\docs\\guides\\workflows\\BROWNFIELD-DISCOVERY-WORKFLOW.md`
    - `D:\\dev\\synkra-aios\\.aios-core\\working-in-the-brownfield.md`

  **Acceptance Criteria**:
  - [ ] Scaffolder creates `.kord/standards/onboarding-depth-rubric.md`
  - [ ] Rubric contains stable headings: `## Required Sections`, `## Depth Markers`, `## Size Budgets`, `## Verification`

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Rubric file is scaffolded
    Tool: Bash
    Steps:
      1. Run: bun test src/cli/scaffolder.test.ts
      2. Assert: tests include rubric presence checks
    Expected Result: rubric scaffolding is test-enforced
  ```

- [ ] 2. Add failing tests that codify “depth” (locks the standard)

  **What to do (TDD)**:
  - Extend `src/cli/scaffolder.test.ts` to assert:
    - `.kord/guides/new-project.md` contains all required headings:
      - `## Who This Is For`
      - `## When Not To Use This`
      - `## Phases`
      - `## Gates`
      - `## Artifacts (Outputs)`
      - `## Verification Commands`
      - `## Failure Modes`
    - `.kord/guides/existing-project.md` contains all required headings:
      - `## Safety First`
      - `## Discovery Options`
      - `## Baseline Gates`
      - `## Artifacts (Outputs)`
      - `## Verification Commands`
      - `## What Not To Do`
    - `.kord/rules/project-mode.md` contains:
      - `Project Mode:`
      - `Project Stage:`
      - `Read-first:`
      - `## Stage Gates`
      - `## Sunset Clause`
    - `.kord/rules/project-mode.md` size stays <= 2048 bytes (budget can be tuned, but must exist)
    - New vs Existing are meaningfully distinct (guard against copy-paste):
      - new guide contains `First Story Gate`
      - existing guide contains `rollback`
  - Ensure tests fail against current content before updating content.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]

  **References**:
  - `src/cli/scaffolder.test.ts` (existing assertions already present)
  - `src/cli/scaffolder.ts:getProjectModeContent()` (source of injected rule text)
  - `src/cli/project-layout.ts:KORD_GUIDE_NEW_PROJECT_CONTENT` / `KORD_GUIDE_EXISTING_PROJECT_CONTENT`

  **Acceptance Criteria**:
  - [ ] Running `bun test src/cli/scaffolder.test.ts` fails before content updates
  - [ ] After content updates, `bun test src/cli/scaffolder.test.ts` passes

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Depth standard is enforced by tests
    Tool: Bash
    Steps:
      1. Run: bun test src/cli/scaffolder.test.ts
      2. Assert: exit code 0
    Expected Result: depth requirements are machine-enforced
  ```

- [ ] 3. Rewrite `.kord/guides/new-project.md` to “Synkra-level depth (adapted)”

  **What to do**:
  - Update `src/cli/project-layout.ts:KORD_GUIDE_NEW_PROJECT_CONTENT` to include:
    - `## Who This Is For` / `## When Not To Use This`
    - `## Phases` (bootstrap → discovery/planning → architecture → story cycle)
    - `## Gates` (Planning Gate, Architecture Gate, First Story Gate)
    - `## Artifacts (Outputs)` with explicit file paths (templates under `.kord/templates/`, docs under `docs/kord/*`)
    - `## Verification Commands` (agent-executable; examples using `bun test`, `bun run build`)
    - `## Failure Modes` (common pitfalls + recovery)
  - Keep examples Kord-native:
    - `/plan` produces plan in `docs/kord/plans/*`
    - `/start-work` executes

  **Must NOT do**:
  - Do not require GitHub creation, cloud setup, or external tooling as mandatory steps

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`course-content-creation`]

  **References**:
  - `src/cli/project-layout.ts` (string constant)
  - `docs/kord/plans/methodology-content.md` (intended methodology artifacts and lifecycle)

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/scaffolder.test.ts` → PASS

- [ ] 4. Rewrite `.kord/guides/existing-project.md` to “brownfield baseline-first”

  **What to do**:
  - Update `src/cli/project-layout.ts:KORD_GUIDE_EXISTING_PROJECT_CONTENT` to include:
    - `## Safety First` section (behavior preservation, rollback plan, scope containment)
    - `## Discovery Options`:
      - PRD-first (recommended for large change)
      - Document-first (recommended when unfamiliar)
    - `## Baseline Gates`:
      - tests/build baseline
      - dependency + tooling baseline
      - minimal reproduction for critical flows
    - `## Artifacts (Outputs)` and `## Verification Commands`
    - `## What Not To Do` (avoid refactors before baseline)

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`mentorship-program-design`]
    - Use it as “safety rails + step sequence” writer

  **References**:
  - Synkra brownfield framing for approach options:
    - `D:\\dev\\synkra-aios\\.aios-core\\working-in-the-brownfield.md`
  - `src/cli/project-layout.ts` (current shallow doc)

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/scaffolder.test.ts` → PASS

- [ ] 5. Upgrade `.kord/rules/project-mode.md` to be high-signal + stage-gated

  **What to do**:
  - Update `src/cli/scaffolder.ts:getProjectModeContent()` to:
    - keep the header fields parseable (avoid spaces in the captured value unless parser updated)
    - include `## Stage Gates` with short, checkable lists:
      - New project: what makes `NEW_SETUP -> NEW_ACTIVE`
      - Existing project: what makes `EXISTING_UNASSESSED -> EXISTING_BASELINED`
    - include `## Sunset Clause` (when to stop reading onboarding sections)
    - link to `.kord/guides/*` and rubric file
  - Enforce size budget via tests (Task 2).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]

  **References**:
  - `docs/kord/plans/init-delivery.md` (stages + sunset clause intent)
  - `src/cli/scaffolder.ts` (source)
  - `src/cli/status/index.ts` (parser constraints)

  **Acceptance Criteria**:
  - [ ] `.kord/rules/project-mode.md` includes stage gates and sunset clause
  - [ ] `.kord/rules/project-mode.md` size <= 2048 bytes (or updated threshold) enforced in tests

- [ ] 6. Harden `kord-aios status` parsing (only if needed)

  **What to do**:
  - If `Project Mode:` or `Project Stage:` output becomes multi-word, update `src/cli/status/index.ts:parseProjectModeFile()` to capture the full line (trimmed), not just `\S+`.
  - Add/adjust tests as needed to prevent regression.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]

  **References**:
  - `src/cli/status/index.ts:parseProjectModeFile()`

  **Acceptance Criteria**:
  - [ ] `bun test` → PASS

- [ ] 7. Create Synkra parity audit report (quality-first, framework-level)

  **What to do**:
  - Create: `docs/kord/research/synkra-methodology-parity-audit.md`
  - Report must include:
    - A parity table for: Guides, Injected Rules, Templates, Checklists, Standards, Skills
    - For each row: Synkra depth markers (phases/gates/artifacts/verification), current Kord state, gap, and upgrade target
    - A “Kord-specific constraints” section (plugin reality + injection budget)
    - A “Do not copy verbatim” note + how to preserve depth by structure and content density
  - Prefer adding upstream Synkra URLs in the report for portability; local `D:\\dev\\synkra-aios` paths are acceptable as supplemental evidence.

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`course-market-research`]

  **References**:
  - Kord scaffold sources: `src/cli/project-layout.ts`, `src/cli/scaffolder.ts`
  - Prior plans: `docs/kord/plans/init-delivery.md`, `docs/kord/plans/methodology-content.md`
  - Synkra exemplars (depth targets):
    - `D:\\dev\\synkra-aios\\docs\\guides\\workflows\\GREENFIELD-FULLSTACK-WORKFLOW.md`
    - `D:\\dev\\synkra-aios\\docs\\guides\\workflows\\BROWNFIELD-DISCOVERY-WORKFLOW.md`
    - `D:\\dev\\synkra-aios\\.aios-core\\working-in-the-brownfield.md`

  **Acceptance Criteria**:
  - [ ] `docs/kord/research/synkra-methodology-parity-audit.md` exists
  - [ ] Contains parity table with the 6 categories listed above
  - [ ] Contains “Kord-specific constraints” section

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Parity audit report exists
    Tool: Bash
    Steps:
      1. Run: test -f docs/kord/research/synkra-methodology-parity-audit.md
      2. Assert: exit code 0
    Expected Result: audit report exists
  ```

- [ ] 8. Add methodology artifacts quality rubric + enforce it with tests

  **What to do (TDD)**:
  - Add a scaffolded file:
    - `.kord/standards/methodology-artifacts-quality-rubric.md`
  - Rubric must define required headings/sentinels for:
    - templates: story/prd/epic/adr/task/qa-gate/qa-report
    - checklists: story-draft/story-dod/pr-review/architect/pre-push/self-critique/agent-quality-gate
    - standards: quality-gates/decision-heuristics
    - mode-relevant skills: at least `document-project`, `setup-project-docs`, `create-brownfield-story`
  - Extend `src/cli/scaffolder.test.ts` to assert rubric-required headings exist in scaffold outputs.

  **Must NOT do**:
  - Do not require manual reading (“looks good”). Tests must verify structure.

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`course-curriculum-design`]

  **References**:
  - `src/cli/project-layout.ts` (templates/checklists/standards source)
  - `src/cli/scaffolder.test.ts` (enforcement)

  **Acceptance Criteria**:
  - [ ] `.kord/standards/methodology-artifacts-quality-rubric.md` is scaffolded
  - [ ] `bun test src/cli/scaffolder.test.ts` → PASS

- [ ] 9. Upgrade templates to Synkra-level depth (adapt Kord structure only)

  **What to do (TDD)**:
  - Upgrade template contents in `src/cli/project-layout.ts` for:
    - `STORY_TEMPLATE_CONTENT`, `PRD_TEMPLATE_CONTENT`, `EPIC_TEMPLATE_CONTENT`, `ADR_TEMPLATE_CONTENT`, `TASK_TEMPLATE_CONTENT`, `QA_GATE_TEMPLATE_CONTENT`, `QA_REPORT_TEMPLATE_CONTENT`
  - Each template must include (as stable headings):
    - `## Purpose`, `## Scope`, `## Inputs`, `## Output`, `## Acceptance Criteria`, `## Verification`, `## Failure Modes`
  - Enforce via tests (Task 8).

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`course-content-creation`]

  **References**:
  - `src/cli/project-layout.ts`
  - Synkra depth exemplars (structure level):
    - `D:\\dev\\synkra-aios\\docs\\guides\\workflows\\GREENFIELD-FULLSTACK-WORKFLOW.md`

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/scaffolder.test.ts` → PASS

- [ ] 10. Upgrade checklist templates to be objective and agent-verifiable

  **What to do (TDD)**:
  - Upgrade checklist contents in `src/cli/project-layout.ts` so they:
    - avoid vague checks
    - include at least 1 negative/failure condition per checklist
    - include an “Evidence” section when relevant (paths/commands)
  - Enforce structure via tests (Task 8).

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`mentorship-program-design`]

  **References**:
  - `src/cli/project-layout.ts`

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/scaffolder.test.ts` → PASS

- [ ] 11. Audit + fix mode-specific analysis skills (quality + Kord alignment)

  **What to do (TDD)**:
  - Audit these skills for Kord alignment and remove legacy/TODO/foreign-framework references:
    - `src/features/builtin-skills/skills/kord-aios/documentation/document-project/SKILL.md`
    - `src/features/builtin-skills/skills/kord-aios/documentation/generate-shock-report/SKILL.md`
    - `src/features/builtin-skills/skills/kord-aios/documentation/setup-project-docs/SKILL.md`
    - `src/features/builtin-skills/skills/kord-aios/story/create-brownfield-story/SKILL.md`
  - Ensure skills:
    - reference Kord’s real directories (`.kord/`, `.opencode/`, `docs/kord/`)
    - do not reference non-existent configs/scripts (e.g., `core-config.yaml`, “documentation-integrity”)
    - provide a mode-appropriate analysis sequence (greenfield kickoff vs brownfield baseline)
  - Update `.kord/guides/new-project.md`, `.kord/guides/existing-project.md`, and `.kord/rules/project-mode.md` to include a `## Recommended Skills` section.
  - Add grep-based tests or test assertions that forbid key legacy tokens in these skills (examples: `core-config.yaml`, `.aios-core`, `documentation-integrity`).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`git-master`]

  **References**:
  - Skill files above
  - `docs/kord/plans/methodology-content.md` (template/skill linkage intent)

  **Acceptance Criteria**:
  - [ ] `bun test` → PASS
  - [ ] Updated onboarding guides contain `## Recommended Skills`
  - [ ] New Project guide lists a greenfield kickoff skill (default: `setup-project-docs`) and the first planning/story skills
  - [ ] Existing Project guide lists a brownfield baseline sequence (default: `document-project` + optional `generate-shock-report`) and brownfield story creation (`create-brownfield-story`)

- [ ] 12. Upgrade scaffolded `.kord/**/AGENTS.md` to be framework-grade

  **What to do (TDD)**:
  - Upgrade scaffolded AGENTS docs (sources in `src/cli/project-layout.ts`) to:
    - explain what each artifact is for (in 3-6 concrete bullets)
    - route readers/agents to the correct rubric(s)
    - include “when to read” guidance and sunset rules
  - Files include:
    - `.kord/AGENTS.md`
    - `.kord/standards/AGENTS.md`
    - `.kord/guides/AGENTS.md`
  - Enforce via `src/cli/scaffolder.test.ts` (presence of stable headings and pointers).

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`course-curriculum-design`]

  **References**:
  - `src/cli/project-layout.ts` (`KORD_ROOT_AGENTS_CONTENT`, `KORD_STANDARDS_AGENTS_CONTENT`, `KORD_GUIDES_AGENTS_CONTENT`)
  - `.kord/standards/onboarding-depth-rubric.md` (from Task 1)
  - `.kord/standards/methodology-artifacts-quality-rubric.md` (from Task 8)

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/scaffolder.test.ts` → PASS

- [ ] 13. Audit + upgrade core methodology agent prompts (SM/PM/PO/QA) for framework quality

  **What to do (TDD)**:
  - Audit these files for:
    - Synkra-level methodological depth (phases, gates, outputs, verification expectations)
    - Alignment to Kord structure (`.kord/`, `.opencode/`, `docs/kord/`)
    - Removal of legacy/foreign-framework references
    - Correct pointers to templates and the two rubrics from Tasks 1 and 8
  - Files:
    - `src/features/builtin-agents/sm.md`
    - `src/features/builtin-agents/pm.md`
    - `src/features/builtin-agents/po.md`
    - `src/features/builtin-agents/qa.md`
  - Add grep-based QA scenarios (or existing tests) ensuring required sentinel lines exist (e.g., references to `.kord/templates/` and rubric paths).

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`git-master`]

  **References**:
  - `docs/kord/plans/methodology-content.md` (original intent for these prompts)
  - The four builtin agent prompt files above

  **Acceptance Criteria**:
  - [ ] `bun run build` → PASS
  - [ ] `bun test` → PASS

---

## Success Criteria

### Verification Commands

```bash
bun test src/cli/scaffolder.test.ts
bun test
```

### Final Checklist

- [ ] New vs Existing onboarding guides have phases, gates, artifacts, verification, and failure modes
- [ ] `.kord/rules/project-mode.md` is stage-gated, sunsetted, and size-bounded
- [ ] Depth standard is codified in `.kord/standards/onboarding-depth-rubric.md`
- [ ] Methodology artifacts quality rubric is codified in `.kord/standards/methodology-artifacts-quality-rubric.md`
- [ ] Parity audit exists: `docs/kord/research/synkra-methodology-parity-audit.md`
- [ ] Templates/checklists/standards/mode-skills meet rubric (test-enforced; no manual review needed)
- [ ] `.kord/**/AGENTS.md` routes agents to the correct rubrics and is test-enforced
- [ ] SM/PM/PO/QA prompts are Synkra-depth and point to Kord templates/rubrics (build + tests pass)
