# ADR-0002: Story-Driven Orchestration Protocol

**Status:** ACCEPTED  
**Date:** 2026-02-07  
**Author:** @architect (Oracle)  
**Scope:** Kord AIOS Methodology Integration  
**Dependencies:** ADR-0001 (Agent Topology)

---

## 1. Problem Statement

During BUILD/BUILD-LOOP execution, agents may discover:

- Missing or incomplete stories
- Incorrect/outdated PRD or spec
- Scope changes not reflected in artifacts
- Bugs that require story amendments

**The Chaos Risk:**
Without clear fallback rules, agents may:

- Silently patch stories (losing traceability)
- Escalate to wrong specialists (inefficient routing)
- Block indefinitely waiting for clarification
- Drift from OMOC's fast loop philosophy

**Core Tension:**

- AIOS requires artifact integrity (story-driven methodology)
- OMOC optimizes for velocity (fast execution loops)

---

## 2. Design Principles

| Principle                    | Rationale                                                     |
| ---------------------------- | ------------------------------------------------------------- |
| **Minimal Blockers**         | Keep the OMOC loop fast; don't gate execution on bureaucracy  |
| **Traceability**             | All artifact changes must be attributable and justified       |
| **Single Source of Truth**   | Story file is canonical; PRD/spec are references              |
| **Escalation Over Patching** | Build agents escalate; planning agents patch                  |
| **Evidence-Based**           | Changes require observable evidence (bug reports, failed ACs) |

---

## 3. Canonical Artifacts

### 3.1 Artifact Hierarchy

```
┌─────────────────────────────────────────────┐
│  PRODUCT REQUIREMENTS DOC (PRD)             │
│  • High-level features and goals            │
│  • Business context and constraints         │
│  • Owned by: @pm / @po                      │
│  • Mutable by: @pm / @po / @architect       │
├─────────────────────────────────────────────┤
│  STORY FILE (docs/stories/*.md)             │
│  • Implementation plan with ACs             │
│  • File list and checkboxes                 │
│  • Owned by: @sm / current executor         │
│  • Mutable by: @sm (planning), @dev (AC verification) │
├─────────────────────────────────────────────┤
│  SPEC/ARCHITECTURE (docs/architecture/*.md) │
│  • Technical design decisions               │
│  • ADRs and patterns                        │
│  • Owned by: @architect                     │
│  • Mutable by: @architect only              │
└─────────────────────────────────────────────┘
```

### 3.2 Artifact Responsibilities

| Artifact | Purpose             | Update Frequency   | Update Authority                 |
| -------- | ------------------- | ------------------ | -------------------------------- |
| PRD      | What and Why        | Per epic/feature   | @pm / @po                        |
| Story    | How and When        | Per sprint/task    | @sm (planning), @dev (execution) |
| Spec/ADR | Technical decisions | Per major decision | @architect                       |

---

## 4. Story Lifecycle State Machine

### 4.1 States and Transitions

```
                     ┌─────────────┐
          ┌─────────▶│   DRAFT     │◀────────┐
          │          │  (Ideation) │         │
          │          └──────┬──────┘         │
          │                 │ @plan/@sm      │
          │                 ▼                │
          │          ┌─────────────┐         │
          │     ┌────┤  PLANNING   ├────┐    │
          │     │    │  (Design)   │    │    │
          │     │    └──────┬──────┘    │    │
          │  @architect     │ @sm        │ @pm
          │     │           ▼           │    │
          │     │    ┌─────────────┐    │    │
          │     └───▶│ READY_FOR   ├────┘    │
          │          │    _DEV     │         │
          │          │  (Approved) │         │
          │          └──────┬──────┘         │
          │                 │ @kord          │
          │                 ▼                │
          │          ┌─────────────┐         │
          │          │ IN_PROGRESS │─────────┘ (scope change)
          │          │  (Building) │
          │          └──────┬──────┘
          │                 │ @build/@build-loop
          │                 ▼
          │          ┌─────────────┐
          └──────────│ READY_FOR   │
                     │   _REVIEW   │
                     └──────┬──────┘
                            │ @qa
                            ▼
                     ┌─────────────┐
          ┌─────────│   APPROVED  │
          │         └──────┬──────┘
          │                │ @kord
     (QA fail)             ▼
          │         ┌─────────────┐
          │         │  COMPLETED  │
          └─────────│  (Merged)   │
                    └─────────────┘
```

