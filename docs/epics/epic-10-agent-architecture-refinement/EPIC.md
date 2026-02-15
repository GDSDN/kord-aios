# EPIC-10: Agent Architecture Refinement — Delegation Model, Guardian Consciousness & Init-Deep

> **Wave**: A (no prerequisites — can start immediately)
> **Scope**: `src/agents/`, `src/features/builtin-commands/templates/init-deep.ts`
> **Estimate**: ~25h
> **Priority**: HIGH
> **Depends on**: EPIC-09 (completed)

---

## Objective

Refine the agent architecture to establish correct delegation hierarchy (Dev vs Dev-Junior), Build story awareness, Kord guardian consciousness, inter-agent communication, and a robust `/init-deep` command that adapts to project maturity (brownfield vs greenfield).

### Core Principles (NON-NEGOTIABLE)

1. **Dev = mode "all"** — invocable by Kord/Build for complex tasks, but Dev-Junior remains preferred for atomic delegations
2. **Dev-Junior = default executor** — `task(category=...)` spawns Dev-Junior. Dev is only called via `subagent_type="dev"` for complex multi-step work
3. **Build must know about stories** — the Execution Orchestrator needs awareness of the story-driven pipeline to discover plans, epics, stories
4. **Kord = Framework Guardian** — conscious of plugin architecture, agent contracts, delegation model, skill system
5. **No new legacy references** — all changes follow existing Kord AIOS identity conventions from EPIC-09

---

## Architectural Context

### Current Delegation Model

```
User Request → Kord (AIOS Master)
  → Simple: delegate directly via task()
  → Complex: Analyst → PM → SM → Dev pipeline

Kord → Build (Execution Orchestrator)
  → task(category="...") → spawns Dev-Junior (subagent)
  → task(subagent_type="dev") → spawns Dev (complex work)
  → task(subagent_type="qa|architect|...") → specialist agents

Dev (mode: "primary" → changing to "all")
  → Autonomous deep worker
  → Can be invoked BY Kord/Build for complex tasks
  → permission: call_kord_agent = "deny" (does not call other agents)

Dev-Junior (mode: "subagent")
  → Receives atomic tasks via category delegation
  → permission: call_kord_agent = "allow" (for explore/librarian only)
```

### Agent `@dev` References (Current State)

9 agent files reference `@dev` in avoidWhen, collaboration, or constraints sections.
These references are ambiguous — they don't clarify the Dev vs Dev-Junior distinction.

| File | Context | Current Text | Issue |
|------|---------|-------------|-------|
| `sm.ts` | avoidWhen | `"use @dev or @dev-junior"` | Already correct |
| `sm.ts` | collaboration | `@dev: You hand off stories to dev agents` | Ambiguous |
| `sm.ts` | pipeline | `Implementation (@dev)` | Should clarify both |
| `pm.ts` | avoidWhen | `"use @dev"` | Missing @dev-junior |
| `pm.ts` | role | `that's @dev` | Ambiguous |
| `pm.ts` | pipeline | `Implementation (@dev)` | Should clarify both |
| `po.ts` | avoidWhen | `"use @dev"` | Missing @dev-junior |
| `po.ts` | pipeline | `Implementation (@dev)` | Should clarify both |
| `po.ts` | collaboration | `@dev: Track story completion` | Ambiguous |
| `devops.ts` | avoidWhen | `"use @dev"` | Missing @dev-junior |
| `devops.ts` | constraints | `delegate to @dev` | Ambiguous |
| `devops.ts` | collaboration | `@dev: Receive code` | Ambiguous |
| `data-engineer.ts` | avoidWhen | `"use @dev"` | Missing @dev-junior |
| `data-engineer.ts` | collaboration | `@dev: Provide schemas` | Ambiguous |
| `ux-design-expert.ts` | avoidWhen | `"use @dev"` | Missing @dev-junior |
| `ux-design-expert.ts` | constraints | `specs for @dev` | Ambiguous |
| `ux-design-expert.ts` | collaboration | `@dev: Provide component specs` | Ambiguous |
| `squad-creator.ts` | avoidWhen | `"use @dev"` | Missing @dev-junior |
| `architect.ts` | boundaries | `@devops` | Correct (no @dev issue) |
| `kord.ts` | pipeline | `Dev (implementation)` | Ok — Kord orchestrates both |

