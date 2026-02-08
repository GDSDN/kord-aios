import * as p from "@clack/prompts";
import color from "picocolors";
import type {
  InstallArgs,
  InstallConfig,
  ClaudeSubscription,
  BooleanArg,
  DetectedConfig,
} from "./types";
import {
  addPluginToOpenCodeConfig,
  writeOmoConfig,
  detectOpenCodeAvailability,
  addAuthPlugins,
  addProviderConfig,
  detectCurrentConfig,
  type OpenCodeAvailability,
} from "./config-manager";
import { shouldShowChatGPTOnlyWarning } from "./model-fallback";
import packageJson from "../../package.json" with { type: "json" };

const VERSION = packageJson.version;

const SYMBOLS = {
  check: color.green("[OK]"),
  cross: color.red("[X]"),
  arrow: color.cyan("->"),
  bullet: color.dim("*"),
  info: color.blue("[i]"),
  warn: color.yellow("[!]"),
  star: color.yellow("*"),
};

function formatProvider(
  name: string,
  enabled: boolean,
  detail?: string,
): string {
  const status = enabled ? SYMBOLS.check : color.dim("○");
  const label = enabled ? color.white(name) : color.dim(name);
  const suffix = detail ? color.dim(` (${detail})`) : "";
  return `  ${status} ${label}${suffix}`;
}

function formatConfigSummary(config: InstallConfig): string {
  const lines: string[] = [];

  lines.push(color.bold(color.white("Configuration Summary")));
  lines.push("");

  const claudeDetail = config.hasClaude
    ? config.isMax20
      ? "max20"
      : "standard"
    : undefined;
  lines.push(formatProvider("Claude", config.hasClaude, claudeDetail));
  lines.push(
    formatProvider("OpenAI/ChatGPT", config.hasOpenAI, "GPT-5.2 for Oracle"),
  );
  lines.push(formatProvider("Gemini", config.hasGemini));
  lines.push(formatProvider("GitHub Copilot", config.hasCopilot, "fallback"));
  lines.push(
    formatProvider("OpenCode Zen", config.hasOpencodeZen, "opencode/ models"),
  );
  lines.push(
    formatProvider(
      "Z.ai Coding Plan",
      config.hasZaiCodingPlan,
      "Librarian/Multimodal",
    ),
  );
  lines.push(
    formatProvider(
      "Kimi For Coding",
      config.hasKimiForCoding,
      "Sisyphus/Prometheus fallback",
    ),
  );

  lines.push("");
  lines.push(color.dim("─".repeat(40)));
  lines.push("");

  lines.push(color.bold(color.white("Model Assignment")));
  lines.push("");
  lines.push(
    `  ${SYMBOLS.info} Models auto-configured based on provider priority`,
  );
  lines.push(
    `  ${SYMBOLS.bullet} Priority: Native > Copilot > OpenCode Zen > Z.ai`,
  );

  return lines.join("\n");
}

function printHeader(isUpdate: boolean): void {
  const mode = isUpdate ? "Update" : "Install";
  console.log();
  console.log(color.bgMagenta(color.white(` Open-AIOS ${mode} `)));
  console.log();
}

function printStep(step: number, total: number, message: string): void {
  const progress = color.dim(`[${step}/${total}]`);
  console.log(`${progress} ${message}`);
}

function printSuccess(message: string): void {
  console.log(`${SYMBOLS.check} ${message}`);
}

function printError(message: string): void {
  console.log(`${SYMBOLS.cross} ${color.red(message)}`);
}

function printInfo(message: string): void {
  console.log(`${SYMBOLS.info} ${message}`);
}

function printWarning(message: string): void {
  console.log(`${SYMBOLS.warn} ${color.yellow(message)}`);
}

interface InstallStatusSummaryOptions {
  availability: OpenCodeAvailability;
  pluginConfigured: boolean;
  omoConfigured: boolean;
  authConfigured: boolean;
  providerConfigured: boolean;
  requiresAuthProviderSetup: boolean;
}

function statusSymbol(kind: "ok" | "warn" | "info"): string {
  if (kind === "ok") return SYMBOLS.check;
  if (kind === "warn") return SYMBOLS.warn;
  return SYMBOLS.info;
}

