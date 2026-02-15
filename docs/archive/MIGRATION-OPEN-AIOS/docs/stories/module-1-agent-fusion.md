# Module 1: Agent System Fusion (PORT + UPGRADE)

**Story ID:** OPEN-AIOS-001  
**Status:** In Progress  
**Started:** 2026-02-07  
**Effort:** 3-5 days  
**Priority:** Critical (blocks Modules 2-10)  
**Architecture Decision:** [ADR-0001: Agent Topology and Naming](../../architecture/adr-0001-agent-topology.md)

---

## 1. Objective

Port AIOS agents to Kord AIOS format while maintaining backward compatibility and infusing methodology (story-driven workflows, quality gates, skill awareness).

**Success Criteria:**

- 4 Primary agents operational: @plan, @build, @build-loop, @kord
- 1 Subagent operational: @deep (hephaestus alias for compatibility)
- 7 Specialist agents: @dev, @qa, @architect, @sm, @analyst, @pm, @po, @devops
- Backward compatibility aliases functional (OMOC names)
- Agent manifests generated in `.opencode/agents/`
- Story-driven workflow hooks integrated

### Canonical Agent Model (Source of Truth)

| Type         | Kord AIOS   | AIOS Ref   | OMOC Alias  | Purpose                           |
| ------------ | ----------- | ---------- | ----------- | --------------------------------- |
| **Primary**  | @plan       | plan       | prometheus  | Planning, requirements analysis   |
| **Primary**  | @build      | build      | sisyphus    | Interactive implementation        |
| **Primary**  | @build-loop | build-loop | atlas       | Autonomous execution loop         |
| **Primary**  | @kord       | kord       | aios-master | Control-plane guardian            |
| **Subagent** | @deep       | deep       | hephaestus  | Deep research, intensive analysis |

**Note:** YOLO is a command/policy (`--yolo`, `-y`), NOT an agent identity.

---

## 2. Context Packet

### 2.1 Problem Statement

**Current State:**

- OMOC has 11 agent definitions in `src/agents/` with Greek mythology naming (sisyphus, hephaestus, prometheus, momus, etc.)
- AIOS framework has 176+ skills expecting agents named @plan, @build, @build-loop, @deep, @dev, @qa, @architect, @pm, @po, @sm, @devops, etc.
- Naming mismatch causes skill resolution failures
- Missing agents: @pm, @po, @sm, @devops, @data-engineer, @ux-design-expert

**Target State:**

- Primary agents: @plan, @build, @build-loop, @kord
- Subagent: @deep (hephaestus alias maintained for compatibility)
- Specialist agents: @dev, @qa, @architect, @sm, @analyst, @pm, @po, @devops
- Canonical mapping (OMOC → AIOS → Kord AIOS):
  - prometheus → plan → @plan
  - sisyphus → build → @build
  - atlas → build-loop → @build-loop
  - hephaestus → deep → @deep
  - aios-master → kord → @kord
  - momus → qa → @qa
  - oracle → architect → @architect
  - metis → analyst → @analyst
  - sisyphus-junior → dev → @dev
- Utility agents (unchanged): librarian, explore, multimodal-looker
- All agents understand Kord AIOS story lifecycle (DRAFT → PLANNING → READY_FOR_DEV → IN_PROGRESS → READY_FOR_REVIEW → APPROVED → COMPLETED)

### 2.2 Constraints

| Constraint                      | Impact                                                 |
| ------------------------------- | ------------------------------------------------------ |
| OMOC engine immutable           | Cannot modify hook system or tool registry             |
| Backward compatibility required | Existing configs with `sisyphus` must continue working |
| Bun runtime only                | No Node.js-specific dependencies                       |
| Agent mode strict               | `primary` = orchestrator, `subagent` = worker          |
| Model tier enforcement          | EXPENSIVE agents need fallback chains                  |

### 2.3 Key Files

| File                                         | Purpose           | Modification                                        |
| -------------------------------------------- | ----------------- | --------------------------------------------------- |
| `src/agents/index.ts`                        | Agent exports     | Add new agents, keep old exports as aliases         |
| `src/agents/kord.ts`                         | KORD orchestrator | Refine master prompt quality, add AIOS story phases |
| `src/agents/hephaestus.ts`                   | @deep (canonical) | Add story-driven execution patterns                 |
| `src/agents/sisyphus-junior/`                | Dev agent         | Upgrade with skill delegation patterns              |
| `src/agents/qa.ts`                           | QA agent          | Add quality gate enforcement                        |
| `src/agents/architect.ts`                    | Architect agent   | Add ADR governance                                  |
| `src/agents/utils.ts`                        | Agent factory     | Add alias resolution logic                          |
| `src/agents/types.ts`                        | Agent types       | Add `AgentPromptMetadata` extensions                |
| `src/agents/dynamic-agent-prompt-builder.ts` | Prompt builder    | Add AIOS methodology injection                      |
| `src/hooks/rules-injector.ts`                | Rules injection   | Add `.aios-core/rules/` support                     |

### 2.4 Dependencies

