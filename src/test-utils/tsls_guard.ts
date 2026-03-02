import { test } from "bun:test"
import { execSync } from "node:child_process"

// Determine if TS Language Server is available
export const hasTsLS = (): boolean => {
  try {
    execSync("typescript-language-server --version", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

// Guarded test wrapper: run tests only when TSLS is available; otherwise skip
export const lspTest = (title: string, fn: any) => {
  return hasTsLS() ? test(title, fn) : test.skip(title, fn)
}
