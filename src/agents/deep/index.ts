import { createKordWorkerAgent, createHephaestusAgent } from "../kord-worker";

export function createDeepAgent(
  ...args: Parameters<typeof createKordWorkerAgent>
) {
  return createKordWorkerAgent(...args);
}
createDeepAgent.mode = createKordWorkerAgent.mode;

// Backward-compatible re-exports for existing import paths.
export { createKordWorkerAgent, createHephaestusAgent };
