# Kord AIOS - Guia de Uso de Modelos

> **Objetivo**: Definir qual modelo usar para cada agente/tarefa, considerando qualidade vs custo.

## Benchmark dos Modelos Free (Kilo Gateway)

| Modelo | Provider ID | SWE-Bench | Reasoning | Tool Calling | Foco Principal |
|--------|-------------|-----------|-----------|--------------|----------------|
| **GLM-5 Free** | `kilo/z-ai/glm-5:free` | 77.8% | **92.7%** (AIME) | — | Reasoning, Agentic, Long-context |
| **MiniMax M2.5 Free** | `kilo/minimax/minimax-m2.5:free` | **80.2%** | — | **76.8%** (BFCL) | Coding, Tool Calling |

### Características por Modelo

**GLM-5 Free** (744B params, 40B active):
- "Agentic engineering" - otimizado para tarefas de longo horizonte
- 200K context window
- Excelente para decisões arquiteturais, validação, orquestração
- Melhor reasoning geral (AIME 92.7%)

**MiniMax M2.5 Free** (230B params, 10B active):
- SOTA em coding open-source (80.2% SWE-Bench)
- "Spec-writing tendency" - planeja como arquiteto antes de codar
- Melhor tool calling (BFCL 76.8%)
- ~2.7x mais barato que GLM-5

---

## Stacks por Prioridade

### Stack Máxima (Qualidade) - Quando custo não é problema

| Agente | Modelo | Provider ID | Por quê |
|--------|--------|-------------|---------|
| **Kord** | Claude Opus 4.6 | `anthropic/claude-opus-4-6` | Orquestração principal, máximo reasoning |
| **Builder** | Kimi K2.5 | `kimi-for-coding/k2p5` | Tool calling excelente, coordenação |
| **Dev** | GPT-5.3 Codex | `openai/gpt-5.3-codex` | Melhor coding disponível |
| **Dev-Junior** | Claude Sonnet 4.5 | `anthropic/claude-sonnet-4-5` | Coding sólido, rápido |
| **Architect** | GPT-5.2 | `openai/gpt-5.2` | Consultoria arquitetural, alto reasoning |
| **Analyst** | Claude Opus 4.6 | `anthropic/claude-opus-4-6` | Análise pré-planejamento |
| **Librarian** | GLM-4.7 | `zai-coding-plan/glm-4.7` | Pesquisa de docs, barato |
| **Explore** | Claude Haiku 4.5 | `anthropic/claude-haiku-4-5` | Grep rápido, barato |
| **Vision** | Gemini 3 Flash | `google/gemini-3-flash` | Análise de mídia |

### Stack Econômica (Free Tier) - Máximo custo-benefício

| Agente | Modelo | Provider ID | Por quê |
|--------|--------|-------------|---------|
| **Kord** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Melhor reasoning free, agentic engineering |
| **Builder** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Coordenação precisa de reasoning, não coding |
| **Dev** | MiniMax M2.5 Free | `kilo/minimax/minimax-m2.5:free` | Melhor coding free (80.2% SWE-Bench) |
| **Dev-Junior** | MiniMax M2.5 Free | `kilo/minimax/minimax-m2.5:free` | Executor de código, melhor coding |
| **Architect** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Consultoria = reasoning > coding |
| **Analyst** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Análise = reasoning |
| **Librarian** | MiniMax M2.5 Free | `kilo/minimax/minimax-m2.5:free` | 100 TPS, tool calling paralelo, background |
| **Explore** | MiniMax M2.5 Free | `kilo/minimax/minimax-m2.5:free` | 100 TPS, tool calling paralelo, background |
| **Vision** | Gemini 3 Flash | `kilo/google/gemini-3-flash` | Análise de mídia free |

---

## Lógica de Atribuição: Reasoning vs Coding

### Princípio Fundamental

```
┌─────────────────────────────────────────────────────────────────┐
│  Papel           │  O que faz                    │  Precisa de  │
├─────────────────────────────────────────────────────────────────┤
│  KORD            │  Decide, orquestra, valida    │  Reasoning   │
│  BUILDER         │  Delega, verifica, coordena   │  Reasoning   │
│  DEV             │  Analisa, arquiteta, planeja  │  Reasoning   │
│  ARCHITECT       │  Consulta, debugga, aconselha │  Reasoning   │
│  ANALYST         │  Analisa requisitos, pesquisa │  Reasoning   │
│  DEV-JUNIOR      │  IMPLEMENTA código            │  Coding ✓    │
└─────────────────────────────────────────────────────────────────┘
```

### Regra Prática

