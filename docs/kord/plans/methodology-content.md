# Methodology Content — Plan 1 of 3

## TL;DR

> **Quick Summary**: Full methodology pipeline — create templates (PRD, epic, task, QA gate, QA report, 6 checklists), add `template:` frontmatter to skill loader, enrich flagship skills with real methodology content (create-story, validate-story, qa-gate, dev-develop-story), build a deterministic `checklist_runner` tool, encode story-development-cycle workflow knowledge into agent prompts and Build hook, update planner elicitation, and refactor kord.ts with native methodology rules.
>
> **Deliverables**:
> - 8 new/updated methodology templates + 3 additional checklists as constants in `project-layout.ts`
> - `template:` frontmatter field support in skill loader
> - Updated scaffolder to scaffold new templates to `.kord/templates/`
> - Planner interview elicitation question for story-driven artifacts
> - Complexity gating replaced with elicitation-result gating in plan generation
> - SM, PM, PO, QA agent prompts updated with template refs + workflow role awareness
> - 12+ story/product skills updated with `template:` frontmatter
> - 4 flagship skills enriched with real methodology content (adapted from Synkra tasks)
> - `checklist_runner` tool for deterministic artifact validation (`src/tools/checklist-runner/`)
> - Build hook enriched with story-development-cycle flow and story lifecycle awareness
> - kord.ts refactored to `src/agents/kord/` directory with modular rules
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 6 waves
> **Critical Path**: Task 1 → Task 5 → Task 8 → Task 10 → Task 11 → Task 12

---

## Context

### Original Request

The user identified that Kord AIOS's methodology layer is non-functional: only 2 templates exist (story, ADR), the planner's artifact swarm is gated by complexity (Simple tasks never generate artifacts), 144 skills reference non-existent templates, and the methodology agents (SM, PM, PO, QA) have no template references. The full pipeline (PRD → Epic → Story → QA Gate) exists only as agent prompt descriptions but lacks the actual content and trigger mechanism.

### Interview Summary

**Key Discussions**:
- Templates: Adapt from Synkra AIOS (946-file framework) to MD+YAML frontmatter format — NOT wholesale port, curated methodology subset only
- Execution model: Stories as default execution unit with opt-out for speed
- Trigger: Planner elicitation question at end of interview, NOT keyword detector
- kord-rules: Native in plugin at `src/agents/kord/` as modular files, NOT exported as kord-rules.md
- Agent-template binding: Via skills — extend SKILL.md frontmatter with `template:` field
- Constitution gates: NOT porting from Synkra
- Plan order: methodology-content (this) → init-delivery (Plan 2) → squad-polish (Plan 3)

**Research Findings**:
- Synkra templates analyzed: story (368L), PRD (202L), QA gate (240L), QA report (234L), task (123L), epic (532L), 18 checklists
- Kord has `parseFrontmatter()` in `src/shared/frontmatter.ts` — already used by skill loader
- Kord-aios-loader.ts (129 lines) parses SKILL.md frontmatter — easy to extend with `template:` field
- Planner prompt is in TypeScript string constants (interview-mode.ts, plan-generation.ts) — changes are prompt text edits
- SM/PM/PO/QA are `.md` files in `src/features/builtin-agents/` — loaded at build time

### Plan Analyzer Self-Review

**Identified Gaps (addressed in plan)**:
- Template content creation is the largest task — broken into clear sections with Synkra references
- Skill loader `template:` field needs type changes in TWO places: `BuiltinSkill` interface AND kord-aios-loader parser
- The planner prompt changes span two files (interview-mode.ts + plan-generation.ts) but are logically one change
- kord.ts refactor is 624 lines — needs careful extraction without breaking dynamic-agent-prompt-builder imports

---

## Decision Points (All Resolved)

- [x] Decision: Template format
  - Final decision: MD with YAML frontmatter
  - Rationale: LLMs write MD better than YAML; Kord already has `parseFrontmatter()`

- [x] Decision: Execution model
  - Final decision: Stories as default, opt-out for speed
  - Rationale: Traceability is valuable; power users know when to skip

- [x] Decision: Artifact trigger mechanism
  - Final decision: Planner elicitation question at end of interview
  - Rationale: Natural question in existing flow; no keyword-detector complexity

- [x] Decision: kord-rules location
  - Final decision: Native in plugin at `src/agents/kord/` directory
  - Rationale: Follow planner's modular pattern; rules are agent behavior, not project config

- [x] Decision: Agent-template binding
  - Final decision: Via skills using `template:` frontmatter field
  - Rationale: Synkra tasks = Kord skills; minimal infrastructure change

- [x] Decision: Constitution gates
  - Final decision: NOT porting
  - Rationale: Rules live in agent prompts and skills; no new enforcement system

- [x] Decision: Content scope
  - Final decision: Curated subset — 8 templates + 3 checklists
  - Rationale: Cover the core pipeline (PRD→Epic→Story→QA) without bloat

- [x] Decision: Complexity gating
  - Final decision: Replace with elicitation result
  - Rationale: Current gating prevents artifacts from ever being generated for most tasks

---

## Work Objectives

### Core Objective
Make Kord AIOS's methodology pipeline fully functional: create templates, enrich flagship skills with real methodology content, add deterministic validation tooling (checklist runner), encode the story-development-cycle workflow knowledge into agents and orchestration, fix triggers (planner elicitation), and wire references across the system.

### Concrete Deliverables
- 11 template constants in `src/cli/project-layout.ts` (8 original + 3 new checklists)
- `template:` field in `BuiltinSkill` interface and kord-aios-loader parser
- Updated `scaffolder.ts` with new template entries
- Planner elicitation question in `interview-mode.ts`
- Elicitation-based gating in `plan-generation.ts` (replacing complexity gating)
- Updated SM, PM, PO, QA agent prompts with template refs + workflow role awareness + story lifecycle
- Updated story/product SKILL.md files with `template:` frontmatter
- 4 flagship skills enriched with real methodology content (create-next-story, validate-next-story, qa-gate, dev-develop-story equivalent)
- `checklist_runner` tool at `src/tools/checklist-runner/` for deterministic artifact validation
- Build hook prompt enriched with story-development-cycle flow knowledge
- `src/agents/kord/` directory with modular prompt files including methodology rules

### Definition of Done
- [ ] `bun run build` succeeds with zero errors
- [ ] `bun test` passes with zero failures (3193+ tests)
- [ ] All 11 template constants export valid MD+frontmatter content
- [ ] `template:` field parsed correctly by skill loader (verified by test)
- [ ] Scaffolder creates all new templates (verified by test)
- [ ] Planner prompt includes elicitation question (verified by build)
- [ ] Agent prompts reference template paths AND include workflow role (verified by grep)
- [ ] 4 flagship skills have >100 lines of real methodology content each
- [ ] `checklist_runner` tool passes tests with pass/fail/partial/unknown cases
- [ ] Build hook prompt includes SM→PO→Dev→QA flow description (verified by grep)
- [ ] Story status transitions (DRAFT→READY→IN_PROGRESS→REVIEW→DONE) documented in agent prompts

### Must Have
- Story template enhanced with richer structure (sections from Synkra)
- PRD, Epic, Task, QA Gate, QA Report templates created
- 6 checklists (story-draft, story-dod, pr-review, architect, pre-push, self-critique)
- `template:` field in skill frontmatter schema
- Planner elicitation question for artifact generation
- Complexity gating replaced with elicitation-based gating
- All methodology agent prompts reference template paths
- 4 flagship skills enriched with real methodology content
- `checklist_runner` tool with deterministic validation
- Build hook prompt includes story-development-cycle flow
- Story lifecycle state machine in agent prompts (who transitions what)

