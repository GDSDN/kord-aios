> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Skill System Deep Analysis: Synkra AIOS vs OMOC

**Date:** 2026-02-09 (updated 2026-02-10)
**Status:** Research Complete
**Scope:** Full comparative analysis of skill architectures, bugs, patterns, and Kord AIOS adaptation strategy
**See also:** `aios-skill-catalog.md` (updated with ENGINE/ADAPT/KEEP/SKIP adoption analysis against Kord AIOS engine)

---

## 1. Executive Summary

This document provides a comprehensive analysis of the skill systems in both **Synkra AIOS** (`D:\dev\synkra-aios`) and **OMOC** (kord-aios, the engine powering `D:\dev\kord-aios-migration`). The goal is to understand the structure, identify bugs, evaluate patterns, and define an adaptation strategy for **Kord AIOS** (kord-aios).

### Key Findings

| Dimension | Synkra AIOS | OMOC |
|-----------|-------------|------|
| **Total "skill" assets** | ~248 (200 tasks + 8 skills + 40 commands) | 5 built-in skills |
| **Skill format** | Markdown with YAML agent definitions + `*command` star patterns | SKILL.md with YAML frontmatter OR TypeScript `BuiltinSkill` objects |
| **Discovery** | Agent-local (embedded in agent YAML `dependencies`) | Hierarchical directory scan (6 directories) |
| **MCP integration** | External (Docker MCP, manual setup) | Built-in (frontmatter `mcp:` or `mcp.json`) |
| **Execution model** | Agent loads task → executes inline | Skill loader → prompt injection → subagent delegation |
| **Total files in framework** | 983 files in `.aios-core/` | ~30 files in `builtin-skills/` + `opencode-skill-loader/` |

### Critical Insight

The "176+ skills" referenced in the migration plan maps to **200 task files** in `.aios-core/development/tasks/` plus additional skills, commands, and templates. The AIOS architecture fundamentally differs from OMOC: AIOS uses **agent-embedded task references** while OMOC uses a **standalone skill discovery system**.

---

## 2. OMOC Skill Architecture (Current Engine)

### 2.1 Built-in Skills

OMOC ships with **5 built-in skills** defined as TypeScript objects in `src/features/builtin-skills/skills/`:

| Skill | File | Lines | MCP | Purpose |
|-------|------|-------|-----|---------|
| `playwright` | `playwright.ts` | 313 | Yes (`@playwright/mcp`) | Browser automation via Playwright MCP |
| `agent-browser` | `playwright.ts` | (same file) | No (CLI `allowedTools`) | Browser automation via agent-browser CLI |
| `frontend-ui-ux` | `frontend-ui-ux.ts` | 80 | No | Designer mindset injection for UI work |
| `git-master` | `git-master.ts` | 1108 | No | Git operations: commits, rebase, history search |
| `dev-browser` | `dev-browser.ts` | 222 | No | Browser automation with persistent page state |

### 2.2 Skill Type Definition

```typescript
// src/features/builtin-skills/types.ts
interface BuiltinSkill {
  name: string
  description: string
  template: string         // The actual prompt content
  license?: string
  compatibility?: string
  metadata?: Record<string, unknown>
  allowedTools?: string[]  // Tool whitelist
  agent?: string           // Preferred agent
  model?: string           // Preferred model
  subtask?: boolean
  argumentHint?: string
  mcpConfig?: SkillMcpConfig  // MCP server definitions
}
```

### 2.3 SKILL.md Format (OpenCode-compatible)

Skills discovered from disk use YAML frontmatter:

```markdown
---
name: my-skill
description: What this skill does
model: anthropic/claude-sonnet-4-5
agent: dev
subtask: true
argument-hint: "Describe what to do"
allowed-tools:
  - Read
  - Write
  - Bash
mcp:
  my-server:
    command: npx
    args: ["-y", "my-mcp-package"]
---

# Skill Prompt Content

Instructions injected into agent system prompt...
```

### 2.4 Skill Discovery System

The `opencode-skill-loader` (`src/features/opencode-skill-loader/loader.ts`) implements hierarchical discovery:

```
Priority (highest to lowest):
1. .opencode/skills/      (opencode-project scope)
2. ~/.opencode/skills/    (opencode global scope)
3. .claude/skills/        (project claude scope)
4. ~/.claude/skills/      (user claude scope)
```

