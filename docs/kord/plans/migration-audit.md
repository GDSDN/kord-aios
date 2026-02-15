# Migration Audit — kord-aios (OMOC + Synkra Fusion)

## TL;DR

> **Quick Summary**: Comprehensive audit of the kord-aios migration/fusion from oh-my-opencode (engine) + synkra-aios (methodology). Par-a-par comparison with source projects plus real execution testing to verify functional correctness AND framework design correctness. Report-only — findings documented, no inline fixes.
>
> **Deliverables**:
> - Audit findings report per block (7 blocks)
> - Gap inventory: what was migrated correctly, what's broken, what's missing, what was intentionally dropped
> - Story-driven E2E validation: proof that the framework's core workflow functions end-to-end
> - Documentation issues inventory: branding, links, copy-paste content flagged for rewrite
>
> **Estimated Effort**: XL (7 sequential blocks, each requiring deep investigation + execution testing)
> **Parallel Execution**: YES — 7 waves, parallelism within waves
> **Critical Path**: Block 1 (Agents) → Block 2 (Hooks) → Block 5 (Story-Driven E2E) → Block 7 (Documentation)

---

## Context

### Original Request
Audit the kord-aios migration to verify that the fusion of oh-my-opencode (engine) and synkra-aios (methodology) was done correctly. The project was built WITHOUT using the framework itself, so there's no confidence that everything works as intended. Need to look at each block comparing against the original source projects to verify correctness.

### Interview Summary
**Key Discussions**:
- **Depth**: Not just "do tests pass" but "is the mental model correct for the fusion's purpose"
- **Method**: Par-a-par comparison with OMOC (D:\dev\oh-my-opencode) and Synkra (D:\dev\synkra-aios) as reference mirrors
- **Testing**: Real execution — create test stories, run /start-work, verify hooks fire
- **Skills**: 196 Synkra tasks were curated into 144 methodology skills — curated but needs review for completeness + usability
- **Exclusions**: Multi-IDE support intentionally dropped; other Synkra features need evaluation
- **Documentation**: Branding + rewrite + fix links (/master → main/dev)
- **Output**: Report only — no inline fixes during audit
- **Known Fixed Issues**: modelconfig menu→prompt, agent name conflicts (plan/build) with OpenCode built-in

**Research Findings**:
- Story-driven workflow has deep integration: tools, hooks, boulder state, delegation
- Previous gap analysis exists (docs/researches/omoc-aios-gap-analysis.md)
- Previous Wave 1 audit exists (docs/architecture/audit-wave1-installer-hooks-tools-mcp.md)
- ADR-0002 documents story-driven orchestration protocol
- OMOC had NO story-driven workflow (plan-based with .sisyphus/)
- Synkra had 196 tasks, 14 workflows, constitution, 3-layer quality gates, ADE pipeline

### Self-Review (Plan Analyzer Role)
**Identified Gaps** (addressed):
- Reporting format → defined as markdown findings sections per block
- "Correct enough" threshold → defined as verification criteria per task
- Skill audit scope → categorize all 144, deep-audit representative samples per category
- Documentation scope → fix all links/branding, flag content needing full rewrite

---

## Work Objectives

### Core Objective
Audit every major component of kord-aios against its source projects (OMOC + Synkra) to verify the fusion was done correctly, identify gaps, and document findings for future correction.

### Concrete Deliverables
- Audit findings report with severity ratings per finding
- Gap matrix: OMOC feature → kord-aios status, Synkra feature → kord-aios status
- Story-driven E2E test results (real execution evidence)
- Documentation issues inventory with specific file paths and line numbers

### Definition of Done
- [ ] All 7 audit blocks completed with findings documented
- [ ] Story-driven workflow validated via real execution
- [ ] All findings categorized: ✅ Correct | ⚠️ Needs Fix | ❌ Missing | 🚫 Intentionally Dropped
- [ ] No block left unaudited

### Must Have
- Par-a-par comparison for each block
- Real execution testing for story-driven E2E (Block 5)
- Specific file paths + line numbers in all findings
- Severity ratings (Critical / Medium / Low / Info)

### Must NOT Have (Guardrails)
- DO NOT modify source code during audit — report only
- DO NOT attempt to fix issues inline — document them
- DO NOT spend time auditing intentionally dropped features (multi-IDE, Docker MCP gateway)
- DO NOT run destructive commands that could corrupt project state
- DO NOT compare with features that never existed in either source project
- DO NOT add new features — this is audit, not enhancement
- DO NOT create artificial test infrastructure — use existing test commands and framework tools

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (bun test, 100+ test files)
- **Automated tests**: NO (this is an audit, not a development task)
- **Framework**: bun test for existing tests; real execution for E2E validation
- **Agent-Executed QA**: ALWAYS — the primary verification method

