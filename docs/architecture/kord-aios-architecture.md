# Kord AIOS Architecture Specification

**Version:** 1.0.0  
**Date:** 2026-02-07  
**Status:** Draft

## 1. System Overview

Kord AIOS is a unified AI-orchestrated development framework that combines:

- **Kord AIOS Core** (kord-aios): A battle-tested Bun-based runtime with 40+ hooks, 25+ tools, and sophisticated agent management
- **Kord AIOS Skills Layer**: A comprehensive story-driven methodology with 176+ skills, specialized agents, and quality gates

### 1.1 Core Philosophy

Kord AIOS treats AI agents as **collaborative team members** rather than simple tools. The architecture enables:

- **Hierarchical orchestration**: Master agents delegate to specialized workers
- **Story-driven workflows**: Development work is organized as trackable stories with acceptance criteria
- **Quality gates**: Automated verification at every phase
- **Methodology enforcement**: Consistent patterns via hooks and rules injection

### 1.2 Key Integration Principles

| Principle           | Implementation                                                   |
| ------------------- | ---------------------------------------------------------------- |
| Engine Stability    | Kord AIOS core runtime remains unchanged; skills layer sits above  |
| Config Separation   | `.opencode/` for runtime, `.kord/` + `docs/kord/` for content     |
| Skill Discovery     | Kord AIOS loader includes built-in kord-aios skills and project skills |
| Agent Compatibility | Kord agents enhanced with Kord AIOS methodology                    |
| Binary Distribution | Bun builds produce standalone executables                        |

---

## 2. Component Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KORD AIOS ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      USER INTERFACE LAYER                                ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │  OpenCode   │  │   Terminal  │  │    IDE      │  │   Scripts   │    ││
│  │  │   Plugin    │  │    (CLI)    │  │   Plugin    │  │  (Batch)    │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      ORCHESTRATION LAYER (KORD CORE)                     ││
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                     AGENT SYSTEM                                 │    ││
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │    ││
│  │  │  │  kord    │ │   dev    │ │ dev-jun  │ │  plan    │ │   qa   │ │    ││
│  │  │  │          │ │          │ │  ior     │ │          │ │        │ │    ││
│  │  │  │          │ │          │ │          │ │          │ │        │ │    ││
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  │                                                                              │
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                     HOOK SYSTEM (40+)                            │    ││
│  │  │  • Lifecycle Hooks     • Safety Guards    • UX Enhancements      │    ││
│  │  │  • Methodology Enforce • Tool Interceptor • Recovery Systems     │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  │                                                                              │
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                     TOOL SYSTEM (25+)                            │    ││
│  │  │  • delegate-task  • skill-mcp     • session-manager             │    ││
│  │  │  • task CRUD      • grep/glob     • lsp-client                  │    ││
│  │  │  • slashcommand   • background    • interactive_bash            │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      SKILLS LAYER (KORD AIOS)                              ││
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                     SKILL SYSTEM (176+)                          │    ││
│  │  │  • build              • create-*          • db-*                │    ││
│  │  │  • analyze-*          • audit-*           • spec-*              │    ││
│  │  │  • test-*             • sync-*            • squad-creator-*     │    ││
│  │  │  • plan-*             • review-*          • github-devops-*     │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  │                                                                              │
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                     STORY WORKFLOW                               │    ││
│  │  │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐          │    ││
│  │  │  │  SPEC   │ → │  PLAN   │ → │  BUILD  │ → │   QA    │          │    ││
│  │  │  │         │   │         │   │         │   │  GATE   │          │    ││
│  │  │  │@architect│  │  @sm    │   │  @dev   │   │  @qa    │          │    ││
│  │  │  └─────────┘   └─────────┘   └─────────┘   └─────────┘          │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  │                                                                              │
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                     QUALITY GATES                                │    ││
│  │  │  • Complexity Assessment  • Risk Profiling  • NFR Assessment    │    ││
│  │  │  • Review Build          • Gate Generation   • Trace Matrix     │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      RUNTIME LAYER (Bun + Node)                          ││
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                     BUN RUNTIME                                  │    ││
│  │  │  • Fast startup    • TypeScript native    • Binary builds       │    ││
│  │  │  • Plugin system   • Hook lifecycle       • Tool registry       │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  │                                                                              │
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                     CONFIGURATION                                │    ││
│  │  │  • .opencode/     • .kord/             • kord-aios.json     │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Module Interaction Flow

