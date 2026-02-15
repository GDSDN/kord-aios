# Technical Audit Report: Wave 1 Implementation
## Installer / CLI / Hooks / Tools / MCP

**Project:** kord-aios  
**Version:** 3.3.0  
**Audit Date:** 2026-02-07  
**Audited By:** @explore  

---

## Executive Summary

This audit evaluates the current state of the kord-aios codebase across five critical areas:
- **A) Installer/CLI** - Bootstrap and initialization systems
- **B) Hook System** - Plugin lifecycle and methodology enforcement
- **C) Tool System** - Agent delegation and task execution
- **D) MCP Integration** - Model Context Protocol configuration

The codebase shows a mature Kord AIOS engine with 40+ hooks, 25+ tools, and 176+ skills. However, several gaps exist between the current state and the target AIOS architecture, particularly in QA agent invocation, MCP consistency, and CLI integration.

---

## A) Installer/CLI Audit

### A.1 Current State

#### Source Files Analyzed:
| File | Lines | Purpose |
|------|-------|---------|
| `src/cli/index.ts` | 247 | CLI entry point with Commander.js |
| `src/cli/install.ts` | 543 | Interactive/TUI installation flow |
| `src/cli/init.ts` | 123 | Project initialization (layer copy) |
| `src/cli/config-manager.ts` | 668 | Configuration file management |
| `src/cli/types.ts` | 44 | TypeScript type definitions |
| `layer/aios/installer/bin/kord.js` | 325 | Standalone CLI entry point |
| `layer/aios/installer/src/bootstrap/opencode-bootstrap.js` | 255 | OpenCode-specific bootstrap |
| `layer/aios/installer/bin/modules/mcp-installer.js` | 384 | MCP installation module |

#### Key Capabilities Present:
1. **Multi-provider support**: Claude, OpenAI, Gemini, Copilot, OpenCode Zen, Z.ai, Kimi
2. **TUI mode**: Interactive prompts via @clack/prompts
3. **Non-TUI mode**: Headless installation with CLI flags
4. **Config management**: JSON/JSONC parsing, deep merge, backup/restore
5. **Antigravity provider**: Google OAuth integration for Gemini models
6. **Version detection**: Automatic OpenCode binary detection
7. **MCP installation**: Project-level MCP server setup (browser, context7, exa, desktop-commander)

### A.2 Gaps vs Target

| Gap | Severity | Target State |
|-----|----------|--------------|
| CLI naming inconsistency | Medium | Package name is `kord-aios`, but uses `kord-aios` as alias |
| No AIOS layer sync command | High | Need `kord-aios sync` to update skills/rules from layer/aios |
| Missing `doctor` implementation | Medium | `doctor` command is wired but incomplete in CLI index |
| No MCP status/list commands | Medium | Kord CLI has MCP status, not exposed in kord-aios CLI |
| Init doesn't run MCP install | High | `init` should optionally bootstrap MCPs |
| Missing brownfield detection | Medium | Should detect existing projects and suggest merge strategy |
| No skill validation | Low | Should validate skill runbooks on install |

### A.3 Exact Files to Change

```
src/cli/index.ts
  - Add 'sync' command (line 243+)
  - Complete 'doctor' implementation (line 204+)
  - Add 'mcp' subcommand group (line 244+)

src/cli/init.ts
  - Add --with-mcp flag (line 7, 30)
  - Call mcp-installer after layer copy (line 94+)

src/cli/install.ts
  - Rename from kord-aios to kord-aios branding (line 65)

src/cli/config-manager.ts
  - Add detectProjectType() helper (line 668+)
  - Add brownfield detection logic (line 626+)

layer/aios/installer/bin/kord.js
  - Add MCP commands wrapper (line 236+)
```

### A.4 Low-Risk Implementation Order

1. **Phase 1 (Safe)**: Fix branding inconsistencies
   - Rename console output from "kord-aios" to "kord-aios"
   - Test: `bunx kord-aios install --no-tui --claude=yes --gemini=yes`

2. **Phase 2 (Safe)**: Add missing CLI commands
   - Implement `doctor` with existing checks from kord.js
   - Test: `bunx kord-aios doctor`

3. **Phase 3 (Medium)**: MCP integration
   - Add `kord-aios mcp install/status` commands
   - Test: `bunx kord-aios mcp install --mcp=exa,context7`

4. **Phase 4 (Medium)**: AIOS sync command
   - Add `kord-aios sync` for layer updates
   - Test: `bunx kord-aios sync --layer=skills,rules`

---

## B) Hook System Audit

### B.1 Current State

#### Hook Registry (`src/hooks/index.ts`):
**43 hooks exported**, organized into categories:

