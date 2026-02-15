import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { getOpenCodeConfigPaths, parseJsonc } from "../shared"
import { KORD_DIR, KORD_DOCS_DIR, KORD_RULES_FILE } from "./project-layout"

export interface PostInstallCheckResult {
  name: string
  passed: boolean
  message: string
  blocking: boolean
}

export interface PostInstallDoctorResult {
  checks: PostInstallCheckResult[]
  passed: number
  total: number
}

const GEMINI_AUTH_PLUGIN = "opencode-antigravity-auth"

function getOpenCodeConfigFilePath(): string {
  const paths = getOpenCodeConfigPaths({ binary: "opencode", version: null })
  return existsSync(paths.configJsonc) ? paths.configJsonc : paths.configJson
}

function checkOpenCodeConfigValid(): PostInstallCheckResult {
  const path = getOpenCodeConfigFilePath()

  if (!existsSync(path)) {
    return { name: "OpenCode config valid", passed: false, message: "File not found", blocking: false }
  }

  try {
    const content = readFileSync(path, "utf-8")
    parseJsonc<Record<string, unknown>>(content)
    return { name: "OpenCode config valid", passed: true, message: `Valid: ${path}`, blocking: false }
  } catch {
    return { name: "OpenCode config valid", passed: false, message: "Invalid JSON/JSONC", blocking: false }
  }
}

function checkPluginRegistered(): PostInstallCheckResult {
  const path = getOpenCodeConfigFilePath()

  if (!existsSync(path)) {
    return { name: "Plugin registered", passed: false, message: "No config file", blocking: false }
  }

  try {
    const content = readFileSync(path, "utf-8")
    const config = parseJsonc<{ plugin?: string[] }>(content)
    const plugins = config.plugin ?? []
    const found = plugins.some(p => p === "kord-aios" || p.startsWith("kord-aios@") || (p.startsWith("file://") && p.includes("kord-aios")))
    return found
      ? { name: "Plugin registered", passed: true, message: "kord-aios found in plugins", blocking: false }
      : { name: "Plugin registered", passed: false, message: "kord-aios not in plugins array", blocking: false }
  } catch {
    return { name: "Plugin registered", passed: false, message: "Could not read config", blocking: false }
  }
}

function checkAuthPluginConfigured(): PostInstallCheckResult {
  const path = getOpenCodeConfigFilePath()

  if (!existsSync(path)) {
    return { name: "Auth plugin configured", passed: false, message: "No OpenCode config file", blocking: false }
  }

  try {
    const content = readFileSync(path, "utf-8")
    const config = parseJsonc<{ plugin?: string[] }>(content)
    const plugins = config.plugin ?? []
    const found = plugins.some((p) => p === GEMINI_AUTH_PLUGIN || p.startsWith(`${GEMINI_AUTH_PLUGIN}@`))
    return found
      ? { name: "Auth plugin configured", passed: true, message: "opencode-antigravity-auth found in plugins", blocking: false }
      : { name: "Auth plugin configured", passed: false, message: "opencode-antigravity-auth not configured", blocking: false }
  } catch {
    return { name: "Auth plugin configured", passed: false, message: "Could not read OpenCode config", blocking: false }
  }
}

function checkAntigravityProviderConfigured(): PostInstallCheckResult {
  const path = getOpenCodeConfigFilePath()

  if (!existsSync(path)) {
    return { name: "Antigravity provider configured", passed: false, message: "No OpenCode config file", blocking: false }
  }

  try {
    const content = readFileSync(path, "utf-8")
    const config = parseJsonc<{ provider?: Record<string, unknown> }>(content)
    const provider = config.provider ?? {}
    const found = Boolean(provider.google)
    return found
      ? { name: "Antigravity provider configured", passed: true, message: "provider.google found", blocking: false }
      : { name: "Antigravity provider configured", passed: false, message: "provider.google missing", blocking: false }
  } catch {
    return { name: "Antigravity provider configured", passed: false, message: "Could not read OpenCode config", blocking: false }
  }
}