```
User Request
     │
     ▼
┌─────────────────┐
│   OpenCode CLI  │ ←── Loads plugin from npm/global
│   / Plugin API  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Kord AIOS Plugin Entry (src/index.ts)         │
│  • Loads opencode.json + kord-aios.json              │
│  • Initializes hook registry                             │
│  • Registers tools                                       │
│  • Discovers and merges skills                           │
└────────┬────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────┐
         │                                          │
         ▼                                          ▼
┌─────────────────────┐                  ┌─────────────────────┐
│     Agent System     │                  │     Hook System      │
│  • resolveAgent()   │                  │  • before/after      │
│  • prompt builder   │◄────────────────►│  • event handlers    │
│  • delegation       │                  │  • error recovery    │
└────────┬────────────┘                  └─────────────────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Skill Tool │   │Delegate Task │   │ Background   │
│   Execution  │   │   (Subagent) │   │   Manager    │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Kord AIOS Skills Layer                        │
│  • Skill runbooks (176+ skills)                          │
│  • Story templates (docs/kord/stories/)                  │
│  • Methodology rules (kord-rules.md)                     │
│  • Built-in skills (src/features/builtin-skills/skills/kord-aios/) │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
D:/dev/kord-aios/
│
├── src/                                    # KORD AIOS CORE SOURCE
│   ├── index.ts                           # Plugin entry point
│   ├── agents/                            # Agent definitions
│   │   ├── index.ts                       # Agent registry
│   │   ├── dynamic-agent-prompt-builder.ts # Dynamic prompt generation
│   │   ├── build/                         # Plan execution orchestrator
│   │   ├── kord.ts                        # Main orchestrator
│   │   ├── dev-junior/                    # Delegated task executor
│   │   ├── plan/                          # Planning agent
│   │   ├── qa.ts                          # Plan reviewer
│   │   ├── dev.ts                         # Autonomous deep worker
│   │   ├── architect.ts                   # Strategic advisor
│   │   ├── analyst.ts                     # Pre-planning analysis
│   │   ├── librarian.ts                   # Multi-repo research
│   │   ├── explore.ts                     # Fast contextual grep
│   │   └── vision.ts                      # Media analyzer
│   │
│   ├── hooks/                             # Hook implementations (40+)
│   │   ├── index.ts                       # Hook registry
│   │   ├── todo-continuation-enforcer.ts  # Task tracking enforcement
│   │   ├── context-window-monitor.ts      # Token management
│   │   ├── session-recovery.ts            # Crash recovery
│   │   ├── rules-injector.ts              # Kord rules injection
│   │   ├── stop-continuation-guard.ts     # Safety stop
│   │   ├── ralph-loop.ts                  # Autonomous loop
│   │   ├── build/                         # Orchestrator hook
│   │   └── ... (35+ more)
│   │
│   ├── tools/                             # Tool implementations (25+)
│   │   ├── index.ts                       # Tool registry
│   │   ├── delegate-task/                 # Subagent delegation
│   │   ├── skill/                         # Skill execution
│   │   ├── skill-mcp/                     # MCP skill bridge
│   │   ├── task/                          # Task CRUD (experimental)
│   │   ├── session-manager/               # Session lifecycle
│   │   ├── grep/                          # Code search
│   │   ├── glob/                          # File discovery
│   │   ├── lsp/                           # Language server
│   │   └── slashcommand/                  # Command dispatch
│   │
│   ├── features/                          # Feature modules
│   │   ├── background-agent/              # Background task manager
│   │   ├── skill-mcp-manager/             # MCP integration
│   │   ├── opencode-skill-loader/         # Skill discovery
│   │   ├── builtin-skills/                # Built-in skill definitions
│   │   ├── context-injector/              # Context management
│   │   ├── tmux-subagent/                 # Terminal multiplexing
│   │   └── claude-code-*                  # Claude Code compatibility
│   │
│   ├── shared/                            # Shared utilities
│   ├── cli/                               # CLI implementation
│   └── config.ts                          # Configuration schema
│
├── src/features/builtin-skills/skills/kord-aios/  # Built-in skill library
│   ├── analysis/
│   ├── database/
│   ├── design-system/
│   ├── dev-workflow/
│   ├── devops/
│   ├── documentation/
│   ├── mcp/
│   ├── product/
│   ├── qa/
│   ├── squad/
│   ├── story/
│   ├── utilities/
│   ├── worktrees/
│   └── ...
│
├── .opencode/                             # RUNTIME WORKSPACE
│   ├── agents/                            # Generated agent manifests
│   ├── skills/                            # Project-specific skills
│   │   ├── github-pr-triage/SKILL.md
│   │   └── github-issue-triage/SKILL.md
│   └── rules/                             # Project-specific rules
│
├── .kord/                                 # Kord AIOS scaffolding
│   └── templates/                         # Story/ADR templates
│
├── bin/                                   # CLI ENTRY POINTS
│   ├── kord-aios.js                   # Primary CLI entry
│   ├── kord-aios.js                  # Legacy CLI wrapper (compat)
│   └── platform.js                        # Platform detection
│
├── docs/                                  # PROJECT DOCUMENTATION
│   ├── architecture/                      # Architecture docs
│   │   ├── kord-aios-architecture.md      # This document (legacy filename)
│   │   └── ...
│   ├── migration/                         # Migration documentation
│   │   ├── kord-aios-migration-plan.md    # Legacy filename
│   │   ├── kord-aios-task-board.md        # Legacy filename
│   │   ├── runtime-separation.md
│   │   ├── naming-map.md
│   │   └── ...
│   └── ...
│
├── package.json                           # Bun package manifest
├── tsconfig.json                          # TypeScript config
└── bunfig.toml                            # Bun configuration
```

