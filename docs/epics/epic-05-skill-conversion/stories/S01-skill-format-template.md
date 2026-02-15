# S01: Define SKILL.md Format Template and Conversion Guide

> **Epic**: EPIC-05 Skill Conversion
> **Status**: Draft
> **Estimate**: 3h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Define the standard SKILL.md format that all converted AIOS tasks will use. Create a conversion guide and optionally a conversion helper script that transforms AIOS task markdown into SKILL.md format. This template is the contract for S02-S09.

## Tasks

- [ ] Define SKILL.md YAML frontmatter schema: title, description, agent, tags, domain, priority
- [ ] Define SKILL.md body structure: objective, process, tools, pre/post conditions, acceptance criteria
- [ ] Create example SKILL.md by converting one representative AIOS task manually
- [ ] Document the conversion rules: what to keep, what to strip, what to rename
- [ ] Strip rules: remove AIOS execution modes (YOLO/Interactive/Pre-Flight), AIOS task format YAML, AIOS-specific paths
- [ ] Keep rules: process steps, methodology, checklists, error handling, best practices
- [ ] Create conversion guide: `.kord/skills/CONVERSION-GUIDE.md`
- [ ] Optionally: create a simple script that auto-converts AIOS task markdown → SKILL.md format
- [ ] Verify OMOC skill loader can discover and load the example SKILL.md

## Acceptance Criteria

- [ ] SKILL.md format documented with clear schema
- [ ] Example skill passes OMOC skill loader validation
- [ ] Conversion guide covers: frontmatter mapping, section mapping, strip rules, keep rules
- [ ] All subsequent batch stories (S02-S09) follow this format

## Files

```
.kord/skills/
  CONVERSION-GUIDE.md       ← NEW (conversion rules)
  _template/
    SKILL.md                ← NEW (template)
    example-develop-story.md ← NEW (converted example)
```

## Dev Notes

- The OMOC skill loader expects: YAML frontmatter with `description` field, markdown body
- AIOS tasks have rich structure (V1.0 format with YAML task definitions) — most of this is stripped
- What survives: the Process section, checklists, error handling, methodology guidance
- Reference: `docs/researches/skill-system-deep-analysis.md` for format comparison
