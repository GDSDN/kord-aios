import type { BackgroundManager } from "../../features/background-agent"
import type { AgentOverrides, CategoriesConfig, GitMasterConfig, BrowserAutomationProvider } from "../../config/schema"
import type { ModelFallbackInfo } from "../../features/task-toast-manager/types"
import type { DelegateTaskArgs, ToolContextWithMetadata, OpencodeClient } from "./types"
import { DEFAULT_CATEGORIES, CATEGORY_DESCRIPTIONS, isPlanAgent } from "./constants"
import { getTimingConfig } from "./timing"
import { parseModelString, getMessageDir, formatDuration, formatDetailedError } from "./helpers"
import { resolveCategoryConfig } from "./categories"
import { buildSystemContent } from "./prompt-builder"
import { findNearestMessageWithFields, findFirstMessageWithAgent } from "../../features/hook-message-injector"
import { resolveMultipleSkillsAsync } from "../../features/opencode-skill-loader/skill-content"
import { discoverSkills } from "../../features/opencode-skill-loader"
import { getTaskToastManager } from "../../features/task-toast-manager"
import { subagentSessions, getSessionAgent } from "../../features/claude-code-session-state"
import { log, getAgentToolRestrictions, resolveModelPipeline, promptWithRetry, createSessionWithRetry, markInternalSessionAbort } from "../../shared"
import { fetchAvailableModels, isModelAvailable } from "../../shared/model-availability"
import { readConnectedProvidersCache } from "../../shared/connected-providers-cache"
import { buildFallbackCandidates } from "../../shared/fallback-candidates"
import { resolveAgentFallbackChain } from "../../shared/agent-fallback"
import { CATEGORY_MODEL_REQUIREMENTS, type FallbackEntry } from "../../shared/model-requirements"
import { storeToolMetadata } from "../../features/tool-metadata-store"

const DEV_JUNIOR_AGENT = "dev-junior"

export interface ExecutorContext {
  manager: BackgroundManager
  client: OpencodeClient
  directory: string
  userCategories?: CategoriesConfig
  userAgentOverrides?: AgentOverrides
  gitMasterConfig?: GitMasterConfig
  kordJuniorModel?: string
  browserProvider?: BrowserAutomationProvider
  onSyncSessionCreated?: (event: { sessionID: string; parentID: string; title: string }) => Promise<void>
}

export interface ParentContext {
  sessionID: string
  messageID: string
  agent?: string
  model?: { providerID: string; modelID: string; variant?: string }
}

interface SessionMessage {
  info?: { role?: string; time?: { created?: number }; agent?: string; model?: { providerID: string; modelID: string }; modelID?: string; providerID?: string }
  parts?: Array<{ type?: string; text?: string }>
}

function extractAssistantText(messages: SessionMessage[]): string {
  const assistantMessages = messages
    .filter((m) => m.info?.role === "assistant")
    .sort((a, b) => (b.info?.time?.created ?? 0) - (a.info?.time?.created ?? 0))

  for (const message of assistantMessages) {
    const textParts = message.parts?.filter((p) => p.type === "text" || p.type === "reasoning") ?? []
    const text = textParts.map((p) => p.text ?? "").filter(Boolean).join("\n").trim()
    if (text.length > 0) {
      return text
    }
  }

  return ""
}

function isNoTextSentinel(text: string): boolean {
  return text.trim().toLowerCase() === "(no text output)"
}

async function fetchSessionMessages(client: OpencodeClient, sessionID: string): Promise<SessionMessage[]> {
  const messagesResult = await client.session.messages({
    path: { id: sessionID },
  })

  if ((messagesResult as { error?: unknown }).error) {
    throw new Error(`Error fetching result: ${(messagesResult as { error: unknown }).error}`)
  }

  return ((messagesResult as { data?: unknown }).data ?? messagesResult) as SessionMessage[]
}

function collectTriedModelsFromMessages(messages: SessionMessage[], triedModels: Set<string>): void {
  for (const message of messages) {
    const info = message.info
    const providerID = info?.model?.providerID ?? info?.providerID
    const modelID = info?.model?.modelID ?? info?.modelID
    if (providerID && modelID) {
      triedModels.add(`${providerID}/${modelID}`)
    }
  }
}

async function waitForStableMessages(
  client: OpencodeClient,
  sessionID: string,
  timing: ReturnType<typeof getTimingConfig>,
): Promise<SessionMessage[]> {
  const pollStart = Date.now()
  let lastMsgCount = 0
  let stablePolls = 0
  const maxRecoveryPollMs = Math.min(timing.MAX_POLL_TIME_MS, timing.FIRST_OUTPUT_TIMEOUT_MS)

  while (Date.now() - pollStart < maxRecoveryPollMs) {
    await new Promise((resolve) => setTimeout(resolve, timing.POLL_INTERVAL_MS))

    const elapsed = Date.now() - pollStart
    const statusResult = typeof client.session.status === "function"
      ? await client.session.status()
      : { data: {} }
    const allStatuses = (statusResult.data ?? {}) as Record<string, { type: string }>
    const sessionStatus = allStatuses[sessionID]

    if (sessionStatus && sessionStatus.type !== "idle") {
      stablePolls = 0
      lastMsgCount = 0
      continue
    }

    if (elapsed < timing.MIN_STABILITY_TIME_MS) {
      continue
    }

    const messages = await fetchSessionMessages(client, sessionID)
    const currentMsgCount = messages.length
    if (currentMsgCount === lastMsgCount) {
      stablePolls++
      if (stablePolls >= timing.STABILITY_POLLS_REQUIRED) {
        return messages
      }
    } else {
      stablePolls = 0
      lastMsgCount = currentMsgCount
    }
  }

  return fetchSessionMessages(client, sessionID)
}

