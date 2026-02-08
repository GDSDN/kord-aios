import { describe, expect, test } from "bun:test";
import {
  resolveSkillByName,
  generateSkillExecutionMessage,
  generateSkillNotFoundMessage,
  getSkillNames,
} from "./skill-resolver";
import type { LoadedSkill } from "../../features/opencode-skill-loader/types";

function createMockSkill(name: string): LoadedSkill {
  return {
    name,
    path: `/test/skills/${name}/SKILL.md`,
    resolvedPath: `/test/skills/${name}`,
    definition: {
      name,
      description: `Test skill ${name}`,
      template: "Test template",
    },
    scope: "opencode-project",
  };
}

describe("resolveSkillByName", () => {
  const availableSkills = [
    createMockSkill("git-master"),
    createMockSkill("code-review"),
    createMockSkill("playwright"),
    createMockSkill("frontend-ui-ux"),
    createMockSkill("build-component"),
  ];

  test("should find exact match with kebab-case", () => {
    const result = resolveSkillByName("git-master", availableSkills);
    expect(result.found).toBe(true);
    expect(result.exactMatch).toBe(true);
    expect(result.skillName).toBe("git-master");
  });

  test("should normalize mixed-case command", () => {
    const result = resolveSkillByName("GIT-MASTER", availableSkills);
    expect(result.found).toBe(true);
    expect(result.exactMatch).toBe(true);
    expect(result.skillName).toBe("git-master");
  });

  test("should handle underscore separator", () => {
    const result = resolveSkillByName("code_review", availableSkills);
    expect(result.found).toBe(true);
    expect(result.exactMatch).toBe(true);
    expect(result.skillName).toBe("code-review");
  });

  test("should handle space in input", () => {
    const result = resolveSkillByName("frontend ui ux", availableSkills);
    expect(result.found).toBe(true);
    expect(result.exactMatch).toBe(true);
    expect(result.skillName).toBe("frontend-ui-ux");
  });

  test("should return not found for unknown skill", () => {
    const result = resolveSkillByName("unknown-skill", availableSkills);
    expect(result.found).toBe(false);
    expect(result.exactMatch).toBe(false);
  });

  test("should provide suggestions for partial matches", () => {
    const result = resolveSkillByName("build", availableSkills);
    expect(result.found).toBe(false);
    expect(result.suggestion).toBeDefined();
    expect(result.suggestion).toContain("build-component");
  });

  test("should handle empty skills list", () => {
    const result = resolveSkillByName("git-master", []);
    expect(result.found).toBe(false);
    expect(result.exactMatch).toBe(false);
  });

  test("should handle empty skill name", () => {
    const result = resolveSkillByName("", availableSkills);
    expect(result.found).toBe(false);
  });
});

describe("generateSkillExecutionMessage", () => {
  test("should generate deterministic execution message", () => {
    const message = generateSkillExecutionMessage("git-master");
    expect(message).toContain("git-master");
    expect(message).toContain("ACTION REQUIRED");
    expect(message).toContain("skill");
    expect(message).toContain('"name": "git-master"');
  });

  test("should provide explicit tool call instructions", () => {
    const message = generateSkillExecutionMessage("code-review");
    expect(message).toContain("Call the `skill` tool");
    expect(message).toContain("Execute the skill tool call");
    expect(message).toContain("Report completion");
  });

  test("should be consistent for same input", () => {
    const message1 = generateSkillExecutionMessage("test-skill");
    const message2 = generateSkillExecutionMessage("test-skill");
    expect(message1).toBe(message2);
  });
});

describe("generateSkillNotFoundMessage", () => {
  test("should generate not found message", () => {
    const message = generateSkillNotFoundMessage("unknown-skill");
    expect(message).toContain("unknown-skill");
    expect(message).toContain("SKILL NOT FOUND");
    expect(message).toContain("No exact match");
    expect(message).toContain("aios_skill_search");
  });

  test("should include suggestions when provided", () => {
    const message = generateSkillNotFoundMessage("build", "build-component");
    expect(message).toContain("Did you mean");
    expect(message).toContain("build-component");
  });

  test("should be consistent for same input", () => {
    const message1 = generateSkillNotFoundMessage("test-unknown");
    const message2 = generateSkillNotFoundMessage("test-unknown");
    expect(message1).toBe(message2);
  });

  test("should handle multiple suggestions", () => {
    const message = generateSkillNotFoundMessage(
      "test",
      "build-component, code-review, git-master",
    );
    expect(message).toContain("build-component");
    expect(message).toContain("code-review");
    expect(message).toContain("git-master");
  });
});

describe("getSkillNames", () => {
  test("should extract all skill names", () => {
    const skills = [
      createMockSkill("git-master"),
      createMockSkill("code-review"),
    ];
    const names = getSkillNames(skills);
    expect(names).toEqual(["git-master", "code-review"]);
  });

  test("should handle empty list", () => {
    const names = getSkillNames([]);
    expect(names).toEqual([]);
  });
});
