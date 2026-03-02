import type { AgentConfig } from "@opencode-ai/sdk"
import type { SquadManifest, SquadAgent, SquadCategory } from "./schema"
import type { LoadedSquad } from "./loader"
import { CHIEF_COORDINATION_TEMPLATE } from "./chief-template"
import { convertAgentFallbackSlots } from "../../shared/agent-fallback"
import { setSquadAgentFallback } from "../../shared/squad-fallback-store"
import { setAgentFrontmatterCapabilities } from "../../shared/agent-frontmatter-capabilities-store"

/**
 * Built-in Kord AIOS agent names that cannot be used as squad names.
 * This prevents naming collisions that would break agent resolution.
 */
const BUILTIN_AGENT_NAMES = new Set([
  "kord",
  "dev",
  "dev-junior",
  "builder",
  "planner",
  "architect",
  "librarian",
  "explore",
  "vision",
  "analyst",
  "plan-analyzer",
  "plan-reviewer",
  "qa",
  "sm",
  "pm",
  "po",
  "devops",
  "data-engineer",
  "ux-design-expert",
  "squad-creator",
])

/**
 * Error thrown when a squad name collides with a built-in agent name.
 */
export class SquadNameCollisionError extends Error {
  constructor(public readonly squadName: string) {
    super(
      `Squad name "${squadName}" collides with built-in Kord AIOS agent name. ` +
      `Reserved names: ${[...BUILTIN_AGENT_NAMES].sort().join(", ")}`
    )
    this.name = "SquadNameCollisionError"
  }
}

function getPrefixedSquadAgentName(squadName: string, yamlKey: string): string {
  return `squad-${squadName}-${yamlKey}`
}

function summarizeAgentTools(agentDef: SquadAgent): string {
  if (!agentDef.tools || Object.keys(agentDef.tools).length === 0) return "default"

  return Object.entries(agentDef.tools)
    .map(([tool, enabled]) => `${tool}:${enabled ? "allow" : "deny"}`)
    .join(", ")
}

function buildChiefAwarenessSection(manifest: SquadManifest): string {
  const lines: string[] = [
    "## Squad Awareness",
    "",
    "### Squad Members",
  ]

  const agentEntries = Object.entries(manifest.agents) as [string, SquadAgent][]
  for (const [yamlKey, memberDef] of agentEntries) {
    const prefixedName = getPrefixedSquadAgentName(manifest.name, yamlKey)
    const skills = memberDef.skills.length > 0 ? memberDef.skills.join(", ") : "none"
    const tools = summarizeAgentTools(memberDef)
    lines.push(`- @${prefixedName} — ${memberDef.description} (skills: ${skills}; tools: ${tools})`)
  }

  lines.push("")
  lines.push("### Delegation Syntax")
  for (const [yamlKey, memberDef] of agentEntries) {
    const prefixedName = getPrefixedSquadAgentName(manifest.name, yamlKey)
    lines.push(`- \`task(subagent_type=\"${prefixedName}\")\` — ${memberDef.description}`)
  }

  return lines.join("\n")
}

