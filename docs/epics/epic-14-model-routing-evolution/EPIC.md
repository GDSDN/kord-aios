# EPIC-14: Model Routing Evolution

> **Status**: Draft
> **Created**: 2026-02-13
> **Research**: [Model Routing Evolution Study](../../researches/model-routing-evolution-study.md)
> **Priority**: High
> **Depends on**: None (additive feature, no blocking dependencies)

---

## Summary

Evolve the Kord AIOS model fallback system from hardcoded TypeScript chains to a user-configurable, per-agent routing system. Two complementary capabilities:

1. **`/modelconfig` TUI Command** — Interactive menu to configure 4 model fallback slots per agent, toggle routing mode (static/dynamic), and view connected providers/models.
2. **Dynamic Model Routing** — Per-agent opt-in intelligent routing that selects optimal models at task time based on a user-editable Model Schema (JSONC), task complexity classification, and agent-filtered decision matrix.

Both features are **additive** and **backward compatible**. Default behavior is identical to today (static fallback chains). Users opt in per agent.

---

## Context

### Current State
- `AGENT_MODEL_REQUIREMENTS` in `src/shared/model-requirements.ts` — hardcoded fallback chains per agent
- `resolveModelPipeline()` in `src/shared/model-resolution-pipeline.ts` — 4-step resolution (UI → config override → fallback chain → system default)
- User can override via `agents.{name}.model` in `kord-aios.jsonc` — manual JSONC editing, no discoverability
- `variant` field maps to provider-specific reasoning params via `THINKING_CONFIGS` + `anthropic-effort` hook
- Categories have separate hardcoded chains in `CATEGORY_MODEL_REQUIREMENTS`

### Target State
- `/modelconfig` command with TUI menu: agent list → 4 model slots → model selector (connected providers only)
- Per-agent `routing_mode: "static" | "dynamic"` in config
- `fallback_slots` field: user-editable 4-slot array replacing hardcoded chains
- Model Schema (`model-schema.jsonc`): JSONC file classifying models by reasoning tier, domains, enabled agents, cost
- Dynamic router: filters Model Schema to agent-enabled models, classifies task, selects best match
- Heuristic classifier (default) + optional LLM nano classifier via config
- Prompt-based model override with explicit syntax (`use model X`)

### Key Design Decisions
- **Per-agent routing** (not global) — user can have `kord` on static and `architect` on dynamic
- **JSONC format** for Model Schema — consistent with project config convention
- **`reasoning`** (schema) vs **`variant`** (runtime) — two distinct terms, never confused
- **4 slots** per agent — covers 95% of current chains
- **Hybrid classifier** — heuristic default, LLM nano opt-in

---

## Stories

### Wave 1: Foundation + `/modelconfig` (Phase 1)

#### S01: OpenCode `/models` Study

**As** the implementation team, **I need** to understand how OpenCode's `/models` command captures and presents connected providers and available models **so that** the `/modelconfig` TUI can reuse the same provider/model detection pattern.

**Acceptance Criteria**:
- [ ] Clone OpenCode to `/tmp/opencode-source` and examine `/models` implementation
- [ ] Document: how connected providers are detected
- [ ] Document: how available models per provider are listed
- [ ] Document: the TUI/interaction pattern used
- [ ] Document: which client APIs are used (`client.model.list()`, etc.)
- [ ] Identify reusable patterns for `/modelconfig`
- [ ] Findings added as comments/notes in the EPIC or a brief study doc

**Files**: No code changes — research only

---

#### S02: Config Schema Extensions

**As** the config system, **I need** new schema fields for per-agent routing mode and fallback slots **so that** the system can store and validate model routing configuration.

**Acceptance Criteria**:
- [ ] `RoutingModeSchema` added: `z.enum(["static", "dynamic"])`
- [ ] `AgentOverrideSchema` extended with:
  - `routing_mode: RoutingModeSchema.optional()` — per-agent routing mode
  - `fallback_slots: z.array(z.string()).max(4).optional()` — custom 4-slot fallback
- [ ] `ModelRoutingConfigSchema` added:
  - `classifier: z.enum(["heuristic", "llm"]).default("heuristic")`
  - `cost_preference: z.enum(["economy", "balanced", "performance"]).default("balanced")`
  - `prompt_override: z.boolean().default(true)`
  - `model_schema_path: z.string().optional()`
