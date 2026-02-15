#!/usr/bin/env bun
/**
 * Branding Normalization Script — S00
 *
 * Normalizes all legacy branding terms to canonical `kord-aios`:
 *   - kord-aios / Kord AIOS / Kord AIOS  → kord-aios / Kord AIOS
 *   - kord-aios                  → kord-aios
 *   - kord-aios             → kord-aios
 *
 * PRESERVES (no change):
 *   - kord (agent name)
 *   - .kord/ (directory)
 *   - kord-rules.md
 *   - docs/kord/
 *
 * Usage:
 *   bun run script/normalize-branding.ts              # dry-run (default)
 *   bun run script/normalize-branding.ts --apply       # apply changes
 *   bun run script/normalize-branding.ts --report-only # just count matches
 */

import { readFileSync, writeFileSync, renameSync, existsSync, readdirSync, statSync } from "fs"
import { join, relative, extname } from "path"

const ROOT = join(import.meta.dir, "..")
const APPLY = process.argv.includes("--apply")
const REPORT_ONLY = process.argv.includes("--report-only")

// ─── File Discovery ───

const INCLUDE_EXTENSIONS = new Set([
  ".ts", ".js", ".mjs", ".cjs",
  ".json", ".jsonc",
  ".md",
  ".yaml", ".yml",
  ".snap",
])

const EXCLUDE_DIRS = new Set([
  "node_modules", "dist", ".git", ".bun", "coverage",
])

function walkFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkFiles(full))
    } else if (INCLUDE_EXTENSIONS.has(extname(entry.name))) {
      results.push(full)
    }
  }
  return results
}

// ─── Text Replacement Rules ───
// Order matters: most specific first to avoid partial matches.

interface ReplacementRule {
  label: string
  /** Regex or string to find */
  pattern: RegExp
  /** Replacement string (can use $1, $2, etc.) */
  replacement: string
}

const TEXT_RULES: ReplacementRule[] = [
  // ── Phase 1: Display names (exact phrases) ──
  {
    label: "Kord AIOS → Kord AIOS",
    pattern: /Kord AIOS/g,
    replacement: "Kord AIOS",
  },
  {
    label: "Kord AIOS → Kord AIOS",
    pattern: /Kord AIOS/g,
    replacement: "Kord AIOS",
  },

  // ── Phase 2: Binary/package names (exact compound terms) ──
  {
    label: "kord-aios → kord-aios (binary/package)",
    pattern: /kord-aios/g,
    replacement: "kord-aios",
  },
  {
    label: "Kord AIOS → Kord AIOS (display)",
    pattern: /Kord AIOS/g,
    replacement: "Kord AIOS",
  },
  {
    label: "kord-aios → kord-aios (npm/repo)",
    pattern: /kord-aios/g,
    replacement: "kord-aios",
  },

  // ── Phase 3: Kebab-case compound terms (before generic kord-aios) ──
  {
    label: "kord-aios-antigravity-auth → kord-aios-antigravity-auth",
    pattern: /kord-aios-antigravity-auth/g,
    replacement: "kord-aios-antigravity-auth",
  },
  {
    label: "kord-aios.config.jsonc → kord-aios.config.jsonc",
    pattern: /kord-aios\.config\.jsonc/g,
    replacement: "kord-aios.config.jsonc",
  },
  {
    label: "kord-aios.config.json → kord-aios.config.json",
    pattern: /kord-aios\.config\.json(?!c)/g,
    replacement: "kord-aios.config.json",
  },
  {
    label: "kord-aios.config → kord-aios.config",
    pattern: /kord-aios\.config/g,
    replacement: "kord-aios.config",
  },
  {
    label: "kord-aios-loader → kord-aios-loader",
    pattern: /kord-aios-loader/g,
    replacement: "kord-aios-loader",
  },
  {
    label: "audit-kord-aios-drift → audit-kord-aios-drift",
    pattern: /audit-kord-aios-drift/g,
    replacement: "audit-kord-aios-drift",
  },
  {
    label: "convert-kord-aios-skills → convert-kord-aios-skills",
    pattern: /convert-kord-aios-skills/g,
    replacement: "convert-kord-aios-skills",
  },
  {
    label: "sync-kord-aios-layer → sync-kord-aios-layer",
    pattern: /sync-kord-aios-layer/g,
    replacement: "sync-kord-aios-layer",
  },

  // ── Phase 4: Config directory path ──
  {
    label: "~/.config/kord-aios → ~/.config/kord-aios",
    pattern: /\.config\/kord-aios/g,
    replacement: ".config/kord-aios",
  },

  // ── Phase 5: PascalCase type names (KordAios followed by uppercase) ──
  {
    label: "KordAios[A-Z] → KordAios[A-Z] (PascalCase types)",
    pattern: /KordAios(?=[A-Z])/g,
    replacement: "KordAios",
  },

  // ── Phase 6: camelCase identifiers (kord-aios followed by uppercase) ──
  {
    label: "kord-aios[A-Z] → kordAios[A-Z] (camelCase identifiers)",
    pattern: /kord-aios(?=[A-Z])/g,
    replacement: "kordAios",
  },

  // ── Phase 7: Directory/path references ──
  {
    label: "/kord-aios/ → /kord-aios/ (path references)",
    pattern: /\/kord-aios\//g,
    replacement: "/kord-aios/",
  },
  {
    label: "\\kord-aios\\ → \\kord-aios\\ (Windows path references)",
    pattern: /\\kord-aios\\/g,
    replacement: "\\kord-aios\\",
  },

  // ── Phase 8: Remaining kord-aios in non-identifier contexts ──
  // kord-aios followed by non-alphanumeric (string end, quote, space, dash, dot, etc.)
  {
    label: "kord-aios[^A-Za-z0-9] → kord-aios (string/kebab context)",
    pattern: /kord-aios(?=[^A-Za-z0-9])/g,
    replacement: "kord-aios",
  },
  // kord-aios at end of string/line
  {
    label: "kord-aios$ → kord-aios (end of line)",
    pattern: /kord-aios$/gm,
    replacement: "kord-aios",
  },

  // ── Phase 9: Remaining KordAios (standalone PascalCase at boundary) ──
  {
    label: "KordAios[^A-Za-z] → KordAios (PascalCase boundary)",
    pattern: /KordAios(?=[^A-Za-z0-9])/g,
    replacement: "KordAios",
  },
  {
    label: "KordAios$ → KordAios (end of line)",
    pattern: /KordAios$/gm,
    replacement: "KordAios",
  },
]

