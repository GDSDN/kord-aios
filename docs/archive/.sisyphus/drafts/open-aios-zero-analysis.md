# Kord AIOS Zero-Based Comparative Analysis

Generated: 2026-02-09T03:05:59.469Z

## Inputs

- OMOC root: D:\dev\kord-aios
- Synkra source: C:\Users\NASCIM~1\AppData\Local\Temp\kord-aios-analysis\synkra-aios-core
- Synkra repo: https://github.com/SynkraAI/aios-core.git

## OMOC Module Inventory

| Module | Path | File Count | Examples |
|---|---|---:|---|
| src/cli | src/cli | 69 | src/cli/AGENTS.md, src/cli/config-manager.test.ts, src/cli/config-manager.ts |
| src/agents | src/agents | 32 | src/agents/AGENTS.md, src/agents/dynamic-agent-prompt-builder.test.ts, src/agents/dynamic-agent-prompt-builder.ts |
| src/hooks | src/hooks | 171 | src/hooks/AGENTS.md, src/hooks/context-window-monitor.ts, src/hooks/empty-task-response-detector.ts |
| src/tools | src/tools | 114 | src/tools/AGENTS.md, src/tools/index.ts, src/tools/task/index.ts |
| src/features | src/features | 136 | src/features/AGENTS.md, src/features/tool-metadata-store/index.test.ts, src/features/tool-metadata-store/index.ts |
| src/config | src/config | 4 | src/config/AGENTS.md, src/config/index.ts, src/config/schema.test.ts |
| src/plugin-handlers | src/plugin-handlers | 6 | src/plugin-handlers/AGENTS.md, src/plugin-handlers/config-handler.test.ts, src/plugin-handlers/config-handler.ts |

### OMOC UX Commands (/commands)

- handoff
- init-deep
- ralph-loop
- refactor
- start-work
- stop-continuation

### OMOC Skills

- dev-browser
- frontend-ui-ux
- git-master
- playwright

### OMOC Agent Names (discovered)

- atlas
- explore
- hephaestus
- librarian
- metis
- momus
- multimodal-looker
- oracle
- prometheus
- sisyphus
- sisyphus-junior

### OMOC Architectural Signals

- src/cli/install.ts
- src/agents/utils.ts
- src/hooks/index.ts
- src/tools/delegate-task/executor.ts
- src/index.ts

## Synkra AIOS Module Inventory

| Module | Path | File Count | Examples |
|---|---|---:|---|
| .aios-core | .aios-core | 880 | .aios-core/constitution.md, .aios-core/core-config.yaml, .aios-core/framework-config.yaml |
| docs | docs | 539 | docs/agent-reference-guide.md, docs/aios-nomenclature-specification.md, docs/CHANGELOG.md |
| docs/guides | docs/guides | 81 | docs/guides/ade-guide.md, docs/guides/agent-selection-guide.md, docs/guides/api-reference.md |
| docs/architecture | docs/architecture | 60 | docs/architecture/ADE-AGENT-CHANGES.md, docs/architecture/ADE-ARCHITECT-HANDOFF.md, docs/architecture/ade-architecture.md |
| squads | squads | 1273 | squads/squad-creator/CHANGELOG.md, squads/squad-creator/config.yaml, squads/squad-creator/extract-sop.md |

### Synkra Star Commands (*commands)

- analyze-paths
- apply-migration
- apply-qa-fix
- assess-complexity
- brainstorm
- capture-insights
- cleanup-worktrees
- command
- correct-course
- create-agent
- create-architecture
- create-brownfield-prd
- create-context
- create-epic
- create-fix-request
- create-migration-plan
- create-plan
- create-pr
- create-prd
- create-project-brief
- create-schema
- create-squad
- create-story
- create-suite
- create-task
- create-worktree
- critique-spec
- deploy
- develop
- doc-out
- draft
- execute-checklist
- execute-subtask
- exit
- extract-patterns
- fix-qa-issues
- gather-requirements
- guide
- help
- inventory-assets
- list-gotchas
- list-worktrees
- map-codebase
- merge-worktree
- migrate-agent
- migrate-batch
- push
- release
- request-fix
- research
- research-deps
- review
- review-build
- rollback
- security-audit
- session-info
- shard-doc
- task
- track-attempt
- validate-workflow
- verify-fix
- workflow
- write-spec
- yolo

### Synkra Agent IDs (@agent)

- aios-master
- analyst
- architect
- data-engineer
- dev
- devops
- pm
- po
- qa
- sm
- ux-expert

### Synkra Workflow Artifacts

