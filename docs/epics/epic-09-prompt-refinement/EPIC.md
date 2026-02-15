# EPIC-09: Agent Prompt Refinement — Kord AIOS Identity & Methodology Integration

> **Wave**: A (no prerequisites — can start immediately)
> **Scope**: `src/agents/` prompts + co-located tests
> **Estimate**: ~30h
> **Parallel OK with**: EPIC-08 S05 (documentation)
> **Priority**: CRITICAL

---

## Objective

Refine all 20+ agent prompts to establish a cohesive **Kord AIOS identity** with proper methodology integration. Remove all legacy system references (OMOC, Synkra, merge markers), establish Kord as the AIOS Master and Guardian, and ensure each agent carries the correct methodology adapted to the Kord AIOS execution engine.

### Core Principles (NON-NEGOTIABLE)

1. **Kord = AIOS Master + Primary Orchestrator** — Guardian of the entire story-driven development process, not just a task router
2. **No legacy references** — Agents are Kord AIOS. No "(AIOS Merge)", no "OMOC", no "Synkra". They carry no memory of other systems
3. **1:1 prompt comparison** — Each agent compared against original sources, methodology preserved with engine adaptations
4. **Skill flow is settled** — Orchestrators pass skills during delegation via `load_skills`. Subagents are stateless and receive skill content pre-injected. No architectural changes needed

---

## Architectural Context: Skill Flow

Understanding the skill flow is critical for knowing what each agent prompt needs:

```
Orchestrator (Kord/Dev/Build)
  → sees skills table via buildCategorySkillsDelegationGuide() at agent creation
  → evaluates which skills match the task domain
  → calls task(load_skills=["skill-1", ...], category="...", prompt="...")
  → delegate-task tool resolves skill names → SKILL.md content
  → injects skill content as systemContent into subagent session
  → subagent receives skill instructions as part of their context
```

**Implications for prompts**:
- **Orchestrators** (Kord, Dev, Build): Already have skill delegation protocol via dynamic builder. Need framework governance awareness.
- **Subagents** (all others): Do NOT need skill-loading instructions. They receive skills as context. They need **framework awareness** — understanding where they fit in the Kord AIOS pipeline.

## Agent Tiers

| Tier | Agents | Prompt Focus |
|------|--------|-------------|
| **T1: Orchestrators** | Kord, Dev, Build | Framework governance, skill delegation, process oversight |
| **T2: Process** | PM, PO, SM | Development methodology pipeline, framework context |
| **T3: Review** | QA, Analyst | Quality gates, merge label cleanup, framework context |
| **T4: Plan** | Plan Analyzer, Plan Reviewer | Story-driven framework awareness |
| **T5: Specialists** | Architect, DevOps, Data Engineer, UX, Squad Creator | Domain methodology + framework context |
| **T6: Utility** | Explore, Librarian, Vision, Dev-Junior | Minimal identity alignment |

---

## Acceptance Criteria

- [x] Zero occurrences of "(AIOS Merge)", "OMOC", "Synkra" in any agent prompt string
- [x] Kord prompt explicitly identifies as AIOS Master + Primary Orchestrator with pipeline governance
- [x] All AIOS-origin agents carry methodology adapted to Kord AIOS engine (no raw Synkra patterns)
- [x] All OMOC-origin agents carry execution engine adapted to Kord AIOS framework (story-driven awareness)
- [x] Merged agents have naturally integrated content (no merge markers)
- [x] `wave1-prompt-updates.test.ts` updated to match refined prompts
- [x] New test file `prompt-refinement.test.ts` validates all refined content
- [x] All existing tests pass (`bun test`) — 208/208 pass, 0 fail
- [x] No prompt references legacy persona names, mythology, or external systems

---

## Stories

