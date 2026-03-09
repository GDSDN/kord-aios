# Init Delivery Scripts — Research

Analysis of potential Synkra-inspired delivery scripts for Kord AIOS.

## Classification Key

| Rank | Meaning | Implementation |
|------|---------|----------------|
| **A** | Tool | Implement as dedicated tool (MCP or built-in) |
| **B** | Prompt | Implement as skill/prompt template |
| **C** | Omit | Not needed — covered by existing mechanisms |

## Script Matrix

| Script | Description | Rank | Rationale |
|--------|-------------|------|------------|
| `validate-architecture` | Verify code matches designed architecture | B | Implement as skill with AST-grep checks |
| `check-dependencies` | Validate package.json vs actual imports | B | Implement as skill (scan imports, compare) |
| `compile-context` | Bundle relevant context for agent session | A | Core value — implement as MCP or tool |
| `generate-changelog` | Auto-generate changelog from commits | C | Agent can read git log directly |
| `validate-pr-metadata` | Check PR title, description, labels | C | Covered by checklist templates |
| `security-scan` | Run security audits (npm audit, etc.) | B | Implement as skill with external commands |
| `setup-hooks` | Install git hooks for project | C | Covered by install process |
| `sync-models` | Sync model configs across environments | C | Config-driven, not script-driven |
| `run-testsuite` | Execute test suite with reporting | B | Implement as skill (run cmd, parse output) |
| `benchmark-baseline` | Establish performance benchmarks | C | Can be done via ad-hoc prompts |

## Recommendations

**Priority A (Implement):**
- `compile-context` — highest value, enables efficient agent context assembly

**Priority B (Consider):**
- `validate-architecture` — useful for larger teams
- `check-dependencies` — catches drift between declared and used deps

**Priority C (Omit):**
- Most others are either covered by existing Kord mechanisms or better handled via agent prompts/templates.

## Notes

- Keep scripts lightweight — prefer skills over heavy tooling
- Avoid creating a "workflow engine" — let agents use their judgment
- Focus on high-value, low-friction automation