function formatInstallStatusSummary(
  options: InstallStatusSummaryOptions,
): string {
  const lines: string[] = [];

  lines.push(color.bold(color.white("OpenCode Presence")));
  if (options.availability.installed) {
    const version = options.availability.version
      ? ` ${options.availability.version}`
      : "";
    const command = options.availability.command
      ? color.dim(` via ${options.availability.command}`)
      : "";
    lines.push(`${statusSymbol("ok")} Detected${version}${command}`);
  } else if (options.availability.method === "bunx") {
    lines.push(
      `${statusSymbol("warn")} Not globally installed (${color.cyan("bunx opencode")} available)`,
    );
  } else {
    lines.push(`${statusSymbol("warn")} Not detected on PATH`);
  }

  lines.push("");
  lines.push(color.bold(color.white("Open-AIOS Plugin/Config Setup")));
  lines.push(
    `${options.pluginConfigured ? statusSymbol("ok") : statusSymbol("warn")} OpenCode plugin entry ${options.pluginConfigured ? "configured" : "not configured"}`,
  );
  lines.push(
    `${options.omoConfigured ? statusSymbol("ok") : statusSymbol("warn")} Open-AIOS model config ${options.omoConfigured ? "written" : "not written"}`,
  );

  lines.push("");
  lines.push(color.bold(color.white("Auth/Provider Setup")));
  if (!options.requiresAuthProviderSetup) {
    lines.push(
      `${statusSymbol("info")} Skipped (Gemini provider setup not selected)`,
    );
  } else {
    lines.push(
      `${options.authConfigured ? statusSymbol("ok") : statusSymbol("warn")} Auth plugin setup ${options.authConfigured ? "configured" : "not configured"}`,
    );
    lines.push(
      `${options.providerConfigured ? statusSymbol("ok") : statusSymbol("warn")} Provider mapping ${options.providerConfigured ? "configured" : "not configured"}`,
    );
  }

  return lines.join("\n");
}

function formatMcpSetupGuidance(): string {
  return (
    `Recommended MCP check (non-destructive):\n` +
    `  ${SYMBOLS.bullet} ${color.cyan("open-aios mcp detect")}\n` +
    `  ${SYMBOLS.bullet} ${color.cyan("open-aios mcp status")}`
  );
}

function printOpenCodeStatusForCli(availability: OpenCodeAvailability): void {
  if (availability.installed) {
    const versionLabel = availability.version ? ` ${availability.version}` : "";
    printSuccess(`OpenCode${versionLabel} detected`);
    return;
  }

  if (availability.method === "bunx") {
    printWarning("OpenCode is not globally installed, but bunx is available.");
    printInfo(`Quick start now: ${color.cyan("bunx opencode")}`);
    printInfo(
      `Optional global install: ${color.cyan("npm install -g opencode")}`,
    );
    printInfo(`After install, run directly: ${color.cyan("opencode")}`);
    return;
  }

  printWarning("OpenCode command not found on PATH.");
  printInfo(`Install guide: ${color.cyan("https://opencode.ai/docs")}`);
  printInfo(`Recommended install: ${color.cyan("npm install -g opencode")}`);
  printInfo(`Then verify with: ${color.cyan("opencode --version")}`);
}

function printOpenCodeStatusForTui(availability: OpenCodeAvailability): void {
  if (availability.installed) {
    const versionLabel = availability.version
      ? availability.version
      : "installed";
    const commandLabel = availability.command
      ? color.dim(` via ${availability.command}`)
      : "";
    p.log.info(`OpenCode ${versionLabel}${commandLabel}`);
    return;
  }

  if (availability.method === "bunx") {
    p.log.warn("OpenCode is not globally installed, but bunx is available.");
    p.note(
      `Quick start: ${color.cyan("bunx opencode")}\n` +
        `Optional global install: ${color.cyan("npm install -g opencode")}\n` +
        `Then run: ${color.cyan("opencode")}`,
      "Next Steps",
    );
    return;
  }

  p.log.warn("OpenCode command not found on PATH.");
  p.note(
    `Install guide: ${color.cyan("https://opencode.ai/docs")}\n` +
      `Recommended install: ${color.cyan("npm install -g opencode")}\n` +
      `Verify: ${color.cyan("opencode --version")}`,
    "Next Steps",
  );
}

