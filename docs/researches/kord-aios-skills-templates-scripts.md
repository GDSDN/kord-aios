> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Kord AIOS — Skills, Templates & Scripts Decision

> **Date**: 2026-02-11
> **Stage**: 5 of 7 — What carries over from AIOS, what stays from OMOC, what's new
> **Inputs**: `kord-os-skill-adaptation-plan.md`, `aios-skill-catalog.md`, AIOS `.aios-core/` structure, OMOC builtin-skills
> **Revision**: Updated 2026-02-11 — AIOS internal templates changed to ADAPT, JS scripts pending deeper audit for token economy

---

## 1. Skills — Three-Layer Model (Confirmed)

The skill adaptation plan already defined the architecture. This stage confirms and refines.

### Layer 1: OMOC Built-in Skills (TypeScript, plugin-embedded)

| Skill | Decision | Rationale |
|-------|----------|-----------|
| `playwright` | **KEEP** | Browser automation — battle-tested |
| `agent-browser` | **KEEP** | Agent browser interaction |
| `frontend-ui-ux` | **KEEP** | Frontend methodology |
| `git-master` | **KEEP** | Git workflow — 1107 lines of methodology |
| `dev-browser` | **KEEP** | Developer browser tools |

**No changes.** These are OMOC engine skills that work with the plugin system.

### Layer 2: AIOS Methodology Skills (SKILL.md, plugin built-in)

Per `kord-os-skill-adaptation-plan.md`: **151 tasks to convert** (138 KEEP + 13 ADAPT).

| Pack | Count | Key Skills | Agent |
|------|-------|-----------|-------|
| `story/` | 9 | create-next-story, create-brownfield-story, develop-story, validate-story, close-story | @sm, @dev, @po |
| `qa/` | 20 | qa-review-story, qa-generate-tests, run-tests, security-scan | @qa |
| `database/` | 20 | db-schema-audit, db-bootstrap, create-migration, rls-policies | @data-engineer |
| `devops/` | 8 | ci-cd-configuration, setup-github, github-pr-automation | @devops |
| `design-system/` | 18 | setup-design-system, extract-tokens, component-library | @ux-design-expert |
| `architecture/` | 10 | learn-patterns, spec-critique, analyze-framework | @architect |
| `documentation/` | 10 | document-project, sync-documentation | @pm, @sm |
| `product/` | 6 | po-manage-story-backlog, po-close-story, create-prd | @po, @pm |
| `dev-workflow/` | 8 | optimize-performance, improve-code-quality, collaborative-edit | @dev |
| `squad/` | 7 | squad-creator-design, create-agent | @squad-creator |
| `worktrees/` | 3 | create-worktree, list-worktrees, remove-worktree | @devops |
| `mcp/` | 3 | add-mcp, mcp-workflow, search-mcp | @kord |
| `utilities/` | 21 | security-scan, dependency-audit, refactoring-suggest | Various |

**Conversion status**: Plan defined, conversion script spec written. Execution is Wave 3 of v5 plan.

**What changes from the skill plan**: Nothing. The plan is sound. The orchestration model (Stage 3) confirms that skills are loaded into agents via `load_skills` parameter in task() delegation — exactly as the plan specified.

### Layer 3: User/Project Skills

Users create their own skills in `.opencode/skills/` or `~/.opencode/skills/`. Already supported by OMOC loader. No changes.

---

## 2. Templates — What Carries Over from AIOS

AIOS has 70+ templates in `.aios-core/product/templates/`. These fall into categories:

### 2.1 Templates That CARRY OVER (installed to `.kord/templates/`)

