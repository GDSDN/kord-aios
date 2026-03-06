# Draft: Init & Delivery (Follow-up)

## What Blocked Plan Closure
- Avoid ambiguity where a user selects "New Project" but the project is already shipped/deployed; onboarding rules must not mislead agents.

## Synkra Evidence
- Greenfield is detected via "absence of indicators" (package.json, .git, docs/, src/, .aios-core/) and is handled as a workflow with phases (bootstrap -> discovery -> sharding -> dev cycle).
  - `D:\dev\synkra-aios\.aios-core\core\orchestration\greenfield-handler.js`
- Brownfield is framed as a workflow choice; after MVP it may be better to continue with PM/epic flow than switch to brownfield.
  - `D:\dev\synkra-aios\.aios-core\working-in-the-brownfield.md`

## Proposed Adaptation (Kord AIOS)
- Treat "New vs Existing" as a workflow track for onboarding guidance, not a permanent project label.
- Persist a tiny context file injected by rules-injector: `.kord/rules/project-mode.md`.
- Add `Project Stage:` + a short stage promotion checklist inside the file.
  - Stage becomes ACTIVE/BASELINED when checklist is complete; no deletion needed (sunset clause).

## Open Decision
- Define the exact acceptance criteria for stage promotion:
  - New Project: which artifacts/checks mark onboarding as complete?
  - Existing Project: which analysis artifact path is canonical?