### Must NOT Have (Guardrails)
- Do NOT port Synkra's 946 files wholesale — curate subset only
- Do NOT create kord-rules.md as an exported file — rules go native in plugin
- Do NOT use YAML-only templates — use MD with YAML frontmatter
- Do NOT add keyword-detector triggers — use planner elicitation only
- Do NOT port constitutional gates — no blocking/enforcement system
- Do NOT build a YAML workflow engine — encode workflow knowledge in prompts/skills
- Do NOT modify `src/shared/deep-merge.ts`
- Do NOT change model defaults in `src/shared/model-requirements.ts`
- Do NOT modify init command behavior (that's Plan 2)
- Do NOT modify squad loading (that's Plan 3)
- Do NOT add `as any`, `@ts-ignore`, or `@ts-expect-error`
- Do NOT write implementation before tests (TDD mandatory)
- Do NOT make Build hook code story-status-aware (defer code changes — encode knowledge in prompts first)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks are verified by running `bun test` and `bun run build`.

### Test Decision
- **Infrastructure exists**: YES (bun test, 3193+ test files)
- **Automated tests**: TDD (RED-GREEN-REFACTOR)
- **Framework**: bun test

### Agent-Executed QA Scenarios (ALL tasks)

Verification for all tasks uses:

| Type | Tool | How Agent Verifies |
|------|------|--------------------|
| **Unit tests** | Bash (`bun test`) | Run specific test file → assert PASS |
| **Build** | Bash (`bun run build`) | Build project → assert zero errors |
| **Content** | Bash (`bun test`) + Read | Verify template constants have correct structure |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — all independent):
├── Task 1: Create methodology templates in project-layout.ts (incl. 3 new checklists)
├── Task 2: Add template: frontmatter to skill loader
└── Task 4: Planner elicitation + replace complexity gating

Wave 2 (After Wave 1):
├── Task 3: Update scaffolder for new templates [depends: 1]
├── Task 5: Update SM/PM/PO/QA agent prompts with template refs + workflow roles [depends: 1]
└── Task 6: Update skills with template: frontmatter [depends: 2]

Wave 3 (After Wave 2 — content enrichment):
├── Task 8: Enrich flagship skills with real methodology content [depends: 5, 6]
└── Task 9: Create checklist_runner tool [depends: 1]

Wave 4 (After Wave 3):
├── Task 10: Encode workflow knowledge in Build hook prompt [depends: 8]
└── Task 7: Refactor kord.ts to src/agents/kord/ directory [depends: 5, 6]

Wave 5 (After Wave 4):
└── Task 11: AGENTS.md updates + build + full test verification [depends: all]

Wave 6 (Final):
└── Task 12: Plan 2/3 continuity notes [depends: 11]

Critical Path: Task 1 → Task 3 → Task 8 → Task 10 → Task 11
Parallel Speedup: ~45% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 5, 8, 9 | 2, 4 |
| 2 | None | 6 | 1, 4 |
| 3 | 1 | 11 | 5, 6 |
| 4 | None | 11 | 1, 2 |
| 5 | 1 | 8, 7, 11 | 3, 6 |
| 6 | 2 | 8, 7, 11 | 3, 5 |
| 7 | 5, 6 | 11 | 10 |
| 8 | 5, 6 | 10, 11 | 9 |
| 9 | 1 | 11 | 8 |
| 10 | 8 | 11 | 7 |
| 11 | All (1-10) | 12 | None |
| 12 | 11 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 4 | task(category="unspecified-high", ...) |
| 2 | 3, 5, 6 | task(category="quick", ...) |
| 3 | 8, 9 | task(category="unspecified-high", ...) |
| 4 | 10, 7 | task(category="unspecified-high", ...) |
| 5 | 11 | task(category="quick", ...) |
| 6 | 12 | task(category="writing", ...) |

---

## TODOs

- [x] 1. Create methodology templates in project-layout.ts

  **What to do**:
  - Read Synkra source templates for reference content (paths below)
  - Update the existing `STORY_TEMPLATE_CONTENT` constant with a richer structure adapted from Synkra's story-tmpl.yaml. Add sections: Description, Acceptance Criteria, Technical Notes (with file refs, patterns), Dependencies, Definition of Done, Dev Record, QA section. Keep MD+YAML frontmatter format.
  - Create NEW template constants (all as `export const` in project-layout.ts):
    - `PRD_TEMPLATE_CONTENT` — Adapt from Synkra's prd-tmpl.yaml. Sections: Problem Statement, Target Users, Goals & Success Metrics, Functional Requirements (must-have/should-have/nice-to-have), Non-Requirements (explicit scope exclusions), Constraints, Risks & Mitigations, Epic Breakdown.
    - `EPIC_TEMPLATE_CONTENT` — Adapt from Synkra's brownfield-create-epic. Sections: Title, Description, Scope (in/out), Stories list, Wave Plan, Dependencies, Success Criteria.
    - `TASK_TEMPLATE_CONTENT` — Adapt from Synkra's task-template.md. Sections: What, Why, How (technical approach), Acceptance Criteria, Files to Modify, Dependencies.
    - `QA_GATE_TEMPLATE_CONTENT` — Adapt from Synkra's qa-gate-tmpl.yaml. Sections: Gate Criteria, Test Results (unit/integration/e2e), Code Quality Check, Verdict (PASS/FAIL/CONDITIONAL).
    - `QA_REPORT_TEMPLATE_CONTENT` — Adapt from Synkra's qa-report-tmpl.md. Sections: Summary, Findings (severity-rated), Risk Assessment, Recommendations, Test Coverage.
    - `CHECKLIST_STORY_DRAFT_CONTENT` — Checklist for creating well-formed stories. Items: has acceptance criteria, has technical notes, has dependencies listed, has file references, scope is single deliverable.
    - `CHECKLIST_STORY_DOD_CONTENT` — Definition of Done checklist. Items: code implemented, tests passing, no regressions, PR reviewed, documentation updated.
    - `CHECKLIST_PR_REVIEW_CONTENT` — PR review checklist. Items: code compiles, tests pass, no AI comment bloat, no `as any`, follows codebase patterns.
  - All templates MUST use MD with YAML frontmatter format:
    ```
    ---
    title: "{TITLE}"
    type: prd|epic|task|story|qa-gate|qa-report|checklist
    status: draft
    created: "{DATE}"
    ---
    ```
  - Write a test file `src/cli/project-layout.test.ts` that verifies:
    - All template constants are defined and non-empty
    - All templates contain valid YAML frontmatter (use parseFrontmatter from shared)
    - All templates have required frontmatter fields: `title`, `type`, `status`
    - Each template type matches expected type value

  **Must NOT do**:
  - Do NOT copy Synkra templates verbatim — adapt structure and content to Kord's context
  - Do NOT use YAML-only format — all templates must be MD+frontmatter
  - Do NOT use Portuguese or non-English content in templates
  - Do NOT make templates excessively long (>100 lines each) — keep them concise and fill-in-ready

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Content creation requiring careful adaptation from reference materials, multiple files to read and synthesize
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit at the end

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 4)
  - **Blocks**: Tasks 3, 5
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/cli/project-layout.ts:68-99` — Existing `STORY_TEMPLATE_CONTENT` constant pattern (MD+frontmatter format to follow)
  - `src/cli/project-layout.ts:101-135` — Existing `ADR_TEMPLATE_CONTENT` constant pattern (same export style)
  - `src/cli/project-layout.ts:38-66` — Existing `KORD_RULES_CONTENT` for multi-line template string format

  **API/Type References**:
  - `src/shared/frontmatter.ts` — `parseFrontmatter()` function used to validate frontmatter in tests

  **Synkra Source References** (content to ADAPT, not copy):
  - `D:\dev\synkra-aios\.aios-core\product\templates\story-tmpl.yaml` (368 lines) — Story structure, sections, status lifecycle
  - `D:\dev\synkra-aios\.aios-core\product\templates\prd-tmpl.yaml` (202 lines) — PRD structure, sections, elicitation fields
  - `D:\dev\synkra-aios\.aios-core\product\templates\qa-gate-tmpl.yaml` (240 lines) — QA gate criteria, verdict format
  - `D:\dev\synkra-aios\.aios-core\product\templates\qa-report-tmpl.md` (234 lines) — QA report structure, findings format
  - `D:\dev\synkra-aios\.aios-core\product\templates\task-template.md` (123 lines) — Task structure, acceptance criteria format
  - `D:\dev\synkra-aios\.aios-core\development\tasks\create-next-story.md` (774 lines) — Story creation workflow (epic breakdown reference)
  - `D:\dev\synkra-aios\.aios-core\product\checklists\` — Reference for checklist structure and items

  **WHY Each Reference Matters**:
  - `project-layout.ts:68-99`: Follow EXACT same pattern — exported const with template literal, MD+frontmatter
  - Synkra templates: Extract the STRUCTURE and SECTION NAMES, adapt content to Kord's context (English, MD format, plan-based workflow instead of constitutional gates)
  - `frontmatter.ts`: Used in test file to validate frontmatter parsing

  **Acceptance Criteria**:

  - [ ] All 8 new template constants exported from project-layout.ts
  - [ ] Updated STORY_TEMPLATE_CONTENT has richer structure (>50 lines, sections for Technical Notes, Dependencies, Dev Record)
  - [ ] All templates have valid YAML frontmatter with type, status, title fields
  - [ ] Test file `src/cli/project-layout.test.ts` created
  - [ ] `bun test src/cli/project-layout.test.ts` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: All template constants export valid frontmatter
    Tool: Bash (bun test)
    Preconditions: None
    Steps:
      1. Run: bun test src/cli/project-layout.test.ts
      2. Assert: All tests pass (0 failures)
      3. Assert: Test output includes tests for each template type
    Expected Result: All template constants validated
    Evidence: Test output captured

  Scenario: Build succeeds with new constants
    Tool: Bash (bun run build)
    Preconditions: Template constants added
    Steps:
      1. Run: bun run build
      2. Assert: Exit code 0
      3. Assert: No TypeScript errors
    Expected Result: Clean build
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(methodology): create methodology templates (PRD, epic, task, QA, checklists)`
  - Files: `src/cli/project-layout.ts`, `src/cli/project-layout.test.ts`
  - Pre-commit: `bun test src/cli/project-layout.test.ts`

---

