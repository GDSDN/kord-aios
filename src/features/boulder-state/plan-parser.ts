/**
 * Plan Task Parser
 *
 * Parses plan markdown files to extract structured task information,
 * including executor and verify fields for generalized build orchestration.
 *
 * Plan tasks follow this format in markdown:
 * - [ ] 1. Task Title
 *   **Executor**: @agent-name or category:category-name
 *   **Verify**: tdd | qa-scenarios | typecheck | none
 *   **Category**: visual-engineering | ultrabrain | ...
 *   **Skills**: [skill-1, skill-2]
 */

import { existsSync, readFileSync } from "node:fs"

export interface PlanTask {
  /** Task number (1-indexed) */
  number: number
  /** Task title text */
  title: string
  /** Whether the task is completed (checked) */
  completed: boolean
  /** Named agent to execute this task (e.g., "dev-junior", "qa", "devops") */
  executor?: string
  /** Verification method for this task */
  verify?: "tdd" | "qa-scenarios" | "typecheck" | "none" | string
  /** Delegation category override */
  category?: string
  /** Skills to load for this task */
  skills?: string[]
  /** Raw markdown content of the task block */
  raw: string
}

/**
 * Parse a plan file and extract structured task information.
 * Handles both checked and unchecked tasks.
 */
export function parsePlanTasks(planPath: string): PlanTask[] {
  if (!existsSync(planPath)) {
    return []
  }

  try {
    const content = readFileSync(planPath, "utf-8")
    return parsePlanTasksFromContent(content)
  } catch {
    return []
  }
}

/**
 * Parse plan tasks from raw markdown content.
 * Exported for testing without filesystem dependency.
 */
