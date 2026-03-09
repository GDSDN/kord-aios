# Draft: Squads Follow-ups (Post Plan 3)

## What’s done (confirmed by conversation)
- Plan 3 implemented: squads + authority/artifact write-path changes; runtime no longer loads plugin-bundled squads; squad chief concept in seed squad; category mention removed from runtime prompt injection.
- `squad-creator` has a scoped exception to write squads globally under `{OpenCodeConfigDir}/squads/**`.
- Analyst/UX/DevOps/Data Engineer artifacts write paths were updated to allow auditable outputs under `docs/kord/**`.

## Current questions to answer next
- Synkra comparison: does Synkra run squads via a dedicated engine (beyond simple “load agents + delegate”), and what deterministic tooling does it apply during squad creation/validation?
- Skills in `SQUAD.yaml`: should Kord validate that referenced skills exist at `squad_validate` time (and/or during squad creation)?
- Categories do not exist for squads (squads are teams; chief coordinates). Remove categories from schema/docs/prompt surface.

## Newly confirmed direction from user
- Target direction is **full orchestration aligned with Synkra’s mental model**, adapted to Kord’s own engine.
- User is already building a workflow engine in another session/plan; squad planning here must account for that parallel foundation and define the correct integration boundary.
- Current Kord squad depth is considered too shallow if it remains only “chief + workers + delegation syntax”.
- We need a broader rethink of:
  - the plan itself,
  - what was already implemented,
  - how Synkra actually works,
  - and how squad orchestration should map onto Kord.
- Analysis/comparison artifacts should be persisted as docs, not left only in session memory or draft notes.

## Research findings (Kord repo)
- `src/features/squad/schema.ts` still defines:
  - `categories` (optional) and docs/comments still describe “Categories — domain-specific task routing” (this conflicts with the clarified requirement).
  - `agents.*.skills` (default `[]`) and `dependencies.skills` (optional) as raw string arrays.
- `src/features/squad/factory.ts`:
  - `buildSquadPromptSection()` no longer outputs a “Squad Categories” section (only Squads table + delegation syntax + skills).
  - `getSquadCategories()` still exists but appears unused by runtime (only referenced in tests).
- `src/tools/squad-validate/tools.ts` validates:
  - YAML parse + Zod (`squadSchema.safeParse`)
  - kebab-case agent keys
  - `prompt_file` existence
  - `default_executor`/`default_reviewer` point to defined agents
  - Best-practice warnings (missing default executor, no chief, multiple chiefs)
  - Does NOT validate skill existence.
- Skill discovery APIs:
  - User/project/global skills (OpenCode + Claude paths): `src/features/opencode-skill-loader/loader.ts` exports `discoverSkills()`, `discoverAllSkills()`, `getSkillByName()`.
  - Built-in skills (hardcoded + kord-aios skills): `src/features/builtin-skills/skills.ts` (`createBuiltinSkills()` → list of skill names).

## Research findings (Synkra)
- Synkra squad system is more “package + deterministic tooling” than a lightweight manifest:
  - Loader + generator + extender scripts; explicit validate command; strict mode for CI.
  - Emphasis on deterministic validation and “create/validate/extend/analyze” workflows.
  - Public references (may change):
    - https://github.com/SynkraAI/aios-core/blob/main/docs/guides/squads-overview.md
    - https://github.com/SynkraAI/aios-core/blob/main/.aiox-core/development/scripts/squad/squad-loader.js
- Important architectural clarification from deeper local inspection (`D:\dev\synkra-aios`):
  - Synkra appears to have **two layers**:
    1. **Framework orchestration/workflow engine** (generic AIOS capability): workflows, workflow state, workflow execution modes, service registry, orchestration modules.
    2. **Squad packaging layer**: squad manifests + agents + tasks + workflows + scripts that plug into that engine.
  - Evidence for generic engine:
    - `docs/guides/workflows-guide.md` documents `*run-workflow`, workflow state, engine mode.
    - `docs/guides/agents/traces/aios-master-execution-trace.md` references `run-workflow-engine.md` and retained workflow orchestration.
    - `docs/guides/service-discovery.md` documents the service registry for tasks/templates/scripts/workflows.
  - Evidence for squad-specific packaging (not just plain agents):
    - `.aios-core/schemas/squad-schema.json` defines `components.tasks`, `components.agents`, `components.workflows`, `components.scripts`.
    - `docs/guides/agents/SQUAD-CREATOR-SYSTEM.md` describes v2 squads as `squad.yaml + workflows + agents with skill_dispatch`.
    - `squads/squad-creator/tasks/create-agent.md` and related workflows show deterministic prompt/agent creation methodology.
  - Some squads add their own custom execution code too:
    - `squads/mmos-squad/squad.yaml` references `workflow_detector.py`, `workflow_orchestrator.py`, etc.

## Interpretation of the clarified requirement
- The core open decision is not “do squads have categories?” — they do not, and should not.
- The real decision is whether Kord squads should remain:
  - **Layer A:** team/chief delegation only, or
  - **Layer A + B:** team/chief delegation plus a squad package/workflow execution model.
