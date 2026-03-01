export interface StoredAgentFrontmatterCapabilities {
  write_paths?: string[]
  tool_allowlist?: string[]
  tool_denylist?: string[]
  can_delegate?: boolean
}

const frontmatterCapabilitiesStore = new Map<string, StoredAgentFrontmatterCapabilities>()

function normalizeAgentName(agentName: string): string {
  return agentName.trim().toLowerCase()
}

function cloneCapabilities(
  capabilities: StoredAgentFrontmatterCapabilities,
): StoredAgentFrontmatterCapabilities {
  return {
    ...(capabilities.write_paths !== undefined
      ? { write_paths: [...capabilities.write_paths] }
      : {}),
    ...(capabilities.tool_allowlist !== undefined
      ? { tool_allowlist: [...capabilities.tool_allowlist] }
      : {}),
    ...(capabilities.tool_denylist !== undefined
      ? { tool_denylist: [...capabilities.tool_denylist] }
      : {}),
    ...(capabilities.can_delegate !== undefined
      ? { can_delegate: capabilities.can_delegate }
      : {}),
  }
}

function hasAnyCapability(capabilities: StoredAgentFrontmatterCapabilities): boolean {
  return (
    capabilities.write_paths !== undefined ||
    capabilities.tool_allowlist !== undefined ||
    capabilities.tool_denylist !== undefined ||
    capabilities.can_delegate !== undefined
  )
}

export function setAgentFrontmatterCapabilities(
  agentName: string,
  capabilities: StoredAgentFrontmatterCapabilities,
): void {
  const key = normalizeAgentName(agentName)

  if (!hasAnyCapability(capabilities)) {
    frontmatterCapabilitiesStore.delete(key)
    return
  }

  frontmatterCapabilitiesStore.set(key, cloneCapabilities(capabilities))
}

export function getAgentFrontmatterCapabilities(
  agentName: string,
): StoredAgentFrontmatterCapabilities | undefined {
  const key = normalizeAgentName(agentName)
  const capabilities = frontmatterCapabilitiesStore.get(key)
  return capabilities ? cloneCapabilities(capabilities) : undefined
}

export function clearAgentFrontmatterCapabilities(agentName?: string): void {
  if (agentName) {
    frontmatterCapabilitiesStore.delete(normalizeAgentName(agentName))
    return
  }

  frontmatterCapabilitiesStore.clear()
}
