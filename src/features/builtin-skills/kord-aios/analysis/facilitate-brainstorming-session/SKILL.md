---
name: facilitate-brainstorming-session
description: "Facilitate Brainstorming Session methodology and workflow"
agent: architect
subtask: false
---

# Facilitate Brainstorming Session

## Purpose

To conduct a structured brainstorming session with multiple AI agents (and optionally human participants) to generate, categorize, and prioritize ideas for features, solutions, or strategic decisions.

### Required Parameters

- *topic**: `string`
  - *Description**: The challenge, opportunity, or question to brainstorm about
  - *Example**: "How can we improve user onboarding for Kord AIOS?"
  - *Validation**: Must be at least 20 characters

- *session_goal**: `string`
  - *Description**: What outcome is desired from this session
  - *Options**: `"ideation"` (generate many ideas), `"solution"` (solve a problem), `"strategy"` (strategic planning)
  - *Default**: `"ideation"`

### Optional Parameters

- *participating_agents**: `array<string>`
  - *Description**: Agent IDs to invite to the session
  - *Default**: Auto-select based on topic (using brief analysis)
  - *Example**: `["po", "architect", "ux-expert", "github-devops"]`

- *time_limit**: `number`
  - *Description**: Session duration in minutes
  - *Default**: `30`
  - *Range**: `10-60`

- *output_format**: `string`
  - *Description**: How to organize final output
  - *Options**: `"categorized"` (by theme), `"prioritized"` (by value), `"actionable"` (with next steps)
  - *Default**: `"categorized"`

- *context_documents**: `array<string>`
  - *Description**: Optional file paths for context (PRD, backlog, architecture docs)
  - *Example**: `["docs/prd.md", "docs/backlog.md"]`

## Output

- *ideas**: `array<object>`
  - *Structure**: `{ id, text, source_agent, category, priority, rationale }`
  - *Description**: All generated ideas with metadata

- *categories**: `array<object>`
  - *Structure**: `{ name, ideas_count, top_ideas }`
  - *Description**: Ideas grouped by theme

- *prioritized_recommendations**: `array<object>`
  - *Structure**: `{ idea, value_score, effort_estimate, roi, next_steps }`
  - *Description**: Top 5-10 ideas with actionable next steps

- *session_summary**: `object`
  - *Structure**: `{ topic, duration, agents_participated, ideas_generated, key_insights }`
  - *Description**: Session metadata and insights

- *clickup_board_url**: `string` (optional)
  - *Description**: ClickUp board with ideas organized (if ClickUp integration enabled)

### Phase 1: Setup & Context Loading (5 min)

1. *Load Context**
   - If `context_documents` provided, read and summarize key points
   - Extract relevant constraints, requirements, or goals

2. *Select Participating Agents**
   - If `participating_agents` not provided:
     - Analyze topic using brief analysis
     - Identify relevant domains (e.g., "user onboarding" → ux-expert, po, copywriter)
     - Auto-select 3-5 appropriate agents
   - Log: "✅ Session participants: [agent list]"

3. *Define Session Structure**
   - Based on `session_goal`:
     - *Ideation**: Divergent thinking (generate maximum ideas)
     - *Solution**: Convergent thinking (evaluate and refine)
     - *Strategy**: Structured frameworks (SWOT, OKRs, etc.)

### Phase 2: Divergent Thinking - Idea Generation (10-15 min)

4. *Round 1: Initial Ideas (5 min)**
   - Prompt each agent: "Generate 3-5 ideas for: {topic}"
   - Collect responses
   - No evaluation yet (pure brainstorming)

5. *Round 2: Build on Ideas (5 min)**
   - Share all ideas with agents
   - Prompt: "Build on or remix existing ideas. Generate 2-3 new ideas inspired by what you see."
   - Collect responses

6. *Round 3: Wild Cards (2 min)**
   - Prompt: "Generate 1-2 unconventional or 'what if' ideas"
   - Encourage creative risk-taking

### Phase 3: Convergent Thinking - Categorization (5-10 min)

7. *Categorize Ideas**
   - Use AI to identify themes/patterns
   - Group ideas into 3-7 categories
   - Example categories: "Quick Wins", "Big Bets", "Research Needed", "Technical Solutions", "UX Improvements"

8. *Deduplicate & Merge**
   - Identify similar ideas
   - Merge or link related concepts

### Phase 4: Evaluation & Prioritization (5-10 min)

9. *Score Ideas** (if `output_format: "prioritized"`)
   - Criteria:
     - *Value**: Impact on users/business (1-10)
     - *Effort**: Development complexity (1-10)
     - *ROI**: Value/Effort ratio
     - *Alignment**: Fits strategy/goals (1-10)
   - Calculate aggregate scores

10. *Select Top Ideas**
    - Identify top 5-10 ideas based on scores
    - For each, generate:
      - *Rationale**: Why this idea is valuable
      - *Next Steps**: Concrete actions to pursue it

