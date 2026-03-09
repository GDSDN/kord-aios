# .kord — Kord AIOS Project Configuration

This directory contains project-level methodology and configuration for Kord AIOS agents.

## Directory Structure

| Path | Purpose |
|------|---------|
| `templates/` | Story, ADR, PRD, task, and checklist templates |
| `checklists/` | Review and execution checklists |
| `instructions/` | Canonical project guidance exported by `init` |
| `standards/` | Quality gates, decision heuristics, best practices |
| `workflows/` | Project-local workflow copies and overrides |
| `squads/` | Custom SQUAD.yaml manifests |

## Usage

- Templates are used by `/plan` and `/start-work` commands
- Instructions define project-level operating guidance for Kord agents
- Standards provide guidance for agent decision-making
- Workflows are the primary execution path for greenfield and brownfield delivery

## Read Order (Recommended)

1. `.kord/instructions/kord-rules.md`
2. `.kord/instructions/greenfield.md` or `.kord/instructions/brownfield.md`
3. `.kord/standards/onboarding-depth-rubric.md`
4. `.kord/standards/methodology-artifacts-quality-rubric.md`

For details, see individual directory `AGENTS.md` files.
