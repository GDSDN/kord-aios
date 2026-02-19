import type { createOpencodeClient } from "@opencode-ai/sdk"
import { log } from "./logger"
import type { FallbackEntry } from "./model-requirements"

type Client = ReturnType<typeof createOpencodeClient>
const DEFAULT_PROMPT_TIMEOUT_MS = 30_000

type SDKResult<T> = T & { error?: unknown }

export interface ModelSuggestionInfo {
  providerID: string
  modelID: string
  suggestion: string
}

function extractMessage(error: unknown): string {
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>
    if (typeof obj.message === "string") return obj.message
    try {
      return JSON.stringify(error)
    } catch {
      return ""
    }
  }
  return String(error)
}

function hasStructuredQuotaSignal(error: unknown, seen = new Set<unknown>()): boolean {
  if (error == null) return false

  if (typeof error === "number") {
    return error === 429 || error === 402
  }

  if (typeof error === "string") {
    const value = error.toLowerCase()
    return (
      value === "429" ||
      value === "402" ||
      value.includes("rate_limit") ||
      value.includes("ratelimit") ||
      value.includes("insufficient_quota") ||
      value.includes("insufficient_credits")
    )
  }

  if (typeof error !== "object") {
    return false
  }

  if (seen.has(error)) {
    return false
  }
  seen.add(error)

  const obj = error as Record<string, unknown>

  const numericCandidates = [obj.status, obj.statusCode, obj.httpStatusCode]
  for (const candidate of numericCandidates) {
    if (typeof candidate === "number" && (candidate === 429 || candidate === 402)) {
      return true
    }
    if (typeof candidate === "string" && (candidate.trim() === "429" || candidate.trim() === "402")) {
      return true
    }
  }

  const codeCandidates = [obj.code, obj.type, obj.errorCode, obj.reason, obj.name]
  for (const candidate of codeCandidates) {
    if (typeof candidate === "string") {
      const normalized = candidate.toLowerCase()
      if (
        normalized.includes("rate_limit") ||
        normalized.includes("too_many_requests") ||
        normalized.includes("ratelimit") ||
        normalized.includes("insufficient_quota") ||
        normalized.includes("insufficient_credits") ||
        normalized.includes("quota_exceeded")
      ) {
        return true
      }
    }
  }

  for (const value of Object.values(obj)) {
    if (hasStructuredQuotaSignal(value, seen)) {
      return true
    }
  }

  return false
}

function isQuotaError(error: unknown): boolean {
  const msg = extractMessage(error).toLowerCase()
  return hasStructuredQuotaSignal(error) || (
    msg.includes("rate limit") ||
    msg.includes("rate-limited") ||
    msg.includes("too many requests") ||
    msg.includes("resource exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("insufficient quota") ||
    msg.includes("quota") ||
    msg.includes("429") ||
    msg.includes("capacity") ||
    msg.includes("overloaded")
  )
}

function isTimeoutError(error: unknown): boolean {
  const msg = extractMessage(error).toLowerCase()
  return msg.includes("timed out") || msg.includes("timeout")
}

function isRetryableModelError(error: unknown): boolean {
  return isQuotaError(error) || isTimeoutError(error)
}

export function parseModelSuggestion(error: unknown): ModelSuggestionInfo | null {
  if (!error) return null

  if (typeof error === "object") {
    const errObj = error as Record<string, unknown>

    if (errObj.name === "ProviderModelNotFoundError" && typeof errObj.data === "object" && errObj.data !== null) {
      const data = errObj.data as Record<string, unknown>
      const suggestions = data.suggestions
      if (Array.isArray(suggestions) && suggestions.length > 0 && typeof suggestions[0] === "string") {
        return {
          providerID: String(data.providerID ?? ""),
          modelID: String(data.modelID ?? ""),
          suggestion: suggestions[0],
        }
      }
      return null
    }

    for (const key of ["data", "error", "cause"] as const) {
      const nested = errObj[key]
      if (nested && typeof nested === "object") {
        const result = parseModelSuggestion(nested)
        if (result) return result
      }
    }
  }

  const message = extractMessage(error)
  if (!message) return null

  const modelMatch = message.match(/model not found:\s*([^/\s]+)\s*\/\s*([^.\s]+)/i)
  const suggestionMatch = message.match(/did you mean:\s*([^,?]+)/i)

  if (modelMatch && suggestionMatch) {
    return {
      providerID: modelMatch[1].trim(),
      modelID: modelMatch[2].trim(),
      suggestion: suggestionMatch[1].trim(),
    }
  }

  return null
}

interface PromptBody {
  parts: Array<unknown>
  agent?: string
  noReply?: boolean
  system?: string
  tools?: Record<string, boolean>
  model?: { providerID: string; modelID: string }
  variant?: string
  [key: string]: unknown
}

interface PromptArgs {
  path: { id: string }
  body: PromptBody
  [key: string]: unknown
}

interface PromptRetryOptions {
  promptTimeoutMs?: number
}

function createPromptTimeoutError(sessionID: string | undefined, timeoutMs: number): Error {
  const suffix = sessionID ? ` for session ${sessionID}` : ""
  return new Error(`session.prompt timed out after ${timeoutMs}ms${suffix}`)
}

async function callPromptWithTimeout(
  client: Client,
  args: PromptArgs,
  timeoutMs: number
): Promise<void> {
  const promptInput = args as Parameters<typeof client.session.prompt>[0]
  const sessionID = args.path?.id

  const result = await new Promise<SDKResult<unknown>>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(createPromptTimeoutError(sessionID, timeoutMs))
    }, timeoutMs)

    client.session.prompt(promptInput)
      .then((value) => {
        clearTimeout(timer)
        resolve(value as SDKResult<unknown>)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })

  if (result && typeof result === "object" && "error" in result && result.error) {
    throw result.error
  }
}

