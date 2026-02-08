# Open-AIOS Architecture Specification

**Version:** 1.0.0  
**Date:** 2026-02-07  
**Status:** Draft

## 1. System Overview

Open-AIOS is a unified AI-orchestrated development framework that combines:

- **OMOC Engine** (oh-my-opencode): A battle-tested Bun-based runtime with 40+ hooks, 25+ tools, and sophisticated agent management
- **AIOS Brain** (Synkra AIOS): A comprehensive story-driven methodology with 176+ skills, 15 specialized agents, and quality gates

### 1.1 Core Philosophy

Open-AIOS treats AI agents as **collaborative team members** rather than simple tools. The architecture enables:

- **Hierarchical orchestration**: Master agents delegate to specialized workers
- **Story-driven workflows**: Development work is organized as trackable stories with acceptance criteria
- **Quality gates**: Automated verification at every phase
- **Methodology enforcement**: Consistent patterns via hooks and rules injection

### 1.2 Key Integration Principles

| Principle           | Implementation                                      |
| ------------------- | --------------------------------------------------- |
| Engine Stability    | OMOC runtime remains unchanged; AIOS layers on top  |
| Config Separation   | `.opencode/` for runtime, `.aios-core/` for content |
| Skill Discovery     | OMOC loader extended to include AIOS skills         |
| Agent Compatibility | OMOC agents enhanced with AIOS methodology          |
| Binary Distribution | Bun builds produce standalone executables           |

---

