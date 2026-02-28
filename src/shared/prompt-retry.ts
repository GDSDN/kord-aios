import type { createOpencodeClient } from "@opencode-ai/sdk"
import { log } from "./logger"
import { buildFallbackCandidates } from "./fallback-candidates"
import type { FallbackEntry } from "./model-requirements"
import { markProviderUnhealthy } from "./provider-health"
import { markInternalSessionAbort } from "./internal-session-abort"

type Client = ReturnType<typeof createOpencodeClient>
const DEFAULT_PROMPT_TIMEOUT_MS = 30_000
const DEFERRED_ERROR_CHECK_INTERVAL_MS = 250
const DEFERRED_ERROR_CHECK_ATTEMPTS = 8

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
      value.includes("insufficient_credits") ||
      value.includes("insufficient_balance") ||
      value.includes("insufficient balance") ||
      value.includes("creditserror") ||
      value.includes("billing")
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
          normalized.includes("quota_exceeded") ||
          normalized.includes("insufficient_balance") ||
          normalized.includes("insufficient balance") ||
          normalized.includes("creditserror")
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
    msg.includes("insufficient balance") ||
    msg.includes("billing") ||
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

type SessionMessageSnapshot = {
  count: number
  lastSerialized: string
  latestCreated: number
}

function safeSerialize(value: unknown): string {
  try {
    return JSON.stringify(value) ?? ""
  } catch {
    return ""
  }
}

function extractCreatedTime(message: unknown): number {
  if (!message || typeof message !== "object") return 0
  const info = (message as { info?: { time?: { created?: number } } }).info
  return typeof info?.time?.created === "number" ? info.time.created : 0
}

function createSnapshot(messages: unknown[]): SessionMessageSnapshot {
  const last = messages.length > 0 ? messages[messages.length - 1] : undefined
  return {
    count: messages.length,
    lastSerialized: safeSerialize(last),
    latestCreated: messages.reduce<number>((max, msg) => Math.max(max, extractCreatedTime(msg)), 0),
  }
}

async function readSessionMessages(client: Client, sessionID: string): Promise<unknown[]> {
  if (!sessionID || typeof client.session.messages !== "function") {
    return []
  }

  try {
    const response = await client.session.messages({ path: { id: sessionID } })
    const data = (response as { data?: unknown }).data ?? response
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function collectDeltaMessages(messages: unknown[], snapshot: SessionMessageSnapshot): unknown[] {
  const delta: unknown[] = []

  if (messages.length > snapshot.count) {
    delta.push(...messages.slice(snapshot.count))
  }

  const last = messages.length > 0 ? messages[messages.length - 1] : undefined
  if (last && safeSerialize(last) !== snapshot.lastSerialized) {
    delta.push(last)
  }

  for (const message of messages) {
    if (extractCreatedTime(message) > snapshot.latestCreated) {
      delta.push(message)
    }
  }

  return Array.from(new Set(delta))
}

function hasMeaningfulAssistantOrToolOutput(messages: unknown[]): boolean {
  return messages.some((message) => {
    if (!message || typeof message !== "object") return false

    const info = (message as { info?: { role?: string } }).info
    const role = info?.role
    if (role !== "assistant" && role !== "tool") return false

    const parts = (message as { parts?: Array<{ type?: string; text?: string }> }).parts ?? []
    if (parts.length === 0) return role === "tool"

    return parts.some((part) => {
      if (!part || typeof part !== "object") return false
      const text = typeof part.text === "string" ? part.text.trim() : ""
      if (text.length > 0) return true

      const type = typeof part.type === "string" ? part.type.trim() : ""
      return role === "tool" && type.length > 0
    })
  })
}

async function detectDeferredPromptError(
  client: Client,
  sessionID: string,
  snapshot: SessionMessageSnapshot,
): Promise<unknown | null> {
  for (let attempt = 0; attempt < DEFERRED_ERROR_CHECK_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, DEFERRED_ERROR_CHECK_INTERVAL_MS))
    }

    const messages = await readSessionMessages(client, sessionID)
    const deltaMessages = collectDeltaMessages(messages, snapshot)
    const deferredError = deltaMessages.find((message) => isQuotaError(message))
    if (deferredError) {
      return deferredError
    }
  }

  return null
}

