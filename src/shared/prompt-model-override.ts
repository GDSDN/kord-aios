const MODEL_PATTERN = "[a-zA-Z][a-zA-Z0-9._-]*(?:/[a-zA-Z0-9._-]+)?"

const PATTERNS = [
  new RegExp(`\\buse\\s+model\\s+(${MODEL_PATTERN})`, "i"),
  new RegExp(`\\bwith\\s+model\\s+(${MODEL_PATTERN})`, "i"),
  new RegExp(`@\\w+\\s+must\\s+use\\s+(${MODEL_PATTERN})`, "i"),
  new RegExp(`\\buse\\s+(${MODEL_PATTERN})`, "i"),
]

const FALSE_POSITIVE_WORDS = new Set([
  "the", "a", "an", "this", "that", "it", "its", "my", "your", "our",
  "their", "new", "old", "dependency", "pattern", "injection", "best",
  "proper", "correct", "same", "different", "another", "existing",
  "following", "above", "below",
])

function looksLikeModelId(candidate: string): boolean {
  if (FALSE_POSITIVE_WORDS.has(candidate.toLowerCase())) return false
  if (candidate.includes("/")) return true
  if (/[0-9]/.test(candidate) && candidate.includes("-")) return true
  if (candidate.includes(".")) return true
  return false
}

export function parsePromptModelOverride(prompt: string): string | undefined {
  for (const pattern of PATTERNS) {
    const match = prompt.match(pattern)
    if (match && match[1]) {
      const candidate = match[1]
      if (looksLikeModelId(candidate)) {
        return candidate
      }
    }
  }
  return undefined
}
