---
title: "PR Review Checklist"
type: checklist
status: active
created: "{DATE}"
---

# PR Review Checklist

Use this checklist when reviewing pull requests.

## Build

- [ ] Code compiles without errors
- [ ] Tests pass
- [ ] No linting errors

## Code Quality

- [ ] No AI comment bloat
- [ ] No "as any" type assertions
- [ ] No "@ts-ignore" or "@ts-expect-error"
- [ ] Follows codebase patterns
- [ ] No hardcoded secrets

## Functionality

- [ ] Requirements met
- [ ] Edge cases handled
- [ ] Error cases handled

## Security

- [ ] No security vulnerabilities
- [ ] Input validation present
- [ ] Authentication/authorization correct

## Evidence

- [ ] PR description links to story/plan and explains verification
- [ ] Risky changes have rollback notes (feature flag, config toggle, revert path)
