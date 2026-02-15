# Kord AIOS: Architectural Comparison (OMOC vs Synkra AIOS)

**Version:** 1.0
**Date:** 2026-02-08
**Purpose:** Module-by-module analysis of both systems to inform the Kord AIOS fusion

---

## Executive Summary

| Aspect | OMOC (Oh-My-OpenCode) | Synkra AIOS |
|--------|----------------------|-------------|
| **Primary Focus** | Execution engine (delegation, tools, hooks) | Methodology framework (story-driven, tasks, workflows) |
| **Runtime** | OpenCode plugin (TypeScript) | CLI + IDE config (Node.js) |
| **Agent Philosophy** | Greek mythology names, capability-focused | Role names (@dev, @qa), persona-focused |
| **Orchestration** | Background manager + continuation enforcers | Workflow orchestrator + quality gates |
| **Workspace** | `.sisyphus/`, `.opencode/` | `.aios-core/`, `docs/stories/` |
| **Commands** | `/commands` (slash) | `*commands` (star) + `@agent` |
| **Strengths** | Multi-model orchestration, LSP/AST tools, parallel delegation | Story-driven workflow, command authority, quality gates |

**Fusion Goal**: Keep OMOC as the **execution engine**, adopt Synkra AIOS as the **methodology framework**, rebrand to **Kord AIOS**.

---

## 1. Agent Systems Comparison

### 1.1 OMOC Agents (Current)

```
src/agents/
├── sisyphus.ts           # Main orchestrator (claude-opus-4-6)
├── atlas/                # Master orchestrator with todo list
├── prometheus/           # Strategic planner (interview mode)
├── hephaestus.ts         # Autonomous deep worker (gpt-5.3-codex)
├── oracle.ts             # Strategic advisor
├── librarian.ts          # Multi-repo research
├── explore.ts            # Fast contextual grep
├── multimodal-looker.ts  # PDF/image analysis
├── metis.ts              # Pre-planning analysis
├── momus.ts              # Plan reviewer
├── sisyphus-junior/      # Category-spawned executor
└── utils.ts              # Agent registry + fallback resolution
```

**Key Patterns:**
- Factory functions: `createXXXAgent(model)`
- Model fallback chains (e.g., claude-opus → kimi → gpt)
- Tool restrictions per agent
- Temperature settings (0.1 for code, 0.3 max)
- Prompt metadata with triggers and cost tier

### 1.2 Synkra AIOS Agents

```
.aios-core/development/agents/
├── dev.md                # Dex - Builder (code implementation)
├── qa.md                 # Quinn - Guardian (quality assurance)
├── architect.md          # Aria - Architect (system design)
├── pm.md                 # Kai - Balancer (product strategy)
├── po.md                 # Nova - Visionary (product backlog)
├── sm.md                 # River - Facilitator (scrum master)
├── analyst.md            # Zara - Explorer (business analysis)
├── data-engineer.md      # Dara - Data architect
├── devops.md             # Felix - Optimizer (CI/CD)
├── ux-expert.md          # Uma - Creator (UX design)
└── aios-master.md        # Pax - Orchestrator
```

**Key Patterns:**
- Markdown-based definitions (personality, expertise, commands)
- Role-based naming (@dev, @qa) vs capability naming
- Command authority matrix (1 command = 1 owner)
- Visibility levels (key, quick, full)
- IDE-agnostic (works with Windsurf, Cursor, Claude Code)

### 1.3 Kord AIOS Agent Mapping (ADR-0001)

| OMOC (Legacy) | AIOS Framework | Kord AIOS Canonical | Type |
|---------------|----------------|---------------------|------|
| prometheus | plan | **@plan** | primary |
| sisyphus | build | **@build** | primary |
| atlas | build-loop | **@build-loop** | primary |
| hephaestus | deep | **@deep** | subagent |
| aios-master | kord | **@kord** | primary |
| momus | qa | **@qa** | subagent |
| oracle | architect | **@architect** | subagent |
| metis | analyst | **@analyst** | subagent |
| sisyphus-junior | dev | **@dev** | subagent |
| — | pm | **@pm** | subagent |
| — | po | **@po** | subagent |
| — | sm | **@sm** | subagent |
| — | devops | **@devops** | subagent |
| librarian | librarian | **librarian** | utility |
| explore | explore | **explore** | utility |

