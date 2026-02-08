# ADR-0001: Agent Topology and Naming Decision

**Status:** ACCEPTED  
**Date:** 2026-02-07  
**Author:** @architect (Oracle)  
**Scope:** Module 1 - Agent System Fusion

---

## 1. Problem Statement

Atlas and Sisyphus have overlapping orchestration responsibilities causing confusion:

- **Atlas** (`src/agents/atlas/`): "Master Orchestrator" - holds todo list, coordinates multi-agent execution
- **Sisyphus** (`src/agents/kord.ts`): "Main orchestrator" - unified orchestrator, story lifecycle management

Both claim "primary" mode, both orchestrate, but their actual implementations are nearly identical.

**Evidence:**

- `src/agents/atlas/default.ts:22`: "Master Orchestrator" identity, "holds up the entire workflow"
- Unified orchestrator patterns with identical delegation behavior
- `src/agents/AGENTS.md:8-11`: Lists Sisyphus, Atlas, Prometheus as "Primary Agents"
- `src/agents/AGENTS.md:50-52`: Atlas and Sisyphus both use high-tier models (claude-opus-4-6 / claude-sonnet-4-5)

---

## 1.1 Canonical UX Model (Final)

### Primary Agents

| Open-AIOS Agent | Purpose                                                          | Mode    | Model Tier |
| --------------- | ---------------------------------------------------------------- | ------- | ---------- |
| **@plan**       | Interactive planning, requirements analysis, story decomposition | primary | EXPENSIVE  |
| **@build**      | Interactive implementation, coding, debugging                    | primary | EXPENSIVE  |
| **@build-loop** | Autonomous execution loop, background task processing            | primary | EXPENSIVE  |
| **@kord**       | Control-plane guardian, framework-level orchestration            | primary | EXPENSIVE  |

### Subagent

| Open-AIOS Agent | Purpose                                                  | Mode     | Model Tier |
| --------------- | -------------------------------------------------------- | -------- | ---------- |
| **@deep**       | Deep research, complex analysis, intensive investigation | subagent | EXPENSIVE  |

### Where Each Acts

```
User Input
    │
    ▼
┌─────────┐    ┌─────────────┐    ┌──────────┐
│  @plan  │───▶│ @build-loop │───▶│  @deep   │
│(analyze)│    │  (execute)  │    │(research)│
└────┬────┘    └──────┬──────┘    └────┬─────┘
     │                │                │
     │                ▼                │
     │         ┌─────────────┐         │
     └────────▶│   @build    │◀────────┘
               │(implement)  │
               └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │  QA Gate    │
               │  (@qa)      │
               └─────────────┘
```

**Note:** YOLO is a **command/policy** (`--yolo`, `-y`), NOT an agent identity. It modifies agent behavior to skip confirmation prompts.

---

## 1.2 Canonical Name Mapping Table

| OMOC (Legacy)   | AIOS (Framework) | Open-AIOS (Canonical) | Type     | Notes                                 |
| --------------- | ---------------- | --------------------- | -------- | ------------------------------------- |
| prometheus      | plan             | **@plan**             | primary  | Planning agent, requirements analysis |
| sisyphus        | build            | **@build**            | primary  | Interactive builder, coding           |
| atlas           | build-loop       | **@build-loop**       | primary  | Autonomous execution loop             |
| hephaestus      | deep             | **@deep**             | subagent | Deep research, intensive analysis     |
| aios-master     | kord             | **@kord**             | primary  | Control-plane, framework guardian     |
| momus           | qa               | **@qa**               | subagent | Quality assurance                     |
| oracle          | architect        | **@architect**        | subagent | System design, ADRs                   |
| metis           | analyst          | **@analyst**          | subagent | Research, benchmarking                |
| sisyphus-junior | dev              | **@dev**              | subagent | Implementation (legacy pattern)       |

**Key Points:**

- OMOC names are **compatibility aliases only** - no new code uses them
- AIOS names (plan, build, build-loop, deep) are for framework-level references
- Open-AIOS names are **user-facing** - what users type to invoke agents
- All aliases resolve to the same runtime implementation (no duplicate instances)

---

## 2. Findings: What Each Actually Does

