# Plan: Operational Stability Hardening (Quota Fallback + Authority)

> Status: Implemented
> Created: 2026-02-18
> Scope: Fix silent delegation failures on quota/rate-limit, align agent write authority with Synkra AIOS workflow, and remove token-wasting permission dead-ends.

## Context

Critical operational bugs were reported:

- Delegation fails silently when the primary model hits quota/rate-limit; fallbacks do not trigger reliably (sync + background).
- Agent write restrictions are inconsistent with the intended Synkra workflow (agents cannot write the docs they are supposed to produce; orchestrators cannot write outputs they must read).
- Dev-junior routing is misunderstood: it works via `category`, but fails if callers pass `subagent_type="dev-junior"` directly.

## Root Causes (Verified)

1) Prompt failures were not reliably detected.
- OpenCode SDK defaults to returning `{ error }` when `throwOnError=false`; our retry wrapper previously only caught thrown exceptions.

2) Background tasks could remain `pending` forever.
- If background `startTask()` threw before setting `task.status="running"` (e.g. session creation failure), the task stayed pending and was never notified.

3) Several call sites bypassed the retry/fallback wrapper.
- Continuations and some subagent invocations used `client.session.prompt(...)` directly.

4) Authority mismatch.
- Hard enforcement via `agent-authority` allowlist blocked expected writes (not prompt-level only).
- Architect tool restrictions explicitly denied `write/edit`, making architecture outputs impossible even if allowlisted.

## Changes Implemented

### Wave 1: Reliability (Quota/Rate-limit + Silent Failure)

- [x] Treat returned `{ error }` from `session.prompt(...)` as a failure and drive retry/fallback.
  - Files: `src/shared/prompt-retry.ts`
- [x] Add `createSessionWithRetry(...)` for session creation robustness on transient errors.
  - Files: `src/shared/prompt-retry.ts`
- [x] Ensure background tasks cannot remain silently pending if `startTask()` throws.
  - Files: `src/features/background-agent/manager.ts`
- [x] Route high-risk `session.prompt(...)` call sites through `promptWithRetry(...)`:
  - Delegate-task sync continuation
  - call-kord-agent sync
  - Files: `src/tools/delegate-task/executor.ts`, `src/tools/call-kord-agent/tools.ts`

### Wave 2: Authority Alignment (Synkra Outputs)

- [x] Align allowlists so orchestrators can write the outputs they are supposed to read (`docs/kord/**`).
  - Files: `src/hooks/agent-authority/constants.ts`
- [x] Allow PM to author epics under `docs/epics/**`.
  - Files: `src/hooks/agent-authority/constants.ts`
- [x] Allow Architect to write architecture docs while staying path-restricted.
  - Files: `src/hooks/agent-authority/constants.ts`, `src/agents/architect.ts`

### Wave 3: Delegation Ergonomics

- [x] Improve retry guidance for the common misuse: `subagent_type="dev-junior"`.
  - Files: `src/hooks/delegate-task-retry/index.ts`

## Acceptance Criteria

- [x] A quota/rate-limit error returned as `{ error }` triggers `promptWithRetry()` fallback.
- [x] A background task that fails to start transitions to `error` (no stuck `pending`) and is eligible for notification.
- [x] `task(session_id=...)` continuation uses retry/fallback instead of direct prompt.
- [x] Orchestrators can write `docs/kord/**` outputs.
- [x] Architect can write to architecture doc paths (path-restricted).

## Verification

Commands:

```bash
bun test
bun run typecheck
bun run build
```

## Follow-ups (Optional)

- [ ] Automatic QA gate after edits (configurable) rather than reminder-only.
  - Notes: The repo already has a story-based quality-gate hook keyed off `story_path` + `quality_gate` frontmatter; an auto-QA gate would be a separate mechanism.
