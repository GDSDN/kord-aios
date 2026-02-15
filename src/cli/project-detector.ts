import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * S02: Brownfield/Greenfield Project Detection
 *
 * Detects project maturity to adapt installer behavior.
 * Pure function — only reads filesystem, no side effects.
 */

export interface ProjectMaturity {
  status: "fresh" | "partial" | "existing"
  hasOpenCodeJson: boolean
  hasKordPlugin: boolean
  hasKordAiosConfig: boolean
  hasKordDirectory: boolean
  hasDocsKord: boolean
  hasKordRules: boolean
  currentVersion: string | null
}

/**
 * Detects project maturity by inspecting the filesystem.
 * @param projectDir — absolute path to the project root
 */
export function detectProjectMaturity(projectDir: string): ProjectMaturity {
  const hasOpenCodeJson = existsSync(join(projectDir, "opencode.json"))
  const hasKordPlugin = hasOpenCodeJson ? detectKordPlugin(join(projectDir, "opencode.json")) : false
  const hasKordAiosConfig = existsSync(join(projectDir, "kord-aios.config.jsonc"))
    || existsSync(join(projectDir, "kord-aios.config.json"))
  const hasKordDirectory = existsSync(join(projectDir, ".kord"))
  const hasDocsKord = existsSync(join(projectDir, "docs", "kord"))
  const hasKordRules = existsSync(join(projectDir, "kord-rules.md"))

  const currentVersion = hasKordPlugin ? extractPluginVersion(join(projectDir, "opencode.json")) : null

  const status = classifyMaturity({
    hasOpenCodeJson,
    hasKordPlugin,
    hasKordAiosConfig,
    hasKordDirectory,
    hasDocsKord,
    hasKordRules,
  })

  return {
    status,
    hasOpenCodeJson,
    hasKordPlugin,
    hasKordAiosConfig,
    hasKordDirectory,
    hasDocsKord,
    hasKordRules,
    currentVersion,
  }
}

interface MaturitySignals {
  hasOpenCodeJson: boolean
  hasKordPlugin: boolean
  hasKordAiosConfig: boolean
  hasKordDirectory: boolean
  hasDocsKord: boolean
  hasKordRules: boolean
}

function classifyMaturity(signals: MaturitySignals): "fresh" | "partial" | "existing" {
  if (!signals.hasOpenCodeJson || !signals.hasKordPlugin) {
    return "fresh"
  }

  const hasScaffold = signals.hasKordDirectory && signals.hasDocsKord
  const hasConfig = signals.hasKordAiosConfig

  if (hasScaffold && hasConfig) {
    return "existing"
  }

  return "partial"
}

function detectKordPlugin(openCodeJsonPath: string): boolean {
  try {
    const content = readFileSync(openCodeJsonPath, "utf-8")
    const config = JSON.parse(content)
    const plugins: string[] = config?.plugin ?? []
    return plugins.some((p: string) => p.startsWith("kord-aios"))
  } catch {
    return false
  }
}

function extractPluginVersion(openCodeJsonPath: string): string | null {
  try {
    const content = readFileSync(openCodeJsonPath, "utf-8")
    const config = JSON.parse(content)
    const plugins: string[] = config?.plugin ?? []
    const kordEntry = plugins.find((p: string) => p.startsWith("kord-aios"))
    if (!kordEntry) return null

    const atIndex = kordEntry.indexOf("@", 1)
    if (atIndex === -1) return null
    return kordEntry.slice(atIndex + 1)
  } catch {
    return null
  }
}
