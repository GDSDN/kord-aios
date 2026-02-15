# Kord AIOS Migration Plan (Detailed)

**Version:** 3.0.0  
**Date:** 2026-02-08  
**Status:** In Progress (Wave 1 Active)  
**Architecture:** [kord-aios-architecture.md](../architecture/kord-aios-architecture.md)

---

## Current Active Story

**Active Story:** `docs/stories/module-2-installer-fusion.md`

---

## Executive Summary

This document details the complete migration from standalone OMOC and AIOS to the unified **Kord AIOS** framework. The migration follows a **4-wave execution model** with 10 modules, clear dependencies, and autonomous execution capability.

**Canonical Agent Topology (ADR-0001):**

| Phase      | Kord AIOS       | AIOS Ref   | OMOC Alias  | Purpose                     |
| ---------- | --------------- | ---------- | ----------- | --------------------------- |
| Plan       | **@plan**       | plan       | prometheus  | Requirements, decomposition |
| Build      | **@build**      | build      | sisyphus    | Interactive implementation  |
| Build-Loop | **@build-loop** | build-loop | atlas       | Autonomous execution        |
| Deep       | **@deep**       | deep       | hephaestus  | Intensive research          |
| Control    | **@kord**       | kord       | aios-master | Framework guardian          |

---

## Current State

### Completed (Wave 0) ✅

| Item               | Status  | Details                                     |
| ------------------ | ------- | ------------------------------------------- |
| OMOC Baseline      | ✅ DONE | `bun run typecheck` passes, clean build     |
| AIOS Layer Import  | ✅ DONE | 176+ skills in `layer/aios/payload/skills/` |
| Runtime Separation | ✅ DONE | `.opencode/` vs `.aios-core/` boundaries    |
| Naming Map         | ✅ DONE | Canonical names defined (ADR-0001)          |
| Architecture Docs  | ✅ DONE | Full system architecture documented         |

### In Progress (Wave 1) 🔄

| Item             | Status      | Blocker                       |
| ---------------- | ----------- | ----------------------------- |
| Module 1: Agents | 🔄 50%      | Agent manifest generation     |
| Module 2: Hooks  | 🔄 60%      | 4 AIOS hooks to add           |
| ADR-0001         | ✅ ACCEPTED | Agent topology finalized      |
| ADR-0002         | ✅ ACCEPTED | Story-driven protocol defined |

### Pending (Waves 2-4) ⏳

| Wave   | Modules                                    | Status    |
| ------ | ------------------------------------------ | --------- |
| Wave 2 | 3-4 (Skills + Installer)                   | ⏳ QUEUED |
| Wave 3 | 5-7 (Overlay + Docs + Tests)               | ⏳ QUEUED |
| Wave 4 | 8-10 (Monitoring + Packaging + Validation) | ⏳ QUEUED |

---

## Module Reference

| Module | Name             | Effort   | Dependencies | Story                                                                   |
| ------ | ---------------- | -------- | ------------ | ----------------------------------------------------------------------- |
| 1      | Agent System     | 3-5 days | Wave 0       | [module-1-agent-fusion.md](../stories/module-1-agent-fusion.md)         |
| 2      | Hook System      | 1-2 days | Wave 0       | TBD                                                                     |
| 3      | Skill Discovery  | 3-5 days | Wave 1       | TBD                                                                     |
| 4      | Installer Fusion | 3-5 days | Wave 1       | [module-2-installer-fusion.md](../stories/module-2-installer-fusion.md) |
| 5      | Agent Overlay    | 1-2 days | Wave 2       | TBD                                                                     |
| 6      | Documentation    | 2-3 days | Wave 2       | TBD                                                                     |
| 7      | Test Suite       | 1 week   | Wave 2       | TBD                                                                     |
| 8      | Monitoring       | 3-5 days | Wave 3       | TBD                                                                     |
| 9      | Packaging        | 2-3 days | Wave 3       | TBD                                                                     |
| 10     | E2E Validation   | 3-5 days | Wave 3-4     | TBD                                                                     |

---

