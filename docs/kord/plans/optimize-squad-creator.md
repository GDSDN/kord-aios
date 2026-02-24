# Optimize Squad Creator Trigger Conditions

> NOTE: This plan is superseded by `docs/kord/plans/refactor-squad-creator.md`.
> Use that plan as the single source of truth; this file is kept for historical context around the original over-triggering report.

## TL;DR

> **Quick Summary**: Fix the over-triggering of the `squad-creator` agent during general investigation, debugging, and planning sessions by hardening its trigger conditions across the planner prompts and agent metadata.
> 
> **Deliverables**:
> - Updated `squadCreatorPromptMetadata` in `src/agents/squad-creator.ts`
> - Hardened planner dispatch conditions in `src/agents/plan/interview-mode.ts`
> - Hardened planner dispatch conditions in `src/agents/plan/plan-generation.ts`
> 
> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential
> **Critical Path**: Update Planner files → Update Agent metadata → Test

---

## Context

### Original Request
The user reported that the squad generator (`squad-creator`) is mistakenly generating `SQUAD.yaml` files when making plans, investigating, or debugging, even when not requested. The user suspects a "Synkra reference" needs optimization.

### Interview Summary
**Key Discussions**:
- Direct analysis confirmed the word "synkra" doesn't trigger this in the agent code.
- The actual cause is the `Plan` agent's dispatch tables, which use loose matching conditions like *"A new specialist squad is required"*.
- The LLM interprets requests like "I need to investigate this bug" as requiring an "investigation squad".

**Research Findings**:
- The loose trigger conditions were found in `src/agents/plan/interview-mode.ts` (line 49) and `src/agents/plan/plan-generation.ts` (line 139).
- The `squadCreatorPromptMetadata` (`src/agents/squad-creator.ts`) needs strict `avoidWhen` rules to explicitly block general debugging and planning tasks.

### Analyst Review
**Identified Gaps** (addressed):
- **False assumption about "Synkra"**: The user suspected a legacy string ("synkra") was causing the issue. The real issue is prompt ambiguity in the swarm dispatch table. We will fix the actual root cause (the prompts).

---

## Project Artifacts

| Artifact | Agent | Path | Status |
|----------|-------|------|--------|

*(No specialized artifacts required for this quick optimization).*

---

## Decision Points

*(None required. Trivial intent to harden agent trigger strings).*

---

## Work Objectives

### Core Objective
Stop the `squad-creator` agent from generating unsolicited squads during debugging and planning by making its trigger criteria strictly explicit.

### Concrete Deliverables
- Modified `src/agents/plan/interview-mode.ts`
- Modified `src/agents/plan/plan-generation.ts`
- Modified `src/agents/squad-creator.ts`

### Definition of Done
- [ ] Planner table triggers are updated to require explicit user request ("ONLY when explicitly requested...").
- [ ] Agent metadata strictly rejects generic troubleshooting tasks in its `avoidWhen` property.

### Must Have
- Explicit "EXPLICITLY requested" language in the `When it applies` columns.
- `avoidWhen` updates in `squad-creator.ts`.

### Must NOT Have (Guardrails)
- Do NOT change the functional logic or schema of the squad generator itself.
- Do NOT modify any legacy `.md` plan files; only change source `.ts` prompts.

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: YES (after)
- **Framework**: bun test

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

\`\`\`
Scenario: Verify Plan generation files are updated
  Tool: Bash (grep)
  Preconditions: Files modified
  Steps:
    1. grep -i "EXPLICITLY requested" src/agents/plan/interview-mode.ts
    2. grep -i "EXPLICITLY requested" src/agents/plan/plan-generation.ts
    3. grep -i "investigating" src/agents/squad-creator.ts
  Expected Result: Match found ensuring the text was applied.
  Failure Indicators: Empty output.
  Evidence: Terminal output captured
\`\`\`

\`\`\`
Scenario: TypeScript Compilation passes
  Tool: Bash (bun)
  Preconditions: None
  Steps:
    1. bun run typecheck
  Expected Result: Typecheck passes without errors related to the modified files.
  Failure Indicators: TypeScript compilation errors
  Evidence: Terminal output captured
\`\`\`

---

## Execution Strategy

### Parallel Execution Waves

\`\`\`
Wave 1 (Start Immediately):
└── Task 1: Update squad-creator trigger conditions across all three files.
\`\`\`

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | task(category="quick", load_skills=["git-master"], run_in_background=false) |

---

## TODOs

- [ ] 1. Update squad-creator dispatch conditions

  **What to do**:
  - In \`src/agents/plan/interview-mode.ts\`, replace the \`When it applies\` column for the Squad manifest row with \`ONLY when EXPLICITLY requested by user ("create squad")\` or similar explicit wording.
  - In \`src/agents/plan/plan-generation.ts\`, make the identical replacement for the Artifact Generation Swarm table.
  - In \`src/agents/squad-creator.ts\`, update \`squadCreatorPromptMetadata\`:
    - Add to \`avoidWhen\`: \`"General planning, investigating, debugging, or routine tasks. DO NOT trigger unless user specifically asks to create a squad."\`
    - Modify \`keyTrigger\`: \`"ONLY when user explicitly types 'create squad', 'generate SQUAD.yaml', or explicitly asks for a new agent team."\`

  **Must NOT do**:
  - Do NOT change the \`subagent\` field name or Output Path mapping, only the trigger condition string.

  **Recommended Agent Profile**:
  - **Category**: \`quick\`
    - Reason: This is a straightforward text replacement across three files.
  - **Skills**: \`git-master\`
    - \`git-master\`: For creating atomic commits for the prompt optimizations.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):
  - \`src/agents/plan/interview-mode.ts:49\` - Planning Swarm table.
  - \`src/agents/plan/plan-generation.ts:139\` - Artifact generation table.
  - \`src/agents/squad-creator.ts:22-41\` - Agent metadata for triggers.

  **Acceptance Criteria**:
  - [ ] Modified `src/agents/plan/interview-mode.ts`
  - [ ] Modified `src/agents/plan/plan-generation.ts`
  - [ ] Modified `src/agents/squad-creator.ts`
  - [ ] \`bun run typecheck\` → PASS

  **Agent-Executed QA Scenarios**:
  \`\`\`
  Scenario: TypeScript Compilation passes
    Tool: Bash (bun)
    Preconditions: Files updated
    Steps:
      1. run \`bun run typecheck\`
      2. Assert exit code 0
    Expected Result: No TS errors
    Evidence: Terminal output captured

  Scenario: Text verification
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. run \`grep -i "EXPLICITLY" src/agents/plan/interview-mode.ts\`
      2. Assert exit code 0
    Expected Result: The string exists in the modified file
    Evidence: Terminal output captured
  \`\`\`

  **Commit**: YES
  - Message: \`fix(agents): harden squad-creator trigger to prevent unwanted YAML generation\`
  - Files: \`src/agents/plan/interview-mode.ts\`, \`src/agents/plan/plan-generation.ts\`, \`src/agents/squad-creator.ts\`
  - Pre-commit: \`bun run typecheck\`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | \`fix(agents): harden squad-creator trigger to prevent unwanted YAML generation\` | src/agents/plan/*.ts, src/agents/squad-creator.ts | bun run typecheck |

---

## Success Criteria

### Verification Commands
\`\`\`bash
bun run typecheck  # Expected: Clean compilation output
bun test src/agents  # Expected: PASS tests
\`\`\`

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
