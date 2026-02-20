import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from "bun:test"
import type { createOpencodeClient } from "@opencode-ai/sdk"
import { parseModelSuggestion, promptWithRetry } from "./prompt-retry"
import * as connectedProvidersCache from "./connected-providers-cache"
import * as modelAvailability from "./model-availability"
import { clearProviderHealth, getProviderBanInfo } from "./provider-health"

type Client = ReturnType<typeof createOpencodeClient>

let connectedProvidersSpy: ReturnType<typeof spyOn> | undefined
let providerModelsSpy: ReturnType<typeof spyOn> | undefined
let fetchAvailableModelsSpy: ReturnType<typeof spyOn> | undefined

beforeEach(() => {
  clearProviderHealth()
})

afterEach(() => {
  connectedProvidersSpy?.mockRestore()
  providerModelsSpy?.mockRestore()
  fetchAvailableModelsSpy?.mockRestore()
  connectedProvidersSpy = undefined
  providerModelsSpy = undefined
  fetchAvailableModelsSpy = undefined
  clearProviderHealth()
})

describe("parseModelSuggestion", () => {
  describe("structured NamedError format", () => {
    it("should extract suggestion from ProviderModelNotFoundError", () => {
      // given a structured NamedError with suggestions
      const error = {
        name: "ProviderModelNotFoundError",
        data: {
          providerID: "anthropic",
          modelID: "claude-sonet-4",
          suggestions: ["claude-sonnet-4", "claude-sonnet-4-5"],
        },
      }

      // when parsing the error
      const result = parseModelSuggestion(error)

      // then should return the first suggestion
      expect(result).toEqual({
        providerID: "anthropic",
        modelID: "claude-sonet-4",
        suggestion: "claude-sonnet-4",
      })
    })

    it("should return null when suggestions array is empty", () => {
      // given a NamedError with empty suggestions
      const error = {
        name: "ProviderModelNotFoundError",
        data: {
          providerID: "anthropic",
          modelID: "claude-sonet-4",
          suggestions: [],
        },
      }

      // when parsing the error
      const result = parseModelSuggestion(error)

      // then should return null
      expect(result).toBeNull()
    })

    it("should return null when suggestions field is missing", () => {
      // given a NamedError without suggestions
      const error = {
        name: "ProviderModelNotFoundError",
        data: {
          providerID: "anthropic",
          modelID: "claude-sonet-4",
        },
      }

      // when parsing the error
      const result = parseModelSuggestion(error)

      // then should return null
      expect(result).toBeNull()
    })
  })

  describe("nested error format", () => {
    it("should extract suggestion from nested data.error", () => {
      // given an error with nested NamedError in data field
      const error = {
        data: {
          name: "ProviderModelNotFoundError",
          data: {
            providerID: "openai",
            modelID: "gpt-5",
            suggestions: ["gpt-5.2"],
          },
        },
      }

      // when parsing the error
      const result = parseModelSuggestion(error)

      // then should extract from nested structure
      expect(result).toEqual({
        providerID: "openai",
        modelID: "gpt-5",
        suggestion: "gpt-5.2",
      })
    })

    it("should extract suggestion from nested error field", () => {
      // given an error with nested NamedError in error field
      const error = {
        error: {
          name: "ProviderModelNotFoundError",
          data: {
            providerID: "google",
            modelID: "gemini-3-flsh",
            suggestions: ["gemini-3-flash"],
          },
        },
      }

      // when parsing the error
      const result = parseModelSuggestion(error)

      // then should extract from nested error field
      expect(result).toEqual({
        providerID: "google",
        modelID: "gemini-3-flsh",
        suggestion: "gemini-3-flash",
      })
    })
  })

  describe("string message format", () => {
    it("should parse suggestion from error message string", () => {
      // given an Error with model-not-found message and suggestion
      const error = new Error(
        "Model not found: anthropic/claude-sonet-4. Did you mean: claude-sonnet-4, claude-sonnet-4-5?"
      )

      // when parsing the error
      const result = parseModelSuggestion(error)

      // then should extract from message string
      expect(result).toEqual({
        providerID: "anthropic",
        modelID: "claude-sonet-4",
        suggestion: "claude-sonnet-4",
      })
    })

    it("should parse from plain string error", () => {
      // given a plain string error message
      const error =
        "Model not found: openai/gtp-5. Did you mean: gpt-5?"

      // when parsing the error
      const result = parseModelSuggestion(error)

      // then should extract from string
      expect(result).toEqual({
        providerID: "openai",
        modelID: "gtp-5",
        suggestion: "gpt-5",
      })
    })

    it("should parse from object with message property", () => {
      // given an object with message property
      const error = {
        message: "Model not found: google/gemini-3-flsh. Did you mean: gemini-3-flash?",
      }

      // when parsing the error
      const result = parseModelSuggestion(error)

      // then should extract from message property
      expect(result).toEqual({
        providerID: "google",
        modelID: "gemini-3-flsh",
        suggestion: "gemini-3-flash",
      })
    })

    it("should return null when message has no suggestion", () => {
      // given an error without Did you mean
      const error = new Error("Model not found: anthropic/nonexistent.")

      // when parsing the error
      const result = parseModelSuggestion(error)

      // then should return null
      expect(result).toBeNull()
    })
  })

  describe("edge cases", () => {
    it("should return null for null error", () => {
      // given null
      // when parsing
      const result = parseModelSuggestion(null)
      // then should return null
      expect(result).toBeNull()
    })

    it("should return null for undefined error", () => {
      // given undefined
      // when parsing
      const result = parseModelSuggestion(undefined)
      // then should return null
      expect(result).toBeNull()
    })

    it("should return null for unrelated error", () => {
      // given an unrelated error
      const error = new Error("Connection timeout")
      // when parsing
      const result = parseModelSuggestion(error)
      // then should return null
      expect(result).toBeNull()
    })

    it("should return null for empty object", () => {
      // given empty object
      // when parsing
      const result = parseModelSuggestion({})
      // then should return null
      expect(result).toBeNull()
    })
  })
})

