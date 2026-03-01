## 2026-03-01 Plan Start: three-layer-architecture

- Notes will be appended after each completed task.

## Task 1: Create OpenCode Agent Loader (2026-02-28)

### Learnings

- **Pattern Replication**: Successfully replicated the claude-code-agent-loader pattern for OpenCode agents
- **Key Decision - Filename vs Frontmatter Name**: The task specifies agents are keyed by filename without `.md`, not by frontmatter `name` field
- **Description Formatting**: Similar to claude-code-agent-loader, prepend agent name to description for identification
- **TDD Approach**: Wrote tests first (RED), then implementation (GREEN), which caught several issues:
  - Test expected description to contain agent name
  - Test expected key to be filename, not frontmatter name
- **Error Handling**: Gracefully handles missing directories (returns `{}`) and malformed frontmatter (skips file)
- **Tools Parsing**: Implemented comma-separated tools parsing with lowercase normalization (matching claude-code-agent-loader behavior)

## Task 2: Define Agent Frontmatter Schema (2026-02-28)

### Learnings

- **Zod Schema Design**: Created `openCodeAgentFrontmatterSchema` with all optional fields for backward compatibility
- **Parser Helper Pattern**: Implemented `parseOpenCodeAgentFrontmatter()` returning a discriminated union `{ ok: true; value: T } | { ok: false; error: string }` for explicit error handling
- **Semver Validation**: Added lightweight regex-based semver validation for `engine_min_version` field (Task 9 will handle runtime gating)
- **Type Safety**: Used Zod's `safeParse()` with explicit type casting to handle ZodError issues array
- **Loader Integration**: Updated loader to use the new parser, skipping agents with invalid frontmatter shapes without crashing
- **Additional Validation**: Added runtime checks for `write_paths` and `tool_allowlist` being arrays (defense in depth beyond Zod)

## Task 4: Enable call_kord_agent by Default (2026-02-28)

### Learnings

- **Two-Layer Permission System**: Kord AIOS has two permission layers:
  1. Global permissions in `config.permission` (applied to all agents)
  2. Per-agent permission overrides in `config-handler.ts`
- **Default Permission Behavior**: Unknown tools are DENIED by default in OpenCode, so we must explicitly `allow` tools we want available
- **call_kord_agent vs task**: `call_kord_agent` is for spawning explore/librarian (read-only), while `task` is for category-based delegation
- **Architect Access**: Removed architect from restriction deny list to allow them to spawn explore/librarian
- **Explore/Librarian Lockdown**: These agents still cannot call `call_kord_agent` (denied in agent-tool-restrictions.ts EXPLORATION_AGENT_DENYLIST)
- **Test Coverage**: Added tests for:
  - Global permission includes call_kord_agent: "allow"
  - kord/dev/planner/builder deny call_kord_agent
  - explore/librarian deny call_kord_agent in restrictions
  - architect no longer denies call_kord_agent (now allowed by global default)

## Task 6: Update Agent Authority Hook to Read Declarative Permissions (2026-02-28)

### Learnings

- **getAgentCapabilities Integration**: Hook now uses `getAgentCapabilities(agentName)` for write permission resolution
- **Precedence Order**: The resolver handles:
  1. T0/T1 agents (kord, dev, dev-junior) get ["**"] access
  2. Agents in DEFAULT_AGENT_ALLOWLIST get fallback paths
  3. Unknown agents get empty array (deny all)
- **Backward Compatibility**: Legacy agents without frontmatter still work via DEFAULT_AGENT_ALLOWLIST fallback
- **Debug Logging**: Added logging to show which source was used (capabilities vs hardcoded vs none)
- **Path Sanitization**: Kept all existing path normalization/sanitization logic unchanged
- **Git Blocking**: Kept existing git command blocking logic unchanged

## Task 7: Convert T2 Prompt-Only Agents to Overridable .md Defaults (2026-03-01)

### Learnings

- **Final embedding pattern**: For each T2 wrapper, import `../features/builtin-agents/<agent>.md?raw`, run `parseFrontmatter()`, and feed only `body` into runtime prompts.
- **Prompt composition rule**: Keep `SKILLS_PROTOCOL_SECTION` in TypeScript composition (`promptBody + SKILLS_PROTOCOL_SECTION`) rather than embedding it in markdown, so markdown stays static and override-friendly.
- **Compatibility preservation**: Existing exported prompt constants (`QA_SYSTEM_PROMPT`, `ANALYST_SYSTEM_PROMPT`, `PLAN_ANALYZER_SYSTEM_PROMPT`, `PLAN_REVIEWER_SYSTEM_PROMPT`) can remain, but must source from parsed markdown body to avoid duplicate inline prompt blocks.

## Task 6.5: Squad Agent Namespace + Chief L2 Awareness (2026-03-01)

### Learnings

- **Namespace safety**: Registering squad agents as `squad-{manifest.name}-{yamlKey}` removes cross-squad key collisions while preserving readable delegation targets.
- **Prompt key stability**: `prompt_file` resolution must continue to use the original YAML key (`resolvedPrompts[yamlKey]`), even after runtime name prefixing.
- **Chief runtime policy**: `is_chief` works best as an authority flag that enforces runtime `mode: "all"`, independent of declared YAML mode.
- **L2 awareness composition**: Chief prompts can be safely augmented with an auto-generated awareness section containing members, skills, tools summary, and exact prefixed delegation syntax.

