> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Kord AIOS — Orchestration Model Decision

> **Date**: 2026-02-11
> **Stage**: 3 of 7 — Plan/Epic/Story/Task flow decision
> **Inputs**: Agent audit (Stage 2), gap analysis, OMOC atlas hook study, AIOS workflow study
> **Key question from user**: "Prometheus gera plans ou epics? Depende do objetivo do usuário"
> **Revision**: Updated 2026-02-11 with confirmed decisions (@plan generates plans only, @build executes everything, task hierarchy, discovery mode)

---

## 1. The Three Options Considered

### Option A: @plan Creates Plans, @build Executes
```
/plan → interview → write plan.md → /start-work → @build executes tasks from plan
```
**Pro**: Simple, already works in OMOC.
**Con**: No story-driven flow. No multi-agent planning. No epic structure.

### Option B: @plan Orchestrates Subagents Directly
```
/plan → interview → @plan spawns @pm → @pm creates PRD → @plan spawns @sm → @sm creates stories → @plan delivers everything
```
**Pro**: Single command produces all artifacts.
**Con**: @plan becomes monolithic. Mixing planning with execution. If @plan crashes, everything lost. No separation of concerns.

### Option C: @plan Generates Documents via Delegation, @build Executes
```
/plan → interview → delegates to specialists → assembles plan document → /start-work → @build reads plan → delegates execution
```
**Pro**: Clean separation (plan ≠ execute). Uses existing delegation infrastructure. Supports any domain.
**Con**: @plan still does delegation work, blurring the line with execution.

### Option D (REFINED): @plan Generates Blueprint Only, @build Executes Everything
```
/plan → interview → plan-analyzer → generate plan document → plan-reviewer → /start-work → @build executes ALL steps (doc creation + implementation)
```
**Pro**: Simplest @plan. Single approval point. @build handles everything after approval. End-to-end autonomous execution.
**Con**: @build needs to be more capable (handle doc generation + code implementation).

### Decision: **Option D** — Plan Generates Blueprint, Build Executes Everything

---

## 2. The Two-Phase Architecture

### Phase 1: PLANNING (driven by @plan)

@plan generates the COMPLETE BLUEPRINT. It does NOT create deliverables (PRDs, stories, code). It only produces the plan document describing what needs to be done, by whom, in what order.

```
User: /plan "build authentication system"
         │
         ▼
    @plan INTERVIEW MODE
         │ 1. Classify intent (development? research? analysis?)
         │ 2. Gather requirements via interview
         │ 3. Consult plan-analyzer (gap analysis, ambiguity detection)
         │    └─ task(@plan-analyzer, "analyze requirements for auth system")
         │
         ▼
    @plan PLAN GENERATION (story-driven aware)
         │ 4. Generate plan document based on intent:
         │
         │    IF development intent (feature, refactor):
         │    └─ Plan includes story-driven steps:
         │       Wave 1 — Documentation:
         │         - Create PRD (executor: pm)
         │         - Design architecture (executor: architect)
         │         - Create stories from PRD (executor: sm)
         │       Wave 2 — Implementation:
         │         - Story AUTH-001: Login API (executor: dev)
         │         - Story AUTH-002: Registration (executor: dev-junior)
         │       Wave 3 — Quality & Delivery:
         │         - Quality review (executor: qa)
         │         - Push & PR (executor: devops)
         │
         │    IF generic task intent:
         │    └─ Plan includes flat task list with executors
         │
         │    IF research intent:
         │    └─ Plan includes research tasks with analyst/librarian
         │
         ▼
    @plan REVIEW & APPROVAL
         │ 5. Submit to plan-reviewer:
         │    └─ task(@plan-reviewer, "review plan for blockers")
         │ 6. Write final plan: docs/kord/plans/{name}/PLAN.md
         │ 7. Present summary to user
         │ 8. Guide to /start-work
         │
         ▼
    Plan approved → Return to @kord
```

### Phase 2: EXECUTION (driven by @build)

@build executes EVERYTHING in the plan autonomously — including doc generation tasks (PRDs, architecture, stories) AND code implementation. The plan scope determines when the loop ends.