## 2. Component Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPEN-AIOS ARCHITECTURE                             │
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
│  │                      ORCHESTRATION LAYER (OMOC)                          ││
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                     AGENT SYSTEM                                 │    ││
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │    ││
│  │  │  │  kord    │ │   deep   │ │  dev     │ │   qa     │ │architect│ │    ││
│  │  │  │(atlas)   │ │(hephaes- │ │(sisyphus│ │(prometh  │ │ (momus) │ │    ││
│  │  │  │          │ │  tus)    │ │ -junior) │ │  eus)    │ │         │ │    ││
│  │  │  │          │ │          │ │          │ │          │ │         │ │    ││
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
│  │                      METHODOLOGY LAYER (AIOS)                            ││
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
│  │  │  • .opencode/     • .aios-core/         • opencode.json         │    ││
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
│              Open-AIOS Plugin Entry (src/index.ts)       │
│  • Loads plugin config (opencode.json)                   │
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
│              AIOS Layer (layer/aios/)                    │
│  • Skill runbooks (176+ skills)                          │
│  • Story templates (docs/stories/)                       │
│  • Methodology rules (.opencode/rules/)                  │
│  • Framework content (.aios-core/)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
D:/dev/open-aios/
│
├── src/                                    # OMOC ENGINE SOURCE (unchanged)
│   ├── index.ts                           # Plugin entry point
│   ├── agents/                            # Agent definitions
│   │   ├── index.ts                       # Agent registry
│   │   ├── dynamic-agent-prompt-builder.ts # Dynamic prompt generation
│   │   ├── atlas/                         # Master orchestrator (alias → kord)
│   │   ├── sisyphus.ts                    # Main orchestrator (alias → kord)
│   │   ├── sisyphus-junior/               # Delegated task executor (→ @dev)
│   │   ├── prometheus/                    # Planning agent (→ @sm)
│   │   ├── momus/                         # Plan reviewer (→ @qa)
│   │   ├── hephaestus.ts                  # Deep research subagent (alias → deep)
│   │   ├── oracle.ts                      # Strategic advisor (→ @architect)
│   │   ├── metis.ts                       # Pre-planning analysis (→ @analyst)
│   │   ├── librarian.ts                   # Multi-repo research (utility, unchanged)
│   │   ├── explore.ts                     # Fast contextual grep (utility, unchanged)
│   │   └── multimodal-looker.ts           # Media analyzer (utility, unchanged)
│   │
│   ├── hooks/                             # Hook implementations (40+)
│   │   ├── index.ts                       # Hook registry
│   │   ├── todo-continuation-enforcer.ts  # Task tracking enforcement
│   │   ├── context-window-monitor.ts      # Token management
│   │   ├── session-recovery.ts            # Crash recovery
│   │   ├── rules-injector.ts              # AIOS rules injection
│   │   ├── stop-continuation-guard.ts     # Safety stop
│   │   ├── ralph-loop.ts                  # Autonomous loop
│   │   ├── atlas.ts                       # Orchestrator hook
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
├── layer/aios/                            # AIOS LAYER (imported)
│   ├── payload/
│   │   ├── skills/                        # 176+ skill runbooks
│   │   │   ├── build/SKILL.md
│   │   │   ├── create-next-story/SKILL.md
│   │   │   ├── spec-*/SKILL.md
│   │   │   ├── plan-*/SKILL.md
│   │   │   ├── analyze-*/SKILL.md
│   │   │   ├── audit-*/SKILL.md
│   │   │   ├── db-*/SKILL.md
│   │   │   ├── test-*/SKILL.md
│   │   │   ├── sync-*/SKILL.md
│   │   │   ├── review-*/SKILL.md
│   │   │   ├── github-devops-*/SKILL.md
│   │   │   ├── squad-creator-*/SKILL.md
│   │   │   └── ...
│   │   │
│   │   ├── rules/                         # AIOS methodology rules
│   │   │   └── opencode-rules.md
│   │   │
│   │   └── content/                       # Templates and content
│   │
│   ├── docs/stories/                      # Story templates
│   ├── scripts/                           # AIOS utilities
│   └── apps/                              # AIOS applications
│       ├── dashboard/                     # Monitoring UI
│       └── monitor-server/                # WebSocket backend
│
├── .opencode/                             # RUNTIME WORKSPACE
│   ├── agents/                            # Generated agent manifests
│   ├── skills/                            # Project-specific skills
│   │   ├── github-pr-triage/SKILL.md
│   │   └── github-issue-triage/SKILL.md
│   └── rules/                             # Project-specific rules
│
├── .aios-core/                            # AIOS FRAMEWORK STATE
│   └── (content stored in user's home or project)
│
├── bin/                                   # CLI ENTRY POINTS
│   ├── oh-my-opencode.js                  # Legacy CLI (kept for compat)
│   ├── open-aios.js                       # New CLI entry
│   └── platform.js                        # Platform detection
│
├── docs/                                  # PROJECT DOCUMENTATION
│   ├── architecture/                      # Architecture docs
│   │   ├── open-aios-architecture.md      # This document
│   │   └── ...
│   ├── migration/                         # Migration documentation
│   │   ├── open-aios-migration-plan.md
│   │   ├── open-aios-task-board.md
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

Open-AIOS implements a **hierarchical agent system** with role-based specialization:

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT HIERARCHY                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ORCHESTRATOR TIER                       │    │
│  │                                                      │    │
│  │  ┌─────────────┐        ┌──────────────────────┐    │    │
│  │  │    kord     │        │   @deep              │    │    │
│  │  │  (@kord)    │───────▶│  (hephaestus alias)  │    │    │
│  │  │             │delegates│                     │    │    │
│  │  │ • Planning  │        │ • Deep research      │    │    │
│  │  │ • Coordination      │ • Intensive analysis │    │    │
│  │  │ • Workflow mgmt     │ • Skill invocation   │    │    │
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

### 4.2 Agent Mapping (OMOC → Open-AIOS)

**Source of Truth: `src/agents/AGENTS.md`**

| OMOC Name           | Open-AIOS Name      | Compatibility Alias | Role (from AGENTS.md)                     |
| ------------------- | ------------------- | ------------------- | ----------------------------------------- |
| `atlas`             | `kord`              | `atlas` (kept)      | Master orchestrator (holds todo list)     |
| `sisyphus`          | `kord`              | `sisyphus` (kept)   | Main orchestrator prompt                  |
| `hephaestus`        | `deep`              | `hephaestus` (kept) | Deep research subagent (GPT 5.3 Codex)    |
| `sisyphus-junior`   | `dev`               | `sisyphus-junior`   | Delegated task executor                   |
| `prometheus`        | `sm`                | `prometheus`        | Planning agent (Interview/Consultant)     |
| `momus`             | `qa`                | `momus`             | Plan reviewer/critic                      |
| `oracle`            | `architect`         | `oracle`            | Strategic advisor (GPT-5.2)               |
| `metis`             | `analyst`           | `metis`             | Pre-planning analysis                     |
| `librarian`         | `librarian`         | -                   | Multi-repo research (utility, unchanged)  |
| `explore`           | `explore`           | -                   | Fast contextual grep (utility, unchanged) |
| `multimodal-looker` | `multimodal-looker` | -                   | Media analyzer (utility, unchanged)       |

**Net-New Open-AIOS Agents (no OMOC predecessor):**
| Open-AIOS Name | Role |
| -------------- | ---------------------------- |
| `pm` | Product manager (NEW) |
| `po` | Product owner (NEW) |
| `devops` | DevOps engineer (NEW) |
| `data-engineer`| Database engineer (NEW) |
| `ux-design-expert` | UX designer (NEW) |
| `security` | Security specialist (NEW) |

### 4.3 Dynamic Agent Prompt Builder

The agent system uses OMOC's `dynamic-agent-prompt-builder.ts` for runtime prompt generation:

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
- **Delegates To**: @deep, @dev, @qa, @architect

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

OMOC provides a **lifecycle hook system** that AIOS extends with methodology enforcement:

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
| 20-30    | **Methodology**     | Enforce AIOS patterns      | todo-continuation-enforcer, rules-injector         |
| 40-50    | **Monitoring**      | Track and observe          | context-window-monitor, session-recovery           |
| 60-70    | **Recovery**        | Handle errors              | edit-error-recovery, delegate-task-retry           |
| 80-90    | **UX**              | Enhance experience         | agent-usage-reminder, category-skill-reminder      |

### 5.3 Merged Hook Inventory

OMOC provides 40+ hooks. AIOS adds methodology-specific hooks:

**OMOC Core Hooks (kept unchanged):**

- `context-window-monitor` - Token limit management
- `session-recovery` - Crash recovery
- `session-notification` - User notifications
- `tool-output-truncator` - Output size management
- `todo-continuation-enforcer` - Task tracking
- `stop-continuation-guard` - Safety stop
- `rules-injector` - Dynamic rules injection
- `atlas` - Orchestrator integration
- `edit-error-recovery` - Fix edit failures
- `delegate-task-retry` - Subagent retry logic
- `anthropic-effort` - Model effort control
- `preemptive-compaction` - Context compaction
- `unstable-agent-babysitter` - Agent monitoring
- `ralph-loop` - Autonomous execution loop
- And 25+ more...

**AIOS Enhancement Hooks (to add):**

- `story-workflow-enforcer` - Story methodology compliance
- `quality-gate-validator` - QA gate enforcement
- `acceptance-criteria-tracker` - AC verification
- `skill-execution-logger` - Skill usage tracking

### 5.4 Hook Registration

```typescript
// From src/hooks/index.ts
export {
  // Core OMOC hooks
  createContextWindowMonitorHook,
  createSessionRecoveryHook,
  createTodoContinuationEnforcer,
  createStopContinuationGuardHook,
  createRulesInjectorHook,
  createAtlasHook,
  // ... 35+ more
};
```

---

## 6. Skill System Design

### 6.1 Skill Architecture

Open-AIOS uses a **hierarchical skill discovery system**:

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
│  5. OpenCode Project Skills ← AIOS INJECTED HERE             │
│     → ./.opencode/skills/                                    │
│     → layer/aios/payload/skills/ symlinked/copied            │
│     → 176+ AIOS skills available                             │
│                                                              │
│  6. Plugin Config Skills                                     │
│     → opencode.json skills array                             │
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
│  (opencode-skill-    │    layer/aios/payload/skills/
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

AIOS introduces story-driven development to OMOC:

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

| OMOC Feature                 | AIOS Enhancement                 |
| ---------------------------- | -------------------------------- |
| `todo-continuation-enforcer` | Story checkbox tracking          |
| `delegate-task`              | Skill-based subagent dispatch    |
| `session-recovery`           | Story state persistence          |
| `atlas` hook                 | Orchestrator workflow management |
| `rules-injector`             | AIOS methodology rules           |

---

## 8. Build System

### 8.1 Bun Runtime

Open-AIOS uses **Bun** as the primary runtime:

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
    "build:binary": "bun build --compile ./bin/open-aios.js --outfile=dist/open-aios",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "lint": "eslint src/"
  }
}
```

### 8.3 Plugin Distribution

The Open-AIOS plugin is distributed via npm:

```
npm install -g @synkra/open-aios

