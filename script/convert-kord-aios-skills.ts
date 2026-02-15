#!/usr/bin/env bun
/**
 * convert-kord-aios-skills.ts
 *
 * Converts task files into Kord AIOS SKILL.md format.
 * Reads from a source tasks directory (default points to a local legacy task dump).
 * Outputs to src/features/builtin-skills/skills/kord-aios/{domain}/{skill-name}/SKILL.md
 *
 * Usage:
 *   bun run script/convert-kord-aios-skills.ts           # dry-run
 *   bun run script/convert-kord-aios-skills.ts --apply    # write files
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { join, basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ─── Configuration ───────────────────────────────────────────────────────────

const SOURCE_TASKS_DIR =
  process.env.KORDOS_TASKS_DIR || "D:\\dev\\kord-aios-legacy-tasks"
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(SCRIPT_DIR, "..", "src", "features", "builtin-skills", "skills", "kord-aios")
const DRY_RUN = !process.argv.includes("--apply")

// ─── Classification Maps ─────────────────────────────────────────────────────

/** ENGINE tasks — fully redundant with Kord AIOS engine. DO NOT migrate. */
const ENGINE_TASKS = new Set([
  "build.md",
  "build-autonomous.md",
  "build-resume.md",
  "build-status.md",
  "execute-checklist.md",
  "plan-create-context.md",
  "plan-execute-subtask.md",
  "verify-subtask.md",
  "waves.md",
  "next.md",
  "orchestrate.md",
  "orchestrate-resume.md",
  "orchestrate-status.md",
  "orchestrate-stop.md",
  "session-resume.md",
  "yolo-toggle.md",
  "list-mcps.md",
])

/** SKIP tasks — legacy-internal, vendor-specific, duplicates, stubs. */
const SKIP_TASKS = new Set([
  // Legacy-internal (19)
  "create-task.md",
  "create-workflow.md",
  "modify-agent.md",
  "modify-task.md",
  "modify-workflow.md",
  "run-workflow.md",
  "run-workflow-engine.md",
  "validate-workflow.md",
  "validate-agents.md",
  "validate-tech-preset.md",
  "setup-llm-routing.md",
  "update-aios.md",
  "update-manifest.md",
  "improve-self.md",
  "init-project-status.md",
  "integrate-expansion-pack.md",
  "kb-mode-interaction.md",
  "db-expansion-pack-integration.md",
  "test-validation-task.md",
  "update-source-tree.md",
  // Vendor-specific (7)
  "po-pull-story-from-clickup.md",
  "po-sync-story-to-clickup.md",
  "squad-creator-sync-synkra.md",
  "squad-creator-publish.md",
  "squad-creator-download.md",
  "squad-creator-sync-ide-command.md",
  "squad-creator-migrate.md",
  // Stubs (<1KB)
  "cleanup-worktrees.md",
  "merge-worktree.md",
  "remove-mcp.md",
  // Niche
  "ids-query.md",
  // YAML (not SKILL.md compatible)
  "health-check.yaml",
  // Duplicates
  "brownfield-create-story.md",
  "apply-qa-fixes.md",
  // Legacy framework-specific
  "analyze-framework.md",
  "analyze-project-structure.md",
])

/** ADAPT tasks — unique methodology but needs engine-overlap stripping. */
const ADAPT_TASKS = new Set([
  "dev-develop-story.md",
  "execute-epic-plan.md",
  "correct-course.md",
  "qa-review-build.md",
  "spec-gather-requirements.md",
  "environment-bootstrap.md",
  "story-checkpoint.md",
  "dev-validate-next-story.md",
  "create-agent.md",
  "squad-creator-create.md",
  "squad-creator-analyze.md",
  "squad-creator-extend.md",
  "squad-creator-validate.md",
])

// ─── Agent Mapping (legacy → Kord AIOS) ────────────────────────────────────────

const AGENT_MAP: Record<string, string> = {
  "@dev": "dev",
  "@architect": "architect",
  "@qa": "qa",
  "@pm": "pm",
  "@po": "po",
  "@sm": "sm",
  "@analyst": "analyst",
  "@data-engineer": "data-engineer",
  "@devops": "devops",
  "@ux-design-expert": "ux-design-expert",
  "@kord": "kord",
  "@aios-master": "kord",
  "@build": "build",
  "@plan": "plan",
  "@librarian": "librarian",
  "@explore": "explore",
  "@vision": "vision",
  "@squad-creator": "squad-creator",
}

// ─── Domain Classification ───────────────────────────────────────────────────