| Category | Hooks |
|----------|-------|
| **Lifecycle** | todo-continuation-enforcer, session-recovery, session-notification, context-window-monitor |
| **Safety Guards** | stop-continuation-guard, write-existing-file-guard, subagent-question-blocker, unstable-agent-babysitter |
| **Methodology** | rules-injector, category-skill-reminder, agent-usage-reminder, keyword-detector |
| **Recovery** | edit-error-recovery, anthropic-context-window-limit-recovery, delegate-task-retry |
| **UX** | think-mode, claude-code-hooks, auto-slash-command, atlas |
| **Tool Interceptors** | tool-output-truncator, thinking-block-validator, comment-checker |
| **Context Management** | directory-agents-injector, directory-readme-injector, compaction-context-injector, compaction-todo-preserver |

#### Hook Registration Order (`src/index.ts`):
The plugin registers hooks in **logical priority order** (lines 148-508).

### B.2 Gaps vs Target

| Gap | Severity | Target State |
|-----|----------|--------------|
| No explicit priority constants | Low | Define priority tiers (5-10 Safety, 50 Methodology, 90+ UX) as constants |
| Missing story-driven hook | High | Need hook that enforces story-driven development methodology |
| QA hook not registered | High | QA agent exists but no hook enforces QA gates |
| No wave-based execution hook | Medium | Need hook to support wave-based parallel execution |
| Missing pre-delegation validation | Medium | Hook to validate task params before delegate-task |

### B.3 Exact Files to Change

```
src/hooks/index.ts
  - Add export for createStoryDrivenEnforcerHook (line 44+)
  - Add export for createQaGateHook (line 45+)

src/index.ts
  - Import new hooks (line 44+)
  - Register story-driven-enforcer (line 313+)
  - Register qa-gate hook (line 314+)

src/config/index.ts (or schema.ts)
  - Add new hook names to HookName type (line 104+)
```

---

## C) Tool System Audit

### C.1 Current State

#### Tool Registry (`src/tools/`):
**25+ tools** across categories including delegate-task, call_kord_agent, skill, skill_mcp, slashcommand, background_output, session-manager, task CRUD, grep/glob/ast-grep, interactive_bash, look_at, lsp.

#### Key Implementation Details:

**`src/tools/call-kord-agent/tools.ts`** (375 lines):
- Supports 7 allowed agents: explore, librarian, oracle, hephaestus, metis, momus, multimodal-looker
- **NO QA agent in allowed list**
- Background and sync execution modes
- Session continuation support

**`src/tools/delegate-task/tools.ts`** (324 lines):
- Category-based model selection (visual-engineering, ultrabrain, deep, artistry, quick, etc.)
- Skill loading system integration
- Background task execution with babysitting
- Model fallback handling

**QA Agent Status**:
- Agent defined: `src/agents/qa/index.ts` (95 lines)
- **NOT callable via call_kord_agent** (not in ALLOWED_AGENTS)
- **NOT directly invocable** from delegate-task (no special handling)
- Only usable via category-based delegation to @dev with QA context

### C.2 Gaps vs Target (Critical)

| Gap | Severity | Target State |
|-----|----------|--------------|
| QA agent not in ALLOWED_AGENTS | **Critical** | Add "qa" to `call_kord_agent` allowed list |
| No direct QA task delegation | **Critical** | Support `subagent_type="qa"` in delegate-task |
| Missing QA gate enforcement | High | Tool should auto-trigger QA on READY_FOR_REVIEW |

### C.3 Exact Files to Change

```
src/tools/call-kord-agent/constants.ts
  - Add "qa" to ALLOWED_AGENTS array
  - Update description template

src/tools/delegate-task/constants.ts
  - Add "qa" category or special handling
  - Add QA_CATEGORY_PROMPT_APPEND
```

---

## D) MCP Integration Audit

### D.1 Current State

#### MCP Configuration Templates (`layer/aios/.aios-core/infrastructure/tools/mcp/`):
| MCP | File | Transport | Status |
|-----|------|-----------|--------|
| **Exa** | `exa.yaml`
 | `exa.yaml` | stdio (npx) | Ready |
| **Context7** | `context7.yaml` | SSE | Ready |
| **Browser (Puppeteer)** | `browser.yaml` | stdio (npx) | Ready |
| **Desktop Commander** | `desktop-commander.yaml` | stdio (npx) | Ready |
| **n8n** | `n8n.yaml` | stdio | Ready |
| **Google Workspace** | `google-workspace.yaml` | stdio | Ready |
| **Supabase** | `supabase.yaml` | stdio | Ready |
| **ClickUp** | `clickup.yaml` | stdio | Ready |
| **21st.dev Magic** | `21st-dev-magic.yaml` | stdio | Ready |