async function handoffSyncSessionToBackground(input: {
  manager: BackgroundManager
  sessionID: string
  parentSessionID: string
  parentMessageID: string
  description: string
  prompt: string
  agent?: string
  parentAgent?: string
  model?: { providerID: string; modelID: string; variant?: string }
  fallbackChain?: FallbackEntry[]
  skillContent?: string
}): Promise<string> {
  const existing = input.manager.findBySession(input.sessionID)
  const tracked = await input.manager.trackTask({
    taskId: existing?.id ?? `bg_sync_${input.sessionID.slice(0, 8)}`,
    sessionID: input.sessionID,
    parentSessionID: input.parentSessionID,
    parentMessageID: input.parentMessageID,
    description: input.description,
    agent: input.agent,
    parentAgent: input.parentAgent,
    model: input.model,
    fallbackChain: input.fallbackChain,
    prompt: input.prompt,
    skillContent: input.skillContent,
  })

  return `Sync execution exceeded SLA and was handed off to background monitoring.

Task ID: ${tracked.id}
Session ID: ${input.sessionID}
Status: ${tracked.status}

Follow up with: \`background_output(task_id="${tracked.id}")\`

<task_metadata>
task_id: ${tracked.id}
session_id: ${input.sessionID}
</task_metadata>`
}

export async function resolveSkillContent(
  skills: string[],
  options: { gitMasterConfig?: GitMasterConfig; browserProvider?: BrowserAutomationProvider, disabledSkills?: Set<string> }
): Promise<{ content: string | undefined; error: string | null }> {
  if (skills.length === 0) {
    return { content: undefined, error: null }
  }

  const { resolved, notFound } = await resolveMultipleSkillsAsync(skills, options)
  if (notFound.length > 0) {
    const allSkills = await discoverSkills({ includeClaudeCodePaths: true })
    const available = allSkills.map(s => s.name).join(", ")
    return { content: undefined, error: `Skills not found: ${notFound.join(", ")}. Available: ${available}` }
  }

  return { content: Array.from(resolved.values()).join("\n\n"), error: null }
}

export function resolveParentContext(ctx: ToolContextWithMetadata): ParentContext {
  const messageDir = getMessageDir(ctx.sessionID)
  const prevMessage = messageDir ? findNearestMessageWithFields(messageDir) : null
  const firstMessageAgent = messageDir ? findFirstMessageWithAgent(messageDir) : null
  const sessionAgent = getSessionAgent(ctx.sessionID)
  const parentAgent = ctx.agent ?? sessionAgent ?? firstMessageAgent ?? prevMessage?.agent

  log("[task] parentAgent resolution", {
    sessionID: ctx.sessionID,
    messageDir,
    ctxAgent: ctx.agent,
    sessionAgent,
    firstMessageAgent,
    prevMessageAgent: prevMessage?.agent,
    resolvedParentAgent: parentAgent,
  })

  const parentModel = prevMessage?.model?.providerID && prevMessage?.model?.modelID
    ? {
        providerID: prevMessage.model.providerID,
        modelID: prevMessage.model.modelID,
        ...(prevMessage.model.variant ? { variant: prevMessage.model.variant } : {}),
      }
    : undefined

  return {
    sessionID: ctx.sessionID,
    messageID: ctx.messageID,
    agent: parentAgent,
    model: parentModel,
  }
}

export async function executeBackgroundContinuation(
  args: DelegateTaskArgs,
  ctx: ToolContextWithMetadata,
  executorCtx: ExecutorContext,
  parentContext: ParentContext
): Promise<string> {
  const { manager } = executorCtx

  try {
    const task = await manager.resume({
      sessionId: args.session_id!,
      prompt: args.prompt,
      parentSessionID: parentContext.sessionID,
      parentMessageID: parentContext.messageID,
      parentModel: parentContext.model,
      parentAgent: parentContext.agent,
    })

    const bgContMeta = {
      title: `Continue: ${task.description}`,
      metadata: {
        prompt: args.prompt,
        agent: task.agent,
        load_skills: args.load_skills,
        description: args.description,
        run_in_background: args.run_in_background,
        sessionId: task.sessionID,
        command: args.command,
      },
    }
    await ctx.metadata?.(bgContMeta)
    if (ctx.callID) {
      storeToolMetadata(ctx.sessionID, ctx.callID, bgContMeta)
    }

    return `Background task continued.

Task ID: ${task.id}
Description: ${task.description}
Agent: ${task.agent}
Status: ${task.status}

Agent continues with full previous context preserved.
Use \`background_output\` with task_id="${task.id}" to check progress.

<task_metadata>
session_id: ${task.sessionID}
</task_metadata>`
  } catch (error) {
    return formatDetailedError(error, {
      operation: "Continue background task",
      args,
      sessionID: args.session_id,
    })
  }
}

