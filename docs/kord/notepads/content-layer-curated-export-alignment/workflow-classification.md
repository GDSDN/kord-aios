# Workflow Classification (Task 12)

Date: 2026-03-07

## Scope and Baseline

- In-scope set: all 14 workflows under `.kord/workflows/*.yaml`.
- Promotion baseline: the richer local/adapted workflows in `.kord/workflows/` (not the simplified builtin set).
- Engine compatibility reference:
  - Schema: `src/features/workflow-engine/schema.ts`
  - Runtime validation behavior: `src/features/workflow-engine/validator.ts`
  - Registry loading: `src/features/workflow-engine/registry.ts`

## Engine Compatibility Criteria Used

- Must parse against `WorkflowDefinitionSchema`.
- Must satisfy `sequence: z.array(WorkflowStepSchema).min(1)`.
- Step intents must be one of: `brainstorm | interview | research | agent | parallel | gate | handoff_to_plan`.
- Runtime warnings are allowed for preserved Synkra metadata fields (`triggers`, `config`, `pre_flight`, `completion`, `error_handling`, `resume`, `integration`) because they are explicitly non-executable in current runtime and retained for reporting.

## greenfield-fullstack Comparison (builtin vs local)

- `src/features/builtin-workflows/greenfield-fullstack.yaml`
  - 23 lines, 3-step simplified flow (`kickoff`, `architecture`, `implementation-plan`).
- `.kord/workflows/greenfield-fullstack.yaml`
  - 1038 lines, multi-phase adapted flow (bootstrap + planning + sharding + development cycle), extensive handoff and decision guidance, rich preserved Synkra metadata.
- Conclusion:
  - Local/adapted `greenfield-fullstack` is materially richer and should be treated as canonical promotion baseline.

## Classification Results (All 14)

| Workflow | Status | Rationale | Concerns |
|---|---|---|---|
| `story-development-cycle` | PROMOTE | Core lifecycle workflow; adapted sequence is valid and aligns with runtime-supported step model. | Schema is valid; validator warnings are metadata-only (`triggers/config/pre_flight/completion/error_handling/resume/integration`) plus non-blocking artifact ordering warnings. |
| `spec-pipeline` | PROMOTE | High-value methodology depth retained with executable adapted sequence. | Schema is valid; preserved Synkra runtime constructs remain warnings only and are currently non-executable runtime metadata. |
| `qa-loop` | PROMOTE | Valid adapted loop orchestration with clear step progression and runtime-compatible intents. | Schema is valid; non-executable Synkra runtime fields are preserved as warnings. |
| `greenfield-ui` | PROMOTE | Strong canonical candidate for UI-first greenfield planning + development cycle. | Schema is valid; warnings are limited to preserved metadata constructs. |
| `greenfield-service` | PROMOTE | Strong canonical candidate for service/API-first greenfield projects. | Schema is valid; warnings are preserved metadata only. |
| `greenfield-fullstack` | PROMOTE | Materially richer canonical baseline than builtin simplified version and fully schema-compatible. | Schema is valid; warnings are preserved metadata only. |
| `epic-orchestration` | NEEDS-REVIEW | Valuable workflow concept, but not promotable in current adapted shape. | **Schema failure**: `sequence` is empty and violates `min(1)` requirement. |
| `development-cycle` | NEEDS-REVIEW | Valuable inner-loop model, but not promotable in current adapted shape. | **Schema failure**: `sequence` is empty and violates `min(1)` requirement. |
| `design-system-build-quality` | PROMOTE | Useful quality-focused pipeline with coherent phase flow and adapted executable sequence. | Schema is valid; warnings are preserved metadata only. |
| `brownfield-ui` | PROMOTE | Strong canonical candidate for UI enhancement in existing systems. | Schema is valid; warnings are preserved metadata only. |
| `brownfield-service` | PROMOTE | Strong canonical candidate for service/API enhancement in existing systems. | Schema is valid; warnings are preserved metadata only. |
| `brownfield-fullstack` | PROMOTE | Strong canonical candidate for full-stack enhancement with routing + planning + delivery cycle. | Schema is valid; warnings are preserved metadata only. |
| `brownfield-discovery` | PROMOTE | Comprehensive brownfield discovery workflow remains valid despite high content richness. | Schema is valid; warnings are preserved metadata only. |
| `auto-worktree` | SKIP | Not suitable for direct builtin promotion under current workflow runtime contract. | Although schema-valid, it assumes external execution dependencies (`git worktree`, `.aios-core/infrastructure/scripts/worktree-manager.js`, scripted side effects) not directly executed by current workflow runtime. |

## Summary Counts

- PROMOTE: 11
- NEEDS-REVIEW: 2
- SKIP: 1

## Key Promotion Notes for Task 13

- Promote from `.kord/workflows/` baseline for the 11 `PROMOTE` workflows.
- Do not promote `epic-orchestration` and `development-cycle` until `sequence` is repaired to pass schema.
- Do not promote `auto-worktree` until runtime support/dependency contract is clarified and implemented.
- Keep explicit note that Synkra runtime constructs remain preserved metadata in current engine and are not yet executable.
