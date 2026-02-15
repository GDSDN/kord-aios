> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# OMOC Agentic Flow — Complete Orchestration Analysis

> **Source**: `D:\dev\kord-aios` (stable OMOC codebase)
> **Date**: 2026-02-11
> **Purpose**: Deep study of the OMOC orchestration engine, hooks, tools, delegation, task system, user commands, and agent loop — to inform Kord AIOS reorganization.

---

## 1. Architecture Overview

OMOC is an **OpenCode plugin** (`src/index.ts`, 958 lines) that extends the OpenCode IDE with:
- **11 agents** with specialized system prompts
- **40+ lifecycle hooks** intercepting events at every stage
- **25+ tools** across 8 categories
- **3 built-in MCPs** (websearch, context7, grep_app)
- **Skill system** with 5+ builtin skills
- **Background task manager** with concurrency control
- **Boulder state** for persistent work plan tracking

### Plugin Entry Flow (`src/index.ts`)

```
Plugin loads → loadPluginConfig() → initialize hooks (40+)
  → initialize BackgroundManager → SkillMcpManager → TmuxSessionManager
  → register tools (25+) → register agents (11) → register MCPs (3)
  → register commands (7 builtin) → return Plugin config
```

---

## 2. Agent System (`src/agents/`)

### 2.1 Agent Types

| Agent | Mode | Model | Role |
|-------|------|-------|------|
| **Sisyphus** | primary | claude-opus-4-6 | Main orchestrator, task management, user-facing |
| **Atlas** | primary | claude-sonnet-4-5 | Master orchestrator for work plans, delegates all code work |
| **Prometheus** | primary | claude-opus-4-6 | Interview → Plan generation, writes `.sisyphus/plans/*.md` |
| **Metis** | subagent | claude-opus-4-6 | Pre-planning consultant, gap analysis before plan generation |
| **Momus** | subagent | gpt-5.2 | Plan reviewer, blocker-finder (not perfectionist) |
| **Oracle** | subagent | gpt-5.2 | Consultation, debugging, architecture advice |
| **Hephaestus** | subagent | gpt-5.3-codex | Autonomous deep worker, "The Legitimate Craftsman" |
| **Explore** | subagent | grok-code-fast-1 | Fast codebase grep, LSP, file reading |
| **Librarian** | subagent | glm-4.7 | Docs search, GitHub search, external research |
| **Multimodal-Looker** | subagent | gemini-3-flash | PDF/image analysis |
| **Sisyphus-Junior** | subagent | gpt-5.3-codex | Category-spawned executor for delegated tasks |

### 2.2 Dynamic Prompt Builder (`src/agents/dynamic-agent-prompt-builder.ts`, 14178 bytes)

Agents like Sisyphus and Atlas get their prompts **dynamically built** at registration time:
- Injects available categories, tools, skills, agents
- Builds delegation tables, decision matrices
- Generates category-skills delegation guide

### 2.3 Agent Registration Flow (`src/agents/utils.ts`, 18535 bytes)

Each agent is registered via `agentSources` array. The `createAgentConfig()` function:
1. Resolves model via 3-step pipeline (Override → Fallback → Default)
2. Applies agent variant (effort level)
3. Resolves tool restrictions per agent
4. Builds dynamic system prompt with available context

---

## 3. Hook System (`src/hooks/`, 40+ hooks)

### 3.1 Lifecycle Events

Hooks intercept these OpenCode events:
- `event` (session.created, session.deleted, session.idle, message.updated, etc.)
- `tool.execute.before` — modify tool args before execution
- `tool.execute.after` — modify tool output after execution
- `messages.transform` — transform message history before sending to LLM

### 3.2 Critical Orchestration Hooks

#### Atlas Hook (`src/hooks/atlas/index.ts`, 799 lines)
The **main orchestration engine**. Controls the work loop:

