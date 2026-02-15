import { describe, test, expect } from "bun:test"
import { parsePlanTasksFromContent, getNextIncompleteTask, getIncompleteTasks, parsePlanWavesFromContent } from "./plan-parser"

describe("parsePlanTasksFromContent", () => {
  //#given a plan with basic tasks
  //#when parsing the content
  //#then it should extract task numbers, titles, and completion status
  test("parses basic checked and unchecked tasks", () => {
    const content = `# My Plan

## TODOs

- [ ] 1. Setup project structure
- [x] 2. Install dependencies
- [ ] 3. Implement feature
`
    const tasks = parsePlanTasksFromContent(content)

    expect(tasks).toHaveLength(3)
    expect(tasks[0].number).toBe(1)
    expect(tasks[0].title).toBe("Setup project structure")
    expect(tasks[0].completed).toBe(false)
    expect(tasks[1].number).toBe(2)
    expect(tasks[1].title).toBe("Install dependencies")
    expect(tasks[1].completed).toBe(true)
    expect(tasks[2].number).toBe(3)
    expect(tasks[2].title).toBe("Implement feature")
    expect(tasks[2].completed).toBe(false)
  })

  //#given a plan with executor fields
  //#when parsing the content
  //#then it should extract executor for each task
  test("parses executor field from tasks", () => {
    const content = `## TODOs

- [ ] 1. Create database schema

  **Executor**: data-engineer

- [ ] 2. Build API endpoints

  **Executor**: @dev-junior

- [ ] 3. Design UI mockups

  **Executor**: ux-design-expert
`
    const tasks = parsePlanTasksFromContent(content)

    expect(tasks).toHaveLength(3)
    expect(tasks[0].executor).toBe("data-engineer")
    expect(tasks[1].executor).toBe("dev-junior")
    expect(tasks[2].executor).toBe("ux-design-expert")
  })

  //#given a plan with verify fields
  //#when parsing the content
  //#then it should extract verify method for each task
  test("parses verify field from tasks", () => {
    const content = `## TODOs

- [ ] 1. Implement auth module

  **Verify**: tdd

- [ ] 2. Update config files

  **Verify**: typecheck

- [ ] 3. Write documentation

  **Verify**: none
`
    const tasks = parsePlanTasksFromContent(content)

    expect(tasks).toHaveLength(3)
    expect(tasks[0].verify).toBe("tdd")
    expect(tasks[1].verify).toBe("typecheck")
    expect(tasks[2].verify).toBe("none")
  })

  //#given a plan with category and skills fields
  //#when parsing the content
  //#then it should extract category and skills arrays
  test("parses category and skills fields", () => {
    const content = `## TODOs

- [ ] 1. Build dashboard component

  **Category**: visual-engineering
  **Skills**: [frontend-ui-ux, playwright]
  **Executor**: dev-junior
  **Verify**: qa-scenarios
`
    const tasks = parsePlanTasksFromContent(content)

    expect(tasks).toHaveLength(1)
    expect(tasks[0].category).toBe("visual-engineering")
    expect(tasks[0].skills).toEqual(["frontend-ui-ux", "playwright"])
    expect(tasks[0].executor).toBe("dev-junior")
    expect(tasks[0].verify).toBe("qa-scenarios")
  })

  //#given a plan with no executor/verify fields
  //#when parsing the content
  //#then executor and verify should be undefined
  test("returns undefined for missing executor/verify", () => {
    const content = `## TODOs

- [ ] 1. Simple task with no metadata

  **What to do**:
  - Just do the thing
`
    const tasks = parsePlanTasksFromContent(content)

    expect(tasks).toHaveLength(1)
    expect(tasks[0].executor).toBeUndefined()
    expect(tasks[0].verify).toBeUndefined()
    expect(tasks[0].category).toBeUndefined()
    expect(tasks[0].skills).toBeUndefined()
  })

  //#given a plan with skills in comma-separated format (no brackets)
  //#when parsing
  //#then it should still extract skills correctly
  test("parses skills without brackets", () => {
    const content = `## TODOs

- [ ] 1. Task with skills

  **Skills**: git-master, frontend-ui-ux
`
    const tasks = parsePlanTasksFromContent(content)

    expect(tasks).toHaveLength(1)
    expect(tasks[0].skills).toEqual(["git-master", "frontend-ui-ux"])
  })

  //#given an empty plan
  //#when parsing
  //#then it should return empty array
  test("returns empty array for empty content", () => {
    const tasks = parsePlanTasksFromContent("")
    expect(tasks).toHaveLength(0)
  })

  //#given a plan with mixed completed and incomplete tasks
  //#when parsing
  //#then completed status should be correct for each
  test("handles uppercase X in checkboxes", () => {
    const content = `## TODOs

- [X] 1. Already done task
- [ ] 2. Not done yet
`
    const tasks = parsePlanTasksFromContent(content)

    expect(tasks).toHaveLength(2)
    expect(tasks[0].completed).toBe(true)
    expect(tasks[1].completed).toBe(false)
  })

  //#given a plan with tasks using asterisk bullets
  //#when parsing
  //#then it should parse them the same as dash bullets
  test("handles asterisk bullet points", () => {
    const content = `## TODOs

* [ ] 1. Task with asterisk
* [x] 2. Done task with asterisk
`
    const tasks = parsePlanTasksFromContent(content)

    expect(tasks).toHaveLength(2)
    expect(tasks[0].completed).toBe(false)
    expect(tasks[1].completed).toBe(true)
  })
})

