# Issues: Squad Orchestration Remediation

- **Staged Follow-ups Recorded**: Created `docs/kord/analyses/squads/remediation-follow-ups.md` to track legacy `squad_load` shape, deeper runtime semantics, and creator determinism gaps. These are intentionally excluded from the current remediation pass to focus on blocker-level doc/seed drift.
- **QA Scope Note**: Current `bun test` failures are in `src/cli/scaffolder.test.ts` and `src/features/workflow-engine/registry.test.ts`, both expecting `brownfield-discovery.yaml` while `src/features/builtin-workflows/` currently ships only `greenfield-fullstack.yaml`. This is unrelated workflow-asset drift, not caused by README/seed/artifact remediation.