export async function executeSyncContinuation(
  args: DelegateTaskArgs,
  ctx: ToolContextWithMetadata,
  executorCtx: ExecutorContext
): Promise<string> {
  const { client, manager } = executorCtx
  const toastManager = getTaskToastManager()
  const taskId = `resume_sync_${args.session_id!.slice(0, 8)}`
  const startTime = new Date()
  let resumeAgent: string | undefined
  let resumeModel: { providerID: string; modelID: string } | undefined
  let fallbackChain: FallbackEntry[] | undefined

  if (toastManager) {
    toastManager.addTask({
      id: taskId,
      description: args.description,
      agent: "continue",
      isBackground: false,
    })
  }

  const syncContMeta = {
    title: `Continue: ${args.description}`,
    metadata: {
      prompt: args.prompt,
      load_skills: args.load_skills,
      description: args.description,
      run_in_background: args.run_in_background,
      sessionId: args.session_id,
      sync: true,
      command: args.command,
    },
  }
  await ctx.metadata?.(syncContMeta)
  if (ctx.callID) {
    storeToolMetadata(ctx.sessionID, ctx.callID, syncContMeta)
  }

  try {
    try {
      const messagesResp = await client.session.messages({ path: { id: args.session_id! } })
      const messages = (messagesResp.data ?? []) as SessionMessage[]
      for (let i = messages.length - 1; i >= 0; i--) {
        const info = messages[i].info
        if (info?.agent || info?.model || (info?.modelID && info?.providerID)) {
          resumeAgent = info.agent
          resumeModel = info.model ?? (info.providerID && info.modelID ? { providerID: info.providerID, modelID: info.modelID } : undefined)
          break
        }
      }
    } catch {
      const resumeMessageDir = getMessageDir(args.session_id!)
      const resumeMessage = resumeMessageDir ? findNearestMessageWithFields(resumeMessageDir) : null
      resumeAgent = resumeMessage?.agent
      resumeModel = resumeMessage?.model?.providerID && resumeMessage?.model?.modelID
        ? { providerID: resumeMessage.model.providerID, modelID: resumeMessage.model.modelID }
        : undefined
    }

    fallbackChain = resumeAgent
      ? resolveAgentFallbackChain(resumeAgent, {
          userAgentOverrides: executorCtx.userAgentOverrides,
        })
      : undefined
    await promptWithRetry(client, {
      path: { id: args.session_id! },
      body: {
        ...(resumeAgent !== undefined ? { agent: resumeAgent } : {}),
        ...(resumeModel !== undefined ? { model: resumeModel } : {}),
        tools: {
          ...(resumeAgent ? getAgentToolRestrictions(resumeAgent) : {}),
          task: false,
          call_kord_agent: true,
          question: false,
        },
        parts: [{ type: "text", text: args.prompt }],
      },
    }, fallbackChain)
  } catch (promptError) {
    if (toastManager) {
      toastManager.removeTask(taskId)
    }
    const errorMessage = promptError instanceof Error ? promptError.message : String(promptError)
    return `Failed to send continuation prompt: ${errorMessage}\n\nSession ID: ${args.session_id}`
  }

  const timing = getTimingConfig()
  const pollStart = Date.now()
  let lastMsgCount = 0
  let stablePolls = 0

  while (Date.now() - pollStart < timing.MAX_POLL_TIME_MS) {
    await new Promise(resolve => setTimeout(resolve, timing.POLL_INTERVAL_MS))

    const elapsed = Date.now() - pollStart
    const statusResult = typeof client.session.status === "function"
      ? await client.session.status()
      : { data: {} }
    const allStatuses = (statusResult.data ?? {}) as Record<string, { type: string }>
    const sessionStatus = allStatuses[args.session_id!]

    if (elapsed >= timing.SYNC_HANDOFF_SLA_MS && sessionStatus?.type !== "idle") {
      if (toastManager) {
        toastManager.removeTask(taskId)
      }
      try {
        return await handoffSyncSessionToBackground({
          manager,
          sessionID: args.session_id!,
          parentSessionID: ctx.sessionID,
          parentMessageID: ctx.messageID,
          description: args.description,
          prompt: args.prompt,
          agent: resumeAgent,
          parentAgent: ctx.agent,
          model: resumeModel,
          fallbackChain,
        })
      } catch (handoffError) {
        const message = handoffError instanceof Error ? handoffError.message : String(handoffError)
        return `Sync execution exceeded SLA, but background handoff failed: ${message}\n\nSession ID: ${args.session_id}`
      }
    }

    if (elapsed < timing.SESSION_CONTINUATION_STABILITY_MS) continue

    const messagesCheck = await client.session.messages({ path: { id: args.session_id! } })
    const msgs = ((messagesCheck as { data?: unknown }).data ?? messagesCheck) as Array<unknown>
    const currentMsgCount = msgs.length

    if (currentMsgCount > 0 && currentMsgCount === lastMsgCount) {
      stablePolls++
      if (stablePolls >= timing.STABILITY_POLLS_REQUIRED) break
    } else {
      stablePolls = 0
      lastMsgCount = currentMsgCount
    }
  }

  const messagesResult = await client.session.messages({
    path: { id: args.session_id! },
  })

  if (messagesResult.error) {
    if (toastManager) {
      toastManager.removeTask(taskId)
    }
    return `Error fetching result: ${messagesResult.error}\n\nSession ID: ${args.session_id}`
  }

  const messages = ((messagesResult as { data?: unknown }).data ?? messagesResult) as SessionMessage[]
  if (toastManager) {
    toastManager.removeTask(taskId)
  }

  const textContent = extractAssistantText(messages)
  if (!textContent) {
    return `No assistant response found.\n\nSession ID: ${args.session_id}`
  }
  if (isNoTextSentinel(textContent)) {
    return `Subagent produced no text output. This usually indicates provider-side failure after fallback routing.\n\nSession ID: ${args.session_id}`
  }

  const duration = formatDuration(startTime)

  return `Task continued and completed in ${duration}.

---

${textContent || "(No text output)"}

<task_metadata>
session_id: ${args.session_id}
</task_metadata>`
}

