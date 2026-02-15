> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Synkra AIOS Story-Driven Flow — Complete Orchestration Analysis

> **Source**: `D:\dev\synkra-aios\.aios-core` (Synkra AIOS framework)
> **Date**: 2026-02-11
> **Purpose**: Deep study of the AIOS story-driven methodology, agent roles, orchestration, scripts, templates, workflows, and documentation conventions — to inform Kord AIOS reorganization.

---

## 1. Architecture Overview

Synkra AIOS is a **methodology-driven framework** living entirely in `.aios-core/` (~983 files). Unlike OMOC (which is a compiled plugin), AIOS is a **collection of markdown agent definitions, JavaScript orchestration scripts, YAML workflows, task definitions, templates, and checklists** that agents load at runtime.

### Directory Structure

```
.aios-core/
├── core/                          # Runtime orchestration engine
│   ├── orchestration/             # 32 JS modules — the execution engine
│   ├── config/                    # Config resolution, cache, migration
│   ├── elicitation/               # Interactive requirement gathering
│   ├── execution/                 # Build loops, parallel execution, wave execution
│   ├── memory/                    # Gotchas, file evolution, timeline, snapshots
│   ├── quality-gates/             # 3-layer quality gate system
│   ├── registry/                  # Service registry (161KB JSON)
│   ├── session/                   # Context detection, session loading
│   ├── mcp/                       # MCP config management
│   ├── ui/                        # Observability panel
│   ├── events/                    # Dashboard emitter
│   └── utils/                     # Shared utilities
├── development/                   # Agent definitions + methodology
│   ├── agents/                    # 12 agent .md files (source of truth)
│   ├── tasks/                     # 200+ task .md files (executable workflows)
│   ├── workflows/                 # 15 YAML workflow definitions
│   ├── templates/                 # Document templates + subagent prompts
│   ├── scripts/                   # 60+ JS scripts (greeting, validation, etc.)
│   ├── checklists/                # Agent quality gate, self-critique
│   ├── data/                      # Decision heuristics, quality dimensions
│   └── agent-teams/               # Team bundles (fullstack, qa-focused, etc.)
├── product/                       # Product methodology
│   ├── checklists/                # 16 checklists (PM, PO, architect, story DoD, etc.)
│   ├── templates/                 # 70+ templates (PRD, story, epic, SQL, etc.)
│   └── data/                      # 16 best-practice guides
├── schemas/                       # JSON schemas for agent-v3, task-v3, squad
├── scripts/                       # Legacy/utility scripts
├── hooks/                         # Git hooks (pre-push, post-commit)
├── infrastructure/                # Integrations, tools
├── constitution.md                # 6 non-negotiable principles
├── core-config.yaml               # Project-level configuration
├── framework-config.yaml          # Framework-level configuration
├── project-config.yaml            # Project detection config
└── user-guide.md                  # 38KB user guide
```

---

## 2. Constitution — Non-Negotiable Principles

The AIOS constitution (`constitution.md`) defines 6 inviolable rules:

| # | Principle | Enforcement |
|---|-----------|-------------|
| I | **CLI First** | WARN gate in dev-develop-story if UI before CLI |
| II | **Agent Authority** | Only @devops pushes, only @sm/@po create stories, etc. |
| III | **Story-Driven Development** | BLOCK gate — no code without a story |
| IV | **No Invention** | BLOCK — specs only derive from requirements |
| V | **Quality First** | BLOCK — lint, typecheck, test, build must pass |
| VI | **Absolute Imports** | SHOULD — prefer `@/` over `../../../` |

**Article III is the most critical for our study**: "No code is written without a story associated. Stories MUST have acceptance criteria. Progress tracked via checkboxes."

---

## 3. Agent System (`.aios-core/development/agents/`)

### 3.1 Agent Roster (12 agents)