---

## 4. Agent System Design

### 4.1 Agent Architecture

Kord AIOS implements a **hierarchical agent system** with role-based specialization:

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT HIERARCHY                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ORCHESTRATOR TIER                       │    │
│  │                                                      │    │
│  │  ┌─────────────┐        ┌──────────────────────┐    │    │
│  │  │    kord     │        │   dev               │    │    │
│  │  │  (@kord)    │───────▶│  (@dev)             │    │    │
│  │  │             │delegates│                    │    │    │
│  │  │ • Planning  │        │ • Deep research     │    │    │
│  │  │ • Coordination      │ • Intensive analysis│    │    │
│  │  │ • Workflow mgmt     │ • Skill invocation  │    │    │
│  │  └─────────────┘        └──────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SPECIALIST TIER                         │    │
│  │                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │   dev    │  │    qa    │  │architect │          │    │
│  │  │ (@dev)   │  │  (@qa)   │  │(@architect)         │    │
│  │  │          │  │          │  │          │          │    │
│  │  │• Coding  │  │• Testing │  │• Design  │          │    │
│  │  │• Refactor│  │• Review  │  │• Strategy│          │    │
│  │  │• Debug   │  │• Validate│  │• Patterns│          │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  │                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │    pm    │  │    po    │  │    sm    │          │    │
│  │  │  (@pm)   │  │  (@po)   │  │  (@sm)   │          │    │
│  │  │          │  │          │  │          │          │    │
│  │  │• Product │  │• Backlog │  │• Stories │          │    │
│  │  │• Roadmap │  │• Priority│  │• Sprints │          │    │
│  │  │• Market  │  │• Stakehold│  │• Tasks   │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              UTILITY TIER                            │    │
│  │                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │  analyst │  │ devops   │  │ data-eng │          │    │
│  │  │(@analyst)│  │(@devops) │  │(@data-eng)         │    │
│  │  │          │  │          │  │          │          │    │
│  │  │• Research│  │• CI/CD   │  │• Schema  │          │    │
│  │  │• Docs    │  │• Infra   │  │• RLS     │          │    │
│  │  │• Benchmark│  │• Deploy │  │• Optimize│          │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Agent Catalog (Kord AIOS)

**Source of Truth: `src/agents/AGENTS.md`**

