# S05: Create Story DoD Checklist

> **Epic**: EPIC-07 Computation Scripts & Templates
> **Status**: Draft
> **Estimate**: 0.5h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Create the story Definition of Done checklist as a standalone file in `.kord/checklists/`. This checklist is also embedded in the `develop-story` skill (EPIC-05), but exists as a separate file so users can customize it per project.

## Tasks

- [ ] Create `.kord/checklists/story-dod.md`
- [ ] Include standard DoD items: code compiles, tests pass, lint clean, story checkboxes updated, acceptance criteria met, PR ready
- [ ] Include optional items: documentation updated, changelog entry, accessibility checked
- [ ] Mark mandatory vs optional items clearly
- [ ] Format as checkbox list for easy agent consumption

## Acceptance Criteria

- [ ] `story-dod.md` exists in `.kord/checklists/`
- [ ] Mandatory and optional items clearly distinguished
- [ ] Checklist is usable by both @dev and @dev-junior

## Files

```
.kord/checklists/
  story-dod.md    ← NEW
```