### Build Agent (Current State)

Build's prompt (`build/default.ts`) defines:
- Identity as "Execution Orchestrator"
- Delegation via `task()` with category (Dev-Junior) or subagent_type (specialists)
- 6-section prompt structure for delegated tasks
- Mandatory verification after every delegation
- **No story/plan discovery** — Build assumes it receives a work plan, but doesn't know how to find plans, epics, or stories on disk

### Init-Deep (Current State)

`src/features/builtin-commands/templates/init-deep.ts` — 418 lines:
- Phase 1: Discovery (explore agents + bash + LSP)
- Phase 2: Scoring & Location Decision
- Phase 3: Generate AGENTS.md
- Phase 4: Review & Deduplicate
- Phase 5: Kord AIOS Context (agents, skills, commands, squads, methodology)
- **No brownfield/greenfield distinction** — always does same analysis
- **Phase 5 uses hardcoded agent tables** — not discovered dynamically
- **Missing framework consciousness section** — doesn't explain HOW the system works

---

## Acceptance Criteria

- [ ] Dev agent mode changed from `"primary"` to `"all"`
- [ ] All agent `@dev` references clarify Dev (complex) vs Dev-Junior (atomic) delegation
- [ ] Build prompt has `<framework>` section with story/plan awareness
- [ ] Kord prompt has `<SystemAwareness>` section with plugin architecture consciousness
- [ ] /init-deep has Phase 0: brownfield/greenfield detection
- [ ] /init-deep Phase 5 uses dynamic discovery instead of hardcoded tables
- [ ] /init-deep generates framework consciousness section in root AGENTS.md
- [ ] All existing tests pass (`bun test`)
- [ ] New tests validate all changes

---

## Stories

| ID | Story | Wave | Estimate | Dependencies | Status |
|----|-------|------|----------|-------------|--------|
| S01 | Dev — Mode "all" + Delegation Hierarchy Clarity | 1 | 3h | None | Pending |
| S02 | Build — Story/Plan Awareness + Framework Section | 1 | 3h | None | Pending |
| S03 | Kord — Guardian Consciousness (SystemAwareness) | 1 | 4h | None | Pending |
| S04 | Agent Communication — Inter-Agent Clarification | 2 | 2h | S01 | Pending |
| S05 | /init-deep — Brownfield/Greenfield Detection (Phase 0) | 2 | 3h | None | Pending |
| S06 | /init-deep — Phase 5 Dynamic Discovery + Framework Consciousness | 2 | 4h | S05 | Pending |
| S07 | Tests + Final Validation | 3 | 3h | S01-S06 | Pending |

**Wave Execution**:
- **Wave 1** (S01-S03): Core architecture — Dev mode, Build awareness, Kord consciousness (parallel)
- **Wave 2** (S04-S06): Communication + init-deep (S04 parallel with S05→S06)
- **Wave 3** (S07): Tests + validation (sequential)

---

## Story Details

### S01: Dev — Mode "all" + Delegation Hierarchy Clarity

**Files**: `src/agents/dev.ts`, `src/agents/sm.ts`, `src/agents/pm.ts`, `src/agents/po.ts`, `src/agents/devops.ts`, `src/agents/data-engineer.ts`, `src/agents/ux-design-expert.ts`, `src/agents/squad-creator.ts`

**Problem**: Dev is `mode: "primary"` but should be `mode: "all"` (invocable by Kord/Build for complex tasks). Multiple agents reference `@dev` ambiguously without clarifying the Dev vs Dev-Junior delegation model.

**Changes**:

1. **`dev.ts` line 17**: Change `const MODE: AgentMode = "primary"` → `"all"`