| Agent | Role |
| ----- | ---- |
| `kord` | Master orchestrator (holds todo list, delegates work) |
| `plan` | Planning agent (interview + plan synthesis) |
| `build` | Plan execution orchestrator (runs /start-work) |
| `dev` | Autonomous deep worker (complex implementation) |
| `dev-junior` | Delegated task executor (atomic changes) |
| `qa` | Plan reviewer / quality gatekeeper |
| `analyst` | Pre-planning analysis and strategy |
| `architect` | Architecture & debugging advisor |
| `librarian` | Multi-repo research + documentation lookup |
| `explore` | Fast contextual grep / codebase exploration |
| `vision` | Visual content analysis |
| `sm` | Scrum master | 
| `pm` | Product manager |
| `po` | Product owner |
| `devops` | DevOps engineer |
| `data-engineer` | Database engineer |
| `ux-design-expert` | UX design specialist |
| `squad-creator` | Squad setup specialist |

### 4.3 Dynamic Agent Prompt Builder

The agent system uses `dynamic-agent-prompt-builder.ts` for runtime prompt generation:

```typescript
// Key features:
// 1. Variant resolution based on model capability
// 2. Dynamic prompt assembly from agent definitions
// 3. Skill injection based on context
// 4. Rules injection from .opencode/rules/

interface AgentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
  variant?: string; // Model-specific variant
  skills?: string[]; // Available skills
  tools?: string[]; // Available tools
  constraints?: Constraint[];
}
```

### 4.4 Agent Specializations

#### @kord (Orchestrator)

- **Purpose**: Central coordination and workflow management
- **Key Skills**: orchestrate, plan-execute-subtask
- **Delegates To**: @dev, @dev-junior, @qa, @architect

#### @dev (Developer)

- **Purpose**: Code implementation and technical execution
- **Key Skills**: build, plan-execute-subtask, create-service
- **Constraints**: Never implements without spec approval

#### @qa (Quality Assurance)

- **Purpose**: Testing, validation, and quality gates
- **Key Skills**: review-build, test-design, validate-next-story
- **Constraints**: Evidence-based verification only

#### @architect (System Designer)

- **Purpose**: High-level design and technical strategy
- **Key Skills**: spec-write-spec, analyze-project-structure
- **Constraints**: No implementation, only design and review

---

## 5. Hook System Design

### 5.1 Hook Architecture

Kord AIOS core provides a **lifecycle hook system** that the skills layer extends with methodology enforcement:

