#!/usr/bin/env bun
import { Command } from "commander"
import { install } from "./install"
import { init } from "./init"
import { run } from "./run"
import { getLocalVersion } from "./get-local-version"
import { doctor } from "./doctor"
import { createMcpOAuthCommand } from "./mcp-oauth"
import type { InstallArgs } from "./types"
import type { RunOptions } from "./run"
import type { GetLocalVersionOptions } from "./get-local-version/types"
import type { DoctorOptions } from "./doctor"
import type { InitOptions } from "./init"
import packageJson from "../../package.json" with { type: "json" }

const VERSION = packageJson.version

const program = new Command()

program
  .name("kord-aios")
  .description("Kord AIOS OpenCode plugin - multi-model orchestration, LSP tools, and more")
  .version(VERSION, "-v, --version", "Show version number")

program
  .command("install")
  .description("Install and configure Kord AIOS with interactive setup")
  .option("--no-tui", "Run in non-interactive mode (requires all options)")
  .option("--claude <value>", "Claude subscription: no, yes, max20")
  .option("--openai <value>", "OpenAI/ChatGPT subscription: no, yes (default: no)")
  .option("--gemini <value>", "Gemini integration: no, yes")
  .option("--copilot <value>", "GitHub Copilot subscription: no, yes")
  .option("--opencode-zen <value>", "OpenCode Zen access: no, yes (default: no)")
  .option("--zai-coding-plan <value>", "Z.ai Coding Plan subscription: no, yes (default: no)")
  .option("--kimi-for-coding <value>", "Kimi For Coding subscription: no, yes (default: no)")
  .option("--skip-auth", "Skip authentication setup hints")
  .option("--force", "Force fresh install regardless of project maturity")
  .option("--reconfigure", "Bypass provider detection and ask all provider questions")
  .option("--skip-doctor", "Skip post-install verification checks")
  .option("--dry-run", "Preview changes without writing anything")
  .addHelpText("after", `
Examples:
  $ bunx kord-aios install
  $ bunx kord-aios install --no-tui --claude=max20 --openai=yes --gemini=yes --copilot=no
  $ bunx kord-aios install --no-tui --claude=no --gemini=no --copilot=yes --opencode-zen=yes

Model Providers (Priority: Native > Copilot > OpenCode Zen > Z.ai > Kimi):
  Claude        Native anthropic/ models (Opus, Sonnet, Haiku)
  OpenAI        Native openai/ models (GPT-5.2 for Architect)
  Gemini        Native google/ models (Gemini 3 Pro, Flash)
  Copilot       github-copilot/ models (fallback)
  OpenCode Zen  opencode/ models (opencode/claude-opus-4-6, etc.)
  Z.ai          zai-coding-plan/glm-4.7 (Librarian priority)
  Kimi          kimi-for-coding/k2p5 (Kord/Plan fallback)
`)
  .action(async (options) => {
    const args: InstallArgs = {
      tui: options.tui !== false,
      claude: options.claude,
      openai: options.openai,
      gemini: options.gemini,
      copilot: options.copilot,
      opencodeZen: options.opencodeZen,
      zaiCodingPlan: options.zaiCodingPlan,
      kimiForCoding: options.kimiForCoding,
      skipAuth: options.skipAuth ?? false,
      force: options.force ?? false,
      reconfigure: options.reconfigure ?? false,
      skipDoctor: options.skipDoctor ?? false,
      dryRun: options.dryRun ?? false,
    }
    const exitCode = await install(args)
    process.exit(exitCode)
  })

