**Story ID:** OPEN-AIOS-V1-001
**Status:** Ready
**Priority:** Critical
**Effort:** 1-2 days

---

## 1. Objective

Hard replace OMOC agent naming with Open-AIOS canonical owners using deterministic scripts (no wrappers, no runtime aliases).

Canonical owners after this story:
- Primary: `plan`, `build`, `build-loop`, `kord`
- Subagents: `deep`, `dev` (+ existing utilities)

Forbidden in implementation after completion:
- `atlas`, `sisyphus`, `prometheus`, `hephaestus`, `sisyphus-junior` (except credits/history docs)

## 2. Approach (Script-first)

Create and run a single codemod script that:

1) Renames folders/files (move, not copy)
- `src/agents/atlas/` -> `src/agents/build-loop/`
- `src/agents/prometheus/` -> `src/agents/plan/`
- `src/agents/sisyphus.ts` -> `src/agents/build.ts` OR `src/agents/build/index.ts` (choose existing OMOC structure)
- `src/agents/hephaestus.ts` -> `src/agents/deep.ts` OR `src/agents/deep/index.ts`
- `src/agents/sisyphus-junior/` -> `src/agents/dev/`

2) Renames symbols/exports/imports
Examples:
- `createAtlasAgent` -> `createBuildLoopAgent`
- `atlasPromptMetadata` -> `buildLoopPromptMetadata`
- `PROMETHEUS_SYSTEM_PROMPT` -> `PLAN_SYSTEM_PROMPT`

3) Updates runtime wiring
- `src/agents/types.ts`, `src/agents/index.ts`, `src/agents/utils.ts`
- `src/cli/run/agent-resolver.ts` default and core order
- config/schema/handler to use canonical keys

4) Updates tests accordingly
- rename test descriptions and agent names
- ensure no old agent names remain in implementation tests

## 3. Acceptance Criteria

- [ ] `bun run typecheck` passes
- [ ] Key test suites pass:
  - `bun test src/agents src/config src/plugin-handlers src/tools/delegate-task src/cli/run`
- [ ] Naming audit script reports 0 violations
- [ ] Only canonical agents exist in runtime config/schema

## 4. Quality Gates

```bash
bun run typecheck
bun test src/config/schema.test.ts src/plugin-handlers/config-handler.test.ts
bun test src/agents/utils.test.ts src/tools/delegate-task/tools.test.ts
bun test src/cli/run/runner.test.ts
```

