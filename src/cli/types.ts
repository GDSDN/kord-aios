export type ClaudeSubscription = "no" | "yes" | "max20"
export type BooleanArg = "no" | "yes"

export type ProjectMaturityStatus = "fresh" | "partial" | "existing"

export interface InstallArgs {
  tui: boolean
  claude?: ClaudeSubscription
  openai?: BooleanArg
  gemini?: BooleanArg
  copilot?: BooleanArg
  opencodeZen?: BooleanArg
  zaiCodingPlan?: BooleanArg
  kimiForCoding?: BooleanArg
  skipAuth?: boolean
  /** Force fresh install regardless of project maturity */
  force?: boolean
  /** Auto-install OpenCode if not found (non-TUI mode) */
  installOpencode?: boolean
  /** Skip post-install doctor verification */
  skipDoctor?: boolean
  /** Dry-run mode — preview changes without writing */
  dryRun?: boolean
}

export interface InstallConfig {
  hasClaude: boolean
  isMax20: boolean
  hasOpenAI: boolean
  hasGemini: boolean
  hasCopilot: boolean
  hasOpencodeZen: boolean
  hasZaiCodingPlan: boolean
  hasKimiForCoding: boolean
}

export interface ConfigMergeResult {
  success: boolean
  configPath: string
  error?: string
}

export interface DetectedConfig {
  isInstalled: boolean
  hasClaude: boolean
  isMax20: boolean
  hasOpenAI: boolean
  hasGemini: boolean
  hasCopilot: boolean
  hasOpencodeZen: boolean
  hasZaiCodingPlan: boolean
  hasKimiForCoding: boolean
}