### Agent-Executed QA Approach for This Audit
Each block requires the executing agent to:
1. Read source project files (OMOC/Synkra) to understand the original
2. Read kord-aios equivalent to understand the current implementation
3. Compare: mental model, implementation approach, completeness
4. For Block 5: Actually execute the framework and capture evidence
5. Document findings with exact file paths, line numbers, severity

---

## Execution Strategy

### Block Dependency Chain

```
Block 1: Agents (foundation — everything depends on agents)
    ↓
Block 2: Hooks (control mechanisms — depend on agent understanding)
    ↓
Block 3: Tools (instruments — use hooks, serve agents)
    ↓
Block 4: Skills (methodology translation — agents USE skills)
    ↓
Block 5: Commands + Story-Driven E2E (integration test — uses ALL above)
    ↓
Block 6: CLI/Installer (entry point — installs everything above)
    ↓
Block 7: Documentation (describes everything above)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 (Agent Roster) | None | 4-6 | 2, 3 |
| 2 (Agent Prompts) | None | 4-6 | 1, 3 |
| 3 (Agent Registration) | None | 4-6 | 1, 2 |
| 4 (Hook Registration) | 1-3 | 7-8 | 5 |
| 5 (Story Hooks) | 1-3 | 11 | 4 |
| 6 (Build Hook) | 4-5 | 11 | — |
| 7 (Tool Registration) | 4-6 | 9 | 8 |
| 8 (Story/Plan Tools) | 4-6 | 11 | 7 |
| 9 (Skills Completeness) | 7-8 | 11 | 10 |
| 10 (Skill Loading) | 7-8 | 11 | 9 |
| 11 (Story E2E) | 5,6,8 | — | 12, 13 |
| 12 (Commands) | 9-10 | — | 11, 13 |
| 13 (Full Test Suite) | None | — | 11, 12 |
| 14 (CLI Installer) | 11-13 | — | 15 |
| 15 (Config System) | 11-13 | — | 14 |
| 16 (Doc Branding) | 14-15 | — | 17 |
| 17 (AGENTS.md) | 14-15 | — | 16 |

---

## TODOs

### Block 1: Agents Audit (Wave 1)

- [ ] 1. Agent Roster Par-a-Par Comparison

  **What to do**:
  - Map every agent in OMOC (`D:\dev\oh-my-opencode\src\agents\`) to its kord-aios equivalent (`D:\dev\kord-aios\src\agents\`)
  - Map every agent in Synkra (`D:\dev\synkra-aios\.aios-core\development\agents\`) to its kord-aios equivalent
  - For each agent compare: name, role, system prompt intent, model assignment, mode (primary/subagent)
  - Verify OMOC agent renames: Sisyphus→Kord, Atlas→Builder, Prometheus→Plan, Sisyphus-Junior→Dev-Junior, Oracle→Architect
  - Verify Synkra methodology agents exist: PM, PO, SM, QA, DevOps, Data Engineer, UX Design Expert, Analyst, Squad Creator
  - Check for agents in source but NOT in kord-aios (missing migration)
  - Check for agents in kord-aios that don't exist in either source (unexpected additions)
  - Verify agent modes match fusion design
  - Check agent model assignments and fallback chains match AGENTS.md

  **Must NOT do**:
  - Don't modify any agent files
  - Don't evaluate prompt quality subjectively — focus on structural correctness

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Thorough cross-project comparison with deep reading of multiple agent files
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4-6
  - **Blocked By**: None

  **References**:
  - `D:\dev\oh-my-opencode\src\agents\` — All OMOC agents
  - `D:\dev\synkra-aios\.aios-core\development\agents\` — All Synkra agents
  - `D:\dev\kord-aios\src\agents\utils.ts` — agentSources registry
  - `D:\dev\kord-aios\AGENTS.md` — Agent model table

  **Acceptance Criteria**:

  ```
  Scenario: Complete agent roster comparison
    Tool: Bash (grep + read)
    Steps:
      1. Read OMOC src/agents/utils.ts — extract agent registry
      2. List Synkra .aios-core/development/agents/ — all agent files
      3. Read kord-aios src/agents/utils.ts — extract agent registry
      4. Cross-reference each OMOC agent → kord-aios equivalent
      5. Cross-reference each Synkra agent → kord-aios equivalent
      6. Assert: No source agent missing without documentation
      7. Document findings with exact file paths
    Expected Result: Complete mapping table with status per agent
    Evidence: Findings documented inline
  ```

  **Commit**: NO (report only)

---

- [ ] 2. Agent Prompt Correctness Audit

  **What to do**:
  - For each agent with a system prompt:
    - Read the prompt and identify references to other agents, tools, workflows
    - Verify references are correct (no "Sisyphus" instead of "Kord")
    - Check for OMOC/Synkra/OmO branding leaks
    - Verify story-driven references exist where appropriate
    - Verify tool references exist
    - Check methodology agents match Synkra roles

  **Must NOT do**:
  - Don't rewrite prompts — only report issues

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 1 (with Tasks 1, 3)
  - **Blocks**: None directly
  - **Blocked By**: None

  **References**:
  - `D:\dev\kord-aios\src\agents\kord.ts` — Orchestrator
  - `D:\dev\kord-aios\src\agents\dev.ts` — Deep worker
  - `D:\dev\synkra-aios\.aios-core\development\agents\` — Synkra originals

  **Acceptance Criteria**:

  ```
  Scenario: Branding leak detection
    Tool: Bash (grep)
    Steps:
      1. Grep all .ts files in src/agents/ for branding terms
      2. Classify leaks
      3. Assert: No agent prompt sends OMOC/Synkra names to LLM
      4. Document with file:line references
    Expected Result: List of branding leaks
    Evidence: Grep output captured
  ```

  **Commit**: NO (report only)

---

- [ ] 3. Agent Registration and Factory Verification

  **What to do**:
  - Read `src/agents/utils.ts` — verify every factory is registered
  - Read `src/index.ts` — verify agents passed to plugin
  - Run `bun test src/agents/` — verify tests pass
  - Check agent modes conflicts
  - Verify display names map

  **Must NOT do**:
  - Don't modify registration code

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 1 (with Tasks 1, 2)
  - **Blocks**: None directly
  - **Blocked By**: None

  **Acceptance Criteria**:

  ```
  Scenario: Agent tests pass
    Tool: Bash
    Steps:
      1. Run: bun test src/agents/
      2. Assert: All tests pass
    Expected Result: Tests green
    Evidence: Terminal output captured
  ```

  **Commit**: NO (report only)

---

### Block 2: Hooks Audit (Wave 2)

- [ ] 4. Hook Registration and Lifecycle Verification

  **What to do**:
  - Read `src/hooks/index.ts` — list exported hooks
  - Read `src/index.ts` — trace registration
  - Compare against OMOC hooks
  - Verify execution order matches AGENTS.md
  - Check for unregistered hook directories
  - Run `bun test src/hooks/`
  - Identify renamed hooks

  **Must NOT do**:
  - Don't modify hook registration

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 2 (with Task 5)
  - **Blocks**: Tasks 7-8
  - **Blocked By**: Block 1

  **Acceptance Criteria**:

  ```
  Scenario: Hook tests pass
    Tool: Bash
    Steps:
      1. Run: bun test src/hooks/
      2. Assert: All tests pass
    Expected Result: Tests green
    Evidence: Terminal output captured
  ```

  **Commit**: NO (report only)

---

- [ ] 5. Story-Driven Hooks Deep Audit

  **What to do**:
  - Deep read `src/hooks/story-lifecycle/index.ts` — verify transitions & authority
  - Compare against Synkra story lifecycle
  - Deep read `src/hooks/quality-gate/index.ts` — compare against Synkra quality gates
  - Check `wave-checkpoint`, `agent-authority`, `executor-resolver`, `decision-logger` hooks
  - Verify these NEW methodology hooks are registered and firing

  **Must NOT do**:
  - Don't modify hook code

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 2 (with Task 4)
  - **Blocks**: Task 11
  - **Blocked By**: Block 1

  **Acceptance Criteria**:

  ```
  Scenario: New methodology hooks registration check
    Tool: Bash (grep)
    Steps:
      1. For each methodology hook: check import & instantiation in src/index.ts
      2. Assert: Imported, instantiated, AND connected to lifecycle
    Expected Result: All hooks verified
    Evidence: Registration trace captured
  ```

  **Commit**: NO (report only)

---

- [ ] 6. Build Hook (Orchestrator) Audit

  **What to do**:
  - Deep read `src/hooks/build/index.ts`
  - Compare against OMOC's atlas hook
  - Verify boulder state management
  - Check wave execution support
  - Check story-driven vs task-driven behavior
  - Verify delegation reminder
  - Read `src/hooks/start-work/index.ts`

  **Must NOT do**:
  - Don't modify build hook

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO — sequential after Tasks 4-5
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 4-5

  **Acceptance Criteria**:

  ```
  Scenario: Build hook tests pass
    Tool: Bash
    Steps:
      1. Run: bun test src/hooks/build/
      2. Assert: All tests pass
    Expected Result: Tests green
    Evidence: Terminal output captured
  ```

  **Commit**: NO (report only)

---

### Block 3: Tools Audit (Wave 3)

- [ ] 7. Tool Registration and Functionality Verification

  **What to do**:
  - Read `src/tools/index.ts` — list tool creators
  - Read `src/index.ts` — trace registration
  - Compare against OMOC tools
  - Check renames
  - Verify new methodology tools
  - Run `bun test src/tools/`

  **Must NOT do**:
  - Don't modify tool code

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 3 (with Task 8)
  - **Blocks**: Task 9
  - **Blocked By**: Block 2

  **Acceptance Criteria**:

  ```
  Scenario: Tool tests pass
    Tool: Bash
    Steps:
      1. Run: bun test src/tools/
      2. Assert: All tests pass
    Expected Result: Tests green
    Evidence: Terminal output captured
  ```

  **Commit**: NO (report only)

---

- [ ] 8. Story/Plan Tools Deep Audit

  **What to do**:
  - Deep read story_read, story_update, plan_read tools
  - Verify story parsing matches Synkra template format
  - Check delegate-task story_path propagation
  - Verify shared types

  **Must NOT do**:
  - Don't modify tool code

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 3 (with Task 7)
  - **Blocks**: Task 11
  - **Blocked By**: Block 2

  **Acceptance Criteria**:

  ```
  Scenario: Story/plan tool tests pass
    Tool: Bash
    Steps:
      1. Run: bun test src/tools/story-read/ src/tools/story-update/ src/tools/plan-read/
      2. Assert: All pass
    Expected Result: Tests green
    Evidence: Terminal output captured
  ```

  **Commit**: NO (report only)

---

### Block 4: Skills Audit (Wave 4)

- [ ] 9. Methodology Skills Completeness Audit

  **What to do**:
  - List all 144 methodology skills
  - List all 196 Synkra tasks
  - Create mapping: Synkra task → kord-aios skill
  - Identify curated-out tasks (check criticality)
  - Sample 3 skills per category: deep read for quality & branding
  - Check hardcoded skills
  - Verify loading in opencode-skill-loader

  **Must NOT do**:
  - Don't modify skills
  - Don't deep audit all 144 skills (use sampling)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 4 (with Task 10)
  - **Blocks**: Task 11
  - **Blocked By**: Block 3

  **Acceptance Criteria**:

  ```
  Scenario: Skills inventory mapping
    Tool: Bash
    Steps:
      1. List skills
      2. List Synkra tasks
      3. Map and identify gaps
    Expected Result: Mapping table
    Evidence: Table captured
  ```

  **Commit**: NO (report only)

---

- [ ] 10. Skill Loading and Usability Verification

  **What to do**:
  - Read skill loader — verify paths & loading logic
  - Check YAML frontmatter parsing
  - Verify prompt injection
  - Run skill-related tests

  **Must NOT do**:
  - Don't modify loading code

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 4 (with Task 9)
  - **Blocks**: Task 11
  - **Blocked By**: Block 3

  **Acceptance Criteria**:

  ```
  Scenario: Skill loading tests
    Tool: Bash
    Steps:
      1. Run: bun test src/features/opencode-skill-loader/
      2. Assert: All pass
    Expected Result: Tests green
    Evidence: Terminal output captured
  ```

  **Commit**: NO (report only)

---

### Block 5: Commands + Story-Driven E2E (Wave 5)

- [ ] 11. Story-Driven Workflow E2E Execution Test

  **What to do**:
  - **CRITICAL**: Real execution test
  1. Run E2E tests: `bun test tests/e2e/story-lifecycle.test.ts`
  2. Trace full lifecycle flow in code
  3. Verify Synkra constitution enforcement (Article III, Article II)
  4. Check end-to-end data flow
  5. Run ALL related tests: build, story hooks, start-work

  **Must NOT do**:
  - Don't modify any code
  - Don't create permanent test fixtures

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO — sequential
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 6, 8

  **Acceptance Criteria**:

  ```
  Scenario: E2E story lifecycle tests pass
    Tool: Bash
    Steps:
      1. Run: bun test tests/e2e/story-lifecycle.test.ts
      2. Assert: All tests pass
    Expected Result: E2E tests green
    Evidence: Terminal output captured
  ```

  **Commit**: NO (report only)

---

- [ ] 12. Slash Commands Audit

  **What to do**:
  - List all slash commands
  - Compare against OMOC
  - Verify templates exist and are registered
  - Verify custom command loading

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 5
  - **Blocked By**: Block 4

  **Acceptance Criteria**:

  ```
  Scenario: Command registration completeness
    Tool: Bash (reading)
    Steps:
      1. List registered commands
      2. List templates
      3. Assert: 1:1 mapping
    Expected Result: Command audit table
    Evidence: Table captured
  ```

  **Commit**: NO (report only)

---

- [ ] 13. Full Test Suite Execution

  **What to do**:
  - Run `bun test`
  - Run `bun run typecheck`
  - Run `bun run build`
  - Document results

  **Must NOT do**:
  - Don't fix failing tests

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 5
  - **Blocked By**: None

  **Acceptance Criteria**:

  ```
  Scenario: Full suite run
    Tool: Bash
    Steps:
      1. Run full test suite & build
      2. Capture output
    Expected Result: Test/build results
    Evidence: Full terminal output captured
  ```

  **Commit**: NO (report only)

---

### Block 6: CLI/Installer Audit (Wave 6)

- [ ] 14. CLI Installer Par-a-Par Audit

  **What to do**:
  - Compare kord-aios installer vs OMOC installer
  - Check branding ("Kord AIOS")
  - Check config output paths
  - Check provider list
  - Verify all CLI commands registered
  - Check doctor command functionality
  - Check scaffolder templates

  **Must NOT do**:
  - Don't run installer (modifies system)
  - Don't modify code

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 6
  - **Blocked By**: Block 5

  **Acceptance Criteria**:

  ```
  Scenario: Installer branding audit
    Tool: Bash (grep)
    Steps:
      1. Grep src/cli/ for old branding
      2. Check user-facing strings
    Expected Result: Branding verification
    Evidence: Grep results captured
  ```

  **Commit**: NO (report only)

---

- [ ] 15. Config System Audit

  **What to do**:
  - Read config schema — verify fields
  - Check new story-driven fields
  - Compare against OMOC schema
  - Run config tests

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 6
  - **Blocked By**: Block 5

  **Acceptance Criteria**:

  ```
  Scenario: Config tests pass
    Tool: Bash
    Steps:
      1. Run config tests
      2. Assert: Pass
    Expected Result: Tests green
    Evidence: Terminal output captured
  ```

  **Commit**: NO (report only)

---

### Block 7: Documentation Audit (Wave 7)

- [ ] 16. Documentation Branding and Links Audit

  **What to do**:
  - Scan ALL docs/ for branding leaks
  - Scan for /master links
  - Scan for old agent names
  - Scan README.md links
  - Categorize docs: Original | Needs Fix | Needs Rewrite

  **Must NOT do**:
  - Don't modify docs

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 7
  - **Blocked By**: Block 6

  **Acceptance Criteria**:

  ```
  Scenario: Branding leak scan
    Tool: Bash (grep)
    Steps:
      1. Grep docs/ for branding terms
      2. Check all README links
      3. Classify matches
    Expected Result: Branding audit report
    Evidence: Grep results captured
  ```

  **Commit**: NO (report only)

---

- [ ] 17. AGENTS.md Correctness Audit

  **What to do**:
  - Read every AGENTS.md
  - Verify accuracy against directory contents
  - Verify branding
  - Verify file references

  **Must NOT do**:
  - Don't modify AGENTS.md files

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES — Wave 7
  - **Blocked By**: Block 6

  **Acceptance Criteria**:

  ```
  Scenario: AGENTS.md accuracy verification
    Tool: Bash (read + compare)
    Steps:
      1. For each AGENTS.md: compare against actual files
      2. Check line counts
    Expected Result: Accuracy report
    Evidence: Comparison results captured
  ```

  **Commit**: NO (report only)

---

## Commit Strategy

No commits during this audit. All tasks are report-only.

---

## Success Criteria

### Verification Commands
```bash
bun test                  # Expected: captures current test status
bun run typecheck         # Expected: type checks pass
bun run build             # Expected: build succeeds
```

### Final Checklist
- [ ] All 7 blocks completed with documented findings
- [ ] Every finding has: severity, exact file path, description, recommendation
- [ ] Story-driven E2E flow validated (Block 5)
- [ ] Skills mapping against Synkra tasks documented (Block 4)
- [ ] All branding leaks catalogued (Blocks 1-7)
- [ ] Broken documentation links catalogued (Block 7)
- [ ] Full test suite results captured (Block 5, Task 13)
- [ ] No source code was modified during the audit
