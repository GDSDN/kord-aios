import { join } from "node:path"
import { parseFrontmatter } from "../../../shared"
import { readBuiltinSkillContent } from "../skill-content"
import type { BuiltinSkill } from "../types"

const devBrowserTemplate = parseFrontmatter(
  readBuiltinSkillContent(join("utilities", "dev-browser", "SKILL.md"))
).body.trim()

export const devBrowserSkill: BuiltinSkill = {
  name: "dev-browser",
  description:
    "Browser automation with persistent page state. Use when users ask to navigate websites, fill forms, take screenshots, extract web data, test web apps, or automate browser workflows. Trigger phrases include 'go to [url]', 'click on', 'fill out the form', 'take a screenshot', 'scrape', 'automate', 'test the website', 'log into', or any browser interaction request.",
  template: devBrowserTemplate,
}
