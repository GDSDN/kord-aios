import {
  describe,
  expect,
  test,
  mock,
  beforeEach,
  afterEach,
  spyOn,
} from "bun:test";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install } from "./install";
import * as configManager from "./config-manager";
import type { InstallArgs } from "./types";

// Mock console methods to capture output
const mockConsoleLog = mock(() => {});
const mockConsoleError = mock(() => {});

describe("install CLI - binary check behavior", () => {
  let tempDir: string;
  let originalEnv: string | undefined;
  let detectOpenCodeAvailabilitySpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // given temporary config directory
    tempDir = join(
      tmpdir(),
      `omo-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tempDir, { recursive: true });

    originalEnv = process.env.OPENCODE_CONFIG_DIR;
    process.env.OPENCODE_CONFIG_DIR = tempDir;

    // Reset config context
    configManager.resetConfigContext();
    configManager.initConfigContext("opencode", null);

    // Capture console output
    console.log = mockConsoleLog;
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OPENCODE_CONFIG_DIR = originalEnv;
    } else {
      delete process.env.OPENCODE_CONFIG_DIR;
    }

    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }

    detectOpenCodeAvailabilitySpy?.mockRestore();
  });

  test("non-TUI mode: should show warning but continue when OpenCode binary not found", async () => {
    // given OpenCode binary is NOT installed
    detectOpenCodeAvailabilitySpy = spyOn(
      configManager,
      "detectOpenCodeAvailability",
    ).mockResolvedValue({
      method: "none",
      installed: false,
      available: false,
      version: null,
      command: null,
    });

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    };

    // when running install
    const exitCode = await install(args);

    // then should return success (0), not failure (1)
    expect(exitCode).toBe(0);

    // then should have printed a warning (not error)
    const allCalls = mockConsoleLog.mock.calls.flat().join("\n");
    expect(allCalls).toContain("[!]"); // warning symbol
    expect(allCalls).toContain("OpenCode");
    expect(allCalls).toContain("OpenCode Presence");
    expect(allCalls).toContain("Open-AIOS Plugin/Config Setup");
    expect(allCalls).toContain("Auth/Provider Setup");
  });

  test("non-TUI mode: should create opencode.json with plugin even when binary not found", async () => {
    // given OpenCode binary is NOT installed
    detectOpenCodeAvailabilitySpy = spyOn(
      configManager,
      "detectOpenCodeAvailability",
    ).mockResolvedValue({
      method: "none",
      installed: false,
      available: false,
      version: null,
      command: null,
    });

    // given mock npm fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response),
    ) as unknown as typeof fetch;

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    };

    // when running install
    const exitCode = await install(args);

    // then should create opencode.json
    const configPath = join(tempDir, "opencode.json");
    expect(existsSync(configPath)).toBe(true);

    // then opencode.json should have plugin entry
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    expect(config.plugin).toBeDefined();
    expect(
      config.plugin.some((p: string) => p.includes("oh-my-opencode")),
    ).toBe(true);

    // then exit code should be 0 (success)
    expect(exitCode).toBe(0);
  });

  test("non-TUI mode: should still succeed and complete all steps when binary exists", async () => {
    // given OpenCode binary IS installed
    detectOpenCodeAvailabilitySpy = spyOn(
      configManager,
      "detectOpenCodeAvailability",
    ).mockResolvedValue({
      method: "binary",
      installed: true,
      available: true,
      version: "1.0.200",
      command: "opencode",
    });

    // given mock npm fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response),
    ) as unknown as typeof fetch;

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    };

    // when running install
    const exitCode = await install(args);

    // then should return success
    expect(exitCode).toBe(0);

    // then should have printed success (OK symbol)
    const allCalls = mockConsoleLog.mock.calls.flat().join("\n");
    expect(allCalls).toContain("[OK]");
    expect(allCalls).toContain("OpenCode 1.0.200");
  });

  test("non-TUI mode: should provide bunx guidance when only bunx is available", async () => {
    detectOpenCodeAvailabilitySpy = spyOn(
      configManager,
      "detectOpenCodeAvailability",
    ).mockResolvedValue({
      method: "bunx",
      installed: false,
      available: true,
      version: null,
      command: "bunx opencode",
    });

    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response),
    ) as unknown as typeof fetch;

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    };

    const exitCode = await install(args);

    expect(exitCode).toBe(0);
    const allCalls = mockConsoleLog.mock.calls.flat().join("\n");
    expect(allCalls).toContain("bunx opencode");
    expect(allCalls).toContain("open-aios mcp detect");
    expect(allCalls).toContain("open-aios mcp status");
  });

  test("non-TUI mode: should display complete installer status summary with all sections", async () => {
    // given OpenCode binary IS installed
    detectOpenCodeAvailabilitySpy = spyOn(
      configManager,
      "detectOpenCodeAvailability",
    ).mockResolvedValue({
      method: "binary",
      installed: true,
      available: true,
      version: "1.0.200",
      command: "opencode",
    });

    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "3.0.0" }),
      } as Response),
    ) as unknown as typeof fetch;

    const args: InstallArgs = {
      tui: false,
      claude: "yes",
      openai: "no",
      gemini: "no",
      copilot: "no",
      opencodeZen: "no",
      zaiCodingPlan: "no",
    };

    const exitCode = await install(args);

    expect(exitCode).toBe(0);
    const allCalls = mockConsoleLog.mock.calls.flat().join("\n");

    // Verify all installer status sections are present
    expect(allCalls).toContain("OpenCode Presence");
    expect(allCalls).toContain("Open-AIOS Plugin/Config Setup");
    expect(allCalls).toContain("Auth/Provider Setup");
    expect(allCalls).toContain("Installer Status");
    expect(allCalls).toContain("Optional MCP Follow-up");
    expect(allCalls).toContain("open-aios mcp detect");
    expect(allCalls).toContain("open-aios mcp status");
  });
});