## Module 1: Agent System (PORT + UPGRADE) 🔄

**Status:** 50% complete  
**Story:** [module-1-agent-fusion.md](../stories/module-1-agent-fusion.md)  
**Architecture Decision:** [ADR-0001](../architecture/adr-0001-agent-topology.md)

### 1.1 Objective

Port AIOS agents to Kord AIOS format while maintaining backward compatibility and infusing methodology.

**Target Agents:**

- **4 Primary:** @plan, @build, @build-loop, @kord
- **1 Subagent:** @deep (hephaestus alias maintained)
- **7 Specialists:** @dev, @qa, @architect, @sm, @analyst, @pm, @po, @devops
- **3 Utilities:** librarian, explore, multimodal-looker (unchanged)

### 1.2 Implementation

#### Phase 1: Primary Topology (1.1.x)

```yaml
Tasks:
  - Create src/agents/plan/ (from prometheus/)
  - Create src/agents/build/ (from sisyphus.ts)
  - Create src/agents/build-loop/ (from atlas/)
  - Create src/agents/kord/ (control-plane guardian)
  - Create src/agents/deep/ (from hephaestus.ts)

Deliverables:
  - Canonical agent directories
  - Model-optimized variants (default.ts, gpt.ts)
  - Story lifecycle sections in prompts
```

#### Phase 2: Alias Mapping (1.2.x)

```yaml
Alias Registry (src/agents/utils.ts):
  prometheus: plan
  sisyphus: build
  atlas: build-loop
  hephaestus: deep
  aios-master: kord
  momus: qa
  oracle: architect
  metis: analyst
  sisyphus-junior: dev

Compatibility:
  - Old configs work unchanged
  - No deprecation warnings (Phase 1)
  - Thin re-export files
```

#### Phase 3: Specialist Agents (1.5.x)

| Agent      | Source           | Status   |
| ---------- | ---------------- | -------- |
| @dev       | sisyphus-junior/ | Porting  |
| @qa        | momus/           | Porting  |
| @architect | oracle.ts        | Porting  |
| @sm        | prometheus/      | Porting  |
| @analyst   | metis.ts         | Porting  |
| @pm        | NEW              | Creating |
| @po        | NEW              | Creating |
| @devops    | NEW              | Creating |

### 1.3 Testing Strategy

```yaml
Unit:
  - Agent creation tests
  - Alias resolution tests
  - Prompt structure validation

Integration:
  - Agent registration in plugin
  - Delegate-task with aliases
  - Skill dispatch

E2E:
  - @kord → @dev delegation
  - Legacy name invocation
  - Story lifecycle tracking
```

---

## Module 2: Hook System (MERGE) 🔄

**Status:** 60% complete  
**Effort:** 1-2 days  
**Dependencies:** Wave 0

### 2.1 Objective

Merge OMOC's 40+ hooks with 4 AIOS methodology enforcement hooks.

### 2.2 Current State

**OMOC Hooks (40+ existing, all kept):**

- Safety: stop-continuation-guard, write-existing-file-guard
- Methodology: todo-continuation-enforcer, rules-injector
- Monitoring: context-window-monitor, session-recovery
- Recovery: edit-error-recovery, delegate-task-retry
- UX: agent-usage-reminder, category-skill-reminder
- Automation: ralph-loop, atlas, auto-slash-command

**Audit Results:** 0 breaking changes needed

### 2.3 AIOS Enhancement Hooks

| Hook                        | Priority | Purpose                                  |
| --------------------------- | -------- | ---------------------------------------- |
| story-workflow-enforcer     | 25       | Story methodology compliance             |
| quality-gate-validator      | 25       | Gate validation before phase transitions |
| acceptance-criteria-tracker | 30       | AC completion tracking                   |
| skill-execution-logger      | 85       | Skill usage analytics                    |

### 2.4 Hook Priority Bands

```
5-10:   Safety & Guards
20-30:  Methodology Enforcement ← AIOS hooks here
40-50:  Monitoring
60-70:  Recovery
80-90:  UX Enhancements
```

---

