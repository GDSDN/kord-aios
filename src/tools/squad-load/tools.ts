import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { isAbsolute, join, resolve } from "node:path"
import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import yaml from "js-yaml"
import { SQUAD_LOAD_DESCRIPTION } from "./constants"
import type { SquadLoadArgs } from "./types"
import type { SquadManifest, SquadAgent, SquadConfig, PlanType } from "../../shared/types"

const DEFAULT_SEARCH_PATHS = [
  ".opencode/squads",
  ".kord/squads",
  "docs/kord/squads",
]

export function findSquadManifestPath(directory: string, squadName: string): string | null {
  for (const base of DEFAULT_SEARCH_PATHS) {
    const candidate = join(directory, base, squadName, "SQUAD.yaml")
    if (existsSync(candidate)) return candidate
  }
  return null
}

function mapAgents(rawAgents: Record<string, { description?: string; role?: string }>): SquadAgent[] {
  return Object.entries(rawAgents).map(([name, agent]) => ({
    name,
    role: agent.role ?? undefined,
    description: agent.description ?? undefined,
  }))
}

function normalizePlanType(value: unknown): PlanType | undefined {
  if (typeof value !== "string") return undefined
  if (value === "story-driven" || value === "task-driven" || value === "research") {
    return value
  }
  return undefined
}

function buildConfig(raw: Record<string, unknown>): SquadConfig | undefined {
  const planFormat = normalizePlanType(raw.contract_type)
  const executionRules = Array.isArray(raw.execution_rules)
    ? raw.execution_rules.filter((value): value is string => typeof value === "string")
    : undefined

  const overrides = typeof raw.overrides === "object" && raw.overrides !== null
    ? (raw.overrides as Record<string, string>)
    : undefined

  if (!planFormat && !executionRules && !overrides) return undefined

  return {
    planFormat,
    executionRules,
    overrides,
  }
}

export function parseSquadManifest(content: string): SquadManifest {
  const raw = yaml.load(content)
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid SQUAD.yaml content")
  }
  const data = raw as Record<string, unknown>
  const name = typeof data.name === "string" ? data.name : "unknown"
  const description = typeof data.description === "string" ? data.description : undefined
  const agentsRaw = typeof data.agents === "object" && data.agents !== null
    ? (data.agents as Record<string, { description?: string; role?: string }>)
    : {}

  return {
    name,
    description,
    agents: mapAgents(agentsRaw),
    config: buildConfig(data),
  }
}

export function createSquadLoadTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: SQUAD_LOAD_DESCRIPTION,
    args: {
      squad_name: tool.schema.string().optional().describe("Squad name to load (directory name)"),
      squad_path: tool.schema.string().optional().describe("Explicit path to SQUAD.yaml"),
    },
    execute: async (args: SquadLoadArgs) => {
      if (!args.squad_name && !args.squad_path) {
        return "Error: Provide squad_name or squad_path."
      }

      const resolvedPath = args.squad_path
        ? (isAbsolute(args.squad_path) ? args.squad_path : resolve(ctx.directory, args.squad_path))
        : findSquadManifestPath(ctx.directory, args.squad_name!)

      if (!resolvedPath || !existsSync(resolvedPath)) {
        return `Error: Squad manifest not found.`
      }

      try {
        const content = await readFile(resolvedPath, "utf-8")
        const manifest = parseSquadManifest(content)
        return JSON.stringify({ manifest, path: resolvedPath })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `Error: Failed to load squad manifest. ${message}`
      }
    },
  })
}
