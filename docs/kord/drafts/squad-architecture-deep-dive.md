# Arquitetura de Squads no OpenCode via Kord AIOS

## O Desafio Original (Synkra vs OpenCode)
- **Synkra AIOS**: É um ecossistema próprio que lê nativamente manifestos YAML e instancia agentes em Python/Node.
- **OpenCode**: Só entende duas coisas nativamente:
  1. Agentes hardcoded no código TypeScript do plugin (`AgentConfig`).
  2. Arquivos `.md` na pasta `.claude/agents/` (modo Claude Code compatibility).

O OpenCode **não faz ideia** do que é um `SQUAD.yaml`. Ele não suporta squads, skills ou MCPs injetados dinamicamente no seu motor base.

## A Solução (O Motor Kord AIOS)
O nosso plugin (`kord-aios`) atua como um "tradutor e orquestrador" em tempo real entre a metodologia Synkra e o motor OpenCode.

### 1. Carregamento do Manifesto (Loader)
Quando o OpenCode inicia o plugin, o Kord dispara o `src/features/squad/loader.ts`.
Ele vasculha as pastas:
- `kord-aios/src/features/builtin-squads/` (Built-in)
- `~/.config/opencode/squads/` (Global - será adicionado no refactor)
- `.opencode/squads/` (Local do Projeto)

Ele lê o `SQUAD.yaml` e encontra as referências para os arquivos `.md` (as personas, ex: `prompt_file: ./marketing.md`). Ele lê o conteúdo desse `.md` para a memória.

### 2. Registro Dinâmico (Factory)
O Kord pega os dados do YAML e o conteúdo do `.md` e os passa pelo `src/features/squad/factory.ts`.
Aqui acontece a mágica: O Kord gera objetos `AgentConfig` (o formato nativo que o OpenCode entende) "on-the-fly" e os injeta no registro de agentes do OpenCode.
Para o OpenCode, esses agentes do Squad parecem idênticos aos agentes nativos como `dev` ou `architect`.

### 3. Handoffs (Delegação e Reconhecimento)
Como o Orquestrador (ex: `Build` ou `Kord`) sabe que o Squad existe?
O `factory.ts` gera um bloco de texto Markdown contendo uma tabela com todas as "Categorias de Squad" carregadas e injeta isso diretamente no System Prompt (SystemAwareness) do orquestrador.
Quando o Orquestrador chama a tool nativa `task(category="marketing:content")`, o Executor do Kord intercepta, vê que essa categoria pertence ao agente `marketing-expert` do Squad X, e acorda esse agente específico.

### 4. Skills e Tools
- **Skills**: Se o SQUAD.yaml diz que o agente precisa da skill `seo`, o carregador de skills do Kord procura o arquivo `SKILL.md` dessa skill (nas pastas globais ou locais) e "cola" o conteúdo dele no final do prompt do agente do Squad antes de ele acordar.
- **Tools**: As ferramentas (Bash, LSP, context7) já existem no motor do OpenCode. O `SQUAD.yaml` mapeia quais o agente pode usar (`tools: { bash: false }`). O Kord lê isso na hora de criar o `AgentConfig` e desabilita ou habilita as tools nativas para aquela execução.

## Conclusão
Sim, funciona perfeitamente para nós. O formato `SQUAD.yaml` continua agnóstico (estilo Synkra), mas o Kord AIOS faz o "binding" dinâmico para os formatos do OpenCode, permitindo que o usuário use o padrão da metodologia sem precisar entender como a engine por baixo lida com os `AgentConfigs` e `Tools`.