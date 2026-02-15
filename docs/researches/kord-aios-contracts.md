> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Kord AIOS — Agent Contracts, Authority & Handoff Rules

> **Date**: 2026-02-11
> **Stage**: 6 of 7 — Who can do what, where, when, and who hands off to whom
> **Inputs**: Agent audit (Stage 2), orchestration model (Stage 3), tools/hooks (Stage 4)
> **Revision**: Updated 2026-02-11 — added plan-analyzer/plan-reviewer, updated delegation flow, dev-junior story awareness

---

## 1. File Authority Matrix

### 1.1 Source Code Files

| Agent | READ | WRITE/EDIT | CREATE | DELETE | Enforcement |
|-------|------|-----------|--------|--------|-------------|
| @kord | ✅ | ✅ | ✅ | ❌ | Primary agent — full implementation rights |
| @dev | ✅ | ✅ | ✅ | ❌ | Primary implementer |
| @dev-junior | ✅ | ✅ | ✅ | ❌ | Atomic implementer |
| @build | ✅ | ❌ | ❌ | ❌ | **Orchestrator NEVER writes code** (build hook enforces) |
| @plan | ✅ | ❌ | ❌ | ❌ | **Planner NEVER writes code** (plan-md-only hook enforces) |
| @qa | ✅ | ❌ | ❌ | ❌ | Read-only for review |
| @architect | ✅ | ❌ | ❌ | ❌ | Read-only for analysis |
| @analyst | ✅ | ❌ | ❌ | ❌ | Read-only for research |
| @sm | ✅ | ❌ | ❌ | ❌ | Read-only (story creation is in docs/, not src/) |
| @pm | ✅ | ❌ | ❌ | ❌ | Read-only |
| @po | ✅ | ❌ | ❌ | ❌ | Read-only |
| @devops | ✅ | ✅ (CI/CD files only) | ✅ (CI/CD files only) | ❌ | `.github/`, `Dockerfile`, `docker-compose.*`, CI configs |
| @data-engineer | ✅ | ✅ (migrations only) | ✅ (migrations only) | ❌ | `**/migrations/**`, `**/schema.*`, `supabase/**` |
| @ux-design-expert | ✅ | ✅ (design files only) | ✅ (design files only) | ❌ | `**/*.css`, `**/*.scss`, `**/design-tokens/**`, `**/components/**/*.tsx` |
| @librarian | ✅ | ❌ | ❌ | ❌ | Read-only research |
| @explore | ✅ | ❌ | ❌ | ❌ | Read-only search |
| @vision | ✅ | ❌ | ❌ | ❌ | Read-only analysis |
| @squad-creator | ✅ | ❌ | ❌ | ❌ | Read-only |
| @plan-analyzer | ✅ | ❌ | ❌ | ❌ | Read-only (plan-internal, analysis only) |
| @plan-reviewer | ✅ | ❌ | ❌ | ❌ | Read-only (plan-internal, review only) |

### 1.2 Documentation Files (`docs/kord/`)

| Agent | plans/ | stories/ | adrs/ | notepads/ | runs/ | architecture/ |
|-------|--------|----------|-------|-----------|-------|---------------|
| @kord | READ | READ | READ | READ | READ | READ |
| @plan | **WRITE** | READ | READ | **WRITE** (drafts/) | READ | READ |
| @build | READ | READ (status update via tool) | READ | **WRITE** (run logs) | **WRITE** | READ |
| @dev | READ | **UPDATE** (via story_update tool) | READ | **WRITE** | READ | READ |
| @dev-junior | READ | **UPDATE** (via story_update tool) | READ | **WRITE** | READ | READ |
| @sm | READ | **WRITE** (create stories) | READ | READ | READ | READ |
| @pm | **WRITE** (PRD) | READ | READ | READ | READ | READ |
| @po | READ | **UPDATE** (status, checkpoint) | READ | READ | READ | READ |
| @qa | READ | **UPDATE** (review verdict) | READ | **WRITE** (reviews/) | READ | READ |
| @architect | READ | READ | **WRITE** | READ | READ | **WRITE** |
| @devops | READ | READ | READ | READ | READ | READ |
| @data-engineer | READ | READ | READ | READ | READ | READ |
| @analyst | **WRITE** (research/) | READ | READ | READ | READ | READ |
| @plan-analyzer | READ | READ | READ | READ | READ | READ |
| @plan-reviewer | READ | READ | READ | READ | READ | READ |

### 1.3 Git Operations

