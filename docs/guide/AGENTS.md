# USER GUIDES KNOWLEDGE BASE

## OVERVIEW

User-facing guides that explain how to install, configure, and use Kord AIOS. These are the primary onboarding documents for both humans and LLM agents.

## STRUCTURE
```
guide/
├── installation.md                           # Install guide (~60 lines)
├── overview.md                               # Getting started (~50 lines)
└── understanding-orchestration-system.md     # Deep dive, Mermaid diagrams (446 lines)
```

## FILE DETAILS

### `installation.md`
Two-section structure for dual audiences:

**"For Humans" section**:
- Paste this block into your OpenCode session
- Agent handles the rest (fetches guide via curl, follows instructions)

**"For LLM Agents" section**:
- Self-contained, machine-readable install instructions
- Uses `curl` to fetch from raw GitHub URL (NOT WebFetch — it summarizes and loses details)
- Includes: provider subscription questions, `kord-aios.json` setup, `opencode.json` plugin registration
- CLI flags: `--force`, `--installOpencode`, `--dry-run`, `--skip-doctor`

### `overview.md`
Getting started with Kord AIOS:
- **Ultrawork mode**: `ulw` keyword triggers autonomous execution
- **Plan mode**: `/plan` for interview-style planning
- **Agent invocation**: Direct `@agent` mentions
- **Key triggers**: `ultrawork`, `ulw`, `search`, `analyze`
- References `ultrawork-manifesto.md` for philosophy

### `understanding-orchestration-system.md`
Deep-dive into the three-layer architecture (446 lines):
- **Planning Layer**: @plan (Planner), @analyst, @qa
- **Execution Layer**: @build (Build-Loop), @dev, @dev-junior
- **Support Layer**: @librarian, @explore, @vision
- Mermaid flowcharts showing data flow
- Phase-by-phase walkthrough: Plan → Build → QA → Complete
- Model selection rationale per phase
- Category-based routing explanation

## HOW TO UPDATE GUIDES

1. Edit the relevant `.md` file
2. Maintain the dual-audience structure in `installation.md`
3. Test any curl commands or code blocks actually work
4. Update the README TOC if adding new sections
5. Keep line counts reasonable (< 500 lines per guide)

## HOW TO ADD A NEW GUIDE

1. Create `docs/guide/{topic}.md`
2. Add entry to `docs/guide/AGENTS.md` (this file)
3. Add link to `docs/AGENTS.md` structure tree
4. Add link to README TOC if user-facing
5. Use "Kord AIOS" branding, English only

## CONVENTIONS

- **English only**: All guides must be in English
- **curl over WebFetch**: LLM installation section uses curl (WebFetch summarizes and loses install steps)
- **No hardcoded versions**: Use "latest" or link to GitHub releases page
- **Self-contained**: Each guide should work standalone without requiring other guides
- **Mermaid diagrams**: Use for architecture flows — GitHub renders them natively
- **Tables**: Use for structured data (agent models, tool categories, config options)

## ANTI-PATTERNS

- **WebFetch in install**: WebFetch summarizes content — curl preserves the exact install instructions
- **Missing context**: Guides should explain WHY, not just HOW — include rationale for design decisions
- **Giant guides**: Split into focused topics if a guide exceeds ~500 lines
