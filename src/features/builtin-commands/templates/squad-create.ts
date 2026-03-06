export const SQUAD_CREATE_TEMPLATE = `You are executing the /squad-create command.

## Purpose
Create a new specialized agent squad for the requested domain.

## Instructions

1. **Parse arguments**: Extract the domain name from $ARGUMENTS
   - If no arguments provided, show usage and examples (see below)

2. **Delegate to Squad Creator**: Use \`call_kord_agent\` to delegate to @squad-creator:
   \`\`\`
   call_kord_agent({
      agent: "squad-creator",
      task: "Create a new squad for the '{domain}' domain. First ask whether install scope should be Local (project) or Global (all projects). Then research the domain, design agent personas, create SKILL.md files, and generate a v2 SQUAD.yaml manifest with prompt_file references, package components (workflows/tasks/templates/checklists/scripts/data), orchestration metadata, tags, and kord.minVersion."
   })
   \`\`\`

3. **Validate**: After creation, run \`squad_validate\` on the generated squad to verify it passes all checks.

4. **Report**: Summarize what was created (agents, skills, location).

## No Arguments — Show Usage

If $ARGUMENTS is empty or missing, respond with:

\`\`\`
Usage: /squad-create <domain-name>

Examples:
  /squad-create marketing     — Create a marketing squad (copywriter, strategist, designer)
  /squad-create legal         — Create a legal squad (contract reviewer, compliance, researcher)
  /squad-create devops        — Create a DevOps squad (infra, monitoring, security)
  /squad-create data-science  — Create a data science squad (analyst, ML engineer, visualizer)

The squad creator will ask scope:
  - Local (default): .kord/squads/<domain-name>/
  - Global: {OpenCodeConfigDir}/squads/<domain-name>/
  - Also supported local path: .opencode/squads/<domain-name>/

Generated structure:
  - SQUAD.yaml (v2 manifest)
  - README.md
  - agents/*.md (prompt files)
  - workflows/*.yaml (optional package workflows)
  - tasks/*.md (optional package tasks)
  - templates/*.md (optional package templates)
  - checklists/*.md (optional package checklists)
  - skills/*/SKILL.md
\`\`\`
`
