# Learnings - task-model-fallback-sync-async

## 2026-02-19 Session Start
- Plan has 5 tasks across 2 waves
- Wave 1: Tasks 1, 2 (parallel)
- Wave 2: Tasks 3, 4, 5 (sequential: 3 → 4 → 5)

## 2026-02-19 Codebase Analysis

### Key Bug #1: Dynamic routing picks disconnected providers (model-resolution-pipeline.ts:131-132)
- `providers[0]` without connectivity check in dynamic routing path
- For `claude-opus-4-6`, schema lists `["anthropic", "github-copilot", "opencode"]`

### Key Bug #2: Sync retry-stuck fallback doesn't filter by connected providers (executor.ts:728-736)
- Flattens fallbackChain into candidates without filtering by connected providers
- `github-copilot` in chain will be attempted even if not connected

### Key Bug #3: promptWithRetry doesn't filter by connected providers (prompt-retry.ts:287-327)
- Fallback loop only skips currently-failed pair, not disconnected providers

### Existing Infrastructure
- `readConnectedProvidersCache()` returns `string[] | null`
- `readProviderModelsCache()` returns per-provider model lists
- `fetchAvailableModels()` returns `Set<string>` of "provider/model"
- `isQuotaError()` and `hasStructuredQuotaSignal()` in prompt-retry.ts
- `parseModelSuggestion()` for ProviderModelNotFoundError

### What Doesn't Exist Yet (Must Create)
- `src/shared/fallback-candidates.ts` + test
- `src/shared/provider-health.ts` + test

### Existing Tests
- `src/tools/delegate-task/tools.test.ts` - categories, model resolution
- `src/shared/model-resolution-pipeline.test.ts` - dynamic routing, fallback chain
- Test mock patterns: spyOn connectedProvidersCache, `__resetModelCache()`

### oh-my-opencode exists at D:\dev\oh-my-opencode (same structure as kord-aios)

### github-copilot pervasive in fallback chains
- Almost EVERY agent/category has github-copilot in providers arrays
- Plan says: do NOT remove, only filter at runtime
