import { describe, expect, test, mock, spyOn, beforeEach, afterEach } from "bun:test"
import { readModelConfigState, type AgentModelState, type CategoryModelState, type ModelConfigState } from "./reader"
import * as modelAvailability from "../../shared/model-availability"
import * as connectedProvidersCache from "../../shared/connected-providers-cache"

describe("readModelConfigState", () => {
  let fetchSpy: ReturnType<typeof spyOn>
  let connectedSpy: ReturnType<typeof spyOn>
  let providerModelsSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    fetchSpy = spyOn(modelAvailability, "fetchAvailableModels").mockResolvedValue(
      new Set([
        "anthropic/claude-opus-4-6",
        "anthropic/claude-sonnet-4-5",
        "openai/gpt-5.2",
        "openai/gpt-5.3-codex",
        "google/gemini-3-pro",
        "kimi-for-coding/k2p5",
      ])
    )
    connectedSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(
      ["anthropic", "openai", "google", "kimi-for-coding"]
    )
    providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue({
      models: {
        "anthropic": ["claude-opus-4-6", "claude-sonnet-4-5", "claude-haiku-4-5"],
        "openai": ["gpt-5.2", "gpt-5.3-codex", "gpt-5-nano"],
        "google": ["gemini-3-pro", "gemini-3-flash"],
        "kimi-for-coding": ["k2p5"],
      },
      connected: ["anthropic", "openai", "google", "kimi-for-coding"],
      updatedAt: new Date().toISOString(),
    })
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    connectedSpy.mockRestore()
    providerModelsSpy.mockRestore()
  })

  test("returns state with agents from AGENT_MODEL_REQUIREMENTS", async () => {
    //#given - default config, no overrides

    //#when
    const state = await readModelConfigState()

    //#then
    expect(state.agents).toBeDefined()
    expect(state.agents.length).toBeGreaterThan(0)

    const kord = state.agents.find(a => a.name === "kord")
    expect(kord).toBeDefined()
    expect(kord!.defaultSlots).toBeDefined()
    expect(kord!.defaultSlots.length).toBeGreaterThan(0)
  })

  test("returns connected providers list", async () => {
    //#when
    const state = await readModelConfigState()

    //#then
    expect(state.connectedProviders).toEqual(["anthropic", "openai", "google", "kimi-for-coding"])
  })

  test("returns models grouped by provider", async () => {
    //#when
    const state = await readModelConfigState()

    //#then
    expect(state.modelsByProvider).toBeDefined()
    expect(state.modelsByProvider["anthropic"]).toContain("claude-opus-4-6")
    expect(state.modelsByProvider["openai"]).toContain("gpt-5.2")
  })

  test("returns categories from CATEGORY_MODEL_REQUIREMENTS", async () => {
    //#when
    const state = await readModelConfigState()

    //#then
    expect(state.categories).toBeDefined()
    expect(state.categories.length).toBeGreaterThan(0)

    const ultrabrain = state.categories.find(c => c.name === "ultrabrain")
    expect(ultrabrain).toBeDefined()
    expect(ultrabrain!.defaultSlots.length).toBeGreaterThan(0)
  })

  test("agent default slots are derived from AGENT_MODEL_REQUIREMENTS fallback chain (max 4)", async () => {
    //#when
    const state = await readModelConfigState()

    //#then
    const kord = state.agents.find(a => a.name === "kord")
    expect(kord).toBeDefined()
    // kord has 5 entries in AGENT_MODEL_REQUIREMENTS, should be truncated to 4
    expect(kord!.defaultSlots.length).toBeLessThanOrEqual(4)
    // First slot should be claude-opus-4-6 (first entry)
    expect(kord!.defaultSlots[0]).toContain("claude-opus-4-6")
  })

  test("applies custom fallback from agent overrides", async () => {
    //#given
    const overrides = {
      kord: {
        fallback: [
          { model: "anthropic/claude-opus-4-6", variant: "max" },
          { model: "openai/gpt-5.2" },
        ],
      },
    }

    //#when
    const state = await readModelConfigState(overrides)

    //#then
    const kord = state.agents.find(a => a.name === "kord")
    expect(kord).toBeDefined()
    expect(kord!.customFallback).toEqual([
      { model: "anthropic/claude-opus-4-6", variant: "max" },
      { model: "openai/gpt-5.2" },
    ])
    expect(kord!.customSlots).toEqual([
      "anthropic/claude-opus-4-6",
      "openai/gpt-5.2",
    ])
  })

  test("does not expose routing mode state", async () => {
    //#when
    const state = await readModelConfigState()

    //#then
    const kord = state.agents.find(a => a.name === "kord")
    expect(kord).toBeDefined()
    expect(Object.prototype.hasOwnProperty.call(kord!, "routingMode")).toBe(false)
  })

  test("handles empty connected providers gracefully", async () => {
    //#given
    connectedSpy.mockReturnValue(null)
    providerModelsSpy.mockReturnValue(null)
    fetchSpy.mockResolvedValue(new Set())

    //#when
    const state = await readModelConfigState()

    //#then
    expect(state.connectedProviders).toEqual([])
    expect(state.modelsByProvider).toEqual({})
    expect(state.agents.length).toBeGreaterThan(0)
  })

  test("includes variant in default slots when specified in requirements", async () => {
    //#when
    const state = await readModelConfigState()

    //#then
    const dev = state.agents.find(a => a.name === "dev")
    expect(dev).toBeDefined()
    // dev has variant "medium" on its first slot
    expect(dev!.defaultSlots[0]).toContain("gpt-5.3-codex")
    expect(dev!.defaultVariants).toBeDefined()
    expect(dev!.defaultVariants![0]).toBe("medium")
  })
})
