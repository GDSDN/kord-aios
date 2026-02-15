> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Kord AIOS — Agent Audit & Decision Record

> **Date**: 2026-02-11
> **Stage**: 2 of 7 — Agent-by-agent decision
> **Inputs**: `kord-architecture-v5.md`, `omoc-agentic-flow.md`, `aios-story-driven-flow.md`, `omoc-aios-gap-analysis.md`, current `src/agents/` state
> **Decision scope**: For each of the 20 agents — KEEP / MODIFY / REPLACE / NEW — with rationale
> **Revision**: Updated 2026-02-11 with confirmed decisions (plan-only scope, build autonomous, plan-analyzer/plan-reviewer, dev-junior story awareness)

---

## 0. Rebrand Decision

### Problem
v5 migration renamed code-level identifiers (sisyphus→kord, atlas→build, etc.) but:
- JSDoc/comments still reference Greek mythology ("Greek god of satire and mockery")
- v5 table assigns AIOS persona names (Morgan, Orion, River, Pax, etc.)
- Result: mythology + zodiac mix in the same codebase

### Decision: **Role-Based Only — No Personas**

| What | Decision | Rationale |
|------|----------|-----------|
| Code identifiers | DONE (v5 Wave 0) | `@kord`, `@dev`, `@qa` etc. — already clean |
| JSDoc/comments | **CLEAN** | Remove all mythology refs (Momus, Hephaestus, etc.) |
| AIOS persona names | **DROP** | No Morgan, Orion, River, Pax in code or prompts |
| System prompt identity | **Role-based** | "You are a Product Manager" not "You are Morgan" |
| Communication style | **PRESERVE** | Keep style traits (concise, advisory, etc.) without persona names |
| Internal code aliases | **DROP** | `promptAlias: "Oracle"` → `promptAlias: "Architect"` etc. |

**Why not keep persona names?**
- Users interact via `@dev`, `@qa`, `@pm` — persona names are invisible friction
- Mixing naming conventions creates cognitive load for contributors
- AIOS persona system (greeting levels, zodiac) depends on activation pipeline that Kord doesn't use
- Role names are self-documenting: `@architect` tells you exactly what it does

**What's preserved from AIOS personas:**
- Communication style (e.g., architect is advisory/strategic, dev is builder/pragmatic)
- Core principles (e.g., "CLI First" for dev, "Never invent requirements" for sm)
- Authority boundaries (e.g., only devops pushes)
- Collaboration maps (who delegates to whom)

---

## 1. Agent Roster — Final Decisions

### 1.1 PRIMARY AGENTS (user-facing, switchable via commands)

#### @kord — Primary Orchestrator

| Aspect | Value |
|--------|-------|
| **Decision** | **KEEP** |
| **Based on** | OMOC sisyphus (engine) + AIOS aios-master (methodology) |
| **Current file** | `src/agents/kord.ts` (544 lines, fully implemented) |
| **Model** | anthropic/claude-opus-4-6 |
| **Mode** | primary |
| **Changes needed** | Remove `promptAlias: "Kord"` mythology comment cleanup. Extend with AIOS methodology awareness (story lifecycle, squad delegation) |

**Why KEEP**: Already implemented with dynamic prompt builder, delegation table, task management. The OMOC sisyphus engine is battle-tested. AIOS master orchestrator methodology injects via skill loading, not prompt rewrite.

**Why NOT replace**: 544 lines of working code with delegation matrix, tool selection, anti-patterns. Rewriting loses test coverage.

---

#### @plan — Planning Agent

| Aspect | Value |
|--------|-------|
| **Decision** | **KEEP + EXTEND** |
| **Based on** | OMOC prometheus (interview→plan engine) |
| **Current file** | `src/agents/plan/` (directory, multi-file) |
| **Model** | anthropic/claude-opus-4-6 |
| **Mode** | primary |
| **Changes needed** | Support story-driven awareness: when generating plans for features/refactoring, include story-driven steps (PRD → architecture → stories → implement). Adapt output format based on user intent (development, research, generic tasks). |

**Why KEEP**: Prometheus interview→plan→review pipeline is sophisticated (interview mode, plan generation, plan-analyzer consultation, plan-reviewer review). This is engine capability that AIOS lacks.

