#!/usr/bin/env bun
import { Command } from "commander";
import { install } from "./install";
import { run } from "./run";
import { getLocalVersion } from "./get-local-version";
import { doctor } from "./doctor";
import { initProject } from "./init";
import { createMcpOAuthCommand } from "./mcp-oauth";
import type { InstallArgs } from "./types";
import type { RunOptions } from "./run";
import type { GetLocalVersionOptions } from "./get-local-version/types";
import type { DoctorOptions } from "./doctor";
import packageJson from "../../package.json" with { type: "json" };

const VERSION = packageJson.version;

const program = new Command();
program.enablePositionalOptions();

program
  .name("open-aios")
  .description("The Open-AIOS CLI for OpenCode automation workflows")
  .version(VERSION, "-v, --version", "Show version number");

program
  .command("init")
  .description("Initialize Open-AIOS in the current project")
  .option("-d, --directory <path>", "Target project directory")
  .option("--with-apps", "Also copy Open-AIOS apps layer")
  .option("--with-installer", "Also copy Open-AIOS installer helper layer")
  .option("--dry-run", "Preview planned copy operations without writing files")
  .action(async (options) => {
    const exitCode = await initProject({
      directory: options.directory,
      withApps: options.withApps ?? false,
      withInstaller: options.withInstaller ?? false,
      dryRun: options.dryRun ?? false,
    });
    process.exit(exitCode);
  });

program
  .command("install")
  .description("Install and configure Open-AIOS")
  .option("--no-tui", "Run in non-interactive mode (requires all options)")
  .option("--claude <value>", "Claude subscription: no, yes, max20")
  .option(
    "--openai <value>",
    "OpenAI/ChatGPT subscription: no, yes (default: no)",
  )
  .option("--gemini <value>", "Gemini integration: no, yes")
  .option("--copilot <value>", "GitHub Copilot subscription: no, yes")
  .option(
    "--opencode-zen <value>",
    "OpenCode Zen access: no, yes (default: no)",
  )
  .option(
    "--zai-coding-plan <value>",
    "Z.ai Coding Plan subscription: no, yes (default: no)",
  )
  .option(
    "--kimi-for-coding <value>",
    "Kimi For Coding subscription: no, yes (default: no)",
  )
  .option("--skip-auth", "Skip authentication setup hints")
  .addHelpText(
    "after",
    `
Open-AIOS examples:
  $ bunx open-aios install
  $ bunx open-aios install --no-tui --claude=max20 --openai=yes --gemini=yes --copilot=no
  $ bunx open-aios install --no-tui --claude=no --gemini=no --copilot=yes --opencode-zen=yes

Model Providers (Priority: Native > Copilot > OpenCode Zen > Z.ai > Kimi):
  Claude        Native anthropic/ models (Opus, Sonnet, Haiku)
  OpenAI        Native openai/ models (GPT-5.2 for Oracle)
  Gemini        Native google/ models (Gemini 3 Pro, Flash)
  Copilot       github-copilot/ models (fallback)
  OpenCode Zen  opencode/ models (opencode/claude-opus-4-6, etc.)
  Z.ai          zai-coding-plan/glm-4.7 (Librarian priority)
  Kimi          kimi-for-coding/k2p5 (Sisyphus/Prometheus fallback)
`,
  )
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
    };
    const exitCode = await install(args);
    process.exit(exitCode);
  });

