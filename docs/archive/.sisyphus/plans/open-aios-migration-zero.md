# OPEN-AIOS Concrete Migration Plan (Zero-Based)

Generated from analysis snapshot: 2026-02-09T03:05:59.469Z

## 1) Objective

Implement Synkra AIOS methodology on top of OMOC runtime engine, producing OPEN-AIOS as a single plugin system:
- OMOC owns execution/runtime (hooks, tools, delegation, background, model routing).
- AIOS owns workflow/methodology (story-driven lifecycle, command authority, role clarity).
- OPEN-AIOS owns UX naming, installer contract, and unified docs/workspace layout.

## 2) Source Baseline (Observed)

### OMOC Runtime Baseline

| Module | Files | Example Paths |
|---|---:|---|
| src/cli | 69 | src/cli/AGENTS.md, src/cli/config-manager.test.ts |
| src/agents | 32 | src/agents/AGENTS.md, src/agents/dynamic-agent-prompt-builder.test.ts |
| src/hooks | 171 | src/hooks/AGENTS.md, src/hooks/context-window-monitor.ts |
| src/tools | 114 | src/tools/AGENTS.md, src/tools/index.ts |
| src/features | 136 | src/features/AGENTS.md, src/features/tool-metadata-store/index.test.ts |
| src/config | 4 | src/config/AGENTS.md, src/config/index.ts |
| src/plugin-handlers | 6 | src/plugin-handlers/AGENTS.md, src/plugin-handlers/config-handler.test.ts |

### Synkra AIOS Framework Baseline

| Module | Files | Example Paths |
|---|---:|---|
| .aios-core | 880 | .aios-core/constitution.md, .aios-core/core-config.yaml |
| docs | 539 | docs/agent-reference-guide.md, docs/aios-nomenclature-specification.md |
| docs/guides | 81 | docs/guides/ade-guide.md, docs/guides/agent-selection-guide.md |
| docs/architecture | 60 | docs/architecture/ADE-AGENT-CHANGES.md, docs/architecture/ADE-ARCHITECT-HANDOFF.md |
| squads | 1273 | squads/squad-creator/CHANGELOG.md, squads/squad-creator/config.yaml |

### UX Inputs Found

- OMOC slash commands: handoff, init-deep, ralph-loop, refactor, start-work, stop-continuation
- OMOC built-in skills: dev-browser, frontend-ui-ux, git-master, playwright
- OMOC agents detected: atlas, explore, hephaestus, librarian, metis, momus, multimodal-looker, oracle, prometheus, sisyphus, sisyphus-junior
- Synkra star commands (sample): analyze-paths, apply-migration, apply-qa-fix, assess-complexity, brainstorm, capture-insights, cleanup-worktrees, command, correct-course, create-agent, create-architecture, create-brownfield-prd, create-context, create-epic, create-fix-request, create-migration-plan, create-plan, create-pr, create-prd, create-project-brief, create-schema, create-squad, create-story, create-suite
- Synkra agent IDs (sample): aios-master, analyst, architect, data-engineer, dev, devops, pm, po, qa, sm, ux-expert

## 3) Naming Decision (OPEN-AIOS)

### 3.1 Agent Names (Direct Replacement)

- Primary workflow agents: @plan, @build, @build-loop, @kord
- Specialist agents: @dev-junior, @dev-senior, @qa, @architect, @pm, @po, @sm, @analyst, @devops, @data-engineer, @ux-expert
- Utility agents: @researcher, @code-explorer, @multimodal-analyst
- Policy: NO compatibility alias layer. Replace names directly via scripted refactor.
- Specialist fusion decisions are documented in `.sisyphus/plans/kord-aios-full-squad-decision-matrix.md`.

### 3.2 Why these names

- Based on lifecycle semantics (plan/build/review/release), not mythology branding.
- Based on AIOS role vocabulary for transferability (@dev, @qa, @architect, etc.).
- Based on OMOC capability strengths for utilities (librarian/explore/deep execution).
- Short and command-friendly for @agent and *command UX.

## 4) Installer and Workspace Contract

### 4.1 CLI Commands

- `kord-aios init`
  - Greenfield scaffold for `.kord-aios/` + `docs/kord-aios/`.
  - Creates starter story templates and config baseline.
- `kord-aios install`
  - Brownfield installer for existing OMOC/AIOS projects.
  - Detects `.sisyphus/`, `.aios-core/`, old config and performs migration with backups.
- `kord-aios doctor`
  - Validates providers/models, agent registry, command routing, workspace integrity.