- **`event` handler (session.idle)**: When Atlas goes idle and has an active boulder (plan), injects continuation prompt to keep working on pending tasks
- **`tool.execute.before`**: 
  - Intercepts write/edit tools → injects delegation warning (orchestrator must NOT write code directly)
  - Intercepts `task` tool → injects single-task directive
- **`tool.execute.after`**: 
  - After write/edit → appends DIRECT_WORK_REMINDER
  - After `task` completion → transforms output with git diff stats, plan progress, orchestrator reminders

Key constants:
```
DIRECT_WORK_REMINDER — "You should have delegated this"
BOULDER_CONTINUATION_PROMPT — "Continue working on plan X, N tasks remaining"
ORCHESTRATOR_DELEGATION_REQUIRED — "Must delegate file modifications"
SINGLE_TASK_DIRECTIVE — "Execute ONE task only"
```

#### Start-Work Hook (`src/hooks/start-work/index.ts`, 243 lines)
Manages work session activation via `/start-work` command:
1. Reads `.sisyphus/plans/` to find available plans
2. Presents plan selection to user
3. Creates boulder state (active plan tracking)
4. Configures session for Atlas orchestration mode

#### Prometheus MD-Only Hook (`src/hooks/prometheus-md-only/index.ts`, 187 lines)
Restricts Prometheus (planner) to read-only operations:
- Only allows writing `.md` files in `.sisyphus/` directory
- Blocks code modification, bash execution of mutating commands
- Injects workflow reminders during plan modifications

#### Sisyphus-Junior Notepad Hook (`src/hooks/sisyphus-junior-notepad/`, 46 lines)
Injects notepad directive into delegated task prompts:
- Notepad path: `.sisyphus/notepads/{plan-name}/`
- Files: `learnings.md`, `issues.md`, `decisions.md`, `problems.md`
- Plan files are READ-ONLY for subagents

#### Todo Continuation Enforcer (`src/hooks/todo-continuation-enforcer.ts`, 518 lines)
Auto-continues work when agent goes idle with pending todos:
- 2-second countdown before injecting continuation
- Skips for prometheus, compaction agents
- Respects stop-continuation guard

#### Ralph Loop Hook (`src/hooks/ralph-loop/`)
Self-referential development loop that keeps working until completion:
- User activates with `/ralph-loop "task description"`
- Agent works autonomously, checking completion each iteration

### 3.3 Supporting Hooks

| Hook | Purpose |
|------|---------|
| `context-window-monitor` | Tracks context window usage |
| `preemptive-compaction` | Triggers compaction before overflow |
| `session-recovery` | Recovers from crashed sessions |
| `session-notification` | Notifies on session events |
| `comment-checker` | Validates code comments |
| `tool-output-truncator` | Truncates large outputs |
| `directory-agents-injector` | Injects AGENTS.md context |
| `directory-readme-injector` | Injects README context |
| `empty-task-response-detector` | Detects empty task responses |
| `think-mode` | Extended thinking support |
| `claude-code-hooks` | Claude Code compatibility |
| `anthropic-context-window-limit-recovery` | Recovery from context overflow |
| `rules-injector` | Injects project rules |
| `background-notification` | Background task notifications |
| `auto-update-checker` | Plugin update checks |
| `keyword-detector` | Detects keywords in messages |
| `agent-usage-reminder` | Reminds about agent capabilities |
| `non-interactive-env` | Handles non-interactive environments |
| `interactive-bash-session` | Interactive bash support |
| `thinking-block-validator` | Validates thinking blocks |
| `category-skill-reminder` | Reminds about skills per category |
| `auto-slash-command` | Auto-detects slash commands |
| `edit-error-recovery` | Recovers from edit errors |
| `delegate-task-retry` | Retries failed delegations |
| `task-resume-info` | Resume info for tasks |
| `question-label-truncator` | Truncates question labels |
| `subagent-question-blocker` | Blocks subagent questions to user |
| `stop-continuation-guard` | Stops continuation mechanisms |
| `compaction-context-injector` | Injects context during compaction |
| `unstable-agent-babysitter` | Monitors unstable agents |
| `tasks-todowrite-disabler` | Disables TodoWrite in certain contexts |
| `write-existing-file-guard` | Guards against overwriting existing files |
| `anthropic-effort` | Controls Anthropic effort level |
| `task-reminder` | Reminds to use task tools every 10 turns |

