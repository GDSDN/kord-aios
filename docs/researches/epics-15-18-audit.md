# Epics 15-18 Audit: Traceability + Mirror Sources

> Status: Draft
> Created: 2026-02-14

## Scope

This document audits whether EPIC-15 through EPIC-18 are sufficient and verifiable to address the documented problems, and whether each epic references the required local mirror sources:

- `D:\dev\oh-my-opencode`
- `D:\dev\synkra-aios`
- `D:\dev\opencode-source`

## Sources (In-Repo)

- `docs/epics/epic-15-agent-topology-and-invocation/EPIC.md`
- `docs/epics/epic-16-project-layout-architecture/EPIC.md`
- `docs/epics/epic-17-installer-scaffolding-and-auth-reliability/EPIC.md`
- `docs/epics/epic-18-branding-and-naming-audit/EPIC.md`
- `docs/researches/omoc-aios-gap-analysis.md`
- `docs/researches/kord-aios-master-decision.md`
- `docs/researches/installer-wizard-study.md`
- `docs/researches/epics-15-18-study.md`
- `docs/kord/plans/epics-15-18-stabilization-plan.md`

## Problem Statements (Source of Truth)

These problems are taken from the EPIC context sections and the research docs above.

### EPIC-15 Problems

- `build` is forcibly demoted/hidden by config handling, despite agent factory defaults.
- `plan` may be demoted depending on `replace_plan`.
- Specialist agents are not reliably `@`-invokable.

Source: `docs/epics/epic-15-agent-topology-and-invocation/EPIC.md:26`.

### EPIC-16 Problems

- Installer creates empty `.kord/` directories but does not populate templates.
- Agent prompt references `.kord/templates/`.
- No authoritative directory architecture spec and asset resolution order.

Source: `docs/epics/epic-16-project-layout-architecture/EPIC.md:25`.

### EPIC-17 Problems

- Installer scaffolding creates empty dirs; `scaffoldProject()` exists but is not wired.
- Auth plugin config (Antigravity/Gemini) is unreliable post-install.
- No post-install doctor checks validating templates/auth.

Source: `docs/epics/epic-17-installer-scaffolding-and-auth-reliability/EPIC.md:27`.

### EPIC-18 Problems

- Stale legacy naming appears in runtime-facing code and/or shipped artifacts.
- Need to preserve compatibility mappings while removing stale branding.

Source: `docs/epics/epic-18-branding-and-naming-audit/EPIC.md:27`.

## Traceability Matrix (Problems -> Epics -> Evidence)

Legend:
- Coverage: Covered | Partial | Missing
- Mirror refs: Present | Missing

| Problem | Epic/Story | Evidence | Coverage | Mirror refs | Fix |
|---|---|---|---|---|---|
| OpenCode agent picker / @-invocation behavior is not understood and config fields are guessed | EPIC-15 / S01 | `docs/epics/epic-15-agent-topology-and-invocation/EPIC.md:26` | Covered | Present | Execute EPIC-15 S02 and add regression tests |
| build is forcibly demoted/hidden by config-handler overrides | EPIC-15 / S02 | `src/plugin-handlers/config-handler.ts:374` | Covered | Present | Remove clobber override; verify final merged agent config |
| plan is overwritten/demoted by config-handler overrides | EPIC-15 / S02 | `src/plugin-handlers/config-handler.ts:375` | Covered | Present | Remove clobber override; verify `plan` retains full config |
| Empty `.kord/` scaffolding breaks agent expectations | EPIC-16 / S02-S04 | `docs/epics/epic-16-project-layout-architecture/EPIC.md:41` | Covered | Present | Lock the directory spec; enforce baseline via installer/doctor |
| `scaffoldProject()` not wired into install | EPIC-17 / S01 | `src/cli/install-phases.ts:97` + `src/cli/scaffolder.ts:142` | Covered | Present | Wire scaffolder into install phases (fresh + repair) |
| Post-install verification checks wrong config location | EPIC-17 / S04 | `src/cli/post-install-doctor.ts:18` vs `src/cli/config-manager.ts:236` | Partial | Present | Doctor must validate the same config path installer writes |
| Stale legacy naming in runtime/published assets | EPIC-18 / S02-S03 | `docs/researches/epics-15-18-study.md:289` | Partial | Present | Fix remaining stale runtime references; keep compat-only mappings |

## Audit Verdict (Epics 15-18)

- EPIC-15 through EPIC-18 now reference the required mirror sources.
- The remaining blockers are no longer "missing context"; they are concrete implementation gaps with exact file/line targets.

## Engine Audit Findings (Actionable)

- **Agent topology is currently self-clobbered** by unconditional overrides in `src/plugin-handlers/config-handler.ts:374` and `src/plugin-handlers/config-handler.ts:375`.
- **OpenCode picker vs task visibility is verified**:
  - Picker: `D:\dev\opencode-source\packages\opencode\src\cli\cmd\tui\context\local.tsx:37`
  - Task tool: `D:\dev\opencode-source\packages\opencode\src\tool\task.ts:28`
- **Installer creates empty `.kord/`** via `src/cli/install-phases.ts:97` calling `createKordDirectory()` without calling `scaffoldProject()`.
- **Post-install doctor checks CWD config**, while installer writes to OpenCode config dir.
  - Doctor: `src/cli/post-install-doctor.ts:18`
  - Installer config writes: `src/cli/config-manager.ts:236`

## Execution Plan

Use `docs/kord/plans/epics-15-18-stabilization-plan.md` as the execution blueprint.

## Note on EPIC-18 Ordering

Execute EPIC-18 last (after E2E stability) to avoid documentation churn and rework.
