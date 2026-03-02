# Three-Layer Architecture: Engine + Framework + Methodology Packs

## TL;DR

> **Quick Summary**: Refactor Kord AIOS into a three-layer architecture (Engine → Framework → Methodology Packs) with an L2-Squad layer where squad chiefs are domain-scoped orchestrators with full team awareness. Fix the broken permission system, add `.opencode/agents/` loader, enable `call_kord_agent` by default, auto-prefix squad agent names for namespace isolation, and add `kord-aios extract` CLI for content customization.
>
> **Deliverables**:
> - `.opencode/agents/` loader for custom and overridable agents
> - Declarative permission model replacing hardcoded allowlists
> - `call_kord_agent` enabled by default for all agents
> - Agent frontmatter schema with `write_paths` and `tool_allowlist`
> - Override-first resolution (disk > compiled) for agents
> - Auto-prefixed squad agent names (`squad-{squad}-{agent}`) for namespace isolation
> - L2-Squad chief awareness: auto-generated team/skill/tool knowledge from manifest
> - `CHIEF_COORDINATION_TEMPLATE` — compiled L2 framework for all squad chiefs
> - Upgraded squad-creator that generates L2-aware chief prompts with domain methodology
> - `kord-aios extract` CLI command to export bundled methodology content
> - Compatibility gating (`engine_min_version` in agent manifests)
> - Tests for all of the above
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Task 1 → Task 5 → Task 6.5 → Task 11 → Task 13 → Task 14

---

## Context

### Original Request
The user asked how squads, agents, and permissions work in Kord AIOS, and why custom agents (like `course-creator`) hit permission errors. Investigation revealed a deeper architectural question: should Kord AIOS separate its Engine from its Framework/Methodology layer?

### Interview Summary
**Key Discussions**:
- **Three-layer model agreed**: Engine (runtime, compiled) + Framework (story-driven orchestration, compiled) + Methodology Packs (role implementations, overridable from disk)
- **Role names are the API contract**: Planner/Builder prompts reference roles like "pm", "sm", "po" by name. These names stay compiled. What those roles say/do is overridable content.
- **Kord's unique value = Layer 2 (Framework)**: The story-driven pattern (plan → PRD → stories → wave execution → QA → checkpoint) encoded in planner (1,613 LOC), builder (1,111 LOC), and kord (615 LOC) doesn't exist in OMOC or Synkra.
- **Permission fix is urgent**: 3 independent causes block custom agents today.
- **`call_kord_agent` default**: All agents should access explore/librarian by default (read-only, high-value).
- **`kord-aios.json` scope**: Model overrides only; permissions live in agent/squad manifests.

**Research Findings**:
- OMOC is NOT a pure engine — ships agents (Sisyphus, Hephaestus) and skills (git-master, playwright). Kord isn't just OMOC+Synkra glue.
- Synkra is pure content — CLI copies .md files to `.claude/` directories. No runtime plugin.
- 10 "prompt-only" agents (~1,200 LOC) can become .md files with frontmatter.
- 5 "runtime" agents (~4,000 LOC) must stay compiled (kord, dev, builder, plan, architect have functions/dynamic prompt builders).
- Skills, squads, and commands already load from disk paths. Only agents lack a disk loader (except `.claude/agents/`).

### Architect Recommendation
Path C (Hybrid Monolith with Extractable Content) — single npm package, internally separated into Engine/Framework/Content layers. Content ships compiled but is overridable from disk. `kord-aios extract` exports content for customization.

### Relationship to Existing Plans
- `docs/kord/plans/refactor-squad-creator.md`: Overlaps on squad loader improvements. This plan SUPERSEDES the squad loader portions of that plan (global path discovery). The squad-creator prompt improvements from that plan can be done independently after this plan completes.

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│  LAYER 3: METHODOLOGY PACKS (overridable)       │
│  Role implementations: pm.md, sm.md, po.md      │
│  Skills (148), commands (9), squads (1+)         │
│  Squad worker agents (non-chief)                 │
│  "WHAT each role says and knows"                 │
│  Override: .opencode/ > ~/.config/opencode/ >    │
│            compiled default                      │
├─────────────────────────────────────────────────┤
│  LAYER 2-Squad: DOMAIN FRAMEWORK (per squad)    │
│  Squad chief = domain-scoped orchestrator        │
│  Auto-generated: team awareness, skill map,      │
│    tool permissions, delegation routing           │
│  Custom: domain methodology (chief.md)           │
│  CHIEF_COORDINATION_TEMPLATE (compiled constant) │
│  "HOW this squad coordinates its domain"         │
├─────────────────────────────────────────────────┤
│  LAYER 2-Global: FRAMEWORK (compiled, Kord DNA) │
│  Story-driven orchestration pattern:             │
│  plan/ (1,613 LOC), builder/ (1,111 LOC),       │
│  kord.ts (615 LOC)                              │
│  References Layer 3 roles BY NAME               │
│  "HOW roles interact and in what order"          │
├─────────────────────────────────────────────────┤
│  LAYER 1: ENGINE (compiled, runtime)            │
│  Hooks (40+), tools (15+), permissions, config   │
│  Background agents, LSP, AST-grep, MCPs         │
│  Content loaders, squad factory                  │
│  Execution agents: explore, librarian, vision    │
│  "THE MACHINE that makes everything run"         │
└─────────────────────────────────────────────────┘
```

### L2-Squad: Domain-Scoped Orchestration

Each squad chief operates as a **domain-scoped L2** — analogous to how Kord (L2-Global) orchestrates the entire framework, the chief orchestrates its squad's domain.

```
L2-Global (Kord)    → Framework orchestrator: story-driven, wave planning, quality gates
L2-Squad (Chief)    → Domain orchestrator: team coordination, domain methodology, squad QA
L3 (Workers)        → Individual agents: execute specific tasks, no delegation
```

**Chief's prompt is assembled from three sources:**
```
Chief Final Prompt = buildChiefAwarenessSection(manifest)    ← AUTO from SQUAD.yaml
                   + loadPromptFile("agents/chief.md")        ← CUSTOM domain methodology
                   + CHIEF_COORDINATION_TEMPLATE               ← COMPILED L2 framework
```

| Source | Content | Responsibility |
|--------|---------|---------------|
| `buildChiefAwarenessSection()` | Team members, their skills, tool permissions, delegation routing | Factory (auto-generated from manifest) |
| `agents/chief.md` (prompt_file) | Domain-specific workflows, quality gates, methodology | Squad author (or squad-creator agent) |
| `CHIEF_COORDINATION_TEMPLATE` | Task decomposition protocol, self-optimization capability, synthesis patterns | Compiled constant (L1 Engine) |

### Squad Agent Naming Convention

Squad agents are auto-prefixed with `squad-{squad-name}-` for namespace isolation:

```yaml
# SQUAD.yaml — author writes clean names
name: marketing
agents:
  chief:           # → registered as "squad-marketing-chief"
    is_chief: true
    mode: all      # primary + subagent (user can switch to chief directly)
  media-buyer:     # → registered as "squad-marketing-media-buyer"
  copywriter:      # → registered as "squad-marketing-copywriter"