---

## 4. Tool System (`src/tools/`, 25+ tools)

### 4.1 Static Tools (registered directly)

| Tool | Category | Purpose |
|------|----------|---------|
| `lsp_goto_definition` | LSP | Navigate to symbol definition |
| `lsp_find_references` | LSP | Find all references to symbol |
| `lsp_symbols` | LSP | List symbols in file |
| `lsp_diagnostics` | LSP | Get diagnostics (errors/warnings) |
| `lsp_prepare_rename` | LSP | Check if rename is valid |
| `lsp_rename` | LSP | Rename symbol across codebase |
| `ast_grep_search` | Search | Structural code search (25 languages) |
| `ast_grep_replace` | Search | Structural code replace |
| `grep` | Search | Custom grep with 60s timeout, 10MB limit |
| `glob` | Search | File glob with 60s timeout, 100 file limit |
| `session_list` | Session | List sessions |
| `session_read` | Session | Read session content |
| `session_search` | Session | Search in sessions |
| `session_info` | Session | Get session info |

### 4.2 Factory Tools (context-dependent)

| Tool | Factory | Purpose |
|------|---------|---------|
| `task` / `delegate-task` | `createDelegateTask()` | **Main delegation tool** — category/agent routing |
| `call_omo_agent` | `createCallOmoAgent()` | Direct agent invocation (explore, librarian only) |
| `task_create` | `createTaskCreateTool()` | Create task in task system |
| `task_get` | `createTaskGetTool()` | Get task by ID |
| `task_list` | `createTaskList()` | List active tasks |
| `task_update` | `createTaskUpdateTool()` | Update task status |
| `background_output` | `createBackgroundOutput()` | Get background task result |
| `background_cancel` | `createBackgroundCancel()` | Cancel background task |
| `interactive_bash` | static | Tmux-based bash sessions |
| `look_at` | `createLookAt()` | Multimodal PDF/image analysis |
| `skill` | `createSkillTool()` | Execute skills |
| `skill_mcp` | `createSkillMcpTool()` | MCP operations for skills |
| `slashcommand` | `createSlashcommandTool()` | Dispatch slash commands |

### 4.3 Delegate-Task System (`src/tools/delegate-task/`, ~2500 lines)

This is the **core delegation engine**:

#### Categories (model routing)
```
visual-engineering → google/gemini-3-pro        (UI/UX/design)
ultrabrain         → openai/gpt-5.3-codex       (deep logic, complex architecture)
deep               → openai/gpt-5.3-codex       (autonomous goal-oriented)
artistry           → google/gemini-3-pro         (creative/unconventional)
quick              → anthropic/claude-haiku-4-5  (trivial, single-file)
unspecified-low    → anthropic/claude-sonnet-4-5 (moderate, unclassifiable)
unspecified-high   → anthropic/claude-opus-4-6   (substantial, unclassifiable)
writing            → google/gemini-3-flash       (docs/prose)
```

#### Delegation Flow
```
task(category="X", load_skills=["Y"], prompt="...") OR
task(subagent_type="explore", prompt="...")

1. resolveParentContext() — get parent session/agent/model
2. resolveCategoryConfig() — merge default + user category config
3. resolveSkillContent() — load skill markdown files
4. buildSystemContent() — combine skills + category prompt + plan agent prepend
5. Spawn Sisyphus-Junior with resolved config OR named subagent
6. Return result to caller
```

#### Prompt Builder (`src/tools/delegate-task/prompt-builder.ts`)
Assembles system content: plan agent prepend (if plan agent) + skill content + category prompt append.

---

## 5. Feature System (`src/features/`, 17 modules)