2. **`dev.ts` line 618**: Update description to reflect invocability:
   `"Senior Implementation Specialist. Autonomous deep worker... Invocable by orchestrators for complex multi-step tasks."`

3. **All 7 agent files** — Update `avoidWhen` arrays:
   - Where it says `"use @dev"` → `"use @dev-junior for atomic tasks, @dev for complex multi-step work"`
   - SM already correct: `"use @dev or @dev-junior"` → refine to clarify preference

4. **All 7 agent files** — Update `<collaboration>` sections:
   - Where `@dev` is listed → clarify: `@dev/@dev-junior: Implementation agents (Dev-Junior for atomic tasks, Dev for complex work)`
   - Keep reference style brief

5. **Pipeline descriptions** (sm.ts, pm.ts, po.ts):
   - `Implementation (@dev)` → `Implementation (@dev/@dev-junior)` or keep as `Implementation (Dev agents)`

6. **Constraints** (devops.ts, ux-design-expert.ts):
   - `delegate to @dev` / `specs for @dev` → `delegate to Dev agents` (covers both)

**No changes to**: Dev's prompt content, execution loop, skill delegation, tool restrictions

**Acceptance Criteria**:
- [ ] `dev.ts` mode is `"all"`
- [ ] Dev description mentions invocability
- [ ] All agent `@dev` refs clarify Dev vs Dev-Junior
- [ ] No functional behavior changes

---

### S02: Build — Story/Plan Awareness + Framework Section

**Files**: `src/agents/build/default.ts`, `src/agents/build/gpt.ts`

**Problem**: Build is the Execution Orchestrator but has no awareness of the story-driven pipeline. It doesn't know where plans, epics, or stories live on disk. When a user asks "what should we work on?", Build can't discover existing plans.

**Changes**:

1. **Add `<framework>` section** (after `<mission>`, before `<delegation_system>`):
   ```
   <framework>
   You operate within the Kord AIOS story-driven development pipeline.

   Work artifacts:
   - Plans: docs/kord/plans/*.md — structured work plans with waves and tasks
   - Drafts: docs/kord/drafts/*.md — plans in progress (deleted after finalization)
   - Notepads: docs/kord/notepads/{plan-name}/ — working memory per plan
   - Stories: Referenced within plans, contain tasks with acceptance criteria
   - Boulder state: docs/kord/boulder.json — persistent execution state

   When starting work:
   1. Check boulder.json for in-progress work
   2. If no active work, scan docs/kord/plans/ for available plans
   3. Present plan options to user with status summary
   4. Execute selected plan's tasks via delegation

   Plans reference stories. Stories contain atomic tasks. You execute tasks via task().
   </framework>
   ```

2. **Same section adapted for GPT model** in `gpt.ts`

3. **No changes to**: Delegation system, 6-section prompt structure, verification workflow

**Acceptance Criteria**:
- [ ] Build knows where plans/stories/boulder state live
- [ ] Build can discover available work
- [ ] Framework section in both default.ts and gpt.ts
- [ ] Delegation system unchanged

---

### S03: Kord — Guardian Consciousness (SystemAwareness)

**File**: `src/agents/kord.ts`

**Problem**: Kord is the AIOS Master but lacks explicit awareness of the plugin architecture. The AIOS "Orion" master had consciousness of every framework component and could self-analyze and propose optimizations. Kord needs similar awareness adapted to the plugin reality.

Many of these capabilities can be delivered via skills, but Kord's prompt needs the foundational knowledge of:
- What agents exist and their contracts (who calls whom)
- Where skills, squads, commands, and rules live
- How the delegation hierarchy works
- Where to look for framework components

**Changes**:

1. **Add `<SystemAwareness>` section** (after `<Framework>`, before delegation):

   ```
   <SystemAwareness>
   ## Plugin Architecture

   You are the master agent of the Kord AIOS plugin for OpenCode.

   ### Agent Hierarchy
   | Agent | Mode | Invoked By | Can Invoke |
   |-------|------|------------|------------|
   | kord | primary | user | all agents via task() |
   | build | primary | kord | dev-junior (category), specialists (subagent_type) |
   | dev | all | kord, build | explore, librarian (no task()) |
   | dev-junior | subagent | build (category) | explore, librarian |
   | plan | subagent | kord | none |
   | qa, architect, analyst... | subagent | kord, build | limited (explore, librarian) |

   ### Delegation Model
   - task(category="...") → spawns Dev-Junior with domain skills
   - task(subagent_type="dev") → spawns Dev for complex multi-step work
   - task(subagent_type="agent-name") → spawns specialist agent
   - Dev-Junior is the DEFAULT executor for atomic tasks
   - Dev is reserved for complex, multi-file, multi-step implementation

   ### Framework Locations
   | Component | Location |
   |-----------|----------|
   | Plans | docs/kord/plans/*.md |
   | Drafts | docs/kord/drafts/*.md |
   | Notepads | docs/kord/notepads/{plan}/ |
   | Boulder state | docs/kord/boulder.json |
   | Skills (builtin) | loaded via plugin |
   | Skills (project) | .kord/skills/, .opencode/skills/ |
   | Squads | .kord/squads/, .opencode/squads/, docs/kord/squads/ |
   | Rules | docs/kord/rules/, .claude/rules/ |
   | Templates | .kord/templates/ |
   | Root knowledge | ./AGENTS.md (loaded by OpenCode natively) |

   ### Self-Analysis
   When asked about framework health, agent performance, or system optimization:
   1. Read relevant configuration files and agent definitions
   2. Check skill availability and coverage
   3. Analyze delegation patterns and bottlenecks
   4. Propose specific, actionable improvements
   </SystemAwareness>
   ```

2. **Keep existing**: `<Framework>` section, delegation protocol, skill flow

**Acceptance Criteria**:
- [ ] Kord knows the full agent hierarchy and delegation model
- [ ] Kord knows where every framework component lives
- [ ] Kord can reason about system health and propose improvements
- [ ] Existing orchestration behavior preserved

---

### S04: Agent Communication — Inter-Agent Clarification

**Files**: `src/agents/pm.ts`, `src/agents/sm.ts`, `src/agents/po.ts` (process agents)

**Problem**: Process agents (PM, SM, PO) sometimes need clarification from each other during execution. Currently, all communication is orchestrator-mediated — an agent returns to Kord/Build, which then delegates to another agent. For tightly coupled process agents, limited direct communication improves autonomy.

**Changes**:

1. **PM prompt** — Add to collaboration section:
   - `When needing story-level clarification, you can request @sm consultation via call_kord_agent`
   - This doesn't change PM's tool config — PM is a subagent and call_kord_agent behavior depends on its agent config

2. **SM prompt** — Add to collaboration section:
   - `When needing product clarification, you can request @pm or @po consultation via call_kord_agent`

3. **PO prompt** — Add to collaboration section:
   - `When needing story details, you can request @sm consultation via call_kord_agent`

4. **Tool config review**: Verify that these agents have `call_kord_agent` accessible (not blocked). If blocked, evaluate whether to unblock for explore/librarian/process-agents only.

**Scope limitation**: This is prompt-level awareness only. If tool restrictions prevent actual inter-agent calls, document it as a follow-up for tool config changes.

**Acceptance Criteria**:
- [ ] Process agents know they can request clarification from peers
- [ ] Collaboration sections updated with call_kord_agent guidance
- [ ] No changes to non-process agents

---

### S05: /init-deep — Brownfield/Greenfield Detection (Phase 0)

**File**: `src/features/builtin-commands/templates/init-deep.ts`

**Problem**: /init-deep treats all projects identically. A mature codebase with extensive git history, CI, and tests (brownfield) needs different treatment than a fresh project (greenfield). The AIOS framework's claude.md generator uses this distinction to adapt its analysis strategy.