program
  .command("run <message>")
  .allowUnknownOption()
  .passThroughOptions()
  .description("Run opencode with todo/background task completion enforcement")
  .option(
    "-a, --agent <name>",
    "Agent to use (default: from CLI/env/config, fallback: KORD)",
  )
  .option("-d, --directory <path>", "Working directory")
  .option(
    "-t, --timeout <ms>",
    "Timeout in milliseconds (default: 30 minutes)",
    parseInt,
  )
  .option(
    "-p, --port <port>",
    "Server port (attaches if port already in use)",
    parseInt,
  )
  .option("--attach <url>", "Attach to existing opencode server URL")
  .option("--on-complete <command>", "Shell command to run after completion")
  .option("--json", "Output structured JSON result to stdout")
  .option(
    "--session-id <id>",
    "Resume existing session instead of creating new one",
  )
  .addHelpText(
    "after",
    `
Open-AIOS examples:
  $ bunx open-aios run "Fix the bug in index.ts"
  $ bunx open-aios run --agent KORD "Implement feature X"
  $ bunx open-aios run --timeout 3600000 "Large refactoring task"
  $ bunx open-aios run --port 4321 "Fix the bug"
  $ bunx open-aios run --attach http://127.0.0.1:4321 "Fix the bug"
  $ bunx open-aios run --json "Fix the bug" | jq .sessionId
  $ bunx open-aios run --on-complete "notify-send Done" "Fix the bug"
  $ bunx open-aios run --session-id ses_abc123 "Continue the work"

Agent resolution order:
  1) --agent flag
  2) OPENCODE_DEFAULT_AGENT
  3) open-aios.json "default_run_agent" (legacy alias: oh-my-opencode.json)
  4) KORD (fallback)

Canonical UX agent names:
  PLAN, BUILD, BUILD-LOOP, DEEP, KORD

Unlike 'opencode run', this command waits until:
  - All todos are completed or cancelled
  - All child sessions (background tasks) are idle
`,
  )
  .action(async (message: string, options) => {
    if (options.port && options.attach) {
      console.error("Error: --port and --attach are mutually exclusive");
      process.exit(1);
    }
    const runOptions: RunOptions = {
      message,
      agent: options.agent,
      directory: options.directory,
      timeout: options.timeout,
      port: options.port,
      attach: options.attach,
      onComplete: options.onComplete,
      json: options.json ?? false,
      sessionId: options.sessionId,
    };
    const exitCode = await run(runOptions);
    process.exit(exitCode);
  });

program
  .command("get-local-version")
  .description("Show current installed version and check for updates")
  .option("-d, --directory <path>", "Working directory to check config from")
  .option("--json", "Output in JSON format for scripting")
  .addHelpText(
    "after",
    `
Open-AIOS examples:
  $ bunx open-aios get-local-version
  $ bunx open-aios get-local-version --json
  $ bunx open-aios get-local-version --directory /path/to/project

This command shows:
  - Current installed version
  - Latest available version on npm
  - Whether you're up to date
  - Special modes (local dev, pinned version)
`,
  )
  .action(async (options) => {
    const versionOptions: GetLocalVersionOptions = {
      directory: options.directory,
      json: options.json ?? false,
    };
    const exitCode = await getLocalVersion(versionOptions);
    process.exit(exitCode);
  });

program
  .command("doctor")
  .description("Check open-aios installation health and diagnose issues")
  .option("--verbose", "Show detailed diagnostic information")
  .option("--json", "Output results in JSON format")
  .option("--category <category>", "Run only specific category")
  .addHelpText(
    "after",
    `
Open-AIOS examples:
  $ bunx open-aios doctor
  $ bunx open-aios doctor --verbose
  $ bunx open-aios doctor --json
  $ bunx open-aios doctor --category authentication

Categories:
  installation     Check OpenCode and plugin installation
  configuration    Validate configuration files
  authentication   Check auth provider status
  dependencies     Check external dependencies
  tools            Check LSP and MCP servers
  updates          Check for version updates
`,
  )
  .action(async (options) => {
    const doctorOptions: DoctorOptions = {
      verbose: options.verbose ?? false,
      json: options.json ?? false,
      category: options.category,
    };
    const exitCode = await doctor(doctorOptions);
    process.exit(exitCode);
  });

program
  .command("version")
  .description("Show version information")
  .action(() => {
    console.log(`open-aios v${VERSION}`);
  });

program.addCommand(createMcpOAuthCommand());

program.parse();
