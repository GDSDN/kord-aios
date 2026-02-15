> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Kord AIOS Skill Adaptation Plan

**Date:** 2026-02-09 (updated 2026-02-10 — refined per-skill analysis)
**Status:** Research Complete (Catalog Refined v2)
**Dependencies:** `skill-system-deep-analysis.md`, `aios-skill-catalog.md`
**Architecture Reference:** `kord-architecture-v5.md`

---

## 1. Executive Decision

### Verdict: Preserve OMOC Skill Loader + Convert AIOS Tasks

The OMOC skill system (loader, types, MCP manager) is **well-designed, tested, and should be preserved as-is**. **151 of 200 AIOS tasks** (138 KEEP + 13 ADAPT) should be converted to SKILL.md. The remaining 49 are either **already handled by the engine** (17 tasks) or **not worth migrating** (32 tasks).

**Rationale:**
- OMOC loader already handles 6 discovery directories with priority-based deduplication
- OMOC supports MCP config, model/agent hints, allowed-tools — features AIOS tasks lack
- OMOC has comprehensive test suite (144-line test file + 3 more test files)
- **17 AIOS tasks are ENGINE-redundant** — build hook, boulder-state, start-work hook, plan agent, and delegate-task system already implement autonomous loops, plan execution, verification, status tracking, and session management
- **32 AIOS tasks are SKIP** — AIOS-internal (19), vendor-specific (7), duplicates (2), stubs (3), niche (1)
- **13 ADAPT tasks** need engine-overlap stripping (modes, loops, verification, AIOS formats) while preserving unique methodology — includes 5 squad-creator tasks with agent group management value
- Converting 151 tasks to SKILL.md is tractable with a conversion script
- Per `kord-architecture-v5.md`: AIOS skills are **plugin built-in** in `src/features/builtin-skills/skills/aios/`

> **v2 refinement note:** Initial analysis (v1) SKIP'd 90 tasks. Deep per-skill reading revealed many 5-30KB tasks with real methodology value. Strict SKIP criteria now applied: only AIOS-internal framework files, vendor-specific (ClickUp/Synkra), true stubs (<1KB), and exact duplicates.

---

## 2. Architecture Decision

### 2.1 Skill Delivery Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    KORD OS SKILL LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: OMOC Built-in Skills (TypeScript, plugin-embedded)     │
│     → playwright, agent-browser, frontend-ui-ux, git-master,    │
│       dev-browser                                                │
│     → Loaded from: src/features/builtin-skills/                  │
│     → STATUS: Keep unchanged                                     │
│                                                                  │
│  Layer 2: AIOS Methodology Skills (SKILL.md, plugin built-in)   │
│     → 151 AIOS tasks converted to SKILL.md (138 KEEP + 13 ADAPT)│
│     → Shipped inside plugin: src/features/builtin-skills/aios/  │
│     → Organized by domain pack (database, qa, devops, etc.)     │
│     → STATUS: New — convert from AIOS (Wave 3)                   │
│                                                                  │
│  NOT Layer 2: ENGINE tasks (17 tasks)                            │
│     → build-autonomous, build-resume, execute-checklist,         │
│       plan-create-context, plan-execute-subtask, etc.            │
│     → ALREADY HANDLED by build hook, boulder-state, plan agent   │
│     → STATUS: DO NOT migrate as skills                           │
│                                                                  │
│  Layer 3: User/Project Skills (custom)                           │
│     → User-created SKILL.md files                                │
│     → .opencode/skills/ or ~/.opencode/skills/                   │
│     → STATUS: Already supported by OMOC loader                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why no expansion packs?** Per v5, AIOS skills are **plugin built-in**, not per-project installs. This simplifies distribution — all 151 skills ship with the plugin and are always available. Users can add their own skills to `.opencode/skills/` (Layer 3).

### 2.2 Directory Structure (Plugin Source)