**Discovery algorithm per directory:**
1. Scan for subdirectories → look for `SKILL.md` or `{dirname}.md`
2. Scan for flat `.md` files
3. Recurse up to `maxDepth=2` for nested skills (e.g., `superpowers/brainstorming`)
4. Deduplicate by name (first-found wins by priority)

**File resolution order per skill directory:**
1. `{dir}/SKILL.md` (preferred)
2. `{dir}/{dirname}.md` (fallback)
3. Nested recursion if neither found

### 2.5 Skill Loading Pipeline

```
SKILL.md file
    │
    ├─→ parseFrontmatter() → metadata extraction
    ├─→ parseSkillMcpConfigFromFrontmatter() → MCP config
    ├─→ loadMcpJsonFromDir() → sidecar mcp.json
    │
    ▼
LoadedSkill {
  name, path, resolvedPath,
  definition: CommandDefinition,
  scope, license, compatibility,
  metadata, allowedTools, mcpConfig,
  lazyContent: LazyContentLoader
}
    │
    ▼
Template injection:
  <skill-instruction>
  Base directory for this skill: {resolvedPath}/
  File references (@path) in this skill are relative to this directory.
  {body}
  </skill-instruction>
  <user-request>
  $ARGUMENTS
  </user-request>
```

### 2.6 Skill Execution Flow

```
User invokes skill (via task load_skills=[...])
    │
    ▼
skill-content.ts → resolveSkillContentAsync()
    │
    ├─→ getAllSkills() merges builtin + discovered
    ├─→ extractSkillTemplate() reads body
    ├─→ Special handling: git-master gets config injection
    │
    ▼
Template injected into subagent system prompt
    │
    ▼
delegate-task executes with skill context
```

### 2.7 Skill MCP Manager

`src/features/skill-mcp-manager/manager.ts` (19KB) handles:
- **Lazy client creation**: MCP clients created on first tool call
- **Transport support**: stdio, HTTP (SSE/Streamable)
- **Lifecycle**: 5-minute idle cleanup
- **Per-session management**: Clients tracked by session ID

---

## 3. Synkra AIOS Skill Architecture

### 3.1 Conceptual Model

AIOS does NOT use a unified "skill" concept. Instead, it has **four distinct content types** that together form what the migration plan calls "176+ skills":

| Content Type | Location | Count | Format |
|-------------|----------|-------|--------|
| **Tasks** | `.aios-core/development/tasks/` | 200 | Markdown with YAML frontmatter |
| **Agent Commands** | `.claude/commands/AIOS/agents/` | 12 | Markdown with embedded YAML blocks |
| **Skills** | `.claude/skills/` | 8 (3 dirs + 5 flat) | SKILL.md (Claude Code compatible) |
| **Templates** | `.claude/templates/` + `.aios-core/product/templates/` | ~146 | YAML/Markdown/SQL/HBS |

### 3.2 AIOS Tasks (The Core "Skills")

The **200 task files** in `.aios-core/development/tasks/` are the primary skill equivalent. They are structured markdown workflows that agents reference via `*command` syntax.

**Task categories (200 tasks):**

| Category | Count | Examples |
|----------|-------|---------|
| **Build & Dev** | 12 | `build-autonomous`, `build-component`, `compose-molecule`, `build-resume` |
| **Story & Planning** | 20 | `create-next-story`, `sm-create-next-story`, `plan-create-context`, `plan-execute-subtask` |
| **Analysis & Research** | 12 | `spec-assess-complexity`, `spec-critique`, `spec-research-dependencies`, `learn-patterns` |
| **Database** | 20 | `db-bootstrap`, `db-schema-audit`, `db-rls-audit`, `db-migration`, `db-supabase-setup` |
| **Testing & QA** | 22 | `qa-review-story`, `qa-generate-tests`, `qa-security-checklist`, `qa-trace-requirements` |
| **DevOps & CI/CD** | 8 | `ci-cd-configuration`, `github-devops-*`, `setup-github`, `release-management` |
| **Design System** | 8 | `setup-design-system`, `run-design-system-pipeline`, `extract-tokens`, `tailwind-upgrade` |
| **Squad & Agent** | 12 | `squad-creator-*`, `create-agent`, `modify-agent`, `validate-agents` |
| **Documentation** | 10 | `document-project`, `generate-documentation`, `sync-documentation`, `index-docs` |
| **Product** | 15 | `po-*`, `shard-doc`, `create-doc`, `execute-epic-plan` |
| **UX** | 4 | `ux-create-wireframe`, `ux-ds-scan-artifact`, `ux-user-research` |
| **Dev Workflow** | 15 | `dev-develop-story`, `dev-improve-code-quality`, `dev-optimize-performance` |
| **Infrastructure** | 10 | `environment-bootstrap`, `setup-mcp-docker`, `setup-llm-routing` |
| **Utilities** | 32 | `cleanup-utilities`, `undo-last`, `correct-course`, `session-resume`, `yolo-toggle` |

