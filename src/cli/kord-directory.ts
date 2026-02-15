import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { KORD_DIR, KORD_INPUT_SUBDIRS } from "./project-layout"

export interface KordDirectoryResult {
  success: boolean
  /** Whether .kord/ was freshly created (false if it already existed) */
  created: boolean
  /** Absolute path to .kord/ directory */
  kordPath: string
  error?: string
}

export function createKordDirectory(projectDir: string): KordDirectoryResult {
  const kordPath = join(projectDir, KORD_DIR)
  const alreadyExists = existsSync(kordPath)

  try {
    if (!alreadyExists) {
      mkdirSync(kordPath, { recursive: true })
    }

    for (const subdir of KORD_INPUT_SUBDIRS) {
      const subdirPath = join(kordPath, subdir)
      if (!existsSync(subdirPath)) {
        mkdirSync(subdirPath, { recursive: true })
      }
    }

    return {
      success: true,
      created: !alreadyExists,
      kordPath,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      created: false,
      kordPath,
      error: message,
    }
  }
}
