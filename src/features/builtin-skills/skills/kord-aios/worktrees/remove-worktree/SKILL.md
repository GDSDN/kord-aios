---
name: remove-worktree
description: "remove-worktree methodology and workflow"
agent: devops
subtask: false
---

# remove-worktree

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)

- Removes worktree without confirmation
- Only prompts if uncommitted changes exist
- *Best for:** Cleanup after merge

### 2. Interactive Mode - Safe, Confirming (2-3 prompts) **[DEFAULT]**

- Always confirms before removal
- Shows worktree details before deletion
- *Best for:** Production safety

*Parameter:** `mode` (optional, default: `interactive`)

---

## Description

Removes an Kord AIOS-managed worktree and its associated branch. Includes safety checks for uncommitted changes and provides options for force removal.

*Safety Features:**

- Warns about uncommitted changes
- Confirms before deletion (interactive mode)
- Cannot remove while inside worktree
- Logs removal for audit trail

---

## Inputs

| Parameter  | Type    | Required | Default | Description                            |
| ---------- | ------- | -------- | ------- | -------------------------------------- |
| `story_id` | string  | Yes      | -       | Story identifier to remove             |
| `force`    | boolean | No       | `false` | Force removal with uncommitted changes |

---

## Elicitation

```yaml
elicit: true # Confirms before destructive operation
```

Prompts for confirmation in interactive mode.

---

### Step 1: Validate Git Repository

*Action:** Verify current directory is a git repository

```bash
git rev-parse --is-inside-work-tree 2>/dev/null
```

---

### Step 2: Parse Story ID

*Action:** Extract and validate story ID from input

*If missing, prompt:**

```
📝 Enter story ID of worktree to remove:
   Run list-worktrees to see available worktrees.
```

---

### Step 3: Check Worktree Exists

*Action:** Verify worktree exists

```javascript
const WorktreeManager = require('./worktree-manager.js');
const manager = new WorktreeManager();
const exists = await manager.exists(storyId);
```

*If not exists:**

```
❌ Worktree not found for story '{storyId}'.

Available worktrees:
{list from manager.list()}

Did you mean one of these?
```

---

### Step 4: Get Worktree Info

*Action:** Retrieve worktree details

```javascript
const worktree = await manager.get(storyId);
```

*Display:**

```
📁 Worktree Details

Story:              {storyId}
Path:               .kord-aios/worktrees/{storyId}
Branch:             auto-claude/{storyId}
Created:            {createdAt}
Uncommitted:        {uncommittedChanges} files
Status:             {status}
```

---

### Step 5: Check Uncommitted Changes

*Action:** Warn if there are uncommitted changes

```javascript
if (worktree.uncommittedChanges > 0 && !force) {
  // Prompt for confirmation
}
```

*Warning:**

```
⚠️  WARNING: Uncommitted Changes Detected!

This worktree has {uncommittedChanges} uncommitted changes.
Removing it will PERMANENTLY DELETE these changes.

Files with changes:
  - src/component.tsx
  - src/utils.ts
  - ...

Options:
  1. Commit changes first    : cd .kord-aios/worktrees/{storyId} && git commit
  2. Merge to base branch    : merge-worktree {storyId}
  3. Force remove (lose data): remove-worktree {storyId} --force

Proceed with removal? [y/N]:
```

---

### Step 6: Confirm Removal (Interactive)

*Action:** Confirm before removal in interactive mode

```
🗑️  Confirm Removal

You are about to remove:
  • Worktree: .kord-aios/worktrees/{storyId}
  • Branch:   auto-claude/{storyId}

This action cannot be undone.

Type 'yes' to confirm:
```

---

### Step 7: Remove Worktree

*Action:** Execute removal

```javascript
await manager.remove(storyId, { force: options.force });
```

*This performs:**

1. `git worktree remove .kord-aios/worktrees/{storyId}`
2. `git branch -d auto-claude/{storyId}` (or -D if force)

---

### Step 8: Display Success

*Action:** Confirm removal completed

```
╔══════════════════════════════════════════════════════════════╗
║  ✅ Worktree Removed Successfully                            ║
╚══════════════════════════════════════════════════════════════╝

Removed:
  • Worktree: .kord-aios/worktrees/{storyId}
  • Branch:   auto-claude/{storyId}

Remaining worktrees: {count.total}

Run list-worktrees to see remaining worktrees.
```

---

### Return Value

```typescript
{
  removed: boolean; // true if successfully removed
  storyId: string; // The story ID that was removed
}
```

---

## Validation

- [ ] Worktree directory no longer exists
- [ ] Branch no longer exists (unless merged to another branch)
- [ ] Worktree no longer appears in list

---

### Worktree Not Found

*Error:**

```
❌ Worktree not found for story '{storyId}'.
```

*Resolution:** Check story ID with `list-worktrees`.

### Currently Inside Worktree

*Error:**

```
❌ Cannot remove worktree while inside it.

   Current directory: .kord-aios/worktrees/{storyId}

   Please navigate out first:
     cd {projectRoot}
```

*Resolution:** `cd` out of the worktree first.

### Uncommitted Changes (without --force)

*Error:**

```
⚠️  Worktree has uncommitted changes.

    Use --force to remove anyway:
      remove-worktree {storyId} --force

    Or commit/merge changes first.
```

*Resolution:** Use `--force` or handle changes.

### Git Command Failed

*Error:**

```
❌ Failed to remove worktree: {error.message}
```

*Resolution:** Check git status, may need manual cleanup.

---

## Manual Cleanup

If automatic removal fails:

```bash
# Remove worktree
git worktree remove .kord-aios/worktrees/{storyId} --force

# Delete branch
git branch -D auto-claude/{storyId}

# Prune worktree references
git worktree prune
```

---

### Git Commands Used

- `git worktree remove` - Remove worktree
- `git branch -d/-D` - Delete branch

---

## Related

- *Story:** 1.3 - CLI Commands for Worktree Management
- *Tasks:** `create-worktree.md`, `list-worktrees.md`, `cleanup-worktrees.md`

---

## Command Registration

This task is exposed as CLI command `remove-worktree` in @devops agent:

```yaml
commands:
  - 'remove-worktree {storyId}': Remove worktree (confirms first)
  - 'remove-worktree {storyId} --force': Force remove with uncommitted changes
```

---

*Status:** ✅ Production Ready
*Tested On:** Windows, Linux, macOS
*Git Requirement:** git >= 2.5 (worktree support)
