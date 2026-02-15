# EPIC-11: Squad System Evolution

> **Status**: Draft
> **Created**: 2026-02-12
> **Research**: [Squad System Study](../../researches/squad-system-study.md)
> **Priority**: High
> **Depends on**: EPIC-10 (completed)

---

## Summary

Evolve the Kord AIOS squad system from its current minimal implementation to a production-ready data-package architecture. Squads are runtime content packages (YAML + .md files) loaded by the plugin engine — not compiled code, not new plugins. The Squad Creator agent writes files; the loader/factory converts them to executable agents.

This EPIC covers schema evolution, loader enhancements, validation tooling, and Squad Creator refinement. It does NOT cover distribution (publish/download) or squad designer — those are Phase 2/3 follow-ups.

---

## Context

### Current State (OMOC)
- `SQUAD.yaml` schema with agents, categories, default_executor, contract_type
- Loader reads from `builtin-squads/` and `.opencode/squads/`
- Factory creates AgentConfig from manifests
- `squad_load` tool for runtime loading
- `/squad` command to switch active squad
- Squad Creator agent writes SQUAD.yaml + agents/ + skills/
- One built-in squad: `dev` (with dev-junior)
- 341 lines of tests

### Target State
- Extended schema with `prompt_file`, `config`, `dependencies`, `tags`, `kord.minVersion`
- Loader supports external .md prompt files
- `squad_validate` tool for manifest + structure + reference validation
- Squad Creator produces richer output matching new schema
- Multiple search paths including `.kord/squads/`
- Clear documentation of the data-package model

### Key Insight
**Squads are data packages, not plugins.** The Squad Creator writes files to disk. The loader/factory converts them to executable agents at runtime. No compilation, no plugin creation.

---

## Stories

### Wave 0: Prerequisites

#### S00: Branding Normalization — `kord-aios` / `kord-aios` / `kord-aios` → `kord-aios`

**As** the project, **I need** all legacy branding terms normalized to `kord-aios` **so that** the codebase, npm package, CLI binary, and GitHub repo use a consistent identity that doesn't conflict with the `kord` agent name.

**Context**: The codebase currently uses 4 different naming conventions inherited from different eras: `kord-aios` (npm/repo), `kord-aios` (binary/OMOC legacy), `kord-aios`/`Kord AIOS`/`Kord AIOS` (post-migration branding). These need to converge to `kord-aios` (platform) while keeping `kord` (agent name) and `.kord/` (directory) unchanged.

**Canonical Mapping**:

| Current | New | Context |
|---------|-----|---------|
| `Kord AIOS` / `Kord AIOS` | `Kord AIOS` | Display name |
| `kord-aios` | `kord-aios` | npm package, GitHub repo |
| `kord-aios` | `kord-aios` | CLI binary, platform packages |
| `KordAios` (PascalCase) | `KordAios` | Type/interface names |
| `kord-aios` (camelCase) | `kordAios` | Variable/function identifiers |
| `"kord-aios"` (string) | `"kord-aios"` | String literals, config keys |
| `kord-aios-*` (kebab) | `kord-aios-*` | Compound names (`kord-aios-antigravity-auth`, etc.) |
| `kord-aios.config.jsonc` | `kord-aios.config.jsonc` | Config file name |
| `.kord/` | `.kord/` | **NO CHANGE** — directory stays |
| `kord` (agent) | `kord` | **NO CHANGE** — agent name stays |
| `kord-rules.md` | `kord-rules.md` | **NO CHANGE** — rules file stays |
| `docs/kord/` | `docs/kord/` | **NO CHANGE** — docs dir stays |

**Scope** (from audit):
- 265 `kord-aios` matches in 38 .ts files
- 340 `kord-aios` matches in 71 .md/.json files
- 18 `kord-aios` matches in 12 .ts files
- 9 `kord-aios` matches in 6 .ts files
- 53 `kord-aios` matches in 12 package.json files
- 6 files/dirs to rename (`kord-aios-loader.ts`, `skills/kord-aios/`, scripts)
- 12 platform packages to rename (`kord-aios-*` → `kord-aios-*`)

**Acceptance Criteria**:
- [ ] Normalization script `script/normalize-branding.ts` created:
  - Phase 1: Text replacements (ordered from most specific to least)
  - Phase 2: File renames (`.ts`, `.mjs` files)
  - Phase 3: Directory renames (`skills/kord-aios/` → `skills/kord-aios/`, platform packages)
  - Dry-run mode with diff preview
  - Report: files changed, replacements made
