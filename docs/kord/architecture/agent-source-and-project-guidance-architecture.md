# Agent Source of Truth & Project Guidance Architecture

**Status:** Accepted  
**Date:** 2026-03-07  
**Author:** Architect (Kord AIOS)  
**Scope:** Non-engine agent organization, prompt source of truth, project-mode scaffolding, greenfield/brownfield guidance delivery

---

## 1. Current State (Evidence-Based)

### 1.1 The Two-Layer Agent Reality

Kord AIOS already has a split between two agent populations:

| Population | Location | Prompt Source |
|---|---|---|
| **T0 engine agents** | `src/agents/kord/`, `src/agents/dev.ts`, `src/agents/builder/`, `src/agents/planner/` | Inline TypeScript string literals |
| **T2 methodology agents** | `src/agents/sm.ts`, `pm.ts`, `po.ts`, `qa.ts`, `devops.ts`, `data-engineer.ts`, `ux-design-expert.ts`, etc. | `.ts` wrapper that **imports** from `src/features/builtin-agents/*.md` via `prompts.ts` |

The T2 agents are *already* indirection-via-markdown. The pattern in `sm.ts` is canonical:

```ts
import { smPrompt } from "../features/builtin-agents/prompts"
const { body: smPromptBody } = parseFrontmatter(smPrompt)
const SM_SYSTEM_PROMPT = smPromptBody + SKILLS_PROTOCOL_SECTION
```

`src/features/builtin-agents/prompts.ts` is an **auto-generated file** (header says `DO NOT EDIT`) that embeds all `.md` files as template literals. The build step (`script/build-agent-prompts.ts`) performs the `.md → .ts` embedding.

**The source of truth for T2 prompt content is already `src/features/builtin-agents/*.md`.** The `.ts` wrappers exist to attach:
- Engine metadata (`AgentPromptMetadata`) used to build Kord's dynamic delegation table
- Tool restrictions (`createAgentToolRestrictions`)
- Model-specific branches (GPT vs Claude)
- Skills protocol injection (`SKILLS_PROTOCOL_SECTION`)

### 1.1.1 T2 Canonical Pattern

The canonical exportable T2 architecture is:

`src/features/builtin-agents/*.md` (authoring source) -> `script/build-agent-prompts.ts` (build embedding) -> `src/features/builtin-agents/prompts.ts` (generated artifact) -> `src/agents/*.ts` (engine wrappers).

Definitions:
- **Exportable agent**: the `.md` file is the user-facing content source that can be extracted/overridden.
- **Engine wrapper**: the `.ts` file wires runtime behavior (metadata, restrictions, model handling, prompt assembly) and is not the authoring surface.

This means there is **no whole-tree duplication problem** between architecture docs and implementation. The current markdown-plus-wrapper pattern is intentional and is the correct canonical design.

### 1.2 What the .ts Wrapper Actually Adds

Examining `sm.ts` vs `sm.md`:

