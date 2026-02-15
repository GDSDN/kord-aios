---
name: po-sync-story
description: "sync-story methodology and workflow"
agent: po
subtask: false
---

# sync-story

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
  - story_path: 'path/to/story.yaml' # Full path to story YAML file

optional:
  - force: false # If true, sync even if no changes detected
```

## Prerequisites

- Story file must exist
- PM tool configured in `.kord-aios-pm-config.yaml` (or will use local-only mode)

### Step 1: Load Story File

- Verify story file exists at provided path
- Read and parse YAML content
- Extract story ID, title, status

### Step 2: Get PM Adapter

```javascript
const { getPMAdapter } = require('../pm-adapter-factory');

const adapter = getPMAdapter();
console.log(`Using ${adapter.getName()} adapter`);
```

### Step 3: Sync to PM Tool

```javascript
const result = await adapter.syncStory(storyPath);

if (result.success) {
  console.log(`✅ Story ${storyId} synced successfully`);
  if (result.url) {
    console.log(`   URL: ${result.url}`);
  }
} else {
  console.error(`❌ Sync failed: ${result.error}`);
}
```

### Step 4: Output Results

Display formatted summary:

```markdown
✅ Story {story_id} synchronized to {PM_TOOL}

*PM Tool:** {adapter_name}
*Status:** {story_status}
*URL:** {url} (if available)
*Timestamp:** {current_time}

{Changes synced details}
```

## Error Handling

- *Story file not found**: Display error with correct path
- *PM tool connection failed**: Show error message from adapter
- *Configuration missing**: Inform user to run `kord-aios init`
- *Sync failed**: Display adapter-specific error message

## Notes

- LocalAdapter (no PM tool) always succeeds (validates YAML only)
- ClickUp adapter preserves backward compatibility with existing workflows
- GitHub adapter creates/updates GitHub issue
- Jira adapter creates/updates Jira issue
- All adapters return consistent {success, url?, error?} format

## Integration with Story Manager

This task can be called directly or via story-manager utilities:

```javascript
const { syncStoryToPM } = require('../story-manager');

await syncStoryToPM(storyPath);
```