- [x] 2. Add template: frontmatter support to skill loader

  **What to do**:
  - Add `template?: string` field to the `BuiltinSkill` interface in `src/features/builtin-skills/types.ts`
  - Add `template?: string` to the frontmatter type parameter in `parseKordAiosSkill()` in `src/features/builtin-skills/kord-aios-loader.ts`
  - Pass the parsed `template` value through to the returned `BuiltinSkill` object
  - When `template` is present, inject a template reference line into the skill's wrapped template string:
    ```
    Template: Use the template at .kord/templates/{template} when creating this artifact.
    ```
    This line should be inserted inside the `<skill-instruction>` block, after the base directory line.
  - Add `template?: string` to `SkillMetadata` interface in `src/features/opencode-skill-loader/types.ts` (for consistency with user-loaded skills)
  - Write tests in `src/features/builtin-skills/kord-aios-loader.test.ts`:
    - Test: SKILL.md with `template: story.md` in frontmatter → BuiltinSkill has `template: "story.md"`
    - Test: SKILL.md without `template:` → BuiltinSkill has `template: undefined`
    - Test: Template reference line appears in the wrapped template string when `template` is set
    - Test: Template reference line does NOT appear when `template` is not set

  **Must NOT do**:
  - Do NOT modify the `parseFrontmatter()` function in `src/shared/frontmatter.ts` — it's generic
  - Do NOT add template validation (checking if file exists) — that's runtime, Plan 2 scope
  - Do NOT modify the opencode-skill-loader's `loader.ts` — only update its types.ts for consistency
  - Do NOT change existing skill loading behavior — this is additive only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, well-scoped change to 3 files (2 types files + 1 loader)
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 4)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/features/builtin-skills/kord-aios-loader.ts:18-51` — `parseKordAiosSkill()` function — add `template?` to the generic type parameter at line 19-27, and add `template: data.template` to the returned object at line 41-50
  - `src/features/builtin-skills/kord-aios-loader.ts:39` — Template string construction — inject template reference line after "File references (@path)" line
  - `src/features/builtin-skills/types.ts:1-16` — `BuiltinSkill` interface — add `template?: string` field

  **API/Type References**:
  - `src/features/builtin-skills/types.ts:3-16` — BuiltinSkill interface to extend
  - `src/features/opencode-skill-loader/types.ts:6-18` — SkillMetadata interface to extend for consistency
  - `src/shared/frontmatter.ts` — `parseFrontmatter<T>()` generic function — no changes needed, already supports arbitrary fields

  **Test References**:
  - `src/features/builtin-skills/kord-aios-loader.test.ts` — Existing loader tests — add new test cases following same patterns

  **WHY Each Reference Matters**:
  - `kord-aios-loader.ts:18-51`: This is the EXACT function to modify — add template to its type param and return object
  - `types.ts:3-16`: Interface definition that needs the new field
  - `kord-aios-loader.test.ts`: Follow existing test patterns for new test cases

  **Acceptance Criteria**:

  - [ ] `BuiltinSkill` interface has `template?: string` field
  - [ ] `SkillMetadata` interface has `template?: string` field
  - [ ] `parseKordAiosSkill()` parses `template:` from frontmatter
  - [ ] Template reference line injected into skill template when `template` is present
  - [ ] `bun test src/features/builtin-skills/kord-aios-loader.test.ts` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Skill loader parses template field
    Tool: Bash (bun test)
    Preconditions: None
    Steps:
      1. Run: bun test src/features/builtin-skills/kord-aios-loader.test.ts
      2. Assert: All tests pass including new template: field tests
    Expected Result: Template field correctly parsed and injected
    Evidence: Test output captured

  Scenario: Build succeeds with type changes
    Tool: Bash (bun run build)
    Preconditions: Type changes in both types.ts files
    Steps:
      1. Run: bun run build
      2. Assert: Exit code 0, no type errors
    Expected Result: Clean build with new optional field
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(skills): add template: frontmatter field to skill loader`
  - Files: `src/features/builtin-skills/types.ts`, `src/features/builtin-skills/kord-aios-loader.ts`, `src/features/builtin-skills/kord-aios-loader.test.ts`, `src/features/opencode-skill-loader/types.ts`
  - Pre-commit: `bun test src/features/builtin-skills/kord-aios-loader.test.ts`

---

- [x] 3. Update scaffolder to scaffold new templates

  **What to do**:
  - Import all new template constants from `project-layout.ts` in `scaffolder.ts`
  - Add new template entries to `getScaffoldEntries()` function for each new template:
    - `prd.md` → `PRD_TEMPLATE_CONTENT`
    - `epic.md` → `EPIC_TEMPLATE_CONTENT`
    - `task.md` → `TASK_TEMPLATE_CONTENT`
    - `qa-gate.md` → `QA_GATE_TEMPLATE_CONTENT`
    - `qa-report.md` → `QA_REPORT_TEMPLATE_CONTENT`
    - `checklist-story-draft.md` → `CHECKLIST_STORY_DRAFT_CONTENT`
    - `checklist-story-dod.md` → `CHECKLIST_STORY_DOD_CONTENT`
    - `checklist-pr-review.md` → `CHECKLIST_PR_REVIEW_CONTENT`
  - All new entries go into `.kord/templates/` (same location as existing story.md and adr.md)
  - Update existing test file `src/cli/scaffolder.test.ts`:
    - Add assertions for new template file creation
    - Verify all 10 template files are scaffolded (2 existing + 8 new)
    - Verify content matches expected constants

  **Must NOT do**:
  - Do NOT create a `checklists/` subdirectory — keep all templates flat in `.kord/templates/`
  - Do NOT modify the `scaffoldProject()` function logic — only add entries to `getScaffoldEntries()`
  - Do NOT modify the `isProjectScaffolded()` detection logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file edits — adding imports and array entries
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/cli/scaffolder.ts:1-11` — Existing imports from project-layout — add new constants to import list
  - `src/cli/scaffolder.ts:42-46` — Existing template entries pattern — follow EXACT same pattern for new templates
  - `src/cli/scaffolder.ts:32-52` — Full `getScaffoldEntries()` function — add new entries after line 46

  **Test References**:
  - `src/cli/scaffolder.test.ts` — Existing scaffolder tests — add assertions for new templates

  **WHY Each Reference Matters**:
  - `scaffolder.ts:42-46`: Copy this exact pattern (templatesDir path + push entry) for each new template
  - `scaffolder.test.ts`: Extend existing tests to verify new templates are created

  **Acceptance Criteria**:

  - [ ] All 8 new template constants imported in scaffolder.ts
  - [ ] `getScaffoldEntries()` returns entries for all 10 templates (2 existing + 8 new)
  - [ ] `bun test src/cli/scaffolder.test.ts` → PASS
  - [ ] `bun run build` → zero errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Scaffolder creates all template files
    Tool: Bash (bun test)
    Preconditions: Task 1 completed (templates exist in project-layout.ts)
    Steps:
      1. Run: bun test src/cli/scaffolder.test.ts
      2. Assert: All tests pass including new template assertions
    Expected Result: All 10 templates scaffolded correctly
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(scaffold): add methodology templates to project scaffolder`
  - Files: `src/cli/scaffolder.ts`, `src/cli/scaffolder.test.ts`
  - Pre-commit: `bun test src/cli/scaffolder.test.ts`

---

- [x] 4. Add planner elicitation + replace complexity gating

  **What to do**:

  **Part A — interview-mode.ts**: Add a methodology elicitation section to the planner interview. Near the end of the interview mode prompt (after the TEST INFRASTRUCTURE ASSESSMENT section), add a new section:

  ```
  ### METHODOLOGY ELICITATION (MANDATORY for Build/Refactor/Mid-sized/Architecture)

  **After test strategy is decided, ask the methodology question:**

  "Should this plan include story-driven artifacts?
  - YES (default): Planner will dispatch SM to create stories, PM for PRD if needed, PO for validation.
    Artifacts are saved to docs/kord/stories/, docs/kord/prds/, docs/kord/epics/.
  - NO: Plan will contain only TODOs (flat task list). Faster, no artifact generation.

  Templates available at .kord/templates/ (story.md, prd.md, epic.md, task.md, qa-gate.md, qa-report.md)."

  **Record decision in draft:**
  ## Methodology Decision
  - **Story-driven artifacts**: YES/NO
  - **If YES**: Which artifacts? (PRD, stories, QA gate — based on complexity)
  ```

  **Part B — plan-generation.ts**: Replace the complexity gating section (lines 97-99) with elicitation-result-based gating:

  Replace:
  ```
  ### Complexity Gating
  - **Trivial/Simple**: Skip both swarms. Go from Plan Analyzer directly to finalized plan.
  - **Medium/Complex**: Use the full two-pass flow (v0 then v1).
  ```

  With:
  ```
  ### Artifact Dispatch Gating (Elicitation-Based)

  Artifact dispatch is controlled by the user's methodology decision from the interview:

  - **User chose YES (story-driven)**: Run the full artifact swarm (Decision Research → Artifact Generation). Dispatch SM for stories, PM for PRD if user-facing scope, PO for validation. Always dispatch regardless of complexity classification.
  - **User chose NO (flat TODOs)**: Skip artifact swarm entirely. Generate plan with TODOs only, no SM/PM/PO dispatch.
  - **No elicitation done** (trivial tasks that skipped full interview): Default to NO (flat TODOs) for trivial, YES for everything else.
  ```

  **Must NOT do**:
  - Do NOT modify the Plan Analyzer consultation section
  - Do NOT modify the post-plan self-review section
  - Do NOT add a keyword-detector trigger — the elicitation question is the ONLY trigger
  - Do NOT change the interview mode's intent classification logic

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Prompt engineering in two related files, needs careful understanding of existing prompt structure
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 11
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/agents/planner/interview-mode.ts:1-80` — Interview mode prompt structure. The TEST INFRASTRUCTURE ASSESSMENT section is the pattern to follow for the new METHODOLOGY ELICITATION section. Find it by searching for "TEST INFRASTRUCTURE ASSESSMENT" in the file.
  - `src/agents/planner/plan-generation.ts:89-99` — Current complexity gating text to REPLACE. Lines 97-99 are the exact text to remove.
  - `src/agents/planner/plan-generation.ts:128-164` — Artifact Generation Swarm section — this stays, but now it's gated by elicitation result instead of complexity.

  **Documentation References**:
  - `docs/kord/drafts/framework-methodology-gaps.md:50-56` — Root cause analysis showing why complexity gating prevents artifact generation

  **WHY Each Reference Matters**:
  - `interview-mode.ts` TEST INFRASTRUCTURE section: Follow its structure (detect → ask → record) for the new methodology section
  - `plan-generation.ts:97-99`: EXACT text to replace — complexity gating lines
  - `plan-generation.ts:128-164`: Artifact swarm dispatch — no changes needed, but gating before it changes

  **Acceptance Criteria**:

  - [ ] interview-mode.ts contains METHODOLOGY ELICITATION section after TEST INFRASTRUCTURE ASSESSMENT
  - [ ] plan-generation.ts no longer mentions "Trivial/Simple: Skip both swarms"
  - [ ] plan-generation.ts contains "Artifact Dispatch Gating (Elicitation-Based)" section
  - [ ] `bun run build` → zero errors (TypeScript compilation of prompt strings)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Build succeeds with prompt changes
    Tool: Bash (bun run build)
    Preconditions: Both files modified
    Steps:
      1. Run: bun run build
      2. Assert: Exit code 0
      3. Assert: No TypeScript errors in planner files
    Expected Result: Prompt strings compile correctly
    Evidence: Build output captured

  Scenario: Verify elicitation text is present
    Tool: Bash (grep)
    Steps:
      1. grep "METHODOLOGY ELICITATION" src/agents/planner/interview-mode.ts
      2. Assert: Match found
      3. grep "Elicitation-Based" src/agents/planner/plan-generation.ts
      4. Assert: Match found
      5. grep "Trivial/Simple.*Skip both swarms" src/agents/planner/plan-generation.ts
      6. Assert: NO match (removed)
    Expected Result: Old gating removed, new elicitation present
    Evidence: Grep output captured
  ```

  **Commit**: YES
  - Message: `feat(planner): add methodology elicitation, replace complexity gating with elicitation-based dispatch`
  - Files: `src/agents/planner/interview-mode.ts`, `src/agents/planner/plan-generation.ts`
  - Pre-commit: `bun run build`

