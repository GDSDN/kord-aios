> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# OMOC ↔ AIOS Gap Analysis — Orchestration Contracts for Kord AIOS

> **Date**: 2026-02-11
> **Inputs**: `omoc-agentic-flow.md` + `aios-story-driven-flow.md`
> **Purpose**: Identify what OMOC's engine provides, what AIOS's methodology needs, and what Kord AIOS must bridge to deliver a story-driven orchestration through the OMOC plugin engine.

---

## 1. Fundamental Architecture Gap

| Dimension | OMOC Engine | AIOS Methodology | Gap |
|-----------|-------------|-------------------|-----|
| **Runtime** | Compiled TypeScript plugin (ESM) | Runtime markdown + JS scripts | AIOS scripts must become skills/hooks/tools in OMOC |
| **Agent defs** | `.ts` files with system prompts | `.md` files with YAML blocks | OMOC agents need AIOS methodology injected via skills |
| **Orchestration** | Event-driven hooks (atlas hook) | Decision-tree JS (BobOrchestrator) | Must map AIOS decision tree to OMOC hook lifecycle |
| **Delegation** | `task()` tool with category routing | TerminalSpawner with executor assignment | OMOC's `task()` already spawns subagents — compatible |
| **Config** | Zod schema (`.jsonc`) | YAML (`core-config.yaml`) | Need unified config that feeds both |

**Key insight**: OMOC is the **engine** (hooks, tools, background manager). AIOS is the **methodology** (stories, workflows, checklists, templates). Kord AIOS must load AIOS methodology into the OMOC engine.

---

## 2. Agent Contract Gaps

### 2.1 Agent Mapping

| AIOS Agent | OMOC Equivalent | Gap |
|------------|-----------------|-----|
| @pm (Morgan) | — | **NEW**: No PM agent in OMOC. Needs: epic creation, PRD management, story delegation |
| @sm (River) | — | **NEW**: No SM agent in OMOC. Needs: story creation, sprint planning |
| @po (Sarah) | — | **NEW**: No PO agent in OMOC. Needs: story validation, backlog management, checkpoints |
| @dev (Dex) | Sisyphus-Junior | **ADAPT**: SJ does task execution but lacks story-driven constraints (constitutional gates, story file updates, DoD checklist) |
| @architect (Aria) | Oracle (partial) | **ADAPT**: Oracle does consultation, but AIOS architect has authority over tech decisions + architecture docs |
| @qa (Quinn) | Momus (partial) | **ADAPT**: Momus reviews plans, not code. AIOS QA does full code review + test validation + quality gates |
| @devops (Gage) | — | **NEW**: No devops agent in OMOC. Atlas verifies but doesn't push/PR. Need exclusive push authority |
| @data-engineer (Dara) | — | **NEW**: No data agent in OMOC. Needs: schema, RLS, migration expertise |
| @analyst (Atlas-name-collision) | Librarian (partial) | **ADAPT**: Librarian searches docs, AIOS analyst does market research + requirements analysis |
| @ux-design-expert (Uma) | — | **NEW**: Category `visual-engineering` exists but no dedicated agent |
| @aios-master (Orion) | Atlas | **ADAPT**: Both are orchestrators. Atlas uses hooks, Orion uses decision tree. Must merge |
| — | Prometheus | **KEEP**: Plan generation stays as OMOC engine feature |
| — | Metis | **KEEP**: Pre-planning consultation stays |
| — | Momus | **KEEP**: Plan review stays |
| — | Hephaestus | **KEEP**: Deep autonomous worker stays |
| — | Explore | **KEEP**: Fast codebase search stays |
| — | Librarian | **KEEP**: Documentation search stays |
| — | Multimodal-Looker | **KEEP**: PDF/image analysis stays |

### 2.2 New Agents Required for Kord AIOS

1. **PM agent** — orchestrates product flow, creates epics, manages PRDs
2. **SM agent** — creates stories from epics, manages sprint backlog
3. **PO agent** — validates stories, manages acceptance criteria, checkpoints
4. **DevOps agent** — exclusive push/PR/release authority
5. **Data Engineer agent** — database specialization
6. **UX Design agent** — design specialization (beyond category routing)

