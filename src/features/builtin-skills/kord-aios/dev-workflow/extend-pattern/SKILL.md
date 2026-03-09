---
name: extend-pattern
description: "Extend Existing Pattern methodology and workflow"
agent: dev
subtask: false
---

# Extend Existing Pattern

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
  - [ ] Changes applied correctly; original backed up; rollback possible
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert changes applied correctly; original backed up; rollback possible
    error_message: "Acceptance criterion not met: Changes applied correctly; original backed up; rollback possible"
```

---

## Error Handling

*Strategy:** retry

*Common Errors:**

1. *Error:** Target Not Found
   - *Cause:** Specified resource does not exist
   - *Resolution:** Verify target exists before modification
   - *Recovery:** Suggest similar resources or create new

2. *Error:** Backup Failed
   - *Cause:** Unable to create backup before modification
   - *Resolution:** Check disk space and permissions
   - *Recovery:** Abort modification, preserve original state

3. *Error:** Concurrent Modification
   - *Cause:** Resource modified by another process
   - *Resolution:** Implement file locking or retry logic
   - *Recovery:** Retry with exponential backoff or merge changes

---

## Description

Add new variant, size, or feature to existing component without breaking compatibility. Maintains consistency with design system patterns.

## Prerequisites

- Component exists
- Design system setup complete
- Tokens available for new variant

### Steps

1. *Load Existing Component** - Read component file and structure
2. *Validate Extension Request** - Check compatibility with existing API
3. *Add New Variant/Size** - Extend props and implementation
4. *Update Styles** - Add new variant styles using tokens
5. *Update Tests** - Add tests for new variant
6. *Update Stories** - Add story for new variant
7. *Update Documentation** - Document new variant
8. *Validate Backward Compatibility** - Ensure existing usage still works

## Output

- Updated component file
- Updated styles
- Updated tests
- Updated documentation

## Success Criteria

- [ ] New variant implemented correctly
- [ ] Backward compatible (existing code works)
- [ ] Tests updated and passing
- [ ] Documentation reflects changes
- [ ] No breaking changes

## Example

```bash
extend button --variant warning

Atlas: "Adding 'warning' variant to Button..."
✓ Updated Button.tsx (new variant prop)
✓ Updated Button.module.css (warning styles)
✓ Updated Button.test.tsx (warning tests)
✓ Updated Button.stories.tsx (warning story)
✓ Backward compatibility: ✓

Warning variant uses:
  - color: var(--color-warning)
  - color (hover): var(--color-warning-dark)
```

## Notes

- Maintain prop interface compatibility
- Add, don't replace
- Test existing variants still work
- Document migration if API changes