## Module 3: Skill Discovery Integration ⏳

**Status:** 30% complete  
**Effort:** 3-5 days  
**Dependencies:** Wave 1

### 3.1 Objective

Integrate 176+ AIOS skills into OMOC's skill discovery system.

### 3.2 Discovery Priority

```
1. Plugin Built-in Skills (src/features/builtin-skills/)
2. User Claude Skills (~/.claude/skills/)
3. OpenCode Global Skills (~/.opencode/skills/)
4. Project Claude Skills (./.claude/skills/)
5. OpenCode Project Skills (./.opencode/skills/) ← AIOS INJECTED
6. Plugin Config Skills (opencode.json)
```

### 3.3 Implementation

```yaml
Phase 1: Loader Extension
  - Add discoverAiosSkills() to opencode-skill-loader
  - Source: layer/aios/payload/skills/
  - Merge with existing discovery

Phase 2: Installation
  - kord-aios install-skills command
  - Copy/symlink skills to .opencode/skills/
  - Handle updates and conflicts

Phase 3: Execution
  - SKILL.md parsing
  - Agent resolution from skill header
  - Skill validation
```

### 3.4 Skill Categories (176+)

| Category            | Count | Examples                                 |
| ------------------- | ----- | ---------------------------------------- |
| Build & Development | 12    | build, build-autonomous, build-component |
| Story & Planning    | 15    | create-next-story, spec-_, plan-_        |
| Analysis            | 18    | analyze-_, audit-_, extract-\*           |
| Database            | 20    | db-\*, supabase integration              |
| Testing & QA        | 15    | test-_, review-_, trace-requirements     |
| DevOps & CI/CD      | 12    | ci-cd-configuration, github-devops-\*    |
| Design System       | 10    | bootstrap-shadcn-library, extract-tokens |
| Utilities           | 56    | create-_, improve-_, generate-\*         |

### 3.5 Star Commands Policy

When agents use `*command` syntax to invoke skill workflows:

- `*command` means skill workflow intent
- Try exact skill match first
- Fallback to skill search if no exact match
- If still missing, continue with normal build/plan flow and record fallback

---

## Module 4: Installer & Init Command Fusion ⏳

**Status:** 20% complete  
**Effort:** 3-5 days  
**Dependencies:** Wave 1  
**Story:** [module-2-installer-fusion.md](../stories/module-2-installer-fusion.md)

### 4.1 Objective

Create unified installer combining OMOC's interactive setup with AIOS project bootstrap.

### 4.2 Components

#### OpenCode Detection

- Detect existing `.opencode/` directory
- Detect existing `opencode.json`
- Determine fresh vs merge mode

#### OMOC Auth Integration

- Preserve existing `kord-aios install` flow
- Provider configuration (Anthropic, OpenAI, etc.)
- Model fallback chains
- API key management

#### Project Templates

**Fresh Project:**

```
project/
├── .opencode/
│   ├── agents/         # Generated manifests
│   ├── skills/         # AIOS skills (176+)
│   └── rules/          # AIOS rules
├── .aios-core/         # Framework state
│   └── content/
├── docs/
│   └── stories/        # Story templates
└── opencode.json       # Config
```

**Merge Mode (Existing Project):**

- Backup existing config (.opencode.backup.{timestamp}/)
- Preserve MCP servers
- Preserve agent overrides
- Add AIOS skills and rules
- Generate merge report

### 4.3 Implementation

```yaml
Phase 1: CLI Structure
  - bin/kord-aios.js entry point
  - init subcommand
  - Preserve kord-aios compatibility

Phase 2: Init Logic
  - Project detection (fresh vs merge)
  - Directory creation
  - File population (skills, rules, templates)

Phase 3: Merge Safety
  - Backup existing config
  - MCP config preservation
  - Agent config preservation
  - Conflict resolution

Phase 4: Validation
  - Post-init verification
  - Skill loading test
  - Agent registration test
  - Init report generation
```

### 4.4 Verification