### 4.2 State Definitions

| State                | Meaning                     | Entry Criteria                    | Exit Criteria                         | Responsible Agent   |
| -------------------- | --------------------------- | --------------------------------- | ------------------------------------- | ------------------- |
| **DRAFT**            | Idea captured, not ready    | PRD or feature request exists     | Clear goal and feasibility understood | @plan, @sm          |
| **PLANNING**         | Decomposing into tasks      | Story created with context        | Atomic tasks defined, ACs written     | @plan, @sm          |
| **READY_FOR_DEV**    | Approved for implementation | Spec reviewed, dependencies clear | @build can start without questions    | @kord               |
| **IN_PROGRESS**      | Active development          | @build/@build-loop claimed story  | Code complete, tests written          | @build, @build-loop |
| **READY_FOR_REVIEW** | Awaiting QA                 | Build passes, ACs implemented     | @qa validates quality gates           | @dev (transition)   |
| **APPROVED**         | Quality gates passed        | QA sign-off                       | Ready for integration                 | @qa                 |
| **COMPLETED**        | Integrated and closed       | Merged to main                    | Documentation updated                 | @kord               |

---

## 5. Fallback Rules: Mid-Build Discovery

### 5.1 Decision Matrix

```
AGENT DETECTS ISSUE
        │
        ▼
┌─────────────────────────┐
│ Is the story INCORRECT? │ (ACs don't match PRD, missing context)
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │               │
   YES              NO
    │               │
    ▼               ▼
┌───────────┐  ┌─────────────────┐
│STOP WORK  │  │ Is the PRD      │
│ESCALATE   │  │ insufficient?   │
│to @sm     │  └────────┬────────┘
└───────────┘           │
                ┌───────┴───────┐
                │               │
               YES              NO
                │               │
                ▼               ▼
        ┌───────────────┐  ┌─────────────────┐
        │ESCALATE to    │  │ Is the spec     │
        │@pm/@po/@arch  │  │ insufficient?   │
        │for PRD update │  └────────┬────────┘
        └───────────────┘           │
                            ┌───────┴───────┐
                            │               │
                           YES              NO
                            │               │
                            ▼               ▼
                    ┌───────────────┐  ┌─────────────────┐
                    │ESCALATE to    │  │ Is it a BUG     │
                    │@architect for │  │ in current work?│
                    │spec update    │  └────────┬────────┘
                    └───────────────┘           │
                                        ┌───────┴───────┐
                                        │               │
                                       YES              NO
                                        │               │
                                        ▼               ▼
                                ┌───────────────┐  ┌─────────────────┐
                                │FIX and        │  │ UNKNOWN -       │
                                │document in    │  │ escalate to     │
                                │story comments │  │@kord for routing│
                                └───────────────┘  └─────────────────┘
```

### 5.2 Agent-Specific Fallback Behavior

| Agent                        | Issue Type                | Action                              | Evidence Required             |
| ---------------------------- | ------------------------- | ----------------------------------- | ----------------------------- |
| **@build** / **@build-loop** | AC unclear                | Stop, escalate to @sm               | Quote specific AC             |
| **@build** / **@build-loop** | AC contradicts PRD        | Stop, escalate to @sm + @po         | Side-by-side comparison       |
| **@build** / **@build-loop** | Missing spec detail       | Escalate to @architect              | Description of what's missing |
| **@build** / **@build-loop** | Bug found                 | Fix + document in story             | Test case reproducing bug     |
| **@deep**                    | Research incomplete       | Extend session or escalate to @kord | Research scope vs findings    |
| **@qa**                      | AC not testable           | Escalate to @sm                     | Explanation of ambiguity      |
| **@qa**                      | Implementation diverges   | Escalate to @build + @sm            | Diff showing divergence       |
| **@plan**                    | Requirements unclear      | Escalate to @pm/@po                 | Ambiguity description         |
| **@sm**                      | Story decomposition wrong | Update story, notify stakeholders   | Clear rationale               |
| **@architect**               | Design won't work         | Update spec/ADR, notify @sm         | Technical justification       |

