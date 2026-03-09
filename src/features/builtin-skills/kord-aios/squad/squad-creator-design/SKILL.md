---
name: squad-creator-design
description: "Design a squad blueprint from documentation and domain analysis"
agent: squad-creator
subtask: false
---

# Design Squad

## Purpose

Analyze project documentation and domain knowledge to generate a squad blueprint. The blueprint describes recommended agents, skills, and structure before actual squad creation.

## Usage

```
@squad-creator
design-squad --docs ./docs/prd/my-project.md
design-squad --domain "e-commerce order management"
design-squad --docs ./docs/specs/api.yaml --quick
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `--docs` | string | - | Comma-separated paths to documentation files |
| `--domain` | string | - | Domain hint to guide analysis |
| `--quick` | flag | false | Accept all recommendations without review |

## Design Process

### Phase 1: Documentation Input

Read and analyze the provided documentation files (markdown, YAML, JSON). If no files are provided, prompt for domain description.

### Phase 2: Domain Analysis

Extract from the documentation:

| Extracted | Description |
|-----------|-------------|
| Entities | Key domain objects and concepts |
| Workflows | Sequential processes and operations |
| Integrations | External systems and APIs |
| Stakeholders | User types and roles |

### Phase 3: Agent Recommendations

For each major workflow, recommend an agent:

```
Recommended Agent 1 of 3:

  Name: order-manager
  Role: Manages order lifecycle from creation to fulfillment
  Skills: order-processing, payment-validation
  Confidence: 92%

  Accept / Reject / Modify?
```

### Phase 4: Skill Recommendations

For each agent, recommend SKILL.md files:

```
Skills for order-manager:

  1. order-processing (90% confidence)
     Input: customer_id, items[], payment_method
     Output: order confirmation, tracking ID

  2. payment-validation (85% confidence)
     Input: order_id, payment_details
     Output: validation result, receipt

  Accept all / Review individually?
```

### Phase 5: Blueprint Generation

Generate a blueprint YAML file for review before creating the actual squad.

## Blueprint Schema

```yaml
name: my-domain-squad
description: "Generated from documentation analysis"
domain: e-commerce

analysis:
  entities: [Order, Customer, Product, Payment]
  workflows: [order-creation, payment-processing]
  integrations: [Stripe API, Inventory Service]

recommendations:
  agents:
    - name: order-manager
      role: "Manages order lifecycle"
      skills: [order-processing, payment-validation]
      is_chief: true
      confidence: 0.92

    - name: inventory-tracker
      role: "Tracks stock levels"
      skills: [stock-check, reorder-alert]
      confidence: 0.85

  tags: ["e-commerce", "orders"]

metadata:
  source_docs: ["./docs/prd/my-project.md"]
  overall_confidence: 0.87
```

## Integration with create-squad

After generating a blueprint, use it to create the squad:

```
@squad-creator create-squad my-domain --from-blueprint
```

This will:
1. Read the blueprint
2. Generate SQUAD.yaml with v2 schema fields
3. Create agents/*.md prompt files
4. Create skills/*/SKILL.md files
5. Run squad_validate

## Flow

```
1. Collect documentation
   ├── Read provided files
   └── Or prompt for domain description

2. Analyze domain
   ├── Extract entities, workflows, integrations
   └── Identify stakeholders and roles

3. Generate recommendations
   ├── Map workflows to agents
   ├── Map operations to skills
   └── Calculate confidence scores

4. Interactive refinement (unless --quick)
   ├── Review each agent recommendation
   └── Review each skill recommendation

5. Generate blueprint YAML
   └── Save to .opencode/squads/.designs/{name}-blueprint.yaml

6. Display next steps
   └── Show how to create squad from blueprint
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `NO_DOCUMENTATION` | No input provided | Provide docs via --docs or describe domain |
| `PARSE_ERROR` | Cannot read/parse file | Check file format (md, yaml, json) |
| `EMPTY_ANALYSIS` | No domain concepts extracted | Provide more detailed documentation |

## Related

- **Skill:** `squad-creator-create` (creates from blueprint)
- **Tool:** `squad_validate`
- **Agent:** @squad-creator
