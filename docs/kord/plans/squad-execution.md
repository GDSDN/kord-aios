# Squad Execution Pipeline (Phase 2) — v2

## TL;DR

> **Quick Summary**: Enable squad chiefs to receive delegated objectives and execute autonomously — with orchestration capabilities (task delegation to workers), proper write permissions, and model fallbacks from SQUAD.yaml. Chiefs work like Dev (autonomous, todowrite-based tracking) but with Kord's orchestration power (task delegation).
> 
> **Deliverables**:
> - SQUAD.yaml schema extended with `fallback` + `write_paths` per agent (with root wildcard + broad path rejection + kebab-case name enforcement)
> - Convention-based write paths for squad agents in agent-authority (via existing frontmatter capabilities store)
> - Squad fallback store in `src/shared/` wired into resolution pipeline (using `convertAgentFallbackSlots()`)
> - Factory auto-enables `task` permission for `is_chief: true` agents + populates write_paths + fallback stores
> - Factory applies `{SQUAD_NAME}` substitution when appending chief template
> - Chief template reworked with autonomous orchestration loop (RECEIVE > EXPLORE > PLAN > DELEGATE > VERIFY > SYNTHESIZE) merged with existing Coordination Workflow
> - Name collision validation at load time (rejects squad names matching built-in agents)
> - Squad-creator updated with revised chief role definition + new fields
> - 17+ integration tests including E2E assembly test
> - Documentation updated: AGENTS.md (root + 3 subdirs), README.md, docs/guide/features.md
> 
> **Estimated Effort**: Medium (multi-day)
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Task 2 → Task 5 → Task 7 → Task 8

---

## Context

### Original Request
Phase 2 of the squad system: make squads executable. Phase 1 (complete) gave orchestrators squad awareness. Now orchestrators can see squads, but squad chiefs can't actually receive objectives, delegate to workers, or operate within proper permissions.

### Architecture Pivot (v1 → v2)
The original v1 plan included sub-plans + sub-boulders for squad persistence. After deep analysis:
- **Eliminated**: Sub-plans, sub-boulders, build hook squad continuation
- **Reason**: Most squad work completes in 1 session; Builder/Dev patterns don't use sub-plans; centralized orchestration contains errors better (Google Research); sub-boulder infrastructure adds ~500 lines for a rarely-triggered feature
- **New approach**: Chiefs work like Dev (autonomous, todowrite for internal tracking) but with Kord's orchestration ability (delegates to workers via task())

### Interview Summary
**Key Decisions**:
- Chiefs are a hybrid role: Dev's autonomy + Kord's orchestration + domain expertise
- No sub-plans or sub-boulders — chiefs track work internally via todowrite
- SQUAD.yaml is the ONLY source of truth for fallbacks (no kord-aios.json changes)
- Convention write paths: `docs/kord/squads/{squad}/**` + `docs/{squad}/**` — NO hardcoded `src/**`
- Additional write paths via new SQUAD.yaml `write_paths` field per agent
- Factory must auto-enable `task` for chiefs (gap fix)
- Chief template needs Dev-like autonomous loop adapted for orchestration
- Worker prompt approach unchanged
- Squad routing: subagent_type only, no category routing for squads

**Verified Technical Facts** (code-verified, not assumptions):
- Dev delegation disabled: only explore/librarian, no task() — dev.ts:627 + kord.ts:221
- Kord CAN implement directly: behavioral constraint, not tool restriction — kord.ts:179,606
- Planner delegates to domain agents (analyst, architect, PM, SM, PO, UX) for planning artifacts — plan-generation.ts:62-87
- Factory forces `mode: "all"` for chiefs but does NOT auto-enable task tool — factory.ts:104,110-119
- `SquadCapabilities` interface exists in agent-capabilities.ts but is unwired
- No `write_paths` or `fallback` field in current SQUAD.yaml schema
- `resolveAgentFallbackChain()` reads from AGENT_MODEL_REQUIREMENTS + kord-aios.json — needs squad source
- `agent-frontmatter-capabilities-store.ts` provides module-level store pattern
- CHIEF_COORDINATION_TEMPLATE teaches `task()` syntax but factory doesn't grant the permission — gap

### Research References
- Google Research (Jan 2026): centralized orchestration contains error amplification better; sequential is safer for dependent tasks
- Phase 1 commits: 44998ac8, 72852456, aa01ab32

---

## Work Objectives

### Core Objective
Give squad chiefs an execution environment: they receive an objective via `task(subagent_type=...)`, have the tools to delegate to their workers, operate within proper write-path boundaries, and use resilient model fallback from SQUAD.yaml.

### Concrete Deliverables
- `squadAgentSchema` gains `fallback` field (array of `{model, variant?}`) and `write_paths` field (string array)
- `createSquadAgentConfig()` populates fallback store + auto-enables `task` for chiefs
- `resolveAgentFallbackChain()` reads squad manifest fallback via module-level store
- Agent-authority auto-generates write paths for `squad-*` agents from convention + SQUAD.yaml `write_paths`
- `CHIEF_COORDINATION_TEMPLATE` extended with autonomous orchestration loop
- Squad-creator prompt updated with revised chief role definition + new fields
- Integration tests covering schema, fallback, authority, task auto-enable

### Definition of Done
- [ ] `bun test` passes (all existing + new tests)
- [ ] `bun run typecheck` passes
- [ ] `bun run build` passes
- [ ] Squad chief receives objective and can delegate to workers via task()
- [ ] Squad chief has write access to `docs/kord/squads/{squad}/**` and `docs/{squad}/**`
- [ ] Squad agent fallback from SQUAD.yaml works in delegation
- [ ] Existing non-squad behavior unchanged (backward compat)

### Must Have
- `fallback` + `write_paths` fields in SQUAD.yaml per agent
- Factory auto-enables `task` tool for `is_chief: true` agents
- Convention-based write paths for all squad agents
- SQUAD.yaml `write_paths` enforcement via agent-authority
- Chief template with autonomous orchestration loop
- Backward compatibility with existing SQUAD.yaml files (all new fields optional)

### Must NOT Have (Guardrails)
- Do NOT add squad category routing to `task()` (subagent_type only)
- Do NOT modify `kord-aios.json` schema (`AgentOverridesSchema`, etc.)
- Do NOT add new tools (use existing `task()`)
- Do NOT add external dependencies
- Do NOT add sub-plans, sub-boulders, or squad-level build hook continuation
- Do NOT hardcode `src/**` in convention paths (project-structure-specific paths go in SQUAD.yaml `write_paths`)
- Do NOT hardcode individual squad names in DEFAULT_AGENT_ALLOWLIST
- Do NOT allow squad agents to write to `docs/kord/boulder.json` (main boulder)

### Guardrails from Analysis
- **Name collision guard**: Squad names must NOT collide with built-in agent names (builder, dev, kord, planner, etc.) — validate during squad agent registration
- **Path traversal prevention**: Validate squadName is kebab-case, reject `..` in paths
- **Fallback isolation**: Squad fallback resolution must NOT affect non-squad agent fallback chains
- **Permission isolation**: Squad agent write_paths from SQUAD.yaml must be validated (no `**` wildcard root, no system paths)
- **Task permission scope**: Auto-enabled `task` for chiefs should NOT also enable `call_kord_agent` — chiefs delegate to workers, not to parent orchestrators

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: YES (bun:test)
- **Automated tests**: YES (tests-after)
- **Framework**: bun test

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: SQUAD.yaml schema — add fallback + write_paths fields
├── Task 3: Agent-authority convention paths for squad agents
└── Task 4: Factory — auto-enable task permission for chiefs

Wave 2 (After Wave 1):
├── Task 2: Wire squad fallback + write_paths into stores + resolution (depends: Task 1)
└── Task 5: Chief template — autonomous orchestration loop (depends: Tasks 1, 2, 3, 4)

