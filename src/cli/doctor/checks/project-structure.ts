import { existsSync } from "node:fs"
import { join } from "node:path"
import type { CheckResult, CheckDefinition } from "../types"
import { CHECK_IDS, CHECK_NAMES } from "../constants"
import { KORD_DIR, KORD_DOCS_DIR } from "../../project-layout"

export async function checkProjectStructure(testCwd?: string): Promise<CheckResult> {
  const cwd = testCwd ?? process.cwd()
  const missing: string[] = []

  // Check .kord/ directory
  const kordDir = join(cwd, KORD_DIR)
  if (!existsSync(kordDir)) {
    missing.push(KORD_DIR)
  }

  // Check docs/kord/ directory
  const docsKordDir = join(cwd, KORD_DOCS_DIR)
  if (!existsSync(docsKordDir)) {
    missing.push(KORD_DOCS_DIR)
  }

  if (missing.length > 0) {
    return {
      name: CHECK_NAMES[CHECK_IDS.PROJECT_STRUCTURE],
      status: "warn",
      message: "Project not initialized — run `bunx kord-aios init` to set up your project",
      details: [
        "Missing directories:",
        ...missing.map((m) => `Missing: ${m}`),
        "Run `bunx kord-aios init` to set up your project",
      ],
    }
  }

  return {
    name: CHECK_NAMES[CHECK_IDS.PROJECT_STRUCTURE],
    status: "pass",
    message: "Project initialized",
    details: [`${KORD_DIR}/ and ${KORD_DOCS_DIR}/ verified`],
  }
}

export function getProjectStructureCheckDefinition(): CheckDefinition {
  return {
    id: CHECK_IDS.PROJECT_STRUCTURE,
    name: CHECK_NAMES[CHECK_IDS.PROJECT_STRUCTURE],
    category: "installation",
    check: checkProjectStructure,
    critical: false,
  }
}
