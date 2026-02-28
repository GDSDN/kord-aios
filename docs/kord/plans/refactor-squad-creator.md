# Refactor Squad Creator for OpenCode/Kord Architecture

## TL;DR

> **Quick Summary**: Refactor the `squad-creator` agent to act as a proper bridge between Synkra methodology (addons) and the Kord AIOS engine. It will interactively build squads, define tool/MCP access, and support both local (project) and global (user) squad registration.
> 
> **Deliverables**:
> - Update `src/agents/squad-creator.ts` system prompt to ask user for Global vs Local scope.
> - Update `squad-creator` to generate per-agent tool permissions using the existing `tools: Record<string, boolean>` field in `SQUAD.yaml`.
> - Update squad discovery to include an OpenCode global squad directory (cross-platform via OpenCode config dir resolution).
> - Wire squads into runtime so they are actually registered as agents/categories (not only load/validate).
> - Prevent accidental/unsolicited squad generation during generic planning/investigation.
> 
> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential
> **Critical Path**: Update Loader → Update Squad Creator Prompt → Verify

---

## Context

### Original Request
The user requested a plan to refactor the `squad-creator` agent to align with the framework's architecture: Kord AIOS as the **Engine** and Squads as **Addons/Extensions** (adapted from Synkra). The user wants squads to be registered dynamically either per-project or globally, and for tools/handoffs to be correctly configured using the engine's capabilities.

### Interview Summary
**Key Discussions**:
- **Registration**: We agreed that squads can be created locally (`.opencode/squads/`) or globally (`~/.config/opencode/squads/`). The creator must ask the user where to save them.
- **Tools**: Squad agents will get access to standard Kord tools, but the creator must configure specific restrictions or custom MCPs in the `SQUAD.yaml` manifest using the engine's standard formats.

**Research Findings**:
- Kord AIOS currently parses `SQUAD.yaml` via `src/features/squad/loader.ts`.
- The schema (`src/features/squad/schema.ts`) already supports a `tools: Record<string, boolean>` field per agent, which enables/disables specific tools.
- The `loader.ts` currently searches only project-local squad dirs (`.opencode/squads`, `.kord/squads`, `docs/kord/squads`) plus built-in squads; it does not scan an OpenCode global config dir for squads.
- Kord AIOS already has cross-platform OpenCode config-dir resolution via `getOpenCodeConfigDir({ binary: "opencode" })` (see `src/plugin-config.ts` and `src/features/opencode-skill-loader/loader.ts`).
- The `squad_load` tool (`src/tools/squad-load/tools.ts`) reads/returns a manifest but does not register squad agents into runtime.
- `src/features/squad/factory.ts` currently does not apply `agentDef.tools` into the generated `AgentConfig` (tool permissions would be ignored unless wired).

### Analyst Review
**Identified Gaps** (addressed):
- **Missing Global Loader**: The engine must be updated to load from the OpenCode global config dir (`getOpenCodeConfigDir(...)/squads`) before the `squad-creator` can safely generate squads for cross-project use.
- **Cross-Platform Paths**: Do not hardcode `~/.config`; use the existing OpenCode config-dir resolver so Windows/macOS/Linux all work.
- **Runtime Wiring**: Reading/validating manifests is not enough; squads must be registered into `config.agent` (and optionally categories) at startup.

---

## Project Artifacts

*(No additional artifacts required)*

---

## Decision Points

- [x] Decision: How to configure tool access?
  - Options: Introduce new YAML schema fields OR use existing `tools: Record<string, boolean>` in `SQUAD.yaml`.
  - Evidence: `schema.ts` already has `tools: z.record(z.string(), z.boolean())`.
  - Final decision: **Use existing `tools` record format.**
  - Rationale: Avoids breaking changes to the schema. The `squad-creator` prompt just needs to be taught how to write it.

---

## Work Objectives

### Core Objective
Refactor the `squad-creator` agent prompt and the Kord squad loader to fully support interactive, engine-aware, global/local squad generation based on Synkra methodologies.

### Concrete Deliverables
- `src/features/squad/loader.ts` updated to load from OpenCode global config dir (`getOpenCodeConfigDir(...)/squads`).
- `src/agents/squad-creator.ts` updated system prompt.

### Definition of Done
- [x] Engine loads squads from `{OpenCodeConfigDir}/squads/` (cross-platform; no hardcoded `~/.config`).
- [x] Squad Creator prompt mandates asking the user for Global vs Local scope.
- [x] Squad Creator prompt mandates including a per-agent `tools:` map in the generated `SQUAD.yaml`.
- [x] Squads are registered into runtime agents/categories so `task(subagent_type=...)` and `task(category="squad:category")` are actionable.
- [x] Planner does not invoke `squad-creator` unless the user explicitly requested squad creation.

### Must Have
- `squad-creator` must act purely as an architect/generator for addons.

