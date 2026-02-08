**Story ID:** OPEN-AIOS-V1-002
**Status:** Ready
**Priority:** High
**Effort:** 1-2 days

---

## 1. Objective

Add the AIOS specialist agents to Open-AIOS as first-class subagents, wired into registry/schema/config, with OMOC-style prompt structure.

Agents to add:
- Primary control-plane: `kord` (AIOS master guardian)
- Specialists (subagents): `qa`, `pm`, `po`, `sm`, `analyst`, `data-engineer`, `devops`, `ux-design-expert`

## 2. Acceptance Criteria

- [ ] All new agents are creatable via registry
- [ ] All new agents are configurable via schema + config handler
- [ ] `call_omo_agent` allowlist includes these agents
- [ ] `bun run typecheck` passes
- [ ] Tests pass:
  - `bun test src/agents/utils.test.ts`
  - `bun test src/config/schema.test.ts`
  - `bun test src/plugin-handlers/config-handler.test.ts`

## 3. Quality Gates

```bash
bun run typecheck
bun test src/agents/utils.test.ts
bun test src/config/schema.test.ts
bun test src/plugin-handlers/config-handler.test.ts
```