export async function executeUnstableAgentTask(
  args: DelegateTaskArgs,
  ctx: ToolContextWithMetadata,
  executorCtx: ExecutorContext,
  parentContext: ParentContext,
  agentToUse: string,
  categoryModel: { providerID: string; modelID: string; variant?: string } | undefined,
  systemContent: string | undefined,
  actualModel: string | undefined,
  fallbackChain?: FallbackEntry[]
): Promise<string> {
  const { manager, client } = executorCtx

  try {
    const task = await manager.launch({
      description: args.description,
      prompt: args.prompt,
      agent: agentToUse,
      parentSessionID: parentContext.sessionID,
      parentMessageID: parentContext.messageID,
      parentModel: parentContext.model,
      parentAgent: parentContext.agent,
      model: categoryModel,
      skills: args.load_skills.length > 0 ? args.load_skills : undefined,
      skillContent: systemContent,
      category: args.category,
      fallbackChain: fallbackChain,
    })

    const timing = getTimingConfig()
    const waitStart = Date.now()
    let sessionID = task.sessionID
    while (!sessionID && Date.now() - waitStart < timing.WAIT_FOR_SESSION_TIMEOUT_MS) {
      if (ctx.abort?.aborted) {
        return `Task aborted while waiting for session to start.\n\nTask ID: ${task.id}`
      }
      await new Promise(resolve => setTimeout(resolve, timing.WAIT_FOR_SESSION_INTERVAL_MS))
      const updated = manager.getTask(task.id)
      sessionID = updated?.sessionID
    }
    if (!sessionID) {
      return formatDetailedError(new Error(`Task failed to start within timeout (30s). Task ID: ${task.id}, Status: ${task.status}`), {
        operation: "Launch monitored background task",
        args,
        agent: agentToUse,
        category: args.category,
      })
    }

    const bgTaskMeta = {
      title: args.description,
      metadata: {
        prompt: args.prompt,
        agent: agentToUse,
        category: args.category,
        load_skills: args.load_skills,
        description: args.description,
        run_in_background: args.run_in_background,
        sessionId: sessionID,
        command: args.command,
      },
    }
    await ctx.metadata?.(bgTaskMeta)
    if (ctx.callID) {
      storeToolMetadata(ctx.sessionID, ctx.callID, bgTaskMeta)
    }

    const startTime = new Date()
    const timingCfg = getTimingConfig()
    const pollStart = Date.now()
    let lastMsgCount = 0
    let stablePolls = 0

    while (Date.now() - pollStart < timingCfg.MAX_POLL_TIME_MS) {
      if (ctx.abort?.aborted) {
        return `Task aborted (was running in background mode).\n\nSession ID: ${sessionID}`
      }

      await new Promise(resolve => setTimeout(resolve, timingCfg.POLL_INTERVAL_MS))

      const statusResult = await client.session.status()
      const allStatuses = (statusResult.data ?? {}) as Record<string, { type: string }>
      const sessionStatus = allStatuses[sessionID]

      if (sessionStatus && sessionStatus.type !== "idle") {
        stablePolls = 0
        lastMsgCount = 0
        continue
      }

      if (Date.now() - pollStart < timingCfg.MIN_STABILITY_TIME_MS) continue

      const messagesCheck = await client.session.messages({ path: { id: sessionID } })
      const msgs = ((messagesCheck as { data?: unknown }).data ?? messagesCheck) as Array<unknown>
      const currentMsgCount = msgs.length

      if (currentMsgCount === lastMsgCount) {
        stablePolls++
        if (stablePolls >= timingCfg.STABILITY_POLLS_REQUIRED) break
      } else {
        stablePolls = 0
        lastMsgCount = currentMsgCount
      }
    }

    const messagesResult = await client.session.messages({ path: { id: sessionID } })
    const messages = ((messagesResult as { data?: unknown }).data ?? messagesResult) as SessionMessage[]

    const assistantMessages = messages
      .filter((m) => m.info?.role === "assistant")
      .sort((a, b) => (b.info?.time?.created ?? 0) - (a.info?.time?.created ?? 0))
    const lastMessage = assistantMessages[0]

    if (!lastMessage) {
      return `No assistant response found (task ran in background mode).\n\nSession ID: ${sessionID}`
    }

    const textParts = lastMessage?.parts?.filter((p) => p.type === "text" || p.type === "reasoning") ?? []
    const textContent = textParts.map((p) => p.text ?? "").filter(Boolean).join("\n")
    const duration = formatDuration(startTime)

    return `SUPERVISED TASK COMPLETED SUCCESSFULLY

IMPORTANT: This model (${actualModel}) is marked as unstable/experimental.
Your run_in_background=false was automatically converted to background mode for reliability monitoring.

Duration: ${duration}
Agent: ${agentToUse}${args.category ? ` (category: ${args.category})` : ""}

MONITORING INSTRUCTIONS:
- The task was monitored and completed successfully
- If you observe this agent behaving erratically in future calls, actively monitor its progress
- Use background_cancel(task_id="...") to abort if the agent seems stuck or producing garbage output
- Do NOT retry automatically if you see this message - the task already succeeded

---

RESULT:

${textContent || "(No text output)"}

<task_metadata>
session_id: ${sessionID}
</task_metadata>`
  } catch (error) {
    return formatDetailedError(error, {
      operation: "Launch monitored background task",
      args,
      agent: agentToUse,
      category: args.category,
    })
  }
}

export async function executeBackgroundTask(
  args: DelegateTaskArgs,
  ctx: ToolContextWithMetadata,
  executorCtx: ExecutorContext,
  parentContext: ParentContext,
  agentToUse: string,
  categoryModel: { providerID: string; modelID: string; variant?: string } | undefined,
  systemContent: string | undefined,
  fallbackChain?: FallbackEntry[]
): Promise<string> {
  const { manager } = executorCtx

  try {
    const task = await manager.launch({
      description: args.description,
      prompt: args.prompt,
      agent: agentToUse,
      parentSessionID: parentContext.sessionID,
      parentMessageID: parentContext.messageID,
      parentModel: parentContext.model,
      parentAgent: parentContext.agent,
      model: categoryModel,
      skills: args.load_skills.length > 0 ? args.load_skills : undefined,
      skillContent: systemContent,
      category: args.category,
      fallbackChain: fallbackChain,
    })

    // OpenCode TUI's `Task` tool UI calculates toolcalls by looking up
    // `props.metadata.sessionId` and then counting tool parts in that session.
    // BackgroundManager.launch() returns immediately (pending) before the session exists,
    // so we must wait briefly for the session to be created to set metadata correctly.
    const timing = getTimingConfig()
    const waitStart = Date.now()
    let sessionId = task.sessionID
    while (!sessionId && Date.now() - waitStart < timing.WAIT_FOR_SESSION_TIMEOUT_MS) {
      if (ctx.abort?.aborted) {
        return `Task aborted while waiting for session to start.\n\nTask ID: ${task.id}`
      }
      await new Promise(resolve => setTimeout(resolve, timing.WAIT_FOR_SESSION_INTERVAL_MS))
      const updated = manager.getTask(task.id)
      sessionId = updated?.sessionID
    }

    const unstableMeta = {
      title: args.description,
      metadata: {
        prompt: args.prompt,
        agent: task.agent,
        category: args.category,
        load_skills: args.load_skills,
        description: args.description,
        run_in_background: args.run_in_background,
        sessionId: sessionId ?? "pending",
        command: args.command,
      },
    }
    await ctx.metadata?.(unstableMeta)
    if (ctx.callID) {
      storeToolMetadata(ctx.sessionID, ctx.callID, unstableMeta)
    }

    return `Background task launched.

Task ID: ${task.id}
Description: ${task.description}
Agent: ${task.agent}${args.category ? ` (category: ${args.category})` : ""}
Status: ${task.status}

System notifies on completion. Use \`background_output\` with task_id="${task.id}" to check.

<task_metadata>
session_id: ${sessionId}
</task_metadata>`
  } catch (error) {
    return formatDetailedError(error, {
      operation: "Launch background task",
      args,
      agent: agentToUse,
      category: args.category,
    })
  }
}

