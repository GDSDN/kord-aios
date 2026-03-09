# Issues — content-layer-curated-export-alignment

## [2026-03-07] Known Issues at Start

- `src/cli/extract.ts` exists and has tests (`extract.test.ts`) — both must be handled in Task 1
- `src/cli/scaffolder.ts` hardcodes 2 workflow IDs — fixed in Task 15
- `src/cli/status/index.ts` reads `project-mode.md` at runtime — fixed in Task 6
- `src/hooks/rules-injector` injects `.kord/rules/*.md` — legacy files could reactivate — fixed in Task 6
- `src/cli/project-layout.ts` is a hidden canonical source for templates, checklists, guides, standards, rules, project guidance — all as TS string literals — fixed in Tasks 3-7
- `src/features/builtin-workflows/` has only 1 workflow — fixed in Tasks 12-16
- Methodology skill export flattens domain hierarchy — fixed in Task 2
- `src/features/builtin-agents/prompts.ts` is auto-generated (DO NOT EDIT) — `.md` files are canonical