```

**Visibility:**
- Chief (`is_chief: true`): `mode: all` — visible in UI, usable as primary agent AND delegatable
- Workers (`is_chief: false`): `mode: subagent` — hidden from UI, callable via `task(subagent_type="squad-marketing-media-buyer")`
- Kord can delegate directly to ANY squad agent (flat access, no forced hierarchy)
- Chief coordinates multi-agent squad work; is NOT a mandatory intermediary

### Research-Backed Orchestration Decisions

Based on Google Research ("Towards a Science of Scaling Agent Systems", Jan 2026) and Anthropic ("Building effective agents", Dec 2024; "How we built our multi-agent research system", Jun 2025):

| Principle | Evidence | Our Decision |
|-----------|----------|-------------|
| Flat hub-and-spoke > hierarchy for coding | Google: +80.9% on parallelizable, -70% on sequential with hierarchy | Kord delegates directly to any agent, chief is optional coordinator |
| Each delegation = fresh session, linear token cost | Kord codebase: `executor.ts:725-736`, no context inheritance | No token explosion from flat access |
| Centralized orchestrator contains errors (4.4x vs 17.2x) | Google: error amplification study | Chief validates sub-results when coordinating multi-agent work |
| "Start with simplest solution" | Anthropic: building effective agents | Single-task → direct delegation; multi-task → through chief |
| Multi-agent = ~15x more tokens than chat | Anthropic: multi-agent research system | Only use chief coordination when task value justifies token cost |

### Agent Classification

| Tier | Agent | Layer | Why | Overridable? |
|------|-------|-------|-----|--------------|
| T0 | kord | L2 Framework | Runtime logic: `buildTaskManagementSection()`, dynamic prompt builder | NO — prompt-only overrides via `kord-aios.json` |
| T0 | dev | L2 Framework | Runtime logic: `buildTodoDisciplineSection()`, dynamic prompt builder | NO — prompt-only overrides via `kord-aios.json` |
| T0 | builder | L2 Framework | Complex orchestrator with Claude/GPT variants, 1,111 LOC | NO |
| T0 | planner | L2 Framework | Interview mode, plan generation, 1,613 LOC | NO |
| T1 | explore | L1 Engine | Fast grep utility, minimal prompt | NO |
| T1 | librarian | L1 Engine | Documentation search utility | NO |
| T1 | vision | L1 Engine | Media analysis utility | NO |
| T1 | dev-junior | L1 Engine | Category-spawned executor with model variants | NO |
| T2 | pm | L3 Content | Pure prompt (133 LOC), no runtime logic | YES — `.opencode/agents/pm.md` |
| T2 | po | L3 Content | Pure prompt (130 LOC), no runtime logic | YES |
| T2 | sm | L3 Content | Pure prompt (131 LOC), no runtime logic | YES |
| T2 | qa | L3 Content | Pure prompt (266 LOC), no runtime logic | YES |
| T2 | architect | L3 Content | Uses dynamic prompt builder but could be extracted | YES (future) |
| T2 | devops | L3 Content | Pure prompt (112 LOC) | YES |
| T2 | data-engineer | L3 Content | Pure prompt (121 LOC) | YES |
| T2 | ux-design-expert | L3 Content | Pure prompt (140 LOC) | YES |
| T2 | squad-creator | L3 Content | Pure prompt (251 LOC) | YES |
| T2 | analyst | L3 Content | Pure prompt (365 LOC) | YES |
| T2 | plan-analyzer | L3 Content | Pure prompt (344 LOC) | YES |
| T2 | plan-reviewer | L3 Content | Pure prompt (237 LOC) | YES |

---

## Project Artifacts

| Artifact | Agent | Path | Status |
|----------|-------|------|--------|
| ADR: Three-Layer Architecture | architect | docs/kord/adrs/three-layer-architecture.md | pending |

---

## Decision Points

- [x] Decision: Architecture path
  - Options: Path A (full split) | Path B (fix permissions only) | Path C (hybrid monolith)
  - Final decision: **Path C — Hybrid Monolith with Extractable Content**
  - Rationale: Single package avoids versioning pain. Content is overridable without extraction. Path A can happen later if ecosystem demands.

- [x] Decision: Permission model location
  - Options: SQUAD.yaml only | kord-aios.json only | Both with override
  - Final decision: **Agent/squad manifests declare defaults; engine enforces**
  - Rationale: Self-contained agents. kord-aios.json stays for model overrides only.

- [x] Decision: `call_kord_agent` default
  - Options: Deny by default | Allow by default
  - Final decision: **Allow by default for all agents**
  - Rationale: explore/librarian are read-only, low-risk, high-value for any agent.

- [x] Decision: Agent override format
  - Options: YAML frontmatter + markdown body | Pure markdown | JSON
  - Final decision: **YAML frontmatter + markdown body** (matches existing Claude Code agent format)
  - Rationale: Already supported by `parseFrontmatter()` in `src/shared/frontmatter.ts`. Consistent with SKILL.md format.

- [x] Decision: Squad agents vs standalone agents (no conflict)
  - Options: Both in `.opencode/agents/` | Squads keep own prompts | Merge into one path
  - Final decision: **Separate paths, no merging**
  - Rationale: `.opencode/agents/*.md` = standalone agents or built-in overrides. `.opencode/squads/{squad}/*.md` = squad agent prompts (via `prompt_file`). Different purposes, different loading mechanisms. Squad factory (`factory.ts:31-32`) already resolves prompts from `prompt_file` → `prompt` → auto-generated. No change needed.

- [x] Decision: Squad agent visibility in UI
  - Options: All visible | Chief only | Configurable per agent
  - Final decision: **All agents discoverable; chief is `mode: "all"`, workers are `mode: "subagent"`**
  - Rationale: Kord can delegate directly to any squad agent (flat access per Google/Anthropic research). Chief as `mode: "all"` lets user switch to chief as primary agent for domain brainstorming. Workers as `mode: "subagent"` keeps UI clean but they're still callable via `task()`.

- [x] Decision: Squad agent naming convention
  - Options: Manual naming in SQUAD.yaml | Auto-prefix in factory
  - Final decision: **Auto-prefix in factory** — YAML key `media-buyer` → registered as `squad-marketing-media-buyer`
  - Rationale: Clean YAML, automatic namespace isolation, no human error, prevents collisions between squads.

- [x] Decision: Squad chief orchestration model
  - Options: Chief as mandatory proxy | Chief as optional coordinator | Flat-only (no chief)
  - Final decision: **Chief as optional domain coordinator (L2-Squad)**
  - Rationale: Google Research shows -70% performance when adding intermediary to sequential coding tasks. Chief adds value ONLY for multi-agent coordination within a domain. Kord delegates directly for single tasks. Chief has full team/skill/tool awareness auto-generated from manifest.

- [x] Decision: Chief prompt assembly
  - Options: Fully manual (squad-creator writes everything) | Fully auto-generated | Hybrid (auto + custom)
  - Final decision: **Hybrid** — factory auto-generates team awareness from manifest, author provides domain methodology via `chief.md`, compiled `CHIEF_COORDINATION_TEMPLATE` provides coordination protocol
  - Rationale: Auto-generation ensures consistency and prevents stale team references. Custom `chief.md` allows domain-specific methodology. Compiled template ensures all chiefs have coordination capabilities.

- [x] Decision: Skills loading model
  - Options: Only orchestrator loads skills | All agents load natively | Hybrid
  - Final decision: **No change needed — current model works for all layers**
  - Rationale: L2 agents pass `load_skills` when delegating via `task()`. L3 agents and squad agents can use the `skill` tool natively to load skills during execution. Squad agents also get skills from their `skills` field in SQUAD.yaml (schema line 27). All three paths already work.

---

## Architecture Clarifications

### .opencode/agents/ vs .opencode/squads/ — No Conflict

```
.opencode/
├── agents/                          # STANDALONE agents or built-in overrides
│   ├── course-creator.md            # Custom standalone agent
│   ├── pm.md                        # Override of compiled PM agent
│   └── marketing-analyst.md         # Custom standalone agent
│
├── squads/                          # TEAM declarations with coordinated agents
│   ├── marketing/
│   │   ├── SQUAD.yaml               # Team manifest: chief, subagents, categories
│   │   ├── content-writer.md        # Squad agent prompt (via prompt_file)
│   │   └── seo-specialist.md        # Squad agent prompt (via prompt_file)
│   └── research/
│       ├── SQUAD.yaml
│       └── researcher.md
│
└── skills/                          # Custom skills (already works)
    └── my-skill/
        └── SKILL.md
```

**Loading order** (from `config-handler.ts:370-405`):
```
builtinAgents → squadAgents → openCodeAgents → claudeAgents → configOverrides
```
Later entries override earlier by name. `.opencode/agents/pm.md` overrides compiled PM AND any squad-defined PM.

### Squad Agent Visibility & Naming

Squad agents are auto-prefixed with `squad-{squad-name}-` for namespace isolation. The factory handles this — YAML authors write clean names.

**Naming:**
```yaml
# Author writes:                    # Factory registers as:
name: marketing
agents:
  chief:                            # → "squad-marketing-chief"
    is_chief: true
    mode: all
  media-buyer:                      # → "squad-marketing-media-buyer"
  copywriter:                       # → "squad-marketing-copywriter"
```

**Visibility & Mode:**
- Chief (`is_chief: true`): `mode: all` — visible in UI agent list, usable as primary agent AND as subagent
- Workers: `mode: subagent` — not in UI dropdown, callable via `task(subagent_type="squad-marketing-media-buyer")`
- Kord can delegate directly to ANY squad agent — no forced routing through chief

**L2-Squad Chief Awareness (auto-generated by factory):**

When a chief is created, the factory auto-generates a team awareness section from the manifest:
```
### Your Squad: marketing

**Team Members:**
- @squad-marketing-media-buyer — Paid media specialist (skills: facebook-ads, google-ads)
- @squad-marketing-copywriter — Ad copy and content (skills: seo-writing, brand-voice)

**Delegation:**
- For paid media tasks → task(subagent_type="squad-marketing-media-buyer")
- For content tasks → task(subagent_type="squad-marketing-copywriter")

**Tool Permissions:**
- @squad-marketing-media-buyer: read, edit, bash
- @squad-marketing-copywriter: read, edit (no bash)
```

This section is injected automatically — the squad author does NOT need to write it.

### Skills Loading (Unchanged)

| Who | How | Mechanism |
|-----|-----|-----------|
| L2 orchestrator (kord/builder/planner) | Passes `load_skills` when calling `task()` | Skills injected into delegated agent's prompt at spawn |
| L3 agent (pm/sm/po/etc) | Uses `skill` tool during execution | Agent loads skills on demand |
| Squad agent | Declared in `SQUAD.yaml agents.*.skills` | Auto-injected at registration time |
| Any agent | Uses `skill` tool during execution | Available to all agents with tool access |

No changes needed. All three loading paths already work.

---

## Work Objectives

### Core Objective
Enable Kord AIOS's methodology content (agents, skills, squads, commands) to be overridable from disk while keeping the story-driven framework and execution engine compiled. Fix the broken permission system that blocks custom agents.

### Concrete Deliverables
- New loader: `src/features/opencode-agent-loader/` (agents from `.opencode/agents/` and `~/.config/opencode/agents/`)
- Updated permission model: declarative `write_paths` and `tool_allowlist` in agent frontmatter
- Updated `agent-authority/index.ts`: reads permissions from agent manifests, not hardcoded constants
- Updated `config-handler.ts`: integrates new agent loader with override-first resolution
- Updated `agent-tool-restrictions.ts`: supports declarative restrictions from agent manifests
- New CLI command: `kord-aios extract` to export bundled content
- Compatibility gating: `engine_min_version` field in agent frontmatter
- Tests for all of the above

### Definition of Done
- [ ] Custom agent in `.opencode/agents/course-creator.md` can read/write to declared paths and delegate to explore/librarian
- [ ] Overriding `pm` via `.opencode/agents/pm.md` replaces the compiled default
- [ ] `kord-aios extract` exports all T2 agents as .md files to `.opencode/agents/`
- [ ] `bun test` passes with all new tests
- [ ] `bun run build` succeeds
- [ ] No breaking changes to existing agent behavior

### Must Have
- `.opencode/agents/` loader with frontmatter support
- Declarative permission model (`write_paths`, `tool_allowlist`)
- `call_kord_agent` allowed by default for all agents
- Override-first resolution for agents
- Backward compatibility: all existing agents work identically
- TDD: all changes have tests first

### Must NOT Have (Guardrails)
- DO NOT move T0/T1 agents out of compiled TypeScript
- DO NOT create a separate npm package for content (Path A deferred)
- DO NOT change the story-driven orchestration flow in planner/builder/kord
- DO NOT modify how skills, squads, or commands are loaded (they already work)
- DO NOT apply `migrateAgentConfig()` to OpenCode agents (same reason as Claude Code agents — tool format differs)
- DO NOT hardcode `~/.config` paths — use `getOpenCodeConfigDir()`
- DO NOT add fields to `SQUAD.yaml` schema in this plan (handled by refactor-squad-creator plan)
- DO NOT use `@types/node` — use bun-types
- DO NOT use `as any`, `@ts-ignore`, `@ts-expect-error`
- DO NOT create empty catch blocks

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks are verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (`bun test`, 100+ existing test files)
- **Automated tests**: TDD (RED-GREEN-REFACTOR)
- **Framework**: bun:test (built-in)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Every task includes specific QA scenarios. The executing agent verifies by running tests and inspecting outputs directly.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: OpenCode agent loader (.opencode/agents/)
├── Task 2: Agent frontmatter schema (types + parser)
└── Task 3: Declarative permission model (write_paths + tool_allowlist)

Wave 2 (After Wave 1):
├── Task 4: Enable call_kord_agent by default
├── Task 5: Override-first agent resolution in config-handler
├── Task 6: Update agent-authority to read from manifests
└── Task 6.5: Squad agent namespace + chief L2 awareness

Wave 3 (After Wave 2):
├── Task 7: Convert T2 agents to overridable format (compile from .md at build)
└── Task 8: kord-aios extract CLI command

Wave 4 (After Wave 3):
├── Task 9: Compatibility gating (engine_min_version)
└── Task 10: Integration tests + AGENTS.md + README updates

Wave 5 (After Wave 2, parallel with Waves 3-4):
├── Task 11: CHIEF_COORDINATION_TEMPLATE constant
├── Task 12: Integrate chief template into factory prompt assembly (after 11)
├── Task 13: Upgrade squad-creator to generate L2-aware chief prompts (after 12)
└── Task 14: L2-Squad integration tests + documentation (after 12, 13)

Critical Path A (Three-Layer): Task 1 → Task 5 → Task 7 → Task 10
Critical Path B (L2-Squad): Task 6.5 → Task 11 → Task 12 → Task 14
Parallel Speedup: ~50% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 5, 6 | 2, 3 |
| 2 | None | 3, 5, 6, 7 | 1, 3 |
| 3 | 2 | 4, 6 | 1 |
| 4 | 3 | None | 5, 6, 6.5 |
| 5 | 1, 2 | 7, 8 | 4, 6, 6.5 |
| 6 | 2, 3 | 7 | 4, 5, 6.5 |
| 6.5 | None | 11, 12 | 4, 5, 6 |
| 7 | 5, 6 | 8, 10 | 11 |
| 8 | 7 | 10 | 9, 11, 12 |
| 9 | None (can start anytime) | 10 | 8, 11, 12 |
| 10 | 7, 8, 9 | None | 13, 14 |
| 11 | 6.5 | 12 | 7, 8, 9 |
| 12 | 6.5, 11 | 13, 14 | 8, 9 |
| 13 | 12 | 14 | 10 |
| 14 | 12, 13 | None (final) | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | task(category="unspecified-high", load_skills=["git-master"]) |
| 2 | 4, 5, 6, 6.5 | task(category="unspecified-high", load_skills=["git-master"]) |
| 3 | 7, 8 | task(category="unspecified-high", load_skills=["git-master"]) |
| 4 | 9, 10 | task(category="unspecified-high", load_skills=["git-master"]) |
| 5 | 11, 12, 13, 14 | task(category="unspecified-high", load_skills=["git-master"]) |

---

## TODOs

### Wave 1: Foundation

- [ ] 1. Create OpenCode Agent Loader

  **What to do**:
  - Create `src/features/opencode-agent-loader/` directory with:
    - `loader.ts`: `loadOpenCodeUserAgents()` and `loadOpenCodeProjectAgents()` functions
    - `types.ts`: `OpenCodeAgentFrontmatter` interface extending current `AgentFrontmatter`
    - `index.ts`: barrel exports
  - Load agents from:
    - Project: `.opencode/agents/*.md`
    - User global: `{getOpenCodeConfigDir()}/agents/*.md`
  - Parse frontmatter using existing `parseFrontmatter()` from `src/shared/frontmatter.ts`
  - Convert to `AgentConfig` (mode: "subagent") — same pattern as `claude-code-agent-loader/loader.ts`
  - Support frontmatter fields: `name`, `description`, `model`, `temperature`, `tools` (CSV), `write_paths` (array), `engine_min_version`
  - Return `Record<string, AgentConfig>` keyed by filename (without `.md`)

  **Must NOT do**:
  - DO NOT apply `migrateAgentConfig()` to these agents (same as Claude Code agents — see `config-handler.ts` AGENTS.md)
  - DO NOT load from `.claude/agents/` (already handled by `claude-code-agent-loader`)
  - DO NOT load `.ts` files — only `.md`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New feature module with loader logic and types, not purely visual or business-logic
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commits for each step of the implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/features/claude-code-agent-loader/loader.ts:22-68` — `loadAgentsFromDir()` function: the exact pattern to replicate for `.opencode/agents/`. Copy the structure, change the paths.
  - `src/features/claude-code-agent-loader/types.ts:1-17` — `AgentFrontmatter` interface: extend this with `write_paths` and `engine_min_version` fields.
  - `src/features/opencode-skill-loader/loader.ts` — Skill loader uses `getOpenCodeConfigDir()` for global path discovery. Follow the same pattern for agent global path.

  **API/Type References**:
  - `src/shared/frontmatter.ts` — `parseFrontmatter<T>(content)`: existing YAML frontmatter parser (JSON_SCHEMA only). Use this to parse agent .md files.
  - `src/shared/opencode-config-dir.ts` — `getOpenCodeConfigDir()`: cross-platform config directory resolution. Use for `~/.config/opencode/agents/`.
  - `src/shared/file-utils.ts` — `isMarkdownFile(entry)`: existing check for .md files.

  **Test References**:
  - `src/features/claude-code-agent-loader/loader.test.ts` (if exists) — Test structure for agent loading
  - `src/plugin-handlers/config-handler.test.ts` — Config loading test patterns

  **WHY Each Reference Matters**:
  - `claude-code-agent-loader/loader.ts` provides the exact structural pattern — follow it to ensure consistency
  - `opencode-skill-loader` shows how to use `getOpenCodeConfigDir()` correctly on all platforms
  - `frontmatter.ts` is the shared parser — don't create a new one

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `src/features/opencode-agent-loader/loader.test.ts`
  - [ ] Test covers: loading agents from a mock `.opencode/agents/` directory
  - [ ] Test covers: parsing frontmatter with `name`, `description`, `tools`, `write_paths`
  - [ ] Test covers: empty directory returns empty record
  - [ ] Test covers: non-.md files are ignored
  - [ ] Test covers: malformed frontmatter doesn't crash (continues to next file)
  - [ ] Test covers: agent name derived from filename (without `.md`)
  - [ ] `bun test src/features/opencode-agent-loader/loader.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Loader discovers and parses a valid agent .md file
    Tool: Bash (bun test)
    Preconditions: Test file exists with mock filesystem
    Steps:
      1. Create test with mock agent file containing valid frontmatter
      2. Call loadOpenCodeProjectAgents() with mock directory
      3. Assert: returned record has key matching filename
      4. Assert: config.prompt contains the markdown body
      5. Assert: config.mode === "subagent"
      6. Assert: config.tools reflects parsed CSV from frontmatter
    Expected Result: Agent loaded with correct config
    Evidence: bun test output captured

  Scenario: Loader handles missing directory gracefully
    Tool: Bash (bun test)
    Preconditions: Test points to non-existent directory
    Steps:
      1. Call loadOpenCodeProjectAgents() with non-existent path
      2. Assert: returns empty record {}
      3. Assert: no errors thrown
    Expected Result: Empty result, no crash
    Evidence: bun test output captured
  ```

  **Commit**: YES
  - Message: `feat(agent-loader): add .opencode/agents/ loader with frontmatter support`
  - Files: `src/features/opencode-agent-loader/loader.ts`, `types.ts`, `index.ts`, `loader.test.ts`
  - Pre-commit: `bun test src/features/opencode-agent-loader/`

---

- [ ] 2. Define Agent Frontmatter Schema

  **What to do**:
  - Extend `AgentFrontmatter` in `src/features/opencode-agent-loader/types.ts` with:
    ```typescript
    interface OpenCodeAgentFrontmatter {
      name?: string
      description?: string
      model?: string
      temperature?: number
      tools?: string          // CSV: "read,write,edit,task"
      write_paths?: string[]  // Glob patterns: ["docs/**", "src/config/**"]
      tool_allowlist?: string[] // Explicit tool names allowed
      engine_min_version?: string // Semver: "1.0.0"
    }
    ```
  - Create a Zod schema for validation: `openCodeAgentFrontmatterSchema`
  - Add a parser function that validates frontmatter and returns typed result
  - Export types from the barrel

  **Must NOT do**:
  - DO NOT add this schema to `SQUAD.yaml` schema (`src/features/squad/schema.ts`) — that's handled by refactor-squad-creator plan
  - DO NOT make any field required — all optional with sensible defaults

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small type definition + Zod schema, single file change
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 3, 5, 6, 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/features/claude-code-agent-loader/types.ts:5-10` — Existing `AgentFrontmatter` interface. Extend this pattern with new fields.
  - `src/features/squad/schema.ts:1-108` — Zod schema patterns for SQUAD.yaml. Follow same validation style.
  - `src/config/schema.ts` — Main config Zod schema. Reference for Zod patterns used in this project.

  **WHY Each Reference Matters**:
  - `claude-code-agent-loader/types.ts` shows the existing frontmatter shape — extend, don't duplicate
  - `squad/schema.ts` shows Zod usage conventions for this project (`.optional()`, `.default()`, descriptions)

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test covers: valid frontmatter passes validation
  - [ ] Test covers: missing optional fields produce defaults
  - [ ] Test covers: invalid `write_paths` (non-array) produces validation error
  - [ ] Test covers: `engine_min_version` validates as semver string
  - [ ] `bun test` → PASS

  **Commit**: YES
  - Message: `feat(agent-loader): define agent frontmatter schema with write_paths and tool_allowlist`
  - Files: `src/features/opencode-agent-loader/types.ts`
  - Pre-commit: `bun test src/features/opencode-agent-loader/`

---

- [ ] 3. Implement Declarative Permission Model

  **What to do**:
  - Create `src/shared/agent-capabilities.ts`:
    ```typescript
    interface AgentCapabilities {
      write_paths: string[]    // Glob patterns for allowed write locations
      tool_allowlist?: string[] // Explicit tool names allowed (if set, deny all others)
      tool_denylist?: string[]  // Explicit tool names denied
      can_delegate: boolean    // Whether agent can use task/call_kord_agent
    }
    ```
  - Create `resolveAgentCapabilities(agentName, sources)` that merges capabilities from:
    1. Agent frontmatter (from .md file) — defaults
    2. Squad manifest `tools` field — if agent belongs to a squad
    3. `kord-aios.json` agent overrides — admin override (highest priority)
    4. Hardcoded defaults for T0/T1 agents — fallback for compiled agents
  - Migrate `DEFAULT_AGENT_ALLOWLIST` from `agent-authority/constants.ts` to be the fallback source for agents that don't have frontmatter capabilities
  - Export `getAgentCapabilities(agentName): AgentCapabilities`

  **Must NOT do**:
  - DO NOT delete `agent-authority/constants.ts` yet — keep as fallback for agents without frontmatter
  - DO NOT change the `agent-authority/index.ts` hook logic yet (Task 6)
  - DO NOT modify how `AGENT_RESTRICTIONS` works yet (Task 4)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core capability model that must be robust and well-tested
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4, 6
  - **Blocked By**: Task 2 (needs the frontmatter types)

  **References**:

  **Pattern References**:
  - `src/hooks/agent-authority/constants.ts:12-44` — `DEFAULT_AGENT_ALLOWLIST`: current hardcoded write paths per agent. These become the FALLBACK when no frontmatter exists.
  - `src/shared/agent-tool-restrictions.ts:14-45` — `AGENT_RESTRICTIONS`: current hardcoded tool denylists. These become the FALLBACK when no frontmatter exists.
  - `src/shared/permission-compat.ts` — `createAgentToolRestrictions()` and `createAgentToolAllowlist()`: existing permission helpers. Follow this pattern.

  **API/Type References**:
  - `src/features/opencode-agent-loader/types.ts` — `OpenCodeAgentFrontmatter`: the source of frontmatter capabilities (created in Task 2)
  - `src/features/squad/factory.ts:42-51` — How squad `tools` field is converted to permissions. Reference for merging squad-level capabilities.

  **WHY Each Reference Matters**:
  - `constants.ts` has the exact data that becomes the fallback — you need to understand every entry
  - `agent-tool-restrictions.ts` has tool denylists that must be preserved during migration
  - `permission-compat.ts` shows how OpenCode expects permissions — must produce compatible output

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file: `src/shared/agent-capabilities.test.ts`
  - [ ] Test: agent with frontmatter `write_paths: ["docs/**"]` → capabilities.write_paths === ["docs/**"]
  - [ ] Test: agent without frontmatter → falls back to `DEFAULT_AGENT_ALLOWLIST`
  - [ ] Test: unknown agent without frontmatter → capabilities.write_paths === [] (deny all writes)
  - [ ] Test: `can_delegate` defaults to `true` for all agents
  - [ ] Test: kord-aios.json override takes precedence over frontmatter
  - [ ] `bun test src/shared/agent-capabilities.test.ts` → PASS

  **Commit**: YES
  - Message: `feat(permissions): add declarative agent capabilities model with multi-source resolution`
  - Files: `src/shared/agent-capabilities.ts`, `src/shared/agent-capabilities.test.ts`
  - Pre-commit: `bun test src/shared/agent-capabilities.test.ts`

---

### Wave 2: Permission Integration

- [ ] 4. Enable `call_kord_agent` by Default

  **What to do**:
  - In `src/plugin-handlers/config-handler.ts`, change the global permission from:
    ```typescript
    config.permission = { task: "deny" }
    ```
    to:
    ```typescript
    config.permission = { task: "deny", call_kord_agent: "allow" }
    ```
  - This means all agents can use `call_kord_agent` (which invokes explore/librarian) by default
  - The per-agent `task: "deny"` still prevents direct delegation via `task()` unless explicitly allowed
  - Update `src/shared/agent-tool-restrictions.ts`:
    - Remove `call_kord_agent: false` from `EXPLORATION_AGENT_DENYLIST` (explore/librarian should not call themselves via call_kord_agent — keep this deny)
    - Remove `call_kord_agent: false` from `architect` restrictions (architect should be able to use explore/librarian)
  - Keep `call_kord_agent: "deny"` for kord, dev, planner, builder (they use `task` directly instead)

  **Must NOT do**:
  - DO NOT enable `task: "allow"` globally — that would let any agent delegate to any other agent
  - DO NOT change explore/librarian restrictions — they must remain read-only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small changes to config-handler.ts and agent-tool-restrictions.ts
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: None
  - **Blocked By**: Task 3 (capabilities model should exist first)

  **References**:

  **Pattern References**:
  - `src/plugin-handlers/config-handler.ts:459-464` — Current global permission setting. Change here.
  - `src/shared/agent-tool-restrictions.ts:7-12` — `EXPLORATION_AGENT_DENYLIST`: has `call_kord_agent: false`. Keep this for explore/librarian.
  - `src/shared/agent-tool-restrictions.ts:21-24` — Architect restrictions with `call_kord_agent: false`. Remove this.
  - `src/plugin-handlers/config-handler.ts:442-457` — Per-agent permission overrides. Keep `call_kord_agent: "deny"` for kord/dev/planner/builder (they use `task` instead).

  **WHY Each Reference Matters**:
  - Line 459-464 is THE global permission line — one change here affects every agent
  - Lines 442-457 show which agents get `task: "allow"` — these already have delegation, don't need `call_kord_agent`
  - `agent-tool-restrictions.ts` controls what tools are visible in prompts — must keep explore/librarian locked down

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: default agent (no explicit permissions) can see `call_kord_agent` tool
  - [ ] Test: explore agent CANNOT see `call_kord_agent` (kept in denylist)
  - [ ] Test: kord agent CANNOT see `call_kord_agent` (uses `task` instead)
  - [ ] Test: custom agent `course-creator` CAN see `call_kord_agent`
  - [ ] `bun test` → PASS (all existing tests still pass)

  **Commit**: YES
  - Message: `feat(permissions): enable call_kord_agent by default for all agents`
  - Files: `src/plugin-handlers/config-handler.ts`, `src/shared/agent-tool-restrictions.ts`
  - Pre-commit: `bun test`

---

- [ ] 5. Integrate Agent Loader with Override-First Resolution in Config Handler

  **What to do**:
  - In `src/plugin-handlers/config-handler.ts`, add step 6.5 between current steps 6 and 7:
    - Load OpenCode agents: `loadOpenCodeUserAgents()` and `loadOpenCodeProjectAgents()`
  - Update agent merge order (line ~380) to implement override-first resolution:
    ```typescript
    config.agent = {
      kord: builtinAgents.kord,  // Kord always first
      ...builtinAgents,          // Compiled defaults (T0+T1+T2)
      ...squadAgentConfigs,      // Squad agents
      ...openCodeUserAgents,     // User global overrides (~/.config/opencode/agents/)
      ...claudeUserAgents,       // Claude user agents (~/.claude/agents/)
      ...openCodeProjectAgents,  // Project overrides (.opencode/agents/) ← NEW
      ...claudeProjectAgents,    // Claude project agents (.claude/agents/)
      ...pluginAgents,           // Plugin agents
      ...filteredConfigAgents,   // kord-aios.json overrides (highest priority)
    }
    ```
  - This means `.opencode/agents/pm.md` will override the compiled `pm.ts` agent
  - Attach loaded `write_paths` from frontmatter to the agent config as metadata (store in a Map accessible to hooks)

  **Must NOT do**:
  - DO NOT change the order of kord being first (UI agent ordering depends on this)
  - DO NOT apply `migrateAgentConfig()` to OpenCode agents
  - DO NOT remove any existing merge steps

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Modifying the critical boot orchestrator — must be careful
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Tasks 7, 8
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/plugin-handlers/config-handler.ts:370-405` — Current agent merge logic. Insert OpenCode agents into this merge order.
  - `src/plugin-handlers/config-handler.ts:340-367` — Where Claude Code agents are loaded. Follow same pattern for OpenCode agents.
  - `src/features/claude-code-agent-loader/loader.ts:70-89` — `loadUserAgents()` and `loadProjectAgents()` pattern to replicate.

  **Documentation References**:
  - `src/plugin-handlers/AGENTS.md` — Config handler pipeline documentation. Step 6 is where external agents load.

  **WHY Each Reference Matters**:
  - Lines 370-405 is the EXACT merge order — inserting at wrong position breaks priority
  - Lines 340-367 show HOW external agents are currently loaded — replicate this pattern
  - AGENTS.md documents the pipeline — update it after changes

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: `.opencode/agents/pm.md` overrides compiled `pm` agent
  - [ ] Test: compiled default used when no override exists
  - [ ] Test: `kord-aios.json` agent override takes precedence over `.opencode/agents/`
  - [ ] Test: T0 agents (kord, dev, builder, planner) NOT overridable via `.opencode/agents/`
  - [ ] `bun test src/plugin-handlers/config-handler.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Override resolution order is correct
    Tool: Bash (bun test)
    Steps:
      1. Create mock .opencode/agents/pm.md with custom prompt
      2. Call config handler
      3. Assert: pm agent prompt matches .opencode/agents/pm.md content
      4. Assert: kord agent prompt is still compiled default (not overridable)
    Expected Result: pm overridden, kord preserved
    Evidence: bun test output
  ```

  **Commit**: YES
  - Message: `feat(config): integrate .opencode/agents/ loader with override-first resolution`
  - Files: `src/plugin-handlers/config-handler.ts`
  - Pre-commit: `bun test src/plugin-handlers/`

---

- [ ] 6. Update Agent Authority Hook to Read Declarative Permissions

  **What to do**:
  - Modify `src/hooks/agent-authority/index.ts` to:
    1. First check if agent has declared `write_paths` via the capabilities model (from Task 3)
    2. If yes, use those paths for authority checking
    3. If no, fall back to `DEFAULT_AGENT_ALLOWLIST` in `constants.ts`
  - Import and use `getAgentCapabilities(agentName)` from `src/shared/agent-capabilities.ts`
  - Update the path matching logic to use capabilities.write_paths instead of hardcoded lookup
  - Keep `BLOCKED_GIT_COMMANDS` unchanged — git safety is engine-level, not content-level
  - Log which permission source was used (frontmatter vs hardcoded) at debug level

  **Must NOT do**:
  - DO NOT remove `DEFAULT_AGENT_ALLOWLIST` from `constants.ts` — it's the fallback
  - DO NOT change git command blocking logic
  - DO NOT change the sanitization/normalization logic (lines 15-80)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Security-critical hook modification
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `src/hooks/agent-authority/index.ts:1-80` — Current path sanitization and normalization logic. DO NOT TOUCH.
  - `src/hooks/agent-authority/index.ts:80-208` — Authority checking logic. Modify this to use capabilities model.
  - `src/hooks/agent-authority/constants.ts:12-44` — `DEFAULT_AGENT_ALLOWLIST`. Keep as fallback.

  **API/Type References**:
  - `src/shared/agent-capabilities.ts` — `getAgentCapabilities()`: new capability resolver (from Task 3). Use this instead of direct lookup in `DEFAULT_AGENT_ALLOWLIST`.

  **WHY Each Reference Matters**:
  - `index.ts` lines 1-80 contain critical path sanitization — must not be touched
  - `constants.ts` becomes the fallback — understand every entry to ensure no regression

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: agent with frontmatter `write_paths: ["docs/**"]` can write to `docs/kord/prds/x.md`
  - [ ] Test: agent with frontmatter `write_paths: ["docs/**"]` CANNOT write to `src/index.ts`
  - [ ] Test: agent without frontmatter uses DEFAULT_AGENT_ALLOWLIST (backward compat)
  - [ ] Test: unknown agent without frontmatter or allowlist entry → blocked from writing
  - [ ] Test: custom agent `course-creator` with `write_paths: ["docs/**", "content/**"]` can write to both
  - [ ] `bun test` → PASS (all existing tests)

  **Commit**: YES
  - Message: `feat(agent-authority): read write_paths from agent capabilities instead of hardcoded allowlist`
  - Files: `src/hooks/agent-authority/index.ts`
  - Pre-commit: `bun test`

---

- [ ] 6.5. Squad Agent Namespace + Chief L2 Awareness

  **What to do**:
  - In `src/features/squad/factory.ts`, make three changes:

  **6.5a — Auto-prefix agent names with squad namespace:**
  - In `createAllSquadAgentConfigs()` (line 194-205), change:
    ```typescript
    // BEFORE:
    configs.set(name, createSquadAgentConfig(name, agentDef, manifest.name, resolvedPrompts))
    // AFTER:
    const registeredName = `squad-${manifest.name}-${name}`
    configs.set(registeredName, createSquadAgentConfig(registeredName, agentDef, manifest.name, resolvedPrompts))
    ```
  - Update `getSquadAgents()` (line 74-89) to use the same prefix for prompt injection
  - Update `buildSquadPromptSection()` (line 119-188) to show prefixed names in delegation syntax

  **6.5b — Chief gets `mode: "all"`, workers stay `mode: "subagent"`:**
  - In `createSquadAgentConfig()` (line 34-53), enforce mode based on `is_chief`:
    ```typescript
    const config: AgentConfig = {
      description: `(${squadName} squad) ${agentDef.description}`,
      mode: agentDef.is_chief ? "all" : (agentDef.mode ?? "subagent"),
      prompt: systemPrompt,
      // ...
    }
    ```

  **6.5c — Auto-generate chief awareness section:**
  - Create `buildChiefAwarenessSection(manifest, resolvedPrompts)` function that generates:
    - Team members table (name, description, skills, tool permissions)
    - Delegation routing (which agent handles which type of task)
    - Available skills across the squad
    - Contract type and quality expectations
  - Inject this section into chief's prompt BEFORE the `prompt_file` content
  - Only inject for agents where `is_chief: true`

  **Must NOT do**:
  - DO NOT change the `dev` squad YAML (it has no chief — no awareness section needed)
  - DO NOT break `buildSquadPromptSection()` for Kord — it uses raw agent names for delegation syntax. Update it to show the prefixed names.
  - DO NOT change the `squadAgentSchema` Zod schema (mode field stays as-is in YAML; factory overrides for chief)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple coordinated changes to factory.ts with naming, mode, and prompt generation logic
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Tasks 11, 12
  - **Blocked By**: None (can start immediately, but logically part of Wave 2)

  **References**:

  **Pattern References**:
  - `src/features/squad/factory.ts:25-53` — `createSquadAgentConfig()`: where mode override and awareness injection happen
  - `src/features/squad/factory.ts:56-68` — `buildDefaultSquadAgentPrompt()`: current thin chief prompt to be enhanced
  - `src/features/squad/factory.ts:74-89` — `getSquadAgents()`: needs prefixed names for prompt injection
  - `src/features/squad/factory.ts:119-188` — `buildSquadPromptSection()`: delegation syntax must use prefixed names
  - `src/features/squad/factory.ts:194-205` — `createAllSquadAgentConfigs()`: where auto-prefix is applied
  - `src/features/squad/schema.ts:15-34` — `squadAgentSchema`: mode, is_chief, skills, tools fields to read from

  **WHY Each Reference Matters**:
  - `factory.ts:194-205` is where naming collision currently exists — two squads with same agent name overwrite each other
  - `factory.ts:56-68` is the thin chief prompt that needs to become awareness-rich
  - `factory.ts:119-188` generates Kord's squad awareness — must reflect prefixed names

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: agent `writer` in squad `marketing` → registered as `squad-marketing-writer`
  - [ ] Test: two squads both defining `writer` → no collision, both registered with different prefixes
  - [ ] Test: chief agent gets `mode: "all"` regardless of YAML mode field
  - [ ] Test: non-chief agent gets `mode: "subagent"` by default
  - [ ] Test: chief prompt contains team awareness section with member names, skills, tools
  - [ ] Test: non-chief prompt does NOT contain team awareness section
  - [ ] Test: `buildSquadPromptSection()` outputs prefixed names in delegation syntax
  - [ ] `bun test src/features/squad/squad.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Auto-prefix prevents naming collisions
    Tool: Bash (bun test)
    Steps:
      1. Create two squad manifests: marketing (with agent "writer") and docs (with agent "writer")
      2. Call createAllSquadAgentConfigs() with both squads
      3. Assert: configs has key "squad-marketing-writer"
      4. Assert: configs has key "squad-docs-writer"
      5. Assert: both configs exist (no overwrite)
    Expected Result: Two distinct agents registered
    Evidence: bun test output

  Scenario: Chief awareness section is auto-generated
    Tool: Bash (bun test)
    Steps:
      1. Create squad manifest with chief + 2 workers (with skills and tools)
      2. Call createSquadAgentConfig() for chief
      3. Assert: prompt contains "Your Squad:" section
      4. Assert: prompt contains worker names with prefixed format
      5. Assert: prompt contains worker skills
      6. Assert: prompt contains delegation syntax with prefixed names
    Expected Result: Chief knows its full team
    Evidence: bun test output
  ```

  **Commit**: YES
  - Message: `feat(squad): auto-prefix agent names, chief mode:all, L2 awareness section`
  - Files: `src/features/squad/factory.ts`, `src/features/squad/squad.test.ts`
  - Pre-commit: `bun test src/features/squad/`

---

### Wave 3: Content Extraction

- [ ] 7. Convert T2 Agents to Overridable Format

  **What to do**:
  - For each T2 agent (pm, po, sm, qa, devops, data-engineer, ux-design-expert, squad-creator, analyst, plan-analyzer, plan-reviewer):
    1. Create `.md` file in `src/features/builtin-agents/` with frontmatter + prompt body
    2. Keep the compiled `.ts` file in `src/agents/` but have it read from the .md content at BUILD TIME
    3. The `.ts` file becomes a thin wrapper: reads embedded prompt, adds model config, returns AgentConfig
  - Frontmatter format for each agent:
    ```yaml
    ---
    name: pm
    description: "Product Visionary. Creates PRDs, epics, product strategy."
    temperature: 0.1
    write_paths:
      - "docs/**"
    tool_allowlist:
      - "read"
      - "write"
      - "edit"
      - "glob"
      - "grep"
      - "call_kord_agent"
    engine_min_version: "1.0.0"
    ---
    ```
  - At build time, the `.md` content is embedded as a string constant in the compiled output (no runtime disk read for defaults)
  - When a user places a `.opencode/agents/pm.md` override, the loader from Task 1 picks it up and the override resolution from Task 5 replaces the compiled default

  **Must NOT do**:
  - DO NOT convert T0 agents (kord, dev, builder, planner) — they have runtime logic
  - DO NOT convert T1 agents (explore, librarian, vision, dev-junior) — they are engine utilities
  - DO NOT change any agent's actual prompt content — same prompts, new format
  - DO NOT remove the `.ts` factory functions — they still handle model resolution and metadata

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 11 agents to convert, must preserve exact behavior
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3)
  - **Blocks**: Tasks 8, 10
  - **Blocked By**: Tasks 5, 6

  **References**:

  **Pattern References**:
  - `src/agents/pm.ts:43-116` — PM prompt: pure string, no runtime logic. This exact content becomes the .md body.
  - `src/agents/po.ts` — PO prompt: same pattern as PM. Convert identically.
  - `src/agents/sm.ts` — SM prompt: same pattern.
  - `src/agents/qa.ts` — QA prompt: slightly longer but same pattern.
  - `src/agents/devops.ts` — DevOps prompt.
  - `src/agents/data-engineer.ts` — Data Engineer prompt.
  - `src/agents/ux-design-expert.ts` — UX prompt.
  - `src/agents/squad-creator.ts` — Squad Creator prompt.
  - `src/agents/analyst.ts` — Analyst prompt.
  - `src/agents/plan-analyzer.ts` — Plan Analyzer prompt.
  - `src/agents/plan-reviewer.ts` — Plan Reviewer prompt.

  **API/Type References**:
  - `src/agents/types.ts:AgentPromptMetadata` — Metadata type. Keep in .ts wrapper.
  - `src/agents/utils.ts:createBuiltinAgents()` — Factory registry. Update to use .md-embedded prompts.

  **WHY Each Reference Matters**:
  - Each agent file shows the exact prompt to extract — must be byte-identical after conversion
  - `utils.ts` is the factory registry — must understand how agents are registered to update correctly

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: each converted agent produces identical `AgentConfig` output as before
  - [ ] Test: prompt content in compiled output matches original .ts prompt string
  - [ ] Test: `createPmAgent()` still returns valid AgentConfig
  - [ ] `bun test` → PASS (all existing tests unchanged)
  - [ ] `bun run build` → SUCCESS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Converted agents produce identical configs
    Tool: Bash (bun test)
    Steps:
      1. For each T2 agent, call factory before and after conversion
      2. Compare AgentConfig output field by field
      3. Assert: prompt, mode, temperature, description are identical
    Expected Result: Zero behavior change
    Evidence: bun test output
  ```

  **Commit**: YES
  - Message: `refactor(agents): convert T2 agents to overridable .md format with compiled defaults`
  - Files: `src/features/builtin-agents/*.md`, `src/agents/*.ts` (thin wrappers)
  - Pre-commit: `bun test && bun run build`

---

- [ ] 8. Create `kord-aios extract` CLI Command

  **What to do**:
  - Add `extract` subcommand to `src/cli/` that:
    1. Reads all bundled T2 agent .md files from compiled defaults
    2. Copies them to `.opencode/agents/` (or `--global` flag for `~/.config/opencode/agents/`)
    3. Reads all bundled SKILL.md files from compiled defaults
    4. Copies them to `.opencode/skills/` (or global)
    5. Reads bundled SQUAD.yaml and copies to `.opencode/squads/`
    6. Reads bundled command templates and copies to `.opencode/commands/`
    7. Prints summary: "Extracted N agents, N skills, N squads, N commands to .opencode/"
  - Support `--agents-only`, `--skills-only`, `--squads-only`, `--commands-only` flags
  - Support `--force` flag to overwrite existing files (default: skip existing)
  - Support `--diff` flag to show what would change without writing

  **Must NOT do**:
  - DO NOT extract T0/T1 agents — they are not overridable
  - DO NOT extract hooks or tools — they are engine-only
  - DO NOT modify any existing files — only create new ones

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New CLI command with multiple flags and file operations
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential after Task 7)
  - **Blocks**: Task 10
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `src/cli/install.ts:1-542` — Existing CLI installer. Follow the same patterns for output, prompts, error handling.
  - `src/cli/config-manager.ts` — Config management CLI patterns.

  **WHY Each Reference Matters**:
  - `install.ts` shows CLI conventions (output formatting, error handling, flag patterns) used in this project

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: `extract --agents-only` creates .md files in target directory
  - [ ] Test: `extract` without `--force` skips existing files
  - [ ] Test: `extract --diff` doesn't write any files
  - [ ] Test: extracted agent .md content matches compiled default
  - [ ] `bun test` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Extract agents to project directory
    Tool: Bash
    Preconditions: Clean .opencode/ directory
    Steps:
      1. Run: bunx kord-aios extract --agents-only
      2. Assert: .opencode/agents/pm.md exists
      3. Assert: .opencode/agents/po.md exists
      4. Assert: .opencode/agents/sm.md exists
      5. Assert: .opencode/agents/kord.md does NOT exist (T0, not extractable)
      6. Assert: stdout contains "Extracted 11 agents"
    Expected Result: T2 agents extracted, T0/T1 excluded
    Evidence: ls output + stdout captured
  ```

  **Commit**: YES
  - Message: `feat(cli): add kord-aios extract command for methodology content export`
  - Files: `src/cli/extract.ts`, tests
  - Pre-commit: `bun test`

---

### Wave 4: Polish

- [ ] 9. Add Compatibility Gating

  **What to do**:
  - In the agent loader (Task 1), check `engine_min_version` from frontmatter:
    ```typescript
    if (frontmatter.engine_min_version) {
      const currentVersion = getCurrentPluginVersion()
      if (!isVersionAtLeast(currentVersion, frontmatter.engine_min_version)) {
        log.warn(`Agent ${name} requires engine >= ${frontmatter.engine_min_version}, current: ${currentVersion}. Skipping.`)
        continue
      }
    }
    ```
  - Use existing `isOpenCodeVersionAtLeast()` pattern from `src/shared/opencode-version.ts` as reference for semver comparison
  - Create `getCurrentPluginVersion()` that reads from package.json or compiled constant
  - Log a clear warning when an agent is skipped due to version mismatch

  **Must NOT do**:
  - DO NOT throw errors — just skip with warning
  - DO NOT block plugin startup

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small version check addition to existing loader
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 10)
  - **Blocks**: Task 10
  - **Blocked By**: None (can start anytime, but logically after Task 1)

  **References**:

  **Pattern References**:
  - `src/shared/opencode-version.ts` — `isOpenCodeVersionAtLeast()`: semver comparison pattern. Adapt for plugin version.
  - `src/features/opencode-agent-loader/loader.ts` — Where to add the version check (from Task 1).

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: agent with `engine_min_version: "999.0.0"` is skipped with warning
  - [ ] Test: agent with `engine_min_version: "0.0.1"` is loaded normally
  - [ ] Test: agent without `engine_min_version` is loaded normally
  - [ ] `bun test` → PASS

  **Commit**: YES
  - Message: `feat(agent-loader): add engine_min_version compatibility gating`
  - Files: `src/features/opencode-agent-loader/loader.ts`
  - Pre-commit: `bun test`

---

- [ ] 10. Integration Tests + Documentation

  **What to do**:

  **Integration Tests:**
  - Create integration test: `src/features/opencode-agent-loader/integration.test.ts`
    - End-to-end: create temp `.opencode/agents/` dir → place .md files → run config handler → verify agents loaded with correct permissions
  - Create integration test: `src/hooks/agent-authority/integration.test.ts`
    - Agent with frontmatter write_paths can write to declared paths
    - Agent without frontmatter uses DEFAULT_AGENT_ALLOWLIST
    - Custom agent with no allowlist entry → write blocked

  **AGENTS.md Updates (per-directory knowledge bases):**
  - Update `src/agents/AGENTS.md`:
    - Add three-layer classification table (T0/T1/T2 with layer assignments)
    - Document which agents are overridable and how
    - Update tool restrictions table to reflect declarative model
  - Update `src/plugin-handlers/AGENTS.md`:
    - Add new step 6.5 (OpenCode agent loading) to CONFIG HANDLER PIPELINE
    - Update LOAD SOURCE PRIORITY table with `.opencode/agents/` entries
    - Document override-first resolution order
  - Update `src/features/AGENTS.md`:
    - Add `opencode-agent-loader/` entry to STRUCTURE section
    - Update LOADER PRIORITY table with agent loader paths
  - Update `src/hooks/agent-authority/AGENTS.md` (create if not exists):
    - Document declarative permission model
    - Document fallback to DEFAULT_AGENT_ALLOWLIST
    - Document `write_paths` frontmatter field
  - Update `src/features/squad/AGENTS.md`:
    - Document `hidden: true` for non-chief agents
    - Update FACTORY FUNCTIONS table

  **Root-level Documentation:**
  - Update `AGENTS.md` (project root):
    - Add three-layer architecture section to OVERVIEW
    - Update WHERE TO LOOK table with `opencode-agent-loader` entry
    - Update CONVENTIONS with agent override paths
  - Update `README.md`:
    - Update Architecture section to mention three-layer model
    - Update Agents section with overridability note
    - Add `.opencode/agents/` to agent loading paths
    - Update Configuration section with agent frontmatter format example
  - Update `docs/guide/features.md` (if exists):
    - Add section on custom agent creation via `.opencode/agents/`
    - Add section on agent overrides
    - Document `kord-aios extract` command
  - Update `docs/guide/configurations.md` (if exists):
    - Document agent frontmatter schema (`write_paths`, `tool_allowlist`, `engine_min_version`)
    - Document override resolution order

  **Must NOT do**:
  - DO NOT create new standalone documentation files — update existing files only
  - DO NOT write a migration guide (that's a follow-up task)
  - DO NOT update docs that don't exist — check with `existsSync` first

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration tests spanning multiple modules + doc updates
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final task)
  - **Blocks**: None (final)
  - **Blocked By**: Tasks 7, 8, 9

  **References**:

  **Pattern References**:
  - `src/plugin-handlers/config-handler.test.ts` — Existing config handler tests. Follow patterns for integration testing.
  - `src/agents/AGENTS.md` — Agent knowledge base to update with tier classification.
  - `src/features/AGENTS.md` — Features knowledge base to update with new loader entry.
  - `src/plugin-handlers/AGENTS.md` — Config handler pipeline docs to update.

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Integration test: full pipeline from .md file → loaded agent → permission check → write allowed/blocked
  - [ ] Integration test: override resolution (compiled < .opencode/ < kord-aios.json)
  - [ ] All AGENTS.md files updated with accurate information
  - [ ] `bun test` → PASS (all tests, including new integration tests)
  - [ ] `bun run build` → SUCCESS
  - [ ] `bun run typecheck` → SUCCESS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full end-to-end custom agent workflow
    Tool: Bash (bun test)
    Steps:
      1. Create temp directory with .opencode/agents/course-creator.md containing:
         ---
         name: course-creator
         description: "Creates course content"
         write_paths: ["docs/**", "content/**"]
         ---
         You are a course content creator...
      2. Run config handler with temp directory
      3. Assert: course-creator agent exists in config.agent
      4. Assert: course-creator can write to docs/courses/intro.md
      5. Assert: course-creator CANNOT write to src/index.ts
      6. Assert: course-creator CAN use call_kord_agent
    Expected Result: Custom agent fully functional with declared permissions
    Evidence: bun test output

  Scenario: Build and typecheck pass after all changes
    Tool: Bash
    Steps:
      1. Run: bun run typecheck
      2. Assert: exit code 0
      3. Run: bun run build
      4. Assert: exit code 0
      5. Run: bun test
      6. Assert: all tests pass
    Expected Result: No regressions
    Evidence: Command outputs captured
  ```

  **Commit**: YES
  - Message: `test(three-layer): add integration tests and update AGENTS.md documentation`
  - Files: integration test files, AGENTS.md files
  - Pre-commit: `bun test && bun run typecheck`

---

### Wave 5: L2-Squad Intelligence

- [ ] 11. Create CHIEF_COORDINATION_TEMPLATE Constant

  **What to do**:
  - Create `src/features/squad/chief-template.ts` with a compiled string constant `CHIEF_COORDINATION_TEMPLATE`
  - This template gives every squad chief a standard L2 coordination protocol, analogous to how kord.ts gives Kord its L2-Global orchestration
  - Template content must include:

  **Coordination Protocol section:**
  ```
  ## Coordination Protocol

  ### Task Decomposition
  When receiving a complex task that spans multiple expertise areas:
  1. Analyze which squad members are needed based on the task requirements
  2. Decompose into sub-tasks aligned with each member's expertise and skills
  3. Delegate via task(subagent_type="squad-{squad}-{agent}")
  4. For independent sub-tasks, delegate in parallel (multiple task() calls with run_in_background=true)
  5. Synthesize results and validate against domain quality gates

  ### When to Delegate vs Do It Yourself
  - Simple, single-domain task → Do it yourself (you have domain expertise)
  - Multi-expertise task → Decompose and delegate to specialists
  - Task outside your squad's domain → Escalate back to the caller

  ### Result Synthesis
  After sub-tasks complete:
  1. Collect results via background_output()
  2. Verify each result meets quality criteria
  3. Synthesize into a cohesive deliverable
  4. Report the consolidated result to the caller
  ```

  **Self-Optimization section:**
  ```
  ## Self-Optimization

  You can analyze and propose improvements to your squad:
  - Review agent prompts for clarity and completeness
  - Identify missing skills or tool permissions
  - Suggest new agents for capability gaps
  - Propose SQUAD.yaml improvements
  - Recommend skill additions based on recurring task patterns

  To optimize, read your squad's SQUAD.yaml and agent prompt files,
  then propose changes via edit tool.
  ```

  **Quality Gates section:**
  ```
  ## Quality Gates

  Before marking work complete:
  - [ ] All sub-tasks completed and verified
  - [ ] Domain-specific quality criteria met (see your domain methodology)
  - [ ] Deliverables match contract type expectations
  - [ ] No sub-agent reported errors or incomplete work
  ```

  - Import and use this template in `factory.ts` when building chief prompts
  - The template is appended AFTER the auto-generated awareness section and AFTER the custom `prompt_file` content

  **Must NOT do**:
  - DO NOT include domain-specific content — this is the GENERIC coordination framework
  - DO NOT duplicate Kord's orchestration logic (story-driven, wave planning) — that's L2-Global, not L2-Squad
  - DO NOT make the template configurable — it's a compiled constant like Kord's prompt

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core coordination template that defines L2-Squad behavior for all squads
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 12, 13)
  - **Blocks**: Task 12
  - **Blocked By**: Task 6.5 (chief awareness section must exist first)

  **References**:

  **Pattern References**:
  - `src/agents/kord.ts:1-100` — Kord's L2-Global orchestration prompt. Study this for the TONE and STRUCTURE of a coordination template. L2-Squad is analogous but domain-scoped.
  - `src/features/squad/factory.ts:56-68` — `buildDefaultSquadAgentPrompt()`: where the template will be injected (after awareness section, after prompt_file content)
  - `src/agents/build/default.ts` — Builder's orchestration prompt. Another example of L2-style coordination logic.

  **External References**:
  - Anthropic "Building effective agents" — Orchestrator-workers pattern: "A central LLM dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results."
  - Google Research "Towards a Science of Scaling Agent Systems" — Centralized coordination contains errors to 4.4x amplification vs 17.2x for independent.

  **WHY Each Reference Matters**:
  - `kord.ts` shows what L2-Global looks like — L2-Squad is the domain-scoped analogue
  - `build/default.ts` shows task decomposition patterns that the chief template should mirror
  - Research papers validate the coordination protocol design (decompose → parallel delegate → synthesize)

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: `CHIEF_COORDINATION_TEMPLATE` is a non-empty string constant
  - [ ] Test: template contains "Coordination Protocol" section
  - [ ] Test: template contains "Self-Optimization" section
  - [ ] Test: template contains "Quality Gates" section
  - [ ] Test: template references `task(subagent_type=...)` delegation syntax
  - [ ] `bun test src/features/squad/` → PASS

  **Commit**: YES
  - Message: `feat(squad): add CHIEF_COORDINATION_TEMPLATE for L2-Squad orchestration`
  - Files: `src/features/squad/chief-template.ts`, tests
  - Pre-commit: `bun test src/features/squad/`

---

- [ ] 12. Integrate Chief Template into Factory Prompt Assembly

  **What to do**:
  - Update `buildDefaultSquadAgentPrompt()` in `src/features/squad/factory.ts` to assemble chief prompts from three sources:
    ```typescript
    function buildChiefPrompt(
      agentName: string,
      agentDef: SquadAgent,
      squadName: string,
      manifest: SquadManifest,
      resolvedPrompts?: Record<string, string>,
    ): string {
      const parts: string[] = []

      // 1. Identity header
      parts.push(`You are ${agentName}, the chief coordinator of the ${squadName} squad.`)
      parts.push(`Role: ${agentDef.description}`)
      parts.push('')

      // 2. Auto-generated team awareness (from Task 6.5c)
      parts.push(buildChiefAwarenessSection(manifest, squadName))
      parts.push('')

      // 3. Custom domain methodology (from prompt_file or inline prompt)
      const customPrompt = resolvedPrompts?.[originalAgentName] ?? agentDef.prompt
      if (customPrompt) {
        parts.push('## Domain Methodology')
        parts.push(customPrompt)
        parts.push('')
      }

      // 4. Compiled coordination template (from Task 11)
      parts.push(CHIEF_COORDINATION_TEMPLATE)

      return parts.join('\n')
    }
    ```
  - Update `createSquadAgentConfig()` to call `buildChiefPrompt()` for chiefs and keep `buildDefaultSquadAgentPrompt()` for workers
  - The non-chief prompt remains simple: "You are X, a specialist agent. Focus on your specific task."
  - Ensure `resolvedPrompts` mapping still works with the original YAML key (not the prefixed name) for prompt_file resolution

  **Must NOT do**:
  - DO NOT change worker (non-chief) prompt logic
  - DO NOT inject the coordination template into non-chief agents
  - DO NOT make the template order configurable (awareness → custom → coordination is fixed)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core prompt assembly logic connecting awareness, custom content, and coordination template
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (after Task 11)
  - **Blocks**: Task 13, 14
  - **Blocked By**: Tasks 6.5, 11

  **References**:

  **Pattern References**:
  - `src/features/squad/factory.ts:25-68` — Current `createSquadAgentConfig()` and `buildDefaultSquadAgentPrompt()`. Replace chief path.
  - `src/features/squad/factory.ts:31-32` — Prompt resolution priority: `resolvedPrompts?.[agentName] ?? agentDef.prompt ?? buildDefault...`. Keep this priority but route to `buildChiefPrompt()` for chiefs.
  - `src/features/squad/chief-template.ts` — `CHIEF_COORDINATION_TEMPLATE` constant (from Task 11)

  **WHY Each Reference Matters**:
  - `factory.ts:25-68` is the EXACT code being modified — must understand current prompt resolution flow
  - Template import must use correct module path

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: chief prompt contains all three sections in order (awareness → custom → coordination)
  - [ ] Test: chief with `prompt_file` gets custom content injected between awareness and coordination
  - [ ] Test: chief WITHOUT `prompt_file` gets awareness + coordination (no empty "Domain Methodology" section)
  - [ ] Test: worker prompt is unchanged (simple specialist prompt)
  - [ ] Test: prompt_file resolution uses original YAML key, not prefixed name
  - [ ] `bun test src/features/squad/squad.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Chief prompt has all three layers assembled correctly
    Tool: Bash (bun test)
    Steps:
      1. Create squad manifest with chief (is_chief: true, prompt_file: "agents/chief.md")
      2. Create mock chief.md with domain methodology content
      3. Call createSquadAgentConfig() for the chief
      4. Assert: prompt starts with "You are squad-{squad}-chief"
      5. Assert: prompt contains "Your Squad:" (awareness section)
      6. Assert: prompt contains domain methodology content from chief.md
      7. Assert: prompt contains "Coordination Protocol" (from template)
      8. Assert: awareness section appears BEFORE domain methodology
      9. Assert: domain methodology appears BEFORE coordination protocol
    Expected Result: Three-layer prompt correctly assembled
    Evidence: bun test output

  Scenario: Worker prompt is NOT affected by chief template
    Tool: Bash (bun test)
    Steps:
      1. Create non-chief squad agent
      2. Call createSquadAgentConfig()
      3. Assert: prompt does NOT contain "Coordination Protocol"
      4. Assert: prompt does NOT contain "Your Squad:"
      5. Assert: prompt contains "Focus on your specific task"
    Expected Result: Workers unaffected
    Evidence: bun test output
  ```

  **Commit**: YES
  - Message: `feat(squad): integrate three-layer chief prompt assembly (awareness + custom + coordination)`
  - Files: `src/features/squad/factory.ts`, tests
  - Pre-commit: `bun test src/features/squad/`

---

- [ ] 13. Upgrade Squad Creator to Generate L2-Aware Chief Prompts

  **What to do**:
  - Update `src/agents/squad-creator.ts` to instruct the LLM to generate rich chief prompts that serve as domain L2 coordinators
  - Add to the `<creation_workflow>` section a new step between Agent Design and Skill Extraction:
    ```
    4.5. **Chief Design**: Create the chief agent's methodology prompt (agents/chief.md):
         - Domain-specific workflows (e.g., marketing: Research → Strategy → Creative → Deploy → Measure)
         - Quality gates specific to the domain
         - When the chief should delegate vs handle tasks directly
         - How to review and validate squad member work
         - Domain terminology and standards
    ```
  - Add a new `<chief_prompt_template>` section to the system prompt explaining:
    - The chief's prompt goes in `agents/chief.md` (referenced via `prompt_file`)
    - The factory auto-generates team awareness — DO NOT manually write team member lists
    - The factory appends the coordination template — DO NOT manually write delegation instructions
    - The chief.md should ONLY contain domain-specific methodology and quality standards
    - The chief MUST have `is_chief: true` and `mode: all` in SQUAD.yaml
  - Add example of a good chief.md prompt vs a bad one:
    ```
    GOOD (domain methodology only):
    ## Marketing Campaign Methodology
    ### Phase 1: Research
    Analyze market, competitors, audience segments...
    ### Phase 2: Strategy
    Define positioning, messaging, channels...
    ### Quality Gates
    - All copy reviewed for brand voice compliance
    - ROI projections validated against benchmarks

    BAD (duplicates auto-generated content):
    ## Your Team
    You have @media-buyer and @copywriter... ← DON'T DO THIS
    ## How to Delegate
    Use task(subagent_type=...) ← DON'T DO THIS
    ```
  - Update the `<squad_structure>` section to show that chief.md is mandatory for squads with `is_chief: true`
  - Update the SQUAD.yaml example to show `mode: all` for chief and auto-prefix naming convention

  **Must NOT do**:
  - DO NOT change the fundamental creation workflow (research → design → skill → template → validate)
  - DO NOT change tool restrictions for squad-creator agent
  - DO NOT add runtime logic — squad-creator is still a pure prompt (T2/L3 agent)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex prompt engineering — must correctly instruct the LLM to generate L2-aware chiefs
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 11, 12 after they complete)
  - **Blocks**: Task 14
  - **Blocked By**: Task 12 (must understand chief assembly to teach it correctly)

  **References**:

  **Pattern References**:
  - `src/agents/squad-creator.ts:41-234` — Current squad-creator prompt. Add new sections within existing structure.
  - `src/features/squad/factory.ts` (after Tasks 6.5 + 12) — The actual chief prompt assembly. Squad-creator must generate content that fits this assembly.
  - `src/features/squad/chief-template.ts` (from Task 11) — The compiled coordination template. Squad-creator must NOT duplicate this content.

  **External References**:
  - `D:\dev\synkra-aios\.aios-core\development\agents\aios-master.md` — Synkra's global orchestrator (400 lines). Shows rich orchestrator prompt patterns: commands, collaboration section, delegation table. Useful as reference for chief methodology richness.

  **WHY Each Reference Matters**:
  - `squad-creator.ts:41-234` is what gets modified — must fit within existing prompt sections
  - The factory code shows what the chief prompt assembly expects — squad-creator must generate compatible content
  - Synkra's aios-master shows what a rich orchestrator prompt looks like — chiefs should aspire to this level of domain richness

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test: squad-creator prompt contains `<chief_prompt_template>` section
  - [ ] Test: squad-creator prompt mentions `is_chief: true` and `mode: all`
  - [ ] Test: squad-creator prompt warns against duplicating auto-generated content
  - [ ] Test: squad-creator prompt shows chief.md example with domain methodology
  - [ ] `bun test` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Squad-creator prompt instructs L2-aware chief generation
    Tool: Bash (bun test)
    Steps:
      1. Read squad-creator.ts system prompt
      2. Assert: contains "chief" methodology instructions
      3. Assert: contains warning about NOT duplicating team awareness
      4. Assert: contains example of good vs bad chief.md
      5. Assert: SQUAD.yaml example shows mode: all for chief
    Expected Result: Squad-creator knows how to generate L2 chiefs
    Evidence: bun test output
  ```

  **Commit**: YES
  - Message: `feat(squad-creator): upgrade prompt to generate L2-aware chief with domain methodology`
  - Files: `src/agents/squad-creator.ts`
  - Pre-commit: `bun test`

---

- [ ] 14. Final Integration Tests + L2-Squad Documentation

  **What to do**:

  **Integration Tests for L2-Squad:**
  - Create `src/features/squad/l2-squad-integration.test.ts`:
    - End-to-end: create squad YAML with chief + workers → load → verify chief has awareness + coordination template
    - Verify auto-prefix naming across multiple squads
    - Verify chief `mode: "all"` enforcement
    - Verify worker prompts are unaffected

  **Update Documentation:**
  - Update `src/features/squad/AGENTS.md`:
    - Add "L2-Squad Architecture" section explaining chief as domain coordinator
    - Add "Agent Naming Convention" section explaining auto-prefix
    - Update "FACTORY FUNCTIONS" table with new functions (buildChiefPrompt, buildChiefAwarenessSection)
    - Add "Chief Prompt Assembly" section showing the three-layer prompt composition
  - Update `src/features/builtin-squads/AGENTS.md`:
    - Document naming convention for built-in squads
  - Update `README.md`:
    - Update Squads section with L2-Squad explanation
    - Add chief coordinator concept
    - Update SQUAD.yaml example with `mode: all` for chief
  - Update root `AGENTS.md`:
    - Add L2-Squad to layer architecture description
  - Update Task 10's AGENTS.md updates to include L2-Squad content

  **Must NOT do**:
  - DO NOT create separate documentation files — update existing files only
  - DO NOT duplicate task-level documentation in integration tests

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration tests spanning squad factory + chief template + documentation
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final task)
  - **Blocks**: None (final)
  - **Blocked By**: Tasks 12, 13

  **References**:

  **Pattern References**:
  - `src/features/squad/squad.test.ts` — Existing squad tests. Follow patterns for integration testing.
  - `src/features/squad/AGENTS.md` — Squad knowledge base to update with L2-Squad architecture.
  - `README.md` — Root README, squads section to update.

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Integration test: squad with chief → chief prompt has all three layers
  - [ ] Integration test: multiple squads → no naming collisions
  - [ ] Integration test: chief mode is "all", workers mode is "subagent"
  - [ ] All AGENTS.md files updated with L2-Squad information
  - [ ] `bun test` → PASS
  - [ ] `bun run build` → SUCCESS
  - [ ] `bun run typecheck` → SUCCESS

  **Commit**: YES
  - Message: `test(l2-squad): integration tests and L2-Squad documentation`
  - Files: integration test files, AGENTS.md files, README.md
  - Pre-commit: `bun test && bun run typecheck`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------| 
| 1 | `feat(agent-loader): add .opencode/agents/ loader` | opencode-agent-loader/ | `bun test` |
| 2 | `feat(agent-loader): define agent frontmatter schema` | opencode-agent-loader/types.ts | `bun test` |
| 3 | `feat(permissions): add declarative agent capabilities model` | shared/agent-capabilities.ts | `bun test` |
| 4 | `feat(permissions): enable call_kord_agent by default` | config-handler.ts, agent-tool-restrictions.ts | `bun test` |
| 5 | `feat(config): integrate .opencode/agents/ with override-first resolution` | config-handler.ts | `bun test` |
| 6 | `feat(agent-authority): read write_paths from capabilities` | agent-authority/index.ts | `bun test` |
| 6.5 | `feat(squad): auto-prefix agent names, chief mode:all, L2 awareness section` | squad/factory.ts | `bun test` |
| 7 | `refactor(agents): convert T2 agents to overridable .md format` | builtin-agents/*.md, agents/*.ts | `bun test && bun run build` |
| 8 | `feat(cli): add kord-aios extract command` | cli/extract.ts | `bun test` |
| 9 | `feat(agent-loader): add engine_min_version gating` | opencode-agent-loader/loader.ts | `bun test` |
| 10 | `test(three-layer): integration tests + docs` | integration tests, AGENTS.md | `bun test && bun run build && bun run typecheck` |
| 11 | `feat(squad): add CHIEF_COORDINATION_TEMPLATE for L2-Squad` | squad/chief-template.ts | `bun test` |
| 12 | `feat(squad): integrate three-layer chief prompt assembly` | squad/factory.ts | `bun test` |
| 13 | `feat(squad-creator): upgrade prompt for L2-aware chief generation` | agents/squad-creator.ts | `bun test` |
| 14 | `test(l2-squad): integration tests and L2-Squad documentation` | integration tests, AGENTS.md, README | `bun test && bun run typecheck` |

---

## Success Criteria

### Verification Commands
```bash
bun test                    # All tests pass (existing + new)
bun run typecheck           # No type errors
bun run build               # Successful build
```

### Final Checklist
- [ ] Custom agent in `.opencode/agents/course-creator.md` works with declared permissions
- [ ] `.opencode/agents/pm.md` overrides compiled default PM agent
- [ ] `kord-aios extract` exports T2 agents, skills, squads, commands
- [ ] `call_kord_agent` available to all agents by default
- [ ] T0/T1 agents unaffected by any changes
- [ ] Story-driven flow (planner → builder → kord → dev) works identically
- [ ] Squad agents auto-prefixed: `squad-{squad}-{agent}` naming convention
- [ ] Squad chief gets `mode: "all"` (visible in UI, usable as primary + subagent)
- [ ] Squad chief prompt contains auto-generated team awareness section
- [ ] Squad chief prompt contains CHIEF_COORDINATION_TEMPLATE
- [ ] Squad workers unaffected (simple specialist prompts, mode: subagent)
- [ ] Two squads with same agent name → no collision (auto-prefix)
- [ ] Squad-creator generates L2-aware chief.md with domain methodology
- [ ] All existing tests pass without modification
- [ ] No `@types/node`, `as any`, `@ts-ignore`, or empty catch blocks introduced
- [ ] All commits are atomic with passing tests