### 2.3 Existing Agents That Need AIOS Methodology

- **Sisyphus-Junior → Dev**: Must learn story-driven development (constitutional gates, story file updates, DoD checklist, CodeRabbit self-healing)
- **Atlas → Master Orchestrator**: Must learn epic/wave execution, story lifecycle management, checkpoint decisions
- **Oracle → Architect**: Must gain architecture document authority, tech decision making

---

## 3. Orchestration Flow Gaps

### 3.1 Planning Phase

| What | OMOC Has | AIOS Has | Gap |
|------|----------|----------|-----|
| PRD creation | — | PM creates PRDs from templates | Need PRD creation skill |
| Epic creation | — | PM creates epics with stories | Need epic creation skill |
| Plan generation | Prometheus writes `.sisyphus/plans/*.md` | SM creates stories from epics | Plans vs Stories — different granularity |
| Interview | Prometheus interview mode | PM elicitation engine | Both exist — merge |
| Plan review | Momus reviews for blockers | — | Keep Momus |
| Pre-planning | Metis gap analysis | — | Keep Metis |

**Critical gap**: OMOC plans are flat (checkbox list). AIOS stories are structured (acceptance criteria, tasks, subtasks, Dev Agent Record). Kord AIOS needs to decide: **Does Prometheus generate plans OR stories?**

**Recommendation**: Prometheus generates **epics with wave structure** (AIOS methodology). The `/start-work` hook reads the epic EXECUTION.yaml instead of `.sisyphus/plans/`. Atlas hook orchestrates wave-by-wave.

### 3.2 Execution Phase

| What | OMOC Has | AIOS Has | Gap |
|------|----------|----------|-----|
| Task delegation | `task()` with categories | TerminalSpawner with executor assignment | Compatible — `task()` can use executor assignment logic |
| Category routing | 8 categories with model mapping | 6 executor types with keyword matching | **MERGE**: Use OMOC categories + AIOS executor rules |
| Work tracking | Boulder state (checkbox progress) | Session state + story file updates | Need story-aware state tracking |
| Continuation | 3-layer (atlas, todo, ralph) | Checkpoint decisions (GO/PAUSE/REVIEW/ABORT) | **Gap**: OMOC auto-continues, AIOS asks human. Need configurable behavior |
| Parallelism | Sequential tasks with background agents | Wave-based parallel with worktree isolation | **Gap**: OMOC lacks wave concept. Need wave executor hook |
| Quality gates | Atlas verifies (lsp, build, test) | 3-layer (pre-commit, PR, human review) | **Gap**: OMOC has no formal gate system. Need quality gate hook |
| Self-healing | — | CodeRabbit integration (max 3 iterations) | **Gap**: Need self-healing hook |
| Context accumulation | Notepad system | EpicContextAccumulator (token-controlled) | **Gap**: OMOC notepad is simple append. Need progressive summarization |

### 3.3 Completion Phase

| What | OMOC Has | AIOS Has | Gap |
|------|----------|----------|-----|
| Story completion | Mark checkbox → final report | DoD checklist → status update → QA review | **Gap**: OMOC has no DoD, no QA step |
| Git operations | — | @devops pushes, creates PR | **Gap**: OMOC doesn't manage git workflow |
| Story handoff | — | Dev → QA → PO → DevOps pipeline | **Gap**: OMOC has no handoff chain |
| Decision logging | — | decision-recorder.js, ADR format | **Gap**: OMOC doesn't log decisions |

---

## 4. Tool & Capability Gaps

### 4.1 Tools OMOC Has That AIOS Needs
- **LSP tools** (6): AIOS has no LSP integration — available via engine
- **AST-Grep** (2): AIOS has no structural search — available via engine
- **Session manager** (4): AIOS has basic session state — engine provides richer session tools
- **Background task system**: AIOS uses TerminalSpawner — engine provides managed background agents

### 4.2 Capabilities AIOS Has That OMOC Lacks