---

- [x] 5. Update SM/PM/PO/QA agent prompts with template references + workflow role awareness

  **What to do**:
  - Update `src/features/builtin-agents/sm.md`:
    - In the `<story_structure>` section, add: "Use the template at `.kord/templates/story.md` as the base structure for all stories."
    - Add template path reference: "Template: `.kord/templates/story.md`"
    - Add checklist references: "Use `.kord/templates/checklist-story-draft.md` for draft validation and `.kord/templates/checklist-story-dod.md` for Definition of Done."
    - Add workflow role section: "In the story-development-cycle, SM is Phase 1 (Story Creation). After creating a story with status DRAFT, PO validates it (Phase 2). If PO rejects, SM must fix and resubmit."
    - Add story lifecycle awareness: "Story statuses: DRAFT → READY → IN_PROGRESS → REVIEW → DONE. SM creates stories in DRAFT. Only PO can transition to READY."
  - Update `src/features/builtin-agents/pm.md`:
    - In the `<prd_structure>` section, add: "Use the template at `.kord/templates/prd.md` as the base structure for all PRDs."
    - Add epic template reference: "For epic breakdowns, use `.kord/templates/epic.md`."
    - Add workflow role: "PM creates PRDs and epic breakdowns BEFORE story creation. PM output feeds SM for story decomposition."
  - Update `src/features/builtin-agents/po.md`:
    - In the `<story_validation_checklist>` section, add: "Reference `.kord/templates/checklist-story-draft.md` for story quality criteria."
    - Add workflow role: "In the story-development-cycle, PO is Phase 2 (Story Validation). PO validates SM's stories against 10-point checklist. If validation passes, PO transitions story status from DRAFT to READY. If fails, returns to SM with specific feedback."
    - Add status transition authority: "PO is the ONLY agent that transitions stories from DRAFT → READY."
  - Update `src/features/builtin-agents/qa.md`:
    - Add QA template references: "Use `.kord/templates/qa-gate.md` for quality gate assessments and `.kord/templates/qa-report.md` for comprehensive reports."
    - Add workflow role: "In the story-development-cycle, QA is Phase 4 (QA Review). After Dev implements (Phase 3), QA runs quality gate. If gate passes, QA transitions story to DONE. If fails, returns to Dev with fix checklist."
    - Add status transition authority: "QA transitions stories from REVIEW → DONE (pass) or back to IN_PROGRESS (fail)."

  **Must NOT do**:
  - Do NOT change agent frontmatter (name, description, temperature, write_paths, tool_allowlist)
  - Do NOT change agent role descriptions or core principles
  - Do NOT add new tool permissions
  - Do NOT rewrite agent prompts — only ADD template reference + workflow role sections

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple text additions to 4 markdown files
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 6)
  - **Blocks**: Task 8, 7, 11
  - **Blocked By**: Task 1 (template names must be finalized)

  **References**:

  **Pattern References**:
  - `src/features/builtin-agents/sm.md:39-48` — `<story_structure>` section — add template ref after item 6
  - `src/features/builtin-agents/pm.md:40-51` — `<prd_structure>` section — add template ref after item 8
  - `src/features/builtin-agents/po.md:37-48` — `<story_validation_checklist>` section — add checklist ref
  - `src/features/builtin-agents/qa.md:49-76` — Quality check sections — add QA template refs

  **WHY Each Reference Matters**:
  - Each section is the natural place to ADD template references — agents already describe what they produce, now they also know WHERE the template is

  **Acceptance Criteria**:

  - [ ] sm.md references `.kord/templates/story.md` and checklist templates
  - [ ] pm.md references `.kord/templates/prd.md` and `.kord/templates/epic.md`
  - [ ] po.md references `.kord/templates/checklist-story-draft.md`
  - [ ] qa.md references `.kord/templates/qa-gate.md` and `.kord/templates/qa-report.md`
  - [ ] sm.md contains "Phase 1" and "story-development-cycle" workflow role text
  - [ ] po.md contains "Phase 2" and "DRAFT → READY" transition authority
  - [ ] qa.md contains "Phase 4" and "REVIEW → DONE" transition authority
  - [ ] All 4 agents mention story status lifecycle (DRAFT/READY/IN_PROGRESS/REVIEW/DONE)
  - [ ] `bun run build` → zero errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Agent prompts contain template references and workflow roles
    Tool: Bash (grep)
    Steps:
      1. grep "kord/templates/story.md" src/features/builtin-agents/sm.md → match
      2. grep "kord/templates/prd.md" src/features/builtin-agents/pm.md → match
      3. grep "kord/templates/checklist" src/features/builtin-agents/po.md → match
      4. grep "kord/templates/qa-gate.md" src/features/builtin-agents/qa.md → match
      5. grep "Phase 1" src/features/builtin-agents/sm.md → match
      6. grep "Phase 2" src/features/builtin-agents/po.md → match
      7. grep "Phase 4" src/features/builtin-agents/qa.md → match
      8. grep "DRAFT" src/features/builtin-agents/sm.md → match
      9. grep "DONE" src/features/builtin-agents/qa.md → match
    Expected Result: All 4 agent prompts reference templates AND workflow roles
    Evidence: Grep output captured
  ```

  **Commit**: YES
  - Message: `feat(agents): add template references and workflow role awareness to SM/PM/PO/QA`
  - Files: `src/features/builtin-agents/sm.md`, `src/features/builtin-agents/pm.md`, `src/features/builtin-agents/po.md`, `src/features/builtin-agents/qa.md`
  - Pre-commit: `bun run build`

---

- [x] 6. Update skills with template: frontmatter

  **What to do**:
  - Add `template:` field to SKILL.md frontmatter for all skills that produce methodology artifacts:

  **Story domain** (`src/features/builtin-skills/skills/kord-aios/story/`):
  - `create-next-story/SKILL.md` → `template: story.md`
  - `sm-create-next-story/SKILL.md` → `template: story.md`
  - `create-brownfield-story/SKILL.md` → `template: story.md`
  - `validate-next-story/SKILL.md` → `template: checklist-story-draft.md`
  - `dev-validate-next-story/SKILL.md` → `template: checklist-story-dod.md`
  - `brownfield-create-epic/SKILL.md` → `template: epic.md`
  - `execute-epic-plan/SKILL.md` → `template: epic.md`
  - `plan-create-implementation/SKILL.md` → `template: task.md`

  **Product domain** (`src/features/builtin-skills/skills/kord-aios/product/`):
  - Check all SKILL.md files in this directory. Any skill that creates stories or PRDs should get `template:` field.

  **QA domain** (`src/features/builtin-skills/skills/kord-aios/qa/`):
  - Any skill that produces QA reports or gate assessments → `template: qa-report.md` or `template: qa-gate.md`

  For each skill, add the `template:` line to the YAML frontmatter block (after the existing fields like `name:`, `description:`, `agent:`).

  **Must NOT do**:
  - Do NOT modify skill body content — only add `template:` to frontmatter
  - Do NOT add template references to skills that don't produce artifacts (e.g., `shard-doc`, `story-checkpoint`, `propose-modification`)
  - Do NOT rename skills or change their existing frontmatter fields

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Repetitive small edits to multiple SKILL.md files — add one frontmatter line each
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 8, 7, 11
  - **Blocked By**: Task 2 (loader must support template: field first)

  **References**:

  **Pattern References**:
  - `src/features/builtin-skills/skills/kord-aios/story/create-next-story/SKILL.md:1-6` — Existing frontmatter pattern. Add `template: story.md` after line 5 (`subtask: false`)

  **Files to Modify** (full list):
  - `src/features/builtin-skills/skills/kord-aios/story/create-next-story/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/story/sm-create-next-story/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/story/create-brownfield-story/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/story/validate-next-story/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/story/dev-validate-next-story/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/story/brownfield-create-epic/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/story/execute-epic-plan/SKILL.md`
  - `src/features/builtin-skills/skills/kord-aios/story/plan-create-implementation/SKILL.md`
  - All SKILL.md files in `src/features/builtin-skills/skills/kord-aios/product/` that create stories/PRDs
  - All SKILL.md files in `src/features/builtin-skills/skills/kord-aios/qa/` that produce QA artifacts

  **WHY Each Reference Matters**:
  - `create-next-story/SKILL.md:1-6`: Shows the exact frontmatter format — add `template:` as a new line in the YAML block

  **Acceptance Criteria**:

  - [ ] At least 8 story-domain SKILL.md files have `template:` in frontmatter
  - [ ] Template values match correct template filenames (story.md, epic.md, task.md, etc.)
  - [ ] `bun test src/features/builtin-skills/kord-aios-loader.test.ts` → PASS (loader still discovers all skills)
  - [ ] `bun run build` → zero errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Skills with template: field are discovered correctly
    Tool: Bash (bun test)
    Steps:
      1. Run: bun test src/features/builtin-skills/kord-aios-loader.test.ts
      2. Assert: All tests pass
      3. Run: bun test src/features/builtin-skills/skills.test.ts
      4. Assert: All tests pass (skill count unchanged)
    Expected Result: Loader handles template: field, all skills still load
    Evidence: Test output captured

  Scenario: Verify template: field present in skill files
    Tool: Bash (grep)
    Steps:
      1. grep -r "template:" src/features/builtin-skills/skills/kord-aios/story/*/SKILL.md
      2. Assert: At least 8 matches found
      3. Verify values are valid template filenames (story.md, epic.md, etc.)
    Expected Result: Skills declare their template references
    Evidence: Grep output captured
  ```

  **Commit**: YES
  - Message: `feat(skills): add template: frontmatter to story/product/qa skills`
  - Files: Multiple SKILL.md files in `src/features/builtin-skills/skills/kord-aios/`
  - Pre-commit: `bun test src/features/builtin-skills/`