```
User: /start-work
         │
         ▼
    DISCOVERY MODE (no args):
         │ Scan docs/kord/plans/ for all pending plans/epics/stories
         │ Present options to user:
         │   1. plan-auth-system (3 waves, 12 items, 0% complete)
         │   2. story-AUTH-003 (standalone, ready)
         │   3. epic-onboarding (2 stories pending)
         │ User selects → proceed
         │
    DIRECT MODE: /start-work plan-auth-system
         │
         ▼
    @build reads docs/kord/plans/{name}/PLAN.md
         │
         ▼
    FOR EACH WAVE (or sequential if no waves):
         │
         │  FOR EACH WORK ITEM in wave:
         │  │
         │  │  Read executor field + resolve skills:
         │  │  ├─ executor: pm → task(@pm, "create PRD", load_skills=["create-prd"])
         │  │  ├─ executor: architect → task(@architect, "design architecture")
         │  │  ├─ executor: sm → task(@sm, "create stories", load_skills=["create-next-story"])
         │  │  ├─ executor: dev → task(@dev, story prompt, load_skills=["develop-story"])
         │  │  ├─ executor: dev-junior → task(@dev-junior, story prompt, load_skills=["develop-story-lite"])
         │  │  ├─ executor: data-engineer → task(@data-engineer, task prompt, load_skills=["db-schema-audit"])
         │  │  ├─ executor: devops → task(@devops, task prompt)
         │  │  ├─ executor: qa → task(@qa, "quality gate", load_skills=["qa-review-story"])
         │  │  └─ (no executor) → task(@dev-junior, task prompt)  ← default
         │  │
         │  │  After execution:
         │  │  ├─ Verify (lsp, build, test, or custom per plan)
         │  │  ├─ If story AND quality_gate: task(@qa, "quality gate review")
         │  │  ├─ Mark complete in plan (task always linked to parent: plan/epic/story)
         │  │  └─ Continue or retry (max 3)
         │  │
         │  WAVE GATE:
         │  ├─ task(@po, "checkpoint: GO/PAUSE/REVIEW/ABORT")
         │  └─ Based on decision: continue / pause / review / abort
         │
         ▼
    PLAN SCOPE DETERMINES END:
         │ Plan says "docs only" → loop ends after doc waves
         │ Plan says "implement" → loop continues through implementation
         │ Plan says "end-to-end" → loop runs docs → implement → review → push
         │
         ▼
    COMPLETION
         │ Final report → accumulated changes, test results, completion status
```

---

## 3. Work Unit Types

### 3.1 Stories (Development Domain)

Used when @plan detects development intent. Created by @sm.

```markdown
# Story: AUTH-001 — User Login API

## Metadata
executor: dev
quality_gate: qa
wave: 1

## Acceptance Criteria
- [ ] POST /api/auth/login accepts email+password
- [ ] Returns JWT token on success
- [ ] Returns 401 on invalid credentials
- [ ] Rate limited to 5 attempts per minute

## Tasks
- [ ] Create login endpoint handler
- [ ] Implement JWT token generation
- [ ] Add rate limiting middleware
- [ ] Write integration tests

## Dev Notes
- Use existing bcrypt utility in src/utils/crypto.ts
- JWT secret from environment variable AUTH_JWT_SECRET

## Testing
- Unit tests for handler logic
- Integration test for full login flow
- Rate limit edge case testing
```

**Story execution**: @build loads `develop-story` skill into @dev, which follows story-driven development cycle (AIOS methodology). @dev updates checkboxes, writes Dev Agent Record.

### 3.2 Tasks (Generic Domain)

Used for non-development work or simple development tasks.

```markdown
# Task: Create competitor analysis report

## Metadata
executor: analyst
verify: file_exists docs/kord/plans/{name}/competitor-analysis.md

## Description
Analyze top 5 competitors in the authentication SaaS space.
Focus on: pricing, features, developer experience, market positioning.

## Expected Output
Markdown report with comparison matrix and recommendations.
```

**Task execution**: @build delegates to the named executor with the task description. No story lifecycle, no quality gates unless specified.

### 3.3 Plan Document (Master Container)

```markdown
# PLAN: Authentication System

## Plan Type: development
## Created: 2026-02-11
## Status: approved

## Wave Structure

### Wave 1 — Foundation
- [x] Story: AUTH-001 — User Login API (executor: dev, qa_gate: qa)
- [ ] Story: AUTH-002 — User Registration (executor: dev, qa_gate: qa)
- [ ] Task: DB schema design (executor: data-engineer)

### Wave 2 — OAuth Integration
- [ ] Story: AUTH-003 — Google OAuth (executor: dev, qa_gate: qa)
- [ ] Story: AUTH-004 — GitHub OAuth (executor: dev, qa_gate: qa)

### Wave 3 — Security Hardening
- [ ] Task: Security audit (executor: analyst)
- [ ] Story: AUTH-005 — 2FA Implementation (executor: dev, qa_gate: qa)
```

---

## 4. @plan Output Flexibility

