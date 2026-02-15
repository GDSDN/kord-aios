> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Kord AIOS Orchestration Model — Deep Study

**Date**: 2026-02-10
**Purpose**: Design how Kord AIOS generalizes plan/build/delegation beyond dev to support multi-domain squads (marketing, legal, product, etc.), making Kord a "system that builds systems" — not just code.

---

## 1. Current OMOC Engine Architecture

### The Plan → Build → Delegate Pipeline

```
User Request
    │
    ▼
┌─────────┐
│  /plan   │  Prometheus agent creates a work plan
│ (plan)   │  Output: .sisyphus/plans/{name}.md (checkboxes)
└────┬─────┘
     │
     ▼
┌──────────┐
│/start-work│  start-work hook reads boulder.json
│  (hook)   │  Sets agent to "atlas", injects plan context
└────┬──────┘
     │
     ▼
┌──────────┐
│  build   │  Atlas hook = orchestration loop
│ (atlas)  │  On session.idle: check plan progress → inject continuation
│  hook    │  On task complete: inject verification reminder → mark done → next
└────┬─────┘
     │
     ▼
┌──────────┐
│  task()  │  Delegation tool — two modes:
│  tool    │  1. category= → spawns sisyphus-junior with model+prompt
│          │  2. subagent_type= → calls named agent (explore, librarian, oracle)
└──────────┘
```

### Key Engine Components

| Component | File | Role |
|-----------|------|------|
| **Plan agent** | `src/agents/plan/` (was prometheus) | Interview → analyze → create plan.md |
| **Build hook** | `src/hooks/build/` (was atlas) | Orchestration loop: delegate, verify, mark, continue |
| **Start-work hook** | `src/hooks/start-work/` | Plan selection, boulder.json creation, session routing |
| **Boulder state** | `src/features/boulder-state/` | Tracks active plan, sessions, progress |
| **Delegate-task** | `src/tools/delegate-task/` | Category routing, model selection, skill injection |
| **Dynamic prompt builder** | `src/agents/dynamic-agent-prompt-builder.ts` | Builds delegation tables, tool selection, skill evaluation |
| **Background manager** | `src/features/background-agent/` | Task lifecycle, concurrency, polling |

### Current Hardcoded Dev Assumptions

| Assumption | Where | Impact |
|------------|-------|--------|
| Atlas delegates ONLY to sisyphus-junior | `executor.ts:929` → `agentToUse = SISYPHUS_JUNIOR_AGENT` | All category tasks go to ONE agent type |
| Categories are dev-oriented | `constants.ts` → visual, ultrabrain, artistry, quick | No marketing, legal, product categories |
| Plans are code-focused | Plan template in prometheus prompts | Stories, tasks, checkboxes, tests |
| Plan directory is `.sisyphus/plans/` | `boulder-state/constants.ts` | Single plan directory |
| Verification = lsp + tests + typecheck | Atlas VERIFICATION_REMINDER | No non-code verification patterns |
| Build assumes git workflow | Atlas formatFileChanges, commit steps | Git-centric lifecycle |

---

## 2. AIOS Squad System

### What is a Squad?

A squad is a **team of specialized agents** for a specific domain. Each squad has:

```
squads/{domain}/
├── manifest.json           # Squad metadata, agent list, dependencies
├── agents/                 # Agent persona definitions
│   ├── agent-1.md
│   └── agent-2.md
├── tasks/                  # Domain-specific task workflows
│   ├── task-1.md
│   └── task-2.md
├── templates/              # Output templates
├── checklists/             # Quality gates
├── workflows/              # Multi-step orchestration flows
│   └── wf-create-{domain}.yaml
└── .state.json             # Persistent workflow state
```

### Squad-Creator Agent (Craft)

The squad-creator is a meta-agent that:
1. Researches domain experts ("minds") via web search
2. Clones their expertise via DNA extraction (voice + thinking patterns)
3. Creates agent personas based on cloned minds
4. Generates task workflows and templates
5. Validates against quality schema
6. Packages as distributable squad

