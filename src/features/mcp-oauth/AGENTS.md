# MCP OAUTH KNOWLEDGE BASE

## OVERVIEW

Full OAuth 2.0 implementation for authenticating with remote MCP servers. Handles the complete flow: server metadata discovery → dynamic client registration → PKCE authorization → token storage → token refresh → scope step-up. Used by `skill-mcp-manager` when connecting to HTTP MCP servers that require authentication.

## STRUCTURE
```
mcp-oauth/
├── provider.ts              # McpOAuthProvider — main OAuth orchestrator (296 lines)
├── discovery.ts             # discoverOAuthServerMetadata() — RFC 8414 discovery
├── dcr.ts                   # getOrRegisterClient() — Dynamic Client Registration (RFC 7591)
├── storage.ts               # loadToken(), saveToken() — persistent token storage
├── step-up.ts               # isStepUpRequired(), mergeScopes() — scope escalation
├── resource-indicator.ts    # Resource indicator support (RFC 8707)
├── schema.ts                # Zod schemas for OAuth responses
├── callback-server.ts       # Local HTTP server for OAuth redirect callback
├── index.ts                 # Barrel exports
├── provider.test.ts         # Provider integration tests
├── discovery.test.ts        # Metadata discovery tests
├── dcr.test.ts              # Client registration tests
├── storage.test.ts          # Token storage tests
├── step-up.test.ts          # Scope step-up tests
├── resource-indicator.test.ts # Resource indicator tests
└── schema.test.ts           # Schema validation tests
```

## OAUTH FLOW

```
1. discoverOAuthServerMetadata(serverUrl)
   → Fetches /.well-known/oauth-authorization-server
   → Returns: authorization_endpoint, token_endpoint, registration_endpoint
   ↓
2. getOrRegisterClient(metadata)
   → Dynamic Client Registration (if no clientId configured)
   → Caches registered client credentials
   ↓
3. McpOAuthProvider.authorize()
   → Generates PKCE code_verifier + code_challenge
   → Starts local callback server (findAvailablePort)
   → Opens browser to authorization_endpoint
   → Waits for redirect callback with auth code
   ↓
4. Token exchange (code → access_token + refresh_token)
   → saveToken() persists to disk
   ↓
5. Return access_token for MCP client headers
   ↓
[Token expired] → refresh_token flow → saveToken()
[Scope step-up] → isStepUpRequired() → mergeScopes() → re-authorize
```

## KEY TYPES

```typescript
type McpOAuthProviderOptions = {
  serverUrl: string       // MCP server base URL
  clientId?: string       // Pre-registered client ID (skips DCR)
  scopes?: string[]       // Requested OAuth scopes
}

interface OAuthServerMetadata {
  authorization_endpoint: string
  token_endpoint: string
  registration_endpoint?: string
  // ... RFC 8414 fields
}

interface OAuthTokenData {
  access_token: string
  refresh_token?: string
  expires_at?: number
  scope?: string
}
```

## SECURITY

- **PKCE**: All auth flows use Proof Key for Code Exchange (S256)
- **Token storage**: Tokens are stored on disk in a secure location (user config dir)
- **No secrets in code**: Client secrets from DCR are stored, never hardcoded
- **Callback server**: Uses ephemeral local port, single-use, auto-closes after callback

## INTEGRATION

Used by `src/features/skill-mcp-manager/manager.ts` when connecting to HTTP MCP servers with `oauth` config:
```json
{
  "mcpServers": {
    "my-server": {
      "url": "https://api.example.com/mcp",
      "oauth": {
        "clientId": "my-client-id",
        "scopes": ["read", "write"]
      }
    }
  }
}
```

## ANTI-PATTERNS

- **Skipping PKCE**: Always use PKCE — plain code flow is not supported
- **Token in memory only**: Always persist tokens via `saveToken()` — re-auth on every restart wastes user time
- **Blocking browser**: The `authorize()` flow opens a browser — never call it in a non-interactive context
- **Ignoring refresh**: Always try token refresh before re-authorization
- **Hardcoding ports**: Use `findAvailablePort()` — never hardcode the callback port