| Agent | Persona | Role | Key Authority |
|-------|---------|------|---------------|
| **aios-master** (Orion) | Orchestrator | Master orchestrator & framework developer | Universal executor, workflow orchestration |
| **pm** (Morgan) | Strategist | Product Manager | PRD creation, epic creation, execute-epic |
| **po** (Sarah/Pax) | Guardian | Product Owner | Backlog management, story validation, acceptance criteria |
| **sm** (River) | Facilitator | Scrum Master | Story creation from epics, sprint planning, local branches |
| **dev** (Dex) | Builder | Full Stack Developer | Code implementation, TDD, story development |
| **architect** (Aria) | Visionary | Technical Architect | System design, tech decisions, architecture docs |
| **qa** (Quinn) | Guardian | Quality Assurance | Testing strategy, story validation, quality gates |
| **devops** (Gage) | Operator | DevOps Specialist | **ONLY** agent that pushes, creates PRs, releases |
| **data-engineer** (Dara) | Specialist | Database Architect | Schema, RLS, migrations, query optimization |
| **analyst** (Atlas) | Researcher | Business Analyst | Requirements analysis, market research |
| **ux-design-expert** (Uma) | Designer | UX Designer | User experience, interface design |
| **squad-creator** | Builder | Squad Creator | Creates new squad configurations |

### 3.2 Agent Definition Format

Each agent `.md` file contains a **complete YAML block** with:

```yaml
activation-instructions:  # Steps to activate agent persona
agent:                    # name, id, title, icon, whenToUse
persona_profile:          # archetype, zodiac, communication style
persona:                  # role, identity, core_principles
commands:                 # Available * commands with visibility levels
dependencies:             # tasks, templates, checklists, scripts, tools
orchestration_constraints: # (PM only) NEVER_EMULATE_AGENTS rule
develop-story:            # (dev only) order-of-execution, story-file-updates
```

### 3.3 Agent Activation Pipeline

All agents activate via `unified-activation-pipeline.js` (23584 bytes):
1. Load config, session, project status, git config, permissions **in parallel**
2. Detect session type and workflow state **sequentially**
3. Build greeting via `GreetingBuilder` (50229 bytes — the largest single file)
4. Filter commands by visibility metadata (full/quick/key)
5. Suggest workflow next steps if in recurring pattern
6. Display greeting → HALT and await user input

### 3.4 Agent Collaboration Protocol

```
PM creates epics → delegates story creation to SM
SM creates stories → dev implements → QA validates → DevOps pushes
PO validates stories, manages backlog
Architect makes tech decisions
Analyst provides research
```

Key delegation rules:
- **PM → SM**: Story creation (`*draft`)
- **PM → Analyst**: Deep research (`*research`)
- **PM → aios-master**: Course correction (`*correct-course`)
- **Story execution**: Dynamic executor assignment (keyword-based)

---

## 4. Orchestration Engine (`.aios-core/core/orchestration/`, 32 modules)

### 4.1 Bob Orchestrator (`bob-orchestrator.js`, 35841 bytes)

The **main decision tree entry point** for the PM agent in "bob" mode:

```
BobOrchestrator detects project state:
  NO_CONFIG → setup flow
  EXISTING_NO_DOCS → brownfield discovery
  EXISTING_WITH_DOCS → brownfield handler
  GREENFIELD → greenfield handler

Integrates all Epic 11 modules:
  ExecutorAssignment (11.1) → agent selection
  TerminalSpawner (11.2)   → agent spawning
  WorkflowExecutor (11.3)  → development cycle
  SurfaceChecker (11.4)    → human decision criteria
  SessionState (11.5)      → session persistence
```

### 4.2 Executor Assignment (`executor-assignment.js`, 11365 bytes)

**DETERMINISTIC** (no AI) — keyword matching against story content:

| Work Type | Keywords | Executor | Quality Gate |
|-----------|----------|----------|--------------|
| Code/Features | feature, logic, handler, service, api | @dev | @architect |
| Database | schema, table, migration, rls, query | @data-engineer | @dev |
| Infrastructure | ci/cd, deploy, docker, pipeline | @devops | @architect |
| Design/UI | component, ui, design, interface | @ux-design-expert | @dev |
| Research | research, investigate, analyze, poc | @analyst | @pm |
| Architecture | architecture, design_decision, pattern | @architect | @pm |

**Critical rule**: `executor != quality_gate` (ALWAYS different agents)

### 4.3 Terminal Spawner (`terminal-spawner.js`, 31469 bytes)

Spawns agents in **separate terminals** for clean context isolation:
- Detects environment (native terminal, VS Code, SSH, Docker, CI)
- Creates context file with story, relevant files, instructions
- Polls for agent completion (500ms interval, 5min default timeout)
- Supports retry (3 max) with exponential backoff

### 4.4 Workflow Executor (`workflow-executor.js`, 36350 bytes)

Executes the **development cycle** (the inner loop per story):

```
Phase 1: Story Validation (@po) → validate story has executor, quality_gate
Phase 2: Development (${story.executor}) → dynamic agent develops in terminal
Phase 3: Self-Healing (@dev) → CodeRabbit CRITICAL fix loop (max 3 iterations)
Phase 4: Quality Gate (${story.quality_gate}) → different agent reviews
Phase 5: Push (@devops) → push branch, create PR
Phase 6: Checkpoint (@po) → human decision: GO/PAUSE/REVIEW/ABORT
```

### 4.5 Workflow Orchestrator (`workflow-orchestrator.js`, 26902 bytes)

Multi-agent workflow execution with real subagent dispatching:
- Loads workflow YAML definitions
- SubagentPromptBuilder loads REAL task files (not generic prompts)
- ParallelExecutor for concurrent phase execution
- ChecklistRunner for validation checklists
- TechStackDetector for pre-flight detection
- SkillDispatcher for skill-based routing

### 4.6 Master Orchestrator (`master-orchestrator.js`, 54417 bytes)

Central orchestrator for the **Autonomous Development Engine (ADE)**:
- State machine: INITIALIZED → READY → IN_PROGRESS → BLOCKED → COMPLETE
- Executes Epics 3→4→5→6 in pipeline
- Integrates TechStackDetector, RecoveryHandler, GateEvaluator, AgentInvoker
- Dashboard integration for observability

### 4.7 Session State (`session-state.js`, 24732 bytes)

Persistent session state for crash recovery and resume:
- Stored in `docs/stories/.session-state.yaml`
- Tracks: current phase, current story, executor, quality gate, attempt count
- Action types: GO, PAUSE, REVIEW, ABORT, PHASE_CHANGE, STORY_STARTED, etc.
- Resume options: continue, review, restart, discard

### 4.8 Epic Context Accumulator (`epic-context-accumulator.js`, 12310 bytes)

Progressive summarization with token control for Story N validation:
- Token limit: 8000 tokens
- Compression levels: FULL_DETAIL (last 3), METADATA_PLUS_FILES (4-6), METADATA_ONLY (older)
- Builds inverted file index from completed stories

### 4.9 Subagent Prompt Builder (`subagent-prompt-builder.js`, 11255 bytes)

Assembles prompts from **REAL task files** (not generic prompts):
1. Load complete agent definition (`.md` file)
2. Load complete task definition (`.md` file)
3. Extract and load referenced checklists
4. Extract and load referenced templates
5. Build context section from previous phases
6. Assemble complete prompt

---

## 5. Workflow System (`.aios-core/development/workflows/`, 15 files)

### 5.1 Core Workflows