### 5.1 Background Agent Manager (`manager.ts`, 1556 lines)
- **Lifecycle**: `launch` → `poll` (2s interval) → `complete`
- **Stability**: 3 consecutive idle polls = complete
- **Concurrency**: Per-provider/model limits via `ConcurrencyManager`
- **Cleanup**: 30min TTL, 3min stale timeout
- **Resume**: Can resume existing session with `session_id`

### 5.2 Boulder State (`src/features/boulder-state/`)
Persistent work plan tracking:
- **Storage**: `.sisyphus/boulder.json`
- **State**: `{ active_plan, started_at, session_ids[], plan_name, agent? }`
- **Plans**: `.sisyphus/plans/{name}.md` (Prometheus writes here)
- **Notepads**: `.sisyphus/notepads/{name}/` (subagents write here)
- **Progress**: Parsed from markdown checkboxes (`- [ ]` / `- [x]`)

### 5.3 Builtin Commands (`src/features/builtin-commands/`)
| Command | Agent | Purpose |
|---------|-------|---------|
| `/start-work` | atlas | Start work session from Prometheus plan |
| `/init-deep` | (current) | Initialize hierarchical AGENTS.md |
| `/ralph-loop` | (current) | Self-referential development loop |
| `/ulw-loop` | (current) | Ultrawork loop (same as ralph) |
| `/cancel-ralph` | (current) | Cancel active Ralph Loop |
| `/refactor` | (current) | Intelligent refactoring with LSP/AST |
| `/stop-continuation` | (current) | Stop all continuation mechanisms |

### 5.4 Skill System
- **Builtin**: `playwright`, `agent-browser`, `frontend-ui-ux`, `git-master`, `dev-browser`
- **Loading priority**: `.opencode/skills/` > `~/.config/opencode/skills/` > `.claude/skills/`
- **Skill MCP Manager**: Lazy client creation, stdio/http transports, 5min idle cleanup

### 5.5 Claude Code Compatibility Layer
- **Agent Loader**: Loads `.claude/agents/*.md` or `~/.claude/agents/*.md`
- **Command Loader**: Loads `.claude/commands/**/*.md`
- **MCP Loader**: Loads `.mcp.json` with `${VAR}` expansion
- **Plugin Loader**: Loads `installed_plugins.json`
- **Session State**: Tracks main session, agent assignments per session

### 5.6 Other Features
- **Context Injector**: Injects AGENTS.md/README.md into context
- **Hook Message Injector**: Injects messages into session
- **Task Toast Manager**: Background task notifications
- **Tmux Subagent**: Tmux session management for visual terminals
- **MCP OAuth**: OAuth handling for MCP servers
- **Tool Metadata Store**: Stores metadata about tool executions

---

## 6. MCP System (`src/mcp/`)

Three-tier architecture:
1. **Built-in** (3 remote HTTP MCPs):
   - `websearch` → Exa AI / Tavily (real-time web search)
   - `context7` → Library documentation lookup
   - `grep_app` → GitHub code search
2. **Claude Code compat**: `.mcp.json` with `${VAR}` expansion
3. **Skill-embedded**: YAML frontmatter in skills defines MCP dependencies

---

## 7. Config System (`src/config/schema.ts`, 17617 bytes)

Zod-validated configuration supporting:
- Agent model overrides per agent
- Category model/variant overrides
- Hook enable/disable (`disabled_hooks[]`)
- Experimental features
- Background task config
- Tmux config
- Ralph loop config
- Notification config
- Claude Code hooks config
- Comment checker config

---

## 8. Shared Utilities (`src/shared/`, 66 files)

Key utilities:
- **Model Resolution Pipeline**: 3-step (Override → Fallback → Default) with availability checking
- **System Directives**: Typed message prefixes for hook-to-hook communication
- **Dynamic Truncator**: Token-aware context window management
- **Logger**: File-based logging to `/tmp/kord-aios.log`
- **JSONC Parser**: Comments and trailing commas support
- **Permission Compat**: Agent tool restriction enforcement

---

## 9. User Flow — End-to-End

