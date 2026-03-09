import { join } from "node:path"
import { parseFrontmatter } from "../../../shared"
import { readBuiltinSkillContent } from "../skill-content"
import type { BuiltinSkill } from "../types"

const gitMasterTemplate = parseFrontmatter(
  readBuiltinSkillContent(join("utilities", "git-master", "SKILL.md"))
).body.trim()

export const gitMasterSkill: BuiltinSkill = {
  name: "git-master",
  description:
    "MUST USE for ANY git operations. Atomic commits, rebase/squash, history search (blame, bisect, log -S). STRONGLY RECOMMENDED: Use with task(category='quick', load_skills=['git-master'], ...) to save context. Triggers: 'commit', 'rebase', 'squash', 'who wrote', 'when was X added', 'find the commit that'.",
  template: gitMasterTemplate,
}
