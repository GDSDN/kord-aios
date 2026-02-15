> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Squad System Study — Synkra AIOS vs OMOC vs Kord AIOS

> **Date**: 2026-02-12
> **Status**: Complete
> **Scope**: How squads work in Synkra AIOS, what OMOC already has, and implementation strategy for Kord AIOS

---

## Executive Summary

**Core Question**: If Kord AIOS is itself a plugin (OMOC engine), how does the Squad Creator create squads? Does it create new plugins, list agents, or produce data packages?

**Answer**: **Squads are data packages, not plugins.** The plugin (Kord AIOS) is the runtime engine. Squads are content packages (YAML + .md files) that the engine loads at runtime and converts into executable agent configurations. This is analogous to themes in a CMS — the CMS is the engine, themes are content packages the engine renders.

The Squad Creator agent produces files on disk (SQUAD.yaml, agent .md files, skill .md files). The plugin's loader/factory reads those files and injects them into the delegation system as available agents, categories, and skills.

---

## 1. Synkra AIOS Squad System (Source of Truth)

### 1.1 Architecture

Squads in Synkra are **self-contained modular packages** containing:

| Component | Format | Purpose |
|-----------|--------|---------|
| Manifest | `squad.yaml` | Identity, agents, components, config, dependencies |
| Agents | `.md` files in `agents/` | Agent persona definitions |
| Tasks | `.md` files in `tasks/` | Executable task definitions (TASK-FORMAT-SPEC-V1) |
| Workflows | `.yaml` files in `workflows/` | Multi-step orchestrations |
| Config | `.md` files in `config/` | Coding standards, tech stack, source tree |
| Skills | `.md` files in `skills/` | Domain methodology (v2) |
| Templates | `.md` files in `templates/` | Document generation |
| Tools | `.js` files in `tools/` | Custom tool integrations |
| Scripts | `.js` files in `scripts/` | Automation utilities |
| Data | `.json/.yaml` in `data/` | Static reference data |

### 1.2 Squad Manifest (squad.yaml)

```yaml
name: my-squad                    # kebab-case identifier
version: 1.0.0                    # semver
description: What this squad does
author: Name <email>
license: MIT
slashPrefix: my                   # command prefix

aios:
  minVersion: "2.1.0"
  type: squad

components:
  agents: [my-agent.md]
  tasks: [my-task.md]
  workflows: []
  checklists: []
  templates: []
  tools: []
  scripts: []

config:
  extends: extend                 # extend | override | none
  coding-standards: config/coding-standards.md
  tech-stack: config/tech-stack.md

dependencies:
  node: []
  python: []
  squads: [etl-squad@^2.0.0]     # squad dependencies!

tags: [domain-specific, automation]
```

### 1.3 Key Design Principles

1. **Task-first architecture**: Tasks are entry points, agents orchestrate them
2. **3-level distribution**: Local (`./squads/`) → GitHub (aios-squads) → Marketplace (Synkra API)
3. **Config inheritance**: Squads can extend, override, or be standalone
4. **Squad dependencies**: Squads can depend on other squads
5. **JSON Schema validation**: Mandatory validation before distribution

### 1.4 Squad Creator Agent

The `@squad-creator` (nicknamed "Craft") is an agent with **12 task files**:

| Command | Purpose | Status |
|---------|---------|--------|
| `*create-squad` | Create new squad with full structure | Active |
| `*design-squad` | Analyze docs → generate blueprint | Active |
| `*validate-squad` | Validate against schema + standards | Active |
| `*list-squads` | List local squads | Active |
| `*analyze-squad` | Analyze structure, suggest improvements | Active |
| `*extend-squad` | Add components to existing squad | Active |
| `*migrate-to-v2` | Migrate legacy squads to v2 format | Active |
| `*generate-skills` | Generate skills from squad knowledge | Active |
| `*generate-workflow` | Generate orchestration YAML workflow | Active |
| `*download-squad` | Download from public repo | Placeholder |
| `*publish-squad` | Publish to aios-squads | Placeholder |
| `*sync-squad-synkra` | Sync to Synkra API marketplace | Placeholder |

Backed by 9 JavaScript scripts: SquadGenerator, SquadValidator, SquadLoader, SquadDesigner, SquadAnalyzer, SquadExtender, SquadMigrator, SquadDownloader, SquadPublisher.

### 1.5 Squad Designer Flow

```
Docs/PRD → Domain Analysis → Recommendations → Interactive Review → Blueprint → Create Squad
```