### D.2 Gaps vs Target

| Gap | Severity | Target State |
|-----|----------|--------------|
| No docker-gateway MCP support | High | Add docker-gateway MCP configs |
| Missing Apify MCP | Medium | Add Apify actor support |
| No MCP secrets management | High | Secure credential storage |
| Health checks deferred | Medium | Implement health check execution |
| No MCP status command | Low | CLI command to verify MCP health |

### D.3 Exact Files to Change

```
layer/aios/.aios-core/infrastructure/tools/mcp/
  - Create apify.yaml (new file)
  - Create playwright.yaml (new file - distinct from browser)
  - Update exa.yaml with latest tool list

layer/aios/installer/bin/modules/mcp-installer.js
  - Add MCP_CONFIGS entries for apify, playwright (line 27-135)
  - Implement health check execution (line 245-248)
  - Add secrets management helper (line 300+)

src/cli/mcp-oauth/
  - Add status.ts implementation (currently placeholder)
  - Add list.ts for MCP enumeration (new file)
  - Add verify.ts for health checks (new file)

src/cli/index.ts
  - Add 'mcp' subcommand group (line 244+)
  - Wire up mcp-installer (line 245+)
```

### D.4 Low-Risk Implementation Order

1. **Phase 1 (Safe)**: Add missing MCP configs
   - Create `apify.yaml` with all 7 Apify tools
   - Test: `cat layer/aios/.aios-core/infrastructure/tools/mcp/apify.yaml`

2. **Phase 2 (Medium)**: Implement health checks
   - Add health check execution in mcp-installer.js
   - Test: Install MCP and verify health check runs

3. **Phase 3 (Medium)**: Add CLI commands
   - Implement `kord-aios mcp list/status/verify`
   - Test: `bunx kord-aios mcp status`

4. **Phase 4 (Medium)**: Secrets management
   - Add `.env` integration for API keys
   - Test: Install with --env-file option

---

## E) Cross-Cutting Concerns

### E.1 Configuration Consistency

**Current State:**
- `opencode.json` is the main config file
- `.opencode/` directory for skills, rules, agents
- `.aios-core/` directory for content, workflows, templates
- `kord-aios.json` (legacy) still referenced in some places

**Gaps:**
1. Inconsistent naming between kord-aios and kord-aios
2. No unified config validation schema
3. Missing migration tool from legacy configs

**Files to Change:**
```
src/config/schema.ts
  - Add unified config schema (Zod)
  - Add validation functions

src/cli/migrate-config.ts (new)
  - Create migration tool from kord-aios.json
```

### E.2 Testing Strategy

**Current State:**
- Unit tests for individual tools/hooks
- Integration tests for CLI commands
- No end-to-end tests for full workflows

**Gaps:**
1. No QA agent integration tests
2. No MCP installation tests
3. No story-driven workflow E2E tests

**Test Commands:**
```bash
# Current
bun test                    # Run all tests
bun run typecheck           # Type checking
bun run audit:hooks         # Hook audit
bun run audit:drift         # Drift detection

# Recommended additions
bun run test:e2e           # E2E workflow tests
bun run test:mcp           # MCP integration tests
bun run test:qa            # QA agent tests
```

### E.3 Documentation Completeness

**Present:**
- `docs/architecture/kord-aios-architecture.md` - Good overview
- `docs/architecture/adr-0001-agent-topology.md` - ADR
- `docs/architecture/adr-0002-story-driven-orchestration.md` - ADR
- `layer/aios/.aios-core/user-guide.md` - User guide

**Missing:**
1. CLI command reference
2. Hook development guide
3. Tool development guide
4. MCP configuration guide
5. Migration guide for kord-aios

---

## F) Implementation Priority Matrix

| Item | Impact | Effort | Risk | Priority |
|------|--------|--------|------|----------|
| Add QA to ALLOWED_AGENTS | High | Low | Low | **P0** |
| Fix branding inconsistencies | Medium | Low | Low | **P0** |
| Add MCP CLI commands | High | Medium | Low | **P1** |
| Create story-driven hook | High | Medium | Medium | **P1** |
| Implement MCP health checks | Medium | Medium | Low | **P1** |
| Add QA gate automation | High | Medium | Medium | **P2** |
| Add sync command | Medium | Medium | Low | **P2** |
| Add docker-gateway MCPs | Medium | High | Medium | **P3** |
| Add secrets management | Medium | High | Medium | **P3** |
| Create E2E tests | High | High | Low | **P3** |

---

## G) Test Commands Per Change Set

### P0 Changes (Immediate)