**Why EXTEND, not rewrite**: The planning engine works. What it needs is output flexibility:
- User says "build auth system" → plan includes: create PRD, design architecture, create stories, implement, review, push
- User says "create marketing campaign" → plan includes: research, create task list, execute tasks
- User says "analyze competitor landscape" → plan includes: research tasks, produce report
- The plan FORMAT adapts; the interview/analysis/review PIPELINE stays the same.

**What @plan does**: It generates the COMPLETE BLUEPRINT of what needs to be done — a plan document listing all steps, executors, and wave structure. It delegates to plan-analyzer (gap analysis) and plan-reviewer (plan review) during its pipeline.

**What @plan does NOT do**: It does NOT execute the plan or create deliverables (PRDs, stories, code). It produces the plan document only. @build (or @kord) then executes that plan, delegating to specialists (@pm, @sm, @dev, etc.) for actual deliverable creation.

---

#### @build — Execution Loop

| Aspect | Value |
|--------|-------|
| **Decision** | **KEEP + EXTEND** |
| **Based on** | OMOC atlas (hooks, boulder state, delegation loop) |
| **Current file** | `src/agents/build/` (directory, multi-file) |
| **Model** | anthropic/claude-sonnet-4-5 |
| **Mode** | primary |
| **Changes needed** | Parse plan with full task hierarchy (Plan → Epic → Story → Task). Execute ALL plan steps autonomously — including doc generation (PRDs, stories) AND implementation. Support executor assignment, wave structure, and checkpoint decisions. Discovery mode: `/start-work` without args scans all pending work. |

**Why KEEP**: Atlas hook system (799 lines of orchestration) + boulder state + continuation mechanisms are the engine backbone. Cannot be replaced without rewriting the entire hook system.

**Why EXTEND**: @build becomes the **fully autonomous execution engine**:
1. Plan tasks with `executor:` field → delegate to named agent (e.g., @pm for PRD, @sm for stories, @dev for code)
2. End-to-end execution: if plan says "Wave 1: create docs, Wave 2: implement" → @build does both
3. Wave structure → execute items per wave, checkpoint between waves
4. Checkpoint decisions → @po provides GO/PAUSE/REVIEW/ABORT
5. Discovery mode: `/start-work` scans `docs/kord/plans/` and presents pending work to user
6. Direct mode: `/start-work plan-1` jumps straight to executing that plan
7. Plan scope determines loop: if plan says "docs only" → loop ends after docs. If plan says "implement" → loop continues through implementation.

---

#### @dev — Senior Developer

| Aspect | Value |
|--------|-------|
| **Decision** | **KEEP + ENRICH** |
| **Based on** | OMOC hephaestus (autonomous deep worker) + AIOS dev (story contracts) |
| **Current file** | `src/agents/dev.ts` (634 lines, fully implemented) |
| **Model** | openai/gpt-5.3-codex |
| **Mode** | primary |
| **Changes needed** | Inject AIOS story-driven contracts: story file updates, Dev Agent Record, DoD checklist awareness. Clean "Hephaestus" from any remaining comments. |

**Why KEEP**: 634 lines of GPT Codex-optimized prompt with IDS protocol, task discipline, tool selection. OMOC's deep worker capability is the best implementation agent.

**Why ENRICH (not rewrite)**: Add story-awareness as behavioral rules:
- When working on a story → update checkboxes in story file
- When completing subtask → update Dev Agent Record
- Before marking complete → run DoD checklist
- These are additive rules, not structural changes to the prompt

---

### 1.2 IMPLEMENTER

#### @dev-junior — Atomic Task Executor

| Aspect | Value |
|--------|-------|
| **Decision** | **KEEP + ENRICH** |
| **Based on** | OMOC sisyphus-junior + lighter AIOS dev story awareness |
| **Current file** | `src/agents/dev-junior/` (directory) |
| **Model** | category-based (haiku/sonnet depending on task) |
| **Mode** | subagent |
| **Changes needed** | 1) Clean "Sisyphus Junior" from comments. 2) Add story awareness: ability to update story checkboxes via `story_update` tool, follow mini-DoD checklist, report back in story context. NOT full autonomous deep-worker behavior. |

