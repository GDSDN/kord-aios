# Kord AIOS: Planning Orchestration Evolution

## TL;DR

> **Quick Summary**: Evolve the Planner agent from a solo consultant into a true "Master Orchestrator of Planning". The Planner will run a research-first, two-pass flow (Plan Analyzer -> v0 -> Decision Research Swarm -> Artifact Generation Swarm -> v1), dispatch only applicable artifact writers, and consolidate outputs into a Single Source of Truth: the Master Plan.
> 
> **Deliverables**:
> - Updated `plan-md-only` hook to allow subagent artifact generation
> - Updated Planner prompts with a research-first, two-pass "Planning Swarm" dispatch table (complexity-conditional)
> - Updated Plan Template with a conditional `## Project Artifacts` section (no universal prefilled artifacts)
> - Updated Builder prompt to inject a "Business Intent" context pack to Dev-Junior
> - Fixed QA/Plan-Reviewer role mix-up across ALL Planner prompt files (3 files)
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Wave 1 (Hook + QA Fix) → Wave 2 (Swarm + Builder)

---

## Context

### Original Request
Evolve the Kord AIOS architecture to maximize the story-driven framework. The current flow relies on static Markdown handoffs and requires the human/Kord to manually orchestrate all planning agents (PM, SM, Architect, UX, Data Engineer, DevOps, PO, Squad Creator). The goal is to make the Planner agent autonomously coordinate the entire documentation phase and pass bounded context to the Builder.

### Interview Summary
**Key Discussions**:
- **Master Plan as Hub (Two-Pass)**: Planner generates an initial plan (v0), then runs Decision Research + Artifact Generation, and finalizes the Master Plan (v1) linking to all artifacts.
- **Bounded Intent (Context Pack)**: Dev-Junior receives a strictly bounded "Intent" (2-3 lines) + Guardrails instead of full PRDs. Builder and QA hold full business context — Dev-Junior only needs enough to not hallucinate.
- **Builder Rescue Path**: Builder can consult SM/PO during execution if a fundamental technical blocker makes the current story impossible.
- **Complexity-Conditional Swarm**: Trivial/simple tasks skip the swarm. Medium+ uses research-first decisions and artifact generation.
- **Planner Agent Access**: Planner can call ALL agents EXCEPT executors (kord, build, dev, dev-junior). This includes: pm, sm, architect, ux-design-expert, po, data-engineer, devops, squad-creator, analyst, explore, librarian, plan-analyzer, plan-reviewer, vision.

**Research Findings**:
- **Write Permissions**: All 20+ agents already have correct write-path restrictions enforced by `agent-authority`.
- **The Redundant Blocker**: The `plan-md-only` hook injects a generic `PLANNING_CONSULT_WARNING` that forbids all file modifications. This must be made conditional so all documentation agents (PM, SM, Architect, UX, Data Engineer, DevOps, PO, Squad Creator) can write their docs when invoked by Planner.
- **Role Correction (QA vs Plan Reviewer)**: The Planner's "High Accuracy Mode" incorrectly uses the `qa` agent to review Markdown plans. QA tests *implementation* (code). `plan-reviewer` reviews *plans*. This mix-up exists in **3 files**: `high-accuracy-mode.ts`, `plan-generation.ts`, AND `constants.ts` (`PLAN_WORKFLOW_REMINDER` at lines 60-62).
- **Task Capability**: The Planner is already permitted to use the `task` tool.

### Analyst Review
**Identified Gaps** (addressed):
- **Cross-Agent Communication**: Hub-and-Spoke model. Planner orchestrates research (librarian/explore) and passes a bounded Context Pack to specialists. Specialists do not call other agents.
- **Scope Creep Prevention**: Artifact writers may write only within their authorized directories and must not write implementation code. Consult-only agents remain read-only.
- **Complexity Gating**: Planning Swarm is conditional — trivial/simple tasks skip it entirely.

---

## Work Objectives

### Core Objective
Refactor the planning and delegation layers of Kord AIOS to support autonomous multi-agent planning swarms and bounded-intent execution.

