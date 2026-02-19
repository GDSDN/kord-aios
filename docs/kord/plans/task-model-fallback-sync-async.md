# Task Model Fallback For Sync/Async Delegation

## TL;DR

> **Quick Summary**: Make `task` delegation resilient when providers/models hit credits/quota or get stuck in `retry` without surfacing errors, by filtering fallback chains to connected/available providers, adding provider-health bans for CreditsError, and unifying sync and async behavior so sync never silently interrupts.
>
> **Deliverables**:
> - Reliable fallback selection that never picks disconnected providers (e.g., github-copilot when not connected)
> - Sync `task(run_in_background=false)` that returns either a fallback result, a background handoff, or a clear exhausted-fallback error
> - Shared fallback utilities used consistently across sync delegation, background-agent, and prompt retry
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Evidence + reproduction → fallback filtering + provider health → unify sync/async execution

---

## Context

### Original Request
- Implement model fallback for `task` delegation (sync + async) when quota/credits is hit.
- Compare with “omoc original” behavior and adopt the most reliable approach.
- Produce a plan for analysis + refactor; current executor-only approach is not working.

### Evidence Observed (from logs + user report)
- Sync subagent sessions can enter `sessionStatus=retry` for a long time; initial prompt may time out.
- Credits/quota failure surfaces as an OpenCode backend error (APIError 401) containing `CreditsError` (insufficient balance).
- User found a concrete mis-fallback: `providerID: "github-copilot"` was selected even though it is not configured/connected, leading to a provider/model not-found error with fuzzysort suggestions.
- Likely source of the above: `src/shared/model-resolution-pipeline.ts` dynamic routing currently picks the *first provider listed in the model schema* for a routed model (e.g., `claude-opus-4-6`), without checking connected providers or availability. If schema ordering starts with `github-copilot`, we can select it even when unused.
- Background-agent already has “retry-stuck → abort + re-prompt with fallback model” logic, but sync behavior diverges and can end as “Tool execution was interrupted”.
- “omoc original” reference for comparison is a local mirror of the current `oh-my-opencode` branch at `D:\dev\oh-my-opencode`.

### Analyst Review
- Attempted, but the analyst agent returned no text output in this environment.
- Guardrail: do not depend on analyst output; make the plan self-contained with concrete references and verifications.

---

## Work Objectives

### Core Objective
Make model fallback deterministic and evidence-driven for both sync and async `task` delegation so that:
- disconnected providers are never selected,
- CreditsError/quota results in immediate provider ban and reroute,
- “retry without output” results in fallback/reroute,
- sync mode always returns a result or a clear error within a bounded time.

### Concrete Deliverables
- Shared helper (new module) that turns `fallbackChain` into runtime-safe fallback candidates (connected providers + available models only).
- Provider health/ban mechanism for CreditsError (and similar non-retryable billing failures).
- Sync path reworked to reuse background-agent reliability (or a near-identical state machine) so it cannot get “stuck” invisibly.
- Regression tests covering:
  - skipping disconnected providers (github-copilot)
  - CreditsError → provider ban → next fallback model
  - `retry` stuck → fallback attempt

### Must NOT Have (Guardrails)
- Do NOT remove `github-copilot` from global fallback chains in `src/shared/model-requirements.ts` (other users may rely on it).
- Do NOT “update/replace” kord-aios behavior to match oh-my-opencode; treat `D:\dev\oh-my-opencode` as a learning baseline and adapt the ideas while preserving all kord-aios customizations.
- Do NOT introduce a new hook unless instrumentation proves tool-level refactor can’t observe the failure mode.
- Do NOT rely on “manual reproduction with out-of-credits account” for Definition of Done; use mocks/tests.
- Do NOT swallow errors; all exhaustion cases must produce a clear error string including provider/model attempts.

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> All verification is executed by the agent via commands and automated tests.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after (add focused unit/integration tests around fallback selection + delegation state machine)
- **Framework**: `bun test`