# Or local project install
npm install --save-dev @synkra/open-aios
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
│  2. GLOBAL CONFIG (~/.opencode.json)                        │
│     → User-level OpenCode configuration                    │
│     → Model providers, MCP servers                         │
│                                                              │
│  3. PLUGIN DEFAULTS (src/config.ts)                         │
│     → Open-AIOS default settings                           │
│     → Hook enable/disable                                  │
│                                                              │
│  4. PROJECT CONFIG (./opencode.json)                        │
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
| `.opencode/`         | Runtime workspace | `open-aios init`        |
| `.opencode/agents/`  | Agent manifests   | Generated               |
| `.opencode/skills/`  | Project skills    | Copied from layer/aios/ |
| `.opencode/rules/`   | Methodology rules | Copied from layer/aios/ |
| `.aios-core/`        | Framework state   | Runtime                 |
| `docs/stories/`      | Story files       | User + @sm              |
| `docs/architecture/` | ADRs and design   | User + @architect       |

### 9.3 Key Configuration Files

```yaml
# opencode.json (project-level)
{
  "name": "my-project",
  "version": "1.0.0",
  "aios": { "enabled": true, "storyDriven": true },
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

AIOS adds quality gates to OMOC's existing safety mechanisms:

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

See `docs/migration/open-aios-migration-plan.md` for detailed migration steps.

### 11.1 High-Level Migration Strategy

```
Phase 0: Baseline (DONE)
├── Verify OMOC engine stability
├── Lock engine directories
└── Document upstream sync strategy