The designer:
1. Analyzes documentation (entities, workflows, integrations, stakeholders)
2. Generates agent and task recommendations with confidence scores
3. User reviews/modifies/accepts
4. Saves blueprint to `.squad-design.yaml`
5. Creates squad from blueprint

---

## 2. OMOC (Kord AIOS) Current Squad Infrastructure

### 2.1 What Already Exists

| Component | File | What It Does |
|-----------|------|-------------|
| **Schema** | `src/features/squad/schema.ts` | Zod schema: name, description, version, agents, categories, default_executor, contract_type, plan_template |
| **Loader** | `src/features/squad/loader.ts` | Loads from `builtin-squads/` and `.opencode/squads/` |
| **Factory** | `src/features/squad/factory.ts` | Creates AgentConfig from squad manifests, generates prompt sections for Kord |
| **Tool** | `src/tools/squad-load/tools.ts` | `squad_load` tool — loads manifests at runtime from 3 search paths |
| **Command** | `/squad` template | Switches active squad context, updates boulder state |
| **Creator Agent** | `src/agents/squad-creator.ts` | Agent that creates SQUAD.yaml + agents/ + skills/ |
| **Built-in Squad** | `builtin-squads/dev/SQUAD.yaml` | Dev squad with dev-junior agent |
| **Tests** | `src/features/squad/squad.test.ts` | 341-line test suite: schema, loader, factory, agents, categories |

### 2.2 The Runtime Flow

```
SQUAD.yaml → Loader (parse + validate) → Factory (AgentConfig[]) → Plugin registers agents
                                                                   → Prompt builder injects squad section
                                                                   → Delegation system gets categories
```

Key: **Squad agents are created at runtime from data**, not compiled into the plugin.

### 2.3 Current Schema vs Synkra

| Feature | Kord AIOS (current) | Synkra AIOS |
|---------|-------------------|-------------|
| Manifest | SQUAD.yaml (Zod) | squad.yaml (JSON Schema) |
| Agents | Inline in YAML | Separate .md files |
| Tasks | — | .md files (TASK-FORMAT-V1) |
| Skills | Referenced by name | Referenced by name (v2 also has .md) |
| Workflows | — | YAML definitions |
| Categories | Inline in YAML | — (uses task routing instead) |
| Config inheritance | — | extend/override/none |
| Dependencies | — | node, python, squads |
| Distribution | Local only | 3-level (Local, GitHub, Marketplace) |
| Validation | Zod parse | JSON Schema + structure + format |
| Blueprint designer | — | Full design pipeline |
| Analyzer/Extender | — | Coverage metrics + guided extension |

---

## 3. Implementation Strategy for Kord AIOS

### 3.1 The Core Insight: Data Packages Over Code

The Squad Creator should produce **data packages** that the existing loader/factory consumes. It does NOT need to:
- ❌ Create new plugins
- ❌ Compile TypeScript
- ❌ Register agents programmatically
- ❌ Modify plugin source code

It DOES need to:
- ✅ Write SQUAD.yaml manifests
- ✅ Write agent persona .md files
- ✅ Write SKILL.md files for domain methodology
- ✅ Write templates for domain-specific outputs
- ✅ Validate output against schema

### 3.2 Proposed Squad Structure for Kord AIOS

```
.opencode/squads/{domain}/
├── SQUAD.yaml           # Manifest (extended schema)
├── README.md            # Documentation
├── agents/
│   ├── {role-1}.md      # Agent persona + prompt
│   └── {role-2}.md
├── skills/
│   ├── {skill-1}/
│   │   └── SKILL.md     # Domain methodology
│   └── {skill-2}/
│       └── SKILL.md
└── templates/
    └── {template}.md    # Output templates
```

### 3.3 Schema Evolution (What to Add)

```yaml
# Extended SQUAD.yaml
name: marketing
version: 1.0.0
description: Marketing content team

# NEW: Kord AIOS compatibility
kord:
  minVersion: "1.0.0"
  
agents:
  copywriter:
    description: "Expert copywriter"
    mode: subagent
    skills: [brand-voice]
    prompt_file: agents/copywriter.md  # NEW: external prompt file
  brand-chief:
    description: "Squad chief"
    mode: subagent
    is_chief: true

categories:
  creative:
    description: "Creative writing tasks"
  visual:
    description: "Visual design tasks"

# NEW: Config section
config:
  extends: extend
  rules: config/squad-rules.md

# NEW: Dependency tracking
dependencies:
  skills: [git-master]          # built-in skills this squad needs
  squads: []                    # other squads

default_executor: copywriter
default_reviewer: brand-chief
contract_type: campaign

tags: [marketing, content, branding]
```

