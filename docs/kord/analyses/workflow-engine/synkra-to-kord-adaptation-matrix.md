# Synkra -> Kord Workflow Adaptation Matrix (Wave 1)

Quoted checkbox items:
- [ ] 1. Produce a Synkra -> Kord workflow adaptation matrix
- [ ] Decision: Kord workflow YAML v1 compatibility mode
- [ ] Decision: step guidance storage

## Scope and authority

- This matrix uses verified Builder findings from recovery audit and parity notepads as authoritative input.
- It is a planning/implementation guide for Wave 2-4 and closure review, not a claim of parity completion.

## Active Synkra catalog baseline (14 workflows)

1. `greenfield-fullstack`
2. `brownfield-discovery`
3. `greenfield-service`
4. `brownfield-fullstack`
5. `greenfield-ui`
6. `brownfield-ui`
7. `brownfield-service`
8. `qa-loop`
9. `spec-pipeline`
10. `design-system-build-quality`
11. `development-cycle`
12. `story-development-cycle`
13. `epic-orchestration`
14. `auto-worktree`

## Adaptation matrix

Classification values: `preserved as-is` / `adapted to Kord` / `intentionally replaced` / `not yet implemented`.

| Matrix row | Synkra baseline | Kord MVP reality | Classification | Wave guidance |
|---|---|---|---|---|
| Workflow metadata | Rich metadata includes `elicit` and `confirmation_required` | Minimal intents/schema only | adapted to Kord | Adopt Synkra-compat-v1 parser and preserve metadata semantics in runtime model |
| Phase model / sequence | Explicit phase model and ordered execution | Simplified builtins without full phase fidelity | adapted to Kord | Preserve phase semantics during import; enforce deterministic phase transitions |
| Elicitation and confirmation | Interactive elicitation and explicit confirmations | Main-session elicitation runtime missing | not yet implemented | Add orchestrator-owned interactive elicitation/confirmation runtime |
| Artifact chaining | Workflow outputs chain into later steps/phases | Basic state exists but chaining behavior is shallow | adapted to Kord | Extend run state and references so artifacts are first-class chain inputs |
| Notes/manual prompts | Guidance/manual prompt steps available in definitions | Present only in reduced form | adapted to Kord | Support both inline and referenced guidance with preference for referenced assets |
| Task/template/checklist references | Asset-backed prompt assembly from tasks/checklists/templates | No full asset-backed builtins/import parity yet | not yet implemented | Implement asset reference resolution and runtime assembly |
| State schema | Rich state schema with lifecycle details | Basic registry/state only | adapted to Kord | Expand state schema while keeping Kord ownership fields |
| Prompt assembly | JIT composition from workflow assets/context | Missing JIT assembly behavior | not yet implemented | Build JIT prompt assembly pipeline from resolved assets |
| Command actions | Runtime supports conditions, optional steps, repeats, delegates, validations, meta guidance | Action semantics only partially represented | adapted to Kord | Map Synkra action semantics into executor and state transitions |
| Alias commands | Alias command routing in runtime | Alias recursion blocker fixed and verified | adapted to Kord | Keep deterministic alias normalization and one-shot alias consumption |
| Parallel fan-out/join | True parallel branches with explicit join | Not implemented with true parity semantics | not yet implemented | Add branch fan-out/join orchestration with deterministic merge rules |
| Gate validation | Explicit validation/gates between phases/steps | No true gate semantics yet | not yet implemented | Implement blocking gate checks and failure/report surfaces |
| Importer/adaptation reports | Source workflows imported with adaptation visibility | Importer currently stub; no reports | not yet implemented | Build importer plus adaptation report output per workflow |
| Authoring path | YAML workflow authoring with reusable assets | Kord supports minimal schema, no compatibility-mode contract yet | adapted to Kord | Standardize on Synkra-compat-v1 YAML + Kord-only extension envelope |
| Builtin asset pack vs project overrides | Builtins and project-level authored assets coexist | Builtins are simplified and not asset-backed | intentionally replaced | Replace inline builtin TS source with shipped YAML asset pack and project overrides |

## Wave 1 decisions captured for downstream work

- Decision anchor: choose **Synkra-compat-v1 parser with Kord-only extensions** as the authoring/import contract.
- Decision anchor: choose **mixed step-guidance storage**, preferring referenced Markdown assets over bloated inline YAML notes.

## Non-goals in current state

- Do not treat current MVP registry/state and two simplified builtins as parity completion.
- Do not claim importer, adaptation reports, JIT prompt assembly, parallel/gate semantics, or full elicitation runtime are already complete.
