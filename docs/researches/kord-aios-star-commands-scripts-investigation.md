> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Kord AIOS — Star Commands & Scripts Investigation

> **Date**: 2026-02-11
> **Status**: Investigation complete — decisions ready
> **Scope**: How star commands map to Kord AIOS, how AIOS scripts execute and what to do with them

---

## 1. How AIOS Scripts Actually Work

### 1.1 Execution Model

AIOS scripts are **standalone Node.js programs** that agents execute via bash:

```
Agent reads task file → task references script → agent runs `node .aios-core/development/scripts/xyz.js` → script outputs results → agent reads results
```

### 1.2 Script Anatomy

Every AIOS script follows this pattern:

```javascript
const fs = require('fs').promises;
const path = require('path');
// Specialized libs: @babel/parser, eslint, prettier, jscodeshift, js-yaml, chalk

class SomeAnalyzer {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    // Initialize patterns, thresholds, caches
  }

  async analyze(targets) {
    // Heavy computation: AST parsing, regex matching, file traversal
    // Returns structured report
  }
}

// CLI entry point
if (require.main === module) {
  const analyzer = new SomeAnalyzer();
  analyzer.analyze(process.argv[2]).then(report => {
    console.log(JSON.stringify(report, null, 2));
  });
}

module.exports = SomeAnalyzer;
```

### 1.3 What Scripts Do (categorized by actual code review)

| Category | Scripts | What They Do | Dependencies |
|----------|---------|-------------|-------------|
| **AST Analysis** | code-quality-improver, refactoring-suggester | Parse JS/TS via @babel/parser, traverse AST, detect patterns | @babel/parser, @babel/traverse, jscodeshift |
| **Lint/Format** | code-quality-improver | Run ESLint + Prettier programmatically | eslint, prettier |
| **Pattern Detection** | performance-analyzer, security-checker | Regex-based pattern scanning for anti-patterns | Built-in (regex only) |
| **Story CRUD** | story-manager, story-update-hook, story-index-generator | Parse story markdown, extract frontmatter, manage checkboxes | js-yaml, fs |
| **Template Rendering** | template-engine, template-validator | Handlebars rendering of templates | handlebars |
| **Test Generation** | test-generator | Generate test stubs from component analysis | Template system |
| **Pattern Learning** | pattern-learner | Record and learn from successful modifications | fs, EventEmitter |
| **Git Operations** | git-wrapper, branch-manager, commit-message-generator | Git CLI wrappers | child_process |
| **Metrics/Tracking** | metrics-tracker, usage-tracker, version-tracker | Track usage stats, write to .aios/ files | fs |
| **Activation** | unified-activation-pipeline, greeting-builder, agent-config-loader | Agent activation, greeting generation | Multiple AIOS-internal |
| **Decision** | decision-recorder, decision-log-generator, decision-context | Record architectural decisions | fs, yaml |
| **Recovery** | backup-manager, rollback-handler, transaction-manager, conflict-resolver | Backup/rollback/transaction management | fs, git |
| **Elicitation** | elicitation-engine, elicitation-session-manager | Interactive requirement gathering | fs, yaml |

### 1.4 Why Scripts Save Tokens

When `code-quality-improver.js` runs:
- It traverses the AST of every file (deterministic, zero tokens)
- It applies 6+ detection patterns (regex + AST, zero tokens)
- It generates a structured report with findings
- The agent reads the 200-line report instead of reasoning through 1000+ lines of code

**Token savings per script invocation**: ~2,000-10,000 tokens depending on codebase size.

### 1.5 External Dependencies

AIOS scripts require npm packages installed in the project:
- `@babel/parser`, `@babel/traverse`, `@babel/generator`, `@babel/types`
- `eslint`, `prettier`
- `jscodeshift`
- `js-yaml`
- `chalk`
- `handlebars`

This is a significant dependency footprint for a plugin.

---

## 2. Script Disposition — Final Decision

### 2.1 Decision Framework

| If script... | Then... | Rationale |
|-------------|---------|-----------|
| Does heavy computation (AST, regex scanning) | **TOOL or BASH SCRIPT** | Saves tokens, deterministic |
| Does CRUD on known file formats (stories, plans) | **TOOL** (already planned) | `story_read`, `story_update`, `plan_read` cover this |
| Contains only methodology/guidelines | **SKILL** | Prompt content, no computation |
| Is engine-redundant (activation, greeting, config) | **SKIP** | Plugin handles natively |
| Requires heavy npm deps (@babel, eslint, prettier) | **BASH SCRIPT** (not tool) | Can't bundle AST parsers in plugin |
| Uses only built-in Node.js (fs, path, regex) | **TOOL** (TypeScript) | Can implement in plugin without deps |

### 2.2 Script-by-Script Audit

#### → TOOL (implement in plugin TypeScript, no external deps)