export async function executeSyncTask(
  args: DelegateTaskArgs,
  ctx: ToolContextWithMetadata,
  executorCtx: ExecutorContext,
  parentContext: ParentContext,
  agentToUse: string,
  categoryModel: { providerID: string; modelID: string; variant?: string } | undefined,
  systemContent: string | undefined,
  modelInfo?: ModelFallbackInfo,
  fallbackChain?: FallbackEntry[]
): Promise<string> {
  const { client, manager, directory, onSyncSessionCreated } = executorCtx
  const toastManager = getTaskToastManager()
  let taskId: string | undefined
  let syncSessionID: string | undefined

  try {
    const parentSession = client.session.get
      ? await client.session.get({ path: { id: parentContext.sessionID } }).catch(() => null)
      : null
    const parentDirectory = parentSession?.data?.directory ?? directory

    const created = await createSessionWithRetry(client, {
      body: {
        parentID: parentContext.sessionID,
        title: `${args.description} (@${agentToUse} subagent)`,
        permission: [
          { permission: "question", action: "deny" as const, pattern: "*" },
        ],
      },
      query: {
        directory: parentDirectory,
      },
    })

    const sessionID = created.id
    syncSessionID = sessionID
    subagentSessions.add(sessionID)

    if (onSyncSessionCreated) {
      log("[task] Invoking onSyncSessionCreated callback", { sessionID, parentID: parentContext.sessionID })
      await onSyncSessionCreated({
        sessionID,
        parentID: parentContext.sessionID,
        title: args.description,
      }).catch((err) => {
      log("[task] onSyncSessionCreated callback failed", { error: String(err) })
      })
      await new Promise(r => setTimeout(r, 200))
    }

    taskId = `sync_${sessionID.slice(0, 8)}`
    const startTime = new Date()

    if (toastManager) {
      toastManager.addTask({
        id: taskId,
        description: args.description,
        agent: agentToUse,
        isBackground: false,
        category: args.category,
        skills: args.load_skills,
        modelInfo,
      })
    }

    const syncTaskMeta = {
      title: args.description,
      metadata: {
        prompt: args.prompt,
        agent: agentToUse,
        category: args.category,
        load_skills: args.load_skills,
        description: args.description,
        run_in_background: args.run_in_background,
        sessionId: sessionID,
        sync: true,
        command: args.command,
      },
    }
    await ctx.metadata?.(syncTaskMeta)
    if (ctx.callID) {
      storeToolMetadata(ctx.sessionID, ctx.callID, syncTaskMeta)
    }

    try {
      const allowTask = isPlanAgent(agentToUse)
      await promptWithRetry(client, {
        path: { id: sessionID },
        body: {
          agent: agentToUse,
          system: systemContent,
          tools: {
            task: allowTask,
            call_kord_agent: true,
            question: false,
          },
          parts: [{ type: "text", text: args.prompt }],
          ...(categoryModel ? { model: { providerID: categoryModel.providerID, modelID: categoryModel.modelID } } : {}),
          ...(categoryModel?.variant ? { variant: categoryModel.variant } : {}),
        },
      }, fallbackChain)
    } catch (promptError) {
      if (toastManager && taskId !== undefined) {
        toastManager.removeTask(taskId)
      }
      const errorMessage = promptError instanceof Error ? promptError.message : String(promptError)
      if (errorMessage.includes("agent.name") || errorMessage.includes("undefined")) {
        return formatDetailedError(new Error(`Agent "${agentToUse}" not found. Make sure the agent is registered in your opencode.json or provided by a plugin.`), {
          operation: "Send prompt to agent",
          args,
          sessionID,
          agent: agentToUse,
          category: args.category,
        })
      }
      return formatDetailedError(promptError, {
        operation: "Send prompt",
        args,
        sessionID,
        agent: agentToUse,
        category: args.category,
      })
    }

    const syncTiming = getTimingConfig()
    const pollStart = Date.now()
    let lastMsgCount = 0
    let stablePolls = 0
    let pollCount = 0
    let retrySince: number | undefined
    const triedModels = new Set<string>()
    if (categoryModel?.providerID && categoryModel?.modelID) {
      triedModels.add(`${categoryModel.providerID}/${categoryModel.modelID}`)
    }

    log("[task] Starting poll loop", { sessionID, agentToUse })

    while (Date.now() - pollStart < syncTiming.MAX_POLL_TIME_MS) {
      if (ctx.abort?.aborted) {
        log("[task] Aborted by user", { sessionID })
        if (toastManager && taskId) toastManager.removeTask(taskId)
        return `Task aborted.\n\nSession ID: ${sessionID}`
      }

      await new Promise(resolve => setTimeout(resolve, syncTiming.POLL_INTERVAL_MS))
      pollCount++

      const statusResult = await client.session.status()
      const allStatuses = (statusResult.data ?? {}) as Record<string, { type: string }>
      const sessionStatus = allStatuses[sessionID]
      const elapsed = Date.now() - pollStart

      if (elapsed >= syncTiming.SYNC_HANDOFF_SLA_MS && sessionStatus?.type !== "idle") {
        if (toastManager && taskId) {
          toastManager.removeTask(taskId)
        }
        try {
          return await handoffSyncSessionToBackground({
            manager,
            sessionID,
            parentSessionID: parentContext.sessionID,
            parentMessageID: parentContext.messageID,
            description: args.description,
            prompt: args.prompt,
            agent: agentToUse,
            parentAgent: parentContext.agent,
            model: categoryModel,
            fallbackChain,
            skillContent: systemContent,
          })
        } catch (handoffError) {
          const message = handoffError instanceof Error ? handoffError.message : String(handoffError)
          return `Sync execution exceeded SLA, but background handoff failed: ${message}\n\nSession ID: ${sessionID}`
        }
      }

      if (pollCount % 10 === 0) {
      log("[task] Poll status", {
          sessionID,
          pollCount,
          elapsed: Math.floor(elapsed / 1000) + "s",
          sessionStatus: sessionStatus?.type ?? "not_in_status",
          stablePolls,
          lastMsgCount,
        })
      }

      if (sessionStatus?.type === "retry") {
        retrySince ??= Date.now()

        // If the session produces any assistant/tool output, do not treat it as stuck.
        const messagesCheck = await client.session.messages({ path: { id: sessionID } })
        const msgs = ((messagesCheck as { data?: unknown }).data ?? messagesCheck) as Array<{ info?: { role?: string } }>
        const hasAssistantOrToolMessage = msgs.some(
          (m) => m.info?.role === "assistant" || m.info?.role === "tool"
        )
        if (hasAssistantOrToolMessage) {
          retrySince = undefined
        } else {
          const retryElapsed = Date.now() - retrySince
          if (retryElapsed >= syncTiming.FIRST_OUTPUT_TIMEOUT_MS) {
            const chain = (fallbackChain ?? []) as FallbackEntry[]
            const connectedProviders = readConnectedProvidersCache()
            const { candidates, diagnostics } = await buildFallbackCandidates({
              client,
              fallbackChain: chain,
              connectedProviders,
              excludeModels: triedModels,
              allowModelListMiss: true,
            })

            log("[task] Session stuck in retry loop", {
              sessionID,
              agent: agentToUse,
              retryElapsed,
              chainLength: chain.length,
              candidateCount: candidates.length,
              connectedProviders: diagnostics.connectedProviders,
              connectedProvidersKnown: diagnostics.connectedProvidersKnown,
              availableModelCount: diagnostics.availableModelCount,
              skippedDisconnected: diagnostics.skippedDisconnected,
              skippedUnavailable: diagnostics.skippedUnavailable,
              skippedUnhealthy: diagnostics.skippedUnhealthy,
            })

            const pickNext = () => {
              for (const candidate of candidates) {
                const key = `${candidate.providerID}/${candidate.modelID}`
                if (triedModels.has(key)) continue
                return { candidate, key }
              }
              return null
            }

            let switched = false
            while (true) {
              const nextPick = pickNext()
              if (!nextPick) break
              const { candidate, key } = nextPick
              triedModels.add(key)

              log("[task] Session stuck in retry; attempting model fallback", {
                sessionID,
                agent: agentToUse,
                to: key,
              })

              markInternalSessionAbort(sessionID, "delegate-task:retry-stuck")
              await client.session.abort({ path: { id: sessionID } }).catch(() => {})

              try {
                const allowTask = isPlanAgent(agentToUse)
                await promptWithRetry(
                  client,
                  {
                    path: { id: sessionID },
                    body: {
                      agent: agentToUse,
                      system: systemContent,
                      tools: {
                        task: allowTask,
                        call_kord_agent: true,
                        question: false,
                      },
                      parts: [{ type: "text", text: args.prompt }],
                      model: { providerID: candidate.providerID, modelID: candidate.modelID },
                      ...(candidate.variant ? { variant: candidate.variant } : {}),
                    },
                  },
                  undefined
                )
                switched = true
                retrySince = Date.now()
                break
              } catch (error) {
                log("[task] Retry-stuck fallback prompt error", {
                  sessionID,
                  model: key,
                  error: String(error),
                })
                continue
              }
            }

            if (!switched) {
              if (toastManager && taskId) toastManager.removeTask(taskId)
              return `Session stuck in retry with no output after ${Math.floor(syncTiming.FIRST_OUTPUT_TIMEOUT_MS / 1000)}s; exhausted fallback models.\n\nSession ID: ${sessionID}`
            }
          }
        }

        stablePolls = 0
        lastMsgCount = 0
        continue
      }

      if (sessionStatus && sessionStatus.type !== "idle") {
        retrySince = undefined
        stablePolls = 0
        lastMsgCount = 0
        continue
      }

      if (elapsed < syncTiming.MIN_STABILITY_TIME_MS) {
        continue
      }

      const messagesCheck = await client.session.messages({ path: { id: sessionID } })
      const msgs = ((messagesCheck as { data?: unknown }).data ?? messagesCheck) as Array<unknown>
      const currentMsgCount = msgs.length

      if (currentMsgCount === lastMsgCount) {
        stablePolls++
        if (stablePolls >= syncTiming.STABILITY_POLLS_REQUIRED) {
        log("[task] Poll complete - messages stable", { sessionID, pollCount, currentMsgCount })
          break
        }
      } else {
        stablePolls = 0
        lastMsgCount = currentMsgCount
      }
    }

    if (Date.now() - pollStart >= syncTiming.MAX_POLL_TIME_MS) {
    log("[task] Poll timeout reached", { sessionID, pollCount, lastMsgCount, stablePolls })
    }

    let messages: SessionMessage[]
    try {
      messages = await fetchSessionMessages(client, sessionID)
    } catch (error) {
      return `${error instanceof Error ? error.message : String(error)}\n\nSession ID: ${sessionID}`
    }

    collectTriedModelsFromMessages(messages, triedModels)

    let textContent = extractAssistantText(messages)
    if (!textContent || isNoTextSentinel(textContent)) {
      const chain = (fallbackChain ?? []) as FallbackEntry[]
      const attemptedRecoveryModels: string[] = []

      while (chain.length > 0) {
        const connectedProviders = readConnectedProvidersCache()
        const { candidates } = await buildFallbackCandidates({
          client,
          fallbackChain: chain,
          connectedProviders,
          excludeModels: triedModels,
          allowModelListMiss: true,
        })

        const next = candidates[0]
        if (!next) {
          break
        }

        const modelKey = `${next.providerID}/${next.modelID}`
        attemptedRecoveryModels.push(modelKey)
        triedModels.add(modelKey)

        log("[task] No-output detected; attempting next fallback model", {
          sessionID,
          agent: agentToUse,
          model: modelKey,
        })

        await client.session.abort({ path: { id: sessionID } }).catch(() => {})

        try {
          const allowTask = isPlanAgent(agentToUse)
          await promptWithRetry(
            client,
            {
              path: { id: sessionID },
              body: {
                agent: agentToUse,
                system: systemContent,
                tools: {
                  task: allowTask,
                  call_kord_agent: true,
                  question: false,
                },
                parts: [{ type: "text", text: args.prompt }],
                model: { providerID: next.providerID, modelID: next.modelID },
                ...(next.variant ? { variant: next.variant } : {}),
              },
            },
            undefined,
          )
        } catch (error) {
          log("[task] No-output recovery fallback failed", {
            sessionID,
            model: modelKey,
            error: String(error),
          })
          continue
        }

        messages = await waitForStableMessages(client, sessionID, syncTiming)
        collectTriedModelsFromMessages(messages, triedModels)
        textContent = extractAssistantText(messages)
        if (textContent && !isNoTextSentinel(textContent)) {
          break
        }
      }

      if (!textContent) {
        const attempted = attemptedRecoveryModels.length > 0
          ? ` Attempted recovery models: ${attemptedRecoveryModels.join(", ")}.`
          : ""
        return `No assistant response found.${attempted}\n\nSession ID: ${sessionID}`
      }

      if (isNoTextSentinel(textContent)) {
        const attempted = attemptedRecoveryModels.length > 0
          ? ` Attempted recovery models: ${attemptedRecoveryModels.join(", ")}.`
          : ""
        return `Subagent produced no text output after fallback recovery.${attempted}\n\nSession ID: ${sessionID}`
      }
    }

    const duration = formatDuration(startTime)

    if (toastManager) {
      toastManager.removeTask(taskId)
    }

    subagentSessions.delete(sessionID)

    return `Task completed in ${duration}.

Agent: ${agentToUse}${args.category ? ` (category: ${args.category})` : ""}

---

${textContent || "(No text output)"}

<task_metadata>
session_id: ${sessionID}
</task_metadata>`
  } catch (error) {
    if (toastManager && taskId !== undefined) {
      toastManager.removeTask(taskId)
    }
    if (syncSessionID) {
      subagentSessions.delete(syncSessionID)
    }
    return formatDetailedError(error, {
      operation: "Execute task",
      args,
      sessionID: syncSessionID,
      agent: agentToUse,
      category: args.category,
    })
  }
}