```
┌─────────────────────────────────────────────────────────────────┐
│                     HOOK LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Event Flow:                                                     │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ session.    │───▶│  chat.      │───▶│  tool.      │         │
│  │ created     │    │  message    │    │  execute    │         │
│  └─────────────┘    └─────────────┘    └──────┬──────┘         │
│                                                │                 │
│                           ┌────────────────────┘                 │
│                           ▼                                      │
│                  ┌─────────────────┐                            │
│                  │  before hooks   │                            │
│                  │  (intercept)    │                            │
│                  └────────┬────────┘                            │
│                           │                                      │
│                           ▼                                      │
│                  ┌─────────────────┐                            │
│                  │  tool execution │                            │
│                  └────────┬────────┘                            │
│                           │                                      │
│                           ▼                                      │
│                  ┌─────────────────┐                            │
│                  │  after hooks    │                            │
│                  │  (post-process) │                            │
│                  └─────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Hook Categories

| Priority | Category            | Purpose                    | Examples                                           |
| -------- | ------------------- | -------------------------- | -------------------------------------------------- |
| 5-10     | **Safety & Guards** | Prevent harmful operations | stop-continuation-guard, write-existing-file-guard |
| 20-30    | **Methodology**     | Enforce Kord AIOS patterns   | todo-continuation-enforcer, rules-injector         |
| 40-50    | **Monitoring**      | Track and observe          | context-window-monitor, session-recovery           |
| 60-70    | **Recovery**        | Handle errors              | edit-error-recovery, delegate-task-retry           |
| 80-90    | **UX**              | Enhance experience         | agent-usage-reminder, category-skill-reminder      |

### 5.3 Merged Hook Inventory

Kord AIOS core provides 40+ hooks. The skills layer adds methodology-specific hooks:

**Core Hooks (kept unchanged):**

- `context-window-monitor` - Token limit management
- `session-recovery` - Crash recovery
- `session-notification` - User notifications
- `tool-output-truncator` - Output size management
- `todo-continuation-enforcer` - Task tracking
- `stop-continuation-guard` - Safety stop
- `rules-injector` - Dynamic rules injection
- `build` - Orchestrator integration
- `edit-error-recovery` - Fix edit failures
- `delegate-task-retry` - Subagent retry logic
- `anthropic-effort` - Model effort control
- `preemptive-compaction` - Context compaction
- `unstable-agent-babysitter` - Agent monitoring
- `ralph-loop` - Autonomous execution loop
- And 25+ more...

**Kord AIOS Enhancement Hooks (to add):**

- `story-workflow-enforcer` - Story methodology compliance
- `quality-gate-validator` - QA gate enforcement
- `acceptance-criteria-tracker` - AC verification
- `skill-execution-logger` - Skill usage tracking

### 5.4 Hook Registration

```typescript
// From src/hooks/index.ts
export {
  // Core hooks
  createContextWindowMonitorHook,
  createSessionRecoveryHook,
  createTodoContinuationEnforcer,
  createStopContinuationGuardHook,
  createRulesInjectorHook,
  createBuildHook,
  // ... 35+ more
};
```

---

## 6. Skill System Design

### 6.1 Skill Architecture

Kord AIOS uses a **hierarchical skill discovery system**:

```
┌─────────────────────────────────────────────────────────────┐
│                    SKILL DISCOVERY                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Priority (highest to lowest):                               │
│                                                              │
│  1. Plugin Built-in Skills                                   │
│     → src/features/builtin-skills/                           │
│     → Browser automation, MCP wrappers                       │
│                                                              │
│  2. User Claude Skills (if enabled)                          │
│     → ~/.claude/skills/                                      │
│     → Personal skill library                                 │
│                                                              │
│  3. OpenCode Global Skills                                   │
│     → ~/.opencode/skills/                                    │
│     → User-global OpenCode skills                            │
│                                                              │
│  4. Project Claude Skills (if enabled)                       │
│     → ./.claude/skills/                                      │
│     → Project-specific Claude skills                         │
│                                                              │
│  5. OpenCode Project Skills ← Kord AIOS injected here          │
│     → ./.opencode/skills/                                    │
│     → src/features/builtin-skills/skills/kord-aios/             │
│     → 176+ Kord AIOS skills available                          │
│                                                              │
│  6. Plugin Config Skills                                     │
│     → kord-aios.json skills array                        │
│     → User-defined skill overrides                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Skill Categories (176+ Skills)

| Category                | Count | Examples                                                   |
| ----------------------- | ----- | ---------------------------------------------------------- |
| **Build & Development** | 12    | build, build-autonomous, build-component, compose-molecule |
| **Story & Planning**    | 15    | create-next-story, spec-_, plan-_, validate-next-story     |
| **Analysis**            | 18    | analyze-_, audit-_, extract-\*                             |
| **Database**            | 20    | db-\*, supabase integration                                |
| **Testing & QA**        | 15    | test-_, review-_, trace-requirements                       |
| **DevOps & CI/CD**      | 12    | ci-cd-configuration, github-devops-\*                      |
| **Design System**       | 10    | bootstrap-shadcn-library, extract-tokens, tailwind-upgrade |
| **Squad Management**    | 10    | squad-creator-\*                                           |
| **Sync & Integration**  | 8     | sync-\*, upstream-sync                                     |
| **Utilities**           | 56    | create-_, improve-_, generate-_, cleanup-_                 |

### 6.3 Skill Format

```markdown
# Skill Name

**Agent:** @agent-name  
**Command:** `*command-name`  
**Purpose:** Brief description  
**Created:** YYYY-MM-DD (Story X.Y.Z)

## Preconditions

- Required state before execution

## Workflow

1. Step one
2. Step two
3. Step three

## Postconditions

- Expected state after execution

## Error Handling

- How to handle failures
```

### 6.4 Skill Execution Flow

```
User invokes skill (*command-name)
           │
           ▼
┌──────────────────────┐
│  Skill Tool (src/    │
│  tools/skill/)       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Skill Discovery     │ ← Searches .opencode/skills/
│  (opencode-skill-    │    src/features/builtin-skills/skills/kord-aios/
│   loader/)           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  SKILL.md Parser     │
│  • Extract metadata  │
│  • Parse workflow    │
│  • Validate format   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Agent Resolution    │ ← @agent-name from skill header
│  (dynamic-agent-     │
│   prompt-builder)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Prompt Assembly     │
│  • System prompt     │
│  • Skill context     │
│  • Rules injection   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Subagent Execution  │ ← Delegate to @agent-name
│  (delegate-task)     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Result Return       │
│  to Parent Session   │
└──────────────────────┘
```

