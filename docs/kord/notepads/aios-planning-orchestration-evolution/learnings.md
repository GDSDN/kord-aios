## 2026-02-20 Task 1+2
- `src/hooks/plan-md-only/index.ts`: Injects `ARTIFACT_GENERATION_WARNING` for artifact subagents (pm/sm/architect/ux/po/data-engineer/devops/squad-creator/analyst) based on `args.subagent_type` (fallback: parses `subagent_type="..."` from prompt). Others get `PLANNING_CONSULT_WARNING`.
- `src/hooks/plan-md-only/constants.ts`: Added `ARTIFACT_SUBAGENTS` + `ARTIFACT_GENERATION_WARNING`; updated workflow reminder step 4 to reference Plan Reviewer.
- Planner plan validation should use `plan-reviewer` (QA reserved for implementation testing).
