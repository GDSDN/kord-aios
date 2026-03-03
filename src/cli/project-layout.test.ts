import { describe, expect, test } from "bun:test"
import yaml from "js-yaml"
import {
  STORY_TEMPLATE_CONTENT,
  ADR_TEMPLATE_CONTENT,
  PRD_TEMPLATE_CONTENT,
  EPIC_TEMPLATE_CONTENT,
  TASK_TEMPLATE_CONTENT,
  QA_GATE_TEMPLATE_CONTENT,
  QA_REPORT_TEMPLATE_CONTENT,
  CHECKLIST_STORY_DRAFT_CONTENT,
  CHECKLIST_STORY_DOD_CONTENT,
  CHECKLIST_PR_REVIEW_CONTENT,
  CHECKLIST_ARCHITECT_CONTENT,
  CHECKLIST_PRE_PUSH_CONTENT,
  CHECKLIST_SELF_CRITIQUE_CONTENT,
} from "./project-layout"

interface TemplateFrontmatter {
  title: string
  type: string
  status: string
  created?: string
  priority?: string
  wave?: string | number
  assignee?: string
  story?: string
}

function parseFrontmatter<T = Record<string, unknown>>(content: string): {
  data: T
  body: string
  hadFrontmatter: boolean
  parseError: boolean
} {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n?---\r?\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { data: {} as T, body: content, hadFrontmatter: false, parseError: false }
  }

  const yamlContent = match[1]
  const body = match[2]

  try {
    const parsed = yaml.load(yamlContent, { schema: yaml.JSON_SCHEMA })
    const data = (parsed ?? {}) as T
    return { data, body, hadFrontmatter: true, parseError: false }
  } catch {
    return { data: {} as T, body, hadFrontmatter: true, parseError: true }
  }
}

const TEMPLATE_TESTS = [
  { name: "STORY_TEMPLATE_CONTENT", content: STORY_TEMPLATE_CONTENT },
  { name: "ADR_TEMPLATE_CONTENT", content: ADR_TEMPLATE_CONTENT },
  { name: "PRD_TEMPLATE_CONTENT", content: PRD_TEMPLATE_CONTENT },
  { name: "EPIC_TEMPLATE_CONTENT", content: EPIC_TEMPLATE_CONTENT },
  { name: "TASK_TEMPLATE_CONTENT", content: TASK_TEMPLATE_CONTENT },
  { name: "QA_GATE_TEMPLATE_CONTENT", content: QA_GATE_TEMPLATE_CONTENT },
  { name: "QA_REPORT_TEMPLATE_CONTENT", content: QA_REPORT_TEMPLATE_CONTENT },
  { name: "CHECKLIST_STORY_DRAFT_CONTENT", content: CHECKLIST_STORY_DRAFT_CONTENT },
  { name: "CHECKLIST_STORY_DOD_CONTENT", content: CHECKLIST_STORY_DOD_CONTENT },
  { name: "CHECKLIST_PR_REVIEW_CONTENT", content: CHECKLIST_PR_REVIEW_CONTENT },
  { name: "CHECKLIST_ARCHITECT_CONTENT", content: CHECKLIST_ARCHITECT_CONTENT },
  { name: "CHECKLIST_PRE_PUSH_CONTENT", content: CHECKLIST_PRE_PUSH_CONTENT },
  { name: "CHECKLIST_SELF_CRITIQUE_CONTENT", content: CHECKLIST_SELF_CRITIQUE_CONTENT },
] as const

