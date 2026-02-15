---
name: undo-last
description: "No checklists needed - rollback operation with built-in transaction validation methodology and workflow"
agent: dev
subtask: false
---

# No checklists needed - rollback operation with built-in transaction validation

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
  - [ ] Original state restored; no residual changes
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert original state restored; no residual changes
    error_message: "Acceptance criterion not met: Original state restored; no residual changes"
```

---

## Error Handling

*Strategy:** retry

*Common Errors:**

1. *Error:** Backup Not Found
   - *Cause:** No backup exists for target version
   - *Resolution:** Verify backup location and version
   - *Recovery:** List available backups, abort if none

2. *Error:** Rollback Failed
   - *Cause:** Error restoring previous state
   - *Resolution:** Check backup integrity and permissions
   - *Recovery:** Preserve current state, log failure

---

## Description

Rollback the last component creation or modification operation. This task allows undoing recent changes made by the kord-aios-developer agent, including single component creation, batch creation, or component updates.

## Context Required

- Access to transaction history
- File system permissions for affected files
- Manifest write permissions

## Prerequisites

- Transaction logging enabled
- Backup files available
- No conflicting operations since last transaction

## Input Requirements

- Optional: Transaction ID to rollback (defaults to last transaction)
- Optional: Selective rollback options

### Step 1: Identify Transaction

Locate the most recent transaction or use provided transaction ID.

*Actions:**
- Query transaction history
- Display transaction details
- Confirm rollback intent

*Validation:**
- Transaction exists and is rollbackable
- User confirms the operation

### Step 2: Analyze Changes

Review all changes made in the transaction.

*Actions:**
- List all file operations
- Show manifest changes
- Display component metadata updates

*Output Format:**
```
Transaction: txn-1234567890-abcd
Type: component_creation
Date: 2025-01-31T10:30:00Z
Operations:
  - Created: /kord-aios-core/agents/data-analyst.md
  - Updated: /kord-aios-core/team-manifest.yaml
  - Created: /kord-aios-core/tasks/analyze-data.md
```

### Step 3: Execute Rollback

Perform the rollback operation with proper error handling.

*Actions:**
- Restore file backups
- Revert manifest changes
- Update component metadata
- Clean up orphaned files

*Error Handling:**
- Handle missing backup files
- Manage partial rollback scenarios
- Report rollback failures

### Step 4: Verify Rollback

Ensure all changes have been properly reverted.

*Actions:**
- Verify file states
- Check manifest integrity
- Validate component consistency

*Success Criteria:**
- All files restored to previous state
- Manifest accurately reflects changes
- No orphaned references remain

### Success Response

```
✅ Rollback completed successfully!

Transaction: txn-1234567890-abcd
Rolled back:
  - ✓ Removed: data-analyst.md
  - ✓ Restored: team-manifest.yaml
  - ✓ Removed: analyze-data.md
  
Total operations: 3
Successful: 3
Failed: 0
```

### Failure Response

```
❌ Rollback partially failed

Transaction: txn-1234567890-abcd
Results:
  - ✓ Removed: data-analyst.md
  - ✗ Failed to restore: team-manifest.yaml (backup not found)
  - ✓ Removed: analyze-data.md

Please manually review and fix failed operations.
```

### Common Errors

1. *Transaction Not Found**
   - Display available transactions
   - Suggest checking transaction ID

2. *Backup Files Missing**
   - Warn about incomplete rollback
   - Provide manual recovery steps

3. *Concurrent Modifications**
   - Detect file changes since transaction
   - Prompt for force rollback option

## Security Considerations

- Verify user has permission to rollback
- Prevent rollback of system transactions
- Maintain audit trail of rollback operations
- Validate file paths to prevent traversal

## Dependencies

- TransactionManager utility
- File system access
- Backup storage system

## Notes

- Rollback is only available for recent transactions (within retention period)
- Some operations may not be fully reversible
- Always creates a new transaction for the rollback itself
- Supports selective rollback for batch operations

## Related Tasks

- create-agent
- create-task
- create-workflow
- create-suite
- update-manifest
