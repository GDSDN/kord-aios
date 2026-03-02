# Draft: Squads + Agent Tool Permissions (Kord AIOS vs Synkra AIOS/Claude Code)

## User Questions
- Understand how squads work today in Kord AIOS and how Synkra AIOS uses them in Claude Code.
- Understand orchestration model: is there a “squad chief” that becomes the main terminal agent (like Kord) or are all squad agents subagents?
- Understand delegation between agents and how tool permissions work (Read/Edit/Bash/explore/librarian).
- Investigate why a custom agent (example: `course-creator`) hits permission errors despite being “created as an agent”. Is the framework broken or is this expected?
- Decide whether PM/SM/PO/etc should live as a “development squad” vs staying built-in.
- Clarify where new squads/agents should write artifacts (which folders).

## Confirmed: How Squads Work in Kord AIOS
- Squad manifests: `SQUAD.yaml` v2 schema at `src/features/squad/schema.ts`.
- Squad discovery/loader: `src/features/squad/loader.ts`.
  - Search paths (dedup by manifest.name, first wins):
    - Built-in: `src/features/builtin-squads/*/SQUAD.yaml`
    - Project: `.opencode/squads/*/SQUAD.yaml`, `.kord/squads/*/SQUAD.yaml`, `docs/kord/squads/*/SQUAD.yaml`
    - Global: `{OpenCodeConfigDir}/squads/*/SQUAD.yaml` (e.g. `~/.config/opencode/squads/`)
- Squad → AgentConfig conversion: `src/features/squad/factory.ts`.
  - Squad agents are registered as `AgentConfig` (typically `mode: subagent`).
  - Tool permissions from `agents.*.tools` (boolean map) are converted into `config.permission` allow/deny.
- Startup injection: `src/plugin-handlers/config-handler.ts` loads squads and merges squad agents into `config.agent`.

## Confirmed: “Squad chief” semantics in Kord AIOS
- `is_chief` exists in schema (`src/features/squad/schema.ts`) and is used in prompt wording (`src/features/squad/factory.ts:buildDefaultSquadAgentPrompt`).
- “Chief” is not a first-class runtime role that automatically becomes the primary terminal agent.
- Practically, “chief can delegate” only works if that agent is actually granted the `task` tool permission in OpenCode’s permission model.

## Confirmed: Tool Permission System (3 layers)

### Layer 1: OpenCode permission model (global default + per-agent overrides)
- `src/plugin-handlers/config-handler.ts` sets `config.permission.task = "deny"` globally.
- Only a few agents explicitly get `task: allow` (e.g. `kord`, `dev`, `planner`, `builder`, `dev-junior`) in `config-handler.ts`.
- Implication: most custom agents (including squad agents) will NOT be able to delegate via `task()` unless their `permission.task` is set to allow.

### Layer 2: Session.prompt “tools” restrictions (boolean map)
- `src/shared/agent-tool-restrictions.ts` defines hardcoded deny lists for some agents.
  - `explore`/`librarian` deny: `write`, `edit`, `task`, `call_kord_agent`.
- These restrictions are applied when spawning delegated sessions:
  - `src/tools/call-kord-agent/tools.ts`
  - `src/features/background-agent/spawner.ts`
  - `src/tools/delegate-task/executor.ts`

### Layer 3: Path-based authority for write/edit
- `src/hooks/agent-authority/index.ts` blocks `write`/`edit` outside per-agent allowlists.
- Default allowlists: `src/hooks/agent-authority/constants.ts`.
  - Example: `planner` may write only `docs/kord/plans/**` and `docs/kord/drafts/**`.
  - Example: `squad-creator` may write only `.opencode/squads/**`.
- Implication: even if `Write/Edit` tools are “allowed”, writes will still fail unless the agent’s name is in the allowlist.

## Confirmed: Claude Code compatibility (agent loading)
- Kord AIOS loads Claude Code agents from:
  - User: `~/.claude/agents/*.md`
  - Project: `.claude/agents/*.md`
  via `src/features/claude-code-agent-loader/loader.ts`.
- The Claude Code agent loader supports a frontmatter `tools:` CSV, which is converted into `config.tools = { toolName: true }`.
  - This behaves like an allowlist: if `tools` is present but doesn’t include `read/edit/task`, those tools may be denied.
- There is no loader for `.opencode/agents` in this repo.
  - If a user placed agents under `.opencode/agents/`, Kord AIOS will not load them (unless OpenCode itself has such a loader).

## Hypotheses for the `course-creator` permission failures
- If the agent was created under `.opencode/agents/`: it may not be registered at all by Kord AIOS (path not supported by our loader). Any observed “agent exists” may be coming from elsewhere.
- If the agent was created as a Claude Code agent (`.claude/agents/course-creator.md`) and includes frontmatter `tools:` without `read/edit/task`, OpenCode may deny those tools.
- Even if Read works, Edit/Write can fail due to `agent-authority` allowlist not containing `course-creator`.
- Delegation to `explore/librarian` can fail because `course-creator` likely lacks `permission.task=allow` (global task is denied; only select agents override).

## Synkra AIOS vs Kord AIOS: “Squads in Claude Code”
- Synkra AIOS installs agents/tasks into `.claude/commands/AIOS/...` (see `D:\dev\synkra-aios\bin\aios-init.js`).
- Synkra “squads” are typically local packages under `./squads/` with their own manifest `squad.yaml` and scripts/docs.
- Claude Code itself does not natively interpret `SQUAD.yaml`/`squad.yaml`; in Claude Code, squads function primarily as structured prompt/task packages unless a runtime engine/plugin loads them.
- Kord AIOS is that runtime engine layer for OpenCode: it dynamically loads SQUAD.yaml and registers agents.

## Open Questions
- Where exactly was `course-creator` created?
  - `.opencode/agents/` vs `.claude/agents/` vs `kord-aios.json` vs a plugin-provided agent.
- What was the exact permission error message and which tool call failed (Read, Edit, task/explore/librarian)?
- Do you want squad chiefs to be able to delegate (enable `task`) by default, or keep delegation restricted to orchestrators (Kord/Dev/Planner)?
- Desired write scopes for non-core agents (e.g. course-creator should write `docs/**` only?).
- Do you want PM/SM/PO etc to be: (a) always built-in, or (b) re-declared in a “development squad” as domain-tailored variants?

## Working Recommendation (direction)
- Keep core methodology agents (pm/sm/po/qa/architect/etc) as built-ins, but allow overriding via squads for domain specialization.
- Make permissions explicit: for any custom agent, define both:
  - OpenCode tool permissions (`permission` / `tools`) and
  - agent-authority write allowlist patterns.
- Treat squad “chief” as a prompt-level role unless we explicitly grant delegation permission.
