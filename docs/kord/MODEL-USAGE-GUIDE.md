# Kord AIOS - Guia de Uso de Modelos

> **Objetivo**: Definir qual modelo usar para cada agente/tarefa, considerando qualidade vs custo.

## Benchmark dos Modelos Free (Kilo Gateway)

| Modelo | Provider ID | SWE-Bench | Reasoning | Tool Calling | Foco Principal |
|--------|-------------|-----------|-----------|--------------|----------------|
| **GLM-5 Free** | `kilo/z-ai/glm-5:free` | 77.8% | **92.7%** (AIME) | — | Reasoning, Agentic, Long-context |
| **MiniMax M2.5 Free** | `kilo/minimax/minimax-m2.5:free` | **80.2%** | — | **76.8%** (BFCL) | Coding, Tool Calling |

### Caracteristicas por Modelo

**GLM-5 Free** (744B params, 40B active):
- "Agentic engineering" - otimizado para tarefas de longo horizonte
- 200K context window
- Excelente para decisoes arquiteturais, validacao, orquestracao
- Melhor reasoning geral (AIME 92.7%)

**MiniMax M2.5 Free** (230B params, 10B active):
- SOTA em coding open-source (80.2% SWE-Bench)
- "Spec-writing tendency" - planeja como arquiteto antes de codar
- Melhor tool calling (BFCL 76.8%)
- ~2.7x mais barato que GLM-5

---

## Stacks por Prioridade

### Stack Maxima (Qualidade) - Quando custo nao e problema

| Agente | Modelo | Provider ID | Por que |
|--------|--------|-------------|---------|
| **Kord** | Claude Opus 4.6 | `anthropic/claude-opus-4-6` | Orquestracao principal, maximo reasoning |
| **Builder** | Kimi K2.5 | `kimi-for-coding/k2p5` | Tool calling excelente, coordenacao |
| **Dev** | GPT-5.3 Codex | `openai/gpt-5.3-codex` | Melhor coding disponivel |
| **Dev-Junior** | Claude Sonnet 4.5 | `anthropic/claude-sonnet-4-5` | Coding solido, rapido |
| **Architect** | GPT-5.2 | `openai/gpt-5.2` | Consultoria arquitetural, alto reasoning |
| **Analyst** | Claude Opus 4.6 | `anthropic/claude-opus-4-6` | Analise pre-planejamento |
| **Librarian** | GLM-4.7 | `zai-coding-plan/glm-4.7` | Pesquisa de docs, barato |
| **Explore** | Claude Haiku 4.5 | `anthropic/claude-haiku-4-5` | Grep rapido, barato |
| **Vision** | Gemini 3 Flash | `google/gemini-3-flash` | Analise de midia |

### Stack Economica (Free Tier) - Maximo custo-beneficio

| Agente | Modelo | Provider ID | Por que |
|--------|--------|-------------|---------|
| **Kord** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Melhor reasoning free, agentic engineering |
| **Builder** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Coordenacao precisa de reasoning, nao coding |
| **Dev** | MiniMax M2.5 Free | `kilo/minimax/minimax-m2.5:free` | Melhor coding free (80.2% SWE-Bench) |
| **Dev-Junior** | MiniMax M2.5 Free | `kilo/minimax/minimax-m2.5:free` | Executor de codigo, melhor coding |
| **Architect** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Consultoria = reasoning > coding |
| **Analyst** | GLM-5 Free | `kilo/z-ai/glm-5:free` | Analise = reasoning |
| **Librarian** | GLM-4.7 Free | `kilo/z-ai/glm-4.7:free` | Pesquisa simples, mais barato |
| **Explore** | GPT-5 Nano | `opencode/gpt-5-nano` | Grep rapido, mais barato |
| **Vision** | Gemini 3 Flash | `kilo/google/gemini-3-flash` | Analise de midia free |

---

## Logica de Atribuicao: Reasoning vs Coding

### Principio Fundamental

```
+-----------------------------------------------------------------+
|  Papel           |  O que faz                    |  Precisa de  |
+-----------------------------------------------------------------+
|  KORD            |  Decide, orquestra, valida    |  Reasoning   |
|  BUILDER         |  Delega, verifica, coordena   |  Reasoning   |
|  DEV             |  Analisa, arquiteta, planeja  |  Reasoning   |
|  ARCHITECT       |  Consulta, debugga, aconselha |  Reasoning   |
|  ANALYST         |  Analisa requisitos, pesquisa |  Reasoning   |
|  DEV-JUNIOR      |  IMPLEMENTA codigo            |  Coding OK   |
+-----------------------------------------------------------------+
```

### Regra Pratica

| Agente | Stack Maxima | Stack Economica | Criterio |
|--------|--------------|-----------------|----------|
| **Orquestradores** (Kord, Builder) | Opus/Kimi | **GLM-5 Free** | Reasoning para decisoes |
| **Arquitetos** (Dev, Architect, Analyst) | Opus/GPT-5.2 | **GLM-5 Free** | Reasoning para analise |
| **Executores** (Dev-Junior) | Sonnet/GPT-5.3 | **MiniMax M2.5 Free** | Coding para implementar |

