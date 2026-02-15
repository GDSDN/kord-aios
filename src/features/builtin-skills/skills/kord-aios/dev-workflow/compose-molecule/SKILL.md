---
name: compose-molecule
description: "Compose Molecule from Atoms methodology and workflow"
agent: dev
subtask: false
---

# Compose Molecule from Atoms

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

*Strategy:** retry

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

Build molecule component by composing existing atoms following Atomic Design methodology. Examples: FormField (Label + Input), Card (Heading + Text + Button), SearchBar (Input + Button).

## Prerequisites

- Setup completed
- Atom components exist (dependencies)
- Tokens loaded

### Steps

1. *Validate Atom Dependencies** - Check required atoms exist
2. *Generate Molecule Component** - Compose atoms with molecule logic
3. *Generate Molecule Styles** - Molecule-specific layout and spacing
4. *Generate Tests** - Test molecule composition and interactions
5. *Generate Stories** - Show molecule with different atom combinations
6. *Generate Documentation** - Document composed structure
7. *Update Index** - Export molecule
8. *Update State** - Track molecule built

## Output

- Molecule component (TypeScript)
- Molecule styles (CSS Modules)
- Tests (>80% coverage)
- Stories (optional)
- Documentation

## Success Criteria

- [ ] All atom dependencies imported correctly
- [ ] Molecule composes atoms (not reimplements)
- [ ] Molecule-specific logic isolated
- [ ] Tests cover atom interactions
- [ ] Accessible (WCAG AA)

## Example

```typescript
// FormField.tsx (molecule)
import { Label } from '../atoms/Label';
import { Input, InputProps } from '../atoms/Input';
import { HelperText } from '../atoms/HelperText';

export interface FormFieldProps extends InputProps {
  label: string;
  helperText?: string;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  helperText,
  error,
  ...inputProps
}) => {
  return (
    <div className={styles.formField}>
      <Label htmlFor={inputProps.id}>{label}</Label>
      <Input {...inputProps} error={!!error} />
      {error && <HelperText variant="error">{error}</HelperText>}
      {!error && helperText && <HelperText>{helperText}</HelperText>}
    </div>
  );
};
```

## Notes

- Molecules compose atoms, don't reimplement
- Molecule adds composition logic only
- Atoms remain independent and reusable
- Test atom interactions in molecule context
