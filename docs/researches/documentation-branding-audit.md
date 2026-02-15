# Documentation & Branding Audit — Kord AIOS

**Date:** 2026-02-12  
**Purpose:** Identify all stale branding, outdated documentation, missing AGENTS.md files, and files to delete/reorganize. This audit serves as the foundation for EPIC-13.

---

## 1. Executive Summary

| Category | Count | Severity |
|----------|-------|----------|
| Files with "Synkra" references | 31 .md files | HIGH |
| Files with "OMOC/OmO/Oh My OpenCode" references | 177 files (50+ in docs, 114 SKILL.md) | HIGH |
| Files with stale "Kord OS" references | 7 .md files | MEDIUM |
| Root-level debris files | 2 (architecture drafts) | LOW |
| Duplicate archive directories | 2 (exact copies) | MEDIUM |
| Empty docs/kord/ subdirectories | 5 | LOW |
| Missing AGENTS.md files | 15+ directories | HIGH |
| CONTRIBUTING.md stale branding | 5 issues | HIGH |
| README.md narrative gaps | needs origin story rewrite | MEDIUM |
| User-facing docs with stale names | 4 files (ultrawork-manifesto, task-system, orchestration-guide, category-skill-guide) | MEDIUM |

---

## 2. Stale Branding References

### 2.1 "Synkra" References (152 matches in 31 .md files)

**User-facing / active docs:**

| File | Matches | Action |
|------|---------|--------|
| `README.md` | 1 | REWRITE — origin story section (keep as historical reference per user) |
| `docs/researches/squad-system-study.md` | 21 | KEEP — research doc, add "Historical Reference" header |
| `docs/researches/installer-wizard-study.md` | 12 | KEEP — research doc, add header |
| `docs/researches/skill-system-deep-analysis.md` | 10 | KEEP — research doc, add header |
| `docs/researches/aios-skill-catalog.md` | 7 | KEEP — research doc, add header |
| `docs/researches/synkra-agent-system-analysis.md` | 6 | KEEP — research doc (name is self-documenting) |
| `docs/researches/kord-os-skill-adaptation-plan.md` | 4 | KEEP — research doc, add header |
| `docs/researches/aios-story-driven-flow.md` | 3 | KEEP — research doc |
| `docs/epics/epic-09-prompt-refinement/EPIC.md` | 27 | KEEP — completed epic (historical) |
| `docs/epics/epic-11-squad-system-evolution/EPIC.md` | 4 | KEEP — completed epic |
| `docs/epics/epic-12-installer-wizard-evolution/EPIC.md` | 3 | KEEP — completed epic |
| `docs/epics/epic-07-scripts-templates/stories/S01-*.md` | 5 | KEEP — completed story |
| `kord-architecture-v5.md` | 9 | DELETE — superseded (see §4) |
| `kord-architeture-v4-05749e.md` | 4 | DELETE — superseded (see §4) |
| `src/.../devops/pr-automation/SKILL.md` | 2 | FIX — update skill content |
| `src/.../devops/environment-bootstrap/SKILL.md` | 1 | FIX — update skill content |

**Archive (already in docs/archive/):**
- 7 files — no action needed, they're archived.

**Decision:** Research docs and completed epics keep Synkra references as historical context. Active code/skills and user-facing docs get cleaned.

### 2.2 "OMOC / OmO / Oh My OpenCode" References (893 matches in 177 files)

**Critical — user-facing docs:**

| File | Matches | Issue |
|------|---------|-------|
| `CONTRIBUTING.md` | 5 | Title says "Oh My OpenCode", clone URL is `code-yeongyu/kord-aios`, mentions "OmO agent", project structure says "OmO, oracle, librarian" |
| `docs/ultrawork-manifesto.md` | 4 | "Oh My OpenCode" in philosophy text |
| `docs/task-system.md` | 2 | "Oh My OpenCode's Task system" |

**Critical — 114 SKILL.md files with "OmO" references:**
Most contain the pattern `OmO` in agent references, tool names, or context descriptions. These are the bulk of the 247 matches. A script-based find-and-replace is needed.