| Workflow | Purpose |
|----------|---------|
| `development-cycle.yaml` | Per-story cycle: PO validate → Dev → Self-heal → QA → Push → Checkpoint |
| `epic-orchestration.yaml` | Wave-based parallel epic execution using development-cycle |
| `story-development-cycle.yaml` | Alternative story development flow |
| `brownfield-fullstack.yaml` | Brownfield full-stack development workflow |
| `brownfield-service.yaml` | Brownfield service development |
| `brownfield-ui.yaml` | Brownfield UI development |
| `brownfield-discovery.yaml` | Brownfield project discovery |
| `greenfield-fullstack.yaml` | Greenfield full-stack development |
| `greenfield-service.yaml` | Greenfield service development |
| `greenfield-ui.yaml` | Greenfield UI development |
| `design-system-build-quality.yaml` | Design system quality workflow |
| `qa-loop.yaml` | QA review loop |
| `spec-pipeline.yaml` | Specification pipeline |
| `auto-worktree.yaml` | Automatic git worktree management |

### 5.2 Development Cycle (Inner Loop)

```yaml
phases:
  1_validation:    agent=@po, task=validate-story-draft
  2_development:   agent=${story.executor}, spawn_in_terminal=true
  3_self_healing:  agent=@dev, conditional on CodeRabbit enabled
  4_quality_gate:  agent=${story.quality_gate}, agent != executor
  5_push:          agent=@devops
  6_checkpoint:    agent=@po, human decision (GO/PAUSE/REVIEW/ABORT)
```

### 5.3 Epic Orchestration (Outer Loop)

```
WAVE N:
  Story A ──→ development-cycle ──→ branch pushed  ┐
  Story B ──→ development-cycle ──→ branch pushed  ├── PARALLEL
  Story C ──→ development-cycle ──→ branch pushed  ┘
  ──→ WAVE GATE (integration review) ──→ merge

Config:
  maxConcurrency: 4
  worktreeIsolation: true
  storyTimeout: 2 hours
  gatePolicy: strict
  checkpoint_mode:
    in_wave: auto_go
    between_waves: interactive
```

---

## 6. Task System (`.aios-core/development/tasks/`, 200+ files)

### 6.1 Task Format (AIOS Task Format V1.0)

Each task `.md` file contains:
```yaml
task: functionName()
responsável: Agent Name
responsavel_type: Agente
atomic_layer: Organism | Orchestration

Entrada:    # Input parameters with types, validation
Saída:      # Output parameters with destinations (File, Memory, Return)

pre-conditions:       # Blocking prerequisites
post-conditions:      # Success validation
acceptance-criteria:  # Pass/fail criteria

tools:     # External tools used
scripts:   # Agent-specific JS scripts
error-handling: # Strategy (abort, retry, etc.)
performance: # Duration, cost, token estimates
metadata:  # Story ref, version, dependencies, tags
```

### 6.2 Key Story-Driven Tasks

| Task | Agent | Purpose |
|------|-------|---------|
| `brownfield-create-epic.md` | @pm | Create brownfield epic (1-3 stories) |
| `execute-epic-plan.md` | @pm | Orchestrate wave-based epic execution |
| `sm-create-next-story.md` | @sm | Create next story from epic |
| `create-next-story.md` | @sm | Create detailed story |
| `brownfield-create-story.md` | @sm | Create brownfield story |
| `dev-develop-story.md` | @dev | Develop story (yolo/interactive/preflight modes) |
| `plan-execute-subtask.md` | @dev | 13-step Coder Agent workflow for subtask |
| `validate-next-story.md` | @qa | Validate story before execution |
| `dev-validate-next-story.md` | @dev | Dev validates next story |
| `qa-review-story.md` | @qa | QA reviews completed story |
| `po-close-story.md` | @po | Close completed story |
| `po-manage-story-backlog.md` | @po | Manage story backlog |
| `story-checkpoint.md` | @po | Human decision checkpoint between stories |
| `create-doc.md` | @pm | Create product documentation |
| `execute-checklist.md` | (any) | Execute a checklist |

### 6.3 Constitutional Gates in Tasks

