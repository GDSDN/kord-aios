> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# AIOS Skill Catalog: Inventory & Adoption Analysis for Kord AIOS

**Date:** 2026-02-09 (updated 2026-02-10 — refined per-skill analysis)
**Source:** `D:\dev\synkra-aios`
**Architecture Reference:** `kord-architecture-v5.md`
**Total Assets:** 248 skill-equivalent assets (200 tasks + 8 skills + 40 commands)

---

## 1. Overview

This catalog documents **every single AIOS task** analyzed against the Kord AIOS engine. Each of the 200 tasks was individually read and classified based on its actual content, file size, and methodology value.

### Adoption Categories

| Category | Meaning | Action | Count |
|----------|---------|--------|-------|
| **ENGINE** | Already handled by Kord AIOS engine (hooks, tools, agents) | **DO NOT migrate** — redundant | 17 (8.5%) |
| **ADAPT** | Unique methodology but overlaps engine; needs stripping | **Convert to SKILL.md**, strip engine-redundant parts | 13 (6.5%) |
| **KEEP** | Domain-specific methodology, no engine equivalent | **Convert to SKILL.md as-is** | 138 (69%) |
| **SKIP** | Vendor-specific, AIOS-internal, duplicates, or stubs | **Do not migrate** | 32 (16%) |

### Previous vs Refined Analysis

| Category | Previous (v1) | Refined (v2) | Delta | Why |
|----------|---------------|--------------|-------|-----|
| ENGINE | 22 | 17 | -5 | `plan-create-implementation`, `story-checkpoint` have methodology; `qa-gate`, `qa-run-tests` have criteria value |
| ADAPT | 6 | 13 | +7 | Squad-creator tasks (4), `create-agent`, `dev-validate-next-story`, `story-checkpoint` added |
| KEEP | 82 | 138 | +56 | Many tasks wrongly SKIP'd are 5-30KB with real methodology |
| SKIP | 90 | 32 | -58 | Stricter criteria: only AIOS-internal, vendor-specific, true stubs, duplicates |

### Kord AIOS Engine Capabilities (what already exists)

| Engine Feature | Provided By | What It Does |
|----------------|-------------|-------------|
| **Autonomous build loop** | `build` hook + `session.idle` handler | Re-injects continuation prompts when agent idles; loops through `- [ ]` → `- [x]` in plan files |
| **Plan progress tracking** | `boulder-state` feature | `getPlanProgress()` tracks completed/total tasks, `readBoulderState()` resumes |
| **Plan selection & resume** | `start-work` hook | Discovers plans in `.kord/plans/`, auto-selects or prompts, creates boulder state |
| **Orchestrator enforcement** | `build` hook `tool.execute.before` | Blocks direct file editing by @build, injects delegation reminders |
| **Subagent verification** | `build` hook `tool.execute.after` | Mandatory verification after every `task()` completion, git diff stats |
| **Single-task delegation** | `build` hook + `delegate-task` | Enforces atomic task delegation, injects `SINGLE_TASK_DIRECTIVE` |
| **Category-based routing** | `delegate-task` executor | Routes tasks to models by category (visual, ultrabrain, deep, quick, writing) |
| **Plan generation** | `@plan` agent + `delegate-task` constants | Mandatory dependency graph, parallel execution waves, category+skill recommendations |
| **Context gathering** | `@plan` agent system prepend | Mandates `call_kord_agent(subagent_type="explore")` + `call_kord_agent(subagent_type="librarian")` |
| **Background tasks** | `background-agent` manager | Concurrent task execution, queuing, polling, toast notifications |
| **Session recovery** | `session-recovery` hook | Recovers from failures, aborts |
| **Notepad management** | `dev-notepad` hook | Manages dev-junior notepads |
| **Comment checking** | `comment-checker` hook | Validates code comments |
| **Edit error recovery** | `edit-error-recovery` hook | Recovers from file edit failures |
| **Task retry** | `delegate-task-retry` hook | Retries failed task delegations |
| **Git operations** | `git-master` built-in skill | Atomic commits, rebase, history search |

### Asset Distribution

| Type | Location | Count | Total Size |
|------|----------|-------|------------|
| Development Tasks | `.aios-core/development/tasks/` | 200 | ~2.4 MB |
| Agent Commands | `.claude/commands/` | 40 | ~530 KB |
| Claude Skills | `.claude/skills/` | 8 | ~100 KB |
| Templates | `.claude/templates/` + `.aios-core/product/templates/` | ~146 | ~800 KB |
| Development Scripts | `.aios-core/development/scripts/` | 68 | ~500 KB |
| Workflows | `.aios-core/development/workflows/` | 15 | ~150 KB |

---

## 2. Development Tasks (200 files)

### 2.1 Build & Development (12 tasks)