| Agente | Stack Máxima | Stack Econômica | Critério |
|--------|--------------|-----------------|----------|
| **Orquestradores** (Kord, Builder) | Opus/Kimi | **GLM-5 Free** | Reasoning para decisões |
| **Arquitetos** (Dev, Architect, Analyst) | Opus/GPT-5.2 | **GLM-5 Free** | Reasoning para análise |
| **Executores** (Dev-Junior) | Sonnet/GPT-5.3 | **MiniMax M2.5 Free** | Coding para implementar |

---

## Fallback Chains por Agente

### Kord (Orquestrador Principal)

**Stack Máxima:**
```
1. anthropic/claude-opus-4-6 (variant: max)
2. kimi-for-coding/k2p5
3. opencode/kimi-k2.5-free
4. zai-coding-plan/glm-4.7
5. opencode/glm-4.7-free
```

**Stack Econômica:**
```
1. kilo/z-ai/glm-5:free
2. kilo/minimax/minimax-m2.5:free
3. opencode/glm-4.7-free
```

### Builder (Coordenador de Implementação)

**Stack Máxima:**
```
1. kimi-for-coding/k2p5
2. opencode/kimi-k2.5-free
3. anthropic/claude-sonnet-4-5
4. openai/gpt-5.2
```

**Stack Econômica:**
```
1. kilo/z-ai/glm-5:free
2. kilo/minimax/minimax-m2.5:free
3. opencode/glm-4.7-free
```

### Dev (Arquiteto de Soluções)

**Stack Máxima:** (requer GPT-5.3 Codex)
```
1. openai/gpt-5.3-codex (variant: medium)
```

**Stack Econômica:**
```
1. kilo/minimax/minimax-m2.5:free  # Melhor coding free
2. kilo/z-ai/glm-5:free            # Fallback reasoning
```

### Dev-Junior (Executor de Código)

**Stack Máxima:**
```
1. anthropic/claude-sonnet-4-5
2. openai/gpt-5.2
3. opencode/gpt-5-nano
```

**Stack Econômica:**
```
1. kilo/minimax/minimax-m2.5:free  # Melhor coding free
2. kilo/z-ai/glm-5:free            # Fallback
```

### Architect (Consultor)

**Stack Máxima:**
```
1. openai/gpt-5.2 (variant: high)
2. google/gemini-3-pro (variant: high)
3. anthropic/claude-opus-4-6 (variant: max)
```

**Stack Econômica:**
```
1. kilo/z-ai/glm-5:free            # Reasoning para consultoria
2. kilo/minimax/minimax-m2.5:free
```

### Analyst (Pré-planejamento)

**Stack Máxima:**
```
1. anthropic/claude-opus-4-6 (variant: max)
2. kimi-for-coding/k2p5
3. opencode/kimi-k2.5-free
4. openai/gpt-5.2 (variant: high)
```

**Stack Econômica:**
```
1. kilo/z-ai/glm-5:free            # Reasoning para análise
2. kilo/minimax/minimax-m2.5:free
```

### Librarian (Pesquisa)

**Stack Máxima:**
```
1. zai-coding-plan/glm-4.7
2. opencode/glm-4.7-free
3. anthropic/claude-sonnet-4-5
```

**Stack Econômica:**
```
1. kilo/minimax/minimax-m2.5:free  # Mais rapido (100 TPS)
2. opencode/gpt-5-nano
```

### Explore (Grep Contextual)

**Stack Máxima:**
```
1. anthropic/claude-haiku-4-5
2. opencode/gpt-5-nano
```

**Stack Econômica:**
```
1. kilo/minimax/minimax-m2.5:free  # Mais rapido (100 TPS)
2. kilo/z-ai/glm-4.7:free
```

---

## Uso por Tipo de Tarefa

### Tarefas que Precisam de Reasoning (GLM-5 Free)

| Tarefa | Agente | Por quê |
|--------|--------|---------|
| Decisões de arquitetura | Architect, Kord | Trade-offs, análise |
| Análise de requisitos | Analyst | Identificar ambiguidades |
| Validação de implementação | Builder, Kord | Verificar se está correto |
| Planejamento | PM, SM, PO | Estruturação de pensamento |
| Debugging complexo | Architect | Root cause analysis |
| Code review | QA, Plan-Reviewer | Identificar problemas |

### Tarefas que Precisam de Coding (MiniMax M2.5 Free)

| Tarefa | Agente | Por quê |
|--------|--------|---------|
| Implementação de features | Dev-Junior, Dev | Escrever código |
| Bug fixes | Dev-Junior | Corrigir código |
| Refactoring | Dev, Dev-Junior | Reestruturar código |
| UI/UX implementation | Dev-Junior (visual-engineering) | Frontend code |
| Test writing | Dev-Junior | Código de testes |
| Script creation | Dev-Junior (quick) | Scripts simples |