---

## 7. Story-Driven Workflow Integration

### 7.1 Story Lifecycle

Kord AIOS introduces story-driven development to the core runtime:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     STORY LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐                                                    │
│   │    IDEA     │  @pm / @po creates feature request                 │
│   └──────┬──────┘                                                    │
│          │                                                           │
│          ▼                                                           │
│   ┌─────────────┐     ┌─────────────┐                               │
│   │    SPEC     │────▶│  Complexity │  @architect assesses            │
│   │   PHASE     │     │ Assessment  │  @spec-assess-complexity        │
│   └──────┬──────┘     └─────────────┘                               │
│          │                                                           │
│          ▼                                                           │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│   │    PLAN     │────▶│    NFR      │────▶│   Risk      │           │
│   │   PHASE     │     │ Assessment  │     │  Profile    │           │
│   └──────┬──────┘     └─────────────┘     └─────────────┘           │
│          │                         @nfr-assess   @risk-profile       │
│          ▼                                                           │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│   │   BUILD     │────▶│  Autonomous │────▶│   Subtask   │           │
│   │   PHASE     │     │    Loop     │     │ Execution   │           │
│   └──────┬──────┘     └─────────────┘     └─────────────┘           │
│          │         @build-autonomous  @plan-execute-subtask          │
│          ▼                                                           │
│   ┌─────────────┐     ┌─────────────┐                               │
│   │     QA      │────▶│   Review    │  @qa validates output          │
│   │   PHASE     │     │   Build     │  @review-build                 │
│   └──────┬──────┘     └─────────────┘                               │
│          │                                                           │
│          ▼                                                           │
│   ┌─────────────┐                                                    │
│   │   COMPLETE  │  Story marked done, ACs verified                   │
│   └─────────────┘                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Story File Format

```markdown
# Story X.Y.Z: Story Title

## Status

- [ ] Draft
- [ ] Spec Complete
- [ ] Plan Complete
- [ ] Build Complete
- [ ] QA Passed
- [ ] Done

## Context

Story background and motivation

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## File List

| File         | Status |
| ------------ | ------ |
| path/to/file | [x]    |

## Implementation Notes

Technical details and decisions

## Test Notes

Testing approach and coverage
```

### 7.3 Integration Points

| Kord AIOS Core Feature         | Kord AIOS Enhancement              |
| ---------------------------- | -------------------------------- |
| `todo-continuation-enforcer` | Story checkbox tracking          |
| `delegate-task`              | Skill-based subagent dispatch    |
| `session-recovery`           | Story state persistence          |
| `build` hook                 | Orchestrator workflow management |
| `rules-injector`             | Kord AIOS methodology rules        |

---

## 8. Build System

### 8.1 Bun Runtime

Kord AIOS uses **Bun** as the primary runtime:

```
┌─────────────────────────────────────────────────────────────┐
│                      BUILD PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Development:                                                │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │  Bun    │───▶│  TSC    │───▶│  Tests  │                 │
│  │ Runtime │    │ Typechk │    │  (bun)  │                 │
│  └─────────┘    └─────────┘    └─────────┘                 │
│                                                              │
│  Production:                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │  Bun    │───▶│  Binary │───▶│  Dist   │                 │
│  │  Build  │    │  Compile│    │ Output  │                 │
│  └─────────┘    └─────────┘    └─────────┘                 │
│                                                              │
│  Commands:                                                   │
│  • bun run typecheck  - TypeScript validation               │
│  • bun test           - Run test suite                      │
│  • bun run build      - Compile to dist/                    │
│  • bun build --compile - Binary build                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Binary Distribution

```javascript
// From package.json scripts
{
  "scripts": {
    "build": "bun build ./src/index.ts --outdir=dist",
    "build:binary": "bun build --compile ./bin/kord-aios.js --outfile=dist/kord-aios",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "lint": "eslint src/"
  }
}
```

### 8.3 Plugin Distribution

The Kord AIOS plugin is distributed via npm:

```
npm install -g kord-aios

