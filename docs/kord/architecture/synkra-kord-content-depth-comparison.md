# Synkra vs Kord Content Depth Comparison

## Scope

This artifact captures the content-system comparison that should inform Kord's final content-layer architecture plan.

It focuses on:
- how Synkra/AIOX organizes methodology content
- what Kord should borrow versus reject
- workflow depth discrepancies, especially `greenfield-fullstack`
- why simplification matters architecturally

## Synkra/AIOX Organization Model

Synkra/AIOX organizes methodology as a project content pack on disk.

Key characteristics:
- workflows live as YAML files on disk
- deep guides exist alongside the workflow YAMLs
- commands/tasks are file-based content
- templates, checklists, and standards are content artifacts rather than hidden code constants
- the system assumes agents can read those files directly as part of execution

## Kord Current Model

Kord currently mixes:
- compiled runtime engine code
- file-based builtin content for some categories
- scaffold-only one-shot content for other categories
- project-local methodology that is richer than what the plugin actually ships

This means Kord has partial content-layer behavior, but not one coherent source-of-truth model yet.

## Borrow vs Reject Matrix

| Pattern | Borrow / Reject | Why |
|---|---|---|
| File-based methodology ownership | Borrow | Needed to make content inspectable, extractable, and maintainable |
| Profile / preset delivery model | Borrow | Fits curated export and avoids exporting everything blindly |
| Drift / manifest / checksum thinking | Borrow | Needed so exported content does not silently rot |
| Deep workflow handoff/gate richness | Borrow selectively | Useful for content depth, but must be adapted to Kord runtime capabilities |
| Deploy-engine-into-project packaging | Reject | Kord wants compiled engine + exported content, not full engine duplication |
| Structural cloning of `.aiox-core/` | Reject | Kord should use its own plugin/content architecture, not mirror Synkra layout verbatim |

## Workflow Depth Discrepancy: `greenfield-fullstack`

### Synkra original

`D:/dev/synkra-aios/.aios-core/development/workflows/greenfield-fullstack.yaml`

Observed characteristics:
- multi-phase flow
- explicit bootstrap, planning, sharding, and development cycle phases
- rich notes and handoffs
- optional paths and decision guidance
- much higher methodology depth

### Kord builtin shipped version

`src/features/builtin-workflows/greenfield-fullstack.yaml`

Observed characteristics:
- only 3 top-level steps
- simplified interview / research / handoff structure
- no equivalent phase depth
- no comparable bootstrap/sharding/development-cycle richness

### Kord project-local version

`.kord/workflows/greenfield-fullstack.yaml`

Observed characteristics:
- much richer adapted Synkra import
- raw source metadata retained
- richer sequence and guidance retained
- not currently equal to the shipped builtin source

## Architectural Meaning Of The Workflow Gap

The workflow issue is not only about where files live.

It proves that Kord currently has different layers of methodology depth:
- a simplified builtin layer
- a slightly richer scaffold assumption layer
- a much richer project-local imported layer

So the final architecture plan must decide:
- what depth Kord truly ships as builtin workflow content
- what remains project-local or reference-only
- whether simplification is intentional product design or unplanned drift

## Why Simplification Matters

If Kord ships simplified builtin content while richer content lives only in local development artifacts, then:
- users do not receive the real framework depth
- documentation can describe one system while shipped content behaves like another
- export/install/init architecture cannot be designed correctly because the canonical source is unclear

This is architecture debt, not just content debt.

## Planning Implications

1. Workflow tasks in the final implementation plan must be tied to explicit depth/classification analysis, not just file movement.
2. The final master plan must distinguish:
   - source-proven content debt in Kord
   - architecture decisions for canonical ownership
   - Synkra/AIOX-inspired patterns used to shape the solution
3. The final plan should avoid pretending that the current builtin workflow set already represents the intended product depth.

## Evidence Files

- `D:/dev/synkra-aios/.aios-core/development/workflows/greenfield-fullstack.yaml`
- `src/features/builtin-workflows/greenfield-fullstack.yaml`
- `.kord/workflows/greenfield-fullstack.yaml`
- `src/cli/scaffolder.ts`
- `docs/kord/workflows/import-report-greenfield-fullstack.md`