export function parsePlanTasksFromContent(content: string): PlanTask[] {
  const tasks: PlanTask[] = []
  const lines = content.split("\n")

  let currentTask: Partial<PlanTask> & { rawLines: string[] } | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Match task checkbox: - [ ] N. Title or - [x] N. Title
    const taskMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(\d+)\.\s*(.+)/)
    if (taskMatch) {
      // Flush previous task
      if (currentTask) {
        tasks.push(finalizeTask(currentTask))
      }

      currentTask = {
        number: parseInt(taskMatch[2], 10),
        title: taskMatch[3].trim(),
        completed: taskMatch[1] !== " ",
        rawLines: [line],
      }
      continue
    }

    // If we're inside a task block, collect indented lines
    if (currentTask) {
      // Check if this is a new non-indented section (not part of current task)
      if (line.match(/^[-*]\s*\[/) || line.match(/^#{1,3}\s/) || (line.trim() === "" && i + 1 < lines.length && lines[i + 1].match(/^[-*]\s*\[/))) {
        // If next line is a new task, flush and let the loop re-process
        if (line.match(/^[-*]\s*\[/)) {
          tasks.push(finalizeTask(currentTask))
          currentTask = null
          i-- // Re-process this line
          continue
        }
        // Section header ends current task
        if (line.match(/^#{1,3}\s/)) {
          tasks.push(finalizeTask(currentTask))
          currentTask = null
          continue
        }
      }

      currentTask.rawLines.push(line)

      // Parse executor field: **Executor**: @agent-name or **Executor**: category:name
      const executorMatch = line.match(/\*\*Executor\*\*\s*:\s*@?(.+)/i)
      if (executorMatch) {
        currentTask.executor = executorMatch[1].trim()
        continue
      }

      // Parse verify field: **Verify**: tdd | qa-scenarios | typecheck | none
      const verifyMatch = line.match(/\*\*Verify\*\*\s*:\s*(.+)/i)
      if (verifyMatch) {
        currentTask.verify = verifyMatch[1].trim().toLowerCase()
        continue
      }

      // Parse category field: **Category**: visual-engineering
      const categoryMatch = line.match(/\*\*Category\*\*\s*:\s*(.+)/i)
      if (categoryMatch) {
        currentTask.category = categoryMatch[1].trim()
        continue
      }

      // Parse skills field: **Skills**: [skill-1, skill-2] or **Skills**: skill-1, skill-2
      const skillsMatch = line.match(/\*\*Skills\*\*\s*:\s*\[?([^\]]+)\]?/i)
      if (skillsMatch) {
        currentTask.skills = skillsMatch[1]
          .split(",")
          .map((s) => s.trim().replace(/^`|`$/g, ""))
          .filter(Boolean)
        continue
      }
    }
  }

  // Flush last task
  if (currentTask) {
    tasks.push(finalizeTask(currentTask))
  }

  return tasks
}

function finalizeTask(partial: Partial<PlanTask> & { rawLines: string[] }): PlanTask {
  return {
    number: partial.number ?? 0,
    title: partial.title ?? "",
    completed: partial.completed ?? false,
    executor: partial.executor,
    verify: partial.verify,
    category: partial.category,
    skills: partial.skills,
    raw: partial.rawLines.join("\n"),
  }
}

/** A wave within a plan document, grouping tasks for sequential execution. */
export interface PlanWave {
  /** Wave number (1-indexed) */
  number: number
  /** Wave name (from heading, e.g., "Foundation") */
  name: string
  /** Tasks within this wave */
  tasks: PlanTask[]
}

/**
 * Parse plan waves from raw markdown content.
 * Detects `### Wave N — Name` or `### Wave N Name` headings
 * and collects tasks under each wave.
 */
export function parsePlanWavesFromContent(content: string): PlanWave[] {
  if (!content.trim()) return []

  const waves: PlanWave[] = []
  const lines = content.split("\n")

  let currentWave: { number: number; name: string; taskLines: string[] } | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Match wave heading: ### Wave N — Name, ### Wave N Name, ### Wave N
    const waveMatch = line.match(/^###\s+Wave\s+(\d+)\s*(?:[—–-]\s*)?(.*)$/i)
    if (waveMatch) {
      // Flush previous wave
      if (currentWave) {
        const tasks = parsePlanTasksFromContent(currentWave.taskLines.join("\n"))
        waves.push({ number: currentWave.number, name: currentWave.name, tasks })
      }

      currentWave = {
        number: parseInt(waveMatch[1], 10),
        name: waveMatch[2].trim(),
        taskLines: [],
      }
      continue
    }

    // If inside a wave, collect lines (stop at next ### heading or ## heading)
    if (currentWave) {
      if (line.match(/^#{2,3}\s/) && !line.match(/^###\s+Wave\s+/i)) {
        // Non-wave heading ends current wave
        const tasks = parsePlanTasksFromContent(currentWave.taskLines.join("\n"))
        waves.push({ number: currentWave.number, name: currentWave.name, tasks })
        currentWave = null
        continue
      }
      currentWave.taskLines.push(line)
    }
  }

  // Flush last wave
  if (currentWave) {
    const tasks = parsePlanTasksFromContent(currentWave.taskLines.join("\n"))
    waves.push({ number: currentWave.number, name: currentWave.name, tasks })
  }

  return waves
}

/**
 * Parse plan waves from a file path.
 */
export function parsePlanWaves(planPath: string): PlanWave[] {
  if (!existsSync(planPath)) return []
  try {
    const content = readFileSync(planPath, "utf-8")
    return parsePlanWavesFromContent(content)
  } catch {
    return []
  }
}

/**
 * Get the current wave (first wave with incomplete tasks).
 */
export function getCurrentWave(planPath: string): PlanWave | null {
  const waves = parsePlanWaves(planPath)
  return waves.find(w => w.tasks.some(t => !t.completed)) ?? null
}

/**
 * Get the next incomplete task from a plan file.
 */
export function getNextIncompleteTask(planPath: string): PlanTask | null {
  const tasks = parsePlanTasks(planPath)
  return tasks.find((t) => !t.completed) ?? null
}

/**
 * Get all incomplete tasks from a plan file.
 */
export function getIncompleteTasks(planPath: string): PlanTask[] {
  const tasks = parsePlanTasks(planPath)
  return tasks.filter((t) => !t.completed)
}
