# Kord AIOS Features

> Source of truth: all data below is derived from the actual source code at `src/`.
> Last audited against: `src/agents/types.ts`, `src/agents/utils.ts`, `src/shared/model-requirements.ts`, `src/hooks/`, `src/tools/`, `src/features/builtin-commands/`, `src/features/builtin-skills/`, `src/mcp/`.

---

## Agents

Kord AIOS ships **18 registered agents** (`BuiltinAgentName` in `src/agents/types.ts`) plus the **Plan** agent (registered via `kord_agent` config) and **Dev-Junior** (spawned dynamically by the Build orchestrator). Total: **20 agents**.

Every agent has a **fallback chain** — if your preferred model is unavailable, Kord auto-selects the next available model from connected providers.

### Primary Agents

These three respect the UI model picker selection.

| Agent | Default Model | Fallback Chain | Role |
|-------|--------------|----------------|------|
| **Kord** | `claude-opus-4-6` | kimi-k2.5 → glm-4.7 | AIOS Master Orchestrator. Plans, delegates, and executes complex tasks using specialized subagents. Todo-driven workflow with extended thinking (32k budget). Aggressive parallel execution. |
| **Dev** | `gpt-5.3-codex` | *(none — requires OpenAI/GitHub Copilot/OpenCode provider)* | Autonomous deep worker. Goal-oriented execution with thorough research before action. Completes tasks end-to-end without premature stopping. Only activates when gpt-5.3-codex is available. |
| **Build** | `kimi-k2.5` | claude-sonnet-4-5 → gpt-5.2 → gemini-3-pro | Execution Orchestrator. Runs planned work sessions, manages wave execution, delegates to Dev-Junior executors. Started via `/start-work`. |

### Planning Agents

| Agent | Default Model | Fallback Chain | Role |
|-------|--------------|----------------|------|
| **Plan** | `claude-opus-4-6` | kimi-k2.5 → gpt-5.2 → gemini-3-pro | Strategic planner with interview mode. Interviews the user, gathers context via librarian/explore, then generates structured work plans on request. Markdown-only output (enforced by `plan-md-only` hook). |
| **Analyst** | `claude-opus-4-6` | kimi-k2.5 → gpt-5.2 → gemini-3-pro | Pre-planning analysis. Identifies hidden intentions, ambiguities, and AI failure points before plan generation. |
| **Plan-Analyzer** | `claude-opus-4-6` | kimi-k2.5 → gpt-5.2 → gemini-3-pro | Deep plan analysis. Works alongside Analyst to provide thorough examination of plan feasibility and gaps. |
| **Plan-Reviewer** | `gpt-5.2` | claude-opus-4-6 → gemini-3-pro | Plan validation. Checks plans against clarity, verifiability, and completeness standards. |
| **QA** | `gpt-5.2` | claude-opus-4-6 → gemini-3-pro | Quality assurance review. Validates plans and execution output against defined standards. |

### Specialist Agents

| Agent | Default Model | Fallback Chain | Role |
|-------|--------------|----------------|------|
| **Architect** | `gpt-5.2` | gemini-3-pro → claude-opus-4-6 | Architecture decisions, code review, debugging. **Read-only** — cannot write, edit, or delegate. |
| **Librarian** | `glm-4.7` | glm-4.7-free → claude-sonnet-4-5 | Multi-repo analysis, documentation lookup, OSS implementation examples. Evidence-based answers. Cannot write or delegate. |
| **Explore** | `grok-code-fast-1` | claude-haiku-4-5 → gpt-5-nano | Fast codebase exploration and contextual grep. Cannot write or delegate. |
| **Vision** | `gemini-3-flash` | gpt-5.2 → glm-4.6v → kimi-k2.5 → claude-haiku-4-5 → gpt-5-nano | Visual content specialist. Analyzes PDFs, images, and diagrams. Allowlist-only tools: read, glob, grep. |

### Methodology Agents

Full development team roles that participate in the story-driven pipeline.

| Agent | Role |
|-------|------|
| **PM** | Project Manager — epic structuring, wave planning, pipeline context. |
| **PO** | Product Owner — quality gate before dev execution, acceptance criteria. |
| **SM** | Scrum Master — stateless dev agent awareness, process governance. |
| **DevOps** | Infrastructure, CI/CD, deployment automation. |
| **Data-Engineer** | Database design, migrations, data pipelines. |
| **UX-Design-Expert** | UX/UI design expertise, user research, design system guidance. |
| **Squad-Creator** | Creates specialized agent squads for specific domains (SQUAD.yaml v2). |