function checkKordAiosConfig(): PostInstallCheckResult {
  const paths = getOpenCodeConfigPaths({ binary: "opencode", version: null })
  const p = paths.kordAiosConfig
  if (!existsSync(p)) {
    return { name: "Kord AIOS config valid", passed: false, message: "kord-aios.json not found", blocking: false }
  }

  try {
    const content = readFileSync(p, "utf-8")
    parseJsonc<Record<string, unknown>>(content)
    return { name: "Kord AIOS config valid", passed: true, message: `Valid: ${p}`, blocking: false }
  } catch {
    return { name: "Kord AIOS config valid", passed: false, message: `Invalid: ${p}`, blocking: false }
  }
}

function checkKordDirectory(cwd: string): PostInstallCheckResult {
  const kordDir = join(cwd, KORD_DIR)
  return existsSync(kordDir)
    ? { name: ".kord/ directory exists", passed: true, message: "Directory found", blocking: false }
    : { name: ".kord/ directory exists", passed: false, message: "Directory not found", blocking: false }
}

function checkTemplateBaseline(cwd: string): PostInstallCheckResult {
  const story = join(cwd, KORD_DIR, "templates", "story.md")
  return existsSync(story)
    ? { name: "Template baseline", passed: true, message: "story.md found", blocking: false }
    : { name: "Template baseline", passed: false, message: ".kord/templates/story.md missing", blocking: false }
}

function checkDocsKordDirectory(cwd: string): PostInstallCheckResult {
  const docsDir = join(cwd, KORD_DOCS_DIR)
  return existsSync(docsDir)
    ? { name: "docs/kord/ directory exists", passed: true, message: "Directory found", blocking: false }
    : { name: "docs/kord/ directory exists", passed: false, message: "Directory not found", blocking: false }
}

function checkPlansDir(cwd: string): PostInstallCheckResult {
  const plansDir = join(cwd, KORD_DOCS_DIR, "plans")
  return existsSync(plansDir)
    ? { name: "docs/kord/plans/ exists", passed: true, message: "Directory found", blocking: false }
    : { name: "docs/kord/plans/ exists", passed: false, message: "Directory not found", blocking: false }
}

function checkKordRules(cwd: string): PostInstallCheckResult {
  const rules = join(cwd, KORD_RULES_FILE)
  return existsSync(rules)
    ? { name: "kord-rules.md exists", passed: true, message: "File found", blocking: false }
    : { name: "kord-rules.md exists", passed: false, message: "File not found", blocking: false }
}

function checkOpenCodeBinary(): PostInstallCheckResult {
  const cmd = process.platform === "win32" ? "where" : "which"
  try {
    const result = Bun.spawnSync([cmd, "opencode"], { stdout: "pipe", stderr: "pipe", timeout: 3000 })
    if (result.exitCode === 0) {
      const path = result.stdout.toString().trim().split("\n")[0]
      return { name: "OpenCode binary", passed: true, message: `Found: ${path}`, blocking: false }
    }
    return { name: "OpenCode binary", passed: false, message: "Not found (non-blocking)", blocking: false }
  } catch {
    return { name: "OpenCode binary", passed: false, message: "Not found (non-blocking)", blocking: false }
  }
}

export interface PostInstallDoctorOptions {
  skipBinaryCheck?: boolean
}

export function runPostInstallDoctor(cwd: string, options?: PostInstallDoctorOptions): PostInstallDoctorResult {
  const checks: PostInstallCheckResult[] = [
    checkOpenCodeConfigValid(),
    checkPluginRegistered(),
    checkAuthPluginConfigured(),
    checkAntigravityProviderConfigured(),
    checkKordAiosConfig(),
    checkKordDirectory(cwd),
    checkTemplateBaseline(cwd),
    checkDocsKordDirectory(cwd),
    checkPlansDir(cwd),
    checkKordRules(cwd),
    ...(options?.skipBinaryCheck ? [] : [checkOpenCodeBinary()]),
  ]

  return {
    checks,
    passed: checks.filter(c => c.passed).length,
    total: checks.length,
  }
}
