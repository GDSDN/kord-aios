import { describe, test, expect } from "bun:test"
import { CHIEF_COORDINATION_TEMPLATE } from "./chief-template"

describe("CHIEF_COORDINATION_TEMPLATE", () => {
  //#given
  //#when
  //#then

  test("should export a non-empty string constant", () => {
    //#given
    //#when
    //#then
    expect(typeof CHIEF_COORDINATION_TEMPLATE).toBe("string")
    expect(CHIEF_COORDINATION_TEMPLATE.length).toBeGreaterThan(0)
  })

  test("should contain Coordination Protocol section", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("## Coordination Protocol")
  })

  test("should contain Self-Optimization section", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("## Self-Optimization")
  })

  test("should contain Quality Gates section", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("## Quality Gates")
  })

  test("should mention delegation syntax with placeholder example", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain('task(subagent_type="squad-{squad}-{agent}", load_skills=[], prompt="...")')
  })

  test("should include on-demand skill loading guidance", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("### Skill Loading Policy")
    expect(CHIEF_COORDINATION_TEMPLATE).toContain('workers must call `skill("skill-name")`')
  })

  test("should contain Delegation Guidelines subsection", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("### Delegation Guidelines")
  })

  test("should contain Coordination Workflow section", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("### Coordination Workflow")
  })

  test("should contain Performance Metrics subsection", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("### Performance Metrics")
  })

  test("should contain Pre-Delegation Gate checklist", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("### Pre-Delegation Gate")
  })

  test("should contain Post-Delegation Gate checklist", () => {
    //#given
    //#when
    //#then
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("### Post-Delegation Gate")
  })

  test("should be domain-agnostic (no specific domain references)", () => {
    //#given
    //#when
    //#then
    // Template should use placeholders like {squad}, {agent} and not hardcode specific domains
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("{squad}")
    expect(CHIEF_COORDINATION_TEMPLATE).toContain("{agent}")
  })
})
