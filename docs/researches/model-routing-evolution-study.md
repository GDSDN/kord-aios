# Model Routing Evolution Study

**Date:** 2026-02-13
**Status:** Research Complete — Decisions Taken
**Scope:** Current fallback system analysis + `/modelconfig` command + Dynamic Model Routing
**Updated:** 2026-02-13 (v2 — incorporated design decisions)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current System: Deep Analysis](#2-current-system-deep-analysis)
3. [Problem Statement](#3-problem-statement)
4. [Proposal 1: `/modelconfig` Interactive Command](#4-proposal-1-modelconfig-interactive-command)
5. [Proposal 2: Dynamic Model Routing](#5-proposal-2-dynamic-model-routing)
6. [Model Schema (Source of Truth)](#6-model-schema-source-of-truth)
7. [Reasoning Abstraction: Variant System](#7-reasoning-abstraction-variant-system)
8. [Configuration Schema Evolution](#8-configuration-schema-evolution)
9. [Impact Matrix](#9-impact-matrix)
10. [Migration Strategy](#10-migration-strategy)
11. [Risk Assessment](#11-risk-assessment)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Decision Matrix](#13-decision-matrix)

---

## 1. Executive Summary

The current Kord AIOS model fallback system is **hardcoded** in `src/shared/model-requirements.ts`. While functional, it has two critical limitations:

1. **No practical way to modify fallback chains** — Users must edit JSONC config files manually, understanding the `agents.{name}.model` override structure.
2. **No intelligent routing** — Model selection is static per agent, regardless of task type, complexity, or user intent.

This study proposes two complementary features:

- **`/modelconfig`**: An interactive terminal command (like `/models` in OpenCode) for configuring agent models and fallback chains visually.
- **Dynamic Model Routing**: An intelligent layer that selects the optimal model at task delegation time based on task type, complexity classification, and a user-editable **Model Classification Table**.

Both features are **additive** — they extend the existing system without breaking it. Routing mode is configured **per-agent**, not globally:

- **Static mode** (default): Hardcoded fallback chain — user can customize the 4 model slots per agent via `/modelconfig`
- **Dynamic mode**: Intelligent routing — the router selects the optimal model at task time based on the Model Schema, filtering only models enabled for that agent

The `/modelconfig` TUI menu is the single entry point for both modes: selecting routing mode per agent, editing model slots (static), and viewing the Model Schema (dynamic).

---

## 2. Current System: Deep Analysis

### 2.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Model Resolution Flow                  │
│                                                          │
│  ┌─────────────┐    ┌───────────────────┐                │
│  │ UI Selected  │───▶│                   │                │
│  │ Model        │    │                   │                │
│  └─────────────┘    │                   │                │
│                     │  resolveModel     │  ┌───────────┐ │
│  ┌─────────────┐    │  Pipeline()       │──▶│  Resolved │ │
│  │ User Config  │───▶│                   │  │  Model    │ │
│  │ Override     │    │  (model-resolution│  │  +variant │ │
│  └─────────────┘    │   -pipeline.ts)   │  └───────────┘ │
│                     │                   │                │
│  ┌─────────────┐    │                   │                │
│  │ Fallback     │───▶│                   │                │
│  │ Chain        │    │                   │                │
│  └─────────────┘    │                   │                │
│                     │                   │                │
│  ┌─────────────┐    │                   │                │
│  │ System       │───▶│                   │                │
│  │ Default      │    └───────────────────┘                │
│  └─────────────┘                                         │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Resolution Priority (4-step pipeline)

The pipeline in `src/shared/model-resolution-pipeline.ts` resolves models in strict order:

| Step | Source | Provenance | Description |
|------|--------|------------|-------------|
| 1 | UI Selected Model | `override` | User picks model in OpenCode TUI `/models` menu |
| 2 | User Config Override | `override` | `agents.{name}.model` in kord-aios.jsonc |
| 3 | Fallback Chain | `provider-fallback` | Hardcoded in `AGENT_MODEL_REQUIREMENTS` |
| 4 | System Default | `system-default` | OpenCode's configured default model |

### 2.3 Hardcoded Fallback Chains

**File:** `src/shared/model-requirements.ts`

#### Agent Fallback Table (Current State)

| Agent | Primary Model | Fallback 1 | Fallback 2 | Fallback 3 | Fallback 4 | Gating |
|-------|--------------|------------|------------|------------|------------|--------|
| **kord** | claude-opus-4-6 (max) | k2p5 | kimi-k2.5-free | glm-4.7 | glm-4.7-free | requiresAnyModel |
| **dev** | gpt-5.3-codex (medium) | — | — | — | — | requiresProvider |
| **architect** | gpt-5.2 (high) | gemini-3-pro (high) | claude-opus-4-6 (max) | — | — | — |
| **librarian** | glm-4.7 | glm-4.7-free | claude-sonnet-4-5 | — | — | — |
| **explore** | grok-code-fast-1 | claude-haiku-4-5 | gpt-5-nano | — | — | — |
| **vision** | gemini-3-flash | gpt-5.2 | glm-4.6v | k2p5 | kimi-k2.5-free + more | — |
| **plan** | claude-opus-4-6 (max) | k2p5 | kimi-k2.5-free | gpt-5.2 (high) | gemini-3-pro | — |
| **analyst** | claude-opus-4-6 (max) | k2p5 | kimi-k2.5-free | gpt-5.2 (high) | gemini-3-pro (high) | — |
| **plan-analyzer** | claude-opus-4-6 (max) | k2p5 | kimi-k2.5-free | gpt-5.2 (high) | gemini-3-pro (high) | — |
| **plan-reviewer** | gpt-5.2 (medium) | claude-opus-4-6 (max) | gemini-3-pro (high) | — | — | — |
| **qa** | gpt-5.2 (medium) | claude-opus-4-6 (max) | gemini-3-pro (high) | — | — | — |
| **build** | k2p5 | kimi-k2.5-free | claude-sonnet-4-5 | gpt-5.2 | gemini-3-pro | — |

#### Category Fallback Table (Current State)

| Category | Primary Model | Fallback 1 | Fallback 2 | Gating |
|----------|--------------|------------|------------|--------|
| **visual-engineering** | gemini-3-pro | claude-opus-4-6 (max) | glm-4.7 | — |
| **ultrabrain** | gpt-5.3-codex (xhigh) | gemini-3-pro (high) | claude-opus-4-6 (max) | — |
| **deep** | gpt-5.3-codex (medium) | claude-opus-4-6 (max) | gemini-3-pro (high) | requiresModel |
| **artistry** | gemini-3-pro (high) | claude-opus-4-6 (max) | gpt-5.2 | requiresModel |
| **quick** | claude-haiku-4-5 | gemini-3-flash | gpt-5-nano | — |
| **unspecified-low** | claude-sonnet-4-5 | gpt-5.3-codex (medium) | gemini-3-flash | — |
| **unspecified-high** | claude-opus-4-6 (max) | gpt-5.2 (high) | gemini-3-pro | — |
| **writing** | gemini-3-flash | claude-sonnet-4-5 | glm-4.7 | — |

### 2.4 Availability Resolution

The system resolves model availability through multiple layers:

1. **Provider-Models Cache** (`~/.kord-aios/cache/provider-models.json`) — Cached model lists per provider
2. **Connected-Providers Cache** (`~/.kord-aios/cache/connected-providers.json`) — Which providers are active
3. **OpenCode models.json** (`~/.opencode/cache/models.json`) — OpenCode's own model cache
4. **Live API** (`client.model.list()`) — Real-time query (avoided during init to prevent deadlock)
5. **Fuzzy Matching** (`fuzzyMatchModel()`) — Case-insensitive substring matching with normalization

### 2.5 Key Data Types

```typescript
// src/shared/model-requirements.ts
type FallbackEntry = {
  providers: string[]    // ["anthropic", "github-copilot", "opencode"]
  model: string          // "claude-opus-4-6"
  variant?: string       // "max", "high", "medium", "xhigh"
}

type ModelRequirement = {
  fallbackChain: FallbackEntry[]
  variant?: string                 // Default variant
  requiresModel?: string           // Gating: only if this model available
  requiresAnyModel?: boolean       // Gating: at least one fallback available
  requiresProvider?: string[]      // Gating: any of these providers connected
}
```

### 2.6 Current Override Mechanism

Users can override agent models via `kord-aios.jsonc`:

```jsonc
{
  "agents": {
    "architect": {
      "model": "openai/gpt-5.2",        // Direct model override
      "category": "ultrabrain",           // Or inherit from category
      "temperature": 0.2,
      "variant": "high"
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3-pro",
      "variant": "high"
    }
  }
}
```

**Pain point:** This requires manually editing JSONC, knowing agent names, model IDs, provider formats, and variant names. There is no discoverability, no validation feedback, and no way to see what's actually available.

---

## 3. Problem Statement

### 3.1 Problems with Current System

| # | Problem | Severity | Who it affects |
|---|---------|----------|----------------|
| P1 | Fallback chains hardcoded in TypeScript — requires code changes to update | **High** | Plugin maintainers |
| P2 | No UI to configure agent models — requires manual JSONC editing | **High** | All users |
| P3 | No discoverability — user must know agent names, model IDs, provider formats | **Medium** | New users |
| P4 | Static routing — same model regardless of task complexity | **Medium** | Power users |
| P5 | No per-task model override — can't say "@agent use model X for this" | **Low** | Advanced users |
| P6 | Category models are also hardcoded — same issue as agent fallbacks | **Medium** | Plugin maintainers |
| P7 | No visibility into what model is actually being used per agent | **Medium** | Debugging |

### 3.2 Desired State

1. **Easy configuration** — Interactive TUI menu to set agent models and fallbacks
2. **Dynamic routing** — Model selected based on task type/complexity at runtime
3. **User control** — Editable Model Classification Table as source of truth
4. **Backward compatible** — Hardcoded fallback still works as default
5. **Transparent** — User can see which model each agent is using and why

---

## 4. Proposal 1: `/modelconfig` Interactive Command

### 4.1 Concept

A new builtin command `/modelconfig` that opens a **TUI-style interactive menu** in the terminal, similar to OpenCode's `/models` command. The key UX is a **hierarchical menu**:

1. **Agent List** — Shows all agents with their current routing mode and active model
2. **Agent Detail** — 4 model slots (fallback positions) + routing mode toggle
3. **Model Selector** — Filtered list of models from connected providers only

> **IMPORTANT**: Must study OpenCode's `/models` implementation to understand how it captures and presents available providers/models. The `/models` command already solves the "show only models from configured providers" problem — we reuse that pattern.

### 4.2 UX Flow

```
User: /modelconfig

┌─────────────────────────────────────────────────┐
│  Model Configuration                             │
│  Connected: anthropic, openai, google, copilot   │
│                                                  │
│  ▸ kord          [static]  claude-opus-4-6       │
│    dev           [static]  gpt-5.3-codex         │
│    architect     [dynamic] (auto-routed)         │
│    librarian     [static]  glm-4.7               │
│    explore       [static]  grok-code-fast-1      │
│    plan          [static]  claude-opus-4-6       │
│    build         [static]  k2p5                  │
│    analyst       [static]  claude-opus-4-6       │
│    vision        [static]  gemini-3-flash        │
│    qa            [static]  gpt-5.2               │
│    ...                                           │
│                                                  │
│  [Reset All to Defaults]                         │
└─────────────────────────────────────────────────┘
                    │
                    ▼ (select agent "kord")
┌─────────────────────────────────────────────────┐
│  kord — Model Configuration                      │
│                                                  │
│  Routing: ▸ Static (fallback chain)              │
│             Dynamic (auto-routed)                │
│                                                  │
│  Fallback Slots:                                 │
│  ┌──────────────────────────────────────────┐    │
│  │ Slot 1 (primary): anthropic/claude-opus-4-6 │ │
│  │ Slot 2 (fallback): kimi/k2p5              │  │
│  │ Slot 3 (fallback): kimi/kimi-k2.5-free    │  │
│  │ Slot 4 (fallback): zai/glm-4.7            │  │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [Reset to Default Preset]                       │
└─────────────────────────────────────────────────┘
                    │
                    ▼ (select Slot 1)
┌─────────────────────────────────────────────────┐
│  Select Model for kord — Slot 1                  │
│                                                  │
│  anthropic/                                      │
│    ▸ claude-opus-4-6                             │
│      claude-sonnet-4-5                           │
│      claude-haiku-4-5                            │
│  openai/                                         │
│    gpt-5.3-codex                                 │
│    gpt-5.2                                       │
│    gpt-5-nano                                    │
│  google/                                         │
│    gemini-3-pro                                  │
│    gemini-3-flash                                │
│  ...                                             │
│  (only models from connected providers shown)    │
└─────────────────────────────────────────────────┘
```

### 4.3 Key Behaviors

| Behavior | Description |
|----------|-------------|
| **Static mode (default)** | Shows 4 editable fallback slots. Models tried in order: Slot 1 → 2 → 3 → 4 → system default |
| **Dynamic mode** | Hides fallback slots. Shows "Auto-routed based on Model Schema". Agent's model will be chosen by the router at task time |
| **Provider filtering** | Model selector only shows models from providers configured in OpenCode (reuses `/models` provider detection pattern) |
| **Default presets** | Each agent ships with a default 4-slot preset (current `AGENT_MODEL_REQUIREMENTS` chains, truncated/padded to 4) |
| **Persistence** | Changes saved to `kord-aios.jsonc` under `agents.{name}.fallback_slots` and `agents.{name}.routing_mode` |
| **Categories** | Categories also appear in the agent list (as `[cat] visual-engineering`, etc.) with same 4-slot editing |

### 4.4 Implementation Plan

#### OpenCode `/models` Study (Prerequisite)
Clone OpenCode repo to `/tmp/opencode-source` and examine:
- How `/models` captures connected providers
- How it presents available models per provider
- The TUI widget pattern used (if any)
- Whether we can reuse the provider/model detection logic

#### New files:
- `src/features/builtin-commands/templates/modelconfig.ts` — Command template with state injection
- `src/features/model-config/reader.ts` — Read resolved model state (agents + categories + caches)
- `src/features/model-config/writer.ts` — Write model config changes to `kord-aios.jsonc`

#### Modified files:
- `src/features/builtin-commands/commands.ts` — Register `/modelconfig`
- `src/features/builtin-commands/types.ts` — Add `"modelconfig"` to `BuiltinCommandName`
- `src/config/schema.ts` — Add `fallback_slots`, `routing_mode` per-agent fields

#### Complexity: **Medium** (4-5 stories)

### 4.5 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI approach | Prompt-driven TUI (agent presents menu, user selects) | Consistent with existing commands, leverages agent intelligence for presentation |
| Routing scope | **Per-agent** (not global) | User can have `kord` on static and `architect` on dynamic simultaneously |
| Slot count | 4 per agent | Balances flexibility with simplicity; covers 95% of current chains |
| Provider detection | Reuse OpenCode's `/models` pattern | Already solved; study repo to confirm API |
| Persistence | `kord-aios.jsonc` → `agents.{name}` section | Existing config system, backward compatible |
| Category support | Categories treated like agents in the menu | Unified UX |

---

## 5. Proposal 2: Dynamic Model Routing

### 5.1 Concept

When an agent has `routing_mode: "dynamic"`, instead of walking a static fallback chain, a **routing layer** selects the optimal model at task time. The router:

1. **Loads the Model Schema** — but filters to only models with `enabledAgents` including this agent
2. **Classifies the task** — determines complexity and domain from the prompt
3. **Selects the best match** — from the filtered (reduced) decision matrix
4. **Checks availability** — against connected providers
5. **Falls back gracefully** — to static chain if no dynamic match found

### 5.2 Classifier: LLM Nano vs Heuristic

Two approaches were evaluated for task classification:

| Approach | Pros | Cons |
|----------|------|------|
| **LLM Nano** (e.g., `gpt-5-nano`) | Nuanced understanding, handles ambiguity, can interpret complex prompts | Adds latency (~200-500ms), requires API call, costs tokens, external dependency |
| **Heuristic Script** | Zero latency, deterministic, no external dependency, testable | Less nuanced, needs keyword/pattern maintenance, may misclassify edge cases |

**Decision: Hybrid approach**
- **Default**: Heuristic classifier (zero latency, deterministic)
- **Optional**: LLM nano classifier enabled via config `model_routing.classifier: "llm"` for users who want more accuracy and accept the tradeoff
- The heuristic handles 80%+ of cases well; LLM nano is for power users who want smarter routing

### 5.3 Architecture (Per-Agent)

```
┌───────────────────────────────────────────────────────────────────┐
│             Dynamic Routing Flow (per-agent, when enabled)         │
│                                                                   │
│  ┌──────────┐                                                     │
│  │ Task      │                                                    │
│  │ Prompt    │                                                    │
│  └────┬─────┘                                                     │
│       │                                                           │
│       ▼                                                           │
│  ┌──────────────────┐                                             │
│  │ Agent Routing     │ ← Check: is this agent set to "dynamic"?   │
│  │ Mode Check        │   If "static" → skip, use fallback chain   │
│  └────┬─────────────┘                                             │
│       │ dynamic                                                   │
│       ▼                                                           │
│  ┌──────────────────┐   ┌─────────────────────────┐               │
│  │ Model Schema      │──▶│ Filter: only models     │               │
│  │ (full)            │   │ enabled for THIS agent  │               │
│  └──────────────────┘   └────────┬────────────────┘               │
│                                  │ reduced matrix                  │
│                                  ▼                                 │
│  ┌──────────────────┐   ┌─────────────────────────┐               │
│  │ Classifier        │──▶│ Route Decision           │               │
│  │ (heuristic/nano)  │   │ complexity + domain      │               │
│  └──────────────────┘   │ → best model from matrix │               │
│                          └────────┬────────────────┘               │
│                                   │                                │
│                                   ▼                                │
│                          ┌────────────────┐                        │
│                          │ resolveModel   │                        │
│                          │ Pipeline()     │ ← injects as           │
│                          │ (existing)     │   categoryDefaultModel │
│                          └────────────────┘                        │
└───────────────────────────────────────────────────────────────────┘
```

**Key insight**: By filtering the Model Schema to only models enabled for the target agent, the decision matrix is dramatically reduced (typically 3-6 models instead of 15+). This makes the routing fast and focused.

### 5.4 Complexity Classification

The heuristic classifier uses signal analysis:

| Signal | Weight | How Detected |
|--------|--------|-------------|
| Agent type | High | Planning agents lean complex, explore leans simple |
| Category hint | High | `ultrabrain` = complex, `quick` = simple |
| Prompt length | Low | Token count thresholds |
| Keywords | Medium | "refactor", "debug", "architecture", "quick fix", etc. |
| Explicit user request | Absolute | `@agent use model X` parsed from prompt |
| File count mentioned | Low | Multi-file = more complex |
| Dependency keywords | Medium | "across modules", "system-wide", "breaking change" |

**Classification levels:**

| Level | Description | Model Tier |
|-------|-------------|------------|
| `trivial` | Single file, simple change, quick lookup | Economy (haiku, flash, nano) |
| `moderate` | Standard development, bounded scope | Mid-tier (sonnet, gpt-5.2) |
| `complex` | Multi-system, architecture, deep analysis | Premium (opus, gpt-5.3-codex) |
| `deep` | Autonomous, long-running, strategic | Ultra (opus max, codex xhigh) |

### 5.5 Integration with Existing Pipeline

Dynamic routing **does not replace** `resolveModelPipeline()`. It inserts **before** the fallback chain step:

```
Current:  UI → Config Override → Fallback Chain → System Default
                                 ↑ hardcoded

Proposed: UI → Config Override → Dynamic Route → Fallback Chain → System Default
                                 ↑ per-agent      ↑ still works as safety net
                                   (if enabled)
```

If the agent is in **static mode** (default), behavior is identical to today. If in **dynamic mode**, the router provides a `categoryDefaultModel` to the pipeline, which takes precedence over the fallback chain but not over explicit user overrides.

### 5.6 Prompt-Based Model Override

Users can specify model preferences directly in their prompt:

```
"@architect use claude-opus-4-6 for this task — analyze the authentication flow"
```

The routing engine parses explicit patterns only:
- `use model X` / `use X` / `with model X`
- `@agent must use X`

**No free-form detection** — explicit syntax only to prevent false positives.

This is injected as `userModel` in the resolution pipeline, taking highest priority after UI selection. Works in both static and dynamic modes.

---

## 6. Model Schema (Source of Truth)

### 6.1 Format Decision: JSONC

| Format | Pros | Cons | Verdict |
|--------|------|------|---------|
| **JSONC** | Consistent with `kord-aios.jsonc`, supports comments, user-editable, Zod-validatable | Slightly verbose | **Selected** |
| TypeScript | Type-safe, IDE support | Not user-editable at runtime, requires rebuild | Rejected |
| YAML | Clean syntax | Not used elsewhere in project, no existing parser | Rejected |

### 6.2 Schema Structure

```typescript
// src/shared/model-schema.ts — TypeScript type (Zod schema validates the JSONC)

type ModelEntry = {
  /** Model ID (e.g., "claude-opus-4-6") */
  model: string
  /** Providers that offer this model */
  providers: string[]
  /** Reasoning capability tier — unified term, NOT "thinking" */
  reasoning: "none" | "low" | "medium" | "high" | "ultra"
  /** Best-suited task domains */
  domains: ("planning" | "coding" | "analysis" | "visual" | "writing" | "search" | "general")[]
  /** Short description of when to use */
  description: string
  /** Agents enabled to use this model (empty = all agents) */
  enabled_agents: string[]
  /** Relative cost tier (1=cheapest, 5=most expensive) */
  cost_tier: 1 | 2 | 3 | 4 | 5
  /** Default variant for this model — maps to provider-specific reasoning params */
  variant?: string
  /** Maximum context window (tokens) */
  context_window?: number
}
```

**Key terminology decision**: Use `reasoning` (not `thinking`, not `variant`) as the capability tier field in the schema. The `variant` field remains for specifying the OpenCode variant string that maps to provider-specific params. See Section 7 for the mapping.

### 6.3 Default Schema (Shipped with Plugin)

```jsonc
// model-schema.jsonc — embedded default, user can override
{
  "models": [
    {
      "model": "claude-opus-4-6",
      "providers": ["anthropic", "github-copilot", "opencode"],
      "reasoning": "ultra",
      "domains": ["planning", "analysis", "coding"],
      "description": "Deep reasoning, strategic planning, complex architecture",
      "enabled_agents": ["kord", "plan", "analyst", "plan-analyzer", "unspecified-high"],
      "cost_tier": 5,
      "variant": "max"
    },
    {
      "model": "claude-sonnet-4-5",
      "providers": ["anthropic", "github-copilot", "opencode"],
      "reasoning": "high",
      "domains": ["coding", "general"],
      "description": "Balanced reasoning and speed",
      "enabled_agents": ["build", "librarian", "unspecified-low"],
      "cost_tier": 3
    },
    {
      "model": "claude-haiku-4-5",
      "providers": ["anthropic", "github-copilot", "opencode"],
      "reasoning": "low",
      "domains": ["search", "general"],
      "description": "Fast, economical, quick tasks",
      "enabled_agents": ["explore", "quick"],
      "cost_tier": 1
    },
    {
      "model": "gpt-5.3-codex",
      "providers": ["openai", "github-copilot", "opencode"],
      "reasoning": "ultra",
      "domains": ["coding", "analysis"],
      "description": "Autonomous deep coding, extended problem solving",
      "enabled_agents": ["dev", "ultrabrain", "deep"],
      "cost_tier": 5,
      "variant": "medium"
    },
    {
      "model": "gpt-5.2",
      "providers": ["openai", "github-copilot", "opencode"],
      "reasoning": "high",
      "domains": ["coding", "analysis", "planning"],
      "description": "Strong general reasoning",
      "enabled_agents": ["architect", "qa", "plan-reviewer"],
      "cost_tier": 4,
      "variant": "high"
    },
    {
      "model": "gpt-5-nano",
      "providers": ["openai", "opencode"],
      "reasoning": "none",
      "domains": ["search"],
      "description": "Ultra-fast lookups, zero reasoning overhead",
      "enabled_agents": ["explore"],
      "cost_tier": 1
    },
    {
      "model": "gemini-3-pro",
      "providers": ["google", "github-copilot", "opencode"],
      "reasoning": "high",
      "domains": ["visual", "coding", "analysis"],
      "description": "Multimodal, creative, strong visual understanding",
      "enabled_agents": ["visual-engineering", "artistry"],
      "cost_tier": 4,
      "variant": "high"
    },
    {
      "model": "gemini-3-flash",
      "providers": ["google", "github-copilot", "opencode"],
      "reasoning": "medium",
      "domains": ["writing", "visual", "search"],
      "description": "Fast multimodal, good for writing and quick visual",
      "enabled_agents": ["vision", "writing", "quick"],
      "cost_tier": 2
    },
    {
      "model": "glm-4.7",
      "providers": ["zai-coding-plan"],
      "reasoning": "medium",
      "domains": ["search", "general"],
      "description": "Budget alternative, documentation search",
      "enabled_agents": ["librarian", "build"],
      "cost_tier": 2
    },
    {
      "model": "k2p5",
      "providers": ["kimi-for-coding"],
      "reasoning": "high",
      "domains": ["coding", "planning"],
      "description": "Kimi strong reasoning, cost-effective alternative",
      "enabled_agents": ["kord", "plan", "analyst", "build"],
      "cost_tier": 3
    }
  ]
}
```

### 6.4 Storage Location

```
~/.config/opencode/kord-aios/model-schema.jsonc     (user-level)
.opencode/kord-aios/model-schema.jsonc               (project-level override)
```

**Merge strategy:** Project-level entries override user-level entries by `model` name. The plugin ships a **default schema embedded in TypeScript** that is used when no file exists.

### 6.5 Editing Flow

1. **`/modelconfig`** → navigate to "Model Schema" section → view current entries
2. **Manual edit** — User can directly edit `model-schema.jsonc`
3. **Validation** — On load, validated against Zod schema; invalid entries logged and skipped (no crash)
4. **Normalization** — If a model doesn't support reasoning (no `variant`), the field is dropped silently

---

## 7. Reasoning Abstraction: Variant System

### 7.1 Current State

The codebase already has a **working abstraction** for reasoning/thinking parameters across providers:

| Layer | File | What it does |
|-------|------|-------------|
| **`variant`** | `src/shared/agent-variant.ts` | Resolves variant string per agent (from config override → fallback chain → category) |
| **`THINKING_CONFIGS`** | `src/hooks/think-mode/switcher.ts` | Maps provider → provider-specific thinking params |
| **`anthropic-effort`** | `src/hooks/anthropic-effort/` | Injects Anthropic `effort: "max"` when variant is "max" |
| **Fallback chain entries** | `src/shared/model-requirements.ts` | Each entry has optional `variant` field |

### 7.2 Provider-Specific Parameter Mapping (Already Implemented)

```
variant: "max" / "high" / "medium" / "low"
         │
         ├── anthropic  → { thinking: { type: "enabled", budgetTokens: 64000 }, effort: "max" }
         ├── openai     → { reasoning_effort: "high" }
         ├── google     → { providerOptions: { google: { thinkingConfig: { thinkingLevel: "HIGH" } } } }
         ├── bedrock    → { reasoningConfig: { type: "enabled", budgetTokens: 32000 } }
         └── zai        → { providerOptions: { extra_body: { thinking: { type: "enabled" } } } }
```

The `think-mode` hook also has `THINKING_CAPABLE_MODELS` that validates whether a model actually supports thinking before injecting params. Models that don't support it are silently skipped.

### 7.3 Terminology Decision

| Term | Used for | In schema |
|------|----------|-----------|
| **`reasoning`** | Capability tier in Model Schema (`"none"` / `"low"` / `"medium"` / `"high"` / `"ultra"`) | `model-schema.jsonc` |
| **`variant`** | OpenCode's abstraction string sent to the API (`"max"`, `"high"`, `"medium"`, `"xhigh"`) | `kord-aios.jsonc`, fallback chain entries |

These are **two different concepts**:
- `reasoning` = "how capable is this model at reasoning?" (classification, read-only for routing)
- `variant` = "what reasoning effort level should we request?" (runtime parameter, sent to provider)

**Rule**: Never confuse the two. The Model Schema uses `reasoning` for classification. The agent config and fallback chain use `variant` for runtime behavior.

### 7.4 Safety: Normalization on Load

When loading the Model Schema:
1. If `variant` is set but the model doesn't support reasoning → drop `variant` silently, log debug warning
2. If `reasoning` is missing → default to `"none"`
3. If provider params fail at runtime → existing hooks already handle gracefully (no crash)

The existing `THINKING_CAPABLE_MODELS` map in `switcher.ts` is the ultimate safety net — even if the schema says a model supports reasoning, the hook verifies before injecting provider-specific params.

---

## 8. Configuration Schema Evolution

### 8.1 New Schema Additions

```typescript
// Additions to src/config/schema.ts

export const RoutingModeSchema = z.enum(["static", "dynamic"])

export const ModelSchemaEntrySchema = z.object({
  model: z.string(),
  providers: z.array(z.string()),
  reasoning: z.enum(["none", "low", "medium", "high", "ultra"]).default("none"),
  domains: z.array(z.enum([
    "planning", "coding", "analysis", "visual", "writing", "search", "general"
  ])),
  description: z.string(),
  enabled_agents: z.array(z.string()).default([]),
  cost_tier: z.number().min(1).max(5),
  variant: z.string().optional(),
  context_window: z.number().optional(),
})

export const ModelSchemaFileSchema = z.object({
  models: z.array(ModelSchemaEntrySchema),
})

// Per-agent additions to AgentOverrideSchema
export const AgentOverrideSchemaExtensions = {
  /** Per-agent routing mode: "static" (default) or "dynamic" */
  routing_mode: RoutingModeSchema.optional(),
  /** Custom fallback slots (4 max) — overrides AGENT_MODEL_REQUIREMENTS */
  fallback_slots: z.array(z.string()).max(4).optional(),
}

// Global model routing config
export const ModelRoutingConfigSchema = z.object({
  /** Classifier type: "heuristic" (default, zero latency) or "llm" (uses nano model) */
  classifier: z.enum(["heuristic", "llm"]).default("heuristic"),
  /** Cost preference for dynamic routing */
  cost_preference: z.enum(["economy", "balanced", "performance"]).default("balanced"),
  /** Allow prompt-based model override (e.g., "@agent use model X") */
  prompt_override: z.boolean().default(true),
  /** Custom model schema file path */
  model_schema_path: z.string().optional(),
})
```

### 8.2 Integration into Main Config

```typescript
// Addition to OhMyOpenCodeConfigSchema
export const OhMyOpenCodeConfigSchema = z.object({
  // ... existing fields ...
  model_routing: ModelRoutingConfigSchema.optional(),
})

// Extended agent override
export const AgentOverrideSchema = z.object({
  // ... existing fields (model, category, temperature, variant) ...
  routing_mode: RoutingModeSchema.optional(),
  fallback_slots: z.array(z.string()).max(4).optional(),
})
```

### 8.3 Example User Config

```jsonc
{
  "agents": {
    // Static mode: explicit fallback slots (customized via /modelconfig)
    "kord": {
      "routing_mode": "static",
      "fallback_slots": [
        "anthropic/claude-opus-4-6",
        "kimi-for-coding/k2p5",
        "zai-coding-plan/glm-4.7"
      ]
    },
    // Dynamic mode: router picks model at task time
    "architect": {
      "routing_mode": "dynamic"
    },
    // Legacy override (still works, takes priority)
    "dev": {
      "model": "openai/gpt-5.3-codex"
    }
  },
  // Global routing settings
  "model_routing": {
    "classifier": "heuristic",
    "cost_preference": "balanced",
    "prompt_override": true
  }
}
```

---

## 9. Impact Matrix

### 9.1 Files to Modify

| File | Change Type | Impact | Risk |
|------|------------|--------|------|
| `src/config/schema.ts` | **Add** ModelRoutingConfigSchema, BuiltinCommandNameSchema update | Low | Low — additive |
| `src/shared/model-requirements.ts` | **Refactor** to support runtime override | Medium | **Medium** — core model resolution |
| `src/shared/model-resolution-pipeline.ts` | **Extend** with dynamic routing step | Medium | **High** — all agent model resolution flows through here |
| `src/shared/model-availability.ts` | **Minor** — expose model metadata | Low | Low |
| `src/agents/utils.ts` | **Extend** `createBuiltinAgents()` to pass routing mode | Medium | **Medium** — agent creation orchestrator |
| `src/tools/delegate-task/executor.ts` | **Extend** `resolveCategoryExecution()` with dynamic routing | Medium | **Medium** — task delegation model resolution |
| `src/tools/delegate-task/categories.ts` | **Extend** `resolveCategoryConfig()` to consult model table | Low | Low |
| `src/features/builtin-commands/commands.ts` | **Add** modelconfig command | Low | Low — additive |
| `src/features/builtin-commands/types.ts` | **Add** `"modelconfig"` type | Low | Low |
| `src/plugin-handlers/config-handler.ts` | **Extend** to load model routing config | Low | Low |

### 9.2 New Files to Create

| File | Purpose | Size Est. |
|------|---------|-----------|
| `src/features/builtin-commands/templates/modelconfig.ts` | `/modelconfig` command template with state injection | ~300 lines |
| `src/features/model-config/reader.ts` | Read resolved model state (agents + categories + caches) | ~200 lines |
| `src/features/model-config/writer.ts` | Write model config changes to `kord-aios.jsonc` | ~150 lines |
| `src/shared/model-schema.ts` | Model Schema types + defaults + JSONC loader | ~250 lines |
| `src/shared/model-router.ts` | Dynamic routing engine (classifier + route decision) | ~300 lines |
| `src/shared/model-schema.test.ts` | Tests for schema loading + validation | ~200 lines |
| `src/shared/model-router.test.ts` | Tests for routing engine | ~400 lines |

### 9.3 Dependency Impact

```
model-schema.ts (NEW) — types, defaults, JSONC loader
  ↑ used by
model-router.ts (NEW) — classifier + route decision
  ↑ used by
model-resolution-pipeline.ts (MODIFIED) — adds dynamic routing step
  ↑ used by
├── agents/utils.ts (MODIFIED) — agent creation, reads routing_mode per agent
├── tools/delegate-task/executor.ts (MODIFIED) — task delegation model resolution
└── tools/delegate-task/categories.ts (MODIFIED) — category resolution

model-config/reader.ts (NEW) — reads resolved state for /modelconfig
  ↑ used by
model-config/writer.ts (NEW) — writes changes to kord-aios.jsonc
  ↑ used by
builtin-commands/templates/modelconfig.ts (NEW) — /modelconfig command
```

### 9.4 Test Impact

| Area | Existing Tests | Expected New Tests | Risk |
|------|---------------|-------------------|------|
| model-resolution-pipeline | 40+ in model-resolver.test.ts | +15 dynamic routing | **Medium** — must not break existing |
| model-requirements | Implicit via utils.test.ts | +10 runtime override | **Low** |
| agents/utils | 20+ in utils.test.ts | +5 routing mode | **Medium** |
| delegate-task | Via executor tests | +10 dynamic routing | **Medium** |
| model-classification | None | +20 new | **None** (new code) |
| model-router | None | +25 new | **None** (new code) |
| /modelconfig | None | +5 command registration | **None** (new code) |

**Total estimated new tests: ~90**

---

## 10. Migration Strategy

### 10.1 Backward Compatibility

| Scenario | Behavior |
|----------|----------|
| No `model_routing` config | All agents static, identical to today |
| No `routing_mode` on agent | Agent uses static mode (default) |
| `agents.X.routing_mode = "static"` | Explicit static, uses fallback_slots or AGENT_MODEL_REQUIREMENTS |
| `agents.X.routing_mode = "dynamic"` | Dynamic routing for this agent |
| `agents.X.model` override (legacy) | Always takes priority — bypasses both static slots and dynamic routing |
| `agents.X.fallback_slots` set | Custom 4-slot fallback, overrides AGENT_MODEL_REQUIREMENTS |
| UI model selection | Always takes priority over everything |
| No model-schema.jsonc | Uses embedded default schema |

### 10.2 Phased Rollout

| Phase | Content | Breaking Changes |
|-------|---------|-----------------|
| **Phase 1** | OpenCode `/models` study + `/modelconfig` command (TUI menu, static mode) | None |
| **Phase 2** | Model Schema (JSONC types, defaults, loader, validation) | None |
| **Phase 3** | Dynamic routing engine (heuristic classifier + router) | None |
| **Phase 4** | Pipeline integration (per-agent routing_mode) | None (opt-in per agent) |
| **Phase 5** | Prompt-based model override + LLM nano classifier option | None |
| **Phase 6** | Documentation update (README, CONTRIBUTING, AGENTS.md) | None |

---

## 11. Risk Assessment

### 11.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Dynamic routing picks wrong model | Medium | Medium | Fallback chain still works as safety net |
| Complexity classifier is inaccurate | Medium | Low | User can always override; conservative defaults |
| Model table gets out of date | High | Low | Embedded defaults updated with plugin versions |
| Performance overhead from routing | Low | Low | Classification is lightweight string analysis |
| Breaking existing model resolution | Low | **High** | Extensive test suite, opt-in only |
| Config migration issues | Low | Medium | New field, no migration needed |

### 11.2 UX Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Too many configuration options | Medium | Medium | Sensible defaults, `/modelconfig` guides users |
| Confusion between modes | Low | Medium | Clear documentation, `/modelconfig` shows active mode |
| Model schema editing is complex | Medium | Low | JSONC format with comments, `/modelconfig` shows current state |
| Per-agent mode adds cognitive load | Low | Low | Defaults to static; dynamic is opt-in per agent |

---

## 12. Implementation Roadmap

### Epic Structure

```
EPIC-14: Model Routing Evolution
├── Wave 1: Foundation + /modelconfig (Phase 1)
│   ├── S01: OpenCode /models study — understand provider/model detection pattern
│   ├── S02: Config schema extensions (routing_mode, fallback_slots, model_routing)
│   ├── S03: Model config reader (resolved state for all agents + categories)
│   ├── S04: /modelconfig command template + registration (static mode TUI)
│   └── S05: Model config writer (persist slot changes to kord-aios.jsonc)
│
├── Wave 2: Model Schema (Phase 2)
│   ├── S06: Model Schema types + Zod validation + default embedded schema
│   ├── S07: JSONC file loader (user + project level, merge, normalize)
│   └── S08: /modelconfig Model Schema view integration
│
├── Wave 3: Dynamic Routing Engine (Phase 3-4)
│   ├── S09: Heuristic complexity classifier
│   ├── S10: Route decision engine (filter by agent → select by complexity/domain)
│   ├── S11: Pipeline integration (per-agent routing_mode check)
│   └── S12: Delegation executor integration
│
├── Wave 4: Prompt Override + Polish (Phase 5)
│   ├── S13: Prompt-based model override parsing (explicit syntax)
│   └── S14: LLM nano classifier option (config-gated)
│
└── Wave 5: Documentation (Phase 6)
    └── S15: Update README, CONTRIBUTING, AGENTS.md (root + per-section)
```

### Effort Estimate

| Wave | Stories | Estimated Effort | Complexity |
|------|---------|-----------------|------------|
| Wave 1 | 5 | 3-4 days | Medium |
| Wave 2 | 3 | 2-3 days | Low-Medium |
| Wave 3 | 4 | 4-5 days | **High** |
| Wave 4 | 2 | 1-2 days | Medium |
| Wave 5 | 1 | 1 day | Low |
| **Total** | **15** | **11-15 days** | — |

---

## 13. Decision Matrix

### 13.1 Feature Comparison

| Aspect | Current (Hardcoded) | `/modelconfig` Static | Dynamic Routing |
|--------|-------------------|----------------------|----------------|
| Ease of use | ❌ Manual JSONC | ✅ TUI menu with 4 slots | ✅ Automatic per-task |
| Flexibility | ❌ Static | ✅ Per-agent editable | ✅ Task-aware |
| Complexity to implement | ✅ Done | ✅ Medium | ⚠️ High |
| Risk | ✅ Proven | ✅ Low | ⚠️ Medium |
| Backward compatible | ✅ N/A | ✅ Additive | ✅ Opt-in per agent |
| Cost optimization | ❌ None | ❌ None | ✅ Automatic |
| User control | ❌ All or nothing | ✅ Per-agent slots | ✅ Per-agent + per-task |
| Routing scope | N/A | Per-agent | Per-agent |

### 13.2 Recommendation

**Implement both features in waves, per-agent routing:**

1. **Wave 1 (`/modelconfig` + static)** — Immediate high value, low risk. Solves P2, P3, P7.
2. **Wave 2 (Model Schema)** — Foundation for dynamic routing. Solves P1, P6.
3. **Wave 3-4 (Dynamic Routing)** — Full solution. Solves P4, P5.
4. **Wave 5 (Docs)** — Ensure all documentation reflects the new system.

### 13.3 Decisions Taken

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | `/modelconfig` UI approach? | **Prompt-driven TUI** (agent presents menu, user selects) | Consistent with existing commands; agent handles state reading/writing |
| Q2 | Routing scope: per-agent or global? | **Per-agent** (`routing_mode: "static" \| "dynamic"`) | Maximum flexibility; user can mix modes across agents |
| Q3 | Model Schema format? | **JSONC** (`model-schema.jsonc`) | Consistent with `kord-aios.jsonc`; user-editable; supports comments |
| Q4 | Model Schema storage? | **Embedded default in TS** + user-editable JSONC override | Zero-config works; power users customize |
| Q5 | Classifier approach? | **Hybrid**: heuristic default + optional LLM nano via config | Best of both worlds; zero latency by default |
| Q6 | Prompt override syntax? | **Explicit only**: `use model X`, `@agent must use X` | No false positives; predictable behavior |
| Q7 | Terminology: thinking vs reasoning vs variant? | `reasoning` in schema (capability tier), `variant` at runtime (API param) | Two distinct concepts; never confused |
| Q8 | Slot count per agent? | **4 slots** | Covers 95% of current chains; simple UX |
| Q9 | How does router reduce decision matrix? | **Filter by `enabled_agents`** — only load models enabled for the target agent | Dramatically reduces matrix (3-6 models vs 15+) |

---

## Appendix A: File Map (Current + Proposed)

```
src/shared/
├── model-requirements.ts          # AGENT_MODEL_REQUIREMENTS + CATEGORY_MODEL_REQUIREMENTS (hardcoded)
├── model-resolution-pipeline.ts   # resolveModelPipeline() — 4-step resolution (MODIFIED: adds dynamic routing step)
├── model-resolver.ts              # resolveModel() + resolveModelWithFallback() wrappers
├── model-availability.ts          # fuzzyMatchModel(), fetchAvailableModels(), isModelAvailable()
├── model-schema.ts                # NEW — Model Schema types, defaults, JSONC loader
├── model-router.ts                # NEW — Dynamic routing engine (classifier + route decision)
├── agent-variant.ts               # resolveAgentVariant(), resolveVariantForModel() — existing variant abstraction
├── connected-providers-cache.ts   # readConnectedProvidersCache(), updateConnectedProvidersCache()
└── index.ts                       # Barrel exports

src/agents/
├── utils.ts                       # createBuiltinAgents() (MODIFIED: reads routing_mode per agent)
├── types.ts                       # AgentMode, AgentFactory, AgentPromptMetadata
└── [agent].ts                     # Individual agent factories

src/tools/delegate-task/
├── executor.ts                    # resolveCategoryExecution() (MODIFIED: dynamic routing for categories)
├── categories.ts                  # resolveCategoryConfig() (MODIFIED: consults model schema)
└── constants.ts                   # DEFAULT_CATEGORIES, CATEGORY_PROMPT_APPENDS

src/config/
└── schema.ts                      # Zod schemas (MODIFIED: routing_mode, fallback_slots, ModelRoutingConfig)

src/features/
├── builtin-commands/
│   ├── commands.ts                # loadBuiltinCommands() (MODIFIED: register /modelconfig)
│   ├── types.ts                   # BuiltinCommandName union (MODIFIED: add "modelconfig")
│   └── templates/
│       └── modelconfig.ts         # NEW — /modelconfig command template
└── model-config/                  # NEW — module
    ├── reader.ts                  # Read resolved model state (agents + categories + caches)
    └── writer.ts                  # Write model config changes to kord-aios.jsonc

src/hooks/
├── think-mode/switcher.ts         # THINKING_CONFIGS — existing provider-specific param mapping
└── anthropic-effort/              # Existing effort injection for Anthropic
```

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Fallback Chain** | Ordered list of model+provider pairs tried until one is available |
| **Fallback Slots** | 4 user-editable positions in the `/modelconfig` TUI, replacing hardcoded chains |
| **Provider** | API service (anthropic, openai, google, github-copilot, opencode) |
| **Variant** | Runtime reasoning effort string sent to provider API (`"low"`, `"medium"`, `"high"`, `"xhigh"`, `"max"`) |
| **Reasoning** | Model capability tier in the Model Schema (`"none"` / `"low"` / `"medium"` / `"high"` / `"ultra"`) — classification only |
| **Model Schema** | JSONC file classifying models by reasoning tier, domains, enabled agents, and cost |
| **Routing Mode** | Per-agent setting: `"static"` (fallback chain) or `"dynamic"` (auto-routed) |
| **Category** | Task type classification for delegation (visual-engineering, ultrabrain, etc.) |
| **Provenance** | How a model was resolved (override, category-default, provider-fallback, dynamic-route, system-default) |
| **Gating** | Conditions that must be met for an agent to be created (requiresModel, requiresProvider) |
| **Fuzzy Match** | Case-insensitive substring matching for model name resolution |
| **Classifier** | Component that determines task complexity/domain — heuristic (default) or LLM nano (optional) |