**Changes**:

1. **Add Phase 0: Project Maturity Detection** (before Phase 1):

   ```
   ## Phase 0: Project Maturity Detection

   **Before discovery, classify the project.**

   ```bash
   # Maturity signals
   git_commits=$(git rev-list --count HEAD 2>/dev/null || echo 0)
   has_ci=$(test -d .github/workflows && echo "yes" || echo "no")
   has_tests=$(find . -type f \( -name "*.test.*" -o -name "*.spec.*" \) -not -path '*/node_modules/*' | head -1)
   has_readme=$(test -f README.md && echo "yes" || echo "no")
   existing_agents=$(find . -name "AGENTS.md" -not -path '*/node_modules/*' | wc -l)
   total_files=$(find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | wc -l)
   ```

   | Signal | Brownfield | Greenfield |
   |--------|-----------|------------|
   | Git commits | >50 | <10 |
   | CI/CD | Present | Absent |
   | Test files | Present | Absent |
   | Source files | >20 | <20 |
   | Existing AGENTS.md | >0 | 0 |

   **Classification**:
   - **Brownfield**: ≥3 brownfield signals → RESPECT existing patterns, extract conventions
   - **Greenfield**: ≥3 greenfield signals → ESTABLISH conventions, focus on architecture
   - **Hybrid**: Mixed signals → treat as brownfield (safer, respects what exists)

   **Adaptation**:
   - Brownfield: Heavier discovery (more explore agents), deeper convention extraction, preserve existing AGENTS.md structure where solid
   - Greenfield: Lighter discovery, focus on tech stack detection, establish foundational AGENTS.md with recommended conventions
   ```

2. **Add maturity to TodoWrite**: New task `{ id: "maturity", content: "Detect project maturity (brownfield/greenfield)", status: "pending", priority: "high" }`

3. **Phase 1 adaptation**: Reference maturity result to calibrate explore agent count and analysis depth

**Acceptance Criteria**:
- [ ] Phase 0 detects brownfield/greenfield/hybrid
- [ ] Classification influences Phase 1 strategy
- [ ] Brownfield respects existing patterns
- [ ] Greenfield establishes conventions

---

### S06: /init-deep — Phase 5 Dynamic Discovery + Framework Consciousness

**File**: `src/features/builtin-commands/templates/init-deep.ts`

**Problem**: Phase 5 hardcodes agent tables, skill lists, and command lists. These should be discovered dynamically. Additionally, the generated AGENTS.md lacks a "framework consciousness" section that explains HOW the Kord AIOS system works — not just what agents exist.

**Changes**:

1. **Phase 5a (Agents)**: Replace hardcoded table with discovery instructions:
   ```
   ### 5a. Active Agents

   Discover agents dynamically — do NOT use a hardcoded list:

   ```bash
   # Find agent source files
   find {plugin_agents_dir} -name "*.ts" -maxdepth 2 | grep -v test | grep -v types
   ```

   If agent source is not accessible (plugin is compiled), use the known agent registry:
   - Read the root AGENTS.md for previously documented agents
   - Check opencode.json for plugin configuration
   - Use call_kord_agent to query available agents

   Generate the agent table from discovered data. Include:
   | Agent | Role | Mode | Delegation |
   |-------|------|------|------------|
   ```

2. **Phase 5b (Skills)**: Already uses `find` — good. Strengthen with:
   - Read SKILL.md frontmatter for description and tags
   - Group skills by domain