| Template | AIOS Source | Kord Location | Used By |
|----------|------------|---------------|---------|
| `story-tmpl.yaml` | product/templates/ | `.kord/templates/story.md` | @sm (story creation) |
| `epic.hbs` | product/templates/ | `.kord/templates/epic.md` | @pm (epic creation) |
| `prd-tmpl.yaml` | product/templates/ | `.kord/templates/prd.md` | @pm (PRD creation) |
| `adr.hbs` | product/templates/ | `.kord/templates/adr.md` | @architect (decisions) |
| `task.hbs` | product/templates/ | `.kord/templates/task.md` | @plan (task creation) |
| `qa-report-tmpl.md` | product/templates/ | `.kord/templates/qa-report.md` | @qa (reports) |
| `changelog-template.md` | product/templates/ | `.kord/templates/changelog.md` | @devops (releases) |

**Conversion needed**: AIOS templates use YAML structure + Handlebars. Kord templates should be **plain Markdown with placeholder variables** (`{{variable}}`). This is simpler and matches how agents generate content — they read the template, fill in sections.

**Why not keep Handlebars?** AIOS uses a template engine (`template-engine.js`, 7KB) to render Handlebars. Kord agents generate content directly from prompts — they don't need a JS rendering engine. The template serves as a **structural guide**, not a rendering source.

### 2.2 Templates That DON'T Carry Over

| Template Category | Count | Decision | Rationale |
|------------------|-------|----------|-----------|
| SQL templates (`tmpl-*.sql`) | 12 | **EMBED IN SKILLS** | Data-engineer skills include SQL patterns inline |
| Architecture templates (28KB+) | 4 | **EMBED IN SKILLS** | Architecture skills include structure guidance inline |
| Design system templates | 5 | **EMBED IN SKILLS** | Design skills include patterns inline |
| IDE-specific templates | 3 | **SKIP** | Kord is OpenCode-native, no IDE config templates |
| AIOS-internal templates | 8 | **ADAPT** | Framework evolution templates (skill creation, agent prompts, etc.) — needed for creating/evolving Kord AIOS itself |
| GitHub Actions templates | 2 | **EMBED IN SKILLS** | DevOps skills include CI/CD patterns |
| Front-end spec templates | 3 | **EMBED IN SKILLS** | UX skills include spec patterns |
| Migration templates | 3 | **EMBED IN SKILLS** | Data-engineer skills include migration patterns |

**Design principle**: Templates that are used by a single agent/skill are EMBEDDED in the skill content rather than being separate files. This reduces file count and ensures the agent always has the template in context.

Templates that are SHARED across agents (story, epic, PRD, ADR, task) remain as separate files in `.kord/templates/`.

### 2.3 Template Installation

Templates are installed by the Kord CLI installer:
```
kord install → creates .kord/templates/ with shared templates
```

Templates are also available as OMOC built-in (shipped in plugin) for agents that need them during planning. The @plan agent and @sm agent reference these templates in their system prompts.

---

## 3. Scripts — What Carries Over from AIOS

AIOS has 57 JS scripts in `.aios-core/development/scripts/`. These are **standalone Node.js programs** that agents execute via bash (`node .aios-core/scripts/xyz.js`). They do heavy computation (AST parsing, regex scanning, file traversal) and output structured results, saving tokens by avoiding LLM reasoning for deterministic work.

See `kord-aios-star-commands-scripts-investigation.md` for full per-script audit.

### 3.1 Scripts That Become HOOKS

| AIOS Script | Kord Hook | Rationale |
|-------------|-----------|----------|
| `story-update-hook.js` (7KB) | `story-lifecycle` hook | Story file update enforcement |
| `agent-exit-hooks.js` (3KB) | Already handled by OMOC session hooks | Session lifecycle |
| `approval-workflow.js` (22KB) | `wave-checkpoint` hook + `quality-gate` hook | Approval decisions |
| `modification-validator.js` (16KB) | `agent-authority` hook | File permission enforcement |

### 3.2 Scripts That Become TOOLS (TypeScript, in plugin)

