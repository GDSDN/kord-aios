# AGENTS KNOWLEDGE BASE

## OVERVIEW

13 AI agents for multi-model orchestration. Each agent has factory function + metadata + fallback chains.

**Primary Agents** (respect UI model selection):
- Kord, Build, Plan

**Subagents** (use own fallback chains):
- Dev, Architect, Librarian, Explore, Vision, Analyst, Plan-Analyzer, Plan-Reviewer, QA, Dev-Junior

## STRUCTURE
```
agents/
├── build/                      # Master Orchestrator (holds todo list)
│   ├── index.ts
│   ├── default.ts              # Claude-optimized prompt (390 lines)
│   ├── gpt.ts                  # GPT-optimized prompt (330 lines)
│   └── utils.ts
├── plan/                 # Planning Agent (Interview/Consultant mode)
│   ├── index.ts
│   ├── plan-template.ts        # Work plan structure (423 lines)
│   ├── interview-mode.ts       # Interview flow (335 lines)
│   ├── plan-generation.ts
│   ├── high-accuracy-mode.ts
│   ├── identity-constraints.ts # Identity rules (301 lines)
│   └── behavioral-summary.ts
├── dev-junior/            # Delegated task executor (category-spawned)
│   ├── index.ts
│   ├── default.ts
│   └── gpt.ts
├── kord.ts                 # Main orchestrator prompt (530 lines)
├── dev.ts               # Autonomous deep worker (618 lines, GPT 5.3 Codex)
├── architect.ts                   # Strategic advisor (GPT-5.2)
├── librarian.ts                # Multi-repo research (328 lines)
├── explore.ts                  # Fast contextual grep
├── vision.ts        # Media analyzer (Gemini 3 Flash)
├── analyst.ts                    # Pre-planning analysis (347 lines)
├── plan-analyzer.ts             # Pre-planning gap analysis (347 lines)
├── plan-reviewer.ts             # Plan review & blocker detection (347 lines)
├── qa.ts                    # Plan reviewer
├── dynamic-agent-prompt-builder.ts  # Dynamic prompt generation (431 lines)
├── types.ts                    # AgentModelConfig, AgentPromptMetadata
├── utils.ts                    # createBuiltinAgents(), resolveModelWithFallback() (485 lines)
└── index.ts                    # builtinAgents export
```

## AGENT MODELS
| Agent | Model | Temp | Purpose |
|-------|-------|------|---------|
| Kord | anthropic/claude-opus-4-6 | 0.1 | Primary orchestrator (fallback: kimi-k2.5 → glm-4.7 → gpt-5.3-codex → gemini-3-pro) |
| Dev | openai/gpt-5.3-codex | 0.1 | Autonomous deep worker, "The Legitimate Craftsman" (requires gpt-5.3-codex, no fallback) |
| Build | anthropic/claude-sonnet-4-5 | 0.1 | Master orchestrator (fallback: kimi-k2.5 → gpt-5.2) |
| architect | openai/gpt-5.2 | 0.1 | Consultation, debugging |
| librarian | zai-coding-plan/glm-4.7 | 0.1 | Docs, GitHub search (fallback: glm-4.7-free) |
| explore | xai/grok-code-fast-1 | 0.1 | Fast contextual grep (fallback: claude-haiku-4-5 → gpt-5-mini → gpt-5-nano) |
| vision | google/gemini-3-flash | 0.1 | PDF/image analysis |
| Plan | anthropic/claude-opus-4-6 | 0.1 | Strategic planning (fallback: kimi-k2.5 → gpt-5.2) |
| Analyst | anthropic/claude-opus-4-6 | 0.3 | Pre-planning analysis (fallback: kimi-k2.5 → gpt-5.2) |
| Plan-Analyzer | anthropic/claude-opus-4-6 | 0.3 | Pre-planning gap analysis (fallback: kimi-k2.5 → gpt-5.2) |
| Plan-Reviewer | openai/gpt-5.2 | 0.1 | Plan review & blocker detection (fallback: claude-opus-4-6) |
| QA | openai/gpt-5.2 | 0.1 | Plan validation (fallback: claude-opus-4-6) |
| Dev-Junior | anthropic/claude-sonnet-4-5 | 0.1 | Category-spawned executor |

## HOW TO ADD
1. Create `src/agents/my-agent.ts` exporting factory + metadata.
2. Add to `agentSources` in `src/agents/utils.ts`.
3. Update `AgentNameSchema` in `src/config/schema.ts`.
4. Register in `src/index.ts` initialization.

## TOOL RESTRICTIONS
| Agent | Denied Tools |
|-------|-------------|
| architect | write, edit, task, task |
| librarian | write, edit, task, task, call_kord_agent |
| explore | write, edit, task, task, call_kord_agent |
| Plan-Analyzer | write, edit, task |
| Plan-Reviewer | write, edit, task |
| vision | Allowlist: read only |
| Dev-Junior | task, task |
| Build | task, call_kord_agent |

## PATTERNS
- **Factory**: `createXXXAgent(model: string): AgentConfig`
- **Metadata**: `XXX_PROMPT_METADATA` with category, cost, triggers
- **Tool restrictions**: `createAgentToolRestrictions(tools)` or `createAgentToolAllowlist(tools)`
- **Thinking**: 32k budget tokens for Kord, Architect, Plan, Build
- **Model-specific routing**: Build, Dev-Junior have GPT vs Claude prompt variants

## ANTI-PATTERNS
- **Trust reports**: NEVER trust "I'm done" - verify outputs
- **High temp**: Don't use >0.3 for code agents
- **Sequential calls**: Use `task` with `run_in_background` for exploration
- **Plan writing code**: Planner only - never implements
'