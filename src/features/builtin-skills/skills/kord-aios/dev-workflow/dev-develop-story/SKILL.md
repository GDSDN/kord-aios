---
name: dev-develop-story
description: "Execute story development with selectable automation modes to accommodate different developer preferences, skill levels, and story complexity."
agent: dev
subtask: false
---

# Develop Story Task

## Purpose
Execute story development with selectable automation modes to accommodate different developer preferences, skill levels, and story complexity. Catch and auto-fix code quality issues before marking a story as "Ready for Review".

## Execution Modes
Choose your execution mode:
- **1. YOLO Mode**: Fast, Autonomous (0-1 prompts). Minimal user interaction.
- **2. Interactive Mode [DEFAULT]**: Balanced, Educational (5-10 prompts). Explicit decision checkpoints.
- **3. Pre-Flight Planning**: Comprehensive Upfront Planning. Zero ambiguity execution.

**Usage Modes**:
You can execute this skill in interactive mode (default), YOLO mode for autonomous execution, or pre-flight mode for comprehensive planning.

## Templates
When working with stories, ALWAYS use the provided Kord templates:
- Story creation/updates: `.kord/templates/story.md`
- Definition of Done checks: `.kord/templates/checklist-story-dod.md`

## Pre-flight checks / Non-negotiables / Quality gates (advisory)

### Gate 1: Story-Driven Development
- Story file MUST exist at `docs/kord/stories/{storyId}.md` using the `.kord/templates/story.md` template.
- Story MUST have status `READY` or `IN_PROGRESS`.
- Status Lifecycle: `DRAFT` -> `READY` -> `IN_PROGRESS` -> `REVIEW` -> `DONE`.
- This skill updates status from `READY` to `IN_PROGRESS` upon starting, and `IN_PROGRESS` to `REVIEW` upon completion.
- Story MUST have acceptance criteria defined.
- Story MUST have at least one task/subtask.
- If missing, halt execution and request a valid story.

### Gate 2: CLI First
- If a story involves new functionality, CLI implementation SHOULD exist or be created first.
- UI components SHOULD NOT be created before CLI is functional.
- Reminder: CLI First → Observability Second → UI Third.

## Workflow

### 1. Initialization
- Read story file completely.
- Extract story path from context.
- Identify all tasks and acceptance criteria.
- Analyze technical requirements.

### 2. Task Execution
- Read the next task.
- **Make autonomous decisions** and LOG immediately:
  - Architecture choices (e.g., Use microservices architecture for user service).
  - Library selections (e.g., Use Axios for HTTP client).
  - Algorithm implementations (e.g., Use binary search for user lookup).
- Implement task and subtasks.
- **Track file modifications**:
  - `src/api/users.js` (created)
  - `package.json` (modified)
  - `src/legacy/old-api.js` (deleted)
- Write tests.
- Execute validations.
- **Track test execution**:
  - `users.test.js` (passed, duration)
- Mark task complete `[x]` only if ALL validations pass.
- Update File List.

### 3. Decision Logging (Automatic)
- All decisions tracked in memory during execution.
- File operations logged automatically.
- Test results recorded.
- Metrics collected (execution time, agent load time).
- **Format**: ADR (Architecture Decision Record) compliant.

### 4. Completion
- All tasks complete.
- All tests pass.
- Verify completion against `.kord/templates/checklist-story-dod.md`.
- Update story status to `REVIEW`.
- Generate decision log: `.ai/decision-log-{story-id}.md` (ADR format).

## Decision Log Format (ADR Compliant)

**File**: `.ai/decision-log-{story-id}.md`

**Format**: ADR (Architecture Decision Record)

**Sections**:
1. **Context** - Story info, execution time, files modified, tests run.
2. **Decisions Made** - All autonomous decisions with type/priority classification.
3. **Rationale & Alternatives** - Why each choice was made, what else was considered.
4. **Implementation Changes** - Files created/modified/deleted, test results.
5. **Consequences & Rollback** - Git commit hash, rollback instructions, performance impact.

## CodeRabbit Self-Healing Loop (Story 6.3.3)

**Purpose**: Catch and auto-fix code quality issues before moving story to `REVIEW` status.

**Configuration**: Light self-healing (max 2 iterations, CRITICAL issues only).

### When to Execute
Execute **AFTER** all tasks are complete but **BEFORE** running the DOD checklist.

### Severity Handling
| Severity | Behavior | Notes |
|----------|----------|-------|
| **CRITICAL** | Auto-fix (max 2 attempts) | Security vulnerabilities, breaking bugs |
| **HIGH** | Document in story Dev Notes | Recommend fix before QA |
| **MEDIUM** | Ignore | `@qa` will handle |
| **LOW** | Ignore | Nits, not blocking |

### Timeout
- **Default**: 15 minutes per CodeRabbit run.
- **Total max**: ~30 minutes (2 iterations).

### Workflow logic:
1. Run CodeRabbit CLI.
2. Parse output for severity levels.
3. IF no CRITICAL issues:
   - Document HIGH issues in story Dev Notes.
   - Proceed to DOD checklist.
4. IF CRITICAL issues found:
   - Attempt auto-fix for each issue.
   - Increment iteration counter.
   - Continue loop.
5. IF iteration == 2 AND CRITICAL issues remain:
   - HALT and report to user.
   - DO NOT mark story complete.

## Common Errors
- **Task Not Found**: Specified task not registered in system. Verify task name.
- **Invalid Parameters**: Task parameters do not match expected schema.
- **Execution Timeout**: Task exceeds maximum execution time. Optimize task or increase timeout.

## Expected Output Format

```text
Decision Log: Story 6.1.2.6.2
- Generated: 2025-11-16T14:30:00.000Z
- Agent: dev
- Mode: Yolo (Autonomous Development)
- Story: docs/kord/stories/story-6.1.2.6.2.md
- Rollback: `git reset --hard abc123def456`

Context
- Story Implementation: 6.1.2.6.2
- Execution Time: 15m 30s
- Status: completed
- Files Modified: 5 files
- Tests Run: 8 tests

Decisions Made
- Decision 1: Use Axios for HTTP client
  - Rationale: Better error handling, interceptor support.
  - Alternatives: Fetch API, node-fetch.
```

## Anti-Patterns
- Skipping tests or validations before marking a task complete.
- Ignoring CRITICAL issues identified by CodeRabbit.
- Failing to log decisions in the ADR format.
- Modifying the original Story, Acceptance Criteria, or Dev Notes sections directly.
- Producing non-English content.
