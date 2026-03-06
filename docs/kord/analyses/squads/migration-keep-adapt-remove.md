# Squad Migration: Keep / Adapt / Remove

## Purpose

Classify the already-implemented squad work so execution can preserve the right foundations, refactor the shallow parts, and remove the misaligned concepts.

## Executive Summary

The existing squad implementation is not a failed direction. It is a **partial foundation**.

It correctly established:

- squads as first-class runtime entities,
- chief/worker hierarchy,
- user/global squad loading,
- authority and creation paths,
- and initial creator/validator infrastructure.

What it did **not** establish is the deeper Synkra-like model of:

- orchestration-aware squad packages,
- first-class squad tasks/workflows/assets,
- explicit workflow-engine integration,
- and deterministic package-level validation.

So the right migration posture is:

- **Keep** the foundations,
- **Adapt** the shallow implementation heavily,
- **Remove** the concepts that contradict the desired mental model.

## Keep

These are valid foundations and should remain unless implementation details need minor adjustments.

### 1. Chief/worker team model

- `src/features/squad/chief-template.ts`
- `src/features/squad/factory.ts`
- `src/features/builtin-squads/code/SQUAD.yaml`

**Why keep**:

- The idea that squads are teams coordinated by a chief remains correct.
- This is compatible with a deeper package/orchestration model.

### 2. User-controlled squad loading model

- `src/features/squad/loader.ts`
- `src/features/builtin-squads/AGENTS.md`

**Why keep**:

- Runtime loading from project/global user-controlled locations matches the intended direction.
- Export-only treatment for bundled squads is still correct.

### 3. Scoped squad creation authority

- `src/hooks/agent-authority/index.ts`
- `src/hooks/agent-authority/constants.ts`
- `src/hooks/agent-authority/agent-authority.test.ts`

**Why keep**:

- The authority model is useful regardless of whether squads become deeper packages.
- Global squad creation support remains needed.

### 4. On-demand skill philosophy

- `src/features/squad/chief-template.ts`
- `src/features/builtin-agents/squad-creator.md`
- `src/tools/skill/tools.ts`

**Why keep**:

- On-demand `skill()` loading remains the right philosophy.
- The problem is validation and packaging depth, not the skill-loading principle itself.

## Adapt

These pieces are useful, but must be significantly redesigned to support the real target model.

### 1. Squad schema

- `src/features/squad/schema.ts`

**Why adapt**:

- Current schema is too centered on agent declarations.
- It must evolve toward a package model that can represent squad assets and engine integration.

**Key changes needed**:

- remove `categories`,
- support richer package assets,
- define orchestration-aware fields without duplicating the shared workflow engine,
- model optional squad-local adapters explicitly.

### 2. Squad factory/runtime materialization

- `src/features/squad/factory.ts`

**Why adapt**:

- Current factory builds runtime agents, but not a broader package/runtime contract.
- It needs to materialize squad metadata that the workflow engine and validators can consume.

### 3. Squad validator

- `src/tools/squad-validate/tools.ts`

**Why adapt**:

- Current validation is a syntax/reference validator, not a package integrity validator.

**Key changes needed**:

- validate skill existence,
- validate package completeness,
- validate workflow/task references once package assets exist,
- validate engine compatibility,
- emit migration warnings and actionable remediation guidance.

### 4. Squad creator

- `src/agents/squad-creator.ts`
- `src/features/builtin-agents/squad-creator.md`
- `src/features/builtin-commands/templates/squad-create.ts`

**Why adapt**:

- Current creator supports squad creation, but not yet at deterministic package-authoring depth.

**Key changes needed**:

- research-first generation,
- package-aware output structure,
- deeper anti-generic prompt/process discipline,
- support for workflows/tasks/assets beyond agents,
- stronger validation loop during creation.

### 5. Squad documentation

- `AGENTS.md`
- `README.md`
- `src/features/squad/AGENTS.md`
- `src/features/builtin-agents/squad-creator.md`
- other docs under `docs/kord/` that describe squad behavior

**Why adapt**:

- The docs currently risk teaching the shallow model.
- Documentation must migrate with the architecture.

## Remove

These should be removed from squad semantics entirely.

### 1. Categories as a squad concept

- `src/features/squad/schema.ts`
- any tests/docs/examples that still mention categories

**Why remove**:

- Squads are teams, not routing categories.
- This concept creates the wrong mental model and directly conflicts with the clarified target architecture.

### 2. Any shallow framing that implies squads end at prompt-level delegation

- any docs/tests/examples that present squads as only chief prompt coordination

**Why remove**:

- The target is orchestration-aware packages integrated with the workflow engine.

## Migration Sequence Recommendation

### Phase 1: Semantic cleanup

- Remove `categories`
- Update docs so the mental model is corrected early

### Phase 2: Package model definition

- Redesign schema and package expectations
- Define engine integration contract

### Phase 3: Runtime and validation alignment

- Upgrade loader/factory/validator to match the package model

### Phase 4: Creator alignment

- Upgrade squad-creator to generate the new package depth deterministically

### Phase 5: Migration hardening

- Update tests, examples, docs, and built-in seed material

## Final Recommendation

Execution should treat the current squad implementation as:

- **foundation to preserve**,
- **architecture to deepen**,
- and **misaligned semantics to cleanly remove**.

This avoids waste while still acknowledging that the current implementation is only the shell relative to the desired full orchestration model.