function printBox(content: string, title?: string): void {
  const lines = content.split("\n");
  const maxWidth =
    Math.max(
      ...lines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").length),
      title?.length ?? 0,
    ) + 4;
  const border = color.dim("─".repeat(maxWidth));

  console.log();
  if (title) {
    console.log(
      color.dim("┌─") +
        color.bold(` ${title} `) +
        color.dim("─".repeat(maxWidth - title.length - 4)) +
        color.dim("┐"),
    );
  } else {
    console.log(color.dim("┌") + border + color.dim("┐"));
  }

  for (const line of lines) {
    const stripped = line.replace(/\x1b\[[0-9;]*m/g, "");
    const padding = maxWidth - stripped.length;
    console.log(
      color.dim("│") + ` ${line}${" ".repeat(padding - 1)}` + color.dim("│"),
    );
  }

  console.log(color.dim("└") + border + color.dim("┘"));
  console.log();
}

function validateNonTuiArgs(args: InstallArgs): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (args.claude === undefined) {
    errors.push("--claude is required (values: no, yes, max20)");
  } else if (!["no", "yes", "max20"].includes(args.claude)) {
    errors.push(
      `Invalid --claude value: ${args.claude} (expected: no, yes, max20)`,
    );
  }

  if (args.gemini === undefined) {
    errors.push("--gemini is required (values: no, yes)");
  } else if (!["no", "yes"].includes(args.gemini)) {
    errors.push(`Invalid --gemini value: ${args.gemini} (expected: no, yes)`);
  }

  if (args.copilot === undefined) {
    errors.push("--copilot is required (values: no, yes)");
  } else if (!["no", "yes"].includes(args.copilot)) {
    errors.push(`Invalid --copilot value: ${args.copilot} (expected: no, yes)`);
  }

  if (args.openai !== undefined && !["no", "yes"].includes(args.openai)) {
    errors.push(`Invalid --openai value: ${args.openai} (expected: no, yes)`);
  }

  if (
    args.opencodeZen !== undefined &&
    !["no", "yes"].includes(args.opencodeZen)
  ) {
    errors.push(
      `Invalid --opencode-zen value: ${args.opencodeZen} (expected: no, yes)`,
    );
  }

  if (
    args.zaiCodingPlan !== undefined &&
    !["no", "yes"].includes(args.zaiCodingPlan)
  ) {
    errors.push(
      `Invalid --zai-coding-plan value: ${args.zaiCodingPlan} (expected: no, yes)`,
    );
  }

  if (
    args.kimiForCoding !== undefined &&
    !["no", "yes"].includes(args.kimiForCoding)
  ) {
    errors.push(
      `Invalid --kimi-for-coding value: ${args.kimiForCoding} (expected: no, yes)`,
    );
  }

  return { valid: errors.length === 0, errors };
}

function argsToConfig(args: InstallArgs): InstallConfig {
  return {
    hasClaude: args.claude !== "no",
    isMax20: args.claude === "max20",
    hasOpenAI: args.openai === "yes",
    hasGemini: args.gemini === "yes",
    hasCopilot: args.copilot === "yes",
    hasOpencodeZen: args.opencodeZen === "yes",
    hasZaiCodingPlan: args.zaiCodingPlan === "yes",
    hasKimiForCoding: args.kimiForCoding === "yes",
  };
}

function detectedToInitialValues(detected: DetectedConfig): {
  claude: ClaudeSubscription;
  openai: BooleanArg;
  gemini: BooleanArg;
  copilot: BooleanArg;
  opencodeZen: BooleanArg;
  zaiCodingPlan: BooleanArg;
  kimiForCoding: BooleanArg;
} {
  let claude: ClaudeSubscription = "no";
  if (detected.hasClaude) {
    claude = detected.isMax20 ? "max20" : "yes";
  }

  return {
    claude,
    openai: detected.hasOpenAI ? "yes" : "no",
    gemini: detected.hasGemini ? "yes" : "no",
    copilot: detected.hasCopilot ? "yes" : "no",
    opencodeZen: detected.hasOpencodeZen ? "yes" : "no",
    zaiCodingPlan: detected.hasZaiCodingPlan ? "yes" : "no",
    kimiForCoding: detected.hasKimiForCoding ? "yes" : "no",
  };
}