```
src/features/builtin-skills/
├── skills/
│   ├── git-master/             # Existing OMOC built-in
│   │   └── SKILL.md
│   ├── frontend-ui-ux/         # Existing OMOC built-in
│   │   └── SKILL.md
│   ├── aios/                   # NEW: AIOS methodology skills
│   │   ├── story/
│   │   │   ├── create-next-story/
│   │   │   │   └── SKILL.md
│   │   │   ├── create-brownfield-story/
│   │   │   │   └── SKILL.md
│   │   │   └── develop-story/
│   │   │       └── SKILL.md   # ADAPTED: modes/loops stripped
│   │   ├── qa/
│   │   │   ├── qa-review-story/
│   │   │   │   └── SKILL.md
│   │   │   ├── qa-generate-tests/
│   │   │   │   └── SKILL.md
│   │   │   └── ...
│   │   ├── database/
│   │   │   ├── db-schema-audit/
│   │   │   │   └── SKILL.md
│   │   │   └── ... (19 skills)
│   │   ├── devops/
│   │   │   ├── ci-cd-configuration/
│   │   │   │   └── SKILL.md
│   │   │   └── ... (8 skills)
│   │   ├── design-system/
│   │   │   └── ... (18 skills)
│   │   ├── architecture/
│   │   │   └── ... (10 skills)
│   │   ├── product/
│   │   │   └── ... (docs, po, pm — 16 skills)
│   │   ├── squad/
│   │   │   └── ... (7 skills — 5 ADAPT + 2 KEEP)
│   │   ├── worktrees/
│   │   │   └── ... (3 skills)
│   │   ├── mcp/
│   │   │   └── ... (3 skills)
│   │   └── utilities/
│   │       └── ... (21 skills)
│   └── skills.ts               # createBuiltinSkills() — registers all
```

---

## 3. AIOS Task → SKILL.md Conversion Strategy

### 3.1 Conversion Rules

Each AIOS task file needs the following transformations:

| AIOS Element | OMOC SKILL.md Mapping | Notes |
|-------------|----------------------|-------|
| Task filename | `name` frontmatter field | Strip agent prefix (e.g., `dev-develop-story` → `develop-story`) |
| First `#` heading | Skill body title | Keep as-is |
| `## Metadata` section | YAML frontmatter | Parse and restructure |
| Agent reference (`@dev`) | `agent` frontmatter field | Map to Kord AIOS canonical names |
| `## Workflow` section | Skill body | Keep as prompt content |
| `## Preconditions` | Skill body (instructions) | Convert to prompt instructions |
| `## Postconditions` | Skill body (verification) | Convert to completion criteria |
| `.aios-core/` path references | Relative `@path` references | Rewrite to skill-local paths |
| `*command` references | Skill cross-references | Convert to `load_skills` suggestions |

### 3.2 Template for Converted Skills

```markdown
---
name: develop-story
description: "Core story implementation workflow. Execute story tasks sequentially with testing and verification."
agent: dev
model: anthropic/claude-sonnet-4-5
subtask: false
argument-hint: "Story file path or story description"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Develop Story

[Converted content from dev-develop-story.md]

## Workflow

[Steps from original AIOS task, with paths rewritten]

## Completion Criteria

[Converted from original Postconditions]
```

### 3.3 Agent Name Mapping (per kord-architecture-v5)

| AIOS Agent | Kord AIOS Canonical | OMOC Legacy (renamed in Wave 0) |
|-----------|-------------------|----------------------------------|
| `@dev` | `dev` | hephaestus → `dev` |
| `@dev` (junior) | `dev-junior` | sisyphus-junior → `dev-junior` |
| `@architect` | `architect` | oracle → `architect` |
| `@qa` | `qa` | momus → `qa` |
| `@pm` | `pm` | — (new agent) |
| `@po` | `po` | — (new agent) |
| `@sm` | `sm` | — (new agent) |
| `@analyst` | `analyst` | metis → `analyst` |
| `@data-engineer` | `data-engineer` | — (new agent) |
| `@devops` | `devops` | — (new agent) |
| `@ux-design-expert` | `ux-design-expert` | — (new agent) |
| `@kord` / `@aios-master` | `kord` | sisyphus → `kord` |
| `@build` / `@build-loop` | `build` | atlas → `build` |
| `@plan` | `plan` | prometheus → `plan` |
| `@librarian` | `librarian` | librarian (kept) |
| `@explore` | `explore` | explore (kept) |
| `@vision` | `vision` | multimodal-looker → `vision` |
| `@squad-creator` | `squad-creator` | — (new agent) |

