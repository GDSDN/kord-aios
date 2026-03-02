import {
  createBuiltinAgents,
  createPlanAnalyzerAgent,
  createPlanReviewerAgent,
} from "../agents";
import { createDevJuniorAgentWithOverrides } from "../agents/dev-junior";
import { loadAllSquads } from "../features/squad/loader";
import { createAllSquadAgentConfigs, buildSquadPromptSection } from "../features/squad/factory";
import {
  loadUserCommands,
  loadProjectCommands,
  loadOpencodeGlobalCommands,
  loadOpencodeProjectCommands,
} from "../features/claude-code-command-loader";
import { loadBuiltinCommands } from "../features/builtin-commands";
import {
  loadUserSkills,
  loadProjectSkills,
  loadOpencodeGlobalSkills,
  loadOpencodeProjectSkills,
  discoverUserClaudeSkills,
  discoverProjectClaudeSkills,
  discoverOpencodeGlobalSkills,
  discoverOpencodeProjectSkills,
} from "../features/opencode-skill-loader";
import {
  loadUserAgents,
  loadProjectAgents,
} from "../features/claude-code-agent-loader";
import { loadOpenCodeAgents } from "../features/opencode-agent-loader/loader";
import { loadMcpConfigs } from "../features/claude-code-mcp-loader";
import { loadAllPluginComponents } from "../features/claude-code-plugin-loader";
import { createBuiltinMcps } from "../mcp";
import type { OhMyOpenCodeConfig } from "../config";
import { log, fetchAvailableModels, readConnectedProvidersCache, resolveModelPipeline } from "../shared";
import { join } from "node:path";
import { getOpenCodeConfigPaths, getOpenCodeConfigDir } from "../shared/opencode-config-dir";
import { migrateAgentConfig } from "../shared/permission-compat";
import { AGENT_NAME_MAP } from "../shared/migration";
import { AGENT_MODEL_REQUIREMENTS } from "../shared/model-requirements";
import { PLAN_SYSTEM_PROMPT, PLAN_PERMISSION } from "../agents/planner";
import { DEFAULT_CATEGORIES } from "../tools/delegate-task/constants";
import type { ModelCacheState } from "../plugin-state";
import type { CategoryConfig } from "../config/schema";

function pickFirstFallbackModel(requirement: { fallbackChain: { providers: string[]; model: string }[] } | undefined): string | undefined {
  const first = requirement?.fallbackChain?.[0]
  const provider = first?.providers?.[0]
  const model = first?.model
  if (!provider || !model) return undefined
  return `${provider}/${model}`
}

export interface ConfigHandlerDeps {
  ctx: { directory: string; client?: any };
  pluginConfig: OhMyOpenCodeConfig;
  modelCacheState: ModelCacheState;
}

export function resolveCategoryConfig(
  categoryName: string,
  userCategories?: Record<string, CategoryConfig>
): CategoryConfig | undefined {
  return userCategories?.[categoryName] ?? DEFAULT_CATEGORIES[categoryName];
}

const CORE_AGENT_ORDER = ["kord", "dev", "planner", "builder"] as const;

/**
 * T0 agents that cannot be overridden by OpenCode agent files.
 * These are core orchestration agents managed by Kord AIOS.
 */
const T0_AGENTS = new Set(["kord", "dev", "builder", "planner"]);

/**
 * Filter out T0 agents from OpenCode agent configs.
 * T0 agents (kord, dev, builder, planner) are managed by Kord AIOS
 * and cannot be overridden via .opencode/agents/*.md files.
 */
