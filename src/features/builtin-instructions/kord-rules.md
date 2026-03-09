# Kord AIOS — Project Rules

This file is loaded by OpenCode via the `instructions` array in `opencode.json`.
It provides project-level rules that all Kord agents follow.

## Agent Workflow

- **Planning**: Use `/plan` to create structured work plans in `docs/kord/plans/`
- **Execution**: Use `/start-work` to execute plans via the Build orchestrator
- **Delegation**: Build delegates to specialist agents via `task()`
- **Verification**: Build verifies all subagent work before marking tasks complete

## Directory Conventions

| Path | Purpose |
|------|---------|
| `docs/kord/plans/` | Work plans (markdown) |
| `docs/kord/drafts/` | Draft plans (deleted after finalization) |
| `docs/kord/notepads/` | Agent working memory per plan |
| `.kord/templates/` | Story, ADR, and other templates |
| `.kord/checklists/` | Review and execution checklists |
| `.kord/instructions/` | Project guidance exported by `init` |
| `.kord/workflows/` | Canonical project-local workflow copies and overrides |

## Rules

1. Agents write plans and notes ONLY to `docs/kord/`
2. Implementation code goes to the project source tree
3. Use `task()` for delegation — never implement directly from Build
4. Mark plan checkboxes `- [x]` as tasks complete
5. Record learnings in `docs/kord/notepads/{plan-name}/`
6. Treat workflows as the primary execution path for greenfield and brownfield delivery
7. Treat project-local `.kord/**` and `.opencode/**` files as override layers over builtin framework content