| AIOS Script | Kord Tool | Rationale |
|-------------|-----------|----------|
| `story-manager.js` (12KB) | `story_read` + `story_update` tools | Story CRUD. Only needs fs + regex. |
| `story-index-generator.js` (10KB) | `plan_read` tool | Plan/story index. Only needs fs. |
| `backlog-manager.js` (10KB) | `task_list` + `task_update` tools (existing) | Task management |
| `security-checker.js` (10KB) | `security_scan` tool (NEW, low priority) | Only regex patterns, no external deps |
| `decision-recorder.js` (5KB) | `decision-logger` hook | Simple file append |
| `dependency-analyzer.js` (18KB) | Embed in existing `skill` tool | Package.json parsing, no heavy deps |

### 3.3 Scripts That Stay as BASH-EXECUTABLE (`.kord/scripts/`)

**Key insight from audit**: Computation scripts (AST analysis, code quality, refactoring) use heavy npm deps (`@babel/parser`, `eslint`, `prettier`, `jscodeshift`) that **cannot be bundled into the plugin**. Converting them to skill content forces the LLM to reason through what a script does deterministically — wasteful and less accurate.

| AIOS Script | `.kord/scripts/` File | Dependencies | Token Savings |
|-------------|----------------------|-------------|---------------|
| `code-quality-improver.js` (1312 lines) | `code-quality-improver.js` | @babel/parser, eslint, prettier | ~5,000-10,000 tokens/run |
| `refactoring-suggester.js` (1139 lines) | `refactoring-suggester.js` | @babel/parser, @babel/traverse | ~3,000-8,000 tokens/run |
| `performance-analyzer.js` (758 lines) | `performance-analyzer.js` | Regex-only but complex patterns | ~2,000-5,000 tokens/run |
| `test-generator.js` (844 lines) | `test-generator.js` | Template system | ~2,000-5,000 tokens/run |
| `pattern-learner.js` (1225 lines) | `pattern-learner.js` | fs, EventEmitter | ~3,000-6,000 tokens/run |

**How agents invoke**: Agent runs `node .kord/scripts/code-quality-improver.js --target src/ --format json` via bash tool. Script outputs JSON report. Agent reads report. Zero prompt tokens for the actual analysis.

**Installation**: Kord CLI installer creates `.kord/scripts/` with these files + a `package.json`. User runs `npm install` once for deps.

```
.kord/
  scripts/
    package.json          ← deps: @babel/parser, eslint, prettier, etc.
    code-quality-improver.js
    refactoring-suggester.js
    performance-analyzer.js
    test-generator.js
    pattern-learner.js
```

### 3.3b Methodology from Scripts → SKILL CONTENT

One script's methodology (not its computation) carries over as skill content:

| AIOS Script | Kord Skill | Rationale |
|-------------|-----------|----------|
| `commit-message-generator.js` | `git-master` skill (existing) | The commit conventions/rules become skill prompt content. Actual commit via git tool. |

### 3.4 Scripts That Are ENGINE-REDUNDANT (DO NOT carry over)

| AIOS Script | Kord Equivalent | Rationale |
|-------------|----------------|-----------|
| `unified-activation-pipeline.js` (24KB) | Agent registration in `src/agents/utils.ts` | Plugin handles activation |
| `greeting-builder.js` (50KB) | Not needed | Kord agents don't use greeting system |
| `agent-config-loader.js` (18KB) | `src/agents/utils.ts` + `src/config/schema.ts` | Plugin config system |
| `workflow-state-manager.js` (16KB) | Boulder state + new extended fields | Engine state management |
| `workflow-navigator.js` (10KB) | Build hook + plan_read tool | Engine navigation |
| `workflow-validator.js` (23KB) | Zod schema validation | Plugin validation |
| `template-engine.js` (7KB) | Not needed | Agents generate content directly |
| `template-validator.js` (8KB) | Skill validation in OMOC loader | Already exists |
| `validate-task-v2.js` (10KB) | Skill format validation | Already exists |
| `skill-validator.js` (10KB) | Skill format validation | Already exists |
| `yaml-validator.js` (10KB) | JSONC parser in shared/ | Already exists |
| `generate-greeting.js` (3KB) | Not needed | No greeting system |
| `greeting-config-cli.js` (3KB) | Not needed | No greeting system |
| `greeting-preference-manager.js` (5KB) | Not needed | No greeting system |
| `test-greeting-system.js` (6KB) | Not needed | No greeting system |
| `batch-update-agents-session-context.js` (3KB) | Not needed | Plugin handles agent context |
| `apply-inline-greeting-all-agents.js` (5KB) | Not needed | No greeting system |
| `populate-entity-registry.js` (8KB) | Not needed | No entity registry in Kord |
| `validate-filenames.js` (6KB) | Not needed | Plugin build handles this |
| `manifest-preview.js` (8KB) | Not needed | No manifest system |
| `migrate-task-to-v2.js` (9KB) | Not needed | No v1→v2 migration |
| `audit-agent-config.js` (10KB) | Not needed | Plugin self-validates |

