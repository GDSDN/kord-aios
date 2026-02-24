import type { AgentConfig } from "@opencode-ai/sdk"
import type { SquadManifest, SquadAgent, SquadCategory } from "./schema"
import type { LoadedSquad } from "./loader"

/** Squad agent entry for prompt builder injection */
export interface SquadAvailableAgent {
  name: string
  description: string
  squadName: string
  isChief: boolean
}

/** Squad category entry for prompt builder injection */
export interface SquadAvailableCategory {
  name: string
  description: string
  squadName: string
  model?: string
}

/**
 * Creates an AgentConfig from a squad agent definition.
 * Squad agents are registered as subagents that can be invoked via task(subagent_type=...).
 */
export function createSquadAgentConfig(
  agentName: string,
  agentDef: SquadAgent,
  squadName: string,
  resolvedPrompts?: Record<string, string>,
): AgentConfig {
  const resolvedPrompt = resolvedPrompts?.[agentName]
  const systemPrompt = resolvedPrompt ?? agentDef.prompt ?? buildDefaultSquadAgentPrompt(agentName, agentDef, squadName)

  const config: AgentConfig = {
    name: agentName,
    system: systemPrompt,
    ...(agentDef.model ? { model: agentDef.model } : {}),
    ...(agentDef.temperature !== undefined ? { temperature: agentDef.temperature } : {}),
  }

  // Apply tool permissions from SQUAD.yaml
  if (agentDef.tools && Object.keys(agentDef.tools).length > 0) {
    // Convert { "bash": false } to permission record
    // false = deny, true = allow
    const permission: Record<string, "allow" | "deny"> = {}
    for (const [tool, enabled] of Object.entries(agentDef.tools)) {
      permission[tool] = enabled ? "allow" : "deny"
    }
    config.permission = permission
  }

  return config
}

function buildDefaultSquadAgentPrompt(
  agentName: string,
  agentDef: SquadAgent,
  squadName: string,
): string {
  return `You are ${agentName}, a specialist agent in the ${squadName} squad of Kord AIOS.

Role: ${agentDef.description}

You are invoked as a subagent via the task() tool. Complete your assigned work thoroughly and report results clearly.

${agentDef.is_chief ? `As squad chief, you can delegate to other agents in your squad using the task() tool.` : `Focus on your specific task. Do not delegate — complete the work yourself.`}
`
}

/**
 * Extracts squad agent entries from loaded squads for prompt builder injection.
 */
export function getSquadAgents(squads: LoadedSquad[]): SquadAvailableAgent[] {
  const agents: SquadAvailableAgent[] = []

  for (const { manifest } of squads) {
    const agentEntries = Object.entries(manifest.agents) as [string, SquadAgent][]
    for (const [name, agentDef] of agentEntries) {
      agents.push({
        name,
        description: `(${manifest.name} squad) ${agentDef.description}`,
        squadName: manifest.name,
        isChief: agentDef.is_chief,
      })
    }
  }

  return agents
}

/**
 * Extracts squad category entries from loaded squads for prompt builder injection.
 */
export function getSquadCategories(squads: LoadedSquad[]): SquadAvailableCategory[] {
  const categories: SquadAvailableCategory[] = []

  for (const { manifest } of squads) {
    if (!manifest.categories) continue

    const catEntries = Object.entries(manifest.categories) as [string, SquadCategory][]
    for (const [name, catDef] of catEntries) {
      categories.push({
        name: `${manifest.name}:${name}`,
        description: `(${manifest.name} squad) ${catDef.description}`,
        squadName: manifest.name,
        model: catDef.model,
      })
    }
  }

  return categories
}

/**
 * Builds a prompt section describing available squads for injection into Kord's system prompt.
 * Includes delegation syntax, category routing, and skills.
 */
export function buildSquadPromptSection(squads: LoadedSquad[]): string {
  if (squads.length === 0) return ""

  const lines: string[] = [
    "### Available Squads",
    "",
    "| Squad | Domain | Agents | Chief |",
    "|-------|--------|--------|-------|",
  ]

  for (const { manifest } of squads) {
    const agentEntries = Object.entries(manifest.agents) as [string, SquadAgent][]
    const agentNames = agentEntries.map(([n]) => `@${n}`).join(", ")
    const chief = agentEntries.find(([, a]) => a.is_chief)?.[0]
    lines.push(`| ${manifest.name} | ${manifest.description} | ${agentNames} | ${chief ? `@${chief}` : "—"} |`)
  }

  // Delegation syntax per agent
  lines.push("")
  lines.push("### How to Delegate to Squad Agents")
  lines.push("")
  lines.push("Use `task(subagent_type=...)` to invoke a specific squad agent:")
  lines.push("")

  for (const { manifest } of squads) {
    const agentEntries = Object.entries(manifest.agents) as [string, SquadAgent][]
    for (const [name, agentDef] of agentEntries) {
      lines.push(`- \`task(subagent_type="${name}")\` — ${agentDef.description}`)
    }
  }

  // Category routing
  const hasCategories = squads.some(({ manifest }) => manifest.categories && Object.keys(manifest.categories).length > 0)
  if (hasCategories) {
    lines.push("")
    lines.push("### Squad Categories")
    lines.push("")
    lines.push("Use `task(category=...)` for domain-specific routing:")
    lines.push("")

    for (const { manifest } of squads) {
      if (!manifest.categories) continue
      const catEntries = Object.entries(manifest.categories) as [string, SquadCategory][]
      for (const [name, catDef] of catEntries) {
        lines.push(`- \`task(category="${manifest.name}:${name}")\` — ${catDef.description}`)
      }
    }
  }

  // Skills per squad
  const hasSkills = squads.some(({ manifest }) => {
    const agentEntries = Object.entries(manifest.agents) as [string, SquadAgent][]
    return agentEntries.some(([, a]) => a.skills.length > 0)
  })
  if (hasSkills) {
    lines.push("")
    lines.push("### Squad Skills")
    lines.push("")

    for (const { manifest } of squads) {
      const agentEntries = Object.entries(manifest.agents) as [string, SquadAgent][]
      const allSkills = agentEntries.flatMap(([, a]) => a.skills)
      if (allSkills.length > 0) {
        const unique = [...new Set(allSkills)]
        lines.push(`- **${manifest.name}**: ${unique.join(", ")}`)
      }
    }
  }

  return lines.join("\n")
}

/**
 * Creates all AgentConfigs from loaded squads.
 */
export function createAllSquadAgentConfigs(squads: LoadedSquad[]): Map<string, AgentConfig> {
  const configs = new Map<string, AgentConfig>()

  for (const { manifest, resolvedPrompts } of squads) {
    const agentEntries = Object.entries(manifest.agents) as [string, SquadAgent][]
    for (const [name, agentDef] of agentEntries) {
      configs.set(name, createSquadAgentConfig(name, agentDef, manifest.name, resolvedPrompts))
    }
  }

  return configs
}
