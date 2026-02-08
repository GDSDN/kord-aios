export const AGENT_NAME_MAP: Record<string, string> = {
  // Build runtime variants -> "build"
  omo: "build",
  OmO: "build",
  Sisyphus: "build",
  sisyphus: "build",
  build: "build",

  // Plan runtime variants -> "plan"
  "OmO-Plan": "plan",
  "omo-plan": "plan",
  "Planner-Sisyphus": "plan",
  "planner-sisyphus": "plan",
  "Prometheus (Planner)": "plan",
  prometheus: "plan",
  plan: "plan",
  planner: "plan",

  // Build-loop runtime variants -> "build-loop"
  "orchestrator-sisyphus": "build-loop",
  Atlas: "build-loop",
  atlas: "build-loop",
  "build-loop": "build-loop",

  // Deep runtime variants -> "deep"
  hephaestus: "deep",
  deep: "deep",

  // Kord runtime variants -> "kord"
  kord: "kord",
  "aios-master": "kord",

  // Metis variants → "metis"
  "plan-consultant": "metis",
  "Metis (Plan Consultant)": "metis",
  metis: "metis",

  // Momus variants → "momus"
  "Momus (Plan Reviewer)": "momus",
  momus: "momus",

  // Dev variants → "dev"
  dev: "dev",
  Dev: "dev",
  "Sisyphus-Junior": "dev",
  "sisyphus-junior": "dev",

  // Already lowercase - passthrough
  oracle: "oracle",
  librarian: "librarian",
  explore: "explore",
  "multimodal-looker": "multimodal-looker",
  pm: "pm",
  po: "po",
  sm: "sm",
  analyst: "analyst",
  "data-engineer": "data-engineer",
  devops: "devops",
  "ux-design-expert": "ux-design-expert",
};

export const BUILTIN_AGENT_NAMES = new Set([
  "build", // was "Sisyphus"
  "plan", // was "Prometheus (Planner)"
  "build-loop", // was "Atlas"
  "deep", // was "hephaestus"
  "kord",
  "sisyphus", // compatibility alias
  "prometheus", // compatibility alias
  "atlas", // compatibility alias
  "hephaestus", // compatibility alias
  "aios-master", // compatibility alias
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "metis", // was "Metis (Plan Consultant)"
  "momus", // was "Momus (Plan Reviewer)"
  "dev",
  "sisyphus-junior", // compatibility alias
  "pm",
  "po",
  "sm",
  "analyst",
  "data-engineer",
  "devops",
  "ux-design-expert",
]);

export function migrateAgentNames(agents: Record<string, unknown>): {
  migrated: Record<string, unknown>;
  changed: boolean;
} {
  const migrated: Record<string, unknown> = {};
  let changed = false;

  for (const [key, value] of Object.entries(agents)) {
    const newKey =
      AGENT_NAME_MAP[key.toLowerCase()] ?? AGENT_NAME_MAP[key] ?? key;
    if (newKey !== key) {
      changed = true;
    }
    migrated[newKey] = value;
  }

  return { migrated, changed };
}
