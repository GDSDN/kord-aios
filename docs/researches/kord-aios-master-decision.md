> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Kord AIOS — Master Decision Record

> **Date**: 2026-02-11
> **Status**: Decision Phase Complete — All investigations resolved
> **Revision**: Updated 2026-02-11 with confirmed decisions, star commands hybrid, script audit
> **Scope**: All system components — agents, orchestration, hooks, tools, skills, templates, contracts
> **Supporting documents**:
> - `kord-aios-agent-audit.md` — Stage 2
> - `kord-aios-orchestration-model.md` — Stage 3
> - `kord-aios-tools-hooks-commands.md` — Stage 4
> - `kord-aios-skills-templates-scripts.md` — Stage 5
> - `kord-aios-contracts.md` — Stage 6
> - `kord-aios-star-commands-scripts-investigation.md` — Star commands + scripts deep audit

---

## 1. System Identity

**Kord AIOS** = OMOC engine + AIOS methodology, unified as an OpenCode plugin.

- **OMOC provides**: Hook lifecycle, tool system, delegation engine, background agent manager, session management, model routing, skill loader, MCP architecture, config system, CLI installer
- **AIOS provides**: Story-driven methodology, agent authority rules, quality gates, checklists, templates, 151 domain skills, constitutional principles, handoff protocols

**Core principle**: The engine is domain-agnostic. Methodology is injected via skills and hooks. The system supports story-driven development AND generic task execution for any domain (marketing, legal, finance, etc.).

---

## 2. Decision Summary — By Component

### 2.1 Agents (20 total)

| Agent | Decision | Action Required | Import From |
|-------|----------|----------------|-------------|
| @kord | KEEP | Clean mythology refs | OMOC sisyphus.ts (full) |
| @plan | KEEP + EXTEND | Story-driven plan awareness, plan-only scope | OMOC prometheus/ (full) |
| @build | KEEP + EXTEND | Full autonomous end-to-end execution (docs + code) | OMOC atlas/ (full) |
| @dev | KEEP + ENRICH | Add story contracts | OMOC hephaestus.ts (full) + AIOS dev.md (methodology) |
| @dev-junior | KEEP + ENRICH | Add lighter story awareness (story_update, mini-DoD) | OMOC sisyphus-junior/ (full) + AIOS dev-lite |
| @plan-analyzer | NEW (renamed) | Import full metis prompt, rename | OMOC metis.ts (full) → plan-analyzer |
| @plan-reviewer | NEW (renamed) | Import full momus prompt, rename | OMOC momus.ts (full) → plan-reviewer |
| @qa | MODIFY | Add code review + gate decisions | AIOS qa.md (methodology) |
| @architect | MODIFY | Add doc-write authority, clean Oracle refs | OMOC oracle.ts (structure) + AIOS architect.md (methodology) |
| @analyst | MODIFY | Execution-phase research, decouple from metis | AIOS analyst.md (methodology) |
| @librarian | KEEP AS-IS | No changes | OMOC librarian.ts (full) |
| @explore | KEEP AS-IS | No changes | OMOC explore.ts (full) |
| @vision | KEEP AS-IS | No changes | OMOC multimodal-looker.ts (renamed, full) |
| @sm | ENRICH | Rich prompt from AIOS | Current skeleton + AIOS sm.md (methodology) |
| @pm | ENRICH | Rich prompt from AIOS | Current skeleton + AIOS pm.md (methodology) |
| @po | ENRICH | Rich prompt from AIOS | Current skeleton + AIOS po.md (methodology) |
| @devops | ENRICH | Rich prompt from AIOS | Current skeleton + AIOS devops.md (methodology) |
| @data-engineer | ENRICH | Rich prompt from AIOS | Current skeleton + AIOS data-engineer.md (methodology) |
| @ux-design-expert | ENRICH | Rich prompt from AIOS | Current skeleton + AIOS ux-design-expert.md (methodology) |
| @squad-creator | ENRICH | Rich prompt from AIOS | Current skeleton + AIOS squad-creator.md (methodology) |

**Rebrand**: Role-based names only. No mythology (Greek), no zodiac/persona names (Morgan, River, Pax). Drop all `promptAlias` mythology references.

**Why NOT keep "librarian→researcher" rename from v5**: "Librarian" is already role-based (not mythology), the rename is low-value, and it would break existing references. Same reasoning for "explore" staying as "explore".

