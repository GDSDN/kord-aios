## 2026-03-06 - Built-in code seed package/orchestration minimum

- Updated `src/features/builtin-squads/code/SQUAD.yaml` to include explicit `components` (empty asset lists) and `orchestration` (`runner: workflow-engine`, `delegation_mode: chief`) so the shipped seed teaches package/orchestration semantics instead of an agent-only shell.
- Intentionally did not set `orchestration.entry_workflow` because no workflow files are declared in the seed; this keeps the remediation minimal and aligned with current schema/validator behavior.