- Current Kord implementation covers the team/chief layer well, but does not yet model Synkra-style squad packages with tasks/workflows as first-class runtime building blocks.
- User chose **Layer A + B** as the intended destination.

## Expected artifact set for the next planning cycle
- `docs/kord/analyses/squads/` should contain durable comparison artifacts such as:
  - Synkra execution model analysis
  - Kord current-state gap analysis
  - Mapping: Synkra mental model → Kord engine concepts
  - Architecture decision notes on whether squad orchestration is a thin adapter over Kord workflow engine vs a squad-specific orchestration layer
  - Migration/impact analysis for already-implemented squad work
  - Documentation impact analysis (`AGENTS.md`, `README.md`, guides, squad docs)
  - Opportunities where Kord should improve beyond Synkra rather than only imitate it

## Proposed design: skill existence validation in `squad_validate`
- Validate both:
  - `dependencies.skills` (squad-level required skills)
  - `agents.*.skills` (agent-level skills)
- Validate against union of:
  - Built-in skills (from `createBuiltinSkills()`; optionally respect disabledSkills if accessible)
  - Discovered external skills (from `discoverSkills()` / `discoverAllSkills()`)
- Add errors like:
  - `Dependency skill "foo" not found (searched: builtin, .opencode/skills, ~/.config/opencode/skills, .claude/skills, ~/.claude/skills)`
  - `Agent "bar": skill "baz" not found (...)`
- Implementation approach (to keep `validateSquadManifest()` mostly sync): perform skill discovery/verification in `createSquadValidateTool().execute` after basic manifest validation.

## Proposed decision: categories handling
- Default direction: remove `categories` from squad concept entirely.
  - Option A (compat): keep `categories` in schema for older squads, but treat as no-op and keep it out of prompts/docs. Optionally add a validation warning: “categories is ignored”.
  - Option B (strict): remove `categories` from schema and make `squad_validate` fail if present (forces migration).

## Candidate next increments (not executed yet)
- Add skill existence validation to `squad_validate`:
  - Enumerate available skills from builtin + project + global skill sources
  - For each `skills:` entry in `SQUAD.yaml`, verify it resolves (case-sensitive) and produce actionable error output listing missing skills + where Kord searched
  - Optional: suggest closest matches (string similarity) to reduce friction
- Decide on `categories` handling:
  - Option A (recommended default): keep `categories` optional for compatibility but do not surface it anywhere; add a warning during validation when present
  - Option B: remove from schema + require migration
- Strengthen `squad-creator` contract for skills:
  - Creation flow should explicitly check for skill existence first; only create new skills when missing and when the user asked for it

## Working assumptions (explicit)
- Kord should avoid “workflow engine” scope creep; any Synkra-inspired improvements should be minimal and validation-focused.
- Skills must be loaded on-demand via `skill()`; `load_skills` is advisory, not correctness-critical.

## Open Questions (need user answer)
- When you say “Synkra has a squad engine”, do you mean:
  - a runtime coordinator/workflow engine that controls multi-agent execution, or
  - design-time tooling (validate/create/extend/analyze) plus a loader that registers agents/tasks?
- Do you want the next step to be:
  1) a short Synkra analysis report + recommendation only, or
  2) analysis + implement follow-up validations (skills + categories handling) as the next work plan?

## Post-implementation review status (new)
- The deepening plan was implemented and passed automated verification:
  - `bun test` passed
  - `bun run typecheck` passed
  - `bun run build` passed
- However, post-implementation review found likely remaining divergence between the plan and the delivered result:
  - `README.md` still teaches the old squad model and mentions categories.
  - `src/features/builtin-squads/code/SQUAD.yaml` still looks shallow and does not clearly model the new package/orchestration structure.
  - Some older docs likely remain stale and may still encode legacy semantics.
  - Workflow integration is real but partial: squad workflows are registered and runnable, but the overall squad runtime is not yet as deep as the full Synkra mental model.
  - `squad_load` still exposes a legacy-shaped parsed output for compatibility, leaving a split between deep schema and public/shared manifest shape.
  - `squad-creator` moved in the right direction, but deterministic squad package generation is still not strongly enforced in code.

## Recommended next planning move
- Create one focused follow-up work plan for **implementation-vs-plan remediation**.
- That plan should classify every remaining gap into one of:
  - **Blocker**: must be fixed now to claim the squad deepening plan was truly delivered.
  - **Follow-up**: acceptable staged work after current acceptance.
  - **Intentional compatibility gap**: kept deliberately, but must be documented clearly.
- Recommended default blocker candidates:
  - `README.md` and active docs still teaching legacy/category-based squad semantics.
  - Built-in `code` squad seed not reflecting the new canonical squad package model.
- Recommended default follow-up candidates:
  - stronger creator determinism,
  - deeper runtime orchestration semantics,
  - removal or redesign of legacy `squad_load` compatibility shape.

## Review findings: plan vs implementation

### Deliverables clearly achieved
- Durable analysis artifacts, ADR, stories, and canonical plan were created and remain the main source of truth.
- Core schema direction was implemented:
  - `src/features/squad/schema.ts` now models `components`, `orchestration`, and `subteams`.
  - `categories` is no longer part of the schema.