| Task | Size | Agent | Adoption | Engine Equivalent | Notes |
|------|------|-------|----------|-------------------|-------|
| `build-autonomous.md` | 5.6KB | @build | **ENGINE** | `build` hook + `start-work` hook + boulder continuation | Engine's `session.idle` → re-inject pattern IS autonomous build. Boulder state tracks `- [ ]` → `- [x]`. `/start-work` selects and loads plans. |
| `build-component.md` | 14KB | @dev | KEEP | — | Design system integration knowledge; engine routes via `task(category="visual-engineering")` but has no component methodology |
| `build-resume.md` | 2.7KB | @build | **ENGINE** | `start-work` hook: `readBoulderState()` + `appendSessionId()` | Already resumes from last checkpoint |
| `build-status.md` | 4KB | @build | **ENGINE** | `boulder-state`: `getPlanProgress()` | Already tracks completed/total/remaining |
| `compose-molecule.md` | 6.8KB | @dev | KEEP | — | Atomic design molecule composition methodology (6.8KB); valuable for design system work |
| `consolidate-patterns.md` | 11KB | @architect | KEEP | — | Pattern consolidation methodology |
| `deprecate-component.md` | 29KB | @architect | KEEP | — | Large, structured deprecation workflow |
| `extend-pattern.md` | 6.1KB | @dev | KEEP | — | Pattern extension methodology for design systems (6.1KB) |
| `extract-patterns.md` | 8.9KB | @analyst | KEEP | — | Pattern extraction from CODEBASE (8.9KB); complements `learn-patterns.md` (which is about learning from analysis) |
| `collaborative-edit.md` | 32KB | @dev | KEEP | — | Multi-agent editing; no engine equivalent |
| `correct-course.md` | 11.6KB | @kord | ADAPT | — | Course correction methodology; @kord can already do this but skill adds structured decision trees |
| `execute-checklist.md` | 8.6KB | @dev | **ENGINE** | `build` hook boulder continuation: `"Change - [ ] to - [x] in the plan file when done"` | The build loop IS a checklist executor |

### 2.2 Story & Planning (20 tasks)

| Task | Size | Agent | Adoption | Engine Equivalent | Notes |
|------|------|-------|----------|-------------------|-------|
| `create-next-story.md` | 29.5KB | @sm | **KEEP** | — | AIOS story methodology (29.5KB of structured workflow). Engine's @plan creates PLANS, not STORIES. Core methodology value. |
| `sm-create-next-story.md` | 18KB | @sm | **KEEP** | — | SM-specific perspective on story creation (18KB); distinct Scrum Master methodology adds value beyond generic story creation |
| `plan-create-context.md` | 20KB | @plan | **ENGINE** | `@plan` agent + `PLAN_AGENT_SYSTEM_PREPEND` | Engine mandates context gathering via `call_kord_agent(subagent_type="explore/librarian")` |
| `plan-create-implementation.md` | 18.9KB | @plan | **KEEP** | Partial overlap with `@plan` agent | Engine generates plan STRUCTURE (waves, categories), but this task has unique spec→plan transformation methodology, subtask decomposition heuristics, and acceptance criteria extraction (18.9KB) |
| `plan-execute-subtask.md` | 21.4KB | @dev | **ENGINE** | `@build` + `task()` tool + `delegate-task` executor | Build hook delegates via `task()` with category routing. Single-task directive enforces atomic execution. |
| `create-brownfield-story.md` | 22.4KB | @sm | **KEEP** | — | Brownfield-specific story creation; unique methodology |
| `execute-epic-plan.md` | 25.5KB | @kord | **ADAPT** | Partial: build loop handles task-level but not epic-level | Strip loop mechanics (engine does that), keep epic orchestration methodology |
| `validate-next-story.md` | 15.9KB | @qa | **KEEP** | — | Pre-implementation validation; complements engine QA verification |
| `dev-validate-next-story.md` | 11.4KB | @dev | **ADAPT** | Partial overlap with QA validation | Dev-specific validation (implementation feasibility, dependency checks, effort estimation). Strip QA overlap, keep dev-specific technical validation methodology |
| `story-checkpoint.md` | 11.5KB | @kord | **ADAPT** | Partial: boulder tracks progress | Engine tracks PROGRESS, but this task has unique checkpoint METHODOLOGY: structured summary generation, human decision tree (continue/pause/review/abort), next-story recommendations, and inter-story transition protocols (11.5KB) |
| `verify-subtask.md` | 4.9KB | @qa | **ENGINE** | `build` hook `VERIFICATION_REMINDER` after every `task()` | Engine already mandates `lsp_diagnostics`, test runs, build checks after each task |
| `waves.md` | 4.7KB | @kord | **ENGINE** | `@plan` agent: `SECTION 2: PARALLEL EXECUTION GRAPH (MANDATORY)` | Plan agent already mandates wave-based execution graphs |
| `next.md` | 6.5KB | @kord | **ENGINE** | `build` hook boulder continuation: `"Read the plan file to identify the next - [ ] task"` | Build continuation determines next task automatically |
| `orchestrate.md` | 1.3KB | @kord | **ENGINE** | `@kord` + `@build` + `start-work` | Orchestration IS the build loop |
| `orchestrate-resume.md` | 1.1KB | @kord | **ENGINE** | `start-work` hook: resumes boulder state | Already handled |
| `orchestrate-status.md` | 1.2KB | @kord | **ENGINE** | `boulder-state`: `getPlanProgress()` | Already handled |
| `orchestrate-stop.md` | 0.9KB | @kord | **ENGINE** | `stop-continuation-guard` hook | Already handled |
| `shard-doc.md` | 14.7KB | @po | KEEP | — | Document sharding for agent consumption; unique |
| `create-doc.md` | 8.7KB | @pm | KEEP | — | PRD/product document creation |
| `propose-modification.md` | 23.9KB | @architect | KEEP | — | Architectural modification proposals |

### 2.3 Analysis & Research (12 tasks)