### 3.4 What to Build (Prioritized)

#### Phase 1: Foundation (Must Have)
1. **Schema v2**: Extend SQUAD.yaml with `prompt_file`, `config`, `dependencies`, `tags`, `kord.minVersion`
2. **Loader v2**: Support `prompt_file` → read .md file as agent prompt
3. **Squad Creator refinement**: Update agent prompt to generate the new structure
4. **Validation tool**: `squad_validate` tool that checks manifest, structure, file refs

#### Phase 2: Tooling (Should Have)
5. **Squad Designer**: Blueprint generation from docs/PRD (adapt from Synkra)
6. **Squad Analyzer**: Coverage metrics, suggestions
7. **Squad Extender**: Add components with manifest auto-update

#### Phase 3: Distribution (Nice to Have)
8. **Squad download/publish**: GitHub repo integration
9. **Config inheritance**: Squad rules extending project rules
10. **Squad dependencies**: Resolve squad→squad deps

### 3.5 How Squad Creator Works (Detailed Flow)

```
User: "Create a marketing squad"
  → Kord delegates to @squad-creator
  → Squad Creator:
     1. Researches domain (via @analyst, @librarian)
     2. Designs agent personas
     3. Creates SQUAD.yaml manifest
     4. Writes agent .md files (persona + prompt)
     5. Writes SKILL.md files (methodology)
     6. Validates via squad_validate tool
     7. Reports success
  → Files written to .opencode/squads/marketing/
  → Next time Kord loads, loader discovers the new squad
  → Squad agents become available via task(subagent_type="copywriter")
```

### 3.6 Critical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Where are tasks? | We use **skills** instead of tasks | OMOC skill system = Synkra task system. No duplication needed. |
| Do squads have workflows? | **No** (use plan agent) | OMOC plan agent handles orchestration. Squad workflows would duplicate it. |
| Do squads have tools? | **No** (tools are plugin-level) | Tools require TypeScript compilation. Squads are data-only. |
| Do squads have scripts? | **No** | Same as tools — runtime execution needs plugin support. |
| Can squad agents call task()? | **Only if is_chief: true** | Squad chiefs can delegate within their squad. |
| Config inheritance? | **Phase 2** | Useful but not critical for v1. |

---

## 4. Comparison Matrix

```
Feature                    Synkra AIOS    OMOC Current    Proposed Kord AIOS
─────────────────────────────────────────────────────────────────────────────
Squad manifest             squad.yaml     SQUAD.yaml      SQUAD.yaml (extended)
Agent definitions          .md files      YAML inline     YAML + .md files
Task definitions           .md files      —               Skills (SKILL.md)
Workflow orchestration     YAML files     Plan agent      Plan agent
Custom tools               .js files     —               — (plugin-level only)
Config inheritance         3 modes        —               Phase 2
Dependencies               3 types        —               skills + squads
Distribution               3 levels       Local only      Phase 3
Validation                 Schema+fmt     Zod parse       Zod + structure + refs
Designer/Blueprint         Full pipeline  —               Phase 2
Analyzer/Extender          Full tooling   —               Phase 2
Squad Creator agent        12 tasks       1 agent         1 agent + tools
```

---

## 5. Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Schema breaking change | High | Backwards-compatible extension (new fields optional) |
| Prompt quality from .md files | Medium | Validate .md structure, provide templates |
| Squad discovery performance | Low | Already fast (sync file scan) |
| Chief agent delegation loops | Medium | Max delegation depth, no self-delegation |
| Large squad file sizes | Low | Lazy loading (only load active squad) |

---

## 6. Conclusion

Squads in Kord AIOS are **runtime data packages** consumed by the plugin engine. The Squad Creator writes files; the loader/factory converts them to executable agents. This architecture is clean, extensible, and doesn't require any plugin compilation.

Phase 1 focuses on schema evolution and tooling. Phase 2 adds intelligence (designer, analyzer). Phase 3 adds distribution. Each phase delivers standalone value.

---

## 7. Imported Squad Skills — Adaptation Audit

> **Added**: 2026-02-12 (follow-up analysis)

### 7.1 Overview

7 squad-related skills were imported from Synkra AIOS into `src/features/builtin-skills/skills/kord-aios/squad/`. They contain the core methodology for squad creation, but were **never adapted** for the Kord AIOS engine. They reference non-existent infrastructure and contain Synkra-specific terminology.

### 7.2 Per-Skill Audit