- Validation depth materially improved:
  - `src/tools/squad-validate/tools.ts` rejects legacy `categories`, validates component existence, validates workflow files, and validates skill references.
- Shared workflow-engine integration exists:
  - `src/features/workflow-engine/registry.ts` loads squad workflows.
  - `src/features/workflow-engine/engine.ts` supports namespaced squad workflow aliases.
- Squad docs and creator guidance were moved toward the package/orchestration model.

### Deliverables only partially achieved
- Story 2 / runtime package model is only partially realized:
  - runtime still primarily materializes agents plus prompt metadata;
  - package assets are visible and discoverable, but not yet deeply represented as first-class squad runtime behavior.
- Story 5 / deterministic creator depth is only partially realized:
  - creator guidance is stronger,
  - but package generation quality is still mostly prompt-enforced rather than structurally enforced in code.
- Story 7 / documentation refresh is incomplete:
  - `README.md` still teaches the legacy squad model and includes a `categories` example.
  - active shipped seed content remains shallower than the new model.

## Review findings: blockers vs follow-ups

### Blockers
- `README.md` still says squads declare `categories for task routing` and shows a `categories:` example. This directly violates the plan and stories.
- `src/features/builtin-squads/code/SQUAD.yaml` does not demonstrate the new package/orchestration model (`components`, `orchestration`) and therefore weakens the shipped mental model.
- Story 6 acceptance criterion `No retained artifact still teaches categories as squad semantics` is not yet satisfied for active user-facing docs/artifacts.

### Follow-up gaps
- `src/shared/types/squad.ts` and `src/tools/squad-load/tools.ts` preserve a legacy parsed shape, creating a split between deep manifest schema and public/shared tool output.
- The workflow boundary is respected, but runtime depth is still limited to loading/registration/aliasing; there is not yet a richer squad-aware execution layer beyond chief-first semantics and workflow discoverability.
- `src/features/builtin-agents/squad-creator.md` and `src/features/builtin-commands/templates/squad-create.ts` point in the right direction, but deterministic generation guarantees are still soft.

### Intentional compatibility candidates
- Keeping `squad_load` legacy-shaped may be acceptable temporarily if the compatibility contract is explicitly documented and a migration path is planned.

## Risk assessment
- **Conceptual risk**: medium-high. The code changed substantially, but stale docs/seeds can still teach the wrong model to users and contributors.
- **Architecture risk**: medium. The chosen boundary (shared workflow engine + squad adapter/package layer) is sound, but the runtime has not fully reached the package-oriented depth implied by the stories.
- **Migration risk**: medium. Compatibility shims reduce breakage, but they also prolong split mental models if left undocumented.
- **Quality risk**: low-medium for correctness, medium for completeness. Tests/typecheck/build are green, so the implementation is stable, but not yet fully complete against the plan's acceptance language.

## Plan Analyzer guidance to apply in remediation plan

### Classification criteria
- **Blocker**: prevents closure of existing story/plan acceptance criteria or leaves active user-facing artifacts teaching the wrong squad model.
- **Staged follow-up**: real gap, but no current user-visible breakage and no need to modify core architecture in this remediation pass.
- **Intentional compatibility gap**: accepted divergence kept temporarily or permanently with explicit rationale and a documented migration path.

### Explicit scope guardrails
- In scope implementation targets should stay narrow and explicit:
  - `README.md`
  - `src/features/builtin-squads/code/SQUAD.yaml`
  - one discoverable markdown artifact that records staged follow-up gaps
- Out of scope for this remediation pass:
  - `src/tools/squad-load/tools.ts`
  - `src/shared/types/squad.ts`
  - workflow-engine runtime deepening
  - squad schema redesign
  - broad README restructuring unrelated to squad semantics

### Acceptance criteria the remediation plan must include
- Grep-verifiable removal of category-based squad language from `README.md`.
- `code` squad seed must include explicit package/orchestration semantics, not just agent declarations.
- A discoverable follow-up artifact must record staged gaps so they are not lost.
- Final non-regression gate remains:
  - `bun test`
  - `bun run typecheck`
  - `bun run build`

### Assumption to keep explicit
- `squad_load` legacy output shape is treated as a staged compatibility issue, not a blocker, unless later evidence shows downstream consumers already require the deep manifest shape.

## Terminology clarification
- In the Synkra mental model, **domain** should be interpreted as the squad's area of responsibility, mission, or problem space.
- It should **not** be translated into Kord's older idea of a routing `category`.
- The likely source of confusion is that `domain` was treated as if it were an orchestrator routing bucket, which pulled the design toward `categories`.
- Correct mapping:
  - `domain` -> team/package scope
  - `chief` -> coordinator for that domain/team
  - `workers/subteams` -> specialists inside that domain/team
  - not `domain` -> `category`

## Scope boundaries (tentative)
- INCLUDE: squad validation improvements, squad creation UX contract improvements, Synkra comparison.
- EXCLUDE: building a full workflow engine (unless you explicitly decide otherwise).
