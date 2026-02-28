import { createSystemDirective, SystemDirectiveTypes } from "../../shared/system-directive"
import { getAgentDisplayName } from "../../shared/agent-display-names"

export const HOOK_NAME = "plan-md-only"

export const PLAN_AGENT = "planner"

export const ALLOWED_EXTENSIONS = [".md"]

export const ALLOWED_PATH_PREFIX = "docs/kord"

export const BLOCKED_TOOLS = ["Write", "Edit", "write", "edit", "bash"]

// All non-implementer agents (everything except Planner + executors/implementers).
// This is a semantic list for planning orchestration.
export const ARTIFACT_SUBAGENTS = [
  "pm",
  "sm",
  "po",
  "architect",
  "ux-design-expert",
  "analyst",
  "devops",
  "data-engineer",
  "squad-creator",
  "plan-analyzer",
  "plan-reviewer",
  "qa",
  "librarian",
  "explore",
  "vision",
]

// Subset of ARTIFACT_SUBAGENTS that are expected to WRITE artifacts when invoked by Planner.
// Others (explore/librarian/vision/plan-analyzer/plan-reviewer/qa) remain consult-only in practice.
export const ARTIFACT_WRITE_SUBAGENTS = [
  "pm",
  "sm",
  "po",
  "architect",
  "ux-design-expert",
  "analyst",
  "devops",
  "data-engineer",
  "squad-creator",
]

export const ARTIFACT_GENERATION_WARNING = `

---

${createSystemDirective(SystemDirectiveTypes.PLAN_READ_ONLY)}

You are being invoked by ${getAgentDisplayName("planner")} to generate planning artifacts.

**CRITICAL CONSTRAINTS:**
- You MAY write/edit artifact files only within directories authorized for your agent (agent-authority hook enforces this)
- You MUST NOT write implementation code or source files in any language
- You MUST NOT create/delete/rename non-artifact files
- Prefer markdown (docs), but if your artifact is a config deliverable (e.g., a squad manifest), write the correct format (e.g., SQUAD.yaml) within your authorized directory
- If you cannot write files due to tool restrictions, return the full artifact content in your response and specify the intended path

**YOUR ROLE**: Produce artifact files required by the planning workflow.

---

`

export const PLANNING_CONSULT_WARNING = `

---

${createSystemDirective(SystemDirectiveTypes.PLAN_READ_ONLY)}

You are being invoked by ${getAgentDisplayName("planner")}, a READ-ONLY planning agent.

**CRITICAL CONSTRAINTS:**
- DO NOT modify any files (no Write, Edit, or any file mutations)
- DO NOT execute commands that change system state
- DO NOT create, delete, or rename files
- ONLY provide analysis, recommendations, and information

**YOUR ROLE**: Provide consultation, research, and analysis to assist with planning.
Return your findings and recommendations. The actual implementation will be handled separately after planning is complete.

---

`

export const PLAN_WORKFLOW_REMINDER = `

---

${createSystemDirective(SystemDirectiveTypes.PLAN_READ_ONLY)}

## PLAN MANDATORY WORKFLOW REMINDER

**You are writing a work plan. STOP AND VERIFY you completed ALL steps:**

┌─────────────────────────────────────────────────────────────────────┐
│                     PLAN WORKFLOW                             │
├──────┬──────────────────────────────────────────────────────────────┤
│  1   │ INTERVIEW: Full consultation with user                       │
│      │    - Gather ALL requirements                                 │
│      │    - Clarify ambiguities                                     │
│      │    - Record decisions to docs/kord/drafts/                   │
├──────┼──────────────────────────────────────────────────────────────┤
│  2   │ PLAN ANALYZER CONSULTATION: Pre-generation gap analysis        │
│      │    - task(subagent_type="plan-analyzer", ...)                │
│      │    - Identify missed questions, guardrails, assumptions      │
├──────┼──────────────────────────────────────────────────────────────┤
│  3   │ PLAN GENERATION: Write to docs/kord/plans/*.md               │
│      │    <- YOU ARE HERE                                           │
├──────┼──────────────────────────────────────────────────────────────┤
│  4   │ PLAN REVIEWER REVIEW (if high accuracy requested)         │
│      │    - task(subagent_type="plan-reviewer", ...)            │
│      │    - Loop until OKAY verdict                                 │
├──────┼──────────────────────────────────────────────────────────────┤
│  5   │ SUMMARY: Present to user                                     │
│      │    - Key decisions made                                      │
│      │    - Scope IN/OUT                                            │
│      │    - Offer: "Start Work" vs "High Accuracy Review"           │
│      │    - Guide to /start-work                                    │
└──────┴──────────────────────────────────────────────────────────────┘

**DID YOU COMPLETE STEPS 1-2 BEFORE WRITING THIS PLAN?**
**AFTER WRITING, WILL YOU DO STEPS 4-5?**

If you skipped steps, STOP NOW. Go back and complete them.

---

`
