import type { CommandDefinition } from "../claude-code-command-loader"
import type { BuiltinCommandName, BuiltinCommands } from "./types"
import { INIT_DEEP_TEMPLATE } from "./templates/init-deep"
import { RALPH_LOOP_TEMPLATE, CANCEL_RALPH_TEMPLATE } from "./templates/ralph-loop"
import { STOP_CONTINUATION_TEMPLATE } from "./templates/stop-continuation"
import { REFACTOR_TEMPLATE } from "./templates/refactor"
import { START_WORK_TEMPLATE } from "./templates/start-work"
import { CHECKPOINT_TEMPLATE } from "./templates/checkpoint"
import { STATUS_TEMPLATE } from "./templates/status"
import { SQUAD_TEMPLATE } from "./templates/squad"
import { SQUAD_CREATE_TEMPLATE } from "./templates/squad-create"

const BUILTIN_COMMAND_DEFINITIONS: Record<BuiltinCommandName, Omit<CommandDefinition, "name">> = {
  "init-deep": {
    description: "(builtin) Initialize hierarchical AGENTS.md knowledge base",
    template: `<command-instruction>
${INIT_DEEP_TEMPLATE}
</command-instruction>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[--create-new] [--max-depth=N]",
  },
   "ralph-loop": {
     description: "(builtin) Start self-referential development loop until completion",
     template: `<command-instruction>
${RALPH_LOOP_TEMPLATE}
</command-instruction>

<user-task>
$ARGUMENTS
</user-task>`,
     argumentHint: '"task description" [--completion-promise=TEXT] [--max-iterations=N]',
   },
   "ulw-loop": {
     description: "(builtin) Start ultrawork loop - continues until completion with ultrawork mode",
     template: `<command-instruction>
${RALPH_LOOP_TEMPLATE}
</command-instruction>

<user-task>
$ARGUMENTS
</user-task>`,
     argumentHint: '"task description" [--completion-promise=TEXT] [--max-iterations=N]',
   },
  "cancel-ralph": {
    description: "(builtin) Cancel active Ralph Loop",
    template: `<command-instruction>
${CANCEL_RALPH_TEMPLATE}
</command-instruction>`,
  },
  refactor: {
    description:
      "(builtin) Intelligent refactoring command with LSP, AST-grep, architecture analysis, codemap, and TDD verification.",
    template: `<command-instruction>
${REFACTOR_TEMPLATE}
</command-instruction>`,
    argumentHint: "<refactoring-target> [--scope=<file|module|project>] [--strategy=<safe|aggressive>]",
  },
  "start-work": {
    description: "(builtin) Start Kord work session from Plan plan",
    agent: "build",
    template: `<command-instruction>
${START_WORK_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[plan-name]",
  },
  "stop-continuation": {
    description: "(builtin) Stop all continuation mechanisms (ralph loop, todo continuation, boulder) for this session",
    template: `<command-instruction>
${STOP_CONTINUATION_TEMPLATE}
</command-instruction>`,
  },
  checkpoint: {
    description: "(builtin) Trigger a @po checkpoint decision on current execution",
    template: `<command-instruction>
${CHECKPOINT_TEMPLATE}
</command-instruction>`,
  },
  status: {
    description: "(builtin) Show current plan progress, wave, and pending items",
    template: `<command-instruction>
${STATUS_TEMPLATE}
</command-instruction>`,
  },
  squad: {
    description: "(builtin) Switch active squad context",
    template: `<command-instruction>
${SQUAD_TEMPLATE}
</command-instruction>

<squad-name>
$ARGUMENTS
</squad-name>`,
    argumentHint: "<squad-name>",
  },
  "squad-create": {
    description: "(builtin) Create a new specialized agent squad for a domain",
    template: `<command-instruction>
${SQUAD_CREATE_TEMPLATE}
</command-instruction>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "<domain-name>",
  },
}

export function loadBuiltinCommands(
  disabledCommands?: BuiltinCommandName[]
): BuiltinCommands {
  const disabled = new Set(disabledCommands ?? [])
  const commands: BuiltinCommands = {}

  for (const [name, definition] of Object.entries(BUILTIN_COMMAND_DEFINITIONS)) {
    if (!disabled.has(name as BuiltinCommandName)) {
      const { argumentHint: _argumentHint, ...openCodeCompatible } = definition
      commands[name] = { ...openCodeCompatible, name } as CommandDefinition
    }
  }

  return commands
}
