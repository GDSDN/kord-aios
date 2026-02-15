# TOOLS KNOWLEDGE BASE

## OVERVIEW

20 tool modules across code intelligence, delegation, pipeline, session, and skill/squad operations. Two patterns: Direct ToolDefinition (static) and Factory Function (context-dependent).

**Key counts**: LSP operations (6), AST-Grep operations (2), session operations (4), task operations (4), 20 tool modules total.

## STRUCTURE

```
tools/
├── [tool-name]/
│   ├── index.ts      # Barrel export
│   ├── tools.ts      # ToolDefinition or factory
│   ├── types.ts      # Zod schemas
│   └── constants.ts  # Fixed values
├── lsp/              # 6 tools: definition, references, symbols, diagnostics, prepare_rename, rename
├── ast-grep/         # 2 tools: ast_grep_search, ast_grep_replace
├── delegate-task/    # Category-based routing (executor.ts 983 lines, constants.ts 552 lines)
├── task/             # 4 tools: task_create, task_get, task_list, task_update
├── session-manager/  # 4 tools: session_list, session_read, session_search, session_info
├── grep/             # Text search
├── glob/             # File glob search
├── call-kord-agent/  # Direct specialized agent invocation
├── background-task/  # background_output, background_cancel
├── decision-log/     # Decision logging tooling
├── plan-read/        # Plan parsing/reading
├── story-read/       # Story file reading
├── story-update/     # Story file/state updates
├── squad-load/       # Squad loading from manifests
├── squad-validate/   # Squad schema/runtime validation
├── skill/            # Skill execution
├── skill-mcp/        # Skill MCP operations
├── slashcommand/     # Slash command dispatch
├── interactive-bash/ # Tmux session operations
└── look-at/          # Multimodal PDF/image inspection
```

## TOOL CATEGORIES

| Category | Tools | Pattern |
|----------|-------|---------|
| LSP | lsp_goto_definition, lsp_find_references, lsp_symbols, lsp_diagnostics, lsp_prepare_rename, lsp_rename | Direct |
| Search | ast_grep_search, ast_grep_replace, grep, glob | Direct |
| Session | session_list, session_read, session_search, session_info | Direct |
| Task | task_create, task_get, task_list, task_update | Factory |
| Agent | task, call_kord_agent | Factory |
| Background | background_output, background_cancel | Factory |
| System | interactive_bash, look_at | Mixed |
| Skill | skill, skill_mcp, slashcommand | Factory |

## TASK TOOLS

Claude Code compatible task management.

- **task_create**: Creates a new task. Auto-generates ID and syncs to Todo.
- **task_get**: Retrieves a task by ID.
- **task_list**: Lists active tasks. Filters out completed/deleted by default.
- **task_update**: Updates task fields. Supports additive `addBlocks`/`addBlockedBy`.

## HOW TO ADD

1. Create `src/tools/[name]/` with standard files
2. Use `tool()` from `@opencode-ai/plugin/tool`
3. Export from `src/tools/index.ts`
4. Static tools → `builtinTools`, Factory → separate export

## TOOL PATTERNS

**Direct ToolDefinition**:
```typescript
export const grep: ToolDefinition = tool({
  description: "...",
  args: { pattern: tool.schema.string() },
  execute: async (args) => result,
})
```

**Factory Function** (context-dependent):
```typescript
export function createDelegateTask(ctx, manager): ToolDefinition {
  return tool({ execute: async (args) => { /* uses ctx */ } })
}
```

## NAMING

- **Tool names**: snake_case (`lsp_goto_definition`)
- **Functions**: camelCase (`createDelegateTask`)
- **Directories**: kebab-case (`delegate-task/`)

## ANTI-PATTERNS

- **Sequential bash**: Use `&&` or delegation
- **Raw file ops**: Never mkdir/touch in tool logic
- **Sleep**: Use polling loops
