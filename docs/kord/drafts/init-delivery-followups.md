# Draft: Init Delivery Follow-ups

## What We Did (so far)
- Implemented `docs/kord/plans/init-delivery.md` end-to-end (init auto-runs extract, project-mode detection, `.opencode/opencode.jsonc` `instructions: [".kord/rules/**"]`, rules migrated to `.kord/rules/`, optional greenfield bootstrap, docs updates), verified green (`bun run typecheck`, `bun run build`, `bun test`), and pushed to `origin/dev`.
- QA validation: PASS, with a minor note that the script matrix list is smaller than the plan text target (10 vs 15).

## Answer Pending (User Asked Earlier)
- "Where is the prompt of the subagents?" / "Onde está o prompt dos subagentes?"
  - Built-in T2 methodology agent prompts live in `src/features/builtin-agents/*.md` (e.g. `src/features/builtin-agents/qa.md`, `src/features/builtin-agents/pm.md`).
  - They are compiled/loaded via `src/features/builtin-agents/prompts.ts` (build-time prompt packaging).
  - Project-level extracted overrides (when `extract` runs) land in `.opencode/agents/*.md` inside the user project.
  - T0 orchestrators (kord/dev/builder/planner) are code-defined in `src/agents/` and are not overridden via `.opencode/agents/`.

## Open Questions
- Do we want to (a) strictly match the plan text and expand `docs/kord/research/init-delivery-scripts.md` to 15+ scripts, or (b) treat QA's note as acceptable and leave as-is?
- Do you want a short, user-facing doc section explaining "where subagent prompts live" (and how `extract` affects `.opencode/agents/`) added to an existing doc (e.g. `docs/kord/MODEL-USAGE-GUIDE.md`) or kept as a note-only answer?

## Scope Boundaries (Follow-ups Only)
- INCLUDE: documentation clarifications, plan text reconciliation, and a small addendum plan if you want more polish.
- EXCLUDE: any new feature work beyond Plan 2 (unless you explicitly extend scope).