| Script | Kord Tool | Rationale |
|--------|-----------|-----------|
| `story-manager.js` | `story_read` + `story_update` | Already planned. Parses markdown, extracts checkboxes. Only needs fs + regex. |
| `story-update-hook.js` | `story-lifecycle` hook | Already planned. Detects changes between story versions. |
| `story-index-generator.js` | `plan_read` | Already planned. Indexes stories in a plan. |
| `security-checker.js` | `security_scan` tool (NEW) | Only regex patterns, no external deps. 359 lines. |
| `dependency-analyzer.js` | Can embed in existing `skill` tool | Package.json parsing, no heavy deps. |
| `decision-recorder.js` | `decision-logger` hook | Already planned. Simple file append. |

#### → BASH-EXECUTABLE SCRIPTS (keep as .js in `.kord/scripts/`, agents invoke via bash)

| Script | Location | Rationale |
|--------|----------|-----------|
| `code-quality-improver.js` | `.kord/scripts/code-quality-improver.js` | Requires @babel/parser, eslint, prettier. 1312 lines. Heavy AST work. |
| `refactoring-suggester.js` | `.kord/scripts/refactoring-suggester.js` | Requires @babel/parser, traverse. 1139 lines. AST analysis. |
| `performance-analyzer.js` | `.kord/scripts/performance-analyzer.js` | Regex-only but 758 lines of patterns. Better as script. |
| `test-generator.js` | `.kord/scripts/test-generator.js` | Template-based generation. 844 lines. |
| `pattern-learner.js` | `.kord/scripts/pattern-learner.js` | EventEmitter, file-based learning. 1225 lines. |

**How agents invoke**: Agent runs `node .kord/scripts/code-quality-improver.js --target src/ --format json` via bash tool. Script outputs JSON report. Agent reads report.

**Installation**: `/init` or installer sets up `.kord/scripts/` with these files + a `package.json` for their npm dependencies. `npm install` in `.kord/scripts/` installs deps.

#### → SKILL CONTENT (methodology, no computation)

| Script | Skill | Rationale |
|--------|-------|-----------|
| `commit-message-generator.js` | `git-master` skill (existing) | The patterns/rules become skill content. Actual commit is via git tool. |

#### → ENGINE-REDUNDANT (SKIP)

| Script | Kord Equivalent | Rationale |
|--------|----------------|-----------|
| `unified-activation-pipeline.js` | Plugin agent registration | Plugin handles activation natively |
| `greeting-builder.js` + 5 greeting scripts | Not needed | No greeting system in Kord |
| `agent-config-loader.js` | `src/agents/utils.ts` | Plugin config system |
| `template-engine.js` + `template-validator.js` | Templates are structural guides | Agents fill templates via prompts |
| `workflow-navigator.js` + `workflow-state-manager.js` + `workflow-validator.js` | Build hook + boulder state | Engine handles workflow |
| `skill-validator.js` + `validate-task-v2.js` + `validate-filenames.js` | Skill loader validation | Already exists in OMOC |
| `audit-agent-config.js` | Plugin self-validates | Not needed |
| `manifest-preview.js` + `populate-entity-registry.js` | Not needed | No manifest/registry system |
| `migrate-task-to-v2.js` | Not needed | No v1→v2 migration |
| `batch-update-agents-session-context.js` + `apply-inline-greeting-all-agents.js` | Not needed | Plugin handles context |

#### → DEFERRED (evaluate later)

| Script | Potential Use | Priority |
|--------|-------------|----------|
| `elicitation-engine.js` + `elicitation-session-manager.js` | Enhanced @plan interview | MEDIUM |
| `decision-log-generator.js` + `decision-log-indexer.js` | ADR generation | LOW |
| `metrics-tracker.js` + `usage-tracker.js` + `version-tracker.js` | Analytics | LOW |
| `conflict-resolver.js` + `diff-generator.js` | Merge conflict | LOW |
| `backup-manager.js` + `rollback-handler.js` + `transaction-manager.js` | Recovery | LOW |
| `dev-context-loader.js` | Dev context injection | MEDIUM |
| `git-wrapper.js` + `branch-manager.js` | Git operations | LOW (git tool exists) |
| `approval-workflow.js` | Quality gate logic | MEDIUM (partially covered by hooks) |
| `modification-validator.js` | Agent authority | MEDIUM (covered by agent-authority hook) |
| `agent-exit-hooks.js` | Session cleanup | LOW (session hooks exist) |
| `backlog-manager.js` | Task management | LOW (task tools exist) |
| `agent-assignment-resolver.js` | Executor resolution | LOW (executor-resolver hook) |
| `task-identifier-resolver.js` | Task parsing | LOW (plan_read tool) |

### 2.3 Summary

| Disposition | Count | Action |
|------------|-------|--------|
| → Plugin Tools | 6 | Implement in TypeScript (most already planned) |
| → Bash Scripts | 5 | Keep as .js in `.kord/scripts/`, agents invoke via bash |
| → Skill content | 1 | Embed methodology in existing skill |
| → Engine-redundant (SKIP) | 21 | Not needed, plugin handles natively |
| → Deferred | 14 | Evaluate in future phases |
| **Total** | **47** | (of 57 scripts in .aios-core/development/scripts/) |

---

## 3. Star Commands — Final Decision

