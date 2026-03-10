import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

function getAssetDirCandidates(assetDir: string): string[] {
  return [join(import.meta.dir, assetDir), join(import.meta.dir, "..", assetDir)]
}

export function resolveBuiltinAssetDir(assetDir: string): string {
  for (const candidate of getAssetDirCandidates(assetDir)) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(`Builtin asset directory not found: ${assetDir}`)
}

export function getBuiltinAssetPath(assetDir: string, fileName: string): string {
  return join(resolveBuiltinAssetDir(assetDir), fileName)
}

export function readBuiltinAsset(assetDir: string, fileName: string): string {
  const baseDir = resolveBuiltinAssetDir(assetDir)
  const filePath = join(baseDir, fileName)

  if (!existsSync(filePath)) {
    throw new Error(`Builtin asset not found: ${join(assetDir, fileName)}`)
  }

  return readFileSync(filePath, "utf-8")
}

export function listBuiltinAssetFiles(assetDir: string, extension: string): string[] {
  const baseDir = resolveBuiltinAssetDir(assetDir)

  return readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}
