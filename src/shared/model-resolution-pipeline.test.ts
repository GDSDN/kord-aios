import { describe, expect, test } from "bun:test"
import { resolveModelPipeline, type ModelResolutionRequest } from "./model-resolution-pipeline"
import type { FallbackEntry } from "./model-requirements"

const AVAILABLE = new Set([
  "anthropic/claude-opus-4-6",
  "openai/gpt-5.2",
  "anthropic/claude-sonnet-4-5",
  "google/gemini-3-flash",
  "anthropic/claude-haiku-4-5",
  "openai/gpt-5-nano",
])

const FALLBACK_CHAIN: FallbackEntry[] = [
  { providers: ["anthropic"], model: "claude-opus-4-6", variant: "max" },
  { providers: ["openai"], model: "gpt-5.2", variant: "high" },
]

describe("resolveModelPipeline — dynamic routing integration", () => {
  test("static mode (default) uses fallback chain as before", () => {
    //#given
    const request: ModelResolutionRequest = {
      constraints: { availableModels: AVAILABLE },
      policy: { fallbackChain: FALLBACK_CHAIN },
    }

    //#when
    const result = resolveModelPipeline(request)

    //#then
    expect(result).toBeDefined()
    expect(result!.provenance).toBe("provider-fallback")
  })

  test("dynamic mode injects routed model as categoryDefaultModel", () => {
    //#given
    const request: ModelResolutionRequest = {
      constraints: { availableModels: AVAILABLE },
      policy: { fallbackChain: FALLBACK_CHAIN },
      dynamic: {
        routingMode: "dynamic",
        agentName: "kord",
        prompt: "refactor the entire authentication system architecture across all modules",
      },
    }

    //#when
    const result = resolveModelPipeline(request)

    //#then
    expect(result).toBeDefined()
    // Dynamic routing should resolve before fallback chain
    expect(["category-default", "dynamic-route"]).toContain(result!.provenance)
  })

  test("dynamic mode falls back to chain when router returns nothing", () => {
    //#given — agent not in any model schema entry
    const request: ModelResolutionRequest = {
      constraints: { availableModels: AVAILABLE },
      policy: { fallbackChain: FALLBACK_CHAIN },
      dynamic: {
        routingMode: "dynamic",
        agentName: "nonexistent-agent-xyz",
        prompt: "do something",
      },
    }

    //#when
    const result = resolveModelPipeline(request)

    //#then
    expect(result).toBeDefined()
    expect(result!.provenance).toBe("provider-fallback")
  })

  test("UI selection still takes priority over dynamic routing", () => {
    //#given
    const request: ModelResolutionRequest = {
      intent: { uiSelectedModel: "google/gemini-3-flash" },
      constraints: { availableModels: AVAILABLE },
      policy: { fallbackChain: FALLBACK_CHAIN },
      dynamic: {
        routingMode: "dynamic",
        agentName: "kord",
        prompt: "complex architecture task",
      },
    }

    //#when
    const result = resolveModelPipeline(request)

    //#then
    expect(result).toBeDefined()
    expect(result!.model).toBe("google/gemini-3-flash")
    expect(result!.provenance).toBe("override")
  })

  test("user model override still takes priority over dynamic routing", () => {
    //#given
    const request: ModelResolutionRequest = {
      intent: { userModel: "openai/gpt-5.2" },
      constraints: { availableModels: AVAILABLE },
      policy: { fallbackChain: FALLBACK_CHAIN },
      dynamic: {
        routingMode: "dynamic",
        agentName: "kord",
        prompt: "complex task",
      },
    }

    //#when
    const result = resolveModelPipeline(request)

    //#then
    expect(result).toBeDefined()
    expect(result!.model).toBe("openai/gpt-5.2")
    expect(result!.provenance).toBe("override")
  })

  test("static mode with routing_mode set to static behaves identically", () => {
    //#given
    const request: ModelResolutionRequest = {
      constraints: { availableModels: AVAILABLE },
      policy: { fallbackChain: FALLBACK_CHAIN },
      dynamic: {
        routingMode: "static",
        agentName: "kord",
        prompt: "complex task",
      },
    }

    //#when
    const result = resolveModelPipeline(request)

    //#then
    expect(result).toBeDefined()
    expect(result!.provenance).toBe("provider-fallback")
  })

  test("custom fallback_slots override the policy fallback chain", () => {
    //#given
    const customSlots: FallbackEntry[] = [
      { providers: ["google"], model: "gemini-3-flash" },
    ]
    const request: ModelResolutionRequest = {
      constraints: { availableModels: AVAILABLE },
      policy: {
        fallbackChain: FALLBACK_CHAIN,
        customFallbackSlots: customSlots,
      },
    }

    //#when
    const result = resolveModelPipeline(request)

    //#then
    expect(result).toBeDefined()
    expect(result!.model).toContain("gemini-3-flash")
    expect(result!.provenance).toBe("provider-fallback")
  })
})