---

- [x] 7. Refactor kord.ts to src/agents/kord/ directory with modular rules

  **What to do**:
  - Create directory `src/agents/kord/`
  - Move `src/agents/kord.ts` → `src/agents/kord/index.ts` (main factory function stays here)
  - Extract prompt sections into separate files following the planner pattern:
    - `src/agents/kord/task-management.ts` — Extract `buildTaskManagementSection()` and related task prompt content
    - `src/agents/kord/delegation.ts` — Extract delegation-related prompt sections (tool selection, delegation table, category dispatch)
    - `src/agents/kord/methodology-rules.ts` — NEW file containing native methodology rules:
      - Stories are the default execution unit (opt-out for speed)
      - Templates available at `.kord/templates/` for all methodology artifacts
      - Artifact pipeline: PRD (@pm) → Epic → Stories (@sm) → Validation (@po) → Implementation
      - When planning, always offer story-driven workflow via planner
      - Reference methodology agents (SM, PM, PO, QA) and their roles
  - Verify imports of `kord.ts` across the codebase resolve correctly:
    - `src/agents/utils.ts:4` — `import { createKordAgent } from "./kord"` — TypeScript resolves `"./kord"` to `"./kord/index.ts"` automatically when directory has index.ts. **No import change needed** unless exports change.
    - `src/agents/index.ts:4` — `export { createKordAgent } from "./kord"` — Same auto-resolution. **No import change needed.**
    - Verify by running `bun run build` — any broken imports will surface as TypeScript errors.
    - IMPORTANT: The refactored `src/agents/kord/index.ts` MUST re-export the same symbols: `createKordAgent` (factory function) and `KORD_PROMPT_METADATA`.
  - Write tests:
    - `src/agents/kord/index.test.ts` — Verify factory function returns valid AgentConfig
    - Verify methodology rules content is included in the generated prompt
    - Verify all exported symbols are accessible (KORD_PROMPT_METADATA, factory function)

  **Must NOT do**:
  - Do NOT change the agent's model, temperature, or tool restrictions
  - Do NOT modify the dynamic-agent-prompt-builder.ts — only import from it
  - Do NOT remove any existing prompt sections — only MOVE and ADD
  - Do NOT break the `KORD_PROMPT_METADATA` export — it's used by utils.ts for agent registration
  - Do NOT add constitutional gates or blocking enforcement — rules are advisory only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Large file refactor (624 lines), must preserve all exports and imports, risk of breaking agent registration
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit for the refactor

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 10)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 5, 6

  **References**:

  **Pattern References** (existing directory refactor to follow):
  - `src/agents/planner/` — EXACT pattern to follow. Planner was refactored from single file to directory with: `index.ts` (factory), `interview-mode.ts` (prompt section), `plan-generation.ts` (prompt section), etc.
  - `src/agents/planner/index.ts` — Factory function pattern — imports sections and assembles prompt
  - `src/agents/build/` — Another directory-pattern agent with `index.ts`, `default.ts`, `gpt.ts`, `utils.ts`

  **Source File**:
  - `src/agents/kord.ts:1-624` — ENTIRE file to refactor. Key sections to extract:
    - Lines 1-28: Imports and metadata (stays in index.ts)
    - Lines 29-100+: `buildTaskManagementSection()` → `task-management.ts`
    - Lines 100+: Delegation prompt building → `delegation.ts`
    - NEW: methodology-rules.ts (new content)

  **Import References** (files that import from kord.ts):
  - `src/agents/utils.ts` — Imports agent factory, needs path update
  - `src/agents/index.ts` — Barrel export, needs path update
  - Search for `from "./kord"` or `from "../agents/kord"` across codebase

  **WHY Each Reference Matters**:
  - `src/agents/planner/`: This is the EXACT refactoring pattern — single .ts file → directory with index.ts + section files
  - `kord.ts:1-624`: Need to understand all sections before extracting
  - `utils.ts` imports: MUST update or the agent won't register

  **Acceptance Criteria**:

  - [ ] `src/agents/kord/index.ts` exists and exports factory + KORD_PROMPT_METADATA
  - [ ] `src/agents/kord/task-management.ts` exists
  - [ ] `src/agents/kord/delegation.ts` exists
  - [ ] `src/agents/kord/methodology-rules.ts` exists with native rules content
  - [ ] `src/agents/kord.ts` deleted (replaced by directory)
  - [ ] All imports updated (verify via `bun run build`)
  - [ ] `bun run build` → zero errors
  - [ ] `bun test` → all tests pass (full suite, agent registration works)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Build succeeds after refactor
    Tool: Bash (bun run build)
    Preconditions: kord.ts moved to kord/ directory
    Steps:
      1. Run: bun run build
      2. Assert: Exit code 0
      3. Assert: No import resolution errors
    Expected Result: Clean build with directory structure
    Evidence: Build output captured

  Scenario: All tests pass after refactor
    Tool: Bash (bun test)
    Preconditions: Build succeeds
    Steps:
      1. Run: bun test
      2. Assert: 3193+ tests pass, 0 failures
      3. Assert: No agent registration failures
    Expected Result: Full test suite green
    Evidence: Test output captured

  Scenario: Methodology rules present in prompt
    Tool: Bash (grep)
    Steps:
      1. grep "methodology" src/agents/kord/methodology-rules.ts
      2. Assert: Match found
      3. grep "story" src/agents/kord/methodology-rules.ts
      4. Assert: Match found (stories as execution unit)
      5. grep ".kord/templates/" src/agents/kord/methodology-rules.ts
      6. Assert: Match found (template path references)
    Expected Result: Rules file contains methodology content
    Evidence: Grep output captured
  ```

  **Commit**: YES
  - Message: `refactor(agents): extract kord.ts to kord/ directory with modular methodology rules`
  - Files: `src/agents/kord/index.ts`, `src/agents/kord/task-management.ts`, `src/agents/kord/delegation.ts`, `src/agents/kord/methodology-rules.ts`, `src/agents/kord/index.test.ts`, deleted `src/agents/kord.ts`, updated imports
  - Pre-commit: `bun test && bun run build`

---

- [x] 8. Enrich flagship skills with real methodology content

  **What to do**:
  - Enrich the 4 most critical skills with REAL methodology content adapted from Synkra's task files. These skills currently have minimal/stub content. They need substantial step-by-step instructions that teach agents HOW to perform their methodology role.

  **Skills to enrich** (each should become 100-200 lines of real content):

  **A. `src/features/builtin-skills/skills/kord-aios/story/create-next-story/SKILL.md`**
  - Adapt from Synkra's `create-next-story.md` (774L)
  - Content: Step-by-step story creation workflow — analyze epic/PRD context, decompose into stories, write acceptance criteria (Given/When/Then format), define scope boundaries (IN/OUT), identify dependencies, set initial status to DRAFT, add technical notes with file references, reference `.kord/templates/story.md`
  - Include: story naming conventions, scope sizing rules (single deliverable per story), checklist for well-formed stories

  **B. `src/features/builtin-skills/skills/kord-aios/story/validate-next-story/SKILL.md`**
  - Adapt from Synkra's story validation workflow (Phase 2 in story-development-cycle)
  - Content: 10-point validation checklist — title clarity, description completeness, testable acceptance criteria, scope definition, dependencies mapped, complexity estimate, business value, risks documented, DoD criteria, PRD/Epic alignment
  - Include: pass/fail decision rules, feedback format for rejected stories, status transition (DRAFT → READY on pass)

  **C. A QA gate skill** — find the most appropriate existing skill in `src/features/builtin-skills/skills/kord-aios/qa/` that handles quality gate assessment, or create content for the closest match
  - Adapt from Synkra's qa-gate-tmpl and QA review phase (Phase 4 in story-development-cycle)
  - Content: Quality gate checklist — code review (patterns, readability, maintainability), test adequacy, acceptance criteria met, no regressions, performance check, security basics, documentation updated
  - Include: gate verdict format (PASS/FAIL/CONDITIONAL), fix checklist for failures, status transition (REVIEW → DONE on pass, back to IN_PROGRESS on fail)

  **D. A dev implementation skill** — find the skill that guides dev agents through story implementation (likely `dev-develop-story` or similar in story/ directory)
  - Adapt from Synkra's `dev-develop-story.md` (910L)
  - Content: Implementation workflow — analyze acceptance criteria, plan technical approach, write code following project patterns, create/update tests, update file list in story, commit atomically, transition status to REVIEW when done
  - Include: TDD integration, commit message conventions, when to ask for help vs proceed

  **Must NOT do**:
  - Do NOT copy Synkra content verbatim — adapt structure and translate to English
  - Do NOT change skill frontmatter (name, description, agent fields) — only enrich body content
  - Do NOT make skills >250 lines — keep them focused and actionable
  - Do NOT add tool invocations or code blocks that agents would try to execute literally

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Content creation requiring careful adaptation from Synkra reference materials, understanding of methodology flow
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 5, 6 (agent prompts and template frontmatter must be done first)

  **References**:

  **Synkra Source References** (content to ADAPT, not copy):
  - `D:\dev\synkra-aios\.aios-core\development\tasks\create-next-story.md` (774L) — Story creation workflow
  - `D:\dev\synkra-aios\.aios-core\development\tasks\dev-develop-story.md` (910L) — Dev implementation workflow
  - `D:\dev\synkra-aios\.aios-core\development\workflows\story-development-cycle.yaml` (284L) — Full lifecycle with 4 phases
  - `D:\dev\synkra-aios\.aios-core\product\templates\qa-gate-tmpl.yaml` (240L) — QA gate criteria and verdict format

  **Pattern References** (existing skills to follow):
  - `src/features/builtin-skills/skills/git-master.ts` (1107L) — Example of a RICH, detailed skill with real content (hardcoded skill, but shows content density to aim for)
  - `src/features/builtin-skills/skills/kord-aios/story/create-next-story/SKILL.md:1-6` — Current frontmatter to preserve

  **WHY Each Reference Matters**:
  - Synkra task files: Extract the WORKFLOW STEPS and DECISION LOGIC, adapt to Kord's context (English, story tools, template refs)
  - `git-master.ts`: Shows the level of detail and actionable instructions a rich skill should have
  - Current SKILL.md files: Preserve frontmatter, only enrich body

  **Acceptance Criteria**:

  - [ ] `create-next-story/SKILL.md` has >100 lines of real methodology content
  - [ ] `validate-next-story/SKILL.md` has 10-point validation checklist with pass/fail rules
  - [ ] QA gate skill has quality gate checklist with PASS/FAIL/CONDITIONAL verdict format
  - [ ] Dev implementation skill has TDD-integrated implementation workflow
  - [ ] All 4 skills reference story status transitions (DRAFT/READY/IN_PROGRESS/REVIEW/DONE)
  - [ ] All 4 skills reference their template paths
  - [ ] `bun test src/features/builtin-skills/` → PASS (all skills still load correctly)
  - [ ] `bun run build` → zero errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Enriched skills load correctly
    Tool: Bash (bun test)
    Preconditions: Skill content updated
    Steps:
      1. Run: bun test src/features/builtin-skills/kord-aios-loader.test.ts
      2. Assert: All tests pass (skills still parse correctly)
      3. Run: bun test src/features/builtin-skills/skills.test.ts
      4. Assert: Skill count unchanged
    Expected Result: All skills load with enriched content
    Evidence: Test output captured

  Scenario: Skills contain real methodology content
    Tool: Bash (grep + wc)
    Steps:
      1. wc -l src/features/builtin-skills/skills/kord-aios/story/create-next-story/SKILL.md
      2. Assert: >100 lines
      3. grep "DRAFT" src/features/builtin-skills/skills/kord-aios/story/create-next-story/SKILL.md
      4. Assert: Match found (story status reference)
      5. grep "acceptance criteria" src/features/builtin-skills/skills/kord-aios/story/validate-next-story/SKILL.md
      6. Assert: Match found (validation checklist)
    Expected Result: Skills have substantial methodology content
    Evidence: Grep/wc output captured
  ```

  **Commit**: YES
  - Message: `feat(skills): enrich flagship skills with real methodology content (story creation, validation, QA gate, dev implementation)`
  - Files: 4 SKILL.md files in `src/features/builtin-skills/skills/kord-aios/`
  - Pre-commit: `bun test src/features/builtin-skills/`

