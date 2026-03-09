import { promises as fs, readFileSync, readdirSync } from "node:fs"
import { join, dirname, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { parseFrontmatter } from "../../shared/frontmatter"
import type { BuiltinSkill } from "./types"

/**
 * Discovers and loads Kord AIOS methodology skills from the kord-aios/ directory.
 * Skills are organized as: kord-aios/{domain}/{skill-name}/SKILL.md
 * Each SKILL.md has YAML frontmatter (name, description, agent) + markdown body.
 */

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const BUILTIN_SKILLS_DIR = MODULE_DIR
const KORD_AIOS_SKILLS_DIR = join(MODULE_DIR, "kord-aios")

let cachedSkills: BuiltinSkill[] | null = null

export interface KordAiosSkillFile {
  sourcePath: string
  relativePath: string
}

function listKordAiosSkillFilesInDirSync(directory: string): KordAiosSkillFile[] {
  const files: KordAiosSkillFile[] = []

  const entries = readdirSync(directory, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue

    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...listKordAiosSkillFilesInDirSync(entryPath))
      continue
    }

    if (entry.isFile() && entry.name === "SKILL.md") {
      files.push({
        sourcePath: entryPath,
        relativePath: relative(BUILTIN_SKILLS_DIR, entryPath).replace(/\\/g, "/"),
      })
    }
  }

  return files
}

async function listKordAiosSkillFilesInDir(directory: string): Promise<KordAiosSkillFile[]> {
  const files: KordAiosSkillFile[] = []

  const entries = await fs.readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue

    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listKordAiosSkillFilesInDir(entryPath))
      continue
    }

    if (entry.isFile() && entry.name === "SKILL.md") {
      files.push({
        sourcePath: entryPath,
        relativePath: relative(BUILTIN_SKILLS_DIR, entryPath).replace(/\\/g, "/"),
      })
    }
  }

  return files
}

export function listKordAiosSkillFilesSync(): KordAiosSkillFile[] {
  try {
    return listKordAiosSkillFilesInDirSync(KORD_AIOS_SKILLS_DIR)
  } catch {
    return []
  }
}

async function listKordAiosSkillFiles(): Promise<KordAiosSkillFile[]> {
  try {
    return await listKordAiosSkillFilesInDir(KORD_AIOS_SKILLS_DIR)
  } catch {
    return []
  }
}

function parseKordAiosSkill(content: string, skillBaseDir: string, skillNameFallback: string): BuiltinSkill | null {
  const { data, body } = parseFrontmatter<{
    name?: string
    description?: string
    agent?: string
    model?: string
    subtask?: boolean
    "argument-hint"?: string
    "allowed-tools"?: string | string[]
    template?: string
  }>(content)

  const name = data.name || skillNameFallback
  const description = data.description || ""

  let allowedTools: string[] | undefined
  if (data["allowed-tools"]) {
    allowedTools = Array.isArray(data["allowed-tools"])
      ? data["allowed-tools"]
      : data["allowed-tools"].split(/\s+/).filter(Boolean)
  }

  // Build template reference line if template frontmatter is present
  const templateRefLine = data.template
    ? `Template: Use the template at .kord/templates/${data.template} when creating this artifact.\n`
    : ""

  const template = `<skill-instruction>
Base directory for this skill: ${skillBaseDir}/
File references (@path) in this skill are relative to this directory.
${templateRefLine}${body.trim()}
</skill-instruction>

<user-request>
$ARGUMENTS
</user-request>`

  return {
    name,
    description: `(kord-aios - Skill) ${description}`,
    template,
    templateRef: data.template,
    agent: data.agent,
    model: data.model,
    subtask: data.subtask ?? false,
    argumentHint: data["argument-hint"],
    allowedTools,
  }
}

/**
 * Test-only helper to parse a skill from content.
 * Exported for testing purposes only.
 */
export function __test__parseKordAiosSkill(
  content: string,
  skillBaseDir: string,
  skillNameFallback: string
): BuiltinSkill | null {
  return parseKordAiosSkill(content, skillBaseDir, skillNameFallback)
}

export async function loadKordAiosSkills(): Promise<BuiltinSkill[]> {
  if (cachedSkills) return cachedSkills

  const skills: BuiltinSkill[] = []

  const skillFiles = await listKordAiosSkillFiles()
  for (const skillFile of skillFiles) {
    try {
      const content = await fs.readFile(skillFile.sourcePath, "utf-8")
      const parsed = parseKordAiosSkill(
        content,
        dirname(skillFile.sourcePath),
        dirname(skillFile.relativePath).split("/").pop() ?? "skill"
      )
      if (parsed) {
        skills.push(parsed)
      }
    } catch {
      // Skip unreadable skill files
    }
  }

  cachedSkills = skills
  return skills
}

export function loadKordAiosSkillsSync(): BuiltinSkill[] {
  if (cachedSkills) return cachedSkills

  const skills: BuiltinSkill[] = []

  const skillFiles = listKordAiosSkillFilesSync()
  for (const skillFile of skillFiles) {
    try {
      const content = readFileSync(skillFile.sourcePath, "utf-8")
      const parsed = parseKordAiosSkill(
        content,
        dirname(skillFile.sourcePath),
        dirname(skillFile.relativePath).split("/").pop() ?? "skill"
      )
      if (parsed) {
        skills.push(parsed)
      }
    } catch {
      // Skip unreadable skill files
    }
  }

  cachedSkills = skills
  return skills
}

export function clearKordAiosSkillCache(): void {
  cachedSkills = null
}