### 2.2 Orchestration Model

**Decision**: Option D — Plan Generates Blueprint, Build Executes Everything.

```
Phase 1: /plan → interview → @plan-analyzer → generate plan → @plan-reviewer → PLAN.md
Phase 2: /start-work → @build executes ALL steps (doc creation + implementation + delivery)
```

**@plan generates blueprint only** (story-driven aware):
- Development → plan includes: PRD (pm) → architecture (architect) → stories (sm) → implement (dev) → review (qa) → push (devops)
- Generic → task list with executors
- Research → research tasks
- @plan delegates ONLY to plan-analyzer and plan-reviewer during its pipeline

**@build is fully autonomous end-to-end**:
- Executes ALL plan items: doc generation, story creation, implementation, quality gates, delivery
- Discovery mode: `/start-work` without args scans all pending work
- Plan scope determines loop end: docs-only stops after docs, end-to-end runs everything
- Prefers @dev-junior for atomic tasks, reserves @dev for complex work

**Task hierarchy**: Plan → Epic → Story → Task. Tasks always linked to parent for context and tracking.

### 2.3 Hooks

| Category | Count | Details |
|----------|-------|---------|
| KEEP (no changes) | 33 | All engine infrastructure hooks |
| MODIFY | 5 | build/, start-work/, plan-md-only/, dev-notepad/, todo-continuation-enforcer |
| NEW | 6 | story-lifecycle, quality-gate, wave-checkpoint, agent-authority, executor-resolver, decision-logger |
| **TOTAL** | **45** | |

**Critical new hooks**: `story-lifecycle` (enforces story contracts when active), `quality-gate` (QA review after story execution), `agent-authority` (file permission enforcement).

### 2.4 Tools

| Category | Count | Details |
|----------|-------|---------|
| KEEP (no changes) | 22 | All OMOC tools |
| MODIFY | 5 | delegate-task (+executor param), task_create/get/list/update (story awareness) |
| NEW | 4 | story_read, story_update, plan_read, squad_load |
| **TOTAL** | **31** | |

### 2.5 Commands

| Category | Count | Details |
|----------|-------|---------|
| KEEP | 8 | /plan, /start-work, /stop-continuation, /refactor, /ralph-loop, /cancel-ralph, /ulw-loop, /init (repurposed) |
| NEW | 3 | /checkpoint, /status, /squad |
| **TOTAL** | **11** | |

**Star commands from AIOS**: HYBRID APPROACH — absorbed via executor-resolver hook (autonomous), @kord delegation (chat), keyword-detector `*command` patterns (AIOS compat, Phase 3).

### 2.6 Skills

| Layer | Count | Source |
|-------|-------|--------|
| OMOC built-in (TS) | 5 | playwright, agent-browser, frontend-ui-ux, git-master, dev-browser |
| AIOS methodology (SKILL.md) | 151 | 138 KEEP + 13 ADAPT from AIOS tasks |
| User/project | 0+ | User creates in .opencode/skills/ |

### 2.7 Templates

| Decision | Count | Details |
|----------|-------|---------|
| Carry over as files | 7 | story, epic, prd, adr, task, qa-report, changelog |
| Embed in skills | 63 | SQL, architecture, design, CI/CD templates |
| Adapt | 8 | AIOS-internal framework evolution templates |

### 2.8 Scripts (57 total — audit complete)

| Decision | Count | Details |
|----------|-------|---------|
| → Hooks | 4 | story-update, agent-exit, approval-workflow, modification-validator |
| → Tools (TypeScript) | 6 | story-manager, story-index, backlog, security-checker, decision-recorder, dependency-analyzer |
| → Bash scripts (`.kord/scripts/`) | 5 | code-quality-improver, refactoring-suggester, performance-analyzer, test-generator, pattern-learner |
| → Skill content | 1 | commit-message-generator → git-master skill |
| Engine-redundant (SKIP) | 21 | Activation, greeting, config, validation (handled by plugin) |
| Deferred | 14 | Decision logging, metrics, conflict resolution, elicitation |

**Key insight**: Computation scripts (AST parsing, code analysis) stay as bash-executable `.kord/scripts/` files. Agents invoke via `node .kord/scripts/xyz.js` — saves ~2,000-10,000 tokens per run vs LLM reasoning. Cannot bundle @babel/eslint/prettier deps in plugin.

