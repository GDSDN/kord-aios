#!/usr/bin/env bun
import { cpSync, existsSync, rmSync } from "node:fs"
import { join } from "node:path"

const SOURCE_DIR = join(import.meta.dir, "..", "src", "features", "builtin-skills", "kord-aios")
const TARGET_DIR = join(import.meta.dir, "..", "dist", "kord-aios")

function main() {
  if (!existsSync(SOURCE_DIR)) {
    throw new Error(`Builtin skill asset source missing: ${SOURCE_DIR}`)
  }

  rmSync(TARGET_DIR, { recursive: true, force: true })
  cpSync(SOURCE_DIR, TARGET_DIR, { recursive: true })

  console.log(`Copied builtin skill assets to ${TARGET_DIR}`)
}

main()
