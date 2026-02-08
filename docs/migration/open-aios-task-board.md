# Open-AIOS Migration Task Board

**Updated:** 2026-02-08  
**Version:** 3.0 (Execution Waves)  
**Status:** Wave 1 In Progress

---

## Current Active Story

**Active Story:** `docs/stories/module-2-installer-fusion.md`

---

## Executive Summary

Open-AIOS fusion combines OMOC engine (40+ hooks, Bun runtime) with AIOS methodology (176+ skills, story-driven workflows). This task board organizes work into **autonomous execution waves**—each wave is self-contained with clear entry/exit criteria and verification commands.

**Canonical Naming (Source of Truth):**
| Phase | Agent | Legacy Alias |
|-------|-------|--------------|
| Plan | **@plan** | prometheus |
| Build | **@build** | sisyphus |
| Build-Loop | **@build-loop** | atlas |
| Deep Research | **@deep** | hephaestus |
| Control Plane | **@kord** | aios-master |

---

## Execution Waves Overview

| Wave  | Name         | Modules      | Status    | Est. Duration | Dependencies |
| ----- | ------------ | ------------ | --------- | ------------- | ------------ |
| **0** | Baseline     | Module 0     | ✅ DONE   | -             | None         |
| **1** | Foundation   | Modules 1-2  | 🔄 ACTIVE | 4-7 days      | Wave 0       |
| **2** | Capability   | Modules 3-4  | ⏳ QUEUED | 6-10 days     | Wave 1       |
| **3** | Integration  | Modules 5-7  | ⏳ QUEUED | 8-12 days     | Wave 2       |
| **4** | Distribution | Modules 8-10 | ⏳ QUEUED | 5-8 days      | Wave 3       |

---

## Wave 0: Baseline ✅ COMPLETE

**Scope:** Verify clean OMOC baseline, establish directory boundaries, import AIOS layer

### Done Criteria

- [x] `bun run typecheck` passes with 0 errors
- [x] `bun test` passes (baseline tests)
- [x] AIOS layer imported to `layer/aios/`
- [x] Runtime separation documented
- [x] Naming map created (OMOC → Open-AIOS)

### Verification Commands

```bash
# Type check
bun run typecheck

# Test baseline
bun test

# Verify AIOS layer
ls layer/aios/payload/skills/ | wc -l  # Should show 176+

# Check separation docs
cat docs/migration/runtime-separation.md
cat docs/migration/naming-map.md
```

### Artifacts

- `docs/migration/runtime-separation.md`
- `docs/migration/naming-map.md`
- `docs/migration/open-aios-bootstrap-report.json`
- `layer/aios/` (AIOS payload)

---

## Wave 1: Foundation 🔄 IN PROGRESS

**Scope:** Agent topology (ADR-0001) + Hook merge + Story-driven protocol (ADR-0002)

### Dependencies

- Wave 0 complete ✅
- ADR-0001 approved ✅
- ADR-0002 approved ✅

### Module 1: Agent System Fusion

**Status:** 40% complete  
**Story:** [module-1-agent-fusion.md](../stories/module-1-agent-fusion.md)

#### Scope

- Port 9 OMOC agents to canonical Open-AIOS names
- Create 4 net-new agents (@pm, @po, @sm, @devops)
- Implement alias compatibility layer
- Generate agent manifests in `.opencode/agents/`

#### Done Criteria

- [ ] All primary agents created: @plan, @build, @build-loop, @kord
- [ ] @deep subagent created with hephaestus alias
- [ ] 7 specialist agents: @dev, @qa, @architect, @sm, @analyst, @pm, @po, @devops
- [ ] Alias mapping functional (sisyphus→@build, atlas→@build-loop, etc.)
- [ ] Agent manifests generated
- [ ] `bun run typecheck` passes
- [ ] Agent creation tests pass

#### Verification Commands

```bash
# Type check
bun run typecheck

# Verify agent creation
bun test src/agents/__tests__/agent-creation.test.ts

# Check alias resolution
bun run -e "const { createSisyphusAgent, createBuildAgent } = require('./src/agents'); console.log('Alias works:', createSisyphusAgent === createBuildAgent)"

# Verify manifests
ls .opencode/agents/*.md | wc -l  # Should be 15+

# Test agent prompts
bun run -e "const { createKordAgent } = require('./src/agents/kord'); const agent = createKordAgent(); console.log('Kord has story lifecycle:', agent.systemPrompt.includes('Story_Lifecycle'))"
```