---

- [x] 9. Create checklist_runner tool for deterministic artifact validation

  **What to do**:
  - Create a new tool at `src/tools/checklist-runner/` following the standard tool directory structure:
    - `index.ts` — Barrel exports
    - `tools.ts` — Tool factory function `createChecklistRunnerTool(ctx)`
    - `types.ts` — Zod schemas for args: `{ checklist_path: string, target_path: string }`
    - `constants.ts` — Tool description constant

  - The tool performs DETERMINISTIC validation of an artifact (target) against a checklist (template):
    1. Read the checklist file at `checklist_path` (a `.kord/templates/checklist-*.md` file)
    2. Parse checklist items (markdown checkboxes `- [ ] item text`)
    3. Read the target artifact file at `target_path`
    4. For each checklist item, evaluate whether the target satisfies it using DETERMINISTIC rules:
       - **Section presence**: Check if target has a `## Section Name` matching the checklist item
       - **Field presence**: Check if YAML frontmatter has required fields (title, type, status)
       - **Non-empty content**: Check if sections have content (not just headers)
       - **Acceptance criteria format**: Check if `Given/When/Then` or `- [ ]` patterns exist
       - **File references**: Check if file paths are mentioned (for technical notes)
    5. Return JSON result:
       ```json
       {
         "checklist": "checklist-story-draft.md",
         "target": "docs/kord/stories/s01-auth.md",
         "passed": true,
         "total": 10,
         "passed_count": 8,
         "failed_count": 2,
         "items": [
           { "description": "Has acceptance criteria", "passed": true },
           { "description": "Has file references", "passed": false, "reason": "No file paths found in Technical Notes section" }
         ]
       }
       ```

  - Register the tool in `src/tools/index.ts` (add to factory tools, not static builtinTools)
  - Write tests in `src/tools/checklist-runner/checklist-runner.test.ts`:
    - Test: Valid checklist + valid target → partial pass result
    - Test: Valid checklist + missing target → error result
    - Test: Unknown checklist → error with "Checklist not found"
    - Test: All items pass → `passed: true`
    - Test: Blocker item fails → `passed: false`
    - Test: Frontmatter validation (title, type, status fields)

  **Must NOT do**:
  - Do NOT use AI/LLM for any validation — this tool is 100% deterministic code
  - Do NOT modify existing tools — this is entirely additive
  - Do NOT make the tool overly complex — start with section-presence + field-presence checks, NOT semantic analysis
  - Do NOT add this tool to any agent's tool_allowlist — it's available to all agents by default
  - Do NOT read files outside the project directory (security)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New tool with TypeScript implementation, Zod schemas, test coverage, tool registration
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 8)
  - **Blocks**: Task 11
  - **Blocked By**: Task 1 (needs template constants to exist for test fixtures)

  **References**:

  **Pattern References** (existing tools to follow):
  - `src/tools/story-read/` — EXACT directory structure to follow (index.ts, tools.ts, types.ts, constants.ts, test)
  - `src/tools/story-read/tools.ts:1-80` — Tool factory pattern with file reading + markdown parsing + JSON result
  - `src/tools/decision-log/tools.ts:1-19` — Simpler tool factory pattern

  **Synkra Source References** (logic to adapt):
  - `D:\dev\synkra-aios\.aios-core\core\orchestration\checklist-runner.js:1-120` — Deterministic validation logic: parse checklist items, evaluate against target, return structured result

  **API/Type References**:
  - `src/shared/frontmatter.ts` — `parseFrontmatter()` for validating target artifact frontmatter
  - `src/shared/types/index.ts` — Existing story/checklist types (re-exports from `story.ts`, `plan.ts`, `squad.ts`)
  - `src/tools/index.ts` — Tool registration pattern (factory tools array)

  **WHY Each Reference Matters**:
  - `story-read/tools.ts`: Shows how to read MD files, parse frontmatter, split sections, and return structured JSON — EXACT same pattern needed
  - `checklist-runner.js`: Shows the validation logic flow — parse items, evaluate, aggregate results
  - `frontmatter.ts`: Reuse for checking target artifact has valid frontmatter

  **Acceptance Criteria**:

  - [ ] `src/tools/checklist-runner/` directory exists with all 4 standard files
  - [ ] Tool registered in `src/tools/index.ts`
  - [ ] Tool accepts `checklist_path` and `target_path` arguments
  - [ ] Returns JSON with `passed`, `total`, `passed_count`, `failed_count`, `items[]`
  - [ ] Validation is 100% deterministic (no LLM calls)
  - [ ] `bun test src/tools/checklist-runner/checklist-runner.test.ts` → PASS (6+ test cases)
  - [ ] `bun run build` → zero errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Checklist runner validates artifacts deterministically
    Tool: Bash (bun test)
    Preconditions: Tool created and registered
    Steps:
      1. Run: bun test src/tools/checklist-runner/checklist-runner.test.ts
      2. Assert: All tests pass including pass/fail/partial/unknown-checklist cases
      3. Assert: Test count >= 6
    Expected Result: Deterministic validation works correctly
    Evidence: Test output captured

  Scenario: Build succeeds with new tool
    Tool: Bash (bun run build)
    Steps:
      1. Run: bun run build
      2. Assert: Exit code 0
      3. Assert: No TypeScript errors
    Expected Result: Tool compiles and registers correctly
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(tools): add checklist_runner tool for deterministic artifact validation`
  - Files: `src/tools/checklist-runner/index.ts`, `src/tools/checklist-runner/tools.ts`, `src/tools/checklist-runner/types.ts`, `src/tools/checklist-runner/constants.ts`, `src/tools/checklist-runner/checklist-runner.test.ts`, updated `src/tools/index.ts`
  - Pre-commit: `bun test src/tools/checklist-runner/`

---

- [x] 10. Encode story-development-cycle workflow knowledge in Build hook prompt

  **What to do**:
  - Add workflow-aware context to the Build hook's continuation prompt and delegation context in `src/hooks/build/index.ts`.
  - This is a PROMPT change, not a code logic change. The Build hook already has prompt strings (BOULDER_CONTINUATION_PROMPT, VERIFICATION_REMINDER, buildOrchestratorReminder, buildTaskDelegationContext). We're enriching these prompts with story lifecycle awareness.

  **Specific changes**:

  **A. Add a METHODOLOGY_FLOW constant** (new constant in build/index.ts):
  ```typescript
  const METHODOLOGY_FLOW = `
  ## Story Development Cycle (Methodology Reference)

  When working with story-driven plans, follow this phase sequence:

  | Phase | Agent | Action | Status Transition |
  |-------|-------|--------|-------------------|
  | 1. Story Creation | SM | Create story from epic/PRD | → DRAFT |
  | 2. Story Validation | PO | Validate against 10-point checklist | DRAFT → READY (pass) or feedback to SM (fail) |
  | 3. Implementation | Dev | Implement acceptance criteria | READY → IN_PROGRESS → REVIEW |
  | 4. QA Review | QA | Quality gate assessment | REVIEW → DONE (pass) or back to Dev (fail) |

  **Retry Loops:**
  - PO rejects story → SM fixes and resubmits (Phase 2 → Phase 1)
  - QA rejects implementation → Dev fixes and resubmits (Phase 4 → Phase 3)

  **Story Status Lifecycle:** DRAFT → READY → IN_PROGRESS → REVIEW → DONE

  Use story_read and story_update tools to track status transitions.
  Use checklist_runner tool to validate artifacts deterministically.
  `
  ```

  **B. Inject METHODOLOGY_FLOW into buildOrchestratorReminder()** — append after the wave progress section, so the orchestrator always sees the methodology reference when continuing work.

  **C. Update buildTaskDelegationContext()** — when a task has `executor: "sm"`, `executor: "po"`, or `executor: "qa"`, add the relevant phase context from METHODOLOGY_FLOW.

  **Must NOT do**:
  - Do NOT change Build hook's TypeScript execution logic (event handlers, continuation injection, wave parsing)
  - Do NOT make the Build hook check story status programmatically (that's a future enhancement)
  - Do NOT add new tool calls or imports — only modify prompt strings
  - Do NOT modify the plan-parser.ts or boulder-state code

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Prompt engineering in a complex file (921 lines), must understand existing prompt assembly
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 7)
  - **Blocks**: Task 11
  - **Blocked By**: Task 8 (enriched skills inform the methodology flow content)

  **References**:

  **Pattern References**:
  - `src/hooks/build/index.ts:69-78` — BOULDER_CONTINUATION_PROMPT constant — pattern for the new METHODOLOGY_FLOW constant
  - `src/hooks/build/index.ts:200-234` — `buildOrchestratorReminder()` — inject methodology reference after wave context
  - `src/hooks/build/index.ts:446-488` — `buildTaskDelegationContext()` — add phase-specific context for methodology agents

  **Content References**:
  - `D:\dev\synkra-aios\.aios-core\development\workflows\story-development-cycle.yaml:33-169` — Phase sequence, retry loops, status transitions to encode

  **WHY Each Reference Matters**:
  - `build/index.ts:69-78`: Shows how prompt constants are defined and injected — follow same pattern
  - `build/index.ts:200-234`: The injection point for methodology reference — append after waveContext
  - `story-development-cycle.yaml`: The authoritative phase flow to encode in the prompt

  **Acceptance Criteria**:

  - [ ] `METHODOLOGY_FLOW` constant exists in `src/hooks/build/index.ts`
  - [ ] `buildOrchestratorReminder()` includes methodology reference
  - [ ] `buildTaskDelegationContext()` includes phase context for SM/PO/QA executors
  - [ ] Prompt includes story status lifecycle table (DRAFT/READY/IN_PROGRESS/REVIEW/DONE)
  - [ ] Prompt includes retry loop rules (PO→SM, QA→Dev)
  - [ ] `bun run build` → zero errors
  - [ ] `bun test src/hooks/build/` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Build hook contains methodology flow
    Tool: Bash (grep)
    Steps:
      1. grep "METHODOLOGY_FLOW" src/hooks/build/index.ts → match
      2. grep "Story Development Cycle" src/hooks/build/index.ts → match
      3. grep "DRAFT.*READY.*IN_PROGRESS.*REVIEW.*DONE" src/hooks/build/index.ts → match
      4. grep "Retry Loops" src/hooks/build/index.ts → match
    Expected Result: Methodology flow encoded in Build hook prompt
    Evidence: Grep output captured

  Scenario: Build and tests pass with prompt changes
    Tool: Bash
    Steps:
      1. Run: bun run build
      2. Assert: Exit code 0
      3. Run: bun test src/hooks/build/
      4. Assert: All tests pass
    Expected Result: No regressions from prompt additions
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(build): encode story-development-cycle workflow knowledge in Build hook prompt`
  - Files: `src/hooks/build/index.ts`
  - Pre-commit: `bun test src/hooks/build/ && bun run build`