async function runTuiMode(
  detected: DetectedConfig,
): Promise<InstallConfig | null> {
  const initial = detectedToInitialValues(detected);

  const claude = await p.select({
    message: "Do you have a Claude Pro/Max subscription?",
    options: [
      {
        value: "no" as const,
        label: "No",
        hint: "Will use opencode/glm-4.7-free as fallback",
      },
      {
        value: "yes" as const,
        label: "Yes (standard)",
        hint: "Claude Opus 4.5 for orchestration",
      },
      {
        value: "max20" as const,
        label: "Yes (max20 mode)",
        hint: "Full power with Claude Sonnet 4.5 for Librarian",
      },
    ],
    initialValue: initial.claude,
  });

  if (p.isCancel(claude)) {
    p.cancel("Installation cancelled.");
    return null;
  }

  const openai = await p.select({
    message: "Do you have an OpenAI/ChatGPT Plus subscription?",
    options: [
      {
        value: "no" as const,
        label: "No",
        hint: "Oracle will use fallback models",
      },
      {
        value: "yes" as const,
        label: "Yes",
        hint: "GPT-5.2 for Oracle (high-IQ debugging)",
      },
    ],
    initialValue: initial.openai,
  });

  if (p.isCancel(openai)) {
    p.cancel("Installation cancelled.");
    return null;
  }

  const gemini = await p.select({
    message: "Will you integrate Google Gemini?",
    options: [
      {
        value: "no" as const,
        label: "No",
        hint: "Frontend/docs agents will use fallback",
      },
      {
        value: "yes" as const,
        label: "Yes",
        hint: "Beautiful UI generation with Gemini 3 Pro",
      },
    ],
    initialValue: initial.gemini,
  });

  if (p.isCancel(gemini)) {
    p.cancel("Installation cancelled.");
    return null;
  }

  const copilot = await p.select({
    message: "Do you have a GitHub Copilot subscription?",
    options: [
      {
        value: "no" as const,
        label: "No",
        hint: "Only native providers will be used",
      },
      {
        value: "yes" as const,
        label: "Yes",
        hint: "Fallback option when native providers unavailable",
      },
    ],
    initialValue: initial.copilot,
  });

  if (p.isCancel(copilot)) {
    p.cancel("Installation cancelled.");
    return null;
  }

  const opencodeZen = await p.select({
    message: "Do you have access to OpenCode Zen (opencode/ models)?",
    options: [
      {
        value: "no" as const,
        label: "No",
        hint: "Will use other configured providers",
      },
      {
        value: "yes" as const,
        label: "Yes",
        hint: "opencode/claude-opus-4-6, opencode/gpt-5.2, etc.",
      },
    ],
    initialValue: initial.opencodeZen,
  });

  if (p.isCancel(opencodeZen)) {
    p.cancel("Installation cancelled.");
    return null;
  }

  const zaiCodingPlan = await p.select({
    message: "Do you have a Z.ai Coding Plan subscription?",
    options: [
      {
        value: "no" as const,
        label: "No",
        hint: "Will use other configured providers",
      },
      {
        value: "yes" as const,
        label: "Yes",
        hint: "Fallback for Librarian and Multimodal Looker",
      },
    ],
    initialValue: initial.zaiCodingPlan,
  });

  if (p.isCancel(zaiCodingPlan)) {
    p.cancel("Installation cancelled.");
    return null;
  }

  const kimiForCoding = await p.select({
    message: "Do you have a Kimi For Coding subscription?",
    options: [
      {
        value: "no" as const,
        label: "No",
        hint: "Will use other configured providers",
      },
      {
        value: "yes" as const,
        label: "Yes",
        hint: "Kimi K2.5 for Sisyphus/Prometheus fallback",
      },
    ],
    initialValue: initial.kimiForCoding,
  });

  if (p.isCancel(kimiForCoding)) {
    p.cancel("Installation cancelled.");
    return null;
  }

  return {
    hasClaude: claude !== "no",
    isMax20: claude === "max20",
    hasOpenAI: openai === "yes",
    hasGemini: gemini === "yes",
    hasCopilot: copilot === "yes",
    hasOpencodeZen: opencodeZen === "yes",
    hasZaiCodingPlan: zaiCodingPlan === "yes",
    hasKimiForCoding: kimiForCoding === "yes",
  };
}