**Why ENRICH**: @build PREFERS delegating to @dev-junior (cheaper, faster, atomic). If @dev-junior can't handle stories, all story work goes to @dev (expensive). With lighter story awareness, @dev-junior handles 80% of story tasks, leaving @dev for complex multi-file work only.

**Why NOT merge with @dev**: Different optimization targets. @dev = strategic, autonomous, complex tasks (GPT Codex). @dev-junior = explicit, atomic, story-aware (haiku/sonnet). Merging loses token economy.

**Delegation priority**: @build always prefers @dev-junior unless the task requires deep autonomous reasoning or multi-file architecture changes.

---

### 1.3 SPECIALISTS — OMOC-Origin (merged with AIOS methodology)

#### @qa — Quality Guardian

| Aspect | Value |
|--------|-------|
| **Decision** | **MODIFY** |
| **Based on** | OMOC momus (plan review) + AIOS qa (code quality gates) |
| **Current file** | `src/agents/qa.ts` (262 lines) |
| **Model** | openai/gpt-5.2 |
| **Mode** | subagent |
| **Changes needed** | 1) Remove ALL Momus mythology from JSDoc/comments. 2) Extend: add code review capability alongside plan review. 3) Add AIOS gate decisions (APPROVED/NEEDS_WORK/REJECT). 4) Update `promptAlias` from any mythology ref. |

**Why MODIFY (not keep as-is)**: Current QA only reviews plans. Kord AIOS needs QA to also:
- Review code quality (AIOS qa-review-story methodology)
- Execute quality gate decisions
- Validate story acceptance criteria
- Integrate with self-healing (CodeRabbit-style loop)

**Why NOT replace**: The plan review capability is valuable — keep it AND add code review.

---

#### @architect — System Designer

| Aspect | Value |
|--------|-------|
| **Decision** | **MODIFY** |
| **Based on** | OMOC oracle (consultation) + AIOS architect (tech decisions) |
| **Current file** | `src/agents/architect.ts` (9885 bytes) |
| **Model** | openai/gpt-5.2 |
| **Mode** | subagent |
| **Changes needed** | 1) Remove Oracle mythology from JSDoc/promptAlias. 2) Add AIOS architect authority over `docs/kord/architecture/`. 3) Add tech decision documentation capability. |

**Why MODIFY**: Current architect is advisory-only (read-only analysis). AIOS architect has write authority over architecture docs. Must preserve read-only-for-code but add write-for-docs.

---

#### @analyst — Research & Deep Analysis (Execution-Phase)

| Aspect | Value |
|--------|-------|
| **Decision** | **MODIFY** |
| **Based on** | AIOS analyst (deep research, story-oriented analysis) |
| **Current file** | `src/agents/analyst.ts` (14368 bytes) |
| **Model** | anthropic/claude-opus-4-6 |
| **Mode** | subagent |
| **Changes needed** | 1) Remove Metis references — metis stays as separate `plan-analyzer` agent. 2) Refocus on EXECUTION-PHASE research: story-oriented analysis, market research, brainstorming, competitor analysis. 3) Add AIOS analyst methodology. |

**Why MODIFY**: @analyst is now DISTINCT from plan-analyzer. @analyst works during execution (deep research on specific topics). Plan-analyzer works during planning (gap analysis, ambiguity detection). Clean separation by phase.

**Why NOT merge with plan-analyzer**: Different timing (planning vs execution), different focus (plan gaps vs topic research), different callers (@plan vs @build/@kord).

---

#### @librarian — Knowledge Engine

| Aspect | Value |
|--------|-------|
| **Decision** | **KEEP AS-IS** |
| **Based on** | OMOC librarian (no AIOS equivalent) |
| **Current file** | `src/agents/librarian.ts` (12180 bytes) |
| **Model** | zai-coding-plan/glm-4.7 |
| **Mode** | subagent |
| **Changes needed** | None. Name is already role-based. |

**Why KEEP**: Pure utility agent. Searches docs, GitHub, external sources. No AIOS equivalent to merge. No mythology in name. Works perfectly.

