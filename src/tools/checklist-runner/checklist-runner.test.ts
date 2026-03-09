import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { PluginInput } from "@opencode-ai/plugin"
import type { ChecklistRunnerResult } from "./types"
import { createChecklistRunnerTool } from "./tools"

const tempDirs: string[] = []

async function createTempProject(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "checklist-runner-"))
  tempDirs.push(directory)
  return directory
}

async function executeTool(
  directory: string,
  checklistPath: string,
  targetPath: string,
): Promise<ChecklistRunnerResult> {
  const pluginInput = { directory } as PluginInput
  const toolDef = createChecklistRunnerTool(pluginInput)
  const output = await toolDef.execute({
    checklist_path: checklistPath,
    target_path: targetPath,
  })
  return JSON.parse(output as string) as ChecklistRunnerResult
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe("checklist_runner", () => {
  test("returns partial pass for valid checklist and target", async () => {
    //#given
    const directory = await createTempProject()
    await writeFile(
      join(directory, "checklist.md"),
      [
        "- [ ] Frontmatter includes title, type, status",
        "- [ ] ## Acceptance Criteria section exists",
        "- [ ] ## Acceptance Criteria section is non-empty",
        "- [ ] Acceptance criteria uses Given/When/Then or checklist format",
      ].join("\n"),
      "utf-8",
    )
    await writeFile(
      join(directory, "target.md"),
      [
        "---",
        "title: Story",
        "type: feature",
        "---",
        "",
        "## Acceptance Criteria",
        "- [ ] Item one",
      ].join("\n"),
      "utf-8",
    )

    //#when
    const result = await executeTool(directory, "checklist.md", "target.md")

    //#then
    expect(result.total).toBe(4)
    expect(result.passed_count).toBe(3)
    expect(result.failed_count).toBe(1)
    expect(result.passed).toBe(false)
  })

  test("fails when target file is missing", async () => {
    //#given
    const directory = await createTempProject()
    await writeFile(join(directory, "checklist.md"), "- [ ] ## Acceptance Criteria section exists\n", "utf-8")

    //#when
    const result = await executeTool(directory, "checklist.md", "missing-target.md")

    //#then
    expect(result.passed).toBe(false)
    expect(result.failed_count).toBe(1)
    expect(result.items[0]?.reason).toContain("Target file not found")
  })

  test("fails when checklist file is missing", async () => {
    //#given
    const directory = await createTempProject()
    await writeFile(join(directory, "target.md"), "# Target\n", "utf-8")

    //#when
    const result = await executeTool(directory, "missing-checklist.md", "target.md")

    //#then
    expect(result.passed).toBe(false)
    expect(result.failed_count).toBe(1)
    expect(result.items[0]?.reason).toContain("Checklist file not found")
  })

  test("returns passed true when all checks pass", async () => {
    //#given
    const directory = await createTempProject()
    await writeFile(
      join(directory, "checklist.md"),
      [
        "- [ ] Frontmatter includes title, type, status",
        "- [ ] ## Acceptance Criteria section exists",
        "- [ ] ## Acceptance Criteria section is non-empty",
        "- [ ] Acceptance criteria uses Given/When/Then or checklist format",
      ].join("\n"),
      "utf-8",
    )
    await writeFile(
      join(directory, "target.md"),
      [
        "---",
        "title: Story",
        "type: feature",
        "status: READY",
        "---",
        "",
        "## Acceptance Criteria",
        "Given the user has a plan",
        "When checklist_runner executes",
        "Then deterministic validation passes",
      ].join("\n"),
      "utf-8",
    )

    //#when
    const result = await executeTool(directory, "checklist.md", "target.md")

    //#then
    expect(result.passed).toBe(true)
    expect(result.passed_count).toBe(4)
    expect(result.failed_count).toBe(0)
  })

  test("returns passed false for required-check failures", async () => {
    //#given
    const directory = await createTempProject()
    await writeFile(
      join(directory, "checklist.md"),
      [
        "- [ ] Frontmatter includes title, type, status",
        "- [ ] ## Acceptance Criteria section exists",
        "- [ ] ## Acceptance Criteria section is non-empty",
      ].join("\n"),
      "utf-8",
    )
    await writeFile(
      join(directory, "target.md"),
      [
        "---",
        "title: Story",
        "---",
        "",
        "## Notes",
        "No acceptance criteria yet.",
      ].join("\n"),
      "utf-8",
    )

    //#when
    const result = await executeTool(directory, "checklist.md", "target.md")

    //#then
    expect(result.passed).toBe(false)
    expect(result.failed_count).toBeGreaterThan(0)
    expect(result.items.some((item) => item.reason?.includes("Missing required"))).toBe(true)
  })
})