| Task | Size | Agent | Adoption | Engine Equivalent | Notes |
|------|------|-------|----------|-------------------|-------|
| `spec-assess-complexity.md` | 10.4KB | @architect | KEEP | — | Complexity assessment methodology |
| `spec-critique.md` | 13.3KB | @architect | KEEP | — | Specification critique methodology |
| `spec-gather-requirements.md` | 14.3KB | @pm | ADAPT | Partial: @plan interview mode gathers requirements | Strip overlap with plan interview, keep PM-specific elicitation techniques |
| `spec-research-dependencies.md` | 9.6KB | @analyst | KEEP | — | Dependency research methodology |
| `spec-write-spec.md` | 11.3KB | @pm | KEEP | — | Spec writing methodology |
| `learn-patterns.md` | 26.9KB | @analyst | KEEP | — | Pattern learning from codebase analysis |
| `facilitate-brainstorming-session.md` | 13.9KB | @pm | KEEP | — | Structured PM brainstorming methodology (14KB): divergent/convergent phases, stakeholder facilitation, decision synthesis |
| `create-deep-research-prompt.md` | 12.3KB | @analyst | KEEP | — | Research prompt engineering methodology (12KB): structured analysis frameworks, question decomposition |
| `calculate-roi.md` | 11.5KB | @analyst | KEEP | — | ROI calculation methodology (11.5KB): cost modeling, value estimation, risk-adjusted returns. Useful for product decisions |
| `patterns.md` | 7.4KB | @analyst | KEEP | — | Pattern MANAGEMENT methodology (7.4KB): catalog maintenance, pattern lifecycle. Complements `learn-patterns.md` (discovery) |
| `kb-mode-interaction.md` | 7.2KB | @analyst | SKIP | — | AIOS-specific knowledge base mode |
| `improve-self.md` | 19.6KB | @kord | SKIP | — | AIOS self-improvement; framework-internal |

### 2.4 Database (20+1 tasks)

**No engine equivalent.** All database skills are domain-specific and additive.

| Task | Size | Agent | Adoption | Notes |
|------|------|-------|----------|-------|
| `db-schema-audit.md` | 25.1KB | @data-engineer | **KEEP** | Core: full schema audit methodology |
| `db-bootstrap.md` | 13.2KB | @data-engineer | **KEEP** | Core: new database bootstrap |
| `db-supabase-setup.md` | 16KB | @data-engineer | KEEP | Supabase-specific project setup |
| `db-rls-audit.md` | 8.9KB | @data-engineer | KEEP | RLS security audit |
| `db-rollback.md` | 16.4KB | @data-engineer | KEEP | Rollback procedures |
| `db-apply-migration.md` | 8.2KB | @data-engineer | KEEP | Migration application |
| `db-domain-modeling.md` | 15.5KB | @data-engineer | KEEP | Domain modeling methodology |
| `db-policy-apply.md` | 15KB | @data-engineer | KEEP | RLS policy application |
| `db-expansion-pack-integration.md` | 16.8KB | @data-engineer | SKIP | AIOS expansion packs–specific |
| `db-explain.md` | 12.4KB | @data-engineer | KEEP | Query execution plan analysis |
| `db-run-sql.md` | 12.1KB | @data-engineer | KEEP | Safe SQL execution |
| `db-analyze-hotpaths.md` | 12.9KB | @data-engineer | KEEP | Performance hot path analysis |
| `db-dry-run.md` | 6.1KB | @data-engineer | KEEP | Migration dry runs |
| `db-env-check.md` | 5.7KB | @data-engineer | KEEP | Environment health check |
| `db-impersonate.md` | 10.2KB | @data-engineer | KEEP | Role impersonation testing |
| `db-load-csv.md` | 12.2KB | @data-engineer | KEEP | CSV data loading |
| `db-seed.md` | 8.2KB | @data-engineer | KEEP | Test data seeding |
| `db-smoke-test.md` | 7.6KB | @data-engineer | KEEP | Database smoke tests |
| `db-snapshot.md` | 11.7KB | @data-engineer | KEEP | Snapshot creation |
| `db-verify-order.md` | 11.5KB | @data-engineer | KEEP | Migration order verification |
| `setup-database.md` | 16KB | @data-engineer | KEEP | Full database setup |

### 2.5 Testing & QA (22 tasks)

| Task | Size | Agent | Adoption | Engine Equivalent | Notes |
|------|------|-------|----------|-------------------|-------|
| `qa-review-story.md` | 23.3KB | @qa | **KEEP** | — | Structured story review methodology; engine has verification but not review methodology |
| `qa-generate-tests.md` | 37.1KB | @qa | **KEEP** | — | Test generation methodology (37KB); no engine equivalent |
| `qa-review-build.md` | 30.7KB | @qa | **ADAPT** | Partial: build hook `VERIFICATION_REMINDER` | Strip basic verification steps (engine does those), keep deep build review methodology |
| `qa-review-proposal.md` | 35.3KB | @qa | KEEP | — | Proposal review methodology |
| `qa-security-checklist.md` | 12.5KB | @qa | KEEP | — | Security checklist methodology |
| `qa-trace-requirements.md` | 11.4KB | @qa | KEEP | — | Requirements traceability |
| `qa-fix-issues.md` | 15.6KB | @qa | KEEP | — | Structured fix methodology (15.6KB): root cause analysis, fix validation, regression prevention |
| `qa-create-fix-request.md` | 13.3KB | @qa | KEEP | — | Structured fix request creation |
| `qa-nfr-assess.md` | 12.2KB | @qa | KEEP | — | Non-functional requirements assessment |
| `qa-risk-profile.md` | 13.2KB | @qa | KEEP | — | Risk profile generation |
| `qa-migration-validation.md` | 13.1KB | @qa | KEEP | — | Migration validation methodology |
| `qa-library-validation.md` | 11.5KB | @qa | KEEP | — | Library dependency validation |
| `qa-false-positive-detection.md` | 9.4KB | @qa | KEEP | — | False positive detection methodology (9.4KB): heuristic filtering, confidence scoring |
| `qa-evidence-requirements.md` | 6.6KB | @qa | KEEP | — | Evidence gathering methodology (6.6KB): what constitutes proof of quality for QA decisions |
| `qa-browser-console-check.md` | 6.8KB | @qa | KEEP | — | Browser QA methodology (6.8KB): console error categorization, severity assessment, remediation patterns |
| `qa-backlog-add-followup.md` | 10.2KB | @qa | KEEP | — | Follow-up backlog management |
| `qa-after-creation.md` | 14KB | @qa | KEEP | — | Post-creation QA (14KB): immediate validation after resource creation. Different scope than qa-review-build (comprehensive) |
| `qa-gate.md` | 8.4KB | @qa | KEEP | Partial: engine enforces verification | Engine enforces pass/fail GATES, but this task has unique gate CRITERIA methodology (8.4KB): multi-dimensional quality assessment, threshold definitions |
| `qa-run-tests.md` | 5.8KB | @qa | KEEP | Partial: engine mandates test runs | Engine mandates "run tests", but this task has structured test execution methodology (5.8KB): test selection, result interpretation, failure triage |
| `qa-test-design.md` | 9.1KB | @qa | KEEP | — | Test design methodology |
| `dev-apply-qa-fixes.md` | 8.1KB | @dev | KEEP | — | QA fix application methodology (8.1KB): prioritized fix workflow, regression verification |
| `test-as-user.md` | 14KB | @qa | KEEP | — | User-perspective testing methodology |

