import { describe, expect, test } from "bun:test"
import { STATUS_TEMPLATE } from "./status"

describe("status template", () => {
  test("should export a non-empty template string", () => {
    //#given - the status template

    //#when - we access the template

    //#then - it should be a non-empty string
    expect(typeof STATUS_TEMPLATE).toBe("string")
    expect(STATUS_TEMPLATE.length).toBeGreaterThan(0)
  })

  test("should describe status reporting behavior", () => {
    //#given - the status template

    //#when - we check the content

    //#then - it should mention key status concepts
    expect(STATUS_TEMPLATE).toContain("boulder")
    expect(STATUS_TEMPLATE).toContain("plan")
    expect(STATUS_TEMPLATE).toContain("wave")
    expect(STATUS_TEMPLATE).toContain("progress")
  })

  test("should handle no active plan case", () => {
    //#given - the status template

    //#when - we check the content

    //#then - it should handle the no-plan scenario
    expect(STATUS_TEMPLATE).toContain("No plan")
  })

  test("should include completion percentage", () => {
    //#given - the status template

    //#when - we check the content

    //#then - it should mention percentage
    expect(STATUS_TEMPLATE).toContain("%")
  })
})
