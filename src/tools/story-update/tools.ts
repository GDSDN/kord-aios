import { readFile, writeFile } from "node:fs/promises"
import { isAbsolute, resolve } from "node:path"
import { tool, type ToolDefinition, type PluginInput } from "@opencode-ai/plugin"
import { STORY_UPDATE_DESCRIPTION } from "./constants"
import type { StoryUpdateCommand, StoryUpdateInput } from "./types"
import { parseFrontmatter } from "../../shared"
import type { StoryStatus } from "../../shared/types"

const STORY_STATUSES = new Set<StoryStatus>([
  "DRAFT",
  "READY",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
])

type ParsedStory = {
  frontmatter: string | null
  body: string
}

type CheckTaskCommand = { action: "check_task"; data: { task: string } }
type UncheckTaskCommand = { action: "uncheck_task"; data: { task: string } }
type SetStatusCommand = { action: "set_status"; data: { status: StoryStatus | string } }
type AppendDevNotesCommand = { action: "append_dev_notes"; data: { note: string } }
type AddFileCommand = { action: "add_file"; data: { file: string } }
type UpdateSectionCommand = { action: "update_section"; data: { section: string; content: string } }

function isCheckTask(command: StoryUpdateCommand): command is CheckTaskCommand {
  return command.action === "check_task"
}

function isUncheckTask(command: StoryUpdateCommand): command is UncheckTaskCommand {
  return command.action === "uncheck_task"
}

function isSetStatus(command: StoryUpdateCommand): command is SetStatusCommand {
  return command.action === "set_status"
}

function isAppendDevNotes(command: StoryUpdateCommand): command is AppendDevNotesCommand {
  return command.action === "append_dev_notes"
}

function isAddFile(command: StoryUpdateCommand): command is AddFileCommand {
  return command.action === "add_file"
}

function isUpdateSection(command: StoryUpdateCommand): command is UpdateSectionCommand {
  return command.action === "update_section"
}

function normalizeStatus(status: string): StoryStatus {
  const normalized = status.trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_")
  if (STORY_STATUSES.has(normalized as StoryStatus)) {
    return normalized as StoryStatus
  }
  return "DRAFT"
}

function parseStoryContent(content: string): ParsedStory {
  const normalized = content.replace(/\r\n/g, "\n")
  const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?/)
  if (frontmatterMatch) {
    const frontmatter = `---\n${frontmatterMatch[1]}\n---`
    const body = normalized.slice(frontmatterMatch[0].length)
    return { frontmatter, body }
  }
  return { frontmatter: null, body: normalized }
}

function updateFrontmatterStatus(frontmatter: string | null, status: StoryStatus): string {
  const source = frontmatter ?? "---\n---"
  const parsed = parseFrontmatter<Record<string, unknown>>(source)
  const data = { ...parsed.data, status }
  const yamlLines = Object.entries(data).map(([key, value]) => `${key}: ${value}`)
  return `---\n${yamlLines.join("\n")}\n---`
}

function updateStatusSection(body: string, status: StoryStatus): string {
  if (body.match(/^##\s+Status/m)) {
    return body.replace(/(^##\s+Status\s*\n)([\s\S]*?)(\n##\s+|$)/m, (_, header, _content, tail) => {
      const suffix = tail.startsWith("\n##") ? `\n${tail.trimStart()}` : tail
      return `${header}${status}\n${suffix}`
    })
  }
  return `${body.trimEnd()}\n\n## Status\n${status}\n`
}

function updateChecklist(body: string, task: string, checked: boolean): string {
  const pattern = new RegExp(`^\\s*- \\[( |x|X)\\] ${escapeRegExp(task)}$`, "m")
  const replacement = `- [${checked ? "x" : " "}] ${task}`
  return pattern.test(body) ? body.replace(pattern, replacement) : body
}

function appendToSection(body: string, sectionTitle: string, content: string): string {
  const sectionRegex = new RegExp(`(^##\\s+${escapeRegExp(sectionTitle)}\\s*\\n)([\\s\\S]*?)(\\n##\\s+|$)`, "m")
  if (sectionRegex.test(body)) {
    return body.replace(sectionRegex, (_match, header, sectionBody, tail) => {
      const trimmed = sectionBody.trimEnd()
      const updated = trimmed ? `${trimmed}\n${content}` : content
      const suffix = tail.startsWith("\n##") ? `\n${tail.trimStart()}` : tail
      return `${header}${updated}\n${suffix}`
    })
  }
  return `${body.trimEnd()}\n\n## ${sectionTitle}\n${content}\n`
}

function replaceSection(body: string, sectionTitle: string, content: string): string {
  const sectionRegex = new RegExp(`(^##\\s+${escapeRegExp(sectionTitle)}\\s*\\n)([\\s\\S]*?)(\\n##\\s+|$)`, "m")
  if (sectionRegex.test(body)) {
    return body.replace(sectionRegex, (_match, header, _sectionBody, tail) => {
      const suffix = tail.startsWith("\n##") ? `\n${tail.trimStart()}` : tail
      return `${header}${content}\n${suffix}`
    })
  }
  return `${body.trimEnd()}\n\n## ${sectionTitle}\n${content}\n`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function applyStoryUpdate(content: string, update: StoryUpdateCommand): string {
  const { frontmatter, body } = parseStoryContent(content)

  if (isCheckTask(update)) {
    return buildContent(frontmatter, updateChecklist(body, update.data.task, true))
  }
  if (isUncheckTask(update)) {
    return buildContent(frontmatter, updateChecklist(body, update.data.task, false))
  }
  if (isSetStatus(update)) {
    const status = normalizeStatus(update.data.status)
    const updatedFrontmatter = updateFrontmatterStatus(frontmatter, status)
    const updatedBody = updateStatusSection(body, status)
    return buildContent(updatedFrontmatter, updatedBody)
  }
  if (isAppendDevNotes(update)) {
    return buildContent(frontmatter, appendToSection(body, "Dev Notes", update.data.note))
  }
  if (isAddFile(update)) {
    return buildContent(frontmatter, appendToSection(body, "File List", `- ${update.data.file}`))
  }
  if (isUpdateSection(update)) {
    return buildContent(frontmatter, replaceSection(body, update.data.section, update.data.content))
  }

  return buildContent(frontmatter, body)
}

function buildContent(frontmatter: string | null, body: string): string {
  if (frontmatter) {
    return `${frontmatter}\n${body.trimStart()}`
  }
  return body
}

export function createStoryUpdateTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: STORY_UPDATE_DESCRIPTION,
    args: {
      story_path: tool.schema.string().describe("Path to the story markdown file"),
      action: tool.schema
        .enum([
          "check_task",
          "uncheck_task",
          "set_status",
          "append_dev_notes",
          "add_file",
          "update_section",
        ])
        .describe("Update action to perform"),
      data: tool.schema.record(tool.schema.string(), tool.schema.unknown()).describe("Action payload"),
    },
    execute: async (args: StoryUpdateInput) => {
      const resolvedPath = isAbsolute(args.story_path)
        ? args.story_path
        : resolve(ctx.directory, args.story_path)

      try {
        const content = await readFile(resolvedPath, "utf-8")
        const updated = applyStoryUpdate(content, {
          action: args.action,
          data: args.data as StoryUpdateCommand["data"],
        })
        await writeFile(resolvedPath, updated, "utf-8")
        return JSON.stringify({ story_path: resolvedPath, updated: true })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `Error: Failed to update story file at ${resolvedPath}. ${message}`
      }
    },
  })
}