**Top offenders (9+ matches per file):**

| Skill File | Matches |
|------------|---------|
| `analysis/patterns/SKILL.md` | 9 |
| `dev-workflow/dev-develop-story/SKILL.md` | 9 |
| `analysis/spec-gather-requirements/SKILL.md` | 4 |
| `squad/create-agent/SKILL.md` | 4 |
| `worktrees/create-worktree/SKILL.md` | 4 |

The remaining ~110 files have 2 matches each (likely header + body reference).

**Research docs (expected, keep as-is):**

| File | Matches | Verdict |
|------|---------|---------|
| `docs/researches/omoc-aios-gap-analysis.md` | 42 | KEEP (research) |
| `docs/researches/omoc-agentic-flow.md` | 9 | KEEP (research) |
| `docs/researches/synkra-agent-system-analysis.md` | 31 | KEEP (research) |
| `docs/researches/kord-aios-agent-audit.md` | 26 | KEEP (research) |
| Other research docs | Various | KEEP (research) |

**Architecture docs:**

| File | Matches | Action |
|------|---------|--------|
| `docs/architecture/adr-0001-agent-topology.md` | 20 | UPDATE — active ADR, rebrand OmO→Kord |
| `docs/architecture/adr-0002-story-driven-orchestration.md` | 7 | UPDATE — active ADR |
| `docs/architecture/audit-wave1-installer-hooks-tools-mcp.md` | 4 | UPDATE — active audit doc |
| `docs/architecture/kord-aios-architecture.md` | 7 | UPDATE — has "KORD OS" references |

### 2.3 "Kord OS" Stale Name (11 matches in 7 files)

| File | Matches | Action |
|------|---------|--------|
| `docs/architecture/kord-aios-architecture.md` | 4 | UPDATE — "KORD OS" → "Kord AIOS" |
| `docs/researches/kord-aios-skills-templates-scripts.md` | 2 | UPDATE |
| `docs/researches/kord-orchestration-model.md` | 1 | UPDATE |
| `docs/researches/kord-os-skill-adaptation-plan.md` | 1 | UPDATE (or rename file) |
| `docs/researches/skill-system-deep-analysis.md` | 1 | UPDATE |
| `kord-architecture-v5.md` | 1 | DELETE (superseded) |
| `docs/epics/epic-05-skill-conversion/EPIC.md` | 1 | KEEP (historical epic) |

---

## 3. README.md Narrative

### Current State
- Line 3: "a subtle nod to the Synkra AIOS framework" — vague, needs origin story
- Lines 28-51: Reviews section — includes testimonials that reference "Kord AIOS" already ✅
- Lines 264-296: Author's Note — mentions influence from AmpCode/Claude Code but not origin story
- No `.github/assets/` directory exists → `hero.jpg` link on line 11 is **broken**

### Required Changes

