import { existsSync, readdirSync, readFileSync } from "fs"
import { join, basename, dirname } from "path"
import type { AgentConfig } from "@opencode-ai/sdk"
import { parseFrontmatter } from "../../shared/frontmatter"
import { isMarkdownFile } from "../../shared/file-utils"
import { getOpenCodeConfigDir } from "../../shared/opencode-config-dir"
import { setAgentFrontmatterCapabilities } from "../../shared/agent-frontmatter-capabilities-store"
import { compareVersions } from "../../shared/opencode-version"
import type { OpenCodeAgentFrontmatter, LoadedOpenCodeAgent } from "./types"
import { parseOpenCodeAgentFrontmatter } from "./types"

// Cache for plugin version - read once at runtime
const NOT_CACHED = Symbol("NOT_CACHED")
let cachedPluginVersion: string | null | typeof NOT_CACHED = NOT_CACHED

/**
 * Get the current plugin version from package.json.
 * Cached after first read to avoid repeated filesystem access.
 */
function getCurrentPluginVersion(): string {
  if (cachedPluginVersion !== NOT_CACHED) {
    return cachedPluginVersion ?? "0.0.0"
  }

  try {
    // Find package.json in the plugin directory
    const possiblePaths = [
      join(dirname(process.execPath), "package.json"),
      join(process.cwd(), "package.json"),
      join(dirname(process.argv[1] || ""), "package.json"),
    ]

    for (const packageJsonPath of possiblePaths) {
      if (existsSync(packageJsonPath)) {
        const content = readFileSync(packageJsonPath, "utf-8")
        const pkg = JSON.parse(content)
        if (pkg.version && typeof pkg.version === "string") {
          cachedPluginVersion = pkg.version
          return pkg.version
        }
      }
    }

    cachedPluginVersion = null
    return "0.0.0"
  } catch {
    cachedPluginVersion = null
    return "0.0.0"
  }
}

function parseToolsConfig(toolsStr?: string): Record<string, boolean> | undefined {
  if (!toolsStr) return undefined

  const tools = toolsStr.split(",").map((t) => t.trim()).filter(Boolean)
  if (tools.length === 0) return undefined

  const result: Record<string, boolean> = {}
  for (const tool of tools) {
    result[tool.toLowerCase()] = true
  }
  return result
}

function loadAgentsFromDir(agentsDir: string): Record<string, AgentConfig> {
  if (!existsSync(agentsDir)) {
    return {}
  }

  const entries = readdirSync(agentsDir, { withFileTypes: true })
  const result: Record<string, AgentConfig> = {}

  for (const entry of entries) {
    //#given: Entry is not a markdown file
    //#when: Processing directory entries
    //#then: Skip non-.md files
    if (!isMarkdownFile(entry)) continue

    const agentPath = join(agentsDir, entry.name)
    const agentName = basename(entry.name, ".md")

    try {
      const content = readFileSync(agentPath, "utf-8")
      const { data, body, parseError } = parseFrontmatter<OpenCodeAgentFrontmatter>(content)

      //#given: Frontmatter is malformed (parseError: true)
      //#when: Parsing agent file
      //#then: Skip this file gracefully (do not crash)
      if (parseError) {
        continue
      }

      // Validate frontmatter data shape using Zod schema
      const validationResult = parseOpenCodeAgentFrontmatter(data)
      if (!validationResult.ok) {
        // Invalid frontmatter shape - skip gracefully without crashing
        continue
      }

      const validatedData = validationResult.value

      // Check engine_min_version compatibility gating
      if (validatedData.engine_min_version) {
        const currentVersion = getCurrentPluginVersion()
        const requiredVersion = validatedData.engine_min_version

        // If current plugin version is less than required, skip loading this agent
        if (compareVersions(currentVersion, requiredVersion) < 0) {
          // Log warning but don't block startup - skip silently
          console.warn(
            `[kord-aios] Skipping agent "${agentName}": requires engine_min_version ${requiredVersion}, current version is ${currentVersion}`,
          )
          continue
        }
      }

      const name = validatedData.name || agentName
      const originalDescription = validatedData.description || ""
      const formattedDescription = originalDescription
        ? `${name}: ${originalDescription}`
        : name

      const config: AgentConfig = {
        description: formattedDescription,
        mode: "subagent",
        prompt: body.trim(),
      }

      // Add model if specified
      if (validatedData.model) {
        config.model = validatedData.model
      }

      // Add temperature if specified
      if (validatedData.temperature !== undefined) {
        config.temperature = validatedData.temperature
      }

      const toolsConfig = parseToolsConfig(validatedData.tools)
      if (toolsConfig) {
        config.tools = toolsConfig
      }

      setAgentFrontmatterCapabilities(agentName, {
        write_paths: validatedData.write_paths,
        tool_allowlist: validatedData.tool_allowlist,
      })

      // Key by filename without .md, as per task requirements
      result[agentName] = config
    } catch {
      //#given: Unexpected error reading file
      //#when: Loading agent
      //#then: Skip file gracefully (do not crash)
      continue
    }
  }

  return result
}

/**
 * Load OpenCode agents from a specific directory.
 * Agents are defined as .md files with YAML frontmatter.
 *
 * @param agentsDir - Directory to load agents from
 * @returns Record of agent name -> AgentConfig
 */
export function loadOpenCodeAgents(agentsDir: string): Record<string, AgentConfig> {
  //#given: Directory does not exist
  //#when: loadOpenCodeAgents is called
  //#then: Return empty object without throwing
  if (!existsSync(agentsDir)) {
    return {}
  }

  return loadAgentsFromDir(agentsDir)
}

/**
 * Load OpenCode agents from both project and user global directories.
 *
 * Project agents: .opencode/agents/*.md
 * User agents: ~/.config/opencode/agents/*.md (or equivalent)
 *
 * @returns Record of agent name -> AgentConfig
 */
export function loadAllOpenCodeAgents(): Record<string, AgentConfig> {
  const projectAgentsDir = join(process.cwd(), ".opencode", "agents")
  const userAgentsDir = join(getOpenCodeConfigDir({ binary: "opencode", checkExisting: false }), "agents")

  const projectAgents = loadOpenCodeAgents(projectAgentsDir)
  const userAgents = loadOpenCodeAgents(userAgentsDir)

  // Merge: user agents override project agents
  return {
    ...projectAgents,
    ...userAgents,
  }
}
