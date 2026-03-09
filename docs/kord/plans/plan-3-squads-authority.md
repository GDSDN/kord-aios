# Plan 3: Squad Polish & Artifact Authority

## TL;DR

> **Quick Summary**: Make Squads work as real teams (Chief -> Workers) and make methodology agents produce auditable artifacts in the right folders. Squads shipped with the plugin are treated as L3 seed content only: they are exported into the user project/global config and are NOT loaded at runtime.
>
> **Deliverables**:
> - Squads runtime loads ONLY user squads (project + global); removes runtime loading of `src/features/builtin-squads/**`
> - Default exported `code` squad seed updated to include a chief (works out-of-the-box after export)
> - Scoped global write escape hatch: ONLY `squad-creator` can Write/Edit under `{OpenCodeConfigDir}/squads/**`
> - Squads delegation contract: orchestrators delegate directly to `squad-{name}-{chief}` (no squad category routing)
> - Skills contract: chiefs/workers + methodology agents load skills on-demand via `skill("...")`
> - Analyst writes deep research to `docs/kord/analyses/**`; UX writes specs to `docs/kord/design/**`
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Authority escape hatch -> Squad loader contract -> Chief template + seed -> Squad creator -> Artifact prompts

---

## Context

### Original Request
- Squads are teams (multi-disciplinary or domain-specific). The user chooses the team structure.
- The orchestrator delegates to a **squad chief**, and the chief coordinates workers.
- Built-in squads should not be runtime "built-ins"; they are L3 content seeds exported into user-controlled locations (project/global).
- Analyst deep research must be saved as artifacts for reuse/audit.

### Key Decisions (confirmed)
- **Squads are teams, not categories**: orchestrators use `task(subagent_type="squad-{squad}-chief", load_skills=[], ...)`.
- **Skills are on-demand**: do not rely on `task(load_skills=...)` for correctness; workers call `skill("...")` when needed.
- **Project seed location**: exported seeds live in `.kord/squads/`.
- **Global squads**: allowed, with an authority exception limited to `squad-creator` writing under `{OpenCodeConfigDir}/squads/**`.
- **Bundled squads are export-only**: runtime must not load `src/features/builtin-squads/**`.

---

## Scope

### IN
- Squad runtime loader contract changes
- Chief prompt template contract fixes (task syntax, on-demand skills)
- Default exported `code` squad seed updates
- Squad creator: prompt + tool permissions + global/project path handling
- Agent authority: scoped global write escape hatch
- Methodology agent artifact paths + tool permissions (Analyst, UX Design Expert; plus tighten DevOps/Data Engineer prompts for docs)
- Documentation updates for squad discovery order + contracts

### OUT
- Command & Control dashboard, SQLite telemetry, token accounting UI (future plan)
- Any new YAML workflow engine (explicitly not doing a Synkra port)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: TDD
- **Framework**: `bun test`

### Universal Verification Commands
```bash
bun test
bun run typecheck
bun run build
```

---

## Execution Strategy

Wave 1 (Foundation): Tasks 1-2
Wave 2 (Squad Functionality): Tasks 3-5
Wave 3 (Artifacts + Docs): Tasks 6-7

---

## TODOs

