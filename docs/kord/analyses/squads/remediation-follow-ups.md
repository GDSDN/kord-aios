# Analysis: Squad Orchestration Remediation Follow-ups

This artifact records the staged follow-up gaps left intentionally out of the current squad orchestration remediation pass. While blocker-level documentation and seed drift (such as the removal of legacy `categories` semantics) are being addressed now, the following items remain as follow-up work.

## Staged Follow-up Items

### 1. Legacy `squad_load` Compatibility/Output Shape
- **Description**: The `squad_load` tool (`src/tools/squad-load/tools.ts`) and its shared types (`src/shared/types/squad.ts`) still return a shallow `SquadManifest` shape.
- **Rationale for Staging**: This was preserved to maintain compatibility with existing tool consumers during the remediation pass. The primary goal of the current pass is to fix the manifest schema and validation logic.
- **Boundary**: Blocker-level drift in the `SQUAD.yaml` schema itself (e.g., removing `categories`) is fixed. The internal tool output shape is classified as technical debt for a future alignment pass.

### 2. Deeper Squad Runtime/Orchestration Semantics
- **Description**: The squad runtime is currently limited to agent registration, workflow registry loading, and chief-first delegation semantics.
- **Rationale for Staging**: Richer orchestration semantics (e.g., stateful subteam coordination, complex workflow-engine integration) require a more mature workflow engine foundation, which is being developed in parallel.
- **Boundary**: Basic registry loading and namespaced workflow aliasing are addressed as blockers for the new package model. Deeper runtime execution logic is staged as follow-up work.

### 3. Stronger Deterministic Squad-Creator/Package Authoring Enforcement
- **Description**: The `squad-creator` agent and `squad-create` command rely primarily on prompt-based guidance rather than structural code-level enforcement for generating package assets.
- **Rationale for Staging**: Improving the creator's prompt to align with the new package model is the immediate blocker. Hardening the generation logic into a deterministic, structurally-enforced engine is a significant effort staged for a future increment.
- **Boundary**: The creator's mental model and guidance are updated to match the v2 schema. The transition from "soft" prompt enforcement to "hard" structural enforcement is a follow-up.

## Summary of Remediation Pass
The current remediation pass focuses on:
- Removing all traces of legacy `categories` semantics from user-facing documentation (`README.md`).
- Updating the built-in `code` squad seed to demonstrate the new package/orchestration model.
- Ensuring `squad_validate` correctly rejects legacy manifests and validates new package components.

These staged items represent the remaining distance to full Synkra-level orchestration depth, preserved here to ensure they are not lost after the current blockers are cleared.

## QA Verification Note: Unrelated Workflow-Asset Drift
- `bun test` currently fails in `src/cli/scaffolder.test.ts` and `src/features/workflow-engine/registry.test.ts`.
- Both failing assertions expect the builtin workflow asset `brownfield-discovery.yaml`.
- `src/features/builtin-workflows/` currently contains only `greenfield-fullstack.yaml`.
- This mismatch is pre-existing workflow/scaffolder asset drift and is outside this squad remediation scope.
- Blocker closure for this remediation remains valid: README legacy category drift is cleared, and squad seed package/orchestration fields are in place.
