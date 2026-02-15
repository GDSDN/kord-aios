# Kord AIOS Project Layout

**Status:** Draft  
**Created:** 2026-02-14  
**Related:** `docs/epics/epic-16-project-layout-architecture/EPIC.md`, `docs/epics/epic-17-installer-scaffolding-and-auth-reliability/EPIC.md`

## Goal

Define a single authoritative directory layout so that:

- The installer can scaffold a working baseline on first run.
- The doctor can validate and repair missing assets deterministically.
- Agents and runtime code reference consistent paths.

## Mirror Sources (Consulted And Verified)

- `D:\dev\synkra-aios` — `.aios-core/` methodology-on-disk structure
- `D:\dev\oh-my-opencode` — plugin-only model (no project-level directories)
- `D:\dev\opencode-source` — OpenCode plugin/skill resolution constraints

## Model

Kord AIOS is a fusion of:

- **oh-my-opencode**: plugin-first runtime + config-driven installation (no project layout)
- **synkra-aios**: project content pack on disk (templates/scripts/checklists/workflows)

Kord AIOS adopts a **Project Content Pack** model:

- `.kord/` is the project-level **content pack** (git-tracked, user-editable).
- `docs/kord/` is where agents write **authored outputs** (plans, drafts, notepads, runs, ADRs, research).

## Invariants

- `docs/kord/` is for agent-authored outputs only.
- `.kord/` is for human-authored project assets that the system depends on.
- The installer/doctor must ensure the baseline exists; missing baseline is an install/doctor failure.
- Runtime may have embedded defaults for resilience, but the supported project experience is "scaffolded on disk".

## Canonical Directory Tree

```
.
├─ .kord/
│  ├─ templates/      # story.md, adr.md (required baseline)
│  ├─ scripts/        # optional utilities
│  ├─ checklists/     # optional quality gates
│  ├─ skills/         # optional SKILL.md overrides/additions
│  └─ squads/         # optional SQUAD.yaml overrides/additions
├─ docs/
│  └─ kord/
│     ├─ plans/       # plan markdown authored by agents (required baseline)
│     ├─ drafts/      # temporary drafts (required baseline)
│     ├─ notepads/    # working memory per plan (required baseline)
│     ├─ stories/     # stories authored by SM/QA/PO (optional; created on demand)
│     ├─ runs/        # execution logs and wave reports (optional; created on demand)
│     ├─ adrs/        # ADR markdown (optional; created on demand)
│     ├─ architecture/ # architecture notes (optional; created on demand)
│     ├─ research/    # research outputs (optional; created on demand)
│     ├─ rules/       # conditional rules (optional)
│     ├─ squads/      # documentation squads (optional)
│     └─ boulder.json # persistent execution state (created on demand)
└─ kord-rules.md      # project rules injected via OpenCode instructions (required baseline)
```

Notes:

- This repository (`kord-aios/`) also keeps development research under `docs/researches/` and architecture notes under `docs/architecture/`. Those are repository-local conventions and not required in end-user projects.

## Purpose Table

| Path | Kind | Purpose | Primary Owner | Created By |
|------|------|---------|---------------|------------|
| `.kord/` | input | Project content pack root | humans | installer/doctor |
| `.kord/templates/` | input | Templates used by agents | humans | installer/doctor |
| `.kord/templates/story.md` | input | Story template baseline | humans | installer/doctor |
| `.kord/templates/adr.md` | input | ADR template baseline | humans | installer/doctor |
| `.kord/scripts/` | input | Optional utility scripts | humans | installer/doctor |
| `.kord/checklists/` | input | Optional quality gate checklists | humans | installer/doctor |
| `.kord/skills/` | input | Optional SKILL.md overrides/additions | humans | installer/doctor |
| `.kord/squads/` | input | Optional SQUAD.yaml overrides/additions | humans | installer/doctor |
| `docs/kord/` | output | Agent-authored outputs root | agents | installer/doctor (dirs) + runtime (on demand) |
| `docs/kord/plans/` | output | Work plans (markdown) | agents | installer/doctor |
| `docs/kord/drafts/` | output | Draft plans and scratch docs | agents | installer/doctor |
| `docs/kord/notepads/` | output | Agent working memory per plan | agents | installer/doctor |
| `docs/kord/boulder.json` | output | Persistent execution state | agents | runtime (on demand) |
| `kord-rules.md` | input | Project rules (injected via OpenCode instructions) | humans | installer/doctor |

## Baseline (Post-Install Guarantees)

The installer (fresh + repair) must guarantee these exist without overwriting user edits:

- Directories:
  - `.kord/{templates,scripts,checklists,skills,squads}/`
  - `docs/kord/{plans,drafts,notepads}/`
- Files:
  - `.kord/templates/story.md`
  - `.kord/templates/adr.md`
  - `kord-rules.md`

Notes:

- Empty directories should be kept in git via `.gitkeep` where appropriate.
- The baseline is intentionally small; content expansion is a separate concern.

## Resolution Order

Resolution order is defined per asset class:

- **Templates**: `.kord/templates/` (project) → embedded defaults (plugin)
- **Checklists/Scripts**: `.kord/checklists/`, `.kord/scripts/` (project) → embedded defaults (plugin, if any)
- **Skills/Squads** (user extensions): project directories override embedded defaults.
- **Authored outputs**: always written to `docs/kord/`.

Squads are searched in this order:

1. `.opencode/squads/`
2. `.kord/squads/`
3. `docs/kord/squads/`

## Installer & Doctor Requirements

- Installer must call the scaffolder to create the baseline assets.
- Doctor must validate:
  - `.kord/` exists and contains all expected subdirectories (blocking)
  - `.kord/templates/story.md` exists (warning; repairable)
  - `docs/kord/plans/` exists (warning; repairable)
  - `kord-rules.md` exists (info; repairable)

## Divergence Notes vs Mirrors

- vs `D:\dev\oh-my-opencode`: OMOC is plugin-only; Kord AIOS intentionally scaffolds a small project footprint so installers/doctor checks can validate and repair deterministically.
- vs `D:\dev\synkra-aios`: Synkra uses a large methodology pack on disk; Kord AIOS keeps a minimal baseline in `.kord/` while keeping agent-authored outputs isolated under `docs/kord/`.
- vs `D:\dev\opencode-source`: Kord AIOS keeps to OpenCode conventions and limits itself to an easy-to-detect on-disk baseline (`.kord/`, `docs/kord/`, `kord-rules.md`).

## Non-Goals

- Migrating Synkra's full `.aios-core/` directory set.
- Adding a large template/checklist library.
- Changing OpenCode config resolution rules.