- **Module 0** ✅ (Baseline complete)
- **Layer/aios/** ✅ (Skills imported)
- **Hooks** 🔄 (Rules injection ready)

---

## 3. Decisions

### Decision 1: OMOC Structure Preservation

**Status:** ACCEPTED

OMOC's agent system design is sound. We keep:

- `dynamic-agent-prompt-builder.ts` for runtime prompt generation
- `AgentConfig` type from `@opencode-ai/sdk`
- Hook-based methodology injection
- Model resolution pipeline with fallback chains

### Decision 2: AIOS Framework Infusion

**Status:** ACCEPTED

Inject AIOS patterns via:

1. **Prompt sections**: Add `<Story_Lifecycle>`, `<Skill_Discovery>`, `<Quality_Gates>` sections to master prompts
2. **Metadata enrichment**: Extend `AgentPromptMetadata` with AIOS-specific triggers
3. **Rules injection**: Load `.aios-core/rules/opencode-rules.md` into orchestrator prompts
4. **Skill awareness**: Pass available skills to prompt builder

### Decision 3: Naming Policy with Compatibility → SUPERSEDED by ADR-0001

**Status:** SUPERSEDED → See `docs/architecture/adr-0001-agent-topology.md`

**Canonical Agent Model (Final):**

| Type           | Kord AIOS       | AIOS Ref   | OMOC Alias      | Purpose                           | Mode     |
| -------------- | --------------- | ---------- | --------------- | --------------------------------- | -------- |
| **Primary**    | **@plan**       | plan       | prometheus      | Planning, requirements analysis   | primary  |
| **Primary**    | **@build**      | build      | sisyphus        | Interactive implementation        | primary  |
| **Primary**    | **@build-loop** | build-loop | atlas           | Autonomous execution loop         | primary  |
| **Primary**    | **@kord**       | kord       | aios-master     | Control-plane guardian            | primary  |
| **Subagent**   | **@deep**       | deep       | hephaestus      | Deep research, intensive analysis | subagent |
| **Specialist** | **@dev**        | dev        | sisyphus-junior | Implementation, coding            | subagent |
| **Specialist** | **@qa**         | qa         | momus           | Quality assurance                 | subagent |
| **Specialist** | **@architect**  | architect  | oracle          | System design, ADRs               | subagent |
| **Specialist** | **@sm**         | sm         | —               | Story management                  | subagent |
| **Specialist** | **@analyst**    | analyst    | metis           | Research, benchmarking            | subagent |
| **Specialist** | **@pm**         | pm         | —               | Product strategy                  | subagent |
| **Specialist** | **@po**         | po         | —               | Backlog management                | subagent |
| **Specialist** | **@devops**     | devops     | —               | CI/CD, infrastructure             | subagent |

**Complete Mapping Table:**

| OMOC (Legacy)   | AIOS (Framework) | Kord AIOS (User-Facing) |
| --------------- | ---------------- | ----------------------- |
| prometheus      | plan             | **@plan**               |
| sisyphus        | build            | **@build**              |
| atlas           | build-loop       | **@build-loop**         |
| hephaestus      | deep             | **@deep**               |
| aios-master     | kord             | **@kord**               |
| momus           | qa               | **@qa**                 |
| oracle          | architect        | **@architect**          |
| metis           | analyst          | **@analyst**            |
| sisyphus-junior | dev              | **@dev**                |

**YOLO Clarification:** YOLO is a **command/policy** (`--yolo`, `-y`), NOT an agent identity.

### Agent Canonical Mapping (Source of Truth)

Based on `src/agents/AGENTS.md`, the authoritative agent definitions:

| OMOC Agent        | AIOS Reference    | Kord AIOS Agent   | Strategy     | Status       |
| ----------------- | ----------------- | ----------------- | ------------ | ------------ |
| atlas             | build-loop        | **@build-loop**   | Adapt        | 🔄 Porting   |
| sisyphus          | build             | **@build**        | Adapt        | 🔄 Porting   |
| prometheus        | plan              | **@plan**         | Adapt        | 🔄 Porting   |
| hephaestus        | deep              | **@deep**         | Adapt        | 🔄 Porting   |
| aios-master       | kord              | **@kord**         | Adapt        | 🔄 Porting   |
| sisyphus-junior   | dev               | **@dev**          | Adapt        | 🔄 Porting   |
| momus             | qa                | **@qa**           | Adapt        | 🔄 Porting   |
| oracle            | architect         | **@architect**    | Adapt        | 🔄 Porting   |
| metis             | analyst           | **@analyst**      | Adapt        | 🔄 Porting   |
| librarian         | librarian         | librarian         | Keep-Utility | ✅ Unchanged |
| explore           | explore           | explore           | Keep-Utility | ✅ Unchanged |
| multimodal-looker | multimodal-looker | multimodal-looker | Keep-Utility | ✅ Unchanged |

**New Agents (No OMOC Predecessor):**

| Kord AIOS   | AIOS Reference | Purpose                            | Status |
| ----------- | -------------- | ---------------------------------- | ------ |
| **@pm**     | pm             | Product strategy, roadmaps         | 🔄 New |
| **@po**     | po             | Backlog management, prioritization | 🔄 New |
| **@sm**     | sm             | Story management, sprint planning  | 🔄 New |
| **@devops** | devops         | CI/CD, infrastructure              | 🔄 New |

**Strategy Definitions:**

- **Adapt**: Port OMOC agent to Kord AIOS with methodology infusion
- **New**: Create net-new agent (no OMOC predecessor)
- **Keep-Utility**: Retain OMOC utility agent unchanged

### Mapping Decision (rev4 - FINAL)

**Date:** 2026-02-07  
**Rationale:**

1. **prometheus → plan**: Prometheus is the planning agent (Interview/Consultant mode, planner only). Maps directly to @plan for requirements analysis and decomposition.
2. **sisyphus → build**: Sisyphus is the main orchestrator for interactive work. Maps to @build for interactive implementation.
3. **atlas → build-loop**: Atlas is the master orchestrator with autonomous execution loop. Maps to @build-loop for autonomous background processing.
4. **hephaestus → deep**: Hephaestus is the autonomous deep worker (GPT 5.3 Codex). Maps directly to @deep subagent for intensive research.
5. **aios-master → kord**: Framework-level control plane and methodology guardian.
6. **sisyphus-junior → dev**: Sisyphus-Junior is the delegated task executor. Maps to @dev specialist.
7. **momus → qa**: Momus is the plan reviewer/critic. Maps to @qa quality assurance.
8. **oracle → architect**: Oracle is the strategic advisor. Maps to @architect system design.
9. **metis → analyst**: Metis is the pre-planning analysis agent. Maps to @analyst research.
10. **Utility agents unchanged**: librarian, explore, multimodal-looker remain unchanged.

**Complete Canonical Mapping:**

| OMOC            | AIOS       | Kord AIOS   |
| --------------- | ---------- | ----------- |
| prometheus      | plan       | @plan       |
| sisyphus        | build      | @build      |
| atlas           | build-loop | @build-loop |
| hephaestus      | deep       | @deep       |
| aios-master     | kord       | @kord       |
| momus           | qa         | @qa         |
| oracle          | architect  | @architect  |
| metis           | analyst    | @analyst    |
| sisyphus-junior | dev        | @dev        |

**Compatibility Strategy:**

- Create new agent files with canonical Kord AIOS names
- Keep old files as thin re-exports (e.g., `sisyphus.ts` → `export * from './build'`)
- Update `agentSources` map in `utils.ts` to resolve aliases
- No deprecation warnings (Phase 1)

---

## 4. Implementation Checklist

### 4.1 Subtask 1.1: Establish Primary Agent Topology (ADR-0001)

**Owner:** @architect  
**Effort:** 1 day

- [ ] **1.1.1** Create `src/agents/plan/` directory structure
  - **AC:** Directory created: `src/agents/plan/`
  - **AC:** Contains: `index.ts`, `default.ts` (Claude-optimized), `gpt.ts` (GPT-optimized)
  - **AC:** Exports `createPlanAgent()` function
  - **AC:** Prompt emphasizes: requirements analysis, story decomposition, complexity assessment
  - **Verification:** `import { createPlanAgent } from './agents/plan'` works

- [ ] **1.1.2** Create `src/agents/build/` directory structure
  - **AC:** Directory created: `src/agents/build/`
  - **AC:** Contains: `index.ts`, `default.ts`, `gpt.ts`
  - **AC:** Exports `createBuildAgent()` function
  - **AC:** Prompt emphasizes: interactive implementation, coding, user collaboration
  - **Verification:** `import { createBuildAgent } from './agents/build'` works

- [ ] **1.1.3** Create `src/agents/build-loop/` directory structure
  - **AC:** Directory created: `src/agents/build-loop/`
  - **AC:** Contains: `index.ts` with autonomous execution patterns
  - **AC:** Exports `createBuildLoopAgent()` function
  - **AC:** Prompt emphasizes: autonomous execution, background tasks, continuous loop
  - **Verification:** Worker agent instantiates correctly

- [ ] **1.1.4** Create `src/agents/kord/` directory structure
  - **AC:** Directory created: `src/agents/kord/`
  - **AC:** Contains: `index.ts` with control-plane patterns
  - **AC:** Exports `createKordAgent()` function
  - **AC:** Prompt emphasizes: framework orchestration, methodology enforcement
  - **Verification:** `import { createKordAgent } from './agents/kord'` works

- [ ] **1.1.5** Create `src/agents/deep/` directory structure
  - **AC:** Directory created: `src/agents/deep/`
  - **AC:** Contains: `index.ts` with deep research patterns
  - **AC:** Exports `createDeepAgent()` function
  - **AC:** Prompt emphasizes: intensive research, complex analysis, subagent role
  - **Verification:** `import { createDeepAgent } from './agents/deep'` works

**DoD:**

- Primary agent topology implemented per ADR-0001
- `src/agents/plan/` contains canonical @plan implementation
- `src/agents/build/` contains canonical @build implementation
- `src/agents/build-loop/` contains canonical @build-loop implementation
- `src/agents/kord/` contains canonical @kord implementation
- `src/agents/deep/` contains canonical @deep implementation
- `bun run typecheck` passes

**Rollback:**

- Delete `src/agents/plan/`, `src/agents/build/`, `src/agents/build-loop/`, `src/agents/kord/`, `src/agents/deep/` directories
- Restore original agent files

---

### 4.2 Subtask 1.2: Implement Alias Mapping (ADR-0001 Compatibility Layer)

**Owner:** @architect + @dev  
**Effort:** 0.5 days

- [ ] **1.2.1** Create alias mapping in `src/agents/utils.ts`
  - **AC:** Add `agentAliases` record mapping legacy names to canonical
  - **AC:** Format per ADR-0001:
    - `'prometheus': 'plan'`
    - `'sisyphus': 'build'`
    - `'atlas': 'build-loop'`
    - `'hephaestus': 'deep'`
    - `'aios-master': 'kord'`
    - `'momus': 'qa'`
    - `'oracle': 'architect'`
    - `'metis': 'analyst'`
    - `'sisyphus-junior': 'dev'`
  - **AC:** Update `createBuiltinAgents()` to resolve aliases
  - **Verification:** All legacy names resolve to canonical implementations

- [ ] **1.2.2** Convert `prometheus/` to compatibility re-export
  - **AC:** `prometheus/index.ts` contains: `export * from '../plan'; export { createPlanAgent as createPrometheusAgent };`
  - **AC:** Existing imports of `createPrometheusAgent` continue working
  - **Verification:** `bun run typecheck` with prometheus import passes

- [ ] **1.2.3** Convert `sisyphus.ts` to compatibility re-export
  - **AC:** `sisyphus.ts` contains: `export * from './build'; export { createBuildAgent as createSisyphusAgent };`
  - **AC:** Existing imports continue working
  - **Verification:** `bun run typecheck` with sisyphus import passes

- [ ] **1.2.4** Convert `atlas/` directory to compatibility re-export
  - **AC:** `src/agents/atlas/index.ts` contains: `export * from '../build-loop'; export { createBuildLoopAgent as createAtlasAgent };`
  - **AC:** Remove all other files in `atlas/` directory (content moved to `build-loop/`)
  - **Verification:** Atlas imports continue working

- [ ] **1.2.5** Convert `hephaestus.ts` to compatibility re-export
  - **AC:** `hephaestus.ts` contains: `export * from './deep'; export { createDeepAgent as createHephaestusAgent };`
  - **AC:** Existing imports using hephaestus still work
  - **Verification:** Hephaestus imports pass typecheck

- [ ] **1.2.6** Convert other legacy files
  - **AC:** `momus/` → re-export from `qa/`
  - **AC:** `oracle.ts` → re-export from `architect/`
  - **AC:** `metis.ts` → re-export from `analyst/`
  - **AC:** `sisyphus-junior/` → re-export from `dev/`

- [ ] **1.2.7** Verify no duplicate registrations
  - **AC:** `Object.keys(agentSources).filter(k => !agentSources[k].canonical)` lists all aliases
  - **AC:** Aliases don't create separate agent instances
  - **Verification:** `new Set(Object.values(agentSources).map(s => s.factory)).size` equals canonical count

**DoD:**

- All legacy names resolve correctly to canonical implementations
- No duplicate agent instances created
- Alias mapping documented in code comments
- `bun run typecheck` passes

**Rollback:**

- Keep old agent files intact (don't delete)
- Remove alias mapping from `utils.ts`
- Revert to direct imports

---

### 4.3 Subtask 1.3: Canonical @deep Subagent Implementation

**Owner:** @dev  
**Effort:** 0.5 days

- [ ] **1.3.1** Port Hephaestus → @deep canonical implementation
  - **AC:** Copy hephaestus prompt to `src/agents/deep/index.ts`
  - **AC:** Update identity to "@deep - Deep Research Subagent"
  - **AC:** Add `<Research_Methodology>` section for deep analysis patterns
  - **AC:** Keep GPT 5.3 Codex as preferred model
  - **Verification:** `createDeepAgent()` returns valid AgentConfig

- [ ] **1.3.2** Add deep research patterns
  - **AC:** Deep prompt includes: "INTENSIVE RESEARCH. ANALYZE DEEPLY. PROVIDE EVIDENCE."
  - **AC:** Research execution guidelines (when to use deep vs shallow search)
  - **AC:** Analysis patterns: exploration, synthesis, conclusion, citation
  - **Verification:** Deep prompt includes all research sections

- [ ] **1.3.3** Add skill execution awareness
  - **AC:** Deep understands `*command-name` skill invocation syntax
  - **AC:** Deep can invoke research skills (websearch, codesearch, etc.)
  - **AC:** Deep reports findings with sources and citations
  - **Verification:** Skill invocation examples present in prompt

- [ ] **1.3.4** Implement session continuity
  - **AC:** Deep prompt mandates storing `session_id` from all delegations
  - **AC:** Resume protocol documented: use `session_id` for follow-ups
  - **AC:** Maximum 3 retry attempts before escalation to @kord
  - **Verification:** Session continuity section in prompt

**DoD:**

- @deep fully capable of intensive research
- Can execute skills and report findings
- Session state preserved across invocations
- `bun run typecheck` passes

**Rollback:**

- Delete `deep/` directory
- Keep using `hephaestus.ts` directly

---

### 4.4 Subtask 1.4: Canonical DEV Agent (from Sisyphus-Junior)

**Owner:** @dev  
**Effort:** 1 day

- [ ] **1.4.1** Create `src/agents/dev/index.ts` from sisyphus-junior
  - **AC:** Port `sisyphus-junior/default.ts` to `dev/default.ts`
  - **AC:** Port `sisyphus-junior/gpt.ts` to `dev/gpt.ts`
  - **AC:** Rename agent identity from "Sisyphus-Junior" to "@dev - Developer Agent"
  - **AC:** Keep model-specific optimizations (Claude vs GPT variants)
  - **Verification:** `createDevAgent()` exports successfully

- [ ] **1.4.2** Add story-driven execution patterns
  - **AC:** Dev agent prompt includes: story checklist tracking
  - **AC:** Section on AC (Acceptance Criteria) verification
  - **AC:** Task completion evidence requirements
  - **Verification:** Story execution sections in prompt

- [ ] **1.4.3** Add skill delegation patterns
  - **AC:** Dev agent can discover and invoke skills via `*command-name`
  - **AC:** Skill context passing to subagents documented
  - **AC:** Category-based delegation guide (code, test, docs categories)
  - **Verification:** Skill discovery section in prompt

- [ ] **1.4.4** Add evidence requirements
  - **AC:** Dev prompt mandates: `lsp_diagnostics` clean before completion
  - **AC:** Build/test verification requirements
  - **AC:** "NO EVIDENCE = NOT COMPLETE" rule
  - **Verification:** Evidence checklist section in prompt

- [ ] **1.4.5** Convert `sisyphus-junior/` to compatibility re-export
  - **AC:** `sisyphus-junior/index.ts` contains: `export * from '../dev'; export { createDevAgent as createSisyphusJuniorAgent };`
  - **AC:** Keep directory structure for backward compatibility
  - **Verification:** Existing imports using sisyphus-junior still work

**DoD:**

- @dev agent fully story-aware and skill-capable
- Can execute story checklists with evidence
- Evidence requirements enforced in prompt
- `bun run typecheck` passes

**Rollback:**

- Delete `dev/` directory
- Keep using `sisyphus-junior/` directly

---

### 4.5 Subtask 1.5: Port Remaining Agents per ADR-0001 Mapping

**Owner:** @dev  
**Effort:** 1.5 days

#### 1.5.1 Product Manager (@pm) - NEW (No OMOC Predecessor)

- [ ] Create `src/agents/pm/index.ts`
  - **AC:** Agent config with mode="subagent"
  - **AC:** Prompt sections: Product Strategy, Roadmap Planning, Market Analysis, PRD Creation
  - **AC:** Metadata with triggers: "PRD needed", "roadmap decision", "market research"
  - **Verification:** `createPmAgent()` functional

#### 1.5.2 Product Owner (@po) - NEW (No OMOC Predecessor)

- [ ] Create `src/agents/po/index.ts`
  - **AC:** Prompt sections: Backlog Management, Story Creation, Prioritization, Stakeholder Communication
  - **AC:** Metadata with triggers: "story needed", "backlog grooming", "prioritization"
  - **Verification:** `createPoAgent()` functional

#### 1.5.3 Scrum Master (@sm) - PORT from Prometheus

- [ ] Create `src/agents/sm/index.ts` from `prometheus/`
  - **AC:** Port planning agent methodology (Interview/Consultant mode)
  - **AC:** Rename identity from "Prometheus" to "@sm - Scrum Master"
  - **AC:** Prompt sections: Sprint Planning, Story Breakdown, Task Decomposition, Complexity Assessment
  - **AC:** Keep planner-only constraint: "YOU ARE A PLANNER. YOU DO NOT WRITE CODE."
  - **Verification:** `createSmAgent()` functional

- [ ] Convert `prometheus/` to compatibility re-export
  - **AC:** `prometheus/index.ts` contains: `export * from '../sm'; export { createSmAgent as createPrometheusAgent };`
  - **Verification:** Existing Prometheus imports still work

#### 1.5.4 QA Agent (@qa) - PORT from Momus

- [ ] Create `src/agents/qa/index.ts` from `momus/`
  - **AC:** Port plan reviewer/critic patterns
  - **AC:** Rename identity from "Momus" to "@qa - Quality Assurance"
  - **AC:** Prompt sections: Quality Gates, Review-Build, Test-Design, Validation, Evidence Requirements
  - **AC:** Tool restrictions: deny write, edit (QA is reviewer, not implementer)
  - **Verification:** `createQaAgent()` functional

- [ ] Convert `momus/` to compatibility re-export
  - **AC:** `momus/index.ts` contains: `export * from '../qa'; export { createQaAgent as createMomusAgent };`
  - **Verification:** Existing Momus imports still work

#### 1.5.5 Architect (@architect) - PORT from Oracle

- [ ] Create `src/agents/architect/index.ts` from `oracle.ts`
  - **AC:** Port strategic advisor consultation patterns
  - **AC:** Rename identity from "Oracle" to "@architect - System Architect"
  - **AC:** Prompt sections: ADR Governance, System Design, Spec-Writing, Pattern Stewardship, Trade-off Analysis
  - **AC:** Constraint: "Never implement features. Your role is design, strategy, and advisory."
  - **Verification:** `createArchitectAgent()` functional

- [ ] Convert `oracle.ts` to compatibility re-export
  - **AC:** `oracle.ts` contains: `export * from './architect'; export { createArchitectAgent as createOracleAgent };`
  - **Verification:** Existing Oracle imports still work

#### 1.5.6 Analyst (@analyst) - PORT from Metis

- [ ] Create `src/agents/analyst/index.ts` from `metis.ts`
  - **AC:** Port pre-planning analysis capabilities
  - **AC:** Rename identity from "Metis" to "@analyst - Research Analyst"
  - **AC:** Prompt sections: Research, Documentation, Benchmarking, Project Structure Analysis
  - **AC:** Emphasis on exploration-before-action patterns
  - **Verification:** `createAnalystAgent()` functional

- [ ] Convert `metis.ts` to compatibility re-export
  - **AC:** `metis.ts` contains: `export * from './analyst'; export { createAnalystAgent as createMetisAgent };`
  - **Verification:** Existing Metis imports still work

#### 1.5.7 DevOps (@devops) - NEW (No OMOC Predecessor)

- [ ] Create `src/agents/devops/index.ts`
  - **AC:** Prompt sections: CI/CD Configuration, Infrastructure, Deployment, Monitoring, Security
  - **AC:** Metadata with triggers: "CI/CD setup", "deployment needed", "infrastructure"
  - **Verification:** `createDevopsAgent()` functional

#### 1.5.8 Registry Updates

- [ ] Update `src/agents/index.ts` exports
  - **AC:** Export all canonical agents: kord, deep, dev, qa, architect, sm, analyst, pm, po, devops
  - **AC:** Export all compatibility aliases: atlas, sisyphus, hephaestus (→ deep), sisyphus-junior, prometheus, momus, oracle, metis
  - **AC:** Export utility agents unchanged: librarian, explore, multimodal-looker
  - **Verification:** All 15+ exports resolve

- [ ] Update `src/agents/utils.ts` agentSources
  - **AC:** Add all canonical agents to `agentSources` map with `canonical: true`
  - **AC:** Add all aliases with `canonical: false, aliasFor: '<canonical-name>'`
  - **AC:** Verify: `Object.keys(agentSources).length` = canonical (9) + aliases (8) + utilities (3) = 20
  - **Verification:** `createBuiltinAgents()` creates all agents

**DoD:**

- All 15 agents defined (9 canonical + 8 aliases + 3 utilities)
- All OMOC agents have canonical Kord AIOS counterparts per ADR-0001
- Registry updated with alias resolution
- TypeScript compiles

**Rollback:**

- Remove new agent directories: `sm/`, `qa/`, `architect/`, `analyst/`, `pm/`, `po/`, `devops/`
- Revert registry changes in `index.ts` and `utils.ts`
- Keep only OMOC agents

---

### 4.6 Subtask 1.6: QA Validation Gate

**Owner:** @qa  
**Effort:** 0.5 days

- [ ] **1.6.1** Create agent validation test suite
  - **AC:** Test: All agents can be created via `createBuiltinAgents()`
  - **AC:** Test: All agent prompts contain required sections
  - **AC:** Test: Alias resolution works correctly
  - **File:** `src/agents/__tests__/agent-creation.test.ts`

- [ ] **1.6.2** Verify backward compatibility
  - **AC:** Test: Old agent names (sisyphus, hephaestus, etc.) still resolve
  - **AC:** Test: Old imports don't break
  - **Verification:** Run `bun test` compatibility suite

- [ ] **1.6.3** Validate agent prompt quality
  - **AC:** All prompts have: Role, Behavior_Instructions, Constraints
  - **AC:** Kord prompt has: Story_Lifecycle, Skill_Discovery sections
  - **Verification:** Prompt structure lint pass

- [ ] **1.6.4** Integration test: Agent delegation
  - **AC:** Test: Kord can delegate to dev
  - **AC:** Test: Dev can report story progress
  - **AC:** Test: QA can review dev output
  - **Verification:** Mock delegation flow passes

- [ ] **1.6.5** Documentation review
  - **AC:** Agent README updated with new names
  - **AC:** Migration guide notes aliases
  - **Verification:** Docs reviewed and approved

**DoD:**

- All tests pass
- Backward compatibility verified
- Documentation updated
- QA sign-off

**Rollback:**

- Address QA findings
- Re-run validation after fixes

---

## 5. Acceptance Criteria Summary (Per ADR-0001)

| AC ID | Criterion                                      | Verification Method                                                                                                    |
| ----- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Primary agents topology implemented            | `src/agents/plan/`, `build/`, `build-loop/`, `kord/` directories exist                                                 |
| AC-2  | Subagent @deep defined                         | `src/agents/deep/` directory exists                                                                                    |
| AC-3  | All canonical agents defined                   | `ls src/agents/*/index.ts` shows: plan, build, build-loop, kord, deep, dev, qa, architect, sm, analyst, pm, po, devops |
| AC-4  | Agent aliases functional (backward compat)     | Import test: `import { createAtlasAgent } from './agents'` passes                                                      |
| AC-5  | Prometheus → plan alias works                  | `createPrometheusAgent === createPlanAgent` returns true                                                               |
| AC-6  | Sisyphus → build alias works                   | `createSisyphusAgent === createBuildAgent` returns true                                                                |
| AC-7  | Atlas → build-loop alias works                 | `createAtlasAgent === createBuildLoopAgent` returns true                                                               |
| AC-8  | Hephaestus → deep alias works                  | `createHephaestusAgent === createDeepAgent` returns true                                                               |
| AC-9  | @plan prompt includes story decomposition      | String search: "Story_Decomposition" in plan prompt                                                                    |
| AC-10 | @build prompt includes interactive coding      | String search: "Interactive_Implementation" in build prompt                                                            |
| AC-11 | @build-loop includes autonomous execution      | String search: "Autonomous_Execution" in build-loop prompt                                                             |
| AC-12 | @deep includes research patterns               | String search: "Deep_Research" in deep prompt                                                                          |
| AC-13 | Dev agent includes evidence requirements       | String search: "lsp_diagnostics" in dev prompt                                                                         |
| AC-14 | All agents register in `createBuiltinAgents()` | `Object.keys(createBuiltinAgents()).length >= 16`                                                                      |
| AC-15 | TypeScript type check passes                   | `bun run typecheck` exit code 0                                                                                        |
| AC-16 | Unit tests pass                                | `bun test src/agents/` exit code 0                                                                                     |
| AC-17 | No duplicate agent instances                   | Aliases resolve to same factory function as canonical                                                                  |
| AC-18 | ADR-0001 topology documented                   | `docs/architecture/adr-0001-agent-topology.md` exists with canonical mapping table                                     |

---

## 6. File List (Per ADR-0001 Topology)

### Canonical Agent Directories to Create

| File                                          | Description                      | Subtask  |
| --------------------------------------------- | -------------------------------- | -------- |
| `src/agents/plan/index.ts`                    | Canonical planning agent         | 1.1      |
| `src/agents/plan/default.ts`                  | Claude-optimized plan prompt     | 1.1      |
| `src/agents/plan/gpt.ts`                      | GPT-optimized plan prompt        | 1.1      |
| `src/agents/build/index.ts`                   | Canonical builder                | 1.1      |
| `src/agents/build/default.ts`                 | Claude-optimized build prompt    | 1.1      |
| `src/agents/build/gpt.ts`                     | GPT-optimized build prompt       | 1.1      |
| `src/agents/build-loop/index.ts`              | Canonical autonomous loop        | 1.1      |
| `src/agents/kord/index.ts`                    | Canonical control-plane guardian | 1.1      |
| `src/agents/deep/index.ts`                    | Canonical deep research subagent | 1.1, 1.3 |
| `src/agents/dev/index.ts`                     | Canonical developer agent        | 1.4      |
| `src/agents/dev/default.ts`                   | Claude-optimized dev prompt      | 1.4      |
| `src/agents/dev/gpt.ts`                       | GPT-optimized dev prompt         | 1.4      |
| `src/agents/qa/index.ts`                      | Canonical QA agent               | 1.5.4    |
| `src/agents/architect/index.ts`               | Canonical architect agent        | 1.5.5    |
| `src/agents/sm/index.ts`                      | Canonical scrum master           | 1.5.3    |
| `src/agents/analyst/index.ts`                 | Canonical analyst agent          | 1.5.6    |
| `src/agents/pm/index.ts`                      | New product manager              | 1.5.1    |
| `src/agents/po/index.ts`                      | New product owner                | 1.5.2    |
| `src/agents/devops/index.ts`                  | New DevOps agent                 | 1.5.7    |
| `src/agents/__tests__/agent-creation.test.ts` | Agent validation tests           | 1.6      |

### Legacy Files to Convert to Re-exports

| File                                    | Changes                                            | Subtask |
| --------------------------------------- | -------------------------------------------------- | ------- |
| `src/agents/prometheus/index.ts`        | Convert to: `export * from '../plan'`              | 1.2     |
| `src/agents/prometheus/*.ts`            | Delete (moved to `plan/`)                          | 1.2     |
| `src/agents/sisyphus.ts`                | Convert to: `export * from './build'`              | 1.2     |
| `src/agents/atlas/index.ts`             | Convert to: `export * from '../build-loop'`        | 1.2     |
| `src/agents/atlas/default.ts`           | Delete (moved to `build-loop/default.ts`)          | 1.2     |
| `src/agents/atlas/gpt.ts`               | Delete (moved to `build-loop/gpt.ts`)              | 1.2     |
| `src/agents/atlas/utils.ts`             | Delete (move shared utils to `src/agents/shared/`) | 1.2     |
| `src/agents/hephaestus.ts`              | Convert to: `export * from './deep'`               | 1.2     |
| `src/agents/sisyphus-junior/index.ts`   | Convert to: `export * from '../dev'`               | 1.4     |
| `src/agents/sisyphus-junior/default.ts` | Delete (moved to `dev/default.ts`)                 | 1.4     |
| `src/agents/sisyphus-junior/gpt.ts`     | Delete (moved to `dev/gpt.ts`)                     | 1.4     |
| `src/agents/momus/index.ts`             | Convert to: `export * from '../qa'`                | 1.5.4   |
| `src/agents/momus/*.ts`                 | Delete (moved to `qa/`)                            | 1.5.4   |
| `src/agents/oracle.ts`                  | Convert to: `export * from './architect'`          | 1.5.5   |
| `src/agents/metis.ts`                   | Convert to: `export * from './analyst'`            | 1.5.6   |

### Registry Files to Modify

| File                  | Changes                                   | Subtask    |
| --------------------- | ----------------------------------------- | ---------- |
| `src/agents/index.ts` | Add all canonical + alias exports         | 1.5.8      |
| `src/agents/utils.ts` | Add `agentAliases` map, update resolution | 1.2, 1.5.8 |
| `src/agents/types.ts` | Extend metadata types if needed           | 1.1        |

### Files Unchanged (Utility Agents)

| File                              | Reason                             |
| --------------------------------- | ---------------------------------- |
| `src/agents/explore.ts`           | Utility agent, no canonical needed |
| `src/agents/librarian.ts`         | Utility agent, no canonical needed |
| `src/agents/multimodal-looker.ts` | Utility agent, no canonical needed |

---

## 7. Verification Commands

### Development Verification

```bash
# Type check
bun run typecheck

# Run agent tests
bun test src/agents/

# Verify agent creation
bun run -e "const { createBuiltinAgents } = require('./src/agents/utils'); console.log(Object.keys(createBuiltinAgents()))"
```

### Integration Verification

```bash
# Test agent resolution
bun run -e "const { createSisyphusAgent } = require('./src/agents'); console.log('Sisyphus alias:', typeof createSisyphusAgent)"

# Test kord creation
bun run -e "const { createKordAgent } = require('./src/agents/kord'); console.log('Kord:', typeof createKordAgent)"
```

### E2E Verification

```bash
# Build plugin
bun run build

# Test plugin loads agents
bun run -e "const plugin = require('./dist/index.js'); console.log('Plugin exports:', Object.keys(plugin))"
```

---

## 8. Definition of Done (DoD)

### Required (Per ADR-0001)

- [ ] **ADR-0001 topology implemented:** Primary orchestrator (@kord) with @deep subagent for intensive research
- [ ] All subtasks 1.1-1.6 complete with ACs verified
- [ ] TypeScript compilation passes (`bun run typecheck`)
- [ ] All unit tests pass (`bun test`)
- [ ] **Backward compatibility verified:** All legacy names (atlas, sisyphus, hephaestus, etc.) work as aliases
- [ ] **Canonical names functional:** kord, deep, dev, qa, architect, sm, analyst, pm, po, devops (hephaestus → deep alias maintained)
- [ ] Agent manifests generated in `.opencode/agents/`
- [ ] Documentation updated:
  - [ ] `src/agents/AGENTS.md` updated with topology
  - [ ] ADR-0001 cross-referenced in relevant docs
- [ ] QA sign-off obtained
- [ ] No console errors during agent initialization
- [ ] Story-driven workflow triggers present in kord prompt
- [ ] Autonomous execution patterns present in deep prompt

---

## 9. Rollback Procedure

If critical issues found:

1. **Immediate rollback:**

   ```bash
   git checkout -- src/agents/
   git clean -fd src/agents/kord/ src/agents/deep/ src/agents/dev/ src/agents/pm/ src/agents/po/ src/agents/sm/ src/agents/devops/ src/agents/analyst/
   ```

2. **Verify rollback:**

   ```bash
   bun run typecheck
   bun test
   ```

3. **Preserve changes:**
   - Save this story file
   - Document issues in story comments
   - Re-plan with fixes

---

## 10. Story-Driven Orchestration Contract

> This section defines the executable rules for story-driven development within Kord AIOS. It bridges OMOC's execution speed with AIOS's traceability requirements.
> See: [ADR-0002: Story-Driven Orchestration Protocol](../../architecture/adr-0002-story-driven-orchestration.md)

### 10.1 Invariant Rules for Build Agents

These rules **MUST** be followed by @build, @build-loop, @qa during execution:

| Rule                       | Enforcement                                                    | Violation Consequence            |
| -------------------------- | -------------------------------------------------------------- | -------------------------------- |
| **MUST have story**        | Before BUILD phase, verify story exists at `docs/stories/*.md` | Block and escalate to @sm        |
| **MUST read story**        | Parse context, ACs, and file list before any work              | Risk of incorrect implementation |
| **MUST update checkboxes** | Mark `[ ]` → `[x]` as tasks complete in real-time              | Loss of progress visibility      |
| **MUST update file list**  | Add modified files to "File List" section with status          | Incomplete documentation         |
| **MUST verify ACs**        | Each AC requires evidence before marking complete              | QA gate failure                  |
| **MUST escalate on drift** | If work diverges from story, STOP and escalate to @sm          | Silent drift, technical debt     |
| **MAY delegate to @deep**  | For intensive research, delegate to @deep subagent             | Inadequate research              |

### 10.2 Story Lifecycle State Transitions

```
DRAFT ──@plan/@sm──▶ PLANNING ──@sm──▶ READY_FOR_DEV ──@kord──▶ IN_PROGRESS
                                                                  │
                                ┌──────────────────────────────────┘
                                │ @build / @build-loop
                                ▼
                      ┌───────────────────┐
                 ┌────│ READY_FOR_REVIEW  │────┐
                 │    └─────────┬─────────┘    │
                 │              │ @qa          │
                 │              ▼              │
                 │    ┌───────────────────┐    │
                 └────│     APPROVED      ├────┘ (QA fail)
                      └─────────┬─────────┘
                                │ @kord
                                ▼
                         ┌───────────┐
                         │ COMPLETED │
                         └───────────┘
```

**Transition Authority:**

- @plan: DRAFT → PLANNING
- @sm: PLANNING → READY_FOR_DEV
- @kord: READY_FOR_DEV → IN_PROGRESS, APPROVED → COMPLETED
- @build / @build-loop: IN_PROGRESS → READY_FOR_REVIEW
- @qa: READY_FOR_REVIEW ↔ APPROVED

### 10.3 Fallback Path: Build → Plan

When @build or @build-loop detects story/PRD/spec issues mid-execution:

```
DETECTION
    │
    ├──▶ AC unclear ───────────────────▶ ESCALATE to @sm
    │
    ├──▶ AC contradicts PRD ───────────▶ ESCALATE to @sm + @po
    │
    ├──▶ Missing spec detail ──────────▶ ESCALATE to @architect
    │
    ├──▶ Need deep research ───────────▶ DELEGATE to @deep
    │
    ├──▶ Minor wording issue ──────────▶ DOCUMENT in story, continue
    │
    └──▶ Emergency fix needed ─────────▶ FIX + document + notify @sm/@po
```

**Escalation Protocol:**

1. STOP current work (preserve state)
2. Document issue in story "Implementation Notes"
3. Create escalation prompt with evidence
4. Await resolution before continuing

**Escalation Prompt Template:**

```markdown
## ESCALATION: [Issue Summary]

- Story: [path]
- Current State: [state]
- Issue: [description]
- Evidence: [specific quote/reference]
- Impact: [BLOCKED / can workaround]
- Proposed: [recommendation]
```

### 10.4 Artifact Update Authority Matrix

| Artifact         | Can Be Updated By  | Evidence Required           |
| ---------------- | ------------------ | --------------------------- |
| Story checkboxes | @dev, @qa          | Completion evidence         |
| Story ACs        | @sm                | Ambiguity/bug report        |
| Story scope      | @sm + @po approval | Stakeholder decision        |
| PRD              | @pm, @po           | Business requirement change |
| Spec/ADR         | @architect         | Technical justification     |

**Rule:** Build agents (@dev, @qa) NEVER update PRD/spec. They escalate.

### 10.5 QA Gate Behavior

**QA Entry Checklist:**

- [ ] All story checkboxes marked complete
- [ ] File list accurate and complete
- [ ] Build passes (exit code 0)
- [ ] Tests pass (or pre-existing failures documented)

**QA Exit Paths:**

| Finding                     | Action                     | Destination          |
| --------------------------- | -------------------------- | -------------------- |
| All ACs verified + evidence | Approve                    | APPROVED             |
| Implementation bug          | Return with evidence       | @build (IN_PROGRESS) |
| AC not met                  | Return with AC reference   | @build (IN_PROGRESS) |
| AC ambiguous                | Escalate for clarification | @sm (PLANNING)       |
| Missing AC                  | Escalate for story update  | @sm + @po            |

**QA Evidence Requirements:**

- Every finding must include: file path, line number, expected vs actual
- Approval requires: verification method + result for each AC

### 10.6 Emergency Override Protocol

**When @dev may bypass escalation:**

- Production system down or severely degraded
- No @sm/@po available
- Fix window < 1 hour

**Override Requirements:**

1. Document in story: bug description + fix + rationale
2. Notify @sm + @po in same session
3. @qa post-hoc review required

**Override Template:**

```markdown
## EMERGENCY OVERRIDE

- Time: [timestamp]
- Reason: [production down / no planner available / < 1hr window]
- Bug: [description]
- Fix: [summary]
- Risk if not fixed: [description]
- Post-hoc review: @qa assigned
```

### 10.7 OMOC Integration Points

| OMOC Pattern           | Kord AIOS Equivalent         | Notes                         |
| ---------------------- | ---------------------------- | ----------------------------- |
| `.sisyphus/plans/*.md` | `docs/stories/*.md`          | Story replaces plan file      |
| Notepad system         | Story "Implementation Notes" | Inline in story file          |
| Plan TODOs             | Story checkboxes             | Same `- [ ]` syntax           |
| 6-section prompt       | Story context + ACs          | Story provides sections 1,2,6 |

**Key Difference:**

- OMOC: Plan stored separately, mutable during execution
- Kord AIOS: Story is canonical; mutations require escalation to planning agents

### 10.8 Summary: Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│              BUILD AGENT QUICK REFERENCE                     │
├─────────────────────────────────────────────────────────────┤
│ BEFORE WORK:                                                │
│   □ Read story (docs/stories/*.md)                          │
│   □ Parse ACs and file list                                 │
│   □ Verify state is IN_PROGRESS                             │
│                                                             │
│ DURING WORK:                                                │
│   □ Update checkboxes as you complete tasks                 │
│   □ Add files to file list with status                      │
│   □ Document decisions in "Implementation Notes"            │
│                                                             │
│ IF ISSUE FOUND:                                             │
│   □ Minor? Document and continue                            │
│   □ AC/Story problem? STOP and escalate to @sm              │
│   □ PRD problem? Escalate to @pm/@po                        │
│   □ Spec problem? Escalate to @architect                    │
│   □ Emergency? Fix + document + notify                      │
│                                                             │
│ BEFORE COMPLETION:                                          │
│   □ All checkboxes marked [x]                               │
│   □ File list complete                                      │
│   □ Build passes                                            │
│   □ Tests pass                                              │
│   □ Evidence for each AC                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Notes & References

### Architecture References

- `docs/architecture/kord-aios-architecture.md` - Agent hierarchy diagram
- `docs/migration/naming-map.md` - Complete name mapping reference

### AIOS Methodology Sources

- `layer/aios/payload/rules/opencode-rules.md` - AIOS rules to inject
- `layer/aios/payload/skills/` - 176+ skill definitions

### OMOC Documentation

- `src/agents/dynamic-agent-prompt-builder.ts` - Prompt building patterns
- `src/hooks/rules-injector.ts` - Rules injection mechanism

---

_Last Updated: 2026-02-08_  
_Author: @architect (Oracle)_  
_Reviewers: @qa, @dev, @sm_