### 9.1 Planning Flow
```
User asks question → Sisyphus (primary agent) handles
  → If planning needed: user activates Prometheus (plan agent)
  → Prometheus interviews user (Phase 1: Intent Classification)
  → Prometheus launches explore/librarian agents for research
  → When ready: Prometheus consults Metis for gap analysis
  → Prometheus generates plan to .sisyphus/plans/{name}.md
  → Optional: Momus reviews plan for blockers
  → User guided to /start-work
```

### 9.2 Execution Flow
```
User types /start-work [plan-name]
  → start-work hook activates
  → Lists available plans from .sisyphus/plans/
  → Creates boulder state (active_plan tracking)
  → Switches to Atlas agent (orchestrator)
  
Atlas orchestration loop:
  1. Read plan → parse checkboxes → build parallelization map
  2. Initialize notepad (.sisyphus/notepads/{name}/)
  3. For each pending task:
     a. Read notepad for accumulated wisdom
     b. task(category="X", load_skills=["Y"], prompt="6-section prompt")
        → Spawns Sisyphus-Junior with category model
        → Sisyphus-Junior executes task, writes to notepad
     c. Verify: lsp_diagnostics, build, test, manual inspection
     d. If fail: resume same session (session_id) up to 3 retries
     e. Mark checkbox complete in plan
  4. When idle: atlas hook injects continuation if tasks remain
  5. Final report: files modified, accumulated wisdom, completion status
```

### 9.3 Continuation Mechanisms
Three layers ensure work continues:
1. **Atlas Hook (session.idle)**: Injects boulder continuation when plan has pending tasks
2. **Todo Continuation Enforcer**: Injects continuation when todos are pending
3. **Ralph Loop**: Self-referential loop until user-defined completion

---

## 10. Key Design Decisions

### 10.1 Orchestrator Never Writes Code
Atlas hook **actively prevents** the orchestrator from writing code:
- `tool.execute.before`: Injects warnings on write/edit tools
- `tool.execute.after`: Appends reminders after direct file modifications
- All code work MUST go through `task()` delegation

### 10.2 Subagents Are Stateless
- Notepad system (`.sisyphus/notepads/`) compensates for statelessness
- Atlas reads notepad before EVERY delegation
- Subagents append findings (never overwrite)

### 10.3 Plan File Is Sacred
- Only Prometheus writes plans
- Only Atlas marks checkboxes
- Subagents may READ but NEVER modify the plan

### 10.4 Session Resume for Failures
- Every `task()` returns a `session_id`
- Failed tasks resume with same session (preserves context, saves tokens)
- Maximum 3 retries before documenting and moving on

### 10.5 Category-Based Model Routing
- Categories map to specific models optimized for the work type
- User can override via config
- Fallback chains ensure availability

---

## 11. File System Artifacts

```
.sisyphus/
├── boulder.json              # Active plan state
├── plans/
│   └── {plan-name}.md        # Prometheus-generated work plans
└── notepads/
    └── {plan-name}/
        ├── learnings.md      # Patterns, conventions, successful approaches
        ├── issues.md         # Problems, blockers, gotchas
        ├── decisions.md      # Architectural choices and rationales
        └── problems.md       # Unresolved issues, technical debt
```

---

## 12. Summary — What OMOC's Engine Provides

| Capability | Implementation |
|-----------|----------------|
| **Orchestration** | Atlas hook + boulder state + plan progress tracking |
| **Delegation** | delegate-task tool with category/agent routing |
| **Planning** | Prometheus agent + Metis consultation + Momus review |
| **Task Management** | task_create/get/list/update tools + todo sync |
| **Continuation** | 3-layer: atlas idle, todo enforcer, ralph loop |
| **Context Preservation** | Notepad system, session resume |
| **Code Quality** | LSP diagnostics, AST-grep, build/test verification |
| **Background Work** | BackgroundManager with concurrency control |
| **Model Optimization** | Category-based routing, fallback chains |
| **Skill Injection** | Skills loaded into subagent system prompts |
