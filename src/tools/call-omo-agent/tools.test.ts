declare const require: (name: string) => any;
const { describe, test, expect } = require("bun:test");

import { createCallOmoAgent } from "./tools";
import { ALLOWED_AGENTS } from "./constants";

const REQUIRED_SPECIALISTS = [
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
] as const;

describe("call-omo-agent specialist policy", () => {
  const baseToolContext = {
    sessionID: "ses_parent",
    messageID: "msg_parent",
    agent: "sisyphus",
    abort: new AbortController().signal,
    directory: "D:/dev/open-aios",
    worktree: "D:/dev/open-aios",
    metadata: async () => {},
    ask: async () => "",
  } as any;

  test("validates allowed new specialists", async () => {
    // given
    for (const specialist of REQUIRED_SPECIALISTS) {
      expect(ALLOWED_AGENTS).toContain(specialist);
    }

    const launchedAgents: string[] = [];
    const manager = {
      launch: async (input: { agent: string }) => {
        launchedAgents.push(input.agent);
        return {
          id: `task-${input.agent}`,
          sessionID: `ses_${input.agent}`,
          description: "delegate",
          agent: input.agent,
          status: "running",
        };
      },
      getTask: () => undefined,
    };

    const ctx = {
      directory: "D:/dev/open-aios",
      client: {
        session: {
          get: async () => ({ data: { directory: "D:/dev/open-aios" } }),
          create: async () => ({ data: { id: "ses_created" } }),
          promptAsync: async () => ({ data: {} }),
          status: async () => ({ data: {} }),
          messages: async () => ({ data: [] }),
        },
      },
    } as any;

    const tool = createCallOmoAgent(ctx, manager as any);
    const toolContext = baseToolContext;

    // when
    for (const specialist of REQUIRED_SPECIALISTS) {
      const result = await tool.execute(
        {
          description: "delegate specialist",
          prompt: "run specialist task",
          subagent_type: specialist,
          run_in_background: true,
        },
        toolContext,
      );
      expect(result).toContain("Background agent task launched successfully.");
    }

    // then
    expect(launchedAgents).toEqual([...REQUIRED_SPECIALISTS]);
  });

  test("invalid agent still rejected with clear error", async () => {
    // given
    const manager = {
      launch: async () => ({
        id: "task-1",
        sessionID: "ses_1",
        description: "delegate",
        agent: "dev",
        status: "running",
      }),
      getTask: () => undefined,
    };
    const ctx = {
      directory: "D:/dev/open-aios",
      client: { session: {} },
    } as any;
    const tool = createCallOmoAgent(ctx, manager as any);

    // when
    const result = await tool.execute(
      {
        description: "invalid specialist",
        prompt: "should fail",
        subagent_type: "not-a-real-agent",
        run_in_background: true,
      },
      baseToolContext,
    );

    // then
    expect(result).toContain('Error: Invalid agent type "not-a-real-agent"');
    expect(result).toContain("Only");
    expect(result).toContain("qa");
    expect(result).toContain("ux-design-expert");
  });

  test("case-insensitive normalization still works", async () => {
    // given
    const launchInputs: Array<{ agent: string }> = [];
    const manager = {
      launch: async (input: { agent: string }) => {
        launchInputs.push(input);
        return {
          id: "task-upper",
          sessionID: "ses_upper",
          description: "delegate",
          agent: input.agent,
          status: "running",
        };
      },
      getTask: () => undefined,
    };
    const ctx = {
      directory: "D:/dev/open-aios",
      client: {
        session: {
          get: async () => ({ data: { directory: "D:/dev/open-aios" } }),
          create: async () => ({ data: { id: "ses_created" } }),
          promptAsync: async () => ({ data: {} }),
          status: async () => ({ data: {} }),
          messages: async () => ({ data: [] }),
        },
      },
    } as any;
    const tool = createCallOmoAgent(ctx, manager as any);

    // when
    const result = await tool.execute(
      {
        description: "upper-case specialist",
        prompt: "normalize agent",
        subagent_type: "DEVOPS",
        run_in_background: true,
      },
      baseToolContext,
    );

    // then
    expect(result).toContain("Background agent task launched successfully.");
    expect(launchInputs).toHaveLength(1);
    expect(launchInputs[0]?.agent).toBe("devops");
  });

  test("task tool remains disabled in sync subagent prompt call path", async () => {
    // given
    const promptCalls: Array<{ body: { tools?: Record<string, boolean> } }> =
      [];
    const manager = {
      launch: async () => ({
        id: "task-1",
        sessionID: "ses_1",
        description: "delegate",
        agent: "architect",
        status: "running",
      }),
      getTask: () => undefined,
    };

    const ctx = {
      directory: "D:/dev/open-aios",
      client: {
        session: {
          get: async () => ({ data: { directory: "D:/dev/open-aios" } }),
          create: async () => ({ data: { id: "ses_sync_child" } }),
          promptAsync: async (input: {
            body: { tools?: Record<string, boolean> };
          }) => {
            promptCalls.push(input);
            return { data: {} };
          },
          status: async () => ({ data: {} }),
          messages: async () => ({ data: [] }),
        },
      },
    } as any;

    const tool = createCallOmoAgent(ctx, manager as any);
    const abortController = new AbortController();
    abortController.abort();

    // when
    const result = await tool.execute(
      {
        description: "sync path restrictions",
        prompt: "run sync",
        subagent_type: "architect",
        run_in_background: false,
      },
      {
        ...baseToolContext,
        abort: abortController.signal,
      },
    );

    // then
    expect(result).toContain("Task aborted");
    expect(promptCalls).toHaveLength(1);
    expect(promptCalls[0]?.body.tools?.task).toBe(false);
  });
});
