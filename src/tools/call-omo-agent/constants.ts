export const ALLOWED_AGENTS = [
  "qa",
  "architect",
  "dev",
  "analyst",
  "pm",
  "po",
  "sm",
  "data-engineer",
  "devops",
  "ux-design-expert",
  "explore",
  "librarian",
  "oracle",
  "hephaestus",
  "metis",
  "momus",
  "multimodal-looker",
] as const;

export const CALL_OMO_AGENT_DESCRIPTION = `Spawn specialized subagent for story-driven delegation. run_in_background REQUIRED (true=async with task_id, false=sync).

Available: {agents}

Pass \`session_id=<id>\` to continue previous agent with full context. Prompts MUST be in English. Use \`background_output\` for async results.`;