### Must NOT Have (Guardrails)
- Avoid adding new fields to `src/features/squad/schema.ts` unless strictly required; prefer existing `agents.*.skills` and `agents.*.tools`.
- Do NOT break existing local squad loading.

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: YES (after)
- **Framework**: bun test

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

\`\`\`
Scenario: Verify Squad Loader supports global path
  Tool: Bash (bun test)
  Preconditions: loader.ts modified to include OpenCode global config dir
  Steps:
    1. bun test src/features/squad/squad.test.ts
  Expected Result: All squad loader tests pass, ensuring no regressions.
  Failure Indicators: Failing tests in squad loader.
  Evidence: Terminal output captured.
\`\`\`

\`\`\`
Scenario: Verify Squad Creator prompt contains new rules
  Tool: Bash (grep)
  Preconditions: squad-creator.ts modified
  Steps:
    1. grep -i "global" src/agents/squad-creator.ts
    2. grep -i "tools:" src/agents/squad-creator.ts
  Expected Result: The prompt strings are present in the file.
  Failure Indicators: Empty output.
  Evidence: Terminal output captured.
\`\`\`

---

## Execution Strategy

### Parallel Execution Waves

\`\`\`
Wave 1 (Start Immediately):
├── Task 0: Align installation model + packaging
├── Task 1: Update squad discovery (global path) + align squad_load search
├── Task 4: Prevent accidental squad generation (over-trigger fix)
└── Task 5: Refactor squad-creator system prompt

Wave 2 (After Wave 1):
├── Task 2: Wire squads into runtime agent registration
└── Task 3: Apply per-agent tools permissions
\`\`\`

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 0 | None | 5 | 1, 4 |
| 1 | None | 2 | 0, 4 |
| 4 | None | None | 0, 1, 5 |
| 5 | 0 | None | 1, 4 |
| 2 | 1 | 3 | 4 |
| 3 | 2 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 0, 1, 4, 5 | task(category="quick", load_skills=["git-master"], run_in_background=false) |
| 2 | 2, 3 | task(category="unspecified-high", load_skills=["git-master"], run_in_background=false) |

---

## TODOs

- [x] 0. Align squad installation model (project vs global) + packaging

  **What to do**:
  - Define what artifacts a squad consists of in Kord AIOS:
    - Squad manifest: `SQUAD.yaml` + optional `agents/*.md` persona files.
    - Skills: separate `SKILL.md` files (OpenCode/Kord skill loader does not currently scan `skills/` inside a squad directory).
    - MCP servers: configured via skill frontmatter `mcp:` or per-skill `mcp.json` (supported by `src/features/opencode-skill-loader/loader.ts`).
  - Update the `squad-creator` prompt to generate an installable layout that matches our loaders:
    - Local (project): `.opencode/squads/{squad}/...` + `.opencode/skills/{skill}/SKILL.md`
    - Global (user): `{OpenCodeConfigDir}/squads/{squad}/...` + `{OpenCodeConfigDir}/skills/{skill}/SKILL.md`

  **References**:
  - `src/features/opencode-skill-loader/loader.ts` (skill discovery + MCP parsing)
  - `src/plugin-config.ts:98` (OpenCode config dir resolution)

  **Acceptance Criteria**:
  - [ ] `src/agents/squad-creator.ts` explicitly documents where to write squads and skills (local vs global).

- [x] 1. Update Squad Loader for Global Paths

  **What to do**:
  - In `src/features/squad/loader.ts`, add a global squad search path derived from `getOpenCodeConfigDir({ binary: "opencode" })`.
  - Ensure project-local `.opencode/squads` remains higher priority than global.
  - Update `src/tools/squad-load/tools.ts` `DEFAULT_SEARCH_PATHS` to include the same global path so `squad_load` matches runtime behavior.
  - Align `squad_load` parsing/validation with `src/features/squad/schema.ts` (avoid having two incompatible manifest formats in the same plugin).

  **Must NOT do**:
  - Do not remove the existing `USER_SQUAD_SEARCH_PATHS`.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/features/squad/loader.ts:115-156` (Search paths + dedup behavior)
  - `src/plugin-config.ts:98` (OpenCode config dir resolution)
  - `src/tools/squad-load/tools.ts:10-22` (Search paths used by `squad_load`)

  **Acceptance Criteria**:
  - [ ] Global path `{OpenCodeConfigDir}/squads` is scanned during `loadAllSquads()`.
  - [ ] `squad_load` finds squads from global path when present.
  - [ ] `bun run typecheck` → PASS
  - [ ] `bun test src/features/squad/` → PASS

  **Agent-Executed QA Scenarios**:
  \`\`\`
  Scenario: TypeScript Compilation passes
    Tool: Bash (bun)
    Preconditions: loader.ts updated
    Steps:
      1. run `bun run typecheck`
      2. Assert exit code 0
    Expected Result: No TS errors
    Evidence: Terminal output captured
  \`\`\`

  **Commit**: YES (Message: `feat(squads): support global squad loading from user config dir`)

- [x] 2. Wire squads into runtime agent registration

  **What to do**:
  - Load squads at startup and translate them into OpenCode `AgentConfig` objects so they behave like real agents.
  - Use `src/features/squad/loader.ts` + `src/features/squad/factory.ts:createAllSquadAgentConfigs()`.
  - Merge generated squad agents into the final `config.agent` in `src/plugin-handlers/config-handler.ts` (or in `createBuiltinAgents()`), with deterministic conflict handling.
  - Ensure delegation is discoverable (inject a prompt section listing available squads and delegation syntax).

  **References**:
  - `src/plugin-handlers/config-handler.ts` (final `config.agent` assembly)
  - `src/features/squad/loader.ts` (squad discovery)
  - `src/features/squad/factory.ts:182` (AgentConfig creation)

  **Acceptance Criteria**:
  - [ ] With a project that contains `.opencode/squads/{name}/SQUAD.yaml`, OpenCode startup results in new agents present under `config.agent`.
  - [ ] `task(subagent_type="{squad-agent}")` starts a session successfully.

- [x] 3. Apply per-agent `tools` permissions from SQUAD.yaml

  **What to do**:
  - Update `src/features/squad/factory.ts:createSquadAgentConfig()` to apply `agentDef.tools` into the generated agent config.
  - Confirm the exact OpenCode/Kord tool permission shape for agents and map the squad `tools` record accordingly.

  **References**:
  - `src/features/squad/schema.ts:15-34` (squad agent `tools` field)
  - `src/shared/permission-compat.ts` (permission migration patterns)

  **Acceptance Criteria**:
  - [ ] A squad agent with `tools: { bash: false }` cannot execute Bash.

- [x] 4. Prevent accidental squad generation (over-trigger fix)

  **What to do**:
  - Harden Planner guidance so `squad-creator` is only used when explicitly requested.
  - Update `src/agents/squad-creator.ts` metadata (`avoidWhen`, `keyTrigger`) to reject generic planning/investigation/debugging.

  **References**:
  - `src/agents/plan/interview-mode.ts:49`
  - `src/agents/plan/plan-generation.ts:139`
  - `docs/kord/plans/optimize-squad-creator.md` (historical context)

  **Acceptance Criteria**:
  - [ ] During generic investigation/debugging prompts, Planner does not invoke `squad-creator`.

- [x] 5. Refactor squad-creator system prompt

  **What to do**:
  - In `src/agents/squad-creator.ts`, update `SQUAD_CREATOR_SYSTEM_PROMPT`.
  - Add a rule to the `<creation_workflow>` or `<core_principles>`: "Always ask the user if the squad should be created Locally (project only) or Globally (available in all projects via the OpenCode config dir, i.e. `{OpenCodeConfigDir}/squads/`)."
  - Update the `SQUAD.yaml` manifest example in the prompt to include the per-agent `tools` map (e.g., `tools: { "bash": false, "task": true }`).
  - Explain that Kord AIOS is the Engine providing the tools, and the Squad is the Addon providing the methodology and personas.
  - Add explicit installation guidance for skills + MCP:
    - Skills must be written to `.opencode/skills/` (project) or `{OpenCodeConfigDir}/skills/` (global) so they are discoverable.
    - MCP servers should be declared via skill frontmatter `mcp:` or `mcp.json` in the skill directory.

  **Must NOT do**:
  - Do not change the agent's core metadata or fallback logic.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/agents/squad-creator.ts:43-148` (The prompt string).

  **Acceptance Criteria**:
  - [ ] Modified `src/agents/squad-creator.ts`.
  - [ ] `bun run typecheck` → PASS

  **Agent-Executed QA Scenarios**:
  \`\`\`
  Scenario: Text verification for new prompt instructions
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. run `grep -i "Locally" src/agents/squad-creator.ts`
      2. Assert exit code 0
    Expected Result: The string exists in the modified prompt
    Evidence: Terminal output captured
  \`\`\`

  **Commit**: YES (Message: `refactor(agents): update squad-creator prompt for engine architecture and global squads`)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(squads): load global squads from opencode config dir` | src/features/squad/loader.ts, src/tools/squad-load/tools.ts | bun test src/features/squad |
| 2 | `feat(squads): register squad agents at startup` | src/plugin-handlers/config-handler.ts (+ squad integration) | bun run typecheck |
| 3 | `fix(squads): enforce per-agent tool permissions` | src/features/squad/factory.ts | bun test src/features/squad |
| 4 | `fix(planner): prevent accidental squad-creator invocation` | src/agents/plan/*.ts, src/agents/squad-creator.ts | bun run typecheck |
| 5 | `refactor(agents): align squad-creator prompt with kord/opencode loaders` | src/agents/squad-creator.ts | bun run typecheck |

---

## Success Criteria

### Verification Commands
\`\`\`bash
bun run typecheck
bun test src/features/squad
\`\`\`

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All tests pass
