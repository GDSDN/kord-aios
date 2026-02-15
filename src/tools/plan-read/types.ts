import type { PlanStatus } from "../../shared/types"

export interface PlanReadFilter {
  wave?: string
  status?: PlanStatus
  executor?: string
}

export interface PlanReadArgs {
  plan_path: string
  filter?: PlanReadFilter
}