### 2.9 Contracts

**File authority**: Enforced by `agent-authority` hook.
- Only @dev/@dev-junior write source code
- Only @devops can git push / create PRs
- Each agent has designated write paths in `docs/kord/`
- Build and plan NEVER write code directly

**Story lifecycle**: Enforced by `story-lifecycle` hook (only in story-driven mode).
- DRAFT → READY → IN_PROGRESS → REVIEW → DONE
- @sm creates, @po validates, @dev implements, @qa reviews, @devops pushes

**Quality gates**: Enforced by `quality-gate` hook.
- After story completion: @qa reviews (APPROVED/NEEDS_WORK/REJECT)
- Max 2 NEEDS_WORK iterations before escalation
- Quality gate agent ALWAYS differs from executor

**Wave checkpoints**: Enforced by `wave-checkpoint` hook.
- @po provides GO/PAUSE/REVIEW/ABORT between waves
- Configurable: `auto` (skip checkpoints) or `interactive` (ask user)

**Notes/drafts**: Agents can write internal notes to designated paths.
- Append-only, plan files are sacred
- Notepad is shared across subagents working on same plan
- @build reads notepad before each delegation

---

## 3. What Changes from v5 Architecture

| v5 Decision | Master Decision | Why Changed |
|-------------|----------------|-------------|
| librarian→researcher rename | **KEEP "librarian"** | Low-value rename, already role-based |
| explore→code-search rename | **KEEP "explore"** | Same reasoning |
| Persona names in v5 table | **DROP ALL** | No mythology/zodiac mix |
| No orchestration contracts | **Full contract system defined** | Stage 6 fills this gap |
| No story lifecycle | **Story lifecycle hook + state machine** | Critical for story-driven flow |
| No quality gates | **Quality gate hook + QA review** | Critical for quality assurance |
| No wave execution | **Wave-checkpoint hook + boulder extension** | Parallel story execution |
| Star commands consideration | **HYBRID** (executor-resolver + delegation + keyword-detector) | Absorbed at 3 layers, preserves AIOS UX |
| 1:1 agent substitution | **Import OMOC full prompts + inject AIOS methodology** | Preserves battle-tested code |
| metis/momus merged into analyst/qa | **KEPT SEPARATE as plan-analyzer/plan-reviewer** | Distinct phase (planning vs execution), distinct focus, cleaner prompts |
| dev-junior = atomic only | **dev-junior + story awareness** | @build prefers dev-junior (cheaper), needs story capability |
| No squad-specific contracts | **Squad contract system** (SQUAD.yaml overrides) | Enables non-dev domains |

---

## 4. Updated Implementation Plan

The v5 wave plan remains the backbone. These are the ADDITIONS required:

### Wave 1 (Agent System) — ADDITIONS

| Task | Effort | Description |
|------|--------|-------------|
| Import OMOC agent prompts for 3 merged agents + 2 plan-internal | 6h | Copy full prompts from `kord-aios`, rename metis→plan-analyzer, momus→plan-reviewer |
| Enrich 7 AIOS-origin skeleton agents | 10h | Inject AIOS methodology from `.aios-core/development/agents/` |
| Clean mythology/persona references | 1h | Remove all Greek mythology and zodiac persona names |
| Update promptAlias values | 30min | Change "Oracle"→"Architect", etc. |

### Wave 2 (Hooks & Engine) — ADDITIONS

| Task | Effort | Description |
|------|--------|-------------|
| Implement `story-lifecycle` hook | 5h | Story-driven enforcement when in story mode |
| Implement `quality-gate` hook | 5h | QA review trigger after story execution |
| Implement `wave-checkpoint` hook | 4h | @po checkpoint between waves |
| Implement `agent-authority` hook | 4h | File/git permission enforcement |
| Implement `executor-resolver` hook | 3h | Resolve executor from plan metadata |
| Extend `build/` hook for stories/waves | 8h | Parse story/task/wave structure, executor delegation |
| Extend `start-work/` hook | 4h | Extended boulder state, --squad/--wave params |
| Extend boulder state | 2h | Add plan_type, wave tracking, executor, squad fields |

### Wave 2.5 (NEW — Tools)

