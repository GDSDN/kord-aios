import { describe, expect, test } from "bun:test"
import { CHECKPOINT_TEMPLATE } from "./checkpoint"

describe("checkpoint template", () => {
  test("should export a non-empty template string", () => {
    //#given - the checkpoint template

    //#when - we access the template

    //#then - it should be a non-empty string
    expect(typeof CHECKPOINT_TEMPLATE).toBe("string")
    expect(CHECKPOINT_TEMPLATE.length).toBeGreaterThan(0)
  })

  test("should describe checkpoint behavior with @po delegation", () => {
    //#given - the checkpoint template

    //#when - we check the content

    //#then - it should mention key checkpoint behaviors
    expect(CHECKPOINT_TEMPLATE).toContain("checkpoint")
    expect(CHECKPOINT_TEMPLATE).toContain("boulder")
    expect(CHECKPOINT_TEMPLATE).toContain("GO")
    expect(CHECKPOINT_TEMPLATE).toContain("PAUSE")
    expect(CHECKPOINT_TEMPLATE).toContain("REVIEW")
    expect(CHECKPOINT_TEMPLATE).toContain("ABORT")
  })

  test("should instruct delegation to @po agent", () => {
    //#given - the checkpoint template

    //#when - we check the content

    //#then - it should reference @po for checkpoint decision
    expect(CHECKPOINT_TEMPLATE).toContain("po")
  })
})