async function runNonTuiInstall(args: InstallArgs): Promise<number> {
  const validation = validateNonTuiArgs(args);
  if (!validation.valid) {
    printHeader(false);
    printError("Validation failed:");
    for (const err of validation.errors) {
      console.log(`  ${SYMBOLS.bullet} ${err}`);
    }
    console.log();
    printInfo(
      "Usage: bunx open-aios install --no-tui --claude=<no|yes|max20> --gemini=<no|yes> --copilot=<no|yes>",
    );
    console.log();
    return 1;
  }

  const detected = detectCurrentConfig();
  const isUpdate = detected.isInstalled;

  printHeader(isUpdate);

  const totalSteps = 6;
  let step = 1;
  let pluginConfigured = false;
  let omoConfigured = false;
  let authConfigured = false;
  let providerConfigured = false;

  printStep(step++, totalSteps, "Checking OpenCode installation...");
  const availability = await detectOpenCodeAvailability();
  printOpenCodeStatusForCli(availability);

  if (isUpdate) {
    const initial = detectedToInitialValues(detected);
    printInfo(
      `Current config: Claude=${initial.claude}, Gemini=${initial.gemini}`,
    );
  }

  const config = argsToConfig(args);

  printStep(step++, totalSteps, "Adding Open-AIOS plugin...");
  const pluginResult = await addPluginToOpenCodeConfig(VERSION);
  if (!pluginResult.success) {
    printError(`Failed: ${pluginResult.error}`);
    return 1;
  }
  pluginConfigured = true;
  printSuccess(
    `Plugin ${isUpdate ? "verified" : "added"} ${SYMBOLS.arrow} ${color.dim(pluginResult.configPath)}`,
  );

  if (config.hasGemini) {
    printStep(step++, totalSteps, "Adding auth plugins...");
    const authResult = await addAuthPlugins(config);
    if (!authResult.success) {
      printError(`Failed: ${authResult.error}`);
      return 1;
    }
    authConfigured = true;
    printSuccess(
      `Auth plugins configured ${SYMBOLS.arrow} ${color.dim(authResult.configPath)}`,
    );

    printStep(step++, totalSteps, "Adding provider configurations...");
    const providerResult = addProviderConfig(config);
    if (!providerResult.success) {
      printError(`Failed: ${providerResult.error}`);
      return 1;
    }
    providerConfigured = true;
    printSuccess(
      `Providers configured ${SYMBOLS.arrow} ${color.dim(providerResult.configPath)}`,
    );
  } else {
    step += 2;
  }

  printStep(step++, totalSteps, "Writing Open-AIOS configuration...");
  const omoResult = writeOmoConfig(config);
  if (!omoResult.success) {
    printError(`Failed: ${omoResult.error}`);
    return 1;
  }
  omoConfigured = true;
  printSuccess(
    `Config written ${SYMBOLS.arrow} ${color.dim(omoResult.configPath)}`,
  );

  printBox(
    formatInstallStatusSummary({
      availability,
      pluginConfigured,
      omoConfigured,
      authConfigured,
      providerConfigured,
      requiresAuthProviderSetup: config.hasGemini,
    }),
    "Installer Status",
  );

  printStep(step++, totalSteps, "Optional MCP setup guidance...");
  printBox(formatMcpSetupGuidance(), "Optional MCP Follow-up");

  printBox(
    formatConfigSummary(config),
    isUpdate ? "Updated Configuration" : "Installation Complete",
  );

  if (!config.hasClaude) {
    console.log();
    console.log(color.bgRed(color.white(color.bold(" CRITICAL WARNING "))));
    console.log();
    console.log(
      color.red(
        color.bold(
          "  Sisyphus agent is STRONGLY optimized for Claude Opus 4.5.",
        ),
      ),
    );
    console.log(
      color.red(
        "  Without Claude, you may experience significantly degraded performance:",
      ),
    );
    console.log(color.dim("    • Reduced orchestration quality"));
    console.log(color.dim("    • Weaker tool selection and delegation"));
    console.log(color.dim("    • Less reliable task completion"));
    console.log();
    console.log(
      color.yellow(
        "  Consider subscribing to Claude Pro/Max for the best experience.",
      ),
    );
    console.log();
  }

  if (
    !config.hasClaude &&
    !config.hasOpenAI &&
    !config.hasGemini &&
    !config.hasCopilot &&
    !config.hasOpencodeZen
  ) {
    printWarning(
      "No model providers configured. Using opencode/glm-4.7-free as fallback.",
    );
  }

  console.log(
    `${SYMBOLS.star} ${color.bold(color.green(isUpdate ? "Configuration updated!" : "Installation complete!"))}`,
  );
  console.log(`  Run ${color.cyan("opencode")} to start!`);
  console.log();

  printBox(
    `${color.bold("Pro Tip:")} Include ${color.cyan("ultrawork")} (or ${color.cyan("ulw")}) in your prompt.\n` +
      `All features work like magic—parallel agents, background tasks,\n` +
      `deep exploration, and relentless execution until completion.`,
    "The Magic Word",
  );

  console.log(
    `${SYMBOLS.star} ${color.yellow("If you found this helpful, consider starring the repo!")}`,
  );
  console.log(
    `  ${color.dim("Visit the project repository and star it if useful.")}`,
  );
  console.log();
  console.log(color.dim("Open-AIOS ready. Enjoy!"));
  console.log();

  if (
    (config.hasClaude || config.hasGemini || config.hasCopilot) &&
    !args.skipAuth
  ) {
    printBox(
      `Run ${color.cyan("opencode auth login")} and select your provider:\n` +
        (config.hasClaude
          ? `  ${SYMBOLS.bullet} Anthropic ${color.gray("→ Claude Pro/Max")}\n`
          : "") +
        (config.hasGemini
          ? `  ${SYMBOLS.bullet} Google ${color.gray("→ OAuth with Antigravity")}\n`
          : "") +
        (config.hasCopilot
          ? `  ${SYMBOLS.bullet} GitHub ${color.gray("→ Copilot")}`
          : ""),
      "Authenticate Your Providers",
    );
  }

  return 0;
}

