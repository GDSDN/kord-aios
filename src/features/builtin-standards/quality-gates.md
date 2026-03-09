# Quality Gates

Advisory checkpoints that agents should verify before marking work complete.

## Planning Gate

- [ ] Requirements are clear and testable
- [ ] Acceptance criteria have pass/fail conditions
- [ ] Dependencies are identified
- [ ] Scope is manageable (single deliverable)

### Evidence

- [ ] A plan exists in `docs/kord/plans/` with executable steps
- [ ] Stories reference `.kord/templates/story.md` and include verification steps

## Implementation Gate

- [ ] Code compiles without errors
- [ ] Tests pass (unit + integration)
- [ ] Linting passes
- [ ] No type errors
- [ ] No debug code (console.log, etc.)

### Evidence

- [ ] `bun test` passes (or failures are documented as pre-existing)
- [ ] `bun run build` passes (when the project has a build command)

## Review Gate

- [ ] PR description is complete
- [ ] Code follows project conventions
- [ ] No AI comment bloat
- [ ] No "as any", "@ts-ignore", "@ts-expect-error"

### Evidence

- [ ] PR links to story/plan and includes verification performed

## Agent Quality Gate

- [ ] Output is actionable (not vague)
- [ ] Decisions are explained
- [ ] Trade-offs are documented
- [ ] Edge cases are considered