| OMOC Name       | Canonical Open-AIOS | Actual Role                       | Key Evidence                                     |
| --------------- | ------------------- | --------------------------------- | ------------------------------------------------ |
| **atlas**       | **@build-loop**     | Autonomous execution loop (todo)  | "conductor of a symphony"; continuous execution  |
| **sisyphus**    | **@build**          | Interactive builder (story)       | Interactive implementation, coding, debugging    |
| **prometheus**  | **@plan**           | Planning, requirements analysis   | Story decomposition, complexity assessment       |
| **hephaestus**  | **@deep**           | Deep research, intensive analysis | Autonomous deep worker, background tasks         |
| **aios-master** | **@kord**           | Control-plane guardian            | Framework orchestration, methodology enforcement |

**Critical Observation:**
Atlas (autonomous loop) and Sisyphus (interactive builder) have distinct purposes—**they are NOT the same agent**. Atlas → @build-loop, Sisyphus → @build. They serve different phases of the workflow.

---

## 3. Options Considered

### Option A: Single Orchestrator (Rejected)

**Approach:** Consolidate all into single `@kord` agent.

**Why Rejected:**

- Collapses distinct workflow phases (planning vs building vs deep work)
- Loses specialized optimization opportunities (each phase needs different model/prompt)
- Overloading one agent creates context bloat

---

### Option B: Multi-Agent Pipeline (SELECTED)

**Approach:** Four primary agents with clear separation of concerns:

| Phase      | Agent           | Purpose                                            |
| ---------- | --------------- | -------------------------------------------------- |
| Plan       | **@plan**       | Requirements, decomposition, complexity assessment |
| Build      | **@build**      | Interactive implementation, user collaboration     |
| Build-Loop | **@build-loop** | Autonomous execution, background processing        |
| Deep       | **@deep**       | Intensive research, analysis (subagent)            |
| Guardian   | **@kord**       | Framework orchestration, methodology enforcement   |

**Pros:**

- Each agent optimized for its phase
- Clear mental model: Plan → Build/Build-Loop → Deep → QA
- Enables phase-specific model selection
- Preserves backward compatibility via aliases

**Cons:**

- More agents to understand (mitigated by clear naming)

**Effort:** Medium (2-3 days) - documentation and alias setup

---

### Option C: Keep Legacy Dual Names (Rejected)

**Approach:** Preserve Atlas and Sisyphus as separate agents with different purposes.

**Why Rejected:**

- Perpetuates confusion
- No clear guidance on Atlas vs Sisyphus vs Hephaestus selection
- Technical debt accumulates
- Greek mythology names don't convey purpose

---

## 4. Decision

**SELECTED: Option B - Multi-Agent Pipeline with Clear Separation**

**Rationale:**

1. **Phase-optimized:** Each agent tuned for its specific workflow phase
2. **Clear semantics:**
   - @plan = requirements analysis, story decomposition
   - @build = interactive implementation, user collaboration
   - @build-loop = autonomous execution, background processing
   - @deep = intensive research, complex analysis
   - @kord = control-plane guardian, methodology enforcement
3. **Natural workflow fit:** Plan → Build/Build-Loop → Deep → QA → Complete
4. **Preserved investment:** Legacy names become aliases, no functionality lost
5. **Model optimization:** Phase-specific model selection (plan=reasoning, build=code, deep=research)

---

## 5. Final Naming Map

### Primary Tier (User-Facing Entry Points)

| Open-AIOS       | AIOS Reference | OMOC Alias  | Purpose                                         | Mode    | Model Tier |
| --------------- | -------------- | ----------- | ----------------------------------------------- | ------- | ---------- |
| **@plan**       | plan           | prometheus  | Requirements analysis, story decomposition      | primary | EXPENSIVE  |
| **@build**      | build          | sisyphus    | Interactive implementation, coding              | primary | EXPENSIVE  |
| **@build-loop** | build-loop     | atlas       | Autonomous execution loop, background tasks     | primary | EXPENSIVE  |
| **@kord**       | kord           | aios-master | Control-plane guardian, framework orchestration | primary | EXPENSIVE  |

### Subagent Tier (Delegated Work)