### Execution Prerequisite
- At least one provider with working credentials/credits must be connected; otherwise no fallback is possible and even the test/delegation harness may fail.
- The plan’s core fix is to *avoid* selecting disconnected providers (e.g., github-copilot) and to reroute away from providers that are out of credits.

### Agent-Executed QA Scenarios (MANDATORY)

Scenario: Disconnected provider is skipped
  Tool: Bash
  Steps:
    1. `bun test src/tools/delegate-task/*.test.ts`
  Expected Result: A new test demonstrates fallback chain containing `github-copilot` does not attempt it when not connected.

Scenario: CreditsError triggers provider ban and reroute
  Tool: Bash
  Steps:
    1. `bun test src/shared/*fallback*.test.ts` (or the added test file)
  Expected Result: The test stubs a CreditsError and verifies provider is marked unhealthy and next provider/model is used.

Scenario: Sync delegation hands off to background when stuck
  Tool: Bash
  Steps:
    1. `bun test src/tools/delegate-task/*sync*.test.ts`
  Expected Result: The test simulates `session.status=retry` without meaningful output and verifies:
    - fallback attempt occurs, OR
    - sync returns a background handoff string with task/session metadata.

---

## Execution Strategy

Wave 1 (Start Immediately):
- Task 1, 2 (instrumentation + “omoc original” comparison)

Wave 2 (After Wave 1):
- Task 3, 4, 5 (shared filtering + provider health + unify sync/async)

Critical Path: Task 1 → Task 3 → Task 5

---

## TODOs

- [ ] 1. Baseline + Instrumentation for Failure Surfaces

  **What to do**:
  - Add explicit structured logs for model selection and fallback attempt decisions in:
    - sync task delegation path
    - async/background-agent fallback path
    - prompt retry path
  - Ensure logs include:
    - connected providers snapshot
    - available model snapshot (or at least counts + provider keys)
    - candidate fallback list after filtering
    - last error classification (CreditsError vs ModelNotFound vs timeout vs retry-stuck)

  **Must NOT do**:
  - Do not log secrets or full prompt content.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `git-master` (for safe diffs + atomic commits)

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1

  **References**:
  - `src/tools/delegate-task/tools.ts` - entry point; passes `fallbackChain` into sync/async executors.
  - `src/tools/delegate-task/executor.ts` - sync path state machine + fallback attempts.
  - `src/features/background-agent/manager.ts` - existing retry-stuck fallback logic to emulate.
  - `src/shared/model-requirements.ts` - fallback chains contain providers that may be disconnected (github-copilot).
  - `src/shared/model-resolution-pipeline.ts` - dynamic routing and provider selection logic.
  - `src/shared/model-schema.ts` - schema ordering can put `github-copilot` first.

  **Acceptance Criteria**:
  - `bun test src/tools/delegate-task/tools.test.ts` → PASS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Instrumentation appears for sync task
    Tool: Bash
    Preconditions: Local build uses current code
    Steps:
      1. Run: bun test src/tools/delegate-task/tools.test.ts
      2. Assert: tests pass and include at least one log assertion (if added)
    Expected Result: instrumentation code is exercised by tests
  ```

- [ ] 2. Compare With “omoc original” Model Fallback

  **What to do**:
  - Use the local mirror at `D:\dev\oh-my-opencode` (updated to latest) as the “omoc original” baseline.
  - Extract the decision rules used there for:
    - filtering to connected providers
    - handling quota/credits failures
    - detecting retry-stuck
    - choosing provider for a given model when multiple providers offer the same model
  - Map those rules onto kord-aios constraints (no regressions):
    - which parts can be adopted verbatim
    - which parts need adaptation due to different tooling/hooks
    - which parts we explicitly must *not* adopt because they would remove kord-aios customizations
  - Write a short design note (markdown) summarizing:
    - what “omoc original” does
    - what we do today
    - the chosen adaptation strategy + why

  **Must NOT do**:
  - Do not implement speculative behavior without confirming the original reference.

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: `git-master`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1

  **References**:
  - `docs/kord/drafts/task-model-fallback-sync-async.md` - contains current observed failures.
  - `D:\dev\oh-my-opencode` - baseline implementation to study and adapt.

  **Acceptance Criteria**:
  - Plan note produced (markdown in PR body or docs) with:
    - “omoc original” definition
    - concrete differences
    - rationale for chosen approach

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Upstream comparison evidence captured
    Tool: Bash
    Steps:
      1. Verify `D:\dev\oh-my-opencode` exists and is up-to-date
      2. Search for model selection / fallback / retry-stuck handling
      3. Save excerpts/links into a markdown note
    Expected Result: The note includes concrete code references and explains differences
  ```

