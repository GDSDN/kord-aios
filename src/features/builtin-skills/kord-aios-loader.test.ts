import { describe, test, expect, afterEach } from "bun:test"
import { loadKordAiosSkills, loadKordAiosSkillsSync, clearKordAiosSkillCache } from "./kord-aios-loader"
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