- [ ] Script executed successfully — all terms normalized
- [ ] `package.json` updated: name `kord-aios`, bin `kord-aios`, optionalDeps `kord-aios-*`
- [ ] GitHub repo URL updated in package.json (`GDSDN/kord-aios`)
- [ ] Zero occurrences of `kord-aios`, `kord-aios`, `kord-aios` remain in source
- [ ] `kord` (agent name), `.kord/` (directory), `kord-rules.md` (rules) are UNCHANGED
- [ ] All imports updated to reflect file renames
- [ ] `bun run typecheck` passes
- [ ] `bun test` — all tests pass (update string assertions as needed)

**Files**: `script/normalize-branding.ts` (new), ALL files in `src/`, `packages/`, `docs/`, `bin/`

**Implementation**: Script-based (preferred). Script applies all replacements atomically with dry-run preview before execution.

---

### Wave 1: Schema & Loader (Foundation)

#### S01: SQUAD.yaml Schema v2

**As** the squad system, **I need** an extended manifest schema **so that** squads can reference external prompts, declare dependencies, and carry metadata.

**Acceptance Criteria**:
- [ ] `squadSchema` in `schema.ts` extended with:
  - `prompt_file: z.string().optional()` on squad agent (path relative to squad dir)
  - `config: z.object({ extends, rules }).optional()` on manifest
  - `dependencies: z.object({ skills, squads }).optional()` on manifest
  - `tags: z.array(z.string()).optional()` on manifest
  - `kord: z.object({ minVersion }).optional()` on manifest
- [ ] All new fields are optional (backward compatible)
- [ ] Existing `dev` squad SQUAD.yaml still parses successfully
- [ ] Tests: schema parses manifests with new fields, rejects invalid, preserves defaults
- [ ] `bun run typecheck` passes

**Files**: `src/features/squad/schema.ts`, `src/features/squad/squad.test.ts`

---

#### S02: Loader Supports External Prompt Files

**As** the squad loader, **I need** to resolve `prompt_file` references **so that** squad agents can have rich prompts from .md files instead of inline YAML strings.

**Acceptance Criteria**:
- [ ] `loader.ts` enhanced: when loading a squad, if an agent has `prompt_file`, read the .md file from `{squadDir}/{prompt_file}`
- [ ] `factory.ts` `createSquadAgentConfig`: use loaded .md content as system prompt (priority: prompt_file > prompt > default)
- [ ] If `prompt_file` path doesn't exist, log warning and fall back to inline prompt or default
- [ ] Tests: agent with prompt_file gets .md content, missing file falls back gracefully
- [ ] `bun run typecheck` passes

**Files**: `src/features/squad/loader.ts`, `src/features/squad/factory.ts`, `src/features/squad/squad.test.ts`

---

#### S03: Squad Load Tool — Add `.kord/squads/` Search Path

**As** the `squad_load` tool, **I need** to search `.kord/squads/` in addition to existing paths **so that** user squads in the `.kord/` directory are discoverable.

**Acceptance Criteria**:
- [ ] `DEFAULT_SEARCH_PATHS` in `tools.ts` includes `.kord/squads/`
- [ ] Search order: `.opencode/squads/` → `.kord/squads/` → `docs/kord/squads/`
- [ ] `/squad` command template updated to list `.kord/squads/` as a search path
- [ ] Tests: tool finds squad in `.kord/squads/` directory
- [ ] `bun run typecheck` passes

**Files**: `src/tools/squad-load/tools.ts`, `src/features/builtin-commands/templates/squad.ts`

---

### Wave 2: Validation & Creator

#### S04: `squad_validate` Tool

**As** the squad system, **I need** a validation tool **so that** squads can be validated before activation or publication.

**Acceptance Criteria**:
- [ ] New tool `squad_validate` in `src/tools/squad-validate/`
- [ ] Validation checks:
  - Manifest parses against Zod schema
  - All `prompt_file` references exist on disk
  - All referenced skills exist (in built-in or project skills)
  - `default_executor` references an agent defined in the manifest
  - `default_reviewer` references an agent defined in the manifest (if set)
  - Agent names are kebab-case
