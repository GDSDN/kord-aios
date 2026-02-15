# S05: Enrich AIOS-origin Skeleton Agents

> **Epic**: EPIC-01 Agent Foundation
> **Status**: Draft
> **Estimate**: 7h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Enrich the 7 AIOS-origin skeleton agents with full methodology prompts from AIOS agent definitions. These agents currently exist as minimal skeletons in Kord AIOS. After this story, each has a rich system prompt with role-specific methodology, decision frameworks, and operational guidelines.

## Tasks

- [ ] Enrich @sm with AIOS sm.md methodology (story creation, acceptance criteria, estimation)
- [ ] Enrich @pm with AIOS pm.md methodology (PRD creation, requirements gathering, stakeholder management)
- [ ] Enrich @po with AIOS po.md methodology (checkpoint decisions, prioritization, backlog management)
- [ ] Enrich @devops with AIOS devops.md methodology (CI/CD, deployment, git workflow, push authority)
- [ ] Enrich @data-engineer with AIOS data-engineer.md methodology (DB design, migrations, RLS, Supabase)
- [ ] Enrich @ux-design-expert with AIOS ux-design-expert.md methodology (design system, accessibility, atomic design)
- [ ] Enrich @squad-creator with AIOS squad-creator.md methodology (team composition, squad manifests)
- [ ] Verify all enriched agents maintain their existing tool declarations and model configs
- [ ] Add/update co-located tests for each enriched agent
- [ ] Run `bun test` — all tests pass

## Acceptance Criteria

- [ ] All 7 skeleton agents have rich methodology prompts (not just one-liners)
- [ ] Each agent's prompt includes: role definition, decision framework, operational guidelines, handoff rules
- [ ] Existing tool declarations and model configs untouched
- [ ] Tests verify prompt content includes methodology sections

## Files

```
src/agents/
  [sm agent file]              ← ENRICH
  [pm agent file]              ← ENRICH
  [po agent file]              ← ENRICH
  [devops agent file]          ← ENRICH
  [data-engineer agent file]   ← ENRICH
  [ux-design-expert file]      ← ENRICH
  [squad-creator file]         ← ENRICH
```

## Dev Notes

- Source methodology: `synkra-aios/.aios-core/development/agents/<agent>.md`
- Extract the methodology content (not AIOS-specific activation/config sections)
- Each agent prompt should be 500-2000 tokens of methodology — enough to guide but not bloat context
- Do NOT include AIOS activation pipeline, greeting, or config references