// ─── File/Directory Renames ───

interface RenameEntry {
  from: string
  to: string
  type: "file" | "directory"
}

const RENAMES: RenameEntry[] = [
  // Source files
  {
    from: "src/features/builtin-skills/kord-aios-loader.ts",
    to: "src/features/builtin-skills/kord-aios-loader.ts",
    type: "file",
  },
  {
    from: "src/features/builtin-skills/kord-aios-loader.test.ts",
    to: "src/features/builtin-skills/kord-aios-loader.test.ts",
    type: "file",
  },
  // Scripts
  {
    from: "script/audit-kord-aios-drift.mjs",
    to: "script/audit-kord-aios-drift.mjs",
    type: "file",
  },
  {
    from: "script/convert-kord-aios-skills.ts",
    to: "script/convert-kord-aios-skills.ts",
    type: "file",
  },
  {
    from: "script/sync-kord-aios-layer.mjs",
    to: "script/sync-kord-aios-layer.mjs",
    type: "file",
  },
  // Docs
  {
    from: "docs/architecture/kord-aios-architecture.md",
    to: "docs/architecture/kord-aios-architecture.md",
    type: "file",
  },
  // Skills directory (must be last — after file content is updated)
  {
    from: "src/features/builtin-skills/skills/kord-aios",
    to: "src/features/builtin-skills/skills/kord-aios",
    type: "directory",
  },
]

// Platform package directories
const PLATFORM_PACKAGES_DIR = join(ROOT, "packages")
if (existsSync(PLATFORM_PACKAGES_DIR)) {
  for (const entry of readdirSync(PLATFORM_PACKAGES_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith("kord-aios-")) {
      // We don't rename these dirs directly — they have their own identity
      // But we DO need to update their package.json content (handled by text rules)
    }
  }
}

// ─── Execution ───

interface Stats {
  filesScanned: number
  filesModified: number
  totalReplacements: number
  ruleBreakdown: Map<string, number>
  filesRenamed: number
  dirsRenamed: number
  errors: string[]
}

function applyTextReplacements(content: string, filePath: string, stats: Stats): string {
  let result = content
  for (const rule of TEXT_RULES) {
    const matches = result.match(rule.pattern)
    if (matches && matches.length > 0) {
      const count = matches.length
      result = result.replace(rule.pattern, rule.replacement)
      stats.totalReplacements += count
      stats.ruleBreakdown.set(rule.label, (stats.ruleBreakdown.get(rule.label) || 0) + count)
    }
  }
  return result
}

function processFiles(stats: Stats): Map<string, { original: string; modified: string }> {
  const changes = new Map<string, { original: string; modified: string }>()
  const files = walkFiles(ROOT)
  stats.filesScanned = files.length

  for (const filePath of files) {
    const original = readFileSync(filePath, "utf-8")
    const modified = applyTextReplacements(original, filePath, stats)

    if (modified !== original) {
      stats.filesModified++
      changes.set(filePath, { original, modified })
    }
  }

  return changes
}

