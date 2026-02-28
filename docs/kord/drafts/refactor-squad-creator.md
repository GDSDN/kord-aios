# Draft: Refactoring Squad Creator Architecture

## Requirements (confirmed)
- User wants to refactor the `squad-creator` agent to align properly with the Kord AIOS architecture (Engine vs Addon).
- Need to clarify and define exactly how squads are registered, distributed, and executed within the OpenCode plugin ecosystem.
- Need to integrate the Synkra methodology (personas, skills) with the Oh-My-Opencode engine execution model (tools, handoffs).

## Technical Decisions (Architectural Truths)
- **Engine vs Addon**: Kord AIOS is the motor/framework. Squads are addons/extensions (specialized teams).
- **Registration Locations**:
  - *Project-specific*: `.opencode/squads/{squad-name}/SQUAD.yaml` (lives in the user's project repo).
  - *Global/User-wide*: `~/.config/opencode/squads/{squad-name}/SQUAD.yaml` (available across all projects).
  - *Built-in*: `src/features/builtin-squads/` (shipped with the Kord AIOS npm package).
- **Handoffs (Delegation)**: Handled entirely via the `task()` tool. The engine reads the `SQUAD.yaml`, registers the agents dynamically, and makes their categories available to the Orchestrator (Kord/Build/Plan).
- **Tools**: The engine (Kord AIOS) provides the actual tool implementations (LSP, Bash, MCPs). The Squad (via `.md` prompts and `SKILL.md` methodology files) provides the *intelligence* and *workflow* on how to use them.

## Open Questions for the User
- Should the `squad-creator` output directly to `~/.config/opencode/squads/` if the user wants it globally, or always default to the local `.opencode/squads/`?
- Do we need to update the `SQUAD.yaml` schema to explicitly map which OpenCode tools each agent persona should have access to (e.g., `tools: ["bash", "lsp_*"]`)?
- Should the `squad-creator` also automatically generate a test/sandbox project to verify the new squad?