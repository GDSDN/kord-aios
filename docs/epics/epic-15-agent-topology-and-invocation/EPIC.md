# EPIC-15: Agent Topology & Invocation

> **Status**: Draft
> **Created**: 2026-02-14
> **Research**: [Epics 15-18 Deep Study](../../researches/epics-15-18-study.md) §1
> **Priority**: High — **blocks all agent-based workflows**
> **Depends on**: None

> **Mirror Sources** (consulted and verified):
> - `D:\dev\opencode-source` — OpenCode engine (`agent.ts`, `local.tsx`, `task.ts`)
> - `D:\dev\oh-my-opencode` — OMOC reference (`config-handler.ts` lines 367-378)
> - `D:\dev\synkra-aios` — methodology agents

---

## Summary

Fix the config-handler so that the 4 primary agents (`kord`, `dev`, `plan`, `build`) appear correctly in OpenCode's UI, and all specialist agents (PM/PO/SM/QA/DevOps/etc.) are invokable via `@`/task delegation.

**Root cause** (verified against OpenCode source): The config-handler was copied from OMOC but the override logic was not updated after the agent rename. OMOC hid OpenCode's native `build` and demoted OpenCode's native `plan` because it had its own replacements (`atlas` and `prometheus`). In kord-aios, the agents were renamed (`atlas`→`build`, `prometheus`→`plan`), so the overrides now **destroy kord-aios's own agents**.

**Naming strategy (pending decision)**:

To avoid confusion with OpenCode-native agents and to make the config-handler logic unambiguous, prefer renaming Kord AIOS agents:

- `plan` → `planner`
- `build` → `builder`

This EPIC must document and implement (with migration) whichever choice is finalized, but the primary requirement is functional correctness: the Kord AIOS planner/executor must not be clobbered by stale overrides.

---

## Context

### OpenCode Agent Visibility Rules (Verified)

Source: `D:\dev\opencode-source\packages\opencode\src\agent\agent.ts`, `local.tsx`, `task.ts`

**Primary picker** (`local.tsx:37`):
```typescript
sync.data.agent.filter((x) => x.mode !== "subagent" && !x.hidden)
```

**Task/@-invocation** (`task.ts:28`):
```typescript
Agent.list().then((x) => x.filter((a) => a.mode !== "primary"))
```

| Mode | Primary Picker | Task/@-invoke |
|------|---------------|---------------|
| `"primary"` | ✓ (unless hidden) | ✗ |
| `"subagent"` | ✗ | ✓ |
| `"all"` | ✓ (unless hidden) | ✓ |

### OMOC Reference (Working State)

| OMOC Agent | Kord-aios Name | Mode in OMOC | How Set |
|------------|---------------|-------------|---------|
| `sisyphus` | `kord` | `"primary"` | factory, set as `default_agent` |
| `hephaestus` | `dev` | `"primary"` / `"all"` | factory |
| `prometheus` | `plan` | **`"all"`** | **explicitly in config-handler:306** |
| `atlas` | `build` | `"primary"` | factory (in builtinAgents) |
| OpenCode `build` | — | `"subagent"` + hidden | overridden at config-handler:376 |
| OpenCode `plan` | — | `"subagent"` | overridden at config-handler:377 |

### The Bug (Kord-aios)

`src/plugin-handlers/config-handler.ts` lines 365-376:
```typescript
config.agent = {
  ...agentConfig,           // kord, plan (with full prompt/config)
  ...builtinAgents,         // build, oracle, explore, pm, devops, etc.
  build: { ...migratedBuild, mode: "subagent", hidden: true },  // ← DESTROYS kord-aios's own build
  ...(planDemoteConfig ? { plan: planDemoteConfig } : {}),       // ← DESTROYS kord-aios's own plan
};
```

In OMOC, `build:` targeted OpenCode's native agent (OMOC's was named `atlas`). After rename, `build` IS kord-aios's agent. Same for `plan`/`prometheus`.

---

## Stories

### S01: Research — DONE (Findings in Study Doc)

**Status**: ✅ Complete — see [epics-15-18-study.md §1](../../researches/epics-15-18-study.md)

Findings:
- OpenCode visibility rules verified from source
- OMOC agent topology documented
- Root cause identified (config-handler override targets wrong agents after rename)
- Specialist agents with `mode:"subagent"` ARE task-invokable per OpenCode `task.ts:28`

