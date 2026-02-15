# EPIC-02: Story & Plan Tools

> **Wave**: A (no prerequisites — can start immediately)
> **Scope**: `src/tools/story-read/`, `story-update/`, `plan-read/`, `squad-load/`, `delegate-task/`, `src/shared/types/`
> **Estimate**: ~15h
> **Status**: In Progress
> **Parallel OK with**: EPIC-01, EPIC-05, EPIC-07

---

## Objective

Implement the core tools that enable story-driven development: reading/parsing plan documents, reading/updating story files, loading squad manifests, and extending the delegate-task tool with executor parameters. These tools are the foundation that Wave B epics (EPIC-03, EPIC-04) depend on.

## Source Documents

- `docs/researches/kord-aios-tools-hooks-commands.md` §2 — tool decisions
- `docs/researches/kord-aios-master-decision.md` §2.4 — tool summary
- `docs/researches/kord-aios-star-commands-scripts-investigation.md` §2.2 — scripts→tools
- AIOS source: `synkra-aios/.aios-core/development/scripts/story-manager.js` — story CRUD reference

## Acceptance Criteria

- [ ] `story_read` tool parses story markdown files (frontmatter, checkboxes, status, sections)
- [ ] `story_update` tool updates story checkboxes, status, Dev Agent Record
- [ ] `plan_read` tool parses plan documents (epics, stories, tasks, executors, waves)
- [ ] `squad_load` tool loads SQUAD.yaml manifests
- [ ] `delegate-task` extended with `executor` and `story_path` parameters
- [ ] Shared types exported: `StoryFile`, `PlanDocument`, `SquadManifest`, `TaskHierarchy`
- [ ] All tools have co-located tests
- [ ] All existing tests pass (`bun test`)

## Kickoff Checklist

- [ ] Confirm EPIC-01 has no overlapping files with EPIC-02 (agents-only vs tools/shared types)
- [ ] Start S01: define shared types in `src/shared/types/`
- [ ] Line up test fixtures for story/plan parsing
- [ ] Verify tool directory names align with file ownership map

## Stories

| ID | Story | Estimate | Dependencies |
|----|-------|----------|-------------|
| S01 | Define shared types (StoryFile, PlanDocument, SquadManifest, TaskHierarchy) | 2h | None |
| S02 | Implement story_read tool | 3h | S01 |
| S03 | Implement story_update tool | 3h | S01 |
| S04 | Implement plan_read tool | 3h | S01 |
| S05 | Extend delegate-task with executor and story_path params | 2h | S01 |
| S06 | Implement squad_load tool | 2h | S01 |

## File Ownership

```
src/
  shared/types/
    story.ts             ← NEW (StoryFile, StoryStatus, StoryTask)
    plan.ts              ← NEW (PlanDocument, PlanItem, Wave, TaskHierarchy)
    squad.ts             ← NEW (SquadManifest, SquadConfig)
  tools/
    story-read/          ← NEW (index.ts, types.ts, constants.ts, tools.ts, *.test.ts)
    story-update/        ← NEW
    plan-read/           ← NEW
    squad-load/          ← NEW
    delegate-task/       ← MODIFY (add executor, story_path params)
```

## Notes

- **CRITICAL**: S01 (shared types) must be done first — all other stories depend on these interfaces
- Wave B epics (EPIC-03, EPIC-04) code against these tool interfaces, so type exports must be stable
- Story file format follows AIOS conventions: YAML frontmatter + markdown sections + checkbox tasks
- Plan document format is the output of @plan — needs to support both story-driven and task-driven plans
