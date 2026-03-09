---
name: validate-next-story
description: "Validate Next Story Task methodology and workflow"
agent: sm
subtask: false
template: checklist-story-draft.md
---

# Validate Next Story

## Purpose
To comprehensively validate a story draft before implementation begins, ensuring it is complete, accurate, and provides sufficient context for successful development. This task identifies issues and gaps that need to be addressed, preventing hallucinations and ensuring implementation readiness.

## Execution Modes
Choose your execution mode:
- **1. YOLO Mode**: Fast, Autonomous (0-1 prompts). Minimal user interaction.
- **2. Interactive Mode [DEFAULT]**: Balanced, Educational (5-10 prompts). Explicit decision checkpoints.
- **3. Pre-Flight Planning**: Comprehensive Upfront Planning. Zero ambiguity execution.

## Story Status Lifecycle
The story must follow these status transitions:
1. `DRAFT`: Initial creation phase.
2. `READY`: After validation (this skill changes status DRAFT -> READY on GO).
3. `IN_PROGRESS`: Currently being worked on by a developer.
4. `REVIEW`: Development complete, pending QA gate.
5. `DONE`: QA passed, merged, and fully accepted.

## Pre-Conditions
- Validation rules loaded.
- Target story available for validation.
- Project onboarding context is available (prefer `.kord/rules/project-mode.md` if present).
- Required templates are available in `.kord/templates/` (e.g. `.kord/templates/checklist-story-draft.md`).

## Sequential Task Execution

### 1. Template Completeness Validation
- Load `.kord/templates/story.md` and extract all section headings.
- **Missing sections check**: Compare story sections against template sections to verify all required sections are present.
- **Placeholder validation**: Ensure no template placeholders remain unfilled (e.g., `{{EpicNum}}`, `{{role}}`, `_TBD_`).
- **Structure compliance**: Verify the story follows the template structure and formatting strictly.

### 2. Executor Assignment Validation
- **Required Fields**: `executor` and `quality_gate` must be present and not empty.
- **Constraint Validation (CRITICAL)**: `executor != quality_gate`. An agent cannot be their own quality gate.
- **Role Consistency**:
  - Code/Logic -> `@dev` (QA by `@architect`)
  - Schema/DB -> `@data-engineer` (QA by `@dev`)
  - UI Components -> `@ux-design-expert` (QA by `@dev`)
  - Architecture -> `@architect` (QA by `@pm`)

### 3. File Structure and Source Tree Validation
- Validate paths using GitHub CLI or local file system exploration.
- **File paths clarity**: Are new/existing files to be created/modified clearly specified?
- **Directory structure**: Are new directories/components properly located according to the project structure documentation?
- **Path accuracy**: Are file paths consistent with project structure from architecture docs?

### 4. UI/Frontend Completeness Validation (If Applicable)
- **Component specifications**: Are UI components sufficiently detailed for implementation?
- **Styling/design guidance**: Is visual implementation guidance clear?
- **User interaction flows**: Are UX patterns and behaviors specified?
- **Responsive/accessibility**: Are these considerations addressed if required?

### 5. Acceptance Criteria Satisfaction Assessment
- **AC coverage**: Will all acceptance criteria be satisfied by the listed tasks?
- **AC testability**: Are acceptance criteria measurable and verifiable?
- **Missing scenarios**: Are edge cases or error conditions covered?
- **Task-AC mapping**: Are tasks properly linked to specific acceptance criteria?

### 6. Validation and Testing Instructions Review
- **Test approach clarity**: Are testing methods clearly specified?
- **Validation steps**: Are acceptance criteria validation steps clear?
- **Testing tools/frameworks**: Are required testing tools specified?

### 7. Tasks/Subtasks Sequence Validation
- **Logical order**: Do tasks follow a proper implementation sequence?
- **Dependencies**: Are task dependencies clear and correct?
- **Granularity**: Are tasks appropriately sized and actionable?
- **Blocking issues**: Are there any tasks that would block others?

### 8. Anti-Hallucination Verification
- **Source verification**: Every technical claim must be traceable to source documents.
- **Architecture alignment**: Dev Notes content matches architecture specifications.
- **No invented details**: Flag any technical decisions not supported by source documents.
- **Fact checking**: Cross-reference claims against epic and architecture documents.

### 9. Dev Agent Implementation Readiness
- **Self-contained context**: Can the story be implemented without reading external docs?
- **Clear instructions**: Are implementation steps unambiguous?
- **Actionability**: Are all tasks actionable by a development agent?

## Expected Output Format

Provide a structured validation report including:

```text
Validation Report
- Story: <epic.story>
- Status: GO | NO-GO

Template Compliance
- Missing sections: <list>
- Placeholders left: <list>

Critical Issues (Must Fix - Story Blocked)
- <list of essential missing info, inaccurate claims>

Should-Fix Issues (Important Quality Improvements)
- <list of unclear guidance, sequencing problems>

Anti-Hallucination Findings
- <list of unverifiable claims, missing references>

Implementation Readiness
- Score: X/10
- Confidence: High/Medium/Low
```

## Decision Checkpoints
- **GO**: Story is ready for implementation. Update status to `READY`. Expected next command: `develop <story-id>`
- **NO-GO**: Story requires fixes before implementation. Keep status as `DRAFT`.

## Anti-Patterns
- Approving a story with missing essential information.
- Ignoring unresolved placeholders.
- Allowing `executor == quality_gate`.
- Overlooking unverified or hallucinated technical claims.
- Producing non-English content.
