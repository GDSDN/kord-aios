import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export function readBuiltinSkillContent(skillRelativePath: string): string {
  const candidates = [
    join(import.meta.dir, "kord-aios", skillRelativePath),
    join(import.meta.dir, "..", "kord-aios", skillRelativePath),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf-8")
    }
  }

  throw new Error(`Builtin skill asset not found: ${skillRelativePath}`)
}