| AIOS Capability | Size | Priority for Kord |
|-----------------|------|-------------------|
| **Story manager** (story-manager.js) | 12KB | **CRITICAL** — core of story-driven flow |
| **Workflow executor** | 36KB | **CRITICAL** — development cycle engine |
| **Epic orchestration** | YAML + JS | **CRITICAL** — wave-based parallel execution |
| **Quality gate manager** | 18KB | **HIGH** — 3-layer quality system |
| **Executor assignment** | 11KB | **HIGH** — deterministic agent routing |
| **Epic context accumulator** | 12KB | **HIGH** — progressive summarization |
| **Session state persistence** | 25KB | **HIGH** — crash recovery, resume |
| **Subagent prompt builder** | 11KB | **HIGH** — loads real task files for prompts |
| **Decision recorder** | 5KB | **MEDIUM** — audit trail |
| **Gotchas memory** | 33KB | **MEDIUM** — learn from mistakes |
| **File evolution tracker** | 31KB | **MEDIUM** — track changes over time |
| **Template engine** | 7KB | **MEDIUM** — Handlebars-based doc generation |
| **Checklist runner** | 10KB | **MEDIUM** — execute validation checklists |
| **Branch manager** | 12KB | **MEDIUM** — git branch management |
| **Build orchestrator** | 32KB | **LOW** — autonomous build pipeline |
| **Semantic merge engine** | 52KB | **LOW** — intelligent merge |

---

## 5. Skill System Gap

OMOC loads skills as markdown files injected into subagent system prompts. AIOS has 200+ task files that are **executable workflows** (not just knowledge injection).

**Gap**: OMOC skills are passive (context injection). AIOS tasks are active (step-by-step execution instructions with constitutional gates, pre/post conditions, acceptance criteria).

**Resolution**: Kord AIOS skills must be **active skills** — markdown files that contain both:
1. **Knowledge** (methodology context, templates, checklists)
2. **Workflow** (executable steps with gates, conditions, expected outputs)

The OMOC skill loader already supports this — the skill content goes into the subagent's system prompt, which includes execution instructions.

---

## 6. Configuration Gap

| Setting | OMOC | AIOS | Merge Strategy |
|---------|------|------|----------------|
| Agent models | `agents.{name}.model` in `.jsonc` | Implicit in executor assignment | OMOC config wins — it has the engine |
| Categories | `categories.{name}` in `.jsonc` | EXECUTOR_ASSIGNMENT_TABLE in JS | Merge: OMOC categories + AIOS executor rules |
| Story location | — | `devStoryLocation: docs/stories` | Add to OMOC config |
| Quality gates | — | `quality-gate-config.yaml` | Add quality gate config section |
| CodeRabbit | — | Agent-level `coderabbit_integration` config | Add self-healing config section |
| Decision logging | — | `decisionLogging` config | Add decision logging section |
| User profile | — | `user_profile: bob|advanced` | Add user profile config |
| Dev always-load | — | `devLoadAlwaysFiles` list | Add as skill/agent config |

---

## 7. Recommended Contracts — Agent Interaction Protocol

### 7.1 Story Lifecycle Contract

```
[PM creates epic] → [SM creates stories] → [PO validates] →
[Dev implements] → [Self-heal] → [QA reviews] → [DevOps pushes] →
[PO checkpoint: GO/PAUSE/REVIEW/ABORT]
```

Each transition is a **contract**:

| From | To | Contract |
|------|----|----------|
| PM → SM | Epic → Stories | PM provides: epic YAML with story outlines, executor hints. SM produces: story files with acceptance criteria, tasks, subtasks |
| SM → PO | Story → Validated | SM provides: story file. PO validates: completeness, executor/quality_gate assigned, no draft |
| PO → Dev | Validated → In Progress | PO provides: approved story path. Dev reads story, implements tasks, updates Dev Agent Record |
| Dev → QA | Implemented → Reviewed | Dev provides: "Ready for Review" status, completed checklist. QA reviews: code quality, test coverage, acceptance criteria |
| QA → DevOps | Reviewed → Pushed | QA provides: approved review. DevOps pushes: branch, creates PR |
| DevOps → PO | Pushed → Checkpoint | DevOps provides: PR URL, push confirmation. PO asks: GO/PAUSE/REVIEW/ABORT |