describe("project-layout templates", () => {
  describe.each(TEMPLATE_TESTS)("$name", ({ name, content }) => {
    test("should be non-empty", () => {
      expect(content.length).toBeGreaterThan(0)
    })

    test("should have valid YAML frontmatter", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(content)
      expect(result.hadFrontmatter).toBe(true)
      expect(result.parseError).toBe(false)
    })

    test("should have required frontmatter fields: title, type, status", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(content)
      expect(result.data.title).toBeDefined()
      expect(result.data.title).toBeTruthy()
      expect(result.data.type).toBeDefined()
      expect(result.data.type).toBeTruthy()
      expect(result.data.status).toBeDefined()
      expect(result.data.status).toBeTruthy()
    })

    test("should have body content", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(content)
      expect(result.body.length).toBeGreaterThan(0)
    })

    test("should have title with placeholder or fixed name", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(content)
      // Story, ADR, PRD, Epic, Task, QA templates use placeholders; checklists have fixed names
      const isChecklist = result.data.type === "checklist"
      if (isChecklist) {
        expect(typeof result.data.title).toBe("string")
      } else {
        expect(result.data.title).toContain("{")
      }
    })
  })

  describe("STORY_TEMPLATE_CONTENT", () => {
    test("should have wave field", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(STORY_TEMPLATE_CONTENT)
      expect(result.data.wave).toBeDefined()
    })

    test("should have placeholder in title", () => {
      expect(STORY_TEMPLATE_CONTENT).toContain("{TITLE}")
    })

    test("should contain Definition of Done section", () => {
      expect(STORY_TEMPLATE_CONTENT).toContain("## Definition of Done")
    })
  })

  describe("ADR_TEMPLATE_CONTENT", () => {
    test("should have ADR number placeholder", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(ADR_TEMPLATE_CONTENT)
      expect(result.data.title).toContain("ADR-{NUMBER}")
    })

    test("should contain Context section", () => {
      expect(ADR_TEMPLATE_CONTENT).toContain("## Context")
    })

    test("should contain Decision section", () => {
      expect(ADR_TEMPLATE_CONTENT).toContain("## Decision")
    })
  })

  describe("PRD_TEMPLATE_CONTENT", () => {
    test("should have type prd", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(PRD_TEMPLATE_CONTENT)
      expect(result.data.type).toBe("prd")
    })

    test("should contain Goals & Non-Goals section", () => {
      expect(PRD_TEMPLATE_CONTENT).toContain("## Goals & Non-Goals")
    })
  })

  describe("EPIC_TEMPLATE_CONTENT", () => {
    test("should have type epic", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(EPIC_TEMPLATE_CONTENT)
      expect(result.data.type).toBe("epic")
    })

    test("should have wave field", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(EPIC_TEMPLATE_CONTENT)
      expect(result.data.wave).toBeDefined()
    })
  })

  describe("TASK_TEMPLATE_CONTENT", () => {
    test("should have type task", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(TASK_TEMPLATE_CONTENT)
      expect(result.data.type).toBe("task")
    })

    test("should have story reference field", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(TASK_TEMPLATE_CONTENT)
      expect(result.data.story).toBeDefined()
    })
  })

  describe("QA_GATE_TEMPLATE_CONTENT", () => {
    test("should have type qa-gate", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(QA_GATE_TEMPLATE_CONTENT)
      expect(result.data.type).toBe("qa-gate")
    })

    test("should have story reference field", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(QA_GATE_TEMPLATE_CONTENT)
      expect(result.data.story).toBeDefined()
    })
  })

  describe("QA_REPORT_TEMPLATE_CONTENT", () => {
    test("should have type qa-report", () => {
      const result = parseFrontmatter<TemplateFrontmatter>(QA_REPORT_TEMPLATE_CONTENT)
      expect(result.data.type).toBe("qa-report")
    })
  })

  describe("checklist templates", () => {
    const checklists = [
      { name: "CHECKLIST_STORY_DRAFT_CONTENT", content: CHECKLIST_STORY_DRAFT_CONTENT },
      { name: "CHECKLIST_STORY_DOD_CONTENT", content: CHECKLIST_STORY_DOD_CONTENT },
      { name: "CHECKLIST_PR_REVIEW_CONTENT", content: CHECKLIST_PR_REVIEW_CONTENT },
      { name: "CHECKLIST_ARCHITECT_CONTENT", content: CHECKLIST_ARCHITECT_CONTENT },
      { name: "CHECKLIST_PRE_PUSH_CONTENT", content: CHECKLIST_PRE_PUSH_CONTENT },
      { name: "CHECKLIST_SELF_CRITIQUE_CONTENT", content: CHECKLIST_SELF_CRITIQUE_CONTENT },
    ]

    test.each(checklists)("$name should have type checklist", ({ name, content }) => {
      const result = parseFrontmatter<TemplateFrontmatter>(content)
      expect(result.data.type).toBe("checklist")
    })

    test.each(checklists)("$name should contain checkboxes", ({ name, content }) => {
      expect(content).toContain("- [ ]")
    })
  })
})