Phase 1: AIOS Layer Import (DONE)
├── Import skills to layer/aios/
├── Import rules and templates
└── Create story templates

Phase 2: Installer Integration (IN PROGRESS)
├── Add 'open-aios init' command
├── Merge installer capabilities
└── Handle existing config preservation

Phase 3: Agent Overlay (PARTIAL)
├── kord/deep aliases (DONE)
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

**Decision**: Keep OMOC engine unchanged, layer AIOS on top

**Rationale**:

- OMOC is battle-tested with 40+ hooks
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

**Decision**: Use `.opencode/` for runtime, `.aios-core/` for content

**Rationale**:

- Follows OMOC conventions
- Clear separation between engine and content
- `.opencode/` is OpenCode standard
- `.aios-core/` is AIOS-specific

**Trade-offs**:

- (+) Convention compatibility
- (-) Two config directories to manage

### ADR-004: Skill Discovery

**Decision**: Extend OMOC skill loader to include AIOS skills

**Rationale**:

- Reuses working infrastructure
- Maintains compatibility
- Hierarchical discovery works well

**Trade-offs**:

- (+) No new code needed
- (-) Skill format must align with OMOC expectations

### ADR-005: Agent Prompt Format

**Decision**: Keep OMOC's dynamic-agent-prompt-builder

**Rationale**:

- Sophisticated variant resolution
- Model-specific prompt adaptation
- Already handles skill injection

**Trade-offs**:

- (+) Proven system
- (-) AIOS agent definitions need OMOC format

### ADR-006: Hook Merge Strategy

**Decision**: Keep all OMOC hooks, add AIOS-specific ones

**Rationale**:

- OMOC hooks are battle-tested
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
| `layer/aios/payload/skills/`                 | AIOS skill runbooks  |
| `docs/migration/open-aios-migration-plan.md` | Migration details    |

### B. External References

- [OMOC Documentation](https://github.com/oh-my-opencode/oh-my-opencode)
- [OpenCode Plugin API](https://opencode.ai/docs/plugins)
- [Bun Documentation](https://bun.sh/docs)

### C. Glossary

| Term  | Definition                                     |
| ----- | ---------------------------------------------- |
| OMOC  | Oh My OpenCode - the base engine               |
| AIOS  | AI Orchestrated System - the methodology layer |
| Skill | A reusable workflow runbook                    |
| Hook  | Lifecycle interception point                   |
| Story | A trackable development unit                   |
| Gate  | A quality checkpoint                           |

---

_Document Version: 1.0.0_  
_Last Updated: 2026-02-07_  
_Author: @architect (Oracle)_
