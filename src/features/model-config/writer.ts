import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import type { AgentFallbackSlot } from "../../config/schema"

export interface ModelConfigUpdate {
  fallback?: AgentFallbackSlot[]
}

export interface WriteResult {
  success: boolean
  error?: string
}

function getConfigPath(projectDir: string): string {
  return join(projectDir, ".opencode", "kord-aios.json")
}

function readExistingConfig(configPath: string): Record<string, unknown> {
  if (!existsSync(configPath)) {
    return {}
  }
  try {
    const content = readFileSync(configPath, "utf-8")
    if (!content.trim()) return {}
    return JSON.parse(content)
  } catch {
    return {}
  }
}

function ensureDir(configPath: string): void {
  const dir = configPath.replace(/[/\\][^/\\]+$/, "")
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function writeAgentModelConfig(
  agentName: string,
  update: ModelConfigUpdate,
  projectDir: string,
): WriteResult {
  const configPath = getConfigPath(projectDir)

  try {
    ensureDir(configPath)
    const config = readExistingConfig(configPath)

    if (!config.agents || typeof config.agents !== "object") {
      config.agents = {}
    }

    const agents = config.agents as Record<string, Record<string, unknown>>
    if (!agents[agentName] || typeof agents[agentName] !== "object") {
      agents[agentName] = {}
    }

    const agentConfig = agents[agentName]

    if (update.fallback !== undefined) {
      agentConfig.fallback = update.fallback
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export function resetAgentModelConfig(
  agentName: string,
  projectDir: string,
): WriteResult {
  const configPath = getConfigPath(projectDir)

  if (!existsSync(configPath)) {
    return { success: true }
  }

  try {
    const config = readExistingConfig(configPath)
    const agents = config.agents as Record<string, Record<string, unknown>> | undefined

    if (!agents || !agents[agentName]) {
      return { success: true }
    }

    delete agents[agentName].fallback

    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