## Task 8: Create `kord-aios extract` CLI command (2026-03-01)

### Learnings

- **Consistent flag strategy**: Category filters (`--agents-only`, `--skills-only`, `--squads-only`, `--commands-only`) work as a combinable include set; when no filter is passed, extraction defaults to all content sets.
- **Content mapping boundaries**: Keeping command extraction scoped to `builtin-commands/templates/` (excluding `*.test.ts`) preserves methodology artifacts without pulling implementation wiring files.
- **Global path reliability**: Reusing `getOpenCodeConfigDir({ binary: "opencode", checkExisting: false })` gives stable cross-platform global extraction behavior and honors `OPENCODE_CONFIG_DIR` in tests.
- **Safe overwrite semantics**: `--force` as explicit opt-in plus default skip behavior avoids accidental local customization loss in `.opencode/`.

## Task 11: Create CHIEF_COORDINATION_TEMPLATE Constant (2026-03-01)

### Learnings

- **Template Compilation**: The template is a pure string constant compiled at build time, not read at runtime - this ensures fast initialization and no filesystem dependencies.
- **Coordination Protocol Design**: Followed existing orchestration patterns from kord.ts (task management sections) and factory.ts (delegation syntax formatting).
- **Three-Pillar Structure**: Template covers coordination (delegation workflow), self-optimization (performance reflection), and quality gates (checklist-driven validation).
- **Domain-Agnostic Placeholders**: Used `{squad}` and `{agent}` placeholders to ensure the template works for any squad without domain-specific content.
- **Test Coverage**: Created 11 test cases covering all required sections, delegation syntax presence, and domain-agnostic placeholders.

## Task 12: Integrate Chief Template into Factory Prompt Assembly (2026-03-01)

### Learnings

- **Three-layer chief prompt composition**: Chiefs now get: (1) identity header from default prompt, (2) Squad Awareness section, (3) custom domain content (if any), (4) coordination protocol template
- **Custom content resolution**: Both `prompt_file` (resolved via yamlKey) and inline `prompt` are extracted as custom domain content, placed after awareness but before coordination
- **Identity header separation**: For chiefs, the base identity is always the default prompt - custom content from prompt_file/inline is added separately to maintain clear layering
- **Non-chief behavior preserved**: Worker prompts remain unchanged - they receive custom content OR default prompt, no awareness or coordination sections injected
- **Test verification**: Added 4 new tests covering coordination protocol presence, absence in workers, and ordering of awareness/custom/coordination sections

## Task 13: Upgrade Squad Creator to Generate L2-Aware Chief Prompts (2026-03-01)

### Learnings

- **Prompt assembly alignment**: The squad-creator.md prompt must align with actual factory.ts behavior - awareness is auto-generated from SQUAD.yaml, delegation syntax is auto-generated, CHIEF_COORDINATION_TEMPLATE is appended
- **Chief.md content boundaries**: Chief prompt files should contain ONLY domain methodology + quality gates - NOT team lists, NOT delegation syntax, NOT coordination protocols (factory handles these)
- **YAML configuration requirements**: Chief requires both `is_chief: true` AND `mode: all` in SQUAD.yaml - is_chief triggers factory assembly, mode:all enables primary+subagent invocation
- **Runtime naming**: Factory prefixes agent names as `squad-{squadName}-{yamlKey}` - chief.md should NOT hardcode these, should refer to domain roles instead
- **GOOD vs BAD examples**: Providing concrete examples of what to include vs exclude helps squad-creator generate proper chief prompts

## Task 14: L2-Squad Integration Tests + Documentation (2026-03-01)

### Learnings

- **Integration test scope**: Created comprehensive `l2-squad-integration.test.ts` covering end-to-end L2-Squad behavior - chief prompt assembly, prefixed naming, mode differences, and worker isolation
- **Test coverage verification**: 11 integration tests verify: (1) chief prompt contains awareness + domain methodology + coordination template, (2) prefixed naming prevents collisions, (3) chief mode is "all" vs worker "subagent", (4) workers don't contain coordination
- **Documentation updates**: Updated `src/features/squad/AGENTS.md` with L2-Squad architecture section (layer model, chief prompt assembly, naming convention), `README.md` with chief + naming info, root `AGENTS.md` with L2-Squad in layer diagram
- **Append-only notes**: Appended task 14 learnings and issues to `learnings.md` and `issues.md` following the established pattern

## Task 10: Integration Tests + Documentation (2026-03-01)

### Learnings

- **Real integration boundary**: Integration tests must not stub `loadOpenCodeAgents()` to `{}` or they stop validating actual `.opencode/agents/*.md` file loading behavior.
- **Filename key contract**: OpenCode agents are keyed by filename (`course-creator.md` -> `course-creator`), so assertions must use hyphenated filename keys instead of snake_case aliases.
- **Capability wiring requirement**: `write_paths` enforcement depends on carrying frontmatter into runtime capability resolution; an in-memory capability map is a minimal bridge without changing loader return shape.
- **Config handler path behavior**: Project overrides are loaded through `loadOpenCodeProjectAgents(ctx.directory)`, and T0 filtering (`kord/dev/builder/planner`) must be preserved in integration expectations.
- **Authority fallback model**: Agents without `write_paths` still fall back through `getAgentCapabilities()` to hardcoded defaults when applicable; unknown agents remain blocked.
