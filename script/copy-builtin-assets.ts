#!/usr/bin/env bun
import { cpSync, existsSync, rmSync } from "node:fs"
import { join } from "node:path"

const ROOT_DIR = join(import.meta.dir, "..")
const FEATURE_DIR = join(ROOT_DIR, "src", "features")
const DIST_DIR = join(ROOT_DIR, "dist")

const COPY_TARGETS: Array<{ source: string; target: string }> = [
  { source: join(FEATURE_DIR, "builtin-agents"), target: join(DIST_DIR, "builtin-agents") },
  { source: join(FEATURE_DIR, "builtin-checklists"), target: join(DIST_DIR, "builtin-checklists") },
  { source: join(FEATURE_DIR, "builtin-instructions"), target: join(DIST_DIR, "builtin-instructions") },
  { source: join(FEATURE_DIR, "builtin-skills", "kord-aios"), target: join(DIST_DIR, "builtin-skills", "kord-aios") },
  { source: join(FEATURE_DIR, "builtin-squads"), target: join(DIST_DIR, "builtin-squads") },
  { source: join(FEATURE_DIR, "builtin-standards"), target: join(DIST_DIR, "builtin-standards") },
  { source: join(FEATURE_DIR, "builtin-templates"), target: join(DIST_DIR, "builtin-templates") },
  { source: join(FEATURE_DIR, "builtin-workflows"), target: join(DIST_DIR, "builtin-workflows") },
]

function copyTarget(source: string, target: string) {
  if (!existsSync(source)) {
    throw new Error(`Builtin asset source missing: ${source}`)
  }

  rmSync(target, { recursive: true, force: true })
  cpSync(source, target, { recursive: true })
}

function main() {
  for (const target of COPY_TARGETS) {
    copyTarget(target.source, target.target)
  }

  console.log(`Copied builtin assets into ${DIST_DIR}`)
}

main()
