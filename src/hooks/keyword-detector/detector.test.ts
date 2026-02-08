import { describe, expect, test } from "bun:test";
import {
  normalizeToKebabCase,
  detectStarCommand,
  STAR_COMMAND_PATTERN,
} from "./detector";

describe("normalizeToKebabCase", () => {
  test("should convert to lowercase", () => {
    expect(normalizeToKebabCase("HELLO")).toBe("hello");
    expect(normalizeToKebabCase("Hello")).toBe("hello");
  });

  test("should replace spaces with hyphens", () => {
    expect(normalizeToKebabCase("hello world")).toBe("hello-world");
  });

  test("should replace underscores with hyphens", () => {
    expect(normalizeToKebabCase("hello_world")).toBe("hello-world");
  });

  test("should remove special characters except hyphens", () => {
    expect(normalizeToKebabCase("hello@world#test")).toBe("helloworldtest");
  });

  test("should handle mixed case with special characters", () => {
    expect(normalizeToKebabCase("Code_Review Tool")).toBe("code-review-tool");
  });

  test("should trim whitespace", () => {
    expect(normalizeToKebabCase("  my-skill  ")).toBe("my-skill");
  });

  test("should handle already kebab-case", () => {
    expect(normalizeToKebabCase("git-master")).toBe("git-master");
  });

  test("should handle empty string", () => {
    expect(normalizeToKebabCase("")).toBe("");
  });
});

describe("detectStarCommand", () => {
  test("should detect star command at start", () => {
    const result = detectStarCommand("*code-review");
    expect(result).not.toBeNull();
    expect(result!.command).toBe("code-review");
    expect(result!.normalizedName).toBe("code-review");
  });

  test("should normalize mixed-case command", () => {
    const result = detectStarCommand("*Code_Review");
    expect(result).not.toBeNull();
    expect(result!.command).toBe("Code_Review");
    expect(result!.normalizedName).toBe("code-review");
  });

  test("should return null when no star at start", () => {
    expect(detectStarCommand("not a command")).toBeNull();
    expect(detectStarCommand(" *hidden")).toBeNull();
  });

  test("should return null for empty string", () => {
    expect(detectStarCommand("")).toBeNull();
  });

  test("should extract command after star", () => {
    const result = detectStarCommand("*git-master do something");
    expect(result).not.toBeNull();
    expect(result!.command).toBe("git-master");
    expect(result!.normalizedName).toBe("git-master");
  });

  test("should handle multi-word command with spaces after star", () => {
    const result = detectStarCommand("*playwright install");
    expect(result).not.toBeNull();
    expect(result!.command).toBe("playwright");
    expect(result!.normalizedName).toBe("playwright");
  });
});

describe("STAR_COMMAND_PATTERN", () => {
  test("should match star followed by non-whitespace", () => {
    expect("*skill").toMatch(STAR_COMMAND_PATTERN);
    expect("*my-skill-name").toMatch(STAR_COMMAND_PATTERN);
  });

  test("should not match without star", () => {
    expect("skill").not.toMatch(STAR_COMMAND_PATTERN);
    expect(" *skill").not.toMatch(STAR_COMMAND_PATTERN);
  });

  test("should not match just star", () => {
    expect("*").not.toMatch(STAR_COMMAND_PATTERN);
  });
});
