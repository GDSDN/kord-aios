# OPENCODE SKILL LOADER KNOWLEDGE BASE

## OVERVIEW

Discovers and loads skill files from OpenCode and Claude Code standard directories. Skills are `.md` files with optional YAML frontmatter that define methodology instructions for agents. This loader handles four discovery scopes, frontmatter parsing, MCP config extraction, lazy content loading, and skill merging.

## STRUCTURE
```
opencode-skill-loader/
├── loader.ts              # Core skill loading logic (312 lines) — frontmatter parsing, MCP extraction
├── async-loader.ts        # Async skill discovery — non-blocking parallel loading
├── blocking.ts            # Blocking skill discovery — synchronous for startup
├── merger.ts              # Merges skills from multiple sources with dedup
├── skill-content.ts       # Lazy content loader — defers full file reads until invocation
├── discover-worker.ts     # Worker thread for parallel skill discovery
├── types.ts               # SkillScope, SkillMetadata, LoadedSkill, LazyContentLoader
├── index.ts               # Barrel exports (all 8 discovery functions)
├── loader.test.ts         # Core loader tests
├── async-loader.test.ts   # Async discovery tests
├── blocking.test.ts       # Blocking discovery tests
└── skill-content.test.ts  # Lazy content loading tests
```

## DISCOVERY PATHS

| Function | Search Path | Scope |
|----------|-------------|-------|
| `discoverUserClaudeSkills()` | `~/.claude/skills/*.md` | User-global (Claude Code) |
| `discoverProjectClaudeSkills()` | `.claude/skills/*.md` | Project-local (Claude Code) |
| `discoverOpencodeGlobalSkills()` | `~/.config/opencode/skills/*.md` | User-global (OpenCode) |
| `discoverOpencodeProjectSkills()` | `.opencode/skills/*.md` | Project-local (OpenCode) |
| `loadUserSkills()` | Same as above, returns full SkillDefinition | Blocking |
| `loadProjectSkills()` | Same as above, returns full SkillDefinition | Blocking |
| `loadOpencodeGlobalSkills()` | Same as above | Blocking |
| `loadOpencodeProjectSkills()` | Same as above | Blocking |

## SKILL FILE FORMAT

Skills can be plain `.md` files or `.md` files with YAML frontmatter:

```markdown
---
name: my-skill
description: What this skill does
model: anthropic/claude-sonnet-4-5
agent: dev
subtask: true
argument-hint: "describe the task"
allowed-tools: [read, edit, bash]
mcp:
  my-mcp-server:
    command: npx
    args: ["@my-org/mcp-server"]
---

# My Skill Instructions

Step-by-step methodology...
```

### Frontmatter Fields
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Skill name (falls back to filename) |
| `description` | string | Shown in skill picker |
| `model` | string | Force specific model |
| `agent` | string | Force specific agent |
| `subtask` | boolean | Run as subtask |
| `argument-hint` | string | Hint for user input |
| `allowed-tools` | string[] | Tool allowlist |
| `mcp` | SkillMcpConfig | Embedded MCP server definitions |

### MCP Config Extraction

Skills can declare MCP dependencies in two ways:
1. **Frontmatter `mcp` field**: Inline MCP server configs in YAML
2. **`mcp.json` file**: Separate JSON file in the skill directory

Both are parsed by `parseSkillMcpConfigFromFrontmatter()` and `loadMcpJsonFromDir()` in `loader.ts`.

## LAZY CONTENT LOADING

`skill-content.ts` provides `LazyContentLoader` — defers reading the full skill file until the skill is actually invoked. This avoids loading all 144 methodology skill bodies into memory at startup. Only the frontmatter (name, description) is parsed eagerly.

## INTEGRATION

Called by `src/plugin-handlers/config-handler.ts` (steps 4 and 9):
- Step 4: `discover*` functions find skills for awareness injection into agent prompts
- Step 9: `load*` functions produce full `SkillDefinition` objects for registration

Skills from all sources are merged via `merger.ts`, with later sources overriding earlier ones by name.

## HOW TO ADD A NEW DISCOVERY PATH

1. Create a new discovery function in `async-loader.ts` (async) or `blocking.ts` (sync)
2. Follow the pattern: read directory → filter `.md` files → parse frontmatter → return LoadedSkill[]
3. Export from `index.ts`
4. Call in `src/plugin-handlers/config-handler.ts` at the appropriate step

## ANTI-PATTERNS

- **Eager full reads**: Use lazy content loading for large skill sets — don't read all bodies at startup
- **Missing sanitization**: Always sanitize model fields via `sanitizeModelField()` — user input may have trailing whitespace
- **Ignoring symlinks**: Use `resolveSymlinkAsync()` from shared — skill directories may contain symlinks
- **Duplicate skills**: The merger handles dedup by name — later sources win. Don't add custom dedup logic.
