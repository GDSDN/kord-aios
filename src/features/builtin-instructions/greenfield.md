# Greenfield Project Instructions

This mode assumes you are starting a new codebase (or a new product/module) and want a traceable delivery pipeline.

## Who This Is For

- Greenfield repositories with no legacy constraints
- Teams that want traceable artifacts (PRD -> Epic -> Stories -> QA)
- Projects where you want agents to follow a consistent methodology

## When Not To Use This

- If you are integrating into an existing codebase with production risk: use `.kord/instructions/brownfield.md`
- If you need only a one-off experiment and do not want artifacts: keep it lightweight

## Phases

### Phase 1: Requirements (PRD)

- Create a PRD using `.kord/templates/prd.md`
- Ensure requirements are testable and include success metrics

### Phase 2: Architecture + Epic

- Create an epic using `.kord/templates/epic.md`
- If architecture decisions are non-trivial, write an ADR using `.kord/templates/adr.md`

### Phase 3: Story Cycle

- Create stories using `.kord/templates/story.md`
- Validate with PO using `.kord/checklists/checklist-story-draft.md`
- Implement via `/start-work`
- Record QA outcomes using `.kord/templates/qa-gate.md` and `.kord/templates/qa-report.md`

## Gates

### Planning Gate

- [ ] PRD has clear goals, non-goals, and testable requirements
- [ ] Epic defines waves and dependencies

### Architecture Gate

- [ ] ADR exists for meaningful trade-offs
- [ ] Risks and mitigations are documented

### First Story Gate

- [ ] First story includes verification commands and failure modes
- [ ] Story scope is a single deliverable

## Artifacts (Outputs)

- PRDs: `docs/kord/prds/`
- Epics: `docs/kord/epics/`
- Stories: `docs/kord/stories/`
- Plans: `docs/kord/plans/`

## Recommended Skills

- Primary path: run a shipped greenfield workflow from `.kord/workflows/`
- Escape hatches: `greenfield-kickoff`, `create-next-story`, `validate-next-story`

## Verification Commands

~~~bash
bun test
bun run build
~~~

## Failure Modes

- Writing vague acceptance criteria (fix: rewrite as pass/fail)
- Starting implementation before the first story is validated (fix: PO gate)
- Letting scope creep across multiple deliverables (fix: split story)
