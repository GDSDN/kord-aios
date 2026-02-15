# Kord AIOS Implementation Kickoff Checklist

Date: 2026-02-08
Owner: Atlas (implementation)
Mode: Direct replacement (no alias), story-driven-first

## 0) Required Inputs (Read First)

- [ ] Read `.sisyphus/plans/kord-aios-migration-zero.md`
- [ ] Read `.sisyphus/plans/kord-aios-agent-migration-study.md`
- [ ] Read `.sisyphus/plans/kord-aios-full-squad-decision-matrix.md`
- [ ] Read `.sisyphus/drafts/kord-aios-zero-analysis.md`

## 1) Global Rules (Must Hold)

- [ ] No compatibility alias layer for agent names
- [ ] `docs/kord-aios/*` is canonical source of truth for story/framework artifacts
- [ ] Keep OMOC execution quality/style; inject AIOS methodology into contracts/prompts
- [ ] Do not create duplicate public roles for existing AIOS owners
- [ ] Keep `oracle`, `metis`, `momus` as internal engines only

## 2) Phase A - Foundation/Rebrand

### Scope

- [ ] Rebrand runtime identity to Kord AIOS
- [ ] Confirm workspace/config path conventions

### Targets

- [ ] `package.json` (CLI/bin identity)
- [ ] `src/cli/index.ts`
- [ ] `src/cli/install.ts`
- [ ] `src/cli/config-manager.ts`
- [ ] `src/plugin-handlers/config-handler.ts`
- [ ] `src/config/schema.ts`
- [ ] `assets/kord-aios.schema.json` (or replacement target)

### Acceptance

- [ ] `kord-aios --help` works
- [ ] config supports `.opencode/kord-aios.json`
- [ ] no regressions in plugin bootstrap

## 3) Phase B - Agent Registry + Direct Rename

### Scope

- [ ] Replace OMOC public names directly (no alias)
- [ ] Install AIOS-first public squad + utility renames
- [ ] Wire internal engines to owners

### Public Names (Target)

- [ ] `@kord`, `@plan`, `@build`, `@build-loop`
- [ ] `@dev-junior`, `@dev-senior`
- [ ] `@qa`, `@architect`, `@pm`, `@po`, `@sm`, `@analyst`, `@devops`, `@data-engineer`, `@ux-expert`
- [ ] `@researcher`, `@code-explorer`, `@multimodal-analyst`

### Internal Engines (No Public Persona)

- [ ] `oracle` as architecture escalation engine for `@architect`
- [ ] `metis` as preflight engine for `@plan`
- [ ] `momus` as gate-check engine for `@qa/@kord`

### Targets

- [ ] `src/agents/utils.ts`
- [ ] `src/agents/index.ts`
- [ ] `src/config/schema.ts` (agent enum/schema)
- [ ] Prompt files for `@kord/@plan/@build/@build-loop/@dev-junior/@dev-senior`
- [ ] Utility prompt files for renamed agents
- [ ] Add scripted rename utility: `script/rename-kord-aios-agents.ts`

### Acceptance

- [ ] old OMOC public names removed from schema/registry
- [ ] all target names invokable
- [ ] deterministic prompt routing remains intact

## 4) Phase C - Star Commands + Authority Matrix

### Scope

- [ ] Make `*commands` first-class (not plain chat)
- [ ] Enforce one-command-one-owner

### Targets

- [ ] hook: star-command parser/router
- [ ] owner map source (single registry)
- [ ] command dispatch + violation messaging

### Acceptance

- [ ] `*help`, `*yolo`, `*story`, `*develop`, `*review` route correctly
- [ ] owner mismatch reroutes with clear guidance
- [ ] background sessions unaffected

## 5) Phase D - Story Runtime + Gates

### Scope

- [ ] Story parser + state transition contract
- [ ] checkbox -> todo sync
- [ ] evidence linkage and QA gate checks

### Acceptance

- [ ] legal transitions enforced
- [ ] invalid transitions blocked with explicit reason
- [ ] QA evidence required for completion

## 6) Phase E - Skills/Workflow Ingestion (Full AIOS)

### Scope

- [ ] Import full AIOS workflow catalog
- [ ] Map `*command` -> owner -> workflow skill activation
- [ ] Build curation matrix for keep/merge/deprecate
- [ ] Include MCP parity + tests planning

### Inputs

- [ ] `.aios-core/development/tasks/*.md`
- [ ] `.claude/skills/*`
- [ ] `.claude/commands/AIOS/agents/*.md`
- [ ] AIOS MCP docs/tests references

### Targets

- [ ] `script/analyze-aios-skills-inventory.ts`
- [ ] `script/sync-synkra-pack.ts`
- [ ] `docs/kord-aios/plans/aios-skill-curation-matrix.md`
- [ ] `.kord-aios/packs/synkra/manifest.json`

### Acceptance

- [ ] full workflow catalog ingested and version-pinned
- [ ] curation matrix approved before removals
- [ ] MCP parity checklist and test plan defined

## 7) Phase F - Migration + Decommission

- [ ] Build migration script `.sisyphus/.aios-core -> Kord AIOS layout`
- [ ] Ensure idempotent re-run (no-op when already migrated)
- [ ] Remove deprecated references after verification

## 8) Verification Checklist (Every Phase)

- [ ] Run `bun run typecheck`
- [ ] Run `bun test`
- [ ] Run targeted tests for touched modules
- [ ] Validate changed prompts/registry behavior with smoke scenarios
- [ ] Record evidence in `.kord-aios/evidence` and summary in `docs/kord-aios/sessions/`

## 9) Handoff Format (After Each Phase)

- [ ] What changed (files)
- [ ] Contract impacts (agent/command/state)
- [ ] Verification evidence (commands + result)
- [ ] Remaining risks and next phase entry criteria
