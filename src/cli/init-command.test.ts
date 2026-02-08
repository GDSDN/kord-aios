import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

describe("CLI init command wiring", () => {
  it("executes init via CLI in dry-run mode", () => {
    const projectDir = mkdtempSync(path.join(tmpdir(), "open-aios-init-"));
    const repoRoot = path.resolve(import.meta.dir, "../..");

    try {
      const result = Bun.spawnSync({
        cmd: [
          "bun",
          "src/cli/index.ts",
          "init",
          "--dry-run",
          "--directory",
          projectDir,
        ],
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
      });

      const stdout = Buffer.from(result.stdout).toString("utf8");
      const stderr = Buffer.from(result.stderr).toString("utf8");

      expect(result.exitCode).toBe(0);
      expect(stderr).toBe("");
      expect(stdout).toContain("[open-aios init] project:");
      expect(stdout).toContain(
        "[open-aios init] mode: fresh project bootstrap",
      );
      expect(stdout).toContain("docs/stories and docs/prd");
      expect(stdout).toContain("[dry-run]");
      expect(stdout).toContain("[open-aios init] dry-run complete");
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });

  it("reports merge mode when OpenCode markers already exist", () => {
    const projectDir = mkdtempSync(
      path.join(tmpdir(), "open-aios-init-merge-"),
    );
    const repoRoot = path.resolve(import.meta.dir, "../..");

    mkdirSync(path.join(projectDir, ".opencode"), { recursive: true });

    try {
      const result = Bun.spawnSync({
        cmd: [
          "bun",
          "src/cli/index.ts",
          "init",
          "--dry-run",
          "--directory",
          projectDir,
        ],
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
      });

      const stdout = Buffer.from(result.stdout).toString("utf8");
      const stderr = Buffer.from(result.stderr).toString("utf8");

      expect(result.exitCode).toBe(0);
      expect(stderr).toBe("");
      expect(stdout).toContain(
        "[open-aios init] mode: merge (safe merge over existing OpenCode config)",
      );
      expect(stdout).toContain("docs/stories and docs/prd");
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
