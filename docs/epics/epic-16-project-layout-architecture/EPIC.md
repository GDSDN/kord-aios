# EPIC-16: Kord Project Layout Architecture

> **Status**: Draft
> **Created**: 2026-02-14
> **Research**: [Epics 15-18 Deep Study](../../researches/epics-15-18-study.md) §2
> **Priority**: High
> **Depends on**: None (design EPIC — unblocks EPIC-17 installer)

> **Mirror Sources** (consulted and verified):
> - `D:\dev\synkra-aios` — `.aios-core/` structure (methodology source)
> - `D:\dev\oh-my-opencode` — OMOC has NO project-level directories (plugin-only)
> - `D:\dev\opencode-source` — OpenCode plugin/skill resolution constraints

---

## Summary

Formalize the **Project Content Pack Model** for Kord AIOS project layout:

- `docs/kord/` is where agents write authored outputs (plans, notepads, drafts, runs)
- `.kord/` is the project-level AIOS content pack (templates, scripts, checklists, squads, skills)

This EPIC produces the authoritative directory spec that the installer (EPIC-17) must enforce.

---

## Context

### Mirror Comparison (Verified)

**Synkra AIOS** (`.aios-core/development/`):
```
agents/          # Agent definition .md files
checklists/      # Quality checklists (agent-quality-gate.md, self-critique-checklist.md)
scripts/         # 20+ JS utility scripts (branch-manager.js, commit-message-generator.js, ...)
tasks/           # 200 task files (methodology skills)
templates/       # Templates (squad/, aios-doc-template.md, research-prompt-tmpl.md, ...)
workflows/       # Workflow definitions
```
Everything project-level, git-tracked, editable.

**OMOC**: Zero project-level directories. Everything plugin-embedded. No `.kord/`, no templates on disk.

**Kord-aios current state**:
- `.kord/` subdirs created EMPTY by installer (scripts, templates, checklists, skills, squads)
- `docs/kord/` referenced in hooks (plan-md-only, dev-notepad) but NOT created by installer
- `scaffoldProject()` exists and would create content — but is NOT called
- Agent prompts reference `.kord/templates/` (kord.ts line 243)
- Squad loader already resolves: `.opencode/squads/` → `.kord/squads/` → `docs/kord/squads/` (EPIC-11)

### Authoritative Layout Spec

| Directory | Purpose | Created by | Editable |
|-----------|---------|-----------|----------|
| `.kord/templates/` | Story, ADR, doc templates | Installer (scaffoldProject) | ✓ |
| `.kord/scripts/` | Utility scripts | User | ✓ |
| `.kord/checklists/` | Quality gate checklists | Installer or user | ✓ |
| `.kord/skills/` | User SKILL.md overrides + additions | User | ✓ |
| `.kord/squads/` | User SQUAD.yaml overrides + additions | User | ✓ |
| `docs/kord/plans/` | Agent-authored plans | Plan agent | ✓ |
| `docs/kord/notepads/` | Agent scratchpads | Dev agent | ✓ |
| `docs/kord/drafts/` | Temporary agent drafts | Any agent | ✓ |
| `kord-rules.md` | Project-specific rules | Installer scaffold | ✓ |

### Resolution Order (per asset class)

Source of truth:

1. **Project content pack**: `.kord/{class}/`
2. **Authored outputs**: `docs/kord/{class}/` (when applicable)

**Non-goal**: silent runtime fallback. Missing `.kord/` baseline files should be treated as an install/doctor failure and repaired explicitly.

---

## Stories

### S01: Research — DONE (Findings in Study Doc)

**Status**: ✅ Complete — see [epics-15-18-study.md §2](../../researches/epics-15-18-study.md)

Findings:
- Synkra uses fully project-level `.aios-core/` with 6 asset classes
- OMOC uses zero project files (plugin-only model)
- Kord-aios model must match Synkra's intent: project-level content pack + authored outputs
- Hooks already enforce `docs/kord/` paths for agent-authored content
- Squad loader resolution order already implemented (EPIC-11 S03)

---

### S02: Formalize Directory Architecture Spec

**As** a contributor, **I need** a single authoritative spec for directory structure **so that** all features and the installer converge on the same rules.

**Deliverable**: A doc (e.g., `docs/architecture/project-layout.md`) containing:
- [ ] Canonical directory tree with purpose annotations
- [ ] Invariant: `docs/kord/` = agent-authored outputs, `.kord/` = project content pack
- [ ] Invariant: Installer/doctor enforce the `.kord/` baseline; runtime does not silently degrade
- [ ] Naming conventions: kebab-case dirs, `.md` for templates/checklists, `.yaml` for squads
- [ ] Minimal required files post-install (the "scaffold baseline")
- [ ] Explicit divergence notes from mirrors (why we add project artifacts even though OMOC is plugin-only)

**Files**: New doc, referenced by EPIC-17 and post-install doctor

---

### S03: Align Existing Code References with Spec

**As** the runtime, **I need** all code that references `.kord/` or `docs/kord/` to use consistent paths matching the spec.

**Verification required**:
- [ ] `kord.ts` (agent prompt, line 243): references `.kord/templates/` — consistent ✓
- [ ] `plan-md-only/index.ts`: restricts writes to `docs/kord/*.md` — consistent ✓
- [ ] `dev-notepad/constants.ts`: references `docs/kord/notepads/` — consistent ✓
- [ ] `init-deep.ts`: references `docs/kord/plans/` — consistent ✓
- [ ] Squad loader: resolves `.opencode/squads/` → `.kord/squads/` → `docs/kord/squads/` — consistent ✓
- [ ] `scaffolder.ts`: creates `.kord/templates/story.md`, `.kord/templates/adr.md`, `docs/kord/plans/`, etc. — consistent ✓
- [ ] `kord-directory.ts`: creates `.kord/{scripts,templates,checklists,skills,squads}` — consistent ✓
- [ ] Doctor checks (`post-install-doctor.ts`): validates `.kord/` and `docs/kord/` exist — update if spec adds requirements

**Files**: Audit-only, fix any inconsistencies found

---

### S04: Define Installer & Doctor Requirements from Spec

**As** the installer/doctor, **I need** explicit post-install guarantees derived from the architecture spec.

**Acceptance Criteria**:
- [ ] Post-install MUST guarantee:
  - `.kord/` with all 5 subdirs
  - `.kord/templates/story.md` and `.kord/templates/adr.md` (from scaffoldProject)
  - `docs/kord/plans/` directory
  - `kord-rules.md` (if fresh install)
- [ ] Doctor checks:
  - `.kord/` exists with expected subdirs (blocking)
  - `.kord/templates/` has at least story.md (warning, auto-repairable)
  - `docs/kord/plans/` exists (warning, auto-repairable)
  - `kord-rules.md` exists (info, non-blocking)
- [ ] Repair mode: create missing assets without overwriting existing files

**Deliverable**: Requirements spec consumed by EPIC-17 stories

---

## Out of Scope

- Actually wiring scaffoldProject into installer (EPIC-17)
- Converting Synkra task files to SKILL.md (separate skill migration EPIC)
- Adding new template/checklist content beyond the minimal baseline
