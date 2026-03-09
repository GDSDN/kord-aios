---
name: dev-apply-qa-fixes
description: "Ap methodology and workflow"
agent: qa
subtask: false
---

# Ap

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

## Purpose

When a story receives QA feedback, this task helps developers:
- Review QA gate findings systematically
- Prioritize issues by severity
- Apply fixes while maintaining code quality
- Re-validate after changes

## Instructions

1. *Load QA Gate Report**

   - If user provides a gate file path, load it directly
   - Otherwise, check the story file for `gate_file` reference in `qa_results` section
   - If no gate file specified, ask user for the QA gate file path
   - Load the QA gate YAML file from docs/qa/gates/

2. *Review Findings**

   - Read through all issues identified in the QA gate report
   - Note the quality score and gate status
   - Categorize issues by type:
     - ❌ BLOCKING: Must fix before approval
     - ⚠️ WARNING: Should fix, impacts quality score
     - 💡 RECOMMENDATION: Nice to have improvements
   - Prioritize issues by severity and impact

3. *Create Fix Plan**

   - For each BLOCKING issue:
     - Identify affected files
     - Determine root cause
     - Plan specific fix approach
   - Group related issues that can be fixed together
   - Estimate effort for each fix

4. *Apply Fixes Systematically**

   For each issue:
   - Make the necessary code or documentation changes
   - Follow coding standards and best practices
   - Update tests if needed
   - Verify the fix resolves the specific issue
   - Update story file list if new files created/modified

5. *Validation**

   After applying all fixes:
   - Run linting: `npm run lint`
   - Run tests: `npm test`
   - Run type checking if applicable: `npm run typecheck`
   - Verify all BLOCKING issues are resolved
   - Check that quality score improvements are expected

6. *Update Story Record**

   - Update the story's Dev Agent Record section:
     - Add completion note about QA fixes applied
     - Update file list with any new/modified files
     - Reference the QA gate file in debug log if needed
   - Do NOT modify the qa_results section (that's for QA reviewer)

7. *Re-submission**

   - Confirm all BLOCKING issues resolved
   - Verify regression tests still pass
   - Inform user that story is ready for QA re-review
   - Optionally update story status to indicate "QA Fixes Applied"

## Best Practices

- *Address root causes**: Don't just fix symptoms, understand and fix the underlying issue
- *Maintain test coverage**: If you modify code, update or add tests
- *Follow patterns**: Use existing codebase patterns for consistency
- *Document complex fixes**: Add comments explaining non-obvious changes
- *Validate thoroughly**: Run full test suite, not just affected tests
- *Communicate clearly**: Update story notes with summary of changes made

### Code Quality Issues

- Linting errors or warnings
- Code style inconsistencies
- Missing error handling
- Unused variables or imports
- Complex functions needing refactoring

### Testing Issues

- Missing test cases
- Failing tests
- Insufficient test coverage
- Flaky tests

### Documentation Issues

- Missing or incomplete comments
- Outdated documentation
- Missing or incorrect README updates
- Incomplete story file updates

### Architecture Issues

- Violations of coding standards
- Improper dependency usage
- Performance concerns
- Security vulnerabilities

## Exit Criteria

This task is complete when:
- ✅ All BLOCKING issues from QA gate are resolved
- ✅ All tests pass (linting, unit, integration)
- ✅ Story file is updated with changes
- ✅ Code is ready for QA re-review
