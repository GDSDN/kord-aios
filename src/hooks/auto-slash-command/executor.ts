import { existsSync, readdirSync, readFileSync } from "fs";
import { join, basename, dirname } from "path";
import {
  parseFrontmatter,
  resolveCommandsInText,
  resolveFileReferencesInText,
  sanitizeModelField,
  getClaudeConfigDir,
  getOpenCodeConfigDir,
} from "../../shared";
import { loadBuiltinCommands } from "../../features/builtin-commands";
import type { CommandFrontmatter } from "../../features/claude-code-command-loader/types";
import { isMarkdownFile } from "../../shared/file-utils";
import {
  discoverAllSkills,
  type LoadedSkill,
  type LazyContentLoader,
} from "../../features/opencode-skill-loader";
import type { ParsedSlashCommand } from "./types";

interface CommandScope {
  type:
    | "user"
    | "project"
    | "opencode"
    | "opencode-project"
    | "skill"
    | "builtin";
}

interface CommandMetadata {
  name: string;
  description: string;
  argumentHint?: string;
  model?: string;
  agent?: string;
  subtask?: boolean;
}

interface CommandInfo {
  name: string;
  path?: string;
  metadata: CommandMetadata;
  content?: string;
  scope: CommandScope["type"];
  lazyContentLoader?: LazyContentLoader;
}

function discoverCommandsFromDir(
  commandsDir: string,
  scope: CommandScope["type"],
): CommandInfo[] {
  if (!existsSync(commandsDir)) {
    return [];
  }

  const entries = readdirSync(commandsDir, { withFileTypes: true });
  const commands: CommandInfo[] = [];

  for (const entry of entries) {
    if (!isMarkdownFile(entry)) continue;

    const commandPath = join(commandsDir, entry.name);
    const commandName = basename(entry.name, ".md");

    try {
      const content = readFileSync(commandPath, "utf-8");
      const { data, body } = parseFrontmatter<CommandFrontmatter>(content);

      const isOpencodeSource =
        scope === "opencode" || scope === "opencode-project";
      const metadata: CommandMetadata = {
        name: commandName,
        description: data.description || "",
        argumentHint: data["argument-hint"],
        model: sanitizeModelField(
          data.model,
          isOpencodeSource ? "opencode" : "claude-code",
        ),
        agent: data.agent,
        subtask: Boolean(data.subtask),
      };

      commands.push({
        name: commandName,
        path: commandPath,
        metadata,
        content: body,
        scope,
      });
    } catch {
      continue;
    }
  }

  return commands;
}

function skillToCommandInfo(skill: LoadedSkill): CommandInfo {
  return {
    name: skill.name,
    path: skill.path,
    metadata: {
      name: skill.name,
      description: skill.definition.description || "",
      argumentHint: skill.definition.argumentHint,
      model: skill.definition.model,
      agent: skill.definition.agent,
      subtask: skill.definition.subtask,
    },
    content: skill.definition.template,
    scope: "skill",
    lazyContentLoader: skill.lazyContent,
  };
}

export interface ExecutorOptions {
  skills?: LoadedSkill[];
}

async function discoverAllCommands(
  options?: ExecutorOptions,
): Promise<CommandInfo[]> {
  const configDir = getOpenCodeConfigDir({ binary: "opencode" });
  const userCommandsDir = join(getClaudeConfigDir(), "commands");
  const projectCommandsDir = join(process.cwd(), ".claude", "commands");
  const opencodeGlobalDir = join(configDir, "command");
  const opencodeProjectDir = join(process.cwd(), ".opencode", "command");

  const userCommands = discoverCommandsFromDir(userCommandsDir, "user");
  const opencodeGlobalCommands = discoverCommandsFromDir(
    opencodeGlobalDir,
    "opencode",
  );
  const projectCommands = discoverCommandsFromDir(
    projectCommandsDir,
    "project",
  );
  const opencodeProjectCommands = discoverCommandsFromDir(
    opencodeProjectDir,
    "opencode-project",
  );
  const builtinCommandsMap = loadBuiltinCommands();
  const builtinCommands: CommandInfo[] = Object.values(builtinCommandsMap).map(
    (cmd) => ({
      name: cmd.name,
      metadata: {
        name: cmd.name,
        description: cmd.description || "",
        model: cmd.model,
        agent: cmd.agent,
        subtask: cmd.subtask,
      },
      content: cmd.template,
      scope: "builtin",
    }),
  );

  const skills = options?.skills ?? (await discoverAllSkills());
  const skillCommands = skills.map(skillToCommandInfo);

  return [
    ...builtinCommands,
    ...opencodeProjectCommands,
    ...projectCommands,
    ...opencodeGlobalCommands,
    ...userCommands,
    ...skillCommands,
  ];
}

