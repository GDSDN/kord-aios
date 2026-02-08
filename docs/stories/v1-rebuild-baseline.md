**Story ID:** OPEN-AIOS-V1-000
**Status:** Ready
**Priority:** Critical
**Effort:** 0.5-1 day

---

## 1. Objective

Restart Open-AIOS V1 from a clean OMOC baseline (`v3.4.0`) with a deterministic migration pipeline.

## 2. Success Criteria

- [ ] Baseline branch `main` points to OMOC tag `v3.4.0`
- [ ] Migration branch `open-aios-v1` created from `main`
- [ ] Backup branch contains current experimental work (for reference only)
- [ ] Quality gates documented and runnable in the new branch

## 3. Implementation Checklist

### 3.1 Git Branching

- [ ] Create backup branch from current work: `open-aios-backup-v1`
- [ ] Create `main` from OMOC `v3.4.0`
- [ ] Create `open-aios-v1` from `main`

### 3.2 Guardrails (Script-first)

- [ ] Add a script `script/v1-hard-rename-agents.mjs` (next story) to apply hard renames:
  - atlas -> build-loop
  - sisyphus -> build
  - prometheus -> plan
  - hephaestus -> deep
  - sisyphus-junior -> dev
- [ ] Add naming audit script to forbid old names in implementation after rename (allowed only in credit/history docs)

## 4. Quality Gates

Run before merging any wave:

```bash
bun install
bun run typecheck
bun test src/config/schema.test.ts src/plugin-handlers/config-handler.test.ts
bun test src/agents/utils.test.ts src/tools/delegate-task/tools.test.ts
bun test src/cli/index.test.ts src/cli/install.test.ts src/cli/init-command.test.ts
```

