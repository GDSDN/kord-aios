# Squad Execution Phase 2 — Architectural Review

> **Reviewer**: Architect agent  
> **Date**: 2026-03-02  
> **Plan reviewed**: `docs/kord/plans/squad-execution.md` (v2, 8 tasks, 4 waves)  
> **Method**: Code-verified — all claims traced to actual source files

---

## Summary

The plan is structurally sound and the architecture decisions (autonomous chiefs, no sub-boulders, SQUAD.yaml-only fallback) are correct. However, **4 critical blocking bugs** exist that will prevent the implementation from working even if each task individually passes its stated acceptance criteria. Several high-severity gaps will cause silent runtime failures rather than build-time errors.

---

## Critical Blockers (will cause silent runtime failure or compile error)

### C1 — `{SQUAD_NAME}` placeholder has no substitution path

**Task 5** instructs the executor to add workspace paths as `docs/kord/squads/{SQUAD_NAME}/` inside the template constant. **Task 5 also says**: "factory replaces during prompt assembly."

**This is false.** `appendChiefAwarenessSection()` in `factory.ts:43–62` does:

```typescript
parts.push(CHIEF_COORDINATION_TEMPLATE)
return parts.join("\n\n")
```

There is no string replacement of `{SQUAD_NAME}` or any other placeholder. The template is appended verbatim. An executor following the plan will write a template with `{SQUAD_NAME}` literals that appear unsubstituted in every chief's runtime prompt.

**Additionally**, Task 5 says "Do NOT change how `appendChiefAwarenessSection()` works" and "Do NOT add new prompt assembly functions." These two constraints make it **impossible** to implement placeholder substitution as described.

**Required fix**: Either (a) remove the `{SQUAD_NAME}` requirement and use generic language like `docs/kord/squads/<your-squad-name>/` in the template text, or (b) allow Task 5 to modify `appendChiefAwarenessSection` to perform replacement — but this must be explicitly permitted and the plan constraint removed.

---

### C2 — `toFallbackEntry` is not exported — Task 2 import will fail

**Task 2** says:

> "convert entries using `toFallbackEntry()` and call `setSquadAgentFallback()`"

The referenced function in `src/shared/agent-fallback.ts:14–25` is:

```typescript
function toFallbackEntry(slot: AgentFallbackSlot): FallbackEntry | null {
```

It is a **module-private** function. It is not exported. An executor that attempts to import it will get a TypeScript compile error. There is no mention in Task 2 that the executor needs to export this function first.

**Required fix**: Add to Task 2's "What to do": "Export `toFallbackEntry` from `src/shared/agent-fallback.ts` before importing it in factory.ts." Or alternatively, add `convertAgentFallbackSlots` (which IS exported, `agent-fallback.ts:27–39`) to the usage instructions — it accepts a slot array and returns `FallbackEntry[] | undefined`, which is exactly what's needed.

---

### C3 — Import direction inversion: `shared` cannot import from `features/squad`

**Task 2** creates `src/features/squad/squad-fallback-store.ts` and instructs `src/shared/agent-fallback.ts` to import from it:

> "Do NOT import squad-specific code into `agent-fallback.ts` — use the store's getter function (decoupled)"

But the store lives in `features/squad`. `features/squad/factory.ts` already imports from `shared/` (for `AgentConfig` type and utilities). If `shared/agent-fallback.ts` imports from `features/squad/squad-fallback-store.ts`, the import graph becomes:

```
shared/agent-fallback.ts → features/squad/squad-fallback-store.ts
features/squad/factory.ts → shared/agent-fallback.ts (for toFallbackEntry)
```

This is a **circular import** through module layers (shared → features → shared). In a Bun/ESM environment this can cause silent initialization ordering bugs or explicit circular dependency errors.

The existing pattern avoids this: `agent-frontmatter-capabilities-store.ts` lives in `src/shared/`, not in `features/`. The squad fallback store should follow the same pattern.

**Required fix**: Create `src/shared/squad-fallback-store.ts` (not `src/features/squad/squad-fallback-store.ts`). This is the same location as the frontmatter store pattern it mirrors. Update Task 2's file list in the commit instruction accordingly.

---

### C4 — Squad `write_paths` never reach the agent-authority check

**Task 3** says to add write-path logic "in `agent-authority/index.ts`." But the current hook resolves paths through `getAgentCapabilities(agentName)` at `index.ts:203` — **with no sources argument**:

```typescript
const capabilities = getAgentCapabilities(agentName)
```

`getAgentCapabilities()` accepts `sources?: AgentCapabilitySources` where squad write_paths would go in `sources.squad`. Without sources, the function reads only from the frontmatter capabilities store (for custom .md agents) and falls through to `DEFAULT_AGENT_ALLOWLIST`. Squad agents (`squad-*`) are in neither, so they land in the "deny all" branch.

The plan acknowledges two approaches: "either via the squad fallback store pattern (a separate `squad-write-paths-store.ts`) or by extending the existing `SquadCapabilities` interface." It does not decide. An executor seeing both options with no guidance will pick one arbitrarily, and the SquadCapabilities option (option 2) cannot work without also modifying the hook to pass sources.

**The correct fix** (requiring no hook modification) is to populate write_paths into the **existing** `agent-frontmatter-capabilities-store.ts` during `createSquadAgentConfig()`. When agent-authority calls `getAgentCapabilities(agentName)`, it already reads this store at `agent-capabilities.ts:102`. This means:

1. During `createAllSquadAgentConfigs()`, after computing convention paths and SQUAD.yaml `write_paths`, call: `setAgentFrontmatterCapabilities(prefixedName, { write_paths: [...conventionPaths, ...yamlPaths] })`
2. No modification to agent-authority needed beyond the boulder.json deny rule
3. No new store needed for write_paths

**Required fix**: Task 3 should specify using `setAgentFrontmatterCapabilities()` during squad loading (likely in `createSquadAgentConfig()` or `createAllSquadAgentConfigs()`), not "add dynamic resolution to agent-authority/index.ts." The convention path generation logic belongs in `factory.ts` (which knows the squad name), not in the hook (which only sees the prefixed agent name).

---

## High-Severity Gaps

### H1 — Squad name extraction from prefixed agent name is ambiguous

**Task 3** says: "extract squad name from agent name (`squad-{squadName}-{agentKey}`)"

The parsing is ambiguous when squad names contain hyphens (which kebab-case allows). Example:

- Squad name `data-pipeline`, agent key `engineer` → `squad-data-pipeline-engineer`
- Squad name `data`, agent key `pipeline-engineer` → `squad-data-pipeline-engineer`

Both produce identical prefixed names. Without access to the original squad manifest, the hook cannot determine where the squad name ends and the agent key begins.

This is only relevant if Task 3 generates convention paths inline inside agent-authority. The C4 fix (using the frontmatter store, populated during factory execution when the squad name is known) eliminates this problem entirely, since the write_paths are pre-computed with the correct squad name at load time.

**If C4's fix is adopted**: This gap disappears.  
**If Task 3 keeps inline parsing**: The executor must use a separate store that maps `prefixedAgentName → squadName`, populated during squad loading.

---

### H2 — Boulder.json explicit deny can be bypassed by broad SQUAD.yaml `write_paths`

The plan correctly states: "Squad agent CANNOT write to `docs/kord/boulder.json` (explicit deny)."

But `write_paths` in SQUAD.yaml is user-controlled. A user could set `write_paths: ["docs/kord/**"]`, which pattern-matches `docs/kord/boulder.json`. The current `isAllowedPath()` logic is purely additive — there is no deny-after-allow mechanism.

**Gap**: The plan does not specify how the boulder.json deny overrides an overly broad write_paths glob. The acceptance criteria test only checks that a squad without `write_paths` is denied access — not the case where `write_paths` includes a matching glob.

**Required fix**: The boulder.json deny must be applied as a post-allowlist explicit exclusion. After computing the merged allowlist, add:

```typescript
const SQUAD_DENY_LIST = ["docs/kord/boulder.json"]
if (agentName.startsWith("squad-") && SQUAD_DENY_LIST.some(denied => matchesPattern(relativePath, denied))) {
  throw new Error(`Squad agents cannot write to ${relativePath}.`)
}
```

This must execute **before** `isAllowedPath()` for the paths in the deny list, regardless of what write_paths contains.

---

### H3 — Task 6 dependency matrix is wrong

Task 6's dependency matrix says it "Depends On: 1, 2, 3" and can run in parallel with Task 5.

Task 6 documents the chief's new capabilities including the `task` permission auto-enable (Task 4's feature). The squad-creator should guide users to generate SQUAD.yaml that works with the new factory behavior. Without Task 4's implementation being stable, the documentation Task 6 produces may contradict the actual behavior.

