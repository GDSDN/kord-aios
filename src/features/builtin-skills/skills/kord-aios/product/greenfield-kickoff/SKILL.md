---
name: greenfield-kickoff
description: "Greenfield kickoff: PRD + epic structure at Synkra-level depth (Kord-aligned)"
agent: pm
subtask: false
template: prd.md
argument-hint: "Describe what you want to build (1-3 paragraphs)"
---

# Greenfield Kickoff

Create the minimum set of high-quality artifacts needed to start a greenfield delivery pipeline.

## Purpose

- Translate a product idea into a testable PRD
- Create an epic structure that can be sharded into executable stories
- Set clear non-goals and verification expectations to prevent scope creep

## Outputs

Create these artifacts:

- PRD: `docs/kord/prds/{kebab-case-title}.md`
- Epic: `docs/kord/epics/{kebab-case-title}.md`

Optional (only if it helps execution clarity):

- Plan: `docs/kord/plans/{kebab-case-title}-kickoff.md`

## Instructions

1. Elicit requirements (fast but specific)
   - User + problem + success metrics
   - Must-haves vs should-haves vs non-goals
   - Constraints: timeline, security, performance, platform

2. Write the PRD using `.kord/templates/prd.md`
   - Ensure every requirement has acceptance criteria
   - Ensure non-goals are explicit
   - Ensure risks have mitigations

3. Create the epic using `.kord/templates/epic.md`
   - Split into waves where stories are parallelizable inside a wave
   - Make dependencies explicit
   - Include a "First Story Gate" requirement for the first wave

4. Handoff to the story pipeline
   - Delegate story creation to SM
   - Require PO validation before implementation

## Verification

- PRD contains measurable success metrics and testable acceptance criteria
- Epic waves are executable without hidden dependencies
- Artifacts are saved under `docs/kord/`

## Must NOT Do

- Do not write implementation details (that is for Architect/Dev)
- Do not invent technical constraints; if unknown, list as open questions