const DOMAIN_MAP: Record<string, string> = {
  // Database (20)
  "db-schema-audit.md": "database",
  "db-bootstrap.md": "database",
  "db-supabase-setup.md": "database",
  "db-rls-audit.md": "database",
  "db-rollback.md": "database",
  "db-apply-migration.md": "database",
  "db-domain-modeling.md": "database",
  "db-policy-apply.md": "database",
  "db-explain.md": "database",
  "db-run-sql.md": "database",
  "db-analyze-hotpaths.md": "database",
  "db-dry-run.md": "database",
  "db-env-check.md": "database",
  "db-impersonate.md": "database",
  "db-load-csv.md": "database",
  "db-seed.md": "database",
  "db-smoke-test.md": "database",
  "db-snapshot.md": "database",
  "db-verify-order.md": "database",
  "setup-database.md": "database",

  // QA & Testing (22)
  "qa-review-story.md": "qa",
  "qa-generate-tests.md": "qa",
  "qa-review-build.md": "qa",
  "qa-review-proposal.md": "qa",
  "qa-security-checklist.md": "qa",
  "qa-trace-requirements.md": "qa",
  "qa-fix-issues.md": "qa",
  "qa-create-fix-request.md": "qa",
  "qa-nfr-assess.md": "qa",
  "qa-risk-profile.md": "qa",
  "qa-migration-validation.md": "qa",
  "qa-library-validation.md": "qa",
  "qa-false-positive-detection.md": "qa",
  "qa-evidence-requirements.md": "qa",
  "qa-browser-console-check.md": "qa",
  "qa-backlog-add-followup.md": "qa",
  "qa-after-creation.md": "qa",
  "qa-gate.md": "qa",
  "qa-run-tests.md": "qa",
  "qa-test-design.md": "qa",
  "dev-apply-qa-fixes.md": "qa",
  "test-as-user.md": "qa",

  // Story & Planning (9 KEEP + ADAPT)
  "create-next-story.md": "story",
  "sm-create-next-story.md": "story",
  "plan-create-implementation.md": "story",
  "create-brownfield-story.md": "story",
  "validate-next-story.md": "story",
  "shard-doc.md": "story",
  "create-doc.md": "story",
  "propose-modification.md": "story",
  "execute-epic-plan.md": "story",
  "story-checkpoint.md": "story",
  "dev-validate-next-story.md": "story",

  // Analysis & Research (10)
  "spec-assess-complexity.md": "analysis",
  "spec-critique.md": "analysis",
  "spec-gather-requirements.md": "analysis",
  "spec-research-dependencies.md": "analysis",
  "spec-write-spec.md": "analysis",
  "learn-patterns.md": "analysis",
  "facilitate-brainstorming-session.md": "analysis",
  "create-deep-research-prompt.md": "analysis",
  "calculate-roi.md": "analysis",
  "patterns.md": "analysis",

  // DevOps & CI/CD (8)
  "ci-cd-configuration.md": "devops",
  "github-devops-github-pr-automation.md": "devops",
  "github-devops-pre-push-quality-gate.md": "devops",
  "github-devops-repository-cleanup.md": "devops",
  "github-devops-version-management.md": "devops",
  "setup-github.md": "devops",
  "pr-automation.md": "devops",
  "release-management.md": "devops",
  "environment-bootstrap.md": "devops",

  // Design System (8)
  "setup-design-system.md": "design-system",
  "run-design-system-pipeline.md": "design-system",
  "extract-tokens.md": "design-system",
  "export-design-tokens-dtcg.md": "design-system",
  "tailwind-upgrade.md": "design-system",
  "generate-ai-frontend-prompt.md": "design-system",
  "ux-create-wireframe.md": "design-system",
  "ux-ds-scan-artifact.md": "design-system",
  "ux-user-research.md": "design-system",

  // Build & Development
  "build-component.md": "dev-workflow",
  "compose-molecule.md": "dev-workflow",
  "consolidate-patterns.md": "dev-workflow",
  "deprecate-component.md": "dev-workflow",
  "extend-pattern.md": "dev-workflow",
  "extract-patterns.md": "dev-workflow",
  "collaborative-edit.md": "dev-workflow",
  "correct-course.md": "dev-workflow",
  "dev-develop-story.md": "dev-workflow",
  "dev-improve-code-quality.md": "dev-workflow",
  "dev-optimize-performance.md": "dev-workflow",
  "dev-suggest-refactoring.md": "dev-workflow",
  "dev-backlog-debt.md": "dev-workflow",
  "create-service.md": "dev-workflow",
  "create-suite.md": "dev-workflow",

  // Documentation (10)
  "document-project.md": "documentation",
  "generate-documentation.md": "documentation",
  "sync-documentation.md": "documentation",
  "index-docs.md": "documentation",
  "document-gotchas.md": "documentation",
  "gotcha.md": "documentation",
  "gotchas.md": "documentation",
  "setup-project-docs.md": "documentation",
  "check-docs-links.md": "documentation",
  "generate-shock-report.md": "documentation",

  // Product Owner (6)
  "po-manage-story-backlog.md": "product",
  "po-close-story.md": "product",
  "po-pull-story.md": "product",
  "po-backlog-add.md": "product",
  "po-stories-index.md": "product",
  "po-sync-story.md": "product",

  // Squad & Agent Management (7 = 5 ADAPT + 2 KEEP)
  "create-agent.md": "squad",
  "squad-creator-create.md": "squad",
  "squad-creator-design.md": "squad",
  "squad-creator-analyze.md": "squad",
  "squad-creator-extend.md": "squad",
  "squad-creator-validate.md": "squad",
  "squad-creator-list.md": "squad",

  // MCP (2)
  "search-mcp.md": "mcp",
  "mcp-workflow.md": "mcp",

  // Worktrees (3)
  "create-worktree.md": "worktrees",
  "list-worktrees.md": "worktrees",
  "remove-worktree.md": "worktrees",

  // Additional analysis
  "advanced-elicitation.md": "analysis",
  "analyst-facilitate-brainstorming.md": "analysis",
  "analyze-brownfield.md": "analysis",
  "analyze-cross-artifact.md": "analysis",
  "analyze-performance.md": "database",
  "architect-analyze-impact.md": "analysis",

  // Additional design-system
  "audit-codebase.md": "design-system",
  "audit-tailwind-config.md": "design-system",
  "audit-utilities.md": "design-system",
  "bootstrap-shadcn-library.md": "design-system",

  // Additional story/product
  "brownfield-create-epic.md": "story",

  // Utilities
  "cleanup-utilities.md": "utilities",
  "undo-last.md": "utilities",
  "security-audit.md": "utilities",
  "security-scan.md": "utilities",
  "generate-migration-strategy.md": "utilities",
  "add-mcp.md": "utilities",
  "setup-mcp-docker.md": "utilities",
}

