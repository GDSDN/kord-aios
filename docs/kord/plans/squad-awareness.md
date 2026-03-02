# Squad Awareness Injection for Orchestrators

## TL;DR

> **Quick Summary**: Wire the existing (but orphaned) `buildSquadPromptSection()` into orchestrator agent prompts so kord, planner, and builder know which squads exist and how to delegate to them — following the same boot-time injection pattern used for skills.
> 
> **Deliverables**:
> - Squad awareness section dynamically injected into kord, dev (hephaestus), and builder prompts
> - Planner prompt also receives squad awareness
> - Unit tests for section generation (0, 1, N squads)
> - All gates pass: `bun test`, `bun run typecheck`, `bun run build`
> 
> **Estimated Effort**: Short (2-4h)
> **Parallel Execution**: NO — sequential (3 tasks, each depends on the previous)
> **Critical Path**: Task 1 → Task 2 → Task 3

---

## Context

### Original Request
Orchestrators (kord, planner, builder) are currently squad-blind — they have no idea which squads exist or what they do. When a user creates marketing and product squads, planner cannot reason about which squad should handle which part of a work plan.

### Interview Summary
**Key Discussions**:
- Planner should delegate to squad chiefs (not individual workers)
- Squad awareness should be dynamically generated from loaded SQUAD.yaml manifests (zero config)
- Include delegation protocol: `task(subagent_type="squad-{name}-chief")`
- Inject into kord + planner + builder only
- This is Phase 1 — Phase 2 (squad execution/planning/sub-boulder) is a separate future effort

**Research Findings**:
- `buildSquadPromptSection()` already exists in `src/features/squad/factory.ts` (lines 188-262) but is **never called** — it's an orphaned function
- Skills injection pattern: `SKILLS_PROTOCOL_SECTION` in `prompt-snippets.ts`, injected via `buildAgent()` and directly in `createKordAgent()`
- Squad loading happens in `config-handler.ts` via `loadAllSquads()` → `createAllSquadAgentConfigs()`
- Architect recommendation: thread squads through `createBuiltinAgents()` to orchestrator factories, wrap output in `<Squad_Awareness>` XML tag

### Architect Review
**Key Recommendations**:
1. Keep generation in `factory.ts` (co-located with squad logic, dynamic not static)
2. Thread squads through `createBuiltinAgents()` → `createKordAgent()` / `createDevAgent()` / `createBuilderAgent()`
3. Planner assembled separately in config-handler — append there directly
4. Wrap in `<Squad_Awareness>` XML tag (matches kord prompt style: `<Behavior_Instructions>`, `<Tone_and_Style>`)
5. Risk: minimal — 20-50 lines per squad set, no circular references

---

## Work Objectives

### Core Objective
Make orchestrator agents aware of available squads so they can intelligently delegate work to squad chiefs.

### Concrete Deliverables
- `createBuiltinAgents()` accepts `squads` parameter and passes it to orchestrator factories
- `createKordAgent()`, `createDevAgent()`, `createBuilderAgent()` receive squads and inject awareness section
- Planner prompt in `config-handler.ts` receives squad awareness
- Unit tests cover section generation edge cases

### Definition of Done
- [ ] `bun test` passes (all existing + new tests)
- [ ] `bun run typecheck` passes
- [ ] `bun run build` passes
- [ ] Kord prompt contains squad awareness when squads are loaded
- [ ] Planner prompt contains squad awareness when squads are loaded
- [ ] Builder prompt contains squad awareness when squads are loaded
- [ ] No awareness section injected when 0 squads loaded

### Must Have
- Dynamic generation from loaded manifests (zero config)
- Delegation protocol guidance (`task(subagent_type="squad-{name}-chief")`)
- Squad table with name, domain, agents, chief
- Graceful handling of 0 squads (no section injected)

### Must NOT Have (Guardrails)
- Do NOT add a `squad` parameter to `task()` tool (Phase 2)
- Do NOT implement sub-boulder mechanism (Phase 2)
- Do NOT add squad artifact namespaces (Phase 2)
- Do NOT modify squad loading/discovery logic
- Do NOT change squad agent registration or naming
- Do NOT add dependencies

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks verifiable by running commands only.

### Test Decision
- **Infrastructure exists**: YES (bun:test)
- **Automated tests**: YES (tests-after)
- **Framework**: bun test

### Agent-Executed QA Scenarios (MANDATORY)

```
Scenario: Squad awareness appears in kord prompt when squads loaded
  Tool: Bash (bun test)
  Steps:
    1. Run `bun test src/features/squad/squad-awareness.test.ts`
    2. Assert: test "kord prompt contains squad awareness section" passes
  Expected Result: Test passes with squad section present in kord config prompt

Scenario: No squad awareness when 0 squads loaded
  Tool: Bash (bun test)
  Steps:
    1. Run `bun test src/features/squad/squad-awareness.test.ts`
    2. Assert: test "no awareness section when 0 squads" passes
  Expected Result: Empty string returned, no injection

Scenario: Full gate verification
  Tool: Bash
  Steps:
    1. `bun test` → 0 failures
    2. `bun run typecheck` → 0 errors
    3. `bun run build` → success
  Expected Result: All gates green
```

