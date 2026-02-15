import type { BuiltinSkill } from "./types"
import type { BrowserAutomationProvider } from "../../config/schema"

import {
  playwrightSkill,
  agentBrowserSkill,
  frontendUiUxSkill,
  gitMasterSkill,
  devBrowserSkill,
} from "./skills/index"
import { loadKordAiosSkillsSync } from "./kord-aios-loader"

export interface CreateBuiltinSkillsOptions {
  browserProvider?: BrowserAutomationProvider
  disabledSkills?: Set<string>
  includeKordAiosSkills?: boolean
}

export function createBuiltinSkills(options: CreateBuiltinSkillsOptions = {}): BuiltinSkill[] {
  const { browserProvider = "playwright", disabledSkills, includeKordAiosSkills = true } = options

  const browserSkill = browserProvider === "agent-browser" ? agentBrowserSkill : playwrightSkill

  const skills = [browserSkill, frontendUiUxSkill, gitMasterSkill, devBrowserSkill]
  const kordAiosSkills = includeKordAiosSkills ? loadKordAiosSkillsSync() : []
  const allSkills = [...skills, ...kordAiosSkills]

  if (!disabledSkills) {
    return allSkills
  }

  return allSkills.filter((skill) => !disabledSkills.has(skill.name))
}
