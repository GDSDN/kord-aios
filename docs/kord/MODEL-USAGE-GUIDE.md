# Kord AIOS - Model Configuration Guide

> **Objective**: Define which model to use for each agent/task, considering quality vs cost.

## Configuration Paths

### Where Provider Models Live

Kord AIOS uses two configuration files:

| File | Location | Purpose |
|------|----------|---------|
| `.opencode/kord-aios.json` | Project | Project-specific overrides |
| `~/.config/opencode/kord-aios.json` | User | User-global defaults |

### Provider Configuration

Provider models (Google, OpenAI, Anthropic, etc.) are configured in the `provider` key:

```json
{
  "provider": {
    "google": {
      "name": "Google",
      "models": {
        "antigravity-gemini-3.1-pro": { ... }
      }
    }
  }
}
```

### Agent Fallback Configuration

Agent fallback chains are configured in the `agents` key:

```json
{
  "agents": {
    "kord": {
      "model": "anthropic/claude-opus-4-6",
      "fallback": [
        { "model": "kimi-for-coding/k2p5" },
        { "model": "openai/gpt-5.2" }
      ]
    }
  }
}
```

---

## Init Modes: Greenfield vs Brownfield

When running `bunx kord-aios init`, Kord detects your project maturity:

### Greenfield (New Project)
- No existing `.opencode/` directory
- Creates full scaffolding:
  - `.kord/templates/` - Story, ADR, PRD, Epic, Task templates
  - `.kord/rules/` - Project rules
  - `docs/kord/plans/` - Work plan directory
  - `docs/kord/stories/` - User story delivery directory
  - `docs/kord/epics/` - Epic delivery directory
  - `docs/kord/prds/` - Product requirements directory
  - `docs/kord/drafts/` - Draft documents
  - `docs/kord/notepads/` - Agent working memory
- Generates default `kord-aios.json` with all providers and fallback chains

### Brownfield (Existing Project)
- Has existing `.opencode/` directory
- Performs add-only merge: existing values are preserved
- Does NOT overwrite custom agent configurations
- Only adds missing provider models and fallback entries

---

## Manual Fallback Override

### Priority Order

The fallback resolution follows this priority:

```
1. User config (agents.<name>.fallback)     ← Highest priority
2. Squad manifest (for squad-* agents)
3. Hardcoded AGENT_MODEL_REQUIREMENTS       ← Lowest priority
```

### How to Override

**Option 1: Project-level override**

Create/edit `.opencode/kord-aios.json`:

```json
{
  "agents": {
    "explore": {
      "fallback": [
        { "model": "google/gemini-3-flash" },
        { "model": "anthropic/claude-haiku-4-5" }
      ]
    }
  }
}
```

**Option 2: User-global override**

Edit `~/.config/opencode/kord-aios.json`:

```json
{
  "agents": {
    "kord": {
      "fallback": [
        { "model": "anthropic/claude-opus-4-6" }
      ]
    }
  }
}
```

**Option 3: Squad manifest override**

Define fallback in `.opencode/squads/my-squad/SQUAD.yaml`:

```yaml
agents:
  chief:
    fallback:
      - model: anthropic/claude-opus-4-6
      - model: openai/gpt-5.2
```

### Verifying Override Works

Run the test to confirm user config overrides hardcoded chains:

```bash
bun test src/shared/agent-fallback.test.ts
```

The test `uses user-configured fallback chain when provided` verifies this behavior.

---

## Antigravity Provider Updates

### Latest Model Bumps (vCurrent)

| Previous Model | New Model | Notes |
|---------------|-----------|-------|
| `antigravity-claude-sonnet-4-5` | `antigravity-claude-sonnet-4-6` | Claude 4.6 |
| `antigravity-claude-opus-4-5-thinking` | `antigravity-claude-opus-4-6-thinking` | Opus 4.6 with thinking |
| `antigravity-claude-sonnet-4-5-thinking` | `antigravity-claude-sonnet-4-6-thinking` | Sonnet 4.6 with thinking |
| `antigravity-gemini-3-pro` | `antigravity-gemini-3.1-pro` | Gemini 3.1 Pro |

### Variant System

Since opencode-antigravity-auth v1.3.0, models support variants:

```json
{
  "antigravity-gemini-3.1-pro": {
    "variants": {
      "low": { "thinkingLevel": "low" },
      "high": { "thinkingLevel": "high" }
    }
  }
}
```

---

## Benchmark: Free Models (Kilo Gateway)

| Model | Provider ID | SWE-Bench | Reasoning | Tool Calling | Primary Focus |
|-------|-------------|-----------|-----------|--------------|----------------|
| **GLM-5 Free** | `kilo/z-ai/glm-5:free` | 77.8% | **92.7%** (AIME) | — | Reasoning, Agentic, Long-context |
| **MiniMax M2.5 Free** | `kilo/minimax/minimax-m2.5:free` | **80.2%** | — | **76.8%** (BFCL) | Coding, Tool Calling |