async function callPromptAndDetectDeferredErrors(
  client: Client,
  args: PromptArgs,
  timeoutMs: number,
): Promise<void> {
  const sessionID = args.path?.id
  const snapshot = sessionID ? createSnapshot(await readSessionMessages(client, sessionID)) : null

  await callPromptWithTimeout(client, args, timeoutMs)

  if (!sessionID || !snapshot) {
    return
  }

  const deferredError = await detectDeferredPromptError(client, sessionID, snapshot)
  if (deferredError) {
    throw deferredError
  }
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
  const sessionID = args.path?.id

  try {
    await callPromptAndDetectDeferredErrors(client, args, promptTimeoutMs)
  } catch (error) {
    if (isQuotaError(error) && currentProviderID) {
      markProviderUnhealthy(currentProviderID, "quota")
    }

    if (isTimeoutError(error) && sessionID) {
      const currentMessages = await readSessionMessages(client, sessionID)
      const recentWindowMs = promptTimeoutMs + 5_000
      const now = Date.now()
      const recentMessages = currentMessages.filter((message) => {
        const created = extractCreatedTime(message)
        if (created <= 0) return false
        return now - created <= recentWindowMs
      })

      const hasOutputProgress = hasMeaningfulAssistantOrToolOutput(recentMessages)

      if (hasOutputProgress) {
        log("[prompt-retry] Timeout detected with ongoing output; preserving active generation", {
          sessionID,
          model: currentModel,
          recentMessageCount: recentMessages.length,
        })
        return
      }
    }

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
          markInternalSessionAbort(sessionID, `prompt-retry:${stage}`)
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

      const currentModelKey = currentProviderID && currentModelID
        ? `${currentProviderID}/${currentModelID}`
        : undefined
      const excludeModels = new Set<string>()
      if (currentModelKey) {
        excludeModels.add(currentModelKey)
      }

      const { candidates, diagnostics } = await buildFallbackCandidates({
        client,
        fallbackChain,
        excludeModels,
        allowModelListMiss: true,
      })

      log("[prompt-retry] Fallback candidate diagnostics", {
        model: currentModel,
        reason: retryReason,
        candidateCount: candidates.length,
        connectedProvidersKnown: diagnostics.connectedProvidersKnown,
        connectedProviders: diagnostics.connectedProviders,
        availableModelCount: diagnostics.availableModelCount,
        skippedDisconnected: diagnostics.skippedDisconnected,
        skippedUnavailable: diagnostics.skippedUnavailable,
        skippedUnhealthy: diagnostics.skippedUnhealthy,
      })

      const attemptedFallbacks: string[] = []

      for (const candidate of candidates) {
        const fallbackModelStr = `${candidate.providerID}/${candidate.modelID}`
        attemptedFallbacks.push(fallbackModelStr)

        log("[prompt-retry] Attempting fallback", { fallbackModel: fallbackModelStr })

        try {
          const variantToUse = candidate.variant ?? args.body.variant
          await callPromptAndDetectDeferredErrors(client, {
            ...args,
            body: {
              ...args.body,
              model: {
                providerID: candidate.providerID,
                modelID: candidate.modelID,
              },
              ...(variantToUse ? { variant: variantToUse } : {}),
            },
          }, promptTimeoutMs)
          log("[prompt-retry] Fallback successful", { model: fallbackModelStr })
          return
        } catch (fallbackError) {
          if (isQuotaError(fallbackError)) {
            markProviderUnhealthy(candidate.providerID, "quota")
          }

          log("[prompt-retry] Fallback failed", {
            model: fallbackModelStr,
            error: extractMessage(fallbackError),
          })
          await abortSession("fallback")
        }
      }

      const attemptedText = attemptedFallbacks.length > 0
        ? attemptedFallbacks.join(", ")
        : "none"
      throw new Error(
        `Retryable model error (${retryReason}) and fallback candidates exhausted. Current model: ${currentModel}. Attempted: ${attemptedText}`,
      )
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