| ID | Story | Wave | Estimate | Dependencies | Status |
|----|-------|------|----------|-------------|--------|
| S01 | Kord — AIOS Master Identity + Framework Governance | 1 | 5h | None | ✅ Done |
| S02 | Dev — Builder Principles Integration + Story Awareness | 1 | 3h | None | ✅ Done |
| S03 | Build — Framework Orchestrator Alignment | 1 | 2h | None | ✅ Done |
| S04 | PM — PRD Pipeline Methodology Refinement | 2 | 3h | S01 (framework defined) | ✅ Done |
| S05 | PO — Backlog Quality Gate Methodology | 2 | 2h | S01 | ✅ Done |
| S06 | SM — Story Creation Rigor + Stateless Dev Awareness | 2 | 3h | S01 | ✅ Done |
| S07 | QA — Merge Label Cleanup + Framework Context | 2 | 2h | S01 | ✅ Done |
| S08 | Analyst — Merge Label Cleanup + Research Scope | 2 | 1h | S01 | ✅ Done |
| S09 | Plan Reviewer + Plan Analyzer — Story-Driven Framework | 3 | 2h | S01 | ✅ Done |
| S10 | Architect + DevOps — Framework Context + Methodology | 3 | 2h | S01 | ✅ Done |
| S11 | Data Engineer + UX + Squad Creator — Specialist Methodology | 3 | 3h | S01 | ✅ Done |
| S12 | Utility Agents + Dev-Junior — Identity Alignment | 4 | 1h | S01 | ✅ Done (clean) |
| S13 | Test Updates + Final Validation | 4 | 2h | S01-S12 | ✅ Done |

**Wave Execution**:
- **Wave 1** (S01-S03): Core orchestrators — defines the framework context that all others reference
- **Wave 2** (S04-S08): Process + review pipeline — parallel within wave
- **Wave 3** (S09-S11): Plan agents + specialists — parallel within wave
- **Wave 4** (S12-S13): Cleanup + validation — sequential

---

## Story Details

### S01: Kord — AIOS Master Identity + Framework Governance

**File**: `src/agents/kord.ts`
**Compare with**: Synkra AIOS PM "Bob mode" orchestration + OMOC Sisyphus

**Problem**: Kord is currently identified as "Primary Orchestrator" but lacks the **AIOS Master** role — guardian of the entire story-driven development process. In Synkra AIOS, the PM in "Bob mode" orchestrated the pipeline (PRD → Epic → Stories → Execution). In Kord AIOS, Kord absorbs this role entirely.

**Changes**:

1. **`<Role>` section** (line 165-193):
   - Identity: `"Kord" — AIOS Master and Primary Orchestrator of Kord AIOS`
   - Add AIOS Master responsibility: guardian of the story-driven development pipeline
   - Add pipeline awareness: PRD → Epic → Wave → Story → Implementation → Verification → Delivery
   - Kord governs this pipeline end-to-end — not just routing tasks

2. **Add `<Framework>` section** (new, after `<Role>`):
   - Brief description of the Kord AIOS development pipeline
   - When a user asks for a feature: Analyst → PM (PRD) → SM (Stories) → Dev (Implementation)
   - When a user asks for quick fix: Assess → Delegate directly to Dev/category
   - Pipeline is optional for simple tasks but MANDATORY for complex/multi-step work
   - Kord decides when to follow full pipeline vs shortcut

3. **Delegation Check** (line 226-232):
   - Strengthen process-awareness: "Is this a feature that needs the full pipeline?"
   - Add: "For complex features: follow Analyst → PM → SM → Dev pipeline"
   - Keep existing skill delegation protocol (already there via dynamic builder)

4. **No changes to**: Phase 0-3 execution (these are solid OMOC engine), dynamic prompt builder integration, task management

**Acceptance Criteria**:
- [ ] Prompt contains "AIOS Master" identity
- [ ] Prompt contains development pipeline description
- [ ] Prompt contains process-aware delegation logic
- [ ] No references to Sisyphus, OMOC, or external systems
- [ ] Existing Phase 0-3 behavior preserved

---