export interface CategoryResolutionResult {
  agentToUse: string
  categoryModel: { providerID: string; modelID: string; variant?: string } | undefined
  categoryPromptAppend: string | undefined
  modelInfo: ModelFallbackInfo | undefined
  actualModel: string | undefined
  isUnstableAgent: boolean
  fallbackChain?: any[]
  error?: string
}

export async function resolveCategoryExecution(
  args: DelegateTaskArgs,
  executorCtx: ExecutorContext,
  inheritedModel: string | undefined,
  systemDefaultModel: string | undefined
): Promise<CategoryResolutionResult> {
  const { client, userCategories, kordJuniorModel } = executorCtx

  const connectedProviders = readConnectedProvidersCache()
  const availableModels = await fetchAvailableModels(client, {
    connectedProviders: connectedProviders ?? undefined,
  })

  log("[task] resolveCategoryExecution start", {
    category: args.category,
    connectedProviders,
    availableModelsCount: availableModels.size,
    inheritedModel,
    systemDefaultModel,
    kordJuniorModel
  })

  const resolved = resolveCategoryConfig(args.category!, {
    userCategories,
    inheritedModel,
    systemDefaultModel,
    availableModels,
  })

  if (!resolved) {
    return {
      agentToUse: "",
      categoryModel: undefined,
      categoryPromptAppend: undefined,
      modelInfo: undefined,
      actualModel: undefined,
      isUnstableAgent: false,
      error: `Unknown category: "${args.category}". Available: ${Object.keys({ ...DEFAULT_CATEGORIES, ...userCategories }).join(", ")}`,
    }
  }

  const requirement = CATEGORY_MODEL_REQUIREMENTS[args.category!]
  const categoryConfig = userCategories?.[args.category!]
  const categoryFallbackSlots = categoryConfig?.fallback_slots?.map((slot: string) => {
    const parts = slot.split("/")
    return parts.length >= 2
      ? { providers: [parts[0]], model: parts.slice(1).join("/") }
      : { providers: [], model: slot }
  })
  let actualModel: string | undefined
  let modelInfo: ModelFallbackInfo | undefined
  let categoryModel: { providerID: string; modelID: string; variant?: string } | undefined

  const overrideModel = kordJuniorModel
  const explicitCategoryModel = userCategories?.[args.category!]?.model

  if (!requirement) {
    // Precedence: explicit category model > dev-junior default > category resolved model
    // This keeps `dev-junior.model` useful as a global default while allowing
    // per-category overrides via `categories[category].model`.
    actualModel = explicitCategoryModel ?? overrideModel ?? resolved.model
    if (actualModel) {
      modelInfo = explicitCategoryModel || overrideModel
        ? { model: actualModel, type: "user-defined", source: "override" }
        : { model: actualModel, type: "system-default", source: "system-default" }
    }
  } else {
    const resolution = resolveModelPipeline({
      intent: {
        userModel: explicitCategoryModel ?? overrideModel,
        categoryDefaultModel: resolved.model,
      },
      constraints: { availableModels },
      policy: {
        fallbackChain: requirement.fallbackChain,
        systemDefaultModel,
        customFallbackSlots: categoryFallbackSlots,
      },
      dynamic: categoryConfig?.routing_mode === "dynamic" ? {
        routingMode: "dynamic",
        agentName: args.category!,
        prompt: args.prompt ?? "",
        category: args.category,
      } : undefined,
    })

    if (resolution) {
      const { model: resolvedModel, provenance, variant: resolvedVariant } = resolution
      actualModel = resolvedModel

      if (!parseModelString(actualModel)) {
        return {
          agentToUse: "",
          categoryModel: undefined,
          categoryPromptAppend: undefined,
          modelInfo: undefined,
          actualModel: undefined,
          isUnstableAgent: false,
          error: `Invalid model format "${actualModel}". Expected "provider/model" format (e.g., "anthropic/claude-sonnet-4-5").`,
        }
      }

      let type: "user-defined" | "inherited" | "category-default" | "system-default"
      const source = provenance
      switch (provenance) {
        case "override":
          type = "user-defined"
          break
        case "category-default":
        case "provider-fallback":
        case "dynamic-route":
          type = "category-default"
          break
        case "system-default":
          type = "system-default"
          break
      }

      modelInfo = { model: actualModel, type, source }

      const parsedModel = parseModelString(actualModel)
      const variantToUse = userCategories?.[args.category!]?.variant ?? resolvedVariant ?? resolved.config.variant
      categoryModel = parsedModel
        ? (variantToUse ? { ...parsedModel, variant: variantToUse } : parsedModel)
        : undefined
    }
  }

  const agentFallbackChain = resolveAgentFallbackChain(DEV_JUNIOR_AGENT, {
    userAgentOverrides: executorCtx.userAgentOverrides,
  })
  const fallbackChain = categoryFallbackSlots ?? agentFallbackChain ?? requirement?.fallbackChain

  if (!categoryModel && actualModel) {
    const parsedModel = parseModelString(actualModel)
    categoryModel = parsedModel ?? undefined
  }
  const categoryPromptAppend = resolved.promptAppend || undefined

  if (!categoryModel && !actualModel) {
    const categoryNames = Object.keys({ ...DEFAULT_CATEGORIES, ...userCategories })
    return {
      agentToUse: "",
      categoryModel: undefined,
      categoryPromptAppend: undefined,
      modelInfo: undefined,
      actualModel: undefined,
      isUnstableAgent: false,
      error: `Model not configured for category "${args.category}".

Configure in one of:
1. OpenCode: Set "model" in opencode.json
2. Kord AIOS: Set category model in kord-aios.json
3. Provider: Connect a provider with available models

Current category: ${args.category}
Available categories: ${categoryNames.join(", ")}`,
    }
  }

  const unstableModel = actualModel?.toLowerCase()
  const isUnstableAgent = resolved.config.is_unstable_agent === true || (unstableModel ? unstableModel.includes("gemini") || unstableModel.includes("minimax") : false)

  return {
    agentToUse: DEV_JUNIOR_AGENT,
    categoryModel,
    categoryPromptAppend,
    modelInfo,
    actualModel,
    isUnstableAgent,
    fallbackChain,
  }
}