- [ ] 3. Runtime-Safe Fallback Candidate Filtering

  **What to do**:
  - Add new module: `src/shared/fallback-candidates.ts`
  - Implement `buildFallbackCandidates(...)` that takes:
    - `fallbackChain: FallbackEntry[]`
    - connected providers list (from cache or live)
      - prefer `readConnectedProvidersCache()` for fast path
      - if missing, use `getConnectedProviders(client)`
    - available models list (from `fetchAvailableModels(client, { connectedProviders })`)
  - Output a flattened ordered list of `{providerID, modelID, variant?}` that:
    - excludes disconnected providers
    - excludes provider/model pairs not present in availability
    - preserves user-configured ordering
    - returns diagnostic metadata for logging (e.g., skippedProviders, skippedModels)
  - Integrate this helper into:
    - sync executor fallback
    - background-agent retry-stuck fallback
    - any other place calling `promptWithRetry` with a fallback chain
  - Apply the same “connected/available provider selection” rule to dynamic routing:
    - Update `src/shared/model-resolution-pipeline.ts` so when dynamic routing chooses a model, it selects a provider that is connected/available (not simply `providers[0]`).

  **Tests**:
  - Extend `src/shared/model-resolution-pipeline.test.ts` with cases covering dynamic routing provider choice:
    - When schema lists `["github-copilot", "anthropic"]` for `claude-opus-4-6`, and only `anthropic` is connected/available, the resolved model must be `anthropic/claude-opus-4-6`.
    - When no providers in schema are connected, dynamic routing must return `undefined` (fall through to fallback chain/system default) rather than returning a disconnected provider.

  **Tests**:
  - Add new test file: `src/shared/fallback-candidates.test.ts`
  - Cover:
    - fallbackChain contains `github-copilot` but connected providers do not → it is excluded
    - connected providers unknown + `fetchAvailableModels` returns empty set → helper returns empty candidates with clear diagnostic
    - ordering is preserved after filtering

  **Must NOT do**:
  - Do not change the fallbackChain definitions; only filter at runtime.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `git-master`

  **Parallelization**:
  - Can Run In Parallel: NO
  - Parallel Group: Wave 2
  - Blocked By: Task 1

  **References**:
  - `src/shared/model-availability.ts` - how availability is fetched and represented.
    - `getConnectedProviders(client)`
    - `fetchAvailableModels(client, { connectedProviders })`
  - `src/shared/connected-providers-cache.ts` - cached provider connectivity.
    - `readConnectedProvidersCache()`
  - `src/shared/model-requirements.ts` - fallbackChain source (contains github-copilot).
  - `src/shared/model-resolution-pipeline.ts` - dynamic route provider selection to fix.
  - `src/shared/model-schema.ts` - source of provider lists per model.
  - `src/shared/model-router.ts` - router output shape and variant selection.

  **Acceptance Criteria**:
  - New tests added to prove:
    - github-copilot is skipped when not connected
    - fallback list becomes empty if nothing is connected, with a clear error
  - `bun test` → PASS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Filtering prevents Provider/Model not found
    Tool: Bash
    Steps:
      1. Run: bun test
    Expected Result: Tests demonstrate disconnected provider never selected
  ```

- [ ] 4. Credits/Quota Failure Classification + Provider Health Ban

  **What to do**:
  - Add an error classifier that detects billing/quota issues (e.g., CreditsError / insufficient balance) from:
    - APIError payloads
    - status codes
    - known message substrings
  - Add new module: `src/shared/provider-health.ts`
  - Maintain a short-lived in-memory “provider health” map (TTL-based):
    - mark provider as unhealthy for N minutes when CreditsError happens
    - make selection/fallback skip unhealthy providers
  - Ensure both sync + background-agent paths consult the same health state.

  **Tests**:
  - Add new test file: `src/shared/provider-health.test.ts`
  - Cover:
    - CreditsError marks provider unhealthy
    - ban expires after TTL
    - selection skips unhealthy provider

  **Must NOT do**:
  - Do not permanently disable providers; health bans must expire.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `git-master`

  **Parallelization**:
  - Can Run In Parallel: NO
  - Parallel Group: Wave 2
  - Blocked By: Task 3

  **References**:
  - `src/shared/prompt-retry.ts` - central retry/fallback utility (should integrate classification).
    - `isQuotaError(...)` and `parseModelSuggestion(...)` patterns to reuse
  - `src/features/background-agent/manager.ts` - current retry-stuck logic; extend with provider ban.

  **Acceptance Criteria**:
  - Unit test stubs an APIError CreditsError and verifies provider is banned and next provider is used.
  - `bun test` → PASS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: CreditsError triggers reroute
    Tool: Bash
    Steps:
      1. Run: bun test
    Expected Result: A dedicated test asserts ban + fallback behavior
  ```