### 2.6 DevOps & CI/CD (8 tasks)

**No engine equivalent.** All DevOps skills are domain-specific and additive.

| Task | Size | Agent | Adoption | Notes |
|------|------|-------|----------|-------|
| `ci-cd-configuration.md` | 20.8KB | @devops | **KEEP** | Core: CI/CD pipeline methodology |
| `github-devops-github-pr-automation.md` | 17.7KB | @devops | KEEP | PR automation methodology |
| `github-devops-pre-push-quality-gate.md` | 21.6KB | @devops | KEEP | Pre-push quality gates |
| `github-devops-repository-cleanup.md` | 8.8KB | @devops | KEEP | Repo cleanup |
| `github-devops-version-management.md` | 11.7KB | @devops | KEEP | Version management |
| `setup-github.md` | 31.2KB | @devops | KEEP | GitHub repo setup |
| `pr-automation.md` | 19.1KB | @devops | KEEP | Open-source PR contribution automation (19KB); different focus than github-devops-github-pr-automation (internal PRs) |
| `release-management.md` | 18.7KB | @devops | KEEP | Release workflow |

### 2.7 Design System (8 tasks)

**No engine equivalent** (engine has `visual-engineering` category for routing, but no design system methodology).

| Task | Size | Agent | Adoption | Notes |
|------|------|-------|----------|-------|
| `setup-design-system.md` | 13KB | @ux-design-expert | KEEP | Design system setup |
| `run-design-system-pipeline.md` | 16.1KB | @ux-design-expert | KEEP | Design system pipeline |
| `extract-tokens.md` | 13.1KB | @ux-design-expert | KEEP | Design token extraction |
| `export-design-tokens-dtcg.md` | 7.2KB | @ux-design-expert | KEEP | DTCG format export |
| `tailwind-upgrade.md` | 8.2KB | @dev | KEEP | Tailwind upgrade methodology |
| `generate-ai-frontend-prompt.md` | 9.4KB | @ux-design-expert | KEEP | AI-assisted frontend prompt generation (9.4KB); useful for design system collaboration |
| `ux-create-wireframe.md` | 15.4KB | @ux-design-expert | KEEP | Wireframe creation |
| `ux-ds-scan-artifact.md` | 16.2KB | @ux-design-expert | KEEP | Design system artifact scanning |

### 2.8 Squad & Agent Management (12 tasks)

The squad system is **highly relevant** — it enables creating reusable agent groups (domain packs). 5 tasks have real methodology value; 5 are vendor/AIOS-specific; 2 are stubs.

| Task | Size | Agent | Adoption | Notes |
|------|------|-------|----------|-------|
| `create-agent.md` | 31.6KB | @squad-creator | **ADAPT** | Rich agent design methodology (role, tools, persona). Adapt AIOS format → Kord AIOS TypeScript agent definition |
| `squad-creator-create.md` | 8.4KB | @squad-creator | **ADAPT** | Squad creation with templates (basic/etl/agent-only), manifest generation, validation. Adapt for Kord AIOS agent group structure |
| `squad-creator-design.md` | 12.7KB | @squad-creator | **KEEP** | Domain analysis pipeline + recommendation engine. Analyzes docs → suggests agents + tasks. Pure methodology, no AIOS format dependency |
| `squad-creator-analyze.md` | 7KB | @squad-creator | **ADAPT** | Squad component inventory, coverage metrics, improvement suggestions. Adapt inventory structure for Kord AIOS |
| `squad-creator-extend.md` | 10.2KB | @squad-creator | **ADAPT** | Add agents/tasks/workflows to existing squad with manifest updates. Adapt component types for Kord AIOS |
| `squad-creator-validate.md` | 5.1KB | @squad-creator | **ADAPT** | Schema validation, task format checks, config reference validation. Adapt validation rules for Kord AIOS |
| `squad-creator-list.md` | 6.6KB | @squad-creator | **KEEP** | List local squads with status/version. Simple utility, convert as-is |
| `modify-agent.md` | 9.2KB | @kord | SKIP | AIOS agent FILE modification (format-specific) |
| `validate-agents.md` | 3.5KB | @kord | SKIP | Stub (3.5KB) |
| `squad-creator-publish.md` | 4.9KB | @squad-creator | SKIP | Synkra registry–specific |
| `squad-creator-sync-ide-command.md` | 12.4KB | @squad-creator | SKIP | AIOS IDE sync (Claude/Cursor/Windsurf format-specific) |
| `squad-creator-sync-synkra.md` | 8.6KB | @squad-creator | SKIP | Synkra API–specific |
| `squad-creator-download.md` | 3.9KB | @squad-creator | SKIP | AIOS GitHub registry–specific |
| `squad-creator-migrate.md` | 8.7KB | @squad-creator | SKIP | AIOS format migration |

