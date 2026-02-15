import type { StoryStatus } from "../../shared/types"

export type StoryUpdateAction =
  | "check_task"
  | "uncheck_task"
  | "set_status"
  | "append_dev_notes"
  | "add_file"
  | "update_section"

export type StoryUpdateInput =
  | { story_path: string; action: "check_task"; data: { task: string } }
  | { story_path: string; action: "uncheck_task"; data: { task: string } }
  | { story_path: string; action: "set_status"; data: { status: StoryStatus | string } }
  | { story_path: string; action: "append_dev_notes"; data: { note: string } }
  | { story_path: string; action: "add_file"; data: { file: string } }
  | { story_path: string; action: "update_section"; data: { section: string; content: string } }

export type StoryUpdateCommand = Omit<StoryUpdateInput, "story_path">
