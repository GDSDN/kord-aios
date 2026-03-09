# Engine vs. Content Boundary — Curated Export Architecture

**Status:** Draft  
**Created:** 2026-03-06  
**Author:** Architect  
**Context:** Analysis grounded in current repo (`src/features/`, `src/cli/`, `.kord/`) and Synkra parity audit (`docs/kord/research/synkra-methodology-parity-audit.md`).

> Note: this is a pre-decision audit snapshot.
>
> Authoritative final decisions now live in:
> - `docs/kord/architecture/content-layer-target-architecture-adr.md`
> - `docs/kord/architecture/content-source-canonical-map.md`
> - `docs/kord/plans/content-layer-curated-export-alignment.md`
>
> In particular, newer decisions supersede parts of this audit:
> - `init` is the only supported content-delivery path
> - `extract` is removed from the product-facing architecture
> - agent-facing project guidance is unified under `.kord/instructions/`
> - exported public methodology naming uses `greenfield|brownfield`

---

## 1. Problem Statement

Kord AIOS bundles methodology content and plugin engine in a way that violates a clean separation:

- **Content** (skills, agent prompts, commands, workflows, guides, templates) is often compiled into TypeScript or embedded as string literals, making it non-editable without rebuilding.
- **Export** (`bunx kord-aios extract`) has an incomplete surface — it covers agents, skills, squads, and commands, but misses guides, standards, rules, and templates.
- **Commands export is structurally broken** — TypeScript `.ts` source files are exported as-is to `.opencode/commands/`, but OpenCode expects `.md` command files.
- **Hardcoded skills** (5) are TypeScript constants; they cannot be extracted or overridden by users.
- **Templates and guides** are string literals in `src/cli/project-layout.ts` (1437 lines); no extract mechanism exists for them.
- **Skills domain hierarchy** is lost on export: `kord-aios/analysis/spec-gather-requirements/SKILL.md` → `skills/spec-gather-requirements/SKILL.md`.
- The `src/features/builtin-workflows/` engine has only **1 workflow** (`greenfield-fullstack.yaml`), while `src/cli/scaffolder.ts` scaffolds 2 (`greenfield-fullstack`, `brownfield-discovery`) using `BUILTIN_WORKFLOW_YAMLS` — and `.kord/workflows/` on this very project has **14**. There is no canonical source of truth.

The net effect: Synkra-level methodology depth is locked in the binary, partially surfaced through an incomplete and partially broken export.

---

## 2. Current Asset Inventory

### 2.1 Classification Table

| Asset Category | Current Home | Delivery | Extract? | Overridable? | Issues |
|---|---|---|---|---|---|
| **T0 Agents** (kord, dev, builder, planner) | `src/agents/*.ts` (compiled) | Engine | No | No | Intentional — protected |
| **T2 Agents** (pm, po, qa, sm, analyst …) | `src/features/builtin-agents/*.md` → `prompts.ts` (auto-generated) | Extract → `.opencode/agents/` | Yes | Yes | Dual-source: `.md` canonical, `prompts.ts` derived |
| **Hardcoded Skills** (5: git-master, playwright, frontend-ui-ux, dev-browser, agent-browser) | `src/features/builtin-skills/skills/*.ts` | Engine | No | No | `git-master.ts` is 1107 lines; users cannot override |
| **Methodology Skills** (144) | `src/features/builtin-skills/skills/kord-aios/{domain}/{skill}/SKILL.md` | Extract → flat `skills/{name}/SKILL.md` | Yes (flat) | Yes | Domain hierarchy lost; base-path injection hardcodes dist path |
| **Commands** (15) | `src/features/builtin-commands/templates/*.ts` + `commands.ts` | Engine + Extract (broken) | Yes (.ts files) | No | Extract copies `.ts` source; OpenCode needs `.md` |
| **Squads** (1 builtin: code) | `src/features/builtin-squads/code/SQUAD.yaml` | Extract → `.opencode/squads/` | Yes | Yes | Not a runtime load path — must be extracted. Clean. |
| **Workflows** (1 engine, 2 scaffolded) | `src/features/builtin-workflows/` (1 YAML) | Scaffolder embeds via `BUILTIN_WORKFLOW_YAMLS` | Via init only | Yes (after init) | 14 live in `.kord/workflows/`; no canonical source; 13 locked out of users |
| **Templates** (12 items: story.md, adr.md, etc.) | String literals in `src/cli/project-layout.ts` | Scaffolder | No | Only after init | Cannot re-extract; project-layout.ts is 1437 lines of mixed content |
| **Checklists** (6 items) | String literals in `src/cli/project-layout.ts` | Scaffolder | No | Only after init | Same problem as templates |
| **Guides** (2: new-project.md, existing-project.md) | String literals in `src/cli/project-layout.ts` | Scaffolder | No | Only after init | Synkra depth gap documented; not re-extractable |
| **Standards** (4: quality-gates.md, decision-heuristics.md, rubrics) | String literals in `src/cli/project-layout.ts` | Scaffolder | No | Only after init | Not re-extractable |
| **Rules** (kord-rules.md, project-mode.md) | String literals in `src/cli/project-layout.ts` | Scaffolder | No | Only after init | Not re-extractable |
| **Hooks** (40+) | `src/hooks/` | Engine only | No | No | Correct — engine-exclusive |
| **Tools** (25+) | `src/tools/` | Engine only | No | No | Correct — engine-exclusive |
| **MCP infrastructure** | `src/mcp/`, `src/features/skill-mcp-manager/` | Engine only | No | No | Correct |