### 2.9 Documentation (10 tasks)

| Task | Size | Agent | Adoption | Engine Equivalent | Notes |
|------|------|-------|----------|-------------------|-------|
| `document-project.md` | 18KB | @pm | KEEP | — | Project documentation methodology |
| `generate-documentation.md` | 6.8KB | @pm | KEEP | — | Pattern library documentation generation (6.8KB); different scope than `document-project.md` |
| `sync-documentation.md` | 23.4KB | @pm | KEEP | — | Code-docs synchronization |
| `index-docs.md` | 9.9KB | @pm | KEEP | — | Documentation indexing methodology (9.9KB): TOC generation, cross-reference mapping |
| `document-gotchas.md` | 10.4KB | @dev | KEEP | — | Gotcha documentation methodology |
| `gotcha.md` | 3.4KB | @dev | KEEP | — | Individual gotcha documentation template (3.4KB); pairs with `document-gotchas.md` |
| `gotchas.md` | 3.6KB | @dev | KEEP | — | Gotcha catalog listing (3.6KB); pairs with `gotcha.md` and `document-gotchas.md` |
| `setup-project-docs.md` | 12.3KB | @pm | KEEP | — | Docs structure setup |
| `check-docs-links.md` | 3.1KB | @pm | KEEP | — | Documentation link validation (3.1KB); small but useful for docs health |
| `generate-shock-report.md` | 13.7KB | @analyst | KEEP | — | Visual shock report methodology (13.7KB): codebase health visualization, metric synthesis |

### 2.10 Product Owner (8 tasks)

| Task | Size | Agent | Adoption | Engine Equivalent | Notes |
|------|------|-------|----------|-------------------|-------|
| `po-manage-story-backlog.md` | 14.2KB | @po | KEEP | — | Backlog management methodology |
| `po-close-story.md` | 10.7KB | @po | KEEP | — | Story closure workflow |
| `po-pull-story.md` | 7.2KB | @po | KEEP | — | Backlog pull |
| `po-pull-story-from-clickup.md` | 13.5KB | @po | **SKIP** | — | **ClickUp-specific** |
| `po-backlog-add.md` | 8.3KB | @po | KEEP | — | Backlog additions |
| `po-stories-index.md` | 7.6KB | @po | KEEP | — | Story index management (7.6KB): status tracking, dependency mapping |
| `po-sync-story.md` | 6.9KB | @po | KEEP | — | Story state sync |
| `po-sync-story-to-clickup.md` | 11KB | @po | **SKIP** | — | **ClickUp-specific** |

### 2.11 Dev Workflow (15 tasks)

| Task | Size | Agent | Adoption | Engine Equivalent | Notes |
|------|------|-------|----------|-------------------|-------|
| `dev-develop-story.md` | 26.6KB | @dev | **ADAPT** | Partial: engine handles build loop, task delegation, verification | **Strip**: YOLO/interactive/pre-flight mode selection (v5: "mode determined by system"), loop mechanics, verification steps. **Keep**: story methodology, implementation workflow, quality gates, AIOS structured development phases |
| `dev-improve-code-quality.md` | 24.7KB | @dev | KEEP | — | Code quality methodology |
| `dev-optimize-performance.md` | 29.3KB | @dev | KEEP | — | Performance optimization methodology |
| `dev-suggest-refactoring.md` | 24.2KB | @dev | KEEP | — | Refactoring methodology |
| `dev-backlog-debt.md` | 11KB | @dev | KEEP | — | Tech debt management |
| `create-task.md` | 9.2KB | @dev | SKIP | — | AIOS task framework–internal |
| `create-workflow.md` | 10.8KB | @dev | SKIP | — | AIOS workflow engine–internal |
| `modify-task.md` | 10.3KB | @dev | SKIP | — | AIOS task framework–internal |
| `modify-workflow.md` | 12.7KB | @dev | SKIP | — | AIOS workflow engine–internal |
| `run-workflow.md` | 10.6KB | @dev | SKIP | — | AIOS workflow engine–internal |
| `run-workflow-engine.md` | 26.1KB | @dev | SKIP | — | AIOS workflow engine; Kord uses hooks |
| `validate-workflow.md` | 8.3KB | @dev | SKIP | — | AIOS workflow validation |
| `create-service.md` | 8.9KB | @dev | KEEP | — | Service creation methodology |
| `create-suite.md` | 7.2KB | @dev | KEEP | — | Test suite scaffolding methodology (7.2KB): structure templates, coverage planning |
| `health-check.yaml` | 5.5KB | @dev | SKIP | — | YAML; not SKILL.md compatible |

### 2.12 Infrastructure & Setup (10 tasks)

| Task | Size | Agent | Adoption | Engine Equivalent | Notes |
|------|------|-------|----------|-------------------|-------|
| `environment-bootstrap.md` | 45.6KB | @devops | **ADAPT** | Partial: Kord CLI installer handles OpenCode detection, config generation | **Strip**: AIOS-specific installer logic, `.aios-core/` setup. **Keep**: environment detection, dependency checks, tool validation |
| `setup-mcp-docker.md` | 16.3KB | @devops | KEEP | — | MCP Docker setup methodology |
| `setup-llm-routing.md` | 4.7KB | @kord | SKIP | — | AIOS LLM routing; Kord uses config |
| `init-project-status.md` | 11KB | @kord | SKIP | — | AIOS project status; engine tracks via boulder |
| `integrate-expansion-pack.md` | 6.8KB | @dev | SKIP | — | AIOS expansion pack–internal |
| `validate-tech-preset.md` | 6KB | @architect | SKIP | — | AIOS preset validation |
| `update-aios.md` | 4.2KB | @kord | SKIP | — | AIOS self-update |
| `update-manifest.md` | 9.7KB | @kord | SKIP | — | AIOS manifest management |
| `update-source-tree.md` | 3.1KB | @kord | SKIP | — | AIOS source tree update |
| `security-audit.md` | 13.4KB | @qa | KEEP | — | Security audit methodology |

