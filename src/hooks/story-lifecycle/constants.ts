import type { StoryStatus } from "../../shared/types"

export const HOOK_NAME = "story-lifecycle"

export const VALID_TRANSITIONS: Record<StoryStatus, StoryStatus[]> = {
  DRAFT: ["READY"],
  READY: ["IN_PROGRESS"],
  IN_PROGRESS: ["REVIEW"],
  REVIEW: ["DONE", "IN_PROGRESS"],
  DONE: [],
}

export const TRANSITION_ROLES: Record<string, string[]> = {
  "DRAFT->READY": ["sm"],
  "READY->IN_PROGRESS": ["dev", "dev-junior"],
  "IN_PROGRESS->REVIEW": ["dev", "dev-junior"],
  "REVIEW->DONE": ["qa"],
  "REVIEW->IN_PROGRESS": ["qa"],
}
