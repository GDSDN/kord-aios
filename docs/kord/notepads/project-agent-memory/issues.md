## 2026-03-26

- RED tests currently failing in `src/features/project-memory/storage.test.ts` for local cache gitignore classification, workspace+branch metadata pathing, and layout initialization.
- One config contract test currently fails because nested budget defaults are not being materialized as expected in `ProjectMemoryConfigSchema`.
- Retrieval tests initially hit Windows `EBUSY` during temp cleanup (`search-index.db` WAL handles); stabilized with per-test temp roots and tolerant cleanup for `EBUSY`/`ENOENT` only.
- No functional regressions found in the new controls contract: `bun test src/features/project-memory/controls.test.ts` passes with workspace scoping, unknown-ID handling, and stale-prune expectations.
