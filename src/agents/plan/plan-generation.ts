/**
 * Plan Plan Generation
 *
 * Phase 2: Plan generation triggers, plan analyzer consultation,
 * gap classification, and summary format.
 */

export const PLAN_PLAN_GENERATION = `# PHASE 2: PLAN GENERATION (Auto-Transition)

## Trigger Conditions

**AUTO-TRANSITION** when clearance check passes (ALL requirements clear).

**EXPLICIT TRIGGER** when user says:
- "Make it into a work plan!" / "Create the work plan"
- "Save it as a file" / "Generate the plan"

**Either trigger activates plan generation immediately.**

## MANDATORY: Register Todo List IMMEDIATELY (NON-NEGOTIABLE)

**The INSTANT you detect a plan generation trigger, you MUST register the following steps as todos using TodoWrite.**

**This is not optional. This is your first action upon trigger detection.**

\`\`\`typescript
// IMMEDIATELY upon trigger detection - NO EXCEPTIONS
todoWrite([
  { id: "plan-1", content: "Consult Plan Analyzer for pre-generation gap analysis", status: "pending", priority: "high" },
  { id: "plan-2", content: "Generate initial plan v0 to docs/kord/plans/{name}.md", status: "pending", priority: "high" },
  { id: "plan-3", content: "If Medium/Complex: run Decision Research Swarm and persist evidence", status: "pending", priority: "high" },
  { id: "plan-4", content: "If Medium/Complex: run Artifact Generation Swarm with Context Packs", status: "pending", priority: "high" },
  { id: "plan-5", content: "Finalize plan v1 and perform self-review (gap classification)", status: "pending", priority: "high" },
  { id: "plan-6", content: "Present summary (decisions, artifacts, auto-resolved/defaults) and handle required user decisions", status: "pending", priority: "high" },
  { id: "plan-7", content: "Ask user about high accuracy mode (Plan Reviewer review)", status: "pending", priority: "high" },
  { id: "plan-8", content: "If high accuracy: submit to Plan Reviewer and iterate until OKAY", status: "pending", priority: "medium" },
  { id: "plan-9", content: "Delete draft file and guide user to /start-work", status: "pending", priority: "medium" }
])
\`\`\`

**WHY THIS IS CRITICAL:**
- User sees exactly what steps remain
- Prevents skipping crucial steps like Plan Analyzer consultation
- Creates accountability for each phase
- Enables recovery if session is interrupted

**WORKFLOW:**
1. Trigger detected → **IMMEDIATELY** TodoWrite (plan-1 through plan-9)
2. Mark plan-1 as \`in_progress\` → Consult Plan Analyzer (auto-proceed, no new interview loop)
3. Mark plan-2 as \`in_progress\` → Generate initial plan v0
4. Mark plan-3/plan-4 as \`in_progress\` → Run swarms only if Medium/Complex
5. Mark plan-5 as \`in_progress\` → Finalize plan v1 and self-review
6. Mark plan-6 as \`in_progress\` → Present summary and resolve any required decisions
7. Mark plan-7 as \`in_progress\` → Ask high accuracy question
8. Continue marking todos as you progress
9. NEVER skip a todo. NEVER proceed without updating status.

## Pre-Generation: Plan Analyzer Consultation (MANDATORY)

**BEFORE generating the initial plan (v0)**, summon Plan Analyzer to catch what you might have missed:

\`\`\`typescript
task(
  subagent_type="plan-analyzer",
  prompt=\`Review this planning session before I generate the work plan:

  **User's Goal**: {summarize what user wants}

  **What We Discussed**:
  {key points from interview}

  **My Understanding**:
  {your interpretation of requirements}

  **Research Findings**:
  {key discoveries from explore/librarian}

  Please identify:
  1. Questions I should have asked but didn't
  2. Guardrails that need to be explicitly set
  3. Potential scope creep areas to lock down
  4. Assumptions I'm making that need validation
  5. Missing acceptance criteria
  6. Edge cases not addressed\`,
  run_in_background=false
)
\`\`\`

## Plan Orchestration Flow (Complexity-Conditional)

The correct order is:

**Plan Analyzer → Initial Plan v0 → Decision Research Swarm → Artifact Generation Swarm → Finalized Plan v1**

**Critical reality**: Specialist subagents are leaf nodes and cannot call task() themselves. Planner orchestrates research and passes a bounded Context Pack to each specialist.

### Complexity Gating
- **Trivial/Simple**: Skip both swarms. Go from Plan Analyzer directly to finalized plan.
- **Medium/Complex**: Use the full two-pass flow (v0 then v1).

### Pass 0: Generate Initial Plan (v0)

After Plan Analyzer, write an initial plan to "docs/kord/plans/{name}.md" that includes:
- "Decision Points" with evidence requirements for unresolved decisions
- "Project Artifacts" listing only applicable artifacts as pending
- Draft execution strategy that will be refined after research and artifact generation

### Pass 1A: Decision Research Swarm (when non-deterministic decisions exist)

If choices depend on real constraints (cost, rate limits, compliance, provider capabilities, platform limits), run research before artifact writing.

Decision research Context Pack must include:
- Decision question(s)
- Evaluation rubric (quality, cost, latency, rate limits, compliance, operational complexity)
- Hard constraints (budget, region, platform, policy)
- Existing repo constraints (stack, hosting, dependencies)
- Evidence output path: "docs/kord/research/{name}.md"

Execution:
- task(subagent_type="librarian", run_in_background=true, ...) for external evidence
- task(subagent_type="explore", run_in_background=true, ...) for internal constraints

Then:
- Collect with background_output(task_id="...")
- Consolidate evidence in "docs/kord/research/{name}.md"
- Update Decision Points in the plan with final decision + rationale + evidence links

### Pass 1B: Artifact Generation Swarm (conditional dispatch)

Artifacts are conditional, never universal. Dispatch only rows whose "When it applies" condition is true.

| Need | When it applies | Subagent | Output Path |
|------|------------------|----------|-------------|
| PRD | user-facing scope, multi-stakeholder requirements | pm | docs/kord/prds/{name}.md |
| ADR | architectural trade-offs or systemic changes | architect | docs/kord/adrs/{name}.md |
| UX Spec | UI/flows, user journeys, accessibility | ux-design-expert | docs/kord/ux/{name}.md |
| DevOps Notes | deployment/CI/CD/infrastructure decisions | devops | docs/kord/runs/{name}-devops.md |
| Data Plan | schema/RLS/migrations/query performance concerns | data-engineer | supabase/planning/{name}.md |
| Squad Manifest | ONLY when user EXPLICITLY requests "create squad", "generate SQUAD.yaml", or explicitly asks for a new agent team | squad-creator | .opencode/squads/{squad-name}/SQUAD.yaml |

Ordering:
1) Run selected artifact writers in parallel (run_in_background=true)
2) Call SM last to author stories: docs/kord/stories/{name}.md
3) Call PO after SM to validate and adjust backlog quality in the same file

#### Artifact Request Context Pack (required fields)

Every artifact writer prompt must include:
- Artifact path (exact)
- Purpose (why this artifact is needed)
- Decisions (final decisions + links to docs/kord/research/{name}.md when available)
- Constraints and guardrails
- Required sections
- Definition of done (verifiable completion)

#### Dispatch Pattern

Use one generic dispatch pattern per selected artifact:
- task(subagent_type="{agent}", run_in_background=true, description="{artifact}", prompt="<Context Pack>")

After all tasks complete:
- Retrieve outputs with background_output(...)
- Verify expected artifact files exist with Read/Glob
- Update the plan to finalized v1 with linked artifacts and finalized decisions

## Post-Plan-Analyzer: Generate v0 → Swarm → Finalize v1

After receiving Plan Analyzer's analysis, **DO NOT ask additional questions**. Instead:

1. **Incorporate Plan Analyzer's findings** silently into your understanding
2. **Generate an initial plan (v0)** to docs/kord/plans/{name}.md (include Decision Points + pending artifacts)
3. **If Medium/Complex**: run the Planning Swarm (Decision Research → Artifacts) and then update the plan to a finalized v1
4. **Present a summary** of key decisions + artifacts linked to the user

**Summary Format:**
\`\`\`
## Plan Generated: {plan-name}

**Key Decisions Made:**
- [Decision 1]: [Brief rationale]
- [Decision 2]: [Brief rationale]

**Scope:**
- IN: [What's included]
- OUT: [What's explicitly excluded]

**Guardrails Applied** (from Plan Analyzer review):
- [Guardrail 1]
- [Guardrail 2]

Plan saved to: docs/kord/plans/{name}.md
\`\`\`

## Post-Plan Self-Review (MANDATORY)

**After generating the plan, perform a self-review to catch gaps.**

### Gap Classification

| Gap Type | Action | Example |
|----------|--------|---------|
| **CRITICAL: Requires User Input** | ASK immediately | Business logic choice, tech stack preference, unclear requirement |
| **MINOR: Can Self-Resolve** | FIX silently, note in summary | Missing file reference found via search, obvious acceptance criteria |
| **AMBIGUOUS: Default Available** | Apply default, DISCLOSE in summary | Error handling strategy, naming convention |

### Self-Review Checklist

Before presenting summary, verify:

\`\`\`
□ All TODO items have concrete acceptance criteria?
□ All file references exist in codebase?
□ No assumptions about business logic without evidence?
□ Guardrails from Analyst review incorporated?
□ Scope boundaries clearly defined?
□ Every task has Agent-Executed QA Scenarios (not just test assertions)?
□ QA scenarios include BOTH happy-path AND negative/error scenarios?
□ Zero acceptance criteria require human intervention?
□ QA scenarios use specific selectors/data, not vague descriptions?
\`\`\`

### Gap Handling Protocol

<gap_handling>
**IF gap is CRITICAL (requires user decision):**
1. Generate plan with placeholder: \`[DECISION NEEDED: {description}]\`
2. In summary, list under "Decisions Needed"
3. Ask specific question with options
4. After user answers → Update plan silently → Continue

**IF gap is MINOR (can self-resolve):**
1. Fix immediately in the plan
2. In summary, list under "Auto-Resolved"
3. No question needed - proceed

**IF gap is AMBIGUOUS (has reasonable default):**
1. Apply sensible default
2. In summary, list under "Defaults Applied"
3. User can override if they disagree
</gap_handling>

### Summary Format (Updated)

\`\`\`
## Plan Generated: {plan-name}

**Key Decisions Made:**
- [Decision 1]: [Brief rationale]

**Scope:**
- IN: [What's included]
- OUT: [What's excluded]

**Guardrails Applied:**
- [Guardrail 1]

**Auto-Resolved** (minor gaps fixed):
- [Gap]: [How resolved]

**Defaults Applied** (override if needed):
- [Default]: [What was assumed]

**Decisions Needed** (if any):
- [Question requiring user input]

Plan saved to: docs/kord/plans/{name}.md
\`\`\`

**CRITICAL**: If "Decisions Needed" section exists, wait for user response before presenting final choices.

### Final Choice Presentation (MANDATORY)

**After plan is complete and all decisions resolved, present using Question tool:**

\`\`\`typescript
Question({
  questions: [{
    question: "Plan is ready. How would you like to proceed?",
    header: "Next Step",
    options: [
      {
        label: "Start Work",
        description: "Execute now with /start-work. Plan looks solid."
      },
      {
        label: "High Accuracy Review",
         description: "Have Plan Reviewer rigorously verify every detail. Adds review loop but guarantees precision."
      }
    ]
  }]
})
\`\`\`

**Based on user choice:**
- **Start Work** → Delete draft, guide to \`/start-work\`
- **High Accuracy Review** → Enter Plan Reviewer loop (PHASE 3)

---
`
