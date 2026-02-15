import { platform } from "node:os"

/**
 * S01: OpenCode Auto-Install Detection & Installation
 *
 * Detects the OS, provides appropriate install commands,
 * and can trigger installation with user consent.
 */

export type SupportedOS = "macos" | "linux" | "windows"

export interface InstallCommandInfo {
  primary: string
  fallback: string | null
  description: string
}

/**
 * Detects the current operating system.
 */
export function detectOS(): SupportedOS {
  const os = platform()
  switch (os) {
    case "darwin":
      return "macos"
    case "win32":
      return "windows"
    default:
      return "linux"
  }
}

/**
 * Returns the appropriate install command for the given OS.
 * Commands should be verified against https://opencode.ai/docs before shipping.
 */
export function getInstallCommand(os: SupportedOS): InstallCommandInfo {
  switch (os) {
    case "macos":
      return {
        primary: "brew install sst/tap/opencode",
        fallback: "curl -fsSL https://opencode.ai/install.sh | sh",
        description: "Install OpenCode via Homebrew (or curl fallback)",
      }
    case "linux":
      return {
        primary: "curl -fsSL https://opencode.ai/install.sh | sh",
        fallback: null,
        description: "Install OpenCode via curl",
      }
    case "windows":
      return {
        primary: "winget install sst.opencode",
        fallback: null,
        description: "Install OpenCode via winget",
      }
  }
}

/**
 * Returns a user-friendly manual install message for the given OS.
 */
export function getManualInstallInstructions(os: SupportedOS): string {
  const cmd = getInstallCommand(os)
  const lines = [
    "To install OpenCode manually, run:",
    "",
    `  ${cmd.primary}`,
  ]

  if (cmd.fallback) {
    lines.push("")
    lines.push("Or alternatively:")
    lines.push("")
    lines.push(`  ${cmd.fallback}`)
  }

  lines.push("")
  lines.push("For more details: https://opencode.ai/docs")

  return lines.join("\n")
}
