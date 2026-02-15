# S04: Adapt 8 AIOS-internal Templates for Framework Evolution

> **Epic**: EPIC-07 Computation Scripts & Templates
> **Status**: Draft
> **Estimate**: 2h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Adapt the 8 AIOS-internal templates (agent-template, personalized-*, framework-specific) for Kord AIOS framework evolution. These templates were previously marked SKIP but are now ADAPT — they contain useful patterns for creating new agents, customizing agent behavior, and extending the framework.

## Tasks

- [ ] Identify all 8 AIOS-internal templates from `kord-aios-skills-templates-scripts.md` §2
- [ ] Adapt each template: replace AIOS-specific references with Kord AIOS equivalents
- [ ] Update paths: `.aios-core/` → `.kord/`, AIOS agent names → Kord agent names
- [ ] Update config references: AIOS config format → opencode.json format
- [ ] Place in `.kord/templates/framework/`
- [ ] Verify templates are valid markdown with correct placeholders

## Acceptance Criteria

- [ ] 8 adapted templates in `.kord/templates/framework/`
- [ ] No AIOS-specific paths or references remain
- [ ] Templates use Kord AIOS naming conventions
- [ ] Placeholders clearly marked (e.g., `{{agent_name}}`, `{{description}}`)

## Files

```
.kord/templates/framework/
  agent-template.md           ← ADAPT
  personalized-prompt.md      ← ADAPT
  ... (8 total adapted templates)
```