---

## 6. Escalation Matrix

### 6.1 Who to Call for What

| If You Need To...         | Contact    | Via                               | Response Time        |
| ------------------------- | ---------- | --------------------------------- | -------------------- |
| Clarify ACs               | @sm        | `task(subagent_type="sm")`        | Immediate (planning) |
| Change story scope        | @sm + @po  | Escalate both                     | Within session       |
| Update PRD                | @pm / @po  | `task(subagent_type="pm")`        | Async (may wait)     |
| Update spec/ADR           | @architect | `task(subagent_type="architect")` | Within session       |
| Resolve technical blocker | @architect | Consult mode                      | Within session       |
| Fast technical decision   | @kord      | Direct                            | Immediate            |
| Research unknowns         | @deep      | `task(subagent_type="deep")`      | Async (background)   |
| Analysis, benchmarking    | @analyst   | `task(subagent_type="analyst")`   | Async (background)   |

### 6.1.1 Primary Agent Escalation Flow

```
Initial Request
    │
    ├──▶ Planning/Requirements ──────────────▶ @plan
    │
    ├──▶ Implementation (interactive) ───────▶ @build
    │
    ├──▶ Implementation (autonomous) ────────▶ @build-loop
    │
    ├──▶ Deep research/Analysis ─────────────▶ @deep
    │
    └──▶ Framework/Methodology issues ───────▶ @kord
```

## 6.1.2 Star Commands Policy

When agents use `*command` syntax to invoke skill workflows:

- `*command` means skill workflow intent
- Try exact skill match first
- Fallback to skill search if no exact match
- If still missing, continue with normal build/plan flow and record fallback

---

### 6.2 Escalation Prompt Template

```markdown
## ESCALATION: [Brief Issue Summary]

### Context

- Story: [path/to/story.md]
- Current State: [IN_PROGRESS / READY_FOR_REVIEW / etc.]
- Agent: [@dev / @qa / etc.]

### Issue

[What was discovered]

### Evidence

- [Specific quote from AC showing inconsistency]
- [File/line reference showing problem]
- [Test case or error output]

### Proposed Resolution

[Your recommendation, if any]

### Impact on Current Work

- [ ] Can continue with workaround
- [ ] BLOCKED until resolved

### Urgency

- [ ] Critical (blocks all work)
- [ ] High (blocks specific path)
- [ ] Medium (can detour temporarily)
```

---

## 7. Minimal Evidence Requirements

### 7.1 Before Changing Any Artifact

| Change Type      | Required Evidence                           | Example                                                      |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------ |
| **Update AC**    | Failed verification + reason                | "AC-3 says 'handle errors' but doesn't specify which errors" |
| **Add AC**       | Gap discovered + justification              | "Missing edge case: empty input array"                       |
| **Remove AC**    | Deprecation decision + stakeholder approval | "Feature cut per @pm decision on [date]"                     |
| **Update Story** | Scope change approval                       | "@po approved expanding scope to include X"                  |
| **Update PRD**   | Business requirement change                 | "Market research shows users need Y"                         |
| **Update Spec**  | Technical impossibility                     | "Approach Z won't work because [reason]"                     |

### 7.2 Evidence Format

All evidence must be:

1. **Observable** - Can be verified by another agent
2. **Specific** - Quotes line numbers, file paths, exact errors
3. **Attributable** - Links to agent session or decision record

---

## 8. Preserving OMOC Loop Speed

### 8.1 Fast Path: Minor Deviations

For small discrepancies that don't affect core logic:

```
DETECTED: Minor inconsistency in AC-2 wording

ACTION:
1. Document in story "Implementation Notes" section
2. Proceed with reasonable interpretation
3. Note assumption: "Interpreted 'handle errors' as covering all HTTP 4xx/5xx"
4. Continue work

NO ESCALATION NEEDED
```

