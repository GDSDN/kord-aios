---
title: "Pre-Push Checklist"
type: checklist
status: active
created: "{DATE}"
---

# Pre-Push Checklist

Run this checklist before pushing to remote.

## Local Verification

- [ ] All tests passing locally
- [ ] Linting passes
- [ ] Type checking passes
- [ ] No console.log or debug code

## Commit Quality

- [ ] Commits are atomic
- [ ] Commit messages are descriptive
- [ ] No unintended files included

## Final Review

- [ ] Self-review completed
- [ ] Code changes verified
- [ ] Related issues linked

## Evidence

- [ ] Ran and recorded:
  - \`bun run typecheck\` (if present)
  - \`bun run build\`
  - \`bun test\`