| Task | Effort | Description |
|------|--------|-------------|
| Implement `story_read` tool | 3h | Parse story file structure |
| Implement `story_update` tool | 3h | Update story checkboxes, status, Dev Agent Record |
| Implement `plan_read` tool | 3h | Parse plan document structure |
| Implement `squad_load` tool | 3h | Load SQUAD.yaml manifests |
| Extend `delegate-task` | 3h | Add executor, story_path parameters |

### Wave 3 (Skills) — NO CHANGES from v5

151 AIOS tasks → SKILL.md conversion. Plan is confirmed.

### Wave 4 (Installer + Squad) — ADDITIONS

| Task | Effort | Description |
|------|--------|-------------|
| Install `.kord/templates/` (7 shared templates) | 1h | Story, epic, PRD, ADR, task, QA report, changelog |
| Install `.kord/checklists/` (story DoD) | 30min | Story definition of done |
| Install `docs/kord/` extended structure | 30min | Add runs/, reviews/ subdirectories |

### Wave 5 (Documentation) — NO CHANGES from v5

### Wave 6 (E2E Validation) — ADDITIONS

| Task | Effort | Description |
|------|--------|-------------|
| Story lifecycle E2E | 2h | /plan → stories → /start-work → @dev develops → @qa reviews → @devops pushes |
| Wave execution E2E | 2h | Multi-wave plan with checkpoints |
| Squad override E2E | 1h | Custom squad overrides plan format and execution |
| Agent authority E2E | 1h | Verify file permission enforcement |

### Revised Estimate

| Wave | v5 Estimate | Additional Work | New Total |
|------|-------------|----------------|-----------|
| 0 | 4-6h | 0 | 4-6h |
| 1 | 10-14h | +16h | 26-30h |
| 2 | 8-12h | +35h (incl. 2.5) | 43-47h |
| 3 | 6-8h | 0 | 6-8h |
| 4 | 8-12h | +2h | 10-14h |
| 5 | 4-6h | 0 | 4-6h |
| 6 | 6-8h | +5h | 11-13h |
| **TOTAL** | **46-66h** | **+58h** | **104-124h** |

---

## 5. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| story-lifecycle hook too restrictive | Medium | High | Soft-block by default, config to hard-block |
| agent-authority hook blocks legitimate operations | Medium | Medium | Allowlist overrides in config |
| @plan dual-output increases complexity | Low | Medium | Start with development output only, add task output later |
| Wave execution introduces race conditions | Medium | High | Sequential within wave first, parallel as Phase 2 |
| Skeleton agents lack sufficient methodology | High | High | Import full AIOS agent.md content, test with real tasks |
| Boulder state extension breaks existing tests | Low | Medium | Extend with optional fields, backward compatible |

---

## 6. Decision Tree — Quick Reference

```
User chats with @kord
  │
  ├─ Needs planning? → /plan → @plan handles
  │   ├─ Development work? → Stories generated → /start-work → Story-driven loop
  │   ├─ Generic tasks? → Task list generated → /start-work → Task-driven loop
  │   └─ Research? → Research plan → /start-work → Research delegation
  │
  ├─ Simple implementation? → @kord implements directly (or delegates to @dev)
  │
  ├─ Quick question? → @kord answers (or delegates to @architect/@librarian)
  │
  └─ Squad work? → /plan --squad=X → Squad-specific planning → /start-work → Squad execution
```

---

## 7. Files Produced in This Audit

| File | Stage | Content |
|------|-------|---------|
| `kord-aios-agent-audit.md` | 2 | Per-agent KEEP/MODIFY/REPLACE decisions + rebrand |
| `kord-aios-orchestration-model.md` | 3 | Two-phase architecture, work units, boulder extension |
| `kord-aios-tools-hooks-commands.md` | 4 | 45 hooks, 31 tools, 9 commands — disposition |
| `kord-aios-skills-templates-scripts.md` | 5 | 151 skills, 7 templates, script disposition |
| `kord-aios-contracts.md` | 6 | File authority, delegation rules, handoffs, constitutional gates |
| `kord-aios-master-decision.md` | 7 | This document — master summary |

**Total decisions made**: 20 agents + 45 hooks + 31 tools + 11 commands + 151 skills + 7 templates + 57 scripts + 6 constitutional gates + authority matrix + handoff protocols.

**All investigations complete.** Star commands: hybrid approach. Scripts: 5 bash-executable, 6 tools, 4 hooks, 1 skill, 21 skip, 14 deferred.