- [ ] `OhMyOpenCodeConfigSchema` extended with `model_routing: ModelRoutingConfigSchema.optional()`
- [ ] Existing configs still parse without errors (backward compat)
- [ ] `bun run build:schema` regenerates JSON schema
- [ ] Tests: new fields parse, defaults work, invalid values rejected
- [ ] `bun run typecheck` passes

**Files**: `src/config/schema.ts`, `src/config/schema.test.ts`

---

#### S03: Model Config Reader

**As** the `/modelconfig` command, **I need** a reader module that aggregates the current resolved model state for all agents and categories **so that** the TUI can display accurate information.

**Acceptance Criteria**:
- [ ] New module `src/features/model-config/reader.ts`
- [ ] Function `readModelConfigState()` returns:
  - All agents with: name, current resolved model, routing_mode, fallback_slots (custom or from AGENT_MODEL_REQUIREMENTS), variant, provenance
  - All categories with: name, current resolved model, variant
  - Connected providers list
  - Available models per provider
- [ ] Uses existing caches (`readConnectedProvidersCache`, `fetchAvailableModels`)
- [ ] Uses existing `AGENT_MODEL_REQUIREMENTS` and `CATEGORY_MODEL_REQUIREMENTS`
- [ ] Reads `agents.{name}.fallback_slots` from user config if present
- [ ] Tests: returns correct state for default config, custom overrides, missing providers
- [ ] `bun run typecheck` passes

**Files**: `src/features/model-config/reader.ts`, `src/features/model-config/reader.test.ts`

---

#### S04: `/modelconfig` Command Template + Registration

**As** a user, **I need** a `/modelconfig` command **so that** I can interactively view and configure agent models via a TUI-style menu.

**Acceptance Criteria**:
- [ ] New command template `src/features/builtin-commands/templates/modelconfig.ts`
- [ ] Template instructs agent to:
  1. Read model config state (via reader from S03)
  2. Present agent list with: name, routing_mode (`[static]`/`[dynamic]`), current model
  3. On agent selection: show 4 fallback slots + routing mode toggle
  4. On slot selection: show model list grouped by provider (connected only)
  5. On model selection: update slot and confirm
  6. Categories shown as `[cat] name` entries with same 4-slot editing
  7. "Reset All to Defaults" option
- [ ] Registered in `commands.ts` with name `"modelconfig"`
- [ ] Added to `BuiltinCommandName` in `types.ts`
- [ ] Template includes state injection point for `$MODEL_CONFIG_STATE`
- [ ] Tests: command registered, template contains key sections
- [ ] `bun run typecheck` passes

**Files**: `src/features/builtin-commands/templates/modelconfig.ts`, `src/features/builtin-commands/commands.ts`, `src/features/builtin-commands/types.ts`

---

#### S05: Model Config Writer

**As** the `/modelconfig` command, **I need** a writer module that persists model configuration changes to `kord-aios.jsonc` **so that** user selections are saved between sessions.

**Acceptance Criteria**:
- [ ] New module `src/features/model-config/writer.ts`
- [ ] Function `writeAgentModelConfig(agentName, config)` — writes `routing_mode` and `fallback_slots` to `agents.{name}` in kord-aios.jsonc
- [ ] Function `writeCategoryModelConfig(categoryName, config)` — writes model to `categories.{name}` in kord-aios.jsonc
- [ ] Function `resetToDefaults(agentName?)` — removes custom routing_mode and fallback_slots (reverts to AGENT_MODEL_REQUIREMENTS)
- [ ] Uses existing JSONC parsing from `config-handler.ts` / `config-manager.ts`
- [ ] Preserves comments and formatting in JSONC file
- [ ] Tests: write + read roundtrip, reset clears overrides, creates section if missing
- [ ] `bun run typecheck` passes

**Files**: `src/features/model-config/writer.ts`, `src/features/model-config/writer.test.ts`

---

### Wave 2: Model Schema (Phase 2)

#### S06: Model Schema Types + Zod Validation + Default Schema

**As** the routing system, **I need** a typed Model Schema with Zod validation and embedded defaults **so that** the router has a source of truth for model capabilities.

**Acceptance Criteria**:
- [ ] New module `src/shared/model-schema.ts`
- [ ] `ModelEntrySchema` Zod schema:
  - `model: z.string()`
  - `providers: z.array(z.string())`
  - `reasoning: z.enum(["none", "low", "medium", "high", "ultra"]).default("none")`
  - `domains: z.array(z.enum(["planning", "coding", "analysis", "visual", "writing", "search", "general"]))`
  - `description: z.string()`
  - `enabled_agents: z.array(z.string()).default([])`
  - `cost_tier: z.number().min(1).max(5)`
  - `variant: z.string().optional()`
  - `context_window: z.number().optional()`
