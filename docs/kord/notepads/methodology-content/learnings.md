# Learnings

## 2026-03-03

### Planner Elicitation Fix (YES/NO Story-Driven Artifacts)

**Date:** 2026-03-03

**Issue:** Initial implementation used SPEED FIRST/QUALITY FIRST/BALANCED options instead of YES/NO story-driven artifacts per plan spec.

**Fix Applied:**

1. **interview-mode.ts** - Replaced SPEED/QUALITY/BALANCED with:
   - Question: "Should this plan include story-driven artifacts? YES (default) / NO"
   - YES: Planner dispatches SM for stories, PM for PRD, PO for validation
   - NO: Flat TODO plan only

2. **plan-generation.ts** - Updated gating text:
   - YES → runs full artifact swarm regardless of complexity
   - NO → skips artifact swarm, produces flat TODO plan
   - No elicitation → default NO for trivial, YES otherwise

**Build Result:** Pre-existing error in project-layout.ts (unrelated to these changes).

---

### Skill Loader Template Frontmatter Support

**Changes Made:**

1. **Added `templateRef?: string`** to `BuiltinSkill` type in `src/features/builtin-skills/types.ts`
   - Optional field to store template name from frontmatter

2. **Added `template?: string`** to `SkillMetadata` in `src/features/opencode-skill-loader/types.ts`
   - For consistency across loaders

3. **Template parsing and injection** in `src/features/builtin-skills/kord-aios-loader.ts`
   - Location: `parseKordAiosSkill()` function, lines 40-48
   - Parses `template:` frontmatter field from SKILL.md
   - Injects template reference line inside `<skill-instruction>` wrapper after base directory line:
     ```
     Template: Use the template at .kord/templates/{template} when creating this artifact.
     ```

**Key Insight:**
- Template reference is injected inside `<skill-instruction>` (not as separate block)
- Line is added after "Base directory for this skill" line but before the skill body
- Template file existence is NOT validated (deferred to Plan 2)

### Test Strategy for Internal Parser Functions

**Problem:** The `parseKordAiosSkill` function is internal to the loader module. Initial tests tried to verify behavior indirectly by checking existing skills from the filesystem, but this doesn't actually validate that the parser correctly handles the `template:` frontmatter.

**Solution:** Export a test-only helper function:

```typescript
// In kord-aios-loader.ts
export function __test__parseKordAiosSkill(
  content: string,
  skillBaseDir: string,
  skillNameFallback: string
): BuiltinSkill | null {
  return parseKordAiosSkill(content, skillBaseDir, skillNameFallback)
}
```

**Benefits:**
- Direct testing of parser logic with controlled input
- Tests can verify both:
  1. `templateRef` field is correctly set from frontmatter
  2. Template reference line is injected into the wrapped template string
- Tests for both positive case (template present) and negative case (template absent)

**Tests Added:**
- `template frontmatter is captured in templateRef field` - verifies field extraction
- `template frontmatter injects template reference line into template` - verifies injection
- `skills without template frontmatter have no templateRef` - verifies negative case

---

### Template Escaping Gotchas (project-layout.ts)

**Context:** Added methodology templates (PRD, Epic, Task, QA Gate, QA Report + 6 checklists) to `src/cli/project-layout.ts`.

**Gotchas Identified:**