| Operation | Allowed Agents | Enforcement |
|-----------|---------------|-------------|
| `git add` | @dev, @dev-junior, @devops, @data-engineer, @ux-design-expert | Implicit with file write |
| `git commit` | @dev, @dev-junior, @devops | Build hook allows after task completion |
| `git push` | **@devops ONLY** | `agent-authority` hook BLOCKS all other agents |
| `git branch` (create) | @dev, @devops | Local branch management |
| `git merge` | **@devops ONLY** | `agent-authority` hook BLOCKS |
| `git rebase` | **@devops ONLY** | `agent-authority` hook BLOCKS |
| PR creation | **@devops ONLY** | `agent-authority` hook BLOCKS |
| PR merge | **@devops ONLY** | `agent-authority` hook BLOCKS |

---

## 2. Delegation Contracts

### 2.1 Who Delegates to Whom

```
@kord ──→ delegates to ANY agent (primary orchestrator)
  │
  ├─ /plan ──→ @plan takes over (PLANNING PHASE — blueprint only)
  │     │
  │     ├──→ @plan-analyzer (gap analysis, ambiguity detection)  ← plan-internal
  │     ├──→ @plan-reviewer (plan review, blocker finding)       ← plan-internal
  │     ├──→ @explore (codebase search for context)
  │     └──→ @librarian (docs search for context)
  │     NOTE: @plan does NOT delegate to @pm, @sm, @architect etc.
  │           Those are listed as EXECUTORS in the plan document.
  │
  ├─ /start-work ──→ @build takes over (EXECUTION PHASE — everything)
  │     │
  │     │  Doc generation (Wave 1 in development plans):
  │     ├──→ @pm (PRD creation)
  │     ├──→ @architect (architecture design)
  │     ├──→ @sm (story creation)
  │     ├──→ @analyst (deep research)
  │     │
  │     │  Implementation (Wave 2+ in development plans):
  │     ├──→ @dev (complex story/task — reserved for multi-file, deep work)
  │     ├──→ @dev-junior (atomic story/task — DEFAULT, story-aware, preferred)
  │     ├──→ @data-engineer (database tasks)
  │     ├──→ @ux-design-expert (design tasks)
  │     │
  │     │  Quality & Delivery:
  │     ├──→ @qa (quality gate review)
  │     ├──→ @devops (push/PR — EXCLUSIVE push authority)
  │     └──→ @po (checkpoint decisions between waves)
  │
  └─ Direct chat ──→ @kord handles OR delegates
        │
        ├──→ @dev (implementation)
        ├──→ @architect (consultation)
        ├──→ @analyst (research)
        ├──→ @explore (search)
        ├──→ @librarian (docs)
        └──→ @vision (image/PDF analysis)
```

### 2.2 Delegation Rules (enforced by build hook + delegate-task tool)

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Orchestrator never writes code** | @build MUST delegate all file modifications | Build hook `tool.execute.before` blocks write/edit tools |
| **Planner never writes code** | @plan MUST delegate all file modifications (except docs/kord/) | Plan-md-only hook blocks non-.md writes |
| **One task at a time** | @build delegates ONE work item, waits for completion | Build hook `SINGLE_TASK_DIRECTIVE` |
| **Executor from plan** | If work item has `executor:` field, @build MUST use that agent | `executor-resolver` hook injects executor |
| **Quality gate differs from executor** | `quality_gate != executor` ALWAYS | Enforced in plan validation |
| **DevOps exclusive push** | Only @devops can run `git push`, create PRs | `agent-authority` hook |
| **Retry before skip** | Failed tasks get max 3 retries with same session_id | Build hook retry logic |

### 2.3 Delegation Input Contract

When @build delegates to an executor, the task() call MUST include:

```typescript
task({
  // REQUIRED
  prompt: string,          // 6-section structured prompt (CONTEXT, MUST DO, MUST NOT, EXPECTED OUTPUT, VERIFY, FILES)
  category: string,        // Model routing category

  // CONDITIONAL (story-driven)
  load_skills?: string[],  // Skills to inject (e.g., ["develop-story", "git-master"])
  
  // NEW - from orchestration model
  executor?: string,       // Named agent (from plan executor field)
  story_path?: string,     // Path to story file (if story type)
})
```

### 2.4 Delegation Output Contract

Executor returns to @build:

```
SUCCESS:
  - Files modified (list)
  - Tests passed/failed
  - Story checkboxes updated
  - session_id (for potential retry)

FAILURE:
  - Error description
  - session_id (for retry with context)
  - Attempted approaches

BLOCKED:
  - Blocking reason
  - Required resolution
  - session_id (for resume after resolution)
```

