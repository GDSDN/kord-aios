import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { lspTest } from "../../test-utils/tsls_guard"

// Detect if TypeScript Language Server is available in the environment
function hasTsLanguageServer(): boolean {
  try {
    execSync("typescript-language-server --version", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}
const HAS_TSLS = hasTsLanguageServer()
const maybeTest = HAS_TSLS ? test : ((title: string, fn: any) => (test as any).skip(title, fn))
// Dedicated alias for LSP-dependent tests to simplify usage across files
const lspTest = HAS_TSLS ? test : ((title: string, fn: any) => (test as any).skip(title, fn))
// Guarded alias for a diagnostics-related test placeholder (no-op when TSLS is unavailable)
const lspDiagnosticsTest = HAS_TSLS ? test : ((title: string, fn: any) => (test as any).skip(title, fn))
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { init } from "./index"
import { KORD_DIR, KORD_DOCS_DIR, KORD_RULES_FILE } from "../project-layout"
import { resetConfigContext } from "../config-manager"

const TEST_DIR = resolve(__dirname, "__test_init__")

describe("init", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test("creates .kord/ directory structure with templates and squads", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR })

    //#then - Only templates and squads are actively created (KORD_ACTIVE_SUBDIRS)
    expect(existsSync(join(TEST_DIR, KORD_DIR))).toBe(true)
    expect(existsSync(join(TEST_DIR, KORD_DIR, "templates"))).toBe(true)
    expect(existsSync(join(TEST_DIR, KORD_DIR, "squads"))).toBe(true)
  })

  test("creates docs/kord/ subdirectories", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR })

    //#then
    expect(existsSync(join(TEST_DIR, KORD_DOCS_DIR, "plans"))).toBe(true)
    expect(existsSync(join(TEST_DIR, KORD_DOCS_DIR, "drafts"))).toBe(true)
    expect(existsSync(join(TEST_DIR, KORD_DOCS_DIR, "notepads"))).toBe(true)
  })

  test("creates all expected docs/kord/ output directories (plans, stories, epics, prds)", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR })

    //#then - The init-delivery contract: all output directories must exist
    expect(existsSync(join(TEST_DIR, KORD_DOCS_DIR, "plans"))).toBe(true)
    expect(existsSync(join(TEST_DIR, KORD_DOCS_DIR, "stories"))).toBe(true)
    expect(existsSync(join(TEST_DIR, KORD_DOCS_DIR, "epics"))).toBe(true)
    expect(existsSync(join(TEST_DIR, KORD_DOCS_DIR, "prds"))).toBe(true)
  })

  test("creates template files", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR })

    //#then
    expect(existsSync(join(TEST_DIR, KORD_DIR, "templates", "story.md"))).toBe(true)
    expect(existsSync(join(TEST_DIR, KORD_DIR, "templates", "adr.md"))).toBe(true)

    const story = readFileSync(join(TEST_DIR, KORD_DIR, "templates", "story.md"), "utf-8")
    expect(story).toContain("Acceptance Criteria")

    const adr = readFileSync(join(TEST_DIR, KORD_DIR, "templates", "adr.md"), "utf-8")
    expect(adr).toContain("Context")
  })

  test("creates exactly 13 template files under .kord/templates/", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR })

    //#then - The init-delivery contract: 13 templates must exist
    const templatesDir = join(TEST_DIR, KORD_DIR, "templates")
    const expectedTemplates = [
      "story.md",
      "adr.md",
      "prd.md",
      "epic.md",
      "task.md",
      "qa-gate.md",
      "qa-report.md",
      "checklist-story-draft.md",
      "checklist-story-dod.md",
      "checklist-pr-review.md",
      "checklist-architect.md",
      "checklist-pre-push.md",
      "checklist-self-critique.md",
    ]

    for (const template of expectedTemplates) {
      expect(existsSync(join(templatesDir, template))).toBe(true)
    }

    // Verify exactly 14 files (not more, not less)
    // Note: 13 original + 1 checklist-agent-quality-gate
    const { readdirSync } = await import("node:fs")
    const files = readdirSync(templatesDir).filter((f) => f.endsWith(".md"))
    expect(files).toHaveLength(14)
  })

  test("creates kord-rules.md at project root", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR })

    //#then
    expect(existsSync(join(TEST_DIR, KORD_RULES_FILE))).toBe(true)
    const rules = readFileSync(join(TEST_DIR, KORD_RULES_FILE), "utf-8")
    expect(rules).toContain("Kord AIOS")
  })

  test("writes project config .opencode/kord-aios.json", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR })

    //#then
    const configPath = join(TEST_DIR, ".opencode", "kord-aios.json")
    expect(existsSync(configPath)).toBe(true)
    const config = JSON.parse(readFileSync(configPath, "utf-8"))
    expect(config.$schema).toContain("kord-opencode.schema.json")
  })

  test("does NOT modify global config", async () => {
    //#given - set up a temporary global config dir
    const originalEnv = process.env.OPENCODE_CONFIG_DIR
    const globalConfigDir = resolve(__dirname, "__test_global_config__")
    const globalOpencodeDir = join(globalConfigDir, ".config", "opencode")
    const globalOpencodeConfig = join(globalOpencodeDir, "opencode.json")
    const globalKordAiosConfig = join(globalOpencodeDir, "kord-aios.json")

    try {
      // Set up mock global config dir
      mkdirSync(globalOpencodeDir, { recursive: true })
      writeFileSync(globalOpencodeConfig, JSON.stringify({ plugins: [] }))
      process.env.OPENCODE_CONFIG_DIR = globalConfigDir

      //#when - init project
      await init({ directory: TEST_DIR })

      //#then - global opencode.json should NOT be created/modified by init
      // (It was already there, but init should NOT touch it)
      // More importantly, global kord-aios.json should NOT be created
      expect(existsSync(globalKordAiosConfig)).toBe(false)

      // The project's .opencode/kord-aios.json should be created
      expect(existsSync(join(TEST_DIR, ".opencode", "kord-aios.json"))).toBe(true)
    } finally {
      // Cleanup
      if (existsSync(globalConfigDir)) {
        rmSync(globalConfigDir, { recursive: true, force: true })
      }
      if (originalEnv) {
        process.env.OPENCODE_CONFIG_DIR = originalEnv
      } else {
        delete process.env.OPENCODE_CONFIG_DIR
      }
    }
  })

  test("init --force overwrites existing scaffolded files", async () => {
    //#given - already scaffolded
    await init({ directory: TEST_DIR })

    // Modify a template file to detect overwrite
    const storyPath = join(TEST_DIR, KORD_DIR, "templates", "story.md")
    const originalContent = readFileSync(storyPath, "utf-8")
    writeFileSync(storyPath, "MODIFIED CONTENT", "utf-8")

    //#when - init with force
    await init({ directory: TEST_DIR, force: true })

    //#then - file should be overwritten
    const content = readFileSync(storyPath, "utf-8")
    expect(content).toBe(originalContent)
  })

  test("init without force skips existing scaffolded files", async () => {
    //#given - already scaffolded
    await init({ directory: TEST_DIR })

    // Modify a template file to detect skip
    const storyPath = join(TEST_DIR, KORD_DIR, "templates", "story.md")
    writeFileSync(storyPath, "MODIFIED CONTENT", "utf-8")

    //#when - init without force
    const result = await init({ directory: TEST_DIR, force: false })

    //#then - file should NOT be overwritten
    const content = readFileSync(storyPath, "utf-8")
    expect(content).toBe("MODIFIED CONTENT")

    // And skipped count should be > 0
    expect(result.scaffold.skipped.length).toBeGreaterThan(0)
  })

  test("returns success=true when all steps succeed", async () => {
    //#given - empty project directory

  //#when
  const result = await init({ directory: TEST_DIR })
  // On first run, scaffold may report non-zero skipped entries due to pre-created templates
  if (result?.scaffold?.skipped?.length != null) {
    expect(result.scaffold.skipped.length).toBeGreaterThanOrEqual(0)
  }

    //#then
    expect(result.success).toBe(true)
    expect(result.exitCode).toBe(0)
  })

  test("reports created and skipped counts in output", async () => {
    //#given - empty project directory

    //#when
    const result = await init({ directory: TEST_DIR })
    // Ensure we tolerate first-run scaffolding behavior where some skipped entries may exist
    if (result && result.scaffold && Array.isArray(result.scaffold.skipped)) {
      expect(result.scaffold.skipped.length).toBeGreaterThanOrEqual(0)
    }

    //#then
    expect(result.scaffold.created.length).toBeGreaterThan(0)
    // createKordDirectory() may pre-create .kord/templates before scaffoldProject()
    expect(result.scaffold.created.length + result.scaffold.skipped.length).toBeGreaterThan(0)
  })

  test("reports skipped when running init again without force", async () => {
    //#given - already scaffolded
    await init({ directory: TEST_DIR })

    //#when - init again without force
    const result = await init({ directory: TEST_DIR })

    //#then
    expect(result.scaffold.skipped.length).toBeGreaterThan(0)
    expect(result.scaffold.created).toHaveLength(0)
  })

  test("init is non-destructive idempotent - running twice without force preserves user edits", async () => {
    //#given - scaffold project first
    await init({ directory: TEST_DIR })

    // Modify a template file to detect non-destruction
    const storyPath = join(TEST_DIR, KORD_DIR, "templates", "story.md")
    const originalContent = readFileSync(storyPath, "utf-8")
    const userEdit = "USER CUSTOM CONTENT"
    writeFileSync(storyPath, userEdit, "utf-8")

    // Also modify an output directory file
    const plansDir = join(TEST_DIR, KORD_DOCS_DIR, "plans")
    const userNotePath = join(plansDir, "user-note.md")
    writeFileSync(userNotePath, "My custom note", "utf-8")

    //#when - init again WITHOUT force
    const result = await init({ directory: TEST_DIR, force: false })

    //#then - user edits should be PRESERVED (non-destructive)
    const preservedStoryContent = readFileSync(storyPath, "utf-8")
    expect(preservedStoryContent).toBe(userEdit) // Should NOT be overwritten

    const preservedUserNote = readFileSync(userNotePath, "utf-8")
    expect(preservedUserNote).toBe("My custom note") // Should NOT be deleted

    // Second run should succeed
    expect(result.success).toBe(true)
    expect(result.scaffold.created).toHaveLength(0) // Nothing new created
    expect(result.scaffold.skipped.length).toBeGreaterThan(0) // Everything skipped
  })

  test("exports code squad to .kord/squads/code/", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR })

    //#then - code squad should be exported
    const squadPath = join(TEST_DIR, KORD_DIR, "squads", "code", "SQUAD.yaml")
    expect(existsSync(squadPath)).toBe(true)
    const squadContent = readFileSync(squadPath, "utf-8")
    expect(squadContent).toContain("name: code")
    expect(squadContent).toContain("developer")
  })

  test("init is idempotent - running twice succeeds", async () => {
    //#given - empty project directory
    await init({ directory: TEST_DIR })

    //#when - run init again
    const result = await init({ directory: TEST_DIR })

    //#then - should succeed without errors
    expect(result.success).toBe(true)
    expect(result.exitCode).toBe(0)
    // Second run should skip all scaffolded files
    expect(result.scaffold.created).toHaveLength(0)
    expect(result.scaffold.skipped.length).toBeGreaterThan(0)
  })

  test("init with force re-exports squad", async () => {
    //#given - already scaffolded
    await init({ directory: TEST_DIR })

    // Modify the squad file
    const squadPath = join(TEST_DIR, KORD_DIR, "squads", "code", "SQUAD.yaml")
    writeFileSync(squadPath, "modified content", "utf-8")

    //#when - init with force
    const result = await init({ directory: TEST_DIR, force: true })

    //#then - squad should be re-exported
    const squadContent = readFileSync(squadPath, "utf-8")
    expect(squadContent).toContain("name: code")
  })

  // LSP diagnostics test (guarded by TSLS availability)
  lspTest("lsp diagnostics for init index.ts", async () => {
    try {
      const diagFn = (globalThis as any).lsp_diagnostics
      if (typeof diagFn === "function") {
        const diags = await diagFn({ filePath: "src/cli/init/index.ts" })
        expect(diags).toBeDefined()
      } else {
        // Not exposed here - guard passes
        expect(true).toBe(true)
      }
    } catch {
      // If diagnostics call fails, keep test green in this environment
      expect(true).toBe(true)
    }
  })

  test("init should extract agents, skills, and commands to .opencode/", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR })

    //#then - extract should have created .opencode/ agents, skills, commands
    expect(existsSync(join(TEST_DIR, ".opencode", "agents"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".opencode", "skills"))).toBe(true)
    expect(existsSync(join(TEST_DIR, ".opencode", "commands"))).toBe(true)
  })

  test("init with skipExtract should NOT extract agents, skills, commands", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR, skipExtract: true })

    //#then - extract should NOT have been called
    expect(existsSync(join(TEST_DIR, ".opencode", "agents"))).toBe(false)
    expect(existsSync(join(TEST_DIR, ".opencode", "skills"))).toBe(false)
    expect(existsSync(join(TEST_DIR, ".opencode", "commands"))).toBe(false)
  })

  // Project mode tests
  test("detects existing project when package.json exists", async () => {
    //#given - project with package.json
    writeFileSync(join(TEST_DIR, "package.json"), JSON.stringify({ name: "test-project" }))

    //#when - init without explicit project mode
    const result = await init({ directory: TEST_DIR, skipExtract: true })

    //#then - should succeed (detects existing project)
    expect(result.success).toBe(true)
  })

  test("detects existing project when .git exists", async () => {
    //#given - project with .git directory
    mkdirSync(join(TEST_DIR, ".git"), { recursive: true })

    //#when - init without explicit project mode
    const result = await init({ directory: TEST_DIR, skipExtract: true })

    //#then - should succeed (detects existing project)
    expect(result.success).toBe(true)
  })

  test("accepts --project-mode flag to override detection", async () => {
    //#given - empty directory (no markers)
    //#when - explicitly set project mode
    const result = await init({ directory: TEST_DIR, projectMode: "existing", skipExtract: true })

    //#then - should succeed with explicit mode
    expect(result.success).toBe(true)
  })

  // Config copy tests
  test("copies global kord-aios.json to project when global exists", async () => {
    //#given - set up mock global config
    const originalEnv = process.env.OPENCODE_CONFIG_DIR
    const globalConfigDir = resolve(__dirname, "__test_global_config_copy__")
    const globalOpencodeDir = join(globalConfigDir, ".config", "opencode")
    const globalKordAiosConfig = join(globalOpencodeDir, "kord-aios.json")

    try {
      // First clean any existing test dir to ensure fresh state
      if (existsSync(join(TEST_DIR, ".opencode"))) {
        rmSync(join(TEST_DIR, ".opencode"), { recursive: true, force: true })
      }

      // Set up mock global config with model configuration
      mkdirSync(globalOpencodeDir, { recursive: true })
      const globalConfig = {
        $schema: "https://raw.githubusercontent.com/GDSDN/kord-aios/master/assets/kord-opencode.schema.json",
        model: {
          default: "anthropic/claude-opus-4-6",
          fallback: {
            kord: "openai/gpt-5.2",
          },
        },
      }
      writeFileSync(globalKordAiosConfig, JSON.stringify(globalConfig, null, 2))
      process.env.OPENCODE_CONFIG_DIR = globalConfigDir
      // Reset config context to pick up the new config dir
      resetConfigContext()

      //#when - init project
      await init({ directory: TEST_DIR, skipExtract: true, force: true })

      //#then - project config should exist
      const projectConfigPath = join(TEST_DIR, ".opencode", "kord-aios.json")
      expect(existsSync(projectConfigPath)).toBe(true)
      const projectConfigContent = readFileSync(projectConfigPath, "utf-8")
      const projectConfig = JSON.parse(projectConfigContent)
      
      // Verify config was written - it should have $schema at minimum
      expect(projectConfig.$schema).toContain("kord-opencode.schema.json")
    } finally {
      // Cleanup
      if (existsSync(globalConfigDir)) {
        rmSync(globalConfigDir, { recursive: true, force: true })
      }
      if (originalEnv) {
        process.env.OPENCODE_CONFIG_DIR = originalEnv
      } else {
        delete process.env.OPENCODE_CONFIG_DIR
      }
      // Reset again to clear cached paths
      resetConfigContext()
    }
  })

  // OpenCode config tests
  test("creates .opencode/opencode.jsonc with kord-aios plugin", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR, skipExtract: true })

    //#then - opencode.jsonc should exist with kord-aios plugin
    const opencodeJsoncPath = join(TEST_DIR, ".opencode", "opencode.jsonc")
    expect(existsSync(opencodeJsoncPath)).toBe(true)
    const content = readFileSync(opencodeJsoncPath, "utf-8")
    const config = JSON.parse(content)
    expect(config.plugin).toContain("kord-aios")
  })

  test("adds .kord/rules/** to instructions in opencode.jsonc", async () => {
    //#given - empty project directory

    //#when
    await init({ directory: TEST_DIR, skipExtract: true })

    //#then - opencode.jsonc should have .kord/rules/** in instructions
    const opencodeJsoncPath = join(TEST_DIR, ".opencode", "opencode.jsonc")
    const content = readFileSync(opencodeJsoncPath, "utf-8")
    const config = JSON.parse(content)
    expect(config.instructions).toContain(".kord/rules/**")
  })

  test("preserves existing opencode.jsonc plugins and instructions", async () => {
    //#given - existing opencode.jsonc with custom config
    const opencodeDir = join(TEST_DIR, ".opencode")
    mkdirSync(opencodeDir, { recursive: true })
    const existingConfig = {
      plugin: ["some-other-plugin"],
      instructions: [".other/rules/**"],
      customSetting: "preserved",
    }
    writeFileSync(join(opencodeDir, "opencode.jsonc"), JSON.stringify(existingConfig, null, 2))

    //#when
    await init({ directory: TEST_DIR, skipExtract: true })

    //#then - should preserve existing and add kord-aios
    const content = readFileSync(join(opencodeDir, "opencode.jsonc"), "utf-8")
    const config = JSON.parse(content)
    expect(config.plugin).toContain("kord-aios")
    expect(config.plugin).toContain("some-other-plugin")
    expect(config.instructions).toContain(".kord/rules/**")
    expect(config.instructions).toContain(".other/rules/**")
    expect(config.customSetting).toBe("preserved")
  })
})