- squads/squad-creator/workflows/mind-research-loop.md
- squads/squad-creator/workflows/research-then-create-agent.md
- squads/squad-creator/workflows/validate-squad.yaml
- squads/squad-creator/workflows/wf-clone-mind.yaml
- squads/squad-creator/workflows/wf-create-squad.yaml
- squads/squad-creator/templates/workflow-tmpl.yaml
- squads/squad-creator/tasks/create-workflow.md
- squads/mmos-squad/tasks/auto-detect-workflow.md
- squads/mmos-squad/tasks/detect-workflow-mode.md
- squads/mmos-squad/minds/kent_beck/system_prompts/system-prompt-dev-workflow-v1.0.md
- docs/git-workflow-guide.md
- docs/stories/epics/epic-activation-pipeline/story-act-5-workflow-navigator-bob.md
- docs/pt/git-workflow-guide.md
- docs/pt/guides/workflows-guide.md
- docs/pt/guides/hybridOps/workflow-diagram.md
- docs/pt/architecture/contribution-workflow-research.md
- docs/guides/workflows-guide.md
- docs/guides/workflows/AIOS-COMPLETE-CROSS-REFERENCE-ANALYSIS.md
- docs/guides/workflows/AUTO-WORKTREE-WORKFLOW.md
- docs/guides/workflows/BROWNFIELD-DISCOVERY-WORKFLOW.md
- docs/guides/workflows/BROWNFIELD-FULLSTACK-WORKFLOW.md
- docs/guides/workflows/BROWNFIELD-SERVICE-WORKFLOW.md
- docs/guides/workflows/BROWNFIELD-UI-WORKFLOW.md
- docs/guides/workflows/DESIGN-SYSTEM-BUILD-QUALITY-WORKFLOW.md
- docs/guides/workflows/GREENFIELD-FULLSTACK-WORKFLOW.md
- docs/guides/workflows/GREENFIELD-SERVICE-WORKFLOW.md
- docs/guides/workflows/GREENFIELD-UI-WORKFLOW.md
- docs/guides/workflows/pro-developer-workflow.md
- docs/guides/workflows/QA-LOOP-WORKFLOW.md
- docs/guides/workflows/SPEC-PIPELINE-WORKFLOW.md
- docs/guides/workflows/STORY-DEVELOPMENT-CYCLE-WORKFLOW.md
- docs/guides/workflows/WORKFLOW-TASK-AGENT-ANALYSIS.md
- docs/guides/workflows/xref-phase2-templates.md
- docs/guides/workflows/xref-phase3-scripts.md
- docs/guides/workflows/xref-phase4-infra.md
- docs/guides/workflows/xref-phase5-core.md
- docs/guides/workflows/xref-phase6-supporting.md
- docs/guides/hybridOps/workflow-diagram.md
- docs/es/git-workflow-guide.md
- docs/es/guides/workflows-guide.md
- docs/es/guides/hybridOps/workflow-diagram.md
- docs/es/architecture/contribution-workflow-research.md
- docs/es/aios-workflows/auto-worktree-workflow.md
- docs/es/aios-workflows/brownfield-discovery-workflow.md
- docs/es/aios-workflows/brownfield-fullstack-workflow.md
- docs/es/aios-workflows/brownfield-service-workflow.md
- docs/es/aios-workflows/brownfield-ui-workflow.md
- docs/es/aios-workflows/design-system-build-quality-workflow.md
- docs/es/aios-workflows/greenfield-fullstack-workflow.md
- docs/es/aios-workflows/greenfield-service-workflow.md

### Synkra Architectural Signals

- README.md
- docs/guides/user-guide.md
- docs/architecture/command-authority-matrix.md
- .aios-core

## Kord AIOS Naming Proposal (Evidence-Based)

### Principles

- UX names must describe responsibility, not mythology.
- Primary workflow names should map to lifecycle phases: plan -> build -> review -> release.
- Specialist names should follow AIOS role vocabulary for familiarity (@dev, @qa, @architect, @pm, @po, @sm).
- Utility agents may keep capability names when they are already discoverable (librarian, explore).

### Canonical Names

- Primary: @plan, @build, @build-loop, @kord
- Specialist: @dev, @qa, @architect, @pm, @po, @sm, @analyst, @devops, @data-engineer, @ux-expert
- Utility: @deep, librarian, explore, multimodal-looker

### Rationale

- @plan/@build names are short, imperative, and aligned with story-driven phases.
- @build-loop clearly communicates autonomous execution mode.
- @kord is reserved as governance/control-plane identity for methodology enforcement.
- Specialist names mirror AIOS so users can transfer mental models with minimal relearning.

## How to Use This Output

1. Confirm canonical naming before implementation.
2. Lock module boundaries (engine vs framework) using module inventories above.
3. Derive implementation stories from gaps between OMOC runtime and AIOS methodology artifacts.
