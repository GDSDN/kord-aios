import { z, type ZodIssue } from "zod"
import type { AgentConfig } from "@opencode-ai/sdk"

export interface OpenCodeAgentFrontmatter {
  name?: string
  description?: string
  model?: string
  temperature?: number
  tools?: string
  write_paths?: string[]
  tool_allowlist?: string[]
  engine_min_version?: string
}

/**
 * Zod schema for validating OpenCode agent frontmatter.
 * All fields are optional to maintain backward compatibility.
 */
export const openCodeAgentFrontmatterSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  tools: z.string().optional(),
  write_paths: z.array(z.string()).optional(),
  tool_allowlist: z.array(z.string()).optional(),
  engine_min_version: z.string().optional(),
})

/**
 * Lightweight semver validation (major.minor.patch).
 * Used for engine_min_version field validation.
 */
function isValidSemver(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+$/
  return semverRegex.test(version)
}

/**
 * Parse result type for frontmatter validation
 */
export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

/**
 * Parse and validate OpenCode agent frontmatter data.
 * Returns parsed result with validation errors if invalid.
 *
 * @param unknownData - Raw frontmatter data from parseFrontmatter
 * @returns ParseResult with validated frontmatter or error message
 */
export function parseOpenCodeAgentFrontmatter(
  unknownData: unknown,
): ParseResult<OpenCodeAgentFrontmatter> {
  // First, validate with Zod schema
  const parseResult = openCodeAgentFrontmatterSchema.safeParse(unknownData)

  if (!parseResult.success) {
    const issues: ZodIssue[] = (parseResult.error as { issues: ZodIssue[] }).issues
    const errorMessages = issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ")

    return { ok: false, error: `Validation failed: ${errorMessages}` }
  }

  const data = parseResult.data

  // Additional validation: engine_min_version must be valid semver if provided
  if (data.engine_min_version !== undefined && !isValidSemver(data.engine_min_version)) {
    return {
      ok: false,
      error: `engine_min_version must be a valid semver string (e.g., "1.0.0"), got "${data.engine_min_version}"`,
    }
  }

  // Additional validation: write_paths must be array (Zod already validates this, but double-check)
  if (unknownData && typeof unknownData === "object") {
    const raw = unknownData as Record<string, unknown>
    if (raw.write_paths !== undefined && !Array.isArray(raw.write_paths)) {
      return {
        ok: false,
        error: `write_paths must be an array, got ${typeof raw.write_paths}`,
      }
    }
    if (raw.tool_allowlist !== undefined && !Array.isArray(raw.tool_allowlist)) {
      return {
        ok: false,
        error: `tool_allowlist must be an array, got ${typeof raw.tool_allowlist}`,
      }
    }
  }

  return { ok: true, value: data }
}

export interface LoadedOpenCodeAgent {
  name: string
  path: string
  config: AgentConfig
}