`dev-develop-story.md` enforces constitutional gates:
- **Gate 1 (Article III)**: Story file MUST exist, MUST NOT be draft, MUST have acceptance criteria
- **Gate 2 (Article I)**: CLI implementation SHOULD exist before UI (WARN)

### 6.4 Execution Modes

Every task supports 3 modes:
- **YOLO**: Autonomous, 0-1 prompts, autonomous decisions with logging
- **Interactive** (default): 5-10 prompts, explicit checkpoints, educational
- **Pre-Flight**: Comprehensive upfront planning, zero ambiguity

---

## 7. Scripts System (`.aios-core/development/scripts/`, 60+ files)

### 7.1 Activation & Greeting
| Script | Size | Purpose |
|--------|------|---------|
| `unified-activation-pipeline.js` | 23KB | Agent activation orchestration |
| `greeting-builder.js` | 50KB | Adaptive greeting generation |
| `agent-config-loader.js` | 18KB | Agent configuration loading |
| `dev-context-loader.js` | 8KB | Dev agent context loading |

### 7.2 Story & Workflow Management
| Script | Size | Purpose |
|--------|------|---------|
| `story-manager.js` | 12KB | Story CRUD operations |
| `story-index-generator.js` | 10KB | Story index generation |
| `story-update-hook.js` | 7KB | Story update event handling |
| `workflow-state-manager.js` | 16KB | Workflow state persistence |
| `workflow-navigator.js` | 10KB | Workflow navigation |
| `workflow-validator.js` | 23KB | Workflow YAML validation |

### 7.3 Code Quality & Analysis
| Script | Size | Purpose |
|--------|------|---------|
| `code-quality-improver.js` | 40KB | Code quality improvement |
| `refactoring-suggester.js` | 35KB | Refactoring suggestions |
| `pattern-learner.js` | 35KB | Pattern learning from codebase |
| `performance-analyzer.js` | 23KB | Performance analysis |
| `test-generator.js` | 25KB | Test generation |
| `dependency-analyzer.js` | 18KB | Dependency analysis |
| `security-checker.js` | 10KB | Security checking |

### 7.4 Decision & Tracking
| Script | Size | Purpose |
|--------|------|---------|
| `decision-recorder.js` | 5KB | Decision logging |
| `decision-log-generator.js` | 8KB | Decision log generation |
| `decision-log-indexer.js` | 9KB | Decision log indexing |
| `metrics-tracker.js` | 22KB | Metrics tracking |
| `usage-tracker.js` | 19KB | Usage tracking |
| `version-tracker.js` | 16KB | Version tracking |

### 7.5 Infrastructure
| Script | Size | Purpose |
|--------|------|---------|
| `commit-message-generator.js` | 25KB | Commit message generation |
| `branch-manager.js` | 12KB | Branch management |
| `git-wrapper.js` | 12KB | Git operations wrapper |
| `conflict-resolver.js` | 19KB | Merge conflict resolution |
| `diff-generator.js` | 11KB | Diff generation |
| `backup-manager.js` | 17KB | Backup management |
| `rollback-handler.js` | 17KB | Rollback handling |

---

## 8. Template System (`.aios-core/product/templates/`, 70+ files)

### 8.1 Document Templates
- `prd-tmpl.yaml` / `brownfield-prd-tmpl.yaml` — Product requirements
- `architecture-tmpl.yaml` / `brownfield-architecture-tmpl.yaml` — Architecture docs
- `story-tmpl.yaml` / `design-story-tmpl.yaml` — Story templates
- `epic.hbs` / `story.hbs` / `task.hbs` — Handlebars templates
- `spec-tmpl.md` — Specification template

### 8.2 Database Templates
- `schema-design-tmpl.yaml` — Schema design
- `migration-plan-tmpl.yaml` / `migration-strategy-tmpl.md` — Migration planning
- `rls-policies-tmpl.yaml` — Row Level Security
- SQL templates: `tmpl-migration-script.sql`, `tmpl-rls-*.sql`, `tmpl-seed-data.sql`, etc.

