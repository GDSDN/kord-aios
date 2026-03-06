import { describe, test, expect } from "bun:test"
import { getAgentToolRestrictions, hasAgentToolRestrictions } from "./agent-tool-restrictions"

describe("agent-tool-restrictions", () => {
  describe("explore agent", () => {
    test("should deny write, edit, task, call_kord_agent", () => {
      const restrictions = getAgentToolRestrictions("explore")
      expect(restrictions.write).toBe(false)
      expect(restrictions.edit).toBe(false)
      expect(restrictions.task).toBe(false)
      expect(restrictions.call_kord_agent).toBe(false)
    })

    test("has restrictions", () => {
      expect(hasAgentToolRestrictions("explore")).toBe(true)
    })
  })

  describe("librarian agent", () => {
    test("should deny write, edit, task, call_kord_agent", () => {
      const restrictions = getAgentToolRestrictions("librarian")
      expect(restrictions.write).toBe(false)
      expect(restrictions.edit).toBe(false)
      expect(restrictions.task).toBe(false)
      expect(restrictions.call_kord_agent).toBe(false)
    })

    test("has restrictions", () => {
      expect(hasAgentToolRestrictions("librarian")).toBe(true)
    })
  })

  describe("architect agent", () => {
    test("should deny task only (call_kord_agent is now allowed by default)", () => {
      const restrictions = getAgentToolRestrictions("architect")
      expect(restrictions.task).toBe(false)
      // call_kord_agent should NOT be in restrictions (allowed by global default)
      expect(restrictions.call_kord_agent).toBeUndefined()
    })

    test("has restrictions", () => {
      expect(hasAgentToolRestrictions("architect")).toBe(true)
    })
  })

  describe("dev-junior agent", () => {
    test("should deny task only", () => {
      const restrictions = getAgentToolRestrictions("dev-junior")
      expect(restrictions.task).toBe(false)
    })

    test("has restrictions", () => {
      expect(hasAgentToolRestrictions("dev-junior")).toBe(true)
    })
  })

  describe("analyst agent", () => {
    test("should deny task only", () => {
      const restrictions = getAgentToolRestrictions("analyst")
      expect(restrictions.write).toBeUndefined()
      expect(restrictions.edit).toBeUndefined()
      expect(restrictions.task).toBe(false)
    })

    test("has restrictions", () => {
      expect(hasAgentToolRestrictions("analyst")).toBe(true)
    })
  })

  describe("qa agent", () => {
    test("should deny write, edit, task", () => {
      const restrictions = getAgentToolRestrictions("qa")
      expect(restrictions.write).toBe(false)
      expect(restrictions.edit).toBe(false)
      expect(restrictions.task).toBe(false)
    })

    test("has restrictions", () => {
      expect(hasAgentToolRestrictions("qa")).toBe(true)
    })
  })

  describe("case insensitive matching", () => {
    test("should find restrictions for EXPLORE (uppercase)", () => {
      const restrictions = getAgentToolRestrictions("EXPLORE")
      expect(restrictions.write).toBe(false)
    })

    test("should find restrictions for Librarian (mixed case)", () => {
      const restrictions = getAgentToolRestrictions("Librarian")
      expect(restrictions.write).toBe(false)
    })
  })

  describe("unknown agent", () => {
    test("should return empty restrictions", () => {
      const restrictions = getAgentToolRestrictions("unknown-agent")
      expect(restrictions).toEqual({})
    })

    test("should not have restrictions", () => {
      expect(hasAgentToolRestrictions("unknown-agent")).toBe(false)
    })
  })
})
