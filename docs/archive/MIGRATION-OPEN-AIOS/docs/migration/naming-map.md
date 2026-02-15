# Naming Map (OMOC -> Kord AIOS)

Use this map when reading legacy OMOC docs or code comments.

| OMOC name                | Kord AIOS name      | Compatibility alias               | Notes                                                                          |
| ------------------------ | ------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `sisyphus`               | `kord`              | `sisyphus` (kept)                 | Primary orchestrator/runtime identity is now `kord`.                           |
| `hephaestus`             | `deep`              | `hephaestus` (kept)               | Deep research subagent role is now `deep`.                                     |
| `oMoMoMo`                | `kord-aios`         | `oMoMoMo` (kept where referenced) | Project/product naming standardized to `kord-aios`.                            |
| `kord-aios` command | `kord-aios` command | `kord-aios` (kept)           | CLI docs should prefer `kord-aios`; old command remains supported as an alias. |

## Contributor rule of thumb

- Write new docs/issues/PRs with `kord`, `plan`, `build`, `build-loop`, `deep`, and `kord-aios`.
- Keep aliases only for backward compatibility and migration context (e.g., `hephaestus` → `deep`).
- When touching legacy text, update to new names unless a compatibility note is required.
