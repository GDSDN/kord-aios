import { readFile } from "node:fs/promises"
import { isAbsolute, resolve } from "node:path"
import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import { PLAN_READ_DESCRIPTION } from "./constants"
import type { PlanReadArgs, PlanReadFilter } from "./types"
import type { PlanDocument, PlanEpic, PlanStory, PlanTask, PlanStatus } from "../../shared/types"

const TASK_LINE_REGEX = /^- \[([ xX])\]\s*Task:\s*(.+)$/
const EPIC_LINE_REGEX = /^###\s+(.+)$/
const STORY_LINE_REGEX = /^####\s+Story:\s*(.+)$/
const TASK_SECTION_REGEX = /^##\s+Tasks/i
const EPICS_SECTION_REGEX = /^##\s+Epics/i

function parseStatus(checked: string): PlanStatus {
  return checked.trim().toLowerCase() === "x" ? "done" : "pending"
}

function parseIndentedField(line: string): { key: string; value: string } | null {
  const match = line.match(/^\s*-\s*([^:]+):\s*(.+)$/)
  if (!match) return null
  return { key: match[1].trim().toLowerCase(), value: match[2].trim() }
}

function parseStoryDriven(lines: string[]): PlanDocument {
  const epics: PlanEpic[] = []
  let currentEpic: PlanEpic | null = null
  let currentStory: PlanStory | null = null
  let currentTask: PlanTask | null = null

  for (const line of lines) {
    if (EPIC_LINE_REGEX.test(line)) {
      const title = line.match(EPIC_LINE_REGEX)?.[1]?.trim() ?? "Untitled Epic"
      currentEpic = { kind: "epic", title, stories: [] }
      epics.push(currentEpic)
      currentStory = null
      currentTask = null
      continue
    }

    if (STORY_LINE_REGEX.test(line)) {
      const title = line.match(STORY_LINE_REGEX)?.[1]?.trim() ?? "Untitled Story"
      currentStory = { kind: "story", title, tasks: [] }
      if (!currentEpic) {
        currentEpic = { kind: "epic", title: "Unassigned", stories: [] }
        epics.push(currentEpic)
      }
      currentEpic.stories.push(currentStory)
      currentTask = null
      continue
    }

    const taskMatch = line.match(TASK_LINE_REGEX)
    if (taskMatch) {
      const task: PlanTask = {
        kind: "task",
        title: taskMatch[2].trim(),
        status: parseStatus(taskMatch[1]),
      }
      currentTask = task
      if (!currentStory) {
        currentStory = { kind: "story", title: "Unassigned", tasks: [] }
        if (!currentEpic) {
          currentEpic = { kind: "epic", title: "Unassigned", stories: [] }
          epics.push(currentEpic)
        }
        currentEpic.stories.push(currentStory)
      }
      currentStory.tasks.push(task)
      continue
    }

    if (currentTask) {
      const field = parseIndentedField(line)
      if (!field) continue
      if (field.key === "executor") {
        currentTask.executor = field.value
      }
      if (field.key === "wave") {
        currentTask.wave = field.value
        if (currentStory) currentStory.wave = field.value
        if (currentEpic) currentEpic.wave = field.value
      }
      if (field.key === "status") {
        currentTask.status = field.value as PlanStatus
      }
    }
  }

  return {
    type: "story-driven",
    title: "Plan",
    epics,
  }
}

function parseTaskDriven(lines: string[]): PlanDocument {
  const tasks: PlanTask[] = []
  let currentTask: PlanTask | null = null

  for (const line of lines) {
    const taskMatch = line.match(TASK_LINE_REGEX)
    if (taskMatch) {
      const task: PlanTask = {
        kind: "task",
        title: taskMatch[2].trim(),
        status: parseStatus(taskMatch[1]),
      }
      tasks.push(task)
      currentTask = task
      continue
    }

    if (currentTask) {
      const field = parseIndentedField(line)
      if (!field) continue
      if (field.key === "executor") {
        currentTask.executor = field.value
      }
      if (field.key === "wave") {
        currentTask.wave = field.value
      }
      if (field.key === "status") {
        currentTask.status = field.value as PlanStatus
      }
    }
  }

  return {
    type: "task-driven",
    title: "Plan",
    tasks,
  }
}

export function parsePlanMarkdown(content: string): PlanDocument {
  const normalized = content.replace(/\r\n/g, "\n")
  const lines = normalized.split("\n")
  const title = lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "").trim() ?? "Plan"
  const hasEpicsSection = lines.some((line) => EPICS_SECTION_REGEX.test(line))
  const hasTaskSection = lines.some((line) => TASK_SECTION_REGEX.test(line))

  const plan = hasEpicsSection || lines.some((line) => EPIC_LINE_REGEX.test(line))
    ? parseStoryDriven(lines)
    : parseTaskDriven(lines)

  return { ...plan, title }
}

function matchesFilter(task: PlanTask, filter: PlanReadFilter): boolean {
  if (filter.wave && task.wave !== filter.wave) return false
  if (filter.status && task.status !== filter.status) return false
  if (filter.executor && task.executor !== filter.executor) return false
  return true
}

export function applyPlanFilters(plan: PlanDocument, filter?: PlanReadFilter): PlanDocument {
  if (!filter) return plan

  if (plan.type === "task-driven") {
    const filteredTasks = (plan.tasks ?? []).filter((task) => matchesFilter(task, filter))
    return { ...plan, tasks: filteredTasks }
  }

  const filteredEpics: PlanEpic[] = []
  for (const epic of plan.epics ?? []) {
    const filteredStories: PlanStory[] = []
    for (const story of epic.stories) {
      const filteredTasks = story.tasks.filter((task) => matchesFilter(task, filter))
      if (filteredTasks.length > 0) {
        filteredStories.push({ ...story, tasks: filteredTasks })
      }
    }
    if (filteredStories.length > 0) {
      filteredEpics.push({ ...epic, stories: filteredStories })
    }
  }

  return { ...plan, epics: filteredEpics }
}

export function createPlanReadTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: PLAN_READ_DESCRIPTION,
    args: {
      plan_path: tool.schema.string().describe("Path to the plan markdown file"),
      filter: tool.schema
        .object({
          wave: tool.schema.string().optional(),
          status: tool.schema.enum(["pending", "in_progress", "done", "blocked"]).optional(),
          executor: tool.schema.string().optional(),
        })
        .optional(),
    },
    execute: async (args: PlanReadArgs) => {
      const resolvedPath = isAbsolute(args.plan_path)
        ? args.plan_path
        : resolve(ctx.directory, args.plan_path)

      try {
        const content = await readFile(resolvedPath, "utf-8")
        const plan = parsePlanMarkdown(content)
        const filtered = applyPlanFilters(plan, args.filter)
        return JSON.stringify({ plan: filtered })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `Error: Failed to read plan file at ${resolvedPath}. ${message}`
      }
    },
  })
}