### 3.5 Scripts That Are DEFERRED (possible future value)

| AIOS Script | Potential Use | Priority |
|-------------|-------------|----------|
| `decision-recorder.js` (5KB) | Decision logging hook | LOW |
| `decision-log-generator.js` (8KB) | ADR generation | LOW |
| `decision-log-indexer.js` (9KB) | ADR indexing | LOW |
| `metrics-tracker.js` (22KB) | Usage analytics | LOW |
| `usage-tracker.js` (19KB) | Usage analytics | LOW |
| `version-tracker.js` (16KB) | Version management | LOW |
| `conflict-resolver.js` (19KB) | Merge conflict resolution | LOW |
| `diff-generator.js` (11KB) | Diff generation | LOW |
| `backup-manager.js` (17KB) | Backup creation | LOW |
| `rollback-handler.js` (17KB) | Rollback | LOW |
| `transaction-manager.js` (18KB) | Transaction management | LOW |
| `elicitation-engine.js` (11KB) | Interactive requirements gathering | MEDIUM |
| `elicitation-session-manager.js` (8KB) | Elicitation session state | MEDIUM |
| `dev-context-loader.js` (8KB) | Dev context injection | MEDIUM |

---

## 4. Checklists — What Carries Over

### 4.1 Checklists That Become SKILL CONTENT

| AIOS Checklist | Kord Skill | Used By |
|---------------|-----------|---------|
| `story-dod-checklist.md` (5KB) | `develop-story` skill | @dev (run before marking story complete) |
| `story-draft-checklist.md` (8KB) | `create-next-story` skill | @sm (validate story quality) |
| `architect-checklist.md` (19KB) | Architecture skills | @architect |
| `pm-checklist.md` (13KB) | Product skills | @pm |
| `po-master-checklist.md` (17KB) | Product owner skills | @po |
| `pre-push-checklist.md` (3KB) | `git-master` skill | @devops |
| `release-checklist.md` (4KB) | DevOps skills | @devops |
| `self-critique-checklist.md` (9KB) | QA skills | @qa |
| `change-checklist.md` (8KB) | Dev workflow skills | @dev |
| `database-design-checklist.md` (4KB) | Database skills | @data-engineer |
| `dba-predeploy-checklist.md` (4KB) | Database skills | @data-engineer |
| `dba-rollback-checklist.md` (3KB) | Database skills | @data-engineer |
| `component-quality-checklist.md` (2KB) | Design system skills | @ux-design-expert |
| `accessibility-wcag-checklist.md` (2KB) | Design system skills | @ux-design-expert |
| `pattern-audit-checklist.md` (2KB) | Architecture skills | @architect |
| `migration-readiness-checklist.md` (2KB) | Database skills | @data-engineer |
| `agent-quality-gate.md` (16KB) | QA skills | @qa |

**Design principle**: Checklists are embedded in skills, not separate files. When @dev loads `develop-story` skill, the DoD checklist is part of the skill content. This ensures the checklist is always in the agent's context when needed.

### 4.2 Checklists That Become TEMPLATE FILES

| Checklist | Location | Rationale |
|-----------|----------|-----------|
| `story-dod-checklist.md` | `.kord/checklists/story-dod.md` | Also available as standalone for manual review |