### Concrete Deliverables
- Conditional warning logic in `plan-md-only/index.ts` and `constants.ts` (artifact subagents vs consult-only)
- New Planning Swarm dispatch step in `plan-generation.ts` and `interview-mode.ts`
- `## Project Artifacts` section in `plan-template.ts`
- Fix QA → Plan-Reviewer in `high-accuracy-mode.ts`, `plan-generation.ts`, AND `constants.ts` (PLAN_WORKFLOW_REMINDER)
- Context Pack extraction logic in `builder/default.ts`

### Definition of Done
- [x] Planner can successfully invoke artifact subagents via `task(subagent_type=...)` and they can write to their authorized paths
- [x] Generated plans include the `## Project Artifacts` section
- [x] Builder delegates tasks to `dev-junior` containing a `Business Intent` extracted from the plan
- [x] Planner uses `plan-reviewer` instead of `qa` for High Accuracy Mode plan validation

### Must Have
- Backward compatibility: existing plans without the new section must still be parsable by the Builder
- Security: Planner itself remains strictly Read-Only (cannot write code, only .md in docs/kord/)
- Complexity gating: trivial/simple intents bypass the Planning Swarm entirely

### Must NOT Have (Guardrails)
- Do NOT remove the Planner from the `plan-md-only` restrictions
- Do NOT alter `agent-authority` configurations or `agent-tool-restrictions.ts`
- Do NOT change the `boulder.json` state format or `boulder-state/` code
- Do NOT allow Planner to invoke executors (kord, build, dev, dev-junior)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: YES (TDD)
- **Framework**: bun test

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **TypeScript Logic** | Bash (bun test) | Run specific test files, verify output |
| **Prompt Injection** | Bash (grep) | Search output files for expected strings |

---

## Execution Strategy

### Parallel Execution Waves

