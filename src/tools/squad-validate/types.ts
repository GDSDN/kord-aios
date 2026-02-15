export interface SquadValidateArgs {
  squad_name?: string
  squad_path?: string
}

export interface SquadValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
