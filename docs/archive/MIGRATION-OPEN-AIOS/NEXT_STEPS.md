# Next Steps (Suggested)

## Stabilization vs Upstream

Do not reset back to upstream; classify drift and revert only accidental changes.

```bash
git fetch upstream
git diff --name-only upstream/dev...HEAD
```

## Decide Layer strategy (`layer/`)

`layer/` is currently untracked. Decide to commit it as install payload or move needed parts into `payload/`.
