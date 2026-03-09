# Squad Migration and Opportunities

## Purpose

Classify what to do with existing Kord squad work and identify where Kord can go beyond Synkra rather than only copying it.

## Keep / Adapt / Remove framing

### Keep as foundation

- chief/worker hierarchy concept,
- runtime squad loading from user-controlled locations,
- scoped authority handling for squad creation,
- on-demand skill philosophy,
- export-only treatment for bundled squads.

### Adapt significantly

- squad schema,
- squad validation depth,
- squad creator depth,
- runtime factory behavior,
- prompt guidance for chief coordination,
- docs and examples.

### Remove

- `categories` as a squad concept,
- any docs/prompts implying squads are routing categories,
- any assumption that squad functionality ends at prompt-level delegation.

## Opportunities where Kord can surpass Synkra

### 1. Cleaner engine boundary

Kord can be more explicit than Synkra about the boundary between:

- shared workflow engine,
- squad package layer,
- optional squad-local adapters.

### 2. Stronger validation

Kord can add deterministic validation that is highly actionable:

- skill existence,
- package completeness,
- chief/subteam routing integrity,
- workflow-engine compatibility,
- migration warnings with suggested fixes.

### 3. Better squad creator UX

Kord can create deeper squads without generic prompts by enforcing:

- research-first authoring,
- package-level generation,
- keep/adapt/remove recommendations,
- stronger template discipline,
- artifact-backed comparison notes.

### 4. Better integration with Kord methodology agents

Kord can make PM/SM/PO/Architect/Analyst artifacts part of squad design and validation in a more explicit and traceable way.

## Recommendation

The implementation plan should not only align Kord with Synkra’s depth. It should also explicitly capture where Kord intends to improve the model instead of merely reproducing it.