### 3.3 AIOS Agent Command Structure

Each agent (e.g., `/dev`, `/architect`) is defined as a **YAML-embedded markdown file** with:

```yaml
agent:
  name: Dex
  id: dev
  title: Full Stack Developer
  icon: 💻
  whenToUse: 'Use for code implementation...'

persona_profile:
  archetype: Builder
  communication:
    tone: pragmatic
    greeting_levels:
      minimal: '💻 dev Agent ready'
      named: "💻 Dex (Builder) ready. Let's build something great!"

commands:
  - name: help
    visibility: [full, quick, key]
    description: 'Show all available commands'
  - name: develop
    visibility: [full, quick]
    description: 'Implement story tasks'
  # ... more *commands

dependencies:
  tasks:
    - develop-story → .aios-core/development/tasks/dev-develop-story.md
    - improve-code-quality → .aios-core/development/tasks/dev-improve-code-quality.md
  templates:
    - story-tmpl → .aios-core/development/templates/story-tmpl.yaml
  scripts:
    - unified-activation-pipeline.js
```

### 3.4 AIOS Proper Skills (`.claude/skills/`)

Only **8 true skills** exist in the Claude Code skills format:

**Directory-based (with SKILL.md):**
1. **`architect-first/`** — Architecture-first development philosophy with validation scripts
   - Includes: `scripts/architecture_validator.py`, `scripts/check_coupling.py`, `references/`, `assets/`
2. **`mcp-builder/`** — MCP server creation guide
   - Includes: `reference/mcp_best_practices.md`, `scripts/evaluation.py`
3. **`skill-creator/`** — Meta-skill for creating new skills
   - Includes: `scripts/init_skill.py`, `scripts/package_skill.py`

**Flat markdown files:**
4. **`clone-mind.md`** (17KB) — Mind cloning workflow
5. **`enhance-workflow.md`** (14KB) — Workflow enhancement
6. **`ralph.md`** (7.5KB) — Ralph agent skill
7. **`squad.md`** (7.7KB) — Squad management
8. **`course-generation-workflow.md`** (1.7KB) — Course generation

### 3.5 AIOS Template System

**146 templates** across two locations:

**`.claude/templates/`** (18 files):
- `architecture-tmpl.yaml`, `prd-tmpl.yaml`, `story-tmpl.yaml`, `qa-gate-tmpl.yaml`
- `brownfield-*` variants for existing projects
- `database-schema-request-*.md`, `front-end-*.yaml`

**`.aios-core/product/templates/`** (~128 files):
- YAML templates for all product artifacts
- SQL templates for database operations
- HBS (Handlebars) templates for rendering
- CSS/JS templates for design tokens

---

## 4. Structural Comparison

### 4.1 Architecture Paradigm

| Aspect | AIOS | OMOC |
|--------|------|------|
| **Philosophy** | Agent-centric (tasks are agent dependencies) | Skill-centric (skills are standalone, injectable) |
| **Invocation** | `*command-name` star patterns inside agent session | `task(load_skills=['name'])` in delegation |
| **Discovery** | Static: agent YAML lists its dependencies | Dynamic: directory scan at runtime |
| **Scope** | Per-agent (each agent has own task list) | Global (any agent can use any skill) |
| **MCP** | External setup (Docker, manual config) | Inline (skill carries its MCP config) |
| **Content coupling** | High (tasks reference `.aios-core/` paths) | Low (skills are self-contained) |
| **Portability** | Low (requires full `.aios-core/` tree) | High (single SKILL.md or directory) |

### 4.2 Skill Format Comparison

**AIOS Task Format:**
```markdown
# Task Name

## Metadata
- Agent: @dev
- Priority: high
- Dependencies: [other-task-1, template-x]

## Preconditions
- Story must be in BUILD phase
- Architecture document must exist

## Workflow
1. Load required context
2. Execute steps
3. Produce artifacts

## Postconditions
- Artifacts created
- Story updated

## Error Handling
- Escalation path
```

