
## 2026-02-09 Task 0/0.1: Migration Reference + Workspace Layout
- Keep migration snapshot folder name: `docs/kord-aios/reference/MIGRATION-OPEN-AIOS/`.
- Single documentation source of truth: `docs/kord-aios/` (stories/PRDs/architecture/plans/backlog).
- Runtime/framework state: `.kord-aios/` (packs/state/evidence; git-ignored for state/evidence).
- `.sisyphus` equivalent: per-session journal under `docs/kord-aios/sessions/ses_<id>.md` and working drafts under `docs/kord-aios/drafts/`.
- Working branch: `kord-aios-v1`.

## 2026-02-09 Rename Strategy Guardrails
- Use scripted rename (direct replacement, no alias layer) to avoid duplicate agent implementations.
- Rename script MUST NOT rewrite planning artifacts under `.sisyphus/` by default (plans/kickoff/checklists should remain stable); default scope should be code + canonical docs only (e.g. `src/`, `docs/kord-aios/`, maybe `script/`).
- Run `bun run typecheck` green BEFORE applying the rename live to reduce risk and avoid cascading churn.
