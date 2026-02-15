---
name: po-pull-story
description: "pull-story methodology and workflow"
agent: po
subtask: false
---

# pull-story

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

## Task Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "3.20"

optional:
  - auto_merge: false # If true, automatically apply updates to local file
```

## Prerequisites

- PM tool configured in `.kord-aios-pm-config.yaml` (or will use local-only mode)

### Step 1: Get PM Adapter

```javascript
const { getPMAdapter, isPMToolConfigured } = require('../pm-adapter-factory');

if (!isPMToolConfigured()) {
  console.log('ℹ️  Local-only mode: No PM tool configured');
  console.log('   Local story file is the source of truth');
  return;
}

const adapter = getPMAdapter();
console.log(`Pulling from ${adapter.getName()}...`);
```

### Step 2: Pull Updates

```javascript
const result = await adapter.pullStory(storyId);

if (result.success) {
  if (result.updates) {
    console.log(`📥 Updates found:`);
    console.log(JSON.stringify(result.updates, null, 2));
  } else {
    console.log(`✅ Story is up to date`);
  }
} else {
  console.error(`❌ Pull failed: ${result.error}`);
}
```

### Step 3: Display Updates (if any)

If updates found:

```markdown
📥 Updates available from {PM_TOOL}:

*Status:** {old_status} → {new_status}
*Updated:** {timestamp}

Review changes before merging to local file.
```

### Step 4: Optional Auto-Merge

If `auto_merge: true` and updates exist:

```javascript
// Update local story file with pulled changes
// CAUTION: Only merge non-conflicting fields (status, etc.)
// DO NOT overwrite local task progress or dev notes
```

## Error Handling

- *No PM tool configured**: Inform local-only mode (not an error)
- *Story not found in PM tool**: Display helpful message
- *Connection failed**: Show adapter-specific error

## Notes

- LocalAdapter always returns {success: true, updates: null}
- Current implementation is pull-only (unidirectional sync)
- Auto-merge should be used cautiously to avoid overwriting local changes
- Future enhancement: bidirectional sync with conflict resolution

## Limitations (v1.0)

- *Unidirectional**: Only pulls status changes, not full content
- *No conflict resolution**: Manual merge required if conflicts exist
- *Limited field mapping**: Only status synced in v1.0

## Integration with Story Manager

```javascript
const { pullStoryFromPM } = require('../story-manager');

const updates = await pullStoryFromPM(storyId);
if (updates) {
  console.log('Updates available:', updates);
}
```