---

## 3. Handoff Rules — Story Lifecycle

### 3.1 Story State Machine

```
DRAFT → READY → IN_PROGRESS → REVIEW → DONE
  │                                │       │
  └──── BLOCKED ◄─────────────────┘       │
                                           │
  ABORTED ◄────────────────────────────────┘
```

| Transition | Triggered By | Condition |
|-----------|-------------|-----------|
| DRAFT → READY | @sm (creates) or @po (approves) | Story has: title, acceptance criteria, tasks, executor, quality_gate |
| READY → IN_PROGRESS | @build (assigns to executor) | Executor acknowledged, session started |
| IN_PROGRESS → REVIEW | @dev (completes all tasks) | All task checkboxes checked, DoD checklist passed |
| IN_PROGRESS → BLOCKED | @dev (encounters blocker) | 3 failures on same item, missing dependency, ambiguous requirement |
| REVIEW → DONE | @qa (approves) | Quality gate: APPROVED |
| REVIEW → IN_PROGRESS | @qa (rejects) | Quality gate: NEEDS_WORK (max 2 iterations) |
| REVIEW → ABORTED | @qa (fails) | Quality gate: REJECT (critical issue) |
| BLOCKED → IN_PROGRESS | @po (resolves blocker) | Blocker resolved, user provided input |

### 3.2 Handoff Data Between Agents

#### @sm → @dev Handoff (story created → implementation starts)

```
@sm provides:
  - Story file at docs/kord/plans/{name}/stories/{id}.md
  - Contains: acceptance criteria, tasks, technical notes, dependencies
  
@dev receives (via @build delegation):
  - Story path
  - develop-story skill loaded
  - Notepad path for writing learnings
  - Plan context (accumulated from previous stories)
```

#### @dev → @qa Handoff (implementation done → quality review)

```
@dev provides (via story_update tool):
  - All task checkboxes marked
  - File List section updated
  - Change Log section updated
  - Dev Notes with implementation decisions
  - DoD checklist passed
  - Story status: "REVIEW"

@qa receives (via @build delegation):
  - Story path (reads full story with dev's updates)
  - qa-review-story skill loaded
  - Access to source code (read-only)
  - Access to test results
```

#### @qa → @devops Handoff (review approved → push)

```
@qa provides:
  - Review verdict: APPROVED
  - Review notes (appended to story)
  - Story status: "DONE"

@devops receives (via @build delegation):
  - Story/branch info
  - Push instructions
  - PR template
```

#### @build → @po Handoff (wave complete → checkpoint)

```
@build provides:
  - Wave number completed
  - Items completed in wave (list)
  - Items failed/blocked (if any)
  - Accumulated context summary
  - Next wave preview

@po returns:
  - Decision: GO / PAUSE / REVIEW / ABORT
  - Optional: feedback notes
```

---

## 4. Agent Internal Notes (Drafts & Observations)

### 4.1 Note-Taking Permissions

| Agent | Can Write Notes | Location | Purpose |
|-------|----------------|----------|---------|
| @dev, @dev-junior | ✅ | `docs/kord/notepads/{plan}/` | Learnings, issues, decisions, problems |
| @plan | ✅ | `docs/kord/plans/{name}/drafts/` | Interview notes, research summaries |
| @build | ✅ | `docs/kord/runs/{plan}/` | Execution logs, wave reports |
| @qa | ✅ | `docs/kord/plans/{name}/reviews/` | Review findings, quality metrics |
| @analyst | ✅ | `docs/kord/plans/{name}/research/` | Research findings |
| @architect | ✅ | `docs/kord/adrs/` | Architecture Decision Records |
| All others | ❌ | — | Return results via tool output only |

### 4.2 Note-Taking Rules

| Rule | Description |
|------|-------------|
| **Append-only** | Notes are APPENDED, never overwritten |
| **Plan files are sacred** | No agent except @build marks checkboxes in plan files |
| **Story files via tool** | @dev uses `story_update` tool, never direct file edit for story metadata |
| **Notepad is shared** | All subagents working on same plan share the notepad |
| **Notepad is read before delegation** | @build reads notepad content and injects into delegation prompt |
| **No cross-plan notes** | Each plan has its own notepad directory |

---

## 5. Constitutional Gates — Enforcement Map

