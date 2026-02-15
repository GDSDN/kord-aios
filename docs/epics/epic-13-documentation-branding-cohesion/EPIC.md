# EPIC-13: Documentation & Branding Cohesion

> **Status**: In Progress
> **Created**: 2026-02-12
> **Research**: [Documentation & Branding Audit](../../researches/documentation-branding-audit.md)
> **Priority**: High
> **Depends on**: None (documentation-only, no code changes except SKILL.md content)

---

## Summary

Audit and update all documentation, guides, README, AGENTS.md files, and SKILL.md content to reflect the Kord AIOS brand consistently. Establish the origin narrative, add LLM-guiding AGENTS.md files to every major directory, and clean up stale/duplicate files.

---

## Context

### Current State

The codebase was migrated from Oh-My-OpenCode (OMOC) + Synkra AIOS into Kord AIOS across EPICs 01-12. While source code was fully rebranded, documentation artifacts retain significant vestiges:

- **177 files** still reference "OmO", "OMOC", or "Oh My OpenCode"
- **31 files** reference "Synkra" outside of historical research context
- **7 files** use stale "Kord OS" instead of "Kord AIOS"
- **CONTRIBUTING.md** title still says "Oh My OpenCode"
- **README.md** lacks the origin story narrative
- **27 directories** lack AGENTS.md files for LLM guidance
- **114 SKILL.md** files contain "OmO" agent references
- Root-level architecture drafts (v4, v5) are superseded debris

### Target State

- Zero "Oh My OpenCode" or "OmO" in user-facing docs or active SKILL.md files
- Zero "Kord OS" anywhere (should be "Kord AIOS")
- "Synkra" only in: README origin story, research docs (with historical header), completed epics, archive
- Every `src/` directory with >2 files has an AGENTS.md
- `docs/` and `docs/guide/` have AGENTS.md guiding LLMs
- README has clear origin story narrative
- CONTRIBUTING.md fully rebranded
- No root-level architecture draft debris
- No duplicate archive directories

### Origin Story Narrative

> Synkra AIOS was a disciplined AI development methodology framework built for Claude Code — with squads, skills, story-driven pipelines, and quality gates. Oh-My-OpenCode (OMOC) was an "overclock" plugin for OpenCode — adding multi-model orchestration, background agents, and rich tooling that Claude Code's closed ecosystem couldn't offer. Kord AIOS unifies both: the best methodology engine (Synkra) running on the best open platform (OpenCode via OMOC). The result: you can customize agents, models, and create your own version to work your way. This is the "oh-my-zsh for OpenCode" — battery-included but fully customizable.

---

## Stories

### Wave 1: Public-Facing & Cleanup

#### S01: README Origin Story & Fixes

**As** a visitor to the repo, **I need** the README to clearly explain Kord AIOS's origin and value proposition **so that** I understand what it is and why it exists.