Wave 3 (After Wave 2) — PARALLEL:
├── Task 6: Squad-creator — update chief role definition + new fields (depends: Tasks 1, 2, 3, 4)
└── Task 7: Integration tests + full verification (depends: Tasks 1, 2, 3, 4, 5)

Wave 4 (After Wave 3):
└── Task 8: Documentation updates — AGENTS.md (root + 3 subdirs), README.md, docs/guide/features.md

Critical Path: Task 1 → Task 2 → Task 5 → Task 7 → Task 8
Parallel Speedup: ~40% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 5, 6, 7, 8 | 3, 4 |
| 2 | 1 | 5, 6, 7, 8 | 3, 4 |
| 3 | None | 5, 6, 7, 8 | 1, 4 |
| 4 | None | 5, 6, 7, 8 | 1, 3 |
| 5 | 1, 2, 3, 4 | 7, 8 | 6 |
| 6 | 1, 2, 3, 4 | 8 | 5, 7 |
| 7 | 1, 2, 3, 4, 5 | 8 | 6 |
| 8 | All (1-7) | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 3, 4 | 3x task(category="quick", run_in_background=true) |
| 2 | 2, 5 | Sequential: 2→5 via task(category="unspecified-low") |
| 3 | 6, 7 | Parallel: task(category="quick") + task(category="unspecified-low", run_in_background=true) |
| 4 | 8 | task(category="writing", load_skills=[]) |

---

## TODOs

