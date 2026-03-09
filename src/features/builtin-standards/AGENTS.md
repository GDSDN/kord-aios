# .kord/standards — Quality Standards and Heuristics

This directory contains quality gates and decision heuristics for Kord AIOS agents.

## Files

| File | Purpose |
|------|---------|
| `quality-gates.md` | Checkpoints that must pass before advancing |
| `decision-heuristics.md` | Guidelines for agent decision-making |
| `onboarding-depth-rubric.md` | Auditable depth bar for new vs existing onboarding |
| `methodology-artifacts-quality-rubric.md` | Auditable quality bar for templates/checklists/standards/skills |

## Quality Gates

Quality gates are advisory checkpoints. Agents should verify relevant gates before marking work complete:

- **Planning Gate**: Requirements are clear and testable
- **Implementation Gate**: Code passes lint, typecheck, and tests
- **Review Gate**: PR follows project conventions
- **Agent Quality Gate**: Agent outputs meet quality standards

## Decision Heuristics

These heuristics guide agents when making technical decisions:

- Prefer explicit over implicit
- Prefer simple over complex (unless complexity is justified)
- Prefer reversible over irreversible
- Document trade-offs in ADRs
