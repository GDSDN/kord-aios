/**
 * Build Orchestrator - Shared Utilities
 *
 * Common functions for building dynamic prompt sections used by both
 * default (Claude-optimized) and GPT-optimized prompts.
 */

import type { CategoryConfig } from "../../config/schema"
import { formatCustomSkillsBlock, type AvailableAgent, type AvailableSkill } from "../dynamic-agent-prompt-builder"
import { DEFAULT_CATEGORIES, CATEGORY_DESCRIPTIONS } from "../../tools/delegate-task/constants"

export const getCategoryDescription = (name: string, userCategories?: Record<string, CategoryConfig>) =>
  userCategories?.[name]?.description ?? CATEGORY_DESCRIPTIONS[name] ?? "General tasks"

export function buildAgentSelectionSection(agents: AvailableAgent[]): string {
  if (agents.length === 0) {
    return `##### Option A: Specialized Agents (PREFERRED for specific domains)

No agents available.`
  }

  const rows = agents.map((a) => {
    const shortDesc = a.description.split(".")[0] || a.description
    return `| \`${a.name}\` | ${shortDesc} |`
  })

  // Filter out agents that are already explicitly listed or should be excluded
  const otherAgents = rows.filter(row => 
    !row.includes("`dev`") && 
    !row.includes("`architect`") && 
    !row.includes("`librarian`") && 
    !row.includes("`explore`") && 
    !row.includes("`vision`") && 
    !row.includes("`qa`") && 
    !row.includes("`data-engineer`") && 
    !row.includes("`devops`") &&
    !row.includes("`analyst`") &&
    !row.includes("`pm`") &&
    !row.includes("`po`") &&
    !row.includes("`sm`") &&
    !row.includes("`squad-creator`") &&
    !row.includes("`ux-design-expert`")
  ).join("\n")

  return `##### Option A: Specialized Agents (PREFERRED for specific domains)

Use these agents when the task requires specific expertise (Research, Architecture, QA, etc.).

| Agent | Best For |
|-------|----------|
| \`dev-junior\` | **Atomic Implementation** - Default executor for single-file changes, bug fixes, UI tweaks (Category-based) |
| \`dev\` | **Complex Implementation** - Multi-file changes, difficult refactors, deep logic |
| \`architect\` | **System Design** - Architecture decisions, debugging hard problems, reviewing plans |
| \`librarian\` | **Research** - Finding docs, searching GitHub, understanding external libs |
| \`explore\` | **Code Search** - Finding patterns, understanding codebase structure (Contextual Grep) |
| \`vision\` | **Visual Analysis** - Analyzing images, PDFs, screenshots |
| \`qa\` | **Quality Assurance** - Creating test plans, verifying complex behaviors |
| \`data-engineer\` | **Data** - SQL, schemas, migrations, ETL |
| \`devops\` | **Infrastructure** - CI/CD, Docker, Cloud, Deployment |
| \`analyst\` | **Research & Analysis** - Pre-planning research, scope clarification |
| \`pm\` | **Product Management** - PRD creation, product strategy, feature definition |
| \`po\` | **Product Ownership** - Backlog management, story validation, prioritization |
| \`sm\` | **Scrum Master** - Story creation, sprint planning, epic decomposition |
| \`ux-design-expert\` | **UX/UI Design** - Wireframes, accessibility, user research, design systems |
| \`squad-creator\` | **Team Building** - Creating new specialized agent squads |
${otherAgents}`
}

export function buildCategorySection(userCategories?: Record<string, CategoryConfig>): string {
  const allCategories = { ...DEFAULT_CATEGORIES, ...userCategories }
  const categoryRows = Object.entries(allCategories).map(([name, config]) => {
    const temp = config.temperature ?? 0.5
    return `| \`${name}\` | ${temp} | ${getCategoryDescription(name, userCategories)} |`
  })

  return `##### Option B: General Implementation (Category-based)

Use these categories for standard atomic tasks. Spawns \`Dev-Junior-{category}\`.

| Category | Temperature | Best For |
|----------|-------------|----------|
${categoryRows.join("\n")}

\`\`\`typescript
task(category="[category-name]", load_skills=[...], run_in_background=false, prompt="...")
\`\`\``
}

export function buildSkillsSection(skills: AvailableSkill[]): string {
  if (skills.length === 0) {
    return ""
  }

  const builtinSkills = skills.filter((s) => s.location === "plugin")
  const customSkills = skills.filter((s) => s.location !== "plugin")

  const builtinRows = builtinSkills.map((s) => {
    const shortDesc = s.description.split(".")[0] || s.description
    return `| \`${s.name}\` | ${shortDesc} |`
  })

  const customRows = customSkills.map((s) => {
    const shortDesc = s.description.split(".")[0] || s.description
    const source = s.location === "project" ? "project" : "user"
    return `| \`${s.name}\` | ${shortDesc} | ${source} |`
  })

  const customSkillBlock = formatCustomSkillsBlock(customRows, customSkills, "**")

  let skillsTable: string

  if (customSkills.length > 0 && builtinSkills.length > 0) {
    skillsTable = `**Built-in Skills:**

| Skill | When to Use |
|-------|-------------|
${builtinRows.join("\n")}

${customSkillBlock}`
  } else if (customSkills.length > 0) {
    skillsTable = customSkillBlock
  } else {
    skillsTable = `| Skill | When to Use |
|-------|-------------|
${builtinRows.join("\n")}`
  }

  return `
#### 3.2.2: Skill Selection (PREPEND TO PROMPT)

**Skills are specialized instructions that guide subagent behavior. Consider them alongside category selection.**

${skillsTable}

**MANDATORY: Evaluate ALL skills (built-in AND user-installed) for relevance to your task.**

Read each skill's description and ask: "Does this skill's domain overlap with my task?"
- If YES: INCLUDE in load_skills=[...]
- If NO: You MUST justify why in your pre-delegation declaration

**Usage:**
\`\`\`typescript
task(category="[category]", load_skills=["skill-1", "skill-2"], run_in_background=false, prompt="...")
\`\`\`

**IMPORTANT:**
- Skills get prepended to the subagent's prompt, providing domain-specific instructions
- Subagents are STATELESS - they don't know what skills exist unless you include them
- Missing a relevant skill = suboptimal output quality`
}

export function buildDecisionMatrix(agents: AvailableAgent[], userCategories?: Record<string, CategoryConfig>): string {
  const allCategories = { ...DEFAULT_CATEGORIES, ...userCategories }

  const categoryRows = Object.entries(allCategories).map(([name]) =>
    `| ${getCategoryDescription(name, userCategories)} | \`category="${name}", load_skills=[...]\` |`
  )

  const agentRows = agents.map((a) => {
    const shortDesc = a.description.split(".")[0] || a.description
    return `| ${shortDesc} | \`agent="${a.name}"\` |`
  })

  return `##### Decision Matrix

| Task Domain | Use |
|-------------|-----|
${categoryRows.join("\n")}
${agentRows.join("\n")}

**NEVER provide both category AND agent - they are mutually exclusive.**`
}
