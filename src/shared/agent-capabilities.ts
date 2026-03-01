/**
 * Declarative Permission Model for Kord AIOS.
 *
 * This module provides a unified capability resolution system for agents,
 * combining multiple permission sources with a clear precedence order.
 *
 * Resolution precedence (lowest to highest):
 * 1. Agent frontmatter defaults (from .opencode/agents/*.md or ~/.config/opencode/agents/*.md)
 * 2. Squad manifest tool permissions (for squad agents)
 * 3. kord-aios.json agent overrides (admin override - highest priority)
 * 4. Hardcoded defaults for T0/T1 agents (kord, dev, dev-junior)
 * 5. Fallback to DEFAULT_AGENT_ALLOWLIST for legacy agents
 */

import { DEFAULT_AGENT_ALLOWLIST } from "../hooks/agent-authority/constants"

/**
 * Core capabilities interface for an agent.
 * All fields except can_delegate are required; can_delegate defaults to true.
 */
export interface AgentCapabilities {
  /** File paths the agent is allowed to write to (glob patterns) */
  write_paths: string[]
  /** Optional allowlist of tools the agent can use (if specified, only these tools are allowed) */
  tool_allowlist?: string[]
  /** Optional denylist of tools the agent cannot use */
  tool_denylist?: string[]
  /** Whether the agent can delegate tasks to other agents (defaults to true) */
  can_delegate?: boolean
}

/**
 * Agent frontmatter capabilities (lowest priority - used as defaults).
 * This comes from agent .md files in .opencode/agents/ or ~/.config/opencode/agents/
 */
export interface AgentFrontmatterCapabilities {
  write_paths?: string[]
  tool_allowlist?: string[]
  tool_denylist?: string[]
  can_delegate?: boolean
}

/**
 * Squad manifest tool permissions for squad agents.
 * This comes from SQUAD.yaml manifests.
 */
export interface SquadCapabilities {
  write_paths?: string[]
  tool_allowlist?: string[]
  tool_denylist?: string[]
  can_delegate?: boolean
}

/**
 * kord-aios.json agent configuration overrides (highest priority).
 * This is the admin override from user/project config.
 */
export interface ConfigCapabilities {
  write_paths?: string[]
  tool_allowlist?: string[]
  tool_denylist?: string[]
  can_delegate?: boolean
}

/**
 * Input sources for capability resolution.
 * Each source is optional - the resolver will use precedence rules.
 */
export interface AgentCapabilitySources {
  /** Agent frontmatter from .md file (lowest priority) */
  frontmatter?: AgentFrontmatterCapabilities
  /** Squad manifest permissions (medium priority) */
  squad?: SquadCapabilities
  /** kord-aios.json config overrides (highest priority) */
  config?: ConfigCapabilities
}

/**
 * T0/T1 hardcoded agents that have full access by default.
 * These are the primary orchestration agents.
 */
const T0_T1_AGENTS = new Set(["kord", "dev", "dev-junior"])

/**
 * Resolves agent capabilities from multiple sources with precedence ordering.
 *
 * Resolution order (lowest to highest priority):
 * 1. Agent frontmatter defaults
 * 2. Squad manifest tool permissions
 * 3. kord-aios.json agent overrides
 * 4. Hardcoded defaults for T0/T1 agents
 * 5. DEFAULT_AGENT_ALLOWLIST fallback for known legacy agents
 *
 * @param agentName - The name of the agent to resolve capabilities for
 * @param sources - Optional capability sources from frontmatter, squad, or config
 * @returns Resolved AgentCapabilities with proper precedence
 */
export function getAgentCapabilities(
  agentName: string,
  sources: AgentCapabilitySources = {}
): AgentCapabilities {
  const normalizedAgentName = agentName.toLowerCase()

  // Start with empty base capabilities
  const result: AgentCapabilities = {
    write_paths: [],
    can_delegate: true,
  }

  // Apply sources in precedence order (lowest to highest)

  // 1. Apply frontmatter as base defaults (lowest priority)
  if (sources.frontmatter) {
    if (sources.frontmatter.write_paths !== undefined) {
      result.write_paths = sources.frontmatter.write_paths
    }
    if (sources.frontmatter.tool_allowlist !== undefined) {
      result.tool_allowlist = sources.frontmatter.tool_allowlist
    }
    if (sources.frontmatter.tool_denylist !== undefined) {
      result.tool_denylist = sources.frontmatter.tool_denylist
    }
    if (sources.frontmatter.can_delegate !== undefined) {
      result.can_delegate = sources.frontmatter.can_delegate
    }
  }

  // 2. Apply squad manifest (overrides frontmatter)
  if (sources.squad) {
    if (sources.squad.write_paths !== undefined) {
      result.write_paths = sources.squad.write_paths
    }
    if (sources.squad.tool_allowlist !== undefined) {
      result.tool_allowlist = sources.squad.tool_allowlist
    }
    if (sources.squad.tool_denylist !== undefined) {
      result.tool_denylist = sources.squad.tool_denylist
    }
    if (sources.squad.can_delegate !== undefined) {
      result.can_delegate = sources.squad.can_delegate
    }
  }

  // 3. Apply kord-aios.json config (highest priority for overrides)
  if (sources.config) {
    if (sources.config.write_paths !== undefined) {
      result.write_paths = sources.config.write_paths
    }
    if (sources.config.tool_allowlist !== undefined) {
      result.tool_allowlist = sources.config.tool_allowlist
    }
    if (sources.config.tool_denylist !== undefined) {
      result.tool_denylist = sources.config.tool_denylist
    }
    if (sources.config.can_delegate !== undefined) {
      result.can_delegate = sources.config.can_delegate
    }
  }

  // 4. Apply hardcoded defaults for T0/T1 agents (if no paths set from sources)
  // This acts as a fallback when no explicit sources provided
  const hasExplicitWritePaths =
    sources.frontmatter?.write_paths !== undefined ||
    sources.squad?.write_paths !== undefined ||
    sources.config?.write_paths !== undefined

  if (!hasExplicitWritePaths) {
    // Check for T0/T1 agents first
    if (T0_T1_AGENTS.has(normalizedAgentName)) {
      result.write_paths = ["**"]
      result.can_delegate = true
    }
    // Check DEFAULT_AGENT_ALLOWLIST fallback
    else if (normalizedAgentName in DEFAULT_AGENT_ALLOWLIST) {
      result.write_paths = DEFAULT_AGENT_ALLOWLIST[normalizedAgentName]
      result.can_delegate = true
    }
    // Unknown agent with no sources - keep empty write_paths (deny all)
  }

  // Ensure can_delegate defaults to true if not explicitly set
  if (result.can_delegate === undefined) {
    result.can_delegate = true
  }

  return result
}