**Note on v5 "researcher" rename**: v5 planned to rename librarian→researcher. Current code still says `librarian`. Decision: **KEEP "librarian"**. The name describes the function (library/docs/knowledge search), and the rename would break existing user muscle memory + requires re-testing all call_kord_agent references. Low value, medium risk.

---

#### @explore — Codebase Search

| Aspect | Value |
|--------|-------|
| **Decision** | **KEEP AS-IS** |
| **Based on** | OMOC explore (no AIOS equivalent) |
| **Current file** | `src/agents/explore.ts` (4097 bytes) |
| **Model** | xai/grok-code-fast-1 |
| **Mode** | subagent |
| **Changes needed** | None |

**Why KEEP**: Pure utility. Fast grep. No mythology. No changes needed.

---

#### @vision — Visual Analysis

| Aspect | Value |
|--------|-------|
| **Decision** | **KEEP AS-IS** |
| **Based on** | OMOC multimodal-looker (renamed in v5) |
| **Current file** | `src/agents/vision.ts` (2803 bytes) |
| **Model** | google/gemini-3-flash |
| **Mode** | subagent |
| **Changes needed** | None. Already cleanly renamed. |

**Why KEEP**: Token economy agent. Other agents delegate image/PDF analysis to @vision, get text summary back. Clean name, clean implementation.

---

### 1.4 PLAN-INTERNAL AGENTS (called within @plan pipeline)

#### @plan-analyzer — Pre-Planning Gap Analysis

| Aspect | Value |
|--------|-------|
| **Decision** | **NEW (from OMOC metis, renamed)** |
| **Based on** | OMOC metis (gap analysis, ambiguity detection, AI-slop flagging) |
| **Import from** | `kord-aios/src/agents/metis.ts` (full prompt) |
| **Model** | anthropic/claude-opus-4-6 |
| **Mode** | subagent (plan-internal) |
| **Changes needed** | 1) Rename from metis to plan-analyzer. 2) Clean all Metis mythology from comments/JSDoc. 3) Keep full prompt — intent classification, ambiguity detection, AI-slop flagging, clarifying questions. |

**Why KEEP as separate agent**: The planning pipeline (interview → analyze → generate → review) is a distinct flow from execution. Plan-analyzer works DURING PLANNING to detect gaps and ambiguities BEFORE the plan is finalized. This is different from @analyst which researches specific topics DURING EXECUTION.

**Why NOT merge into @analyst**: Different timing, different focus, different callers. Merging creates a dual-mode agent with a confused prompt. Keeping separate means clean, focused prompts for each phase.

---

#### @plan-reviewer — Plan Review & Blocker Detection

| Aspect | Value |
|--------|-------|
| **Decision** | **NEW (from OMOC momus, renamed)** |
| **Based on** | OMOC momus (plan review, blocker finding, executability verification) |
| **Import from** | `kord-aios/src/agents/momus.ts` (full prompt) |
| **Model** | openai/gpt-5.2 |
| **Mode** | subagent (plan-internal) |
| **Changes needed** | 1) Rename from momus to plan-reviewer. 2) Clean all Momus mythology from comments/JSDoc. 3) Keep full prompt — blocker-finder mindset, reference validation, executability check. |

**Why KEEP as separate agent**: Plan review ("is this plan executable?") is distinct from code/story review ("is this code correct?"). Plan-reviewer works DURING PLANNING to verify the plan BEFORE @build executes it. @qa works DURING EXECUTION to review completed code/stories.

**Why NOT merge into @qa**: @qa needs to focus on code quality, story acceptance criteria, and quality gates. Plan review is a different cognitive task — checking plan structure, reference validity, and blocking issues. Merging creates prompt confusion.

---

### 1.5 SPECIALISTS — AIOS-Origin (new agents, currently skeleton)

#### @sm — Story Architect

| Aspect | Value |
|--------|-------|
| **Decision** | **ENRICH** (currently skeleton) |
| **Based on** | AIOS sm (River, Facilitator) |
| **Current file** | `src/agents/sm.ts` (108 lines, skeleton) |
| **Model** | anthropic/claude-sonnet-4-5 |
| **Mode** | subagent |
| **Changes needed** | Rich prompt from AIOS sm.md methodology: story creation workflow, epic breakdown, acceptance criteria generation, developer handoff preparation. Drop persona name "River". |