| Open-AIOS      | AIOS Reference | OMOC Alias      | Purpose                               | Mode     | Model Tier |
| -------------- | -------------- | --------------- | ------------------------------------- | -------- | ---------- |
| **@deep**      | deep           | hephaestus      | Deep research, intensive analysis     | subagent | EXPENSIVE  |
| **@dev**       | dev            | sisyphus-junior | Implementation, coding, debugging     | subagent | Capable    |
| **@qa**        | qa             | momus           | Quality assurance, review, validation | subagent | Capable    |
| **@architect** | architect      | oracle          | System design, ADRs, patterns         | subagent | EXPENSIVE  |
| **@sm**        | sm             | —               | Story management, planning support    | subagent | Capable    |
| **@analyst**   | analyst        | metis           | Research, analysis, benchmarking      | subagent | Efficient  |
| **@pm**        | pm             | —               | Product strategy, roadmaps            | subagent | Capable    |
| **@po**        | po             | —               | Backlog management, prioritization    | subagent | Capable    |
| **@devops**    | devops         | —               | CI/CD, infrastructure                 | subagent | Capable    |

### Utility Tier (Unchanged)

| Name                  | Purpose              | Mode     | Model Tier |
| --------------------- | -------------------- | -------- | ---------- |
| **librarian**         | Multi-repo research  | subagent | CHEAP      |
| **explore**           | Fast contextual grep | subagent | FREE       |
| **multimodal-looker** | Media analysis       | subagent | CHEAP      |

### Complete Mapping Table (OMOC | AIOS | Open-AIOS)

| OMOC (Legacy)   | AIOS (Framework) | Open-AIOS (User-Facing) |
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
| —               | pm               | **@pm**                 |
| —               | po               | **@po**                 |
| —               | sm               | **@sm**                 |
| —               | devops           | **@devops**             |

---

## 6. Compatibility Policy

### Legacy Name Support (Alias Map)

```typescript
// src/agents/utils.ts - agentSources
const agentSources: Record<string, AgentSource> = {
  // Canonical Open-AIOS names (user-facing)
  plan: { factory: createPlanAgent, canonical: true },
  build: { factory: createBuildAgent, canonical: true },
  "build-loop": { factory: createBuildLoopAgent, canonical: true },
  kord: { factory: createKordAgent, canonical: true },
  deep: { factory: createDeepAgent, canonical: true },
  dev: { factory: createDevAgent, canonical: true },
  qa: { factory: createQaAgent, canonical: true },
  architect: { factory: createArchitectAgent, canonical: true },
  // ... etc

  // OMOC Compatibility aliases (no warnings)
  prometheus: { factory: createPlanAgent, canonical: false, aliasFor: "plan" },
  sisyphus: { factory: createBuildAgent, canonical: false, aliasFor: "build" },
  atlas: {
    factory: createBuildLoopAgent,
    canonical: false,
    aliasFor: "build-loop",
  },
  hephaestus: { factory: createDeepAgent, canonical: false, aliasFor: "deep" },
  "aios-master": {
    factory: createKordAgent,
    canonical: false,
    aliasFor: "kord",
  },
  "sisyphus-junior": {
    factory: createDevAgent,
    canonical: false,
    aliasFor: "dev",
  },
  momus: { factory: createQaAgent, canonical: false, aliasFor: "qa" },
  oracle: {
    factory: createArchitectAgent,
    canonical: false,
    aliasFor: "architect",
  },
  metis: { factory: createAnalystAgent, canonical: false, aliasFor: "analyst" },
};
```

### File Structure

