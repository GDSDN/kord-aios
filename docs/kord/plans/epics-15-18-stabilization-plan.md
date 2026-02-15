# Plan: Stabilize Epics 15-18 (Agent Topology, Layout, Installer, Branding)

> Status: Draft
> Created: 2026-02-14
> Scope: Documentation + code fixes required to make Kord AIOS run end-to-end as designed (Synkra methodology + OMOC/OpenCode engine).

## Sources of Truth

- `docs/researches/epics-15-18-study.md`
- `docs/epics/epic-15-agent-topology-and-invocation/EPIC.md`
- `docs/epics/epic-16-project-layout-architecture/EPIC.md`
- `docs/epics/epic-17-installer-scaffolding-and-auth-reliability/EPIC.md`
- `docs/epics/epic-18-branding-and-naming-audit/EPIC.md`

Mirror repos (must be referenced during verification):

- `D:\dev\opencode-source`
- `D:\dev\oh-my-opencode`
- `D:\dev\synkra-aios`

## Goal

Make the system runnable without guesswork:

- `@plan` and `@build` behave as intended (no self-clobber in config-handler)
- `.kord/` and `docs/kord/` conventions are consistent, scaffolded, and validated
- Installer produces a functional baseline on first run (no empty `.kord/templates/`)
- E2E tests prove the above and prevent regressions

---

## Wave A: EPIC-15 Agent Topology & Invocation (Blocking)

- [ ] Task: Implement EPIC-15 S02 fix (remove stale OMOC overrides that clobber Kord AIOS planner/executor)
  - Executor: `dev`
  - Files: `src/plugin-handlers/config-handler.ts`
  - Acceptance:
    - Canonical Kord AIOS planner retains full config (prompt + permission + correct `mode`)
    - Canonical Kord AIOS executor retains full config (prompt + permission + correct `mode`)
    - OpenCode picker rule holds (see `D:\dev\opencode-source\packages\opencode\src\cli\cmd\tui\context\local.tsx:37`)

- [ ] Task: Add regression tests for agent merge/override order
  - Executor: `dev`
  - Files: `src/plugin-handlers/config-handler.test.ts` (or equivalent)
  - Acceptance:
    - A test fails if any later merge overwrites planner/executor with partial objects (e.g., `{ mode: "subagent" }`)
    - A test asserts the final effective modes match the expected visibility rules

- [ ] Task: Finalize naming decision + migration plan (`plan/build` vs `planner/builder`)
  - Executor: `architect`
  - Files: `docs/kord/adrs/ADR-0001-agent-names-plan-build.md`, `docs/epics/epic-15-agent-topology-and-invocation/EPIC.md`
  - Acceptance:
    - Decision cites OpenCode picker/task visibility rules
    - If rename chosen: lists required code touchpoints (schema, migration, commands, hooks, tests, docs)

---

## Wave B: EPIC-16 Project Layout Architecture (Lock the Spec)

- [ ] Task: Write authoritative project layout spec doc
  - Executor: `architect`
  - Output: `docs/architecture/project-layout.md`
  - Acceptance:
    - Defines `.kord/` as project content pack (templates/scripts/checklists/skills/squads)
    - Defines `docs/kord/` as authored outputs (plans/notepads/drafts/runs)
    - Defines minimal required baseline (what installer must create)

- [ ] Task: Align existing references (no inconsistent paths)
  - Executor: `dev-junior`
  - Acceptance:
    - All references in prompts/hooks/tools match the spec
    - Any mismatches are tracked and fixed as separate tasks (no drive-by refactor)

---

## Wave C: EPIC-17 Installer Scaffolding & Auth Reliability

- [ ] Task: Wire `scaffoldProject()` into install phases (fresh + repair)
  - Executor: `dev`
  - Files: `src/cli/install-phases.ts`, `src/cli/install.ts`
  - Acceptance:
    - `.kord/templates/story.md` and `.kord/templates/adr.md` exist after install
    - `docs/kord/plans/` and `docs/kord/notepads/` exist after install
    - `kord-rules.md` is created on fresh install

- [ ] Task: Fix post-install doctor to validate the same config location the installer writes
  - Executor: `dev`
  - Files: `src/cli/post-install-doctor.ts`, `src/cli/config-manager.ts`, `src/shared/opencode-config-dir.ts`
  - Acceptance:
    - Doctor checks the OpenCode config path resolved by `getOpenCodeConfigPaths()` (not only CWD)
    - Doctor explicitly validates plugin registration in that config

- [ ] Task: Auth reliability investigation checklist
  - Executor: `analyst`
  - Output: `docs/researches/auth-antigravity-investigation.md`
  - Acceptance:
    - Confirms plugin entry format and config location match OpenCode expectations
    - Lists steps to reproduce + verify `opencode auth login` flows

---

## Wave E: E2E Validation (Non-negotiable)

- [ ] Task: Define E2E scenarios + quality gate checklist (install + agent topology + doctor)
  - Executor: `qa`
  - Acceptance:
    - Checklist enumerates required scenarios and minimum evidence for pass

- [ ] Task: Add E2E-style tests for install + agent topology
  - Executor: `dev`
  - Acceptance:
    - Tests cover: config-handler final agent list behavior, install scaffolding baseline, doctor behavior

- [ ] Task: Run full verification suite
  - Executor: `qa`
  - Acceptance:
    - `bun test` passes
    - `bun run typecheck` passes
    - `bun run build` passes

- [ ] Task: Push branch + open PR (target `dev`) + ensure CI runs full suite
  - Executor: `devops`
  - Acceptance:
    - PR targets `dev`
    - CI shows `bun test`, `bun run typecheck`, `bun run build` green

---

## Wave F: EPIC-18 Branding & Naming Audit (Last)

- EPIC-18 should be executed last (after the system runs end-to-end) to avoid rework.

- [ ] Task: Fix remaining stale runtime references
  - Executor: `dev-junior`
  - Acceptance:
    - `assets/` schema filename(s) match `kord-aios`
    - Runtime `SCHEMA_URL`/references align with published naming
    - Compatibility aliases remain only where required (migration/tests)