### 2.13 Utilities (32 tasks)

| Task | Size | Agent | Adoption | Engine Equivalent | Notes |
|------|------|-------|----------|-------------------|-------|
| `cleanup-utilities.md` | 17.8KB | @dev | KEEP | — | Code cleanup methodology |
| `cleanup-worktrees.md` | 0.9KB | @dev | SKIP | — | Stub; git-master can handle |
| `create-worktree.md` | 9.2KB | @dev | KEEP | — | Git worktree creation methodology (9.2KB): branch isolation, parallel development workflows |
| `list-worktrees.md` | 6.5KB | @dev | KEEP | — | Worktree inventory management (6.5KB): status tracking, cleanup recommendations |
| `merge-worktree.md` | 0.9KB | @dev | SKIP | — | Stub |
| `remove-worktree.md` | 8.7KB | @dev | KEEP | — | Safe worktree removal (8.7KB): uncommitted changes detection, branch cleanup |
| `undo-last.md` | 7.6KB | @dev | KEEP | — | Structured rollback methodology (7.6KB): git reset strategies, state recovery |
| `session-resume.md` | 4.3KB | @kord | **ENGINE** | `session-recovery` hook + `start-work` hook | Already handled |
| `yolo-toggle.md` | 2.2KB | @dev | **ENGINE** | v5: "Work mode determined by system, NOT star commands" | Mode selection deprecated in Kord AIOS |
| `ids-query.md` | 3.5KB | @data-engineer | SKIP | — | Niche ID querying |
| `list-mcps.md` | 0.5KB | @kord | **ENGINE** | `skill-mcp-manager` | Built-in MCP management |
| `search-mcp.md` | 7.8KB | @kord | KEEP | — | MCP catalog search methodology (7.8KB): capability matching, compatibility checking |
| `mcp-workflow.md` | 8.9KB | @kord | KEEP | — | MCP integration workflow (8.9KB): setup, testing, configuration methodology |
| `remove-mcp.md` | 0.7KB | @kord | SKIP | — | Stub |
| `generate-migration-strategy.md` | 14.1KB | @architect | KEEP | — | Migration strategy methodology |
| `security-scan.md` | 19.1KB | @qa | KEEP | — | Security scan methodology |
| `test-validation-task.md` | 3.3KB | @qa | SKIP | — | Stub |
| `ux-user-research.md` | 13.3KB | @ux-design-expert | KEEP | — | User research methodology |
| `squad-creator-download.md` | 3.9KB | @kord | SKIP | — | Synkra-specific |
| `squad-creator-migrate.md` | 8.7KB | @kord | SKIP | — | Synkra-specific |

---

## 3. Agent Commands (40 files)

### 3.1 AIOS Core Agents (12 commands)

These define agent **personas** and are consumed during Wave 1 (agent prompt redesign), NOT as skills.

| Agent | File | Size | Adoption | Notes |
|-------|------|------|----------|-------|
| `aios-master` | `AIOS/agents/aios-master.md` | 15.5KB | **Wave 1** | Persona/methodology absorbed into `@kord` agent prompt |
| `dev` | `AIOS/agents/dev.md` | 23KB | **Wave 1** | Absorbed into `@dev` + `@dev-junior` prompts |
| `architect` | `AIOS/agents/architect.md` | 19KB | **Wave 1** | Absorbed into `@architect` prompt |
| `devops` | `AIOS/agents/devops.md` | 19KB | **Wave 1** | Absorbed into `@devops` prompt |
| `ux-design-expert` | `AIOS/agents/ux-design-expert.md` | 18.2KB | **Wave 1** | Absorbed into `@ux-design-expert` prompt |
| `qa` | `AIOS/agents/qa.md` | 16.2KB | **Wave 1** | Absorbed into `@qa` prompt |
| `pm` | `AIOS/agents/pm.md` | 15.2KB | **Wave 1** | Absorbed into `@pm` prompt |
| `po` | `AIOS/agents/po.md` | 12.8KB | **Wave 1** | Absorbed into `@po` prompt |
| `squad-creator` | `AIOS/agents/squad-creator.md` | 12.2KB | **Wave 1** | Absorbed into `@squad-creator` prompt |
| `sm` | `AIOS/agents/sm.md` | 11.1KB | **Wave 1** | Absorbed into `@sm` prompt |
| `analyst` | `AIOS/agents/analyst.md` | 10.2KB | **Wave 1** | Absorbed into `@analyst` prompt |
| `data-engineer` | `AIOS/agents/data-engineer.md` | 20.4KB | **Wave 1** | Absorbed into `@data-engineer` prompt |

### 3.2 MMOS Squad (8 commands)

| Command | Size | Adoption | Notes |
|---------|------|----------|-------|
| `charlie-synthesis-expert.md` | 7.1KB | SKIP | Mind mapping squad; niche |
| `cognitive-analyst.md` | 4.5KB | SKIP | Mind mapping squad; niche |
| `data-importer.md` | 6.3KB | SKIP | Mind mapping squad; niche |
| `debate.md` | 11KB | SKIP | Mind mapping squad; niche |
| `emulator.md` | 11KB | SKIP | Mind mapping squad; niche |
| `identity-analyst.md` | 4.7KB | SKIP | Mind mapping squad; niche |
| `mind-mapper.md` | 8.6KB | SKIP | Mind mapping squad; niche |
| `mind-pm.md` | 4.2KB | SKIP | Mind mapping squad; niche |

