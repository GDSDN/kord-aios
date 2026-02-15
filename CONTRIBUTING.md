# Contributing to Kord AIOS

Thanks for contributing! This guide covers everything you need to get started.

> **Naming**: The project is **Kord AIOS**. The npm package is `kord-aios`. The config file is `kord-aios.json`. See [AGENTS.md](AGENTS.md) for the full naming convention.

## Table of Contents

- [Language Policy](#language-policy)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Publishing](#publishing)

## Language Policy

**English only.** All issues, PRs, commits, code comments, and documentation must be in English. Broken English is fine — we'll help fix it. Non-English content may be closed with a request to resubmit.

## Getting Started

### Prerequisites

- **Bun** (latest) — the only supported package manager
- **TypeScript 5.7.3+** — for type checking and declarations
- **OpenCode 1.0.150+** — for testing the plugin

### Setup

```bash
git clone https://github.com/GDSDN/kord-aios.git
cd kord-aios
bun install
bun run build
```

### Testing Locally

1. Build: `bun run build`
2. Point OpenCode to your local build in `~/.config/opencode/opencode.json`:
   ```json
   {
     "plugin": [
       "file:///absolute/path/to/kord-aios/dist/index.js"
     ]
   }
   ```
   Remove `"kord-aios"` from the array if present (avoids conflict with npm version).
3. Restart OpenCode.

## Project Structure

```
kord-aios/
├── src/
│   ├── agents/           # 20+ AI agents (Kord, Dev, Architect, PM, QA, etc.)
│   ├── hooks/            # 40+ lifecycle hooks
│   ├── tools/            # 25+ tools (LSP, AST-Grep, delegation, background tasks)
│   ├── features/         # Squads, skills, background agents, Claude Code compat
│   │   ├── squad/        # Squad system (SQUAD.yaml v2 schema, loader, factory)
│   │   ├── builtin-skills/   # 144 methodology skills (SKILL.md files)
│   │   ├── builtin-squads/   # Built-in squad definitions
│   │   ├── builtin-commands/ # Slash command templates
│   │   ├── background-agent/ # Async task lifecycle and concurrency
│   │   ├── context-injector/ # AGENTS.md/README/rules injection
│   │   └── ...           # Claude Code loaders, MCP OAuth, tmux, etc.
│   ├── mcp/              # Built-in MCPs (websearch, context7, grep_app)
│   ├── config/           # Zod schemas and TypeScript types
│   ├── plugin-handlers/  # Config loading, JSONC parsing, migration
│   ├── shared/           # Cross-cutting utilities
│   ├── cli/              # CLI installer, doctor, project detector
│   └── index.ts          # Main plugin entry
├── script/               # Build utilities (build-schema.ts, publish.ts)
├── packages/             # Platform-specific binaries
├── docs/                 # User guides, architecture, research
└── dist/                 # Build output (ESM + .d.ts)
```

Each directory has an `AGENTS.md` knowledge base file explaining its purpose, structure, and how to make changes. **Read those first.**

## Development Workflow

### Build Commands

```bash
bun run typecheck      # Type check only
bun run build          # Full build (ESM + .d.ts + JSON schema)
bun run rebuild        # Clean + build
bun run build:schema   # Schema only (after editing src/config/schema.ts)
bun test               # Run all tests
```

### Conventions

| Convention | Rule |
|------------|------|
| Package Manager | **Bun only** — never npm or yarn |
| Types | `bun-types` — never `@types/node` |
| Directories | kebab-case |
| Hooks | `createXXXHook()` factory pattern |
| Tools | Directory with `index.ts`, `types.ts`, `constants.ts`, `tools.ts` |
| Exports | Barrel pattern via `index.ts` |
| Temperature | 0.1 for code agents, max 0.3 |

### Forbidden

- `as any`, `@ts-ignore`, `@ts-expect-error`
- Empty catch blocks
- Direct `bun publish` (CI only)
- Local version bumps in `package.json`
- AI-generated comment bloat

## Testing

**TDD is mandatory.** RED → GREEN → REFACTOR:

1. **RED**: Write test first → `bun test` → must FAIL
2. **GREEN**: Implement minimum code → must PASS
3. **REFACTOR**: Clean up → stay GREEN

Test files live alongside source: `my-module.test.ts` next to `my-module.ts`. Use BDD comments: `//#given`, `//#when`, `//#then`.

**Never delete failing tests** — fix the code instead.

## Making Changes

### Adding a New Agent

1. Create `src/agents/my-agent.ts` with agent config
2. Add to `agentSources` in `src/agents/utils.ts`
3. Write tests
4. Run `bun run build:schema`

See `src/agents/AGENTS.md` for detailed patterns.

### Adding a New Hook

1. Create directory `src/hooks/my-hook/`
2. Implement `createMyHook()` factory
3. Register in `src/hooks/index.ts`

See `src/hooks/AGENTS.md` for hook types and lifecycle events.

### Adding a New Tool

1. Create directory `src/tools/my-tool/` with `index.ts`, `types.ts`, `constants.ts`, `tools.ts`
2. Register in `src/tools/index.ts`

See `src/tools/AGENTS.md` for tool patterns.

### Adding a New Skill

1. Create directory `src/features/builtin-skills/skills/my-skill/`
2. Create `SKILL.md` with YAML frontmatter and methodology instructions
3. Automatically discovered — no code changes needed

See `src/features/builtin-skills/AGENTS.md` for SKILL.md format.

### Adding a New Squad

1. Create directory `src/features/builtin-squads/my-squad/`
2. Create `SQUAD.yaml` following v2 schema
3. Automatically discovered — no code changes needed

See `src/features/squad/AGENTS.md` for SQUAD.yaml v2 schema.

### Adding a New MCP Server

1. Create configuration in `src/mcp/`
2. Add to `createBuiltinMcps()` in `src/mcp/index.ts`

See `src/mcp/AGENTS.md` for MCP patterns.

## Pull Request Process

**All PRs must target `dev`.** PRs to `master` are automatically rejected.

1. Fork and branch from `dev`
2. Make changes following conventions
3. Verify:
   ```bash
   bun run typecheck
   bun run build
   bun test
   ```
4. Test locally with OpenCode
5. Commit with clear, present-tense messages ("Add feature", "Fix #123")
6. Push and open PR → `dev`

### PR Checklist

- [ ] Code follows project conventions
- [ ] `bun run typecheck` passes
- [ ] `bun run build` succeeds
- [ ] Tests written (TDD) and passing
- [ ] Tested locally with OpenCode
- [ ] AGENTS.md updated if structure changed
- [ ] No version changes in `package.json`

## Publishing

Publishing is handled exclusively through GitHub Actions workflow_dispatch:

```bash
gh workflow run publish -f bump=patch  # or minor/major
```

**Never** run `bun publish` directly. **Never** modify `package.json` version locally.
