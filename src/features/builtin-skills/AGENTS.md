# BUILT-IN SKILLS KNOWLEDGE BASE

## OVERVIEW

144 methodology skills organized by domain. Skills are SKILL.md files with YAML frontmatter — they encode expert instructions for agents, not executable code. The loader discovers them from `skills/kord-aios/{domain}/{skill-name}/SKILL.md`, parses frontmatter, wraps the body in a `<skill-instruction>` template, and registers them with OpenCode.

## STRUCTURE
```
builtin-skills/
├── skills.ts                # createBuiltinSkills() — merges hardcoded + kord-aios skills (34 lines)
├── kord-aios-loader.ts      # Discovers SKILL.md from kord-aios/ tree (130 lines)
├── types.ts                 # BuiltinSkill interface
├── index.ts                 # Barrel exports
├── skills.test.ts           # Registration and filtering tests
├── kord-aios-loader.test.ts # Loader discovery tests
└── skills/
    ├── index.ts             # Hardcoded skill exports (playwright, git-master, etc.)
    └── kord-aios/           # 13 domain directories, 144 skill directories
        ├── analysis/        # ~18 skills: requirements, patterns, brainstorming, ROI
        ├── database/        # ~20 skills: DB setup, migrations, RLS, Supabase
        ├── design-system/   # ~12 skills: Tailwind, shadcn, design tokens, UX
        ├── dev-workflow/    # ~15 skills: build, test, develop, collaborative edit
        ├── devops/          # ~8 skills: CI/CD, PR automation, environment bootstrap
        ├── documentation/   # ~5 skills: docs generation, API docs
        ├── mcp/             # ~3 skills: MCP server setup
        ├── product/         # ~5 skills: PO backlog, story creation
        ├── qa/              # ~8 skills: test strategies, review, validation
        ├── squad/           # ~7 skills: squad creation, agent creation, validation
        ├── story/           # ~5 skills: story lifecycle, checkpoints
        ├── utilities/       # ~5 skills: git, general utilities
        └── worktrees/       # ~3 skills: git worktree management
```

## TWO SKILL TYPES

### 1. Hardcoded Skills (5)
Defined as TypeScript constants in `skills/index.ts`:

| Skill | File | Description |
|-------|------|-------------|
| `playwright` | `skills/playwright.ts` | Browser automation via Playwright MCP |
| `agent-browser` | `skills/agent-browser.ts` | Vercel agent-browser CLI |
| `dev-browser` | `skills/dev-browser.ts` | Persistent browser state |
| `frontend-ui-ux` | `skills/frontend-ui-ux.ts` | Frontend design methodology |
| `git-master` | `skills/git-master.ts` | Git workflow methodology (1107 lines) |

These are always loaded. `playwright` vs `agent-browser` is selected via `browser_automation_engine.provider` config.

### 2. Kord AIOS Skills (144)
Discovered from `skills/kord-aios/` at startup by `kord-aios-loader.ts`:

**Directory convention**: `skills/kord-aios/{domain}/{skill-name}/SKILL.md`

**Loading**: `loadKordAiosSkillsSync()` walks the tree, parses each SKILL.md, caches results.

## SKILL.MD FORMAT

```markdown
---
name: my-skill-name
description: What this skill does (shown in skill picker)
agent: dev                    # Optional: force specific agent
model: openai/gpt-5.2         # Optional: force specific model
subtask: false                # Optional: run as subtask (default false)
argument-hint: "describe what to build"  # Optional: hint for $ARGUMENTS
allowed-tools: read edit bash  # Optional: tool allowlist (space-separated or array)
---

# My Skill Name

## Context
Background information the agent needs...

## Instructions
Step-by-step methodology for the agent to follow...

## Output Format
What the agent should produce...

## Anti-Patterns
What the agent should NOT do...
```