```bash
# Fresh project
kord-aios init my-project
cd my-project
kord-aios skill list  # Should show 176+ skills

# Merge existing
cd existing-project
kord-aios init .
# Should preserve existing config + add AIOS layer
```

---

## Module 5: Agent Overlay & Aliases ⏳

**Status:** Pending  
**Effort:** 1-2 days  
**Dependencies:** Wave 2

### 5.1 Objective

Implement agent overlay system with backward compatibility aliases.

### 5.2 Alias Strategy

**No Deprecation Warnings (Phase 1):**

- Legacy names work indefinitely
- No console warnings
- Automatic resolution to canonical

**Complete Mapping:**

| OMOC (Legacy)   | AIOS (Framework) | Kord AIOS (Canonical) |
| --------------- | ---------------- | --------------------- |
| prometheus      | plan             | **@plan**             |
| sisyphus        | build            | **@build**            |
| atlas           | build-loop       | **@build-loop**       |
| hephaestus      | deep             | **@deep**             |
| aios-master     | kord             | **@kord**             |
| momus           | qa               | **@qa**               |
| oracle          | architect        | **@architect**        |
| metis           | analyst          | **@analyst**          |
| sisyphus-junior | dev              | **@dev**              |

### 5.3 Implementation

```typescript
// src/agents/utils.ts
const agentSources: Record<string, AgentSource> = {
  // Canonical (user-facing)
  plan: { factory: createPlanAgent, canonical: true },
  build: { factory: createBuildAgent, canonical: true },
  "build-loop": { factory: createBuildLoopAgent, canonical: true },
  kord: { factory: createKordAgent, canonical: true },
  deep: { factory: createDeepAgent, canonical: true },

  // Aliases (backward compatibility)
  prometheus: { factory: createPlanAgent, canonical: false, aliasFor: "plan" },
  sisyphus: { factory: createBuildAgent, canonical: false, aliasFor: "build" },
  atlas: {
    factory: createBuildLoopAgent,
    canonical: false,
    aliasFor: "build-loop",
  },
  // ... etc
};
```

---

## Module 6: Documentation ⏳

**Status:** Pending  
**Effort:** 2-3 days  
**Dependencies:** Wave 2

### 6.1 Structure

```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quickstart.md
│   └── configuration.md
├── guides/
│   ├── story-driven-workflow.md
│   ├── agent-usage.md
│   ├── skill-usage.md
│   └── hook-reference.md
├── reference/
│   ├── agents.md
│   ├── skills.md
│   ├── hooks.md
│   └── api.md
└── migration/
    ├── from-omoc.md
    ├── from-aios.md
    └── upgrade-guide.md
```

### 6.2 Key Topics

| Document                 | Content                                    |
| ------------------------ | ------------------------------------------ |
| installation.md          | npm install, binary download, init         |
| quickstart.md            | First project, first story, first build    |
| agent-usage.md           | When to use @plan/@build/@build-loop/@deep |
| story-driven-workflow.md | Story lifecycle, AC tracking, escalation   |
| from-omoc.md             | Migration from kord-aios              |
| from-aios.md             | Migration from Synkra AIOS                 |

---

## Module 7: Test Suite ⏳

**Status:** Pending  
**Effort:** 1 week  
**Dependencies:** Wave 2

### 7.1 Coverage Targets

| Category    | Target     | Priority |
| ----------- | ---------- | -------- |
| Unit Tests  | >80%       | Critical |
| Integration | >70%       | High     |
| E2E         | Core flows | Critical |

### 7.2 Test Categories

```yaml
Unit Tests:
  - Agent prompt generation
  - Hook execution order
  - Tool functionality
  - Skill parsing
  - Config loading

Integration Tests:
  - Plugin initialization
  - Agent delegation flow
  - Skill discovery
  - Hook chaining
  - Config merging

E2E Tests:
  - Full story workflow
  - Init command flow
  - Skill execution
  - Error recovery
```

---

## Module 8: Monitoring & Dashboard ⏳

**Status:** Pending  
**Effort:** 3-5 days  
**Dependencies:** Wave 3

### 8.1 Components

**Dashboard (apps/dashboard/):**

