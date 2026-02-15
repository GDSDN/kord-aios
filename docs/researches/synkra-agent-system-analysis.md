> **Historical Research Document** — Contains references to legacy project names (Synkra, OMOC, OmO) preserved for historical accuracy.

# Synkra AIOS Agent System — Deep Analysis

**Date**: 2026-02-10
**Purpose**: Understand how Synkra AIOS agents work across three directories, what gets loaded in Claude Code, and what this means for Kord Wave 1 agent integration.

---

## 1. Three-Tier Agent Architecture

Synkra AIOS has **three** agent locations, each serving a distinct purpose:

### Tier 1: Canonical Source — `.aios-core/development/agents/*.md`

| Property | Value |
|----------|-------|
| **Purpose** | Framework-shipped, full self-contained agent definitions |
| **Format** | Markdown with embedded YAML block (persona + commands + dependencies) |
| **Count** | 12 agents: aios-master, analyst, architect, data-engineer, dev, devops, pm, po, qa, sm, squad-creator, ux-design-expert |
| **Size** | 10–23 KB each (rich definitions) |
| **Git status** | Committed (shipped with npm package) |

Each file contains:
- `ACTIVATION-NOTICE` header (self-contained, no external loads needed)
- `activation-instructions` (5-step pipeline: read file → adopt persona → run UnifiedActivationPipeline → display greeting → HALT)
- `agent` block (name, id, title, icon, whenToUse, customization)
- `persona_profile` (archetype, zodiac, communication style, greeting levels)
- `persona` (role, identity, style, focus, core_principles)
- `commands` list with `visibility` metadata ([full, quick, key])
- `dependencies` (tasks, checklists, scripts, tools, templates)
- Quick Commands section and Agent Collaboration section

**Example (dev.md)**:
```yaml
agent:
  name: Dex
  id: dev
  title: Full Stack Developer
  icon: 💻
persona_profile:
  archetype: Builder
  zodiac: '♒ Aquarius'
persona:
  role: Expert Senior Software Engineer & Implementation Specialist
  style: Extremely concise, pragmatic, detail-oriented, solution-focused
```

### Tier 2: IDE-Synced Copies — `.claude/commands/AIOS/agents/*.md`

| Property | Value |
|----------|-------|
| **Purpose** | Synced copies for Claude Code command system |
| **Format** | Same as Tier 1 (full-markdown-yaml) |
| **Count** | 13 files (12 agents + `_README.md`) |
| **Size** | Nearly identical to Tier 1 (dev.md: 22980 vs 22912 chars) |
| **Sync mechanism** | `framework-config.yaml` → `ide_sync_system` |
| **Footer** | `*AIOS Agent - Synced from .aios-core/development/agents/{name}.md*` |

The sync system is explicitly configured:

```yaml
# From framework-config.yaml
ide_sync_system:
  enabled: true
  source: ".aios-core/development/agents"
  targets:
    claude-code:
      enabled: true
      path: ".claude/commands/AIOS/agents"
      format: "full-markdown-yaml"
    cursor:
      enabled: true
      path: ".cursor/rules/agents"
      format: "condensed-rules"
```

**Conclusion**: Tier 2 is a **mirror** of Tier 1. The ~68 byte difference is just the sync footer line. These are NOT different agents.

### Tier 3: Thin Wrappers — `.claude/agents/aios-*.md`

| Property | Value |
|----------|-------|
| **Purpose** | Claude Code native agent frontmatter for `@agent` spawning |
| **Format** | YAML frontmatter + short markdown instructions |
| **Count** | 10 AIOS agents + 14 other project-specific agents |
| **Size** | 2–5 KB each (thin) |
| **Prefix** | `aios-` to distinguish from non-AIOS agents |

Each thin wrapper contains:
1. **Frontmatter** (Claude Code agent format):
   ```yaml
   name: aios-dev
   description: AIOS Developer autônomo...
   model: opus
   tools: [Read, Grep, Glob, Write, Edit, Bash]
   permissionMode: bypassPermissions
   memory: project
   ```
2. **Persona Loading**: `Read .claude/commands/AIOS/agents/dev.md and adopt the persona of Dex (Builder).`
3. **Context Loading**: Git status, gotchas, technical preferences, project config
4. **Mission Router**: Table mapping mission keywords → task files
5. **IDS Protocol**: Search-first pattern for file creation
6. **Autonomous Elicitation Override**: Auto-decide when task says "ask user"
7. **Constraints**: Agent-specific restrictions

**Key difference from Tier 1**: These skip the greeting/activation pipeline and go straight to work. They're designed for **autonomous background spawning**, not interactive sessions.

---

## 2. How Synkra AIOS Loads in Claude Code

### Installation Flow

```
npm install synkra-aios
        │
        ▼
.aios-core/ installed (framework)
        │
        ▼
IDE Sync System runs
        │
        ├── .aios-core/development/agents/*.md
        │   → copies to .claude/commands/AIOS/agents/*.md
        │
        └── (similar syncs for cursor, windsurf, etc.)
```

### Runtime: What Claude Code Actually Loads

