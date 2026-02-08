import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PluginInput } from "@opencode-ai/plugin";
import { createStoryWorkflowEnforcerHook } from "./index";

const tempDirs: string[] = [];

function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "story-workflow-enforcer-"));
  tempDirs.push(dir);
  return dir;
}

function createPluginInput(directory: string): PluginInput {
  return {
    directory,
    client: {} as PluginInput["client"],
  } as PluginInput;
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe("story-workflow-enforcer", () => {
  test("appends warning when docs/stories has no markdown story", async () => {
    const workspace = createTempWorkspace();
    const hook = createStoryWorkflowEnforcerHook(createPluginInput(workspace));
    const output: { args: Record<string, unknown>; message?: string } = {
      args: { filePath: "src/file.ts" },
    };

    await hook["tool.execute.before"]?.(
      { tool: "write", sessionID: "s1", callID: "c1" },
      output,
    );

    expect(output.message).toContain("[Story Workflow Reminder]");
    expect(output.message).toContain("@plan");
  });

  test("does not append warning when docs/stories/*.md exists", async () => {
    const workspace = createTempWorkspace();
    const storiesDir = join(workspace, "docs", "stories");
    mkdirSync(storiesDir, { recursive: true });
    writeFileSync(join(storiesDir, "story-1.md"), "# Story 1");

    const hook = createStoryWorkflowEnforcerHook(createPluginInput(workspace));
    const output: { args: Record<string, unknown>; message?: string } = {
      args: { filePath: "src/file.ts" },
    };

    await hook["tool.execute.before"]?.(
      { tool: "edit", sessionID: "s1", callID: "c1" },
      output,
    );

    expect(output.message).toBeUndefined();
  });
});
