---
name: po-stories-index
description: "PO Task: Regenerate Story Index methodology and workflow"
agent: po
subtask: false
---

# PO Task: Regenerate Story Index

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

### 1. Confirm Regeneration

```yaml
elicit: true
question: "Regenerate story index? This will scan all stories and update docs/stories/index.md"
options:
  - yes: Proceed with regeneration
  - no: Cancel operation
  - preview: Show current stats without writing
```

### 2. Generate Story Index

```javascript
const { generateStoryIndex } = require('story-index-generator');

console.log('📚 Scanning stories directory...');

const result = await generateStoryIndex('docs/stories');

console.log(`✅ Story index generated`);
console.log(`   Total Stories: ${result.totalStories}`);
console.log(`   Output: ${result.outputPath}`);
```

### 3. Display Summary

```markdown

## 📊 Story Index Updated

*Total Stories:** ${totalStories}
*Output File:** docs/stories/index.md

*Stories by Epic:**
${epics.map(epic => `- ${epic.name}: ${epic.count} stories`).join('\n')}

*Stories by Status:**
${statuses.map(status => `- ${status.emoji} ${status.name}: ${status.count}`).join('\n')}

*Next Steps:**
- Review index: docs/stories/index.md
- Use `backlog-review` to see backlog items
- Use `create-story` to add new stories
```

### 4. Preview Mode (if selected)

```javascript
if (mode === 'preview') {
  const stories = await scanStoriesDirectory('docs/stories');

  console.log('\n📊 Story Index Preview');
  console.log(`   Total Stories: ${stories.length}`);

  const grouped = groupStoriesByEpic(stories);
  Object.entries(grouped).forEach(([epic, items]) => {
    console.log(`   ${epic}: ${items.length} stories`);
  });

  console.log('\nRun with "yes" to generate index file.');
  return;
}
```

---

## Example Usage

```bash
# Interactive mode
stories-index
> yes

# Expected output:
📚 Scanning stories directory...
✅ Found 70 stories
✅ Story index generated: docs/stories/index.md

📊 Story Index Updated
Total Stories: 70
Output File: docs/stories/index.md

Stories by Epic:
- Epic 6.1 Kord AIOS Migration: 45 stories
- Epic 3 Gap Remediation: 20 stories
- Unassigned: 5 stories
```

---

## Error Handling

- *No stories found:** Warn user, create empty index
- *Invalid story metadata:** Log warnings, skip malformed stories
- *Permission denied:** Check file permissions on docs/stories/
- *Write failed:** Verify docs/stories/ directory exists

---

## Testing

```bash
# Test regeneration
stories-index
> preview  # Check counts without writing

stories-index
> yes      # Generate full index

# Verify:
cat docs/stories/index.md
# - Total stories count matches directory scan
# - Stories grouped by epic correctly
# - All story links work
# - Status/priority emojis display correctly
```

---

## npm Script Integration

Add to `package.json`:

```json
{
  "scripts": {
    "stories:index": "node story-index-generator.js docs/stories"
  }
}
```

Usage:
```bash
npm run stories:index
```

---

*Related Tasks:**
- `po-backlog-add.md` - Add backlog items
- `po-create-story.md` - Create new stories
- `story-index-generator.js` - Core generator utility