**OMOC SKILL.md Format:**
```markdown
---
name: skill-name
description: Brief description
model: anthropic/claude-sonnet-4-5
agent: dev
allowed-tools: [Read, Write, Bash]
mcp:
  server-name:
    command: npx
    args: ["package"]
---

# Skill Content

Prompt instructions injected into agent context...
```

### 4.3 Key Differences

1. **AIOS tasks are imperative workflows** — step-by-step execution instructions with preconditions and postconditions
2. **OMOC skills are declarative context** — knowledge/expertise injected into an agent's system prompt
3. **AIOS tasks reference external resources** — scripts, templates, other tasks via file paths
4. **OMOC skills are self-contained** — all content in the SKILL.md body (or inlined in TypeScript)
5. **AIOS has deep story integration** — tasks are tied to story lifecycle phases
6. **OMOC is story-agnostic** — skills work independent of any workflow methodology

---

## 5. Bugs and Issues Found

### 5.1 OMOC Skill System Bugs

#### BUG-001: Dual Definition Divergence
**Severity:** Medium
**Location:** `src/features/builtin-skills/skills/*.ts` vs `src/features/builtin-skills/*/SKILL.md`

Built-in skills exist in **two forms**: TypeScript objects AND SKILL.md files. The TypeScript versions are used at runtime while SKILL.md files are only used when discovered from disk. If the TypeScript template and SKILL.md content diverge, different skill content will be injected depending on how the skill is loaded.

**Evidence:** The `playwright.ts` template is a minimal 2-line description, while there's also an `agent-browser/SKILL.md` (337 lines) with comprehensive documentation. A user discovering skills from `.opencode/skills/` would get the rich SKILL.md version, while the builtin path gets the minimal TypeScript template.

**Fix:** Either remove SKILL.md files for builtins (since TypeScript is authoritative) or generate TypeScript templates from SKILL.md files at build time.

#### BUG-002: resolveSkillContent() Only Searches Builtins
**Severity:** High
**Location:** `src/features/opencode-skill-loader/skill-content.ts:158-171`

The synchronous `resolveSkillContent()` function only searches `createBuiltinSkills()` — it will never find user-defined or project skills. Only `resolveSkillContentAsync()` searches all discovered skills. Any code path using the sync version silently fails for non-builtin skills.

#### BUG-003: resolveMultipleSkills() Same Issue
**Severity:** High
**Location:** `src/features/opencode-skill-loader/skill-content.ts:173-200`

Same problem as BUG-002: `resolveMultipleSkills()` (sync) only searches builtins. Its async counterpart `resolveMultipleSkillsAsync()` correctly searches all skills.

#### BUG-004: Cache Key Doesn't Include disabledSkills
**Severity:** Low
**Location:** `src/features/opencode-skill-loader/skill-content.ts:21-28`

The `getAllSkills()` cache uses only `browserProvider` as cache key. If `disabledSkills` changes between calls (without changing provider), the cache is correctly bypassed. However, the comment says "Skip cache if disabledSkills is provided" but it actually skips only when `size > 0`, meaning an empty Set would still hit cache. This is correct behavior but the comment is misleading.

#### BUG-005: loadMcpJsonFromDir Uses Unresolved Path for Non-Directory Skills
**Severity:** Low
**Location:** `src/features/opencode-skill-loader/loader.ts:76`

For flat markdown files (not in a directory), `loadMcpJsonFromDir(skillsDir)` is called with the parent `skillsDir`, not the skill's own directory. This means a flat `my-skill.md` file would look for `mcp.json` in the parent skills directory, potentially loading wrong MCP config.

### 5.2 AIOS Skill System Issues

#### AIOS-001: Path Coupling to `.aios-core/` Structure
**Severity:** High (for migration)

All AIOS agent definitions contain hardcoded paths like:
```yaml
dependencies:
  tasks:
    - develop-story → .aios-core/development/tasks/dev-develop-story.md
```

This creates tight coupling to the `.aios-core/` directory structure that doesn't exist in OMOC/Kord AIOS.

#### AIOS-002: No Standard Frontmatter in Tasks
**Severity:** Medium (for migration)

AIOS tasks don't consistently use YAML frontmatter. They use plain markdown headers like `## Metadata`, `## Workflow`, etc. This means they cannot be directly loaded by OMOC's `parseFrontmatter()` system without adaptation.

