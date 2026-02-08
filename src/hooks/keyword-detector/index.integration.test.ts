import { describe, expect, test, beforeEach } from "bun:test";
import { detectStarCommand } from "./detector";
import {
  resolveSkillByName,
  generateSkillExecutionMessage,
  generateSkillNotFoundMessage,
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

describe("star command integration - exact match path", () => {
  const availableSkills = [
    createMockSkill("git-master"),
    createMockSkill("code-review"),
    createMockSkill("playwright"),
  ];

  test("*git-master should resolve to git-master skill", () => {
    const starCommand = detectStarCommand("*git-master help");
    expect(starCommand).not.toBeNull();
    expect(starCommand!.command).toBe("git-master");

    const resolution = resolveSkillByName(
      starCommand!.normalizedName,
      availableSkills,
    );
    expect(resolution.found).toBe(true);
    expect(resolution.exactMatch).toBe(true);
    expect(resolution.skillName).toBe("git-master");
  });

  test("exact match should generate execution message", () => {
    const starCommand = detectStarCommand("*code-review");
    expect(starCommand).not.toBeNull();

    const resolution = resolveSkillByName(
      starCommand!.normalizedName,
      availableSkills,
    );
    expect(resolution.found).toBe(true);

    const message = generateSkillExecutionMessage(resolution.skillName);
    expect(message).toContain("code-review");
    expect(message).toContain("ACTION REQUIRED");
    expect(message).toContain('"name": "code-review"');
  });

  test("case-insensitive match should work", () => {
    const starCommand = detectStarCommand("*GIT-MASTER");
    expect(starCommand).not.toBeNull();

    const resolution = resolveSkillByName(
      starCommand!.normalizedName,
      availableSkills,
    );
    expect(resolution.found).toBe(true);
    expect(resolution.exactMatch).toBe(true);
  });

  test("underscore normalization should work", () => {
    const starCommand = detectStarCommand("*code_review");
    expect(starCommand).not.toBeNull();
    expect(starCommand!.normalizedName).toBe("code-review");

    const resolution = resolveSkillByName(
      starCommand!.normalizedName,
      availableSkills,
    );
    expect(resolution.found).toBe(true);
  });
});

describe("star command integration - non-match path", () => {
  const availableSkills = [
    createMockSkill("git-master"),
    createMockSkill("build-component"),
  ];

  test("*unknown should generate not-found message", () => {
    const starCommand = detectStarCommand("*unknown-skill");
    expect(starCommand).not.toBeNull();

    const resolution = resolveSkillByName(
      starCommand!.normalizedName,
      availableSkills,
    );
    expect(resolution.found).toBe(false);
    expect(resolution.exactMatch).toBe(false);

    const message = generateSkillNotFoundMessage(
      starCommand!.normalizedName,
      resolution.suggestion,
    );
    expect(message).toContain("SKILL NOT FOUND");
    expect(message).toContain("unknown-skill");
    expect(message).toContain("aios_skill_search");
  });

  test("non-match should provide suggestions for similar skills", () => {
    const starCommand = detectStarCommand("*build");
    expect(starCommand).not.toBeNull();

    const resolution = resolveSkillByName(
      starCommand!.normalizedName,
      availableSkills,
    );
    expect(resolution.found).toBe(false);
    expect(resolution.suggestion).toBeDefined();
    expect(resolution.suggestion).toContain("build-component");
  });

  test("empty skills list should generate not-found", () => {
    const starCommand = detectStarCommand("*git-master");
    expect(starCommand).not.toBeNull();

    const resolution = resolveSkillByName(starCommand!.normalizedName, []);
    expect(resolution.found).toBe(false);

    const message = generateSkillNotFoundMessage(starCommand!.normalizedName);
    expect(message).toContain("SKILL NOT FOUND");
  });
});

describe("end-to-end star command flow", () => {
  test("complete flow: detect -> resolve -> generate message (exact match)", () => {
    const input = "*git-master commit my changes";
    const starCommand = detectStarCommand(input);

    expect(starCommand).not.toBeNull();
    expect(starCommand!.command).toBe("git-master");

    const availableSkills = [createMockSkill("git-master")];
    const resolution = resolveSkillByName(
      starCommand!.normalizedName,
      availableSkills,
    );

    expect(resolution.found).toBe(true);
    expect(resolution.exactMatch).toBe(true);

    const message = generateSkillExecutionMessage(resolution.skillName);

    // Verify message contains key elements
    expect(message).toContain("ACTION REQUIRED");
    expect(message).toContain("git-master");
    expect(message).toContain("skill");
    expect(message).toContain('"name": "git-master"');
    expect(message).toContain("Execute the skill tool call");
  });

  test("complete flow: detect -> resolve -> generate message (not found)", () => {
    const input = "*unknown command";
    const starCommand = detectStarCommand(input);

    expect(starCommand).not.toBeNull();
    expect(starCommand!.command).toBe("unknown");

    const availableSkills = [createMockSkill("git-master")];
    const resolution = resolveSkillByName(
      starCommand!.normalizedName,
      availableSkills,
    );

    expect(resolution.found).toBe(false);
    expect(resolution.exactMatch).toBe(false);

    const message = generateSkillNotFoundMessage(
      starCommand!.normalizedName,
      resolution.suggestion,
    );

    expect(message).toContain("SKILL NOT FOUND");
    expect(message).toContain("unknown");
    expect(message).toContain("aios_skill_search");
  });
});
