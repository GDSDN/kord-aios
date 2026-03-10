import { join } from "node:path"
import { listBuiltinAssetFiles, readBuiltinAsset } from "../builtin-assets"

const BUILTIN_WORKFLOWS_DIR = "builtin-workflows"

export interface BuiltinWorkflowAsset {
  id: string
  filePath: string
  content: string
}

function listBuiltinWorkflowFiles(): string[] {
  return listBuiltinAssetFiles(BUILTIN_WORKFLOWS_DIR, ".yaml")
}

export function loadBuiltinWorkflowAssets(): BuiltinWorkflowAsset[] {
  return listBuiltinWorkflowFiles().map((fileName) => {
    const id = fileName.replace(/\.yaml$/i, "")
    const filePath = join(BUILTIN_WORKFLOWS_DIR, fileName)
    return {
      id,
      filePath,
      content: readBuiltinAsset(BUILTIN_WORKFLOWS_DIR, fileName),
    }
  })
}

export const BUILTIN_WORKFLOW_YAMLS: Record<string, string> = Object.fromEntries(
  loadBuiltinWorkflowAssets().map(({ id, content }) => [id, content]),
)
