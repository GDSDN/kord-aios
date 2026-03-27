export const PROJECT_MEMORY_DURABLE_DIR = ".kord/memory"
export const PROJECT_MEMORY_LOCAL_DIR = ".kord/memory/.local"

export type ProjectMemoryClass =
  | "decision"
  | "constraint"
  | "preference"
  | "thread"
  | "artifact"
  | "entity"
  | "gotcha"

export interface ProjectMemoryRecordBase {
  id: string
  class: ProjectMemoryClass
  summary: string
  created_at: string
  updated_at: string
  workspace_id: string
  branch: string
  source_session_id?: string
  tags?: string[]
}

export interface DecisionMemoryRecord extends ProjectMemoryRecordBase {
  class: "decision"
  rationale: string
  alternatives?: string[]
}

export interface ConstraintMemoryRecord extends ProjectMemoryRecordBase {
  class: "constraint"
  constraint: string
  scope?: "project" | "workspace" | "branch"
}

export interface PreferenceMemoryRecord extends ProjectMemoryRecordBase {
  class: "preference"
  preference: string
  weight?: number
}

export interface ThreadMemoryRecord extends ProjectMemoryRecordBase {
  class: "thread"
  thread_id: string
  status?: "open" | "closed" | "deferred"
}

export interface ArtifactMemoryRecord extends ProjectMemoryRecordBase {
  class: "artifact"
  artifact_path: string
  artifact_kind?: "code" | "doc" | "plan" | "test"
}

export interface EntityMemoryRecord extends ProjectMemoryRecordBase {
  class: "entity"
  entity_name: string
  entity_type?: string
}

export interface GotchaMemoryRecord extends ProjectMemoryRecordBase {
  class: "gotcha"
  symptom: string
  resolution?: string
}

export type ProjectMemoryRecord =
  | DecisionMemoryRecord
  | ConstraintMemoryRecord
  | PreferenceMemoryRecord
  | ThreadMemoryRecord
  | ArtifactMemoryRecord
  | EntityMemoryRecord
  | GotchaMemoryRecord

export interface ProjectMemoryBranchMetadata {
  workspace_id: string
  branch: string
  durable_cursor?: string
  updated_at: string
}
