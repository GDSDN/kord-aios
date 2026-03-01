import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { loadOpenCodeAgents } from "./loader"

describe("opencode-agent-loader", () => {
  const testDir = join(process.cwd(), ".test-opencode-agents")

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
  })

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  //#given: Test directory does not exist
  //#when: loadOpenCodeAgents is called with non-existent directory
  //#then: Should return empty object without throwing
  it("should return empty object when directory does not exist", () => {
    const nonExistentDir = join(process.cwd(), ".non-existent-opencode-agents-dir")
    const result = loadOpenCodeAgents(nonExistentDir)
    expect(result).toEqual({})
  })

  //#given: Test directory exists with no .md files
  //#when: loadOpenCodeAgents is called with empty directory
  //#then: Should return empty object
  it("should return empty object for empty directory", () => {
    const result = loadOpenCodeAgents(testDir)
    expect(result).toEqual({})
  })

  //#given: Test directory has a valid .md agent file with frontmatter
  //#when: loadOpenCodeAgents is called
  //#then: Should parse frontmatter and return agent config
  it("should load agent from markdown file with frontmatter", () => {
    const agentContent = `---
name: my-agent
description: A test agent
model: anthropic/claude-sonnet-4-5
---

You are a test agent that does something.
`
    writeFileSync(join(testDir, "my-agent.md"), agentContent)

    const result = loadOpenCodeAgents(testDir)

    expect(result).toHaveProperty("my-agent")
    expect(result["my-agent"].description).toContain("my-agent")
    expect(result["my-agent"].mode).toBe("subagent")
    expect(result["my-agent"].prompt).toBe("You are a test agent that does something.")
  })

  //#given: Test directory has multiple .md agent files
  //#when: loadOpenCodeAgents is called
  //#then: Should return all agents keyed by filename without .md extension
  it("should load multiple agents keyed by filename", () => {
    const agent1Content = `---
name: agent-one
description: First agent
---

First agent prompt.
`
    const agent2Content = `---
name: agent-two
description: Second agent
---

Second agent prompt.
`
    writeFileSync(join(testDir, "agent-one.md"), agent1Content)
    writeFileSync(join(testDir, "agent-two.md"), agent2Content)

    const result = loadOpenCodeAgents(testDir)

    expect(Object.keys(result)).toHaveLength(2)
    expect(result).toHaveProperty("agent-one")
    expect(result).toHaveProperty("agent-two")
  })

  //#given: Test directory has non-.md files
  //#when: loadOpenCodeAgents is called
  //#then: Should ignore non-.md files
  it("should ignore non-markdown files", () => {
    writeFileSync(join(testDir, "agent.md"), "---\nname: test\n---\nPrompt")
    writeFileSync(join(testDir, "readme.txt"), "This is not an agent")

    const result = loadOpenCodeAgents(testDir)

    expect(Object.keys(result)).toHaveLength(1)
    expect(result).toHaveProperty("agent")
  })

  //#given: Test directory has a .md file with malformed frontmatter
  //#when: loadOpenCodeAgents is called
  //#then: Should skip the file and not crash
  it("should skip files with malformed frontmatter", () => {
    const badContent = `---
name: bad-agent
description: This frontmatter is broken
  invalid yaml: [
---

This should still be loaded as body content.
`
    writeFileSync(join(testDir, "bad-agent.md"), badContent)

    // Should not throw
    const result = loadOpenCodeAgents(testDir)
    // Malformed frontmatter should result in empty data, but file should be skipped
    // Actually the frontmatter parser returns parseError: true and keeps body
    // The loader should handle this gracefully
    expect(result).toEqual({})
  })

  //#given: Test directory has an agent file without frontmatter
  //#when: loadOpenCodeAgents is called
  //#then: Should still load the agent with just the body as prompt
  it("should load agent without frontmatter", () => {
    const noFrontmatterContent = `You are an agent without frontmatter.

Your purpose is to do things.
`
    writeFileSync(join(testDir, "no-frontmatter.md"), noFrontmatterContent)

    const result = loadOpenCodeAgents(testDir)

    expect(result).toHaveProperty("no-frontmatter")
    expect(result["no-frontmatter"].prompt).toContain("You are an agent without frontmatter")
  })

  //#given: Agent file has tools in frontmatter
  //#when: loadOpenCodeAgents is called
  //#then: Should parse tools into correct format
  it("should parse tools from frontmatter", () => {
    const withToolsContent = `---
name: tool-agent
description: Agent with tools
tools: Read, Edit, Bash
---

Prompt for tool agent.
`
    writeFileSync(join(testDir, "tool-agent.md"), withToolsContent)

    const result = loadOpenCodeAgents(testDir)

    expect(result["tool-agent"].tools).toBeDefined()
    expect(result["tool-agent"].tools).toEqual({
      read: true,
      edit: true,
      bash: true,
    })
  })

  //#given: Agent file has model and temperature in frontmatter
  //#when: loadOpenCodeAgents is called
  //#then: Should set model and temperature in config
  it("should parse model and temperature from frontmatter", () => {
    const content = `---
name: model-agent
description: Agent with model and temperature
model: anthropic/claude-opus-4-6
temperature: 0.5
---

Prompt for model agent.
`
    writeFileSync(join(testDir, "model-agent.md"), content)

    const result = loadOpenCodeAgents(testDir)

    expect(result["model-agent"].model).toBe("anthropic/claude-opus-4-6")
    expect(result["model-agent"].temperature).toBe(0.5)
  })

  //#given: Agent file has invalid write_paths (not an array)
  //#when: loadOpenCodeAgents is called
  //#then: Should skip the file gracefully
  it("should skip agent with invalid write_paths (not array)", () => {
    const content = `---
name: invalid-agent
description: Agent with invalid write_paths
write_paths: not-an-array
---

Prompt for invalid agent.
`
    writeFileSync(join(testDir, "invalid-agent.md"), content)

    const result = loadOpenCodeAgents(testDir)

    expect(result).toEqual({})
  })

  //#given: Agent file has invalid tool_allowlist (not an array)
  //#when: loadOpenCodeAgents is called
  //#then: Should skip the file gracefully
  it("should skip agent with invalid tool_allowlist (not array)", () => {
    const content = `---
name: invalid-allowlist-agent
description: Agent with invalid tool_allowlist
tool_allowlist: not-an-array
---

Prompt for invalid agent.
`
    writeFileSync(join(testDir, "invalid-allowlist-agent.md"), content)

    const result = loadOpenCodeAgents(testDir)

    expect(result).toEqual({})
  })

  //#given: Agent file has invalid engine_min_version (not valid semver)
  //#when: loadOpenCodeAgents is called
  //#then: Should skip the file gracefully
  it("should skip agent with invalid engine_min_version", () => {
    const content = `---
name: invalid-version-agent
description: Agent with invalid version
engine_min_version: not-semver
---

Prompt for invalid agent.
`
    writeFileSync(join(testDir, "invalid-version-agent.md"), content)

    const result = loadOpenCodeAgents(testDir)

    expect(result).toEqual({})
  })

  //#given: Agent file has valid write_paths array
  //#when: loadOpenCodeAgents is called
  //#then: Should load agent (write_paths are validated but not used in config yet)
  it("should load agent with valid write_paths array", () => {
    const content = `---
name: write-agent
description: Agent with write paths
write_paths:
  - src/
  - tests/
---

Prompt for write agent.
`
    writeFileSync(join(testDir, "write-agent.md"), content)

    const result = loadOpenCodeAgents(testDir)

    expect(result).toHaveProperty("write-agent")
    expect(result["write-agent"].description).toContain("write-agent")
  })

  //#given: Agent file has valid tool_allowlist array
  //#when: loadOpenCodeAgents is called
  //#then: Should load agent (tool_allowlist validated but not used in config yet)
  it("should load agent with valid tool_allowlist array", () => {
    const content = `---
name: allowlist-agent
description: Agent with tool allowlist
tool_allowlist:
  - Read
  - Edit
---

Prompt for allowlist agent.
`
    writeFileSync(join(testDir, "allowlist-agent.md"), content)

    const result = loadOpenCodeAgents(testDir)

    expect(result).toHaveProperty("allowlist-agent")
    expect(result["allowlist-agent"].description).toContain("allowlist-agent")
  })

  //#given: Agent file has valid engine_min_version (semver format)
  //#when: loadOpenCodeAgents is called
  //#then: Should load agent (version validated but not used for gating yet)
  it("should load agent with valid engine_min_version", () => {
    const content = `---
name: version-agent
description: Agent with version
engine_min_version: 1.0.0
---

Prompt for version agent.
`
    writeFileSync(join(testDir, "version-agent.md"), content)

    const result = loadOpenCodeAgents(testDir)

    expect(result).toHaveProperty("version-agent")
    expect(result["version-agent"].description).toContain("version-agent")
  })

  //#given: Agent requires engine_min_version higher than current plugin version
  //#when: loadOpenCodeAgents is called
  //#then: Should skip the agent and log warning
  it("should skip agent when engine_min_version is higher than current version", () => {
    const content = `---
name: future-agent
description: Agent requiring future version
engine_min_version: 999.0.0
---

This agent requires a newer version.
`
    writeFileSync(join(testDir, "future-agent.md"), content)

    // Mock console.warn to capture the warning
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    // Mock getCurrentPluginVersion to return a low version
    // We need to mock at the module level - let's use a different approach
    // by patching the module's internal function

    const result = loadOpenCodeAgents(testDir)

    // Agent should be skipped
    expect(result).not.toHaveProperty("future-agent")

    // Warning should be logged
    expect(warnSpy).toHaveBeenCalled()
    expect(warnSpy.mock.calls[0][0]).toContain("Skipping agent")
    expect(warnSpy.mock.calls[0][0]).toContain("999.0.0")

    warnSpy.mockRestore()
  })

  //#given: Agent requires engine_min_version lower than current plugin version
  //#when: loadOpenCodeAgents is called
  //#then: Should load the agent normally
  it("should load agent when engine_min_version is lower than current version", () => {
    const content = `---
name: compatible-agent
description: Agent compatible with current version
engine_min_version: 0.0.1
---

This agent is compatible.
`
    writeFileSync(join(testDir, "compatible-agent.md"), content)

    const result = loadOpenCodeAgents(testDir)

    // Agent should be loaded
    expect(result).toHaveProperty("compatible-agent")
    expect(result["compatible-agent"].description).toContain("compatible-agent")
  })

  //#given: Agent has no engine_min_version
  //#when: loadOpenCodeAgents is called
  //#then: Should load the agent normally
  it("should load agent without engine_min_version", () => {
    const content = `---
name: no-version-agent
description: Agent without version requirement
---

This agent has no version requirement.
`
    writeFileSync(join(testDir, "no-version-agent.md"), content)

    const result = loadOpenCodeAgents(testDir)

    // Agent should be loaded
    expect(result).toHaveProperty("no-version-agent")
    expect(result["no-version-agent"].description).toContain("no-version-agent")
  })
})
