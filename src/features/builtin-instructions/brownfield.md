# Brownfield Project Instructions

This mode assumes your project has existing behavior that must not be broken.

## Safety First

- Preserve existing behavior by default
- Establish a baseline before refactoring
- Always have a rollback plan for risky changes

## Discovery Options

### Option A: PRD-First (Recommended for big changes)

- Define enhancement scope and constraints first
- Document only the impacted areas

### Option B: Document-First (Recommended when unfamiliar)

- Document the current system reality (including debt)
- Then write PRD/epic with real constraints

## Baseline Gates

- [ ] Tests/build baseline captured (what passes now)
- [ ] Critical flows identified with a minimal repro
- [ ] Rollback plan exists (revert path, feature flag, or staged rollout)

## Artifacts (Outputs)

- Discovery notes: `docs/kord/notepads/`
- Draft assessments: `docs/kord/drafts/`
- PRDs: `docs/kord/prds/`
- Stories: `docs/kord/stories/`

## Recommended Skills

- Primary path: run a shipped brownfield workflow from `.kord/workflows/`
- Escape hatches: `document-project`, `generate-shock-report`, `create-brownfield-story`

## Verification Commands

~~~bash
bun test
bun run build
~~~

## What Not To Do

- Do not rewrite large areas before baseline is established
- Do not change dependencies blindly
- Do not remove tests to "make it pass"
