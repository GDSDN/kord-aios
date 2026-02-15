/** Allowed lifecycle states for a story file. */
export type StoryStatus = "DRAFT" | "READY" | "IN_PROGRESS" | "REVIEW" | "DONE"

/** A checkbox-style task listed in a story. */
export interface StoryTask {
  title: string
  checked: boolean
  notes?: string
}

/** Optional structured sections parsed from story markdown. */
export interface StorySections {
  acceptanceCriteria?: string[]
  files?: string[]
  devNotes?: string
  additional?: Record<string, string>
}

/** Parsed representation of a story markdown file. */
export interface StoryFile {
  title: string
  status: StoryStatus
  tasks: StoryTask[]
  sections?: StorySections
}