# Or local project install
npm install --save-dev kord-aios
```

---

## 9. Configuration Strategy

### 9.1 Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   CONFIGURATION LAYERS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SYSTEM DEFAULTS (built-in)                              │
│     → Hardcoded sensible defaults                          │
│                                                              │
│  2. GLOBAL CONFIG (~/.config/opencode/opencode.json)        │
│     → User-level OpenCode configuration                    │
│     → Model providers, MCP servers                         │
│                                                              │
│  3. PLUGIN DEFAULTS (src/config.ts)                         │
│     → Kord AIOS default settings                             │
│     → Hook enable/disable                                  │
│                                                              │
│  4. PROJECT CONFIG (./.opencode/kord-aios.json)         │
│     → Project-specific overrides                           │
│     → Custom agents, categories                            │
│                                                              │
│  5. ENVIRONMENT VARIABLES                                   │
│     → OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.              │
│     → Runtime overrides                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Directory Structure Convention

| Directory            | Purpose           | Populated By            |
| -------------------- | ----------------- | ----------------------- |
| `.opencode/`         | Runtime workspace | `kord-aios init`    |
| `.opencode/agents/`  | Agent manifests   | Generated               |
| `.opencode/skills/`  | Project skills    | Copied from built-in skills |
| `.opencode/rules/`   | Methodology rules | Copied from kord-rules.md |
| `.kord/`             | Scaffolding       | Project scaffolder      |
| `docs/kord/stories/` | Story files       | User + @sm              |
| `docs/architecture/` | ADRs and design   | User + @architect       |

### 9.3 Key Configuration Files

```yaml
# kord-aios.json (project-level)
{
  "name": "my-project",
  "version": "1.0.0",
  "kord": { "tasks": { "claude_code_compat": true } },
  "agents":
    {
      "kord": { "model": "claude-3-5-sonnet" },
      "dev": { "model": "claude-3-5-sonnet" },
      "qa": { "model": "claude-3-haiku" },
    },
  "categories":
    {
      "coding": { "model": "claude-3-5-sonnet" },
      "review": { "model": "claude-3-haiku" },
    },
  "disabled_hooks": [],
  "disabled_tools": [],
  "disabled_skills": [],
  "experimental": { "task_system": true, "preemptive_compaction": true },
}
```

---

## 10. Quality Gates

### 10.1 Gate Architecture

Kord AIOS adds quality gates to the core safety mechanisms:

```
┌─────────────────────────────────────────────────────────────┐
│                    QUALITY GATES                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Spec Phase Gates:                                          │
│  ├─ Complexity Assessment (@spec-assess-complexity)        │
│  ├─ Spec Critique (@spec-critique)                         │
│  └─ NFR Assessment (@nfr-assess)                           │
│                                                              │
│  Plan Phase Gates:                                          │
│  ├─ Risk Profiling (@risk-profile)                         │
│  ├─ Test Design (@test-design)                             │
│  └─ Implementation Plan Review                             │
│                                                              │
│  Build Phase Gates:                                         │
│  ├─ Type Check (bun run typecheck)                         │
│  ├─ Lint (eslint)                                          │
│  ├─ Unit Tests (bun test)                                  │
│  └─ Self-Critique (built into build)                       │
│                                                              │
│  QA Phase Gates:                                            │
│  ├─ Review Build (@review-build)                           │
│  ├─ Requirements Traceability                              │
│  ├─ False Positive Detection                               │
│  └─ Evidence Requirements                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Gate Enforcement

```typescript
// Gate results are stored in story files
interface GateResult {
  gateName: string;
  status: "PASS" | "FAIL" | "CONDITIONAL";
  evidence: string[];
  timestamp: string;
  agent: string;
}

// Gates block progression until passed
if (!allGatesPassed(story.gates)) {
  preventPhaseTransition();
  requestFixes();
}
```

---

## 11. Migration Phases

See `docs/migration/kord-aios-migration-plan.md` (legacy filename) for detailed migration steps.

### 11.1 High-Level Migration Strategy

