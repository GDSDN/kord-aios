import { describe, expect, test } from "bun:test"
import { parseStoryMarkdown } from "./tools"

describe("story_read parsing", () => {
  test("parses frontmatter, status, tasks, and sections", () => {
    //#given
    const content = `---
    title: Implement story_read
    status: IN_PROGRESS
    ---
    # Implement story_read

    ## Status
    IN_PROGRESS

    ## Tasks
    - [ ] Parse frontmatter
    - [x] Extract tasks

    ## Acceptance Criteria
    - Parses markdown
    - Handles edge cases

    ## File List
    - src/tools/story-read/tools.ts

    ## Dev Notes
    Ensure parser is stable.
    `

    //#when
    const result = parseStoryMarkdown(content)

    //#then
    expect(result.title).toBe("Implement story_read")
    expect(result.status).toBe("IN_PROGRESS")
    expect(result.tasks).toHaveLength(2)
    expect(result.tasks[0]).toEqual({ title: "Parse frontmatter", checked: false })
    expect(result.tasks[1]).toEqual({ title: "Extract tasks", checked: true })
    expect(result.sections?.acceptanceCriteria).toEqual(["Parses markdown", "Handles edge cases"])
    expect(result.sections?.files).toEqual(["src/tools/story-read/tools.ts"])
    expect(result.sections?.devNotes).toContain("Ensure parser is stable.")
  })

  test("handles missing sections gracefully", () => {
    //#given
    const content = `# Story without sections\n\nSome body text.`

    //#when
    const result = parseStoryMarkdown(content)

    //#then
    expect(result.title).toBe("Story without sections")
    expect(result.status).toBe("DRAFT")
    expect(result.tasks).toEqual([])
    expect(result.sections?.acceptanceCriteria ?? []).toEqual([])
  })
})