When user types `@aios-dev` in Claude Code:

```
1. Claude Code reads .claude/agents/aios-dev.md (thin wrapper)
2. Frontmatter sets: model=opus, tools, permissionMode=bypassPermissions
3. Body instructs: "Read .claude/commands/AIOS/agents/dev.md"
4. Agent loads full persona from the synced copy
5. Context loading: git status, gotchas, config
6. Mission router: matches keywords → task files
7. Executes task in YOLO mode (autonomous)
```

When user manually activates via command `/AIOS dev`:

```
1. Claude reads .claude/commands/AIOS/agents/dev.md directly
2. Follows activation-instructions (5-step pipeline)
3. Runs UnifiedActivationPipeline.activate('dev')
4. Displays greeting via GreetingBuilder
5. HALTs and awaits user commands (*develop, *run-tests, etc.)
```

### Summary: Two activation paths, same persona

| Path | Entry Point | Mode | Greeting | Task Routing |
|------|------------|------|----------|-------------|
| `@aios-dev` | `.claude/agents/aios-dev.md` | Autonomous/YOLO | Skipped | Mission keyword from spawn prompt |
| `/AIOS dev` or manual | `.claude/commands/AIOS/agents/dev.md` | Interactive | Full pipeline | User types `*command` |

---

## 3. The `aios-*` Prefix Explained

The `.claude/agents/` directory contains **24 agents total**:

| Type | Count | Examples |
|------|-------|---------|
| **AIOS core** (prefixed `aios-`) | 10 | aios-dev, aios-qa, aios-analyst, aios-architect, aios-sm, aios-pm, aios-po, aios-devops, aios-ux, aios-data-engineer |
| **Project-specific** (no prefix) | 14 | copy-chief, cyber-chief, data-chief, db-sage, design-chief, design-system, legal-chief, story-chief, tools-orchestrator, traffic-masters-chief, squad, sop-extractor, oalanicolas, pedro-valerio |

The `aios-` prefix distinguishes framework agents from project/custom agents. The non-prefixed agents are Synkra-specific project roles (not part of the transferable AIOS methodology).

---

## 4. AIOS Agent Persona Map (What Matters for Kord)

| AIOS ID | Persona Name | Archetype | OMOC Equivalent | Kord Target |
|---------|-------------|-----------|-----------------|-------------|
| aios-master | Orion | Orchestrator | sisyphus | @kord |
| dev | Dex | Builder | hephaestus + sisyphus-junior | @dev, @dev-junior |
| qa | Quinn | Guardian | momus | @qa |
| architect | Sage | Strategist | oracle | @architect |
| analyst | Atlas | Decoder | metis | @analyst |
| sm | River | Navigator | — (new) | @sm |
| pm | Morgan | Visionary | — (new) | @pm |
| po | Pax | Custodian | — (new) | @po |
| devops | Gage | Sentinel | — (new) | @devops |
| data-engineer | (unnamed) | — | — (new) | @data-engineer |
| ux-design-expert | Uma | Empath | — (new) | @ux-design-expert |
| squad-creator | Craft | Assembler | — (new) | @squad-creator |

**Note**: `librarian`, `explore`, and `vision` (multimodal-looker) have NO AIOS equivalent. They are OMOC-only utility agents.

---

## 5. OMOC Agent Architecture (for comparison)

OMOC agents are **TypeScript factories** producing `AgentConfig` objects:

```typescript
export function createOracleAgent(model: string): AgentConfig {
  return {
    description: "...",
    mode: "subagent",
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: ORACLE_SYSTEM_PROMPT,
    thinking: { type: "enabled", budgetTokens: 32000 },
  }
}
```

Key OMOC patterns:
- **Dynamic prompt builder**: `buildDelegationTable()`, `buildToolSelectionTable()`, etc.
- **AgentPromptMetadata**: category, cost, triggers, useWhen, avoidWhen, promptAlias
- **Mode system**: `"primary"` (respects UI model) vs `"subagent"` (own fallback chain)
- **Tool restrictions**: `createAgentToolRestrictions()` / `createAgentToolAllowlist()`
- **Model awareness**: `isGptModel()` for GPT-specific config (reasoningEffort vs thinking)

### OMOC Agent Summary

| Agent | Mode | Temp | Size (prompt) | Key Feature |
|-------|------|------|--------------|-------------|
| sisyphus (@kord) | primary | — | ~530 lines | Dynamic delegation table, task management |
| hephaestus (@dev) | primary | — | ~619 lines | Todo discipline, autonomous deep work |
| oracle (@architect) | subagent | 0.1 | ~171 lines | Decision framework, tiered response |
| metis (@analyst) | subagent | 0.3 | ~347 lines | Intent classification, pre-planning |
| momus (@qa) | subagent | 0.1 | ~244 lines | Plan review, blocker-only focus |
| librarian | subagent | 0.1 | ~329 lines | GitHub search, doc discovery, permalinks |
| explore | subagent | 0.1 | ~125 lines | Parallel grep, structured results |
| multimodal-looker (@vision) | subagent | 0.1 | ~59 lines | Media file interpretation |

