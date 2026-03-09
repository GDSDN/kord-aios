# Draft: Framework & Methodology Gaps

## Research Completed (2026-03-03)

- [x] Explore: Init command analysis
- [x] Explore: Templates & methodology content
- [x] Explore: Squad loading, rules, Antigravity

---

## FINDINGS SUMMARY

### A. Init Creates (only)

| What | Location | Status |
|------|----------|--------|
| Story template | `.kord/templates/story.md` | ✓ |
| ADR template | `.kord/templates/adr.md` | ✓ |
| kord-rules | `kord-rules.md` (ROOT) | ✓ but NOT auto-loaded |
| Code squad | `.kord/squads/code/SQUAD.yaml` | ✓ |
| Config | `.opencode/kord-aios.json` | ✓ minimal |
| Output dirs | `docs/kord/{plans,drafts,notepads}` | ✓ |

### B. Init Does NOT Create

- Agents to `.opencode/agents/` (need `extract`)
- Skills to `.opencode/skills/` (need `extract`)
- Commands to `.opencode/commands/` (need `extract`)
- PRD/epic/task/QA-report/checklist templates (DON'T EXIST)

### C. kord-rules.md NOT Auto-Discovered

Rules-injector searches: `.github/instructions/`, `.cursor/rules/`, `.claude/rules/`, `docs/kord/rules/` — NOT project root.

### D. Antigravity Models are HARDCODED (not configurable)

### E. 144+ Skills Exist but Templates They Reference Don't

### F. `extract` Command Exists Separately (not called by init)

---

## USER REQUIREMENTS

- All in same update pack, ordered by dependency
- Methodology first (drives everything)
- Clarify: story vs task vs epic flow, QA role, kord-rules vs agent prompt
- Research → Analysis → Plan → Implementation (by parts)

## ROOT CAUSE: WHY ARTIFACTS AREN'T GENERATED

1. **Complexity gating** — Planner skips artifact swarm for Simple tasks
2. **No keyword trigger** — keyword-detector doesn't know "story"/"epic"/"prd"
3. **Build ignores stories** — only processes plan TODOs
4. **Templates don't exist** — SM/PM have no templates to reference

## OMOC COMPARISON

- Prompt ("how to work") vs Rules ("what constraints") = complementary
- kord-rules SHOULD exist as project constraints, NOT agent behavior
- Needs discoverable location (docs/kord/rules/) + updated content

## SYNKRA AIOS ANALYSIS (2026-03-03)

### Architecture: Constitution-Driven, Story-as-Execution-Unit

Synkra has a **Constitution** (`.aios-core/constitution.md`) with 6 articles. Key one:
> Article III — "Nenhum código é escrito sem uma story associada"

**Flow**: PM(PRD) → PM(Epic) → SM(Story) → PO(Validate) → Dev(Implement) → QA(Gate) → Done

**Stories are EXECUTION UNITS**, not documentation:
- Constitutional Gate BLOCKS dev from coding without a valid story file
- Story file tracks: status, tasks/subtasks, dev record, QA results, file list
- Status lifecycle: Draft → Approved → InProgress → Review → Done

### What Synkra Exports (946 files via install-manifest.yaml)

| Category | Count | Key Items |
|----------|-------|-----------|
| Templates | 28+ | story-tmpl.yaml (368 lines), prd-tmpl.yaml (202), qa-gate-tmpl.yaml (240), qa-report-tmpl.md (234), task-template.md (123), architecture-tmpl, brownfield variants |
| Agents | 12 | dev, sm, qa, pm, po, architect, analyst, ux, devops, data-engineer, aios-master, squad-creator |
| Tasks | 100+ | create-next-story (774 lines), dev-develop-story (910 lines), validate-next-story, qa-gate, etc. |
| Checklists | 15+ | Quality validation checklists |
| Hooks | Git hooks | Pre-push quality, post-commit validation |

### Agent-Template Binding

Agents declare dependencies in YAML frontmatter:
```yaml
dependencies:
  tasks: [develop-story.md, execute-subtask.md]
  templates: [story-tmpl.yaml, qa-report-tmpl.md]
```

Agents resolve commands to file paths:
- `@sm *draft` → `.aios-core/development/tasks/create-next-story.md`
- `@dev *develop` → `.aios-core/development/tasks/dev-develop-story.md`

### Key Difference: Synkra vs Kord

| Aspect | Synkra | Kord (current) |
|--------|--------|----------------|
| Execution unit | Story (constitutional mandate) | Plan TODO (flat list) |
| Artifact generation | Agent commands (`@sm *draft`) | Planner Artifact Swarm (complexity-gated) |
| Template system | 28 YAML/MD templates with elicit:true | 2 templates (story.md, adr.md) |
| Agent binding | Explicit dependencies in frontmatter | Implicit via skill names |
| Enforcement | Constitutional gates (BLOCK/WARN) | None (advisory only) |
| Trigger | User invokes agent command | Automatic (complexity threshold) |
| Story status | Tracked in file (Draft→Done) | Not tracked |
| QA | Mandatory gate before merge | Optional (TDD or agent QA) |
| Content volume | 946 files exported | ~15 files scaffolded |

### Coexistence Assessment: Plan + Stories

Synkra does NOT have a "Plan" concept like Kord's. They go PRD → Epic → Stories directly.

Kord's Plan fills a different niche: strategic planning with TODO decomposition.

**Possible coexistence model:**
- Plan = strategic document (scope, decisions, waves, dependencies)
- Stories = execution contracts derived FROM the plan
- Build could consume EITHER: plan TODOs (lightweight) OR stories (full methodology)
- The choice could be user/project configurable, not hardcoded

## RESOLVED DECISIONS (from interview)

1. **Adapt vs Port**: Adapt — curated subset, MD+frontmatter format ✅
2. **Coexistence model**: Stories as default, opt-out for speed ✅
3. **Trigger mechanism**: Planner elicitation question ✅
4. **Constitutional gates**: NOT porting ✅
5. **Content volume**: Curated subset (8 templates + 3 checklists) ✅
6. **kord-rules location**: Native in plugin at `src/agents/kord/` ✅
7. **Agent-template binding**: Via `template:` field in SKILL.md frontmatter ✅
8. **Complexity gating**: Replace with elicitation-based gating ✅

---

## ARCHITECTURE ANALYSIS: Commands/Skills vs Workflows/Scripts (2026-03-03)

### Kord's 4 Execution Layers (Evidence-Based)

| Layer | What It Is | How It Runs | Deterministic? | Example |
|-------|-----------|-------------|----------------|---------|
| **Commands** | Template strings (`.ts`) | User types `/cmd` → LLM receives prompt → LLM interprets | ❌ No | `/git-commit` → `git-commit.ts` is a prompt string |
| **Skills** | Markdown files (`SKILL.md`) | Agent loads skill → LLM reads → LLM follows | ❌ No | `git-master` SKILL.md = 1107 lines of instructions |
| **Tools** | TypeScript functions | LLM *calls* → code runs → returns result | ✅ Yes | `story_read` → parses MD, extracts frontmatter, returns JSON |
| **Hooks** | TypeScript interceptors | System events trigger code automatically | ✅ Yes | Build hook → detects idle, injects continuation prompt |

**Commands and Skills = PROMPTS (non-deterministic)**
**Tools and Hooks = CODE (deterministic)**

### Synkra Workflow Engine → Kord Equivalents

| Synkra Component | What It Does | Kord Equivalent | Status |
|-----------------|-------------|-----------------|--------|
| `workflow-executor.js` (1180L) | Reads YAML, dispatches phases, manages state | Build hook (921L) — reads plan MD, dispatches tasks, injects continuation | ✅ Exists |
| `wave-executor.js` (397L) | Parallel execution with dependency scheduling | Build hook `parsePlanWaves()` + `buildWaveContext()` | ✅ Exists |
| `story-manager.js` (375L) | CRUD on story files (parse, update status) | `story_read` + `story_update` tools | ✅ Exists |
| `decision-recorder.js` (168L) | Records decisions during execution | `decision_log` tool | ✅ Exists |
| `session-state.js` | Persists state across sessions | Boulder state (`src/features/boulder-state/`) | ✅ Exists |
| `checklist-runner.js` (327L) | **DETERMINISTIC** checklist validation (no AI) | **NOTHING** | 🔴 Gap |
| Workflow phase knowledge (SM→PO→Dev→QA) | Phase sequencing + retry on failure | **NOT in Build hook or agents** | 🔴 Gap |
| Story lifecycle management | Draft→Ready→InProgress→Review→Done tracking | `story_read` parses status but Build hook doesn't use it | 🟡 Partial |

### Key Evidence

**Build hook IS a workflow engine** (verified from `src/hooks/build/index.ts`):
- `parsePlanWaves()` at line 415 — parses plan for wave structure
- `buildTaskDelegationContext()` at line 446 — builds task-specific delegation with executor/verify/category/skills
- `injectContinuation()` at line 528 — auto-continues on session.idle
- `buildWaveContext()` at line 414 — shows wave progress to orchestrator
- Plan parser (`plan-parser.ts`) extracts: task number, title, completed, executor, verify, category, skills

**Build hook does NOT know about**:
- Story status transitions (only processes plan TODOs)
- Phase flow (SM→PO→Dev→QA with retry loops)
- Checklist validation (no deterministic checks)

### Actual Gaps to Fill

**Gap 1: Phase-flow knowledge** — Build processes waves of tasks but doesn't know "after SM, PO must validate, if PO rejects, SM fixes"

**Gap 2: Checklist runner** — Synkra validates artifacts with CODE (no AI). Kord relies on AI agents reading files.

**Gap 3: Story lifecycle in orchestration** — story_read/story_update tools exist but Build hook doesn't use them for status tracking.

### Architecture Decision: How to Fill Gaps

**Option A: Encode workflow knowledge in PROMPTS (lightweight)**
- Teach agents their role in story-development-cycle via enriched skills
- Add phase-flow knowledge to Build hook prompt (not code)
- Checklist validation by agent reading checklist template
- No new code engine needed

**Option B: Add deterministic orchestration CODE (heavier)**
- Add `checklist_runner` tool for programmatic validation
- Extend Build hook TypeScript with story-aware phase tracking
- More reliable but more engineering effort

**Recommendation: Option A + selective Option B**
- Encode workflow knowledge in agent prompts and skills (Plan 1)
- Add `checklist_runner` as a new tool (deterministic validation adds real value)
- Do NOT build a YAML workflow engine — Build hook already orchestrates

### PENDING USER DECISION
- Confirm approach: Option A + selective B?
- Should `checklist_runner` be a new tool in Plan 1?
- Or defer to Plan 2/3?
