import { existsSync } from "node:fs"
import { join } from "node:path"
import type { CheckResult, CheckDefinition } from "../types"
import { CHECK_IDS, CHECK_NAMES } from "../constants"
import { KORD_DIR, KORD_DOCS_DIR, KORD_RULES_FILE } from "../../project-layout"

export async function checkProjectLayout(testCwd?: string): Promise<CheckResult> {
  const cwd = testCwd ?? process.cwd()
  const errors: string[] = []
  const missing: string[] = []

  // 1. Check .kord/ root
  const kordDir = join(cwd, KORD_DIR)
  if (!existsSync(kordDir)) {
    missing.push(KORD_DIR)
  } else {
    // Check .kord/templates
    if (!existsSync(join(kordDir, "templates"))) {
      missing.push(`${KORD_DIR}/templates`)
    }
  }

  // 2. Check docs/kord/ root
  const docsKordDir = join(cwd, KORD_DOCS_DIR)
  if (!existsSync(docsKordDir)) {
    missing.push(KORD_DOCS_DIR)
  } else {
    // Check docs/kord/plans
    if (!existsSync(join(docsKordDir, "plans"))) {
      missing.push(`${KORD_DOCS_DIR}/plans`)
    }
  }

  // 3. Check kord-rules.md
  if (!existsSync(join(cwd, KORD_RULES_FILE))) {
    missing.push(KORD_RULES_FILE)
  }

  if (missing.length > 0) {
    return {
      name: CHECK_NAMES[CHECK_IDS.PROJECT_LAYOUT],
      status: "warn",
      message: "Project structure incomplete",
      details: [
        "Missing required files/directories:",
        ...missing.map(m => `  - ${m}`),
        "Run 'kord-aios install --force' to repair",
      ],
    }
  }

  return {
    name: CHECK_NAMES[CHECK_IDS.PROJECT_LAYOUT],
    status: "pass",
    message: "Project layout valid",
    details: [
      `${KORD_DIR}/ verified`,
      `${KORD_DOCS_DIR}/ verified`,
      `${KORD_RULES_FILE} verified`,
    ],
  }
}

export function getProjectLayoutCheckDefinition(): CheckDefinition {
  return {
    id: CHECK_IDS.PROJECT_LAYOUT,
    name: CHECK_NAMES[CHECK_IDS.PROJECT_LAYOUT],
    category: "configuration", // Fits best
    check: checkProjectLayout,
    critical: false,
  }
}