### 4.2 Workspace Layout

```text
project/
  .kord-aios/
    packs/
    state/
    evidence/
  .opencode/
    kord-aios.json
  docs/kord-aios/
    stories/
    architecture/
    decisions/
    plans/
    backlog/
    reference/
    sessions/
    drafts/
```

## 5) Skills and Prompt System

### 5.1 Skill Model

- Execution Skills (runtime): keep OMOC skills (`git-master`, `playwright`, `frontend-ui-ux`, `dev-browser`).
- Process Skills (framework): ingest AIOS task/skill catalog as workflow skills (not only essential subset).
- Primary source for AIOS workflow skills: `.aios-core/development/tasks/*.md` (observed snapshot count: 196 files).
- Additional Claude-oriented skill assets to evaluate/import: `.claude/skills/*` and `.claude/commands/AIOS/agents/*.md`.
- Routing rule: `*command` resolves owner first, then activates workflow skill + optional execution skill.
- Curation policy after full ingestion: classify each imported workflow as `keep`, `merge`, `deprecated`, `story-driven-only`.

### 5.2 Prompt Strategy

- Preserve OMOC prompt architecture (factory + dynamic prompt builder).
- Add OPEN-AIOS methodology blocks:
  - Story lifecycle rules
  - Command authority rules
  - Escalation protocol
  - Quality-gate evidence contract
- Kord prompt baseline must combine AIOS framework governance + OMOC orchestration rigor for self-optimization of Kord AIOS.
- Keep utility agent prompts (librarian/explore/oracle-like) capability-focused.

### 5.3 Star Command vs Keyboard Optimization Study

- Preserve AIOS semantic model: each `*command` activates a workflow skill owned by exactly one agent.
- In OpenCode, implement a star-command pre-parser so `*...` is first-class and not treated as plain chat text.
- Keep `/commands` for OpenCode-native tooling and skills; keep `*commands` for AIOS workflow execution contract.
- Add command discovery/auto-complete for `*commands` (owner, required args, visibility) without changing semantics.
- Evaluate optional keyboard accelerator layer only if it emits the exact same `*command` payload.

## 6) Concrete Migration Phases

### Phase A - Foundation and Rebrand

Scope:
- Rename CLI/config identity to kord-aios.
- Finalize workspace path resolver and init scaffolding.

Target files:
- `package.json` (name/bin metadata)
- `bin/kord-aios.js` -> new kord-aios entry
- `src/cli/index.ts`, `src/cli/install.ts`, `src/cli/config-manager.ts`
- `src/plugin-handlers/config-handler.ts`
- `src/config/schema.ts`, `assets/kord-aios.schema.json`

Acceptance:
- `kord-aios --help` works
- `kord-aios doctor` validates runtime
- config path `.opencode/kord-aios.json` supported

### Phase B - Agent Registry Fusion (No Alias)

Scope:
- Introduce canonical OPEN-AIOS names in registry and remove OMOC names in the same phase.
- Split developer contract into `@dev-junior` and `@dev-senior`.
- Make `@kord` the only framework governor.

Target files:
- `src/agents/utils.ts` (registry + resolution)
- `src/agents/index.ts`
- `src/config/schema.ts` (AgentNameSchema)
- new directories: `src/agents/plan/`, `src/agents/build/`, `src/agents/build-loop/`, `src/agents/kord/`, `src/agents/dev-junior/`, `src/agents/dev-senior/`
- scripted rename utility: `script/rename-kord-aios-agents.ts`

Acceptance:
- canonical names invokable
- old OMOC names no longer exist in schema/registry
- agent prompt generation still deterministic

### Phase C - *Command Router and Authority Matrix

Scope:
- Add first-class star-command parser in hook layer.
- Implement owner map (1 command = 1 owner).

Target files:
- `src/hooks/keyword-detector/index.ts` (or new `src/hooks/star-command-router/`)
- `src/features/builtin-commands/*` for OPEN-AIOS command set
- `src/tools/slashcommand/*` for unified dispatch contract

Acceptance:
- `*help`, `*yolo`, `*story`, `*develop`, `*review` route correctly
- background sessions ignore star command interception
- owner violations return explicit reroute guidance

### Phase D - Story Runtime and Quality Gates

Scope:
- Story parser + checkbox->todo sync + evidence links.
- Add quality gate validation rules.
- Set `docs/kord-aios/*` as single source of truth for story/architecture artifacts.
- Keep OMOC mental execution model (delegate/verify/ship) and layer AIOS methodology constraints.