### 2.2 The Boundary (Current, Actual)

```
ENGINE (cannot be exported, not user-editable)
  ├── Hooks (40+)
  ├── Tools (25+): LSP, AST-grep, delegation, session, background
  ├── T0 Agents (4): kord, dev, builder, planner
  ├── Hardcoded skills (5): TypeScript constants, no SKILL.md
  ├── Commands (15): TypeScript templates, broken extract
  ├── Background agent manager, MCP infra, workflow engine runtime
  └── CLI infrastructure

CONTENT (partially exportable, partially editable)
  ├── T2 Agents (12): .md canonical → .ts derived → extract → user override ✅
  ├── Methodology Skills (144): SKILL.md, extract works but flattens hierarchy ⚠️
  ├── Squads (1): SQUAD.yaml, extract → user dir, runtime reads user dir ✅
  ├── Workflows (only 1 of 14): engine has 1; 13 locked in .kord/ ⚠️
  └── Templates, Guides, Standards, Rules, Checklists: TypeScript strings, no extract ❌
```

---

## 3. Synkra Comparison

Synkra AIOS delivered methodology as a **project content pack** on disk — `.aios-core/` — that users could read, edit, and version-control. The pack was the source of truth; the engine read from it at runtime.

Kord inherited this model conceptually (`.kord/` + `docs/kord/`) but diverged in implementation:

| Dimension | Synkra AIOS | Kord AIOS (current) |
|---|---|---|
| Methodology delivery | `.aios-core/` directory on disk, fully editable | Mix: engine-embedded + init-scaffolded, partial extract |
| User can re-extract after update? | Read from source always | No — templates/guides are one-shot scaffolding |
| Commands | Markdown files | TypeScript source files (broken extract) |
| Workflows | YAML files in known directory | Only 1 in engine; 13 locked in dev `.kord/` |
| Templates | Editable .md on disk | String literals in TS, user edits `.kord/templates/` copy |
| Guides | Deep phase/gate docs | Quickstart-level; Synkra parity gap identified in audit |
| Skills | YAML/Markdown per skill | Mostly SKILL.md (144) + 5 compiled TypeScript constants |

---

## 4. Target Architecture

### 4.1 Canonical Boundary (Target)

**Rule:** If it encodes methodology (what to do, how to act, what to produce) → Content. If it executes machinery (hook dispatch, tool I/O, agent spawning) → Engine.

```
ENGINE (compiled TypeScript, never exported)
  ├── Hooks (all 40+)
  ├── Tools (all 25+)
  ├── T0 Agents (kord, dev, builder, planner) — protected
  ├── Plugin infrastructure (index.ts, plugin-handlers, plugin-state)
  ├── Background agent manager, MCP clients, LSP client
  ├── Workflow runtime (engine.ts, registry.ts — not YAML definitions)
  ├── Skill loader machinery (kord-aios-loader.ts — not SKILL.md content)
  └── CLI installer/doctor machinery (not the content it scaffolds)

CONTENT (canonical .md/.yaml source files, fully extractable)
  ├── T2 Agents (12): *.md in src/features/builtin-agents/ [ALREADY CORRECT]
  ├── Methodology Skills (144): SKILL.md files [ALREADY CORRECT]
  ├── Hardcoded Skills (5): must be converted to SKILL.md or get extract support
  ├── Commands (15): must be converted from .ts templates to .md files
  ├── Squads (seed: code): SQUAD.yaml [ALREADY CORRECT]
  ├── Workflows (all): must all live in src/features/builtin-workflows/ [GAP: 13 missing]
  ├── Templates (12): must be moved from project-layout.ts to src/features/builtin-templates/
  ├── Checklists (6+): must be moved to src/features/builtin-checklists/
  ├── Guides (2+): must be moved to src/features/builtin-guides/
  ├── Standards (4+): must be moved to src/features/builtin-standards/ or builtin-guides/
  └── Rules (kord-rules.md, project-mode.md): must be moved to src/features/builtin-rules/
```

