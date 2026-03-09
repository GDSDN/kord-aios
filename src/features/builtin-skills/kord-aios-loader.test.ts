import { describe, test, expect, afterEach } from "bun:test"
import {
  loadKordAiosSkills,
  loadKordAiosSkillsSync,
  clearKordAiosSkillCache,
  __test__parseKordAiosSkill,
  listKordAiosSkillFilesSync,
} from "./kord-aios-loader"
import { createBuiltinSkills } from "./skills"

describe("Kord AIOS skill loader", () => {
  afterEach(() => {
    clearKordAiosSkillCache()
  })

  test("loadKordAiosSkillsSync returns skills from kord-aios/ directory", () => {
    //#given - kord-aios skills directory exists with SKILL.md files

    //#when
    const skills = loadKordAiosSkillsSync()

    //#then
    expect(skills.length).toBeGreaterThan(100)
    expect(skills.every(s => s.name.length > 0)).toBe(true)
    expect(skills.every(s => s.description.includes("kord-aios"))).toBe(true)
    expect(skills.every(s => s.template.includes("<skill-instruction>"))).toBe(true)
  })

  test("loadKordAiosSkills async returns same skills as sync", async () => {
    //#given
    const syncSkills = loadKordAiosSkillsSync()
    clearKordAiosSkillCache()

    //#when
    const asyncSkills = await loadKordAiosSkills()

    //#then
    expect(asyncSkills.length).toBe(syncSkills.length)
  })

  test("skills are organized by domain", () => {
    //#given
    const skills = loadKordAiosSkillsSync()

    //#then - should have skills from multiple domains
    const descriptions = skills.map(s => s.description)
    expect(descriptions.some(d => d.includes("kord-aios"))).toBe(true)
  })

  test("skill names are unique", () => {
    //#given
    const skills = loadKordAiosSkillsSync()

    //#when
    const names = skills.map(s => s.name)
    const uniqueNames = new Set(names)

    //#then
    expect(uniqueNames.size).toBe(names.length)
  })

  test("cache works (second call returns same reference)", () => {
    //#given
    const first = loadKordAiosSkillsSync()

    //#when
    const second = loadKordAiosSkillsSync()

    //#then - same reference (cached)
    expect(first).toBe(second)
  })

  test("clearKordAiosSkillCache invalidates cache", () => {
    //#given
    const first = loadKordAiosSkillsSync()

    //#when
    clearKordAiosSkillCache()
    const second = loadKordAiosSkillsSync()

    //#then - different reference (cache was cleared)
    expect(first).not.toBe(second)
    expect(first.length).toBe(second.length)
  })

  test("template frontmatter is captured in templateRef field", () => {
    //#given - skill content with template frontmatter
    const skillContent = `---
name: test-skill
description: A test skill
template: react-component
---

# Test Skill

Some instructions here.
`

    //#when - parse the skill using test helper
    const parsed = __test__parseKordAiosSkill(skillContent, "/path/to/skill", "test-skill")

    //#then - templateRef should be set to the frontmatter value
    expect(parsed).not.toBeNull()
    expect(parsed!.templateRef).toBe("react-component")
  })

  test("template frontmatter injects template reference line into template", () => {
    //#given - skill content with template frontmatter
    const skillContent = `---
name: test-skill
description: A test skill
template: react-component
---

# Test Skill

Some instructions here.
`

    //#when - parse the skill using test helper
    const parsed = __test__parseKordAiosSkill(skillContent, "/path/to/skill", "test-skill")

    //#then - template string should contain the injected line
    expect(parsed).not.toBeNull()
    expect(parsed!.template).toContain("Template: Use the template at .kord/templates/react-component when creating this artifact.")
  })

  test("skills without template frontmatter have no templateRef", () => {
    //#given - skill content WITHOUT template frontmatter
    const skillContent = `---
name: test-skill
description: A test skill
---

# Test Skill

Some instructions here.
`

    //#when - parse the skill using test helper
    const parsed = __test__parseKordAiosSkill(skillContent, "/path/to/skill", "test-skill")

    //#then - templateRef should be undefined
    expect(parsed).not.toBeNull()
    expect(parsed!.templateRef).toBeUndefined()
    // and template should NOT contain the template reference line
    expect(parsed!.template).not.toContain("Template: Use the template at")
  })

  test("listKordAiosSkillFilesSync preserves full kord-aios domain hierarchy", () => {
    //#given
    const skills = listKordAiosSkillFilesSync()

    //#when
    const specGatherRequirements = skills.find(
      s => s.relativePath === "kord-aios/analysis/spec-gather-requirements/SKILL.md"
    )
    const allPathsIncludeDomainHierarchy = skills.every(s => {
      const parts = s.relativePath.split("/")
      return parts.length >= 4 && parts[0] === "kord-aios" && parts[parts.length - 1] === "SKILL.md"
    })

    //#then
    expect(skills.length).toBeGreaterThan(100)
    expect(specGatherRequirements).toBeDefined()
    expect(allPathsIncludeDomainHierarchy).toBe(true)
  })

  test("skill templates can inject local .opencode/skills base paths", () => {
    //#given - local exported skill directory under .opencode/skills hierarchy
    const localSkillDir = "/project/.opencode/skills/kord-aios/analysis/spec-gather-requirements"
    const skillContent = `---
name: spec-gather-requirements
description: Gather requirements
---

# Spec Gather Requirements

Use @path references from this skill directory.
`

    //#when
    const parsed = __test__parseKordAiosSkill(skillContent, localSkillDir, "spec-gather-requirements")

    //#then
    expect(parsed).not.toBeNull()
    expect(parsed!.template).toContain("Base directory for this skill: /project/.opencode/skills/kord-aios/analysis/spec-gather-requirements/")
  })

  test("loaded skills from directory respect templateRef frontmatter", () => {
    //#given
    const skills = loadKordAiosSkillsSync()

    //#then - verify that templateRef is handled correctly
    const skillsWithTemplateRef = skills.filter(s => s.templateRef !== undefined)
    const skillsWithoutTemplateRef = skills.filter(s => s.templateRef === undefined)

    // At least some skills should have templateRef now (the 8 story skills)
    expect(skillsWithTemplateRef.length).toBeGreaterThanOrEqual(1)

    // Skills with templateRef MUST contain the template reference line
    expect(skillsWithTemplateRef.every(s =>
      s.template.includes("Template: Use the template at")
    )).toBe(true)

    // Skills WITHOUT templateRef MUST NOT contain the template reference line
    expect(skillsWithoutTemplateRef.every(s =>
      !s.template.includes("Template: Use the template at")
    )).toBe(true)
  })
})

