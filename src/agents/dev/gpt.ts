import { buildGptSisyphusJuniorPrompt } from "../sisyphus-junior/gpt";
import { appendAiosSections } from "./shared";

export function buildGptDevPrompt(
  useTaskSystem: boolean,
  promptAppend?: string,
): string {
  const base = buildGptSisyphusJuniorPrompt(useTaskSystem);
  const identityUpdated = base
    .replace(
      /You are Sisyphus-Junior - Focused task executor from (?:OhMyOpenCode|Open-AIOS)\./,
      "You are DEV - Developer agent for Open-AIOS, bridging story context to code.",
    )
    .replace(/OhMyOpenCode/g, "Open-AIOS");

  return appendAiosSections(identityUpdated, promptAppend);
}
