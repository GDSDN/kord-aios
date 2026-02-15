# SKILL MCP MANAGER KNOWLEDGE BASE

## OVERVIEW

Manages MCP (Model Context Protocol) client connections for skill-embedded MCPs. When a skill's YAML frontmatter declares MCP servers, this manager handles the full client lifecycle: connect → use → idle timeout → disconnect. Supports both stdio (local process) and HTTP (remote server) transports, with OAuth support for authenticated HTTP endpoints.

## STRUCTURE
```
skill-mcp-manager/
├── manager.ts           # SkillMcpManager — connection lifecycle (641 lines)
├── env-cleaner.ts       # createCleanMcpEnvironment() — sanitizes env vars for child processes
├── types.ts             # SkillMcpConfig, SkillMcpClientInfo, SkillMcpServerContext (15 lines)
├── index.ts             # Barrel exports
├── manager.test.ts      # Manager connection and lifecycle tests
└── env-cleaner.test.ts  # Environment sanitization tests
```

## CONNECTION TYPES

| Type | Transport | Config | Use Case |
|------|-----------|--------|----------|
| `stdio` | `StdioClientTransport` | `command` + `args` + `env` | Local MCP servers (e.g., `npx @playwright/mcp`) |
| `http` | `StreamableHTTPClientTransport` | `url` | Remote MCP servers (e.g., SaaS APIs) |

### Connection Type Resolution
```
1. Explicit config.type ("stdio", "http", "sse") — highest priority
2. config.url present → "http"
3. config.command present → "stdio"
4. Neither → null (invalid config)
```

## KEY TYPES

```typescript
type SkillMcpConfig = Record<string, ClaudeCodeMcpServer>  // server-name → config

interface SkillMcpClientInfo {
  serverName: string    // MCP server identifier
  skillName: string     // Which skill requested this MCP
  sessionID: string     // OpenCode session for lifecycle tracking
}

interface SkillMcpServerContext {
  config: ClaudeCodeMcpServer  // Full MCP server config
  skillName: string            // Owning skill
}

// Internal managed client
interface ManagedClient {
  client: Client              // MCP SDK client
  skillName: string
  lastUsedAt: number          // Timestamp for idle detection
  connectionType: "stdio" | "http"
  transport: StdioClientTransport | StreamableHTTPClientTransport
}
```

## MANAGER LIFECYCLE

```
Skill invokes MCP tool
    ↓
SkillMcpManager.getOrConnect(serverName, skillName, sessionID)
    ↓
┌─ Already connected? → return existing client (update lastUsedAt)
└─ Not connected?
    ↓
    getConnectionType(config) → stdio or http
    ↓
    ┌─ stdio: spawn child process via StdioClientTransport
    │   → createCleanMcpEnvironment() sanitizes env vars
    │   → expandEnvVarsInObject() resolves ${VAR} placeholders
    └─ http: connect via StreamableHTTPClientTransport
        → McpOAuthProvider handles auth if needed
        → isStepUpRequired() / mergeScopes() for OAuth step-up
    ↓
    client.connect() → handshake with MCP server
    ↓
    Store in managed clients map
    ↓
    Return client for tool/resource access
    ↓
[Idle timeout] → disconnect and clean up
[Session end] → disconnect all clients for session
```

## ENV CLEANER (`env-cleaner.ts`)

`createCleanMcpEnvironment()` creates a sanitized environment for stdio child processes:
- Removes sensitive variables that shouldn't leak to MCP servers
- Preserves PATH and essential system variables
- Applies skill-specific env overrides from MCP config

## OAUTH SUPPORT

For HTTP MCP servers requiring authentication:
- `McpOAuthProvider` from `src/features/mcp-oauth/` handles the OAuth flow
- Step-up authentication: if a server requires additional scopes, `isStepUpRequired()` detects it and `mergeScopes()` expands the token
- OAuth tokens are cached per server

## CONSUMERS

| Component | How it uses skill-mcp-manager |
|-----------|-------------------------------|
| `src/tools/skill-mcp/` | `skill_mcp` tool — invokes MCP tools/resources on behalf of skills |
| `src/mcp/` | Built-in MCPs (websearch, context7, grep_app) use the same transport layer |
| Skills with MCP frontmatter | SKILL.md can declare MCP dependencies in YAML frontmatter |

## HOW TO ADD A NEW TRANSPORT TYPE

1. Create transport class implementing MCP SDK's transport interface
2. Add new connection type to `ConnectionType` union in `manager.ts`
3. Add detection logic in `getConnectionType()`
4. Add connection logic in the manager's connect method
5. Handle cleanup in disconnect

## ANTI-PATTERNS

- **Leaking env vars**: Always use `createCleanMcpEnvironment()` for stdio — never pass `process.env` directly
- **Forgetting cleanup**: Always disconnect clients when sessions end — leaked processes consume resources
- **Blocking connect**: MCP server connections can hang — always use timeouts
- **Ignoring OAuth errors**: Step-up auth failures should be surfaced to the user, not silently swallowed
- **Direct SDK usage**: Always go through the manager — it handles lifecycle, caching, and cleanup