---

## 2. Hook Systems Comparison

### 2.1 OMOC Hooks (163 hooks across 5 events)

```
src/hooks/
├── UserPromptSubmit (chat.message) - Can block
│   ├── keyword-detector/       # ultrawork/search/analyze modes
│   ├── auto-slash-command/     # Detects /command patterns
│   └── start-work/             # Sisyphus work session starter
│
├── PreToolUse (tool.execute.before) - Can block
│   ├── prometheus-md-only/     # Planner read-only mode
│   ├── comment-checker/        # Prevents AI slop
│   ├── directory-agents-injector/  # Auto-injects AGENTS.md
│   ├── rules-injector/         # Conditional rules
│   └── write-existing-file-guard/  # Guards overwrites
│
├── PostToolUse (tool.execute.after) - Cannot block
│   ├── tool-output-truncator/  # Prevents context bloat
│   ├── edit-error-recovery/    # Recovers from failures
│   ├── agent-usage-reminder/   # Specialized agent hints
│   └── delegate-task-retry/    # Retries failed delegations
│
├── Stop (event: session.stop) - Cannot block
│   ├── todo-continuation-enforcer/ # Force TODO completion
│   ├── ralph-loop/             # Self-referential dev loop
│   └── session-recovery/       # Auto-recovers from crashes
│
└── onSummarize (Compaction) - Cannot block
    └── compaction-context-injector/  # Preserves state
```

**Key Patterns:**
- Factory functions: `createXXXHook(ctx)`
- Safe creation with error handling
- Session-scoped state
- Hook enablement via config

### 2.2 Synkra AIOS Hooks

AIOS doesn't have a formal hook system. Instead it uses:
- **Pre-commit hooks**: ESLint, TypeScript, file validation
- **Pre-push hooks**: Story validation, checkbox consistency
- **CI/CD hooks**: Full test suite, coverage

**Key Concept**: AIOS uses **quality gates** instead of runtime hooks.

### 2.3 Kord AIOS Hook Strategy

Keep OMOC's hook system as the runtime layer. Add new hooks for AIOS methodology:

| New Hook | Event | Purpose |
|----------|-------|---------|
| `story-workflow-enforcer` | PreToolUse | Advisory: ensure story-driven work |
| `quality-gate-validator` | PostToolUse | Advisory: check quality gates |
| `star-command-router` | UserPromptSubmit | Route `*commands` to correct agent |

---

## 3. Tools Comparison

### 3.1 OMOC Tools (113 tools across 8 categories)

```
src/tools/
├── LSP (6): goto_definition, find_references, symbols, diagnostics, rename
├── AST-Grep (2): search, replace (25 languages)
├── Search (2): grep, glob
├── Session (4): list, read, search, info
├── Task (4): create, get, list, update (Claude Code compatible)
├── Agent (2): task (delegate), call_omo_agent
├── Background (2): output, cancel
├── Skill (3): skill, skill_mcp, slashcommand
└── System (2): interactive_bash, look_at
```

**Key Patterns:**
- Direct ToolDefinition (static) or Factory Function (context-dependent)
- Tool filtering based on agent permissions
- Metadata restoration for outputs

### 3.2 Synkra AIOS Tasks

