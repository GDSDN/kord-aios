# Issues - task-model-fallback-sync-async

## 2026-02-19 CRITICAL: User-configured agent fallback chains are completely ignored

### Discovery
User config at `~/.config/opencode/kord-aios.json` defines `agents.*.fallback` arrays
(e.g. `kord.fallback = [{model: "anthropic/claude-opus-4-6"}, ...]`).

The schema validates this correctly (`AgentFallbackSlotSchema` at `schema.ts:6-9,154`).
The config IS loaded as `pluginConfig.agents`.

BUT the fallback chain resolution **never reads user config fallback arrays**:
- `index.ts:487-515`: `createDelegateTask()` only extracts `kordJuniorModel` from agents config
- `executor.ts:23-32`: `resolveAgentFallbackChain()` only reads `AGENT_MODEL_REQUIREMENTS` (hardcoded)
- `call-kord-agent/tools.ts:224`: Same hardcoded source

### Impact
- User's custom fallback chains (without github-copilot, with google-vertex, etc) are ignored
- Hardcoded chains with `github-copilot` everywhere are always used
- User has NO way to customize fallback behavior despite config schema supporting it

### Fix Required
1. Pass `pluginConfig.agents` into `createDelegateTask()` options  
2. In `resolveAgentFallbackChain()`, prefer user config fallback over hardcoded
3. Convert user format `{model: "provider/modelId"}` to internal `{providers: [...], model: "..."}` format
4. Same fix needed in `call-kord-agent/tools.ts`

### Affected in Plan
This is MORE critical than Task 3's "filter disconnected providers" — the user's entire fallback config is dead code.
Should be addressed as part of Task 3 or as a prerequisite.

## 2026-02-19 Branch note: project uses `main` branch, not `master`