**Acceptance Criteria**:
- [ ] Add origin story section explaining Synkra AIOS → OMOC → Kord AIOS journey
- [ ] Fix broken hero image reference (`.github/assets/hero.jpg` doesn't exist)
- [ ] Verify repo URL references point to `GDSDN/kord-aios`
- [ ] Audit testimonials section — remove if unverified
- [ ] No "Oh My OpenCode" or "OmO" except in origin story context

**Files**: `README.md`

#### S02: CONTRIBUTING.md Rebrand

**As** a contributor, **I need** CONTRIBUTING.md to reflect current project identity **so that** I can follow accurate setup instructions.

**Acceptance Criteria**:
- [ ] Title: "Contributing to Oh My OpenCode" → "Contributing to Kord AIOS"
- [ ] Clone URL: `code-yeongyu/kord-aios` → `GDSDN/kord-aios`
- [ ] Agent references: "OmO agent" → "Kord agent"
- [ ] Project structure: updated to reflect current directory layout
- [ ] Stats: "21 lifecycle hooks" → "40+ lifecycle hooks", tools count updated
- [ ] Remove `auth/` reference (doesn't exist)
- [ ] Footer: "Thank you for contributing to Oh My OpenCode!" → "Kord AIOS"

**Files**: `CONTRIBUTING.md`

#### S06: Root Cleanup

**As** a maintainer, **I need** stale root-level files removed **so that** the repo stays clean.

**Acceptance Criteria**:
- [ ] Delete `kord-architecture-v5.md` (superseded by `docs/architecture/kord-aios-architecture.md`)
- [ ] Delete `kord-architeture-v4-05749e.md` (superseded, typo in filename)
- [ ] Delete `docs/archive/migration/` (duplicate of `docs/archive/MIGRATION-OPEN-AIOS/docs/migration/`)
- [ ] Move `CHANGELOG-WAVES.md` to `docs/archive/`

**Files**: Root, `docs/archive/`

---

### Wave 2: Documentation Rebrand

#### S03: User-Facing Docs Rebrand

**As** a user reading documentation, **I need** consistent Kord AIOS branding **so that** I'm not confused by legacy names.

**Acceptance Criteria**:
- [ ] `docs/ultrawork-manifesto.md`: 4× "Oh My OpenCode" → "Kord AIOS"
- [ ] `docs/task-system.md`: 2× "Oh My OpenCode" → "Kord AIOS"
- [ ] `docs/orchestration-guide.md`: verify clean, fix any remaining OmO refs
- [ ] `docs/guide/understanding-orchestration-system.md`: audit for stale refs

**Files**: `docs/*.md`, `docs/guide/*.md`

#### S04: Architecture Docs Rebrand

**As** a developer reading architecture docs, **I need** consistent naming **so that** docs match the actual codebase.

**Acceptance Criteria**:
- [ ] `docs/architecture/adr-0001-agent-topology.md`: OmO (20×) → Kord
- [ ] `docs/architecture/adr-0002-story-driven-orchestration.md`: OmO (7×) → Kord
- [ ] `docs/architecture/audit-wave1-installer-hooks-tools-mcp.md`: OMOC (4×) → Kord AIOS
- [ ] `docs/architecture/kord-aios-architecture.md`: "KORD OS" (4×) → "Kord AIOS", OmO (7×) → Kord, stale directory paths fixed

**Files**: `docs/architecture/*.md`

#### S07: Research Docs Historical Headers

**As** a reader of research docs, **I need** context about legacy name references **so that** I understand they are historical.

**Acceptance Criteria**:
- [ ] All 17 files in `docs/researches/` have a standard historical context header
- [ ] Header format: `> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.`

**Files**: `docs/researches/*.md`

---

### Wave 3: SKILL.md Mass Cleanup

#### S05: SKILL.md OmO→Kord Mass Replace

**As** an LLM agent reading skills, **I need** correct agent names **so that** I reference the right agents during execution.

**Acceptance Criteria**:
- [ ] Script-based replace of "OmO" → "Kord" across 114 SKILL.md files
- [ ] Manual review of top 5 files with 4-9 matches (patterns, dev-develop-story, spec-gather-requirements, create-agent, create-worktree)
- [ ] Zero "OmO" references in any SKILL.md after cleanup
- [ ] `bun run typecheck` passes (no code changes, but verify)

**Files**: `src/features/builtin-skills/skills/kord-aios/**/*.md`

---

### Wave 4: AGENTS.md Coverage

#### S08: HIGH Priority AGENTS.md Files

**As** an LLM agent navigating the codebase, **I need** AGENTS.md in key directories **so that** I know how to use and customize each module.

**Acceptance Criteria**:
- [ ] `src/config/AGENTS.md` — schema structure, validation, how to extend
- [ ] `src/plugin-handlers/AGENTS.md` — config loading, JSONC, migration
- [ ] `src/features/squad/AGENTS.md` — squad system, SQUAD.yaml, loader, factory
- [ ] `src/features/builtin-skills/AGENTS.md` — skill categories, loader, how to add skills
- [ ] `src/features/background-agent/AGENTS.md` — manager, concurrency, task lifecycle
- [ ] `docs/AGENTS.md` — documentation structure, where to find what
- [ ] `docs/guide/AGENTS.md` — user-facing guides, how to update

#### S09: MEDIUM Priority AGENTS.md Files

**Acceptance Criteria**:
- [ ] `src/features/builtin-commands/AGENTS.md`
- [ ] `src/features/builtin-squads/AGENTS.md`
- [ ] `src/features/boulder-state/AGENTS.md`
- [ ] `src/features/context-injector/AGENTS.md`
- [ ] `src/features/skill-mcp-manager/AGENTS.md`
- [ ] `docs/architecture/AGENTS.md`

#### S10: LOW Priority AGENTS.md Files

**Acceptance Criteria**:
- [ ] Remaining 14 feature directories + `script/`
- [ ] Each follows the standard AGENTS.md template from the audit

#### S11: docs/kord/ Scaffolding

**Acceptance Criteria**:
- [ ] Each empty `docs/kord/` subdirectory gets a README.md explaining its purpose
- [ ] Directories: `adrs/`, `notepads/`, `plans/`, `runs/`, `stories/`

---

### Wave 5: Verification

#### S12: Final Verification & Grep Audit

**Acceptance Criteria**:
- [ ] `grep -r "Oh My OpenCode"` in user-facing docs returns 0 (excluding archive, research, completed epics)
- [ ] `grep -r "OmO"` in SKILL.md files returns 0
- [ ] `grep -r "Kord OS"` returns 0 everywhere
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes (no regressions)
- [ ] Update EPIC-INDEX.md with EPIC-13

---

## Waves Summary

| Wave | Stories | Theme | Est. |
|------|---------|-------|------|
| Wave 1 | S01, S02, S06 | Public-facing + cleanup | 4h |
| Wave 2 | S03, S04, S07 | Docs rebrand | 6h |
| Wave 3 | S05 | SKILL.md mass cleanup | 4h |
| Wave 4 | S08, S09, S10, S11 | AGENTS.md coverage | 12h |
| Wave 5 | S12 | Verification | 2h |
| **Total** | **12 stories** | | **~28h** |