| Concern | Lives In |
|---|---|
| Prompt body | `sm.md` (canonical) |
| Frontmatter: description, temperature, write_paths, tool_allowlist | `sm.md` (canonical) |
| `AgentPromptMetadata` (triggers, useWhen, avoidWhen for Kord's dynamic prompt) | `sm.ts` only |
| Tool restriction creation via SDK helper | `sm.ts` only |
| `SKILLS_PROTOCOL_SECTION` injection | `sm.ts` only |
| Factory function (`createSmAgent`) + `AgentConfig` assembly | `sm.ts` only |

### 1.3 Project-Mode Scaffolding (Current)

`kord-aios init` scaffolds `.kord/rules/project-mode.md` via `src/cli/scaffolder.ts:getProjectModeContent()`. This file:
- States `Project Mode: new|existing` and `Project Stage: NEW_SETUP|EXISTING_UNASSESSED`
- References guides at `.kord/guides/new-project.md` and `.kord/guides/existing-project.md`
- Lists stage-gate checklists
- References skills: `greenfield-kickoff`, `document-project`, `create-brownfield-story`

The `src/cli/status/index.ts` reads this file at runtime to display project state. The `src/hooks/rules-injector` (via directory-agents-injector pattern) injects `.kord/rules/*.md` into agent context automatically.

The `greenfield-fullstack` workflow in `src/features/builtin-workflows/greenfield-fullstack.yaml` encodes the 3-step greenfield sequence: `kickoff → architecture → implementation-plan`. There is currently **no brownfield workflow** as a builtin (the brownfield YAML is referenced in test fixtures for import testing but not shipped as a builtin).

---

## 2. Architectural Decisions

### 2.1 Non-Engine Agents: One Source of Truth

**Decision: `src/features/builtin-agents/*.md` is and remains the single source of truth for T2 prompt content.**

The `.ts` wrappers (`src/agents/sm.ts`, etc.) are **engine adapters**, not prompt files. They must remain because:

1. `AgentPromptMetadata` (triggers, useWhen, avoidWhen) cannot live in frontmatter — it drives Kord's dynamic delegation section, which is TypeScript-assembled at runtime from the `agentMetadata` map in `utils.ts`.
2. `createAgentToolRestrictions()` wraps an SDK-specific helper that operates on compiled types.
3. Model-branching (GPT vs Claude prompt variants) is a runtime concern, not authoring concern.
4. `SKILLS_PROTOCOL_SECTION` is a cross-cutting injection that belongs in TypeScript assembly, not in the source `.md`.

**What should NOT live in `.ts` wrappers:**
- Prompt body content (already correct)
- Tool permissions expressed as user-facing frontmatter (already correct — `tool_allowlist` in `.md` governs the override/export path)

**Implication**: Prompt authors edit `.md` files. The build step re-embeds them. This is already working. No structural change needed here.

### 2.2 Should `src/agents` Become Pure Engine Wrappers?

**Recommendation: Yes for T2; status quo for T0.**

For T2 agents (pm, po, sm, qa, devops, data-engineer, ux-design-expert, squad-creator, analyst, plan-analyzer, plan-reviewer), the `.ts` file should contain **only**:
- `AgentPromptMetadata` export
- `createXXXAgent()` factory (model wiring + tool restrictions + Skills Protocol injection)
- No inline prompt strings

This is 80% already true. The remaining gap: `architect.ts` carries its full prompt inline (no corresponding `.md` in `builtin-agents/`). This is intentional — Architect is a T1 specialist with complex model-branching logic and no planned exportable override path. It should remain engine-only.

### 2.3 Agent Classes: Engine-Only vs Exportable

| Class | Examples | Recommendation |
|---|---|---|
| **T0 orchestrators** — engine identity | kord, dev, builder, planner | Engine-only. Protected by loader (`T0 Protection`). Never export via `.md`. |
| **T1 specialists** — complex runtime logic | architect, librarian, explore, vision | Engine-only. These require model-specific branching, fallback chains, and tool allowlist composition that is fundamentally TypeScript. No `.md` in `builtin-agents/`. |
| **T2 methodology agents** — pure methodology, overridable | pm, po, sm, qa, devops, data-engineer, ux-design-expert, squad-creator, analyst, plan-analyzer, plan-reviewer | **Exportable.** `.md` in `builtin-agents/` is canonical. `init` exports these for user override. |
| **Dev-Junior** — category-spawned executor | dev-junior | Engine-only. Spawned from category routing; persona varies by model variant. |

Exportability boundary: if an agent can be meaningfully re-prompted without touching TypeScript (only methodology, not engine behavior), it belongs in the exportable T2 class.

### 2.3.1 Canonical Export Reference (Task 8 lock)

This section is the authoritative list for content-layer-curated-export-alignment Task 8.

#### Exportable T2 methodology agents (canonical `.md` source exists)

All of the following agents are exportable and have canonical prompt sources in `src/features/builtin-agents/`:

| Agent key | Canonical source file |
|---|---|
| `pm` | `src/features/builtin-agents/pm.md` |
| `po` | `src/features/builtin-agents/po.md` |
| `sm` | `src/features/builtin-agents/sm.md` |
| `qa` | `src/features/builtin-agents/qa.md` |
| `devops` | `src/features/builtin-agents/devops.md` |
| `data-engineer` | `src/features/builtin-agents/data-engineer.md` |
| `ux-design-expert` | `src/features/builtin-agents/ux-design-expert.md` |
| `squad-creator` | `src/features/builtin-agents/squad-creator.md` |
| `analyst` | `src/features/builtin-agents/analyst.md` |
| `plan-analyzer` | `src/features/builtin-agents/plan-analyzer.md` |
| `plan-reviewer` | `src/features/builtin-agents/plan-reviewer.md` |

Verification status on 2026-03-07: **11/11 present, no gaps found**.

#### Engine-only agent classes (not exportable via `builtin-agents/*.md`)

These remain compiled/engine-defined and are not part of the exportable T2 set:

- T0 orchestrators: `kord`, `dev`, `builder`, `planner`
- T1 specialists: `architect`, `librarian`, `explore`, `vision`
- Category-spawned engine executor: `dev-junior`

### 2.4 Should `project-mode` Scaffolding Be Removed or Replaced?

**Decision: Unify agent-facing guidance under `.kord/instructions/` and rely on installer-only project-type detection.**

The current `project-mode.md` serves two distinct purposes:
1. **Operational mode hinting**
2. **Onboarding guidance** — embeds stage-gate checklists and skill references

The second purpose should survive; the first does not require a persisted file.

**Post-migration structure:**
- `.kord/instructions/kord-rules.md` -> core always-on agent instruction content
- `.kord/instructions/greenfield.md` -> project-type instruction content for new projects
- `.kord/instructions/brownfield.md` -> project-type instruction content for existing projects

Export behavior:
- `init` always exports `kord-rules.md`
- `init` exports exactly one project-type instruction file (`greenfield.md` or `brownfield.md`) based on detected/selected project type

All onboarding checklist content moves into instructions and workflows. The installer remains responsible for detecting `new|existing`; no persistent project-state file is required.

### 2.5 Should Project-Type Guidance Live in Rules/Instructions/Guides?

**Decision: Instructions, with one canonical instruction surface.**

The folder name should reflect what the content actually is for the agent: instructions. The agent does not care whether the file came from a `rules` or `guides` folder; it consumes markdown instruction content.

Therefore:
- agent-facing content is unified under `.kord/instructions/`
- `kord-rules.md` becomes an instruction file, not a separate category
- project-type guidance uses one public methodology language: `greenfield|brownfield`
- internal backend detection may still use `new|existing`, but that is not the exported content vocabulary
- rerunning `init` remains the safe refresh path because it adds missing files without overwriting local overrides

**Concrete placement:**

| Content | Location |
|---|---|
| Core instruction content | `.kord/instructions/kord-rules.md` |
| Project-type instruction | `.kord/instructions/greenfield.md` or `.kord/instructions/brownfield.md` |
| Skill invocation guidance | Inside workflow YAML step `notes:` field |
| Quality standards | `.kord/standards/` (already correct) |

### 2.6 Is a Separate Kickoff Skill Redundant?

**Decision: Yes, if a greenfield workflow ships as a builtin.**

The `greenfield-kickoff` skill is referenced in `project-mode.md` and `project-layout.ts`. Its purpose — run a PRD interview then lock scope — is structurally identical to the `kickoff` step in `greenfield-fullstack.yaml` (`intent: interview`, `creates: docs/kord/prds/greenfield-prd.md`).

A workflow step with `intent: interview` is self-describing. If the workflow engine fully handles the kickoff phase (scope collection, PRD creation, gate verification), a separate skill is overhead — it adds a second invocation path users must choose between.

**Conditions under which the skill remains valuable:**
- As a standalone operation when the user does not want the full 3-step greenfield workflow (just scope → PRD, stop)
- If the skill carries methodology detail (interview question bank, PRD template guidance) that the workflow YAML does not inline

**Recommendation:** Keep `greenfield-kickoff` skill as a methodology reference, but remove it from `project-mode.md`'s skill list and from agent onboarding as a primary path. The workflow is the primary path. The skill is an escape hatch for partial invocation.

Similarly, `document-project` (brownfield discovery) belongs as a workflow step, not a standalone invocation path advertised in scaffolding.

---

## 3. Migration Implications for the Master Plan

### 3.1 What Changes

| Change | Effort | Impact |
|---|---|---|
| Remove `project-mode.md` from the exported instruction model | Quick | CLI output changes; update test fixtures |
| Add brownfield workflow YAML as a builtin | Short | Completes the greenfield/brownfield symmetry |
| Move onboarding guidance into `.kord/instructions/` assets | Short | Content-only move; no code changes |
| Update `project-layout.ts` constants that reference old skill list | Quick | String changes only |
| Update scaffolder test assertions for the new instructions-only output | Quick | Test-only |

### 3.2 What Does Not Change

- `src/features/builtin-agents/*.md` as canonical source of truth (already correct)
- The `prompts.ts` build-time embedding pipeline
- T0/T1 agent engine-only status
- The `opencode-agent-loader` override mechanism for T2 agents
- `AgentPromptMetadata` in `.ts` wrappers

### 3.3 Suggested Story Breakdown

**Story 1 (Short): Replace project-mode export with instructions-only output**
- Update scaffolding so agent-facing content is exported to `.kord/instructions/`
- Export `kord-rules.md` plus exactly one project-type instruction file: `greenfield.md` or `brownfield.md`
- Update scaffolder tests

**Story 2 (Short): Ship brownfield-discovery as builtin workflow**
- Create `src/features/builtin-workflows/brownfield-discovery.yaml` 
- Steps: `discovery (intent: research)` → `baseline-capture` → `implementation-plan (intent: handoff_to_plan)`
- Wire into `scaffolder.ts` alongside `greenfield-fullstack` (already referenced but missing as builtin)
- This makes the kickoff skill fully redundant as a primary path

**Story 3 (Quick): Update project-layout.ts constants**
- Remove or deprioritize `greenfield-kickoff`, `document-project`, `create-brownfield-story` from the primary skill guidance section
- Reference workflows as the primary path; list skills as escape-hatch alternatives

**Out of scope:** `architect.md` export parity
- `architect` remains a T1 engine-only specialist
- no `architect.md` export or parity work is part of this migration plan
- revisit only if a future product decision makes T1 specialist prompts user-overridable

---

## 4. Decision Log

| Question | Decision | Rationale |
|---|---|---|
| Where does T2 prompt content live? | `src/features/builtin-agents/*.md` (status quo, confirmed correct) | Already the canonical source; `.ts` wrappers are engine adapters, not prompt files |
| Should `src/agents/*.ts` become pure wrappers? | Yes for T2; T1 stays inline | T1 agents (architect, librarian, explore) have runtime branching that cannot be expressed in frontmatter |
| Which agents are exportable? | T2 methodology agents only | T0/T1 have engine identity or runtime logic that makes `.md`-only definition insufficient |
| Remove project-mode scaffolding? | Yes, from the exported content model | Installer detection already chooses greenfield/brownfield safely; no persistent state file is needed |
| Guidance in rules vs guides? | Instructions | The agent consumes markdown instruction content; one canonical instruction surface is clearer than split rule/guide semantics |
| Kickoff skill vs workflow? | Workflow is primary path; skill is escape hatch | Workflow encodes the sequence structurally; skill is now redundant as primary onboarding advice |
| Brownfield workflow as builtin? | Yes — add `brownfield-discovery.yaml` | Symmetry with greenfield; removes dependency on standalone skills for standard onboarding |

---

## 5. Escalation Triggers

Revisit this architecture if:

- A T1 agent (architect, librarian) requires user-override capability → migrate its prompt to `builtin-agents/` with engine-branching kept in `.ts`
- Workflow engine gains first-class `intent: kickoff` handling with built-in interview templates → the `greenfield-kickoff` skill can be fully retired
- installer behavior changes from safe add-missing-files semantics to overwrite-heavy semantics