### 7.2 Delegation Contract (OMOC Engine)

```typescript
// From Atlas (orchestrator) to any agent:
task({
  category: string,           // OMOC routing
  prompt: string,             // 6-section structured prompt
  load_skills: string[],      // Skills with methodology
  // NEW for story-driven:
  story_path?: string,        // Path to story file
  executor?: string,          // Assigned executor agent
  quality_gate?: string,      // Assigned quality gate agent
  wave_number?: number,       // Current wave
  epic_context?: string,      // Accumulated context
})
```

### 7.3 Quality Gate Contract

```
Pre-condition: Story exists, has acceptance criteria, executor assigned
Gate 1 (Pre-commit): lint + typecheck + tests + CodeRabbit CRITICAL
Gate 2 (PR): Full CodeRabbit review + regression tests
Gate 3 (Human): QA agent reviews + PO acceptance
Post-condition: Story status = "Done", all checkboxes checked, File List complete
```

---

## 8. Implementation Priority

### Phase 1: Core Story-Driven Flow (Critical)
1. **Story-aware boulder state** — extend boulder to track stories, not just plan checkboxes
2. **New agents** — PM, SM, PO, DevOps (as agent .ts files with AIOS methodology in system prompts)
3. **Story lifecycle hooks** — story validation, story completion, checkpoint decisions
4. **Executor assignment** — keyword-based agent routing in delegate-task

### Phase 2: Quality & Workflow (High)
5. **Quality gate hook** — 3-layer system integrated into tool.execute.after
6. **Wave executor** — parallel story execution with worktree isolation
7. **Epic orchestration** — wave-based execution plan parsing and tracking
8. **Self-healing hook** — CodeRabbit integration for auto-fix

### Phase 3: Context & Memory (Medium)
9. **Epic context accumulator** — progressive summarization in atlas hook
10. **Decision logging** — record architectural decisions during execution
11. **Checklist runner** — execute validation checklists as tool
12. **Template engine** — generate documents from templates

### Phase 4: Advanced (Low)
13. **Build orchestrator** — autonomous build pipeline
14. **Semantic merge** — intelligent merge for parallel branches
15. **Gotchas memory** — learn from mistakes across sessions
16. **File evolution tracker** — track changes over time

---

## 9. What MUST NOT Change in OMOC Engine

These engine capabilities are battle-tested and should be preserved:

1. **Hook lifecycle** — 40+ hooks intercept at every stage, this is the execution backbone
2. **Category-based model routing** — 8 categories with fallback chains
3. **Background agent manager** — concurrency control, polling, cleanup
4. **Session resume** — failed tasks resume with same session_id
5. **Notepad system** — subagent knowledge preservation
6. **3-step model resolution** — Override → Fallback → Default
7. **Dynamic prompt builder** — injects available context into agent prompts
8. **Skill system** — markdown files loaded into system prompts
9. **MCP three-tier architecture** — built-in, user, skill-embedded
10. **Plugin config system** — Zod-validated, JSONC, disabled_hooks

---

## 10. Summary

| Gap Category | Count | Severity |
|-------------|-------|----------|
| Missing agents | 6 new agents needed | **CRITICAL** |
| Story lifecycle | No story-driven flow | **CRITICAL** |
| Quality gates | No formal gate system | **HIGH** |
| Wave execution | No parallel wave orchestration | **HIGH** |
| Epic management | No epic/story structure | **HIGH** |
| Agent authority | No exclusive authority enforcement | **MEDIUM** |
| Decision logging | No audit trail | **MEDIUM** |
| Memory system | Basic notepad only | **MEDIUM** |
| Template engine | No document generation | **LOW** |
| Build pipeline | No autonomous build loop | **LOW** |

**Bottom line**: OMOC has the **engine** (hooks, tools, delegation, background agents). AIOS has the **methodology** (stories, workflows, checklists, templates, agent authority). Kord AIOS must wire AIOS methodology into OMOC's engine through: new agents, story-aware hooks, quality gate hooks, and active skills loaded from `.aios-core/development/tasks/`.