### 8.3 Agent/Task Templates
- `agent-template.yaml` — New agent creation
- `personalized-task-template-v2.md` (24KB) — Task creation template
- `personalized-workflow-template.yaml` — Workflow creation template
- `subagent-step-prompt.md` — Subagent prompt template

### 8.4 Quality Templates
- `qa-gate-tmpl.yaml` / `qa-report-tmpl.md` — QA gates and reports
- `self-critique-checklist.md` — Self-review checklist

---

## 9. Checklist System

### 9.1 Product Checklists (`.aios-core/product/checklists/`, 16 files)
- `pm-checklist.md` (13KB) — PM quality checklist
- `po-master-checklist.md` (17KB) — PO master checklist
- `architect-checklist.md` (19KB) — Architecture checklist
- `story-dod-checklist.md` (5KB) — Story definition of done
- `story-draft-checklist.md` (8KB) — Story draft quality
- `change-checklist.md` (8KB) — Change management
- `pre-push-checklist.md` (3KB) — Pre-push validation
- `release-checklist.md` (4KB) — Release process
- `database-design-checklist.md` / `dba-predeploy-checklist.md` / `dba-rollback-checklist.md`
- `migration-readiness-checklist.md` / `pattern-audit-checklist.md`
- `component-quality-checklist.md` / `accessibility-wcag-checklist.md`

### 9.2 Development Checklists (`.aios-core/development/checklists/`, 2 files)
- `agent-quality-gate.md` (16KB) — Agent quality gate checklist
- `self-critique-checklist.md` (9KB) — Self-critique for dev agents

---

## 10. Quality Gate System (`.aios-core/core/quality-gates/`)

3-layer quality gate system:

| Layer | File | Purpose |
|-------|------|---------|
| Layer 1 | `layer1-precommit.js` (9KB) | Pre-commit checks (lint, test, CodeRabbit) |
| Layer 2 | `layer2-pr-automation.js` (9KB) | PR automation checks |
| Layer 3 | `layer3-human-review.js` (10KB) | Human review orchestration |

Supporting:
- `quality-gate-manager.js` (18KB) — Gate orchestration
- `checklist-generator.js` (9KB) — Dynamic checklist generation
- `focus-area-recommender.js` (11KB) — Review focus areas
- `notification-manager.js` (16KB) — Quality notifications
- `quality-gate-config.yaml` — Gate configuration

---

## 11. Memory System (`.aios-core/core/memory/`)

| Module | Size | Purpose |
|--------|------|---------|
| `gotchas-memory.js` | 33KB | Learn from mistakes, auto-capture patterns |
| `file-evolution-tracker.js` | 31KB | Track file changes over time |
| `context-snapshot.js` | 20KB | Snapshot project context |
| `timeline-manager.js` | 24KB | Timeline of events and actions |

---

## 12. Execution Engine (`.aios-core/core/execution/`)

| Module | Size | Purpose |
|--------|------|---------|
| `autonomous-build-loop.js` | 34KB | Coder Agent loop with retries |
| `build-orchestrator.js` | 32KB | Complete build pipeline orchestration |
| `build-state-manager.js` | 49KB | Build state and checkpoints |
| `semantic-merge-engine.js` | 52KB | Semantic merge for parallel branches |
| `subagent-dispatcher.js` | 26KB | Dispatch work to subagents |
| `context-injector.js` | 15KB | Inject context into agents |
| `wave-executor.js` | 11KB | Execute waves of parallel stories |
| `parallel-executor.js` | 8KB | Parallel task execution |
| `parallel-monitor.js` | 12KB | Monitor parallel execution |
| `result-aggregator.js` | 15KB | Aggregate results from parallel tasks |
| `rate-limit-manager.js` | 9KB | Rate limiting for API calls |

---

## 13. Configuration System