### 4.2 Proposed Source Tree (Target)

```
src/features/
├── builtin-agents/          ← T2 agents (.md canonical) [EXISTS, KEEP]
├── builtin-skills/
│   └── skills/
│       ├── *.ts             ← 5 hardcoded skills (convert 4 to SKILL.md; keep playwright)
│       └── kord-aios/       ← 144 methodology skills [EXISTS, KEEP]
├── builtin-squads/          ← Squad seeds (SQUAD.yaml) [EXISTS, KEEP]
├── builtin-commands/        ← Commands as .md files [REFACTOR from .ts templates]
│   ├── init-deep.md
│   ├── ralph-loop.md
│   ├── refactor.md
│   └── ... (15 total)
├── builtin-workflows/       ← All workflow YAML definitions [ADD 13 missing]
│   ├── greenfield-fullstack.yaml
│   ├── brownfield-discovery.yaml
│   ├── brownfield-fullstack.yaml
│   └── ... (14 total)
├── builtin-templates/       ← NEW: Move out of project-layout.ts
│   ├── story.md
│   ├── adr.md
│   ├── prd.md
│   ├── epic.md
│   ├── task.md
│   ├── qa-gate.md
│   └── qa-report.md
├── builtin-checklists/      ← NEW: Move out of project-layout.ts
│   ├── checklist-story-draft.md
│   ├── checklist-story-dod.md
│   ├── checklist-pr-review.md
│   ├── checklist-architect.md
│   ├── checklist-pre-push.md
│   ├── checklist-self-critique.md
│   └── checklist-agent-quality-gate.md
├── builtin-guides/          ← NEW: Move out of project-layout.ts
│   ├── new-project.md
│   └── existing-project.md
├── builtin-standards/       ← NEW: Move out of project-layout.ts
│   ├── quality-gates.md
│   ├── decision-heuristics.md
│   ├── onboarding-depth-rubric.md
│   └── methodology-artifacts-quality-rubric.md
└── builtin-rules/           ← NEW: Move out of project-layout.ts
    ├── kord-rules.md
    └── project-mode.md.template  (dynamic content, kept as template)
```

### 4.3 Export Profiles

The `bunx kord-aios extract` command should support named profiles:

| Profile | Categories Included | Target |
|---|---|---|
| `--agents` | T2 agents (12 .md files) | `.opencode/agents/` |
| `--skills` | All 149 skills (144 SKILL.md + 5 converted) | `.opencode/skills/{name}/SKILL.md` |
| `--squads` | Squad seeds (SQUAD.yaml) | `.opencode/squads/{name}/` |
| `--commands` | Commands (15 .md files) | `.opencode/commands/` |
| `--workflows` | All workflow YAML (14 files) | `.kord/workflows/` |
| `--templates` | Templates (7 .md files) | `.kord/templates/` |
| `--checklists` | Checklists (7 .md files) | `.kord/templates/` (alongside templates) |
| `--guides` | Guides (2+ .md files) | `.kord/guides/` |
| `--standards` | Standards (4 .md files) | `.kord/standards/` |
| `--methodology` | agents + skills + squads | All three targets |
| `--project` (default) | All extractable categories | Project-local targets |
| `--global` | All extractable categories | `~/.config/opencode/` + `~/.config/opencode/kord/` |

Skills export **must** preserve domain subdirectory:
- Current: `skills/spec-gather-requirements/SKILL.md`  
- Target: `skills/analysis/spec-gather-requirements/SKILL.md`

### 4.4 Override Rules (Canonical Priority Chain)

Extend the existing loader priority to cover all content categories:

| Category | Priority (highest → lowest) |
|---|---|
| Skills | `.opencode/skills/` > `~/.config/opencode/skills/` > `.claude/skills/` > **builtin** |
| Agents | `.opencode/agents/` > `~/.config/opencode/agents/` > `.claude/agents/` > **builtin** |
| Squads | `.opencode/squads/` > `~/.config/opencode/squads/` > **builtin seed** |
| Commands | `.opencode/commands/` > `~/.config/opencode/commands/` > `.claude/commands/` > **builtin** |
| Workflows | `.kord/workflows/` > **builtin** |
| Templates | `.kord/templates/` > **builtin** |
| Checklists | `.kord/templates/` (same dir) > **builtin** |
| Guides | `.kord/guides/` > **builtin** |
| Standards | `.kord/standards/` > **builtin** |
| Rules | `.kord/rules/` > **builtin** (note: project-mode.md is dynamic, always scaffolded) |

