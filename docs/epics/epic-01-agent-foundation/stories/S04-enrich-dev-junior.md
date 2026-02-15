# S04: Enrich @dev-junior with Story Awareness

> **Epic**: EPIC-01 Agent Foundation
> **Status**: Draft
> **Estimate**: 3h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Enhance @dev-junior (sisyphus-junior) with lighter story awareness. Currently @dev-junior handles atomic tasks only. After this story, it can also handle atomic stories: update story checkboxes via story_update tool, follow a mini Definition-of-Done checklist, and report story completion status.

## Tasks

- [ ] Update sisyphus-junior prompt to include story awareness directives
- [ ] Add `story_update` to @dev-junior's allowed tool list
- [ ] Add mini-DoD checklist to prompt (subset of full DoD: tests pass, lint clean, story checkboxes updated)
- [ ] Add story context section: "If working on a story, update checkboxes as you complete tasks"
- [ ] Preserve existing atomic task capability — story awareness is additive, not replacing
- [ ] Update co-located tests to verify story awareness in prompt
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] @dev-junior prompt includes story awareness section
- [ ] `story_update` tool listed in agent's tool access
- [ ] Mini-DoD checklist embedded in prompt
- [ ] Existing atomic task behavior unchanged
- [ ] Tests verify new prompt sections

## Files

```
src/agents/
  sisyphus-junior/      ← MODIFY (prompt enrichment)
    index.ts
    *.test.ts           ← UPDATE
```

## Dev Notes

- @dev-junior is the DEFAULT executor for @build — it handles most work items
- Story awareness must be lightweight: no heavy methodology, just checkbox updates + mini-DoD
- Full DoD is for @dev (complex work). @dev-junior gets a subset: compile, test, lint, update story
- Reference: `docs/researches/kord-aios-agent-audit.md` §@dev-junior section