```bash
# Test 1: QA agent availability
cd D:\dev\kord-aios
bun run build
# In OpenCode session:
# call_kord_agent(subagent_type="qa", prompt="Review src/index.ts for bugs")

# Test 2: Branding consistency
grep -r "kord-aios" src/cli/*.ts | grep -v "node_modules"
# Should only show legacy references, not user-facing output
```

### P1 Changes (Short-term)

```bash
# Test 1: MCP CLI
bunx kord-aios mcp list
bunx kord-aios mcp status
bunx kord-aios mcp install --mcp=exa,context7 --api-key=EXA_API_KEY=xxx

# Test 2: Story-driven hook
# Create story with todos
# Run agent task
# Verify story file is updated
```

### P2 Changes (Medium-term)

```bash
# Test 1: Sync command
bunx kord-aios sync --layer=skills --dry-run
bunx kord-aios sync --layer=skills,rules

# Test 2: QA gate
# Move story to READY_FOR_REVIEW
# Verify QA agent is automatically invoked
```

### P3 Changes (Long-term)

```bash
# Test 1: Docker MCP
bunx kord-aios mcp install --mcp=apify --docker
# Verify docker-compose.yml created

# Test 2: E2E tests
bun run test:e2e --scenario=story-lifecycle
```

---

## H) Appendix: File Inventory

### Source Files (Audited)
```
src/
├── index.ts (1146 lines) - Plugin entry point
├── cli/
│   ├── index.ts (247 lines) - CLI commands
│   ├── install.ts (543 lines) - Install flow
│   ├── init.ts (123 lines) - Project init
│   ├── config-manager.ts (668 lines) - Config management
│   └── types.ts (44 lines) - CLI types
├── hooks/
│   ├── index.ts (43 lines) - Hook exports
│   └── */index.ts - Individual hooks (43 total)
├── tools/
│   ├── call-kord-agent/
│   │   ├── index.ts (4 lines)
│   │   ├── tools.ts (375 lines)
│   │   ├── types.ts (28 lines)
│   │   └── constants.ts (16 lines)
│   └── delegate-task/
│       ├── index.ts (5 lines)
│       ├── tools.ts (324 lines)
│       ├── executor.ts (200+ lines)
│       ├── types.ts (66 lines)
│       └── constants.ts (553 lines)
└── agents/
    └── qa/
        └── index.ts (95 lines) - QA agent definition

layer/aios/
├── installer/
│   └── bin/
│       ├── kord.js (325 lines)
│       └── modules/
│           └── mcp-installer.js (384 lines)
│   └── src/
│       └── bootstrap/
│           └── opencode-bootstrap.js (255 lines)
└── .aios-core/
    └── infrastructure/
        └── tools/
            └── mcp/
                ├── exa.yaml (104 lines)
                ├── context7.yaml (79 lines)
                └── *.yaml (7 more MCP configs)
```

### Configuration Files
```
.opencode/ (dev harness)
├── rules/
│   ├── opencode-rules.md - System rules
│   └── AGENTS.md - Agent definitions
└── skills/ - 176+ skill runbooks

package.json - NPM package config (kord-aios v3.3.0)
```

---

## I) Summary of Critical Actions

### Must Do (Before Next Release)
1. **Add "qa" to ALLOWED_AGENTS** in `src/tools/call-kord-agent/constants.ts`
2. **Fix branding** in CLI output (kord-aios to kord-aios)
3. **Add MCP CLI commands** for list/status/install

### Should Do (Next Sprint)
4. Implement story-driven enforcement hook
5. Add MCP health check execution
6. Create QA category for delegate-task

### Nice to Have (Future)
7. Docker-gateway MCP support
8. Secrets management system
9. Full E2E test suite

---

## J) Comparison with Reference (D:\dev\aios-core)

### Similarities

- Both use OpenCode plugin architecture
- Both support skill-based delegation  
- Both have MCP YAML configuration templates

### Differences
| Aspect | kord-aios (D:\dev\kord-aios) | aios-core (D:\dev\aios-core) |
|--------|------------------------------|------------------------------|
| Primary runtime | Bun/Node.js | OpenCode plugin + Docker |
| Agent invocation | call_kord_agent tool | Native skill execution |
| MCP transport | stdio, SSE | stdio, SSE, Docker gateway |
| QA agent | Defined but not callable | Fully integrated |
| CLI | kord-aios CLI | Kord CLI + npx @synkra/aios-core |
| Story workflow | Partial | Full with quality gates |
| Hook system | 43 hooks (Kord AIOS) | 37 hooks (Python/JS mix) |

---

**End of Audit Report**

*Generated by @explore on 2026-02-07*

