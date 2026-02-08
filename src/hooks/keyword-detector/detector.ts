import {
  KEYWORD_DETECTORS,
  CODE_BLOCK_PATTERN,
  INLINE_CODE_PATTERN,
} from "./constants";

export interface DetectedKeyword {
  type: "ultrawork" | "search" | "analyze";
  message: string;
}

/**
 * Detected star command for skill workflow invocation
 */
export interface DetectedStarCommand {
  command: string;
  normalizedName: string;
}

/**
 * Pattern to detect star commands (e.g., *skill-name)
 */
export const STAR_COMMAND_PATTERN = /^\*(\S+)/;

/**
 * Normalize skill name to kebab-case
 */
export function normalizeToKebabCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Detect star commands in user input
 */
export function detectStarCommand(text: string): DetectedStarCommand | null {
  const match = text.match(STAR_COMMAND_PATTERN);
  if (!match) {
    return null;
  }
  const command = match[1];
  const normalizedName = normalizeToKebabCase(command);
  return { command, normalizedName };
}

export function removeCodeBlocks(text: string): string {
  return text.replace(CODE_BLOCK_PATTERN, "").replace(INLINE_CODE_PATTERN, "");
}

/**
 * Resolves message to string, handling both static strings and dynamic functions.
 */
function resolveMessage(
  message: string | ((agentName?: string, modelID?: string) => string),
  agentName?: string,
  modelID?: string,
): string {
  return typeof message === "function" ? message(agentName, modelID) : message;
}

export function detectKeywords(
  text: string,
  agentName?: string,
  modelID?: string,
): string[] {
  const textWithoutCode = removeCodeBlocks(text);
  return KEYWORD_DETECTORS.filter(({ pattern }) =>
    pattern.test(textWithoutCode),
  ).map(({ message }) => resolveMessage(message, agentName, modelID));
}

export function detectKeywordsWithType(
  text: string,
  agentName?: string,
  modelID?: string,
): DetectedKeyword[] {
  const textWithoutCode = removeCodeBlocks(text);
  const types: Array<"ultrawork" | "search" | "analyze"> = [
    "ultrawork",
    "search",
    "analyze",
  ];
  return KEYWORD_DETECTORS.map(({ pattern, message }, index) => ({
    matches: pattern.test(textWithoutCode),
    type: types[index],
    message: resolveMessage(message, agentName, modelID),
  }))
    .filter((result) => result.matches)
    .map(({ type, message }) => ({ type, message }));
}

export function extractPromptText(
  parts: Array<{ type: string; text?: string }>,
): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join(" ");
}