\`\`\`
Wave 1 (Start Immediately — Parallel):
├── Task 1: Update plan-md-only hook (Unblocks subagents)
└── Task 2: Fix QA → Plan-Reviewer across all Planner files

Wave 2 (After Wave 1 — Parallel):
├── Task 3: Update Plan Template + Planning Swarm Dispatch
└── Task 4: Update Builder Prompt (Context Pack + Rescue Path)
\`\`\`

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | None | 4 |
| 4 | None (independent) | None | 3 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | task(category="quick", load_skills=[]) |
| 2 | 3, 4 | task(category="unspecified-high", load_skills=[]) |

---

## TODOs

- [x] 1. Update plan-md-only hook to allow conditional subagent writes

  **What to do**:
  - Modify `src/hooks/plan-md-only/constants.ts`:
    - Add `ARTIFACT_SUBAGENTS`: all non-implementer subagents (everything except planner + executors/implementers)
    - Add `ARTIFACT_WRITE_SUBAGENTS`: subset expected to WRITE artifacts (pm/sm/po/architect/ux-design-expert/analyst/devops/data-engineer/squad-creator)
    - Add `ARTIFACT_GENERATION_WARNING`: tells subagents they may write artifact files within their authorized directories and must not write implementation code
    - Keep `PLANNING_CONSULT_WARNING` for consult-only agents
  - Modify `src/hooks/plan-md-only/index.ts`:
    - In the `TASK_TOOLS.includes(toolName)` check, extract the `subagent_type` from args (fallback: parse prompt).
    - If the target is in `ARTIFACT_WRITE_SUBAGENTS`, inject `ARTIFACT_GENERATION_WARNING`.
    - Otherwise, inject `PLANNING_CONSULT_WARNING`.

  **Must NOT do**:
  - Do not change the block that prevents Planner from writing files directly.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple conditional logic modification in existing hook.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1
  - **Blocks**: 2
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):
  - `src/hooks/plan-md-only/constants.ts:14-33` — Current `PLANNING_CONSULT_WARNING` definition
  - `src/hooks/plan-md-only/index.ts:116-127` — Where the warning is injected indiscriminately via `TASK_TOOLS.includes(toolName)`
  - `src/hooks/plan-md-only/index.ts:66` — `TASK_TOOLS = ["task", "call_kord_agent"]`

  **Acceptance Criteria**:

  - [ ] `ARTIFACT_GENERATION_WARNING` exported from constants.ts
  - [ ] `index.ts` conditionally injects the correct warning based on target subagent
  - [ ] `bun test src/hooks/plan-md-only/index.test.ts` passes

  **Agent-Executed QA Scenarios**:
  \`\`\`
  Scenario: Hook injects correct warning for PM agent
    Tool: Bash (grep)
    Preconditions: Code updated
    Steps:
      1. Create a dummy test script that invokes the hook with tool="task" and prompt containing "subagent_type='pm'"
      2. Assert the output prompt contains the ARTIFACT_GENERATION_WARNING text
    Expected Result: PM receives artifact generation permission, not read-only block
  \`\`\`

- [x] 2. Fix QA → Plan-Reviewer across all Planner prompt files

  **What to do**:
  - Modify `src/agents/plan/high-accuracy-mode.ts`:
    - Line 19: Change `subagent_type="qa"` → `subagent_type="plan-reviewer"`
    - Replace all textual "QA" references with "Plan Reviewer" where they refer to plan validation (NOT implementation testing)
  - Modify `src/agents/plan/plan-generation.ts`:
    - Line 34: `"QA review"` → `"Plan Reviewer"`
    - Line 36: `"Submit to QA"` → `"Submit to Plan Reviewer"`
    - Line 208: `"Have QA rigorously verify"` → `"Have Plan Reviewer rigorously verify"`
    - Line 217: `"Enter QA loop"` → `"Enter Plan Reviewer loop"`
  - Modify `src/hooks/plan-md-only/constants.ts`:
    - Lines 60-62: In `PLAN_WORKFLOW_REMINDER`, change step 4 from `QA REVIEW` / `task(subagent_type="qa", ...)` → `PLAN REVIEWER` / `task(subagent_type="plan-reviewer", ...)`

  **Must NOT do**:
  - Do NOT change references to QA that relate to implementation/code testing (those are correct)
  - Do NOT alter the QA agent itself (`qa.ts`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Search-and-replace text changes across 3 files. No logic changes.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: 3
  - **Blocked By**: None

  **References**:
  - `src/agents/plan/high-accuracy-mode.ts:19` — QA invocation (`subagent_type="qa"`)
  - `src/agents/plan/plan-generation.ts:34,36,208,217` — TodoWrite and Choice references to "QA"
  - `src/hooks/plan-md-only/constants.ts:60-62` — `PLAN_WORKFLOW_REMINDER` step 4

  **Acceptance Criteria**:
  - [ ] Zero occurrences of `subagent_type="qa"` in `src/agents/plan/`
  - [ ] `plan-generation.ts` references "Plan Reviewer" for plan validation
  - [ ] `PLAN_WORKFLOW_REMINDER` references `plan-reviewer`
  - [ ] `bun run build` passes

  **Commit**: YES
  - Message: `fix(planner): use plan-reviewer instead of qa for plan validation`
  - Files: `src/agents/plan/high-accuracy-mode.ts`, `src/agents/plan/plan-generation.ts`, `src/hooks/plan-md-only/constants.ts`
  - Pre-commit: `bun run build`

- [x] 3. Update Plan Template, Interview Mode, and Plan Generation with Planning Swarm

  **What to do**:
  - Modify `src/agents/plan/plan-template.ts`:
    - Insert `## Project Artifacts` section between `## Context` (line 48) and `## Work Objectives` (line 50)
    - Table template: `| Artifact | Agent | Path | Status |`
  - Modify `src/agents/plan/plan-generation.ts`:
    - Enforce final order: Plan Analyzer -> v0 -> Decision Research Swarm -> Artifact Generation Swarm -> v1
    - Include conditional Dispatch Table mapping needs to artifact writers (pm, architect, ux-design-expert, data-engineer, devops, squad-creator), then SM, then PO
    - Complexity gating rule: *"For Trivial/Simple intents, SKIP the Planning Swarm. Only Medium+ complexity triggers full orchestration."*
    - SM called LAST (after all artifact agents), PO validates AFTER SM
    - Artifact agents are invoked via `task(subagent_type=..., run_in_background=true, prompt="Write to <explicit path>...")` and must write real files
  - Modify `src/agents/plan/interview-mode.ts`:
    - Align Planning Swarm recommendation table with dispatch gating ("When it applies") and keep decision research under planner orchestration via librarian/explore

  **Must NOT do**:
  - Do NOT remove existing Plan Analyzer or Plan Reviewer loops
  - Do NOT change `behavioral-summary.ts` or `identity-constraints.ts`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Careful prompt engineering across 3 template files.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: None
  - **Blocked By**: 1, 2

  **References**:
  - `src/agents/plan/plan-template.ts:48-50` — Insert point (between Context and Work Objectives)
  - `src/agents/plan/plan-generation.ts:57-86` — Plan Analyzer section (insert Swarm BEFORE)
  - `src/agents/plan/interview-mode.ts:17-24` — Intent types table
   - Agent write paths: `pm→docs/kord/prds/`, `sm/po→docs/kord/stories/`, `architect→docs/kord/adrs/`, `ux→docs/`, `data-engineer→supabase/`, `devops→docs/kord/runs/`, `squad-creator→.opencode/squads/`

  **Acceptance Criteria**:
  - [ ] `plan-template.ts` contains `## Project Artifacts` table
  - [ ] `plan-generation.ts` contains two-pass planning flow and conditional Dispatch Table
  - [ ] `plan-generation.ts` contains complexity gating (skip for Trivial/Simple)
  - [ ] `interview-mode.ts` maps agents to intent types
  - [ ] `bun run build` passes

  **Commit**: YES
  - Message: `feat(planner): implement planning swarm with complexity-conditional dispatch`
  - Files: `src/agents/plan/plan-template.ts`, `plan-generation.ts`, `interview-mode.ts`
  - Pre-commit: `bun run build`

