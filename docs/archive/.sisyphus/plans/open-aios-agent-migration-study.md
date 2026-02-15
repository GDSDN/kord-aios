# Kord AIOS Agent Migration Study (Story-Driven Core)

Generated: 2026-02-08
Scope: Redesign agent architecture from zero for OMOC engine + AIOS framework

## 1) Direct Answer to Your Core Questions

- Yes: there is role overlap today between Sisyphus, Atlas, and AIOS-Master concepts.
- Yes: if Kord AIOS is story-driven-first, agent contracts must be redesigned first (before large code migration).
- Yes: AIOS-first naming should be the base, with selective custom agents where OMOC has clear superiority.

This document defines the target contracts and migration strategy.

## 2) Evidence Snapshot (Current Systems)

OMOC evidence:
- `src/agents/sisyphus.ts`: Sisyphus is an orchestration-heavy primary agent with delegation logic and governance-heavy behavior.
- `src/agents/atlas/index.ts:4`: Atlas orchestrates completion of all tasks via `task()` and is explicitly a conductor.
- `src/agents/atlas/default.ts:13`: Atlas identity is "Master Orchestrator" and "You DELEGATE, COORDINATE, and VERIFY".
- `src/agents/sisyphus-junior/index.ts:2`: Sisyphus-Junior is focused executor for delegated tasks.
- `src/agents/hephaestus.ts:96`: Hephaestus is autonomous deep worker for heavy execution/research.
- `src/agents/types.ts:4`: agent mode split (`primary`, `subagent`) already exists and should be reused for contract enforcement.

AIOS evidence:
- `docs/guides/user-guide.md:80`: role-first agent IDs (`@dev`, `@qa`, `@architect`, `@pm`, `@po`, `@sm`, `@analyst`, `@devops`, `@ux-expert`, `@aios-master`).
- `docs/architecture/command-authority-matrix.md:11`: one-command-one-owner authority model.
- `docs/guides/user-guide.md:144`: explicit command ownership and delegation expectation.

## 3) Root Architectural Problem (Current)

The current shape has two orchestration centers in OMOC (`sisyphus` and `atlas`) while AIOS introduces another governance center (`aios-master`).

If we keep these three as separate top-level authorities, we get:
- duplicated orchestration policy,
- conflicting escalation paths,
- story-state corruption risk (multiple actors changing state),
- unclear ownership for `*command` authority.

## 4) Proposed Kord AIOS Agent Architecture

### 4.1 Design Principle

- Single governance authority for framework contract.
- Separate interactive builder from autonomous loop runner.
- Keep role-first names from AIOS for UX consistency.
- Use OMOC strengths via specialization, not via duplicate orchestrators.

### 4.2 Canonical Topology (Direct Rename Strategy)

Primary agents:
- `@kord`: framework governor, authority matrix owner, story policy owner.
- `@build`: interactive implementation orchestrator (human-in-the-loop).
- `@build-loop`: autonomous executor loop (batch execution with verification gates).
- `@plan`: planning decomposition and readiness checks.

Specialists:
- `@dev-junior` (derived from Sisyphus-Junior): focused implementer for atomic tasks.
- `@dev-senior` (derived from Hephaestus): deep executor for complex implementation and high-risk refactors.
- `@qa`, `@architect`, `@pm`, `@po`, `@sm`, `@analyst`, `@devops`, `@data-engineer`, `@ux-expert`.

Utilities:
- `@researcher` (from librarian), `@code-explorer` (from explore), `@multimodal-analyst` (from multimodal-looker).

## 5) Contract Model (Most Important Part)

### 5.1 Story State Ownership Contract

Only these agents can mutate story states:
- `@sm`: DRAFT -> PLANNING -> READY_FOR_DEV
- `@build` / `@build-loop`: READY_FOR_DEV -> IN_PROGRESS -> READY_FOR_REVIEW
- `@qa`: READY_FOR_REVIEW -> APPROVED or back to IN_PROGRESS
- `@kord`: final policy checks and COMPLETED transition

All other agents are read-only regarding story state.

### 5.2 Command Authority Contract

