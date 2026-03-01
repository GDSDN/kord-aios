> [!TIP]
>
> **Kord AIOS** — multi-model agent orchestration meets story-driven development methodology.
> Built on [Oh-My-Opencode](https://github.com/code-yeongyu/oh-my-opencode) + [Synkra AIOS](https://github.com/SynkraAI/aios-core).
> 20+ specialized agents, squads, 149 skills, background tasks, LSP/AST tooling.
> npm package: `kord-aios`.
>
> ✅ Official repository: https://github.com/GDSDN/kord-aios

> [!NOTE]
>
> **Versioning**: Kord AIOS may reset public semver to `1.x` even if earlier npm versions exist from upstream history. Always install via the npm `latest` tag unless you intentionally pin an older version.

## Contents

- [What is Kord AIOS?](#what-is-kord-aios)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Architecture](#architecture)
  - [Agents](#agents-20)
  - [Squads](#squads)
  - [Skills](#skills-149)
  - [Background Agents](#background-agents)
- [Features](#features)
  - [Commands](#commands)
  - [Hooks](#hooks-40)
  - [Tools](#tools)
  - [MCPs](#mcps-built-in)
  - [Context Injection](#context-injection)
  - [Claude Code Compatibility](#claude-code-compatibility)
- [Configuration](#configuration)
- [Uninstallation](#uninstallation)
- [Origin Story](#origin-story)
- [Contributing](#contributing)

## What is Kord AIOS?

**Kord AIOS** is a version of [Synkra AIOS](https://github.com/SynkraAI/aios-core) built on top of [Oh-My-Opencode](https://github.com/code-yeongyu/oh-my-opencode) — combining the best of both worlds: Synkra's proven agent methodology with Oh-My-Opencode's powerful plugin runtime.

Kord transforms your terminal into a full AI development team. Instead of one agent doing everything, Kord orchestrates 20+ specialized agents — each with the right model for the right job — working in parallel on your codebase.

Kord AIOS combines:
- **Engine**: OpenCode-native plugin runtime with background agents, parallel execution, LSP/AST tooling, Claude Code compatibility.
- **Methodology**: Story-driven execution, squads, quality gates, and battle-tested development skills.

> **Naming**: The project is **Kord AIOS**. The npm package is `kord-aios`. The config file is `kord-aios.json`.

## Quick Start

Include `ultrawork` (or just `ulw`) in your prompt. That's it.

Parallel agents, background tasks, deep exploration, and relentless execution activate automatically. The agent figures out the rest.

## Installation

### For Humans

Read the [Installation Guide](docs/guide/installation.md) or paste it to your LLM agent and let it handle the setup.

### For LLM Agents

Read and follow [docs/guide/installation.md](docs/guide/installation.md).

> **Note**: Use `bunx kord-aios init` for setting up new projects if you have already installed Kord AIOS globally.

## Architecture

### Agents (20+)

Kord AIOS ships a full development team. All agents are customizable — override models, temperatures, prompts, and permissions in `kord-aios.json`.

**Orchestration Layer**

| Agent | Model | Role |
|-------|-------|------|
| **Kord** | Claude Opus 4.6 | Master orchestrator — delegates, plans, reviews |
| **Dev** | GPT 5.3 Codex | Autonomous deep worker — goal-oriented, explores before acting |
| **Plan** | Claude Opus 4.6 | Strategic planner with interview and high-accuracy modes |
| **Plan Reviewer** | GPT 5.2 | Validates plan feasibility |
| **Plan Analyzer** | Claude Opus 4.6 | Pre-planning analysis |

**Specialist Layer**

| Agent | Model | Role |
|-------|-------|------|
| **Architect** | GPT 5.2 | System design, debugging, strategic consultation |
| **Librarian** | GLM 4.7 | Documentation search, open-source code exploration |
| **Explore** | Grok Code Fast 1 | Blazing fast codebase grep |
| **UX Design Expert** | Gemini 3 Pro | Frontend development and design |
| **Vision** | Gemini 3 Flash | Image/screenshot/PDF analysis |
| **Data Engineer** | — | Data pipeline methodology |
| **DevOps** | — | Infrastructure and CI/CD |

**Methodology Layer** 

| Agent | Role |
|-------|------|
| **PM** | Project Manager — epic structuring, wave planning |
| **PO** | Product Owner — quality gate before dev execution |
| **QA** | Quality assurance and test strategy |
| **SM** | Scrum Master — sprint coordination, stateless Dev awareness |
| **Analyst** | Strategic analysis and research |
| **Squad Creator** | Creates new SQUAD.yaml manifests |

### Squads

Define domain-specific agent teams via `SQUAD.yaml` manifests. Each squad declares its agents, categories for task routing, and skill dependencies. The built-in `dev` squad provides the default development team.

```yaml
# .opencode/squads/my-squad/SQUAD.yaml
name: my-squad
description: My custom agent team
agents:
  specialist:
    description: "Domain expert"
    model: anthropic/claude-sonnet-4-5
    prompt: "You are a domain specialist..."
categories:
  my-domain:
    description: "Domain-specific tasks"
```

### Skills (149)

Battle-tested development methodologies encoded as `SKILL.md` files with YAML frontmatter. Each skill is a step-by-step instruction set for a specific development domain — from Git workflows to API design to testing strategies.

Skills are loaded from:
- `src/features/builtin-skills/skills/` — shipped with the plugin
- `.opencode/skills/` — project-specific
- `~/.config/opencode/skills/` — user-global
- `.claude/skills/` — Claude Code compatible

### Background Agents

Run multiple agents in parallel with per-provider and per-model concurrency management. Kord fires off exploration tasks to cheaper, faster models while the main agent focuses on implementation.

```json
{
  "background_task": {
    "defaultConcurrency": 5,
    "providerConcurrency": { "anthropic": 3, "openai": 5 },
    "modelConcurrency": { "anthropic/claude-opus-4-6": 2 }
  }
}
```

## Features

Full documentation: [docs/guide/features.md](docs/guide/features.md) | Configuration: [docs/guide/configurations.md](docs/guide/configurations.md)

**Summary:**
- **20+ Specialized Agents** — right model for the right task, full dev team
- **Squad System** — SQUAD.yaml v2 manifests for domain-specific agent teams
- **149 Skills** — battle-tested development workflows (5 hardcoded + 144 methodology)
- **Background Agents** — parallel async execution with concurrency limits
- **LSP & AST Tools** — structural refactoring, rename, diagnostics, AST-aware search
- **40+ Lifecycle Hooks** — context injection, productivity automation, quality gates, recovery
- **12 Slash Commands** — init-deep, ralph-loop, ulw-loop, refactor, start-work, checkpoint, status, squad, and more
- **Built-in MCPs** — web search (Exa), documentation (Context7), GitHub code search (Grep.app)
- **Context Injection** — auto-inject AGENTS.md, README, conditional rules per directory
- **Claude Code Compatibility** — full compat layer for commands, skills, agents, MCPs, hooks
- **Todo Enforcer** — forces completion, no half-finished work
- **Comment Checker** — prevents AI comment bloat, keeps code human-like
- **Tmux Integration** — visual multi-agent dashboard, watch agents work in parallel
- **Story-Driven Pipeline** — wave/story execution with persistent state
- **CLI Installer** — interactive setup with project maturity detection and doctor checks

### Commands

| Command | Description |
|---------|-------------|
| `/init-deep` | Generate hierarchical AGENTS.md files throughout your project |
| `/ralph-loop` | Self-referential dev loop — runs until task is 100% complete |
| `/ulw-loop` | Ultrawork loop — ralph-loop with max parallel intensity |
| `/cancel-ralph` | Cancel active loop |
| `/refactor` | Intelligent refactoring with LSP, AST-grep, TDD verification |
| `/start-work` | Start Build agent execution from a Plan-generated plan |
| `/stop-continuation` | Stop continuation mechanisms for the current session |
| `/checkpoint` | Trigger a PO checkpoint decision on current execution |
| `/status` | Show current plan progress, wave, and pending items |
| `/squad` | Switch active squad context |
| `/squad-create` | Create a specialized squad for a domain |
| `/modelconfig` | View and configure model routing per agent |

Custom commands: `.opencode/commands/*.md` or `.claude/commands/*.md`

### Hooks (40+)

Hooks intercept agent lifecycle events: PreToolUse, PostToolUse, UserPromptSubmit, Stop.

| Category | Hooks | Purpose |
|----------|-------|--------|
| **Context** | directory-agents-injector, readme-injector, rules-injector, compaction-context-injector | Auto-inject AGENTS.md, README, rules when reading files |
| **Productivity** | keyword-detector, think-mode, ralph-loop, auto-slash-command | Activate modes (`ultrawork`/`ulw`), think deeply, loop execution |
| **Quality** | comment-checker, thinking-block-validator, edit-error-recovery | Prevent comment bloat, validate blocks, recover from failures |
| **Recovery** | session-recovery, context-window-limit-recovery, background-compaction | Handle errors, context limits, auto-compact |
| **Truncation** | grep-output-truncator, tool-output-truncator | Dynamically truncate output to keep context lean |
| **Notifications** | auto-update-checker, background-notification, session-notification | Version checks, task completion, OS notifications |

Disable specific hooks: `"disabled_hooks": ["comment-checker"]` in config.

### Tools

**LSP (IDE Features for Agents)**

| Tool | Description |
|------|-------------|
| `lsp_diagnostics` | Errors/warnings before build |
| `lsp_rename` | Rename symbol across workspace |
| `lsp_goto_definition` | Jump to definition |
| `lsp_find_references` | Find all usages |
| `lsp_symbols` | File outline or workspace search |

**AST-Grep** — `ast_grep_search` and `ast_grep_replace` for pattern search/replace across 25 languages.

**Delegation** — `task` (category-based routing: visual, business-logic, custom), `call_kord_agent` (direct spawn with `run_in_background`), `background_output` / `background_cancel`.

**Session** — `session_list`, `session_read`, `session_search`, `session_info` for browsing agent session history.

**Interactive Terminal** — `interactive_bash` for tmux-based TUI apps (vim, htop, pudb).

### MCPs (Built-in)

| MCP | Purpose |
|-----|--------|
| **websearch** | Real-time web search (Exa AI) |
| **context7** | Official documentation lookup for any library/framework |
| **grep_app** | Code search across public GitHub repos |

Skills can embed their own MCP servers via YAML frontmatter, including OAuth-protected remote MCPs with full RFC compliance.

### Context Injection

- **AGENTS.md** — auto-injected when reading files (walks file directory → project root, collecting all AGENTS.md)
- **README.md** — directory context injection
- **Conditional rules** — `.claude/rules/*.md` with glob patterns and `alwaysApply`

### Claude Code Compatibility

Full compatibility layer for Claude Code configurations:

| Type | Locations |
|------|----------|
| **Commands** | `~/.claude/commands/`, `.claude/commands/` |
| **Skills** | `~/.claude/skills/*/SKILL.md`, `.claude/skills/*/SKILL.md` |
| **Agents** | `~/.claude/agents/*.md`, `.claude/agents/*.md` |
| **MCPs** | `~/.claude/.mcp.json`, `.mcp.json` (with `${VAR}` expansion) |
| **Hooks** | `settings.json` hook execution |

Toggle features: `"claude_code": { "mcp": false, "commands": false, ... }` in config.

## Configuration

Config file: `.opencode/kord-aios.json` (project) or `~/.config/opencode/kord-aios.json` (user).

JSONC supported — comments and trailing commas work.

**What you can configure:**
- Agent models, temperatures, prompts, and tool permissions
- Background task concurrency per provider/model
- Disabled hooks, skills, agents
- Category-based task delegation routing
- Built-in MCPs (websearch, context7, grep_app)
- LSP and experimental features

See the full [Configuration Documentation](docs/configurations.md) for details.

## Uninstallation

To remove Kord AIOS:

1. **Remove the plugin from your OpenCode config**

   Edit `~/.config/opencode/opencode.json` (or `opencode.jsonc`) and remove `"kord-aios"` from the `plugin` array:

   ```bash
   jq '.plugin = [.plugin[] | select(. != "kord-aios")]' \
       ~/.config/opencode/opencode.json > /tmp/oc.json && \
       mv /tmp/oc.json ~/.config/opencode/opencode.json
   ```

2. **Remove configuration files (optional)**

   ```bash
   rm -f ~/.config/opencode/kord-aios.json
   rm -f .opencode/kord-aios.json
   ```

3. **Verify removal**

   ```bash
   opencode --version
   # Kord AIOS should no longer be loaded
   ```

## Origin Story

I wanted a disciplined way to run AI development workflows without giving up control of models and runtime behavior.

OpenCode provided the open, multi-model engine. Kord AIOS adds the orchestration and methodology layer on top: squads, story-driven execution, quality gates, and specialized agents.

**Kord AIOS is the result:** structured execution with full control over models, prompts, tools, skills, and squads.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code conventions, and PR guidelines.

## Warnings

- Requires OpenCode >= 1.0.150.
- If you're on [1.0.132](https://github.com/sst/opencode/releases/tag/v1.0.132) or older, an OpenCode bug may break config.
  - [The fix](https://github.com/sst/opencode/pull/5040) was merged after 1.0.132 — use a newer version.