### Frontmatter Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Skill name (falls back to directory name) |
| `description` | string | No | Shown in OpenCode's skill picker |
| `agent` | string | No | Force specific agent (e.g., "dev", "architect") |
| `model` | string | No | Force specific model override |
| `subtask` | boolean | No | Run as subtask (default: false) |
| `argument-hint` | string | No | Hint text for $ARGUMENTS placeholder |
| `allowed-tools` | string \| string[] | No | Restrict tools available during skill execution |

### Template Wrapping
The loader wraps each SKILL.md body into this template before registering:
```
<skill-instruction>
Base directory for this skill: {absolutePathToSkillDir}/
File references (@path) in this skill are relative to this directory.

{SKILL.md body content}
</skill-instruction>

<user-request>
$ARGUMENTS
</user-request>
```

`$ARGUMENTS` is replaced by OpenCode with the user's actual input when the skill is invoked.

## REGISTRATION PIPELINE

```
createBuiltinSkills(options)
  ↓
  1. Select browser skill based on browserProvider config
  2. Combine: [browserSkill, frontendUiUxSkill, gitMasterSkill, devBrowserSkill]
  3. If includeKordAiosSkills: loadKordAiosSkillsSync()
     → Walks kord-aios/{domain}/{skill-name}/SKILL.md
     → Parses frontmatter via parseFrontmatter()
     → Wraps body in <skill-instruction> template
     → Caches result (singleton)
  4. Merge hardcoded + kord-aios skills
  5. Filter by disabledSkills set (from config)
  6. Return BuiltinSkill[]
```

## KEY TYPES

```typescript
interface BuiltinSkill {
  name: string                // Unique skill identifier
  description: string         // Prefixed with "(kord-aios - Skill)" for kord-aios skills
  template: string            // Full prompt template with $ARGUMENTS
  agent?: string              // Force agent
  model?: string              // Force model
  subtask: boolean            // Run as subtask
  argumentHint?: string       // $ARGUMENTS hint
  allowedTools?: string[]     // Tool allowlist
}
```

## HOW TO ADD A NEW SKILL

1. Choose the domain category (or create a new one under `skills/kord-aios/`)
2. Create directory: `skills/kord-aios/{domain}/{my-skill-name}/`
3. Create `SKILL.md` with YAML frontmatter + methodology content
4. Test: `bun test kord-aios-loader` to verify discovery
5. The skill is automatically available — no registration code needed

### Example: Adding a "code-review" skill to qa/
```bash
# Create the directory
mkdir -p src/features/builtin-skills/skills/kord-aios/qa/code-review/
```

Create `SKILL.md`:
```markdown
---
name: code-review
description: Structured code review with severity ratings
agent: qa
---

# Code Review

## Instructions
1. Read the files specified by the user
2. For each file, identify: bugs, style issues, performance problems, security risks
3. Rate each finding: Critical / Major / Minor / Suggestion
4. Produce a structured review report
...
```

## HOW TO ADD A NEW DOMAIN CATEGORY

1. Create directory: `skills/kord-aios/{new-domain}/`
2. Add skill directories inside it with SKILL.md files
3. The loader discovers new domains automatically — no code changes needed

## HOW TO ADD A NEW HARDCODED SKILL

1. Create `skills/{my-skill}.ts` exporting a `BuiltinSkill` constant
2. Import in `skills/index.ts`
3. Add to the `skills` array in `skills.ts` → `createBuiltinSkills()`
4. Add skill name to `BuiltinSkillNameSchema` in `src/config/schema.ts`
5. Run `bun run build:schema` to update JSON schema

## ANTI-PATTERNS

- **Code in SKILL.md**: Skills are methodology instructions, NOT executable code — don't put JS/TS snippets meant to run
- **Portuguese/non-English**: All skills MUST be in English (international open-source project)
- **Legacy references**: Never reference legacy aliases or deprecated config keys (`config.yaml`, `pack_name`)
- **Missing frontmatter**: Always include at least `name` and `description` in frontmatter
- **Huge skills**: Keep skills focused (< 500 lines). Split large ones into multiple skills
- **Hardcoding paths**: Use `@path` references relative to skill directory — the loader injects the base directory