### Module 2: Hook System Merge

**Status:** 60% complete  
**Story:** To be created (module-2-hook-merge.md)

#### Scope

- Verify all 40+ OMOC hooks functional
- Add 4 AIOS methodology hooks
- Register in hook priority system

#### Done Criteria

- [ ] Hook audit confirms 0 breaking changes
- [ ] story-workflow-enforcer hook created (priority 25)
- [ ] quality-gate-validator hook created (priority 25)
- [ ] acceptance-criteria-tracker hook created (priority 30)
- [ ] skill-execution-logger hook created (priority 85)
- [ ] All hooks registered in `src/hooks/index.ts`
- [ ] Hook execution order tested

#### Verification Commands

```bash
# Verify hook count
bun run -e "const hooks = require('./src/hooks'); console.log('Hook exports:', Object.keys(hooks).length)"

# Test hook priorities
grep -r "priority:" src/hooks/*.ts | sort -t: -k2 -n

# Run hook tests
bun test src/hooks/__tests__/

# Verify methodology hooks exist
test -f src/hooks/story-workflow-enforcer.ts
test -f src/hooks/quality-gate-validator.ts
test -f src/hooks/acceptance-criteria-tracker.ts
test -f src/hooks/skill-execution-logger.ts
```

### Wave 1 Exit Criteria

All Module 1 and Module 2 done criteria met +:

- [ ] Agents can be invoked via canonical names
- [ ] Legacy aliases resolve correctly
- [ ] Story lifecycle sections present in orchestrator prompts
- [ ] Hook chain executes without errors

---

## Wave 2: Capability ⏳ QUEUED

**Scope:** Skill discovery integration + Installer fusion

### Dependencies

- Wave 1 complete (Agents + Hooks)

### Module 3: Skill Discovery Integration

**Status:** 30% complete  
**Story:** To be created (module-3-skill-discovery.md)

#### Scope

- Extend skill loader to discover AIOS skills
- Create skill installation command
- Implement skill validation

#### Done Criteria

- [ ] `discoverAiosSkills()` function implemented
- [ ] AIOS skills load from `layer/aios/payload/skills/`
- [ ] `open-aios install-skills` command works
- [ ] Skill dependency resolution functional
- [ ] All 176+ skills load without errors
- [ ] Skill dispatch to correct agents verified

#### Verification Commands

```bash
# Install skills
open-aios install-skills

# Verify skill count
ls .opencode/skills/ | wc -l  # Should be 176+

# Test skill dispatch
open-aios skill list

# Verify skill categories
grep -l "Agent:" .opencode/skills/*/SKILL.md | wc -l

# Test specific skill
open-aios *build --help
```

### Module 4: Installer & Init Command Fusion

**Status:** 20% complete  
**Story:** [module-2-installer-fusion.md](../stories/module-2-installer-fusion.md) (being created)

#### Scope

- OpenCode detection in existing projects
- OMOC auth flow integration
- Project templates (fresh + merge)
- Post-init validation

#### Done Criteria

- [ ] `open-aios init [project-name]` creates project structure
- [ ] Existing `.opencode/` detected and merged safely
- [ ] MCP config preserved during merge
- [ ] Auth flow (OMOC) integrated
- [ ] Post-init validation passes
- [ ] Backward compatibility: `oh-my-opencode install` still works

#### Verification Commands

```bash
# Fresh init
mkdir -p /tmp/test-init && cd /tmp/test-init
open-aios init test-project

# Verify structure
test -d test-project/.opencode/
test -d test-project/.aios-core/
test -d test-project/docs/stories/
test -f test-project/opencode.json

# Test merge (existing project)
cd existing-project
open-aios init .  # Should detect existing and merge
test -f .opencode.backup.*/opencode.json  # Backup created

# Verify skills available after init
open-aios skill list | head -20

# Legacy command still works
oh-my-opencode install --help
```

### Wave 2 Exit Criteria

- [ ] Skills load and execute correctly
- [ ] Init creates valid projects
- [ ] Merge preserves existing config
- [ ] Auth flow works end-to-end

---

## Wave 3: Integration ⏳ QUEUED

**Scope:** Agent overlay + Documentation + Test suite

### Dependencies

