# EPIC-18: Branding & Naming Audit

> **Status**: Draft
> **Created**: 2026-02-14
> **Research**: [Epics 15-18 Deep Study](../../researches/epics-15-18-study.md) §4
> **Priority**: Medium
> **Depends on**: None

> **Mirror Sources** (consulted and verified):
> - `D:\dev\oh-my-opencode` — legacy naming baseline
> - `D:\dev\synkra-aios` — methodology naming (no branding overlap)

---

## Summary

Fix the **2 remaining stale branding references** in runtime code and formalize the compatibility policy for intentional legacy names in migration code/tests.

**Audit result** (verified via grep across `src/`, `assets/`, `.github/`): Only 2 stale references remain. All other legacy name mentions (25 matches across 6 files) are intentional compatibility mappings in `migration.ts` and test files.

---

## Context

### Audit Findings (Verified)

**STALE — must fix** (2 items):

| File | Line | Stale Content |
|------|------|--------------|
| `src/cli/model-fallback.ts` | 41 | `SCHEMA_URL` references `kord-opencode.schema.json` in the GitHub raw URL |
| `assets/kord-opencode.schema.json` | filename | File named `kord-opencode` instead of `kord-aios` |

**INTENTIONAL COMPAT — keep** (25 matches across 6 files):

| File | Matches | Reason |
|------|---------|--------|
| `src/shared/migration.ts` | 14 | `AGENT_NAME_MAP` maps legacy names (sisyphus→kord, prometheus→plan, atlas→build, hephaestus→dev) |
| `src/shared/migration.test.ts` | 4 | Tests for migration map correctness |
| `src/agents/wave1-prompt-updates.test.ts` | 2 | Negative assertions (verify legacy names NOT in prompts) |
| `src/cli/run/runner.test.ts` | 2 | Backward-compat test scenarios |
| `src/shared/agent-config-integration.test.ts` | 2 | Migration integration tests |
| `src/shared/model-requirements.test.ts` | 1 | Legacy model name mapping test |

**ALREADY FIXED** (previous sessions):
- `.github/workflows/sisyphus-agent.yml` → renamed to kord-aios branding
- `assets/kord-opencode.schema.json` `$id` and `description` → updated to kord-aios

---

## Stories

### S01: Research — DONE (Findings in Study Doc)

**Status**: ✅ Complete — see [epics-15-18-study.md §4](../../researches/epics-15-18-study.md)

Findings:
- Only 2 stale references remain in runtime code
- 25 intentional compat references in migration.ts and test files
- .github/ workflows already fixed in previous session
- Clear separation between stale (fix) and compat (keep)

---

### S02: Fix Stale Schema References

**Exact changes**:

1. **Rename file**: `assets/kord-opencode.schema.json` → `assets/kord-aios.schema.json`
2. **Update SCHEMA_URL** in `src/cli/model-fallback.ts` line 41: change `kord-opencode.schema.json` to `kord-aios.schema.json`
3. **Update any other references** to the old filename (grep for `kord-opencode.schema` across the repo)

**Acceptance Criteria**:
- [ ] File renamed: `assets/kord-aios.schema.json`
- [ ] `SCHEMA_URL` constant points to `kord-aios.schema.json`
- [ ] `$schema` references in config templates/docs updated if any
- [ ] `bun run typecheck` passes
- [ ] `bun run build:schema` produces the renamed file

**Files**: `assets/kord-opencode.schema.json` (rename), `src/cli/model-fallback.ts`

---

### S03: Formalize Compatibility Policy

**As** a maintainer, **I need** a documented policy on which legacy names are allowed and where.

**Deliverable**: A section in the research doc or a dedicated `docs/architecture/naming-policy.md`:

- [ ] **Allowed locations for legacy names**: `src/shared/migration.ts`, test files (negative assertions, compat scenarios)
- [ ] **Forbidden locations**: agent prompts, CLI output, published schema, README, package.json, workflow names
- [ ] **Legacy names covered**: `sisyphus`, `hephaestus`, `prometheus`, `atlas`, `oh-my-opencode`, `kord-opencode`, `omo`
- [ ] **Rationale**: Existing user configs may reference old names; migration.ts handles transparent rename

---

### S04: CI/Funding Link Audit

**As** a maintainer, **I need** `.github/` files to reference the correct org/repo.

**Verification**:
- [ ] `.github/FUNDING.yml`: verify `github:` entry points to correct org (GDSDN, not code-yeongyu)
- [ ] All workflow files: confirm no stale org/repo references
- [ ] Repository URLs in any `.github/` templates: aligned to `GDSDN/kord-aios`

**Files**: `.github/FUNDING.yml`, `.github/workflows/*`

---

## Out of Scope

- Removing compatibility aliases from migration.ts (would break existing users)
- Rewriting historical changelogs
- Renaming the npm package (already `kord-aios`)
