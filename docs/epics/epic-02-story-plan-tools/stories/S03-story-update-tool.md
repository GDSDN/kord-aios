# S03: Implement story_update Tool

> **Epic**: EPIC-02 Story & Plan Tools
> **Status**: Draft
> **Estimate**: 3h
> **Agent**: @dev
> **Dependencies**: S01 (shared types)

---

## Objective

Implement the `story_update` tool that modifies story markdown files: update checkbox status, change story status, append to Dev Agent Record, update file list. This is the primary tool @dev and @dev-junior use to track progress within a story.

## Tasks

- [ ] Create tool directory: `src/tools/story-update/`
- [ ] Implement `index.ts` with `createStoryUpdateTool()` factory
- [ ] Create `types.ts` with tool-specific types
- [ ] Create `constants.ts` with tool name, description
- [ ] Create `tools.ts` with tool definition (parameters: story_path, action, data)
- [ ] Implement actions: `check_task`, `uncheck_task`, `set_status`, `append_dev_notes`, `add_file`, `update_section`
- [ ] Preserve file formatting when writing back (don't destroy frontmatter or structure)
- [ ] Create `story-update.test.ts` with test fixtures
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Tool registered and callable by agents
- [ ] `check_task` toggles checkbox: `- [ ] task` → `- [x] task`
- [ ] `set_status` updates frontmatter status field
- [ ] `append_dev_notes` appends to Dev Notes section (or creates it)
- [ ] `add_file` adds entry to File List section
- [ ] File structure preserved after write (no corruption)
- [ ] Tests cover all actions + edge cases (missing sections created on demand)

## Files

```
src/tools/story-update/
  index.ts              ← NEW (createStoryUpdateTool factory)
  types.ts              ← NEW
  constants.ts          ← NEW
  tools.ts              ← NEW (tool definition)
  story-update.test.ts  ← NEW
```

## Dev Notes

- Reference AIOS: `synkra-aios/.aios-core/development/scripts/story-update-hook.js`
- Write operations must be atomic: read → parse → modify → write (no partial writes)
- Consider using a simple markdown AST or regex-based section parser
- @dev-junior uses this tool heavily — it must be reliable and fast
