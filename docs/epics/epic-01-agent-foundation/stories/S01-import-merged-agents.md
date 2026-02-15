# S01: Import Merged Agent Prompts

> **Epic**: EPIC-01 Agent Foundation
> **Status**: Draft
> **Estimate**: 5h
> **Agent**: @dev
> **Dependencies**: None

---

## Objective

Import full OMOC agent prompts for the 5 agents that are merging OMOC engine code with AIOS methodology: @kord (from sisyphus), @plan (from prometheus), @build (from atlas), @dev (from hephaestus), @architect (from oracle). Update internal prompt content to reflect Kord AIOS identity while preserving battle-tested logic.

## Tasks

- [ ] Copy `sisyphus.ts` prompt content → update @kord agent identity, remove Greek mythology refs
- [ ] Copy `prometheus/` prompt content → update @plan to plan-only scope (no delegation to specialists)
- [ ] Copy `atlas/` prompt content → update @build to full autonomous end-to-end execution
- [ ] Copy `hephaestus.ts` prompt content → update @dev with AIOS dev methodology injection points
- [ ] Copy `oracle.ts` prompt content → update @architect with doc-write authority, clean Oracle refs
- [ ] Update `agentSources` in `utils.ts` for any renamed files
- [ ] Run `bun test` — all existing tests pass

## Acceptance Criteria

- [ ] 5 agents have updated prompts reflecting Kord AIOS identity
- [ ] @plan prompt explicitly limits scope to blueprint generation only
- [ ] @build prompt includes autonomous execution directives (docs + code + delivery)
- [ ] Zero Greek mythology references in updated agents
- [ ] All existing tests pass

## Files

```
src/agents/
  sisyphus.ts        → update prompt (kord identity)
  prometheus/         → update prompt (plan-only scope)
  atlas/              → update prompt (autonomous execution)
  hephaestus.ts       → update prompt (dev methodology)
  oracle.ts           → update prompt (architect identity)
  utils.ts            → update agentSources if needed
```

## Dev Notes

- Preserve all existing tool declarations, model configs, and temperature settings
- Only modify prompt/system message content — do NOT restructure agent files
- AIOS methodology injection points are marked as comments for EPIC-05 skill loading
- Reference: `docs/researches/kord-aios-agent-audit.md` for per-agent decision details
