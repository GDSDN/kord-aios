import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PluginInput } from "@opencode-ai/plugin";
import { createQualityGateValidatorHook } from "./index";

const tempDirs: string[] = [];

function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "quality-gate-validator-"));
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

describe("quality-gate-validator", () => {
  test("non-story file -> no message", async () => {
    const workspace = createTempWorkspace();
    const hook = createQualityGateValidatorHook(createPluginInput(workspace));
    const beforeOutput = { args: { filePath: "src/example.ts" } };
    const afterOutput = {
      title: "Edit",
      output: "File updated",
      metadata: {} as Record<string, unknown>,
    };

    await hook["tool.execute.before"]?.(
      { tool: "edit", sessionID: "s1", callID: "c1" },
      beforeOutput,
    );
    await hook["tool.execute.after"]?.(
      { tool: "edit", sessionID: "s1", callID: "c1" },
      afterOutput,
    );

    expect(afterOutput.output).toBe("File updated");
  });

  test("story READY_FOR_REVIEW + no evidence -> warning appended", async () => {
    const workspace = createTempWorkspace();
    const storyDir = join(workspace, "docs", "stories");
    mkdirSync(storyDir, { recursive: true });
    writeFileSync(
      join(storyDir, "sample-story.md"),
      "# Sample Story\n\nStatus: READY_FOR_REVIEW\n",
    );

    const hook = createQualityGateValidatorHook(createPluginInput(workspace));
    const beforeOutput = { args: { filePath: "docs/stories/sample-story.md" } };
    const afterOutput = {
      title: "Write",
      output: "Story file edited",
      metadata: {} as Record<string, unknown>,
    };

    await hook["tool.execute.before"]?.(
      { tool: "write", sessionID: "s1", callID: "c2" },
      beforeOutput,
    );
    await hook["tool.execute.after"]?.(
      { tool: "write", sessionID: "s1", callID: "c2" },
      afterOutput,
    );

    expect(afterOutput.output).toContain("[Quality Gate Reminder]");
  });

  test("story READY_FOR_REVIEW + evidence present -> no warning", async () => {
    const workspace = createTempWorkspace();
    const storyDir = join(workspace, "docs", "stories");
    mkdirSync(storyDir, { recursive: true });
    writeFileSync(
      join(storyDir, "sample-story.md"),
      "# Sample Story\n\nStatus: READY_FOR_REVIEW\n",
    );

    const hook = createQualityGateValidatorHook(createPluginInput(workspace));
    const beforeOutput = { args: { filePath: "docs/stories/sample-story.md" } };
    const afterOutput = {
      title: "Edit",
      output: "qa completed after typecheck and test",
      metadata: {} as Record<string, unknown>,
    };

    await hook["tool.execute.before"]?.(
      { tool: "edit", sessionID: "s1", callID: "c3" },
      beforeOutput,
    );
    await hook["tool.execute.after"]?.(
      { tool: "edit", sessionID: "s1", callID: "c3" },
      afterOutput,
    );

    expect(afterOutput.output).not.toContain("[Quality Gate Reminder]");
  });
});
