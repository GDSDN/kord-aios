# Decisions — content-layer-curated-export-alignment

## [2026-03-07] Architecture Decisions (Pre-locked from planning phase)

All decisions below are LOCKED from the planning phase. Do not re-debate.

| Decision | Value |
|---|---|
| Canonical source of truth | `src/features/builtin-*` |
| Content delivery | `init` only; `extract` removed |
| Project instructions surface | `.kord/instructions/` only |
| Project-type naming (public) | `greenfield|brownfield` |
| Project-type detection | installer-only (`new|existing` internal only) |
| Persistent project-state file | None — does not exist |
| Commands | Engine-only, never exported |
| T0/T1 agents | Engine-only |
| T2 agent prompt source | `src/features/builtin-agents/*.md` |
| Exportable T2 agents | pm, po, sm, qa, devops, data-engineer, ux-design-expert, squad-creator, analyst, plan-analyzer, plan-reviewer |
| Workflows | All 14 in scope for canonical builtin promotion |
| Checklist export destination | `.kord/checklists/` |
| `architect.md` export parity | Explicitly out of scope |
