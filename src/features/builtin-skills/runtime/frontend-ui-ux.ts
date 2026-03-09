import { join } from "node:path"
import { parseFrontmatter } from "../../../shared"
import { readBuiltinSkillContent } from "../skill-content"
import type { BuiltinSkill } from "../types"

const frontendUiUxTemplate = parseFrontmatter(
  readBuiltinSkillContent(join("design-system", "frontend-ui-ux", "SKILL.md"))
).body.trim()

export const frontendUiUxSkill: BuiltinSkill = {
  name: "frontend-ui-ux",
  description: "Designer-turned-developer who crafts stunning UI/UX even without design mockups",
  template: frontendUiUxTemplate,
}