// ─── Section Stripping ───────────────────────────────────────────────────────

/** Sections to strip from legacy tasks (engine-handled or framework-specific). */
const SECTIONS_TO_STRIP = [
  "Execution Modes",
  "Task Definition",
  "Pre-Conditions",
  "Post-Conditions",
  "Tools",
  "Scripts",
  "Performance",
  "Metadata",
  "IDE-FILE-RESOLUTION",
]

/** Additional sections to strip from ADAPT tasks. */
const ADAPT_EXTRA_STRIP = [
  "Activation",
  "Greeting",
  "Mission Router",
]

// ─── Parsing Functions ───────────────────────────────────────────────────────

interface ParsedTask {
  title: string
  purpose: string
  agent: string | undefined
  sections: { heading: string; level: number; content: string }[]
  rawContent: string
}

function parseTask(content: string, filename: string): ParsedTask {
  const lines = content.split("\n")

  // Extract title from first # heading
  let title = ""
  for (const line of lines) {
    const match = line.match(/^#\s+(?:Task:\s*)?(.+)/)
    if (match) {
      title = match[1].trim()
      break
    }
  }
  if (!title) {
    title = basename(filename, ".md").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  }

  // Extract purpose from **Purpose**: line
  let purpose = ""
  for (const line of lines) {
    const match = line.match(/\*\*Purpose\*\*:\s*(.+)/i)
    if (match) {
      purpose = match[1].trim()
      break
    }
  }

  // Extract agent from **Agent:** line
  let agent: string | undefined
  for (const line of lines) {
    const match = line.match(/\*\*Agent:\*\*\s*(@[\w-]+)/i) || line.match(/\*\*Agent\*\*:\s*(@[\w-]+)/i)
    if (match) {
      agent = AGENT_MAP[match[1]] || match[1].replace("@", "")
      break
    }
  }

  // Also try responsável field in YAML blocks
  if (!agent) {
    const responsavelMatch = content.match(/responsável:\s*\w+\s*\((\w+)\)/i)
    if (responsavelMatch) {
      const persona = responsavelMatch[1].toLowerCase()
      const personaToAgent: Record<string, string> = {
        sage: "architect",
        dara: "data-engineer",
        gage: "devops",
        quinn: "qa",
        dex: "dev",
        orion: "kord",
        river: "sm",
        morgan: "pm",
        pax: "po",
        uma: "ux-design-expert",
        atlas: "analyst",
        craft: "squad-creator",
      }
      agent = personaToAgent[persona]
    }
  }

  // Parse sections by ## headings
  const sections: { heading: string; level: number; content: string }[] = []
  let currentHeading = ""
  let currentLevel = 0
  let currentContent: string[] = []

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,3})\s+(.+)/)
    if (headingMatch) {
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content: currentContent.join("\n").trim(),
        })
      }
      currentHeading = headingMatch[2].trim()
      currentLevel = headingMatch[1].length
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }
  if (currentHeading) {
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      content: currentContent.join("\n").trim(),
    })
  }

  return { title, purpose, agent, sections, rawContent: content }
}

