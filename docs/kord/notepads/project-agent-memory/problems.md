## 2026-03-26

- `lsp_diagnostics` could not be executed because `typescript-language-server` is not installed in PATH on this environment.
- Contract-first stubs in `src/features/project-memory/storage.ts` intentionally do not create files yet, so initialization assertions fail by design in this RED phase.
- `lsp_diagnostics` remains unavailable in this environment because `typescript-language-server` is not installed, so diagnostics verification must rely on `bun run typecheck` until the server is installed.
- `lsp_diagnostics` for `controls.ts`/`controls.test.ts` could not run for the same missing `typescript-language-server`; verification used `bun run typecheck` plus targeted Bun tests.
