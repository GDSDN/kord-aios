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
})