### 3.3 MMOS Mapper (9 commands)

Enhanced versions of MMOS Squad. **SKIP** — niche mind mapping system.

### 3.4 Ralph (1 command)

| Command | Size | Adoption | Notes |
|---------|------|----------|-------|
| `ralph.md` | 13.4KB | **ENGINE** | Engine has `ralph-loop` hook for autonomous continuation |

---

## 4. Claude Skills (8 files)

| Skill | Type | Size | Adoption | Notes |
|-------|------|------|----------|-------|
| `architect-first/` | Directory | 10KB SKILL + 50KB resources | **ADAPT** | Architecture-first methodology; strip Python scripts (AIOS-specific), keep principles |
| `mcp-builder/` | Directory | 13.5KB SKILL + 103KB resources | SKIP | MCP building for AIOS; engine manages MCPs differently |
| `skill-creator/` | Directory | 11.5KB SKILL + 17KB resources | SKIP | AIOS skill creator with Python scripts; not compatible with Kord |
| `clone-mind.md` | Flat | 17.4KB | SKIP | MMOS/mind cloning; niche |
| `enhance-workflow.md` | Flat | 14.2KB | SKIP | AIOS workflow enhancement; engine uses hooks |
| `ralph.md` | Flat | 7.6KB | **ENGINE** | Engine has `ralph-loop` hook |
| `squad.md` | Flat | 7.8KB | SKIP | Squad management; niche |
| `course-generation-workflow.md` | Flat | 1.8KB | SKIP | Course generation; niche |

---

## 5. Adoption Summary (Refined)

### By Category

| Adoption | Count | % of 200 tasks | Action |
|----------|-------|-----------------|--------|
| **ENGINE** | 17 | 8.5% | Do not migrate — engine already handles |
| **ADAPT** | 13 | 6.5% | Convert, strip engine-redundant parts, keep methodology |
| **KEEP** | 138 | 69% | Convert to SKILL.md as-is |
| **SKIP** | 32 | 16% | Do not migrate — AIOS-internal, vendor-specific, duplicates, or stubs |

### ENGINE Tasks (17) — Fully Redundant with Kord AIOS Engine

| Task | Engine Handler |
|------|---------------|
| `build.md` | `build` hook: core build orchestration |
| `build-autonomous.md` | `build` hook + `start-work` hook + boulder continuation loop |
| `build-resume.md` | `start-work` hook: `readBoulderState()` + `appendSessionId()` |
| `build-status.md` | `boulder-state`: `getPlanProgress()` |
| `execute-checklist.md` | `build` hook: boulder continuation loops through `- [ ]` → `- [x]` |
| `plan-create-context.md` | `@plan` agent: mandatory context gathering protocol |
| `plan-execute-subtask.md` | `@build` + `task()` + `delegate-task` executor |
| `verify-subtask.md` | `build` hook: `VERIFICATION_REMINDER` after every `task()` |
| `waves.md` | `@plan` agent: `PARALLEL EXECUTION GRAPH (MANDATORY)` |
| `next.md` | `build` hook: boulder continuation determines next task |
| `orchestrate.md` | `@kord` + `@build` + `start-work` |
| `orchestrate-resume.md` | `start-work` hook: resumes boulder state |
| `orchestrate-status.md` | `boulder-state`: `getPlanProgress()` |
| `orchestrate-stop.md` | `stop-continuation-guard` hook |
| `session-resume.md` | `session-recovery` + `start-work` hooks |
| `yolo-toggle.md` | v5: mode determined by system, star commands deprecated |
| `list-mcps.md` | `skill-mcp-manager` |

### ADAPT Tasks (13) — Unique Methodology, Needs Engine-Overlap Stripping

| Task | What to Strip (engine does it) | What to Keep (methodology) |
|------|-------------------------------|---------------------------|
| `dev-develop-story.md` (34.7KB) | YOLO/interactive/pre-flight modes, loop mechanics, verification steps | Story implementation phases, quality gates, structured dev workflow |
| `execute-epic-plan.md` (26.2KB) | Loop mechanics, status tracking | Epic-level orchestration, cross-story coordination, wave structure |
| `correct-course.md` (11.6KB) | — | Course correction decision trees, drift detection criteria |
| `qa-review-build.md` (28.4KB) | Basic verification (`lsp_diagnostics`, test runs) | Deep 10-phase build review, code quality analysis, architecture compliance |
| `spec-gather-requirements.md` (14.3KB) | Overlap with @plan interview mode | PM-specific elicitation techniques, stakeholder management |
| `environment-bootstrap.md` (27.5KB) | AIOS installer logic, `.aios-core/` setup | Environment detection, dependency checks, tool validation |
| `story-checkpoint.md` (11.5KB) | Loop mechanics (boulder handles progress) | Checkpoint summary generation, human decision tree, inter-story transitions |
| `dev-validate-next-story.md` (11.4KB) | QA validation overlap | Dev-specific technical validation: feasibility, dependencies, effort estimation |
| `create-agent.md` (31.6KB) | AIOS agent file format | Agent design methodology: role definition, tool selection, persona design |
| `squad-creator-create.md` (8.4KB) | AIOS squad manifest format | Agent group creation: templates, structure generation, validation |
| `squad-creator-analyze.md` (7KB) | AIOS squad component inventory | Coverage analysis, improvement recommendations |
| `squad-creator-extend.md` (10.2KB) | AIOS manifest update logic | Incremental component addition methodology |
| `squad-creator-validate.md` (5.1KB) | AIOS schema validation rules | Structural validation patterns, config reference checking |

