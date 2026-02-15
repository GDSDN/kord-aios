---
name: qa-run-tests
description: "Run Tests (with Code Quality Gate) methodology and workflow"
agent: qa
subtask: false
---

# Run Tests (with Code Quality Gate)

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
  - [ ] Validation rules applied; pass/fail accurate; actionable feedback
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert validation rules applied; pass/fail accurate; actionable feedback
    error_message: "Acceptance criterion not met: Validation rules applied; pass/fail accurate; actionable feedback"
```

---

## Error Handling

*Strategy:** retry

*Common Errors:**

1. *Error:** Validation Criteria Missing
   - *Cause:** Required validation rules not defined
   - *Resolution:** Ensure validation criteria loaded from config
   - *Recovery:** Use default validation rules, log warning

2. *Error:** Invalid Schema
   - *Cause:** Target does not match expected schema
   - *Resolution:** Update schema or fix target structure
   - *Recovery:** Detailed validation error report

3. *Error:** Dependency Missing
   - *Cause:** Required dependency for validation not found
   - *Resolution:** Install missing dependencies
   - *Recovery:** Abort with clear dependency list

---

### 1. Run Unit Tests

```bash
cd api
npm run test
```

*Expected**: All tests pass, coverage >= 80%

### 2. Run Integration Tests

```bash
npm run test:integration
```

### 3. Code Quality Review

```bash
# Review code that was tested
coderabbit --prompt-only -t uncommitted
```

*Parse output**:
- If CRITICAL or HIGH issues found → FAIL
- If only MEDIUM/LOW → WARN but PASS

### 4. Generate QA Report

Use template: `qa-gate-tmpl.yaml`

Include:
- Test results (pass/fail, coverage %)
- CodeRabbit summary (issues by severity)
- Recommendation (approve/reject story)

### 5. Update Story Status

If all pass:
- [ ] Mark story testing complete
- [ ] Add QA approval comment
- [ ] Move to "Ready for Deploy"

If failures:
- [ ] Document failures in story
- [ ] Create tech debt issues for MEDIUM
- [ ] Request fixes from @dev

## Integration with CodeRabbit

*CodeRabbit helps @qa agent**:
- Catch issues tests might miss (logic errors, race conditions)
- Validate security patterns (SQL injection, hardcoded secrets)
- Enforce coding standards automatically
- Generate quality metrics

## Config

```yaml
codeRabbit:
  enabled: true
  severity_threshold: high
  auto_fix: false  # QA reviews but doesn't auto-fix
  report_location: docs/qa/coderabbit-reports/
```