### Squad Skill (`.claude/skills/squad.md`)

The squad skill is a Claude Code skill that:
- Has **subagents**: oalanicolas (mind cloning), pedro-valerio (validation), sop-extractor
- Has **hooks**: PreToolUse validation, SubagentStop completion check, Stop metrics
- Has **state persistence**: `.state.json` for workflow checkpoints
- Follows a **workflow-driven** execution model

### Key AIOS Squad Insight

Squads are essentially **portable agent teams with their own methodology**. They bring:
1. **Agents** — domain-specialized personas
2. **Tasks** — executable workflows (methodology, not just instructions)
3. **Templates** — structured outputs
4. **Quality gates** — domain-specific acceptance criteria

---

## 3. The Generalization Problem

### Why the current engine doesn't support squads

```
Current: User → Kord → plan → build → task(category) → sisyphus-junior → done
                                          ▲
                                     ALWAYS dev agent
                                     ALWAYS dev model
                                     ALWAYS dev categories
```

For squads to work, the pipeline must become:

```
Target:  User → Kord → plan → build → task(squad_agent) → {any agent} → done
                  │        │      │
                  │        │      └── Verification adapted per domain
                  │        └── Plan format adapted per domain
                  └── Squad context injected into delegation
```

### What needs to change

| Current | Target | Mechanism |
|---------|--------|-----------|
| `task(category=)` → sisyphus-junior | `task(category=)` → squad-configured agent | Squad config defines which agent handles each category |
| Dev-only categories | Domain categories from squad | Squad manifest declares categories |
| Code verification (lsp, tests) | Domain verification (varies) | Plan defines verification method per task |
| `.sisyphus/plans/` only | `docs/kord/plans/` with squad context | Plan references squad and agents |
| Single build loop agent | Build loop calls squad-appropriate agents | Boulder state includes squad ID |

---

## 4. Proposed Kord AIOS Orchestration Model

### 4.1 The Three-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│               LAYER 1: KORD (COO)               │
│  Primary orchestrator — methodology guardian     │
│  Can implement directly OR delegate to squads    │
│  Knows all available squads and their domains    │
└──────────────────────┬──────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
┌─────────────┐ ┌──────────┐ ┌─────────────┐
│ LAYER 2:    │ │ LAYER 2: │ │ LAYER 2:    │
│ PLAN agent  │ │ BUILD    │ │ Direct Work │
│ (domain-    │ │ hook     │ │ (no plan    │
│  agnostic)  │ │ (generic │ │  needed)    │
│             │ │  loop)   │ │             │
└──────┬──────┘ └────┬─────┘ └──────┬──────┘
       │             │              │
       ▼             ▼              ▼
