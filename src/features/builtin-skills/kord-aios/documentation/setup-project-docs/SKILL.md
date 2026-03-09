---
name: setup-project-docs
description: "Set up a Kord-aligned documentation baseline (no legacy frameworks)"
agent: dev
subtask: false
---

# Setup Project Docs (Kord-Aligned)

Set up a minimal, Kord-aligned documentation baseline so future work is traceable.

## Purpose

- Ensure work artifacts have a stable home (`docs/kord/*`)
- Route agents to the correct templates, rubrics, and onboarding guides

## Outputs

- `docs/kord/drafts/project-docs-setup.md` (what exists today + what is still missing)

## Instructions

1. Detect the project mode
   - Check `.kord/instructions/greenfield.md` or `.kord/instructions/brownfield.md`.
   - If neither exists, assume existing-project safety until proven greenfield.

2. Confirm scaffolding exists
   - `.kord/templates/` exists
   - `.kord/standards/` exists (including both rubrics)
   - `.kord/instructions/` exists
   - `.kord/workflows/` exists

3. For new projects (greenfield)
   - Prefer the shipped greenfield workflow from `.kord/workflows/`.
   - Use `greenfield-kickoff` only as an escape hatch when the workflow is not the right fit.

4. For existing projects (brownfield)
   - Prefer the shipped brownfield workflow from `.kord/workflows/`.
   - Use `document-project` only as an escape hatch for focused documentation work.

5. Write a short setup note
   - What was generated
   - What should be done next
   - Which skills to run next

## Must NOT Do

- Do not reference or generate `core-config.yaml` or any external workflow engine.
- Do not claim documentation exists if you did not generate it.