- Enforce AIOS matrix: one `*command` = one owner.
- Non-owner agents must reroute, never execute owner-only commands.
- `@kord` validates matrix consistency at startup.

### 5.3 Dev Tier Contract (`dev-senior` vs `dev-junior`)

`@dev-junior`:
- scope: single-task implementation, predictable files, low coupling.
- forbidden: architecture-level decisions, wide refactors, policy changes.

`@dev-senior`:
- scope: complex cross-module changes, high-uncertainty debugging, major performance/security fixes.
- can call `explore/librarian`, can propose architecture deltas, but cannot self-approve story completion.

### 5.4 Orchestrator Separation Contract

`@kord`:
- owns framework rules, command authority, escalation routing, quality-gate policy.
- does not perform day-to-day coding orchestration loops.

`@build`:
- owns interactive coding flow and specialist delegation in active story.

`@build-loop`:
- owns autonomous loop execution and stop/continue logic for unattended runs.

This resolves the Sisyphus/Atlas/AIOS-Master overlap by replacing them with contract-specific roles.

### 5.5 Artifact Source-of-Truth Contract

- Canonical story/framework artifacts live in `docs/kord-aios/*`.
- Agent runtime scratch/state can exist in `.kord-aios/state` and `.kord-aios/evidence`, but these are not product truth.
- Agent prompts and hooks must reference `docs/kord-aios/*` for story status, acceptance criteria, and architecture decisions.

### 5.6 Kord Prompt Contract (Framework + Engine)

`@kord` prompt must explicitly include:
- AIOS framework governance: command authority, story lifecycle, quality gates, escalation policy.
- OMOC execution discipline: delegate/verify/ship pattern, multi-provider-safe structure, tool governance, anti-slop guardrails.
- self-optimization mandate: propose framework/runtime improvements with evidence and no contract violations.

## 6) Naming Recommendation

Given your requirement, recommended rollout naming is direct replacement (no alias layer):

- Governance: `@kord` (single source of framework authority)
- Execution: `@build` and `@build-loop`
- Planning: `@plan`
- Dev tiers: `@dev-junior` and `@dev-senior`

## 7) Migration Strategy for Agents (Concrete)

### Step A - Direct Rename + Contract Insertion (No Alias)

- Add canonical agent IDs in registry and schema.
- Replace OMOC names directly in registry/prompt/config (scripted rename).
- Add startup validator that checks command-owner uniqueness.

### Step B - Split Prompt Responsibilities

- Extract shared orchestration prompt blocks into reusable modules.
- Build dedicated prompt packs:
  - governor pack (`@kord`)
  - interactive pack (`@build`)
  - autonomous pack (`@build-loop`)
  - execution tiers (`@dev-junior`, `@dev-senior`)

### Step C - Enforce Story Contracts in Hooks

- Add story-state guard hook.
- Add command-authority guard hook.
- Add escalation contract checks (owner mismatch, illegal state transition).

### Step D - Remove Overlapping OMOC Personas

- rename `sisyphus` -> `@build`.
- rename `atlas` -> `@build-loop`.
- rename `hephaestus` -> `@dev-senior`.
- rename `sisyphus-junior` -> `@dev-junior`.
- remove deprecated names from schema/registry after migration patch lands.

### Step E - Lock Story-Driven Governance

- `@kord` required for workflow bootstrap and final completion transition.
- no story completion without QA evidence attached.

## 8) Implementation Backlog (Agent-Focused)

1. Registry/schema extension for new agent IDs.
2. Prompt contract templates for governor/build/build-loop/dev tiers.
3. Star-command owner map implementation.
4. Story-state transition guard implementation.
5. Legacy name removal from schema/registry/config.
6. Tests for unauthorized command execution and invalid state transitions.

## 9) Recommendation (Clear)

I recommend this exact direction:
- Base everything on AIOS role naming.
- Keep OMOC execution engine unchanged at core.
- Create explicit two-tier dev model (`dev-junior`, `dev-senior`) exactly as you proposed.
- Keep one framework governor (`@kord`) and stop using overlapping top-level orchestrator identities.

If we follow this contract-first migration, story-driven behavior becomes deterministic and the rest of the system becomes much easier to implement safely.