┌─────────────────────────────────────────────────┐
│            LAYER 3: EXECUTION AGENTS             │
│                                                  │
│  ┌────────┐ ┌──────────┐ ┌────────────────┐    │
│  │Built-in│ │  Squad   │ │ User-defined   │    │
│  │agents  │ │  agents  │ │ agents         │    │
│  │(dev,   │ │(marketing│ │(.opencode/     │    │
│  │ qa,    │ │ legal,   │ │ agents/)       │    │
│  │ etc.)  │ │ etc.)    │ │                │    │
│  └────────┘ └──────────┘ └────────────────┘    │
└─────────────────────────────────────────────────┘
```

### 4.2 Contracts: The Universal Work Unit

Instead of "stories" being the only work unit, Kord uses **contracts** — a generalized abstraction:

```
Contract = {
  type: "story" | "campaign" | "case" | "project" | "task" | "custom",
  title: string,
  squad?: string,                    // Which squad handles this
  executors: string[],               // Which agents execute
  reviewers: string[],               // Which agents review
  acceptance_criteria: VerifyStep[], // How to verify completion
  deliverables: Deliverable[],       // Expected outputs
}
```

**Examples:**

| Domain | Contract Type | Executors | Reviewers | Verification |
|--------|--------------|-----------|-----------|--------------|
| Dev | story | @dev, @dev-junior | @qa | `bun test`, `bun run typecheck`, lsp_diagnostics |
| Marketing | campaign | @copywriter, @designer | @brand-reviewer | Checklist, stakeholder approval |
| Legal | case | @legal-analyst, @contract-drafter | @compliance | Template conformance, citation check |
| Product | feature-spec | @pm, @ux-design-expert | @po | PRD template, user story format |

### 4.3 How Plan Becomes Domain-Agnostic

Currently, the plan agent creates dev-focused plans. To generalize:

**Plan agent receives squad context:**
```
/plan "Create a holiday marketing campaign"
```

**Plan agent flow:**
1. Detect domain → "marketing" (or user specifies squad)
2. Load squad manifest → gets available agents, tasks, templates
3. Interview user with domain-specific questions
4. Create plan with domain-specific contract format
5. Each task in the plan specifies `executor: @agent-name`

**Plan file structure (generalized):**
```markdown
# Plan: Holiday Marketing Campaign
Squad: marketing
Contract Type: campaign

## Tasks

- [ ] **Research competitors** (executor: @analyst, verify: report-exists)
- [ ] **Create brand guidelines** (executor: @brand-chief, verify: checklist)
- [ ] **Write copy for 3 channels** (executor: @copywriter, verify: @brand-reviewer)
- [ ] **Design visual assets** (executor: @designer, verify: @brand-reviewer)
- [ ] **Create distribution plan** (executor: @traffic-master, verify: checklist)
```

### 4.4 How Build Becomes Domain-Agnostic

The build hook currently delegates everything to sisyphus-junior. To generalize:

**Build reads executor from plan task:**
```
Current:  task(category="quick", prompt="implement X")  → always sisyphus-junior
Target:   task(subagent_type="copywriter", prompt="write X", load_skills=["brand-voice"])
```

**Key change in build hook:**
1. Parse current task from plan → extract `executor` field
2. If executor is a builtin agent → `task(subagent_type=executor)`
3. If executor is a squad agent → `task(subagent_type=executor, load_skills=[squad-skills])`
4. If no executor specified → fall back to category-based routing (current behavior)
5. Verification method comes from plan task's `verify` field, not hardcoded lsp+tests

**Build loop (generalized):**
```
while plan has unchecked tasks:
  task = next unchecked task
  executor = task.executor || default_for_squad
  verify = task.verify || default_verification

  # Delegate
  result = task(subagent_type=executor, prompt=task.description, load_skills=task.skills)

  # Verify (domain-appropriate)
  if verify == "tests":     run tests
  if verify == "checklist": run checklist against output
  if verify == "reviewer":  task(subagent_type=task.reviewer, prompt="review: ...")
  if verify == "report":    check file exists and has content

  # Mark done
  mark task [x]
  continue
```

### 4.5 Where Squads Live

```
Plugin (built-in)                    User-defined
─────────────────                    ────────────
src/features/builtin-squads/         .opencode/squads/{domain}/
├── dev/                             ├── marketing/
│   ├── SQUAD.yaml                   │   ├── SQUAD.yaml
│   └── skills/                      │   ├── agents/
│       ├── git-master.md            │   │   ├── copywriter.md
│       └── story-driven.md          │   │   └── designer.md
└── (future built-in squads)         │   └── skills/
                                     │       ├── brand-voice.md
                                     │       └── campaign-flow.md
                                     └── legal/
                                         └── ...
```

**SQUAD.yaml manifest:**
```yaml
name: marketing
description: Marketing team with copywriters, designers, and strategists
version: 1.0.0