### Tarefas Mistas (Depende do contexto)

| Tarefa | Recomendação |
|--------|--------------|
| **Refactoring complexo** | GLM-5 para análise → MiniMax para implementação |
| **Nova feature grande** | GLM-5 (Analyst) → GLM-5 (Plan) → MiniMax (Dev-Junior) |
| **Bug fix simples** | MiniMax direto (quick category) |
| **Documentação** | GLM-5 (reasoning) ou writing category |
| **UI/UX design** | MiniMax + skill frontend-ui-ux |

---

## Categorias e Modelos Recomendados

| Categoria | Stack Máxima | Stack Econômica | Uso |
|-----------|--------------|-----------------|-----|
| **visual-engineering** | `gemini-3-pro` | `kilo/google/gemini-3-flash` | UI/UX, frontend |
| **ultrabrain** | `gpt-5.3-codex` (xhigh) | `kilo/z-ai/glm-5:free` | Problemas difíceis |
| **deep** | `gpt-5.3-codex` (medium) | `kilo/minimax/minimax-m2.5:free` | Pesquisa profunda |
| **artistry** | `gemini-3-pro` (high) | `kilo/z-ai/glm-5:free` | Criatividade |
| **quick** | `claude-haiku-4-5` | `opencode/gpt-5-nano` | Tarefas simples |
| **writing** | `gemini-3-flash` | `kilo/z-ai/glm-4.7:free` | Documentação |

---

## IDs dos Modelos Free (Kilo Gateway)

### Coding (MiniMax)
```
kilo/minimax/minimax-m2.5:free     # Melhor coding free
```

### Reasoning (GLM)
```
kilo/z-ai/glm-5:free               # Melhor reasoning free
kilo/z-ai/glm-4.7:free             # Mais barato, bom para tarefas simples
kilo/z-ai/glm-4.5-air:free         # Mais barato ainda
```

### Vision
```
kilo/google/gemini-3-flash         # Análise de imagens/PDFs
```

### Outros Free
```
kilo/meta-llama/llama-3.3-70b-instruct:free
kilo/qwen/qwen3-coder:free
kilo/qwen/qwen3-4b:free
```

---

## Configuração Recomendada (kord-aios.json)

### Stack Econômica (Free Tier)

```json
{
  "agents": {
    "kord": {
      "model": "kilo/z-ai/glm-5:free"
    },
    "builder": {
      "model": "kilo/z-ai/glm-5:free"
    },
    "dev": {
      "model": "kilo/minimax/minimax-m2.5:free"
    },
    "dev-junior": {
      "model": "kilo/minimax/minimax-m2.5:free"
    },
    "architect": {
      "model": "kilo/z-ai/glm-5:free"
    },
    "analyst": {
      "model": "kilo/z-ai/glm-5:free"
    },
    "librarian": {
      "model": "kilo/minimax/minimax-m2.5:free"
    },
    "explore": {
      "model": "kilo/minimax/minimax-m2.5:free"
    }
  }
}
```

---

## Resumo da Lógica

```
+-----------------------------------------------------------------------------+
|  AGENTES DE REASONING -> GLM-5 FREE                                         |
|  (Kord, Builder, Architect, Analyst, PM, SM, PO)                            |
|  Por que: 92.7% AIME, "agentic engineering", 200K context                   |
+-----------------------------------------------------------------------------+
|  AGENTES DE TOOL-CALLING -> MINIMAX M2.5 FREE                               |
|  (Dev, Dev-Junior, Librarian, Explore)                                      |
|  Por que: 100 TPS, BFCL 76.8%, 20% fewer rounds, SWE-Bench 80.2%            |
+-----------------------------------------------------------------------------+
```

---

## Notas Importantes

1. **Dev e especial**: Na stack maxima, Dev requer GPT-5.3 Codex (requer provider openai/github-copilot conectado). Na economica, usa MiniMax M2.5 Free.

2. **Builder vs Dev-Junior**: Builder orquestra (reasoning), Dev-Junior implementa (coding). **Nao inverta.**

3. **Categories herdam modelos**: Se nao especificar modelo para um agente, ele usa o modelo da categoria (visual-engineering -> gemini-3-pro).

4. **Free tier limits**: Modelos free podem ter rate limits. Considere alternar entre GLM e MiniMax se atingir limite.

5. **GLM-5 e melhor para portugues**: Se suas tasks sao em portugues, GLM-5 tem melhor compreensao de contexto BR.