function shouldStripSection(heading: string, isAdapt: boolean): boolean {
  const normalizedHeading = heading.replace(/\s*\(.*\)/, "").trim()

  for (const strip of SECTIONS_TO_STRIP) {
    if (normalizedHeading.toLowerCase() === strip.toLowerCase()) return true
    if (normalizedHeading.toLowerCase().startsWith(strip.toLowerCase())) return true
  }

  if (isAdapt) {
    for (const strip of ADAPT_EXTRA_STRIP) {
      if (normalizedHeading.toLowerCase() === strip.toLowerCase()) return true
    }
  }

  return false
}

function stripLegacySpecificContent(content: string): string {
  // Strip Portuguese field names in YAML blocks
  let result = content
    .replace(/campo:\s*/g, "field: ")
    .replace(/tipo:\s*/g, "type: ")
    .replace(/origem:\s*/g, "source: ")
    .replace(/obrigatório:\s*/g, "required: ")
    .replace(/validação:\s*/g, "validation: ")
    .replace(/responsável:\s*/g, "responsible: ")
    .replace(/responsavel_type:\s*/g, "responsible_type: ")
    .replace(/persistido:\s*/g, "persisted: ")
    .replace(/destino:\s*/g, "destination: ")

  // Strip .aios-core/ path references
  result = result.replace(/\.aios-core\/[^\s)]+/g, (match) => {
    // Keep the filename part only
    const parts = match.split("/")
    return parts[parts.length - 1]
  })

  // Strip *command star syntax references
  result = result.replace(/\*(\w[\w-]+)/g, "$1")

  return result
}

function replaceLegacyBranding(content: string): string {
  return content
    .replace(/\bAIOS\b/g, "Kord AIOS")
    .replace(/\bomoc\b/gi, "Kord AIOS")
    .replace(/\bOMOC\b/g, "Kord AIOS")
    .replace(/\baios\b/gi, "kord-aios")
    .replace(/\.aios\b/gi, ".kord")
    .replace(/\bSynkra\b/g, "Kord AIOS")
    .replace(/@synkra\/kord-aios-core/gi, "@kord-aios/kord-aios-core")
    .replace(/@synkra\/aios-core/gi, "@kord-aios/kord-aios-core")
    .replace(/synkraai\/aios-core/gi, "kord-aios/kord-aios-core")
}

// ─── SKILL.md Generation ─────────────────────────────────────────────────────

