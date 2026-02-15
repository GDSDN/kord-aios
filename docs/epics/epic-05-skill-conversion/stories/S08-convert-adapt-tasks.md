# S08: Convert 13 ADAPT Tasks (Strip Engine Overlap)

> **Epic**: EPIC-05 Skill Conversion
> **Status**: Draft
> **Estimate**: 5h
> **Agent**: @dev
> **Dependencies**: S01 (format template)

---

## Objective

Convert the 13 ADAPT tasks that have unique methodology but contain engine-overlap content. These require careful editing: strip AIOS activation pipeline, boulder-state manipulation, build-hook logic, and delegate-task references while preserving the unique methodology content.

## Tasks

- [ ] Identify all 13 ADAPT tasks from `aios-skill-catalog.md`
- [ ] For each task: identify engine-overlap sections (activation, config, delegation, state management)
- [ ] Strip engine-overlap content, keep methodology
- [ ] Convert to SKILL.md format following CONVERSION-GUIDE.md
- [ ] Place in appropriate domain directories
- [ ] Key ADAPT tasks: 5 squad-creator tasks, create-agent, story-checkpoint, dev-validate-next-story, and others
- [ ] Verify no engine logic leaked into skill content
- [ ] Verify each SKILL.md has valid frontmatter

## Acceptance Criteria

- [ ] 13 ADAPT tasks converted to SKILL.md
- [ ] Zero engine-overlap content remains (no activation pipeline, no boulder-state, no delegate-task)
- [ ] Unique methodology preserved
- [ ] All have valid YAML frontmatter

## Files

```
.kord/skills/
  squad/
    squad-creator-*.md     ← 5 ADAPT tasks
  dev/
    create-agent.md        ← ADAPT
    validate-next-story.md ← ADAPT
  product/
    story-checkpoint.md    ← ADAPT
  ... (remaining ADAPT tasks in domain dirs)
```

## Dev Notes

- ADAPT tasks are the trickiest — they mix engine logic with methodology
- Engine logic examples to strip: `require('./unified-activation-pipeline')`, boulder state reads, delegate-task calls
- Methodology examples to keep: squad composition rules, agent creation guidelines, story validation criteria
- Reference: `docs/researches/aios-skill-catalog.md` for per-task ADAPT notes