function appendChiefAwarenessSection(
  basePrompt: string,
  manifest?: SquadManifest,
  customDomainContent?: string,
): string {
  if (!manifest) return basePrompt

  const awarenessSection = buildChiefAwarenessSection(manifest)
  const parts = [basePrompt.trimEnd(), awarenessSection]

  // Add custom domain methodology content if exists (only add if custom content exists)
  if (customDomainContent) {
    parts.push(customDomainContent)
  }

  // Append coordination protocol template
  parts.push(CHIEF_COORDINATION_TEMPLATE.replace(/\{SQUAD_NAME\}/g, manifest.name))

  return parts.join("\n\n")
}

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
  options?: { yamlKey?: string, manifest?: SquadManifest },
): AgentConfig {
  const yamlKey = options?.yamlKey ?? agentName
  const resolvedPrompt = resolvedPrompts?.[yamlKey]
  const customDomainContent = resolvedPrompt ?? agentDef.prompt ?? undefined

  // Identity header is always the default prompt for chiefs
  const identityHeader = buildDefaultSquadAgentPrompt(agentName, agentDef, squadName)

  const systemPrompt = agentDef.is_chief
    ? appendChiefAwarenessSection(identityHeader, options?.manifest, customDomainContent)
    : (customDomainContent ?? identityHeader)

  const config: AgentConfig = {
    description: `(${squadName} squad) ${agentDef.description}`,
    mode: agentDef.is_chief ? "all" : (agentDef.mode ?? "subagent"),
    prompt: systemPrompt,
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

  // Auto-enable task permission for chiefs unless explicitly overridden in SQUAD.yaml
  // Chiefs need task delegation to coordinate workers
  if (agentDef.is_chief) {
    const permission = config.permission as Record<string, "allow" | "deny"> | undefined
    if (permission?.task === undefined) {
      config.permission = { ...permission, task: "allow" } as typeof config.permission
    }
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
    for (const [yamlKey, agentDef] of agentEntries) {
      const prefixedName = getPrefixedSquadAgentName(manifest.name, yamlKey)
      agents.push({
        name: prefixedName,
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
    const agentNames = agentEntries
      .map(([yamlKey]) => `@${getPrefixedSquadAgentName(manifest.name, yamlKey)}`)
      .join(", ")
    const chief = agentEntries.find(([, a]) => a.is_chief)?.[0]
    const chiefDisplayName = chief ? `@${getPrefixedSquadAgentName(manifest.name, chief)}` : "—"
    lines.push(`| ${manifest.name} | ${manifest.description} | ${agentNames} | ${chiefDisplayName} |`)
  }

  // Delegation syntax per agent
  lines.push("")
  lines.push("### How to Delegate to Squad Agents")
  lines.push("")
  lines.push("Use `task(subagent_type=...)` to invoke a specific squad agent:")
  lines.push("")

  for (const { manifest } of squads) {
    const agentEntries = Object.entries(manifest.agents) as [string, SquadAgent][]
    for (const [yamlKey, agentDef] of agentEntries) {
      const prefixedName = getPrefixedSquadAgentName(manifest.name, yamlKey)
      lines.push(`- \`task(subagent_type="${prefixedName}")\` — ${agentDef.description}`)
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
 * Validates squad names don't collide with built-in agent names.
 */
export function createAllSquadAgentConfigs(squads: LoadedSquad[]): Map<string, AgentConfig> {
  const configs = new Map<string, AgentConfig>()

  // Validate squad names don't collide with built-in agent names
  for (const { manifest } of squads) {
    if (BUILTIN_AGENT_NAMES.has(manifest.name)) {
      throw new SquadNameCollisionError(manifest.name)
    }
  }

  for (const { manifest, resolvedPrompts } of squads) {
    const agentEntries = Object.entries(manifest.agents) as [string, SquadAgent][]
    for (const [yamlKey, agentDef] of agentEntries) {
      const prefixedName = getPrefixedSquadAgentName(manifest.name, yamlKey)
      configs.set(
        prefixedName,
        createSquadAgentConfig(prefixedName, agentDef, manifest.name, resolvedPrompts, { yamlKey, manifest }),
      )

      // Populate squad fallback store if agent has fallback defined
      if (agentDef.fallback && agentDef.fallback.length > 0) {
        const fallbackEntries = convertAgentFallbackSlots(agentDef.fallback)
        if (fallbackEntries && fallbackEntries.length > 0) {
          setSquadAgentFallback(prefixedName, fallbackEntries)
        }
      }

      // Populate write paths: convention paths + SQUAD.yaml write_paths
      const conventionPaths = [
        `docs/kord/squads/${manifest.name}/**`,
        `docs/${manifest.name}/**`,
      ]
      const mergedPaths = [...conventionPaths, ...(agentDef.write_paths ?? [])]
      setAgentFrontmatterCapabilities(prefixedName, { write_paths: mergedPaths })
    }
  }

  return configs
}