#### AIOS-003: Star Command Resolution is Agent-Local
**Severity:** Medium

`*command` patterns are resolved within an agent's session context, not globally. A user typing `*qa-review-story` must be in a QA agent session. There's no cross-agent skill invocation mechanism.

#### AIOS-004: Installer is Legacy
**Severity:** Low

`bin/aios-init.js` has a deprecation notice — it's legacy and will be removed in v4.0.0. The new installer is in `packages/installer/`. This creates confusion about the canonical installation path.

#### AIOS-005: Template Duplication
**Severity:** Low

Templates exist in both `.claude/templates/` AND `.aios-core/product/templates/` with overlapping content (e.g., `story-tmpl.yaml` exists in both). No clear merge strategy.

#### AIOS-006: skill-creator References Non-Portable Paths
**Severity:** Medium

The `skill-creator` skill references `scripts/init_skill.py` and `scripts/package_skill.py` which are Python scripts. These require Python runtime and have no fallback for environments without Python.

---

## 6. Pattern Analysis

### 6.1 AIOS Strengths

1. **Rich task library** — 200 well-structured workflow tasks covering every development phase
2. **Story-driven methodology** — Tasks are organized around story lifecycle (Spec → Plan → Build → QA → Complete)
3. **Agent specialization** — Each agent has a curated set of tasks matching their expertise
4. **Template ecosystem** — 146 templates for artifacts (PRDs, architecture docs, stories, SQL, etc.)
5. **Validation scripts** — Python scripts for architecture validation, coupling checks, etc.
6. **Squad system** — Reusable team compositions (mmos-squad, mmosMapper, Ralph)

### 6.2 AIOS Weaknesses

1. **No MCP integration** — Skills don't carry MCP config; browser/tool automation requires external setup
2. **Path coupling** — All references are hardcoded to `.aios-core/` directory structure
3. **No discovery system** — Tasks are statically listed in agent definitions, not dynamically discovered
4. **Heavy weight** — 983 files in `.aios-core/` is a lot for per-project installation
5. **No skill-level metadata** — Tasks lack structured frontmatter for model preference, allowed tools, etc.
6. **IDE-specific** — Agent commands use Claude Code `/command` syntax, not portable to other runners

### 6.3 OMOC Strengths

1. **Clean skill model** — `BuiltinSkill` interface is well-designed with all needed metadata
2. **Dynamic discovery** — Hierarchical scan with priority-based deduplication
3. **MCP integration** — Skills can carry their own MCP server definitions
4. **Self-contained** — Each skill is portable (single file or directory)
5. **Category + Skill combos** — Powerful composition system (category defines model/temp, skill defines knowledge)
6. **Tested** — Comprehensive test suite for skill loading and content resolution

### 6.4 OMOC Weaknesses

1. **Only 5 built-in skills** — Very limited library compared to AIOS's 200+ tasks
2. **No workflow structure** — Skills are just prompt injection, no preconditions/postconditions
3. **No story integration** — Skills don't understand development lifecycle phases
4. **No template system** — No artifact generation templates (PRDs, architecture docs, etc.)
5. **No validation** — No scripts bundled with skills for automated checks

---

## 7. Most Important AIOS Skills for Migration

### Tier 1: Essential (Must Migrate)

| Task | Size | Reason |
|------|------|--------|
| `dev-develop-story.md` | 26KB | Core development workflow |
| `create-next-story.md` | 29KB | Story creation — central to methodology |
| `qa-review-story.md` | 23KB | Quality assurance review |
| `qa-generate-tests.md` | 37KB | Test generation |
| `build-autonomous.md` | 5.6KB | Autonomous build execution |
| `plan-create-context.md` | 20KB | Planning context creation |
| `plan-execute-subtask.md` | 21KB | Subtask execution |
| `db-schema-audit.md` | 25KB | Database schema auditing |
| `ci-cd-configuration.md` | 20KB | CI/CD pipeline setup |
| `environment-bootstrap.md` | 45KB | Full environment setup |

### Tier 2: High Value (Should Migrate)

| Task | Size | Reason |
|------|------|--------|
| `qa-review-build.md` | 30KB | Build quality review |
| `dev-improve-code-quality.md` | 24KB | Code quality improvement |
| `dev-optimize-performance.md` | 29KB | Performance optimization |
| `create-agent.md` | 31KB | Agent creation meta-skill |
| `setup-github.md` | 31KB | GitHub repository setup |
| `collaborative-edit.md` | 32KB | Multi-agent editing |
| `spec-assess-complexity.md` | 10KB | Complexity assessment |
| `security-audit.md` | 13KB | Security auditing |
| `release-management.md` | 18KB | Release workflow |
| `pr-automation.md` | 19KB | PR automation |