### 13.1 Core Config (`core-config.yaml`)
Key settings:
- `user_profile`: `bob` (orchestrated) or `advanced` (standalone agents)
- `devStoryLocation`: `docs/stories` — where stories live
- `devLoadAlwaysFiles`: files dev agent always loads
- `prdShardedLocation` / `architectureShardedLocation`: document locations
- `toolsLocation`: `.aios-core/tools`
- `scriptsLocation`: paths to scripts in core/development/infrastructure
- `mcp`: MCP configuration with Docker gateway
- `decisionLogging`: enabled, async, ADR format

### 13.2 Config Resolution (`core/config/config-resolver.js`, 19KB)
Multi-level config resolution with:
- Environment variable interpolation (`${VAR}`)
- Config caching
- Migration from older versions
- Merge utilities

---

## 14. Story-Driven User Flow — End-to-End

### 14.1 Epic Creation Flow
```
User activates @pm (Morgan)
  → PM interviews user about product requirements
  → PM creates PRD via *create-prd (uses prd-tmpl.yaml)
  → PM creates epic via *create-epic (uses brownfield-create-epic.md task)
  → Epic includes: stories with executor assignment, quality gates
  → PM generates EXECUTION.yaml with wave structure
  → PM delegates story creation to @sm (River)
```

### 14.2 Story Creation Flow
```
@sm (River) receives epic context
  → SM creates stories via *draft (uses create-next-story.md task)
  → Each story includes:
    - YAML frontmatter: executor, quality_gate, quality_gate_tools
    - Acceptance criteria with checkboxes
    - Dev Notes, Testing sections
    - File List
    - Change Log
  → Story saved to docs/stories/{storyId}/story.yaml
  → Story validated via story-draft-checklist.md
```

### 14.3 Story Execution Flow (Development Cycle)
```
@pm *execute-epic {EXECUTION.yaml}
  → Parse execution plan, validate references
  → For each wave:
    → For each story in wave (PARALLEL):
      Phase 1: @po validates story (validate-story-draft)
      Phase 2: ${executor} develops (TerminalSpawner → clean context)
        → Dev reads story, implements tasks sequentially
        → Dev writes tests, runs validations
        → Dev updates checkboxes, File List, Change Log
        → Dev runs story-dod-checklist before completion
      Phase 3: @dev self-healing (CodeRabbit CRITICAL fixes)
      Phase 4: ${quality_gate} reviews (ALWAYS different agent)
      Phase 5: @devops pushes branch, creates PR
      Phase 6: @po checkpoint — GO/PAUSE/REVIEW/ABORT
    → Wave Gate: integration review across stories
    → @devops merges wave branches
  → Final gate: epic-level sign-off
```

### 14.4 Dev Agent Story Development
```
@dev *develop {story-id} [mode]

Order of execution:
  1. Read (first or next) task
  2. Implement task and subtasks
  3. Write tests
  4. Execute validations
  5. Only if ALL pass → update checkbox [x]
  6. Update File List section
  7. Repeat until all tasks complete
  8. Run story-dod-checklist
  9. Self-healing (CodeRabbit) if enabled
  10. Set status: "Ready for Review"
  11. HALT

Blocking conditions:
  - Unapproved dependencies needed
  - Ambiguous after story check
  - 3 failures on same thing
  - Missing config
  - Failing regression
```

---

## 15. Documentation Conventions

### 15.1 Where Agents Write

| Agent | Writes To | What |
|-------|-----------|------|
| @pm | `docs/prd/`, `docs/stories/epics/` | PRDs, epic plans, EXECUTION.yaml |
| @sm | `docs/stories/{storyId}/` | Story files (story.yaml) |
| @dev | Source code files, story Dev Agent Record sections | Implementation, checkboxes, File List, Change Log |
| @architect | `docs/architecture/` | Architecture documents |
| @qa | `docs/qa/` | QA reports |
| @devops | Git operations | Branches, PRs, releases |
| @analyst | Research outputs | Market research, analysis |
| @po | Story management, backlog | Story status, acceptance validation |

