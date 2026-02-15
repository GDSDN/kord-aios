# Kord AIOS — Epic Index & Parallel Execution Map

> **Date**: 2026-02-11 (updated)
> **Source**: `docs/researches/kord-aios-master-decision.md` + all Stage 2-7 research docs
> **Methodology**: AIOS story-driven development
> **Status**: EPIC-02 ✅ DONE — Wave B unblocked

---

## Parallel Execution Map

Epics are organized so 3-4 can execute simultaneously without file/code conflicts.

```
CURRENT STATE — EPIC-02 ✅ DONE, Wave A+B can run together (up to 6 parallel tracks)
┌─────────────────────────────────────────────────────────────────────┐
│  Wave A (remaining)        Wave B (UNBLOCKED)    Wave A (cont.)     │
│                                                                     │
│  [Tab 1]     [Tab 2]      [Tab 3]     [Tab 4]   [Tab 5]  [Tab 6]  │
│  EPIC-01     EPIC-05      EPIC-03     EPIC-04   EPIC-06  EPIC-07  │
│  Agents      Skills       Build Orch  Authority Commands Scripts   │
│  src/agents/ .kord/skills/ src/hooks/  src/hooks/ src/feat .kord/   │
│  ~20h       ~40h         ~25h        ~18h      ~10h     ~8h      │
│                                                                     │
│  EPIC-02 ✅ DONE (story-read, story-update, plan-read, squad-load)  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                         All epics done
                              │
                              ▼
WAVE C — Integration (sequential)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  EPIC-08: E2E Validation & Documentation                           │
│  tests/, docs/                                                      │
│  ~8h                                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Epic Summary

| Epic | Name | Directory Scope | Stories | Est. | Wave | Prerequisites |
|------|------|----------------|---------|------|------|---------------|
| EPIC-01 | Agent Foundation | `src/agents/` | 6 | ~20h | A | None |
| EPIC-02 | Story & Plan Tools | `src/tools/story-*`, `plan-*`, `delegate-task/` | 5 | ~15h | A | ✅ **DONE** |
| EPIC-03 | Build Orchestration Engine | `src/hooks/build/`, `start-work/`, new hooks | 5 | ~25h | A/B | ~~EPIC-02~~ ✅ DONE |
| EPIC-04 | Authority & Quality System | `src/hooks/agent-authority/`, `quality-gate/`, etc. | 4 | ~18h | A/B | ~~EPIC-02~~ ✅ DONE |
| EPIC-05 | Skill Conversion | `.kord/skills/` (external files only) | 8 | ~40h | A | None |
| EPIC-06 | Commands & Installer | `src/features/builtin-commands/`, `src/cli/` | 6 | ~10h | A/B | EPIC-01, ~~EPIC-02~~ ✅ |
| EPIC-07 | Computation Scripts & Templates | `.kord/scripts/`, `.kord/templates/` | 4 | ~8h | A | None |
| EPIC-08 | E2E Validation & Documentation | `tests/`, `docs/` | 5 | ~8h | C | All |
| EPIC-09 | Agent Prompt Refinement | `src/agents/` (prompts + tests) | 13 | ~30h | D | EPIC-01 |
| EPIC-10 | Agent Architecture Refinement | `src/agents/` | — | — | — | EPIC-09 |
| EPIC-11 | Squad System Evolution | `src/features/squad/`, `src/tools/squad-*` | 9 | ~25h | — | EPIC-10 |
| EPIC-12 | Installer Wizard Evolution | `src/cli/` | 9 | ~20h | — | None |
| EPIC-13 | Documentation & Branding Cohesion | `docs/`, `README.md` | — | — | — | All |
| EPIC-14 | Model Routing Evolution | `src/shared/model-*`, `src/features/model-config/` | 15 | ~100h | E | None |
| EPIC-15 | Agent Topology & Invocation | `src/plugin-handlers/`, `src/agents/` | 4 | ~8h | F | None |
| EPIC-16 | Kord Project Layout Architecture | `docs/`, `.kord/` | 4 | ~6h | F | None |
| EPIC-17 | Installer Scaffolding & Auth Reliability | `src/cli/`, `.kord/` | 5 | ~10h | F | EPIC-16 |
| EPIC-18 | Branding & Naming Audit | `src/`, `assets/`, `.github/` | 4 | ~4h | F | None |
| **TOTAL** | | | **~119+** | **~387h+** | | |

---

## Conflict Avoidance Rules

| Rule | Description |
|------|-------------|
| **Directory ownership** | Each epic owns specific directories — NO cross-epic file edits |
| **Interface-first** | ~~EPIC-02 defines tool interfaces (types) FIRST~~ ✅ DONE — all shared types available |
| **Shared types** | `src/shared/types/` story/plan/squad types ✅ available (EPIC-02 complete) |
| **Config schema** | `src/config/schema.ts` changes are consolidated in EPIC-06 only |
| **Test isolation** | Each epic has co-located tests. E2E tests are EPIC-08 only |

---

## File Ownership Map

```
src/
  agents/                    ← EPIC-01 ONLY
  tools/
    story-read/              ← EPIC-02 ✅ DONE
    story-update/            ← EPIC-02 ✅ DONE
    plan-read/               ← EPIC-02 ✅ DONE
    squad-load/              ← EPIC-02 ✅ DONE
    delegate-task/           ← EPIC-02 ✅ DONE (executor param extension)
  hooks/
    build/                   ← EPIC-03 ONLY
    start-work/              ← EPIC-03 ONLY
    executor-resolver/       ← EPIC-03 ONLY (new)
    wave-checkpoint/         ← EPIC-03 ONLY (new)
    agent-authority/         ← EPIC-04 ONLY (new)
    quality-gate/            ← EPIC-04 ONLY (new)
    story-lifecycle/         ← EPIC-04 ONLY (new)
    decision-logger/         ← EPIC-04 ONLY (new)
  features/
    builtin-commands/        ← EPIC-06 ONLY
    builtin-skills/          ← EPIC-05 ONLY (SKILL.md additions)
  cli/                       ← EPIC-06 ONLY
  config/schema.ts           ← EPIC-06 ONLY (consolidated schema changes)
  shared/types/              ← EPIC-02 ✅ DONE (story.ts, plan.ts, squad.ts)

.kord/
  scripts/                   ← EPIC-07 ONLY
  templates/                 ← EPIC-07 ONLY
  checklists/                ← EPIC-07 ONLY
  skills/                    ← EPIC-05 ONLY

tests/
  e2e/                       ← EPIC-08 ONLY
```
