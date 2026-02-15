import { describe, expect, test } from "bun:test"
import { SQUAD_TEMPLATE } from "./squad"

describe("squad template", () => {
  test("should export a non-empty template string", () => {
    //#given - the squad template

    //#when - we access the template

    //#then - it should be a non-empty string
    expect(typeof SQUAD_TEMPLATE).toBe("string")
    expect(SQUAD_TEMPLATE.length).toBeGreaterThan(0)
  })

  test("should describe squad loading behavior", () => {
    //#given - the squad template

    //#when - we check the content

    //#then - it should mention key squad concepts
    expect(SQUAD_TEMPLATE).toContain("squad")
    expect(SQUAD_TEMPLATE).toContain("SQUAD.yaml")
    expect(SQUAD_TEMPLATE).toContain("boulder")
  })

  test("should handle missing squad case", () => {
    //#given - the squad template

    //#when - we check the content

    //#then - it should handle squad not found
    expect(SQUAD_TEMPLATE).toContain("not found")
  })

  test("should require squad name argument", () => {
    //#given - the squad template

    //#when - we check the content

    //#then - it should mention the name parameter
    expect(SQUAD_TEMPLATE).toContain("$ARGUMENTS")
  })
})