### 15.2 Story File Structure
Stories live at `docs/stories/{storyId}/story.yaml` with sections:
- **Header**: Story ID, title, executor, quality_gate
- **Acceptance Criteria**: Checkboxes
- **Tasks/Subtasks**: Numbered with checkboxes
- **Dev Notes**: Implementation guidance
- **Testing**: Test strategy
- **Dev Agent Record**: Agent-writable sections (checkboxes, Debug Log, Completion Notes, Change Log, File List)
- **Status**: Draft → Ready → In Progress → Ready for Review → Done

### 15.3 Folder Creation Scripts
AIOS uses JS scripts for folder/file creation:
- `story-manager.js` — Story CRUD in `docs/stories/`
- `branch-manager.js` — Git branch creation
- `backup-manager.js` — Backup creation
- `build-state-manager.js` — Build state in `.aios/`

---

## 16. Agent Teams (`.aios-core/development/agent-teams/`)

Pre-configured team bundles:

| Team | Agents | Purpose |
|------|--------|---------|
| `team-all.yaml` | All 12 agents | Full team |
| `team-fullstack.yaml` | pm, sm, dev, architect, qa, devops | Full-stack development |
| `team-no-ui.yaml` | pm, sm, dev, architect, devops | Backend/service focused |
| `team-ide-minimal.yaml` | dev, pm | Minimal IDE setup |
| `team-qa-focused.yaml` | dev, qa, devops | Quality-focused with CodeRabbit integration |

---

## 17. Key Differences from OMOC Engine

| Aspect | OMOC | AIOS |
|--------|------|------|
| **Architecture** | Compiled TypeScript plugin | Runtime markdown + JS scripts |
| **Agent count** | 11 (Greek mythology names) | 12 (professional role names) |
| **Orchestration** | Atlas hook (event-driven, hooks) | BobOrchestrator (decision tree, JS) |
| **Delegation** | `task()` with category routing | TerminalSpawner with agent assignment |
| **Work unit** | Plan checkbox items | Stories with tasks/subtasks |
| **Planning** | Prometheus writes `.sisyphus/plans/*.md` | PM creates epics, SM creates stories |
| **State** | `.sisyphus/boulder.json` | `.session-state.yaml` + `.aios/` state files |
| **Context** | Notepad system (`.sisyphus/notepads/`) | Story file Dev Agent Record sections |
| **Quality** | Atlas verifies (lsp, build, test) | 3-layer quality gates + CodeRabbit |
| **Continuation** | 3-layer (atlas, todo enforcer, ralph) | Checkpoint decisions (GO/PAUSE/REVIEW/ABORT) |
| **Model routing** | Category-based (8 categories) | Executor assignment (keyword-based, 6 types) |
| **Scope control** | Notepad + 6-section prompt | Story acceptance criteria + constitutional gates |

---

## 18. Summary — What AIOS's Methodology Provides

| Capability | Implementation |
|-----------|----------------|
| **Story-Driven Development** | Constitution Article III, story files, acceptance criteria |
| **Epic Management** | PM creates epics, EXECUTION.yaml, wave-based execution |
| **Agent Authority** | Constitution Article II, executor assignment table |
| **Quality Gates** | 3-layer system (pre-commit, PR, human review) |
| **Session Persistence** | SessionState class, .session-state.yaml, crash recovery |
| **Context Accumulation** | EpicContextAccumulator with progressive summarization |
| **Decision Logging** | decision-recorder.js, ADR format, indexed |
| **Memory System** | Gotchas, file evolution, timeline, context snapshots |
| **Template System** | 70+ templates for all document types |
| **Checklist System** | 16+ checklists for quality assurance |
| **Parallel Execution** | Wave-based with worktree isolation |
| **Self-Healing** | CodeRabbit integration, max 3 iterations |
| **Elicitation** | Interactive requirement gathering engine |
