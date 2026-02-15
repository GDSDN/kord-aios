---
name: po-backlog-add
description: "PO Task: Add Backlog Item methodology and workflow"
agent: po
subtask: false
---

# PO Task: Add Backlog Item

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

### 1. Elicit Item Details

```yaml
elicit: true
questions:
  - Type of item?
    options:
      - F: Follow-up (📌) - Post-story action item
      - T: Technical Debt (🔧) - Code quality or architecture improvement
      - E: Enhancement (✨) - Feature improvement or optimization

  - Title (1-line description):
    input: text
    validation: min 10 chars, max 100 chars

  - Detailed Description (optional):
    input: textarea
    validation: max 500 chars

  - Priority:
    options:
      - Critical (🔴)
      - High (🟠)
      - Medium (🟡)
      - Low (🟢)
    default: Medium

  - Related Story ID (optional):
    input: text
    example: "6.1.2.6"
    validation: story file must exist if provided

  - Tags (optional, comma-separated):
    input: text
    example: "testing, performance, security"

  - Estimated Effort (optional):
    input: text
    example: "2 hours", "1 day", "1 week"
    default: "TBD"
```

### 2. Validate Input

```javascript
// Validate story exists if relatedStory provided
if (relatedStory) {
  const storyPath = `docs/stories/**/*${relatedStory}*.md`;
  const matches = await glob(storyPath);

  if (matches.length === 0) {
    throw new Error(`Story not found: ${relatedStory}`);
  }

  if (matches.length > 1) {
    console.log('⚠️ Multiple stories matched, using first:');
    matches.forEach(m => console.log(`  - ${m}`));
  }
}

// Parse tags
const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];
```

### 3. Add Item to Backlog

```javascript
const { BacklogManager } = require('backlog-manager');

const manager = new BacklogManager('docs/stories/backlog.md');
await manager.load();

const item = await manager.addItem({
  type: itemType,
  title: title,
  description: description || '',
  priority: priority,
  relatedStory: relatedStory || null,
  createdBy: '@po',
  tags: tags,
  estimatedEffort: estimatedEffort
});

console.log(`✅ Backlog item added: ${item.id}`);
console.log(`   Type: ${itemType} | Priority: ${priority}`);
console.log(`   ${title}`);
```

### 4. Regenerate Backlog File

```javascript
await manager.generateBacklogFile();

console.log('✅ Backlog updated: docs/stories/backlog.md');
```

### 5. Summary Output

```markdown

## 🎯 Backlog Item Added

*ID:** ${item.id}
*Type:** ${itemTypeEmoji} ${itemTypeName}
*Title:** ${title}
*Priority:** ${priorityEmoji} ${priority}
*Related Story:** ${relatedStory || 'None'}
*Estimated Effort:** ${estimatedEffort}
*Tags:** ${tags.join(', ') || 'None'}

*Next Steps:**
- Review in backlog: docs/stories/backlog.md
- Prioritize with `backlog-prioritize ${item.id}`
- Schedule with `backlog-schedule ${item.id}`
```

---

## Example Usage

```bash
# Interactive mode (recommended)
backlog-add

# Example responses:
Type: F
Title: Add integration tests for story index generator
Description: Story 6.1.2.6 implementation needs integration tests
Priority: High
Related Story: 6.1.2.6
Tags: testing, integration, story-6.1.2.6
Effort: 3 hours
```

---

## Error Handling

- *Story not found:** Warn user, allow to proceed without related story
- *Invalid type:** Show valid options (F, T, E)
- *Invalid priority:** Default to Medium
- *Backlog file locked:** Retry 3x with 1s delay

---

## Testing

```bash
# Test with sample data
backlog-add
# Fill in sample data and verify:
# - Item added to docs/stories/backlog.json
# - Backlog file regenerated at docs/stories/backlog.md
# - Item appears in correct section by type
# - Priority sorting works
```

---

*Related Tasks:**
- `po-stories-index.md` - Regenerate story index
- `po-backlog-review.md` - Review and prioritize backlog
- `po-backlog-schedule.md` - Schedule backlog items