**Required fix**: Task 6 should depend on Task 4. Update dependency matrix row for Task 6 from "1, 2, 3" to "1, 2, 3, 4".

---

## Medium-Severity Gaps

### M1 — Squad name collision validation is unassigned

The guardrail "Squad names must NOT collide with built-in agent names" is mentioned in the plan preamble and tested in Task 3's QA scenarios. But no implementation task is responsible for adding this check.

- **Task 1** (schema) validates model format and write_paths safety, but doesn't mention name collision.
- **Task 3** (agent-authority) tests the check, implying it runs there — but agent-authority runs per tool call, not during squad loading, making it too late and the wrong location for registration-time validation.
- The squad validator at `src/tools/squad-validate/` (mentioned in AGENTS.md) is not in scope for any task.

The correct location is during squad registration in `createAllSquadAgentConfigs()` (factory.ts) or in `loader.ts`. The plan should assign this to Task 1 or Task 2, not leave it implicit in Task 3 test scenarios.

**Required fix**: Add to Task 1's "What to do": "In `factory.ts` → `createAllSquadAgentConfigs()`, validate that each agent's prefixed name doesn't collide with entries in `DEFAULT_AGENT_ALLOWLIST` or T0/T1 names. Throw with a clear error message if detected."

---

### M2 — Multiple chiefs in same squad can create circular delegation

Nothing prevents a SQUAD.yaml from declaring two agents with `is_chief: true`. Both receive `task: "allow"` (Task 4), both get Squad Awareness listing all members including each other (factory.ts buildChiefAwarenessSection), and both see delegation syntax for the other chief. A chief could delegate to another chief who delegates back.

**Gap**: No acceptance criterion tests this, no guard is specified.

**Required fix** (low-cost): In Task 3's authority logic (or factory), detect when a squad has multiple chiefs and either: (a) warn at load time, or (b) filter out other chiefs from each chief's Squad Awareness delegation syntax. Option (b) is simpler since buildChiefAwarenessSection in factory.ts already iterates all agents and could exclude `is_chief: true` peers from the delegation syntax section.

---

### M3 — `resolveAllowlist()` in agent-authority is dead code

`agent-authority/index.ts:123–131` defines `resolveAllowlist()` which builds a merged allowlist from config. It is never called — the hook now uses `getAgentCapabilities()` directly. Task 3 adds more logic to agent-authority without addressing this dead code, which will confuse executors reading the file.

**Required fix** (optional cleanup): Remove or add a TODO comment. Not blocking, but creates confusion for Task 3's executor.

---

### M4 — Existing template content overlaps with new 6-phase loop

The current `CHIEF_COORDINATION_TEMPLATE` (chief-template.ts:23–30) has a "Coordination Workflow" section:

> 1. Analyze the Request 2. Route to Specialists 3. Monitor Progress 4. Synthesize Results

Task 5's new 6-phase loop (RECEIVE, EXPLORE, PLAN, DELEGATE, VERIFY, SYNTHESIZE) covers the same ground at a different granularity. If both are present in the extended template, chiefs receive two conflicting workflow descriptions.

Task 5 says "extend, don't replace" and "original template content preserved." But the original "Coordination Workflow" section either needs to be replaced by the new 6-phase loop or explicitly merged. The plan doesn't address which sections within the existing template should be superseded.

**Required fix**: Task 5's instructions should specify that the existing "Coordination Workflow" section (the 4-step list) is **replaced** by the new 6-phase orchestration loop, while all other sections (Self-Optimization, Quality Gates) are preserved. The distinction is: replace one section within the template, not replace the whole template.

---

## Low-Severity / Edge Cases

### L1 — Write_paths Windows absolute path validation incomplete