describe("parsePlanWavesFromContent", () => {
  //#given a plan with wave headings
  //#when parsing
  //#then it should extract waves with their tasks
  test("parses basic wave structure", () => {
    const content = `# PLAN: Auth System

## Wave Structure

### Wave 1 — Foundation
- [ ] 1. Setup project structure
  **Executor**: dev-junior
- [x] 2. Install dependencies
  **Executor**: dev-junior

### Wave 2 — Implementation
- [ ] 3. Build login API
  **Executor**: dev
- [ ] 4. Build registration API
  **Executor**: dev
`
    const waves = parsePlanWavesFromContent(content)

    expect(waves).toHaveLength(2)
    expect(waves[0].number).toBe(1)
    expect(waves[0].name).toBe("Foundation")
    expect(waves[0].tasks).toHaveLength(2)
    expect(waves[0].tasks[0].title).toBe("Setup project structure")
    expect(waves[0].tasks[0].executor).toBe("dev-junior")
    expect(waves[0].tasks[1].completed).toBe(true)

    expect(waves[1].number).toBe(2)
    expect(waves[1].name).toBe("Implementation")
    expect(waves[1].tasks).toHaveLength(2)
    expect(waves[1].tasks[0].executor).toBe("dev")
  })

  //#given a plan with no wave headings
  //#when parsing
  //#then it should return empty array
  test("returns empty array when no wave headings found", () => {
    const content = `# PLAN: Quick Fix

## TODOs
- [ ] 1. Fix the bug
- [ ] 2. Add test
`
    const waves = parsePlanWavesFromContent(content)
    expect(waves).toHaveLength(0)
  })

  //#given a plan with wave headings but no dash separator
  //#when parsing
  //#then it should still parse wave number and name
  test("parses waves without dash separator in heading", () => {
    const content = `### Wave 1 Foundation Setup
- [ ] 1. Task A

### Wave 2 Implementation
- [ ] 2. Task B
`
    const waves = parsePlanWavesFromContent(content)
    expect(waves).toHaveLength(2)
    expect(waves[0].number).toBe(1)
    expect(waves[0].name).toBe("Foundation Setup")
    expect(waves[1].number).toBe(2)
    expect(waves[1].name).toBe("Implementation")
  })

  //#given a plan with wave number only (no name)
  //#when parsing
  //#then number should be parsed, name empty
  test("parses wave with number only", () => {
    const content = `### Wave 1
- [ ] 1. Only task
`
    const waves = parsePlanWavesFromContent(content)
    expect(waves).toHaveLength(1)
    expect(waves[0].number).toBe(1)
    expect(waves[0].name).toBe("")
  })

  //#given a plan with mixed complete/incomplete waves
  //#when parsing
  //#then each wave's tasks should reflect correct completion status
  test("tracks completion status per wave", () => {
    const content = `### Wave 1 — Done Wave
- [x] 1. Task A
- [x] 2. Task B

### Wave 2 — In Progress Wave
- [x] 3. Task C
- [ ] 4. Task D
- [ ] 5. Task E
`
    const waves = parsePlanWavesFromContent(content)

    expect(waves).toHaveLength(2)
    // Wave 1: all complete
    expect(waves[0].tasks.every(t => t.completed)).toBe(true)
    // Wave 2: mixed
    expect(waves[1].tasks[0].completed).toBe(true)
    expect(waves[1].tasks[1].completed).toBe(false)
  })

  //#given a plan with Story: and Task: prefixes in items
  //#when parsing
  //#then title should preserve the prefix
  test("parses items with Story/Task prefixes", () => {
    const content = `### Wave 1 — Planning
- [ ] 1. Story: AUTH-001 — User Login API (executor: dev, qa_gate: qa)
- [ ] 2. Task: DB schema design (executor: data-engineer)
`
    const waves = parsePlanWavesFromContent(content)
    expect(waves).toHaveLength(1)
    expect(waves[0].tasks).toHaveLength(2)
    expect(waves[0].tasks[0].title).toContain("Story: AUTH-001")
    expect(waves[0].tasks[1].title).toContain("Task: DB schema design")
  })

  //#given empty content
  //#when parsing
  //#then return empty array
  test("returns empty array for empty content", () => {
    const waves = parsePlanWavesFromContent("")
    expect(waves).toHaveLength(0)
  })
})
