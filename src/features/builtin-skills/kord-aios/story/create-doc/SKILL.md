---
name: create-doc
description: "Template selection determined dynamically during task execution methodology and workflow"
agent: sm
subtask: false
---

# Template selection determined dynamically during task execution

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

## Execution Dependencies

*Utils:** template-engine, template-validator

## ⚠️ CRITICAL EXECUTION NOTICE ⚠️

*THIS IS AN EXECUTABLE WORKFLOW - NOT REFERENCE MATERIAL**

When this task is invoked:

1. *DISABLE ALL EFFICIENCY OPTIMIZATIONS** - This workflow requires full user interaction
2. *MANDATORY STEP-BY-STEP EXECUTION** - Each section must be processed sequentially with user feedback
3. *ELICITATION IS REQUIRED** - When `elicit: true`, you MUST use the 1-9 format and wait for user response
4. *NO SHORTCUTS ALLOWED** - Complete documents cannot be created without following this workflow

*VIOLATION INDICATOR:** If you create a complete document without user interaction, you have violated this workflow.

## Critical: Template Discovery

If a YAML Template has not been provided, list all templates from templates or ask the user to provide another.

## CRITICAL: Mandatory Elicitation Format

*When `elicit: true`, this is a HARD STOP requiring user interaction:**

*YOU MUST:**

1. Present section content
2. Provide detailed rationale (explain trade-offs, assumptions, decisions made)
3. *STOP and present numbered options 1-9:**
   - *Option 1:** Always "Proceed to next section"
   - *Options 2-9:** Select 8 methods from data/elicitation-methods
   - End with: "Select 1-9 or just type your question/feedback:"
4. *WAIT FOR USER RESPONSE** - Do not proceed until user selects option or provides feedback

*WORKFLOW VIOLATION:** Creating content for elicit=true sections without user interaction violates this task.

*NEVER ask yes/no questions or use any other format.**

## Processing Flow

1. *Parse YAML template** - Load template metadata and sections
2. *Set preferences** - Show current mode (Interactive), confirm output file
3. *Process each section:**
   - Skip if condition unmet
   - Check agent permissions (owner/editors) - note if section is restricted to specific agents
   - Draft content using section instruction
   - Present content + detailed rationale
   - *IF elicit: true** → MANDATORY 1-9 options format
   - Save to file if possible
4. *Continue until complete**

## Detailed Rationale Requirements

When presenting section content, ALWAYS include rationale that explains:

- Trade-offs and choices made (what was chosen over alternatives and why)
- Key assumptions made during drafting
- Interesting or questionable decisions that need user attention
- Areas that might need validation

## Elicitation Results Flow

After user selects elicitation method (2-9):

1. Execute method from data/elicitation-methods
2. Present results with insights
3. Offer options:
   - **1. Apply changes and update section**
   - **2. Return to elicitation menu**
   - **3. Ask any questions or engage further with this elicitation**

## Agent Permissions

When processing sections with agent permission fields:

- *owner**: Note which agent role initially creates/populates the section
- *editors**: List agent roles allowed to modify the section
- *readonly**: Mark sections that cannot be modified after creation

*For sections with restricted access:**

- Include a note in the generated document indicating the responsible agent
- Example: "_(This section is owned by dev-agent and can only be modified by dev-agent)_"

## YOLO Mode

User can type `#yolo` to toggle to YOLO mode (process all sections at once).

## CRITICAL REMINDERS

**❌ NEVER:**

- Ask yes/no questions for elicitation
- Use any format other than 1-9 numbered options
- Create new elicitation methods

**✅ ALWAYS:**

- Use exact 1-9 format when elicit: true
- Select options 2-9 from data/elicitation-methods only
- Provide detailed rationale explaining decisions
- End with "Select 1-9 or just type your question/feedback:"
