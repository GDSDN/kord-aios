import { describe, expect, test } from "bun:test"
import { resolveAgentFallbackChain, convertAgentFallbackSlots } from "./agent-fallback"

describe("agent fallback resolution", () => {
  test("converts provider/model slots to fallback entries", () => {
    //#given
    const slots = [
      { model: "anthropic/claude-opus-4-6", variant: "max" },
      { model: "openai/gpt-5.2" },
    ]

    //#when
    const result = convertAgentFallbackSlots(slots)

    //#then
    expect(result).toEqual([
      { providers: ["anthropic"], model: "claude-opus-4-6", variant: "max" },
      { providers: ["openai"], model: "gpt-5.2" },
    ])
  })

  test("uses user-configured fallback chain when provided", () => {
    //#given
    const overrides = {
      explore: {
        fallback: [
          { model: "google/gemini-3-flash" },
          { model: "anthropic/claude-haiku-4-5" },
        ],
      },
    }

    //#when
    const result = resolveAgentFallbackChain("explore", {
      userAgentOverrides: overrides,
    })

    //#then
    expect(result).toEqual([
      { providers: ["google"], model: "gemini-3-flash" },
      { providers: ["anthropic"], model: "claude-haiku-4-5" },
    ])
  })

  test("resolves plan alias to planner fallback chain", () => {
    //#when
    const result = resolveAgentFallbackChain("plan")

    //#then
    expect(result).toBeDefined()
    expect(result!.length).toBeGreaterThan(0)
  })
})
