import { promises as fs, readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { parseFrontmatter } from "../../shared/frontmatter"
import type { BuiltinSkill } from "./types"

/**
 * Discovers and loads Kord AIOS methodology skills from the kord-aios/ directory.
 * Skills are organized as: kord-aios/{domain}/{skill-name}/SKILL.md
 * Each SKILL.md has YAML frontmatter (name, description, agent) + markdown body.
 */

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const KORD_AIOS_SKILLS_DIR = join(MODULE_DIR, "skills", "kord-aios")

let cachedSkills: BuiltinSkill[] | null = null

function parseKordAiosSkill(content: string, skillBaseDir: string, skillNameFallback: string): BuiltinSkill | null {
  const { data, body } = parseFrontmatter<{
    name?: string
    description?: string
    agent?: string
    model?: string
    subtask?: boolean
    "argument-hint"?: string
    "allowed-tools"?: string | string[]
  }>(content)

  const name = data.name || skillNameFallback
  const description = data.description || ""

  let allowedTools: string[] | undefined
  if (data["allowed-tools"]) {
    allowedTools = Array.isArray(data["allowed-tools"])
      ? data["allowed-tools"]
      : data["allowed-tools"].split(/\s+/).filter(Boolean)
  }

  const template = `<skill-instruction>\nBase directory for this skill: ${skillBaseDir}/\nFile references (@path) in this skill are relative to this directory.\n\n${body.trim()}\n</skill-instruction>\n\n<user-request>\n$ARGUMENTS\n</user-request>`

  return {
    name,
    description: `(kord-aios - Skill) ${description}`,
    template,
    agent: data.agent,
    model: data.model,
    subtask: data.subtask ?? false,
    argumentHint: data["argument-hint"],
    allowedTools,
  }
}

export async function loadKordAiosSkills(): Promise<BuiltinSkill[]> {
  if (cachedSkills) return cachedSkills

  const skills: BuiltinSkill[] = []

  try {
    const domains = await fs.readdir(KORD_AIOS_SKILLS_DIR, { withFileTypes: true })

    for (const domain of domains) {
      if (!domain.isDirectory() || domain.name.startsWith(".")) continue

      const domainPath = join(KORD_AIOS_SKILLS_DIR, domain.name)
      const skillDirs = await fs.readdir(domainPath, { withFileTypes: true }).catch(() => [])

      for (const skillDir of skillDirs) {
        if (!skillDir.isDirectory() || skillDir.name.startsWith(".")) continue

        const skillMdPath = join(domainPath, skillDir.name, "SKILL.md")
        try {
          const content = await fs.readFile(skillMdPath, "utf-8")
          const parsed = parseKordAiosSkill(content, join(domainPath, skillDir.name), skillDir.name)
          if (parsed) {
            skills.push(parsed)
          }
        } catch {
          // Skip unreadable skill files
        }
      }
    }
  } catch {
    // kord-aios/ directory doesn't exist or is unreadable
  }

  cachedSkills = skills
  return skills
}

export function loadKordAiosSkillsSync(): BuiltinSkill[] {
  if (cachedSkills) return cachedSkills

  const skills: BuiltinSkill[] = []

  try {
    const domains = readdirSync(KORD_AIOS_SKILLS_DIR, { withFileTypes: true })

    for (const domain of domains) {
      if (!domain.isDirectory() || domain.name.startsWith(".")) continue

      const domainPath = join(KORD_AIOS_SKILLS_DIR, domain.name)
      const skillDirs = readdirSync(domainPath, { withFileTypes: true })

      for (const skillDir of skillDirs) {
        if (!skillDir.isDirectory() || skillDir.name.startsWith(".")) continue

        const skillMdPath = join(domainPath, skillDir.name, "SKILL.md")
        try {
          const content = readFileSync(skillMdPath, "utf-8")
          const parsed = parseKordAiosSkill(content, join(domainPath, skillDir.name), skillDir.name)
          if (parsed) {
            skills.push(parsed)
          }
        } catch {
          // Skip unreadable skill files
        }
      }
    }
  } catch {
    // kord-aios/ directory doesn't exist or is unreadable
  }

  cachedSkills = skills
  return skills
}

export function clearKordAiosSkillCache(): void {
  cachedSkills = null
}
