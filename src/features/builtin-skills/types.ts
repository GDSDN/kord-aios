import type { SkillMcpConfig } from "../skill-mcp-manager/types"

export interface BuiltinSkill {
  name: string
  description: string
  template: string
  /** Optional template name from frontmatter - e.g., "react-component" refers to .kord/templates/react-component */
  templateRef?: string
  license?: string
  compatibility?: string
  metadata?: Record<string, unknown>
  allowedTools?: string[]
  agent?: string
  model?: string
  subtask?: boolean
  argumentHint?: string
  mcpConfig?: SkillMcpConfig
}