### Phase 5: Documentation & Actionability (5 min)

11. *Create Session Report**
    - Summary of all ideas
    - Categorized view
    - Prioritized recommendations
    - Session metadata

12. *Export to ClickUp** (optional)
    - If ClickUp integration enabled:
      - Create board: "Brainstorm: {topic}"
      - Add ideas as tasks with categories as tags
      - Link to session report

### Acceptance Criteria

- [ ] Session produces actionable recommendations
  - *Type**: acceptance
  - *Manual Check**: true
  - *Criteria**: User can immediately act on at least 3 ideas

- [ ] Ideas are diverse and cover multiple perspectives
  - *Type**: acceptance
  - *Manual Check**: false
  - *Test**: `categories.length >= 3`

### Session Report Template

```markdown
# Brainstorming Session: {topic}

*Date**: {date}
*Duration**: {duration} minutes
*Participants**: {agents_participated.join(', ')}
*Goal**: {session_goal}

## Context

{context_summary}

## Ideas Generated

*Total**: {ideas_generated}

### By Category

{categories.map(cat => `
#### ${cat.name} (${cat.ideas_count} ideas)

${cat.top_ideas.map(idea => `- ${idea.text} (by ${idea.source_agent})`).join('\n')}
`).join('\n')}

## Top Recommendations

{prioritized_recommendations.map((rec, i) => `

### ${i+1}. ${rec.idea.text}

*Value Score**: ${rec.value_score}/10
*Effort Estimate**: ${rec.effort_estimate}/10
*ROI**: ${rec.roi.toFixed(2)}

*Why this matters**: ${rec.rationale}

*Next Steps**:
${rec.next_steps.map(step => `- ${step}`).join('\n')}
`).join('\n')}

## Key Insights

{key_insights}

## Session Metadata

- *Ideas Generated**: {ideas_generated}
- *Categories Identified**: {categories.length}
- *Agents Participated**: {agents_participated.length}
- *Session Duration**: {duration} minutes
```

## Error Handling

- *Strategy**: fallback
- *Fallback**: If agent fails, continue with remaining agents
- *Retry**:
  - *Max Attempts**: 2
  - *Backoff**: linear
  - *Backoff MS**: 1000
- *Abort Workflow**: false (continue even if some agents fail)
- *Notification**: log + summary report

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)

- Autonomous decision making with logging
- Minimal user interaction
- *Best for:** Simple, deterministic tasks

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**

- Explicit decision checkpoints
- Educational explanations
- *Best for:** Learning, complex decisions

### 3. Pre-Flight Planning - Comprehensive Upfront Planning

- Task analysis phase (identify all ambiguities)
- Zero ambiguity execution
- *Best for:** Ambiguous requirements, critical work

*Parameter:** `mode` (optional, default: `interactive`)

---

## Acceptance Criteria

*Purpose:** Definitive pass/fail criteria for task completion

*Checklist:**

```yaml
acceptance-criteria:
  - [ ] Task completed as expected; side effects documented
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert task completed as expected; side effects documented
    error_message: "Acceptance criterion not met: Task completed as expected; side effects documented"
```

---

## Error Handling

*Strategy:** retry

*Common Errors:**

1. *Error:** Task Not Found
   - *Cause:** Specified task not registered in system
   - *Resolution:** Verify task name and registration
   - *Recovery:** List available tasks, suggest similar

2. *Error:** Invalid Parameters
   - *Cause:** Task parameters do not match expected schema
   - *Resolution:** Validate parameters against task definition
   - *Recovery:** Provide parameter template, reject execution

3. *Error:** Execution Timeout
   - *Cause:** Task exceeds maximum execution time
   - *Resolution:** Optimize task or increase timeout
   - *Recovery:** Kill task, cleanup resources, log state

---

### Example 1: Feature Ideation

```bash
kord-aios activate Maestro
kord-aios brainstorm "How can we improve Kord AIOS user onboarding for non-technical users?"
```

*Output**: 25 ideas across 5 categories, top 10 prioritized with next steps

### Example 2: Problem Solving with Specific Agents

```bash
kord-aios brainstorm "How to reduce API latency in database queries?" \
  --agents="db-sage,architect,github-devops" \
  --goal="solution" \
  --format="actionable"
```

*Output**: Focused technical solutions with implementation steps

### Example 3: Strategic Planning

```bash
kord-aios brainstorm "What should be our open-source expansion strategy for Q1 2026?" \
  --agents="po,architect,github-devops" \
  --goal="strategy" \
  --context="docs/prd.md,docs/open-source-roadmap.md"
```

*Output**: Strategic recommendations aligned with existing plans

---

*Related Tasks:**
- `create-next-story` - Convert ideas into actionable stories
- `analyze-framework` - Analyze framework capabilities for improvement ideas
