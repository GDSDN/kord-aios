> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Kord AIOS — Tools, Hooks & Commands Decision

> **Date**: 2026-02-11
> **Stage**: 4 of 7 — Engine pieces: what exists, what's new, what changes
> **Inputs**: Orchestration model (Stage 3), OMOC hook/tool inventory, AIOS capability gaps
> **Revision**: Updated 2026-02-11 — commands kept as-is (no renames), /init repurposed, star commands pending, ralph-loop is Claude Code plugin mode

---

## 1. Existing OMOC Hooks — Disposition

### 1.1 Hooks That KEEP As-Is (no changes needed)

These hooks are engine infrastructure — domain-agnostic, battle-tested.

| Hook | Purpose | Why KEEP |
|------|---------|----------|
| `context-window-monitor` | Track context usage | Engine infrastructure |
| `preemptive-compaction` | Compaction before overflow | Engine infrastructure |
| `session-recovery` | Crash recovery | Engine infrastructure |
| `session-notification` | Session event notifications | Engine infrastructure |
| `comment-checker` | Validate code comments | Code quality |
| `tool-output-truncator` | Truncate large outputs | Engine infrastructure |
| `directory-agents-injector` | Inject AGENTS.md | Context injection |
| `directory-readme-injector` | Inject README | Context injection |
| `empty-task-response-detector` | Detect empty responses | Error recovery |
| `think-mode` | Extended thinking | Engine infrastructure |
| `claude-code-hooks` | Claude Code compat | Compatibility layer |
| `anthropic-context-window-limit-recovery` | Context overflow recovery | Error recovery |
| `rules-injector` | Project rules | Context injection |
| `background-notification` | Background task notifs | Engine infrastructure |
| `auto-update-checker` | Plugin updates | Maintenance |
| `keyword-detector` | Keyword detection | Engine infrastructure |
| `agent-usage-reminder` | Agent capability reminders | UX |
| `non-interactive-env` | Non-interactive handling | Environment |
| `interactive-bash-session` | Bash session support | Tool support |
| `thinking-block-validator` | Thinking block validation | Engine infrastructure |
| `category-skill-reminder` | Skill reminders per category | UX |
| `auto-slash-command` | Auto-detect slash commands | UX |
| `edit-error-recovery` | Edit error recovery | Error recovery |
| `delegate-task-retry` | Retry failed delegations | Reliability |
| `task-resume-info` | Resume info for tasks | Continuity |
| `question-label-truncator` | Truncate question labels | UX |
| `subagent-question-blocker` | Block subagent→user questions | Orchestration |
| `stop-continuation-guard` | Stop continuation | Control |
| `compaction-context-injector` | Context during compaction | Context preservation |
| `unstable-agent-babysitter` | Monitor unstable agents | Reliability |
| `tasks-todowrite-disabler` | Disable TodoWrite | Control |
| `write-existing-file-guard` | Guard file overwrites | Safety |
| `anthropic-effort` | Effort level control | Model optimization |
| `task-reminder` | Remind to use task tools | UX |

**Count: 33 hooks — NO changes required.**

### 1.2 Hooks That MODIFY (path/reference updates + extensions)

| Hook | Current State | Modification | Effort |
|------|--------------|-------------|--------|
| `build/` (was `atlas/`) | Reads `.sisyphus/plans/`, delegates to dev-junior only | **EXTEND**: Parse story/task/wave structure. Delegate to executor field. Quality gate after stories. Checkpoint at wave boundaries. | 8-12h |
| `start-work/` | Reads `.sisyphus/plans/`, creates boulder state | **EXTEND**: Accept `--squad` and `--wave` params. Read `docs/kord/plans/` structure. Create extended boulder state. | 3-4h |
| `plan-md-only/` (was `prometheus-md-only/`) | Restricts to `.sisyphus/*.md` writes | **UPDATE**: Paths to `docs/kord/plans/`. Allow delegation via task() tool (not just .md writes). | 1-2h |
| `dev-notepad/` (was `sisyphus-junior-notepad/`) | Injects notepad directive for `.sisyphus/notepads/` | **UPDATE**: Paths to `docs/kord/notepads/`. | 30min |
| `todo-continuation-enforcer` | Skips prometheus, compaction | **UPDATE**: Agent name references (plan instead of prometheus). | 15min |
| `ralph-loop/` | Development mode (Claude Code plugin pattern) | **KEEP AS-IS**: This is a distinct development mode, not just a reference loop. No changes. | 0 |