- [ ] `ModelSchemaFileSchema = z.object({ models: z.array(ModelEntrySchema) })`
- [ ] `DEFAULT_MODEL_SCHEMA` constant with ~10 model entries (as defined in research doc Section 6.3)
- [ ] Helper: `getModelsForAgent(agentName)` — filters by `enabled_agents`
- [ ] Helper: `getModelsByDomain(domain)` — filters by `domains`
- [ ] Helper: `getModelsByReasoning(tier)` — filters by `reasoning`
- [ ] Tests: schema validates defaults, rejects invalid entries, helpers filter correctly
- [ ] `bun run typecheck` passes

**Files**: `src/shared/model-schema.ts`, `src/shared/model-schema.test.ts`

---

#### S07: JSONC File Loader (User + Project Level, Merge)

**As** the Model Schema system, **I need** a loader that reads user and project-level JSONC files and merges them with defaults **so that** users can customize the schema.

**Acceptance Criteria**:
- [ ] Function `loadModelSchema()` in `src/shared/model-schema.ts`:
  1. Read `~/.config/opencode/kord-aios/model-schema.jsonc` (user-level)
  2. Read `.opencode/kord-aios/model-schema.jsonc` (project-level)
  3. Merge: project overrides user overrides default (by `model` name)
  4. Validate each entry against `ModelEntrySchema`
  5. Invalid entries: log warning, skip (no crash)
  6. Normalize: if `variant` set but reasoning is "none", drop `variant` silently
- [ ] Returns `ModelEntry[]` — the merged and validated list
- [ ] Cache result for session lifetime (no re-reading on every call)
- [ ] Tests: default only, user override, project override, invalid entry skipped, normalization
- [ ] `bun run typecheck` passes

**Files**: `src/shared/model-schema.ts`, `src/shared/model-schema.test.ts`

---

#### S08: `/modelconfig` Model Schema View Integration

**As** a user, **I need** the `/modelconfig` command to show Model Schema entries **so that** I can see what models are classified for which agents.

**Acceptance Criteria**:
- [ ] `/modelconfig` template updated to include a "Model Schema" section
- [ ] Shows: model name, reasoning tier, domains, enabled agents, cost tier, variant
- [ ] Indicates which entries are default vs user-customized
- [ ] Mentions file path for manual editing
- [ ] Tests: template contains Model Schema section references
- [ ] `bun run typecheck` passes

**Files**: `src/features/builtin-commands/templates/modelconfig.ts`

---

### Wave 3: Dynamic Routing Engine (Phase 3-4)

#### S09: Heuristic Complexity Classifier

**As** the dynamic router, **I need** a heuristic classifier that determines task complexity and domain from a prompt **so that** the router can select appropriate models.

**Acceptance Criteria**:
- [ ] New module `src/shared/model-router.ts`
- [ ] Function `classifyTask(prompt, agentName?, category?)`:
  - Returns `{ complexity: "trivial" | "moderate" | "complex" | "deep", domains: string[] }`
  - Uses signal analysis: prompt length, keywords, agent type, category hint
  - Agent type signal: planning agents lean complex, explore leans trivial
  - Category signal: `ultrabrain` → complex, `quick` → trivial
  - Keyword detection: "refactor", "debug", "architecture" → complex; "fix typo", "rename" → trivial
  - Dependency keywords: "across modules", "system-wide" → complex
- [ ] Deterministic: same input → same output
- [ ] Tests: 15+ cases covering each complexity level, keyword matching, category influence, agent type influence
- [ ] `bun run typecheck` passes

**Files**: `src/shared/model-router.ts`, `src/shared/model-router.test.ts`

---

#### S10: Route Decision Engine

**As** the dynamic router, **I need** a decision engine that selects the best model from the agent-filtered schema based on classification **so that** the right model is used for each task.

**Acceptance Criteria**:
- [ ] Function `routeModel(agentName, classification, modelSchema, availableModels, costPreference?)`:
  1. Filter `modelSchema` to entries where `enabled_agents` includes `agentName`
  2. From filtered entries, match by `domains` overlap with classification domains
  3. From domain matches, select by `reasoning` tier appropriate for complexity level:
     - trivial → reasoning "none" or "low"
     - moderate → reasoning "medium" or "high"
     - complex → reasoning "high" or "ultra"
     - deep → reasoning "ultra"
  4. Apply cost preference: "economy" prefers lower `cost_tier`, "performance" prefers higher
  5. Check availability against `availableModels` set
  6. Return `{ model: string, variant?: string, provenance: "dynamic-route" }` or `undefined`