---

## 5. Corrective Actions (Ordered by Impact)

### Action 1 — Fix the commands export (HIGH / Short 1-4h)

**Problem:** `extract.ts` exports `.ts` source files from `builtin-commands/templates/`. OpenCode expects `.md` command files. This is a silent functional breakage — users who extract commands get TypeScript files they cannot use.

**Fix:**
1. Convert each command template string constant into a standalone `.md` file in `src/features/builtin-commands/` (one per command, content = the template body, with `---` frontmatter for `description`).
2. Update `collectCommandItems()` in `extract.ts` to read `.md` files, not `.ts` files.
3. Keep the TypeScript `commands.ts` as the engine loader — it reads `.md` files at build time via `readFileSync` (same pattern as `prompts.ts` / `kord-aios-loader.ts`).
4. Remove `src/features/builtin-commands/templates/*.ts` (or keep for build-time embedding only, not as the extract source).

### Action 2 — Move workflow YAML files into the engine source (HIGH / Short 1-4h)

**Problem:** Only `greenfield-fullstack.yaml` is in `src/features/builtin-workflows/`. The scaffolder also provides `brownfield-discovery.yaml` (via `BUILTIN_WORKFLOW_YAMLS`), but 12 more workflows live in `.kord/workflows/` on this development project and are never shipped to users.

**Fix:**
1. Audit `.kord/workflows/` (14 files): determine which are production-ready (not dev/experimental).
2. Move confirmed production workflows into `src/features/builtin-workflows/`.
3. Update `scaffolder.ts` to iterate all `BUILTIN_WORKFLOW_YAMLS` instead of hardcoding two IDs.
4. Add `--workflows` to the `extract` command (copies to `.kord/workflows/`).

### Action 3 — Move templates/guides/standards/rules out of project-layout.ts (HIGH / Medium 1-2d)

**Problem:** `src/cli/project-layout.ts` is a 1437-line file of mixed TypeScript plumbing and embedded content strings. Content cannot be diffed, reviewed, or extracted independently.

**Fix:**
1. Create `src/features/builtin-templates/`, `src/features/builtin-guides/`, `src/features/builtin-standards/`, `src/features/builtin-rules/` directories.
2. Move each string constant to a proper `.md` file (e.g., `STORY_TEMPLATE_CONTENT` → `builtin-templates/story.md`).
3. Update `scaffolder.ts` to `readFileSync()` from these source directories at build time — same pattern as `builtin.ts` (workflow engine).
4. Add these four categories to the `extract` command.
5. Keep `project-layout.ts` as a thin re-export of directory/path constants only.

### Action 4 — Preserve domain hierarchy in skills export (MEDIUM / Quick <1h)

**Problem:** `collectSkillItems()` in `extract.ts` flattens all skills:
```typescript
const skillName = basename(dirname(sourcePath))  // loses domain
const destinationPath = join(targetDir, "skills", skillName, "SKILL.md")
```
A user who extracts `spec-gather-requirements` has no indication it belongs to the `analysis` domain.

**Fix:**
```typescript
// Reconstruct domain from path: skills/kord-aios/{domain}/{skillName}/SKILL.md
const kordAiosBase = join(BUILTIN_SKILLS_DIR, "kord-aios")
const relativePath = relative(kordAiosBase, sourcePath)
// relativePath = "analysis/spec-gather-requirements/SKILL.md"
const destinationPath = join(targetDir, "skills", relativePath)
```
This preserves `skills/analysis/spec-gather-requirements/SKILL.md` in the user's output.

### Action 5 — Convert hardcoded skills to SKILL.md (MEDIUM / Medium 1-2d)

**Problem:** `git-master.ts` (1107 lines), `frontend-ui-ux.ts`, `dev-browser.ts` are TypeScript constants. Users cannot override them via extract + edit. Only `playwright` and `agent-browser` have a legitimate engine reason (runtime config branching via `browser_automation_engine.provider`).

**Fix:**
1. Convert `git-master`, `frontend-ui-ux`, `dev-browser` into `SKILL.md` files in the appropriate `kord-aios/{domain}/` directory.
2. Keep `playwright.ts` and `agent-browser.ts` as TypeScript (they require runtime branching based on config).
3. The loader already handles SKILL.md discovery — no additional loader changes needed.
4. Remove the three converted `.ts` files and their imports from `skills/index.ts`.

### Action 6 — Fix base-path injection for extracted skills (LOW / Quick <1h)