- [ ] Returns structured result: `{ valid, errors[], warnings[] }`
- [ ] Registered in tool index
- [ ] Tests: valid squad passes, various invalid manifests caught
- [ ] `bun run typecheck` passes

**Files**: `src/tools/squad-validate/` (new), `src/tools/squad-validate/tools.ts`, `src/tools/squad-validate/types.ts`, `src/tools/squad-validate/constants.ts`

---

#### S05: Squad Creator Agent — Produce v2 Structure

**As** the Squad Creator agent, **I need** to generate squads matching the v2 schema **so that** created squads use external prompt files, include skills, and carry proper metadata.

**Acceptance Criteria**:
- [ ] Squad Creator prompt updated:
  - Output structure shows `agents/{role}.md` prompt files
  - SQUAD.yaml template includes `prompt_file`, `tags`, `kord.minVersion`
  - Skills directory with SKILL.md files for domain methodology
  - README.md for squad documentation
- [ ] Prompt references `squad_validate` tool for post-creation validation
- [ ] Output format section updated
- [ ] Tests: prompt contains new schema fields, output format references
- [ ] `bun run typecheck` passes

**Files**: `src/agents/squad-creator.ts`

---

#### S06: `/squad-create` Command Template

**As** a user, **I need** a `/squad-create` command **so that** I can invoke squad creation directly without remembering to delegate to the Squad Creator agent.

**Acceptance Criteria**:
- [ ] New command template `src/features/builtin-commands/templates/squad-create.ts`
- [ ] Template instructs: parse $ARGUMENTS for domain name, delegate to @squad-creator via call_kord_agent
- [ ] Registered in commands.ts
- [ ] If no argument: show usage and examples
- [ ] `bun run typecheck` passes

**Files**: `src/features/builtin-commands/templates/squad-create.ts`, `src/features/builtin-commands/commands.ts`

---

### Wave 3: Skill Adaptation

#### S09: Adapt Imported Squad-Creation Skills for Kord Engine

**As** the skill system, **I need** the 7 imported squad-creation skills adapted to the Kord AIOS engine **so that** the Squad Creator agent uses correct paths, APIs, schema references, and English-only content.

**Context**: These skills were imported from Synkra AIOS but never adapted. They reference non-existent JS scripts (`SquadGenerator`, `SquadValidator`, `SquadLoader`, `SquadDesigner`, `SquadAnalyzer`, `SquadExtender`), wrong directory paths (`./squads/` instead of `.opencode/squads/` or `.kord/squads/`), deprecated manifest names (`config.yaml`), Synkra-specific concepts (TASK-FORMAT-SPECIFICATION-V1, command_loader, Level 0-6 structure), and contain mixed Portuguese/English text.

**Skills to adapt** (all in `src/features/builtin-skills/skills/kord-aios/squad/`):

| Skill | Lines | Key Issues |
|-------|-------|------------|
| `squad-creator-create` | 288 | References `SquadGenerator`/`SquadValidator` JS scripts, `./squads/` path, `config.yaml`, mixed PT/EN, `kord-aios` namespace |
| `squad-creator-design` | 313 | References `SquadDesigner` JS script, `./squads/.designs/`, blueprint schema with Synkra fields |
| `squad-creator-validate` | 147 | References `SquadValidator`/`SquadLoader` JS scripts, TASK-FORMAT-SPEC-V1, SQS story refs |
| `squad-creator-analyze` | 214 | References `SquadAnalyzer`/`SquadLoader` JS scripts, `kord-aios` namespace |
| `squad-creator-extend` | 285 | References `SquadExtender` scripts, component types we don't support (tools, scripts, data) |
| `squad-creator-list` | 214 | References `SquadGenerator` JS script, `config.yaml` deprecated format, mixed PT/EN |
| `create-agent` | 1162 | HEAVY — References `outputs/minds/`, `pack_name` terminology, `command_loader`, `CRITICAL_LOADER_RULE`, Level 0-6, `@pedro-valerio`, maturity scoring, JS scripts |

**Acceptance Criteria**:
- [ ] All 7 skills updated with Kord AIOS terminology and paths:
  - `./squads/` → `.opencode/squads/` or `.kord/squads/`
  - `squad.yaml` / `config.yaml` → `SQUAD.yaml`
  - `kord-aios` → `kord`
  - JS script references → describe the action for the LLM to perform (no scripts in our engine)
  - TASK-FORMAT-SPEC-V1 → SKILL.md format
  - Component types we don't support (tools, scripts, data, workflows) → removed or noted as unsupported
  - Story references (SQS-*) → removed