async function findCommand(
  commandName: string,
  options?: ExecutorOptions,
): Promise<CommandInfo | null> {
  const allCommands = await discoverAllCommands(options);
  return (
    allCommands.find(
      (cmd) => cmd.name.toLowerCase() === commandName.toLowerCase(),
    ) ?? null
  );
}

async function findExactSkill(
  commandName: string,
  options?: ExecutorOptions,
): Promise<LoadedSkill | null> {
  const skills = options?.skills ?? (await discoverAllSkills());
  return (
    skills.find(
      (skill) => skill.name.toLowerCase() === commandName.toLowerCase(),
    ) ?? null
  );
}

async function findSkillSuggestions(
  commandName: string,
  options?: ExecutorOptions,
): Promise<string[]> {
  const normalized = commandName.toLowerCase();
  const skills = options?.skills ?? (await discoverAllSkills());
  const scored = skills.map((skill) => {
    const name = skill.name.toLowerCase();
    const startsWith = name.startsWith(normalized) ? 1 : 0;
    const includes = name.includes(normalized) ? 1 : 0;
    const queryIncludesName = normalized.includes(name) ? 1 : 0;
    const score = startsWith * 3 + includes * 2 + queryIncludesName;
    return { name: skill.name, score };
  });

  return scored
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5)
    .map((candidate) => candidate.name);
}

async function formatCommandTemplate(
  cmd: CommandInfo,
  args: string,
  prefix: "/" | "*" = "/",
): Promise<string> {
  const sections: string[] = [];

  sections.push(`# ${prefix}${cmd.name} Command\n`);

  if (cmd.metadata.description) {
    sections.push(`**Description**: ${cmd.metadata.description}\n`);
  }

  if (args) {
    sections.push(`**User Arguments**: ${args}\n`);
  }

  if (cmd.metadata.model) {
    sections.push(`**Model**: ${cmd.metadata.model}\n`);
  }

  if (cmd.metadata.agent) {
    sections.push(`**Agent**: ${cmd.metadata.agent}\n`);
  }

  sections.push(`**Scope**: ${cmd.scope}\n`);
  sections.push("---\n");
  sections.push("## Command Instructions\n");

  let content = cmd.content || "";
  if (!content && cmd.lazyContentLoader) {
    content = await cmd.lazyContentLoader.load();
  }

  const commandDir = cmd.path ? dirname(cmd.path) : process.cwd();
  const withFileRefs = await resolveFileReferencesInText(content, commandDir);
  const resolvedContent = await resolveCommandsInText(withFileRefs);
  sections.push(resolvedContent.trim());

  if (args) {
    sections.push("\n\n---\n");
    sections.push("## User Request\n");
    sections.push(args);
  }

  return sections.join("\n");
}

export interface ExecuteResult {
  success: boolean;
  replacementText?: string;
  error?: string;
}

export async function executeSlashCommand(
  parsed: ParsedSlashCommand,
  options?: ExecutorOptions,
): Promise<ExecuteResult> {
  if (parsed.prefix === "*") {
    const matchedSkill = await findExactSkill(parsed.command, options);

    if (!matchedSkill) {
      const suggestions = await findSkillSuggestions(parsed.command, options);
      const suggestionText =
        suggestions.length > 0
          ? `Did you mean: ${suggestions.map((name) => `*${name}`).join(", ")}?`
          : "No similar skills found.";
      return {
        success: true,
        replacementText: [
          `Star command \`*${parsed.command}\` did not match an exact skill.`,
          suggestionText,
          "Use the `skill` tool with one of the suggested names, or continue with normal execution.",
        ].join("\n\n"),
      };
    }

    try {
      const template = await formatCommandTemplate(
        skillToCommandInfo(matchedSkill),
        parsed.args,
        "*",
      );
      return {
        success: true,
        replacementText: template,
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to load skill "*${parsed.command}": ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  const command = await findCommand(parsed.command, options);

  if (!command) {
    return {
      success: false,
      error: `Command "/${parsed.command}" not found. Use the slashcommand tool to list available commands.`,
    };
  }

  try {
    const template = await formatCommandTemplate(command, parsed.args);
    return {
      success: true,
      replacementText: template,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to load command "/${parsed.command}": ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
