import type { createOpencodeClient } from "@opencode-ai/sdk"
import { log } from "./logger"
import type { FallbackEntry } from "./model-requirements"

type Client = ReturnType<typeof createOpencodeClient>

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

function isQuotaError(error: unknown): boolean {
  const msg = extractMessage(error).toLowerCase()
  return (
    msg.includes("rate limit") ||
    msg.includes("quota exceeded") ||
    msg.includes("insufficient quota") ||
    msg.includes("429") ||
    msg.includes("capacity") ||
    msg.includes("overloaded")
  )
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
  model?: { providerID: string; modelID: string; variant?: string }
  [key: string]: unknown
}

interface PromptArgs {
  path: { id: string }
  body: PromptBody
  [key: string]: unknown
}

export async function promptWithRetry(
  client: Client,
  args: PromptArgs,
  fallbackChain?: FallbackEntry[]
): Promise<void> {
  const currentModel = args.body.model 
    ? `${args.body.model.providerID}/${args.body.model.modelID}`
    : "unknown/default"

  try {
    await client.session.prompt(args as Parameters<typeof client.session.prompt>[0])
  } catch (error) {
    // 1. Handle Model Not Found (Suggestion)
    const suggestion = parseModelSuggestion(error)
    if (suggestion && args.body.model) {
      log("[prompt-retry] Model not found, retrying with suggestion", {
        original: `${suggestion.providerID}/${suggestion.modelID}`,
        suggested: suggestion.suggestion,
      })

      await client.session.prompt({
        ...args,
        body: {
          ...args.body,
          model: {
            providerID: suggestion.providerID,
            modelID: suggestion.suggestion,
            // Preserve variant if it existed
            ...(args.body.model?.variant ? { variant: args.body.model.variant } : {}),
          },
        },
      } as Parameters<typeof client.session.prompt>[0])
      return
    }

    // 2. Handle Quota/Rate Limit Errors
    if (isQuotaError(error) && fallbackChain && fallbackChain.length > 0) {
      log("[prompt-retry] Quota/Rate limit error detected", { model: currentModel, error: extractMessage(error) })

      // Filter out the current model to avoid infinite loop on same model
      // (Though usually currentModel comes from outside the chain or is the first one)
      const candidates = fallbackChain.filter(entry => {
        // Construct full model strings to compare
        const entryModels = entry.providers.map(p => `${p}/${entry.model}`)
        return !entryModels.includes(currentModel)
      })

      for (const entry of candidates) {
        // Try each provider for this fallback entry
        for (const provider of entry.providers) {
          const fallbackModelStr = `${provider}/${entry.model}`
          log("[prompt-retry] Attempting fallback", { fallbackModel: fallbackModelStr })

          try {
            await client.session.prompt({
              ...args,
              body: {
                ...args.body,
                model: {
                  providerID: provider,
                  modelID: entry.model,
                  ...(entry.variant ? { variant: entry.variant } : {}),
                },
              },
            } as Parameters<typeof client.session.prompt>[0])
            
            log("[prompt-retry] Fallback successful", { model: fallbackModelStr })
            return // Success! Exit function
          } catch (fallbackError) {
            log("[prompt-retry] Fallback failed", { 
              model: fallbackModelStr, 
              error: extractMessage(fallbackError) 
            })
            // Continue to next provider/candidate
          }
        }
      }
      log("[prompt-retry] All fallbacks failed")
    }

    // If no handling matched or all fallbacks failed, rethrow original error
    throw error
  }
}

