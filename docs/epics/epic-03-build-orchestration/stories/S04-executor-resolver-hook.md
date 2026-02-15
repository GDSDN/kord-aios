# S04: Implement executor-resolver Hook

> **Epic**: EPIC-03 Build Orchestration Engine
> **Status**: Draft
> **Estimate**: 5h
> **Agent**: @dev
> **Dependencies**: S02 (build hook must call executor-resolver)

---

## Objective

Implement the executor-resolver hook that automatically loads the correct skill for the executor agent based on plan item metadata. When @build delegates a story/task, this hook intercepts the delegation and injects the appropriate skill (e.g., `develop-story` for @dev, `qa-review-story` for @qa, `create-prd` for @pm).

## Tasks

- [ ] Create hook directory: `src/hooks/executor-resolver/`
- [ ] Implement `createExecutorResolverHook()` factory
- [ ] Define executor→skill mapping table (configurable)
- [ ] Hook point: `tool.execute.before` on delegate-task tool
- [ ] When delegation has `executor` param, look up skill mapping and inject `load_skills` into delegation
- [ ] Support override: plan item can specify `skills: [custom-skill]` to override default mapping
- [ ] Handle missing skill gracefully (log warning, proceed without skill)
- [ ] Create co-located tests with mock delegation scenarios
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Hook intercepts delegate-task calls with executor param
- [ ] Default mapping: dev→develop-story, qa→qa-review-story, pm→create-prd, sm→create-next-story, devops→git-push, architect→architecture-design
- [ ] Plan item `skills:` field overrides default mapping
- [ ] Missing skill doesn't block execution (graceful degradation)
- [ ] Tests cover: default mapping, custom override, missing skill

## Files

```
src/hooks/
  executor-resolver/
    index.ts                    ← NEW (createExecutorResolverHook factory)
    types.ts                    ← NEW
    constants.ts                ← NEW (executor→skill mapping table)
    executor-resolver.test.ts   ← NEW
```

## Dev Notes

- This hook is the primary mechanism for star command absorption (Phase 1)
- The mapping table should be configurable via `opencode.json` for user customization
- Star commands like `*develop` are equivalent to: executor=dev → load develop-story skill