- [ ] Returns `undefined` if no match → caller falls back to static chain
- [ ] Tests: 20+ cases covering filtering, domain matching, reasoning tier selection, cost preference, availability check, no-match fallback
- [ ] `bun run typecheck` passes

**Files**: `src/shared/model-router.ts`, `src/shared/model-router.test.ts`

---

#### S11: Pipeline Integration (Per-Agent `routing_mode` Check)

**As** the model resolution pipeline, **I need** to check each agent's `routing_mode` and invoke the dynamic router when set to `"dynamic"` **so that** per-agent routing works end-to-end.

**Acceptance Criteria**:
- [ ] `resolveModelPipeline()` in `model-resolution-pipeline.ts` extended:
  - New optional input: `routingMode?: "static" | "dynamic"`, `modelSchema?: ModelEntry[]`, `agentName?: string`
  - If `routingMode === "dynamic"` and `modelSchema` provided:
    - Call `classifyTask()` + `routeModel()` before fallback chain step
    - If router returns a model, inject as `categoryDefaultModel` (takes precedence over fallback chain)
    - If router returns undefined, fall through to fallback chain (existing behavior)
  - If `routingMode === "static"` or undefined: skip dynamic routing (existing behavior)
- [ ] `applyModelResolution()` in `agents/utils.ts` extended to read `routing_mode` from agent override and pass to pipeline
- [ ] `fallback_slots` support: if `agents.{name}.fallback_slots` set, use as fallback chain instead of `AGENT_MODEL_REQUIREMENTS`
- [ ] All existing tests still pass (static mode = identical behavior)
- [ ] New tests: dynamic mode routes correctly, fallback_slots override chain, mixed mode agents
- [ ] `bun run typecheck` passes

**Files**: `src/shared/model-resolution-pipeline.ts`, `src/agents/utils.ts`, existing test files

---

#### S12: Delegation Executor Integration

**As** the task delegation system, **I need** `resolveCategoryExecution()` to respect per-category routing mode **so that** dynamic routing works for delegated tasks too.

**Acceptance Criteria**:
- [ ] `resolveCategoryExecution()` in `executor.ts` extended:
  - Read `routing_mode` from category config (via `userCategories`)
  - If dynamic: load Model Schema, classify task prompt, route for category
  - If static: existing behavior (fallback chain)
- [ ] Category `fallback_slots` support in config
- [ ] Tests: category with dynamic routing, category with custom slots, default behavior unchanged
- [ ] `bun run typecheck` passes

**Files**: `src/tools/delegate-task/executor.ts`, `src/tools/delegate-task/categories.ts`

---

### Wave 4: Prompt Override + Polish (Phase 5)

#### S13: Prompt-Based Model Override Parsing

**As** a user, **I need** to specify model preferences in my prompt using explicit syntax **so that** I can override routing for specific tasks.

**Acceptance Criteria**:
- [ ] Function `parsePromptModelOverride(prompt)` in `src/shared/model-router.ts`:
  - Detects patterns: `use model X`, `use X`, `with model X`, `@agent must use X`
  - Returns `{ model: string } | undefined`
  - Case-insensitive matching
  - Only matches full model IDs (e.g., "anthropic/claude-opus-4-6" or "claude-opus-4-6")
  - **No free-form detection** — explicit syntax only
- [ ] Integration: parsed override injected as `userModel` in resolution pipeline
- [ ] Works in both static and dynamic modes
- [ ] Gated by `model_routing.prompt_override` config (default: true)
- [ ] Tests: explicit syntax matches, partial strings don't match, disabled via config
- [ ] `bun run typecheck` passes

**Files**: `src/shared/model-router.ts`, `src/shared/model-resolution-pipeline.ts`, `src/shared/model-router.test.ts`

---

#### S14: LLM Nano Classifier Option

**As** a power user, **I need** the option to use an LLM nano model for task classification **so that** I get more accurate routing for ambiguous prompts.

**Acceptance Criteria**:
- [ ] Function `classifyTaskWithLLM(prompt, agentName, client)` in `src/shared/model-router.ts`:
  - Uses `gpt-5-nano` (or configured nano model) to classify task
  - Returns same `{ complexity, domains }` shape as heuristic
  - Graceful fallback to heuristic if LLM call fails