---

## Execution Strategy

### Sequential Execution (3 tasks)

```
Task 1: Thread squads through createBuiltinAgents → orchestrator factories
  ↓
Task 2: Inject awareness into planner prompt in config-handler
  ↓
Task 3: Unit tests + verification
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | None | 2, 3 |
| 2 | 1 | 3 |
| 3 | 1, 2 | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agent |
|------|-------|-------------------|
| 1 | 1, 2, 3 | task(category="unspecified-low", load_skills=[], run_in_background=false) — single sequential task |

---

## TODOs

- [ ] 1. Thread squads through createBuiltinAgents → inject into kord, dev, builder prompts

  **What to do**:
  - Add `squads?: LoadedSquad[]` parameter to `createBuiltinAgents()` in `src/agents/utils.ts` (after `disabledSkills`)
  - Pass `squadLoadResult.squads` from `config-handler.ts` when calling `createBuiltinAgents()` (squads are loaded at line 424, but `createBuiltinAgents()` is called earlier at line 206 — need to move squad loading BEFORE `createBuiltinAgents()` call, OR pass squads post-hoc)
  - In `createKordAgent()` (`src/agents/kord.ts`): add `squads?: LoadedSquad[]` param, call `buildSquadPromptSection(squads ?? [])`, wrap in `<Squad_Awareness>` tag, append to prompt (after `SKILLS_PROTOCOL_SECTION`)
  - In `createDevAgent()` (`src/agents/dev.ts`): same pattern — add squads param, inject awareness section
  - In `createBuilderAgent()` (`src/agents/builder/index.ts`): same pattern — add squads param, inject awareness section
  - Guard: if `buildSquadPromptSection()` returns `""`, do NOT append the `<Squad_Awareness>` wrapper either
  - Import `buildSquadPromptSection` from `src/features/squad/factory` and `LoadedSquad` type from `src/features/squad/loader`

  **Must NOT do**:
  - Do NOT modify `buildSquadPromptSection()` itself (it already works correctly)
  - Do NOT change squad loading order in config-handler beyond what's needed for timing
  - Do NOT inject awareness into non-orchestrator agents (PM, QA, etc.)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Plumbing task — threading a parameter through existing call chain
  - **Skills**: `[]`
    - No specialized skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/agents/utils.ts:291-303` — `createBuiltinAgents()` signature: add `squads` param here
  - `src/agents/utils.ts:440-446` — `createKordAgent()` call site: pass squads here
  - `src/agents/utils.ts:487-493` — `createDevAgent()` call site: pass squads here
  - `src/agents/utils.ts:538-543` — `createBuilderAgent()` call site: pass squads here
  - `src/agents/kord.ts:580-614` — `createKordAgent()` function: add squads param, inject into prompt
  - `src/agents/kord.ts:595` — `SKILLS_PROTOCOL_SECTION` append: squad awareness goes right after this
  - `src/agents/dev.ts` — `createDevAgent()` function: same injection pattern as kord
  - `src/agents/builder/index.ts` — `createBuilderAgent()`: uses `OrchestratorContext`, add squads to context

  **API/Type References**:
  - `src/features/squad/factory.ts:188-262` — `buildSquadPromptSection(squads: LoadedSquad[]): string` — the function to call (already exists, orphaned)
  - `src/features/squad/loader.ts` — `LoadedSquad` type definition

  **Config Handler Timing References**:
  - `src/plugin-handlers/config-handler.ts:206-218` — `createBuiltinAgents()` call (line 206)
  - `src/plugin-handlers/config-handler.ts:424-430` — `loadAllSquads()` call (line 424) — currently AFTER createBuiltinAgents. Either move it before, or inject squads into already-built agent configs post-hoc.

  **Acceptance Criteria**:
  - [ ] `createBuiltinAgents()` accepts `squads` parameter
  - [ ] `createKordAgent()` prompt includes `<Squad_Awareness>` section when squads present
  - [ ] `createDevAgent()` prompt includes `<Squad_Awareness>` section when squads present
  - [ ] `createBuilderAgent()` prompt includes `<Squad_Awareness>` section when squads present
  - [ ] No `<Squad_Awareness>` tag when 0 squads
  - [ ] `bun run typecheck` passes

  **Commit**: YES
  - Message: `feat(squad): inject squad awareness into orchestrator agent prompts`
  - Files: `src/agents/utils.ts`, `src/agents/kord.ts`, `src/agents/dev.ts`, `src/agents/builder/index.ts`, `src/plugin-handlers/config-handler.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 2. Inject squad awareness into planner prompt

  **What to do**:
  - In `src/plugin-handlers/config-handler.ts`: where the planner agent config is assembled (using `PLAN_SYSTEM_PROMPT`), append `buildSquadPromptSection()` output wrapped in `<Squad_Awareness>` tag
  - Squad data is already loaded at line 424 (`squadLoadResult.squads`) — use it when assembling planner config
  - Guard: only append if squads are non-empty
  - Import `buildSquadPromptSection` from `src/features/squad/factory`

  **Must NOT do**:
  - Do NOT modify the Plan agent's core prompt files (`src/agents/plan/`)
  - Do NOT inject into non-orchestrator methodology agents

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-file change, small append
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/plugin-handlers/config-handler.ts:418-460` — Planner config assembly area (look for `PLAN_SYSTEM_PROMPT` usage)
  - `src/plugin-handlers/config-handler.ts:424-430` — `squadLoadResult` already available here

  **API/Type References**:
  - `src/features/squad/factory.ts:188` — `buildSquadPromptSection()` function
  - `src/agents/plan/index.ts` — `PLAN_SYSTEM_PROMPT` export

  **Acceptance Criteria**:
  - [ ] Planner prompt includes `<Squad_Awareness>` section when squads present
  - [ ] No `<Squad_Awareness>` in planner prompt when 0 squads
  - [ ] `bun run typecheck` passes

  **Commit**: YES (group with Task 1)
  - Message: `feat(squad): inject squad awareness into orchestrator agent prompts`
  - Files: `src/plugin-handlers/config-handler.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 3. Unit tests for squad awareness injection

  **What to do**:
  - Create `src/features/squad/squad-awareness.test.ts` with tests:
    - `buildSquadPromptSection([])` returns `""`
    - `buildSquadPromptSection([oneSquad])` returns formatted section with squad name, description, agents, chief, delegation syntax
    - `buildSquadPromptSection([squad1, squad2])` returns section with both squads listed
    - Section includes "How to Delegate" guidance with `task(subagent_type=...)`
    - Section includes chief agent reference
  - Verify `createKordAgent()` prompt includes squad awareness when squads passed (mock-free: call factory directly with test squads and inspect output)
  - Run full verification gates

  **Must NOT do**:
  - Do NOT test config-handler integration (already covered by existing tests)
  - Do NOT mock squad loading

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Writing tests for existing function + verifying injection
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 2)
  - **Blocks**: None (final)
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/features/squad/squad.test.ts` — Existing squad tests: follow describe/test structure, BDD comments
  - `src/features/squad/l2-squad-integration.test.ts` — Integration test patterns for squad features

  **API/Type References**:
  - `src/features/squad/factory.ts:188-262` — `buildSquadPromptSection()` function under test
  - `src/features/squad/schema.ts` — `SquadManifest` type for creating test fixtures
  - `src/features/squad/loader.ts` — `LoadedSquad` type for test data

  **Acceptance Criteria**:
  - [ ] `bun test src/features/squad/squad-awareness.test.ts` passes
  - [ ] Tests cover: 0 squads, 1 squad, N squads
  - [ ] Tests verify delegation syntax present
  - [ ] `bun test` full suite passes (0 failures)
  - [ ] `bun run typecheck` passes
  - [ ] `bun run build` passes

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: New squad awareness tests pass
    Tool: Bash
    Steps:
      1. `bun test src/features/squad/squad-awareness.test.ts`
      2. Assert: all tests pass, 0 failures
    Expected Result: Green test output

  Scenario: Full gate verification
    Tool: Bash
    Steps:
      1. `bun test` → 0 failures
      2. `bun run typecheck` → 0 errors
      3. `bun run build` → success
    Expected Result: All gates green
  ```

  **Evidence**:
  - [ ] Test output captured showing pass count
  - [ ] typecheck + build output clean

  **Commit**: YES
  - Message: `test(squad): add unit tests for squad awareness section generation`
  - Files: `src/features/squad/squad-awareness.test.ts`
  - Pre-commit: `bun test src/features/squad/squad-awareness.test.ts`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1+2 | `feat(squad): inject squad awareness into orchestrator agent prompts` | utils.ts, kord.ts, dev.ts, builder/index.ts, config-handler.ts | `bun run typecheck` |
| 3 | `test(squad): add unit tests for squad awareness section generation` | squad-awareness.test.ts | `bun test` |

---

## Success Criteria

### Verification Commands
```bash
bun test src/features/squad/squad-awareness.test.ts  # New tests pass
bun test                                              # Full suite: 0 failures
bun run typecheck                                     # No type errors
bun run build                                         # Build succeeds
```

### Final Checklist
- [ ] Kord prompt contains squad awareness when squads loaded
- [ ] Planner prompt contains squad awareness when squads loaded
- [ ] Builder prompt contains squad awareness when squads loaded
- [ ] Dev prompt contains squad awareness when squads loaded
- [ ] No awareness section when 0 squads
- [ ] Existing tests unbroken
- [ ] `buildSquadPromptSection()` no longer orphaned
