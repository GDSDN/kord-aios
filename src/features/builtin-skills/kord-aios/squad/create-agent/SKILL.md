---
name: create-agent
description: "Create a high-quality squad agent with research-backed expertise"
agent: squad-creator
subtask: false
---

# Create Squad Agent

## Overview

Create a single high-quality agent for a squad based on researched methodologies. Key insight: agents created without domain research are weak and generic.

```text
INPUT (agent_purpose + domain + squad_name + [specialist])
    ↓
[PHASE 1: CONTEXT]
    → Identify target squad
    → Check if specialist-based or generic
    ↓
[PHASE 2: RESEARCH]
    → Generate research queries
    → Execute deep research (WebSearch)
    → Extract domain methodology
    ↓
[PHASE 3: EXTRACTION]
    → Extract operational framework
    → Define persona and voice
    → Identify anti-patterns
    ↓
[PHASE 4: CREATION]
    → Generate agent prompt file (.md)
    → Add agent to SQUAD.yaml
    → Create associated skills (SKILL.md)
    ↓
[PHASE 5: VALIDATION]
    → Run squad_validate
    → Check agent quality (completeness, specificity)
    → Calculate quality score (target >= 7.0)
    ↓
[PHASE 6: HANDOFF]
    → Present summary
    → Document next steps
    ↓
OUTPUT: Agent prompt file + SQUAD.yaml update + Skills + Quality Score
```

---

## Inputs

| Parameter         | Type   | Required | Description                           | Example                |
| ----------------- | ------ | -------- | ------------------------------------- | ---------------------- |
| `agent_purpose`   | string | Yes      | What the agent should do              | `"Create sales pages"` |
| `domain`          | string | Yes      | Domain/area of expertise              | `"copywriting"`        |
| `specialist_name` | string | No       | If based on human expert              | `"Gary Halbert"`       |
| `squad_name`      | string | Yes      | Target squad name                     | `"copy"`               |

---

## Preconditions

- [ ] Target squad exists (search `.opencode/squads/`, `.kord/squads/`, `docs/kord/squads/`)
- [ ] WebSearch tool available (for research phase)
- [ ] Write permissions for squad directory

---

## PHASE 1: CONTEXT

**Duration:** < 1 minute
**Mode:** Automatic

### Step 1.1: Identify Target Squad

1. Search for the squad in `.opencode/squads/`, `.kord/squads/`, `docs/kord/squads/`
2. Read and parse `SQUAD.yaml`
3. Verify squad exists and is valid

```text
IF squad_name provided AND squad exists:
    → PROCEED
ELSE IF squad_name provided AND NOT exists:
    → ASK: "Squad doesn't exist. Create it first with /squad-create?"
ELSE:
    → ASK: "Which squad should this agent belong to?"
```

### Step 1.2: Classify Agent Type

```text
IF specialist_name provided:
    → agent_type = "specialist_based"
    → Research the specialist's methodology
ELSE:
    → agent_type = "generic"
    → WARNING: "Generic agents are weaker. Consider naming a domain expert."
    → Research domain best practices
```

**Output:**

```yaml
phase_1_output:
  squad_name: "copy"
  squad_path: ".opencode/squads/copy/"
  agent_type: "specialist_based"
  specialist_name: "Gary Halbert"
  agent_id: "gary-halbert"  # kebab-case derived from name
```

---

## PHASE 2: RESEARCH

**Duration:** 5-15 minutes
**Mode:** Autonomous

### Step 2.1: Generate Research Queries

Generate 3-5 targeted search queries based on:
- The specialist's known methodology
- The specific `agent_purpose`
- Domain best practices and frameworks

### Step 2.2: Execute Deep Research

Use WebSearch to gather information:

```yaml
research_criteria:
  min_unique_sources: 5
  requires_methodology: true
  extract:
    - Step-by-step processes
    - Decision frameworks
    - Quality criteria
    - Common patterns and anti-patterns
    - Real output examples
```

### Step 2.3: Quality Check

```text
IF sources >= 5 AND methodology extracted:
    → PROCEED to Phase 3
ELSE IF sources >= 3:
    → WARNING: "Limited sources. Agent may be less specific."
    → PROCEED with caution
ELSE:
    → RETRY with different queries
    → If still insufficient: create agent with TODO notes for enrichment
```

---

## PHASE 3: EXTRACTION

**Duration:** 5-10 minutes
**Mode:** Autonomous

### Step 3.1: Extract Operational Framework

From the research, extract:

| Section | Description | Minimum |
|---------|-------------|---------|
| Core principles | Fundamental beliefs and values | 5 items |
| Methodology | Step-by-step operational process | 5 steps |
| Voice/Style | How this expert communicates | Vocabulary lists |
| Anti-patterns | What to avoid | 5 items |
| Output examples | Real examples of the expert's work | 3 examples |

### Step 3.2: Define Persona

```yaml
agent_persona:
  name: "{specialist_name or domain title}"
  id: "{kebab-case identifier}"
  description: "Expert in {agent_purpose}"
  role: "Extracted from research"
  style: "Derived from voice analysis"
  focus: "Primary objective from agent_purpose"
```

---

## PHASE 4: CREATION

**Duration:** 5-10 minutes
**Mode:** Autonomous

### Step 4.1: Generate Agent Prompt File

Write the agent's prompt file at `agents/{agent_id}.md`:

```markdown
# {Agent Name}

## Identity
You are {name}, an expert in {domain}. {role description}.

## Core Principles
{5-10 principles from research}

## Methodology
{Step-by-step process from extracted framework}

## Quality Standards
{Criteria from the expert's own methodology}

## Voice & Style
- Always use: {vocabulary list}
- Never use: {vocabulary list}
- Tone: {style description}

## Anti-Patterns
{What this agent should never do}

## Output Examples
{3+ real examples showing input → output}
```

