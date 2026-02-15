import color from "picocolors"

const DRY_RUN_PREFIX = color.yellow("[DRY-RUN]")

export function dryRunLog(action: string, target: string): void {
  console.log(`${DRY_RUN_PREFIX} Would ${action}: ${color.cyan(target)}`)
}

export interface DryRunResult {
  success: true
  configPath: string
  dryRun: true
}

export function dryRunWriteResult(configPath: string): DryRunResult {
  return { success: true, configPath, dryRun: true }
}

export function printDryRunBanner(): void {
  console.log()
  console.log(color.bgYellow(color.black(" DRY-RUN MODE — no changes will be made ")))
  console.log()
}