Only the story DoD checklist warrants a separate file because users might want to customize it per project. All others are methodology-embedded.

---

## 5. AIOS Data Files — What Carries Over

| AIOS Data File | Decision | Rationale |
|---------------|----------|-----------|
| `decision-heuristics-framework.md` (17KB) | **EMBED in @analyst skill** | Decision-making methodology |
| `quality-dimensions-framework.md` (9KB) | **EMBED in @qa skill** | Quality assessment methodology |
| `tier-system-framework.md` (11KB) | **SKIP** | AIOS-internal tier management |
| `elicitation-methods.md` (5KB) | **EMBED in @plan prompt** | Interview methodology |
| `mode-selection-best-practices.md` (11KB) | **SKIP** | AIOS execution modes (Kord uses hooks) |
| `database-best-practices.md` (5KB) | **EMBED in DB skills** | Database methodology |
| `supabase-patterns.md` (7KB) | **EMBED in DB skills** | Supabase-specific methodology |
| `rls-security-patterns.md` (7KB) | **EMBED in DB skills** | RLS methodology |
| `postgres-tuning-guide.md` (6KB) | **EMBED in DB skills** | Postgres methodology |
| `test-levels-framework.md` (3KB) | **EMBED in QA skills** | Testing methodology |
| `test-priorities-matrix.md` (4KB) | **EMBED in QA skills** | Testing priorities |
| `integration-patterns.md` (5KB) | **EMBED in architecture skills** | Integration patterns |
| `migration-safety-guide.md` (8KB) | **EMBED in DB skills** | Migration safety |
| `atomic-design-principles.md` (2KB) | **EMBED in design skills** | Design principles |
| `design-token-best-practices.md` (2KB) | **EMBED in design skills** | Token best practices |
| `wcag-compliance-guide.md` (5KB) | **EMBED in design skills** | Accessibility guide |

---

## 6. Constitution — Carries Over as System Rules

The AIOS constitution (`constitution.md`) with 6 articles carries over as **system rules** injected via `opencode.json` instructions:

```
.opencode/rules/kord-rules.md  ← includes adapted constitution
```

| Article | AIOS Original | Kord Adaptation |
|---------|--------------|-----------------|
| I — CLI First | WARN gate in dev tasks | Embedded in @dev skill |
| II — Agent Authority | Role-based permissions | `agent-authority` hook enforces |
| III — Story-Driven Dev | BLOCK gate, no code without story | `story-lifecycle` hook enforces (when in story mode) |
| IV — No Invention | BLOCK, specs from requirements only | Embedded in @sm, @dev prompts |
| V — Quality First | BLOCK, lint+type+test+build | `quality-gate` hook enforces |
| VI — Absolute Imports | SHOULD preference | Embedded in @dev skill |

**Key change**: Article III ("no code without story") is enforced **only in story-driven mode**. When @build is executing a task-based plan (not story-based), the story-lifecycle hook is dormant. This enables non-dev squads to work without story overhead.

---

## 7. Summary

| AIOS Asset | Count | → Skills | → Hooks | → Tools | → Templates | → Rules | SKIP |
|-----------|-------|---------|---------|---------|------------|---------|------|
| Tasks | 200 | 151 | — | — | — | — | 49 |
| Scripts | 57 | 1 | 4 | 6 | — | — | 21 skip + 5 bash-scripts + 14 deferred |
| Templates | 70+ | — | — | — | 7 | — | 63 (embedded in skills) |
| Checklists | 18 | 17 | — | — | 1 | — | — |
| Data files | 16 | 14 | — | — | — | — | 2 |
| Constitution | 1 | — | — | — | — | 1 | — |
| Workflows | 15 | — | — | — | — | — | 15 (engine handles) |

**Total methodology preserved**: 151 skills + 14 data embeds + 17 checklist embeds + 7 templates + 1 constitution = **~2.5MB of methodology content** carried into the Kord AIOS system.
