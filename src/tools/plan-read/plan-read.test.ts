import { describe, expect, test } from "bun:test"
import { applyPlanFilters, parsePlanMarkdown } from "./tools"

describe("plan_read", () => {
  test("parses story-driven plan structure", () => {
    //#given
    const content = `# Wave A Plan

## Epics

### EPIC-02: Story & Plan Tools

#### Story: S01 Define shared types
- [ ] Task: Create shared types
  - Executor: dev
  - Wave: A

#### Story: S02 Implement story_read
- [x] Task: Implement parser
  - Executor: dev
  - Wave: A
`

    //#when
    const result = parsePlanMarkdown(content)

    //#then
    expect(result.type).toBe("story-driven")
    expect(result.title).toBe("Wave A Plan")
    expect(result.epics?.[0].title).toBe("EPIC-02: Story & Plan Tools")
    expect(result.epics?.[0].stories[0].title).toBe("S01 Define shared types")
    expect(result.epics?.[0].stories[0].tasks[0].executor).toBe("dev")
    expect(result.epics?.[0].stories[1].tasks[0].status).toBe("done")
  })

  test("parses task-driven plan structure", () => {
    //#given
    const content = `# Task Plan

## Tasks
- [ ] Task: Setup repo
  - Executor: devops
  - Wave: A
- [x] Task: Verify tests
  - Executor: qa
  - Wave: B
`

    //#when
    const result = parsePlanMarkdown(content)

    //#then
    expect(result.type).toBe("task-driven")
    expect(result.tasks).toHaveLength(2)
    expect(result.tasks?.[0].executor).toBe("devops")
    expect(result.tasks?.[1].status).toBe("done")
  })

  test("filters by wave and executor", () => {
    //#given
    const content = `# Task Plan

## Tasks
- [ ] Task: Setup repo
  - Executor: devops
  - Wave: A
- [x] Task: Verify tests
  - Executor: qa
  - Wave: B
`
    const plan = parsePlanMarkdown(content)

    //#when
    const filtered = applyPlanFilters(plan, { wave: "B", executor: "qa" })

    //#then
    expect(filtered.tasks).toHaveLength(1)
    expect(filtered.tasks?.[0].title).toBe("Verify tests")
  })
})
