# CLAUDE CODE MCP LOADER KNOWLEDGE BASE

## OVERVIEW

Loads MCP server configurations from Claude Code's `.mcp.json` files and transforms them into OpenCode-compatible `McpServerConfig` format. Handles environment variable expansion (`${VAR}` syntax), OAuth config, and multi-scope discovery (user, project, local).

## STRUCTURE
```
claude-code-mcp-loader/
├── loader.ts          # loadMcpConfigs() — discovers and loads .mcp.json files
├── transformer.ts     # Transforms ClaudeCodeMcpServer → McpServerConfig (local/remote)
├── env-expander.ts    # expandEnvVarsInObject() — resolves ${VAR} placeholders
├── types.ts           # ClaudeCodeMcpServer, McpServerConfig, LoadedMcpServer (47 lines)
├── loader.test.ts     # Loader and transformer tests
└── index.ts           # Barrel exports
```

## MCP SERVER TYPES

```typescript
interface ClaudeCodeMcpServer {
  type?: "http" | "sse" | "stdio"    // Explicit transport type
  url?: string                        // For http/sse servers
  command?: string                    // For stdio servers
  args?: string[]                     // stdio command arguments
  env?: Record<string, string>        // Environment variables (supports ${VAR})
  headers?: Record<string, string>    // HTTP headers
  oauth?: { clientId?, scopes? }      // OAuth configuration
  disabled?: boolean                  // Skip this server
}

// Transformed output for OpenCode:
type McpServerConfig = McpLocalConfig | McpRemoteConfig

interface McpLocalConfig {
  type: "local"
  command: string[]                   // [command, ...args]
  environment?: Record<string, string>
  enabled?: boolean
}

interface McpRemoteConfig {
  type: "remote"
  url: string
  headers?: Record<string, string>
  enabled?: boolean
}
```

## DISCOVERY PATHS

`.mcp.json` files are discovered from:
1. `~/.claude/.mcp.json` — user-global scope
2. `.claude/.mcp.json` — project scope (Claude Code convention)
3. `.mcp.json` — project root (local scope)

Each file contains `{ "mcpServers": { "server-name": ClaudeCodeMcpServer } }`.

## ENV VAR EXPANSION

`expandEnvVarsInObject()` resolves `${VAR_NAME}` placeholders in all string values:
- Searches `process.env` for the variable
- Supports nested objects and arrays
- Used for secrets like API keys: `"env": { "API_KEY": "${MY_API_KEY}" }`

## INTEGRATION

Called by `src/plugin-handlers/config-handler.ts` (step 12). Loaded MCP configs are merged with builtin MCPs. Can be disabled via `claude_code.mcp: false`.

## ANTI-PATTERNS

- **Hardcoding secrets**: Always use `${VAR}` expansion — never commit API keys in `.mcp.json`
- **Skipping disabled check**: Always check `disabled` field before registering
- **Ignoring transform**: Raw `ClaudeCodeMcpServer` must be transformed via `transformer.ts` before use