### S02: Dev — Builder Principles Integration + Story Awareness

**File**: `src/agents/dev.ts`
**Compare with**: Synkra AIOS dev.md (Dex, Builder) + OMOC Hephaestus

**Problem**: Line 153 has `## Builder Principles (AIOS Merge)` — a merge marker that makes no sense to the agent. The 3 builder principles should be naturally integrated into the Development Methodology section.

**Changes**:

1. **Merge `## Builder Principles (AIOS Merge)`** (line 153-157) into `## Development Methodology` (line 145-151):
   - Move "Treat requirements as contracts" → add to Development Methodology bullets
   - Move "Always present choices as numbered options" → add to Development Methodology bullets
   - Move "Prefer explicit verification over assumptions" → already covered by "Evidence-based completion", merge or strengthen
   - DELETE the `## Builder Principles (AIOS Merge)` header entirely

2. **Add story structure awareness** (brief, after Development Methodology):
   - When Dev receives a story via `story_path`, it knows the standard story format
   - Stories contain: frontmatter (status, metadata), tasks (checkboxes), acceptance criteria, technical context
   - Dev executes tasks sequentially, updating progress

3. **No changes to**: Execution loop (Phase 0, explore-first), session continuity, core principle "KEEP GOING", GPT 5.2 reasoning nudge

**Acceptance Criteria**:
- [ ] No "(AIOS Merge)" text in prompt
- [ ] Builder principles naturally integrated into Development Methodology
- [ ] Brief story structure awareness present
- [ ] OMOC execution engine fully preserved

---

### S03: Build — Framework Orchestrator Alignment

**File**: `src/agents/build/default.ts`, `src/agents/build/gpt.ts`
**Compare with**: OMOC Atlas orchestrator

**Problem**: Build is already well-structured but its identity says "Master Orchestrator" which conflicts with Kord as AIOS Master. Build should be the **Execution Orchestrator** — it executes work plans, while Kord is the Master.

**Changes**:

1. **Identity** (`default.ts` line 13, `gpt.ts` equivalent):
   - Change "Master Orchestrator" → "Execution Orchestrator" or "Plan Executor"
   - Clarify: Build executes work plans created by Kord/Plan agent
   - Build delegates to specialists, Kord governs the pipeline

2. **Framework context** (brief):
   - Build operates within the story-driven framework
   - Work plans reference stories, stories reference epics
   - Build's job: complete ALL tasks in the plan, verify each

3. **No changes to**: 6-section prompt structure, delegation system, category/skill integration

**Acceptance Criteria**:
- [ ] Identity distinguishes Build from Kord (execution vs governance)
- [ ] Brief framework context present
- [ ] Delegation system unchanged

---

### S04: PM — PRD Pipeline Methodology Refinement

**File**: `src/agents/pm.ts`
**Compare with**: Synkra AIOS pm.md (Morgan, Strategist)

**Problem**: Current PM prompt has basic PRD structure but misses the epic structuring methodology from Synkra. PM's PRDs are the foundation of the development pipeline — they must be specific enough for SM to create self-contained stories.

**Changes**:

1. **Add framework context** (new section in prompt):
   - PM's PRDs feed into the story-driven development pipeline
   - PRD → SM creates stories → Dev implements → Verification
   - PRDs must be specific enough for stateless Dev agents (who can't ask PM for clarification)

2. **Strengthen epic structuring** (from Synkra methodology):
   - Epics contain waves of parallel stories
   - Wave structure enables parallel development
   - Stories within a wave must be independent

3. **Strengthen PRD quality gate**:
   - Every requirement must be testable
   - Every feature must have clear acceptance criteria
   - Technical constraints must be explicit (not assumed)

4. **Remove**: Any implicit Synkra references, persona language

**Compare 1:1 with Synkra PM**: Keep PRD structure template, epic management methodology, product strategy approach. Drop: Bob mode orchestration (Kord's job), TerminalSpawner, session management, command system.

**Acceptance Criteria**:
- [ ] Framework context connects PM to the pipeline
- [ ] Epic structuring with waves described
- [ ] PRD quality requirements strengthened
- [ ] No legacy references

---

### S05: PO — Backlog Quality Gate Methodology

**File**: `src/agents/po.ts`
**Compare with**: Synkra AIOS po.md (Pax, Balancer)

**Problem**: PO has a good story validation checklist but lacks backlog management methodology and framework context. PO is the quality gate — stories don't enter development without PO validation.

**Changes**:

1. **Add framework context**:
   - PO is the quality gate between story creation (SM) and implementation (Dev)
   - Stories must pass PO validation before entering the wave execution pipeline
   - PO ensures backlog health and priority alignment

2. **Strengthen backlog management** (from Synkra methodology):
   - Backlog hygiene: regular review, priority recalibration
   - Story readiness criteria: stories must be "Ready" before wave inclusion
   - Dependency tracking between stories

3. **Keep**: Story validation checklist (already good from Synkra), constraints, collaboration

4. **Remove**: PM tool integrations (ClickUp, Jira — now via skills), command system, persona language

**Acceptance Criteria**:
- [ ] Framework context positions PO as quality gate
- [ ] Backlog management principles present
- [ ] Story validation checklist preserved
- [ ] No legacy references

---

### S06: SM — Story Creation Rigor + Stateless Dev Awareness

**File**: `src/agents/sm.ts`
**Compare with**: Synkra AIOS sm.md (River, Facilitator)

**Problem**: SM has a good story structure template but misses the critical Synkra principle: **Dev agents are stateless — stories must be self-contained with ALL context**. SM's original `create-next-story` procedure was rigorous about sourcing information from PRDs and architecture docs.

**Changes**:

1. **Add critical principle** (HIGHEST PRIORITY):
   - Dev agents are STATELESS. They cannot access PRDs, architecture docs, or previous context
   - Stories MUST be self-contained: all technical context, constraints, and requirements IN the story
   - If a Dev agent needs information to implement a task, that information must be in the story file

2. **Strengthen story creation procedure** (from Synkra methodology):
   - All information MUST come from PRD and Architecture documents
   - SM reads source docs, extracts relevant context, embeds it in the story
   - Story tasks must be atomic and sequentially executable
   - Each task must have clear acceptance criteria

3. **Add framework context**:
   - SM creates stories that feed into the wave execution pipeline
   - Stories are the contract between process (PM/PO) and execution (Dev)
   - Wave assignment: independent stories can run in parallel

4. **Keep**: Story structure template (mandatory), constraints, collaboration

**Acceptance Criteria**:
- [ ] Stateless Dev agent awareness is explicit and prominent
- [ ] Story creation procedure strengthened
- [ ] Framework context connects SM to the pipeline
- [ ] Story structure template preserved

---

### S07: QA — Merge Label Cleanup + Framework Context

**File**: `src/agents/qa.ts`
**Compare with**: Synkra AIOS QA + OMOC Momus (plan reviewer aspect)

**Problem**: Line 18 has `## Quality Advisory Principles (AIOS Merge)` — merge marker.

**Changes**:

1. **Rename section**: `## Quality Advisory Principles (AIOS Merge)` → `## Quality Advisory Principles`
2. **Add framework context** (brief):
   - QA reviews work plans in the context of story-driven development
   - Plans reference stories, stories have specific structure (tasks, acceptance criteria)
   - QA validates that plans are executable within this framework
3. **Keep**: Everything else — OKAY/REJECT framework, risk-based review, requirements traceability, gate governance

**Acceptance Criteria**:
- [ ] No "(AIOS Merge)" text
- [ ] Framework context present
- [ ] All review methodology preserved

---

### S08: Analyst — Merge Label Cleanup + Research Scope

**File**: `src/agents/analyst.ts`
**Compare with**: Synkra AIOS analyst.md (Atlas, Decoder) + OMOC Metis

**Problem**: Line 36 has `## Strategic Research & Ideation (AIOS Merge)` — merge marker. Content underneath says "You also cover:" which implies an add-on rather than native capability.

**Changes**:

1. **Rename section**: `## Strategic Research & Ideation (AIOS Merge)` → `## Strategic Research & Ideation`
2. **Rephrase "You also cover:"** → integrate as native capabilities, not an add-on
3. **Keep**: Intent classification (6 modes), analysis methodology, action-oriented outputs, all 365 lines of methodology

**Acceptance Criteria**:
- [ ] No "(AIOS Merge)" text
- [ ] Research scope presented as native capability
- [ ] All analysis methodology preserved

---

### S09: Plan Reviewer + Plan Analyzer — Story-Driven Framework

**Files**: `src/agents/plan-reviewer.ts`, `src/agents/plan-analyzer.ts`
**Compare with**: OMOC Momus (reviewer), OMOC Metis (analyzer)

**Problem**: These are OMOC-origin agents with focused roles in the plan system. They work correctly but lack awareness of the story-driven framework they operate within.

**Changes (Plan Reviewer)**:
1. Add brief framework context: plans serve the story-driven development process
2. Review criteria should note: plans may reference story files, stories have specific structure
3. Keep: OKAY/REJECT framework, blocker-focused review, approval bias

**Changes (Plan Analyzer)**:
1. Add framework context for intent classification: tasks exist within the story-driven pipeline
2. Plans serve stories → stories serve epics → epics serve the product
3. Keep: 6 analysis modes, gap analysis, all methodology

**Acceptance Criteria**:
- [ ] Both agents have brief framework context
- [ ] Review/analysis methodology fully preserved
- [ ] No legacy references

---

### S10: Architect + DevOps — Framework Context + Methodology

**Files**: `src/agents/architect.ts`, `src/agents/devops.ts`
**Compare with**: Synkra AIOS architect/devops + OMOC Oracle

**Changes (Architect)**:
1. Minimal — already well-integrated
2. Verify no hidden merge/legacy references
3. Add brief note: architectural decisions serve the story-driven development process
4. Keep: All architectural principles, decision framework, responsibility boundaries

**Changes (DevOps)**:
1. Strengthen pipeline methodology (from Synkra's detailed workflow)
2. Add framework context: CI/CD serves the story-driven pipeline
3. Stories lead to branches, branches lead to PRs, PRs go through quality gates
4. Keep: Core principles, constraints, collaboration

**Acceptance Criteria**:
- [ ] Architect has no legacy references
- [ ] DevOps has strengthened pipeline methodology
- [ ] Both have framework context

---

### S11: Data Engineer + UX Design Expert + Squad Creator — Specialist Methodology

**Files**: `src/agents/data-engineer.ts`, `src/agents/ux-design-expert.ts`, `src/agents/squad-creator.ts`
**Compare with**: Synkra AIOS originals (Dara, Uma, Craft)

**Changes (Data Engineer)**:
1. Strengthen operational methodology: migration safety workflow, RLS audit patterns
2. Add framework context: DB work is story-driven, migrations are versioned and reviewable
3. Keep: Core principles (correctness, versioning, security, idempotency)

**Changes (UX Design Expert)**:
1. **Remove TSDoc comment**: `Based on Synkra AIOS ux-design-expert.md.` (line 10)
2. Strengthen phased design workflow reference (Research → Audit → Tokens → Build → Quality)
3. Add framework context: design work serves stories, outputs feed into Dev implementation
4. Keep: Sally+Brad hybrid philosophy, Atomic Design, accessibility focus

**Changes (Squad Creator)**:
1. Strengthen squad design methodology: research-first, task-first architecture
2. Add framework context: squads are created to serve specific project domains
3. Keep: Mandatory squad structure, creation workflow, quality gates

**Acceptance Criteria**:
- [ ] UX has no "Synkra" reference in TSDoc
- [ ] All three have strengthened methodology
- [ ] All three have framework context
- [ ] Core principles preserved for each

---

### S12: Utility Agents + Dev-Junior — Identity Alignment

**Files**: `src/agents/explore.ts`, `src/agents/librarian.ts`, `src/agents/vision.ts`, `src/agents/dev-junior/`
**Compare with**: OMOC originals

**Problem**: These are utility/tool agents. Changes should be minimal — verify Kord AIOS identity in descriptions, no methodology changes.

**Changes**:
1. Verify each agent description includes "Kord AIOS" branding (already done in most cases)
2. Verify no legacy references (Sisyphus, OMOC, mythology)
3. Dev-Junior: verify identity alignment, no legacy references
4. No methodology changes — these are focused tools

**Acceptance Criteria**:
- [ ] All descriptions include Kord AIOS branding
- [ ] No legacy references
- [ ] Functionality preserved

---

### S13: Test Updates + Final Validation

**Files**: `src/agents/wave1-prompt-updates.test.ts`, new `src/agents/prompt-refinement.test.ts`

**Problem**: `wave1-prompt-updates.test.ts` has tests checking for "(AIOS Merge)" markers and "OMOC" references that will break after refinement.

**Changes**:

1. **Update `wave1-prompt-updates.test.ts`**:
   - Test descriptions: remove "AIOS merge", "OMOC" from names
   - Line 13: `"Wave 1 merged agent prompt updates (AIOS merge)"` → `"Agent prompt identity and methodology"`
   - Line 44: `expect(agent.prompt).toContain("Builder Principles (AIOS Merge)")` → updated assertion
   - Line 48: `"prompt retains OMOC development methodology"` → `"prompt retains development methodology"`
   - Line 67: `expect(agent.prompt).toContain("Quality Advisory Principles (AIOS Merge)")` → updated
   - Line 72: `"prompt retains OMOC QA identity"` → `"prompt retains QA identity"`
   - Line 97: `"prompt retains OMOC architectural principles"` → `"prompt retains architectural principles"`
   - Line 115: `expect(agent.prompt).toContain("Strategic Research & Ideation (AIOS Merge)")` → updated
   - Line 129: `"Wave 1 OMOC-only agent prompt refresh"` → `"Agent prompt utility refresh"`

2. **Create `prompt-refinement.test.ts`**:
   - Test Kord AIOS Master identity
   - Test framework context presence in Kord
   - Test no legacy references across ALL agents (loop)
   - Test Dev builder principles integrated (no merge marker)
   - Test QA quality principles integrated (no merge marker)
   - Test Analyst research scope integrated (no merge marker)
   - Test SM stateless Dev awareness
   - Test PM pipeline awareness

3. **Run full validation**: `bun test` must pass with 0 failures

**Acceptance Criteria**:
- [ ] `wave1-prompt-updates.test.ts` updated, passes
- [ ] `prompt-refinement.test.ts` created, passes
- [ ] `bun test` full suite passes
- [ ] Zero "(AIOS Merge)", "OMOC", "Synkra" in any prompt string

---

## Detailed Change Inventory

### Legacy References to Remove

| File | Line | Current Text | Action |
|------|------|-------------|--------|
| `dev.ts` | 153 | `## Builder Principles (AIOS Merge)` | Integrate into Development Methodology, delete header |
| `qa.ts` | 18 | `## Quality Advisory Principles (AIOS Merge)` | Rename to `## Quality Advisory Principles` |
| `analyst.ts` | 36 | `## Strategic Research & Ideation (AIOS Merge)` | Rename to `## Strategic Research & Ideation` |
| `analyst.ts` | 38 | `You also cover:` | Rephrase as native capabilities |
| `ux-design-expert.ts` | 10 | `Based on Synkra AIOS ux-design-expert.md.` | Remove from TSDoc |
| `wave1-prompt-updates.test.ts` | 13 | `"Wave 1 merged agent prompt updates (AIOS merge)"` | Rename describe block |
| `wave1-prompt-updates.test.ts` | 44 | `"Builder Principles (AIOS Merge)"` | Update assertion |
| `wave1-prompt-updates.test.ts` | 48 | `"prompt retains OMOC development methodology"` | Remove "OMOC" |
| `wave1-prompt-updates.test.ts` | 67 | `"Quality Advisory Principles (AIOS Merge)"` | Update assertion |
| `wave1-prompt-updates.test.ts` | 72 | `"prompt retains OMOC QA identity"` | Remove "OMOC" |
| `wave1-prompt-updates.test.ts` | 97 | `"prompt retains OMOC architectural principles"` | Remove "OMOC" |
| `wave1-prompt-updates.test.ts` | 115 | `"Strategic Research & Ideation (AIOS Merge)"` | Update assertion |
| `wave1-prompt-updates.test.ts` | 129 | `"Wave 1 OMOC-only agent prompt refresh"` | Remove "OMOC-only" |

### Framework Context Template

Every non-utility agent should receive a brief framework context section. Template:

```markdown
<framework>
You operate within the Kord AIOS story-driven development framework.

Pipeline: PRD (PM) → Epic Structure → Stories (SM) → Waves → Implementation (Dev) → Verification → Delivery

Your role in this pipeline: [AGENT-SPECIFIC ROLE DESCRIPTION]
</framework>
```

The framework section should be:
- **2-4 lines** for specialists (enough to understand context)
- **5-8 lines** for process agents (they define the pipeline)
- **10-15 lines** for orchestrators (they govern the pipeline)
- **0 lines** for utility agents (they don't need it)

---

## File Ownership

```
src/agents/
  kord.ts                    → S01: AIOS Master identity + framework governance
  dev.ts                     → S02: Builder principles integration
  build/default.ts           → S03: Execution orchestrator alignment
  build/gpt.ts               → S03: Execution orchestrator alignment
  pm.ts                      → S04: PRD pipeline methodology
  po.ts                      → S05: Backlog quality gate
  sm.ts                      → S06: Story creation rigor
  qa.ts                      → S07: Merge label cleanup
  analyst.ts                 → S08: Merge label cleanup
  plan-reviewer.ts           → S09: Story-driven framework
  plan-analyzer.ts           → S09: Story-driven framework
  architect.ts               → S10: Framework context
  devops.ts                  → S10: Pipeline methodology
  data-engineer.ts           → S11: Operational methodology
  ux-design-expert.ts        → S11: Phased workflow + TSDoc cleanup
  squad-creator.ts           → S11: Design methodology
  explore.ts                 → S12: Identity alignment (minimal)
  librarian.ts               → S12: Identity alignment (minimal)
  vision.ts                  → S12: Identity alignment (minimal)
  dev-junior/                → S12: Identity alignment (minimal)
  wave1-prompt-updates.test.ts → S13: Test updates
  prompt-refinement.test.ts  → S13: New test file
```

## Notes

- The `(AIOS Merge)` annotation was a useful migration artifact but has no place in production prompts. Agents don't know about system migrations.
- Skills (144 SKILL.md files in `kord-aios/`) are the detailed methodology — agent prompts define identity, principles, and framework awareness. The skill system handles the detailed "how to do X" workflows.
- The dynamic prompt builder (`dynamic-agent-prompt-builder.ts`) does NOT need changes — it already correctly builds skill tables, delegation guides, and agent sections.
- The `delegate-task` tool does NOT need changes — it already correctly resolves skills and injects content.
- Process agents (PM, PO, SM) receive skills via delegation, not self-loading. Their prompts should NOT include skill-loading instructions.
- `utils.ts` lines 126/271 reference `kord-aios` in URL comments — these are code comments referencing the plugin's GitHub repo, NOT prompt content. They are acceptable and should not be changed.