| Article | Gate Type | Enforced By | When Active |
|---------|-----------|-------------|-------------|
| I — CLI First | WARN | @dev system prompt | Always during development |
| II — Agent Authority | HARD BLOCK | `agent-authority` hook | Always |
| III — Story-Driven Dev | SOFT BLOCK | `story-lifecycle` hook | Only in story-driven mode |
| IV — No Invention | WARN | Agent system prompts (@sm, @dev) | Always |
| V — Quality First | HARD BLOCK | `quality-gate` hook | When quality_gate specified |
| VI — Absolute Imports | WARN | @dev system prompt | Always during development |

**HARD BLOCK**: Operation is prevented. Agent receives error message.
**SOFT BLOCK**: Warning injected, agent can proceed but is reminded.
**WARN**: Advisory message, no blocking.

### 5.1 When Story-Driven Mode Is Active

Story-driven mode activates when:
1. @build is executing a plan with `plan_type: "development"`
2. Current work item is a story (has `story_path`)
3. `story-lifecycle` hook detects story context in boulder state

When story-driven mode is NOT active (task-based plans, generic squads), Article III gates are dormant. This allows marketing, legal, and other squads to work without story overhead.

---

## 6. Error Handling & Recovery Contracts

### 6.1 Task Failure Chain

```
Task fails
  │
  ├─ Attempt 1: @build retries with same session_id (preserves context)
  ├─ Attempt 2: @build retries with failure feedback injected
  ├─ Attempt 3: @build retries with extended context (notepad + previous errors)
  │
  └─ After 3 failures:
       ├─ If story: mark story BLOCKED, document reason, continue to next item
       ├─ If task: document failure, continue to next item
       └─ @build writes failure report to docs/kord/runs/{plan}/
```

### 6.2 Quality Gate Failure Chain

```
Quality gate: NEEDS_WORK
  │
  ├─ Iteration 1: @build delegates back to executor with QA feedback
  ├─ Iteration 2: @build delegates back with accumulated feedback
  │
  └─ After 2 NEEDS_WORK iterations:
       ├─ Escalate to user (inject checkpoint)
       └─ Document in story review section
```

### 6.3 Crash Recovery

```
Session crashes / context window overflow
  │
  ├─ Boulder state persists: active plan, current wave, current item
  ├─ User re-invokes /start-work {plan-name}
  ├─ @build reads boulder state
  ├─ Detects in-progress item → resume from last checkpoint
  └─ Reads notepad for accumulated context
```

---

## 7. Squad-Specific Contracts

### 7.1 Default Dev Squad

```yaml
# Built-in, no SQUAD.yaml needed
agents: [dev, dev-junior, qa, architect, devops, data-engineer, ux-design-expert]
plan_type: development
checkpoint_mode: interactive
quality_gates: true
story_driven: true
```

### 7.2 Custom Squad Contract

```yaml
# .opencode/squads/marketing/SQUAD.yaml
name: marketing
description: "Marketing campaign execution"
agents:
  - pm            # Campaign strategy
  - analyst       # Market research
plan_type: task   # No stories, just tasks
checkpoint_mode: auto  # No wave checkpoints
quality_gates: false   # No QA gates
story_driven: false    # No story lifecycle
plan_template: |
  # Campaign Plan: {{title}}
  ## Tasks
  {{tasks}}
verification:
  type: file_exists    # Verify output files exist
```

### 7.3 Squad Override Rules

| Squad Setting | Overrides | Default |
|--------------|-----------|---------|
| `plan_type` | How @plan generates output | `development` |
| `checkpoint_mode` | Whether @po checkpoints happen | `interactive` |
| `quality_gates` | Whether @qa reviews | `true` |
| `story_driven` | Whether story lifecycle hooks activate | `true` |
| `plan_template` | @plan output format | Built-in dev template |
| `verification.type` | How @build verifies completion | `lsp_build_test` |

---

## 8. Summary — Contract Enforcement Layers

```
Layer 1: Agent System Prompts
  └─ Behavioral rules (what to do, what not to do)
  └─ Communication style
  └─ Core principles

Layer 2: Hook Enforcement
  └─ agent-authority hook (file permissions, git permissions)
  └─ story-lifecycle hook (story-driven rules)
  └─ quality-gate hook (review gates)
  └─ wave-checkpoint hook (human decisions)
  └─ build hook (orchestrator never writes code)
  └─ plan-md-only hook (planner never writes code)

Layer 3: Tool Constraints
  └─ story_read / story_update (structured story access)
  └─ plan_read (structured plan access)
  └─ delegate-task (executor routing)
  └─ Tool restrictions per agent (createAgentToolRestrictions)

Layer 4: File System Structure
  └─ docs/kord/ directory hierarchy (who writes where)
  └─ .kord/ templates and checklists (methodology files)
  └─ Source code (only implementers write)
```
