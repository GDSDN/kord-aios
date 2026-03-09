---
name: create-next-story
description: "Create Next Story Task methodology and workflow"
agent: sm
subtask: false
template: story.md
---

# Create Next Story

## Purpose
Identify the next logical story based on project progress and epic definitions. Prepare a comprehensive, self-contained, and actionable story file using the Story Template. Ensure the story is enriched with all necessary technical context, requirements, and acceptance criteria, making it ready for efficient implementation by a Developer Agent with minimal need for additional research.

## Story Status Lifecycle
The story must follow these status transitions:
1. `DRAFT`: Initial creation phase (this skill).
2. `READY`: After validation and ready for development.
3. `IN_PROGRESS`: Currently being worked on by a developer.
4. `REVIEW`: Development complete, pending QA gate.
5. `DONE`: QA passed, merged, and fully accepted.

## Pre-Conditions
- Epic files and project requirements must exist in the defined `prd` locations.
- Required templates are available in `.kord/templates/`.
- No active blocks on the epic progression.

## Sequential Task Execution

### 1. Identify Next Story
- Locate Epic Files and Review Existing Stories in the repository.
- Determine the highest `{epicNum}.{storyNum}.story.md` file in the story location.
- Check if the highest story is "Done". If not, halt and warn: "ALERT: Found incomplete story! File: {lastEpicNum}.{lastStoryNum}.story.md"
- If the epic is complete, ask the user whether to move to the next epic or cancel. CRITICAL: NEVER automatically skip to another epic. The user MUST explicitly instruct which story to create.
- Identify the exact `{epicNum}.{storyNum}` for the new story based on sequencing.

### 2. Gather Requirements and Architecture Context
- **Story Context**: Extract story requirements from the Epic file. Review previous stories' Dev Agent Record sections for Completion Notes, Implementation Deviations, Debug Log References, and Challenges Encountered.
- **Architecture Context**: Read architecture documents based on the story type:
  - Backend/API: `data-models.md`, `database-schema.md`, `rest-api-spec.md`
  - Frontend/UI: `frontend-architecture.md`, `components.md`, `core-workflows.md`
  - All: `tech-stack.md`, `unified-project-structure.md`, `coding-standards.md`, `testing-strategy.md`
- **File Fallbacks**: If primary files are missing, check alternative naming conventions (e.g., `pilha-tecnologica.md` for `tech-stack.md`).
- Extract ONLY information directly relevant to the current story. Do NOT invent new libraries or patterns.
- ALWAYS cite source documents: `[Source: architecture/{filename}.md#{section}]`

### 3. Verify Project Structure Alignment
- Cross-reference story requirements with the unified project structure guide.
- Ensure file paths, component locations, or module names align with defined structures.
- Document any structural conflicts in a "Project Structure Notes" section within the story draft.
- Ensure new files won't violate existing structural constraints.

### 4. Predict Specialized Agents and QA Focus
- Determine the story type: Database, API, Frontend, Deployment, Security, Architecture, or Integration.
- Assign primary and supporting agents based on the type (e.g., `@db-sage` for Database, `@ux-expert` for Frontend).
- Define quality gate tasks (Pre-Commit by `@dev`, Pre-PR by DevOps, Pre-Deployment).
- Document focus areas for testing and validation:
  - API: Error handling, validation, security
  - UI: Accessibility, responsiveness, performance
  - DB: Schema compliance, indexes, foreign keys

### 5. Populate Story Template with Full Context
- Create a new story file: `{devStoryLocation}/{epicNum}.{storyNum}.story.md` using the `.kord/templates/story.md` template.
- Fill in Title, Status (Draft), Story statement, and Acceptance Criteria.
- **Dev Notes (CRITICAL)**: MUST contain ONLY information extracted from architecture documents. Include Previous Story Insights, Data Models, API Specifications, Component Specifications, File Locations, and Testing Requirements.
- **Tasks / Subtasks**: Generate detailed, sequential lists of technical tasks based ONLY on Epic Requirements, Story AC, and Reviewed Architecture Information.
  - Link tasks to ACs (e.g., `Task 1 (AC: 1, 3)`).
  - Include unit testing as explicit subtasks.

### 6. Review and Decision Checkpoints
- Execute `.kord/templates/checklist-story-draft.md` checklist.
- Review all sections for completeness and accuracy.
- Verify all source references are included for technical details.
- Update status to "Draft" and save the story file.
- Provide a clear summary to the user outlining the technical components and tasks drafted.

## Expected Output Format

```text
Story Created
- ID: <epic.story>
- Path: <story-file-path>
- Status: DRAFT

Coverage Summary
- Acceptance Criteria Count: <n>
- Task/Subtask Count: <n>
- Architecture References: <list>

Checklist Result
- Draft checklist: PASS|FAIL
- Blockers fixed: <yes/no>

Decision Checkpoints
- Architecture alignment verified: [Yes/No]
- Duplicate story checked: [Yes/No]

Next Transition
- Recommended command: validate-next-story <story-id>
- Expected next status: READY
```

## Anti-Patterns
- Writing implementation code while drafting stories.
- Upgrading status beyond `DRAFT` in this phase.
- Including technical claims without source grounding (Hallucination).
- Leaving unresolved placeholders in the final output.
- Generating generic, non-actionable subtasks.
- Producing non-English content.