### Execution Agent

| Agent | Default Model | Role |
|-------|--------------|------|
| **Dev-Junior** | `claude-sonnet-4-5` | Category-spawned focused task executor. Atomic implementation, single-file changes, bug fixes. Model-adaptive prompts (GPT vs Claude variants). Cannot use `task` tool (no re-delegation), but can use `call_kord_agent` for explore/librarian. Temperature 0.1. |

### Invoking Agents

Kord invokes subagents automatically based on task context, but you can call them explicitly:

```
Ask @architect to review this design
Ask @librarian how authentication is implemented in the Express routes
Ask @explore to find all usages of createUser
Ask @vision to analyze this diagram
```

### Background Agents

Run agents in the background while continuing your work:

```
task(subagent_type="explore", prompt="Find auth implementations", run_in_background=true)

# Continue working — system notifies on completion

background_output(task_id="bg_abc123")  # Retrieve results when ready
```

Concurrency is managed per-model/provider with configurable limits in `background_task` config.

#### Tmux Multi-Agent Visualization

Enable `tmux.enabled` to see background agents in separate tmux panes:

```json
{
  "tmux": {
    "enabled": true,
    "layout": "main-vertical"
  }
}
```

Background agents spawn in new panes, showing live output. Auto-cleanup on completion. See [Tmux Integration](configurations.md#tmux-integration).

### Delegation Categories

Tasks delegated via the `task` tool are routed through categories, each with its own model fallback chain and prompt behavior:

| Category | Model Priority | Use Case |
|----------|---------------|----------|
| **visual-engineering** | gemini-3-pro → claude-opus-4-6 → glm-4.7 | UI/UX, frontend, design system work |
| **ultrabrain** | gpt-5.3-codex → gemini-3-pro → claude-opus-4-6 | Deep logical reasoning, complex architecture |
| **deep** | gpt-5.3-codex → claude-opus-4-6 → gemini-3-pro | Requires gpt-5.3-codex availability |
| **artistry** | gemini-3-pro → claude-opus-4-6 → gpt-5.2 | Highly creative/artistic tasks |
| **quick** | claude-haiku-4-5 → gemini-3-flash → gpt-5-nano | Small, fast tasks (less capable model) |
| **writing** | gemini-3-flash → claude-sonnet-4-5 → glm-4.7 → gpt-5.2 | Documentation, copy, content |
| **unspecified-low** | claude-sonnet-4-5 → gpt-5.3-codex → gemini-3-flash | General tasks, low priority |
| **unspecified-high** | claude-opus-4-6 → gpt-5.2 → gemini-3-pro | General tasks, high priority |

Custom categories can be defined in `kord-aios.json` under the `categories` key — model, temperature, variant, reasoning effort, and prompt append are all configurable per category.

Customize agent models, prompts, and permissions in `kord-aios.json`. See [Configuration](configurations.md#agents).

---

## Skills

Skills provide specialized knowledge and workflows as `SKILL.md` files with YAML frontmatter. Skills can embed their own MCP servers and are injected into agent prompts when triggered.

### Hardcoded Skills (5)

Always available, loaded from `src/features/builtin-skills/skills/`:

| Skill | Trigger | Description |
|-------|---------|-------------|
| **playwright** | Browser tasks, testing, screenshots | Browser automation via Playwright MCP. Default browser provider. |
| **agent-browser** | *(alternative to playwright)* | Vercel's agent-browser CLI. Activated via `browser_automation_engine.provider: "agent-browser"`. |
| **frontend-ui-ux** | UI/UX tasks, visual changes | Designer-turned-developer persona. Bold aesthetics, distinctive typography, cohesive palettes. Anti-patterns: generic fonts, predictable layouts, purple-on-white AI slop. |
| **git-master** | commit, rebase, squash, blame, bisect | Atomic commits with automatic splitting, rebase/squash workflows, history archaeology. Detects repo commit style automatically. |
| **dev-browser** | Developer browser tasks | Browser automation for development workflows. |

### Kord AIOS Methodology Skills (144)

Loaded dynamically from `src/features/builtin-skills/skills/kord-aios/` across **13 domains**:

| Domain | Count | Examples |
|--------|-------|----------|
| **qa** | 22 | qa-review-build, qa-backlog-add-followup, quality assurance workflows |
| **database** | 21 | db-bootstrap, db-apply-migration, db-rls-audit, db-schema-audit, db-supabase-setup, db-seed, db-rollback, setup-database |
| **analysis** | 17 | advanced-elicitation, analyze-brownfield, analyze-framework, architect-analyze-impact, calculate-roi, spec-write-spec |
| **dev-workflow** | 15 | dev-backlog-debt, development workflow utilities |
| **design-system** | 13 | audit-codebase, audit-tailwind-config, bootstrap-shadcn-library |
| **story** | 12 | Story-driven development lifecycle |
| **documentation** | 10 | Documentation generation and maintenance |
| **devops** | 9 | CI/CD, deployment, infrastructure skills |
| **squad** | 7 | create-agent, squad-creator-create, squad-creator-design |
| **utilities** | 7 | Cross-cutting utility skills |
| **product** | 6 | po-backlog-add, product management workflows |
| **worktrees** | 3 | Git worktree management |
| **mcp** | 2 | search-mcp, MCP integration skills |

Total: **149 skills** (5 hardcoded + 144 methodology).

### Browser Automation

Two providers, configurable via `browser_automation_engine.provider`:

**Playwright MCP (default)**:
```
/playwright Navigate to example.com and take a screenshot
```

**Agent Browser CLI (Vercel)**:
```json
{ "browser_automation_engine": { "provider": "agent-browser" } }
```
Requires: `bun add -g agent-browser`

Both support: navigation, screenshots, PDFs, form filling, clicking, waiting, scraping.

### Custom Skills

Load from multiple sources (merged at startup):
- `.opencode/skills/*/SKILL.md` (project)
- `~/.config/opencode/skills/*/SKILL.md` (user)
- `.claude/skills/*/SKILL.md` (Claude Code compat)
- `~/.claude/skills/*/SKILL.md` (Claude Code user)

Disable any skill via `disabled_skills: ["skill-name"]` in `kord-aios.json`.

---

## Commands

12 slash-triggered workflows. Each executes a predefined template.

### Built-in Commands

| Command | Description |
|---------|-------------|
| `/init-deep` | Initialize hierarchical AGENTS.md knowledge base throughout the project |
| `/ralph-loop` | Self-referential development loop — agent works until task completion (default max: 100 iterations) |
| `/ulw-loop` | Ultrawork loop — same as ralph-loop but at maximum intensity (parallel agents, background tasks) |
| `/cancel-ralph` | Cancel the active Ralph/ULW loop |
| `/refactor` | Intelligent refactoring with LSP rename, AST-grep patterns, architecture analysis, and TDD verification |
| `/start-work` | Start Build execution from a Plan-generated work plan. Routes to Build agent. |
| `/stop-continuation` | Stop all continuation mechanisms (ralph loop, todo continuation, boulder) for the current session |
| `/checkpoint` | Trigger a @po checkpoint decision on current execution |
| `/status` | Show current plan progress, wave, and pending items |
| `/squad` | Switch active squad context (`/squad <squad-name>`) |
| `/squad-create` | Create a new specialized agent squad for a domain |
| `/modelconfig` | View and configure model routing per agent (fallback slots, static/dynamic mode) |

### Command Details

**/init-deep** — `[--create-new] [--max-depth=N]`
Creates directory-specific AGENTS.md context files that agents automatically read when working in those directories.

**/ralph-loop** — `"task description" [--completion-promise=TEXT] [--max-iterations=N]`
Named after Anthropic's Ralph Wiggum plugin. Agent works continuously, detects `<promise>DONE</promise>` for completion. Auto-continues if agent stops without completing. Configure: `ralph_loop.enabled`, `ralph_loop.default_max_iterations`.

**/refactor** — `<target> [--scope=<file|module|project>] [--strategy=<safe|aggressive>]`
LSP-powered rename/navigation, AST-grep pattern matching, architecture analysis, TDD verification, codemap generation.

**/start-work** — `[plan-name]`
Uses Build agent to execute planned work systematically with wave-based execution.

### Custom Commands

Load from:
- `.opencode/commands/*.md` (project)
- `~/.config/opencode/commands/*.md` (user)
- `.claude/commands/*.md` (Claude Code compat)
- `~/.claude/commands/*.md` (Claude Code user)

Disable via `disabled_commands: ["ralph-loop"]` in `kord-aios.json`.

---

## Hooks

**40 lifecycle hooks** that intercept and modify agent behavior. Located in `src/hooks/`, each in its own directory.

### Hook Events

| Event | When | Capabilities |
|-------|------|-------------|
| **PreToolUse** | Before tool execution | Block tool, modify input, inject context |
| **PostToolUse** | After tool execution | Add warnings, modify output, inject messages |
| **UserPromptSubmit** | When user submits prompt | Block, inject messages, transform prompt |
| **Stop** | When session goes idle | Inject follow-up prompts, trigger continuation |

### All 40 Hooks

#### Context & Injection (5)

| Hook | Event | What it does |
|------|-------|-------------|
| **directory-agents-injector** | PostToolUse | Auto-injects AGENTS.md when reading files (walks file → project root). Auto-disabled when OpenCode 1.1.37+ native injection is available. |
| **directory-readme-injector** | PostToolUse | Auto-injects README.md for directory context. |
| **rules-injector** | PostToolUse | Injects rules from `.claude/rules/` when glob conditions match. Supports `alwaysApply`. |
| **compaction-context-injector** | Stop | Preserves critical context during session compaction. |
| **category-skill-reminder** | PostToolUse | Reminds agents about available category-specific skills. |

#### Orchestration & Execution (6)

| Hook | Event | What it does |
|------|-------|-------------|
| **build** | All | Main orchestration logic (771 lines). Manages Build agent work sessions. |
| **executor-resolver** | PostToolUse | Resolves which executor agent handles a delegated task, with custom skill→executor mapping. |
| **start-work** | PostToolUse | Handles `/start-work` command execution. |
| **wave-checkpoint** | PostToolUse | Wave checkpoint management — auto or interactive mode for @po review between waves. |
| **story-lifecycle** | PostToolUse | Story-driven development lifecycle management with state transitions. |
| **quality-gate** | PostToolUse | Quality gate enforcement with configurable max iterations. |

#### Productivity & Control (5)

| Hook | Event | What it does |
|------|-------|-------------|
| **keyword-detector** | UserPromptSubmit | Activates modes: `ultrawork`/`ulw` (max performance), `search`/`find` (parallel exploration), `analyze`/`investigate` (deep analysis). |
| **think-mode** | UserPromptSubmit | Auto-detects extended thinking needs ("think deeply", "ultrathink"). |
| **auto-slash-command** | UserPromptSubmit | Auto-executes slash commands from prompts. |
| **ralph-loop** | Stop | Manages self-referential loop continuation until task completion. |
| **stop-continuation-guard** | Stop | Guards against unwanted continuation after `/stop-continuation`. |

#### Quality & Safety (6)

| Hook | Event | What it does |
|------|-------|-------------|
| **comment-checker** | PostToolUse | Reminds agents to reduce excessive comments. Ignores BDD markers, directives, docstrings. |
| **thinking-block-validator** | PreToolUse | Validates thinking blocks to prevent API errors. |
| **write-existing-file-guard** | PreToolUse | Guards against accidental file overwrites. |
| **edit-error-recovery** | PostToolUse | Recovers from edit tool failures with retry strategies. |
| **agent-authority** | PreToolUse | Enforces per-agent tool allowlists from `agent_authority.allowlist` config. |
| **subagent-question-blocker** | PreToolUse | Blocks subagents from asking the user questions (they should work autonomously). |

#### Recovery & Stability (3)

| Hook | Event | What it does |
|------|-------|-------------|
| **session-recovery** | Stop | Recovers from session errors — missing tool results, thinking block issues, empty messages. |
| **anthropic-context-window-limit-recovery** | Stop | Handles Claude context window limits gracefully. |
| **unstable-agent-babysitter** | Stop | Monitors and recovers agents that get stuck in unstable states. |

#### Notifications & UX (4)

| Hook | Event | What it does |
|------|-------|-------------|
| **auto-update-checker** | UserPromptSubmit | Checks for new Kord AIOS versions on startup. |
| **background-notification** | Stop | Notifies when background agent tasks complete. |
| **agent-usage-reminder** | PostToolUse | Reminds you to leverage specialized agents for better results. |
| **question-label-truncator** | PostToolUse | Truncates long question labels for cleaner UI. |

#### Task & Delegation (5)

| Hook | Event | What it does |
|------|-------|-------------|
| **task-reminder** | PostToolUse | Reminds agents about pending tasks. |
| **task-resume-info** | PostToolUse | Provides task resume context for continuity across sessions. |
| **tasks-todowrite-disabler** | PreToolUse | Disables TodoWrite tool during task execution (prevents conflicts). |
| **delegate-task-retry** | PostToolUse | Retries failed task delegations with fallback strategies. |
| **dev-notepad** | PostToolUse | Agent scratchpad for maintaining working notes across tool calls. |

#### Model & Provider (2)

| Hook | Event | What it does |
|------|-------|-------------|
| **anthropic-effort** | UserPromptSubmit | Adjusts Anthropic model effort settings based on task complexity. |
| **decision-logger** | PostToolUse | Logs agent decisions to configurable directory for audit/debugging. |

#### Integration & Environment (3)

| Hook | Event | What it does |
|------|-------|-------------|
| **claude-code-hooks** | All | Executes hooks from Claude Code's `settings.json`. |
| **interactive-bash-session** | PreToolUse | Manages tmux sessions for interactive CLI applications. |
| **non-interactive-env** | PreToolUse | Handles non-interactive environment constraints (CI, headless). |

#### Output Control (1)

| Hook | Event | What it does |
|------|-------|-------------|
| **plan-md-only** | PostToolUse | Enforces markdown-only output for Plan agent. |

### Claude Code Hooks Integration

Run custom scripts via Claude Code's `settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "eslint --fix $FILE" }]
      }
    ]
  }
}
```

Locations: `~/.claude/settings.json` (user), `./.claude/settings.json` (project), `./.claude/settings.local.json` (local, git-ignored).

### Disabling Hooks

```json
{ "disabled_hooks": ["comment-checker", "auto-update-checker"] }
```

---

## Tools

**20 tool modules** in `src/tools/`, providing agent capabilities beyond the standard OpenCode toolset.

### Code Intelligence

| Tool | Description |
|------|-------------|
| **lsp** | LSP operations: `lsp_diagnostics`, `lsp_prepare_rename`, `lsp_rename`, `lsp_goto_definition`, `lsp_find_references`, `lsp_symbols`. Full IDE-grade code intelligence for agents. |
| **ast-grep** | AST-aware code search (`ast_grep_search`) and replacement (`ast_grep_replace`). 25 languages supported. |
| **grep** | Enhanced code search with context-aware truncation. |
| **glob** | File pattern matching and discovery. |

### Agent Delegation & Background

| Tool | Description |
|------|-------------|
| **delegate-task** | Category-based task delegation to Dev-Junior executors. Routes via categories (visual-engineering, ultrabrain, deep, etc.) or direct agent targeting. 983 lines of routing logic. |
| **call-kord-agent** | Spawn specialized agents (explore, librarian). Supports `run_in_background`. |
| **task** | Parallel task spawning with concurrency management. |
| **background-task** | Background agent lifecycle: `background_output` (retrieve results), `background_cancel` (cancel running tasks). 734 lines. |

### Story-Driven Pipeline

| Tool | Description |
|------|-------------|
| **story-read** | Read story files and state from the pipeline. |
| **story-update** | Update story state (status transitions, progress tracking). |
| **plan-read** | Read Plan-generated work plans. |
| **decision-log** | Record and retrieve agent decisions for audit trails. |

### Session & Context

| Tool | Description |
|------|-------------|
| **session-manager** | Session operations: `session_list`, `session_read`, `session_search`, `session_info`. |
| **look-at** | Visual content analysis — examine images, screenshots, diagrams. |
| **interactive-bash** | Tmux-based terminal for TUI apps (vim, htop). Pass tmux subcommands directly. |

### Skills & Squads

| Tool | Description |
|------|-------------|
| **skill** | Invoke and manage skills programmatically. |
| **skill-mcp** | Invoke skill-embedded MCP operations with full schema discovery. |
| **squad-load** | Load squad definitions from SQUAD.yaml manifests. |
| **squad-validate** | Validate squad YAML against schema — checks kebab-case names, prompt_file existence, executor/reviewer refs. |
| **slashcommand** | Execute slash commands programmatically from agent context. |

---

## MCPs

3 built-in remote MCP servers, registered in `src/mcp/`.

### websearch

Real-time web search. Two providers:
- **Exa** (default) — works without API key, optional `EXA_API_KEY` for higher limits
- **Tavily** — requires `TAVILY_API_KEY`

Configure: `{ "websearch": { "provider": "exa" } }` or `"tavily"`.

### context7

Official documentation lookup for any library/framework via [context7.com](https://mcp.context7.com). Optional `CONTEXT7_API_KEY`.

### grep_app

Ultra-fast code search across public GitHub repos via [grep.app](https://mcp.grep.app). No API key required.

### Skill-Embedded MCPs

Skills can bring their own MCP servers via YAML frontmatter:

```yaml
---
description: Browser automation skill
mcp:
  playwright:
    command: npx
    args: ["-y", "@anthropic-ai/mcp-playwright"]