export async function promptWithRetry(
  client: Client,
  args: PromptArgs,
  fallbackChain?: FallbackEntry[],
  options?: PromptRetryOptions
): Promise<void> {
  const promptTimeoutMs = options?.promptTimeoutMs ?? DEFAULT_PROMPT_TIMEOUT_MS
  const currentProviderID = args.body.model?.providerID
  const currentModelID = args.body.model?.modelID
  const currentModel = currentProviderID && currentModelID
    ? `${currentProviderID}/${currentModelID}`
    : "unknown/default"

  try {
    await callPromptWithTimeout(client, args, promptTimeoutMs)
  } catch (error) {
    // 1. Handle Model Not Found (Suggestion)
    const suggestion = parseModelSuggestion(error)
    if (suggestion && args.body.model) {
      log("[prompt-retry] Model not found, retrying with suggestion", {
        original: `${suggestion.providerID}/${suggestion.modelID}`,
        suggested: suggestion.suggestion,
      })

      await callPromptWithTimeout(client, {
        ...args,
        body: {
          ...args.body,
          model: {
            providerID: suggestion.providerID,
            modelID: suggestion.suggestion,
          },
        },
      }, promptTimeoutMs)
      return
    }

    // 2. Handle Retryable Errors (quota/rate-limit/timeout)
    if (isRetryableModelError(error) && fallbackChain && fallbackChain.length > 0) {
      const retryReason = isTimeoutError(error) ? "timeout" : "quota"
      log("[prompt-retry] Retryable model error detected", {
        model: currentModel,
        error: extractMessage(error),
        reason: retryReason,
      })

      const sessionID = args.path?.id
      const abortSession = async (stage: string): Promise<void> => {
        if (!sessionID || typeof client.session.abort !== "function") return
        try {
          await client.session.abort({ path: { id: sessionID } })
          log("[prompt-retry] Aborted session before fallback", { sessionID, stage })
        } catch (abortError) {
          log("[prompt-retry] Failed to abort session before fallback", {
            sessionID,
            stage,
            error: extractMessage(abortError),
          })
        }
      }

      await abortSession("initial")

      const attemptedFallbacks = new Set<string>()

      for (const entry of fallbackChain) {
        // Try each provider for this fallback entry
        for (const provider of entry.providers) {
          // Skip only the exact currently-failed provider/model pair.
          if (currentProviderID === provider && currentModelID === entry.model) {
            continue
          }

          const fallbackModelStr = `${provider}/${entry.model}`

          if (attemptedFallbacks.has(fallbackModelStr)) {
            continue
          }
          attemptedFallbacks.add(fallbackModelStr)

          log("[prompt-retry] Attempting fallback", { fallbackModel: fallbackModelStr })

          try {
            const variantToUse = entry.variant ?? args.body.variant
            await callPromptWithTimeout(client, {
              ...args,
              body: {
                ...args.body,
                model: {
                  providerID: provider,
                  modelID: entry.model,
                },
                ...(variantToUse ? { variant: variantToUse } : {}),
              },
            }, promptTimeoutMs)
            log("[prompt-retry] Fallback successful", { model: fallbackModelStr })
            return // Success! Exit function
          } catch (fallbackError) {
            log("[prompt-retry] Fallback failed", {
              model: fallbackModelStr,
              error: extractMessage(fallbackError)
            })
            await abortSession("fallback")
          }
        }
      }
      log("[prompt-retry] All fallbacks failed")
    }

    // If no handling matched or all fallbacks failed, rethrow original error
    throw error
  }
}

export interface CreateSessionArgs {
  body: Record<string, unknown>
  query?: Record<string, unknown>
}

export async function createSessionWithRetry(
  client: Client,
  args: CreateSessionArgs,
  options?: { maxAttempts?: number; baseDelayMs?: number; maxDelayMs?: number }
): Promise<{ id: string }>{
  const maxAttempts = options?.maxAttempts ?? 3
  const baseDelayMs = options?.baseDelayMs ?? 750
  const maxDelayMs = options?.maxDelayMs ?? 8000

  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = (await client.session.create({
        body: args.body,
        ...(args.query ? { query: args.query } : {}),
      } as Parameters<typeof client.session.create>[0])) as SDKResult<{
        data?: { id?: string }
      }>

      if (result && typeof result === "object" && "error" in result && result.error) {
        throw result.error
      }

      const id = (result as unknown as { data?: { id?: string } })?.data?.id
      if (!id) {
        throw new Error("Failed to create session: API returned no session ID")
      }

      return { id }
    } catch (error) {
      lastError = error
      const retryable = isRetryableModelError(error)
      if (!retryable || attempt === maxAttempts - 1) {
        throw error
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs)
      log("[prompt-retry] createSession retryable error", {
        attempt: attempt + 1,
        maxAttempts,
        delayMs: delay,
        error: extractMessage(error),
      })
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  // Should be unreachable.
  throw lastError instanceof Error ? lastError : new Error(extractMessage(lastError))
}