describe("promptWithRetry", () => {
  it("should succeed on first try without retry", async () => {
    // given a client where prompt succeeds
    const promptMock = mock(() => Promise.resolve())
    const client = { session: { prompt: promptMock } }

    // when calling promptWithRetry
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "anthropic", modelID: "claude-sonnet-4" },
      },
    })

    // then should call prompt exactly once
    expect(promptMock).toHaveBeenCalledTimes(1)
  })

  it("should treat returned { error } as failure and fallback on quota", async () => {
    const promptMock = mock()
      .mockResolvedValueOnce({
        error: {
          statusCode: 429,
          message: "rate limit",
        },
      })
      .mockResolvedValueOnce({})

    const client = { session: { prompt: promptMock, abort: mock(() => Promise.resolve()) } }

    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "anthropic", modelID: "claude-sonnet-4-5" },
      },
    }, [
      { providers: ["openai"], model: "gpt-5.2" },
    ])

    expect(promptMock).toHaveBeenCalledTimes(2)
    const fallbackCall = promptMock.mock.calls[1][0]
    expect(fallbackCall.body.model).toEqual({ providerID: "openai", modelID: "gpt-5.2" })
  })

  it("should retry with suggestion on model-not-found error", async () => {
    // given a client that fails first with model-not-found, then succeeds
    const promptMock = mock()
      .mockRejectedValueOnce({
        name: "ProviderModelNotFoundError",
        data: {
          providerID: "anthropic",
          modelID: "claude-sonet-4",
          suggestions: ["claude-sonnet-4"],
        },
      })
      .mockResolvedValueOnce(undefined)
    const client = { session: { prompt: promptMock } }

    // when calling promptWithRetry
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        agent: "explore",
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "anthropic", modelID: "claude-sonet-4" },
      },
    })

    // then should call prompt twice - first with original, then with suggestion
    expect(promptMock).toHaveBeenCalledTimes(2)
    const retryCall = promptMock.mock.calls[1][0]
    expect(retryCall.body.model).toEqual({
      providerID: "anthropic",
      modelID: "claude-sonnet-4",
    })
  })

  it("should throw original error when no suggestion available", async () => {
    // given a client that fails with a non-model-not-found error
    const originalError = new Error("Connection refused")
    const promptMock = mock().mockRejectedValueOnce(originalError)
    const client = { session: { prompt: promptMock } }

    // when calling promptWithModelSuggestionRetry
    // then should throw the original error
    await expect(
      promptWithRetry(client as unknown as Client, {
        path: { id: "session-1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
          model: { providerID: "anthropic", modelID: "claude-sonnet-4" },
        },
      })
    ).rejects.toThrow("Connection refused")

    expect(promptMock).toHaveBeenCalledTimes(1)
  })

  it("should throw original error when retry also fails", async () => {
    // given a client that fails with model-not-found, retry also fails
    const modelNotFoundError = {
      name: "ProviderModelNotFoundError",
      data: {
        providerID: "anthropic",
        modelID: "claude-sonet-4",
        suggestions: ["claude-sonnet-4"],
      },
    }
    const retryError = new Error("Still not found")
    const promptMock = mock()
      .mockRejectedValueOnce(modelNotFoundError)
      .mockRejectedValueOnce(retryError)
    const client = { session: { prompt: promptMock } }

    // when calling promptWithModelSuggestionRetry
    // then should throw the retry error (not the original)
    await expect(
      promptWithRetry(client as unknown as Client, {
        path: { id: "session-1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
          model: { providerID: "anthropic", modelID: "claude-sonet-4" },
        },
      })
    ).rejects.toThrow("Still not found")

    expect(promptMock).toHaveBeenCalledTimes(2)
  })

  it("should preserve other body fields during retry", async () => {

    // given a client that fails first with model-not-found
    const promptMock = mock()
      .mockRejectedValueOnce({
        name: "ProviderModelNotFoundError",
        data: {
          providerID: "anthropic",
          modelID: "claude-sonet-4",
          suggestions: ["claude-sonnet-4"],
        },
      })
      .mockResolvedValueOnce(undefined)
    const client = { session: { prompt: promptMock } }

    // when calling with additional body fields
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        agent: "explore",
        system: "You are a helpful agent",

        tools: { task: false },
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "anthropic", modelID: "claude-sonet-4" },
        variant: "max",
      },
    })

    // then retry call should preserve all fields except corrected model
    const retryCall = promptMock.mock.calls[1][0]
    expect(retryCall.body.agent).toBe("explore")
    expect(retryCall.body.system).toBe("You are a helpful agent")
    expect(retryCall.body.tools).toEqual({ task: false })
    expect(retryCall.body.variant).toBe("max")
    expect(retryCall.body.model).toEqual({
      providerID: "anthropic",
      modelID: "claude-sonnet-4",
    })
  })

  it("should try alternate provider in same fallback entry after quota error", async () => {
    // given first attempt fails due quota, then fallback with alternate provider succeeds
    connectedProvidersSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)
    providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
    fetchAvailableModelsSpy = spyOn(modelAvailability, "fetchAvailableModels").mockResolvedValue(
      new Set([
        "openai/gpt-5.3-codex",
        "anthropic/gpt-5.3-codex",
      ]),
    )
    const promptMock = mock()
      .mockRejectedValueOnce(new Error("429 too many requests"))
      .mockResolvedValueOnce(undefined)
    const client = {
      provider: {
        list: async () => ({ data: { connected: ["openai", "anthropic"] } }),
      },
      model: {
        list: async () => ({
          data: [
            { provider: "openai", id: "gpt-5.3-codex" },
            { provider: "anthropic", id: "gpt-5.3-codex" },
          ],
        }),
      },
      session: { prompt: promptMock },
    }

    // when
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "openai", modelID: "gpt-5.3-codex" },
      },
    }, [
      { providers: ["openai", "anthropic"], model: "gpt-5.3-codex" },
    ])

    // then
    expect(promptMock).toHaveBeenCalledTimes(2)
    const retryCall = promptMock.mock.calls[1][0]
    expect(retryCall.body.model).toEqual({
      providerID: "anthropic",
      modelID: "gpt-5.3-codex",
    })
  })

  it("should retry on timeout errors", async () => {
    // given first attempt times out, then fallback succeeds
    const promptMock = mock()
      .mockRejectedValueOnce(new Error("Model attempt timed out after 30000ms"))
      .mockResolvedValueOnce(undefined)
    const client = { session: { prompt: promptMock } }

    // when
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "openai", modelID: "gpt-5.2" },
      },
    }, [
      { providers: ["openai", "opencode"], model: "gpt-5.2" },
    ])

    // then
    expect(promptMock).toHaveBeenCalledTimes(2)
    const retryCall = promptMock.mock.calls[1][0]
    expect(retryCall.body.model).toEqual({
      providerID: "opencode",
      modelID: "gpt-5.2",
    })
  })

  it("should fallback when initial prompt hangs and times out", async () => {
    // given first prompt never resolves and second prompt succeeds
    const promptMock = mock()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValueOnce(undefined)
    const abortMock = mock().mockResolvedValue(undefined)
    const client = { session: { prompt: promptMock, abort: abortMock } }

    // when
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "openai", modelID: "gpt-5.2" },
      },
    }, [
      { providers: ["opencode"], model: "gpt-5.2" },
    ], { promptTimeoutMs: 10 })

    // then
    expect(promptMock).toHaveBeenCalledTimes(2)
    expect(abortMock).toHaveBeenCalledTimes(1)
    const fallbackCall = promptMock.mock.calls[1][0]
    expect(fallbackCall.body.model).toEqual({
      providerID: "opencode",
      modelID: "gpt-5.2",
    })
  })

  it("should propagate variant from fallback entry when retrying after quota", async () => {
    // given
    const promptMock = mock()
      .mockRejectedValueOnce(new Error("rate limit exceeded"))
      .mockResolvedValueOnce(undefined)
    const client = { session: { prompt: promptMock } }

    // when
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "openai", modelID: "gpt-5.3-codex" },
        variant: "medium",
      },
    }, [
      { providers: ["anthropic"], model: "claude-opus-4-6", variant: "max" },
    ])

    // then
    expect(promptMock).toHaveBeenCalledTimes(2)
    const retryCall = promptMock.mock.calls[1][0]
    expect(retryCall.body.model).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
    })
    expect(retryCall.body.variant).toBe("max")
  })

  it("should retry on structured quota errors without relying on message text", async () => {
    // given - provider error uses structured fields only
    const promptMock = mock()
      .mockRejectedValueOnce({
        status: 402,
        code: "insufficient_credits",
        message: "Request failed",
      })
      .mockResolvedValueOnce(undefined)
    const client = { session: { prompt: promptMock } }

    // when
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "openai", modelID: "gpt-5.2" },
      },
    }, [
      { providers: ["anthropic"], model: "claude-sonnet-4-5" },
    ])

    // then
    expect(promptMock).toHaveBeenCalledTimes(2)
    const retryCall = promptMock.mock.calls[1][0]
    expect(retryCall.body.model).toEqual({
      providerID: "anthropic",
      modelID: "claude-sonnet-4-5",
    })
  })

  it("should retry fallback when provider returns insufficient balance billing error", async () => {
    // given
    const promptMock = mock()
      .mockRejectedValueOnce(
        new Error("Insufficient balance. Manage your billing here: https://opencode.ai/workspace/wrk_xxx/billing")
      )
      .mockResolvedValueOnce(undefined)
    const client = { session: { prompt: promptMock, abort: mock(() => Promise.resolve()) } }

    // when
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "openai", modelID: "gpt-5.2" },
      },
    }, [
      { providers: ["anthropic"], model: "claude-sonnet-4-5" },
    ])

    // then
    expect(promptMock).toHaveBeenCalledTimes(2)
    const retryCall = promptMock.mock.calls[1][0]
    expect(retryCall.body.model).toEqual({
      providerID: "anthropic",
      modelID: "claude-sonnet-4-5",
    })
  })

  it("should continue fallback chain when first fallback hits deferred insufficient balance error", async () => {
    // given
    const promptMock = mock()
      .mockRejectedValueOnce(new Error("429 too many requests"))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
    const messagesMock = mock()
      // snapshot before first fallback prompt (opencode)
      .mockResolvedValueOnce({
        data: [{ info: { time: { created: 1 } }, parts: [{ type: "text", text: "before" }] }],
      })
      // deferred check after first fallback prompt: same message updated with error payload
      .mockResolvedValueOnce({
        data: [
          {
            info: { time: { created: 1 } },
            error: {
              data: {
                message: "Insufficient balance. Manage your billing here: https://opencode.ai/workspace/wrk_xxx/billing",
                responseBody:
                  '{"type":"error","error":{"type":"CreditsError","message":"Insufficient balance. Manage your billing here: https://opencode.ai/workspace/wrk_xxx/billing"}}',
              },
            },
          },
        ],
      })
      // snapshot before second fallback prompt (anthropic)
      .mockResolvedValueOnce({
        data: [
          {
            info: { time: { created: 1 } },
            error: {
              data: {
                message: "Insufficient balance. Manage your billing here: https://opencode.ai/workspace/wrk_xxx/billing",
              },
            },
          },
        ],
      })
      // deferred checks after second fallback prompt: no new quota/billing errors
      .mockResolvedValueOnce({
        data: [
          {
            info: { time: { created: 1 } },
            error: {
              data: {
                message: "Insufficient balance. Manage your billing here: https://opencode.ai/workspace/wrk_xxx/billing",
              },
            },
          },
          {
            info: { time: { created: 2 } },
            parts: [{ type: "text", text: "ok" }],
          },
        ],
      })
      .mockResolvedValue({
        data: [
          {
            info: { time: { created: 1 } },
            error: {
              data: {
                message: "Insufficient balance. Manage your billing here: https://opencode.ai/workspace/wrk_xxx/billing",
              },
            },
          },
          {
            info: { time: { created: 2 } },
            parts: [{ type: "text", text: "ok" }],
          },
        ],
      })

    const client = {
      session: {
        prompt: promptMock,
        messages: messagesMock,
        abort: mock(() => Promise.resolve()),
      },
    }

    // when
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "openai", modelID: "gpt-5.2" },
      },
    }, [
      { providers: ["opencode"], model: "glm-5" },
      { providers: ["anthropic"], model: "claude-sonnet-4-5" },
    ])

    // then
    expect(promptMock).toHaveBeenCalledTimes(3)
    const retryCall = promptMock.mock.calls[2][0]
    expect(retryCall.body.model).toEqual({
      providerID: "anthropic",
      modelID: "claude-sonnet-4-5",
    })
  })

  it("should skip disconnected providers when selecting fallback candidates", async () => {
    // given
    connectedProvidersSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["anthropic"])
    const promptMock = mock()
      .mockRejectedValueOnce(new Error("429 too many requests"))
      .mockResolvedValueOnce(undefined)
    const client = {
      provider: { list: async () => ({ data: { connected: ["anthropic"] } }) },
      model: { list: async () => ({ data: [{ provider: "anthropic", id: "claude-opus-4-6" }] }) },
      session: { prompt: promptMock, abort: mock(() => Promise.resolve()) },
    }

    // when
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "openai", modelID: "gpt-5.2" },
      },
    }, [
      { providers: ["github-copilot", "anthropic"], model: "claude-opus-4-6" },
    ])

    // then
    expect(promptMock).toHaveBeenCalledTimes(2)
    const retryCall = promptMock.mock.calls[1][0]
    expect(retryCall.body.model).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
    })
  })

  it("should mark provider unhealthy on quota failures", async () => {
    // given
    const promptMock = mock().mockRejectedValueOnce({
      status: 402,
      code: "insufficient_credits",
      message: "Billing exhausted",
    })
    const client = { session: { prompt: promptMock } }

    // when
    await expect(
      promptWithRetry(client as unknown as Client, {
        path: { id: "session-1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
          model: { providerID: "openai", modelID: "gpt-5.2" },
        },
      })
    ).rejects.toThrow()

    // then
    const ban = getProviderBanInfo("openai")
    expect(ban).not.toBeNull()
    expect(ban?.reason).toBe("quota")
  })

  it("should handle string error message with suggestion", async () => {

    // given a client that fails with a string error containing suggestion
    const promptMock = mock()
      .mockRejectedValueOnce(
        new Error("Model not found: anthropic/claude-sonet-4. Did you mean: claude-sonnet-4?")
      )
      .mockResolvedValueOnce(undefined)
    const client = { session: { prompt: promptMock } }

    // when calling promptWithRetry
    await promptWithRetry(client as unknown as Client, {
      path: { id: "session-1" },
      body: {
        parts: [{ type: "text", text: "hello" }],
        model: { providerID: "anthropic", modelID: "claude-sonet-4" },
      },
    })

    // then should retry with suggested model
    expect(promptMock).toHaveBeenCalledTimes(2)
    const retryCall = promptMock.mock.calls[1][0]
    expect(retryCall.body.model.modelID).toBe("claude-sonnet-4")
  })

  it("should not retry when no model in original request", async () => {
    // given a client that fails with model-not-found but original has no model param
    const modelNotFoundError = new Error(
      "Model not found: anthropic/claude-sonet-4. Did you mean: claude-sonnet-4?"
    )
    const promptMock = mock().mockRejectedValueOnce(modelNotFoundError)
    const client = { session: { prompt: promptMock } }

    // when calling without model in body
    // then should throw without retrying
    await expect(
      promptWithRetry(client as unknown as Client, {
        path: { id: "session-1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
        },
      })
    ).rejects.toThrow()

    expect(promptMock).toHaveBeenCalledTimes(1)
  })
})