- [x] 4. Update Builder Prompt for Context Pack and Rescue Path

  **What to do**:
  - Modify `src/agents/builder/default.ts`:
    - Update `## 6. CONTEXT` section in `<delegation_system>`. Add a requirement: `### Business Intent\n[Extract 2-3 lines from Master Plan ## TL;DR and ## Work Objectives. Keep it strictly bounded to prevent hallucination.]`
    - Update `### 3.5 Handle Failures (USE RESUME)` in `<workflow>`. Add instruction: "If a task fails 3 times due to a fundamental technical blocker (not a simple bug), invoke `task(subagent_type="sm", prompt="...")` to renegotiate the story acceptance criteria before giving up."

  **Must NOT do**:
  - Do not change the `session_id` resume mechanics.

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Text manipulation in system prompts.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: 2

  **References** (CRITICAL - Be Exhaustive):
  - `src/agents/builder/default.ts:118-128` - Context section of delegation prompt
  - `src/agents/builder/default.ts:251-276` - Failure handling workflow

  **Acceptance Criteria**:

  - [ ] Builder prompt requires "Business Intent" injection
  - [ ] Builder prompt includes instructions for calling SM on 3x failure

  **Agent-Executed QA Scenarios**:
  \`\`\`
  Scenario: Builder prompt updated
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. grep -q "Business Intent" src/agents/builder/default.ts
      2. grep -q "renegotiate" src/agents/builder/default.ts
    Expected Result: Exit code 0
  \`\`\`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(hooks): add artifact generation permission for subagents` | `src/hooks/plan-md-only/*` | `bun test` |
| 2 | `feat(planner): implement planning swarm and artifact hub` | `src/agents/plan/*` | `bun run build` |
| 3 | `feat(builder): implement business intent context pack and rescue path` | `src/agents/builder/default.ts` | `bun run build` |

---

## Success Criteria

### Verification Commands
```bash
grep -q "ARTIFACT_GENERATION_WARNING" src/hooks/plan-md-only/constants.ts  # Expected: exit 0
grep -q "plan-reviewer" src/agents/plan/high-accuracy-mode.ts  # Expected: exit 0
grep -q "Business Intent" src/agents/builder/default.ts  # Expected: exit 0
bun run build  # Expected: exit 0
```

### Final Checklist
- [x] `plan-md-only` hook updated safely
- [x] Planner orchestrates ALL planning specialists (PM, SM, Architect, UX, DevOps, etc)
- [x] Master Plan links to artifacts
- [x] Builder injects bounded intent
- [x] All TypeScript builds pass
