# Decision Heuristics

Guidelines for agents making technical decisions.

## General Principles

1. **Explicit over implicit**: Make assumptions visible
2. **Simple over complex**: Avoid unnecessary complexity
3. **Reversible over irreversible**: Prefer reversible decisions
4. **Document trade-offs**: Use ADRs for significant choices

## Code Decisions

- Follow existing patterns in the codebase
- Name variables clearly (self-documenting)
- Keep functions focused (single responsibility)
- Error handling: fail fast with clear messages

## Architecture Decisions

- Consider scalability, performance, security
- External dependencies should be documented
- API contracts should be defined
- Data flow should be understood

## Trade-off Analysis

When making decisions, consider:

- **Pros**: Benefits of the approach
- **Cons**: Costs and risks
- **Alternatives**: Other options considered
- **Mitigation**: How to address downsides

## When to Stop and Escalate

- If requirements are mutually exclusive, document it and checkpoint with PO
- If verification is impossible (no tests, no build), document the gap and add a QA plan
- If a change is irreversible, prefer an ADR first