agents:
  copywriter:
    description: "Expert copywriter for all channels"
    model: "anthropic/claude-sonnet-4-5"
    mode: subagent
    skills: ["brand-voice"]
  designer:
    description: "Visual designer for marketing assets"
    model: "anthropic/claude-sonnet-4-5"
    mode: subagent
    skills: ["design-system"]
  brand-reviewer:
    description: "Reviews content against brand guidelines"
    model: "anthropic/claude-sonnet-4-5"
    mode: subagent

categories:
  creative:
    model: "anthropic/claude-sonnet-4-5"
    description: "Creative writing and ideation tasks"
  visual:
    model: "anthropic/claude-sonnet-4-5"
    description: "Visual design and layout tasks"

default_executor: copywriter
default_reviewer: brand-reviewer
contract_type: campaign

plan_template: |
  # Plan: {title}
  Squad: marketing
  ...
```

### 4.6 Squad Discovery and Registration

When Kord starts, it discovers squads from:
1. **Built-in squads** → `src/features/builtin-squads/`
2. **User squads** → `.opencode/squads/*/SQUAD.yaml`
3. **Project squads** → Loaded via config

Discovery feeds into the **dynamic prompt builder**:
- Squad agents appear in Kord's delegation table
- Squad categories appear in available categories
- Squad skills appear in skill evaluation

### 4.7 The Squad Chief Pattern (Squad-as-Orchestrator)

For complex squads, a **squad chief** agent can act as a mini-Kord within its domain:

```
Kord (COO)
  └── task(subagent_type="marketing-chief", prompt="Execute holiday campaign plan")
        └── marketing-chief (squad orchestrator)
              ├── task(subagent_type="copywriter", prompt="Write email copy")
              ├── task(subagent_type="designer", prompt="Create hero banner")
              └── task(subagent_type="brand-reviewer", prompt="Review all assets")
```

**When to use squad chief vs. direct build:**

| Scenario | Approach | Why |
|----------|----------|-----|
| Single-domain plan, known agents | Build delegates directly | Simpler, fewer hops |
| Cross-domain plan | Kord delegates to squad chiefs | Each chief knows its domain |
| Complex domain with internal workflow | Squad chief orchestrates | Chief has domain expertise |
| Simple task, no plan needed | Kord delegates directly | No overhead |

**Squad chief = subagent with `task` tool enabled** (currently only plan agents have this). This is the key unlock: allowing squad chiefs to be mini-orchestrators that can delegate within their domain.

---

## 5. Integration with OMOC Dynamic Prompt Builder

### Current: Static delegation table

```typescript
buildDelegationTable(agents)  // Lists all agents with triggers
buildToolSelectionTable(agents, tools, skills)  // Cost-based table
buildCategorySkillsDelegationGuide(categories, skills)  // Category + skill protocol
```

### Target: Squad-aware delegation

The prompt builder already supports dynamic injection. The change is in **what data it receives**:

```typescript
// Current
const agents = getBuiltinAgents()
const categories = getDefaultCategories()
const skills = discoverSkills()

// Target
const agents = [...getBuiltinAgents(), ...getSquadAgents(activeSquads)]
const categories = {...getDefaultCategories(), ...getSquadCategories(activeSquads)}
const skills = [...discoverSkills(), ...getSquadSkills(activeSquads)]
```

**No structural change to the prompt builder.** The existing `buildDelegationTable()`, `buildCategorySkillsDelegationGuide()`, etc. already render whatever agents/categories/skills they receive. The change is upstream — in what data flows into them.

### Kord's prompt includes squad awareness

```
### Available Squads

| Squad | Domain | Agents | Chief |
|-------|--------|--------|-------|
| dev (built-in) | Software development | @dev, @dev-junior, @qa | — (Kord handles directly) |
| marketing | Marketing campaigns | @copywriter, @designer | @marketing-chief |
| legal | Legal analysis | @legal-analyst, @contract-drafter | — |

### How to Delegate to Squads

For tasks within a squad's domain:
- task(subagent_type="copywriter", load_skills=["brand-voice"], prompt="...")
- task(subagent_type="marketing-chief", prompt="Full campaign execution...")

For dev tasks (built-in):
- task(category="quick", prompt="...")  → uses default dev routing
```

---

## 6. Execution Modes Summary

### Mode 1: Direct Work (no plan, no build)

```
User: "Fix this typo in README.md"
Kord: [fixes directly — no plan needed]
```

### Mode 2: Plan + Build (dev — current flow, generalized)

```
User: /plan "Implement user authentication"
Plan agent: Creates plan with story tasks, dev executors
User: /start-work
Build hook: Loops through tasks, delegates to @dev/@dev-junior, verifies with tests
```

### Mode 3: Plan + Build (non-dev domain)

```
User: /plan "Create Q3 marketing campaign" --squad=marketing
Plan agent: Loads marketing squad manifest, creates campaign-type plan
User: /start-work
Build hook: Reads executor per task, delegates to @copywriter/@designer, verifies per task spec
```

### Mode 4: Squad Chief Orchestration

```
User: "I need a complete rebranding campaign"
Kord: Identifies marketing domain → delegates to marketing-chief
Marketing-chief: Creates internal plan, delegates to squad agents, reviews, delivers
```

### Mode 5: Cross-Squad Collaboration

```
User: /plan "Launch new product — needs dev + marketing + legal"
Plan agent: Creates multi-squad plan with sections per squad
User: /start-work
Build hook: Routes dev tasks to @dev, marketing tasks to @copywriter, legal tasks to @legal-analyst
```

---

## 7. Implementation Strategy

### What changes in the engine (minimal)

| Component | Change | Effort |
|-----------|--------|--------|
| **Boulder state** | Add `squad?: string` to BoulderState type | Trivial |
| **Plan agent** | Accept `--squad` parameter, load squad manifest for plan template | Medium |
| **Build hook** | Read `executor` from plan task, delegate to named agent instead of always sisyphus-junior | Medium |
| **Build hook** | Read `verify` from plan task, adapt verification | Medium |
| **Delegate-task** | Allow squad agents to be called via subagent_type | Already works |
| **Prompt builder** | Feed squad agents/categories/skills into existing builders | Small |
| **Kord agent** | Include squad awareness in delegation table | Small |
| **Start-work hook** | Pass squad context to build session | Small |

### What is NEW (squad infrastructure)

| Component | Description | Effort |
|-----------|-------------|--------|
| **Squad loader** | Discover SQUAD.yaml files, parse manifest, register agents | Medium |
| **Squad agent factory** | Create AgentConfig from SQUAD.yaml agent definitions | Medium |
| **Squad-creator agent** | Adapted from AIOS Craft — creates new squads | Large (Wave 3+) |
| **SQUAD.yaml schema** | Zod schema for squad manifests | Small |
| **Built-in dev squad** | Package existing dev skills as the default squad | Small |

### Wave Plan (revised)

| Wave | Focus | Squads Impact |
|------|-------|---------------|
| **Wave 1** | Agent system — build all agent factories | Include squad-related agents (squad-creator) |
| **Wave 2** | Hooks & engine — generalize build/plan | Add `executor` parsing, squad context |
| **Wave 3** | Skills — convert AIOS tasks to SKILL.md | Squad skills become available |
| **Wave 4** | Squad infrastructure — SQUAD.yaml loader, factory | Squads become creatable |
| **Wave 5** | Squad-creator — adapted from AIOS Craft | Users can create custom squads |

---

## 8. Design Decisions

### D1: Where do squad agents live?

**Decision: User-defined squads in `.opencode/squads/`, built-in dev squad in plugin.**

Rationale: Squad agents are methodology, not engine. Users create squads for their domain. The dev workflow ships as the default built-in squad.

### D2: Should plan/build be squad-specific or generic?

**Decision: Generic engine, squad-informed context.**

Plan and build remain domain-agnostic engine components. Squads inject context (available agents, plan templates, verification methods) but don't replace the engine. This means:
- ONE plan agent that adapts to any domain
- ONE build hook that reads executor/verify from plan tasks
- Squad-specific logic lives in squad manifests and skills, not in the engine

### D3: Squad chief vs. direct build delegation?

**Decision: Support both. Let the plan decide.**

- Simple plans → build delegates directly to squad agents
- Complex plans → build delegates to squad chief who orchestrates internally
- The plan's `executor` field can be either a worker agent or a chief agent

### D4: Should squad agents be OpenCode registered agents or skill-injected personas?

**Decision: Hybrid — registered for chiefs, skill-injected for workers.**

- Squad chiefs need to be registered agents (they need `task` tool access for delegation)
- Worker agents can be skill-injected sisyphus-junior instances (cheaper, simpler)
- This preserves the category system while allowing squad customization:
  ```
  task(category="creative", load_skills=["copywriter-persona", "brand-voice"], prompt="...")
  ```
  vs.
  ```
  task(subagent_type="marketing-chief", prompt="Orchestrate campaign tasks...")
  ```

### D5: Contract format — should it be enforced?

**Decision: Convention, not enforcement. Templates in squad manifests.**

Each squad provides a `plan_template` in SQUAD.yaml. Plan agent uses it when creating plans for that squad. But the engine doesn't validate contract format — it just reads checkboxes and executors.

### D6: How does Kord know which squad to use?

**Decision: Three resolution paths:**
1. **Explicit**: User specifies `--squad=marketing` or plan has `Squad: marketing`
2. **Inferred**: Kord analyzes request domain and suggests matching squad
3. **Default**: No squad → uses built-in dev workflow (current behavior)

---

## 9. The Big Picture: Kord AIOS as Enterprise Orchestrator

```
┌─────────────────────────────────────────────────────────────────┐
│                         KORD OS                                  │
│                                                                  │
│  "A system that builds systems — not just code"                 │
│                                                                  │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  │  ENGINE  │  │METHODOLOGY│ │  SQUADS   │  │ SQUAD CREATOR│   │
│  │          │  │          │  │          │  │              │   │
│  │ plan     │  │ skills   │  │ dev      │  │ Create new   │   │
│  │ build    │  │ hooks    │  │ marketing│  │ squads from  │   │
│  │ delegate │  │ commands │  │ legal    │  │ domain       │   │
│  │ boulder  │  │ templates│  │ product  │  │ expertise    │   │
│  │          │  │          │  │ custom...│  │              │   │
│  └──────┬───┘  └────┬─────┘  └────┬─────┘  └──────────────┘   │
│         │           │             │                              │
│         └───────────┴─────────────┘                              │
│                     │                                            │
│                     ▼                                            │
│            ┌─────────────────┐                                   │
│            │   Any Domain    │                                   │
│            │   Any Team      │                                   │
│            │   Any Workflow   │                                   │
│            └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

**The analogy:**
- **Kord** = COO (Chief Operating Officer) — knows all departments, delegates appropriately
- **Plan** = Strategic planning department — creates execution plans for any domain
- **Build** = Operations — executes plans by routing to the right teams
- **Squads** = Departments — specialized teams with their own agents, methodology, and quality standards
- **Contracts** = Work units — stories, campaigns, cases, specs — whatever the domain needs
- **Skills** = SOPs (Standard Operating Procedures) — portable methodology that injects expertise

**Each user can create their own squads.** A marketing agency creates marketing squads. A law firm creates legal squads. A dev shop uses the built-in dev squad. They all share the same engine (plan, build, delegate) but with domain-specific methodology.

This is what makes Kord AIOS a **framework for autonomous operations** — not just a coding assistant.
