# Naming Map (OMOC -> Open-AIOS)

Use this map when reading legacy OMOC docs or code comments.

| OMOC name                | Open-AIOS name      | Compatibility alias               | Notes                                                                          |
| ------------------------ | ------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `sisyphus`               | `kord`              | `sisyphus` (kept)                 | Primary orchestrator/runtime identity is now `kord`.                           |
| `hephaestus`             | `deep`              | `hephaestus` (kept)               | Deep research subagent role is now `deep`.                                     |
| `oMoMoMo`                | `open-aios`         | `oMoMoMo` (kept where referenced) | Project/product naming standardized to `open-aios`.                            |
| `oh-my-opencode` command | `open-aios` command | `oh-my-opencode` (kept)           | CLI docs should prefer `open-aios`; old command remains supported as an alias. |

## Contributor rule of thumb

- Write new docs/issues/PRs with `kord`, `plan`, `build`, `build-loop`, `deep`, and `open-aios`.
- Keep aliases only for backward compatibility and migration context (e.g., `hephaestus` → `deep`).
- When touching legacy text, update to new names unless a compatibility note is required.
