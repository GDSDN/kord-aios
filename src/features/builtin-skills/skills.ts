import type { BuiltinSkill } from "./types"
import type { BrowserAutomationProvider } from "../../config/schema"

import {
  playwrightSkill,
  agentBrowserSkill,
  frontendUiUxSkill,
  gitMasterSkill,
  devBrowserSkill,
} from "./runtime/index"
import { loadKordAiosSkillsSync } from "./kord-aios-loader"

export interface CreateBuiltinSkillsOptions {
  browserProvider?: BrowserAutomationProvider
  disabledSkills?: Set<string>
  includeKordAiosSkills?: boolean
}

export function createBuiltinSkills(options: CreateBuiltinSkillsOptions = {}): BuiltinSkill[] {
  const { browserProvider = "playwright", disabledSkills, includeKordAiosSkills = true } = options

  // `playwright` and `agent-browser` are the only remaining TS-only runtime skills with no
  // counterpart under the kord-aios SKILL.md discovery tree; browser provider selection
  // (Playwright MCP vs agent-browser CLI) is configuration-bound at startup.
  const browserSkill = browserProvider === "agent-browser" ? agentBrowserSkill : playwrightSkill

  const hardcodedSkills = [browserSkill, frontendUiUxSkill, gitMasterSkill, devBrowserSkill]
  const kordAiosSkills = includeKordAiosSkills ? loadKordAiosSkillsSync() : []
  // Hardcoded skills take precedence over kord-aios SKILL.md discoveries with the same name.
  // This prevents double registration now that some hardcoded skills (git-master,
  // frontend-ui-ux, dev-browser) have corresponding SKILL.md files in the kord-aios tree
  // for export purposes.
  const hardcodedNames = new Set(hardcodedSkills.map((skill) => skill.name))
  const filteredKordAiosSkills = kordAiosSkills.filter((skill) => !hardcodedNames.has(skill.name))
  const allSkills = [...hardcodedSkills, ...filteredKordAiosSkills]

  if (!disabledSkills) {
    return allSkills
  }

  return allSkills.filter((skill) => !disabledSkills.has(skill.name))
}
