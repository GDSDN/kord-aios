import { readFile } from "node:fs/promises"
import { isAbsolute, resolve } from "node:path"
import { tool, type ToolDefinition, type PluginInput } from "@opencode-ai/plugin"
import { STORY_READ_DESCRIPTION } from "./constants"
import type { StoryReadArgs } from "./types"
import { parseFrontmatter } from "../../shared"
import type { StoryFile, StorySections, StoryStatus, StoryTask } from "../../shared/types"

const STORY_STATUS_VALUES = new Set<StoryStatus>([
  "DRAFT",
  "READY",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
])

type SectionMap = Map<string, string>

function normalizeStatus(value?: string | null): StoryStatus {
  if (!value) return "DRAFT"
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_")
  if (STORY_STATUS_VALUES.has(normalized as StoryStatus)) {
    return normalized as StoryStatus
  }
  return "DRAFT"
}

function extractHeading(body: string): string | null {
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function splitSections(body: string): SectionMap {
  const sections: SectionMap = new Map()
  const lines = body.split("\n")
  let currentTitle: string | null = null
  let buffer: string[] = []

  const flush = () => {
    if (currentTitle) {
      sections.set(currentTitle.toLowerCase(), buffer.join("\n").trim())
    }
    buffer = []
  }

  for (const line of lines) {
    const headerMatch = line.match(/^\s*##\s+(.+)$/)
    if (headerMatch) {
      flush()
      currentTitle = headerMatch[1].trim()
      continue
    }

    if (currentTitle) {
      buffer.push(line)
    }
  }

  flush()
  return sections
}

function parseChecklist(sectionBody: string | undefined): StoryTask[] {
  if (!sectionBody) return []
  return sectionBody
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.match(/^\s*-\s+\[( |x|X)\]\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      title: match[2].trim(),
      checked: match[1].toLowerCase() === "x",
    }))
}

function parseBulletList(sectionBody: string | undefined): string[] {
  if (!sectionBody) return []
  return sectionBody
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.match(/^\s*-\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => match[1].trim())
}

function resolveStatus(frontmatterStatus: string | undefined, statusSection: string | undefined): StoryStatus {
  if (frontmatterStatus) return normalizeStatus(frontmatterStatus)
  if (statusSection) {
    const firstLine = statusSection.split("\n").map((line) => line.trim()).find(Boolean)
    if (firstLine) return normalizeStatus(firstLine)
  }
  return "DRAFT"
}

function buildSections(sectionMap: SectionMap): StorySections | undefined {
  const acceptanceCriteria = parseBulletList(sectionMap.get("acceptance criteria"))
  const files = parseBulletList(sectionMap.get("file list"))
  const devNotes = sectionMap.get("dev notes")?.trim()

  const additionalEntries = Array.from(sectionMap.entries()).filter(([key]) => {
    return !["acceptance criteria", "file list", "dev notes", "status", "tasks"].includes(key)
  })

  const additional = additionalEntries.length > 0
    ? Object.fromEntries(additionalEntries)
    : undefined

  const hasContent = acceptanceCriteria.length > 0 || files.length > 0 || Boolean(devNotes) || Boolean(additional)
  if (!hasContent) return undefined

  return {
    acceptanceCriteria: acceptanceCriteria.length > 0 ? acceptanceCriteria : undefined,
    files: files.length > 0 ? files : undefined,
    devNotes: devNotes || undefined,
    additional,
  }
}

export function parseStoryMarkdown(content: string): StoryFile {
  const normalized = content.replace(/\r\n/g, "\n")
  const { data, body } = parseFrontmatter<Record<string, unknown>>(normalized)
  const titleFromFrontmatter = typeof data.title === "string" ? data.title : null
  const title = titleFromFrontmatter ?? extractHeading(body) ?? "Untitled Story"

  const sectionMap = splitSections(body)
  const tasks = parseChecklist(sectionMap.get("tasks"))
  const status = resolveStatus(
    typeof data.status === "string" ? data.status : undefined,
    sectionMap.get("status")
  )

  const sections = buildSections(sectionMap)

  return {
    title,
    status,
    tasks,
    sections,
  }
}

export function createStoryReadTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: STORY_READ_DESCRIPTION,
    args: {
      story_path: tool.schema.string().describe("Path to the story markdown file"),
    },
    execute: async (args: StoryReadArgs) => {
      const resolvedPath = isAbsolute(args.story_path)
        ? args.story_path
        : resolve(ctx.directory, args.story_path)

      try {
        const content = await readFile(resolvedPath, "utf-8")
        const story = parseStoryMarkdown(content)
        return JSON.stringify({ story })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `Error: Failed to read story file at ${resolvedPath}. ${message}`
      }
    },
  })
}
