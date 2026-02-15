# S05: Extend delegate-task with Executor and Story Path

> **Epic**: EPIC-02 Story & Plan Tools
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: S01 (shared types)

---

## Objective

Extend the existing `delegate-task` tool to accept `executor` and `story_path` parameters. When @build delegates a work item, it specifies which agent should execute (from the plan) and which story file to track progress against.

## Tasks

- [ ] Add `executor` parameter to delegate-task tool definition (optional string — agent name)
- [ ] Add `story_path` parameter to delegate-task tool definition (optional string — path to story file)
- [ ] When `executor` is provided, route delegation to that specific agent (override category-based routing)
- [ ] When `story_path` is provided, include it in the delegation context so the executor can call story_update
- [ ] Update existing tests for backward compatibility (no executor/story_path = existing behavior)
- [ ] Add new tests for executor routing and story_path passthrough
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Existing delegate-task behavior unchanged when new params not provided
- [ ] `executor: 'dev'` routes to @dev regardless of category heuristics
- [ ] `story_path` passed through to delegated agent's context
- [ ] All existing delegate-task tests pass
- [ ] New tests cover executor override + story_path passthrough

## Files

```
src/tools/delegate-task/
  executor.ts     ← MODIFY (add executor override logic)
  types.ts        ← MODIFY (add executor, story_path to params)
  constants.ts    ← MODIFY (update tool description)
  tools.ts        ← MODIFY (update tool definition)
  *.test.ts       ← UPDATE + NEW tests
```