---

## Fallback Chains por Agente

### Kord (Orquestrador Principal)

**Stack Maxima:**
```
1. anthropic/claude-opus-4-6 (variant: max)
2. kimi-for-coding/k2p5
3. opencode/kimi-k2.5-free
4. zai-coding-plan/glm-4.7
5. opencode/glm-4.7-free
```

**Stack Economica:**
```
1. kilo/z-ai/glm-5:free
2. kilo/minimax/minimax-m2.5:free
3. opencode/glm-4.7-free
```

### Builder (Coordenador de Implementacao)

**Stack Maxima:**
```
1. kimi-for-coding/k2p5
2. opencode/kimi-k2.5-free
3. anthropic/claude-sonnet-4-5
4. openai/gpt-5.2
```

**Stack Economica:**
```
1. kilo/z-ai/glm-5:free
2. kilo/minimax/minimax-m2.5:free
3. opencode/glm-4.7-free
```

### Dev (Arquiteto de Solucoes)

**Stack Maxima:** (requer GPT-5.3 Codex)
```
1. openai/gpt-5.3-codex (variant: medium)
```

**Stack Economica:**
```
1. kilo/minimax/minimax-m2.5:free  # Melhor coding free
2. kilo/z-ai/glm-5:free            # Fallback reasoning
```

### Dev-Junior (Executor de Codigo)

**Stack Maxima:**
```
1. anthropic/claude-sonnet-4-5
2. openai/gpt-5.2
3. opencode/gpt-5-nano
```

**Stack Economica:**
```
1. kilo/minimax/minimax-m2.5:free  # Melhor coding free
2. kilo/z-ai/glm-5:free            # Fallback
```

### Architect (Consultor)

**Stack Maxima:**
```
1. openai/gpt-5.2 (variant: high)
2. google/gemini-3-pro (variant: high)
3. anthropic/claude-opus-4-6 (variant: max)
```

**Stack Economica:**
```
1. kilo/z-ai/glm-5:free            # Reasoning para consultoria
2. kilo/minimax/minimax-m2.5:free
```

### Analyst (Pre-planejamento)

**Stack Maxima:**
```
1. anthropic/claude-opus-4-6 (variant: max)
2. kimi-for-coding/k2p5
3. opencode/kimi-k2.5-free
4. openai/gpt-5.2 (variant: high)
```

**Stack Economica:**
```
1. kilo/z-ai/glm-5:free            # Reasoning para analise
2. kilo/minimax/minimax-m2.5:free
```

### Librarian (Pesquisa)

**Stack Maxima:**
```
1. zai-coding-plan/glm-4.7
2. opencode/glm-4.7-free
3. anthropic/claude-sonnet-4-5
```

**Stack Economica:**
```
1. kilo/z-ai/glm-4.7:free          # Mais barato
2. opencode/gpt-5-nano
```

### Explore (Grep Contextual)

**Stack Maxima:**
```
1. anthropic/claude-haiku-4-5
2. opencode/gpt-5-nano
```

**Stack Economica:**
```
1. opencode/gpt-5-nano             # Mais barato
2. kilo/z-ai/glm-4.7:free
```

---

## Uso por Tipo de Tarefa

### Tarefas que Precisam de Reasoning (GLM-5 Free)

| Tarefa | Agente | Por que |
|--------|--------|---------|
| Decisoes de arquitetura | Architect, Kord | Trade-offs, analise |
| Analise de requisitos | Analyst | Identificar ambiguidades |
| Validacao de implementacao | Builder, Kord | Verificar se esta correto |
| Planejamento | PM, SM, PO | Estruturacao de pensamento |
| Debugging complexo | Architect | Root cause analysis |
| Code review | QA, Plan-Reviewer | Identificar problemas |

### Tarefas que Precisam de Coding (MiniMax M2.5 Free)

| Tarefa | Agente | Por que |
|--------|--------|---------|
| Implementacao de features | Dev-Junior, Dev | Escrever codigo |
| Bug fixes | Dev-Junior | Corrigir codigo |
| Refactoring | Dev, Dev-Junior | Reestruturar codigo |
| UI/UX implementation | Dev-Junior (visual-engineering) | Frontend code |
| Test writing | Dev-Junior | Codigo de testes |
| Script creation | Dev-Junior (quick) | Scripts simples |

### Tarefas Mistas (Depende do contexto)

| Tarefa | Recomendacao |
|--------|--------------|
| **Refactoring complexo** | GLM-5 para analise -> MiniMax para implementacao |
| **Nova feature grande** | GLM-5 (Analyst) -> GLM-5 (Plan) -> MiniMax (Dev-Junior) |
| **Bug fix simples** | MiniMax direto (quick category) |
| **Documentacao** | GLM-5 (reasoning) ou writing category |
| **UI/UX design** | MiniMax + skill frontend-ui-ux |

---

## Categorias e Modelos Recomendados

| Categoria | Stack Maxima | Stack Economica | Uso |
|-----------|--------------|-----------------|-----|
| **visual-engineering** | `gemini-3-pro` | `kilo/google/gemini-3