3. **Phase 5e (Methodology)**: Keep existing but add framework consciousness section:

   ```
   ### 5f. Framework Consciousness

   Add a section that explains HOW the system works, not just what exists:

   ```markdown
   ## HOW KORD AIOS WORKS

   ### Delegation Model
   - Kord (master) orchestrates all work via task()
   - task(category="...") → Dev-Junior (atomic tasks with domain skills)
   - task(subagent_type="dev") → Dev (complex multi-step implementation)
   - task(subagent_type="agent") → Specialist agent
   - Dev-Junior is the DEFAULT executor. Dev is for complex work only.

   ### Story-Driven Pipeline
   PRD (@pm) → Epic → Stories (@sm) → Validation (@po) → Waves → Implementation → Verification

   ### Skill System
   Skills are SKILL.md files injected into agents during delegation via load_skills=[].
   Built-in skills come from the plugin. Project skills live in .kord/skills/.

   ### Continuation
   Boulder state (docs/kord/boulder.json) persists execution across sessions.
   Ralph Loop enables self-referential continuation until task completion.
   ```
   ```

4. **Phase ordering**: Insert Phase 5f after 5e (methodology)

**Acceptance Criteria**:
- [ ] Agent table discovery is dynamic, not hardcoded
- [ ] Skills include frontmatter metadata
- [ ] Framework consciousness section explains delegation, pipeline, skills, continuation
- [ ] Generated AGENTS.md is self-documenting for new AI sessions

---

### S07: Tests + Final Validation

**Files**: `src/agents/prompt-refinement.test.ts` (extend), new tests as needed

**Changes**:

1. **Dev mode test**: Verify `createDevAgent.mode === "all"`
2. **Dev delegation refs**: Verify Dev-Junior is mentioned in collaboration sections
3. **Build framework test**: Verify Build prompt contains `<framework>` with plan/story references
4. **Kord SystemAwareness test**: Verify Kord prompt contains `<SystemAwareness>` section
5. **Init-deep maturity test**: Verify init-deep template contains "Phase 0" and "brownfield"
6. **Init-deep framework consciousness test**: Verify template contains "HOW KORD AIOS WORKS"
7. **Full suite**: `bun test` must pass with 0 failures
8. **No regressions**: All EPIC-09 tests still pass

**Acceptance Criteria**:
- [ ] All new tests pass
- [ ] All existing tests pass
- [ ] `bun test` full suite green
- [ ] No regressions from EPIC-09

---

## Deferred Items

### Squad Creator Architecture (Future EPIC)

**Reason**: Squads are a complex subsystem — essentially scoped plugins with their own agents, skills, tools, and workflows. The current squad infrastructure (SQUAD.yaml, squad-load tool, /squad command) exists but the Squad Creator prompt needs deeper alignment with how squads translate to the plugin format.

**Key questions for future EPIC**:
- How do squad agent personas (.md files) become executable agents?
- Should squad primaries have orchestrator-level access (task() tool)?
- How do squads compose with the existing delegation hierarchy?
- What's the relationship between squads and categories?

---

## File Ownership

```
src/agents/
  dev.ts                     → S01: Mode "all" + description
  sm.ts                      → S01: Delegation refs
  pm.ts                      → S01: Delegation refs + S04: Communication
  po.ts                      → S01: Delegation refs + S04: Communication
  devops.ts                  → S01: Delegation refs
  data-engineer.ts           → S01: Delegation refs
  ux-design-expert.ts        → S01: Delegation refs
  squad-creator.ts           → S01: Delegation refs
  build/default.ts           → S02: Framework section
  build/gpt.ts               → S02: Framework section
  kord.ts                    → S03: SystemAwareness section
  prompt-refinement.test.ts  → S07: Test updates

src/features/builtin-commands/templates/
  init-deep.ts               → S05: Phase 0 + S06: Phase 5 enrichment
```

## Notes

- Dev mode "all" means Dev can be invoked as both a primary agent (user-facing) and as a subagent (invoked by Kord/Build). This doesn't change Dev's internal behavior — it still runs autonomously with its full prompt.
- The `<SystemAwareness>` section in Kord is static knowledge in the prompt. Dynamic awareness (current skill inventory, active squads, plan status) comes from skills and tools at runtime.
- Init-deep's framework consciousness section will be the most impactful change — it makes every new AI session immediately aware of how the entire system works.
- Process agent communication (S04) is prompt-level guidance only. Actual tool access depends on agent config `permission` settings which may need separate changes.