**Problem:** `kord-aios-loader.ts` injects:
```
Base directory for this skill: {absoluteDistPath}/skills/kord-aios/{domain}/{skillName}/
```
When skills are extracted to `.opencode/skills/`, this path points to the plugin's dist directory, not the user's local copy. The path injection is silently incorrect for any skill using `@path` file references after extraction.

**Fix:**
- Keep the base-path injection for builtin loading (it is correct for plugin-served skills).
- When the skill is loaded from a user directory (via `opencode-skill-loader`), inject the actual on-disk skill directory path instead. The `loadSkillFromPath()` function in `loader.ts` already receives `resolvedPath`; pass it through to the template wrapper.

---

## 6. Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **project-layout.ts refactor breaks scaffolding** — reading from files instead of string constants changes timing | High | Medium | Add integration test: scaffold into temp dir, compare output byte-for-byte before and after migration. Run against existing test snapshots. |
| **Skills domain-preserving export breaks existing user overrides** — users with flat `.opencode/skills/spec-gather-requirements/` lose their override | Medium | Low | Loader already supports both flat and domain-prefixed lookups; add flat fallback. Document migration. Provide `--flat` flag to preserve old behavior. |
| **Command .ts → .md migration loses TypeScript-specific features** (dynamic interpolation, imports) | Medium | Medium | Audit each command template. Most are plain text. Those with dynamic content use `$ARGUMENTS`, `$SESSION_ID`, `$TIMESTAMP` (OpenCode-native placeholders). No actual TypeScript logic in the bodies. |
| **Workflow promotion (13 new)** — workflows in .kord/ may be dev-quality, not production-ready | High | Medium | Gate behind explicit audit: Planner reviews each, marks PRODUCTION / EXPERIMENTAL. Only PRODUCTION goes into `src/features/builtin-workflows/`. |
| **git-master.ts SKILL.md conversion** — 1107-line skill has complex structure | Medium | Low | Convert mechanically: strip the TypeScript wrapper (`export const GIT_MASTER_SKILL = ...`), add SKILL.md frontmatter, move to `kord-aios/utilities/git-master/SKILL.md`. No content changes. |
| **Break in `builtin-commands` engine loading** — after .ts→.md conversion, commands.ts must read .md at build time | Low | Low | Mirror the exact pattern used by `kord-aios-loader.ts` + `prompts.ts`. Both already do `readFileSync` on .md at module load time. |

---

## 7. Non-Goals

- Porting Synkra's `.aios-core/` directory structure wholesale (Kord uses `.kord/` convention).
- Changing the T0 agent protection boundary (kord, dev, builder, planner remain compiled).
- Altering hook or tool infrastructure.
- Introducing new runtime content discovery paths beyond what OpenCode already supports.

---

## 8. Migration Story Map (Self-Contained Stories)

Each story below is executable by a stateless Dev agent:

| Story | Scope | Effort |
|---|---|---|
| **S1**: Fix commands export — convert `.ts` templates to `.md`, update `extract.ts` | `builtin-commands/` + `extract.ts` | Short |
| **S2**: Audit + promote workflows — move production-ready YAMLs to `builtin-workflows/`, update scaffolder to iterate all | `builtin-workflows/` + `scaffolder.ts` | Short |
| **S3**: Create `builtin-templates/` dir, move template string literals from `project-layout.ts`, update scaffolder + extract | `builtin-templates/` + `project-layout.ts` + `scaffolder.ts` + `extract.ts` | Medium |
| **S4**: Create `builtin-guides/` + `builtin-standards/` dirs, migrate guides/standards from `project-layout.ts`, update scaffolder + extract | Same pattern as S3 | Short |
| **S5**: Create `builtin-rules/` dir, migrate `kord-rules.md` static content; keep `project-mode.md` as a template with placeholder substitution | `builtin-rules/` + `project-layout.ts` + `scaffolder.ts` | Short |
| **S6**: Preserve domain hierarchy in skills export (`collectSkillItems` fix in `extract.ts`) | `extract.ts` | Quick |
| **S7**: Convert `git-master.ts`, `frontend-ui-ux.ts`, `dev-browser.ts` to SKILL.md | `builtin-skills/skills/` + `kord-aios/{domain}/` | Medium |
| **S8**: Fix base-path injection for extracted skills in `opencode-skill-loader` | `loader.ts` | Quick |

**Recommended wave sequence:**  
Wave 1 (correctness fixes): S1 (broken extract), S6 (hierarchy loss), S8 (base-path)  
Wave 2 (content liberation): S3, S4, S5 (project-layout.ts decomposition)  
Wave 3 (completeness): S2 (workflows), S7 (hardcoded skills)
