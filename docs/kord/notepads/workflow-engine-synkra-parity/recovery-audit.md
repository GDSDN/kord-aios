# Recovery Audit: Workflow Engine Synkra Parity

Quoted checkbox item:
- [ ] 0. Audit and reconcile the partial workflow-engine MVP created under `dev`

## Verdict

The current implementation is a **partial MVP foundation, not parity complete**. It provides useful scaffolding for registry/state/runtime entry points, but it does not yet satisfy Synkra parity requirements for catalog breadth, importer depth, runtime semantics, or operator documentation.

## Keep

- Keep the existing storage foundation in `src/features/workflow-engine/storage.ts` that writes run state under `docs/kord/workflows/runs/...` plus `active-run.json`.
- Keep the existing workflow-engine scaffold shape (schema/registry/engine/hook wiring) as a base to iterate from.
- Keep orchestrator ownership constraints aligned with current hooks: subagents must not own elicitation (`src/hooks/subagent-question-blocker/index.ts`), and `/start-work` continuation remains builder-owned (`src/hooks/start-work/index.ts`).

## Rework

- Rework runtime behavior toward Synkra depth: interactive main-session execution, JIT step prompt assembly, and true parallel fan-out/join plus gate enforcement.
- Rework alias routing flow in `src/features/workflow-engine/engine.ts` to remove recursion/routing hazards around alias dispatch.
- Rework state reporting integration so workflow execution is summarized into boulder metadata without collapsing workflow state into boulder runtime.

## Replace

- Replace inline TypeScript builtin workflow source-of-truth with an asset-backed YAML workflow pack under `src/features/builtin-workflows/**/*.yaml`.
- Replace the importer stub in `src/features/workflow-engine/engine.ts` with real catalog ingestion/adaptation logic.
- Replace documentation gap state by adding explicit README workflow runtime documentation and operational command behavior guidance.

## Critical Defects

- Importer remains a stub in `src/features/workflow-engine/engine.ts`, blocking real Synkra workflow ingestion and adaptation.
- Catalog parity gap: current MVP has only two simplified builtin workflows in `src/features/workflow-engine/builtin.ts` versus expected 14.
- Alias recursion/routing risk: alias recursion path does not clear `aliasWorkflowId` in `src/features/workflow-engine/engine.ts`.
- Runtime semantics gap: interactive main-session runtime, JIT prompt assembly, and true parallel/gate semantics are missing or partial.
- Builtin source mismatch: workflow source-of-truth is inline TS, not shipped YAML assets under `src/features/builtin-workflows/**/*.yaml`.
- Documentation gap: README does not describe workflow runtime behavior.
- State integration gap: workflow run files are persisted, but boulder summary integration is missing.

## Expected Synkra Workflow Catalog

The plan-aligned expected catalog contains 14 workflows:

1. `greenfield-fullstack`
2. `brownfield-discovery`
3. `greenfield-service`
4. `brownfield-fullstack`
5. `greenfield-ui`
6. `brownfield-ui`
7. `brownfield-service`
8. `qa-loop`
9. `spec-pipeline`
10. `design-system-build-quality`
11. `development-cycle`
12. `story-development-cycle`
13. `epic-orchestration`
14. `auto-worktree`

Runtime depth evidence basis for parity targets: `run-workflow-engine.md`, `subagent-prompt-builder.js`, and `workflow-state-schema.yaml`.

## Builder Next Actions

- Use this audit as the restart baseline before trusting existing workflow-engine code as complete.
- Implement importer replacement first, then migrate builtin source-of-truth to YAML assets.
- Fix alias recursion/routing safety (`aliasWorkflowId` clearing and deterministic command path handling).
- Implement missing runtime semantics in order: interactive main-session flow, JIT prompt assembly, then parallel/gate semantics.
- Add boulder summary integration for workflow run visibility while preserving dedicated workflow state files.
- Update README and workflow docs to reflect real runtime behavior and command semantics.
- Continue through plan recovery flow without marking parity complete until catalog, runtime behavior, tests, and docs all align.