function generateSkillMd(parsed: ParsedTask, filename: string, isAdapt: boolean): string {
  const skillName = basename(filename, ".md")
  const description = replaceLegacyBranding(
    parsed.purpose || `${parsed.title} methodology and workflow`
  )
  const agent = parsed.agent

  // Build frontmatter
  const frontmatterLines = [
    "---",
    `name: ${skillName}`,
    `description: "${description.replace(/"/g, '\\"')}"`,
  ]
  if (agent) {
    frontmatterLines.push(`agent: ${agent}`)
  }
  frontmatterLines.push(`subtask: false`)
  frontmatterLines.push("---")

  // Build body from non-stripped sections
  const bodyParts: string[] = [`# ${replaceLegacyBranding(parsed.title)}`, ""]

  if (parsed.purpose) {
    bodyParts.push(replaceLegacyBranding(parsed.purpose), "")
  }

  for (const section of parsed.sections) {
    if (shouldStripSection(section.heading, isAdapt)) continue
    if (!section.content.trim()) continue

    const prefix = "#".repeat(section.level)
    bodyParts.push(`${prefix} ${section.heading}`, "")

    let content = section.content
    content = stripLegacySpecificContent(content)
    bodyParts.push(replaceLegacyBranding(content), "")
  }

  // If body is too thin (only title + purpose), include raw content minus stripped sections
  const bodyText = bodyParts.join("\n").trim()
  if (bodyText.split("\n").length < 10) {
    // Fallback: use raw content with header stripped
    const rawLines = parsed.rawContent.split("\n")
    const startIdx = rawLines.findIndex(l => l.startsWith("## "))
    if (startIdx > 0) {
      const rawBody = rawLines.slice(startIdx).join("\n")
      const cleanedBody = replaceLegacyBranding(stripLegacySpecificContent(rawBody))
      const title = replaceLegacyBranding(parsed.title)
      const purpose = parsed.purpose ? replaceLegacyBranding(parsed.purpose) + "\n\n" : ""
      return `${frontmatterLines.join("\n")}\n\n# ${title}\n\n${purpose}${cleanedBody}\n`
    }
  }

  return `${frontmatterLines.join("\n")}\n\n${bodyText}\n`
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log(`\n🔄 Kord AIOS Skill Conversion Script`)
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN (use --apply to write)" : "APPLY"}`)
  console.log(`   Source: ${SOURCE_TASKS_DIR}`)
  console.log(`   Output: ${OUTPUT_DIR}\n`)

  if (!existsSync(SOURCE_TASKS_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_TASKS_DIR}`)
    process.exit(1)
  }

  const files = readdirSync(SOURCE_TASKS_DIR).filter(f => f.endsWith(".md"))
  console.log(`   Found ${files.length} task files\n`)

  const stats = {
    engine: 0,
    skip: 0,
    adapt: 0,
    keep: 0,
    converted: 0,
    errors: 0,
    unmapped: [] as string[],
  }

  const domainCounts: Record<string, number> = {}

  for (const file of files) {
    // Classify
    if (ENGINE_TASKS.has(file)) {
      stats.engine++
      continue
    }
    if (SKIP_TASKS.has(file)) {
      stats.skip++
      continue
    }

    const isAdapt = ADAPT_TASKS.has(file)
    if (isAdapt) {
      stats.adapt++
    } else {
      stats.keep++
    }

    // Determine domain
    const domain = DOMAIN_MAP[file]
    if (!domain) {
      stats.unmapped.push(file)
      continue
    }

    domainCounts[domain] = (domainCounts[domain] || 0) + 1

    // Parse and convert
    try {
      const content = readFileSync(join(SOURCE_TASKS_DIR, file), "utf-8")
      const parsed = parseTask(content, file)
      const skillMd = generateSkillMd(parsed, file, isAdapt)
      const skillName = basename(file, ".md")
      const outputDir = join(OUTPUT_DIR, domain, skillName)
      const outputPath = join(outputDir, "SKILL.md")

      if (DRY_RUN) {
        const lines = skillMd.split("\n").length
        console.log(`  ✓ ${isAdapt ? "ADAPT" : "KEEP "} ${domain}/${skillName} (${lines} lines)`)
      } else {
        mkdirSync(outputDir, { recursive: true })
        writeFileSync(outputPath, skillMd, "utf-8")
        console.log(`  ✓ ${isAdapt ? "ADAPT" : "KEEP "} ${outputPath}`)
      }

      stats.converted++
    } catch (err) {
      console.error(`  ✗ ERROR ${file}: ${err}`)
      stats.errors++
    }
  }

  // Summary
  console.log(`\n${"─".repeat(60)}`)
  console.log(`\n📊 Summary:`)
  console.log(`   ENGINE (skipped):  ${stats.engine}`)
  console.log(`   SKIP (skipped):    ${stats.skip}`)
  console.log(`   ADAPT (converted): ${stats.adapt}`)
  console.log(`   KEEP (converted):  ${stats.keep}`)
  console.log(`   Total converted:   ${stats.converted}`)
  console.log(`   Errors:            ${stats.errors}`)

  if (stats.unmapped.length > 0) {
    console.log(`\n⚠️  Unmapped files (no domain assigned):`)
    for (const f of stats.unmapped) {
      console.log(`     - ${f}`)
    }
  }

  console.log(`\n📁 Domain distribution:`)
  for (const [domain, count] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${domain}: ${count}`)
  }

  if (DRY_RUN) {
    console.log(`\n💡 Run with --apply to write files.`)
  } else {
    console.log(`\n✅ Files written to ${OUTPUT_DIR}`)
  }
}

main()
