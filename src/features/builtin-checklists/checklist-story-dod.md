---
title: "Story Definition of Done"
type: checklist
status: active
created: "{DATE}"
---

# Story Definition of Done

Verify all items before marking story as complete.

## Code Complete

- [ ] Code implemented for all acceptance criteria
- [ ] No debug leftovers (console logs, temp flags, commented blocks)
- [ ] No type error suppression (no \`as any\`, \`@ts-ignore\`, \`@ts-expect-error\`)

## Testing

- [ ] Unit tests cover happy path and at least one failure path
- [ ] All relevant tests pass locally
- [ ] If no tests exist, story includes documented verification steps
- [ ] No regressions in previously working flows

## Review

- [ ] Self-review completed (diff reviewed, no unintended files)
- [ ] PR is review-ready (description, screenshots/logs if relevant)
- [ ] Review comments addressed or tracked as follow-ups

## Documentation

- [ ] Documentation updated where behavior changed
- [ ] Operational notes captured (config, env vars, migrations)

## Evidence

- [ ] Commands executed and captured in notes:
  - \`bun test\`
  - \`bun run build\`