- [ ] 1. Extend SQUAD.yaml schema with `fallback` + `write_paths` per agent

  **What to do**:
  - In `src/features/squad/schema.ts`: add two new fields to `squadAgentSchema`:
    1. `fallback`: `z.array(z.object({ model: z.string(), variant: z.string().optional() })).optional()`
    2. `write_paths`: `z.array(z.string()).optional()`
  - The `fallback` format mirrors `AgentFallbackSlotSchema` in `src/config/schema.ts` (lines 6-9)
  - The `write_paths` field allows glob patterns for additional write permissions beyond convention paths
  - `SquadAgent` type auto-infers from Zod — no manual type update needed
  - Validate: model format must be `provider/model` (same regex as `AgentFallbackSlotSchema`)
  - Validate: `write_paths` entries must not be empty strings, must not start with `/` or contain `..`
  - Validate: `write_paths` entries must NOT be `**` (root wildcard — grants unrestricted access)
  - Validate: `write_paths` entries must NOT match `docs/kord/**` (too broad — bypasses boulder.json protection; use narrow paths like `docs/kord/squads/{squad}/**` instead)
  - Validate: squad `name` field should enforce kebab-case regex: `/^[a-z0-9]+(-[a-z0-9]+)*$/` (prevents path traversal and naming ambiguities with hyphens)

  **Must NOT do**:
  - Do NOT change `AgentOverridesSchema` in `src/config/schema.ts`
  - Do NOT add squad agent keys to kord-aios.json schema
  - Do NOT validate write_paths content beyond basic path safety (agent-authority handles enforcement)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-file schema addition, straightforward Zod changes
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 3, 4)
  - **Blocks**: Tasks 2, 5, 6, 7
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/features/squad/schema.ts:15-34` — `squadAgentSchema`: add `fallback` + `write_paths` here
  - `src/config/schema.ts:6-9` — `AgentFallbackSlotSchema`: mirror this exact format for `fallback` field

  **Type References** (contracts):
  - `src/features/squad/schema.ts:103-108` — Types: `SquadAgent` auto-infers, will gain `fallback` + `write_paths`

  **Why each reference matters**:
  - `squadAgentSchema` is the target — this is where new fields go
  - `AgentFallbackSlotSchema` defines the fallback format used everywhere else — squad must match exactly for consistency
  - Types auto-infer — executor should NOT manually update type definitions

  **Acceptance Criteria**:
  - [ ] `squadAgentSchema` has `fallback` field (optional array of `{model, variant?}`)
  - [ ] `squadAgentSchema` has `write_paths` field (optional array of strings)
  - [ ] Each fallback entry has `model` (string, `provider/model` format) and optional `variant`
  - [ ] `write_paths` entries reject `..` and empty strings
  - [ ] `write_paths` entry `**` (root wildcard) is rejected by schema
  - [ ] `write_paths` entry `docs/kord/**` (too broad) is rejected by schema
  - [ ] Squad `name` field enforces kebab-case regex (`/^[a-z0-9]+(-[a-z0-9]+)*$/`)
  - [ ] `bun run typecheck` passes
  - [ ] Existing SQUAD.yaml files without `fallback`/`write_paths` still validate (backward compat)

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Schema accepts new fields
    Tool: Bash (bun test)
    Steps:
      1. Run bun test src/features/squad/squad.test.ts
      2. Assert: all existing tests still pass (backward compat)
    Expected Result: 0 failures

  Scenario: Schema validates fallback format
    Tool: Bash (bun)
    Steps:
      1. Create inline test: parse SQUAD.yaml with fallback: [{model: "anthropic/claude-sonnet-4-5"}]
      2. Assert: validation succeeds
      3. Create inline test: parse SQUAD.yaml with fallback: [{model: "invalid"}]
      4. Assert: validation fails (no provider/model format)
    Expected Result: Valid formats pass, invalid rejected

   Scenario: Schema validates write_paths safety
     Tool: Bash (bun)
     Steps:
       1. Parse SQUAD.yaml with write_paths: ["src/components/**"]
       2. Assert: validation succeeds
       3. Parse SQUAD.yaml with write_paths: ["../escape/**"]
       4. Assert: validation fails (path traversal)
     Expected Result: Safe paths pass, traversal rejected

   Scenario: Schema rejects root wildcard write_paths
     Tool: Bash (bun)
     Steps:
       1. Parse SQUAD.yaml with write_paths: ["**"]
       2. Assert: validation fails (root wildcard rejected)
     Expected Result: Unrestricted access pattern rejected

   Scenario: Schema rejects overly broad docs/kord/** write_paths
     Tool: Bash (bun)
     Steps:
       1. Parse SQUAD.yaml with write_paths: ["docs/kord/**"]
       2. Assert: validation fails (too broad — bypasses boulder.json protection)
       3. Parse SQUAD.yaml with write_paths: ["docs/kord/squads/marketing/**"]
       4. Assert: validation succeeds (narrow path is fine)
     Expected Result: Broad system paths rejected, narrow convention paths accepted

   Scenario: Schema enforces kebab-case squad name
     Tool: Bash (bun)
     Steps:
       1. Parse SQUAD.yaml with name: "my-squad" → Assert: succeeds
       2. Parse SQUAD.yaml with name: "My Squad" → Assert: fails (spaces, uppercase)
       3. Parse SQUAD.yaml with name: "my..squad" → Assert: fails (dots)
       4. Parse SQUAD.yaml with name: "a" → Assert: succeeds (single char OK)
     Expected Result: Only kebab-case names accepted
   ```

  **Commit**: YES
  - Message: `feat(squad): add fallback and write_paths fields to SQUAD.yaml agent schema`
  - Files: `src/features/squad/schema.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 2. Wire squad agent fallback into agent config + resolution

  **What to do**:
  - Create `src/shared/squad-fallback-store.ts` (in `src/shared/`, NOT `src/features/squad/` — prevents circular dependency when `agent-fallback.ts` imports it) — a module-level Map<string, FallbackEntry[]> following the pattern from `agent-frontmatter-capabilities-store.ts`:
    - `setSquadAgentFallback(agentName: string, entries: FallbackEntry[]): void`
    - `getSquadAgentFallback(agentName: string): FallbackEntry[] | undefined`
    - `clearSquadFallbackStore(): void` (for testing)
  - In `src/features/squad/factory.ts` → `createSquadAgentConfig()`: if `agentDef.fallback` exists, convert entries using `convertAgentFallbackSlots()` (the EXPORTED function — NOT `toFallbackEntry()` which is private/unexported) and call `setSquadAgentFallback()` to populate the store
  - In `src/features/squad/factory.ts` → `createSquadAgentConfig()`: also populate the write_paths into the existing frontmatter capabilities store by calling `setAgentFrontmatterCapabilities(prefixedName, { write_paths: [...mergedPaths] })` — where `mergedPaths` is convention paths (`docs/kord/squads/{squad}/**`, `docs/{squad}/**`) merged with any SQUAD.yaml `write_paths`. This wires write_paths into agent-authority without any new store or hook modification (gap G5/C4 fix).
  - In `src/shared/agent-fallback.ts` → `resolveAgentFallbackChain()`: add squad fallback as a new resolution source. Priority order: user-config (kord-aios.json) > squad-manifest (SQUAD.yaml) > hardcoded (AGENT_MODEL_REQUIREMENTS). Only check squad store if agent name starts with `squad-`. Import `getSquadAgentFallback` from `./squad-fallback-store` (same directory — no circular dependency).

  **Must NOT do**:
  - Do NOT modify `kord-aios.json` schema or `AgentOverridesSchema`
  - Do NOT change fallback resolution behavior for non-squad agents
  - Do NOT import squad-specific code into `agent-fallback.ts` — use the store's getter function (decoupled)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Multi-file plumbing across shared + squad modules with careful isolation
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Task 1)
  - **Blocks**: Tasks 5, 7
  - **Blocked By**: Task 1

  **References**:

  **Pattern References** (existing code to follow):
  - `src/shared/agent-frontmatter-capabilities-store.ts` — Module-level store pattern: copy this exact approach (Map + get/set/clear exports). ALSO the target for write_paths population via `setAgentFrontmatterCapabilities()`.
  - `src/shared/agent-fallback.ts:14-25` — `toFallbackEntry()` is PRIVATE (not exported). Use `convertAgentFallbackSlots()` instead — the exported function that converts `{model, variant}[]` to `FallbackEntry[]`.

  **API/Type References** (contracts to implement against):
  - `src/shared/agent-fallback.ts:63-105` — `resolveAgentFallbackChain()`: add squad fallback source here, between user-config and hardcoded sources
  - `src/features/squad/factory.ts:97-183` — `createSquadAgentConfig()`: populate BOTH fallback store AND frontmatter capabilities store during agent config creation
  - `src/features/squad/factory.ts:264-282` — `createAllSquadAgentConfigs()`: this calls `createSquadAgentConfig()` for each agent — store population happens here
  - `src/shared/agent-frontmatter-capabilities-store.ts` — `setAgentFrontmatterCapabilities(name, { write_paths })`: call this to wire write_paths into agent-authority without modifying the hook

  **Why each reference matters**:
  - `agent-frontmatter-capabilities-store.ts` is the proven module-level store pattern — avoids circular deps and keeps coupling minimal. Also the target for write_paths wiring (gap G5/C4).
  - `convertAgentFallbackSlots()` is the EXPORTED function — `toFallbackEntry()` is private and will cause a compile error if imported (gap G7/C2)
  - `resolveAgentFallbackChain()` is the single resolution point — surgical insertion of squad source needed
  - `createSquadAgentConfig()` is where squad data is available — right place to populate BOTH stores
  - `squad-fallback-store.ts` MUST be in `src/shared/` (same directory as `agent-fallback.ts`) — placing it in `src/features/squad/` creates circular dependency when `agent-fallback.ts` imports it (gap C3)

  **Acceptance Criteria**:
  - [ ] `squad-fallback-store.ts` created in `src/shared/` (NOT `src/features/squad/`) with get/set/clear exports
  - [ ] `createSquadAgentConfig()` populates fallback store when `agentDef.fallback` exists using `convertAgentFallbackSlots()` (NOT `toFallbackEntry()`)
  - [ ] `createSquadAgentConfig()` populates frontmatter capabilities store with merged write_paths (convention + SQUAD.yaml) via `setAgentFrontmatterCapabilities()`
  - [ ] `resolveAgentFallbackChain("squad-X-chief")` returns squad fallback when no user override exists
  - [ ] `resolveAgentFallbackChain("squad-X-chief")` prefers user-config override over squad fallback (priority correct)
  - [ ] Squad agent without `fallback` in SQUAD.yaml → `getSquadAgentFallback()` returns `undefined`
  - [ ] Non-squad agent fallback resolution completely unchanged
  - [ ] `bun run typecheck` passes

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Squad fallback store population + retrieval
    Tool: Bash (bun test)
    Steps:
      1. Call setSquadAgentFallback("squad-marketing-chief", [{model: "anthropic/claude-sonnet-4-5", provider: "anthropic"}])
      2. Call getSquadAgentFallback("squad-marketing-chief")
      3. Assert: returns the FallbackEntry[] matching what was set
      4. Call getSquadAgentFallback("squad-marketing-writer")
      5. Assert: returns undefined (not set)
    Expected Result: Store works as expected

  Scenario: resolveAgentFallbackChain uses squad store
    Tool: Bash (bun test)
    Steps:
      1. Populate squad fallback store for "squad-marketing-chief"
      2. Call resolveAgentFallbackChain("squad-marketing-chief", {}) with no user override
      3. Assert: returns FallbackEntry[] from squad store
    Expected Result: Squad fallback resolves correctly

  Scenario: Non-squad agents unaffected
    Tool: Bash (bun test)
    Steps:
      1. Call resolveAgentFallbackChain("dev", {})
      2. Assert: returns same result as before (from AGENT_MODEL_REQUIREMENTS)
      3. Confirm: squad store NOT consulted
    Expected Result: Zero behavioral change for existing agents
  ```

  **Commit**: YES
  - Message: `feat(squad): wire SQUAD.yaml agent fallback and write_paths into resolution pipeline`
  - Files: `src/shared/squad-fallback-store.ts` (new), `src/features/squad/factory.ts`, `src/shared/agent-fallback.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 3. Agent-authority convention paths + write_paths enforcement for squad agents

  **What to do**:
  - In `src/hooks/agent-authority/index.ts`: add dynamic write-path resolution for agents whose name starts with `squad-`
  - Convention path generation: extract squad name from agent name (`squad-{squadName}-{agentKey}`) → auto-allow:
    - `docs/kord/squads/{squadName}/**` (coordination workspace)
    - `docs/{squadName}/**` (final artifacts)
  - SQUAD.yaml `write_paths` enforcement: read the agent's write_paths from the **existing frontmatter capabilities store** (`getAgentFrontmatterCapabilities(agentName)`) — Task 2 populates this store during factory config creation via `setAgentFrontmatterCapabilities()`. NO separate `squad-write-paths-store.ts` needed. NO new store creation in this task.
  - The authority hook already calls `getAgentCapabilities(agentName)` at line 203 — this function aggregates from the frontmatter store. The write_paths populated by Task 2 will flow through this existing path automatically. Verify this works; if `getAgentCapabilities()` doesn't read `write_paths` from the frontmatter store, add that read.
  - Name collision validation: add to `src/features/squad/factory.ts` → `createAllSquadAgentConfigs()` (NOT in the authority hook — wrong enforcement point). Before creating agent configs, check squad name against built-in agent names list and throw if collision detected. This catches the problem at load time, not at write time.
  - Guards (in authority hook):
    - Validate `squadName` extracted from agent name is kebab-case (a-z, 0-9, hyphens only), no path traversal (`..`)
    - Explicitly DENY `docs/kord/boulder.json` for all squad agents
    - "System paths" definition: any path matching `docs/kord/boulder.json`, `docs/kord/plans/**`, `docs/kord/stories/**` — squad agents should NOT write to orchestration paths beyond their own `docs/kord/squads/{squad}/**` workspace

  **Must NOT do**:
  - Do NOT hardcode individual squad names in DEFAULT_AGENT_ALLOWLIST
  - Do NOT allow squad agents to write to `docs/kord/boulder.json`
  - Do NOT add `src/**` as convention path (project-specific paths go in SQUAD.yaml `write_paths`)
  - Do NOT bypass existing authority checks for non-squad agents

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Hook logic with security validation and multiple guard conditions
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 4)
  - **Blocks**: Tasks 5, 7
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/hooks/agent-authority/index.ts:1-263` — Main authority hook: understand how paths are checked, add squad resolution into the same flow. Line 203 calls `getAgentCapabilities(agentName)` — verify it reads `write_paths` from the frontmatter store (populated by Task 2).
  - `src/hooks/agent-authority/constants.ts:1-44` — `DEFAULT_AGENT_ALLOWLIST`: see the pattern for agent→paths mapping. Do NOT add squad entries here — use dynamic resolution

  **API/Type References** (contracts):
  - `src/shared/agent-frontmatter-capabilities-store.ts` — `getAgentFrontmatterCapabilities()`: Task 2 populates write_paths here. Authority hook should read from this store (or via `getAgentCapabilities()` which aggregates it).
  - `src/shared/pattern-matcher.ts` — Glob pattern matching: reuse for write_paths validation
  - `src/features/squad/factory.ts:264-282` — `createAllSquadAgentConfigs()`: add name collision validation HERE (before creating configs)

  **Why each reference matters**:
  - `agent-authority/index.ts` is where path checks happen — squad logic inserts here
  - `DEFAULT_AGENT_ALLOWLIST` shows the static approach — squad needs dynamic alternative
  - `agent-frontmatter-capabilities-store.ts` is where Task 2 populates write_paths — authority hook reads from here, no new store needed (gap G5/C4 fix)
  - `pattern-matcher.ts` avoids reimplementing glob matching
  - `factory.ts:264-282` is the right enforcement point for name collision (load-time, not write-time — gap G10 fix)

  **Acceptance Criteria**:
  - [ ] `squad-marketing-chief` can write to `docs/kord/squads/marketing/plans/campaign.md`
  - [ ] `squad-marketing-chief` can write to `docs/marketing/deliverables/report.md`
  - [ ] `squad-marketing-worker` can write to `docs/kord/squads/marketing/**` and `docs/marketing/**`
  - [ ] Squad agent with `write_paths: ["src/components/**"]` populated in frontmatter store can write to `src/components/Button.tsx`
  - [ ] Squad agent WITHOUT `write_paths` CANNOT write to `src/**` (no implicit code access)
  - [ ] Squad agent CANNOT write to `docs/kord/boulder.json` (explicit deny)
  - [ ] Squad name `"builder"` is rejected at load time in `createAllSquadAgentConfigs()` (collides with built-in agent)
  - [ ] Squad name `"my..squad"` is rejected (path traversal)
  - [ ] Non-squad agent behavior completely unchanged
  - [ ] `bun run typecheck` passes

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Squad chief convention write path allowed
    Tool: Bash (bun test)
    Steps:
      1. Simulate write tool call from agent "squad-marketing-chief" to "docs/kord/squads/marketing/plans/campaign.md"
      2. Assert: hook allows the write (no error thrown)
    Expected Result: Write permitted

  Scenario: Squad agent with write_paths from SQUAD.yaml
    Tool: Bash (bun test)
    Steps:
      1. Configure squad agent with write_paths: ["src/components/**"]
      2. Simulate write from "squad-frontend-chief" to "src/components/Button.tsx"
      3. Assert: hook allows the write
      4. Simulate write from "squad-frontend-chief" to "src/hooks/auth.ts"
      5. Assert: hook blocks (not in write_paths)
    Expected Result: SQUAD.yaml write_paths enforced correctly

  Scenario: Squad agent blocked from main boulder
    Tool: Bash (bun test)
    Steps:
      1. Simulate write from "squad-marketing-chief" to "docs/kord/boulder.json"
      2. Assert: hook blocks with authority error
    Expected Result: Write denied

  Scenario: Built-in name collision rejected
    Tool: Bash (bun test)
    Steps:
      1. Attempt to create squad agent with squad name "builder"
      2. Assert: validation error thrown (name collides with built-in agent)
    Expected Result: Rejected with clear error message

  Scenario: Non-squad agent unchanged
    Tool: Bash (bun test)
    Steps:
      1. Simulate write from "builder" to "docs/kord/plans/test.md"
      2. Assert: behavior identical to before (existing allowlist used)
    Expected Result: No regression
  ```

  **Commit**: YES
  - Message: `feat(agent-authority): convention-based write paths and SQUAD.yaml write_paths for squad agents`
  - Files: `src/hooks/agent-authority/index.ts`, `src/features/squad/factory.ts` (name collision validation)
  - Pre-commit: `bun run typecheck`

---

- [ ] 4. Factory — auto-enable `task` permission for `is_chief: true` agents

  **What to do**:
  - In `src/features/squad/factory.ts` → `createSquadAgentConfig()`: after line 119 (where SQUAD.yaml `tools` field is applied), add logic to auto-enable `task` tool for chiefs:
    ```typescript
    if (agentDef.is_chief) {
      // Auto-enable task delegation for chiefs — unless SQUAD.yaml explicitly disables it
      if (config.permission?.task === undefined) {
        config.permission = { ...config.permission, task: "allow" }
      }
    }
    ```
  - Key principle: SQUAD.yaml explicit `tools: { task: false }` overrides auto-enable (user intent wins)
  - Do NOT auto-enable `call_kord_agent` — chiefs delegate to workers, not to parent orchestrators
  - **Verification needed (G2)**: `call_kord_agent` permission is NOT in `AgentPermissionSchema` — verify at runtime whether the permission key is silently dropped or passed through. If dropped, no action needed (chiefs can't escalate). If passed through, explicitly set `call_kord_agent: "deny"` for chiefs. Check `src/config/schema.ts` for `AgentPermissionSchema` and `src/tools/delegate-task/executor.ts` for how permissions are consumed.

  **Must NOT do**:
  - Do NOT auto-enable `call_kord_agent` for chiefs
  - Do NOT override explicit `tools: { task: false }` from SQUAD.yaml
  - Do NOT change permission handling for non-chief agents
  - Do NOT modify the `tools` schema in SQUAD.yaml

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small surgical change in factory.ts (~5-10 lines), clear logic
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 5, 7
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/features/squad/factory.ts:97-119` — `createSquadAgentConfig()`: the exact function to modify. Line 104 forces `mode: "all"` for chiefs. Lines 110-119 apply SQUAD.yaml `tools` field. Insert task auto-enable AFTER line 119.
  - `src/agents/dev.ts:627` — Dev's permission config `{ question: "allow", call_kord_agent: "deny" }`: reference for permission format

  **API/Type References** (contracts):
  - `src/features/squad/factory.ts:104` — `mode: agentDef.is_chief ? "all" : ...` — confirms chief detection exists
  - `src/features/squad/schema.ts:29` — `tools: z.record(z.string(), z.boolean()).optional()` — how SQUAD.yaml `tools` field is typed

  **Why each reference matters**:
  - `factory.ts:97-119` is the exact insertion point — executor must understand the flow before/after
  - `dev.ts:627` shows the permission format — executor can see how `AgentConfig.permission` is structured
  - `factory.ts:104` confirms `is_chief` check already exists — no need to re-derive
  - `schema.ts:29` shows how `tools` field translates to permissions — executor needs this to understand override logic

  **Acceptance Criteria**:
  - [ ] Chief agents have `task: "allow"` in their permission config after factory creates them
  - [ ] Non-chief agents do NOT get `task: "allow"` auto-enabled
  - [ ] SQUAD.yaml with `tools: { task: false }` for a chief → `task` NOT auto-enabled (user override wins)
  - [ ] SQUAD.yaml with `tools: { task: true }` for a chief → `task` enabled (explicit + auto-enable agree)
  - [ ] `call_kord_agent` is NOT auto-enabled for chiefs
  - [ ] `bun run typecheck` passes

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Chief gets task permission auto-enabled
    Tool: Bash (bun test)
    Steps:
      1. Create squad agent config for chief (is_chief: true, no tools override)
      2. Inspect returned config.permission
      3. Assert: config.permission.task === "allow"
    Expected Result: task auto-enabled

  Scenario: Non-chief does NOT get task auto-enabled
    Tool: Bash (bun test)
    Steps:
      1. Create squad agent config for worker (is_chief: false)
      2. Inspect returned config.permission
      3. Assert: config.permission.task is undefined (not set)
    Expected Result: Workers don't get delegation power

  Scenario: Explicit tools override wins
    Tool: Bash (bun test)
    Steps:
      1. Create chief with SQUAD.yaml tools: { task: false }
      2. Inspect returned config.permission
      3. Assert: config.permission.task !== "allow" (user intent preserved)
    Expected Result: SQUAD.yaml explicit disable overrides auto-enable

  Scenario: call_kord_agent NOT auto-enabled
    Tool: Bash (bun test)
    Steps:
      1. Create chief config (is_chief: true)
      2. Assert: config.permission.call_kord_agent is undefined or "deny"
    Expected Result: Chiefs cannot escalate to parent orchestrators
  ```

  **Commit**: YES
  - Message: `feat(squad): auto-enable task permission for chief agents in factory`
  - Files: `src/features/squad/factory.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 5. Chief template rework — autonomous orchestration loop

  **What to do**:
  - In `src/features/squad/chief-template.ts`: extend (NOT replace) `CHIEF_COORDINATION_TEMPLATE` with a new section that teaches chiefs an autonomous orchestration loop adapted from Dev's pattern (dev.ts:220-350):

    **RECEIVE > EXPLORE > PLAN > DELEGATE > VERIFY > SYNTHESIZE**

    1. **RECEIVE**: Understand the objective — what is the goal, what are the constraints
    2. **EXPLORE**: Use explore agents to understand codebase context before acting
    3. **PLAN**: Create internal todo list via `todowrite()` — break objective into tasks for workers
    4. **DELEGATE**: Send tasks to workers via `task(subagent_type="squad-{SQUAD_NAME}-{worker}")` — include clear objectives, references, acceptance criteria
    5. **VERIFY**: Check worker output — review files, run tests, validate quality
    6. **SYNTHESIZE**: Combine results, report completion to orchestrator

  - Include Dev-like todowrite discipline (dev.ts:470-530): chiefs MUST use todowrite to track internal progress
  - Include workspace paths: `docs/kord/squads/{SQUAD_NAME}/` for coordination artifacts, `docs/{SQUAD_NAME}/` for final deliverables
  - Use `{SQUAD_NAME}` placeholder throughout (factory replaces during prompt assembly)
  - KEEP existing CHIEF_COORDINATION_TEMPLATE content (delegation syntax, quality gates) — extend, don't replace
  - **CRITICAL (G1/C1 fix)**: In `src/features/squad/factory.ts` → `appendChiefAwarenessSection()`: add `.replace(/\{SQUAD_NAME\}/g, manifest.name)` when appending the template string. Currently the template is appended verbatim with NO substitution — `{SQUAD_NAME}` placeholders would appear literally in the prompt. This is a single-line fix in the factory, not a restructuring of the assembly flow.
  - **CRITICAL (M4 fix)**: The existing template already contains a "Coordination Workflow" section (chief-template.ts). The new 6-phase orchestration loop MUST be reconciled with this existing section — either merge them into a single coherent workflow, or restructure so the new loop supersedes and absorbs the existing coordination steps. Do NOT create two competing/conflicting workflow instructions in the same template.

  **Must NOT do**:
  - Do NOT restructure `appendChiefAwarenessSection()`'s assembly flow in factory.ts — the only change allowed is adding `.replace(/\{SQUAD_NAME\}/g, manifest.name)` to the template string before/after appending (G1/C1 fix)
  - Do NOT remove existing template content (task() syntax, quality gates sections)
  - Do NOT add sub-plan or sub-boulder management (eliminated in v2)
  - Do NOT hardcode squad names
  - Do NOT add new prompt assembly functions
  - Do NOT create two competing workflow instructions — merge the new orchestration loop with the existing "Coordination Workflow" section (M4 fix)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Prompt engineering requiring understanding of Dev's pattern + careful template extension
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Tasks 1, 2, 3, 4)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2, 3, 4

  **References**:

  **Pattern References** (existing code to follow):
  - `src/agents/dev.ts:220-350` — Dev's EXPLORE → PLAN → DECIDE → EXECUTE loop: adapt this pattern for chiefs. Key difference: chiefs DELEGATE where Dev IMPLEMENTS
  - `src/agents/dev.ts:470-530` — Dev's todowrite discipline: chiefs should follow same tracking rigor
  - `src/features/squad/chief-template.ts:1-93` — Current `CHIEF_COORDINATION_TEMPLATE`: extend this, keep existing content

  **API/Type References** (contracts):
  - `src/features/squad/factory.ts:43-62` — `appendChiefAwarenessSection()`: DO NOT modify — shows how template gets injected into chief prompt
  - `src/features/squad/chief-template.ts:17-21` — Existing task() delegation syntax: keep this, add orchestration loop around it

  **Documentation References**:
  - `src/features/builtin-agents/squad-creator.md:109-248` — `<chief_design>` section: confirms that team members/delegation syntax/coordination protocol should NOT be in custom chief prompts (factory handles those)

  **Why each reference matters**:
  - `dev.ts:220-350` is the proven autonomous loop — adapt for orchestration context
  - `dev.ts:470-530` is the todowrite discipline — chiefs need same tracking rigor
  - `chief-template.ts` is the target — must understand existing content before extending
  - `factory.ts:43-62` shows assembly order — template content must not conflict with auto-generated sections
  - `squad-creator.md` confirms factory generates coordination — template must complement, not duplicate

  **Acceptance Criteria**:
  - [ ] Template contains the 6-phase orchestration loop (RECEIVE, EXPLORE, PLAN, DELEGATE, VERIFY, SYNTHESIZE)
  - [ ] Template includes todowrite discipline instructions
  - [ ] Template includes workspace paths: `docs/kord/squads/{SQUAD_NAME}/` + `docs/{SQUAD_NAME}/`
  - [ ] Template does NOT include sub-plan or sub-boulder management
  - [ ] Original template content preserved (delegation syntax, quality gates)
  - [ ] `{SQUAD_NAME}` placeholder used throughout (no hardcoded names)
  - [ ] Factory's `appendChiefAwarenessSection()` applies `.replace(/\{SQUAD_NAME\}/g, manifest.name)` so prompts contain actual squad name, not literal `{SQUAD_NAME}` (G1/C1 fix)
  - [ ] New orchestration loop and existing "Coordination Workflow" are merged into one coherent workflow — no conflicting instructions (M4 fix)
  - [ ] `bun test src/features/squad/chief-template.test.ts` passes (10 existing tests, 0 failures) (G9 fix)
  - [ ] `bun run typecheck` passes

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Orchestration loop present in template
    Tool: Bash (bun test)
    Steps:
      1. Import CHIEF_COORDINATION_TEMPLATE from chief-template.ts
      2. Assert: template contains "RECEIVE" or "Receive" (phase 1)
      3. Assert: template contains "EXPLORE" or "Explore" (phase 2)
      4. Assert: template contains "DELEGATE" or "Delegate" (phase 4)
      5. Assert: template contains "VERIFY" or "Verify" (phase 5)
      6. Assert: template contains "todowrite" (tracking discipline)
    Expected Result: All orchestration phases present

  Scenario: Workspace paths documented
    Tool: Bash (bun test)
    Steps:
      1. Assert: template contains "docs/kord/squads/{SQUAD_NAME}"
      2. Assert: template contains "docs/{SQUAD_NAME}"
    Expected Result: Both workspace paths present

  Scenario: No sub-plan/sub-boulder references
    Tool: Bash (grep)
    Steps:
      1. grep for "sub-plan" or "sub-boulder" or "boulder.json" in chief-template.ts
      2. Assert: NOT found
    Expected Result: Eliminated concepts not present

  Scenario: Original content preserved
    Tool: Bash (grep)
    Steps:
      1. grep for "task(subagent_type" in chief-template.ts (existing delegation syntax)
      2. Assert: still present
    Expected Result: Existing content not removed

  Scenario: Uses placeholder, not hardcoded names
    Tool: Bash (grep)
    Steps:
      1. grep for "{SQUAD_NAME}" in chief-template.ts → found
      2. grep for specific squad names like "marketing" in template string → not found
    Expected Result: Only placeholder used
  ```

  **Commit**: YES
  - Message: `feat(squad): add autonomous orchestration loop to chief coordination template`
  - Files: `src/features/squad/chief-template.ts`, `src/features/squad/factory.ts` (SQUAD_NAME substitution fix)
  - Pre-commit: `bun test src/features/squad/chief-template.test.ts && bun run typecheck`

---

- [ ] 6. Update squad-creator with revised chief role definition + new fields

  **What to do**:
  - In `src/features/builtin-agents/squad-creator.md`: update the `<chief_design>` section to reflect v2 architecture:
    1. Chief role is now "hybrid: Dev's autonomy + Kord's orchestration + domain expertise" (not sub-plan manager)
    2. Add guidance for generating `fallback` field per agent (using `provider/model` format)
    3. Add guidance for generating `write_paths` field when squad needs to write outside convention paths
    4. Document workspace convention: `docs/kord/squads/{squad}/` (coordination) + `docs/{squad}/` (final artifacts)
    5. Remove any references to sub-plans, sub-boulders, or build hook continuation (eliminated concepts)
    6. Clarify that chiefs use todowrite for internal tracking (not formal plans)
  - Maintain the existing warning: "DO NOT include team members, delegation syntax, or coordination protocol in chief prompts — factory generates those"

  **Must NOT do**:
  - Do NOT require `fallback` (keep it optional in guidance)
  - Do NOT require `write_paths` (keep it optional in guidance)
  - Do NOT reference sub-plans or sub-boulders (eliminated)
  - Do NOT change guidance about what factory auto-generates vs. what goes in custom prompts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Prompt/documentation update, single file
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 7)
  - **Parallel Group**: Wave 3 (parallel with Task 7)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 2, 3, 4

  **References**:

  **Pattern References** (existing code to follow):
  - `src/features/builtin-agents/squad-creator.md:109-248` — `<chief_design>` section: update this entire section with v2 role definition

  **API/Type References** (contracts):
  - `src/features/squad/schema.ts` — Updated schema with `fallback` + `write_paths` (from Task 1): reference for what fields squad-creator should generate

  **Documentation References**:
  - `src/features/builtin-squads/dev/SQUAD.yaml` — Existing builtin squad: reference for SQUAD.yaml structure

  **Why each reference matters**:
  - `squad-creator.md:109-248` is the target — this is the section that teaches squad-creator how to design chiefs
  - `schema.ts` defines the new fields — squad-creator guidance must match
  - `dev/SQUAD.yaml` shows current format — squad-creator should generate compatible output

  **Acceptance Criteria**:
  - [ ] `<chief_design>` section reflects hybrid role (Dev autonomy + Kord orchestration)
  - [ ] Guidance includes generating `fallback` field per agent (with format example)
  - [ ] Guidance includes generating `write_paths` when needed (with examples)
  - [ ] Workspace convention documented (`docs/kord/squads/{squad}/` + `docs/{squad}/`)
  - [ ] No references to sub-plans, sub-boulders, or build hook continuation
  - [ ] Existing warning about factory auto-generation preserved
  - [ ] `bun run typecheck` passes (markdown file, but verify no import changes)

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Chief role definition updated
    Tool: Bash (grep)
    Steps:
      1. grep for "hybrid" or "autonomous" in squad-creator.md chief_design section
      2. Assert: found (new role definition present)
    Expected Result: v2 role definition present

  Scenario: New fields documented
    Tool: Bash (grep)
    Steps:
      1. grep for "fallback" in squad-creator.md
      2. Assert: found with format guidance
      3. grep for "write_paths" in squad-creator.md
      4. Assert: found with usage guidance
    Expected Result: Both new fields documented

  Scenario: Eliminated concepts removed
    Tool: Bash (grep)
    Steps:
      1. grep for "sub-plan" or "sub-boulder" in squad-creator.md
      2. Assert: NOT found (or only in historical context)
    Expected Result: v1 concepts removed

  Scenario: Factory warning preserved
    Tool: Bash (grep)
    Steps:
      1. grep for "DO NOT include team members" or similar factory warning in squad-creator.md
      2. Assert: still present
    Expected Result: Critical warning preserved
  ```

  **Commit**: YES
  - Message: `feat(squad-creator): update chief role definition and add fallback/write_paths guidance`
  - Files: `src/features/builtin-agents/squad-creator.md`
  - Pre-commit: `bun run typecheck`

---

- [ ] 7. Integration tests + full verification

  **What to do**:
  - Create `src/features/squad/squad-execution.test.ts` with tests covering ALL new functionality:

    **Schema tests (5)**:
    1. SQUAD.yaml with `fallback` field validates correctly
    2. SQUAD.yaml with `write_paths` field validates correctly
    3. SQUAD.yaml without new fields still validates (backward compat)
    4. SQUAD.yaml with `write_paths: ["**"]` is rejected (root wildcard — G8 fix)
    5. SQUAD.yaml with `write_paths: ["docs/kord/**"]` is rejected (too broad — G8 fix)

    **Fallback tests (3)**:
    6. Fallback store: populated from squad manifest, resolves correctly via `resolveAgentFallbackChain()`
    7. Fallback store: non-squad agents unaffected by squad fallback store
    8. Fallback store: squad chief with NO `fallback` field → `getSquadAgentFallback()` returns `undefined` (G19 fix)

    **Factory tests (3)**:
    9. Chief agent gets `task: "allow"` auto-enabled
    10. Non-chief agent does NOT get `task: "allow"`
    11. Chief with explicit `tools: { task: false }` does NOT get auto-enabled (override wins)

    **Authority tests (5)**:
    12. Squad chief can write to `docs/kord/squads/{squad}/**` (convention path)
    13. Squad chief can write to `docs/{squad}/**` (convention path)
    14. Squad agent with `write_paths` can write to specified paths
    15. Squad agent CANNOT write to `docs/kord/boulder.json` (explicit deny)
    16. Squad name colliding with built-in agent name is rejected

    **E2E assembly test (1)** (G14 fix — CRITICAL):
    17. Full chief config assembly: create a complete chief config for a squad named "marketing" → verify:
        - Prompt contains actual squad name "marketing" (NOT literal `{SQUAD_NAME}`) — validates G1/C1 substitution fix
        - Permission includes `task: "allow"` — validates Task 4 auto-enable
        - Frontmatter capabilities store contains convention write_paths — validates Task 2 write_paths population

  - Use `clearSquadFallbackStore()` in `beforeEach`/`afterEach` for test isolation (G24 fix)
  - Run full verification gates: `bun test`, `bun run typecheck`, `bun run build`

  **Must NOT do**:
  - Do NOT test chief template content (prompt testing is fragile and breaks on rewording)
  - Do NOT test squad-creator prompt output (same reason)
  - Do NOT add tests for sub-boulders or build hook continuation (eliminated concepts)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Multi-module test file covering schema + fallback + factory + authority
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6)
  - **Parallel Group**: Wave 3 (parallel with Task 6)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 2, 3, 4, 5

  **References**:

  **Test References** (testing patterns to follow):
  - `src/features/squad/squad.test.ts` — Existing squad tests: follow describe/it structure and import patterns
  - `src/features/squad/squad-awareness.test.ts` — Recent Phase 1 tests: closest reference for test style
  - `src/features/squad/l2-squad-integration.test.ts` — Integration test patterns across squad modules
  - `src/hooks/agent-authority/agent-authority.test.ts` — Authority test patterns: how to simulate write tool calls

  **API/Type References** (what to test against):
  - `src/features/squad/schema.ts` — Schema parsing functions to test
  - `src/shared/squad-fallback-store.ts` — Store get/set/clear to test (in `src/shared/`, NOT `src/features/squad/`)
  - `src/features/squad/factory.ts` — `createSquadAgentConfig()` output to test
  - `src/hooks/agent-authority/index.ts` — Authority hook behavior to test
  - `src/shared/agent-frontmatter-capabilities-store.ts` — Verify write_paths population by factory

  **Why each reference matters**:
  - Existing test files show import patterns, describe/it structure, and assertion style
  - `squad-awareness.test.ts` is the most recent — best reference for current conventions
  - `agent-authority.test.ts` shows how to mock/simulate tool calls for authority testing
  - API references define the exact functions being tested

  **Acceptance Criteria**:
  - [ ] `bun test src/features/squad/squad-execution.test.ts` passes (17 tests, 0 failures)
  - [ ] Tests cover: schema (5), fallback (3), factory (3), authority (5), E2E assembly (1) = 17 minimum
  - [ ] E2E test verifies: prompt has real squad name (not `{SQUAD_NAME}`), `task: "allow"` in permission, write_paths in frontmatter store
  - [ ] `clearSquadFallbackStore()` used in test setup/teardown for isolation
  - [ ] `bun test` full suite passes (0 failures — no regressions)
  - [ ] `bun run typecheck` passes (0 errors)
  - [ ] `bun run build` passes (clean build)

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: All new tests pass
    Tool: Bash
    Steps:
      1. bun test src/features/squad/squad-execution.test.ts
      2. Assert: 17+ tests pass, 0 failures
    Expected Result: All green

  Scenario: E2E assembly test validates end-to-end integration
    Tool: Bash (bun test)
    Steps:
      1. Run the E2E assembly test in squad-execution.test.ts
      2. Assert: chief prompt contains "marketing" (real name, not {SQUAD_NAME})
      3. Assert: chief config.permission.task === "allow"
      4. Assert: frontmatter store has write_paths for "squad-marketing-chief"
    Expected Result: Full pipeline works end-to-end

  Scenario: No regressions in existing tests
    Tool: Bash
    Steps:
      1. bun test
      2. Assert: 0 failures across entire suite
    Expected Result: All existing tests still pass

  Scenario: Full gate verification
    Tool: Bash
    Steps:
      1. bun test → 0 failures
      2. bun run typecheck → 0 errors
      3. bun run build → success
    Expected Result: All three gates green
  ```

  **Commit**: YES
  - Message: `test(squad): add integration tests for squad execution pipeline`
  - Files: `src/features/squad/squad-execution.test.ts`
  - Pre-commit: `bun test src/features/squad/squad-execution.test.ts`

---

- [ ] 8. Documentation updates — AGENTS.md (root + subdirs), README.md, docs/guide/features.md

  **What to do**:
  Update all documentation files that reference the squad system to reflect the new execution capabilities from Tasks 1-7. This is the FINAL task — all implementation and tests must be complete before updating docs.

  **Files to update (6)**:

  **1. `src/features/squad/AGENTS.md`** (major update):
  - Add `fallback` and `write_paths` to the Agent Schema table (lines 65-75)
  - Add `squad-fallback-store.ts` to the STRUCTURE section (line 8-18)
  - Update "Chief vs Worker Behavior" table: add row for `task permission` (auto-enabled for chiefs)
  - Add new section: "## SQUAD EXECUTION MODEL" documenting:
    - Chief autonomous orchestration loop (RECEIVE > EXPLORE > PLAN > DELEGATE > VERIFY > SYNTHESIZE)
    - Convention write paths (`docs/kord/squads/{squad}/**` + `docs/{squad}/**`)
    - SQUAD.yaml `write_paths` for additional paths
    - Fallback resolution chain: user-config > squad-manifest > hardcoded
  - Update "HOW TO ADD A NEW SQUAD FIELD" section to mention fallback store population
  - Update SQUAD.yaml v2 schema example to include `fallback` and `write_paths` fields

  **2. `src/hooks/agent-authority/AGENTS.md`** (moderate update):
  - Add section: "## Squad Agent Write Paths" documenting:
    - Dynamic `squad-*` agent resolution (convention paths)
    - SQUAD.yaml `write_paths` enforcement
    - Boulder.json deny rule for squad agents
    - Name collision guard
  - Update "Default Allowlist" table: add note that squad agents use dynamic resolution, not static entries

  **3. `src/shared/AGENTS.md`** (minor update):
  - Add `squad-fallback-store.ts` mention under FALLBACK ARCHITECTURE section
  - Update fallback resolution chain diagram to show: user-config > squad-manifest > hardcoded
  - Add to "WHEN TO USE" table: `getSquadAgentFallback()` for squad agent fallback lookup

  **4. `AGENTS.md` (root)** (minor update):
  - Update the OVERVIEW paragraph to mention squad execution capabilities (not just awareness)
  - Update STRUCTURE tree if `squad-fallback-store.ts` is a notable new file
  - Ensure the "WHERE TO LOOK" table entry for squad work reflects the new files

  **5. `README.md`** (moderate update):
  - Update the "### Squads" section to include:
    - New SQUAD.yaml fields: `fallback` (per-agent model fallback chain) and `write_paths` (additional write permissions)
    - Chief execution model: autonomous orchestration with task delegation to workers
    - Convention workspace: `docs/kord/squads/{squad}/` + `docs/{squad}/`
  - Update the SQUAD.yaml example to show `fallback` and `write_paths` fields

  **6. `docs/guide/features.md`** (minor addition):
  - Add squad execution details to the Squads section (confirmed to exist in features.md)
  - Document: chief delegation model, write paths, fallback from SQUAD.yaml

  **Must NOT do**:
  - Do NOT reference sub-plans, sub-boulders, or build hook squad continuation (eliminated concepts)
  - Do NOT document internal implementation details (store internals, hook flow) — keep user-facing docs user-facing
  - Do NOT change any CRITICAL sections in root AGENTS.md (marked with "NEVER DELETE THIS SECTION")
  - Do NOT invent features — document ONLY what was implemented in Tasks 1-7

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation-focused task across 6 markdown files, requires reading implemented code to document accurately
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None (final task)
  - **Blocked By**: All previous tasks (1-7)

  **References**:

  **Documentation targets** (files to update):
  - `src/features/squad/AGENTS.md:1-246` — Squad system knowledge base: major update needed
  - `src/hooks/agent-authority/AGENTS.md:1-77` — Agent authority hook docs: add squad section
  - `src/shared/AGENTS.md:99-138` — Fallback architecture section: add squad source
  - `AGENTS.md:1-349` — Root project knowledge base: update overview + structure
  - `README.md:105-133` — Squads section: add new fields + execution model
  - `docs/guide/features.md` — Features guide: add squad execution details

  **Implementation references** (read to understand what to document):
  - `src/features/squad/schema.ts` — Updated schema with `fallback` + `write_paths` (Task 1 output)
  - `src/shared/squad-fallback-store.ts` — New fallback store in `src/shared/` (Task 2 output)
  - `src/features/squad/factory.ts` — Task auto-enable for chiefs + write_paths population (Tasks 2, 4 output)
  - `src/features/squad/chief-template.ts` — Orchestration loop (Task 5 output)
  - `src/hooks/agent-authority/index.ts` — Convention paths (Task 3 output)

  **Why each reference matters**:
  - Documentation targets define WHAT to update — executor must read current content before modifying
  - Implementation references define WHAT to document — executor must read actual implemented code to ensure accuracy
  - Root AGENTS.md has CRITICAL sections that MUST NOT be touched — executor must identify and preserve them

  **Acceptance Criteria**:
  - [ ] `src/features/squad/AGENTS.md` includes `fallback` + `write_paths` in schema docs
  - [ ] `src/features/squad/AGENTS.md` includes `squad-fallback-store.ts` in structure (noting it lives in `src/shared/`, not `src/features/squad/`)
  - [ ] `src/features/squad/AGENTS.md` includes squad execution model section
  - [ ] `src/features/squad/AGENTS.md` chief-vs-worker table updated with task permission row
  - [ ] `src/hooks/agent-authority/AGENTS.md` includes squad write path resolution section
  - [ ] `src/shared/AGENTS.md` fallback section includes squad-manifest source
  - [ ] `src/shared/AGENTS.md` includes `squad-fallback-store.ts` in file listing
  - [ ] `AGENTS.md` (root) overview mentions squad execution
  - [ ] `AGENTS.md` (root) STRUCTURE tree includes `squad-fallback-store.ts` under `src/shared/`
  - [ ] `README.md` squads section includes `fallback`, `write_paths`, and execution model
  - [ ] `README.md` SQUAD.yaml example includes new fields
  - [ ] `docs/guide/features.md` includes squad execution details
  - [ ] Barrel exports verified: `src/shared/squad-fallback-store.ts` is exported from `src/shared/index.ts` (if barrel exists)
  - [ ] No references to sub-plans or sub-boulders in any documentation
  - [ ] CRITICAL sections in root AGENTS.md untouched
  - [ ] All documentation accurately reflects implemented code (no hallucinated features)
  - [ ] `bun run typecheck` passes (no code changes, but verify no accidental edits)

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Squad AGENTS.md has new schema fields documented
    Tool: Bash (grep)
    Steps:
      1. grep for "fallback" in src/features/squad/AGENTS.md
      2. Assert: found in schema table/section
      3. grep for "write_paths" in src/features/squad/AGENTS.md
      4. Assert: found in schema table/section
    Expected Result: Both new fields documented

  Scenario: Squad AGENTS.md has execution model section
    Tool: Bash (grep)
    Steps:
      1. grep for "EXECUTION MODEL" or "Execution Model" in src/features/squad/AGENTS.md
      2. Assert: section exists
      3. grep for "RECEIVE" or "EXPLORE" or "DELEGATE" in section
      4. Assert: orchestration loop phases documented
    Expected Result: Execution model section present with phases

  Scenario: Agent-authority AGENTS.md has squad section
    Tool: Bash (grep)
    Steps:
      1. grep for "Squad" or "squad" in src/hooks/agent-authority/AGENTS.md
      2. Assert: found in new section (not just existing squad-creator entry)
      3. grep for "convention" or "dynamic" in same file
      4. Assert: convention path resolution documented
    Expected Result: Squad write path section exists

  Scenario: README.md squads section updated
    Tool: Bash (grep)
    Steps:
      1. grep for "fallback" in README.md squads section
      2. Assert: found
      3. grep for "write_paths" in README.md squads section
      4. Assert: found
    Expected Result: New fields in user-facing docs

  Scenario: No eliminated concepts in docs
    Tool: Bash (grep)
    Steps:
      1. grep for "sub-plan" or "sub-boulder" across all 6 doc files
      2. Assert: NOT found
    Expected Result: Eliminated concepts not documented

  Scenario: Root AGENTS.md critical sections preserved
    Tool: Bash (grep)
    Steps:
      1. grep for "NEVER DELETE THIS SECTION" in AGENTS.md
      2. Assert: found (at least 3 occurrences — PR target, OpenCode source, English-only)
    Expected Result: Critical sections intact
  ```

  **Commit**: YES
  - Message: `docs(squad): update AGENTS.md, README, and guides for squad execution pipeline`
  - Files: `src/features/squad/AGENTS.md`, `src/hooks/agent-authority/AGENTS.md`, `src/shared/AGENTS.md`, `AGENTS.md`, `README.md`, `docs/guide/features.md`
  - Pre-commit: `bun run typecheck`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(squad): add fallback and write_paths fields to SQUAD.yaml agent schema` | schema.ts | `bun run typecheck` |
| 2 | `feat(squad): wire SQUAD.yaml agent fallback and write_paths into resolution pipeline` | `src/shared/squad-fallback-store.ts` (new), factory.ts, agent-fallback.ts | `bun run typecheck` |
| 3 | `feat(agent-authority): convention-based write paths and SQUAD.yaml write_paths for squad agents` | agent-authority/index.ts, factory.ts (name collision) | `bun run typecheck` |
| 4 | `feat(squad): auto-enable task permission for chief agents in factory` | factory.ts | `bun run typecheck` |
| 5 | `feat(squad): add autonomous orchestration loop to chief coordination template` | chief-template.ts, factory.ts (SQUAD_NAME substitution) | `bun test src/features/squad/chief-template.test.ts && bun run typecheck` |
| 6 | `feat(squad-creator): update chief role definition and add fallback/write_paths guidance` | squad-creator.md | `bun run typecheck` |
| 7 | `test(squad): add integration tests for squad execution pipeline` | squad-execution.test.ts | `bun test` |
| 8 | `docs(squad): update AGENTS.md, README, and guides for squad execution pipeline` | AGENTS.md (root + 3 subdirs), README.md, docs/guide/features.md | `bun run typecheck` |

---

## Success Criteria

### Verification Commands
```bash
bun test src/features/squad/squad-execution.test.ts  # New tests pass (17+ tests)
bun test src/features/squad/chief-template.test.ts   # Existing tests still pass (10 tests)
bun test                                              # Full suite: 0 failures
bun run typecheck                                     # No type errors
bun run build                                         # Build succeeds
```

### Final Checklist
- [ ] SQUAD.yaml schema supports `fallback` + `write_paths` per agent
- [ ] Schema rejects `write_paths: ["**"]` (root wildcard) and `write_paths: ["docs/kord/**"]` (too broad)
- [ ] Schema enforces kebab-case squad name regex
- [ ] Squad agent fallback resolves from SQUAD.yaml via module-level store in `src/shared/`
- [ ] Squad agents have write access to convention paths (`docs/kord/squads/{squad}/**` + `docs/{squad}/**`)
- [ ] SQUAD.yaml `write_paths` enforced via frontmatter capabilities store (populated in factory, read in authority hook)
- [ ] Squad agents blocked from writing to `docs/kord/boulder.json`
- [ ] Factory auto-enables `task` permission for chief agents (unless explicitly disabled)
- [ ] Factory applies `{SQUAD_NAME}` → actual name substitution when appending chief template
- [ ] Chief template includes autonomous orchestration loop (RECEIVE > EXPLORE > PLAN > DELEGATE > VERIFY > SYNTHESIZE)
- [ ] Chief template merges new orchestration loop with existing Coordination Workflow (no competing instructions)
- [ ] Squad-creator updated with v2 chief role definition + new field guidance
- [ ] Name collision validation in factory rejects squad names matching built-in agent names
- [ ] No sub-plans, sub-boulders, or build hook continuation (eliminated)
- [ ] All existing tests still pass — including 10 chief-template.test.ts tests (backward compat)
- [ ] All 3 gates green: `bun test`, `bun run typecheck`, `bun run build`
- [ ] Documentation updated: AGENTS.md (root + squad + agent-authority + shared), README.md, docs/guide/features.md
- [ ] Documentation accurately reflects implemented code (no hallucinated features)
- [ ] No eliminated concepts (sub-plans, sub-boulders) referenced in any documentation
- [ ] CRITICAL sections in root AGENTS.md preserved intact
- [ ] Barrel exports: `squad-fallback-store.ts` exported from `src/shared/index.ts` (if barrel exists)