export async function install(args: InstallArgs): Promise<number> {
  if (!args.tui) {
    return runNonTuiInstall(args);
  }

  const detected = detectCurrentConfig();
  const isUpdate = detected.isInstalled;

  p.intro(
    color.bgMagenta(
      color.white(isUpdate ? " Open-AIOS Update " : " Open-AIOS "),
    ),
  );

  if (isUpdate) {
    const initial = detectedToInitialValues(detected);
    p.log.info(
      `Existing configuration detected: Claude=${initial.claude}, Gemini=${initial.gemini}`,
    );
  }

  const s = p.spinner();
  s.start("Checking OpenCode installation");

  const availability = await detectOpenCodeAvailability();
  if (!availability.installed) {
    s.stop(`OpenCode command unavailable ${color.yellow("[!]")}`);
    printOpenCodeStatusForTui(availability);
  } else {
    s.stop(
      `OpenCode ${availability.version ?? "installed"} ${color.green("[OK]")}`,
    );
  }

  const config = await runTuiMode(detected);
  if (!config) return 1;

  let pluginConfigured = false;
  let omoConfigured = false;
  let authConfigured = false;
  let providerConfigured = false;

  s.start("Adding Open-AIOS plugin to OpenCode config");
  const pluginResult = await addPluginToOpenCodeConfig(VERSION);
  if (!pluginResult.success) {
    s.stop(`Failed to add plugin: ${pluginResult.error}`);
    p.outro(color.red("Installation failed."));
    return 1;
  }
  pluginConfigured = true;
  s.stop(`Plugin added to ${color.cyan(pluginResult.configPath)}`);

  if (config.hasGemini) {
    s.start("Adding auth plugins (fetching latest versions)");
    const authResult = await addAuthPlugins(config);
    if (!authResult.success) {
      s.stop(`Failed to add auth plugins: ${authResult.error}`);
      p.outro(color.red("Installation failed."));
      return 1;
    }
    authConfigured = true;
    s.stop(`Auth plugins added to ${color.cyan(authResult.configPath)}`);

    s.start("Adding provider configurations");
    const providerResult = addProviderConfig(config);
    if (!providerResult.success) {
      s.stop(`Failed to add provider config: ${providerResult.error}`);
      p.outro(color.red("Installation failed."));
      return 1;
    }
    providerConfigured = true;
    s.stop(`Provider config added to ${color.cyan(providerResult.configPath)}`);
  }

  s.start("Writing Open-AIOS configuration");
  const omoResult = writeOmoConfig(config);
  if (!omoResult.success) {
    s.stop(`Failed to write config: ${omoResult.error}`);
    p.outro(color.red("Installation failed."));
    return 1;
  }
  omoConfigured = true;
  s.stop(`Config written to ${color.cyan(omoResult.configPath)}`);

  p.note(
    formatInstallStatusSummary({
      availability,
      pluginConfigured,
      omoConfigured,
      authConfigured,
      providerConfigured,
      requiresAuthProviderSetup: config.hasGemini,
    }),
    "Installer Status",
  );

  p.note(formatMcpSetupGuidance(), "Optional MCP Follow-up");

  if (!config.hasClaude) {
    console.log();
    console.log(color.bgRed(color.white(color.bold(" CRITICAL WARNING "))));
    console.log();
    console.log(
      color.red(
        color.bold(
          "  Sisyphus agent is STRONGLY optimized for Claude Opus 4.5.",
        ),
      ),
    );
    console.log(
      color.red(
        "  Without Claude, you may experience significantly degraded performance:",
      ),
    );
    console.log(color.dim("    • Reduced orchestration quality"));
    console.log(color.dim("    • Weaker tool selection and delegation"));
    console.log(color.dim("    • Less reliable task completion"));
    console.log();
    console.log(
      color.yellow(
        "  Consider subscribing to Claude Pro/Max for the best experience.",
      ),
    );
    console.log();
  }

  if (
    !config.hasClaude &&
    !config.hasOpenAI &&
    !config.hasGemini &&
    !config.hasCopilot &&
    !config.hasOpencodeZen
  ) {
    p.log.warn(
      "No model providers configured. Using opencode/glm-4.7-free as fallback.",
    );
  }

  p.note(
    formatConfigSummary(config),
    isUpdate ? "Updated Configuration" : "Installation Complete",
  );

  p.log.success(
    color.bold(isUpdate ? "Configuration updated!" : "Installation complete!"),
  );
  p.log.message(`Run ${color.cyan("opencode")} to start!`);

  p.note(
    `Include ${color.cyan("ultrawork")} (or ${color.cyan("ulw")}) in your prompt.\n` +
      `All features work like magic—parallel agents, background tasks,\n` +
      `deep exploration, and relentless execution until completion.`,
    "The Magic Word",
  );

  p.log.message(
    `${color.yellow("★")} If you found this helpful, consider starring the repo!`,
  );
  p.log.message(
    `  ${color.dim("Visit the project repository and star it if useful.")}`,
  );

  p.outro(color.green("Open-AIOS ready. Enjoy!"));

  if (
    (config.hasClaude || config.hasGemini || config.hasCopilot) &&
    !args.skipAuth
  ) {
    const providers: string[] = [];
    if (config.hasClaude)
      providers.push(`Anthropic ${color.gray("→ Claude Pro/Max")}`);
    if (config.hasGemini)
      providers.push(`Google ${color.gray("→ OAuth with Antigravity")}`);
    if (config.hasCopilot) providers.push(`GitHub ${color.gray("→ Copilot")}`);

    console.log();
    console.log(color.bold("Authenticate Your Providers"));
    console.log();
    console.log(`   Run ${color.cyan("opencode auth login")} and select:`);
    for (const provider of providers) {
      console.log(`   ${SYMBOLS.bullet} ${provider}`);
    }
    console.log();
  }

  return 0;
}