**Count: 6 hooks — MODIFY with varying effort.**

### 1.3 NEW Hooks Required

| Hook | Purpose | Triggered By | Lifecycle Event | Priority | Effort |
|------|---------|-------------|-----------------|----------|--------|
| **`story-lifecycle`** | Enforce story-driven rules when @dev works on stories | @dev executing story | `tool.execute.before` + `tool.execute.after` | HIGH | 4-6h |
| **`quality-gate`** | Trigger QA review after story completion | @build after story execution | `tool.execute.after` (after task completion) | HIGH | 4-6h |
| **`wave-checkpoint`** | Trigger @po checkpoint between waves | @build at wave boundary | `event` (session.idle at wave boundary) | HIGH | 3-4h |
| **`agent-authority`** | Enforce file-write permissions per agent | Any agent writing files | `tool.execute.before` (write/edit tools) | MEDIUM | 3-4h |
| **`executor-resolver`** | Resolve executor agent from plan metadata | @build delegating tasks | `tool.execute.before` (task tool) | MEDIUM | 2-3h |
| **`decision-logger`** | Log architectural decisions during execution | Any agent making tech decisions | `tool.execute.after` | LOW | 2-3h |

**Count: 6 new hooks.**

#### Hook Detail: `story-lifecycle`

```
When: @dev is working on a story (detected via boulder state or skill context)
Before tool: 
  - Inject story file path into context
  - Inject constitutional gates (Article III: story must exist, not draft)
After tool:
  - After file writes: remind to update story File List
  - After test runs: remind to update story checkboxes
  - After completion: remind to run DoD checklist
```

#### Hook Detail: `quality-gate`

```
When: @build receives completed task result for a story with quality_gate field
After task tool completion:
  - Parse story metadata for quality_gate agent
  - Auto-inject: "Now delegate quality review to @{quality_gate}"
  - Quality gate agent returns: APPROVED / NEEDS_WORK / REJECT
  - APPROVED → mark story complete
  - NEEDS_WORK → retry with feedback (max 2 iterations)
  - REJECT → document and skip (escalate to user)
```

#### Hook Detail: `wave-checkpoint`

```
When: @build completes all items in a wave AND checkpoint_mode != "auto"
On session.idle:
  - Inject checkpoint prompt: "Wave N complete. Items completed: [...]. Next wave: [...]"
  - Delegate to @po for decision
  - GO → continue to next wave
  - PAUSE → save state, stop execution
  - REVIEW → present wave summary, await user input
  - ABORT → stop execution, document reason
```

#### Hook Detail: `agent-authority`

```
When: Any agent attempts to write/edit a file
Before write/edit tool:
  - Check agent identity against authority rules
  - @architect can write to docs/kord/plans/*/architecture.md, docs/kord/architecture/*
  - @sm can write to docs/kord/plans/*/stories/*
  - @pm can write to docs/kord/plans/*/prd.md
  - @devops ONLY agent that can run git push
  - @dev/@dev-junior can write to source code
  - Violation → inject warning (soft) or block (hard) based on config
```

#### Hook Detail: `executor-resolver`

```
When: @build calls task() tool
Before task tool execution:
  - Read current work item from boulder state
  - If work item has executor field → inject executor into task args
  - If work item has quality_gate → store for post-execution gate
  - If work item has load_skills → inject into task args
```

---

## 2. Existing OMOC Tools — Disposition

### 2.1 Tools That KEEP As-Is