export async function resolveSubagentExecution(
  args: DelegateTaskArgs,
  executorCtx: ExecutorContext,
  parentAgent: string | undefined,
  categoryExamples: string
): Promise<{ agentToUse: string; categoryModel: { providerID: string; modelID: string } | undefined; fallbackChain?: any[]; error?: string }> {
  const { client } = executorCtx

  if (!args.subagent_type?.trim()) {
    return { agentToUse: "", categoryModel: undefined, error: `Agent name cannot be empty.` }
  }

  const agentName = args.subagent_type.trim()

  if (agentName.toLowerCase() === DEV_JUNIOR_AGENT.toLowerCase()) {
    return {
      agentToUse: "",
      categoryModel: undefined,
      error: `Cannot use subagent_type="${DEV_JUNIOR_AGENT}" directly. Use category parameter instead (e.g., ${categoryExamples}).

Dev-Junior is spawned automatically when you specify a category. Pick the appropriate category for your task domain.`,
    }
  }

  if (isPlanAgent(agentName) && isPlanAgent(parentAgent)) {
    return {
      agentToUse: "",
      categoryModel: undefined,
      error: `You are plan. You cannot delegate to plan via task.

Create the work plan directly - that's your job as the planning agent.`,
    }
  }

  let agentToUse = agentName
  let categoryModel: { providerID: string; modelID: string } | undefined

  try {
    const agentsResult = await client.app.agents()
    type AgentInfo = { name: string; mode?: "subagent" | "primary" | "all"; model?: { providerID: string; modelID: string } }
    const agents = (agentsResult as { data?: AgentInfo[] }).data ?? agentsResult as unknown as AgentInfo[]

    const callableAgents = agents.filter((a) => a.mode !== "primary")

    const matchedAgent = callableAgents.find(
      (agent) => agent.name.toLowerCase() === agentToUse.toLowerCase()
    )
    if (!matchedAgent) {
      const isPrimaryAgent = agents
        .filter((a) => a.mode === "primary")
        .find((agent) => agent.name.toLowerCase() === agentToUse.toLowerCase())
      if (isPrimaryAgent) {
        return {
          agentToUse: "",
          categoryModel: undefined,
    error: `Cannot call primary agent "${isPrimaryAgent.name}" via task. Primary agents are top-level orchestrators.`,
        }
      }

      const availableAgents = callableAgents
        .map((a) => a.name)
        .sort()
        .join(", ")
      return {
        agentToUse: "",
        categoryModel: undefined,
        error: `Unknown agent: "${agentToUse}". Available agents: ${availableAgents}`,
      }
    }

    agentToUse = matchedAgent.name

    if (matchedAgent.model) {
      categoryModel = matchedAgent.model
    }
  } catch {
    // Proceed anyway - session.prompt will fail with clearer error if agent doesn't exist
  }

  const fallbackChain = resolveAgentFallbackChain(agentToUse, {
    userAgentOverrides: executorCtx.userAgentOverrides,
  })

  return { agentToUse, categoryModel, fallbackChain }
}
