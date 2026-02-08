import type { Hooks, PluginInput } from "@opencode-ai/plugin";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const TARGET_TOOLS = new Set(["write", "edit"]);

const STORY_WARNING = [
  "",
  "[Story Workflow Reminder]",
  "No story found at docs/stories/*.md for this workspace.",
  "Please create or link a story via @plan before making file changes.",
  "",
].join("\n");

function hasStoryFile(workspaceDir: string): boolean {
  const storiesDir = join(workspaceDir, "docs", "stories");

  if (!existsSync(storiesDir)) {
    return false;
  }

  try {
    return readdirSync(storiesDir, { withFileTypes: true }).some(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"),
    );
  } catch {
    return false;
  }
}

export function createStoryWorkflowEnforcerHook(ctx: PluginInput): Hooks {
  return {
    "tool.execute.before": async (
      input,
      output: { args: Record<string, unknown>; message?: string },
    ) => {
      if (!TARGET_TOOLS.has(input.tool.toLowerCase())) {
        return;
      }

      if (hasStoryFile(ctx.directory)) {
        return;
      }

      output.message = (output.message ?? "") + STORY_WARNING;
    },
  };
}