Task 1 says `write_paths` entries must not start with `/` (Unix absolute paths). But on Windows, absolute paths start with drive letters (`C:\`, `C:/`). The regex `^/` won't catch these. The existing `sanitizeFilePath()` in agent-authority.ts handles Windows paths for incoming tool calls but the schema validation doesn't.

**Fix** (minor): In the write_paths Zod validator, also reject strings matching `/^[A-Za-z]:[\/\\]/`.

---

### L2 — Fallback store clear semantics need test coverage

Task 2's QA scenarios test store population and retrieval but don't test `clearSquadFallbackStore()`. In the test suite, if store state leaks between tests (no clear between tests), fallback tests will produce false positives. The plan says to create a `clear` function for testing but doesn't require tests to actually call it between test cases.

**Fix**: Add to Task 7 schema that tests must call `clearSquadFallbackStore()` in `beforeEach` / `afterEach`.

---

### L3 — `AgentConfig.permission` type not verified against SDK

Task 4's auto-enable code sets `config.permission = { task: "allow" }`. The `AgentConfig` type comes from `@opencode-ai/sdk` (not local). `AgentPermissionSchema` in `src/config/schema.ts:18–25` shows `task: PermissionValue` where `PermissionValue = z.enum(["ask", "allow", "deny"])`. However, the actual `AgentConfig.permission` type from the SDK may differ from the local schema definition.

**Fix**: Task 4 should verify the SDK type before assuming `permission: Record<string, "allow" | "deny">` is the correct shape. Reference `dev.ts:627` (as the plan suggests) to confirm the runtime format.

---

## Dependency Ordering Issues

| Issue | Impact |
|-------|--------|
| C4 fix requires writing to frontmatter store inside factory.ts, which is Task 2/3 work — this scope needs to be assigned to one task | Ambiguity about which executor owns the wiring |
| C3 fix (move store to shared/) affects Task 2 file list and Task 7 import references | Test imports will point to wrong path |
| H3 fix (Task 6 depends on Task 4) doesn't change wave scheduling (both are Wave 3) but must be noted | No scheduling impact, but executor must read Task 4 output |

---

## Assumptions Needing Validation Against Code

| Plan Assumption | Actual Code State | Risk |
|----------------|------------------|------|
| "factory replaces `{SQUAD_NAME}` during prompt assembly" | `appendChiefAwarenessSection` does no string replacement | **Wrong — blocks Task 5** |
| "reuse `toFallbackEntry()` from agent-fallback.ts" | Function exists but is not exported | **Wrong — blocks Task 2** |
| "squad-fallback-store follows agent-frontmatter-capabilities-store pattern" | Pattern is in `shared/`, plan puts new store in `features/squad/` | **Wrong location — circular dep** |
| "Task 3 adds dynamic resolution to agent-authority/index.ts" | Hook calls `getAgentCapabilities()` with no sources; squad caps won't flow through | **Wrong approach — caps silently ignored** |
| "existing `SquadCapabilities` interface just needs wiring" | Interface exists in agent-capabilities.ts but `getAgentCapabilities()` is called sourceless in hook | **Incomplete — sources must be passed** |

---

## Missing Acceptance Criteria

| Task | Missing Criterion |
|------|-----------------|
| Task 3 | Boulder.json deny still applies even when SQUAD.yaml `write_paths` includes `docs/kord/**` |
| Task 4 | Chief with no `tools` field (config.permission is undefined) correctly gets `task: "allow"` set |
| Task 5 | Existing "Coordination Workflow" section is replaced (not duplicated) by the 6-phase loop |
| Task 5 | Workspace paths in template use generic text (not `{SQUAD_NAME}` literals) OR substitution is verified working |
| Task 7 | `clearSquadFallbackStore()` is called between test cases to prevent state leakage |
| Task 7 | Boulder.json blocked even when squad has broad `write_paths: ["docs/kord/**"]` |

---

## Recommended Pre-Implementation Fixes

Before dispatching Wave 1 executors, update the plan to:

1. **Task 2**: Export `toFallbackEntry` (or switch to `convertAgentFallbackSlots`). Create store in `src/shared/squad-fallback-store.ts`, not `src/features/squad/`.
2. **Task 3**: Replace "add dynamic resolution in agent-authority/index.ts" with "populate frontmatter capabilities store via `setAgentFrontmatterCapabilities()` in `createAllSquadAgentConfigs()`". Add boulder.json explicit deny test with broad write_paths.
3. **Task 4**: Confirm `AgentConfig.permission` type matches the `{ task: "allow" }` pattern via dev.ts:627 before instructing executor.
4. **Task 5**: Remove `{SQUAD_NAME}` placeholder requirement OR permit modifying `appendChiefAwarenessSection`. Clarify that the "Coordination Workflow" sub-section is replaced, not that the whole template is preserved verbatim.
5. **Task 6**: Add Task 4 as dependency.
6. **Task 1 or 2**: Assign squad name collision validation to a specific task with implementation location.
