# SHARED UTILITIES KNOWLEDGE BASE

## OVERVIEW

66 cross-cutting utilities. Import via barrel pattern: `import { log, deepMerge } from "../../shared"`

**Categories**: Path resolution, Token truncation, Config parsing, Model resolution, System directives, Tool restrictions

## STRUCTURE
```
shared/
├── tmux/                  # Tmux TUI integration (types, utils 312 lines, constants)
├── logger.ts              # File-based logging (/tmp/kord-aios.log) - 53 imports
├── dynamic-truncator.ts   # Token-aware context window management (194 lines)
├── model-resolver.ts      # 3-step resolution (Override → Fallback → Default)
├── model-requirements.ts  # Agent/category model fallback chains (162 lines)
├── model-availability.ts  # Provider model fetching & fuzzy matching (357 lines)
├── model-sanitizer.ts     # Model name sanitization
├── model-suggestion-retry.ts # Model suggestion on failure
├── model-resolution-pipeline.ts # Dynamic routing + fallback resolution
├── agent-fallback.ts      # Resolves agent fallback from kord-aios.json (105 lines)
├── fallback-candidates.ts  # Builds filtered fallback candidates (131 lines)
├── provider-health.ts     # Provider health tracking with TTL bans
├── prompt-retry.ts       # Prompt retry with deferred error detection
├── jsonc-parser.ts        # JSONC parsing with comment support
├── frontmatter.ts         # YAML frontmatter extraction (JSON_SCHEMA only) - 9 imports
├── data-path.ts           # XDG-compliant storage resolution
├── opencode-config-dir.ts # ~/.config/opencode resolution (143 lines) - 9 imports
├── claude-config-dir.ts   # ~/.claude resolution - 9 imports
├── migration.ts           # Legacy config migration logic (231 lines)
├── opencode-version.ts    # Semantic version comparison
├── permission-compat.ts   # Agent tool restriction enforcement - 6 imports
├── system-directive.ts    # Unified system message prefix & types - 8 imports
├── session-utils.ts       # Session cursor, orchestrator detection
├── session-cursor.ts      # Session message cursor tracking
├── shell-env.ts           # Cross-platform shell environment
├── agent-variant.ts       # Agent variant from config
├── zip-extractor.ts       # Binary/Resource ZIP extraction
├── deep-merge.ts          # Recursive object merging (proto-pollution safe, MAX_DEPTH=50)
├── case-insensitive.ts    # Case-insensitive object lookups
├── command-executor.ts    # Shell command execution (225 lines)
├── snake-case.ts          # Case conversion utilities
├── tool-name.ts           # Tool naming conventions
├── pattern-matcher.ts     # Pattern matching utilities
├── port-utils.ts          # Port management
├── file-utils.ts          # File operation utilities
├── file-reference-resolver.ts # File reference resolution
├── connected-providers-cache.ts # Provider caching
├── external-plugin-detector.ts  # Plugin detection
├── first-message-variant.ts     # Message variant types
├── opencode-server-auth.ts      # Authentication utilities
└── index.ts               # Barrel export for all utilities
```

## MOST IMPORTED
| Utility | Imports | Purpose |
|---------|---------|---------|
| logger.ts | 53 | Background task visibility |
| opencode-config-dir.ts | 9 | Path resolution |
| claude-config-dir.ts | 9 | Path resolution |
| frontmatter.ts | 9 | YAML parsing |
| system-directive.ts | 8 | Message filtering |
| permission-compat.ts | 6 | Tool restrictions |

## WHEN TO USE
| Task | Utility |
|------|---------|
| Path Resolution | `getOpenCodeConfigDir()`, `getDataPath()` |
| Token Truncation | `dynamicTruncate(ctx, sessionId, output)` |
| Config Parsing | `readJsoncFile<T>(path)`, `parseJsonc(text)` |
| Model Resolution | `resolveModelWithFallback(client, reqs, override)` |
| Agent Fallback Chain | `resolveAgentFallbackChain(agentName, { userAgentOverrides })` |
| Fallback Candidates | `buildFallbackCandidates({ fallbackChain, client, excludeModels })` |
| Provider Health | `markProviderUnhealthy()`, `isProviderHealthy()` |
| Prompt Retry | `promptWithRetry(client, args, fallbackChain)` |
| Version Gating | `isOpenCodeVersionAtLeast(version)` |
| YAML Metadata | `parseFrontmatter(content)` |
| Tool Security | `createAgentToolAllowlist(tools)` |
| System Messages | `createSystemDirective(type)`, `isSystemDirective(msg)` |
| Deep Merge | `deepMerge(target, source)` |

## KEY PATTERNS

**3-Step Resolution** (Override → Fallback → Default):
```typescript
const model = resolveModelWithFallback({
  userModel: config.agents.kord.model,
  fallbackChain: AGENT_MODEL_REQUIREMENTS.kord.fallbackChain,
  availableModels: fetchedModels,
})
```

**System Directive Filtering**:
```typescript
if (isSystemDirective(message)) return  // Skip system-generated
const directive = createSystemDirective("TODO CONTINUATION")
```

## FALLBACK ARCHITECTURE

The fallback system ensures resilient model selection across provider failures:

### User Config → Hardcode Precedence
```typescript
// kord-aios.json agents.data-engineer.fallback has highest priority
const chain = resolveAgentFallbackChain("data-engineer", {
  userAgentOverrides: pluginConfig.agents,
})
// Returns user config if present, otherwise falls back to hardcoded chain
```

### Fallback Candidate Filtering
```typescript
const { candidates, diagnostics } = await buildFallbackCandidates({
  client,
  fallbackChain: chain,
  connectedProviders: /* from cache or live */,
  excludeModels: triedModels,
  allowModelListMiss: true, // Allow fallback even if model list stale
})
// Filters: disconnected providers, unhealthy providers, unavailable models, already-tried
```

### Provider Health Tracking
```typescript
// On quota/billing errors:
markProviderUnhealthy("openai", "quota") // TTL-ban for duration

// Before fallback attempt:
if (!isProviderHealthy(providerID)) skip
```

### Deferred Error Detection
```typescript
// promptWithRetry detects billing errors that arrive AFTER prompt returns
// Polls session messages for 2s post-prompt to catch deferred CreditsError
// Enables fallback on insufficient_balance that appears in message updates
```

### Sync → Background Handoff
```typescript
// When sync SLA exceeded but session still active:
handoffSyncSessionToBackground({ sessionID, fallbackChain, ... })
// Preserves prompt/model/fallbackChain for background retry

## ANTI-PATTERNS
- **Raw JSON.parse**: Use `jsonc-parser.ts` for comment support
- **Hardcoded Paths**: Use `*-config-dir.ts` or `data-path.ts`
- **console.log**: Use `logger.ts` for background task visibility
- **Unbounded Output**: Use `dynamic-truncator.ts` to prevent overflow
- **Manual Version Check**: Use `opencode-version.ts` for semver safety
