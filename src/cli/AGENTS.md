# CLI KNOWLEDGE BASE

## OVERVIEW

CLI entry: `bunx kord-aios`. 6 commands with Commander.js + @clack/prompts TUI.

**Commands**: install, init, doctor, run, get-local-version, status, mcp-oauth, extract, version

## STRUCTURE

```
cli/
├── index.ts              # Commander.js entry (9 commands)
├── banner.ts             # Shared banner utility
├── install.ts            # Interactive TUI (737 lines)
├── config-manager.ts     # JSONC parsing (667 lines)
├── model-fallback.ts     # Model fallback configuration
├── types.ts              # InstallArgs, InstallConfig
├── status/
│   └── index.ts          # Project status command
├── doctor/
│   ├── index.ts          # Doctor entry
│   ├── runner.ts         # Check orchestration
│   ├── formatter.ts      # Colored output
│   ├── constants.ts      # Check IDs, symbols
│   ├── types.ts          # CheckResult, CheckDefinition
│   └── checks/           # 14 checks, 23 files
│       ├── version.ts    # OpenCode + plugin version
│       ├── config.ts     # JSONC validity, Zod
│       ├── auth.ts       # Anthropic, OpenAI, Google
│       ├── dependencies.ts # AST-Grep, Comment Checker
│       ├── lsp.ts        # LSP connectivity
│       ├── mcp.ts        # MCP validation
│       ├── model-resolution.ts # Model resolution check (323 lines)
│       └── gh.ts         # GitHub CLI
├── run/
│   ├── index.ts          # Session launcher
│   └── events.ts         # CLI run events (325 lines)
├── mcp-oauth/
│   └── index.ts          # MCP OAuth flow
└── get-local-version/
    └── index.ts          # Version detection
```

## COMMANDS

| Command | Purpose |
|---------|---------|
| `install` | Interactive setup with provider selection |
| `init` | Initialize Kord AIOS project structure |
| `doctor` | 14 health checks for diagnostics |
| `run` | Launch session with todo enforcement |
| `get-local-version` | Version detection and update check |
| `status` | Show project status (mode, stage, configuration) |
| `extract` | Extract bundled methodology content |
| `mcp-oauth` | MCP OAuth authentication flow |
| `version` | Show version information |

## DOCTOR CATEGORIES (14 Checks)

| Category | Checks |
|----------|--------|
| installation | opencode, plugin |
| configuration | config validity, Zod, model-resolution |
| authentication | anthropic, openai, google |
| dependencies | ast-grep, comment-checker, gh-cli |
| tools | LSP, MCP |
| updates | version comparison |

## HOW TO ADD CHECK

1. Create `src/cli/doctor/checks/my-check.ts`
2. Export `getXXXCheckDefinition()` factory returning `CheckDefinition`
3. Add to `getAllCheckDefinitions()` in `checks/index.ts`

## TUI FRAMEWORK

- **@clack/prompts**: `select()`, `spinner()`, `intro()`, `outro()`
- **picocolors**: Terminal colors for status and headers
- **Symbols**: ✓ (pass), ✗ (fail), ⚠ (warn), ℹ (info)

## SCAFFOLDED TEMPLATES

The CLI scaffolds 13 template files into `.kord/templates/`:

| Template Files | Checklist Files |
|----------------|-----------------|
| story.md | checklist-story-draft.md |
| adr.md | checklist-story-dod.md |
| prd.md | checklist-pr-review.md |
| epic.md | checklist-architect.md |
| task.md | checklist-pre-push.md |
| qa-gate.md | checklist-self-critique.md |
| qa-report.md | |

## ANTI-PATTERNS

- **Blocking in non-TTY**: Always check `process.stdout.isTTY`
- **Direct JSON.parse**: Use `parseJsonc()` from shared utils
- **Silent failures**: Return `warn` or `fail` in doctor instead of throwing
- **Hardcoded paths**: Use `getOpenCodeConfigPaths()` from `config-manager.ts`
