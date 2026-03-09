# Synkra -> Kord Methodology Parity Audit (Quality)

Goal: preserve Synkra-level methodological depth while adapting to Kord AIOS constraints (plugin runtime + injected rules budget).

## Depth Markers (What “Synkra-level” means here)

- Phases: clear, ordered workflow (not a quickstart)
- Gates: explicit entry/exit criteria; promotion criteria are checkable
- Artifacts: explicit outputs with stable locations and templates
- Verification: runnable commands and/or unambiguous manual steps
- Failure modes: common pitfalls + recovery

## Kord-Specific Constraints

- `.kord/rules/*` is injected into agent context; keep it high-signal and small.
- Deep workflows belong in `.kord/guides/*` and in skills/agent prompts; rules should primarily route.
- English-only policy applies to all scaffolded methodology content.

## Parity Matrix

| Category | Synkra Pattern (Depth) | Kord Current (Before) | Gap | Kord Target (After) |
|---|---|---|---|---|
| Guides | Greenfield/Brownfield docs with phases, gates, artifacts, diagrams | `.kord/guides/new-project.md` + `existing-project.md` were quickstart-level | Lacked phases/gates/verification/failure modes | Rewrite both guides to include required headings, gates, artifacts, verification, and mode-specific skills |
| Injected Rules | Brownfield framing emphasizes baseline-first and mode indicators | `.kord/rules/project-mode.md` had mode/stage + generic pointers | Missing stage gates + sunset clause; no routing to mode playbooks | Add `## Stage Gates`, `## Sunset Clause`, and pointers to guides/rubrics/skills; enforce <= 2048 bytes |
| Templates | Templates include guardrails, outputs, and verification expectations | Templates existed but were inconsistent in depth and structure | No universal quality bar; some templates lacked explicit verification/failure modes | Enforce stable headings across templates (`Purpose/Scope/Inputs/Output/AC/Verification/Failure Modes`) |
| Checklists | Checklists are objective and evidence-driven | Checklists existed but had vague items and no evidence requirements | Hard to audit; not consistently actionable | Add objective items, negative/failure checks, and `Evidence` sections |
| Standards | Standards define gates/heuristics with concrete evidence | Standards existed but were generic | Missing evidence requirements and escalation triggers | Expand standards with evidence subsections and "when to stop" triggers; add rubrics |
| Skills | Brownfield has explicit discovery playbooks; greenfield has kickoff workflows | Brownfield-ish skills exist; greenfield kickoff missing; some skills contain legacy/TODO tokens | Mode-specific analysis not explicit; skill quality inconsistent | Add/repair mode skills and make them explicit in onboarding: `greenfield-kickoff`, `document-project`, `create-brownfield-story` |
| Methodology Agents | PM/SM/PO/QA encode the framework and route to templates | Prompts existed and referenced templates, but not rubrics; some quality inconsistencies possible | Rubric routing missing; quality criteria not explicit | Update PM/SM/PO/QA prompts to reference rubrics + enforce verification expectations |

## Evidence Links (Local)

Synkra depth exemplars (local paths):
- `D:\\dev\\synkra-aios\\docs\\guides\\workflows\\GREENFIELD-FULLSTACK-WORKFLOW.md`
- `D:\\dev\\synkra-aios\\docs\\guides\\workflows\\BROWNFIELD-DISCOVERY-WORKFLOW.md`
- `D:\\dev\\synkra-aios\\.aios-core\\working-in-the-brownfield.md`

Kord scaffold sources:
- `src/cli/project-layout.ts`
- `src/cli/scaffolder.ts`
- `src/cli/scaffolder.test.ts`

## Non-Goals

- Porting Synkra workflow engines or scripts wholesale
- Introducing a YAML workflow runtime
- Inflating injected rule files beyond budget