**Why ENRICH (not replace)**: The skeleton structure (factory pattern, prompt metadata, tool restrictions) is correct. Needs methodology content injected into the system prompt.

**Critical for**: Story-driven flow. Without a capable @sm, stories are low-quality and devs get stuck.

---

#### @pm — Product Manager

| Aspect | Value |
|--------|-------|
| **Decision** | **ENRICH** (currently skeleton) |
| **Based on** | AIOS pm (Morgan, Strategist) |
| **Current file** | `src/agents/pm.ts` (109 lines, skeleton) |
| **Model** | anthropic/claude-sonnet-4-5 |
| **Mode** | subagent |
| **Changes needed** | Rich prompt from AIOS pm.md: PRD creation, epic management, product strategy, stakeholder communication. Drop persona name "Morgan". |

**Note on PM vs @plan**: @plan is the PLANNING ENGINE (interview→plan pipeline). @pm is a SPECIALIST AGENT that @plan delegates to for product-specific research. @pm produces PRDs and epic definitions; @plan orchestrates the planning process and produces the final plan document.

---

#### @po — Product Owner

| Aspect | Value |
|--------|-------|
| **Decision** | **ENRICH** (currently skeleton) |
| **Based on** | AIOS po (Pax, Guardian) |
| **Current file** | `src/agents/po.ts` (est. ~108 lines, skeleton) |
| **Model** | anthropic/claude-sonnet-4-5 |
| **Mode** | subagent |
| **Changes needed** | Rich prompt from AIOS po.md: story validation, backlog management, acceptance criteria validation, checkpoint decisions (GO/PAUSE/REVIEW/ABORT). Drop persona name "Pax". |

**Critical for**: Story lifecycle. @po validates stories before execution and provides checkpoint decisions between stories/waves.

---

#### @devops — Pipeline Operator

| Aspect | Value |
|--------|-------|
| **Decision** | **ENRICH** (currently skeleton) |
| **Based on** | AIOS devops (Gage, Sentinel) |
| **Current file** | `src/agents/devops.ts` (4138 bytes, skeleton) |
| **Model** | anthropic/claude-sonnet-4-5 |
| **Mode** | subagent |
| **Changes needed** | Rich prompt from AIOS devops.md: CI/CD, git push (EXCLUSIVE authority), PR creation, release management. Drop persona name "Gage". |

**Critical authority**: ONLY agent that can `git push` and create PRs. This is a constitutional rule from AIOS that must be enforced.

---

#### @data-engineer — Database Specialist

| Aspect | Value |
|--------|-------|
| **Decision** | **ENRICH** (currently skeleton) |
| **Based on** | AIOS data-engineer |
| **Current file** | `src/agents/data-engineer.ts` (4760 bytes, skeleton) |
| **Model** | anthropic/claude-sonnet-4-5 |
| **Mode** | subagent |
| **Changes needed** | Rich prompt from AIOS data-engineer.md: schema design, RLS, migrations, query optimization. |

---

#### @ux-design-expert — UX Designer

| Aspect | Value |
|--------|-------|
| **Decision** | **ENRICH** (currently skeleton) |
| **Based on** | AIOS ux-design-expert (Uma, Empath) |
| **Current file** | `src/agents/ux-design-expert.ts` (5145 bytes, skeleton) |
| **Model** | google/gemini-3-pro |
| **Mode** | subagent |
| **Changes needed** | Rich prompt from AIOS ux-design-expert.md. Drop persona name "Uma". |

**Note on model**: Uses `visual-engineering` category model (gemini-3-pro) since UX work is visual.

---

#### @squad-creator — Squad Assembler

| Aspect | Value |
|--------|-------|
| **Decision** | **ENRICH** (currently skeleton) |
| **Based on** | AIOS squad-creator |
| **Current file** | `src/agents/squad-creator.ts` (5310 bytes, skeleton) |
| **Model** | anthropic/claude-sonnet-4-5 |
| **Mode** | subagent |
| **Changes needed** | Rich prompt from AIOS squad-creator.md: team composition, SQUAD.yaml generation. |