- Wave 2 complete (Skills + Installer)

### Module 5: Agent Overlay & Aliases

**Status:** Pending  
**Story:** To be created (module-5-agent-overlay.md)

#### Scope

- Alias registry implementation
- Backward compatibility testing
- Deprecation policy (credits/inspiration only, no warnings Phase 1)

#### Done Criteria

- [ ] Alias registry in `src/agents/utils.ts`
- [ ] All 9 OMOC aliases resolve correctly
- [ ] No duplicate agent instances created
- [ ] Old configs (sisyphus, atlas, etc.) work unchanged
- [ ] Compatibility documented

#### Verification Commands

```bash
# Test all aliases
bun run -e "
const agents = require('./src/agents');
const aliases = ['sisyphus', 'atlas', 'hephaestus', 'prometheus', 'momus', 'oracle', 'metis', 'sisyphus-junior', 'aios-master'];
aliases.forEach(alias => {
  const factory = agents['create' + alias.charAt(0).toUpperCase() + alias.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase()) + 'Agent'];
  console.log(alias + ':', typeof factory === 'function' ? '✅' : '❌');
});
"

# Verify no duplicates
bun run -e "const { createBuiltinAgents } = require('./src/agents/utils'); const agents = createBuiltinAgents(); console.log('Unique instances:', new Set(Object.values(agents)).size, 'Total keys:', Object.keys(agents).length)"
```

### Module 6: Documentation

**Status:** Pending  
**Story:** To be created (module-6-documentation.md)

#### Scope

- Getting started guides
- Agent usage documentation
- Migration guides (from OMOC, from AIOS)
- API reference

#### Done Criteria

- [ ] `docs/getting-started/installation.md`
- [ ] `docs/getting-started/quickstart.md`
- [ ] `docs/guides/agent-usage.md`
- [ ] `docs/guides/story-driven-workflow.md`
- [ ] `docs/migration/from-omoc.md`
- [ ] `docs/migration/from-aios.md`
- [ ] All canonical agents documented

#### Verification Commands

```bash
# Verify docs exist
test -f docs/getting-started/installation.md
test -f docs/guides/agent-usage.md
test -f docs/migration/from-omoc.md

# Check for broken links
find docs -name "*.md" -exec grep -l "\[.*\](.*)" {} \; | head -20

# Verify agent coverage
grep -l "@plan\|@build\|@build-loop\|@deep\|@kord" docs/guides/*.md
```

### Module 7: Test Suite

**Status:** Pending  
**Story:** To be created (module-7-test-suite.md)

#### Scope

- Unit tests for agents, hooks, tools
- Integration tests for plugin initialization
- E2E tests for story workflows
- Coverage >80%

#### Done Criteria

- [ ] Agent prompt generation tests
- [ ] Hook execution tests
- [ ] Skill discovery tests
- [ ] Config merging tests
- [ ] Plugin initialization tests
- [ ] E2E story workflow test passes
- [ ] Coverage report shows >80%

#### Verification Commands

```bash
# Run all tests
bun test

# Coverage report
bun test --coverage

# E2E tests
bun test tests/e2e/

# Verify coverage threshold
bun run -e "const coverage = require('./coverage/coverage-summary.json'); console.log('Coverage:', coverage.total.lines.pct + '%')"
```

### Wave 3 Exit Criteria

- [ ] Documentation complete and reviewed
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] Migration guides validated

---

## Wave 4: Distribution ⏳ QUEUED

**Scope:** Monitoring + Packaging + E2E validation

### Dependencies

- Wave 3 complete (Integration + Testing)

### Module 8: Monitoring & Dashboard

**Status:** Pending  
**Story:** To be created (module-8-monitoring.md)

#### Scope

- Dashboard app integration
- Monitor server integration
- Metrics collection for hooks, skills, agents

#### Done Criteria

- [ ] Dashboard from `layer/aios/apps/dashboard/` integrated
- [ ] Monitor server from `layer/aios/apps/monitor-server/` integrated
- [ ] Hook execution metrics collected
- [ ] Skill usage metrics collected
- [ ] Agent delegation metrics collected
- [ ] Open-AIOS branding applied

#### Verification Commands

```bash
# Start monitor server
cd apps/monitor-server && bun run start

# Verify metrics endpoint
curl http://localhost:3001/metrics

# Check dashboard
cd apps/dashboard && bun run dev
# Navigate to http://localhost:3000
```

