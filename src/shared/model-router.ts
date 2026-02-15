import type { ModelEntry } from "./model-schema"

export type ComplexityLevel = "trivial" | "moderate" | "complex" | "deep"

export type TaskClassification = {
  complexity: ComplexityLevel
  domains: string[]
}

export type RouteResult = {
  model: string
  variant?: string
  provenance: "dynamic-route"
}

export type LLMClassifierClient = {
  classify: (prompt: string, agentName?: string) => Promise<TaskClassification>
}

const VALID_COMPLEXITY = new Set<string>(["trivial", "moderate", "complex", "deep"])

export async function classifyTaskWithLLM(
  prompt: string,
  agentName?: string,
  client?: LLMClassifierClient,
): Promise<TaskClassification> {
  if (!client) {
    return classifyTask(prompt, agentName)
  }

  try {
    const result = await client.classify(prompt, agentName)
    if (!VALID_COMPLEXITY.has(result.complexity)) {
      return classifyTask(prompt, agentName)
    }
    return result
  } catch {
    return classifyTask(prompt, agentName)
  }
}

const TRIVIAL_KEYWORDS = [
  "fix typo", "rename", "quick fix", "simple fix", "add comma", "remove comma",
  "update import", "fix import", "typo", "spelling", "whitespace", "formatting",
]

const COMPLEX_KEYWORDS = [
  "refactor", "architecture", "redesign", "migrate", "system-wide",
  "across modules", "breaking change", "cross-cutting", "rewrite",
  "overhaul", "restructure",
]

const DEEP_KEYWORDS = [
  "autonomous", "strategic", "long-running", "comprehensive overhaul",
]

const DEBUG_KEYWORDS = [
  "debug", "race condition", "deadlock", "memory leak", "investigate",
  "root cause", "intermittent", "flaky",
]

const DOMAIN_SIGNALS: Record<string, string[]> = {
  coding: [
    "implement", "code", "function", "class", "api", "endpoint", "module",
    "component", "service", "handler", "controller", "middleware", "test",
    "bug", "fix", "refactor", "build", "compile", "deploy",
  ],
  planning: [
    "plan", "strategy", "roadmap", "epic", "story", "milestone", "phase",
    "timeline", "estimate", "prioritize", "scope",
  ],
  analysis: [
    "analyze", "analysis", "investigate", "evaluate", "assess", "review",
    "audit", "benchmark", "performance", "bottleneck", "profil",
  ],
  visual: [
    "screenshot", "image", "ui", "layout", "design", "visual", "css",
    "style", "pixel", "responsive", "mockup", "wireframe",
  ],
  writing: [
    "document", "documentation", "write doc", "readme", "changelog",
    "comment", "explain", "describe", "tutorial", "guide",
  ],
  search: [
    "search", "find", "locate", "grep", "look for", "where is",
    "which file", "codebase",
  ],
}

const COMPLEX_AGENT_TYPES = new Set(["kord", "planner", "analyst", "plan-analyzer", "architect"])
const TRIVIAL_AGENT_TYPES = new Set(["explore"])

const CATEGORY_COMPLEXITY: Record<string, ComplexityLevel> = {
  ultrabrain: "complex",
  deep: "deep",
  quick: "trivial",
  "unspecified-high": "complex",
  "unspecified-low": "moderate",
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw))
}

function detectDomains(prompt: string): string[] {
  const lower = prompt.toLowerCase()
  const detected: string[] = []

  for (const [domain, keywords] of Object.entries(DOMAIN_SIGNALS)) {
    if (matchesAny(lower, keywords)) {
      detected.push(domain)
    }
  }

  return detected.length > 0 ? detected : ["general"]
}

function computeComplexityScore(prompt: string, agentName?: string, category?: string): number {
  const lower = prompt.toLowerCase()
  let score = 0

  if (matchesAny(lower, TRIVIAL_KEYWORDS)) score -= 3
  if (matchesAny(lower, COMPLEX_KEYWORDS)) score += 3
  if (matchesAny(lower, DEEP_KEYWORDS)) score += 5
  if (matchesAny(lower, DEBUG_KEYWORDS)) score += 2

  const wordCount = prompt.split(/\s+/).length
  if (wordCount <= 5) score -= 1
  else if (wordCount >= 50) score += 2
  else if (wordCount >= 100) score += 3

  if (agentName) {
    if (COMPLEX_AGENT_TYPES.has(agentName)) score += 2
    if (TRIVIAL_AGENT_TYPES.has(agentName)) score -= 3
  }

  if (category && CATEGORY_COMPLEXITY[category]) {
    const catLevel = CATEGORY_COMPLEXITY[category]
    if (catLevel === "trivial") score -= 4
    else if (catLevel === "moderate") score += 0
    else if (catLevel === "complex") score += 4
    else if (catLevel === "deep") score += 7
  }

  return score
}

function scoreToComplexity(score: number): ComplexityLevel {
  if (score <= -1) return "trivial"
  if (score <= 1) return "moderate"
  if (score <= 4) return "complex"
  return "deep"
}

export function classifyTask(
  prompt: string,
  agentName?: string,
  category?: string,
): TaskClassification {
  const score = computeComplexityScore(prompt, agentName, category)
  const complexity = scoreToComplexity(score)
  const domains = detectDomains(prompt)

  return { complexity, domains }
}

const REASONING_TIERS_FOR_COMPLEXITY: Record<ComplexityLevel, string[]> = {
  trivial: ["none", "low"],
  moderate: ["medium", "high"],
  complex: ["high", "ultra"],
  deep: ["ultra"],
}

function isModelAvailableForRoute(entry: ModelEntry, availableModels: Set<string>): boolean {
  return entry.providers.some(provider => availableModels.has(`${provider}/${entry.model}`))
}

function scoreCandidateModel(
  entry: ModelEntry,
  classification: TaskClassification,
  costPreference?: string,
): number {
  let score = 0

  const preferredTiers = REASONING_TIERS_FOR_COMPLEXITY[classification.complexity]
  if (preferredTiers.includes(entry.reasoning)) {
    score += 10
  }

  const domainOverlap = classification.domains.filter(d =>
    (entry.domains as string[]).includes(d),
  ).length
  score += domainOverlap * 5

  const REASONING_RANK: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3, ultra: 4 }
  const reasoningRank = REASONING_RANK[entry.reasoning] ?? 2

  if (costPreference === "economy") {
    score -= entry.cost_tier * 2
    score -= reasoningRank
  } else if (costPreference === "performance") {
    score += entry.cost_tier * 2
    score += reasoningRank
  }

  return score
}

export function routeModel(
  agentName: string,
  classification: TaskClassification,
  modelSchema: ModelEntry[],
  availableModels: Set<string>,
  costPreference?: string,
): RouteResult | undefined {
  const agentModels = modelSchema.filter(e => e.enabled_agents.includes(agentName))
  if (agentModels.length === 0) return undefined

  const available = agentModels.filter(e => isModelAvailableForRoute(e, availableModels))
  if (available.length === 0) return undefined

  const scored = available
    .map(entry => ({ entry, score: scoreCandidateModel(entry, classification, costPreference) }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0].entry

  return {
    model: best.model,
    variant: best.variant,
    provenance: "dynamic-route",
  }
}