- [ ] 5. Unify Sync Delegation Reliability With Background-Agent

  **What to do**:
  - Refactor sync `task(run_in_background=false)` to reuse the background-agent state machine semantics:
    - either by internally launching a background task and waiting up to a sync SLA,
    - or by extracting a shared “delegation runner” used by both sync + background.
  - If sync cannot complete within a strict SLA (e.g., 20-30s), return a background handoff instead of hanging/interruption:
    - include task_id + session_id
    - instruct to use `background_output`
  - Ensure the caller always gets a string response.

  **Implementation Note**:
  - Add a deterministic SLA for sync mode (e.g., 20-30s). If exceeded, return a background handoff string instead of continuing to poll indefinitely.
  - The handoff string must include: `task_id` (if created) and `session_id`, plus the exact follow-up command: `background_output(task_id=...)`.

  **Must NOT do**:
  - Do not change `task` tool contract inputs.

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: `git-master`

  **Parallelization**:
  - Can Run In Parallel: NO
  - Parallel Group: Wave 2
  - Blocked By: Task 3, Task 4

  **References**:
  - `src/tools/delegate-task/executor.ts` - current sync implementation.
  - `src/tools/delegate-task/tools.ts` - decides sync vs background; ideal place to centralize the handoff decision.
  - `src/features/background-agent/manager.ts` - robust fallback for retry-stuck.
  - `src/features/background-agent/result-handler.ts` - formatting and completion semantics.

  **Acceptance Criteria**:
  - New tests simulate sync stuck states and assert:
    - fallback attempts skip disconnected providers
    - sync returns background handoff before host interrupts
  - `bun test` → PASS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Sync returns handoff under retry-stuck
    Tool: Bash
    Steps:
      1. Run: bun test src/tools/delegate-task/*sync*.test.ts
    Expected Result: Output contains task_id/session_id handoff string in simulated long-retry case
  ```

---

## Commit Strategy

| After Task | Message | Notes |
|------------|---------|------|
| 1 | `feat(task): add fallback instrumentation` | logs only + tests stable |
| 3 | `fix(task): filter fallback to connected providers` | prevents github-copilot mis-fallback |
| 4 | `fix(model): ban providers on CreditsError` | central health mechanism |
| 5 | `refactor(task): unify sync with background runner` | reliability improvement |

---

## Success Criteria

### Verification Commands
```bash
bun test
bun run typecheck
bun run build
```

### Final Checklist
- [ ] Sync `task` never selects disconnected providers (e.g., github-copilot when not connected)
- [ ] CreditsError triggers fallback without manual intervention
- [ ] Retry-stuck triggers fallback or background handoff within SLA
- [ ] All tests pass