- Story progress visualization
- Agent activity timeline
- Skill usage analytics
- Error rate tracking

**Monitor Server (apps/monitor-server/):**

- WebSocket event streaming
- Metrics aggregation
- Health checks

### 8.2 Metrics

| Metric                     | Source         | Purpose               |
| -------------------------- | -------------- | --------------------- |
| Hook execution count       | Hook system    | Performance tracking  |
| Skill invocation frequency | Skill tool     | Usage analytics       |
| Agent delegation graph     | Delegate task  | Workflow optimization |
| Story phase duration       | Story workflow | Velocity tracking     |

---

## Module 9: Packaging & Distribution ⏳

**Status:** Pending  
**Effort:** 2-3 days  
**Dependencies:** Wave 3

### 9.1 NPM Package

```json
{
  "name": "@synkra/kord-aios",
  "version": "1.0.0",
  "bin": {
    "kord-aios": "./bin/kord-aios.js",
    "kord-aios": "./bin/kord-aios.js"
  },
  "files": ["src/", "dist/", "layer/aios/payload/", "bin/"]
}
```

### 9.2 Binary Builds

```bash
# Windows
bun build --compile --target=bun-windows-x64 ./src/index.ts --outfile ./dist/kord-aios.exe

# macOS
bun build --compile --target=bun-darwin-arm64 ./src/index.ts --outfile ./dist/kord-aios-macos
bun build --compile --target=bun-darwin-x64 ./src/index.ts --outfile ./dist/kord-aios-macos-intel

# Linux
bun build --compile --target=bun-linux-x64 ./src/index.ts --outfile ./dist/kord-aios-linux
```

### 9.3 Install Methods

| Method   | Command                                               |
| -------- | ----------------------------------------------------- |
| NPM      | `npm install -g @synkra/kord-aios`                    |
| Homebrew | `brew install synkra/tap/kord-aios`                   |
| Direct   | `curl -fsSL https://kord-aios.dev/install.sh \| bash` |

---

## Module 10: E2E Validation ⏳

**Status:** Pending  
**Effort:** 3-5 days  
**Dependencies:** Waves 3-4

### 10.1 Validation Scenarios

```yaml
Scenario 1: Delegation Flow
  - User invokes @kord
  - @kord delegates to @build
  - @build delegates to @deep for research
  - @deep returns findings
  - @qa reviews output
  - Results returned to user

Scenario 2: Story Workflow
  - @plan creates story
  - @sm decomposes to tasks
  - @build implements
  - @qa validates
  - Story marked complete

Scenario 3: Installer Flow
  - npm install -g @synkra/kord-aios
  - kord-aios init my-project
  - Project structure created
  - Skills available
  - Agents functional

Scenario 4: MCP Preservation
  - Existing opencode.json with MCP servers
  - Run kord-aios init
  - MCP servers preserved
  - AIOS skills added
```

### 10.2 Regression Report

| Feature          | OMOC Status | Kord AIOS Status | Notes                 |
| ---------------- | ----------- | ---------------- | --------------------- |
| Hook system      | ✅          | ✅               | 40+ hooks preserved   |
| Tool registry    | ✅          | ✅               | 25+ tools working     |
| Agent delegation | ✅          | ✅               | Enhanced with aliases |
| Skill execution  | N/A         | ✅               | 176+ AIOS skills      |
| Story workflow   | N/A         | ✅               | New capability        |
| Init command     | ✅          | ✅               | Enhanced with merge   |

---

## Special Modules (User-Requested)

### A. Prompt Alignment

**Objective:** Align prompts with upstream AIOS essence while maintaining OMOC structure.

**Strategy:**

- Preserve OMOC's 6-section prompt structure
- Inject AIOS methodology sections:
  - `<Story_Lifecycle>` - Story phase awareness
  - `<Skill_Discovery>` - \*command-name patterns
  - `<Quality_Gates>` - Evidence requirements
  - `<Escalation_Paths>` - Fallback rules

**Canonical Prompt Model:**