---

- [x] 11. AGENTS.md updates + build + full test verification

  **What to do**:
  - Update `src/agents/AGENTS.md`:
    - Change kord entry from `kord.ts` to `kord/` directory listing (index.ts, task-management.ts, delegation.ts, methodology-rules.ts)
    - Add note about methodology-rules.ts containing native methodology rules
  - Update `src/features/builtin-skills/AGENTS.md`:
    - Add `template` field to the SKILL.MD FORMAT section's frontmatter fields table
    - Note that `template:` injects a template reference line into the skill prompt
    - Document enriched flagship skills (create-next-story, validate-next-story, qa-gate, dev implementation)
  - Update `src/cli/AGENTS.md`:
    - Update template list to include all 11 templates (2 original + 9 new)
  - Update `src/tools/AGENTS.md`:
    - Add `checklist-runner` to tool listing with description
  - Update `src/hooks/AGENTS.md`:
    - Note that Build hook now includes METHODOLOGY_FLOW prompt constant
  - Run full build and test suite:
    - `bun run build` → zero errors
    - `bun test` → all tests pass
    - `bun run typecheck` → zero type errors

  **Must NOT do**:
  - Do NOT update the root AGENTS.md — that's auto-generated or manually maintained separately
  - Do NOT modify code files — this task is documentation + verification only
  - Do NOT modify README.md

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation updates + verification commands
  - **Skills**: [`git-master`]
    - `git-master`: Final commit for the plan

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (sequential — depends on all previous tasks)
  - **Blocks**: Task 12
  - **Blocked By**: All tasks (1-10)

  **References**:

  **Files to Update**:
  - `src/agents/AGENTS.md` — Agent structure documentation
  - `src/features/builtin-skills/AGENTS.md` — Skill loader documentation
  - `src/cli/AGENTS.md` — CLI documentation (template list)
  - `src/tools/AGENTS.md` — Tool listing documentation
  - `src/hooks/AGENTS.md` — Hook documentation

  **Acceptance Criteria**:

  - [ ] `src/agents/AGENTS.md` reflects kord/ directory structure
  - [ ] `src/features/builtin-skills/AGENTS.md` documents `template:` field and enriched skills
  - [ ] `src/cli/AGENTS.md` lists all 11 templates
  - [ ] `src/tools/AGENTS.md` includes checklist-runner tool
  - [ ] `src/hooks/AGENTS.md` mentions METHODOLOGY_FLOW
  - [ ] `bun run build` → zero errors
  - [ ] `bun test` → all tests pass (3193+ tests, 0 failures)
  - [ ] `bun run typecheck` → zero errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Full build pipeline succeeds
    Tool: Bash
    Preconditions: All previous tasks completed
    Steps:
      1. Run: bun run typecheck
      2. Assert: Exit code 0
      3. Run: bun run build
      4. Assert: Exit code 0
      5. Run: bun test
      6. Assert: All tests pass, 0 failures
    Expected Result: Complete CI-equivalent verification
    Evidence: Command outputs captured

  Scenario: AGENTS.md files are consistent
    Tool: Bash (grep)
    Steps:
      1. grep "kord/" src/agents/AGENTS.md → match
      2. grep "methodology-rules" src/agents/AGENTS.md → match
      3. grep "template" src/features/builtin-skills/AGENTS.md → match
      4. grep "prd.md" src/cli/AGENTS.md → match
      5. grep "checklist-runner" src/tools/AGENTS.md → match
      6. grep "METHODOLOGY_FLOW" src/hooks/AGENTS.md → match
    Expected Result: Documentation reflects all changes
    Evidence: Grep output captured
  ```

  **Commit**: YES
  - Message: `docs: update AGENTS.md files for full methodology pipeline changes`
  - Files: 5 AGENTS.md files
  - Pre-commit: `bun test && bun run build`

---

- [x] 12. Record Plan 2/3 continuity notes

  **What to do**:
  - This is a documentation task — no code changes. Create a file at `docs/kord/plans/continuity-notes.md` that documents what Plans 2 and 3 must cover, ensuring nothing from the methodology research is forgotten.

  **Content for continuity-notes.md**:

  ```markdown
  # Continuity Notes — Plans 2 & 3

  ## Plan 2: Init & Delivery (`init-delivery`)

  ### Scope
  Everything needed to make `bunx kord-aios init` and `bunx kord-aios extract` deliver the full methodology to projects.

  ### Must Include
  - [ ] `init` command calls `extract` automatically (or offers to)
  - [ ] `extract` exports: agents → `.opencode/agents/`, skills → `.opencode/skills/`, commands → `.opencode/commands/`
  - [ ] All 11 templates scaffolded by init (not just story + ADR)
  - [ ] Antigravity model configuration — make provider models configurable in kord-aios.json instead of hardcoded
  - [ ] kord-rules.md moved to discoverable location (`docs/kord/rules/` or `.kord/rules/`) AND rules-injector updated to find it
  - [ ] Init scaffolds `docs/kord/stories/`, `docs/kord/epics/`, `docs/kord/prds/` output directories
  - [ ] Config migration for existing projects upgrading from older versions

  ### Key Research Findings (from Plan 1 investigation)
  - `init` creates: .opencode/kord-aios.json, .kord/templates/{story,adr}.md, kord-rules.md (ROOT), .kord/squads/code/SQUAD.yaml, docs/kord/{plans,drafts,notepads}
  - `extract` exists separately but init doesn't call it
  - Rules-injector searches: .github/instructions/, .cursor/rules/, .claude/rules/, docs/kord/rules/ — NOT project root
  - Antigravity models are hardcoded in model-requirements.ts

  ### Files to Investigate
  - `src/cli/install.ts` (542L) — Interactive CLI installer
  - `src/cli/scaffolder.ts` — Scaffold logic (extended in Plan 1)
  - `src/shared/model-requirements.ts` — Hardcoded model defaults
  - `src/hooks/rules-injector/` — Rules discovery paths

  ---

  ## Plan 3: Squad Polish (`squad-polish`)

  ### Scope
  Make squad loading, creation, and the full E2E squad experience work correctly.

  ### Must Include
  - [ ] Squad loading from `.kord/squads/` and `.opencode/squads/` verified E2E
  - [ ] `/squad-create` command creates properly structured SQUAD.yaml
  - [ ] Squad creator templates reference the correct agent pool
  - [ ] E2E verification: create squad → load squad → dispatch task → squad agent responds
  - [ ] Squad manifest validation (SQUAD.yaml v2 schema)
  - [ ] Documentation: how to create, load, and use squads

  ### Key Research Findings (from Plan 1 investigation)
  - Built-in squad name is `code` (not `dev`)
  - SQUAD.yaml agent fields include `fallback` and `write_paths`
  - Chief agents auto-enable `permission.task = "allow"`
  - Squad agents receive convention write paths (`docs/kord/squads/{squad}/**`)
  - Squad names are collision-guarded against reserved built-in agent names

  ### Files to Investigate
  - `src/features/builtin-squads/code/SQUAD.yaml` — Default shipped squad
  - `src/tools/squad-load/` — Squad loading tool
  - `src/tools/squad-validate/` — Squad validation tool
  - `src/features/builtin-commands/templates/squad-create.ts` — Squad creation command
  ```

  **Must NOT do**:
  - Do NOT implement any Plan 2/3 features — only document what needs to be done
  - Do NOT modify any code files
  - Do NOT create plan files for Plan 2/3 yet — only continuity notes

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Pure documentation task — creating a structured reference document
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6 (final task)
  - **Blocks**: None (final)
  - **Blocked By**: Task 11

  **References**:

  **Context References**:
  - `docs/kord/drafts/framework-methodology-gaps.md` — Research findings that inform Plan 2/3 scope
  - `docs/kord/plans/methodology-content.md` — This plan (Plan 1) — what's covered and what's deferred

  **Acceptance Criteria**:

  - [ ] `docs/kord/plans/continuity-notes.md` exists
  - [ ] Contains Plan 2 scope with at least 7 must-include items
  - [ ] Contains Plan 3 scope with at least 6 must-include items
  - [ ] Contains key research findings for each plan
  - [ ] Contains files-to-investigate for each plan

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Continuity notes document exists and is complete
    Tool: Bash (grep)
    Steps:
      1. test -f docs/kord/plans/continuity-notes.md
      2. Assert: File exists
      3. grep "Plan 2" docs/kord/plans/continuity-notes.md → match
      4. grep "Plan 3" docs/kord/plans/continuity-notes.md → match
      5. grep "init" docs/kord/plans/continuity-notes.md → match
      6. grep "squad" docs/kord/plans/continuity-notes.md → match
      7. grep "Antigravity" docs/kord/plans/continuity-notes.md → match
    Expected Result: Both plans documented with key items
    Evidence: Grep output captured
  ```

  **Commit**: YES
  - Message: `docs(plans): add continuity notes for Plans 2 (init-delivery) and 3 (squad-polish)`
  - Files: `docs/kord/plans/continuity-notes.md`
  - Pre-commit: none (documentation only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(methodology): create methodology templates (PRD, epic, task, QA, checklists)` | project-layout.ts, project-layout.test.ts | `bun test src/cli/project-layout.test.ts` |
| 2 | `feat(skills): add template: frontmatter field to skill loader` | types.ts (×2), kord-aios-loader.ts, kord-aios-loader.test.ts | `bun test src/features/builtin-skills/kord-aios-loader.test.ts` |
| 3 | `feat(scaffold): add methodology templates to project scaffolder` | scaffolder.ts, scaffolder.test.ts | `bun test src/cli/scaffolder.test.ts` |
| 4 | `feat(planner): add methodology elicitation, replace complexity gating` | interview-mode.ts, plan-generation.ts | `bun run build` |
| 5 | `feat(agents): add template references and workflow role awareness to SM/PM/PO/QA` | sm.md, pm.md, po.md, qa.md | `bun run build` |
| 6 | `feat(skills): add template: frontmatter to story/product/qa skills` | Multiple SKILL.md files | `bun test src/features/builtin-skills/` |
| 7 | `refactor(agents): extract kord.ts to kord/ directory with modular methodology rules` | kord/ directory (5 files), deleted kord.ts | `bun test && bun run build` |
| 8 | `feat(skills): enrich flagship skills with real methodology content` | 4 SKILL.md files | `bun test src/features/builtin-skills/` |
| 9 | `feat(tools): add checklist_runner tool for deterministic artifact validation` | src/tools/checklist-runner/ (5 files), src/tools/index.ts | `bun test src/tools/checklist-runner/` |
| 10 | `feat(build): encode story-development-cycle workflow knowledge in Build hook prompt` | src/hooks/build/index.ts | `bun test src/hooks/build/ && bun run build` |
| 11 | `docs: update AGENTS.md files for full methodology pipeline changes` | 5 AGENTS.md files | `bun test && bun run build` |
| 12 | `docs(plans): add continuity notes for Plans 2 and 3` | docs/kord/plans/continuity-notes.md | none |

---

## Success Criteria

### Verification Commands
```bash
bun run typecheck  # Expected: zero errors
bun run build      # Expected: zero errors, clean ESM output
bun test           # Expected: 3193+ tests pass, 0 failures
```

### Final Checklist
- [ ] All "Must Have" items present (11 templates, template: field, planner elicitation, agent refs + workflow roles, kord refactor, 4 enriched skills, checklist_runner tool, Build hook workflow knowledge)
- [ ] All "Must NOT Have" items absent (no YAML-only templates, no constitutional gates, no keyword-detector, no YAML workflow engine, no Build hook code changes for story status)
- [ ] All 12 commits made with passing tests
- [ ] Full test suite green (3193+ tests)
- [ ] Build produces clean output
- [ ] Type check passes
- [ ] Continuity notes for Plans 2 and 3 documented

---

## Methodology Coverage Matrix

| Component | Category | Status After Plan 1 |
|-----------|----------|-------------------|
| Story template (enhanced) | Template | ✅ Implemented |
| PRD template | Template | ✅ Implemented |
| Epic template | Template | ✅ Implemented |
| Task template | Template | ✅ Implemented |
| QA Gate template | Template | ✅ Implemented |
| QA Report template | Template | ✅ Implemented |
| Checklist: story-draft | Template | ✅ Implemented |
| Checklist: story-dod | Template | ✅ Implemented |
| Checklist: pr-review | Template | ✅ Implemented |
| Checklist: architect | Template | ✅ Implemented |
| Checklist: pre-push | Template | ✅ Implemented |
| Checklist: self-critique | Template | ✅ Implemented |
| `template:` frontmatter field | Skill Loader | ✅ Implemented |
| Scaffolder templates | Scaffolder | ✅ Implemented |
| Planner elicitation | Planner | ✅ Implemented |
| Elicitation-based gating | Planner | ✅ Implemented |
| SM workflow role + template refs | Agent Prompt | ✅ Implemented |
| PM workflow role + template refs | Agent Prompt | ✅ Implemented |
| PO workflow role + template refs | Agent Prompt | ✅ Implemented |
| QA workflow role + template refs | Agent Prompt | ✅ Implemented |
| Skills with `template:` frontmatter | Skills | ✅ Implemented |
| create-next-story enriched | Skill Content | ✅ Implemented |
| validate-next-story enriched | Skill Content | ✅ Implemented |
| QA gate skill enriched | Skill Content | ✅ Implemented |
| Dev implementation skill enriched | Skill Content | ✅ Implemented |
| `checklist_runner` tool | Tool | ✅ Implemented |
| Story-development-cycle in Build hook | Build Hook Prompt | ✅ Implemented |
| kord.ts modular directory | Agent Refactor | ✅ Implemented |
| Methodology rules in kord agent | Agent Prompt | ✅ Implemented |
| Init scaffolds all templates | Init/Delivery | ❌ Plan 2 |
| Init calls extract | Init/Delivery | ❌ Plan 2 |
| Antigravity model config | Init/Delivery | ❌ Plan 2 |
| kord-rules discoverable location | Init/Delivery | ❌ Plan 2 |
| Squad loading E2E | Squad Polish | ❌ Plan 3 |
| Squad creator templates | Squad Polish | ❌ Plan 3 |