---

## 2. Agent Count Summary

| Category | Count | Agents |
|----------|-------|--------|
| **Primary** | 4 | @kord, @plan, @build, @dev |
| **Implementer** | 1 | @dev-junior |
| **Plan-internal** | 2 | @plan-analyzer, @plan-reviewer |
| **OMOC-origin specialists** | 5 | @qa, @architect, @analyst, @librarian, @explore |
| **Utility** | 1 | @vision |
| **AIOS-origin specialists** | 7 | @sm, @pm, @po, @devops, @data-engineer, @ux-design-expert, @squad-creator |
| **TOTAL** | **20** | v5 plan (18) + 2 plan-internal agents |

### What Changed from v5

| v5 Decision | Audit Decision | Why |
|-------------|----------------|-----|
| Rename librarian→researcher | **KEEP "librarian"** | Already role-based, rename is low-value/medium-risk |
| Rename explore→code-search | **KEEP "explore"** | Same reasoning — working name, no mythology |
| Persona names (Morgan, River, etc.) | **DROP ALL** | No mythology, no zodiac. Role-based only. |
| `promptAlias: "Oracle"` in architect | **CHANGE to "Architect"** | Consistency with rebrand |
| Momus mythology in QA JSDoc | **REMOVE** | Clean codebase, no mixed naming |

### What's Confirmed from v5

- All 18 v5 agents remain + 2 plan-internal agents added (plan-analyzer, plan-reviewer)
- Agent-to-role mapping unchanged for existing agents
- Model assignments unchanged
- Mode assignments (primary/subagent) unchanged
- Factory pattern architecture unchanged
- Dynamic prompt builder architecture unchanged

---

## 3. What's NOT Decided Here (deferred to later stages)

| Topic | Stage |
|-------|-------|
| How @plan outputs adapt (plans vs epics vs stories) | Stage 3: Orchestration |
| How @build handles stories vs tasks | Stage 3: Orchestration |
| New hooks for story lifecycle | Stage 4: Tools/Hooks |
| Quality gate hook for @qa | Stage 4: Tools/Hooks |
| Wave execution mechanism | Stage 4: Tools/Hooks |
| Agent authority enforcement (who can write where) | Stage 6: Contracts |
| Agent drafts/notes permissions | Stage 6: Contracts |
| Skill loading per agent | Stage 5: Skills |

---

## 4. Implementation Impact

### Immediate Changes (can be done now)

| Change | Files | Effort |
|--------|-------|--------|
| Remove mythology from QA JSDoc | `qa.ts` | 5 min |
| Update `promptAlias` in architect | `architect.ts` | 5 min |
| Remove persona names from all agent JSDoc | Multiple `.ts` files | 30 min |

### Wave 1 Changes (agent prompt enrichment)

| Change | Files | Effort |
|--------|-------|--------|
| Enrich @sm prompt with AIOS methodology | `sm.ts` | 2h |
| Enrich @pm prompt with AIOS methodology | `pm.ts` | 2h |
| Enrich @po prompt with AIOS methodology | `po.ts` | 2h |
| Enrich @devops prompt with AIOS methodology | `devops.ts` | 1h |
| Enrich @data-engineer prompt | `data-engineer.ts` | 1h |
| Enrich @ux-design-expert prompt | `ux-design-expert.ts` | 1h |
| Enrich @squad-creator prompt | `squad-creator.ts` | 1h |
| Extend @qa with code review capability | `qa.ts` | 2h |
| Extend @architect with doc write authority | `architect.ts` | 1h |
| Add story-driven contracts to @dev | `dev.ts` | 2h |

### Deferred Changes (post-orchestration decisions)

| Change | Depends On |
|--------|-----------|
| @plan story-driven awareness in plan output | Stage 3 orchestration model |
| @build full autonomous end-to-end execution | Stage 3 orchestration model |
| @kord squad-aware delegation | Stage 3 orchestration model + Stage 4 tools |
| @dev-junior story-awareness skill loading | Stage 5 Skills |