### 3.4 Conversion Script Design

A conversion script (`script/convert-aios-skills.ts`) should:

1. **Read** all `.md` files from a source AIOS tasks directory
2. **Parse** the markdown structure (headings, sections)
3. **Generate** YAML frontmatter from parsed metadata
4. **Rewrite** `.aios-core/` path references to relative paths
5. **Map** agent names to Kord AIOS canonical names
6. **Strip** AIOS-specific sections (activation instructions, IDE-FILE-RESOLUTION)
7. **Output** SKILL.md files in the target directory structure

```typescript
// Pseudocode for convert-aios-skills.ts
interface ConversionConfig {
  sourceDir: string       // D:\dev\synkra-aios\.aios-core\development\tasks\
  targetDir: string       // .opencode/skills/ or dist/skills/
  agentMap: Record<string, string>
  tierFilter?: 1 | 2 | 3
}

function convertTask(taskPath: string, config: ConversionConfig): ConvertedSkill {
  const content = readFileSync(taskPath, 'utf-8')
  const sections = parseMarkdownSections(content)
  
  const frontmatter = {
    name: deriveSkillName(taskPath),
    description: extractDescription(sections),
    agent: mapAgent(sections.metadata?.agent, config.agentMap),
    'argument-hint': extractArgumentHint(sections),
  }
  
  const body = rewritePaths(sections.workflow + sections.postconditions)
  
  return { frontmatter, body }
}
```

---

## 4. Expansion Pack Design

### 4.1 Pack Definition

Each expansion pack is a directory containing skills and optional resources:

```
packs/                          # Logical grouping (all ship built-in)
├── database/                   # 20 skills — db-schema-audit, db-bootstrap, etc.
├── qa/                         # 20 skills — qa-generate-tests, qa-review-story, etc.
├── design-system/              # 18 skills — setup-design-system, extract-tokens, etc.
├── devops/                     # 8 skills — ci-cd-configuration, setup-github, etc.
├── story/                      # 9 skills — create-next-story, create-brownfield-story, etc.
├── dev-workflow/               # 8 skills — dev-optimize-performance, dev-improve-code-quality, etc.
├── architecture/               # 10 skills — learn-patterns, spec-critique, analyze-framework, etc.
├── documentation/              # 10 skills — document-project, sync-documentation, etc.
├── product/                    # 6 skills — po-manage-story-backlog, po-close-story, etc.
├── squad/                      # 7 skills — squad-creator-design, create-agent (ADAPT), etc.
├── mcp/                        # 3 skills — add-mcp, mcp-workflow, search-mcp
├── worktrees/                  # 3 skills — create-worktree, list-worktrees, remove-worktree
└── utilities/                  # 21 skills — collaborative-edit, security-scan, etc.
```

### 4.2 Pack Metadata (`pack.yaml`)

```yaml
name: database
version: 1.0.0
description: "Database management skills — schema audit, migrations, RLS, Supabase setup"
author: Synkra AIOS
skills_count: 20
requires_agents:
  - data-engineer
compatible_with: ">=1.0.0"
```

### 4.3 Pack Installation Flow

```
kord install-pack database
    │
    ├─→ Download/copy pack directory
    ├─→ Copy skills to .opencode/skills/database/
    ├─→ Verify SKILL.md format (parseFrontmatter)
    ├─→ Check agent availability (data-engineer exists?)
    └─→ Report installed skills count
```

The pack's skills are automatically discovered by the OMOC `loadSkillsFromDir()` because it recurses up to `maxDepth=2`. Skills installed at `.opencode/skills/database/db-schema-audit/SKILL.md` would be discovered as `database/db-schema-audit`.

---

## 5. Bugs to Fix During Adaptation

### 5.1 Critical Fixes (Pre-migration)

| Bug | Fix | Effort |
|-----|-----|--------|
| **BUG-002**: `resolveSkillContent()` only searches builtins | Make it call `getAllSkills()` or deprecate sync version | 1 hour |
| **BUG-003**: `resolveMultipleSkills()` same issue | Same fix as BUG-002 | 30 min |
| **BUG-005**: `loadMcpJsonFromDir` wrong path for flat skills | Pass `dirname(skillPath)` instead of `skillsDir` | 30 min |