---

### S02: Remove Stale Build/Plan Overrides in `config-handler.ts`

**As** a user, **I need** `plan` and `build` to appear in the primary picker and not be destroyed by stale OMOC overrides.

**Exact changes required**:

1. **Remove line 374**: `build: { ...migratedBuild, mode: "subagent", hidden: true }` — this override was for OpenCode's native `build`, not ours. Our `build` comes from `builtinAgents` and should keep its factory mode.

2. **Remove the `planDemoteConfig` spread at line 375**: `...(planDemoteConfig ? { plan: planDemoteConfig } : {})` — this overwrites the plan agent we configured in `agentConfig`. Our `plan` agent already has the correct mode.

3. **Set `plan` to `mode: "all"`** in `agentConfig` (matching OMOC's prometheus at line 306) — so plan is both in the primary picker AND task-invokable.

4. **Update `CORE_AGENT_ORDER`** to `["kord", "dev", "plan", "build"]`.

5. **Handle OpenCode's native `build` and `plan`**: They're already filtered out by `filteredConfigAgents` logic (line 346-348: `if (key in builtinAgents) return false`). Since our `build` and `plan` are in builtinAgents/agentConfig, OpenCode's natives are excluded. No additional hiding needed.

**If we choose to rename Kord AIOS agents to `planner`/`builder`** (to avoid name overlap):

- Rename canonical agents across the codebase:
  - Schema/types: `src/config/schema.ts`, `src/agents/types.ts`
  - Agent registry: `src/agents/utils.ts`
  - Migration map: `src/shared/migration.ts`
  - Commands/hooks/tests: `/start-work` command agent, build hook agent fallback, boulder state agent name
- Update config-handler merge so that:
  - `planner` is `mode: "all"` (picker + task-invokable)
  - `builder` is `mode: "primary"` (picker)
  - OpenCode-native `plan` and `build` are explicitly demoted/hidden

**Acceptance Criteria**:
- [ ] `build` agent retains its factory mode from builtinAgents (mode: "primary")
- [ ] `plan` agent retains its config from agentConfig with mode: "all"
- [ ] `kord` remains default_agent with mode: "primary"
- [ ] `dev` remains mode: "all" (from factory)
- [ ] OpenCode's native build/plan are not leaked through (verified by filteredConfigAgents)
- [ ] `CORE_AGENT_ORDER` is `["kord", "dev", "plan", "build"]`
- [ ] `bun run typecheck` passes

**Files**: `src/plugin-handlers/config-handler.ts`

---

### S03: Verify Specialist Agent @-Invokability

**As** a user, **I need** to invoke PM/DevOps/QA/etc. via `@` delegation.

**Expected behavior** (from OpenCode `task.ts:28`): Agents with `mode !== "primary"` appear in the task tool. Specialist agents have `mode: "subagent"` → they SHOULD be invokable.

**Verification required**:
- [ ] Confirm specialist agents are present in `config.agent` after config-handler runs
- [ ] Confirm kord agent has `task: "allow"` permission (required by `task.ts:32-34` permission check)
- [ ] Confirm no specialist is accidentally filtered by disabled_agents or model resolution failures
- [ ] If any specialist is missing, trace the cause (model requirement, disabled list, etc.)

**Files**: `src/plugin-handlers/config-handler.ts` (permission block), `src/agents/utils.ts`

---

### S04: Update Config-Handler Tests

**As** a maintainer, **I need** tests asserting the correct topology **so that** regressions are caught.

**Tests to add/update in `config-handler.test.ts`**:
- [ ] `kord` is present with mode allowing primary picker visibility
- [ ] `dev` is present with mode "all"
- [ ] `plan` is present with mode "all" (not "subagent")
- [ ] `build` is present with mode "primary" (not "subagent", not hidden)
- [ ] Agent order is `["kord", "dev", "plan", "build", ...]`
- [ ] At least one specialist (e.g., pm) is present with mode "subagent"
- [ ] `AGENT_NAME_MAP` compatibility mappings still resolve correctly

**Files**: `src/plugin-handlers/config-handler.test.ts`

---

## Out of Scope

- Changing specialist prompts or responsibilities (EPIC-09 done)
- Adding/removing agents
- `/modelconfig` UX changes (separate concern)
