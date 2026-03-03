import { readFile } from "node:fs/promises"
import { isAbsolute, relative, resolve } from "node:path"
import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import { CHECKLIST_RUNNER_DESCRIPTION } from "./constants"
import type {
  ChecklistRunnerArgs,
  ChecklistRunnerResult,
  ChecklistValidationItem,
} from "./types"
import { parseFrontmatter } from "../../shared"

type SectionMap = Map<string, string>

function buildResult(
  checklist: string,
  target: string,
  items: ChecklistValidationItem[],
): ChecklistRunnerResult {
  const passedCount = items.filter((item) => item.passed).length
  const failedCount = items.length - passedCount
  return {
    checklist,
    target,
    passed: failedCount === 0,
    total: items.length,
    passed_count: passedCount,
    failed_count: failedCount,
    items,
  }
}

function resolveProjectPath(rootDir: string, inputPath: string): string | null {
  if (isAbsolute(inputPath)) return null
  const resolvedPath = resolve(rootDir, inputPath)
  const relativePath = relative(rootDir, resolvedPath)
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    return null
  }
  return resolvedPath
}

export function parseChecklistItems(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.match(/^\s*-\s+\[( |x|X)\]\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => match[2].trim())
}

function splitSections(content: string): SectionMap {
  const sections: SectionMap = new Map()
  const lines = content.replace(/\r\n/g, "\n").split("\n")
  let currentSection: string | null = null
  let sectionLines: string[] = []

  const flush = () => {
    if (!currentSection) return
    sections.set(currentSection.toLowerCase(), sectionLines.join("\n").trim())
    sectionLines = []
  }

  for (const line of lines) {
    const headerMatch = line.match(/^\s*##\s+(.+)$/)
    if (headerMatch) {
      flush()
      currentSection = headerMatch[1].trim()
      continue
    }

    if (currentSection) {
      sectionLines.push(line)
    }
  }

  flush()
  return sections
}

function parseSectionName(description: string): string | null {
  const headingMatch = description.match(/##\s+(.+?)(?:\s+section\b.*)?$/i)
  if (headingMatch) return headingMatch[1].trim()

  const sectionMatch = description.match(
    /section\s+([a-zA-Z0-9 _-]+?)(?:\s+(?:must|is|should|exists?|be|has|have)\b.*)?$/i,
  )
  if (sectionMatch) return sectionMatch[1].trim()

  if (description.toLowerCase().includes("acceptance criteria")) {
    return "Acceptance Criteria"
  }

  return null
}

function requiresNonEmptySection(description: string): boolean {
  return /(non-empty|not empty|required content|must contain)/i.test(description)
}

function evaluateFrontmatterRule(
  description: string,
  targetContent: string,
): ChecklistValidationItem | null {
  if (!description.toLowerCase().includes("frontmatter")) {
    return null
  }

  const parsed = parseFrontmatter<Record<string, unknown>>(targetContent)
  if (!parsed.hadFrontmatter) {
    return {
      description,
      passed: false,
      reason: "Missing frontmatter block.",
    }
  }

  if (parsed.parseError) {
    return {
      description,
      passed: false,
      reason: "Frontmatter could not be parsed.",
    }
  }

  const requiredFields: string[] = []
  if (/\btitle\b/i.test(description)) requiredFields.push("title")
  if (/\btype\b/i.test(description)) requiredFields.push("type")
  if (/\bstatus\b/i.test(description)) requiredFields.push("status")

  const fieldsToCheck = requiredFields.length > 0
    ? requiredFields
    : ["title", "type", "status"]

  const missing = fieldsToCheck.filter((field) => {
    const value = parsed.data[field]
    return typeof value !== "string" || value.trim().length === 0
  })

  if (missing.length > 0) {
    return {
      description,
      passed: false,
      reason: `Missing required frontmatter fields: ${missing.join(", ")}`,
    }
  }

  return { description, passed: true }
}

function evaluateSectionRule(
  description: string,
  sections: SectionMap,
): ChecklistValidationItem | null {
  const sectionName = parseSectionName(description)
  if (!sectionName) return null

  const sectionContent = sections.get(sectionName.toLowerCase())
  if (sectionContent === undefined) {
    return {
      description,
      passed: false,
      reason: `Missing required section: ${sectionName}`,
    }
  }

  if (requiresNonEmptySection(description) && sectionContent.trim().length === 0) {
    return {
      description,
      passed: false,
      reason: `Section ${sectionName} is empty.`,
    }
  }

  return { description, passed: true }
}

function evaluateAcceptancePatternRule(
  description: string,
  targetContent: string,
): ChecklistValidationItem | null {
  const lower = description.toLowerCase()
  const isAcceptanceRule =
    lower.includes("acceptance") ||
    lower.includes("given/when/then") ||
    lower.includes("given when then")

  if (!isAcceptanceRule) return null

  const hasGivenWhenThen = /\bGiven\b[\s\S]*\bWhen\b[\s\S]*\bThen\b/i.test(targetContent)
  const hasChecklistItems = /^\s*-\s+\[( |x|X)\]\s+.+$/m.test(targetContent)

  if (!hasGivenWhenThen && !hasChecklistItems) {
    return {
      description,
      passed: false,
      reason: "Acceptance criteria must include Given/When/Then or checklist items (- [ ]).",
    }
  }

  return { description, passed: true }
}

export function evaluateChecklist(
  checklistContent: string,
  targetContent: string,
): ChecklistValidationItem[] {
  const items = parseChecklistItems(checklistContent)
  const sections = splitSections(targetContent)

  return items.map((description) => {
    const frontmatterResult = evaluateFrontmatterRule(description, targetContent)
    if (frontmatterResult) return frontmatterResult

    const sectionResult = evaluateSectionRule(description, sections)
    if (sectionResult) return sectionResult

    const acceptanceResult = evaluateAcceptancePatternRule(description, targetContent)
    if (acceptanceResult) return acceptanceResult

    return { description, passed: true }
  })
}

export function createChecklistRunnerTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: CHECKLIST_RUNNER_DESCRIPTION,
    args: {
      checklist_path: tool.schema.string().describe("Path to the checklist markdown file"),
      target_path: tool.schema.string().describe("Path to the target markdown artifact"),
    },
    execute: async (args: ChecklistRunnerArgs) => {
      const checklistResolved = resolveProjectPath(ctx.directory, args.checklist_path)
      const targetResolved = resolveProjectPath(ctx.directory, args.target_path)

      if (!checklistResolved || !targetResolved) {
        const result = buildResult(args.checklist_path, args.target_path, [
          {
            description: "Validate input paths",
            passed: false,
            reason: "Paths must be relative and stay within the project root.",
          },
        ])
        return JSON.stringify(result)
      }

      let checklistContent: string
      try {
        checklistContent = await readFile(checklistResolved, "utf-8")
      } catch {
        const result = buildResult(args.checklist_path, args.target_path, [
          {
            description: "Read checklist file",
            passed: false,
            reason: `Checklist file not found: ${args.checklist_path}`,
          },
        ])
        return JSON.stringify(result)
      }

      let targetContent: string
      try {
        targetContent = await readFile(targetResolved, "utf-8")
      } catch {
        const result = buildResult(args.checklist_path, args.target_path, [
          {
            description: "Read target file",
            passed: false,
            reason: `Target file not found: ${args.target_path}`,
          },
        ])
        return JSON.stringify(result)
      }

      const evaluatedItems = evaluateChecklist(checklistContent, targetContent)
      const result = buildResult(args.checklist_path, args.target_path, evaluatedItems)
      return JSON.stringify(result)
    },
  })
}
