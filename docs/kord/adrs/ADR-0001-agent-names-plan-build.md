# ADR-0001: Agent Naming for Planning/Execution (plan/build vs planner/builder)

> Status: Draft
> Created: 2026-02-14

## Context

OpenCode ships native agents named `plan` and `build`.

- Primary picker lists agents where `mode !== "subagent" && !hidden`.
  - Source: `D:\dev\opencode-source\packages\opencode\src\cli\cmd\tui\context\local.tsx:37`
- The `task` tool (subagent / @-invocation list) includes agents where `mode !== "primary"`.
  - Source: `D:\dev\opencode-source\packages\opencode\src\tool\task.ts:28`

Kord AIOS currently provides its own planning and execution agents and merges them into `config.agent` during plugin initialization.

The root cause of the current breakage is not "name collision" itself, but a copied OMOC override that clobbers the plugin's own `plan`/`build` agent configs:

- `src/plugin-handlers/config-handler.ts:374` forces `build` to `{ mode: "subagent", hidden: true }`
- `src/plugin-handlers/config-handler.ts:375` overwrites `plan` with `{ mode: "subagent" }` only

Full analysis: `docs/researches/epics-15-18-study.md`.

## Decision

Decision pending.

We must choose one of:

1. Keep Kord AIOS canonical agent names as `plan` and `build` (and fix the override bug).
2. Rename Kord AIOS canonical agent names to `planner` and `builder`, and treat OpenCode-native `plan`/`build` as separate (demoted/hidden) agents.

## Decision Drivers

- Avoid confusion/collision with OpenCode-native `plan`/`build`.
- Preserve expected user flows (including OpenCode-native command/mode behavior).
- Minimize breaking changes (schema, migration, commands, hooks, tests, docs).

## Current Preference

Prefer `planner` and `builder` for Kord AIOS to create a clear distinction from OpenCode-native agents and simplify config-handler override logic.

## Consequences

Positive:

- Preserves OpenCode UX expectations around `/plan`.
- Avoids a broad breaking rename across schema, migration, commands, hooks, and tests.
- Keeps Kord AIOS documentation and mental model consistent (`@plan`, `@build`).

Negative:

- We must be careful in `src/plugin-handlers/config-handler.ts` to avoid reintroducing clobber logic when filtering OpenCode-native agents.

## Alternatives Considered

1. Keep `plan`/`build`.
   - Lowest migration surface; requires careful merge/filter logic to avoid clobber.

2. Rename to `planner`/`builder`.
   - Clear separation; requires coordinated migration across config schema, migration maps, commands/hooks/tests, and docs.

## Follow-ups

- Update EPIC-15 story S02 to explicitly implement and test the fix.
- Add regression tests to prevent reintroducing the clobber overrides.