---
```

The `skill_mcp` tool invokes these with full schema discovery.

### OAuth-Enabled MCPs

Skills can define OAuth-protected remote MCP servers. Full OAuth 2.1 compliance (RFC 9728, 8414, 8707, 7591):

```yaml
---
description: My API skill
mcp:
  my-api:
    url: https://api.example.com/mcp
    oauth:
      clientId: ${CLIENT_ID}
      scopes: ["read", "write"]
---
```

Features:
- **Auto-discovery**: `/.well-known/oauth-protected-resource` (RFC 9728), fallback to `/.well-known/oauth-authorization-server` (RFC 8414)
- **Dynamic Client Registration**: RFC 7591 (clientId optional)
- **PKCE**: Mandatory for all flows
- **Token Storage**: `~/.config/opencode/mcp-oauth.json` (chmod 0600)
- **Auto-refresh**: On 401; step-up auth on 403

Pre-authenticate via CLI:
```bash
bunx kord-aios mcp oauth login <server-name> --server-url https://api.example.com
```

Disable built-in MCPs: `{ "disabled_mcps": ["websearch", "context7", "grep_app"] }`.

---

## Context Injection

### Directory AGENTS.md

Auto-injects AGENTS.md when reading files. Walks from file directory to project root, collecting all AGENTS.md files along the path:

```
project/
├── AGENTS.md              # Injected first
├── src/
│   ├── AGENTS.md          # Injected second
│   └── components/
│       ├── AGENTS.md      # Injected third
│       └── Button.tsx     # Reading this file injects all 3
```

Use `/init-deep` to generate these files automatically.

### Conditional Rules

Inject rules from `.claude/rules/` when glob conditions match:

```markdown
---
globs: ["*.ts", "src/**/*.js"]
description: "TypeScript/JavaScript coding rules"
---
- Use PascalCase for interface names
- Use camelCase for function names
```

Supports `.md` and `.mdc` files, `globs` for pattern matching, `alwaysApply: true` for unconditional rules. Walks upward from file to project root, plus `~/.claude/rules/`.

---

## Claude Code Compatibility

Full compatibility layer for Claude Code configurations, agents, commands, skills, MCPs, hooks, and plugins.

### Config Loaders

| Type | Locations |
|------|-----------|
| **Commands** | `~/.claude/commands/`, `.claude/commands/` |
| **Skills** | `~/.claude/skills/*/SKILL.md`, `.claude/skills/*/SKILL.md` |
| **Agents** | `~/.claude/agents/*.md`, `.claude/agents/*.md` |
| **MCPs** | `~/.claude/.mcp.json`, `.mcp.json`, `.claude/.mcp.json` |

MCP configs support environment variable expansion: `${VAR}`.

### Compatibility Toggles

Disable specific layers in `kord-aios.json`:

```json
{
  "claude_code": {
    "mcp": false,
    "commands": false,
    "skills": false,
    "agents": false,
    "hooks": false,
    "plugins": false
  }
}
```

| Toggle | Disables |
|--------|----------|
| `mcp` | `.mcp.json` files (keeps built-in MCPs) |
| `commands` | `~/.claude/commands/`, `.claude/commands/` |
| `skills` | `~/.claude/skills/`, `.claude/skills/` |
| `agents` | `~/.claude/agents/` (keeps built-in agents) |
| `hooks` | settings.json hooks |
| `plugins` | Claude Code marketplace plugins |

Disable specific plugins:

```json
{
  "claude_code": {
    "plugins_override": {
      "claude-mem@thedotmack": false
    }
  }
}
```
