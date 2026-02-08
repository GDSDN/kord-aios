# Upstream Sync Strategy (open-aios)

## Remotes
- `upstream`: `https://github.com/code-yeongyu/oh-my-opencode.git` (OMOC source)
- `origin`: your `open-aios` fork repository (set this after creating GitHub repo)

## Recommended Flow
1. Keep OMOC engine directories upstream-owned:
   - `src/cli/**`, `src/tools/**`, `src/hooks/**`, `src/features/**`, `src/shared/**`
2. Keep AIOS layer directories project-owned:
   - `layer/aios/**`
   - integration glue files and docs under `docs/migration/**`
3. Sync OMOC regularly:
   - `git fetch upstream`
   - `git rebase upstream/master` (or merge)
4. Re-apply/verify AIOS glue after sync:
   - run `npm run sync:aios-layer`
   - run typecheck/tests

## Update Cadence
- OMOC: follow releases/hotfixes
- AIOS layer: periodic import when skills/templates/rules evolve

## Conflict Rule
If OMOC engine and AIOS layer conflict, prefer OMOC engine behavior and move AIOS customization to layer adapters.