Target files:
- `src/kord-aios/story-runtime/*` (new)
- `src/kord-aios/quality-gates/*` (new)
- `src/tools/task/*` integration points
- `src/features/boulder-state/*` integration points

Acceptance:
- story state transitions tracked
- AC verification logged to evidence
- QA gate can block promotion when criteria fail

### Phase E - Pack System (AIOS Framework Payload)

Scope:
- Add pack loader under `.kord-aios/packs`.
- Add sync script to import full AIOS templates/tasks/guide artifacts.
- Ingest complete AIOS workflow-skill inventory first, then run curation matrix (`keep/merge/deprecated/story-driven-only`).
- Include Claude-oriented skill artifacts where useful (`.claude/skills/*`) and map to Kord AIOS equivalents.
- Include MCP defaults/test artifacts parity study from AIOS.

Target files:
- `src/kord-aios/pack-manager/*` (new)
- `script/sync-synkra-pack.ts` (new)
- `script/analyze-aios-skills-inventory.ts` (new)
- `docs/kord-aios/plans/aios-skill-curation-matrix.md` (new)
- `.kord-aios/packs/synkra/manifest.json`

Acceptance:
- pack sync is idempotent
- manifest pins upstream revision
- pack load failures are diagnosable
- full AIOS task inventory imported and versioned
- skill curation matrix approved before deprecation/removal
- MCP parity checklist and tests defined for Kord AIOS

### Phase F - Migration and Decommission

Scope:
- Migration scripts from `.sisyphus` and `.aios-core` layouts.
- Remove obsolete naming and docs references after stabilization.

Target files:
- `script/migrate-to-kord-aios.ts` (new)
- docs updates under `docs/kord-aios/*` and root README

Acceptance:
- dry-run migration output available
- repeated migration run is no-op
- legacy paths either migrated or explicitly marked deprecated

## 7) Verification Matrix

Per phase, required checks:
- `bun run typecheck`
- `bun test`
- Targeted regression suite for touched areas (agents/hooks/tools/cli)
- Smoke: `bun src/cli/index.ts --help` and `kord-aios doctor`

## 8) Rollback and Risk Controls

- No hard cutover until Phases A-C are stable.
- No alias compatibility path: perform scripted direct rename with pre-generated patch review.
- Add feature flags for star-command router and story-runtime gatekeeper.
- Use script-driven bulk changes; avoid manual widespread edits.

## 9) Immediate Implementation Order

1. Phase A (foundation/rebrand)
2. Phase B (agent fusion)
3. Phase C (command authority)
4. Phase D (story runtime + gates)
5. Phase E (pack manager)
6. Phase F (migration/decommission)

## 10) Definition of Done

OPEN-AIOS is done when:
- Users can install and run as `kord-aios` only.
- Story-driven workflow is enforced through `*commands` + quality gates.
- OMOC runtime strengths remain intact (delegation, hooks, tools, parallel execution).
- Migration path from OMOC and AIOS layouts is automated and repeatable.

## 11) Post-Phase-1 Module Planning and Priority

After completing Phase B (agent rename + contract rewrite), plan and implement modules in this order:

1. Hooks (highest priority)
   - Why first: contracts only become real when state/authority is enforced at runtime.
   - Deliverables: `*command` ownership guard, story-state transition guard, escalation guard.

2. Prompt Refactor Packs
   - Why second: Kord/build/build-loop/dev tiers must reflect AIOS framework + OMOC execution style.
   - Deliverables: shared prompt blocks + role-specific contracts with explicit rationale.

3. Tools Integration
   - Why third: story runtime requires task/todo/evidence plumbing in tools layer.
   - Deliverables: story parser, evidence linker, command router integration, authority-aware dispatch.

4. Skills System
   - Why fourth: full AIOS workflow catalog must be integrated before narrowing/curating.
   - Deliverables: full import of AIOS workflow skills, curation matrix, owner mapping, visibility mapping, deprecation policy.

5. Installer/Wizard + Migration Scripts
   - Why fifth: once runtime contracts are stable, installer can safely encode the final behavior.
   - Deliverables: `kord-aios init/install/doctor`, workspace migration (`.sisyphus`/`.aios-core` -> `docs/kord-aios` + `.kord-aios`).

6. Docs and DX Finalization
   - Why last: document finalized behavior, not transitional behavior.
   - Deliverables: updated READMEs, agent reference, migration guide, troubleshooting.