### 8.2 When to Break the Rules (Emergency Protocol)

**Production Critical Bug:**

- @dev may patch story directly
- Must document: bug description + fix + rationale
- Must notify: @sm + @po within same session
- Post-hoc review required by @qa

**Emergency Criteria:**

- [ ] System is down or severely degraded
- [ ] No @sm / @po available
- [ ] Fix is time-critical (< 1 hour window)
- [ ] Risk of not fixing > risk of process violation

---

## 9. Integration with Kord AIOS Patterns

### 9.1 Canonical Agent Mapping

| Phase      | Primary Agent | Delegates To                          | Purpose                     |
| ---------- | ------------- | ------------------------------------- | --------------------------- |
| Plan       | @plan         | @deep (research), @analyst (analysis) | Requirements, decomposition |
| Build      | @build        | @dev (implementation)                 | Interactive coding          |
| Build-Loop | @build-loop   | @deep (research)                      | Autonomous execution        |
| QA         | @qa           | —                                     | Quality validation          |

### 9.2 Story File ↔ Plan File Mapping

| Legacy Concept               | Kord AIOS Equivalent         | Notes                       |
| ---------------------------- | ---------------------------- | --------------------------- |
| `.sisyphus/plans/*.md`       | `docs/stories/*.md`          | Story is the canonical plan |
| `.sisyphus/notepads/{plan}/` | Story "Implementation Notes" | Keep in story file          |
| Plan TODOs                   | Story checkboxes             | Same syntax: `- [ ]`        |
| Plan "Success Criteria"      | Story "Acceptance Criteria"  | Equivalent purpose          |

### 9.3 Notepad Protocol Adaptation

Kord AIOS's notepad system accumulates wisdom across tasks:

- **Keep in story**: Implementation notes, decisions, gotchas
- **Keep in PRD**: Product decisions, user research
- **Keep in spec**: Technical decisions, ADR references

**Never use**: `.sisyphus/notepads/` for story-driven work (use story file instead)

---

## 10. Anti-Patterns

| Anti-Pattern                 | Why It's Bad                    | Correct Approach                           |
| ---------------------------- | ------------------------------- | ------------------------------------------ |
| **Silent patching**          | Loses traceability, hides drift | Escalate with evidence                     |
| **Over-escalation**          | Slows velocity, frustrates team | Use fast path for minor issues             |
| **Ignoring story**           | Drift from requirements         | Update story if work diverges              |
| **Bypassing @sm**            | Undermines planning authority   | Always route through @sm for story changes |
| **Emergency protocol abuse** | Erodes process discipline       | Use only for true emergencies              |

---

## 11. QA Gate Behavior

### 11.1 QA Finds Issues

```
@qa discovers:
├── Implementation bug → Return to @build with evidence
├── AC not met → Return to @build with AC reference
├── AC ambiguous → Escalate to @sm for clarification
├── Missing AC → Escalate to @sm + @po for story update
└── Spec violation → Escalate to @architect for spec review
```

### 11.2 QA Sign-Off Requirements

Before APPROVED state:

- [ ] All ACs verified with evidence
- [ ] Story checkboxes match actual work
- [ ] File list accurate and complete
- [ ] No unaddressed escalations

---

## 12. Summary: Key Rules

1. **Story is source of truth** - PRD/spec inform, but story governs implementation
2. **Build agents escalate** - @dev/@qa don't patch stories; they escalate to @sm
3. **Evidence required** - All changes need observable, specific justification
4. **Fast path exists** - Minor issues can proceed with documentation
5. **Emergency override** - Critical fixes can bypass process with post-hoc review
6. **Preserve OMOC velocity** - Don't let process block productive work
7. **Maintain AIOS traceability** - All decisions are attributable and reversible

---

## 13. Related Decisions

- **ADR-0001:** Agent Topology and Naming
- **Story OPEN-AIOS-001:** Module 1: Agent System Fusion
- **Future ADR:** Quality Gate Protocol (pending)

---

## 14. Changelog

| Date       | Change                      | Author     |
| ---------- | --------------------------- | ---------- |
| 2026-02-07 | Initial protocol definition | @architect |
