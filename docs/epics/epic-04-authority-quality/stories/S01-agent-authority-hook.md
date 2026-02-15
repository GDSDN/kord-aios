# S01: Implement agent-authority Hook

> **Epic**: EPIC-04 Authority & Quality System
> **Status**: Draft
> **Estimate**: 5h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Implement the agent-authority hook that enforces file and git operation permissions per agent. Each agent has designated file paths it can write to (defined in the contracts). This hook intercepts file write/edit/bash tools and blocks unauthorized operations.

## Tasks

- [ ] Create hook directory: `src/hooks/agent-authority/`
- [ ] Implement `createAgentAuthorityHook()` factory
- [ ] Define agent→path permission map in constants (from contracts document)
- [ ] Hook point: `tool.execute.before` on write_file, edit_file, bash tools
- [ ] Check current agent against permission map for target file path
- [ ] Block: git push/merge for non-@devops agents (intercept bash tool git commands)
- [ ] Block: source code writes for non-@dev/@dev-junior agents
- [ ] Allow: each agent writes to its designated docs/kord/ paths
- [ ] Provide clear error message when blocking: "Agent @X does not have write permission for path Y"
- [ ] Support allowlist overrides in config (for edge cases)
- [ ] Create co-located tests with mock tool executions
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] @dev can write to src/ but not git push
- [ ] @devops can git push but delegated source writes go through @dev
- [ ] @pm can write to docs/kord/plans/ but not src/
- [ ] @plan-analyzer/@plan-reviewer cannot write anything (read-only)
- [ ] Config allowlist overrides work
- [ ] Clear error messages on blocked operations
- [ ] Tests cover: allowed write, blocked write, git push block, allowlist override

## Files

```
src/hooks/
  agent-authority/
    index.ts                    ← NEW
    types.ts                    ← NEW
    constants.ts                ← NEW (permission map from contracts)
    agent-authority.test.ts     ← NEW
```

## Dev Notes

- Permission map source: `docs/researches/kord-aios-contracts.md` §1.1, §1.2, §1.3
- Hook must be lightweight — it runs on EVERY tool execution
- Use glob patterns for path matching (e.g., `src/**/*.ts` for @dev)
- Git command detection: check bash tool args for `git push`, `git merge`, `git pr`