| Skill | Lines | Severity | Key Issues |
|-------|-------|----------|------------|
| `squad-creator-create` | 288 | **High** | `SquadGenerator`/`SquadValidator` JS scripts, `./squads/` path, `config.yaml`, mixed PT/EN, `kord-aios` namespace, TASK-FORMAT references |
| `squad-creator-design` | 313 | **High** | `SquadDesigner` JS script, `./squads/.designs/`, blueprint schema with Synkra-specific fields, `entrada`/`saida` terminology |
| `squad-creator-validate` | 147 | **Medium** | `SquadValidator`/`SquadLoader` JS, TASK-FORMAT-SPEC-V1, SQS-3/SQS-10 story references |
| `squad-creator-analyze` | 214 | **Medium** | `SquadAnalyzer`/`SquadLoader` JS, `kord-aios` namespace, tasks/workflows/scripts coverage (we don't have those) |
| `squad-creator-extend` | 285 | **High** | `SquadExtender` JS, component types we don't support (tools, scripts, data, workflows), 8 template types |
| `squad-creator-list` | 214 | **Low** | `SquadGenerator` JS, `config.yaml` deprecated, mixed PT/EN |
| `create-agent` | 1162 | **Critical** | `outputs/minds/`, `pack_name`, `command_loader`, `CRITICAL_LOADER_RULE`, Level 0-6 structure, `@pedro-valerio`, maturity scoring, JS scripts, 7 phases with Synkra-specific tooling |

### 7.3 Common Issues Across All Skills

1. **Non-existent JS scripts**: All skills reference `require('./squad')` with classes like `SquadGenerator`, `SquadValidator`, `SquadLoader`, `SquadDesigner`, `SquadAnalyzer`, `SquadExtender`. These don't exist in our engine. Skills should describe **what the LLM agent should do** (write files, parse YAML, validate schema), not call JS modules.

2. **Wrong directory paths**: All reference `./squads/{name}/` (Synkra convention). Should be `.opencode/squads/{name}/` or `.kord/squads/{name}/` (Kord AIOS convention).

3. **Wrong manifest name**: Reference `squad.yaml` or `config.yaml` (deprecated). Should be `SQUAD.yaml`.

4. **Mixed Portuguese/English**: `squad-creator-create` and `squad-creator-list` have Portuguese headers ("Uso", "Parametros", "Elicitacao Interativa", "Output de Sucesso"). `create-agent` has Portuguese throughout. Violates English-only policy.

5. **Synkra story references**: SQS-3, SQS-9, SQS-10, SQS-11 — meaningless in our context.

6. **Unsupported component types**: Synkra squads have tools (.js), scripts (.js), data (.yaml/.json), workflows (.yaml), checklists (.md). Kord AIOS squads only have agents and skills. Skills referencing these types need component lists trimmed.

7. **TASK-FORMAT-SPECIFICATION-V1**: Synkra's task format. We use SKILL.md format instead.

### 7.4 `create-agent` — Special Case

This is the largest skill (1162 lines) and the most problematic. It describes a 7-phase agent creation pipeline deeply tied to Synkra's architecture:

- **Phase 0**: References `squads/{pack_name}/` and `config.yaml`
- **Phase 1**: References `outputs/minds/{specialist_slug}/sources/` and `docs/research/` — Synkra's research storage
- **Phase 2**: Tier system (0-3 + tools) — interesting methodology but uses Synkra vocabulary
- **Phase 3**: Agent template with Level 0-6 structure, `command_loader`, `CRITICAL_LOADER_RULE` — none of these exist in our engine
- **Phase 4**: Quality gate SC_AGT_001 — useful methodology, needs path/tool adaptation
- **Phase 5**: `command_loader` generation, task stubs, template stubs, checklists — our engine doesn't have command loaders
- **Phase 6**: Operational validation with maturity scoring — methodology is valuable, references need updating
- **Phase 7**: Handoff referencing `@pedro-valerio` agent (doesn't exist in Kord AIOS)

**Recommendation**: Heavy restructure. Keep the research-driven creation methodology (valuable), remove command_loader/Level structure (engine-specific), adapt output to SQUAD.yaml agent definition + optional .md prompt file.

### 7.5 Adaptation Strategy

For each skill:
1. **Preserve methodology** — the step-by-step workflows and quality gates are valuable
2. **Replace infrastructure references** — JS scripts → LLM actions, wrong paths → correct paths
3. **Translate to English** — all Portuguese text
4. **Update output format** — match SQUAD.yaml v2 schema
5. **Remove unsupported components** — tools, scripts, data, workflows, checklists
6. **Remove dead references** — SQS stories, `@pedro-valerio`, `outputs/minds/`