### 3.1 How Star Commands Work in AIOS

In AIOS, `*develop` is an internal trigger:
1. User (or orchestrator) sends `*develop story-AUTH-001`
2. Agent recognizes the `*develop` pattern
3. Agent looks up the `develop-*` task file (`.aios-core/development/tasks/develop-*.md`)
4. Task file contains: execution modes, process steps, scripts to run, tools to use, pre/post conditions, acceptance criteria
5. Agent follows the process

**It's essentially**: "load this skill and follow this workflow."

### 3.2 Kord AIOS Equivalent

In Kord AIOS, the same function is served by three mechanisms depending on context:

#### Context 1: Inside @build's autonomous loop

The `executor-resolver` hook handles this automatically:
1. @build reads plan item: `Story AUTH-001 (executor: dev, quality_gate: qa)`
2. Hook resolves: load `develop-story` skill for @dev
3. @dev receives the task with skill pre-loaded
4. After completion: hook loads `qa-review-story` skill for @qa

**No star command needed** — the plan document is the trigger.

#### Context 2: User chatting with @kord directly

User says: "develop story AUTH-001" (or "review the login code", "push to main")
1. @kord's delegation table recognizes the intent
2. @kord delegates to the right agent with the right skill via `load_skills` parameter
3. Agent executes with methodology loaded

**Natural language replaces star commands** — @kord is smart enough to route.

#### Context 3: Power user wants AIOS-style shortcuts

For users migrating from AIOS who are used to `*develop`, `*review`, etc.:
1. The `keyword-detector` hook (already exists in OMOC) can detect `*command` patterns
2. When detected, inject the corresponding skill context into the agent's prompt
3. Agent follows the loaded skill workflow

**This is AIOS backward compatibility**, not a new feature — it reuses an existing hook.

### 3.3 Decision: Hybrid Approach

| Mechanism | Context | Priority |
|-----------|---------|----------|
| **executor-resolver hook** (auto-skill loading) | @build autonomous loop | Phase 1 (already planned) |
| **@kord delegation table** (natural language routing) | Direct user chat | Phase 1 (already exists) |
| **keyword-detector patterns** (`*command` recognition) | AIOS compatibility | Phase 3 (low priority) |

**Star commands are NOT deprecated** — they're absorbed into the system at different layers:

| AIOS Star Command | Kord AIOS Layer | How |
|-------------------|----------------|-----|
| `*develop` | executor-resolver hook | Plan item with `executor: dev` auto-loads `develop-story` skill |
| `*review` | executor-resolver hook | Plan item with `quality_gate: qa` auto-loads `qa-review-story` skill |
| `*push` | executor-resolver hook | Plan item with `executor: devops` auto-loads git-push workflow |
| `*create-prd` | executor-resolver hook | Plan item with `executor: pm` auto-loads `create-prd` skill |
| `*draft` | executor-resolver hook | Plan item with `executor: sm` auto-loads `create-next-story` skill |
| `*checkpoint` | wave-checkpoint hook | Triggered automatically between waves |
| `*documentation` | `/init` command | Generates project AGENTS.md |
| `*create-epic` | executor-resolver hook | Plan item with `executor: pm` auto-loads `create-epic` skill |

For **direct user interaction** (not inside @build loop):
- User says `*develop AUTH-001` → keyword-detector catches `*develop`, injects skill
- User says "develop story AUTH-001" → @kord routes naturally
- Both work. Star syntax is syntactic sugar, not a separate system.

### 3.4 What This Means for Primary Agents

Primary agents (@kord, @build, @plan) need **skill catalog awareness** in their prompts:
- @kord: knows which skills exist → includes in delegation table → selects correct `load_skills`
- @build: executor-resolver hook handles skill loading based on plan metadata
- @plan: knows skill names → references them in plan items as `skills: [develop-story]`

This is handled by the existing **dynamic prompt builder** which already injects available skills into @kord's prompt. For @build, the hook handles it. For @plan, the plan template includes skill references.

---

## 4. Impact on Previous Decisions

### 4.1 Skills/Templates/Scripts Document (Stage 5)

Update section 3 (Scripts) with the new audit:
- 6 scripts → tools (most already planned)
- 5 scripts → bash-executable in `.kord/scripts/`
- 1 → skill content
- 21 → skip
- 14 → deferred

### 4.2 Tools/Hooks/Commands Document (Stage 4)

- Star commands: absorbed via hybrid (hook + delegation + keyword-detector)
- New tool: `security_scan` (from security-checker.js) — LOW priority
- `/init` command: confirmed as AGENTS.md generator
- keyword-detector hook: add `*command` pattern support in Phase 3

### 4.3 Wave Plan Impact

- **Wave 3**: Add `.kord/scripts/` directory with 5 computation scripts + package.json
- **Wave 4**: Installer creates `.kord/scripts/` and runs `npm install` for deps
- **Phase 3**: keyword-detector `*command` patterns for AIOS compatibility

### 4.4 New `.kord/scripts/` Directory Structure

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

Installed by Kord CLI installer. Dependencies managed separately from the project.