### Module 9: Packaging & Distribution

**Status:** Pending  
**Story:** To be created (module-9-packaging.md)

#### Scope

- NPM package preparation
- Binary builds (Windows, macOS, Linux)
- Installer scripts

#### Done Criteria

- [ ] `package.json` updated for @synkra/open-aios
- [ ] Binary builds successful for all platforms
- [ ] Install scripts created
- [ ] Uninstall capability added
- [ ] Published to npm registry

#### Verification Commands

```bash
# Build binaries
bun run build:binaries

# Verify binaries exist
ls -la dist/open-aios-*

# Test binary
./dist/open-aios --version

# Pack for npm
bun pack

# Verify package contents
tar -tzf synkra-open-aios-*.tgz | head -30
```

### Module 10: E2E Validation

**Status:** Pending  
**Story:** To be created (module-10-validation.md)

#### Scope

- End-to-end validation scenarios
- Regression report
- Feature parity checklist

#### Done Criteria

- [ ] Delegation flow validated (@kord → @build → @deep → @qa)
- [ ] Story workflow validated (create → spec → plan → build → qa)
- [ ] Installer flow validated
- [ ] MCP preservation validated
- [ ] Fallback mechanism tested
- [ ] YOLO mode tested
- [ ] Regression report generated
- [ ] Feature parity checklist complete

#### Verification Commands

```bash
# Full E2E suite
bun test tests/e2e/ --reporter=verbose

# Specific scenarios
bun test tests/e2e/delegation-flow.test.ts
bun test tests/e2e/story-workflow.test.ts
bun test tests/e2e/installer-flow.test.ts

# Generate regression report
bun run generate:regression-report
```

### Wave 4 Exit Criteria

- [ ] All E2E scenarios pass
- [ ] Binaries available for all platforms
- [ ] NPM package published
- [ ] Regression report shows no critical issues
- [ ] Ready for public release

---

## Quick Reference

### Current Status Dashboard

| Wave | Progress | Blockers        | Next Action                   |
| ---- | -------- | --------------- | ----------------------------- |
| 0    | ✅ 100%  | None            | -                             |
| 1    | 🔄 50%   | Agent manifests | Complete Module 1.6 (QA gate) |
| 2    | ⏳ 0%    | Wave 1 complete | Start Module 3                |
| 3    | ⏳ 0%    | Wave 2 complete | -                             |
| 4    | ⏳ 0%    | Wave 3 complete | -                             |

### Commands by Wave

```bash
# Wave 0-1 (Development)
bun run typecheck
bun test
bun run build

# Wave 2 (Skills)
open-aios install-skills
open-aios skill list

# Wave 2 (Init)
open-aios init my-project

# Wave 4 (Distribution)
bun run build:binaries
bun pack
```

### Key Files

| Purpose        | Path                                          |
| -------------- | --------------------------------------------- |
| Agent registry | `src/agents/index.ts`                         |
| Agent factory  | `src/agents/utils.ts`                         |
| Hook registry  | `src/hooks/index.ts`                          |
| Skill loader   | `src/features/opencode-skill-loader/index.ts` |
| Init command   | `src/cli/init.ts`                             |
| Config schema  | `src/config.ts`                               |

### Story Files

| Module | Story                                                                   |
| ------ | ----------------------------------------------------------------------- |
| 1      | [module-1-agent-fusion.md](../stories/module-1-agent-fusion.md)         |
| 2      | [module-2-installer-fusion.md](../stories/module-2-installer-fusion.md) |
| 3      | module-3-skill-discovery.md (TBD)                                       |
| 4      | module-4-installer-init.md (TBD)                                        |
| 5-10   | TBD                                                                     |

---

## Branding Policy

**Credits/Inspiration Only** — No trademark infringement:

- OpenCode: Acknowledged as inspiration for plugin architecture
- AIOS: Framework methodology source (Synkra AIOS)
- OMOC: Engine foundation (oh-my-opencode)

**Naming Conventions:**

- Canonical: @plan, @build, @build-loop, @deep, @kord
- Legacy aliases maintained for compatibility (no deprecation warnings)
- Project name: **Open-AIOS** (not OpenCode, not OMOC)

---

_Last Updated: 2026-02-08_  
_Next Review: Wave 1 completion_
