export interface ChecklistRunnerArgs {
  checklist_path: string
  target_path: string
}

export interface ChecklistValidationItem {
  description: string
  passed: boolean
  reason?: string
}

export interface ChecklistRunnerResult {
  checklist: string
  target: string
  passed: boolean
  total: number
  passed_count: number
  failed_count: number
  items: ChecklistValidationItem[]
}