function filterT0Agents(agents: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(agents)) {
    if (!T0_AGENTS.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Load OpenCode agents from user global directory (~/.config/opencode/agents/)
 * with T0 agents filtered out.
 */
function loadOpenCodeUserAgents(): Record<string, unknown> {
  const userAgentsDir = join(getOpenCodeConfigDir({ binary: "opencode", checkExisting: false }), "agents");
  const agents = loadOpenCodeAgents(userAgentsDir);
  return filterT0Agents(agents);
}

/**
 * Load OpenCode agents from project directory (.opencode/agents/)
 * with T0 agents filtered out.
 */
function loadOpenCodeProjectAgents(projectDir: string): Record<string, unknown> {
  const projectAgentsDir = join(projectDir, ".opencode", "agents");
  const agents = loadOpenCodeAgents(projectAgentsDir);
  return filterT0Agents(agents);
}

function reorderAgentsByPriority(agents: Record<string, unknown>): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  const seen = new Set<string>();

  for (const key of CORE_AGENT_ORDER) {
    if (Object.prototype.hasOwnProperty.call(agents, key)) {
      ordered[key] = agents[key];
      seen.add(key);
    }
  }

  for (const [key, value] of Object.entries(agents)) {
    if (!seen.has(key)) {
      ordered[key] = value;
    }
  }

  return ordered;
}

export function createConfigHandler(deps: ConfigHandlerDeps) {
  const { ctx, pluginConfig, modelCacheState } = deps;

  return async (config: Record<string, unknown>) => {
    type ProviderConfig = {
      options?: { headers?: Record<string, string> };
      models?: Record<string, { limit?: { context?: number } }>;
    };
    const providers = config.provider as
      | Record<string, ProviderConfig>
      | undefined;

    const anthropicBeta =
      providers?.anthropic?.options?.headers?.["anthropic-beta"];
    modelCacheState.anthropicContext1MEnabled =
      anthropicBeta?.includes("context-1m") ?? false;

    if (providers) {
      for (const [providerID, providerConfig] of Object.entries(providers)) {
        const models = providerConfig?.models;
        if (models) {
          for (const [modelID, modelConfig] of Object.entries(models)) {
            const contextLimit = modelConfig?.limit?.context;
            if (contextLimit) {
              modelCacheState.modelContextLimitsCache.set(
                `${providerID}/${modelID}`,
                contextLimit
              );
            }
          }
        }
      }
    }

    const pluginComponents = (pluginConfig.claude_code?.plugins ?? true)
      ? await loadAllPluginComponents({
          enabledPluginsOverride: pluginConfig.claude_code?.plugins_override,
        })
      : {
          commands: {},
          skills: {},
          agents: {},
          mcpServers: {},
          hooksConfigs: [],
          plugins: [],
          errors: [],
        };

    if (pluginComponents.plugins.length > 0) {
      log(`Loaded ${pluginComponents.plugins.length} Claude Code plugins`, {
        plugins: pluginComponents.plugins.map((p) => `${p.name}@${p.version}`),
      });
    }

    if (pluginComponents.errors.length > 0) {
      log(`Plugin load errors`, { errors: pluginComponents.errors });
    }

    // Migrate disabled_agents from old names to new names
    const migratedDisabledAgents: string[] = (pluginConfig.disabled_agents ?? []).map(agent => {
      return AGENT_NAME_MAP[agent.toLowerCase()] ?? AGENT_NAME_MAP[agent] ?? agent
    })

    const includeClaudeSkillsForAwareness = pluginConfig.claude_code?.skills ?? true;
    const [
      discoveredUserSkills,
      discoveredProjectSkills,
      discoveredOpencodeGlobalSkills,
      discoveredOpencodeProjectSkills,
    ] = await Promise.all([
      includeClaudeSkillsForAwareness ? discoverUserClaudeSkills() : Promise.resolve([]),
      includeClaudeSkillsForAwareness ? discoverProjectClaudeSkills() : Promise.resolve([]),
      discoverOpencodeGlobalSkills(),
      discoverOpencodeProjectSkills(),
    ]);

    const allDiscoveredSkills = [
      ...discoveredOpencodeProjectSkills,
      ...discoveredProjectSkills,
      ...discoveredOpencodeGlobalSkills,
      ...discoveredUserSkills,
    ];

    const browserProvider = pluginConfig.browser_automation_engine?.provider ?? "playwright";
    // config.model represents the currently active model in OpenCode (including UI selection)
    // Pass it as uiSelectedModel so it takes highest priority in model resolution
    const currentModel = config.model as string | undefined;
    const disabledSkills = new Set<string>(pluginConfig.disabled_skills ?? []);

    // Load squads early so they can be passed to createBuiltinAgents
    const squadLoadResult = loadAllSquads(ctx.directory);

    const builtinAgents = await createBuiltinAgents(
      migratedDisabledAgents,
      pluginConfig.agents,
      ctx.directory,
      undefined, // systemDefaultModel - let fallback chain handle this
      pluginConfig.categories,
      pluginConfig.git_master,
      allDiscoveredSkills,
      ctx.client,
      browserProvider,
      currentModel, // uiSelectedModel - takes highest priority
      disabledSkills,
      squadLoadResult.squads
    );

    // Claude Code agents: Do NOT apply permission migration
    // Claude Code uses whitelist-based tools format which is semantically different
    // from OpenCode's denylist-based permission system
    const userAgents = (pluginConfig.claude_code?.agents ?? true)
      ? loadUserAgents()
      : {};
    const projectAgents = (pluginConfig.claude_code?.agents ?? true)
      ? loadProjectAgents()
      : {};

    // Plugin agents: Apply permission migration for compatibility
    const rawPluginAgents = pluginComponents.agents;
    const pluginAgents = Object.fromEntries(
      Object.entries(rawPluginAgents).map(([k, v]) => [
        k,
        v ? migrateAgentConfig(v as Record<string, unknown>) : v,
      ])
    );

    // OpenCode agents: Load from user global and project directories
    // Do NOT apply migrateAgentConfig() - OpenCode agents use their own format
    // T0 agents (kord, dev, builder, planner) are filtered out in the loader functions
    const openCodeUserAgents = loadOpenCodeUserAgents();
    const openCodeProjectAgents = loadOpenCodeProjectAgents(ctx.directory);

    log(`[config-handler] Loaded OpenCode agents: ${Object.keys(openCodeUserAgents).length} user, ${Object.keys(openCodeProjectAgents).length} project`, {
      userAgents: Object.keys(openCodeUserAgents),
      projectAgents: Object.keys(openCodeProjectAgents),
    });

    const isKordEnabled = pluginConfig.kord_agent?.disabled !== true;
    const builderEnabled =
      pluginConfig.kord_agent?.default_builder_enabled ?? false;
    const plannerEnabled =
      pluginConfig.kord_agent?.planner_enabled ?? true;
    const replacePlan = pluginConfig.kord_agent?.replace_plan ?? true;
    const shouldDemotePlan = plannerEnabled && replacePlan;

    type AgentConfig = Record<
      string,
      Record<string, unknown> | undefined
    > & {
      build?: Record<string, unknown>;
      plan?: Record<string, unknown>;
      explore?: { tools?: Record<string, unknown> };
      librarian?: { tools?: Record<string, unknown> };
      vision?: { tools?: Record<string, unknown> };
      builder?: { tools?: Record<string, unknown> };
      kord?: { tools?: Record<string, unknown> };
    };
    const configAgent = config.agent as AgentConfig | undefined;

    if (isKordEnabled && builtinAgents.kord) {
      (config as { default_agent?: string }).default_agent = "kord";

      const agentConfig: Record<string, unknown> = {
        kord: builtinAgents.kord,
      };

      agentConfig["dev-junior"] = createDevJuniorAgentWithOverrides(
        pluginConfig.agents?.["dev-junior"],
        undefined
      );

      if (builderEnabled) {
        const { name: _buildName, ...buildConfigWithoutName } =
          configAgent?.build ?? {};
        const migratedBuildConfig = migrateAgentConfig(
          buildConfigWithoutName as Record<string, unknown>
        );
        const openCodeBuilderOverride =
          pluginConfig.agents?.["OpenCode-Builder"];
        const openCodeBuilderBase = {
          ...migratedBuildConfig,
          description: `${configAgent?.build?.description ?? "Build agent"} (OpenCode default)`,
        };

        agentConfig["OpenCode-Builder"] = openCodeBuilderOverride
          ? { ...openCodeBuilderBase, ...openCodeBuilderOverride }
          : openCodeBuilderBase;
      }

      if (plannerEnabled) {
        const planOverride =
          pluginConfig.agents?.["planner"] as
            | (Record<string, unknown> & {
                category?: string
                model?: string
                variant?: string
                reasoningEffort?: string
                textVerbosity?: string
                thinking?: { type: string; budgetTokens?: number }
                temperature?: number
                top_p?: number
                maxTokens?: number
              })
            | undefined;

        const categoryConfig = planOverride?.category
          ? resolveCategoryConfig(
              planOverride.category,
              pluginConfig.categories
            )
          : undefined;

        const planRequirement = AGENT_MODEL_REQUIREMENTS["planner"];
        const connectedProviders = readConnectedProvidersCache();
        // IMPORTANT: Do NOT pass ctx.client to fetchAvailableModels during plugin initialization.
        // Calling client API (e.g., client.provider.list()) from config handler causes deadlock:
        // - Plugin init waits for server response
        // - Server waits for plugin init to complete before handling requests
        // Use cache-only mode instead. If cache is unavailable, fallback chain uses first model.
        const availableModels = await fetchAvailableModels(undefined, {
          connectedProviders: connectedProviders ?? undefined,
        });

        const modelResolution = resolveModelPipeline({
          intent: {
            uiSelectedModel: currentModel,
            userModel: planOverride?.model ?? categoryConfig?.model,
          },
          constraints: { availableModels },
          policy: {
            fallbackChain: planRequirement?.fallbackChain,
            systemDefaultModel: undefined,
          },
        });
        const resolvedModel = modelResolution?.model;
        const resolvedVariant = modelResolution?.variant;

        const variantToUse = planOverride?.variant ?? resolvedVariant;
        const reasoningEffortToUse = planOverride?.reasoningEffort ?? categoryConfig?.reasoningEffort;
        const textVerbosityToUse = planOverride?.textVerbosity ?? categoryConfig?.textVerbosity;
        const thinkingToUse = planOverride?.thinking ?? categoryConfig?.thinking;
        const temperatureToUse = planOverride?.temperature ?? categoryConfig?.temperature;
        const topPToUse = planOverride?.top_p ?? categoryConfig?.top_p;
        const maxTokensToUse = planOverride?.maxTokens ?? categoryConfig?.maxTokens;

        // Inject squad awareness into planner prompt
        const squadSection = buildSquadPromptSection(squadLoadResult.squads)
        const plannerPrompt = squadSection
          ? PLAN_SYSTEM_PROMPT + `\n\n<Squad_Awareness>\n${squadSection}\n</Squad_Awareness>`
          : PLAN_SYSTEM_PROMPT

        const planBase = {
          name: "planner",
          ...(resolvedModel ? { model: resolvedModel } : {}),
          ...(variantToUse ? { variant: variantToUse } : {}),
          mode: "all" as const,
          prompt: plannerPrompt,
          permission: PLAN_PERMISSION,
          description: `${configAgent?.plan?.description ?? "Planner agent"} (Planner - Kord AIOS)`,
          color: (configAgent?.plan?.color as string) ?? "#FF5722", // Deep Orange - Fire/Flame theme
          ...(temperatureToUse !== undefined ? { temperature: temperatureToUse } : {}),
          ...(topPToUse !== undefined ? { top_p: topPToUse } : {}),
          ...(maxTokensToUse !== undefined ? { maxTokens: maxTokensToUse } : {}),
          ...(categoryConfig?.tools ? { tools: categoryConfig.tools } : {}),
          ...(thinkingToUse ? { thinking: thinkingToUse } : {}),
          ...(reasoningEffortToUse !== undefined
            ? { reasoningEffort: reasoningEffortToUse }
            : {}),
          ...(textVerbosityToUse !== undefined
            ? { textVerbosity: textVerbosityToUse }
            : {}),
        };

        // Properly handle prompt_append for Plan
        // Extract prompt_append and append it to prompt instead of shallow spread
        // Fixes: https://github.com/kord-aios/kord-aios/issues/723
        if (planOverride) {
          const { prompt_append, ...restOverride } = planOverride as Record<string, unknown> & { prompt_append?: string };
          const merged = { ...planBase, ...restOverride };
          if (prompt_append && merged.prompt) {
            merged.prompt = merged.prompt + "\n" + prompt_append;
          }
          agentConfig["planner"] = merged;
        } else {
          agentConfig["planner"] = planBase;
        }

        // Ensure Plan workflow subagents exist even when model cache is missing.
        // Without this, Planner cannot delegate to plan-analyzer/plan-reviewer and
        // task() fails with "Unknown agent".
        const isDisabled = (name: string) =>
          migratedDisabledAgents.some((a) => a.toLowerCase() === name.toLowerCase())

        if (!isDisabled("plan-analyzer") && !("plan-analyzer" in agentConfig)) {
          const planAnalyzerRequirement = AGENT_MODEL_REQUIREMENTS["plan-analyzer"]
          const fallback = resolvedModel
            ?? pickFirstFallbackModel(planAnalyzerRequirement)
            ?? pickFirstFallbackModel(planRequirement)
          if (fallback) {
            agentConfig["plan-analyzer"] = createPlanAnalyzerAgent(fallback)
          }
        }

        if (!isDisabled("plan-reviewer") && !("plan-reviewer" in agentConfig)) {
          const planReviewerRequirement = AGENT_MODEL_REQUIREMENTS["plan-reviewer"]
          const fallback = resolvedModel
            ?? pickFirstFallbackModel(planReviewerRequirement)
            ?? pickFirstFallbackModel(planRequirement)
          if (fallback) {
            agentConfig["plan-reviewer"] = createPlanReviewerAgent(fallback)
          }
        }
      }

    const filteredConfigAgents = configAgent
      ? Object.fromEntries(
          Object.entries(configAgent)
            .filter(([key]) => {
              if (key === "build") return false;
              if (key === "plan" && shouldDemotePlan) return false;
              if (key === "general") return false;
              // Filter out agents that Kord AIOS provides to prevent
              // OpenCode defaults from overwriting user config in kord-aios.json
              // See: https://github.com/kord-aios/kord-aios/issues/472
              if (key in builtinAgents) return false;
              return true;
            })
            .map(([key, value]) => [
              key,
              value ? migrateAgentConfig(value as Record<string, unknown>) : value,
            ])
        )
      : {};

      const migratedBuild = configAgent?.build
        ? migrateAgentConfig(configAgent.build as Record<string, unknown>)
        : {};

      const planDemoteConfig = shouldDemotePlan
           ? { mode: "subagent" as const
         }
       : undefined;

      // Reuse squads loaded earlier, convert to agent configs
      const squadAgentConfigs = createAllSquadAgentConfigs(squadLoadResult.squads);

      log(`[config-handler] Loaded ${squadLoadResult.squads.length} squads with ${squadAgentConfigs.size} agents from ${ctx.directory}`, {
        squads: squadLoadResult.squads.map(s => s.manifest.name),
        agents: [...squadAgentConfigs.keys()],
      });

      // NOTE: Squads can define agent names that overlap with core agents (e.g. dev-junior).
      // Core/builtin agent configs must win; squads should only contribute additional agents.
      //
      // Agent merge order (later sources override earlier):
      // 1. squadAgentConfigs (lowest - from SQUAD.yaml)
      // 2. agentConfig (kord, dev-junior, builder, planner)
      // 3. builtinAgents (other built-in agents)
      // 4. openCodeUserAgents (~/.config/opencode/agents/*.md)
      // 5. userAgents (Claude Code: ~/.claude/agents/*.md)
      // 6. openCodeProjectAgents (.opencode/agents/*.md)
      // 7. projectAgents (Claude Code: .claude/agents/*.md)
      // 8. pluginAgents (from plugins)
      // 9. filteredConfigAgents (highest - from kord-aios.json)
      config.agent = {
        ...Object.fromEntries(squadAgentConfigs), // Add squad agents (lowest precedence)
        ...agentConfig,
        ...Object.fromEntries(
          Object.entries(builtinAgents).filter(([k]) => k !== "kord")
        ),
        ...openCodeUserAgents,
        ...userAgents,
        ...openCodeProjectAgents,
        ...projectAgents,
        ...pluginAgents,
        ...filteredConfigAgents,
        general: { mode: "subagent", hidden: true },
        build: { ...migratedBuild, mode: "subagent", hidden: true },
        ...(planDemoteConfig ? { plan: planDemoteConfig } : {}),
      };
    } else {
      // Kord disabled - reuse squads loaded earlier for non-Kord mode
      const squadAgentConfigs = createAllSquadAgentConfigs(squadLoadResult.squads);

      // Squads should not override builtin/user/project agent configs.
      // OpenCode agents are included in merge order:
      // 1. squadAgentConfigs (lowest)
      // 2. builtinAgents
      // 3. openCodeUserAgents
      // 4. userAgents (Claude Code)
      // 5. openCodeProjectAgents
      // 6. projectAgents (Claude Code)
      // 7. pluginAgents
      // 8. configAgent (highest - from opencode.json)
      config.agent = {
        ...Object.fromEntries(squadAgentConfigs), // Add squad agents (lowest precedence)
        ...builtinAgents,
        ...openCodeUserAgents,
        ...userAgents,
        ...openCodeProjectAgents,
        ...projectAgents,
        ...pluginAgents,
        ...configAgent,
      };
    }

    if (config.agent) {
      config.agent = reorderAgentsByPriority(config.agent as Record<string, unknown>);
    }

    const agentResult = config.agent as AgentConfig;

    config.tools = {
      ...(config.tools as Record<string, unknown>),
      "grep_app_*": false,
      LspHover: false,
      LspCodeActions: false,
      LspCodeActionResolve: false,
      "task_*": false,
      teammate: false,
      ...(pluginConfig.experimental?.task_system ? { todowrite: false, todoread: false } : {}),
    };

    type AgentWithPermission = { permission?: Record<string, unknown> };

    // In CLI run mode, deny Question tool for all agents (no TUI to answer questions)
    const isCliRunMode = process.env.OPENCODE_CLI_RUN_MODE === "true";
    const questionPermission = isCliRunMode ? "deny" : "allow";
    
    if (agentResult.librarian) {
      const agent = agentResult.librarian as AgentWithPermission;
      agent.permission = { ...agent.permission, "grep_app_*": "allow" };
    }
    if (agentResult["vision"]) {
      const agent = agentResult["vision"] as AgentWithPermission;
      agent.permission = { ...agent.permission, task: "deny", look_at: "deny" };
    }
    if (agentResult["builder"]) {
      const agent = agentResult["builder"] as AgentWithPermission;
      agent.permission = { ...agent.permission, task: "allow", call_kord_agent: "deny", "task_*": "allow", teammate: "allow" };
    }
    if (agentResult.kord) {
      const agent = agentResult.kord as AgentWithPermission;
      agent.permission = { ...agent.permission, call_kord_agent: "deny", task: "allow", question: questionPermission, "task_*": "allow", teammate: "allow" };
    }
    if (agentResult.dev) {
      const agent = agentResult.dev as AgentWithPermission;
      agent.permission = { ...agent.permission, call_kord_agent: "deny", task: "allow", question: questionPermission };
    }
    if (agentResult["planner"]) {
      const agent = agentResult["planner"] as AgentWithPermission;
      agent.permission = { ...agent.permission, call_kord_agent: "deny", task: "allow", question: questionPermission, "task_*": "allow", teammate: "allow" };
    }
    if (agentResult["dev-junior"]) {
      const agent = agentResult["dev-junior"] as AgentWithPermission;
      agent.permission = { ...agent.permission, task: "allow", "task_*": "allow", teammate: "allow" };
    }

    config.permission = {
      ...(config.permission as Record<string, unknown>),
      webfetch: "allow",
      external_directory: "allow",
      task: "deny",
      call_kord_agent: "allow",
    };

    const mcpResult = (pluginConfig.claude_code?.mcp ?? true)
      ? await loadMcpConfigs()
      : { servers: {} };

    config.mcp = {
      ...createBuiltinMcps(pluginConfig.disabled_mcps, pluginConfig),
      ...(config.mcp as Record<string, unknown>),
      ...mcpResult.servers,
      ...pluginComponents.mcpServers,
    };

    const builtinCommands = loadBuiltinCommands(pluginConfig.disabled_commands);
    const systemCommands = (config.command as Record<string, unknown>) ?? {};

    // Parallel loading of all commands and skills for faster startup
    const includeClaudeCommands = pluginConfig.claude_code?.commands ?? true;
    const includeClaudeSkills = pluginConfig.claude_code?.skills ?? true;

    const [
      userCommands,
      projectCommands,
      opencodeGlobalCommands,
      opencodeProjectCommands,
      userSkills,
      projectSkills,
      opencodeGlobalSkills,
      opencodeProjectSkills,
    ] = await Promise.all([
      includeClaudeCommands ? loadUserCommands() : Promise.resolve({}),
      includeClaudeCommands ? loadProjectCommands() : Promise.resolve({}),
      loadOpencodeGlobalCommands(),
      loadOpencodeProjectCommands(),
      includeClaudeSkills ? loadUserSkills() : Promise.resolve({}),
      includeClaudeSkills ? loadProjectSkills() : Promise.resolve({}),
      loadOpencodeGlobalSkills(),
      loadOpencodeProjectSkills(),
    ]);

    config.command = {
      ...builtinCommands,
      ...userCommands,
      ...userSkills,
      ...opencodeGlobalCommands,
      ...opencodeGlobalSkills,
      ...systemCommands,
      ...projectCommands,
      ...projectSkills,
      ...opencodeProjectCommands,
      ...opencodeProjectSkills,
      ...pluginComponents.commands,
      ...pluginComponents.skills,
    };
  };
}
