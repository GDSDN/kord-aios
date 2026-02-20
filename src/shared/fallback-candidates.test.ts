import { beforeEach, describe, expect, test } from "bun:test"
import { buildFallbackCandidates } from "./fallback-candidates"
import { clearProviderHealth, markProviderUnhealthy } from "./provider-health"

describe("buildFallbackCandidates", () => {
  beforeEach(() => {
    clearProviderHealth()
  })

  test("excludes disconnected providers from fallback chain", async () => {
    //#when
    const result = await buildFallbackCandidates({
      fallbackChain: [
        { providers: ["github-copilot", "anthropic"], model: "claude-opus-4-6" },
      ],
      connectedProviders: ["anthropic"],
      availableModels: new Set(["anthropic/claude-opus-4-6"]),
    })

    //#then
    expect(result.candidates).toEqual([
      { providerID: "anthropic", modelID: "claude-opus-4-6" },
    ])
    expect(result.diagnostics.skippedDisconnected).toContain("github-copilot/claude-opus-4-6")
  })

  test("returns empty candidates when nothing is connected", async () => {
    //#when
    const result = await buildFallbackCandidates({
      fallbackChain: [
        { providers: ["openai", "anthropic"], model: "gpt-5.2" },
      ],
      connectedProviders: [],
      availableModels: new Set<string>(),
    })

    //#then
    expect(result.candidates).toEqual([])
    expect(result.diagnostics.connectedProvidersKnown).toBe(true)
    expect(result.diagnostics.skippedDisconnected).toEqual([
      "openai/gpt-5.2",
      "anthropic/gpt-5.2",
    ])
  })

  test("preserves ordering after filtering", async () => {
    //#when
    const result = await buildFallbackCandidates({
      fallbackChain: [
        { providers: ["openai"], model: "gpt-5.2" },
        { providers: ["anthropic"], model: "claude-sonnet-4-5" },
        { providers: ["google"], model: "gemini-3-pro" },
      ],
      connectedProviders: ["anthropic", "google"],
      availableModels: new Set([
        "anthropic/claude-sonnet-4-5",
        "google/gemini-3-pro",
      ]),
    })

    //#then
    expect(result.candidates).toEqual([
      { providerID: "anthropic", modelID: "claude-sonnet-4-5" },
      { providerID: "google", modelID: "gemini-3-pro" },
    ])
  })

  test("skips unhealthy providers", async () => {
    //#given
    markProviderUnhealthy("anthropic", "quota")

    //#when
    const result = await buildFallbackCandidates({
      fallbackChain: [
        { providers: ["anthropic", "openai"], model: "gpt-5.2" },
      ],
      connectedProviders: ["anthropic", "openai"],
      availableModels: new Set([
        "anthropic/gpt-5.2",
        "openai/gpt-5.2",
      ]),
    })

    //#then
    expect(result.candidates).toEqual([{ providerID: "openai", modelID: "gpt-5.2" }])
    expect(result.diagnostics.skippedUnhealthy).toContain("anthropic/gpt-5.2")
  })

  test("keeps slot when model list misses and allowModelListMiss is enabled", async () => {
    //#when
    const result = await buildFallbackCandidates({
      fallbackChain: [
        { providers: ["zai-coding-plan"], model: "glm-4.7" },
      ],
      connectedProviders: ["zai-coding-plan"],
      availableModels: new Set(["zai-coding-plan/glm-5"]),
      allowModelListMiss: true,
    })

    //#then
    expect(result.candidates).toEqual([
      { providerID: "zai-coding-plan", modelID: "glm-4.7" },
    ])
    expect(result.diagnostics.skippedUnavailable).toEqual([])
  })
})
