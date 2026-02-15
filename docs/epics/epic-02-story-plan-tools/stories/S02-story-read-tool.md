# S02: Implement story_read Tool

> **Epic**: EPIC-02 Story & Plan Tools
> **Status**: Draft
> **Estimate**: 3h
> **Agent**: @dev
> **Dependencies**: S01 (shared types)

---

## Objective

Implement the `story_read` tool that parses story markdown files into structured data. Agents use this to read story status, tasks, acceptance criteria, file lists, and Dev Agent Record sections.

## Tasks

- [ ] Create tool directory: `src/tools/story-read/`
- [ ] Implement `index.ts` with `createStoryReadTool()` factory
- [ ] Create `types.ts` with tool-specific types (import shared StoryFile)
- [ ] Create `constants.ts` with tool name, description
- [ ] Create `tools.ts` with tool definition (parameters: story_path)
- [ ] Parse: YAML frontmatter, status, checkbox tasks, file list, acceptance criteria, dev notes
- [ ] Return structured `StoryFile` object
- [ ] Handle edge cases: missing sections, malformed frontmatter, empty files
- [ ] Create `story-read.test.ts` with test fixtures
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] Tool registered and callable by agents
- [ ] Parses standard story markdown format correctly
- [ ] Returns typed StoryFile with all sections populated
- [ ] Handles missing/empty sections gracefully (returns null/empty, not error)
- [ ] Tests cover: valid story, missing sections, malformed frontmatter

## Files

```
src/tools/story-read/
  index.ts           ← NEW (createStoryReadTool factory)
  types.ts           ← NEW
  constants.ts       ← NEW
  tools.ts           ← NEW (tool definition)
  story-read.test.ts ← NEW
```

## Dev Notes

- Reference AIOS format: `synkra-aios/.aios-core/development/scripts/story-manager.js` (parseStoryFile function)
- Story format: YAML frontmatter (---) + markdown sections (## Status, ## Tasks, ## Acceptance Criteria, ## File List, ## Dev Notes)
- Follow existing OMOC tool patterns (e.g., `src/tools/delegate-task/`)
