import { existsSync, readdirSync, readFileSync } from "fs"
import { join, basename } from "path"
import type { AgentConfig } from "@opencode-ai/sdk"
import { parseFrontmatter } from "../../shared/frontmatter"
import { isMarkdownFile } from "../../shared/file-utils"
import { getOpenCodeConfigDir } from "../../shared/opencode-config-dir"
import type { OpenCodeAgentFrontmatter, LoadedOpenCodeAgent } from "./types"
import { parseOpenCodeAgentFrontmatter } from "./types"

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