AIOS uses **tasks** as executable workflows (different from OMOC's task tool):

```
.aios-core/development/tasks/
├── develop-story.md      # Implement a story
├── code-review.md        # Review code
├── create-story.md       # Create user story
├── run-tests.md          # Execute test suite
└── validate-code.md      # Code validation
```

**Key Patterns:**
- Markdown-based task definitions
- Multi-step workflows
- Agent delegation within tasks
- Evidence collection

### 3.3 Kord AIOS Tool Strategy

Keep OMOC's tool system. Add:
- **Story loader tool**: Parse stories from `docs/kord-aios/stories/`
- **Pack manager tool**: Load/sync packs from `.kord-aios/packs/`
- **Quality gate tool**: Run validation checklists

---

## 4. Workflow/Orchestration Comparison

### 4.1 OMOC Orchestration

```
User Input → Atlas (orchestrator) → Background Manager → Agents
                    ↓
            Todo List Management
                    ↓
            Continuation Enforcers
                    ↓
            Parallel Delegation via task()
```

**Key Patterns:**
- Todo-based progress tracking
- `task()` with `run_in_background` for parallel work
- Continuation enforcers prevent early stopping
- Ralph loop for self-referential development

### 4.2 Synkra AIOS Workflow

```
User Request → Workflow Selection → Agent Activation → Task Execution
                    ↓
            Quality Gates (3 layers)
                    ↓
            Story-Driven Progress
                    ↓
            Evidence Collection
```

**Workflow Types:**
- `greenfield-fullstack`: New project
- `brownfield-integration`: Existing project
- `fork-join`: Parallel tasks
- `organizer-worker`: Delegated execution

**Quality Gates (3 layers):**
1. **Local (Pre-commit)**: Linting, type checking
2. **CI/CD**: Automated tests, CodeRabbit review
3. **Human**: Architecture review, final approval

### 4.3 Kord AIOS Workflow Strategy

Merge both approaches:
- OMOC's **continuation enforcers** + **background manager** for execution
- AIOS's **story-driven progress** + **quality gates** for methodology
- Kord AIOS adds **story runtime** that bridges both

---

## 5. Workspace/Configuration Comparison

### 5.1 OMOC Workspace

```
project/
├── .opencode/
│   └── kord-aios.json   # Plugin config
├── .sisyphus/
│   ├── plans/                # Work plans
│   ├── drafts/               # Working memory
│   ├── notepads/             # Session journals
│   └── evidence/             # Screenshots, logs
└── AGENTS.md                 # Project knowledge base
```

### 5.2 Synkra AIOS Workspace

```
project/
├── .aios-core/
│   ├── core/config/          # Framework config
│   ├── development/
│   │   ├── agents/           # Agent definitions
│   │   └── tasks/            # Task workflows
│   ├── product/
│   │   ├── templates/        # Document templates
│   │   └── checklists/       # Validation checklists
│   └── utils/                # Utility scripts
├── docs/
│   ├── stories/              # User stories
│   ├── architecture/         # System architecture
│   └── guides/               # User guides
└── squads/                   # Custom agent teams
```

### 5.3 Kord AIOS Workspace (Proposed)

```
project/
├── .kord-aios/               # Framework + runtime state
│   ├── packs/                # Templates/scripts/skills payload
│   ├── state/                # Todos/checkpoints/run logs (git-ignored)
│   └── evidence/             # Screenshots/log captures (git-ignored)
├── .opencode/
│   └── kord-aios.json        # Plugin config (rebranded)
├── docs/kord-aios/           # Human-facing docs (git-tracked)
│   ├── stories/              # Canonical story files
│   ├── architecture/         # System architecture + ADRs
│   ├── decisions/            # Design decisions
│   ├── plans/                # Non-story plans
│   ├── backlog/              # Epics, roadmap
│   ├── reference/            # Migration handoff snapshot
│   ├── sessions/             # Per-session journal (git-ignored)
│   └── drafts/               # In-progress artifacts (git-ignored)
└── AGENTS.md                 # Project knowledge base
```

---

## 6. Command Systems Comparison

### 6.1 OMOC Commands

```
/commands (slash commands)
├── /init-deep              # Initialize knowledge base
├── /ralph-loop             # Self-referential dev loop
├── /ulw-loop               # Ultrawork loop
├── /start-work             # Start Sisyphus work session
├── /refactor               # Intelligent refactoring
├── /handoff                # Create context summary
├── /playwright             # Browser automation
├── /frontend-ui-ux         # Frontend specialist
└── /git-master             # Git operations
```

### 6.2 Synkra AIOS Commands

```
*commands (star commands)
├── *help                   # Show available commands (ALL agents)
├── *yolo                   # Skip confirmations (ALL agents)
├── *guide                  # Show usage guide (ALL agents)
├── *exit                   # Exit agent mode (ALL agents)
├── *create-prd             # Create PRD (@pm only)
├── *create-story           # Create user story (@sm only)
├── *develop                # Implement story (@dev only)
├── *review                 # Code review (@qa only)
├── *create-architecture    # System design (@architect only)
└── *push, *create-pr       # Git operations (@devops only)
```

**Authority Matrix**: 1 command = 1 owner agent (no duplication)

### 6.3 Kord AIOS Command Strategy

Keep both systems, separate namespaces:
- `/commands`: OMOC skills and slash commands
- `*commands`: AIOS methodology commands with authority matrix
- `@agent`: Agent activation (passthrough, not hook-based)

---

## 7. Story-Driven Orchestration (ADR-0002)

### 7.1 Artifact Hierarchy

```
┌─────────────────────────────────────────────┐
│  PRODUCT REQUIREMENTS DOC (PRD)             │
│  • Owned by: @pm / @po                      │
├─────────────────────────────────────────────┤
│  STORY FILE (docs/kord-aios/stories/*.md)   │
│  • Owned by: @sm (planning), @dev (AC)      │
├─────────────────────────────────────────────┤
│  SPEC/ARCHITECTURE (docs/kord-aios/arch/*) │
│  • Owned by: @architect                     │
└─────────────────────────────────────────────┘
```

### 7.2 Story Lifecycle

```
DRAFT → PLANNING → READY_FOR_DEV → IN_PROGRESS → READY_FOR_REVIEW → APPROVED → COMPLETED
```

### 7.3 Fallback Rules

| Agent | Issue Type | Action |
|-------|-----------|--------|
| @build/@build-loop | AC unclear | Stop, escalate to @sm |
| @build/@build-loop | Bug found | Fix + document in story |
| @qa | AC ambiguous | Escalate to @sm |
| @plan | Requirements unclear | Escalate to @pm/@po |

---

## 8. Key Fusion Decisions

### 8.1 What to Keep from OMOC

| Component | Reason |
|-----------|--------|
| Plugin architecture (`src/index.ts`) | Already works with OpenCode |
| Agent factory pattern | Model fallback, tool restrictions |
| Hook system (40+ hooks) | Runtime interception works well |
| Tool ecosystem (113 tools) | LSP, AST-grep, delegation are best-in-class |
| Background manager | Parallel execution, cancellation |
| Continuation enforcers | Prevents incomplete work |

### 8.2 What to Keep from Synkra AIOS

| Component | Reason |
|-----------|--------|
| Story-driven workflow | Clear artifact ownership |
| `*command` system | Authority matrix prevents confusion |
| Quality gates (3 layers) | Structured validation |
| Pack/squad system | Extensibility for domains |
| Agent personas | Clear role identities |

### 8.3 What to Discard

| Component | Why |
|-----------|-----|
| OMOC agent alias layer | Causes complexity, use canonical names |
| AIOS CLI-first architecture | We're a plugin, not a CLI |
| AIOS squads as separate repos | Integrate as packs within plugin |
| Duplicate orchestrator loops | Use OMOC's only |

---

## 9. Implementation Modules (Priority Order)

### Module 1: Foundation (Must Have)
1. **RuntimePaths**: Resolve `.kord-aios/` and `docs/kord-aios/` consistently
2. **EnsureWorkspace**: Create workspace structure on plugin init
3. **Config rebrand**: `kord-aios.json` → `kord-aios.json`

### Module 2: Agent Fusion
1. **Canonical agent registry**: Fused roster with no aliases
2. **Agent file restructure**: `src/agents/plan/`, `src/agents/build/`, etc.
3. **Legacy re-exports**: OMOC names resolve to canonical

### Module 3: Story Runtime
1. **Story loader**: Parse `docs/kord-aios/stories/*.md`
2. **Task extraction**: Checkboxes → todos
3. **Evidence collector**: Link outputs to stories

### Module 4: Star Commands
1. **Star command router**: `*help`, `*yolo`, `*story`
2. **Authority matrix**: 1 command = 1 owner
3. **Hook integration**: Non-blocking advisory

### Module 5: Pack Manager
1. **Pack loader**: Load from `.kord-aios/packs/`
2. **Synkra sync**: Import templates/scripts/skills
3. **Manifest tracking**: Version pins

### Module 6: CLI/Installer
1. **CLI rebrand**: `kord-aios doctor`, `kord-aios init`
2. **Migration scripts**: `.aios-core/` → `.kord-aios/`
3. **Documentation update**: README, guides

---

## 10. Next Steps

1. **Validate this analysis** with user
2. **Update `.sisyphus/plans/kord-aios-v1.md`** with module-based tasks
3. **Begin Module 1**: Foundation (RuntimePaths, EnsureWorkspace)
4. **Iterate** through remaining modules

---

*Document created by Prometheus as part of Kord AIOS migration planning.*
