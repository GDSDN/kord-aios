import type { Hooks, PluginInput } from "@opencode-ai/plugin";
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const TARGET_TOOLS = new Set(["write", "edit", "task"]);
const WRITE_EDIT_TOOLS = new Set(["write", "edit"]);
const STORY_STATUS_PATTERN = /\b(READY_FOR_REVIEW|APPROVED)\b/i;
const EVIDENCE_PATTERN = /\b(typecheck|test|qa)\b/i;
const WARNING_MARKER = "[Quality Gate Reminder]";
const QUALITY_GATE_WARNING = [
  "",
  WARNING_MARKER,
  "Story status is READY_FOR_REVIEW/APPROVED but recent output has no QA evidence (typecheck/test/qa).",
  "Run the QA gate now and attach evidence before finalizing.",
  "",
].join("\n");

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function isStoryFilePath(filePath: string): boolean {
  return /(^|\/)docs\/stories\/[^/]+\.md$/i.test(normalizePath(filePath));
}

function toAbsolutePath(workspaceDir: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(workspaceDir, filePath);
}

function extractStoryPathFromOutput(output: string): string | undefined {
  const pathMatch = output.match(
    /([\w./-]*docs[\\/]stories[\\/][^\s'"`]+\.md)/i,
  );
  return pathMatch?.[1];
}

function readStoryHasQaGateStatus(
  workspaceDir: string,
  filePath: string,
): boolean {
  const fullPath = toAbsolutePath(workspaceDir, filePath);
  const storyContent = readFileSync(fullPath, "utf8");
  return STORY_STATUS_PATTERN.test(storyContent);
}

export function createQualityGateValidatorHook(ctx: PluginInput): Hooks {
  const pendingFilePaths = new Map<string, string>();
  const recentOutputBySession = new Map<string, string>();

  return {
    "tool.execute.before": async (
      input,
      output: { args: Record<string, unknown> },
    ) => {
      if (!WRITE_EDIT_TOOLS.has(input.tool.toLowerCase())) {
        return;
      }

      const filePath = (output.args.filePath ??
        output.args.path ??
        output.args.file) as string | undefined;

      if (!filePath || !input.callID) {
        return;
      }

      pendingFilePaths.set(input.callID, filePath);
    },

    "tool.execute.after": async (
      input,
      output:
        | { output?: string; metadata?: Record<string, unknown> }
        | undefined,
    ) => {
      try {
        if (!output || !TARGET_TOOLS.has(input.tool.toLowerCase())) {
          return;
        }

        const currentOutput =
          typeof output.output === "string" ? output.output : "";
        const previousOutput = recentOutputBySession.get(input.sessionID) ?? "";
        const recentOutput = `${previousOutput}\n${currentOutput}`.slice(-4000);
        recentOutputBySession.set(input.sessionID, recentOutput);

        if (EVIDENCE_PATTERN.test(recentOutput)) {
          return;
        }

        let targetPath: string | undefined;
        if (WRITE_EDIT_TOOLS.has(input.tool.toLowerCase())) {
          targetPath = input.callID
            ? pendingFilePaths.get(input.callID)
            : undefined;
          if (input.callID) {
            pendingFilePaths.delete(input.callID);
          }
          if (!targetPath) {
            targetPath = output.metadata?.filePath as string | undefined;
          }
        } else {
          targetPath = extractStoryPathFromOutput(currentOutput);
        }

        if (!targetPath || !isStoryFilePath(targetPath)) {
          return;
        }

        if (!readStoryHasQaGateStatus(ctx.directory, targetPath)) {
          return;
        }

        if (!currentOutput.includes(WARNING_MARKER)) {
          output.output = `${currentOutput}${QUALITY_GATE_WARNING}`;
        }
      } catch {
        return;
      }
    },
  };
}
