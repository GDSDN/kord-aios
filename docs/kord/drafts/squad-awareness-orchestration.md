# Draft: Squad Awareness & Orchestration Handoff

## Requirements (confirmed)
- Squad awareness injected into Kord + Planner + Builder prompts at boot
- Pattern follows skill injection (`SQUADS_AWARENESS_SECTION` like `SKILLS_PROTOCOL_SECTION`)
- Planner delegates to squad chiefs (not individual workers)
- Chiefs orchestrate workers internally

## Confirmed Direction: Hybrid B+C ("Council + Autonomy")

### Core Principle
Chiefs are BOTH consultants AND autonomous executors:
- **Consultation mode**: Orchestrators (kord/planner/builder) can consult chiefs for domain expertise during planning
- **Execution mode**: Chief receives an objective → breaks into subtasks → delegates to workers → monitors results
- **User-initiated**: User can directly invoke a squad chief for focused execution (e.g., `/start-work --squad-plan`)

### Open Architectural Questions (user-identified, needs deep research)

**Q1: Plan granularity — Big vs Small**
- Option A: Planner generates ONE big plan (e.g., "launch product") with OKRs split across squads
- Option B: Planner generates focused plans per domain (e.g., "marketing plan", then "feature plan")
- Option C: Both — planner can create either; chiefs can also generate their own domain-specific plans
- User leaning: unclear, wants research. Tradeoff is coordination overhead vs focus.

**Q2: Who generates domain-specific plans?**
- Option A: Planner generates all plans (gets a skill per domain to understand context)
- Option B: Chiefs generate domain plans when consulted directly (plan-mode via skill?)
- Option C: Planner generates high-level, chiefs decompose into squad-level sub-plans
- User concern: "Does the planner get a skill to generate per-segment plans, or does the chief squad get plan capabilities?"

**Q3: Sub-boulder for squads?**
- Chiefs maintaining execution state via a sub-boulder mechanism
- Enables: resume, user-initiated squad execution, independent progress tracking
- New concept: `squad-boulder` or nested boulder? How does it relate to existing boulder.json?

**Q4: Squad memory and work control**
- Each squad needs its own artifact namespace (confirmed)
- Mirror existing `docs/kord/` structure at squad level? (e.g., `docs/kord/squads/marketing/plans/`, `docs/kord/squads/marketing/stories/`)
- Memory: how do squads maintain cross-session context? Same as agents today, or something new?

**Q5: Framework-level question**
- This goes beyond Synkra AIOS's capabilities (L2 global orchestrator but no L2 per-squad autonomy)
- Google scaling agents paper relevant for multi-team orchestration patterns
- Need to research: how do existing multi-agent frameworks handle team-level planning + execution?

## Research Findings
- Skills: injected via `SKILLS_PROTOCOL_SECTION` + `buildAgent()` prepend
- Squads: loaded at boot but NO awareness injected into any orchestrator
- task() has no squad parameter; squad agents callable via subagent_type with full prefixed name
- SQUAD.yaml has `description` field at squad level (usable for awareness)
- Chief has L2 awareness (knows its workers) + coordination template
- NO sub-plan / sub-boulder mechanism exists today

## Phasing Decision (confirmed)
- **Phase 1 (NOW)**: Squad Awareness Injection — ship immediately
  - SQUADS_AWARENESS_SECTION into kord/planner/builder prompts
  - Follow skills injection pattern
  - Clean, well-scoped, immediate value
- **Phase 2 (LATER)**: Squad Execution + Planning Architecture — deep research
  - Sub-boulder, chief plan-mode, artifact namespaces, coordination topology
  - Requires architect consultation + external research
  - Separate plan

## Phase 1 Scope Boundaries
- INCLUDE: awareness injection into kord/planner/builder, squad catalog generation at boot, protocol section constant
- EXCLUDE: sub-boulder, chief plan-mode, squad artifact namespaces, task() squad parameter, execution handoff

## Phase 1 Detailed Requirements (confirmed)

### Awareness Content
- List available squads with: name, description, agent roster
- Include delegation protocol: `task(subagent_type="squad-{name}-chief", prompt="...")`
- Format: XML section similar to `<available_skills>` → `<available_squads>`

### Generation Method
- Dynamic: iterate loaded squad manifests at boot time
- Auto-generated from SQUAD.yaml `name`, `description`, and `agents` entries
- Zero config: create a squad → it appears in orchestrator awareness automatically
- Handle edge cases: 0 squads (no section injected), 1 squad, N squads

### Injection Targets
- Kord (src/agents/kord.ts)
- Planner (src/features/builtin-agents/planner.md or wrapper)
- Builder (src/hooks/build/index.ts or agent prompt)

### Test Strategy
- Unit tests for `buildSquadAwarenessSection()`:
  - 0 squads → empty string
  - 1 squad → correctly formatted section
  - N squads → all listed with correct names/descriptions
  - Section includes delegation guidance

## Artifact Namespace (confirmed direction)
- Squads get their own write space, likely mirroring docs/kord/ at squad level
- Enters larger question of "agent/squad memory and work control"
- Exact structure TBD after architecture research
