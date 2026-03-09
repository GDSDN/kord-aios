# Continuity Notes — Plans 2 & 3

## Plan 2: Init & Delivery (`init-delivery`)

### Scope
Everything needed to make `bunx kord-aios init` and `bunx kord-aios extract` deliver the full methodology to projects.

### Must Include
- [ ] `init` command calls `extract` automatically (or offers to)
- [ ] `extract` exports: agents → `.opencode/agents/`, skills → `.opencode/skills/`, commands → `.opencode/commands/`
- [ ] All 11 templates scaffolded by init (not just story + ADR)
- [ ] Antigravity model configuration — make provider models configurable in kord-aios.json instead of hardcoded
- [ ] kord-rules.md moved to discoverable location (`docs/kord/rules/` or `.kord/rules/`) AND rules-injector updated to find it
- [ ] Init scaffolds `docs/kord/stories/`, `docs/kord/epics/`, `docs/kord/prds/` output directories
- [ ] Config migration for existing projects upgrading from older versions

### Key Research Findings (from Plan 1 investigation)
- `init` creates: .opencode/kord-aios.json, .kord/templates/{story,adr}.md, kord-rules.md (ROOT), .kord/squads/code/SQUAD.yaml, docs/kord/{plans,drafts,notepads}
- `extract` exists separately but init doesn't call it
- Rules-injector searches: .github/instructions/, .cursor/rules/, .claude/rules/, docs/kord/rules/ — NOT project root
- Antigravity models are hardcoded in model-requirements.ts

### Files to Investigate
- `src/cli/install.ts` (542L) — Interactive CLI installer
- `src/cli/scaffolder.ts` — Scaffold logic (extended in Plan 1)
- `src/shared/model-requirements.ts` — Hardcoded model defaults
- `src/hooks/rules-injector/` — Rules discovery paths

---

## Plan 3: Squad Polish (`squad-polish`)

### Scope
Make squad loading, creation, and the full E2E squad experience work correctly.

### Must Include
- [ ] Squad loading from `.kord/squads/` and `.opencode/squads/` verified E2E
- [ ] `/squad-create` command creates properly structured SQUAD.yaml
- [ ] Squad creator templates reference the correct agent pool
- [ ] E2E verification: create squad → load squad → dispatch task → squad agent responds
- [ ] Squad manifest validation (SQUAD.yaml v2 schema)
- [ ] Documentation: how to create, load, and use squads

### Key Research Findings (from Plan 1 investigation)
- Built-in squad name is `code` (not `dev`)
- SQUAD.yaml agent fields include `fallback` and `write_paths`
- Chief agents auto-enable `permission.task = "allow"`
- Squad agents receive convention write paths (`docs/kord/squads/{squad}/**`)
- Squad names are collision-guarded against reserved built-in agent names

### Files to Investigate
- `src/features/builtin-squads/code/SQUAD.yaml` — Default shipped squad
- `src/tools/squad-load/` — Squad loading tool
- `src/tools/squad-validate/` — Squad validation tool
- `src/features/builtin-commands/templates/squad-create.ts` — Squad creation command