### 5.2 Improvements (During migration)

| Improvement | Description | Effort |
|-------------|-------------|--------|
| Skill validation | Add `validateSkillFormat()` to catch malformed SKILL.md | 2 hours |
| Skill indexing | Cache skill metadata in `.opencode/.skill-index.json` for fast lookup | 4 hours |
| Skill search | Add fuzzy search by description/name for `*command` resolution | 2 hours |
| Pack system | Implement `kord install-pack` CLI command | 1 day |

---

## 6. What NOT to Migrate

### 6.1 Skip List

| AIOS Asset | Reason to Skip |
|-----------|----------------|
| `.aios-core/development/scripts/unified-activation-pipeline.js` | AIOS-specific agent activation; OMOC uses dynamic-agent-prompt-builder |
| `.aios-core/development/scripts/greeting-builder.js` (28KB) | Agent greeting system not needed in OMOC architecture |
| `.aios-core/workflow-intelligence/` (19 files) | Custom workflow engine; OMOC uses hooks for workflow control |
| `.aios-core/monitor/` (10 files) | Dashboard monitoring; OMOC has its own task-toast-manager |
| `po-*-clickup.md` tasks | Vendor-specific (ClickUp) integration |
| `squad-creator-sync-synkra.md` | Synkra-specific registry sync |
| `mmos-squad/` + `mmosMapper/` commands | Mind mapping squads — niche, can be added later as optional pack |
| `.claude/templates/` duplicates | Already in `.aios-core/product/templates/`, skip `.claude/` copies |

### 6.2 Defer List

| AIOS Asset | Reason to Defer |
|-----------|-----------------|
| `.aios-core/infrastructure/` (162 files) | Large infrastructure layer; evaluate need per file |
| `.aios-core/product/templates/` (128 files) | Template ecosystem; migrate only templates referenced by Tier 1 skills |
| `.aios-core/core/` (172 files) | Core AIOS framework; mostly agent definitions already ported |
| AIOS hooks (`.claude/hooks/`) | Python hooks incompatible with OMOC TypeScript hook system |

---

## 7. Implementation Timeline

> **This is Wave 3 of the kord-architecture-v5 implementation plan.**
> Prerequisites: Wave 0 (rename), Wave 1 (agents), Wave 2 (hooks).

### Phase 1: ADAPT Skills (4h)

- [ ] Convert 13 ADAPT tasks, stripping engine-redundant parts:
  - `dev-develop-story.md` → strip modes/loops/verification, keep methodology
  - `execute-epic-plan.md` → strip loop mechanics, keep epic orchestration
  - `correct-course.md` → keep course correction decision trees
  - `qa-review-build.md` → strip basic verification, keep deep 10-phase review
  - `spec-gather-requirements.md` → strip plan interview overlap, keep PM techniques
  - `environment-bootstrap.md` → strip AIOS installer, keep environment detection
  - `story-checkpoint.md` → strip loop mechanics, keep checkpoint methodology
  - `dev-validate-next-story.md` → strip QA overlap, keep dev-specific validation
  - `create-agent.md` → strip AIOS format, keep agent design methodology
  - `squad-creator-create.md` → adapt for Kord AIOS agent group structure
  - `squad-creator-analyze.md` → adapt inventory for Kord AIOS
  - `squad-creator-extend.md` → adapt component addition for Kord AIOS
  - `squad-creator-validate.md` → adapt validation rules for Kord AIOS
- [ ] Verify each adapted skill loads via `discoverSkills()`

### Phase 2: KEEP Skills — Core Domain (4h)

- [ ] Convert top-priority KEEP skills (story, QA, database core):
  - Story: `create-next-story.md`, `create-brownfield-story.md`, `validate-next-story.md`, `sm-create-next-story.md`
  - QA: `qa-review-story.md`, `qa-generate-tests.md`, `qa-review-proposal.md`, `qa-security-checklist.md`
  - DB: `db-schema-audit.md`, `db-bootstrap.md`, `db-supabase-setup.md`
  - DevOps: `ci-cd-configuration.md`, `setup-github.md`, `release-management.md`