@plan does NOT delegate to specialists during planning. It generates the plan document that DESCRIBES what @build should delegate. The plan itself is story-driven aware.

| User Intent | Detection Signal | Plan Content (executed later by @build) | Output Format |
|-------------|-----------------|----------------------------------------|---------------|
| **Build feature** | "build", "implement", "create feature" | Wave 1: PRD (pm), architecture (architect), stories (sm). Wave 2+: implement stories (dev/dev-junior). Wave N: review + push | Stories with waves, end-to-end |
| **Fix bugs** | "fix", "debug", "resolve" | Tasks: find bug (explore), fix (dev-junior), verify | Simple task list |
| **Research** | "research", "analyze", "investigate" | Tasks: research (analyst/librarian), report | Research tasks |
| **Refactor** | "refactor", "improve", "optimize" | Wave 1: analysis (architect), stories (sm). Wave 2: implement | Stories (smaller, focused) |
| **Documentation** | "document", "write docs" | Tasks: scope (pm), write docs (sm/dev) | Task list |
| **Marketing campaign** | "marketing", "campaign", "launch" | Tasks per squad manifest | Squad format |
| **Database migration** | "schema", "migration", "database" | Wave 1: analysis (data-engineer), stories (sm). Wave 2: implement | Stories with DB focus |

**Key principle**: @plan's INTERVIEW ENGINE is domain-agnostic. The plan FORMAT and EXECUTOR ASSIGNMENTS adapt based on intent. @plan is story-driven aware — for development work it automatically includes doc generation → story creation → implementation → review → delivery steps.

---

## 5. How @build Handles Stories vs Tasks

### 5.1 Unified Execution Loop

@build doesn't need separate code paths. It has ONE loop with behavioral branches:

```
FOR each work_item in plan:
  1. READ work_item type and metadata
  2. RESOLVE executor (from metadata or default)
  3. RESOLVE skills (based on type: develop-story, qa-review, etc.)
  4. DELEGATE via task() tool
  5. VERIFY (based on work_item.verify or default per type)
  6. IF story AND quality_gate specified:
       → DELEGATE quality gate to quality_gate agent
  7. MARK complete
  8. IF wave boundary AND checkpoint enabled:
       → DELEGATE checkpoint to @po
```

### 5.2 What Changes in @build Hook

| Current (OMOC) | Kord AIOS Extension |
|-----------------|---------------------|
| Reads plan checkboxes only | Reads plan with stories/tasks/waves |
| Delegates always to @dev-junior | Delegates to executor field (or @dev-junior default) |
| No quality gates | Optional quality gate per story |
| No wave awareness | Wave boundaries trigger checkpoints |
| No checkpoint decisions | @po checkpoint: GO/PAUSE/REVIEW/ABORT |
| Verify: lsp + build + test | Verify: configurable per work item |
| Boulder state: plan path + checkboxes | Boulder state: + current wave, executor, work type |

### 5.3 What DOES NOT Change

- Atlas hook lifecycle (event, tool.execute.before, tool.execute.after) — same events
- Continuation mechanisms (atlas idle, todo enforcer) — same behavior
- Session resume (session_id for retry) — same mechanism
- Notepad system (subagent writes notes) — same files
- Background manager (concurrency, polling) — same infrastructure

---

## 6. Boulder State Extension

Current `BoulderState`:
```typescript
interface BoulderState {
  active_plan: string
  started_at: string
  session_ids: string[]
  plan_name: string
  agent?: string
}
```

Extended for Kord AIOS:
```typescript
interface BoulderState {
  active_plan: string
  started_at: string
  session_ids: string[]
  plan_name: string
  agent?: string
  // NEW fields
  plan_type?: "development" | "task" | "research" | "mixed"
  current_wave?: number
  total_waves?: number
  current_item?: string           // Current story/task ID
  current_executor?: string       // Current executor agent
  squad?: string                  // Active squad name
  checkpoint_mode?: "auto" | "interactive"  // GO auto or ask user
  completed_items?: string[]      // List of completed item IDs
}
```

---

## 7. Orchestration Contracts

### 7.1 @plan → Plan-Internal Contracts

@plan only delegates to plan-internal agents during its pipeline:

| Delegate | Input | Output | Purpose |
|----------|-------|--------|---------|
| @plan-analyzer | Requirements + codebase context | Gap analysis, ambiguity list, clarifications | Pre-generation analysis |
| @plan-reviewer | Generated plan document | Review verdict (blockers, issues) | Post-generation review |

### 7.1b @build → Document Creation Contracts (during execution)

When @build executes plan items that produce documents:

| Delegate | Input | Output | Location |
|----------|-------|--------|----------|
| @pm | Requirements brief from plan | PRD | `docs/kord/plans/{name}/prd.md` |
| @architect | PRD + codebase analysis | Architecture design | `docs/kord/plans/{name}/architecture.md` |
| @sm | PRD + architecture | Stories | `docs/kord/plans/{name}/stories/*.md` |
| @analyst | Research question | Research report | `docs/kord/plans/{name}/research.md` |

### 7.2 @build → Execution Contracts

| Delegate | Input | Output | Verification |
|----------|-------|--------|-------------|
| @dev | Story + skills | Implemented code | lsp + build + test |
| @dev-junior | Task + explicit prompt | Implemented code | lsp + build |
| @data-engineer | DB task + skills | Schema/migration | migration test |
| @qa | Completed story | Quality verdict | APPROVED/NEEDS_WORK/REJECT |
| @devops | Approved story | Pushed branch + PR | PR URL |
| @po | Wave completion | Checkpoint decision | GO/PAUSE/REVIEW/ABORT |

### 7.3 Agent Internal Notes

**Decision**: Agents CAN write internal notes (drafts, observations) to preserve context.

| Agent | Can Write To | Purpose |
|-------|-------------|---------|
| @dev, @dev-junior | `docs/kord/notepads/{plan-name}/` | Learnings, issues, decisions, problems |
| @plan | `docs/kord/plans/{name}/drafts/` | Interview notes, research summaries |
| @build | `docs/kord/runs/{plan-name}/` | Execution logs, wave reports |
| @qa | `docs/kord/plans/{name}/reviews/` | Review findings |
| All others | Via skill output or return value | No persistent draft writes |

---

## 8. Squad Integration

Squads inject context into the planning and execution phases:

```
/plan --squad=marketing "launch campaign for product X"
         │
         ▼
    @plan detects squad=marketing
    @plan loads squad manifest (.opencode/squads/marketing/SQUAD.yaml)
    Squad defines:
      - Available agents (pm, analyst, ux-design-expert)
      - Plan template (campaign format, not story format)
      - Available skills (campaign-planning, audience-analysis, etc.)
      - Verification methods (report review, not code build)
    @plan interview uses squad context
    @plan generates task plan in squad format
         │
         ▼
    /start-work {plan-name}
    @build reads plan
    @build delegates to squad agents with squad skills
    @build verifies per squad verification methods
```

**No new engine code needed for squads**. The existing delegation system (task() with category/executor/skills) already supports this. What's needed:
1. Squad manifest loader (reads SQUAD.yaml)
2. Squad context injection into @plan prompt
3. Squad context injection into @build prompt

---

## 9. Command System

| Command | Activates | Purpose |
|---------|-----------|---------|
| `/plan "description"` | @plan | Start planning pipeline |
| `/plan --squad=X "description"` | @plan | Plan with squad context |
| `/start-work [plan-name]` | @build | Start execution loop |
| `/start-work --wave=N` | @build | Resume from specific wave |
| (no command — direct chat) | @kord | Primary orchestrator, can implement or delegate |

**Star commands (*) from AIOS**: PENDING DECISION. Star commands in AIOS are internal triggers that tell agents which skill/workflow to follow. Investigation needed on best approach for Kord AIOS UX. Options: hooks with auto-skill loading, recognized patterns in prompts, or lightweight slash commands. See separate investigation.

---

## 10. Summary — What This Model Enables

| Capability | How |
|-----------|-----|
| **Story-driven development** | @plan generates plan with story steps → @build delegates @pm (PRD) → @sm (stories) → @dev (implement) → @qa (review) → @devops (push) |
| **Generic task execution** | @plan → flat task list → @build executes each task via named executor |
| **Multi-domain squads** | Squad manifest changes agents, skills, plan format, verification |
| **Planning flexibility** | @plan adapts output based on intent detection |
| **Quality gates** | Per-story quality_gate field → @qa reviews → verdict |
| **Wave parallelism** | Plan defines waves → @build processes items per wave |
| **Checkpoint decisions** | @po provides GO/PAUSE/REVIEW/ABORT between waves |
| **Agent notes/drafts** | Agents write to designated paths for context preservation |
| **Session recovery** | Extended boulder state tracks wave, item, executor |
| **Backward compatibility** | Simple checkbox plans still work (OMOC style) |
| **End-to-end plans** | Plan scope determines loop: docs-only stops after docs, implement continues through code |
| **Task hierarchy** | Tasks always linked to parent (plan → epic → story → task) for context and tracking |
| **Discovery mode** | `/start-work` without args scans and presents all pending work |
