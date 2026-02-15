# EPIC-01: Agent Foundation

> **Wave**: A (no prerequisites — can start immediately)
> **Scope**: `src/agents/` only
> **Estimate**: ~20h
> **Parallel OK with**: EPIC-02, EPIC-05, EPIC-07

---

## Objective

Import OMOC agent prompts for merged agents, create plan-internal agents (plan-analyzer, plan-reviewer), enrich AIOS-origin skeleton agents with methodology, and clean all mythology/persona references. Result: 20 production-ready agent definitions.

## Source Documents

- `docs/researches/kord-aios-agent-audit.md` — per-agent decisions
- `docs/researches/kord-aios-master-decision.md` §2.1 — agent summary table
- OMOC source: `kord-aios/src/agents/` — existing agent implementations
- AIOS source: `synkra-aios/.aios-core/development/agents/` — methodology content

## Acceptance Criteria

- [x] All 20 agents defined in `src/agents/`
- [x] Zero mythology references (Greek, zodiac, persona names)
- [x] `@plan-analyzer` and `@plan-reviewer` registered as plan-internal agents
- [x] `@dev-junior` has story awareness (story_update tool access, mini-DoD)
- [x] 7 AIOS-origin skeleton agents enriched with full methodology prompts
- [ ] All existing tests pass (`bun test`)
- [x] New agents have co-located tests

## Stories

| ID | Story | Estimate | Dependencies | Status |
|----|-------|----------|-------------|--------|
| S01 | Import merged agent prompts (kord, plan, build, dev, architect) | 5h | None | ✅ Done |
| S02 | Create @plan-analyzer agent (from metis) | 2h | None | ✅ Done |
| S03 | Create @plan-reviewer agent (from momus) | 2h | None | ✅ Done |
| S04 | Enrich @dev-junior with story awareness | 3h | None | ✅ Done |
| S05 | Enrich AIOS-origin skeleton agents (sm, pm, po, devops, data-engineer, ux-design-expert, squad-creator) | 7h | None | ✅ Done |
| S06 | Clean mythology/persona references across all agents | 1h | S01-S05 | ✅ Done |

## File Ownership

```
src/agents/
  sisyphus.ts          → kord.ts (or update internal prompt)
  prometheus/           → plan agent (update prompt)
  atlas/                → build agent (update prompt)
  hephaestus.ts         → dev agent (update prompt)
  sisyphus-junior/      → dev-junior agent (enrich)
  metis.ts              → plan-analyzer.ts (rename + refocus)
  momus.ts              → plan-reviewer.ts (rename + refocus)
  oracle.ts             → architect.ts (update prompt)
  librarian.ts          → keep as-is
  explore.ts            → keep as-is
  multimodal-looker.ts  → vision.ts (rename)
  [skeleton agents]     → enrich with AIOS methodology
  utils.ts              → update agentSources registry
```

## Notes

- Agent file renames may require updating references in hooks, tools, and delegation constants
- The `agentSources` map in `utils.ts` must include all 20 agents
- Plan-internal agents should have a flag or category distinguishing them from user-facing agents
