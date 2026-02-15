import { describe, expect, test } from "bun:test"
import { INIT_DEEP_TEMPLATE } from "./init-deep"

describe("init-deep template", () => {
  test("should export a non-empty template string", () => {
    //#given - the init-deep template

    //#when - we access the template

    //#then - it should be a non-empty string
    expect(typeof INIT_DEEP_TEMPLATE).toBe("string")
    expect(INIT_DEEP_TEMPLATE.length).toBeGreaterThan(0)
  })

  test("should preserve existing discovery workflow", () => {
    //#given - the init-deep template

    //#when - we check the content

    //#then - it should retain core phases
    expect(INIT_DEEP_TEMPLATE).toContain("Discovery")
    expect(INIT_DEEP_TEMPLATE).toContain("Scoring")
    expect(INIT_DEEP_TEMPLATE).toContain("Generate")
    expect(INIT_DEEP_TEMPLATE).toContain("Review")
  })

  test("should include Kord AIOS agent awareness section", () => {
    //#given - the init-deep template with Kord AIOS context

    //#when - we check for agent section

    //#then - it should list agent-related content
    expect(INIT_DEEP_TEMPLATE).toContain("KORD AIOS")
    expect(INIT_DEEP_TEMPLATE).toContain("agents")
  })

  test("should include skills catalog section", () => {
    //#given - the init-deep template with Kord AIOS context

    //#when - we check for skills section

    //#then - it should reference skills
    expect(INIT_DEEP_TEMPLATE).toContain("skills")
    expect(INIT_DEEP_TEMPLATE).toContain(".kord/skills")
  })

  test("should include available commands section", () => {
    //#given - the init-deep template with Kord AIOS context

    //#when - we check for commands section

    //#then - it should list key commands
    expect(INIT_DEEP_TEMPLATE).toContain("/checkpoint")
    expect(INIT_DEEP_TEMPLATE).toContain("/status")
    expect(INIT_DEEP_TEMPLATE).toContain("/squad")
    expect(INIT_DEEP_TEMPLATE).toContain("/start-work")
  })

  test("should include squad definitions section", () => {
    //#given - the init-deep template with Kord AIOS context

    //#when - we check for squad section

    //#then - it should reference squad scanning
    expect(INIT_DEEP_TEMPLATE).toContain("squad")
    expect(INIT_DEEP_TEMPLATE).toContain("SQUAD.yaml")
  })

  test("should include methodology summary", () => {
    //#given - the init-deep template with Kord AIOS context

    //#when - we check for methodology section

    //#then - it should reference key methodology concepts
    expect(INIT_DEEP_TEMPLATE).toContain("story-driven")
    expect(INIT_DEEP_TEMPLATE).toContain("wave")
  })

  test("should retain explore agent spawning", () => {
    //#given - the init-deep template

    //#when - we check the content

    //#then - it should still have background explore agents
    expect(INIT_DEEP_TEMPLATE).toContain("explore")
    expect(INIT_DEEP_TEMPLATE).toContain("background")
  })
})