program
  .command("init")
  .description("Initialize Kord AIOS project structure (non-interactive)")
  .option("-d, --directory <path>", "Working directory (default: current directory)")
  .option("--force", "Overwrite existing scaffolded files (templates, kord-rules.md)")
  .addHelpText("after", `
Examples:
  $ bunx kord-aios init
  $ bunx kord-aios init --directory /path/to/project
  $ bunx kord-aios init --force

What it creates:
  - .kord/ directory with subdirectories (scripts, templates, checklists, skills, squads)
  - docs/kord/ subdirectories (plans, drafts, notepads)
  - Template files (story.md, adr.md, kord-rules.md)
  - Project config (.opencode/kord-aios.json)

What it does NOT do:
  - Does NOT add plugin to opencode.json
  - Does NOT configure provider authentication
  - Does NOT run doctor checks
  - Does NOT modify global config
`)
  .action(async (options) => {
    const initOptions: InitOptions = {
      directory: options.directory,
      force: options.force ?? false,
    }
    const result = await init(initOptions)
    process.exit(result.exitCode)
  })

program
  .command("run <message>")
  .description("Run opencode with todo/background task completion enforcement")
  .option("-a, --agent <name>", "Agent to use (default: from CLI/env/config, fallback: Kord)")
  .option("-d, --directory <path>", "Working directory")
  .option("-t, --timeout <ms>", "Timeout in milliseconds (default: 30 minutes)", parseInt)
  .addHelpText("after", `
Examples:
  $ bunx kord-aios run "Fix the bug in index.ts"
  $ bunx kord-aios run --agent Kord "Implement feature X"
  $ bunx kord-aios run --timeout 3600000 "Large refactoring task"

Agent resolution order:
  1) --agent flag
  2) OPENCODE_DEFAULT_AGENT
  3) kord-aios.json "default_run_agent"
  4) Kord (fallback)

Available core agents:
  Kord, Dev, Plan, Build

Unlike 'opencode run', this command waits until:
  - All todos are completed or cancelled
  - All child sessions (background tasks) are idle
`)
  .action(async (message: string, options) => {
    const runOptions: RunOptions = {
      message,
      agent: options.agent,
      directory: options.directory,
      timeout: options.timeout,
    }
    const exitCode = await run(runOptions)
    process.exit(exitCode)
  })

program
  .command("get-local-version")
  .description("Show current installed version and check for updates")
  .option("-d, --directory <path>", "Working directory to check config from")
  .option("--json", "Output in JSON format for scripting")
  .addHelpText("after", `
Examples:
  $ bunx kord-aios get-local-version
  $ bunx kord-aios get-local-version --json
  $ bunx kord-aios get-local-version --directory /path/to/project

This command shows:
  - Current installed version
  - Latest available version on npm
  - Whether you're up to date
  - Special modes (local dev, pinned version)
`)
  .action(async (options) => {
    const versionOptions: GetLocalVersionOptions = {
      directory: options.directory,
      json: options.json ?? false,
    }
    const exitCode = await getLocalVersion(versionOptions)
    process.exit(exitCode)
  })

program
  .command("doctor")
  .description("Check Kord AIOS installation health and diagnose issues")
  .option("--verbose", "Show detailed diagnostic information")
  .option("--json", "Output results in JSON format")
  .option("--category <category>", "Run only specific category")
  .addHelpText("after", `
Examples:
  $ bunx kord-aios doctor
  $ bunx kord-aios doctor --verbose
  $ bunx kord-aios doctor --json
  $ bunx kord-aios doctor --category authentication

Categories:
  installation     Check OpenCode and plugin installation
  configuration    Validate configuration files
  authentication   Check auth provider status
  dependencies     Check external dependencies
  tools            Check LSP and MCP servers
  updates          Check for version updates
`)
  .action(async (options) => {
    const doctorOptions: DoctorOptions = {
      verbose: options.verbose ?? false,
      json: options.json ?? false,
      category: options.category,
    }
    const exitCode = await doctor(doctorOptions)
    process.exit(exitCode)
  })

program
  .command("version")
  .description("Show version information")
  .action(() => {
    console.log(`kord-aios v${VERSION}`)
  })

program.addCommand(createMcpOAuthCommand())

program.parse()