| Tool | Purpose | Why KEEP |
|------|---------|----------|
| `lsp_goto_definition` | Navigate to definition | Code intelligence |
| `lsp_find_references` | Find all references | Code intelligence |
| `lsp_symbols` | List symbols | Code intelligence |
| `lsp_diagnostics` | Get errors/warnings | Verification |
| `lsp_prepare_rename` | Check rename validity | Code intelligence |
| `lsp_rename` | Rename across codebase | Code intelligence |
| `ast_grep_search` | Structural code search | Code intelligence |
| `ast_grep_replace` | Structural code replace | Code intelligence |
| `grep` | Text search | Utility |
| `glob` | File glob | Utility |
| `session_list` | List sessions | Session management |
| `session_read` | Read session | Session management |
| `session_search` | Search sessions | Session management |
| `session_info` | Session info | Session management |
| `call_kord_agent` | Invoke explore/librarian | Utility delegation |
| `background_output` | Get background result | Background management |
| `background_cancel` | Cancel background task | Background management |
| `interactive_bash` | Tmux bash | Tool support |
| `look_at` | Image/PDF analysis | Multimodal |
| `skill` | Execute skills | Skill system |
| `skill_mcp` | MCP for skills | MCP integration |
| `slashcommand` | Dispatch commands | Command system |

**Count: 22 tools — NO changes.**

### 2.2 Tools That MODIFY

| Tool | Modification | Effort |
|------|-------------|--------|
| `delegate-task` (task tool) | Add `executor` parameter for named agent routing. Add `story_path` parameter for story context. Add `wave` parameter for wave tracking. | 3-4h |
| `task_create` / `task_update` / `task_get` / `task_list` | Update to support story-aware task tracking (story ID, wave number). | 2-3h |

### 2.3 NEW Tools Required

| Tool | Purpose | Priority | Effort |
|------|---------|----------|--------|
| **`story_read`** | Read and parse story file (metadata, checkboxes, status) | HIGH | 2-3h |
| **`story_update`** | Update story checkboxes, status, Dev Agent Record | HIGH | 2-3h |
| **`plan_read`** | Read and parse plan document (waves, items, progress) | HIGH | 2-3h |
| **`squad_load`** | Load squad manifest, return agents/skills/template | MEDIUM | 2-3h |

**Count: 4 new tools.**

#### Tool Detail: `story_read`

```typescript
story_read({
  story_path: string,   // Path to story .md file
})
// Returns: {
//   id: string,
//   title: string,
//   executor: string,
//   quality_gate: string,
//   wave: number,
//   status: "draft" | "ready" | "in_progress" | "review" | "done",
//   acceptance_criteria: { text: string, completed: boolean }[],
//   tasks: { text: string, completed: boolean }[],
//   total_tasks: number,
//   completed_tasks: number,
// }
```

#### Tool Detail: `story_update`

```typescript
story_update({
  story_path: string,
  updates: {
    check_item?: number,     // Mark acceptance criteria N as complete
    check_task?: number,     // Mark task N as complete
    set_status?: string,     // Update story status
    append_dev_notes?: string,  // Append to Dev Notes section
    append_file_list?: string,  // Append to File List section
    append_change_log?: string, // Append to Change Log section
  }
})
```

#### Tool Detail: `plan_read`

```typescript
plan_read({
  plan_path: string,   // Path to PLAN.md
})
// Returns: {
//   name: string,
//   type: "development" | "task" | "research" | "mixed",
//   status: "draft" | "approved" | "in_progress" | "complete",
//   waves: {
//     number: number,
//     items: {
//       id: string,
//       type: "story" | "task",
//       title: string,
//       executor: string,
//       quality_gate?: string,
//       completed: boolean,
//       path?: string,  // Path to story file if story type
//     }[]
//   }[],
//   progress: { total: number, completed: number, percentage: number },
// }
```

---

## 3. Commands — Disposition

### 3.1 KEEP (from OMOC)

| Command | Agent | Changes |
|---------|-------|---------|
| `/plan "description"` | @plan | Add `--squad=X` parameter support |
| `/start-work [plan-name]` | @build | Add `--wave=N` and `--squad=X` parameters |
| `/stop-continuation` | (current) | No changes |
| `/init-deep` | (current) | Repurpose as `/init` — generates project AGENTS.md (like AIOS `*documentation`), analyzes project structure, saves to `.opencode/rules`. Follows AIOS-style deep project analysis. |

