# Kord AIOS Migration Handoff (OMOC Engine + Native AIOS Methodology)

## Goal
Build **Kord AIOS** as a fork of OMOC (kord-aios) that keeps OMOC's runtime engine (hooks/tools/runner/auth/CLI) but becomes **story-driven** (AIOS methodology + skills + gates) with Kord AIOS canonical UX naming.

## Where To Work
- Repo: `D:\dev\kord-aios`
- Branch: `kord-aios-main`
- Remotes:
  - `origin`: https://github.com/GDSDN/kord-aios.git
  - `upstream`: https://github.com/code-yeongyu/kord-aios.git

Upstream baseline used for comparison: `upstream/dev`.

## Canonical UX Model (Kord AIOS)

Primary agents (user-facing):
- `@plan` (primary): produces/updates artifacts (Story/PRD/ADR when needed) and outputs an execution brief.
- `@build` (primary): interactive orchestration of implementation from a story; delegates to specialists; calls QA gates.
- `@build-loop` (primary): autonomous batch/loop execution of story tasks with verification reminders.
- `@kord` (primary): control-plane guardian; enforces story OS discipline, skill-first routing, hook/skill governance; routes to specialists.

Subagent:
- `@deep` (subagent, invokable): deep executor; never owns scope; never self-approves story completion.

Specialists (subagents):
- `@dev`, `@qa`, `@architect`, `@pm`, `@po`, `@sm`, `@analyst`, `@data-engineer`, `@devops`, `@ux-design-expert`.

## Runtime Canonical Keys + Legacy Compatibility

Canonical runtime keys:
- `plan`, `build`, `build-loop`, `deep`, `kord`

Legacy OMOC names remain as compatibility aliases:
- `prometheus` -> `plan`
- `sisyphus` -> `build`
- `atlas` -> `build-loop`
- `hephaestus` -> `deep`
- `aios-master` -> `kord`
- `sisyphus-junior` -> `dev` (canonical runtime key is `dev`)

Key files:
- CLI resolution order + alias normalization: `src/cli/run/agent-resolver.ts`
- Runtime agent creation + alias maps + model fallback: `src/agents/utils.ts`

## Story-Driven Orchestration Contract

Contract source-of-truth:
- `docs/architecture/adr-0002-story-driven-orchestration.md`

Hooks (advisory, non-blocking):
- `src/hooks/story-workflow-enforcer/`
- `src/hooks/quality-gate-validator/`

## Star Commands (`*command`) Support

Non-blocking runtime advisory injection:
- `src/hooks/keyword-detector/`

## Tools

### `call_omo_agent`
Not a QA agent. It is a tool that spawns an allowed subagent session (sync or background). QA is included in allowlist.

Key files:
- `src/tools/call-omo-agent/constants.ts`
- `src/tools/call-omo-agent/tools.ts`

## Installer / Init

Keep OMOC auth intact. Detect OpenCode availability and guide users. Project scaffolding is per-project.

Key files:
- `src/cli/install.ts`
- `src/cli/init.ts`

## MCP

Minimal parity implemented (read-only):
- `kord-aios mcp detect`
- `kord-aios mcp status`
- Doctor check: `mcp-recommended`

## Local sanity

```bash
bun install
bun src/cli/index.ts --help
bun run typecheck
```
