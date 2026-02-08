# Runtime Folder Separation

This repo keeps migration-safe boundaries between policy, runtime state, imported framework files, and OMOC engine code.

## Folder responsibilities

- `.sisyphus/`: repo-internal policy and legacy compatibility context. Treat as project governance/internal policy data.
- `.opencode/`: project runtime workspace used by OpenCode (agents, skills, rules, generated runtime artifacts).
- `layer/aios/`: imported AIOS framework layer/vendor-style content. Update intentionally, avoid ad-hoc edits.
- `src/**`: OMOC engine implementation and active product code.

## Contributor guardrails

- Put engine/code changes in `src/**` unless a change is explicitly framework-layer related.
- Do not mix runtime state (`.opencode/`) with policy docs (`.sisyphus/`).
- Treat `layer/aios/` as an upstream layer: document why any local modification is needed.
- In migration PRs, call out which layer changed and why to reduce review ambiguity.