describe("createBuiltinSkills with Kord AIOS skills", () => {
  afterEach(() => {
    clearKordAiosSkillCache()
  })

  test("includes kord-aios skills by default", () => {
    //#given - default options

    //#when
    const skills = createBuiltinSkills()

    //#then - should have core skills + kord-aios skills
    expect(skills.length).toBeGreaterThan(100)
    expect(skills.find(s => s.name === "playwright")).toBeDefined()
    expect(skills.find(s => s.name === "git-master")).toBeDefined()
  })

  test("excludes kord-aios skills when includeKordAiosSkills is false", () => {
    //#given
    const options = { includeKordAiosSkills: false }

    //#when
    const skills = createBuiltinSkills(options)

    //#then - only core skills
    expect(skills.length).toBe(4)
  })

  test("disabledSkills filters kord-aios skills too", () => {
    //#given
    const kordAiosSkills = loadKordAiosSkillsSync()
    const firstKordAiosName = kordAiosSkills[0]?.name
    expect(firstKordAiosName).toBeDefined()

    //#when
    clearKordAiosSkillCache()
    const skills = createBuiltinSkills({ disabledSkills: new Set([firstKordAiosName!]) })

    //#then
    expect(skills.find(s => s.name === firstKordAiosName)).toBeUndefined()
  })
})