### KEEP Tasks (138) — Domain-Specific, Convert As-Is

Top priorities by domain (high methodology value, no engine equivalent):

| Domain | Count | Top Files | Total Size |
|--------|-------|-----------|------------|
| **QA & Testing** | 20 | `qa-generate-tests.md` (37KB), `qa-review-proposal.md` (35KB), `qa-review-story.md` (23KB) | ~280KB |
| **Database** | 20 | `db-schema-audit.md` (25KB), `db-supabase-setup.md` (16KB), `db-rollback.md` (16KB) | ~240KB |
| **Design System** | 18 | `deprecate-component.md` (29KB), `ux-ds-scan-artifact.md` (16KB), `run-design-system-pipeline.md` (16KB) | ~200KB |
| **Documentation** | 10 | `sync-documentation.md` (23KB), `document-project.md` (18KB), `generate-shock-report.md` (14KB) | ~100KB |
| **Story & Planning** | 9 | `create-next-story.md` (30KB), `propose-modification.md` (24KB), `create-brownfield-story.md` (22KB) | ~180KB |
| **Analysis & Research** | 10 | `learn-patterns.md` (27KB), `spec-critique.md` (13KB), `facilitate-brainstorming.md` (14KB) | ~130KB |
| **DevOps & CI/CD** | 8 | `setup-github.md` (31KB), `github-devops-pre-push-quality-gate.md` (22KB), `ci-cd-configuration.md` (21KB) | ~150KB |
| **Dev Workflow** | 8 | `dev-optimize-performance.md` (29KB), `dev-improve-code-quality.md` (25KB), `dev-suggest-refactoring.md` (24KB) | ~140KB |
| **Product Owner** | 6 | `po-manage-story-backlog.md` (14KB), `po-close-story.md` (11KB), `po-backlog-add.md` (8KB) | ~55KB |
| **Squad (non-ADAPT)** | 2 | `squad-creator-design.md` (13KB), `squad-creator-list.md` (7KB) | ~20KB |
| **MCP** | 3 | `add-mcp.md` (10KB), `mcp-workflow.md` (9KB), `search-mcp.md` (8KB) | ~27KB |
| **Worktrees** | 3 | `create-worktree.md` (9KB), `remove-worktree.md` (9KB), `list-worktrees.md` (7KB) | ~25KB |
| **Utilities** | 21 | `collaborative-edit.md` (32KB), `security-scan.md` (19KB), `cleanup-utilities.md` (18KB) | ~250KB |

### SKIP Tasks (32) — Do Not Migrate

| Reason | Count | Tasks |
|--------|-------|-------|
| **AIOS-internal** (framework engine, formats, workflow system) | 19 | `create-task.md`, `create-workflow.md`, `modify-agent.md`, `modify-task.md`, `modify-workflow.md`, `run-workflow.md`, `run-workflow-engine.md`, `validate-workflow.md`, `validate-agents.md`, `validate-tech-preset.md`, `setup-llm-routing.md`, `update-aios.md`, `update-manifest.md`, `improve-self.md`, `init-project-status.md`, `integrate-expansion-pack.md`, `kb-mode-interaction.md`, `db-expansion-pack-integration.md`, `test-validation-task.md` |
| **Vendor-specific** (ClickUp, Synkra API, AIOS registry) | 7 | `po-pull-story-from-clickup.md`, `po-sync-story-to-clickup.md`, `squad-creator-sync-synkra.md`, `squad-creator-publish.md`, `squad-creator-download.md`, `squad-creator-sync-ide-command.md`, `squad-creator-migrate.md` |
| **Duplicates** | 2 | `brownfield-create-story.md` (dup of `create-brownfield-story.md`), `apply-qa-fixes.md` (dup of `dev-apply-qa-fixes.md`) |
| **Stubs** (<1KB, no real content) | 3 | `cleanup-worktrees.md` (0.9KB), `merge-worktree.md` (0.9KB), `remove-mcp.md` (0.7KB) |
| **Niche** | 1 | `ids-query.md` (3.5KB) |

---

## 6. Key Observations (Refined v2)

1. **69% of AIOS tasks have genuine methodology value** — the initial v1 analysis was too aggressive with SKIP, discarding tasks with 5-30KB of real methodology content
2. **Only 16% are truly not worth migrating** — strict SKIP criteria: AIOS-internal framework files, vendor-specific (ClickUp/Synkra), true stubs (<1KB), and exact duplicates
3. **8.5% are engine-redundant** — build hook + boulder state + delegate-task + plan agent handle autonomous loops, plan execution, verification, status, and session management
4. **13 tasks need adaptation** — strip engine-redundant parts (modes, loops, verification, AIOS formats) and keep methodology. Squad-creator tasks (5) are especially valuable for agent group management
5. **Squad system is highly relevant** — previously all SKIP'd, now 5 ADAPT + 2 KEEP. Enables creating reusable agent/skill packs for Kord AIOS
6. **Agent commands are NOT skills** — they are persona definitions consumed during Wave 1 agent prompt redesign
7. **151 tasks to convert** (138 KEEP + 13 ADAPT) = ~2MB of methodology content → SKILL.md files
8. **QA pack is the richest domain** — 20 KEEP tasks totaling ~280KB of unique methodology
9. **Database pack is the strongest** — 20 tasks with zero engine overlap, all worth keeping
10. **Design System is larger than expected** — 18 KEEP tasks covering atomic design, tokens, Tailwind, wireframes, and DS pipeline
