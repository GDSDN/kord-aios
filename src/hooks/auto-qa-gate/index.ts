import type { PluginInput } from "@opencode-ai/plugin"
import { executeHookCommand, log } from "../../shared"

export interface AutoQaGateConfig {
  enabled?: boolean
  /** Only run gate when any changed file starts with one of these prefixes. */
  path_prefixes?: string[]
  /** Commands executed in repo root; non-zero exit = FAIL. */
  commands?: string[]
  /** Truncate each command's output to avoid bloating the chat context. */
  max_output_chars?: number
}

export interface AutoQaGateDeps {
  getGitStatusPorcelain?: (cwd: string) => Promise<string>
  runCommand?: (cwd: string, command: string) => Promise<{ exitCode: number; stdout?: string; stderr?: string }>
}

interface PendingContext {
  preStatus: string
  runInBackground: boolean
}

const DEFAULT_PREFIXES = ["src/", "assets/"]
const DEFAULT_COMMANDS = ["bun test", "bun run typecheck", "bun run build"]
const DEFAULT_MAX_OUTPUT_CHARS = 4000

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n… (truncated)`
}

function parseChangedFilesFromPorcelain(porcelain: string): string[] {
  // Porcelain format examples:
  //  M path/to/file
  // ?? new/file
  // R  old -> new
  const lines = porcelain
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter(Boolean)

  const files: string[] = []
  for (const line of lines) {
    // strip status columns
    const rest = line.length >= 3 ? line.slice(3).trim() : ""
    if (!rest) continue
    if (rest.includes(" -> ")) {
      const parts = rest.split(" -> ")
      files.push(parts[parts.length - 1].trim())
      continue
    }
    files.push(rest)
  }
  return Array.from(new Set(files))
}

function hasRelevantChanges(changedFiles: string[], prefixes: string[]): boolean {
  return changedFiles.some((f) => prefixes.some((p) => f.startsWith(p)))
}

async function defaultGetGitStatusPorcelain(cwd: string): Promise<string> {
  const result = await executeHookCommand("git status --porcelain", "", cwd)
  if (result.exitCode !== 0) return ""
  return result.stdout ?? ""
}

async function defaultRunCommand(cwd: string, command: string): Promise<{ exitCode: number; stdout?: string; stderr?: string }> {
  return executeHookCommand(command, "", cwd)
}

export function createAutoQaGateHook(
  ctx: PluginInput,
  config?: AutoQaGateConfig,
  deps?: AutoQaGateDeps
) {
  const enabled = config?.enabled === true
  const pathPrefixes = config?.path_prefixes?.length ? config.path_prefixes : DEFAULT_PREFIXES
  const commands = config?.commands?.length ? config.commands : DEFAULT_COMMANDS
  const maxOutputChars = config?.max_output_chars ?? DEFAULT_MAX_OUTPUT_CHARS

  const getGitStatusPorcelain = deps?.getGitStatusPorcelain ?? defaultGetGitStatusPorcelain
  const runCommand = deps?.runCommand ?? defaultRunCommand

  const pending = new Map<string, PendingContext>()

  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown> }
    ): Promise<void> => {
      if (!enabled) return
      if (input.tool !== "task") return
      if (!input.callID) return

      const runInBackground = output.args.run_in_background === true

      // Avoid running heavy gates for background exploration tasks.
      if (runInBackground) {
        pending.set(input.callID, { preStatus: "", runInBackground: true })
        return
      }

      const preStatus = await getGitStatusPorcelain(ctx.directory)
      pending.set(input.callID, { preStatus, runInBackground: false })
    },

    "tool.execute.after": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { output?: string }
    ): Promise<void> => {
      if (!enabled) return
      if (input.tool !== "task") return

      const context = input.callID ? pending.get(input.callID) : undefined
      if (input.callID) pending.delete(input.callID)
      if (!context || context.runInBackground) return

      const postStatus = await getGitStatusPorcelain(ctx.directory)
      if (!postStatus || postStatus === context.preStatus) return

      const changedFiles = parseChangedFilesFromPorcelain(postStatus)
      if (!hasRelevantChanges(changedFiles, pathPrefixes)) return

      const results: Array<{ command: string; exitCode: number; out: string }> = []
      for (const command of commands) {
        const res = await runCommand(ctx.directory, command)
        const stdout = res.stdout ?? ""
        const stderr = res.stderr ?? ""
        const combined = stderr ? `${stdout}\n[stderr]\n${stderr}`.trim() : stdout.trim()
        results.push({
          command,
          exitCode: res.exitCode,
          out: truncate(combined, maxOutputChars),
        })
      }

      const ok = results.every((r) => r.exitCode === 0)
      const report = [
        "\n[AUTO QA GATE]",
        `Status: ${ok ? "PASS" : "FAIL"}`,
        "Changed files:",
        ...changedFiles.map((f) => `- ${f}`),
        "Checks:",
        ...results.map((r) => {
          const status = r.exitCode === 0 ? "PASS" : `FAIL (exit ${r.exitCode})`
          return `- ${r.command}: ${status}${r.out ? `\n${r.out}` : ""}`
        }),
      ].join("\n")

      if (typeof output.output === "string") {
        output.output += report
      } else {
        output.output = report
      }

      log("[auto-qa-gate] executed", {
        ok,
        changedFiles,
        commands,
      })
    },
  }
}