```
1. Role & Identity (OMOC)
2. Behavior Instructions (OMOC + AIOS)
3. Constraints (OMOC + AIOS)
4. Available Tools (OMOC)
5. Methodology Sections (AIOS) ← NEW
6. Response Format (OMOC)
```

**Agents Affected:**

- @kord: Story lifecycle, orchestration rules
- @build: Evidence requirements, AC tracking
- @build-loop: Autonomous execution patterns
- @deep: Research methodology, citation requirements

### B. Hook Strategy

**Objective:** OMOC baseline + story-driven hooks

**Baseline (OMOC):**

- 40+ hooks covering safety, monitoring, UX
- Priority-based execution order
- Configurable enable/disable

**AIOS Additions:**

| Hook                        | Priority | Function                        |
| --------------------------- | -------- | ------------------------------- |
| story-workflow-enforcer     | 25       | Enforce story phase rules       |
| quality-gate-validator      | 25       | Block invalid phase transitions |
| acceptance-criteria-tracker | 30       | Track AC completion state       |
| skill-execution-logger      | 85       | Log skill usage for analytics   |

**Integration Points:**

- Hook injection via rules-injector
- State persistence via session-recovery
- Error recovery via edit-error-recovery

### C. Tool Audit for call-omo-agent Role

**Objective:** Audit tools for compatibility with delegated agent roles.

**Tool Categories:**

| Category | Tools                         | call-omo-agent Usage          |
| -------- | ----------------------------- | ----------------------------- |
| File Ops | Read, Write, Edit, Glob, Grep | Direct use                    |
| Shell    | Bash                          | Direct use with safety guards |
| Agentic  | delegate-task                 | Core delegation mechanism     |
| Skills   | skill, skill-mcp              | \*command-name execution      |
| Context  | session-manager               | State persistence             |
| Code     | lsp-client, grep              | Analysis tools                |

**Audit Checklist:**

- [ ] All tools handle subagent context correctly
- [ ] File paths resolve correctly in subagent sessions
- [ ] Tool outputs return to parent session
- [ ] Error handling propagates correctly
- [ ] No privilege escalation possible

**Delegation Chain Safety:**

```
User → @kord (primary)
  → delegate-task → @build (subagent)
    → tool.execute → file operations
    → delegate-task → @deep (subagent)
      → research tools
      → returns to @build
    → returns to @kord
  → returns to User
```

### D. MCP Parity Plan

**Objective:** Ensure MCP servers work identically in Kord AIOS as in OMOC.

**MCP Servers Used:**

- playwright (browser automation)
- desktop-commander (docker-gateway for EXA, Context7, Apify)

**Parity Requirements:**

- MCP config format unchanged
- MCP tool discovery works
- MCP tool execution works
- Error handling preserved

**Verification:**

```bash
# List MCP tools
kord-aios mcp list

# Verify playwright
kord-aios mcp playwright --help

# Verify docker-gateway
kord-aios mcp desktop-commander --help
```

### E. Branding Policy Exceptions

**Objective:** Define branding and credit policy.

**Policy:** Credits/Inspiration Only

| Source        | Usage                           | Credit               |
| ------------- | ------------------------------- | -------------------- |
| OpenCode      | Plugin architecture inspiration | Acknowledged in docs |
| AIOS (Synkra) | Framework methodology           | Primary credit       |
| OMOC          | Engine foundation               | Acknowledged         |
| Claude Code   | Tool patterns                   | Inspiration only     |

**Naming Rules:**

- Project: **Kord AIOS** (distinct from OpenCode, OMOC)
- Agents: Canonical names (@plan, @build, etc.)
- Legacy aliases: Maintained for compatibility
- No trademark infringement

**Documentation Credits:**

```markdown
## Acknowledgments

- **OpenCode**: Plugin architecture inspiration
- **Synkra AIOS**: Framework methodology and skills
- **kord-aios (OMOC)**: Engine foundation
```

---

## Risk Matrix