---

## 6. Implications for Kord Wave 1

### What to extract from AIOS agents

For each Kord agent that has an AIOS equivalent:

| Extract | What | Example |
|---------|------|---------|
| **Persona identity** | name, archetype, role, style | `Dex (Builder)`, pragmatic, detail-oriented |
| **Core principles** | Behavioral rules | IDS protocol, story-file-updates-ONLY |
| **Collaboration map** | Who delegates to whom | dev → qa reviews, dev → devops pushes |
| **whenToUse** | When to choose this agent | "Use for code implementation, debugging, refactoring" |
| **Commands (as methodology)** | Star commands → Kord methodology rules | `*develop-story` → story-driven workflow |
| **Constraints** | Hard boundaries | "NEVER commit to git", "NEVER modify files outside scope" |

### What NOT to migrate from AIOS

| Skip | Why |
|------|-----|
| Activation pipeline (`UnifiedActivationPipeline`) | OMOC has its own hook-based activation |
| Greeting system (`GreetingBuilder`) | Not applicable to OpenCode plugin agents |
| Star commands (`*develop`, `*help`) | Replaced by Kord's `/plan`, `/start-work` commands |
| Mission Router | Replaced by OMOC's delegation system (`task` tool) |
| Context loading (gotchas, config) | Replaced by OMOC hooks (session-notification, compaction-context, etc.) |
| YAML frontmatter format | OMOC uses TS `AgentConfig` objects |
| `.aios-core/` file dependencies | Tasks/checklists become built-in skills or hook logic |
| Portuguese vocabulary | English-only policy |
| IDE sync system | Not needed — Kord is a single-IDE plugin |

### Per-agent merge strategy

**Agents with BOTH OMOC + AIOS sources** (merge):
- @kord = OMOC sisyphus factory + AIOS Orion persona/authority
- @dev = OMOC hephaestus factory + AIOS Dex methodology (story-driven, IDS protocol)
- @qa = OMOC momus factory + AIOS Quinn methodology (gate decisions, review workflows)
- @architect = OMOC oracle factory + AIOS Sage methodology (strategic analysis)
- @analyst = OMOC metis factory + AIOS Atlas methodology (deep research, brainstorming)

**Agents with OMOC source ONLY** (keep as-is, update prompts):
- @librarian = OMOC librarian (no AIOS equivalent)
- @explore = OMOC explore (no AIOS equivalent)
- @vision = OMOC multimodal-looker (no AIOS equivalent)
- @dev-junior = OMOC sisyphus-junior (AIOS dev is merged into @dev, junior has no separate AIOS persona)

**Agents with AIOS source ONLY** (new, need TS factory):
- @sm = AIOS River (story management)
- @pm = AIOS Morgan (product management)
- @po = AIOS Pax (backlog management)
- @devops = AIOS Gage (CI/CD, infrastructure)
- @data-engineer = AIOS (unnamed) (database, schemas)
- @ux-design-expert = AIOS Uma (UX design)
- @squad-creator = AIOS Craft (team assembly)

### Build vs Plan conflict: `@build` has NO direct AIOS equivalent

The OMOC `atlas` agent (now `@build`) is the **agentic execution loop** — it reads plans and delegates to dev/dev-junior. AIOS has no direct equivalent because AIOS uses the `*build` command within the dev agent. For Kord, `@build` keeps the OMOC atlas factory with updated references to `docs/kord/plans/`.

---

## 7. Revised Wave 1 Strategy

Based on this analysis, Wave 1 should be split into three phases:

### Phase 1A: Merged agents (OMOC + AIOS) — 5 agents
Update existing TS factories with AIOS methodology integration:
- @kord, @dev, @qa, @architect, @analyst

### Phase 1B: OMOC-only agents — 4 agents
Update prompts for Kord naming, keep existing factories:
- @build, @dev-junior, @librarian, @explore, @vision

### Phase 1C: New AIOS-sourced agents — 7 agents
Create new TS factories from AIOS persona definitions:
- @sm, @pm, @po, @devops, @data-engineer, @ux-design-expert, @squad-creator

### Phase 1D: Wiring
- Update `types.ts` (BuiltinAgentName union), `utils.ts` (agentSources), `index.ts` (exports)
- Update delegate-task constants for new categories
- Tests for all agents

---

## 8. Key Questions for Plan Update

1. **Should new AIOS agents (Phase 1C) have full OMOC-style dynamic prompt building?**
   Recommendation: Start minimal (static prompts). Add dynamic features in Wave 2+ as needed.

2. **Should AIOS persona names (Dex, Quinn, etc.) appear in prompts?**
   Recommendation: Yes, as identity anchors in the system prompt. They help with consistent agent behavior.

3. **What model should new AIOS agents use?**
   Recommendation: All new agents as `subagent` mode with model fallback chains similar to existing specialists.

4. **Should star commands be migrated at all?**
   Recommendation: No. The methodology (story-driven workflow, gate decisions) is absorbed into prompts and hooks. Star commands are AIOS-specific UI.
