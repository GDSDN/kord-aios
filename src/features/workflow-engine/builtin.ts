import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const BUILTIN_WORKFLOWS_DIR = join(import.meta.dir, "..", "builtin-workflows")

export interface BuiltinWorkflowAsset {
  id: string
  filePath: string
  content: string
}

function listBuiltinWorkflowFiles(): string[] {
  if (!existsSync(BUILTIN_WORKFLOWS_DIR)) {
    return []
  }

  return readdirSync(BUILTIN_WORKFLOWS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

export function loadBuiltinWorkflowAssets(): BuiltinWorkflowAsset[] {
  return listBuiltinWorkflowFiles().map((fileName) => {
    const id = fileName.replace(/\.yaml$/i, "")
    const filePath = join(BUILTIN_WORKFLOWS_DIR, fileName)
    if (!existsSync(filePath)) {
      throw new Error(`Builtin workflow asset is missing: ${filePath}`)
    }

    return {
      id,
      filePath,
      content: readFileSync(filePath, "utf-8"),
    }
  })
}

export const BUILTIN_WORKFLOW_YAMLS: Record<string, string> = Object.fromEntries(
  loadBuiltinWorkflowAssets().map(({ id, content }) => [id, content]),
)