function processRenames(stats: Stats): RenameEntry[] {
  const applicable: RenameEntry[] = []
  for (const rename of RENAMES) {
    const fromPath = join(ROOT, rename.from)
    if (existsSync(fromPath)) {
      applicable.push(rename)
      if (rename.type === "directory") stats.dirsRenamed++
      else stats.filesRenamed++
    }
  }
  return applicable
}

function printReport(stats: Stats, changes: Map<string, { original: string; modified: string }>, renames: RenameEntry[]) {
  console.log("\n" + "=".repeat(60))
  console.log("  BRANDING NORMALIZATION REPORT")
  console.log("=".repeat(60))
  console.log()
  console.log(`  Files scanned:      ${stats.filesScanned}`)
  console.log(`  Files modified:     ${stats.filesModified}`)
  console.log(`  Total replacements: ${stats.totalReplacements}`)
  console.log(`  Files to rename:    ${stats.filesRenamed}`)
  console.log(`  Dirs to rename:     ${stats.dirsRenamed}`)
  console.log(`  Errors:             ${stats.errors.length}`)
  console.log()

  if (stats.ruleBreakdown.size > 0) {
    console.log("  Replacements by rule:")
    const sorted = [...stats.ruleBreakdown.entries()].sort((a, b) => b[1] - a[1])
    for (const [rule, count] of sorted) {
      console.log(`    ${count.toString().padStart(4)} × ${rule}`)
    }
    console.log()
  }

  if (renames.length > 0) {
    console.log("  Renames:")
    for (const r of renames) {
      console.log(`    ${r.from}`)
      console.log(`      → ${r.to}`)
    }
    console.log()
  }

  if (changes.size > 0 && !REPORT_ONLY) {
    console.log("  Modified files:")
    for (const filePath of changes.keys()) {
      console.log(`    ${relative(ROOT, filePath)}`)
    }
    console.log()
  }

  if (stats.errors.length > 0) {
    console.log("  ERRORS:")
    for (const err of stats.errors) {
      console.log(`    ❌ ${err}`)
    }
    console.log()
  }
}

function main() {
  const mode = APPLY ? "APPLY" : REPORT_ONLY ? "REPORT" : "DRY-RUN"
  console.log(`\n🔄 Branding Normalization — Mode: ${mode}`)
  console.log(`   Root: ${ROOT}\n`)

  const stats: Stats = {
    filesScanned: 0,
    filesModified: 0,
    totalReplacements: 0,
    ruleBreakdown: new Map(),
    filesRenamed: 0,
    dirsRenamed: 0,
    errors: [],
  }

  // Phase 1: Text replacements
  console.log("Phase 1: Scanning files for text replacements...")
  const changes = processFiles(stats)

  // Phase 2: File/directory renames
  console.log("Phase 2: Checking file/directory renames...")
  const renames = processRenames(stats)

  // Report
  printReport(stats, changes, renames)

  if (REPORT_ONLY) {
    console.log("  Mode: REPORT-ONLY — no changes applied.\n")
    return
  }

  if (!APPLY) {
    console.log("  Mode: DRY-RUN — no changes applied.")
    console.log("  To apply changes, run with --apply flag:\n")
    console.log("    bun run script/normalize-branding.ts --apply\n")
    return
  }

  // Apply changes
  console.log("Applying changes...\n")

  // Apply text replacements
  let applied = 0
  for (const [filePath, { modified }] of changes) {
    try {
      writeFileSync(filePath, modified)
      applied++
    } catch (err) {
      stats.errors.push(`Failed to write ${relative(ROOT, filePath)}: ${err}`)
    }
  }
  console.log(`  ✅ ${applied} files updated with text replacements`)

  // Apply renames (files first, then directories)
  const fileRenames = renames.filter(r => r.type === "file")
  const dirRenames = renames.filter(r => r.type === "directory")

  for (const rename of [...fileRenames, ...dirRenames]) {
    const fromPath = join(ROOT, rename.from)
    const toPath = join(ROOT, rename.to)
    try {
      renameSync(fromPath, toPath)
      console.log(`  ✅ Renamed: ${rename.from} → ${rename.to}`)
    } catch (err) {
      stats.errors.push(`Failed to rename ${rename.from}: ${err}`)
      console.log(`  ❌ Failed: ${rename.from} → ${rename.to}`)
    }
  }

  if (stats.errors.length > 0) {
    console.log(`\n  ⚠️  ${stats.errors.length} errors occurred.`)
    for (const err of stats.errors) {
      console.log(`    ${err}`)
    }
  }

  console.log("\n  Done! Next steps:")
  console.log("    1. bun run typecheck")
  console.log("    2. bun test")
  console.log("    3. Fix any remaining issues\n")
}

main()
