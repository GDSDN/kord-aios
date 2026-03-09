# ADR-0002: Project Rules Location and Injection Precedence

> Status: Draft
> Created: 2026-03-04

## Context

Kord AIOS has a `rules-injector` hook (`src/hooks/rules-injector/`) that injects project/user rule files into orchestrator prompts.

Today, `bunx kord-aios init` scaffolds a project-root `kord-rules.md` (via `KORD_RULES_FILE`), but `rules-injector` does not currently search the project root for that filename. As a result, the scaffolded rules file is effectively inert.

The hook already supports multiple rule ecosystems:

- Project: `.github/instructions/`, `.github/copilot-instructions.md`, `.cursor/rules/`, `.claude/rules/`, `docs/kord/rules/`
- User global: `~/.claude/rules/` (injected last)

We need a canonical home for Kord-specific, project-level rules that:

- Supports user overrides
- Preserves backward compatibility with existing search paths
- Avoids introducing new rule engines (this is path + precedence + idempotent scaffolding/export)

## Decision

1. **Canonical project rules location:** `.kord/rules/` (directory, multiple `*.md` files).
2. **Legacy compatibility locations (still supported):**
   - `docs/kord/rules/` (keep as-is; commonly used for framework-exported rule sets)
   - Project root `kord-rules.md` (support as a legacy single-file entry point)
   - Optional OMOC alias: `.sisyphus/rules/` (support as legacy alias to reduce migration friction)
3. **Precedence (lowest → highest):**
   - `docs/kord/rules/**` (framework-exported or legacy repo docs)
   - `.github/copilot-instructions.md` and `.github/instructions/**`
   - `.cursor/rules/**`
   - `.claude/rules/**` (project)
   - `.sisyphus/rules/**` (legacy alias; treat like `.kord/rules`)
   - `.kord/rules/**` (canonical project overrides)
   - `kord-rules.md` (legacy root) **only if** `.kord/rules/` is absent (to avoid double-injection)
   - `~/.claude/rules/**` (user global; always last)
4. **File ordering within a location:** stable lexical sort by relative path, injected in that order.

## Decision Drivers

- Fix the current mismatch where init scaffolds a file that is never injected.
- Provide a Kord-specific, tool-agnostic place for repo rules that doesn’t depend on Cursor/Claude/GitHub conventions.
- Keep existing rule discovery working unchanged for current users.
- Make precedence deterministic and easy to explain: framework/base first, project overrides later, user-global last.

## Consequences

Positive:

- `bunx kord-aios init` can reliably create rules that are actually used.
- Teams can keep framework rules in `docs/kord/rules/` while maintaining repo overrides in `.kord/rules/`.
- Existing Cursor/Claude/GitHub rules continue to work with no migration required.

Negative:

- More locations can create conflicting instructions if users populate multiple directories without understanding precedence.
- Adding `.sisyphus/rules/` as an alias increases surface area (but is purely additive and low-risk).

## Alternatives Considered

1. **Use only `docs/kord/rules/` as canonical.**
   - Simple, but mixes “docs” with “configuration/overrides” and discourages keeping rules near other tool configs.

2. **Use only project-root `kord-rules.md` as canonical.**
   - Simple, but does not scale well for multi-file rule sets and encourages top-level clutter.

3. **Use only `.kord/rules/` and remove legacy paths.**
   - Clean, but breaks existing workflows and violates backward-compat constraints.

## Follow-ups

- Update `init` to scaffold into `.kord/rules/` (and treat `kord-rules.md` as legacy).
- Update `extract` (if it exports rules) to write framework rule sets to `docs/kord/rules/` (or clearly separated subpaths) without overwriting user edits.
- Documentation: explain discovery locations, precedence, and the “root file ignored when `.kord/rules/` exists” rule.
