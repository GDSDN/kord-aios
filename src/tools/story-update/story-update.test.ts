import { describe, expect, test } from "bun:test"
import { applyStoryUpdate } from "./tools"

describe("story_update", () => {
  const baseStory = `---
title: Epic 02 kickoff
status: DRAFT
---
# Epic 02 kickoff

## Status
DRAFT

## Tasks
- [ ] Define shared types
- [ ] Implement story_read

## Acceptance Criteria
- Tool parses story markdown

## File List
- src/shared/types/story.ts

## Dev Notes
Initial notes.`

  test("check_task marks a task as completed", () => {
    //#given
    const input = baseStory

    //#when
    const result = applyStoryUpdate(input, {
      action: "check_task",
      data: { task: "Define shared types" },
    })

    //#then
    expect(result).toContain("- [x] Define shared types")
  })

  test("uncheck_task marks a task as incomplete", () => {
    //#given
    const input = baseStory.replace("- [ ] Define shared types", "- [x] Define shared types")

    //#when
    const result = applyStoryUpdate(input, {
      action: "uncheck_task",
      data: { task: "Define shared types" },
    })

    //#then
    expect(result).toContain("- [ ] Define shared types")
  })

  test("set_status updates frontmatter and status section", () => {
    //#given
    const input = baseStory

    //#when
    const result = applyStoryUpdate(input, {
      action: "set_status",
      data: { status: "IN_PROGRESS" },
    })

    //#then
    expect(result).toContain("status: IN_PROGRESS")
    expect(result).toContain("## Status\nIN_PROGRESS")
  })

  test("append_dev_notes appends to Dev Notes section", () => {
    //#given
    const input = baseStory

    //#when
    const result = applyStoryUpdate(input, {
      action: "append_dev_notes",
      data: { note: "Followed the shared types checklist." },
    })

    //#then
    expect(result).toContain("Initial notes.")
    expect(result).toContain("Followed the shared types checklist.")
  })

  test("add_file appends to file list", () => {
    //#given
    const input = baseStory

    //#when
    const result = applyStoryUpdate(input, {
      action: "add_file",
      data: { file: "src/tools/story-read/tools.ts" },
    })

    //#then
    expect(result).toContain("- src/tools/story-read/tools.ts")
  })

  test("update_section replaces a section body", () => {
    //#given
    const input = baseStory

    //#when
    const result = applyStoryUpdate(input, {
      action: "update_section",
      data: { section: "Acceptance Criteria", content: "- Updated requirement" },
    })

    //#then
    expect(result).toContain("## Acceptance Criteria\n- Updated requirement")
  })
})
