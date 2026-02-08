import { buildDefaultSisyphusJuniorPrompt } from "../sisyphus-junior/default";
import { appendAiosSections } from "./shared";

export function buildDefaultDevPrompt(
  useTaskSystem: boolean,
  promptAppend?: string,
): string {
  const base = buildDefaultSisyphusJuniorPrompt(useTaskSystem);
  const identityUpdated = base
    .replace(
      /Sisyphus-Junior - Focused executor from (?:OhMyOpenCode|Open-AIOS)\./,
      "DEV - Developer agent for Open-AIOS.",
    )
    .replace(/OhMyOpenCode/g, "Open-AIOS");

  return appendAiosSections(identityUpdated, promptAppend);
}