### 3.2 KEEP AS-IS (development modes)

| Command | Source | Decision | Rationale |
|---------|--------|----------|-----------|
| `/ralph-loop` | OMOC | **KEEP** | Claude Code plugin development mode. No rename. |
| `/cancel-ralph` | OMOC | **KEEP** | Paired with ralph-loop. No rename. |
| `/ulw-loop` | OMOC | **KEEP** | Ultra Work Loop — distinct development mode. NOT a duplicate. |
| `/refactor` | OMOC | **KEEP** | Already good name. |

### 3.3 NEW Commands

| Command | Agent | Purpose | Priority |
|---------|-------|---------|----------|
| `/checkpoint` | @po | Manually trigger checkpoint decision | MEDIUM |
| `/status` | @build | Show current plan progress, wave, items | MEDIUM |
| `/squad [name]` | @kord | Switch active squad context | LOW |

### 3.4 Star Commands (*) from AIOS

**Decision: HYBRID APPROACH.** Star commands are absorbed into the system at three layers, preserving AIOS UX without new infrastructure. See `kord-aios-star-commands-scripts-investigation.md` for full analysis.

| Layer | Context | Mechanism | Priority |
|-------|---------|-----------|----------|
| **executor-resolver hook** | @build autonomous loop | Plan item metadata auto-loads skill | Phase 1 |
| **@kord delegation table** | Direct user chat | Natural language routes to agent+skill | Phase 1 (exists) |
| **keyword-detector patterns** | AIOS compatibility | `*command` syntax triggers skill injection | Phase 3 |

**Star command mapping:**

| AIOS Command | Kord Layer | How |
|-------------|-----------|-----|
| `*develop` | executor-resolver | `executor: dev` → auto-loads `develop-story` skill |
| `*review` | executor-resolver | `quality_gate: qa` → auto-loads `qa-review-story` skill |
| `*push` | executor-resolver | `executor: devops` → auto-loads git-push workflow |
| `*create-prd` | executor-resolver | `executor: pm` → auto-loads `create-prd` skill |
| `*draft` | executor-resolver | `executor: sm` → auto-loads `create-next-story` skill |
| `*checkpoint` | wave-checkpoint hook | Triggered automatically between waves |
| `*documentation` | `/init` command | Generates project AGENTS.md |
| `*create-epic` | executor-resolver | `executor: pm` → auto-loads `create-epic` skill |

**AIOS backward compatibility** (Phase 3): `keyword-detector` hook already exists in OMOC. Add `*command` pattern matching — when agent sees `*develop AUTH-001` in user message, hook injects the corresponding skill context. This is syntactic sugar, not a separate system.

---

## 4. Summary — Engine Changes

| Category | Keep | Modify | New | Total |
|----------|------|--------|-----|-------|
| **Hooks** | 33 | 6 | 6 | 45 |
| **Tools** | 22 | 5 | 4 | 31 |
| **Commands** | 8 | 0 | 3 | 11 |

### Implementation Priority

**Phase 1 (Critical — enables story-driven flow):**
- MODIFY `build/` hook (story/task/wave parsing, executor delegation)
- MODIFY `start-work/` hook (extended boulder state)
- MODIFY `delegate-task` tool (executor parameter)
- NEW `plan_read` tool
- NEW `story_read` + `story_update` tools

**Phase 2 (High — enables quality gates):**
- NEW `quality-gate` hook
- NEW `wave-checkpoint` hook
- NEW `executor-resolver` hook
- MODIFY `plan-md-only/` hook

**Phase 3 (Medium — enforcement & observability):**
- NEW `agent-authority` hook
- NEW `story-lifecycle` hook
- NEW `squad_load` tool
- NEW `/checkpoint`, `/status` commands

**Phase 4 (Low — polish):**
- NEW `decision-logger` hook
- `/init` repurpose (AGENTS.md generation)
- `/squad` command
- `keyword-detector` `*command` pattern support (AIOS backward compat)