- [ ] 1. Agent Authority: Scoped Global Squads Escape Hatch

  **What to do**:
  - Update `src/hooks/agent-authority/index.ts` to allow absolute paths under `{OpenCodeConfigDir}/squads/**` ONLY when `agentName === "squad-creator"`.
  - Implement the check BEFORE `resolveRelativePath()` (since global paths are outside workspace root).
  - Guardrails:
    - Normalize and compare paths safely on Windows (case-insensitive prefix) and POSIX.
    - Block traversal/escapes: resolved absolute must start with the computed global squads root.
    - Ensure parent directory exists for allowed global writes (create with Node fs `mkdir(..., { recursive: true })` inside the hook or a shared helper).
  - Update `src/hooks/agent-authority/constants.ts` to allow local squad creation under `.kord/squads/**` for `squad-creator` (in addition to `.opencode/squads/**`).

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`git-master`]

  **References**:
  - `src/hooks/agent-authority/index.ts` - boundary enforcement via `resolveRelativePath()`
  - `src/hooks/agent-authority/constants.ts` - DEFAULT_AGENT_ALLOWLIST
  - `src/shared/opencode-config-dir.ts` - compute `{OpenCodeConfigDir}` cross-platform
  - `src/hooks/agent-authority/agent-authority.test.ts` - existing boundary tests (file://, line breaks)

  **Acceptance Criteria**:
  - [ ] `bun test src/hooks/agent-authority/agent-authority.test.ts` PASS
  - [ ] New tests prove:
    - `squad-creator` can write to `{OpenCodeConfigDir}/squads/foo/SQUAD.yaml`
    - non-`squad-creator` agents cannot
    - traversal attempts are rejected

  **Agent-Executed QA Scenario**:
  ```text
  Scenario: Global escape hatch is scoped
    Tool: Bash (bun test)
    Steps:
      1. Run: bun test src/hooks/agent-authority/agent-authority.test.ts
      2. Assert: tests include global allow for squad-creator and global deny for analyst
    Expected Result: green test suite
  ```

- [ ] 2. Squad Loader: Remove Runtime Built-in Squads

  **What to do**:
  - Update `src/features/squad/loader.ts`:
    - Remove `BUILTIN_SQUADS_DIR` as a runtime discovery source.
    - Load only from:
      - Project: `.opencode/squads`, `.kord/squads`, `docs/kord/squads`
      - Global: `{OpenCodeConfigDir}/squads`
    - Update comments/types so `LoadedSquad.source` no longer needs `"builtin"`.
  - Update docs that currently describe built-in runtime loading:
    - `src/features/squad/AGENTS.md`
    - `src/features/builtin-squads/AGENTS.md`

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`

  **References**:
  - `src/features/squad/loader.ts` - current builtin-first discovery + dedup
  - `src/features/squad/squad.test.ts` - loader tests
  - `src/features/squad/AGENTS.md` - currently documents builtin discovery order

  **Acceptance Criteria**:
  - [ ] `bun test src/features/squad/squad.test.ts` PASS
  - [ ] New/updated tests prove that `src/features/builtin-squads/**` is NOT loaded at runtime

- [ ] 3. Export Seed Contract: Keep Seeds in `src/features/builtin-squads/**` but Export to `.kord/squads/**`

  **What to do**:
  - Ensure `init`/`extract` exports the `code` squad seed to `.kord/squads/code/SQUAD.yaml` (current behavior).
  - Update docs for init/extract to clarify: seeds are shipped by plugin and installed into the project.

  **References**:
  - `src/cli/init/index.ts` - exports `.kord/squads/code/`
  - `src/features/builtin-squads/code/SQUAD.yaml` - seed content

  **Acceptance Criteria**:
  - [ ] `bun test src/cli/init/index.test.ts` PASS

- [ ] 4. Default `code` Squad Seed: Add Chief and Align Delegation Contract

  **What to do**:
  - Update `src/features/builtin-squads/code/SQUAD.yaml`:
    - Add a `chief` agent with `is_chief: true`.
    - Keep `developer` worker.
    - Keep categories as optional metadata (not required for routing).

  **References**:
  - `src/features/builtin-squads/code/SQUAD.yaml`
  - `src/features/squad/schema.ts` - `is_chief` semantics
  - `src/features/squad/l2-squad-integration.test.ts` - validates chief prompt assembly

  **Acceptance Criteria**:
  - [ ] `bun test src/features/squad/l2-squad-integration.test.ts` PASS
  - [ ] Seed contains `chief` with `is_chief: true`

- [ ] 5. Chief Template: Fix `task()` Syntax + On-demand Skills Guidance

  **What to do**:
  - Update `src/features/squad/chief-template.ts`:
    - Update all `task(...)` examples to include `load_skills: []` (required argument).
    - Remove/avoid category routing examples for squads.
    - Add explicit guidance: workers must call `skill("...")` when they need methodology.
  - Update `src/features/squad/chief-template.test.ts` to assert the template contains `load_skills` guidance.

  **References**:
  - `src/features/squad/chief-template.ts`
  - `src/tools/delegate-task/tools.ts` - `load_skills` is required
  - `src/tools/skill/tools.ts` - `skill("...")` tool

  **Acceptance Criteria**:
  - [ ] `bun test src/features/squad/chief-template.test.ts` PASS

- [ ] 6. Squad Creator: Make Global/Project Creation Actually Work

  **What to do**:
  - Update `src/agents/squad-creator.ts` permissions:
    - Today it uses `createAgentToolRestrictions(["task"])` which DENIES task. Fix it.
    - Switch to a proper allowlist (recommended) or remove the deny.
    - Ensure it can call: `read`, `write`, `edit`, `glob`, `grep`, `squad_validate`, `skill`, `task`.
  - Update `src/features/builtin-agents/squad-creator.md`:
    - Local install path should be `.kord/squads/{squad-name}/` by default.
    - Keep `.opencode/squads/` as "also supported".
    - Update statement "Squads become available as delegation categories" to the new contract: delegate to chief via `task(subagent_type=...)`.
    - Update skill guidance: on-demand via `skill()`.
  - Update `/squad-create` template: `src/features/builtin-commands/templates/squad-create.ts` to match the real behavior.

  **References**:
  - `src/agents/squad-creator.ts`
  - `src/features/builtin-agents/squad-creator.md`
  - `src/features/builtin-commands/templates/squad-create.ts`
  - `src/hooks/agent-authority/constants.ts` - local allowlist for `.kord/squads/**`

  **Acceptance Criteria**:
  - [ ] `bun test` PASS
  - [ ] Manual agent-executed QA scenario (below) passes without human steps

  **Agent-Executed QA Scenario**:
  ```text
  Scenario: squad-creator creates a global squad pack
    Tool: task (delegate-task) + Write/Edit
    Preconditions: `{OpenCodeConfigDir}` exists
    Steps:
      1. Invoke: task(subagent_type="squad-creator", load_skills=[], run_in_background=false, prompt="Create a minimal squad named test-squad globally")
      2. Assert: file exists at {OpenCodeConfigDir}/squads/test-squad/SQUAD.yaml
      3. Run: squad_validate on that manifest
    Expected Result: Valid squad pack installed globally
  ```

- [ ] 7. Methodology Agents: Artifact Paths + Tool Permissions

  **What to do**:
  - Analyst:
    - Update `src/features/builtin-agents/analyst.md` to remove the "READ-ONLY" constraint and require saving deep research to `docs/kord/analyses/**`.
    - Update `src/shared/agent-tool-restrictions.ts` to stop denying `write/edit` for `analyst` (keep `task` denied).
    - Update `src/agents/analyst.ts` permission (it currently denies `write/edit/task` via `createAgentToolRestrictions`). Align with new artifact behavior.
  - UX Design Expert:
    - Update `src/features/builtin-agents/ux-design-expert.md` to write into `docs/kord/design/**` (not `docs/` broadly).
  - DevOps/Data Engineer:
    - Update their prompts to explicitly save planning artifacts into `docs/kord/runs/**` and `docs/kord/data/**`.

  **References**:
  - `src/features/builtin-agents/analyst.md`
  - `src/agents/analyst.ts`
  - `src/shared/agent-tool-restrictions.ts`
  - `src/hooks/agent-authority/constants.ts` - baseline write allowlists
  - `src/features/builtin-agents/ux-design-expert.md`
  - `src/features/builtin-agents/devops.md`
  - `src/features/builtin-agents/data-engineer.md`

  **Acceptance Criteria**:
  - [ ] `bun run build` PASS (re-embeds builtin prompts: `src/features/builtin-agents/prompts.ts`)
  - [ ] `bun test` PASS
  - [ ] New tests (or updated) prove analyst can Write under `docs/kord/analyses/**` but not `src/**`.

---

## Success Criteria

### Final Verification
```bash
bun test
bun run typecheck
bun run build
```

### Final Checklist
- [ ] Squads runtime does not load `src/features/builtin-squads/**`
- [ ] Exported `.kord/squads/code/` contains a working chief
- [ ] `squad-creator` can install squads globally via Write/Edit with a scoped authority exception
- [ ] Analyst produces auditable deep research artifacts under `docs/kord/analyses/`
