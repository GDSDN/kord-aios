# Kord Current-State Gap Analysis for Squads

## Purpose

Document where Kord squad support is strong, where it is shallow, and what must change to reach Synkra-level orchestration depth.

## Current Strengths

Kord already has a solid **team materialization layer**.

### Implemented capabilities

- `D:\dev\kord-aios\src\features\squad\schema.ts`
  - Squad manifest schema for agent declarations, fallback, write paths, skills, and metadata.
- `D:\dev\kord-aios\src\features\squad\factory.ts`
  - Converts squad agents into runtime `AgentConfig` entries.
  - Handles chief awareness and runtime permissions.
- `D:\dev\kord-aios\src\features\squad\chief-template.ts`
  - Defines chief coordination behavior.
- `D:\dev\kord-aios\src\features\squad\loader.ts`
  - Loads project/global squads from user-controlled locations.
- `D:\dev\kord-aios\src\hooks\agent-authority\index.ts`
  - Supports squad-related write controls and scoped exceptions.
- `D:\dev\kord-aios\src\agents\squad-creator.ts`
  - Provides dedicated squad creation support.

### Conceptual quality already present

- Squads as teams.
- Chief/worker hierarchy.
- Prefixed runtime naming.
- On-demand skill philosophy.
- User/global squad storage model.

## Current Shallow Areas

Kord squad support remains shallow in the exact places Synkra is deep.

### 1. Squad scope is mostly agent-only

Current squad support focuses on agents and prompt coordination, not full squad packages.

Missing first-class runtime treatment for:

- squad tasks,
- squad workflows,
- squad templates/checklists/data,
- squad-local scripts/tools as execution assets.

### 2. No explicit squad orchestration contract

Kord currently expresses squad coordination mostly through the chief prompt pattern.

That is useful, but it is not the same as a formal orchestration contract.

Missing:

- how a squad invokes workflows,
- how a workflow invokes squad members,
- how squads compose as subteams,
- what state/progress handoff exists across squad execution.

### 3. Validation depth is too light

`D:\dev\kord-aios\src\tools\squad-validate\tools.ts` validates:

- YAML parse,
- Zod schema,
- prompt file existence,
- executor/reviewer references,
- basic warnings.

It does not yet validate:

- skill existence,
- categories absence/deprecation,
- package completeness,
- task/workflow references,
- orchestration integrity,
- chief routing completeness,
- compatibility with the broader workflow engine.

### 4. Schema still contains the wrong concept

`D:\dev\kord-aios\src\features\squad\schema.ts` still contains `categories`.

That conflicts with the clarified design:

- squads are teams,
- chief coordinates,
- categories do not belong to squad semantics.

### 5. Squad creator is not yet a full deterministic authoring system

Kord’s squad creator exists, but it is not yet at Synkra’s depth for:

- research-first creation,
- anti-generic prompt construction,
- package generation across agents/tasks/workflows,
- formal validation loops,
- migration and extension workflows.

## Gap Summary

### Kord today

`squad = agent team + chief prompt + permissions + storage`

### Kord target

`squad = orchestration-aware domain package that contains agents, tasks, workflows, validation logic, and optional local orchestration adapters`

## Recommended Gap Framing

The missing pieces should be treated as **architectural layers**, not scattered features.

### Layer 1: Squad package model

Need a richer squad contract for:

- agents,
- tasks,
- workflows,
- templates/checklists/data,
- optional scripts/adapters.

### Layer 2: Orchestration integration

Need explicit mapping between:

- Kord workflow engine,
- squad package assets,
- chief delegation,
- subteam execution patterns.

### Layer 3: Deterministic authoring and validation

Need stronger creation/validation behavior so squads are not generic or structurally incomplete.

## Immediate Design Implications

- Remove `categories` from squad semantics.
- Upgrade squad planning from “agent team feature” to “package + orchestration architecture.”
- Treat previously implemented squad work as a foundation, not the final model.
- Re-plan squads alongside the separate workflow-engine effort so responsibilities stay clean.
