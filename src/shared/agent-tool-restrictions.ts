/**
 * Agent tool restrictions for session.prompt calls.
 * OpenCode SDK's session.prompt `tools` parameter expects boolean values.
 * true = tool allowed, false = tool denied.
 */

const EXPLORATION_AGENT_DENYLIST: Record<string, boolean> = {
  write: false,
  edit: false,
  task: false,
  call_omo_agent: false,
};

const AGENT_RESTRICTIONS: Record<string, Record<string, boolean>> = {
  explore: EXPLORATION_AGENT_DENYLIST,

  librarian: EXPLORATION_AGENT_DENYLIST,

  oracle: {
    write: false,
    edit: false,
    task: false,
    call_omo_agent: false,
  },

  metis: {
    write: false,
    edit: false,
    task: false,
  },

  momus: {
    write: false,
    edit: false,
    task: false,
  },

  "multimodal-looker": {
    read: true,
  },

  dev: {
    task: false,
  },

  "sisyphus-junior": {
    task: false,
  },

  pm: {
    write: false,
    edit: false,
    bash: false,
    task: false,
    call_omo_agent: false,
  },

  po: {
    write: false,
    edit: false,
    bash: false,
    task: false,
    call_omo_agent: false,
  },

  sm: {
    write: false,
    edit: false,
    bash: false,
    task: false,
    call_omo_agent: false,
  },

  analyst: {
    write: false,
    edit: false,
    bash: false,
    task: false,
    call_omo_agent: false,
  },

  "data-engineer": {
    task: false,
    call_omo_agent: false,
  },

  devops: {
    task: false,
    call_omo_agent: false,
  },

  "ux-design-expert": {
    write: false,
    edit: false,
    bash: false,
    task: false,
    call_omo_agent: false,
  },
};

export function getAgentToolRestrictions(
  agentName: string,
): Record<string, boolean> {
  return (
    AGENT_RESTRICTIONS[agentName] ??
    Object.entries(AGENT_RESTRICTIONS).find(
      ([key]) => key.toLowerCase() === agentName.toLowerCase(),
    )?.[1] ??
    {}
  );
}

export function hasAgentToolRestrictions(agentName: string): boolean {
  const restrictions =
    AGENT_RESTRICTIONS[agentName] ??
    Object.entries(AGENT_RESTRICTIONS).find(
      ([key]) => key.toLowerCase() === agentName.toLowerCase(),
    )?.[1];
  return restrictions !== undefined && Object.keys(restrictions).length > 0;
}
