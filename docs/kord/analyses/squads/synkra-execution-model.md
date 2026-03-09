# Synkra Squad Execution Model

## Purpose

Establish how Synkra actually runs squads so Kord can adopt the right mental model instead of copying only surface syntax.

## Core Finding

Synkra squads are not just a manifest that materializes agents.

They sit on top of a broader AIOS orchestration system with two distinct layers:

1. **Generic orchestration/workflow layer**
2. **Squad package layer**

This distinction matters. If Kord only copies the squad manifest pattern, it will miss the execution depth that makes Synkra squads coherent.

## Layer 1: Generic Orchestration/Workflow Layer

Evidence suggests Synkra has a general orchestration substrate that is not squad-specific:

- `D:\dev\synkra-aios\docs\guides\workflows-guide.md`
  - Documents workflow execution, workflow state, and `*run-workflow` modes.
- `D:\dev\synkra-aios\docs\guides\agents\traces\aios-master-execution-trace.md`
  - References `run-workflow-engine.md` and shows central workflow orchestration retained by the master orchestrator.
- `D:\dev\synkra-aios\docs\guides\service-discovery.md`
  - Documents a service registry covering tasks, templates, scripts, checklists, workflows, and related metadata.
- `D:\dev\synkra-aios\docs\guides\workflows\xref-phase6-supporting.md`
  - References workflow intelligence, orchestration, registries, execution modules, and related engine concepts.

### Interpretation

Synkra appears to treat workflows as first-class executable assets with:

- registry/discovery,
- state/progress management,
- execution modes,
- orchestration intelligence,
- and engine-level handling outside any one squad.

## Layer 2: Squad Package Layer

Synkra squads are packages that plug into the generic orchestration layer.

Evidence:

- `D:\dev\synkra-aios\.aios-core\schemas\squad-schema.json`
  - Defines `components.tasks`, `components.agents`, `components.workflows`, `components.checklists`, `components.templates`, `components.tools`, and `components.scripts`.
- `D:\dev\synkra-aios\docs\guides\agents\SQUAD-CREATOR-SYSTEM.md`
  - Describes v2 squads as orchestration-aware packages with workflows and skill dispatch.
- `D:\dev\synkra-aios\.aios-core\development\scripts\squad\squad-loader.js`
  - Loads squad manifests and resolves squad package structure.
- `D:\dev\synkra-aios\.aios-core\development\scripts\squad\README.md`
  - Frames squad scripts as deterministic utilities for load/validate/generate flows.

### Interpretation

In Synkra, a squad is not merely a named group of subagents. It is a domain package containing:

- agents,
- executable tasks,
- workflows,
- scripts/tools,
- templates/checklists/data,
- and metadata that helps orchestration consume the package consistently.

## Custom Runtime Logic Inside Squads

Some Synkra squads go beyond declarative packaging and include squad-specific runtime code.

Evidence:

- `D:\dev\synkra-aios\squads\mmos-squad\squad.yaml`
  - References files such as `workflow_detector.py`, `workflow_orchestrator.py`, and `workflow_preprocessor.py`.
- `D:\dev\synkra-aios\squads\mmos-squad\tasks\map-mind.md`
  - Explicitly says the task triggers a real workflow through orchestration code rather than simulating the process in prompt space.

### Interpretation

Synkra supports:

- generic orchestration engine behavior,
- plus optional squad-local orchestration code where the domain requires deeper runtime behavior.

## What This Means for Kord

Kord currently implements only part of this model.

### Already aligned

- squad as a team concept,
- chief/worker hierarchy,
- agent materialization from squad manifest,
- per-agent skills/tools/write-path declarations.

### Not yet aligned

- squad as a package with first-class tasks/workflows/scripts,
- squad participation in a workflow execution engine,
- clear boundary between generic engine behavior and squad-specific orchestration behavior,
- deterministic creation/validation flows for deep squad structure.

## Architecture Conclusion

Synkra does **not** look like “just a squad-specific delegator.”

It looks like:

- **a general orchestration engine**, plus
- **a squad packaging/authoring/validation system**, plus
- **optional squad-local runtime orchestration code** where needed.

Kord should therefore avoid two mistakes:

1. Treating squads as only prompt-declared agent teams.
2. Building a completely separate squad engine that duplicates the generic workflow engine unnecessarily.

## Recommendation

For Kord, the correct target model is:

- **Primary path**: squads are orchestration-aware packages that run on top of the shared Kord workflow/orchestration engine.
- **Extension path**: squads may optionally declare additional squad-local orchestration adapters where a domain truly needs them.

This preserves Synkra’s mental model while fitting Kord’s engine architecture.