- [ ] Organize into `src/features/builtin-skills/skills/aios/` domain dirs
- [ ] Register in `createBuiltinSkills()`
- [ ] Unit tests for skill loading

### Phase 3: KEEP Skills — Remaining Domains (8h)

- [ ] Convert remaining ~120 KEEP skills across all domains
- [ ] Translate Portuguese content to English (per project policy)
- [ ] Rewrite `.aios-core/` path references to relative paths
- [ ] Verify all 151 skills load and parse correctly

### Phase 4: Integration (2h)

- [ ] Performance test with 151 AIOS skills + 5 existing built-in skills
- [ ] Verify skill loading doesn't regress existing tests
- [ ] Test `load_skills` parameter in `task()` delegation with AIOS skills
- [ ] Update user documentation

---

## 8. Metrics for Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| AIOS skills converted | 151 (138 KEEP + 13 ADAPT) | File count in `aios/` |
| Total skills discovered | 156+ (5 existing + 151 AIOS) | `discoverSkills().length` |
| Skill load time | <500ms for all skills | Benchmark timer |
| SKILL.md parse success rate | 100% | Test suite |
| ENGINE tasks NOT migrated | 17 tasks excluded | Audit check |
| SKIP tasks NOT migrated | 32 tasks excluded | Audit check |
| No OMOC regressions | All existing tests pass | `bun test` |

---

## 9. Comparison: Why This Approach is Better

### vs. Rebuilding loader around AIOS patterns

| Factor | Preserve OMOC + Convert | Rebuild Around AIOS |
|--------|------------------------|---------------------|
| Risk | Low (no engine changes) | High (new loader, new format) |
| Test coverage | Existing tests still valid | All tests need rewrite |
| Compatibility | Claude Code skills still work | Would break compatibility |
| MCP support | Already built-in | Would need to add |
| Effort | 4 weeks | 8+ weeks |
| Portability | Skills work in any OpenCode fork | Locked to AIOS format |

### vs. Symlinking `.aios-core/` directory

| Factor | Convert to SKILL.md | Symlink .aios-core |
|--------|--------------------|--------------------|
| Portability | High (self-contained) | Low (needs full tree) |
| Size per project | ~2MB skills only | ~50MB+ full .aios-core |
| Discoverability | Automatic via loader | Needs custom discovery |
| MCP integration | Native | Not supported |
| Maintenance | Independent updates | Tied to AIOS releases |

### vs. Embedding all AIOS tasks as TypeScript builtins

| Factor | Convert to SKILL.md | TypeScript Builtins |
|--------|--------------------|--------------------|
| Customizability | Users can edit SKILL.md | Requires plugin rebuild |
| Bundle size | External files | +2MB in plugin binary |
| Hot reload | Change file, reload | Requires rebuild |
| Expansion | Add SKILL.md file | Add TypeScript + rebuild |
| Separation | Clean content/code split | Mixed concerns |

---

## 10. Open Questions (Resolved)

1. **Should skills be built-in TypeScript or auto-installed SKILL.md?**
   - **RESOLVED (v5):** Plugin built-in in `src/features/builtin-skills/skills/aios/`. Not per-project install.

2. **Should pack installation be CLI-only or also config-based?**
   - **RESOLVED (v5):** No packs. All skills ship with the plugin. Users add custom skills to `.opencode/skills/`.

3. **How to handle AIOS templates referenced by skills?**
   - **RESOLVED:** Bundle essential templates inside `.kord/templates/` (per-project, installed by CLI).

4. **Should `*command` star syntax be preserved?**
   - **RESOLVED (v5):** Star commands deprecated. Skills invoked via `task(load_skills=[...])` or `keyword-detector` hook.

5. **Should converted skills preserve AIOS Portuguese text?**
   - **RESOLVED:** No — translate to English per project's English-only policy.

6. **Which AIOS tasks should NOT be migrated?**
   - **RESOLVED (refined v2):** 17 ENGINE tasks (already handled by hooks/agents) + 32 SKIP tasks (AIOS-internal, vendor-specific, duplicates, stubs). See `aios-skill-catalog.md` Section 5.
