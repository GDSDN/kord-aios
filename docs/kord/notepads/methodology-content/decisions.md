# Decisions

## 2026-03-03

### SKILL Frontmatter Template Field Naming

**Issue:** The plan text asked for `template?: string` in BuiltinSkill, but the codebase already uses `template: string` as the wrapped prompt template field.

**Decision:** Use `templateRef?: string` as the field name for the frontmatter template filename reference.

**Rationale:**
- `BuiltinSkill.template` already exists as the full prompt string (the wrapped `<skill-instruction>` content)
- Adding another field named `template` would cause a name collision
- `templateRef` clearly indicates it's a *reference* to a template file, not the template content itself
- Alternative considered: rename existing `template` to `promptTemplate` - rejected because it would break existing consumers

**Location:** `src/features/builtin-skills/types.ts` - added `templateRef?: string` field
