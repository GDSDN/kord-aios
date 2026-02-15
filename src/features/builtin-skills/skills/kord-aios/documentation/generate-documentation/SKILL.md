---
name: generate-documentation
description: "Generate Pattern Library Documentation methodology and workflow"
agent: dev
subtask: false
---

# Generate Pattern Library Documentation

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
  - [ ] Resource exists and is valid; no duplicate resources created
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert resource exists and is valid; no duplicate resources created
    error_message: "Acceptance criterion not met: Resource exists and is valid; no duplicate resources created"
```

---

## Error Handling

*Strategy:** fallback

*Common Errors:**

1. *Error:** Resource Already Exists
   - *Cause:** Target file/resource already exists in system
   - *Resolution:** Use force flag or choose different name
   - *Recovery:** Prompt user for alternative name or force overwrite

2. *Error:** Invalid Input
   - *Cause:** Input name contains invalid characters or format
   - *Resolution:** Validate input against naming rules (kebab-case, lowercase, no special chars)
   - *Recovery:** Sanitize input or reject with clear error message

3. *Error:** Permission Denied
   - *Cause:** Insufficient permissions to create resource
   - *Resolution:** Check file system permissions, run with elevated privileges if needed
   - *Recovery:** Log error, notify user, suggest permission fix

---

## Description

Generate comprehensive pattern library documentation from built components. Creates searchable, navigable docs with usage examples, prop tables, accessibility notes, and live previews.

## Prerequisites

- At least 1 component built
- Design system setup complete
- Component .md files exist

### Steps

1. *Scan Built Components** - Find all atoms, molecules, organisms
2. *Parse Component Metadata** - Extract props, types, variants
3. *Generate Pattern Library Index** - Main navigation page
4. *Generate Component Pages** - Detailed pages per component
5. *Generate Usage Examples** - Code snippets and live previews
6. *Generate Accessibility Guide** - WCAG compliance notes
7. *Generate Token Reference** - Token usage documentation
8. *Create Search Index** - Searchable component library

## Output

- *index.md**: Pattern library homepage
- *components/{Component}.md**: Per-component pages
- *tokens.md**: Token reference guide
- *accessibility.md**: Accessibility guidelines
- *getting-started.md**: Setup and usage guide

## Success Criteria

- [ ] All components documented
- [ ] Props documented with types
- [ ] Usage examples for each variant
- [ ] Accessibility notes included
- [ ] Searchable and navigable
- [ ] Up-to-date with latest components

## Example

```bash
document
```

Output:
```
📚 Atlas: Generating pattern library documentation...

Scanning components:
  ✓ 8 atoms found
  ✓ 5 molecules found
  ✓ 2 organisms found

Generating documentation:
  ✓ index.md (pattern library home)
  ✓ components/Button.md
  ✓ components/Input.md
  ✓ components/FormField.md
  ...
  ✓ tokens.md (token reference)
  ✓ accessibility.md (WCAG guide)
  ✓ getting-started.md

✅ Pattern library: design-system/docs/

Atlas says: "Documentation is code. Keep it fresh."
```

## Notes

- Auto-generates from TypeScript types
- Updates when components change
- Includes live Storybook links (if enabled)
- Searchable by component name, prop, or token
