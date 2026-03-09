import pc from "picocolors"
import packageJson from "../../package.json" with { type: "json" }

const VERSION = packageJson.version

/**
 * Prints a minimal Kord AIOS banner with version and optional context.
 * Uses magenta/cyan color scheme as specified.
 *
 * @param options.mode Optional project mode (e.g., "new", "existing")
 * @param options.stage Optional project stage (e.g., "planning", "development")
 */
export function printBanner(options: { mode?: string; stage?: string } = {}): void {
  const { mode, stage } = options

  // Top border
  console.log(pc.magenta("═".repeat(50)))

  // Main banner line
  const bannerText = `⚡ Kord AIOS v${VERSION}`
  const padding = Math.floor((50 - bannerText.length) / 2)
  console.log(pc.magenta("═".repeat(padding)) + pc.cyan(bannerText) + pc.magenta("═".repeat(50 - padding - bannerText.length)))

  // Context line (mode + stage)
  if (mode || stage) {
    const contextParts: string[] = []
    if (mode) contextParts.push(pc.white(`mode: ${mode}`))
    if (stage) contextParts.push(pc.white(`stage: ${stage}`))
    const contextText = contextParts.join(pc.dim(" | "))
    const contextPadding = Math.floor((50 - stripAnsi(contextText).length) / 2)
    console.log(pc.magenta("═".repeat(contextPadding)) + contextText + pc.magenta("═".repeat(50 - contextPadding - stripAnsi(contextText).length)))
  }

  // Bottom border
  console.log(pc.magenta("═".repeat(50)))
  console.log()
}

/**
 * Simple ANSI strip function for padding calculations
 */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}