```
src/agents/
├── plan/index.ts           # Canonical planning agent (new)
├── build/index.ts          # Canonical builder (from sisyphus)
├── build-loop/index.ts     # Canonical autonomous loop (from atlas)
├── kord/index.ts           # Canonical control-plane guardian
├── deep/index.ts           # Canonical deep research (from hephaestus)
├── dev/index.ts            # Canonical dev agent
├── qa/index.ts             # Canonical QA agent
├── architect/index.ts      # Canonical architect agent
├── sm/index.ts             # Canonical SM agent
├── analyst/index.ts        # Canonical analyst agent
├── pm/index.ts             # New
├── po/index.ts             # New
├── devops/index.ts         # New
├── librarian.ts            # Unchanged
├── explore.ts              # Unchanged
├── multimodal-looker.ts    # Unchanged
// Legacy re-exports (compatibility)
├── prometheus.ts           # Re-export: export * from './plan'
├── sisyphus.ts             # Re-export: export * from './build'
├── atlas/                  # Re-export: export * from '../build-loop'
├── hephaestus.ts           # Re-export: export * from './deep'
├── sisyphus-junior/        # Re-export: export * from '../dev'
├── momus/                  # Re-export: export * from '../qa'
├── oracle.ts               # Re-export: export * from './architect'
├── metis.ts                # Re-export: export * from './analyst'
└── utils.ts                # Updated with alias resolution
```

### No Deprecation Warnings (Phase 1)

Legacy OMOC names continue working indefinitely without warnings. Deprecation warnings may be added in Phase 2 (post-stabilization) if desired. Use Open-AIOS canonical names in all new documentation and code.

---

## 7. Implications for Implementation

### Immediate Actions

1. **Create canonical directories:**
   - `src/agents/plan/` (from `prometheus/`)
   - `src/agents/build/` (from `sisyphus.ts`)
   - `src/agents/build-loop/` (from `atlas/`)
   - `src/agents/kord/` (control-plane guardian)
   - `src/agents/deep/` (from `hephaestus.ts`)

2. **Convert legacy files to re-exports:**
   - `prometheus/` → re-export from `plan/`
   - `sisyphus.ts` → re-export from `build/`
   - `atlas/` → re-export from `build-loop/`
   - `hephaestus.ts` → re-export from `deep/`
   - Continue pattern for dev, qa, architect, analyst

3. **Update registry:**
   - `src/agents/utils.ts`: Add alias resolution logic
   - `src/agents/index.ts`: Export canonical names + aliases

### No Code Changes Required For

- Hook implementations (they use agent names as identifiers, continue working)
- Existing user configs referencing `sisyphus`, `atlas`, etc.
- Skill definitions (they reference @plan, @build, @build-loop, @deep, @dev, @qa which map correctly)

### Documentation Updates Required

- `src/agents/AGENTS.md`: Update with canonical names + alias table
- User-facing docs: Promote @plan, @build, @build-loop, @deep as primary names
- Migration guide: Note that old names continue working

---

## 8. Trade-off Summary

| Aspect                    | Before (Legacy)                         | After (This Decision)                               |
| ------------------------- | --------------------------------------- | --------------------------------------------------- |
| **User confusion**        | High (Atlas vs Sisyphus vs Hephaestus?) | Low (Plan → Build/Build-Loop → Deep clear pipeline) |
| **Phase optimization**    | None (one-size-fits-all)                | High (each agent tuned for its phase)               |
| **Code duplication**      | Medium (similar prompts)                | Low (canonical implementations, thin aliases)       |
| **Backward compat**       | N/A (baseline)                          | Preserved (OMOC aliases work indefinitely)          |
| **New user learning**     | Complex (11 Greek names)                | Simpler (4 primary + 1 subagent + specialists)      |
| **Implementation effort** | —                                       | Medium (new agent directories, alias mapping)       |

---

## 9. Related Decisions

- **ADR-0002:** Story-Driven Orchestration Protocol
- **ADR-0003:** Skill discovery protocol (pending)
- **Story:** OPEN-AIOS-001 (Module 1: Agent System Fusion)

---

## Appendix A: YOLO Mode Clarification

**YOLO is a COMMAND/POLICY, NOT an agent identity.**

```bash
# YOLO as a flag
open-aios build --yolo          # Skip confirmations
open-aios build -y              # Short form

# NOT as an agent
@yolo build something           # WRONG - @yolo does not exist
```

YOLO modifies agent behavior to:

- Skip user confirmation prompts
- Auto-accept non-destructive operations
- Fail fast on permission errors
- Log all decisions for audit trail

Agents that support YOLO mode: @build, @build-loop, @deep

---

## 10. Changelog

| Date       | Change           | Author     |
| ---------- | ---------------- | ---------- |
| 2026-02-07 | Initial decision | @architect |