### Model Characteristics

**GLM-5 Free** (744B params, 40B active):
- "Agentic engineering" - optimized for long-horizon tasks
- 200K context window
- Excellent for architectural decisions, validation, orchestration
- Best general reasoning (AIME 92.7%)

**MiniMax M2.5 Free** (230B params, 10B active):
- SOTA in coding open-source (80.2% SWE-Bench)
- "Spec-writing tendency" - plans like an architect before coding
- Best tool calling (BFCL 76.8%)
- ~2.7x cheaper than GLM-5

---

## Stacks by Priority

### Maximum Stack (Quality) - When cost is not a concern

| Agent | Model | Provider ID | Why |
|-------|-------|-------------|-----|
| **Kord** | Claude Opus 4.6 | `anthropic/claude-opus-4-6` | Main orchestration, max reasoning |
| **Builder** | Kimi K2.5 | `kimi-for-coding/k2p5` | Excellent tool calling, coordination |
| **Dev** | GPT-5.3 Codex | `openai/gpt-5.3-codex` | Best coding available |
| **Dev-Junior** | Claude Sonnet 4.6 | `anthropic/claude-sonnet-4-6` | Solid, fast coding |
| **Architect** | GPT-5.2 | `openai/gpt-5.2` | Architectural consulting, high reasoning |
| **Analyst** | Claude Opus 4.6 | `anthropic/claude-opus-4-6` | Pre-planning analysis |
| **Librarian** | GLM-4.7 | `zai-coding-plan/glm-4.7` | Doc research, cheap |
| **Explore** | Claude Haiku 4.5 | `anthropic/claude-haiku-4-5` | Fast grep, cheap |
| **Vision** | Gemini 3 Flash | `google/gemini-3-flash` | Media analysis |

### Economic Stack (Free Tier) - Maximum cost-effectiveness

| Agent | Model | Provider ID | Why |
|-------|-------|-------------|-----|
| **Kord** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Best reasoning free, agentic engineering |
| **Builder** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Precise reasoning coordination, not coding |
| **Dev** | MiniMax M2.5 Free | `kilo/minimax/minimax-m2.5:free` | Best coding free (80.2% SWE-Bench) |
| **Dev-Junior** | MiniMax M2.5 Free | `kilo/minimax/minimax-m2.5:free` | Code executor, best coding |
| **Architect** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Consulting = reasoning > coding |
| **Analyst** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Analysis = reasoning |
| **Librarian** | GLM-4.7 Free | `kilo/z-ai/glm-4.7:free` | Simple research, cheapest |
| **Explore** | GPT-5 Nano | `opencode/gpt-5-nano` | Fast grep, cheapest |
| **Vision** | Gemini 3 Flash | `kilo/google/gemini-3-flash` | Free media analysis |

---

## Assignment Logic: Reasoning vs Coding

### Fundamental Principle

```
+-----------------------------------------------------------------+
|  Role           |  What it does                |  Needs         |
+-----------------------------------------------------------------+
|  KORD           |  Decide, orchestrate, validate|  Reasoning   |
|  BUILDER        |  Delegate, verify, coordinate |  Reasoning   |
|  DEV            |  Analyze, architect, plan    |  Reasoning   |
|  ARCHITECT      |  Consult, debug, advise       |  Reasoning   |
|  ANALYST        |  Analyze requirements, research| Reasoning   |
|  DEV-JUNIOR     |  IMPLEMENT code               |  Coding OK   |
+-----------------------------------------------------------------+
```

### Practical Rule

| Agent | Maximum Stack | Economic Stack | Criterion |
|-------|--------------|-----------------|----------|
| **Orchestrators** (Kord, Builder) | Opus/Kimi | **GLM-5 Free** | Reasoning for decisions |
| **Architects** (Dev, Architect, Analyst) | Opus/GPT-5.2 | **GLM-5 Free** | Reasoning for analysis |
| **Executors** (Dev-Junior) | Sonnet/GPT-5.3 | **MiniMax M2.5 Free** | Coding to implement |

---

## Fallback Chains by Agent

### Kord (Main Orchestrator)

**Maximum Stack:**
```
1. anthropic/claude-opus-4-6 (variant: max)
2. kimi-for-coding/k2p5
3. opencode/kimi-k2.5-free
4. zai-coding-plan/glm-4.7
5. opencode/glm-4.7-free
```

**Economic Stack:**
```
1. kilo/z-ai/glm-5:free
2. kilo/minimax/minimax-m2.5:free
3. opencode/glm-4.7-free
```

### Builder (Implementation Coordinator)

**Maximum Stack:**
```
1. kimi-for-coding/k2p5
2. opencode/kimi-k2.5-free
3. anthropic/claude-sonnet-4-6
4. openai/gpt-5.2
```

