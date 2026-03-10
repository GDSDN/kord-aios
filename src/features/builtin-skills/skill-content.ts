import { readBuiltinAsset } from "../builtin-assets"

export function readBuiltinSkillContent(skillRelativePath: string): string {
  return readBuiltinAsset("builtin-skills/kord-aios", skillRelativePath)
}