| Risk                         | Modules | Probability | Impact | Mitigation                          |
| ---------------------------- | ------- | ----------- | ------ | ----------------------------------- |
| Agent prompt incompatibility | 1, 5    | Medium      | High   | Maintain OMOC format, adapter layer |
| Skill format mismatch        | 3       | Medium      | High   | Parser validation, normalization    |
| Config merge failures        | 4       | Medium      | High   | Backup strategy, merge testing      |
| Hook priority conflicts      | 2       | Low         | High   | Clear priority bands, testing       |
| Performance regression       | All     | Low         | Medium | Benchmarking, profiling             |
| Documentation gaps           | 6       | Medium      | Medium | Checklist validation                |
| Test coverage gaps           | 7       | Medium      | High   | Coverage gates                      |
| MCP compatibility            | D       | Low         | Medium | Parity testing                      |

---

## Timeline

```
Week 1: Wave 1 (Modules 1-2) - FOUNDATION
  Days 1-2: Complete Module 1 (Agents)
  Days 3-4: Complete Module 2 (Hooks)
  Day 5: Wave 1 validation

Week 2: Wave 2 (Modules 3-4) - CAPABILITY
  Days 1-2: Module 3 (Skills)
  Days 3-5: Module 4 (Installer)

Week 3: Wave 3 (Modules 5-7) - INTEGRATION
  Days 1-2: Module 5 (Overlay)
  Days 3-4: Module 6 (Documentation)
  Days 5-7: Module 7 (Tests)

Week 4: Wave 4 (Modules 8-10) - DISTRIBUTION
  Days 1-2: Module 8 (Monitoring)
  Days 3-4: Module 9 (Packaging)
  Days 5-7: Module 10 (Validation)

Week 5: Buffer/Contingency
Week 6: Release preparation
```

**Total:** 6 weeks (with buffer)

---

## Success Criteria

Kord AIOS migration complete when:

1. ✅ **Engine Parity:** All OMOC features work unchanged
2. ✅ **AIOS Integration:** 176+ skills load and execute
3. ✅ **Agent System:** 15 agents defined with aliases working
4. ✅ **Installer:** `kord-aios init` works on fresh/existing projects
5. ✅ **Documentation:** Complete user and developer docs
6. ✅ **Tests:** >80% coverage, all E2E scenarios pass
7. ✅ **Distribution:** npm package and binaries available
8. ✅ **Validation:** Regression report shows no critical issues

---

## Appendix

### A. Module Story IDs

| Module | Story ID      | Status         |
| ------ | ------------- | -------------- |
| 1      | OPEN-AIOS-001 | 🔄 In Progress |
| 2      | OPEN-AIOS-002 | 🔄 In Progress |
| 3      | OPEN-AIOS-003 | ⏳ Pending     |
| 4      | OPEN-AIOS-004 | ⏳ Pending     |
| 5      | OPEN-AIOS-005 | ⏳ Pending     |
| 6      | OPEN-AIOS-006 | ⏳ Pending     |
| 7      | OPEN-AIOS-007 | ⏳ Pending     |
| 8      | OPEN-AIOS-008 | ⏳ Pending     |
| 9      | OPEN-AIOS-009 | ⏳ Pending     |
| 10     | OPEN-AIOS-010 | ⏳ Pending     |

### B. Reference Documents

- [kord-aios-architecture.md](../architecture/kord-aios-architecture.md) - Full architecture
- [adr-0001-agent-topology.md](../architecture/adr-0001-agent-topology.md) - Naming decision
- [adr-0002-story-driven-orchestration.md](../architecture/adr-0002-story-driven-orchestration.md) - Protocol
- [runtime-separation.md](./runtime-separation.md) - Directory boundaries
- [naming-map.md](./naming-map.md) - Name mappings
- [kord-aios-task-board.md](./kord-aios-task-board.md) - Execution waves

### C. Quick Commands

```bash
# Development
bun run typecheck
bun test
bun run build

# Init
kord-aios init my-project
kord-aios install-skills

# Legacy
kord-aios install
kord-aios --version
```

---

_Last Updated: 2026-02-08_  
_Version: 3.0.0_  
_Author: @architect (Oracle)_
