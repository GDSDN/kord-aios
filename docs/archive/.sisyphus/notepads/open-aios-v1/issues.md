- 2026-02-08: `lsp_diagnostics` could not run for TypeScript files because `typescript-language-server` is not installed in this environment (`Command not found: typescript-language-server`).

## 2026-02-09 Tooling: LSP Diagnostics Not Available
- `lsp_diagnostics` fails because `typescript-language-server` is not installed in this environment.
- Mitigation: rely on `bun run typecheck`, `bun run build`, and `bun test` until LSP server is installed.
- 2026-02-08: `lsp_diagnostics` remains unavailable for changed TypeScript files in this environment because `typescript-language-server` is not installed; verification used `bun test` + `bun run typecheck`.
- 2026-02-09: When appending notes via Bash, unescaped backticks inside double-quoted shell strings triggered command substitution and mangled text; use single-quoted Python command or avoid backticks.
- 2026-02-09: lsp_diagnostics briefly reported missing typescript-language-server for one call but subsequent checks succeeded; keep bun run typecheck as primary verification in this environment.