- [ ] All Portuguese text translated to English (English-only policy)
- [ ] `create-agent` skill heavily restructured:
  - Remove `command_loader`, `CRITICAL_LOADER_RULE`, Level 0-6 structure
  - Replace `pack_name` with `squad_name`
  - Remove `outputs/minds/` references
  - Remove `@pedro-valerio` agent reference
  - Adapt maturity scoring to Kord AIOS context
  - Focus on SQUAD.yaml agent definition + optional agent .md prompt file
- [ ] Implementation blocks updated to describe what the Squad Creator agent should DO (write files, validate schema) rather than call non-existent JS modules
- [ ] Output directory structures match the v2 schema from S01
- [ ] Each skill's frontmatter `agent: squad-creator` preserved
- [ ] Tests: verify no Synkra-specific terms remain in adapted skills
- [ ] `bun run typecheck` passes

**Files**: All 7 SKILL.md files in `src/features/builtin-skills/skills/kord-aios/squad/`

---

### Wave 4: Integration & Tests

#### S07: Kord SystemAwareness — Squad Section

**As** Kord, **I need** awareness of installed squads **so that** I can delegate to squad agents and explain squad capabilities to users.

**Acceptance Criteria**:
- [ ] `buildSquadPromptSection` in `factory.ts` enhanced:
  - Shows delegation syntax: `task(subagent_type="{agent}")`
  - Shows available categories: `task(category="{squad}:{category}")`
  - Shows squad skills
- [ ] SystemAwareness in `kord.ts` references squad system
- [ ] Tests: prompt section output includes delegation syntax
- [ ] `bun run typecheck` passes

**Files**: `src/features/squad/factory.ts`, `src/agents/kord.ts`

---

#### S08: Comprehensive Test Suite

**As** the test suite, **I need** comprehensive coverage of all squad system changes **so that** regressions are caught.

**Acceptance Criteria**:
- [ ] Tests for S01 (schema v2 fields)
- [ ] Tests for S02 (prompt_file loading + fallback)
- [ ] Tests for S03 (.kord/squads/ search path)
- [ ] Tests for S04 (squad_validate — valid, invalid, warnings)
- [ ] Tests for S05 (Squad Creator prompt content)
- [ ] Tests for S06 (/squad-create command template)
- [ ] Tests for S07 (squad prompt section output)
- [ ] Tests for S09 (adapted skills — no Synkra terms, English-only, correct paths)
- [ ] All existing squad tests still pass
- [ ] `bun run typecheck` passes
- [ ] `bun test` — all squad-related tests green

**Files**: `src/features/squad/squad.test.ts`, `src/tools/squad-validate/squad-validate.test.ts`, `src/agents/prompt-refinement.test.ts`

---

## Wave Execution Plan

| Wave | Stories | Focus | Dependencies |
|------|---------|-------|-------------|
| **Wave 0** | S00 | Branding normalization (`kord-aios` → `kord-aios`) | None (prerequisite for all) |
| **Wave 1** | S01, S02, S03 | Schema + Loader + Search paths | Wave 0 |
| **Wave 2** | S04, S05, S06 | Validation + Creator + Command | Wave 1 |
| **Wave 3** | S09 | Adapt 7 imported squad skills for Kord engine | Wave 1 (needs v2 schema as reference) |
| **Wave 4** | S07, S08 | Integration + Comprehensive Tests | Wave 2 + Wave 3 |

---

## Out of Scope (Phase 2/3)

- **Squad Designer**: Blueprint generation from docs/PRD
- **Squad Analyzer**: Coverage metrics and suggestions
- **Squad Extender**: Guided component addition
- **Squad Distribution**: Download/publish to GitHub or marketplace
- **Config Inheritance**: Squad rules extending project rules
- **Squad Dependencies Resolution**: Automatic squad→squad dependency install
- **Squad Templates**: Predefined templates (ETL, content, etc.)

---

## Anti-Patterns

- **Don't create plugins from squads** — squads are data packages
- **Don't compile squad agents** — they are runtime-generated
- **Don't duplicate the plan system** — squads don't have workflows
- **Don't duplicate the skill system** — squads reference skills, they ARE skills
- **Don't break existing dev squad** — all changes backward compatible
