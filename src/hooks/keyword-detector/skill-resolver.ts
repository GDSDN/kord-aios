/**
 * Skill resolution utilities for star command handling
 * Provides deterministic skill resolution without external dependencies
 */

import type { LoadedSkill } from "../../features/opencode-skill-loader/types";

export interface SkillResolutionResult {
  found: boolean;
  skillName: string;
  exactMatch: boolean;
  suggestion?: string;
}

/**
 * Resolve a skill name against a list of available skills
 * Performs exact match with kebab-case normalization
 */
export function resolveSkillByName(
  skillName: string,
  availableSkills: LoadedSkill[],
): SkillResolutionResult {
  const normalizedInput = normalizeToKebabCase(skillName);

  // Check for exact match
  const exactMatch = availableSkills.find(
    (skill) => normalizeToKebabCase(skill.name) === normalizedInput,
  );

  if (exactMatch) {
    return {
      found: true,
      skillName: exactMatch.name,
      exactMatch: true,
    };
  }

  // Check for partial matches for better suggestions
  const partialMatches = availableSkills.filter((skill) => {
    const normalizedName = normalizeToKebabCase(skill.name);
    return (
      normalizedName.includes(normalizedInput) ||
      normalizedInput.includes(normalizedName) ||
      calculateSimilarity(normalizedInput, normalizedName) > 0.6
    );
  });

  let suggestion: string | undefined;
  if (partialMatches.length > 0) {
    suggestion = partialMatches
      .map((s) => s.name)
      .slice(0, 3)
      .join(", ");
  }

  return {
    found: false,
    skillName: skillName,
    exactMatch: false,
    suggestion,
  };
}

/**
 * Normalize skill name to kebab-case (duplicated from detector.ts for independence)
 */
function normalizeToKebabCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Calculate simple string similarity (Levenshtein-based)
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  const maxLen = Math.max(a.length, b.length);
  return 1 - matrix[b.length][a.length] / maxLen;
}

/**
 * Generate deterministic message for skill execution
 * Provides explicit instructions for the LLM to call the skill tool
 */
export function generateSkillExecutionMessage(skillName: string): string {
  return `## ACTION REQUIRED: Execute Skill Workflow

**Detected Skill:** \`${skillName}\`

**Next Action:**
Call the \`skill\` tool with the following arguments:
\`\`\`json
{
  "name": "${skillName}"
}
\`\`\`

**Instructions:**
1. Execute the skill tool call above to load the skill workflow
2. Review the skill instructions and execute the workflow
3. Report completion when finished`;
}

/**
 * Generate deterministic message for skill not found
 * Provides guidance for skill search
 */
export function generateSkillNotFoundMessage(
  attemptedName: string,
  suggestion?: string,
): string {
  let message = `## SKILL NOT FOUND

**Attempted Skill:** \`${attemptedName}\`

No exact match found for this skill name.

**Suggestions:**
1. Run \`aios_skill_search\` to search for similar skills
2. Verify the skill name is correct`;

  if (suggestion) {
    message += `\n3. Did you mean one of these?\n   - ${suggestion}`;
  }

  return message;
}

/**
 * Get all skill names from available skills list
 */
export function getSkillNames(availableSkills: LoadedSkill[]): string[] {
  return availableSkills.map((skill) => skill.name);
}