1. **Origin Story Section** (new, after Author's Note or replace tip block):
   - Synkra AIOS was built for Claude Code — a disciplined methodology framework with squads, skills, and story-driven pipelines
   - Oh-My-OpenCode (OMOC) was an "overclock" plugin for OpenCode — adding multi-model orchestration, background agents, and rich tooling
   - Kord AIOS unifies both: the best methodology engine (Synkra) running on the best open platform (OpenCode via OMOC)
   - The result: you can customize agents, models, and create your own version to work your way
   - This is the "oh-my-zsh for OpenCode" — battery-included but fully customizable

2. **Remove fake/stale testimonials** — the user confirmed "we don't have testimonials." The current reviews block cites real Twitter/YouTube users but should be audited for accuracy.

3. **Fix broken hero image** — `.github/assets/hero.jpg` doesn't exist. Either create the directory with an image or remove the reference.

4. **Update repo URL** — line 64: `code-yeongyu/kord-aios` → `GDSDN/kord-aios`

---

## 4. Files to DELETE

### Root-Level Debris

| File | Reason |
|------|--------|
| `kord-architecture-v5.md` (701 lines) | Superseded by `docs/architecture/kord-aios-architecture.md`. Draft architecture doc with Synkra/OMOC references. |
| `kord-architeture-v4-05749e.md` (518 lines) | Superseded, typo in filename ("architeture"), commit hash in name. |

### Duplicate Archive

| Directory | Reason |
|-----------|--------|
| `docs/archive/migration/` | Exact duplicate of `docs/archive/MIGRATION-OPEN-AIOS/docs/migration/`. Same 7 files. |

### Empty Directories

| Directory | Reason |
|-----------|--------|
| `docs/kord/adrs/` | Empty — created for future use but never populated |
| `docs/kord/notepads/` | Empty |
| `docs/kord/plans/` | Empty |
| `docs/kord/runs/` | Empty |
| `docs/kord/stories/` | Empty |

**Note:** The empty `docs/kord/` subdirectories are created by the installer as project scaffolding. They should stay but could have a `.gitkeep` or brief `README.md` explaining their purpose.

### Epic Directories with 0 Items

Several `docs/epics/epic-*/` directories appear empty (0 items shown in listing). These may have content tracked differently. Verify before cleanup.

---

## 5. Files to REORGANIZE

### Move to Archive

| File | Current Location | Recommended |
|------|-----------------|-------------|
| `CHANGELOG-WAVES.md` | Root | Move to `docs/archive/` — migration-era changelog, not relevant for end users |

### Research Docs — Add Historical Headers

All 17 files in `docs/researches/` should have a standard header block:

```markdown
> **Historical Research Document**  
> This document was created during the Synkra AIOS → Kord AIOS migration and contains references to legacy project names (Synkra, OMOC, OmO). These names are preserved for historical accuracy.
```

---

## 6. Missing AGENTS.md Files

### Current Coverage

| Directory | Has AGENTS.md? |
|-----------|---------------|
| `src/` (root AGENTS.md) | ✅ Yes |
| `src/agents/` | ✅ Yes |
| `src/hooks/` | ✅ Yes |
| `src/hooks/claude-code-hooks/` | ✅ Yes |
| `src/tools/` | ✅ Yes |
| `src/features/` | ✅ Yes |
| `src/features/claude-tasks/` | ✅ Yes |
| `src/shared/` | ✅ Yes |
| `src/mcp/` | ✅ Yes |
| `src/cli/` | ✅ Yes |

### Missing AGENTS.md

| Directory | Purpose | Priority |
|-----------|---------|----------|
| `src/config/` | Zod schema, types — LLMs need to know schema structure | HIGH |
| `src/plugin-handlers/` | Config loading, JSONC parsing, migration | HIGH |
| `src/features/squad/` | Squad system — complex, needs guide | HIGH |
| `src/features/builtin-skills/` | 176+ skills, loader, categories | HIGH |
| `src/features/builtin-commands/` | Command templates, registration | MEDIUM |
| `src/features/builtin-squads/` | Built-in squad definitions (dev) | MEDIUM |
| `src/features/background-agent/` | Manager (1556 lines), complex concurrency | HIGH |
| `src/features/boulder-state/` | Plan state persistence | MEDIUM |
| `src/features/context-injector/` | AGENTS.md, README injection | MEDIUM |
| `src/features/skill-mcp-manager/` | MCP client lifecycle (640 lines) | MEDIUM |
| `src/features/mcp-oauth/` | OAuth flow for MCP | LOW |
| `src/features/claude-code-agent-loader/` | Claude Code agent compat | LOW |
| `src/features/claude-code-command-loader/` | Claude Code command compat | LOW |
| `src/features/claude-code-mcp-loader/` | Claude Code MCP compat | LOW |
| `src/features/claude-code-plugin-loader/` | Claude Code plugin compat | LOW |
| `src/features/claude-code-session-state/` | Session state compat | LOW |
| `src/features/hook-message-injector/` | Hook message injection | LOW |
| `src/features/opencode-skill-loader/` | OpenCode skill loading | LOW |
| `src/features/task-toast-manager/` | Toast notifications | LOW |
| `src/features/tmux-subagent/` | Tmux integration | LOW |
| `src/features/tool-metadata-store/` | Tool metadata caching | LOW |
| `docs/` | Documentation root | HIGH |
| `docs/guide/` | User guides | HIGH |
| `docs/architecture/` | Architecture decisions | MEDIUM |
| `docs/researches/` | Research archive | LOW |
| `docs/epics/` | Epic tracking | LOW |
| `script/` | Build/publish scripts | LOW |

**Total: 27 directories need AGENTS.md files.**

---

## 7. CONTRIBUTING.md Issues

| Line | Issue | Fix |
|------|-------|-----|
| 1 | Title: "Contributing to Oh My OpenCode" | → "Contributing to Kord AIOS" |
| 64 | Clone URL: `code-yeongyu/kord-aios.git` | → `GDSDN/kord-aios.git` |
| 105 | "checking for OmO agent availability" | → "checking for Kord agent availability" |
| 112 | "AI agents (OmO, oracle, librarian, explore, etc.)" | → "AI agents (Kord, Dev, Architect, Librarian, Explore, etc.)" |
| 120 | "Main plugin entry (OhMyOpenCodePlugin)" | → "Main plugin entry (KordAiosPlugin)" |
| 268 | "Thank you for contributing to Oh My OpenCode!" | → "Thank you for contributing to Kord AIOS!" |

Also outdated:
- Line 113: "21 lifecycle hooks" → "40+ lifecycle hooks"
- Line 114: "LSP (11), AST-Grep, Grep, Glob" → "25+ tools (LSP, AST-Grep, delegation, etc.)"
- Line 118: Missing `auth/` → doesn't exist anymore
- Project structure is stale — missing `plugin-handlers/`, `features/squad/`, etc.

---

## 8. User-Facing Docs Needing Updates

| File | Issues |
|------|--------|
| `docs/ultrawork-manifesto.md` | 4× "Oh My OpenCode" → "Kord AIOS" |
| `docs/task-system.md` | 2× "Oh My OpenCode" → "Kord AIOS" |
| `docs/orchestration-guide.md` | Generally clean but references "OmO" style naming in delegation context |
| `docs/features.md` | Mostly up to date but should verify agent models/names match current code |
| `docs/configurations.md` | Mostly up to date |
| `docs/guide/installation.md` | Clean ✅ |
| `docs/guide/overview.md` | Clean ✅ |
| `docs/guide/understanding-orchestration-system.md` | Needs audit |
| `docs/category-skill-guide.md` | Has "autonomous" as OmO-era category name refs, otherwise clean |
| `docs/cli-guide.md` | Clean ✅ |

---

## 9. SKILL.md Mass Cleanup

**114 SKILL.md files** across 13 skill categories contain "OmO" references. These are likely patterns like:
- `OmO` agent name in delegation instructions
- `OmO` in tool descriptions
- `omo-` prefix in identifiers

**Recommended approach:** Script-based find-and-replace:
- `OmO` → `Kord` (in prose/descriptions)
- `omo-` → `kord-` (in identifiers, if any)
- Manual review for the top 5 files with 4-9 matches

**Categories affected (all 13):**
analysis, database, design-system, dev-workflow, devops, documentation, mcp, product, qa, squad, story, utilities, worktrees

---

## 10. Architecture Docs

| File | Size | Issues | Action |
|------|------|--------|--------|
| `docs/architecture/kord-aios-architecture.md` | 63KB | "KORD OS" (4×), OmO (7×), stale directory paths | UPDATE — rebrand + refresh directory structure |
| `docs/architecture/adr-0001-agent-topology.md` | 19KB | OmO (20×) | UPDATE — rebrand agent names |
| `docs/architecture/adr-0002-story-driven-orchestration.md` | 21KB | OmO (7×) | UPDATE — rebrand |
| `docs/architecture/audit-wave1-installer-hooks-tools-mcp.md` | 18KB | OMOC (4×), Synkra (1×) | UPDATE — rebrand |

---

## 11. Proposed EPIC-13: Documentation & Branding Cohesion

### Overview

Audit and update all documentation, guides, README, AGENTS.md files, and SKILL.md content to reflect the Kord AIOS brand consistently. Establish the origin narrative, add LLM-guiding AGENTS.md files to every major directory, and clean up stale/duplicate files.

### Stories

| # | Story | Scope | Est. |
|---|-------|-------|------|
| S01 | README rewrite — origin story, fix hero image, verify testimonials, update repo URLs | `README.md` | 2h |
| S02 | CONTRIBUTING.md rebrand — title, URLs, project structure, agent names | `CONTRIBUTING.md` | 1h |
| S03 | User-facing docs rebrand — ultrawork-manifesto, task-system, orchestration-guide | `docs/*.md` | 2h |
| S04 | Architecture docs rebrand — 4 files, OmO→Kord, Kord OS→Kord AIOS | `docs/architecture/` | 3h |
| S05 | SKILL.md mass cleanup — script-based OmO→Kord in 114 files + manual review of top 5 | `src/features/builtin-skills/skills/` | 4h |
| S06 | Root cleanup — delete v4/v5 architecture drafts, deduplicate archive, move CHANGELOG-WAVES | Root, `docs/archive/` | 1h |
| S07 | Research docs — add historical headers to all 17 research documents | `docs/researches/` | 1h |
| S08 | AGENTS.md — HIGH priority directories (config, plugin-handlers, squad, builtin-skills, background-agent, docs, docs/guide) | 7 files | 4h |
| S09 | AGENTS.md — MEDIUM priority directories (builtin-commands, builtin-squads, boulder-state, context-injector, skill-mcp-manager, architecture) | 6 files | 3h |
| S10 | AGENTS.md — LOW priority directories (14 remaining feature dirs + script/) | 15 files | 4h |
| S11 | docs/kord/ scaffolding — add README.md or .gitkeep to empty dirs with purpose descriptions | `docs/kord/` | 1h |
| S12 | Verification — grep audit for remaining stale references, test suite validation | All | 2h |

### Waves

| Wave | Stories | Theme |
|------|---------|-------|
| Wave 1 | S01, S02, S06 | Public-facing + cleanup |
| Wave 2 | S03, S04, S07 | Docs rebrand |
| Wave 3 | S05 | SKILL.md mass cleanup |
| Wave 4 | S08, S09, S10, S11 | AGENTS.md coverage |
| Wave 5 | S12 | Verification |

### Acceptance Criteria

- Zero "Oh My OpenCode" or "OmO" in user-facing docs or active SKILL.md files
- Zero "Kord OS" anywhere (should be "Kord AIOS")
- "Synkra" only appears in: README origin story (as historical reference), research docs (with header), completed epics, and archive
- Every `src/` directory with >2 files has an `AGENTS.md`
- `docs/` and `docs/guide/` have `AGENTS.md` guiding LLMs
- README has clear origin story narrative
- CONTRIBUTING.md fully rebranded
- No root-level architecture draft debris
- No duplicate archive directories
- `bun run typecheck` and `bun test` pass after all changes

### Dependencies

- None (documentation-only epic, no code changes except SKILL.md content)

### Risk

- **SKILL.md mass replace risk**: OmO could appear in contexts where "Kord" isn't the right replacement (e.g., "OmO's PreToolUse hook" → should be "Kord AIOS's PreToolUse hook" or just "the PreToolUse hook"). Manual review of top offenders is critical.
- **Testimonials**: Need user to confirm which are real vs placeholder.

---

## Appendix A: Full File Inventory for Deletion

```
DELETE:
  kord-architecture-v5.md                          (701 lines, superseded)
  kord-architeture-v4-05749e.md                    (518 lines, superseded, typo in name)
  docs/archive/migration/                          (duplicate of MIGRATION-OPEN-AIOS/docs/migration/)

MOVE TO docs/archive/:
  CHANGELOG-WAVES.md                               (migration-era, not user-relevant)
```

## Appendix B: AGENTS.md Template for New Files

```markdown
# {Directory Name}

**Purpose:** {one-line description}

## Structure

| File/Dir | Description |
|----------|-------------|
| `file.ts` | {what it does} |

## For LLM Agents

### When to Edit
- {scenario 1}
- {scenario 2}

### How to Customize
- {customization instructions}

### Anti-Patterns
- {what NOT to do}
```