### Step 4.2: Add Agent to SQUAD.yaml

Add the new agent entry to the squad's `SQUAD.yaml`:

```yaml
agents:
  {agent_id}:
    description: "{agent description}"
    prompt_file: agents/{agent_id}.md
    model: "anthropic/claude-sonnet-4-5"
    mode: subagent
    skills: []
```

### Step 4.3: Create Associated Skills

For each major capability of the agent, create a `skills/{skill-name}/SKILL.md`:

```markdown
---
name: {skill-name}
description: "{skill description}"
agent: {agent_id}
subtask: false
---

# {Skill Title}

## Purpose
{What this skill accomplishes}

## Steps
{Detailed methodology from research}

## Quality Criteria
{How to know the output is good}
```

---

## PHASE 5: VALIDATION

**Duration:** 2-5 minutes
**Mode:** Autonomous with retry

### Step 5.1: Run Squad Validation

Use the `squad_validate` tool to check the updated squad:

```
squad_validate({ squad_name: "{squad_name}" })
```

Fix any errors before proceeding.

### Step 5.2: Agent Quality Check

| Dimension | Weight | Check |
|-----------|--------|-------|
| Prompt completeness | 0.25 | All sections present in prompt file |
| Voice specificity | 0.20 | Domain-specific vocabulary, not generic |
| Examples quality | 0.20 | Real examples, not placeholders |
| Anti-patterns | 0.15 | Specific to domain, not generic advice |
| Research backing | 0.10 | Traceable to sources |
| Integration | 0.10 | SQUAD.yaml entry correct, prompt_file resolves |

**Threshold:** Score >= 7.0 / 10.0

### Step 5.3: Quality Scoring

```yaml
quality_levels:
  - range: "0-4"
    level: "Level 1 — Persona only (decorative)"
    verdict: "FAIL — Agent is too generic"

  - range: "4-7"
    level: "Level 2 — Functional but inconsistent"
    verdict: "CONDITIONAL — Can publish with improvement plan"

  - range: "7-9"
    level: "Level 3 — Complete and specific"
    verdict: "PASS — Agent is operational"

  - range: "9-10"
    level: "Level 3+ — Complete and integrated"
    verdict: "EXCELLENT — Production-ready agent"

target: ">= 7.0 (Level 3)"
```

**Decision:**

```text
IF score >= 7.0:
    → PROCEED to Phase 6
ELSE IF score >= 4.0:
    → List gaps, ask: "Fix now or proceed with documented gaps?"
ELSE:
    → Return to Phase 3, enrich with more research
    → Max retries: 2
```

---

## PHASE 6: HANDOFF

**Duration:** < 1 minute
**Mode:** Interactive

### Step 6.1: Present Summary

```
Agent created successfully!

  Name: {agent_name}
  ID: {agent_id}
  Squad: {squad_name}
  File: .opencode/squads/{squad_name}/agents/{agent_id}.md
  Quality: {score}/10 ({level})
  Skills: {count} SKILL.md files created

  Delegation: task(subagent_type="{agent_id}")
  Category: task(category="{squad_name}:{category}")
```

### Step 6.2: Next Steps

```
Recommended:
  1. Test the agent with a sample task
  2. Refine the prompt file based on results
  3. Add more skills as needed

Optional:
  1. Create more agents for the squad
  2. Set this agent as default_executor or default_reviewer
  3. Run: squad_validate({ squad_name: "{squad_name}" })
```

---

## Outputs

| Output | Location | Description |
|--------|----------|-------------|
| Agent prompt | `.opencode/squads/{squad_name}/agents/{agent_id}.md` | Complete agent persona and methodology |
| SQUAD.yaml | `.opencode/squads/{squad_name}/SQUAD.yaml` | Updated with new agent entry |
| Skills | `.opencode/squads/{squad_name}/skills/*/SKILL.md` | Domain methodology files |
| README | `.opencode/squads/{squad_name}/README.md` | Updated with agent listing |

---

## Quality Checklist

### Prompt File
- [ ] Agent prompt file at correct location
- [ ] All sections present (Identity, Principles, Methodology, Quality, Voice, Anti-patterns, Examples)
- [ ] Prompt >= 200 lines
- [ ] Domain-specific vocabulary (not generic)
- [ ] Output examples >= 3 (real, not placeholders)
- [ ] Anti-patterns >= 5 (specific to domain)

### Integration
- [ ] Agent added to SQUAD.yaml with correct fields
- [ ] `prompt_file` resolves to existing file
- [ ] Agent name is kebab-case
- [ ] `squad_validate` passes

### Quality
- [ ] Quality score >= 7.0
- [ ] Research sources documented
- [ ] Methodology traceable to domain expert

---

## Error Handling

```yaml
error_handling:
  research_insufficient:
    - Retry with different queries
    - Expand search scope
    - Fallback: Create agent with TODO notes for enrichment

  validation_fails:
    - Identify specific failures
    - Fix prompt file or SQUAD.yaml
    - Re-run squad_validate

  squad_not_exists:
    - Suggest: /squad-create {squad_name}
    - Do NOT create agent without a squad
```

---

## Related

- **Tool:** `squad_validate`
- **Skill:** `squad-creator-create`
- **Skill:** `squad-creator-extend`
- **Command:** `/squad-create`
- **Agent:** @squad-creator

---

_Skill Version: 4.0 (Kord Engine)_
_Philosophy: "Agents without research are weak and generic. Always research first."_
