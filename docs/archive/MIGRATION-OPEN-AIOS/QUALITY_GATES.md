# Quality Gates (Kord AIOS)

Run these before every module commit.

Core:
```bash
bun run typecheck
```

Minimum regression set:
```bash
bun test src/agents/utils.test.ts \
  src/agents/topology.test.ts \
  src/config/schema.test.ts \
  src/plugin-handlers/config-handler.test.ts \
  src/tools/delegate-task/tools.test.ts \
  src/cli/index.test.ts \
  src/cli/init-command.test.ts \
  src/cli/install.test.ts
```

Hook/tool regressions when touched:
```bash
bun test src/hooks/keyword-detector src/hooks/auto-slash-command
bun test src/tools/slashcommand
bun test src/tools/call-omo-agent
```
