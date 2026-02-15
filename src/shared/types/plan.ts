/** Supported plan document formats. */
export type PlanType = "story-driven" | "task-driven" | "research"

/** Shared status used by plan items. */
export type PlanStatus = "pending" | "in_progress" | "done" | "blocked"

/** Lowest-level work item in a plan. */
export interface PlanTask {
  kind: "task"
  title: string
  status?: PlanStatus
  executor?: string
  wave?: string
  notes?: string
}

/** Story grouping within a plan (story-driven format). */
export interface PlanStory {
  kind: "story"
  title: string
  status?: PlanStatus
  executor?: string
  wave?: string
  tasks: PlanTask[]
}

/** Epic grouping within a plan (story-driven format). */
export interface PlanEpic {
  kind: "epic"
  title: string
  status?: PlanStatus
  wave?: string
  stories: PlanStory[]
}

/** Unified union of all plan items. */
export type PlanItem = PlanEpic | PlanStory | PlanTask

/** Wave grouping for execution sequencing. */
export interface Wave {
  name: string
  items: PlanItem[]
}

/** Hierarchical representation of a plan document. */
export interface TaskHierarchy {
  epics: PlanEpic[]
}

/** Parsed plan document with optional hierarchical/task-driven forms. */
export interface PlanDocument {
  type: PlanType
  title: string
  epics?: PlanEpic[]
  tasks?: PlanTask[]
  waves?: Wave[]
  metadata?: Record<string, string>
}