```
Phase 0: Baseline (DONE)
├── Verify core engine stability
├── Lock engine directories
└── Document upstream sync strategy

Phase 1: Skills Layer Import (DONE)
├── Import skills to src/features/builtin-skills/skills/kord-aios/
├── Import rules and templates
└── Create story templates

Phase 2: Installer Integration (IN PROGRESS)
├── Add 'kord-aios init' command
├── Merge installer capabilities
└── Handle existing config preservation

Phase 3: Agent Overlay (PARTIAL)
├── kord/dev aliases (DONE)
├── Agent compatibility layer
└── Legacy alias maintenance

Phase 4: Story-Driven Enablement (PENDING)
├── Skill discovery integration
├── Story workflow documentation
└── Task/delegation mapping

Phase 5: E2E Validation (PENDING)
├── Delegation flow testing
├── Fallback mechanism testing
├── Installer testing
└── Regression reporting
```

---

## 12. Key Architectural Decisions

### ADR-001: Engine Separation

**Decision**: Keep the core engine unchanged, layer Kord AIOS skills on top

**Rationale**:

- The core engine is battle-tested with 40+ hooks
- Minimizes regression risk
- Clear separation of concerns
- Enables independent updates

**Trade-offs**:

- (+) Stability, maintainability
- (-) Some duplication in skill/agent loading

### ADR-002: Bun Runtime

**Decision**: Use Bun as primary runtime

**Rationale**:

- Fast startup and execution
- Native TypeScript support
- Binary compilation for distribution
- Modern JavaScript features

**Trade-offs**:

- (+) Performance, single binary
- (-) Smaller ecosystem than Node.js

### ADR-003: Config Directory Structure

**Decision**: Use `.opencode/` for runtime, `.kord/` for scaffolding

**Rationale**:

- Follows OpenCode conventions
- Clear separation between engine and content
- `.opencode/` is OpenCode standard
- `.kord/` is Kord AIOS-specific

**Trade-offs**:

- (+) Convention compatibility
- (-) Two config directories to manage

### ADR-004: Skill Discovery

**Decision**: Extend the OpenCode skill loader to include Kord AIOS skills

**Rationale**:

- Reuses working infrastructure
- Maintains compatibility
- Hierarchical discovery works well

**Trade-offs**:

- (+) No new code needed
- (-) Skill format must align with loader expectations

### ADR-005: Agent Prompt Format

**Decision**: Keep the core dynamic-agent-prompt-builder

**Rationale**:

- Sophisticated variant resolution
- Model-specific prompt adaptation
- Already handles skill injection

**Trade-offs**:

- (+) Proven system
- (-) Kord AIOS agent definitions must match the builder format

### ADR-006: Hook Merge Strategy

**Decision**: Keep all core hooks, add Kord AIOS-specific ones

**Rationale**:

- Core hooks are battle-tested
- New hooks can be added incrementally
- Hook priority system manages ordering

**Trade-offs**:

- (+) Maximum compatibility
- (-) Larger hook surface area

---

## 13. Appendix

### A. File References

| File                                         | Purpose              |
| -------------------------------------------- | -------------------- |
| `src/index.ts`                               | Plugin entry point   |
| `src/agents/index.ts`                        | Agent registry       |
| `src/hooks/index.ts`                         | Hook registry        |
| `src/tools/index.ts`                         | Tool registry        |
| `src/config.ts`                              | Configuration schema |
| `src/features/builtin-skills/skills/kord-aios/` | Kord AIOS skill runbooks |
| `docs/migration/kord-aios-migration-plan.md` | Migration details (legacy filename) |

### B. External References

- [Kord AIOS Repository](https://github.com/GDSDN/kord-aios)
- [OpenCode Plugin API](https://opencode.ai/docs/plugins)
- [Bun Documentation](https://bun.sh/docs)

### C. Glossary

| Term  | Definition                                     |
| ----- | ---------------------------------------------- |
| Kord AIOS Core | Bun-based runtime plugin (kord-aios) |
| Kord AIOS Skills Layer | Story-driven methodology and skills | 
| Skill | A reusable workflow runbook                    |
| Hook  | Lifecycle interception point                   |
| Story | A trackable development unit                   |
| Gate  | A quality checkpoint                           |

---

_Document Version: 1.0.0_  
_Last Updated: 2026-02-07_  
_Author: @architect_