1. **Template String Delimiters**: Use backticks (\`) for multi-line strings. Ensure no stray backticks inside the content.

2. **YAML Frontmatter Parsing**: The `parseFrontmatter` function expects:
   - Opening `---` on its own line
   - YAML key-value pairs  
   - Closing `---` on its own line
   - Body content after the second `---`

3. **Required Frontmatter Fields**: All templates must have:
   - `title`: Display name (use `{TITLE}` placeholder for user-filled)
   - `type`: Document type (story, adr, prd, epic, task, qa-gate, qa-report, checklist)
   - `status`: Initial status (draft, pending, proposed, active)

4. **Optional but Recommended Fields**:
   - `created`: Use `{DATE}` placeholder for dynamic dates
   - `wave`: For story assignment to waves
   - `story`: For task/QA templates referencing parent story
   - `priority`: For prioritization (high/medium/low)
   - `assignee`: For task assignment

5. **Placeholder Patterns**:
   - `{TITLE}` - User provides the title
   - `{DATE}` - Auto-filled with current date
   - `ADR-{NUMBER}` - Auto-incremented ADR number

6. **Checklist Templates**: Unlike other templates, checklists have fixed titles (e.g., "Development Checklist") rather than placeholders. They use `status: active` instead of `draft`.

7. **Test Validation**: The test suite verifies:
   - All templates are non-empty
   - Valid YAML frontmatter exists
   - Required fields (title, type, status) are present
   - Body content is not empty
   - Non-checklist templates have placeholder titles

8. **Checklist Constant Names**: The plan requires exactly 6 checklists with specific names:
   - `CHECKLIST_STORY_DRAFT_CONTENT` - Story creation quality
   - `CHECKLIST_STORY_DOD_CONTENT` - Definition of Done
   - `CHECKLIST_PR_REVIEW_CONTENT` - PR review quality
   - `CHECKLIST_ARCHITECT_CONTENT` - Architecture decisions
   - `CHECKLIST_PRE_PUSH_CONTENT` - Pre-push verification
   - `CHECKLIST_SELF_CRITIQUE_CONTENT` - Self-reflection before submission
   These replace generic checklists (development, testing, deployment, etc.).

9. **Backtick Escaping**: When checklist content contains code-like terms (e.g., "as any", "@ts-ignore"), use quotes instead of backticks to avoid breaking template literal parsing.

---

### Scaffolder Updated with New Templates

**Date:** 2026-03-03

**Change:** Updated `src/cli/scaffolder.ts` to scaffold new templates from `src/cli/project-layout.ts` into `.kord/templates/` (flat, no subdirs).

**Filenames Added:**

1. **Template Files (5):**
   - `prd.md` - Product Requirements Document template
   - `epic.md` - Epic template
   - `task.md` - Task template
   - `qa-gate.md` - QA Gate template
   - `qa-report.md` - QA Report template

2. **Checklist Files (6):**
   - `checklist-story-draft.md` - Story creation quality
   - `checklist-story-dod.md` - Definition of Done verification
   - `checklist-pr-review.md` - PR review quality
   - `checklist-architect.md` - Architecture review
   - `checklist-pre-push.md` - Pre-push verification
   - `checklist-self-critique.md` - Self-reflection before submission

**Implementation Details:**
- All templates are placed flat under `.kord/templates/` (no subdirectories)
- Tests updated in `src/cli/scaffolder.test.ts` to verify:
  - Files are created during scaffolding
  - Content matches the constants from `project-layout.ts`

---

### Flagship Skill Methodology Enrichment (Story/QA/Dev Workflow)

**Date:** 2026-03-03

**Goal:** Replace generic or overly long skill bodies with practical methodology instructions while preserving frontmatter contracts used by the skill loader.

**Files Updated:**

1. `src/features/builtin-skills/skills/kord-aios/story/create-next-story/SKILL.md`
2. `src/features/builtin-skills/skills/kord-aios/story/validate-next-story/SKILL.md`
3. `src/features/builtin-skills/skills/kord-aios/qa/qa-gate/SKILL.md`
4. `src/features/builtin-skills/skills/kord-aios/dev-workflow/dev-develop-story/SKILL.md`

**What Changed:**

- Preserved existing YAML frontmatter keys/values (including `template:` where present).
- Rewrote body content into actionable methodology sections:
  - Context
  - Inputs
  - Steps
  - Output Format
  - Anti-Patterns
- Added explicit references to Kord templates under `.kord/templates/` in each skill where relevant.
- Removed noisy patterns (mode catalogs, pseudo-code-heavy blocks, redundant boilerplate) in favor of execution guidance.
- Kept content English-only and adapted language to Kord AIOS conventions.

**Implementation Note:**

- Synkra source material was used only as directional reference for workflow intent.
- Final text is original wording and structure, aligned to Kord template paths and current story lifecycle vocabulary.

---

### Kord Agent Directory Refactor (kord.ts -> kord/index.ts)

**Date:** 2026-03-03

**Change:** Refactored `src/agents/kord.ts` into a directory module under `src/agents/kord/` with focused files:
- `index.ts` (factory and prompt assembly)
- `task-management.ts` (task/todo discipline section builder)
- `delegation.ts` (dynamic section composition helpers)
- `methodology-rules.ts` (advisory methodology rules)

**Tricky import/export detail:**
- Existing imports using `from "./kord"` in `src/agents/utils.ts` and `src/agents/index.ts` remain valid without edits because TypeScript resolves directory modules through `./kord/index.ts` once `kord.ts` is removed.
- This keeps `createKordAgent` and `KORD_PROMPT_METADATA` stable while changing only file layout.

---

### Checklist Runner Tool (Deterministic Artifact Validation)

**Date:** 2026-03-03

**Change:** Added `checklist_runner` tool scaffold in `src/tools/checklist-runner/` with deterministic validation only.

**What it validates:**
- Markdown checklist items (`- [ ] ...`) against a target markdown artifact
- Required frontmatter fields (`title`, `type`, `status`) using `parseFrontmatter`
- Section presence and non-empty section bodies (for rules like `## Acceptance Criteria`)
- Acceptance pattern requirement (`Given/When/Then` OR checklist items)

**Safety rule:**
- Rejects absolute paths and paths resolving outside `ctx.directory`.

### Enriched Flagship Skills with Real Methodology (2025-03)
- Successfully ported four flagship skills from Synkra methodology: `create-next-story`, `validate-next-story`, `qa-gate`, and `dev-develop-story`.
- Kept the YAML frontmatter intact while rewriting the bodies to 100-200 lines of actionable, explicit methodology.
- Replaced vague steps with concrete workflow operations, validation checks, and output templates aligned with the `.kord/templates/` pattern.
- The `dev-develop-story` skill now includes the YOLO/Interactive/Pre-Flight modes, decision logging (ADR format), and CodeRabbit self-healing loop.
- The `qa-gate` skill now includes rigid structure and standardized severity thresholds (`low`, `medium`, `high`) ensuring no hallucinated severity values.
- Tests passed on `kord-aios-loader.test.ts` meaning the structural format of `SKILL.md` files wasn't broken by the changes.

---

### Checklist Runner Tool Runtime Wiring (2026-03-03)

**Date:** 2026-03-03

**Change:** Wired `checklist_runner` into the plugin runtime in `src/index.ts`.

**What was done:**
1. Added `createChecklistRunnerTool` to imports from `./tools` (line 92)
2. Created tool instance: `const checklistRunnerTool = createChecklistRunnerTool(ctx);` (after line 550)
3. Added to `allTools` map with key `checklist_runner` (line 583)

**Pattern followed:**
- Same pattern as other ctx-bound tools: `storyReadTool`, `storyUpdateTool`, `planReadTool`, `squadLoadTool`, `decisionLogTool`
- Tool is globally available via the plugin tool map (not restricted to specific agents)

**Verification:**
- Tests pass: `bun test src/tools/checklist-runner/checklist-runner.test.ts` (5 pass)
- Build passes: `bun run build`

---

### Flagship Skill dev-develop-story Alignment

**Date:** 2026-03-03

**Issue:** The `dev-develop-story` skill incorrectly referenced `docs/stories/{storyId}/story.yaml` and used generic paths/templates instead of the Kord-specific paths.

**Fix Applied:**
- Updated Gate 1 to reference `.kord/templates/story.md` and the path `docs/kord/stories/{storyId}.md`.
- Replaced the CLI-style usage block with a descriptive narrative for Execution Modes.
- Updated the "Completion" section to explicitly reference `.kord/templates/checklist-story-dod.md` instead of a tool call (`story-dod-checklist`).
- Added a "Templates" section to reinforce usage of Kord templates.
- Corrected the expected output story path to `docs/kord/stories/`.

**Verification:** Preserved YAML frontmatter and passed `kord-aios-loader.test.ts`.

---

### Build Hook Prompt: Story Development Cycle Knowledge Encoding

**Date:** 2026-03-03

**Change:** Added `METHODOLOGY_FLOW` prompt constant to `src/hooks/build/index.ts` to encode story-development-cycle workflow knowledge in the Build hook prompt.

**What was added:**

1. **METHODOLOGY_FLOW constant** (lines 80-115):
   - Phase table: SM (Draft) → PO (Ready) → Dev (In Progress) → QA (Review)
   - Story status lifecycle: `DRAFT → READY → IN_PROGRESS → REVIEW → DONE`
   - Retry loop rules: PO rejects → SM; QA rejects → Dev
   - Tool references: `story_read`, `story_update`, `checklist_runner`

2. **buildOrchestratorReminder()** (line 245):
   - Now includes `METHODOLOGY_FLOW` in the reminder prompt

3. **buildTaskDelegationContext()** (lines 489-512):
   - Adds phase context when executor is `sm`, `po`, or `qa`
   - SM: References story creation and DRAFT status
   - PO: References story validation and DRAFT → READY transition
   - QA: References acceptance criteria verification and IN_PROGRESS → REVIEW

**Verification:**
- Tests pass: `bun test src/hooks/build/` (41 tests)
- Build passes: `bun run build`
- Strings verified: `METHODOLOGY_FLOW`, `Story Development Cycle`, `Retry Loops`

---

### SM/PM/PO/QA Agent Prompts: Template References + Workflow Role Awareness

**Date:** 2026-03-03

**Change:** Updated SM, PM, PO, and QA agent prompts with template references and lifecycle role awareness.

**Files Modified:**
- `src/features/builtin-agents/sm.md`
- `src/features/builtin-agents/pm.md`
- `src/features/builtin-agents/po.md`
- `src/features/builtin-agents/qa.md`

**Added Sections:**

1. `<templates>` - References to `.kord/templates/*.md` files
2. `<workflow_role>` - Role description, lifecycle phase (DRAFT → READY → IN_PROGRESS → REVIEW → DONE), and status transition authority

**Verification:** Build passes (`bun run build`)

---

### AGENTS.md Documentation Updates (2026-03-03)

**Date:** 2026-03-03

**Change:** Updated internal AGENTS.md files to reflect current pipeline state.

**Files Modified:**

1. **src/features/builtin-skills/AGENTS.md** - Added `template` row to Frontmatter Fields table explaining it injects template reference line into `<skill-instruction>`.

2. **src/cli/AGENTS.md** - Added "Scaffolded Templates" section listing 13 files in `.kord/templates/`: story.md, adr.md, prd.md, epic.md, task.md, qa-gate.md, qa-report.md + 6 checklists.

3. **src/tools/AGENTS.md** - Added `checklist-runner/` to tool tree with note about tool key `checklist_runner`.

4. **src/hooks/AGENTS.md** - Added note that Build hook includes `METHODOLOGY_FLOW` in `src/hooks/build/index.ts`.

---

### Skill Template Frontmatter Population (2026-03-03)

**Date:** 2026-03-03

**Change:** Added `template:` frontmatter field to specific skills that produce artifacts.

**Files Modified:**

1. **Story Domain Skills** (8 skills):
   - `src/features/builtin-skills/skills/kord-aios/story/create-next-story/SKILL.md` → `template: story.md`
   - `src/features/builtin-skills/skills/kord-aios/story/sm-create-next-story/SKILL.md` → `template: story.md`
   - `src/features/builtin-skills/skills/kord-aios/story/create-brownfield-story/SKILL.md` → `template: story.md`
   - `src/features/builtin-skills/skills/kord-aios/story/validate-next-story/SKILL.md` → `template: checklist-story-draft.md`
   - `src/features/builtin-skills/skills/kord-aios/story/dev-validate-next-story/SKILL.md` → `template: checklist-story-dod.md`
   - `src/features/builtin-skills/skills/kord-aios/story/brownfield-create-epic/SKILL.md` → `template: epic.md`
   - `src/features/builtin-skills/skills/kord-aios/story/execute-epic-plan/SKILL.md` → `template: epic.md`
   - `src/features/builtin-skills/skills/kord-aios/story/plan-create-implementation/SKILL.md` → `template: task.md`

2. **QA Domain Skills** (6 skills):
   - `src/features/builtin-skills/skills/kord-aios/qa/qa-gate/SKILL.md` → `template: qa-gate.md`
   - `src/features/builtin-skills/skills/kord-aios/qa/qa-review-story/SKILL.md` → `template: qa-report.md`
   - `src/features/builtin-skills/skills/kord-aios/qa/qa-review-build/SKILL.md` → `template: qa-report.md`
   - `src/features/builtin-skills/skills/kord-aios/qa/qa-review-proposal/SKILL.md` → `template: qa-report.md`
   - `src/features/builtin-skills/skills/kord-aios/qa/qa-risk-profile/SKILL.md` → `template: qa-report.md`
   - `src/features/builtin-skills/skills/kord-aios/qa/qa-evidence-requirements/SKILL.md` → `template: qa-report.md`

**Verification:** 
- Tests pass: `bun test src/features/builtin-skills/kord-aios-loader.test.ts`
- 14 skills now have template frontmatter and inject template reference line
