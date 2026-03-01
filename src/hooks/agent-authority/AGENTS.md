# AGENT AUTHORITY HOOK

## Overview

The agent-authority hook enforces declarative file write permissions and git command restrictions for all Kord AIOS agents. It ensures agents only operate within their designated scopes.

## Functionality

### Write Permission Enforcement

The hook intercepts `tool.execute.before` events for write operations (`write`, `edit`, `write_file`, `edit_file`) and validates that the agent has permission to write to the target path.

**Permission Resolution Precedence:**
1. **Frontmatter Capabilities** - Loaded from `.opencode/agents/*.md` / `~/.config/opencode/agents/*.md`
2. **T0/T1 Agents** (kord, dev, dev-junior) - Full access (`["**"]`) when no explicit frontmatter/config path exists
3. **DEFAULT_AGENT_ALLOWLIST** - Fallback paths for known legacy agents
4. **Config Allowlist** - User-defined additions (additive)
5. **Unknown Agents** - Blocked by default (empty allowlist)

### Git Command Restrictions

The hook blocks dangerous git commands for non-DevOps agents:
- `git push`, `git merge`, `git rebase`, `git pr`, `gh pr`, `git pull --rebase`

## Default Allowlist

| Agent | Allowed Paths |
|-------|---------------|
| kord | `**` (all) |
| dev | `**` (all) |
| dev-junior | `**` (all) |
| builder | `docs/kord/notepads/**`, `docs/kord/runs/**`, `docs/kord/plans/**`, `docs/kord/drafts/**`, `docs/kord/boulder.json` |
| planner | `docs/kord/plans/**`, `docs/kord/drafts/**` |
| sm | `docs/**` |
| pm | `docs/**` |
| po | `docs/**` |
| qa | `docs/**` |
| architect | `docs/**` |
| analyst | `docs/**` |
| devops | `.github/**`, `Dockerfile`, `docker-compose.*`, `docs/kord/notepads/**`, `docs/kord/runs/**` |
| data-engineer | `**/migrations/**`, `**/schema.*`, `supabase/**` |
| ux-design-expert | `docs/**`, `**/*.css`, `**/*.scss`, `**/design-tokens/**`, `**/components/**/*.tsx` |
| squad-creator | `.opencode/squads/**` |

## Configuration

Override allowlist via `kord-aios.json`:

```json
{
  "hooks": {
    "agent-authority": {
      "allowlist": {
        "pm": ["src/**"],
        "custom-agent": ["docs/**"]
      }
    }
  }
}
```

Config allowlist entries are **additive** - they extend the default paths rather than replacing them.

## Task 10 Integration Notes

- Custom OpenCode agent keys follow filename rules (`course-creator.md` -> `course-creator`).
- Frontmatter capabilities are cached in-memory during agent loading and read by `getAgentCapabilities(agentName)` in this hook.
- If a custom agent has `write_paths`, those paths are enforced directly by this hook.

## Usage

The hook is automatically registered in the plugin initialization. No explicit configuration required for default behavior.

## Related

- [Agent Capabilities](../shared/agent-capabilities.ts) - Declarative permission model
- [Constants](./constants.ts) - Blocked commands and default allowlist