**Economic Stack:**
```
1. kilo/z-ai/glm-5:free
2. kilo/minimax/minimax-m2.5:free
3. opencode/glm-4.7-free
```

### Dev (Solution Architect)

**Maximum Stack:** (requires GPT-5.3 Codex)
```
1. openai/gpt-5.3-codex (variant: medium)
```

**Economic Stack:**
```
1. kilo/minimax/minimax-m2.5:free  # Best coding free
2. kilo/z-ai/glm-5:free            # Fallback reasoning
```

### Dev-Junior (Code Executor)

**Maximum Stack:**
```
1. anthropic/claude-sonnet-4-6
2. openai/gpt-5.2
3. opencode/gpt-5-nano
```

**Economic Stack:**
```
1. kilo/minimax/minimax-m2.5:free  # Best coding free
2. kilo/z-ai/glm-5:free            # Fallback
```

### Architect (Consultant)

**Maximum Stack:**
```
1. openai/gpt-5.2 (variant: high)
2. google/gemini-3.1-pro (variant: high)
3. anthropic/claude-opus-4-6 (variant: max)
```

**Economic Stack:**
```
1. kilo/z-ai/glm-5:free            # Reasoning for consulting
2. kilo/minimax/minimax-m2.5:free
```

### Analyst (Pre-Planning)

**Maximum Stack:**
```
1. anthropic/claude-opus-4-6 (variant: max)
2. kimi-for-coding/k2p5
3. opencode/kimi-k2.5-free
4. openai/gpt-5.2 (variant: high)
```

**Economic Stack:**
```
1. kilo/z-ai/glm-5:free            # Reasoning for analysis
2. kilo/minimax/minimax-m2.5:free
```

### Librarian (Research)

**Maximum Stack:**
```
1. zai-coding-plan/glm-4.7
2. opencode/glm-4.7-free
3. anthropic/claude-sonnet-4-6
```

**Economic Stack:**
```
1. kilo/z-ai/glm-4.7:free          # Cheapest
2. opencode/gpt-5-nano
```

### Explore (Contextual Grep)

**Maximum Stack:**
```
1. anthropic/claude-haiku-4-5
2. opencode/gpt-5-nano
```

**Economic Stack:**
```
1. opencode/gpt-5-nano             # Cheapest
2. kilo/z-ai/glm-4.7:free
```

---

## Usage by Task Type

### Tasks Needing Reasoning (GLM-5 Free)

| Task | Agent | Why |
|------|-------|-----|
| Architecture decisions | Architect, Kord | Trade-offs, analysis |
| Requirements analysis | Analyst | Identify ambiguities |
| Implementation validation | Builder, Kord | Verify correctness |
| Planning | PM, SM, PO | Thought structuring |
| Complex debugging | Architect | Root cause analysis |
| Code review | QA, Plan-Reviewer | Identify issues |

### Tasks Needing Coding (MiniMax M2.5 Free)

| Task | Agent | Why |
|------|-------|-----|
| Feature implementation | Dev-Junior, Dev | Write code |
| Bug fixes | Dev-Junior | Fix code |
| Refactoring | Dev, Dev-Junior | Restructure code |
| UI/UX implementation | Dev-Junior (visual-engineering) | Frontend code |
| Test writing | Dev-Junior | Test code |
| Script creation | Dev-Junior (quick) | Simple scripts |

### Mixed Tasks (Depends on context)

| Task | Recommendation |
|------|----------------|
| **Complex refactoring** | GLM-5 for analysis -> MiniMax for implementation |
| **Large new feature** | GLM-5 (Analyst) -> GLM-5 (Plan) -> MiniMax (Dev-Junior) |
| **Simple bug fix** | MiniMax direct (quick category) |
| **Documentation** | GLM-5 (reasoning) or writing category |
| **UI/UX design** | MiniMax + skill frontend-ui-ux |

---

## Categories and Recommended Models

| Category | Maximum Stack | Economic Stack | Usage |
|----------|--------------|-----------------|-------|
| **visual-engineering** | `gemini-3.1-pro` | `kilo/google/gemini-3-flash` | Frontend, UI/UX |
| **ultrabrain** | `gpt-5.3-codex` | — | Deep logic, complex algorithms |
| **deep** | `gpt-5.3-codex` | — | Requires Codex |
| **artistry** | `gemini-3.1-pro` | — | Creative tasks |
| **quick** | `claude-haiku-4-5` | `opencode/gpt-5-nano` | Fast, simple tasks |
| **unspecified-low** | `claude-sonnet-4-6` | `gpt-5.3-codex` | Default low priority |
| **unspecified-high** | `claude-opus-4-6` | `gpt-5.2` | Default high priority |
| **writing** | `gemini-3-flash` | — | Documentation, content |
