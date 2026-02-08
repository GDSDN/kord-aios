import {
  createKordAgent,
  KORD_PROMPT_METADATA,
  createSisyphusAgent,
  SISYPHUS_PROMPT_METADATA,
} from "../kord";

export function createBuildAgent(...args: Parameters<typeof createKordAgent>) {
  return createKordAgent(...args);
}
createBuildAgent.mode = createKordAgent.mode;

export const BUILD_PROMPT_METADATA = KORD_PROMPT_METADATA;

// Backward-compatible re-exports for existing import paths.
export {
  createKordAgent,
  createSisyphusAgent,
  KORD_PROMPT_METADATA,
  SISYPHUS_PROMPT_METADATA,
};