- [ ] Activated by `model_routing.classifier: "llm"` in config
- [ ] Default remains `"heuristic"` (zero latency)
- [ ] Tests: LLM classifier returns correct shape, fallback to heuristic on error
- [ ] `bun run typecheck` passes

**Files**: `src/shared/model-router.ts`, `src/shared/model-router.test.ts`

---

### Wave 5: Documentation (Phase 6)

#### S15: Documentation Update

**As** the project, **I need** all documentation updated to reflect the Model Routing Evolution **so that** users and contributors understand the new system.

**Acceptance Criteria**:
- [ ] `README.md` updated:
  - New section or subsection describing `/modelconfig` command
  - Description of static vs dynamic routing modes
  - Example config snippet
- [ ] `CONTRIBUTING.md` updated:
  - How to add new models to the default Model Schema
  - How routing mode affects development/testing
- [ ] `AGENTS.md` (root) updated:
  - "Agent Models" section updated to describe per-agent routing
  - Model Schema file path documented
- [ ] `src/shared/AGENTS.md` updated:
  - New files documented: `model-schema.ts`, `model-router.ts`
- [ ] `src/features/AGENTS.md` updated:
  - New module documented: `model-config/`
- [ ] `docs/configurations.md` updated:
  - New config fields documented: `routing_mode`, `fallback_slots`, `model_routing`
- [ ] `docs/features.md` updated:
  - `/modelconfig` command documented
  - Dynamic routing feature documented
- [ ] `bun run typecheck` passes

**Files**: `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `src/shared/AGENTS.md`, `src/features/AGENTS.md`, `docs/configurations.md`, `docs/features.md`

---

## Wave Execution Plan

| Wave | Stories | Focus | Dependencies |
|------|---------|-------|-------------|
| **Wave 1** | S01, S02, S03, S04, S05 | Foundation + `/modelconfig` TUI (static mode) | None |
| **Wave 2** | S06, S07, S08 | Model Schema (JSONC types, loader, validation) | Wave 1 (S02 for schema types) |
| **Wave 3** | S09, S10, S11, S12 | Dynamic routing engine + pipeline integration | Wave 2 (needs Model Schema) |
| **Wave 4** | S13, S14 | Prompt override + LLM nano classifier | Wave 3 (needs router) |
| **Wave 5** | S15 | Documentation | All waves complete |

### Parallelization Within Waves

| Wave | Parallel Groups |
|------|----------------|
| **Wave 1** | S01 (research) can run parallel with S02 (schema). S03 depends on S02. S04 depends on S03. S05 parallel with S04. |
| **Wave 2** | S06 first (types). S07 depends on S06. S08 parallel with S07. |
| **Wave 3** | S09 first (classifier). S10 depends on S09. S11 depends on S10. S12 depends on S11. |
| **Wave 4** | S13 and S14 parallel. |
| **Wave 5** | S15 sequential (single story). |

---

## Effort Estimate

| Wave | Stories | Estimated Effort | Complexity |
|------|---------|-----------------|------------|
| Wave 1 | 5 | 3-4 days | Medium |
| Wave 2 | 3 | 2-3 days | Low-Medium |
| Wave 3 | 4 | 4-5 days | **High** |
| Wave 4 | 2 | 1-2 days | Medium |
| Wave 5 | 1 | 1 day | Low |
| **Total** | **15** | **11-15 days** | — |

---

## Out of Scope (Future)

- **Native TUI widgets** — Using OpenCode's BubbleTea/Ink for actual interactive components (current approach is prompt-driven)
- **Auto-detection of new models** — Automatically adding models to schema when new ones appear in providers
- **A/B testing** — Running same task with different models and comparing results
- **Cost tracking** — Tracking actual API costs per routing decision
- **Model performance metrics** — Logging and analyzing model performance per task type
- **Model Schema marketplace** — Sharing/downloading community model schemas

---

## Anti-Patterns

- **Don't use global routing mode** — Routing is per-agent; no single toggle for all agents
- **Don't confuse `reasoning` with `variant`** — `reasoning` is classification (schema), `variant` is runtime (API param)
- **Don't crash on invalid Model Schema** — Skip invalid entries, log warning, use defaults
- **Don't add latency to static mode** — Dynamic routing code paths only execute when agent is in dynamic mode
- **Don't break existing fallback behavior** — Static mode with no `fallback_slots` = identical to current `AGENT_MODEL_REQUIREMENTS`
- **Don't make `/modelconfig` mandatory** — Users who never run it get identical behavior to today