### Tier 3: Nice to Have (Migrate Incrementally)

All remaining 180 tasks — they add depth but aren't blockers.

---

## 8. Skill Template Comparison

### 8.1 AIOS skill-creator Template

The AIOS `skill-creator` defines the canonical skill structure:

```
skill-name/
├── SKILL.md          # Main skill file with YAML frontmatter
├── scripts/          # Reusable automation scripts
│   └── helper.py
├── references/       # Domain documentation
│   └── schema.md
├── assets/           # Templates, boilerplate
│   └── template/
└── LICENSE.txt       # Optional license
```

**SKILL.md format (AIOS-native):**
```markdown
---
name: skill-name
description: What this skill does
---

# Skill Title

## Overview
Purpose and when to use.

## Workflow
Step-by-step instructions.
```

### 8.2 OMOC Skill Template

```
skill-name/
├── SKILL.md          # Main skill file with YAML frontmatter
├── mcp.json          # Optional MCP server definitions
└── references/       # Optional reference materials
```

**SKILL.md format (OMOC-native):**
```markdown
---
name: skill-name
description: Brief description
model: provider/model-name
agent: agent-id
subtask: true
argument-hint: "What to do"
allowed-tools:
  - Read
  - Write
mcp:
  server:
    command: npx
    args: ["package"]
---

# Prompt Content

Instructions injected into agent...
```

### 8.3 Key Differences

| Feature | AIOS skill-creator | OMOC SKILL.md |
|---------|-------------------|---------------|
| `model` field | Not standard | Supported |
| `agent` field | Not standard | Supported |
| `subtask` field | Not standard | Supported |
| `allowed-tools` | Not standard | Supported |
| `mcp` config | Not supported | Supported (frontmatter or mcp.json) |
| `scripts/` dir | Supported (Python) | Not supported by loader |
| `references/` dir | Supported | Referenced but not loaded |
| `assets/` dir | Supported | Not supported |
| `argument-hint` | Not standard | Supported |
| Validation | `init_skill.py` + `package_skill.py` | None |

---

## 9. Recommendations for Kord AIOS

See the dedicated document: `docs/researches/kord-os-skill-adaptation-plan.md`

### Quick Summary

1. **Preserve OMOC skill loader** — It's well-designed and tested
2. **Convert AIOS tasks to SKILL.md format** — Add frontmatter, restructure as self-contained skills
3. **Add OMOC-missing metadata to AIOS skills** — model, agent, allowed-tools, mcp
4. **Create a skill migration script** — Automated AIOS task → OMOC SKILL.md converter
5. **Implement skill categories** — Map AIOS task categories to skill grouping
6. **Bundle essential skills** — Tier 1 tasks should be built-in or auto-installed

---

## 10. References

| Document | Path |
|----------|------|
| OMOC Skill Types | `src/features/builtin-skills/types.ts` |
| OMOC Skill Loader | `src/features/opencode-skill-loader/loader.ts` |
| OMOC Skill Content | `src/features/opencode-skill-loader/skill-content.ts` |
| OMOC Skill Tests | `src/features/builtin-skills/skills.test.ts` |
| OMOC Skill MCP Manager | `src/features/skill-mcp-manager/manager.ts` |
| OMOC Config Schema | `src/config/schema.ts` (SkillDefinitionSchema) |
| AIOS Tasks Directory | `D:\dev\synkra-aios\.aios-core\development\tasks\` |
| AIOS Agent Commands | `D:\dev\synkra-aios\.claude\commands\AIOS\agents\` |
| AIOS Skills | `D:\dev\synkra-aios\.claude\skills\` |
| AIOS Templates | `D:\dev\synkra-aios\.claude\templates\` |
| AIOS Core Architecture | `D:\dev\synkra-aios\docs\core-architecture.md` |
| AIOS skill-creator | `D:\dev\synkra-aios\.claude\skills\skill-creator\SKILL.md` |
| Migration Plan | `docs/archive/migration/kord-aios-migration-plan.md` |
| Architecture Doc | `docs/architecture/kord-aios-architecture.md` |
